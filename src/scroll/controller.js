// The ONE scroll owner (F3, 2026-11-12). scrollY → (scene, p) for every scene, from the budget in budget.js.
// Scenes never listen to scroll, wheel or resize themselves; they get init / enter / update / exit / resize / tick.
//
// Mechanics
//   anime.js onScroll (one ScrollObserver on the document) tells us scroll moved; we then read scrollY and map it.
//   CSS sticky does the pinning: a pinned block's section is Σlen + 100vh tall, its .sticky child is one viewport.
//
// Ranges (px of scrollY), measured from the DOM after every layout:
//   pinned scene  a = blockTop + Σ(previous lens in block), b = a + len
//                 live while a <= y < b; the block's first scene is also live while its stage slides in
//                 (from blockTop − vh), the last while it slides out (to b + vh).
//   flow scene    a = top − vh (its top meets the viewport bottom), b = top + height − vh (its bottom meets the
//                 viewport bottom); live from a until it has left through the top (top + height).
//   p = clamp((y − a) / (b − a), 0, 1). Same y → same p, whichever way you came (determinism rule, spec §3).
//   Boundaries are half-open: at the exact end of S3, S3 has exited and S3.5 is live at p 0.
import { onScroll, createTimer, animate } from 'animejs';
import { ALIAS } from './budget.js';
import { fitCanvas } from '../lib/dom.js';
import { createHud } from './hud.js';

export const MIN_W = 1280, MIN_H = 720;   // desktop gate (CLAUDE.md: minimum viewport 1280×720)

// stage layer stacks. The prologue is one fixed canvas stack shared by S0–S4 (spec §7 "Persistent layers").
const STAGE_LAYERS = {
  prologue: [['back', 'canvas'], ['text', 'div'], ['swarm', 'canvas'], ['annot', 'div']],
};
// the layer a stage's scene roots are mounted in (default: the stage itself)
const ROOT_LAYER = { prologue: 'annot' };

const SCROLL_KEYS = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ', 'Spacebar']);

export function createController({ budget, scenes, mount, shared = {}, params = new URLSearchParams() }) {
  const debug = params.has('debug'), tracing = debug || params.has('trace'), still = params.has('still');
  const html = document.documentElement;
  const clock = { t: 0, still };
  const S = budget.map((def, i) => ({ def, scene: scenes[i], i, a: 0, b: 1, liveA: 0, liveB: 0, p: 0, live: false, root: null, ctx: null }));
  const byId = Object.fromEntries(S.map(s => [s.def.id, s]));
  const blocks = [], stages = {};
  let lastY = 0, dir = 'down', cur = null, locked = false, lockTimer = 0, gated = false, observer = null, hud = null;
  const trace = [];

  /* ── DOM: one section per block (pinned) or per flow scene ── */
  function build() {
    let prev = null;
    for (const s of S) {
      const { def } = s;
      if (def.block) {
        let blk = prev && prev.name === def.block ? prev : null;
        if (!blk) {
          const section = el('section', 'block block-pinned'); section.dataset.block = def.block;
          const sticky = el('div', 'sticky'); section.append(sticky); mount.append(section);
          blk = { name: def.block, section, sticky, scenes: [] }; blocks.push(blk);
        }
        const key = def.block + '/' + def.stage;
        let st = stages[key];
        if (!st) {
          const stage = el('div', 'stage'); stage.dataset.stage = def.stage; stage.hidden = true; blk.sticky.append(stage);
          const layers = {};
          for (const [name, tag] of STAGE_LAYERS[def.stage] || []) {
            const node = el(tag, 'layer layer-' + name); stage.append(node);
            layers[name] = tag === 'canvas' ? { canvas: node, ctx: node.getContext('2d') } : node;
          }
          st = stages[key] = { key, stage, layers, host: layers[ROOT_LAYER[def.stage]] || stage, scenes: [] };
        }
        s.root = el('div', 'scene'); s.root.dataset.scene = def.id; s.root.hidden = true; st.host.append(s.root);
        s.block = blk; s.stage = st; blk.scenes.push(s); st.scenes.push(s);
        prev = blk;
      } else {
        s.root = el('section', 'scene scene-flow'); s.root.dataset.scene = def.id; mount.append(s.root);
        s.block = null; s.stage = null; prev = null;
      }
      s.ctx = {
        def, root: s.root, stage: s.stage?.stage ?? s.root, layers: s.stage?.layers ?? {},
        viewport: { w: innerWidth, h: innerHeight }, clock, params, debug,
        controller: api, ...shared,
      };
    }
  }
  const el = (tag, cls) => { const n = document.createElement(tag); n.className = cls; return n; };

  /* ── layout: heights from the budget, then measure ranges ── */
  function layout() {
    const vh = innerHeight, vw = innerWidth;
    for (const b of blocks) {
      const sum = b.scenes.reduce((t, s) => t + s.def.len, 0);
      b.section.style.height = (sum / 100 * vh + vh) + 'px';
      b.sticky.style.height = vh + 'px';
    }
    for (const s of S) if (!s.def.block && s.def.len !== 'auto') s.root.style.height = (s.def.len / 100 * vh) + 'px';
    for (const st of Object.values(stages)) for (const v of Object.values(st.layers)) if (v.canvas) v.ctx = fitCanvas(v.canvas, vw, vh);
    for (const s of S) { s.ctx.viewport = { w: vw, h: vh }; call(s, 'resize', vw, vh); }
    measure();
  }
  function measure() {
    const vh = innerHeight, top = n => n.getBoundingClientRect().top + scrollY;
    for (const b of blocks) {
      let acc = top(b.section);
      const t0 = acc;
      b.scenes.forEach((s, k) => {
        s.a = acc; s.b = acc + s.def.len / 100 * vh; acc = s.b;
        s.liveA = k === 0 ? t0 - vh : s.a;
        s.liveB = k === b.scenes.length - 1 ? s.b + vh : s.b;
      });
    }
    for (const s of S) if (!s.def.block) {
      const t = top(s.root), h = s.root.offsetHeight;
      s.a = t - vh; s.b = t + h - vh; s.liveA = s.a; s.liveB = t + h;
      if (s.b <= s.a) s.b = s.a + 1;
    }
    observer?.refresh();
  }

  /* ── the mapping: called on every scroll update, seek and resize ── */
  function refresh(force = false) {
    if (gated) return;
    const y = scrollY;
    if (y > lastY) dir = 'down'; else if (y < lastY) dir = 'up';
    lastY = y;
    const maxY = html.scrollHeight - innerHeight;
    const next = S.filter(s => s.liveA <= y && (y < s.liveB || (y >= maxY && s === S.at(-1))));
    // pinned scene roots are hidden while not live; flow roots ARE page sections, so they always keep their height
    for (const s of S) if (s.live && !next.includes(s)) { s.live = false; call(s, 'exit', dir); if (s.block) s.root.hidden = true; log('exit', s); }
    for (const st of Object.values(stages)) st.stage.hidden = !st.scenes.some(s => next.includes(s));
    for (const s of next) {
      const p = Math.min(1, Math.max(0, (y - s.a) / (s.b - s.a)));
      const entering = !s.live;
      if (entering) { s.live = true; if (s.block) s.root.hidden = false; s.p = p; call(s, 'enter', dir); log('enter', s); }
      if (entering || force || p !== s.p) { s.p = p; call(s, 'update', p); }
    }
    // current = the live scene whose own range holds y (latest wins); else the latest live one
    cur = [...next].reverse().find(s => s.a <= y && y < s.b) || next.at(-1) || null;
    if (tracing) { trace.push({ y, dir, live: next.map(s => [s.def.id, s.p]) }); if (trace.length > 50000) trace.splice(0, 10000); }
    hud?.update(state());
  }

  function call(s, fn, ...args) {
    const f = s.scene[fn];
    if (!f) return;
    try { return f.apply(s.scene, args); } catch (e) { console.error(`[v3] ${s.def.id}.${fn}()`, e); }
  }
  function log(what, s) { if (debug) console.log(`[v3] ${what} ${s.def.id} ${dir} p=${s.p.toFixed(3)} y=${Math.round(lastY)}`); }

  /* ── public API ── */
  function resolve(id) { const s = byId[ALIAS[id] || id]; if (!s) throw new Error(`[v3] unknown scene ${id}`); return s; }
  // scrollY for (scene, p). p may be 'top' for a flow scene: its top edge at the viewport top.
  // p 1 of a scene that hands over inside its block (S3 → S3.5) is the next scene's p 0, so yFor stops 1px short:
  // a deep link to S3:1 shows S3's last frame (p ≈ 0.999), not S3.5.
  function yFor(id, p) {
    const s = resolve(id);
    const handsOver = s.block && s !== s.block.scenes.at(-1);
    let y = p === 'top' ? s.a + innerHeight : s.a + Math.min(1, Math.max(0, +p)) * (s.b - s.a);
    if (handsOver && y >= s.b) y = s.b - 1;
    return Math.min(Math.max(0, y), html.scrollHeight - innerHeight);
  }
  // jump (or, with { duration }, glide: S5b scrubber clicks use 800ms inOutCubic) to a scene's p
  function seek(id, p, { duration = 0, ease = 'inOutCubic' } = {}) {
    const y = yFor(id, p);
    if (!duration) { scrollTo(0, y); refresh(true); return Promise.resolve(state()); }
    const o = { y: scrollY };
    return new Promise(res => animate(o, { y, duration, ease, onUpdate: () => scrollTo(0, o.y), onComplete: () => { refresh(true); res(state()); } }));
  }
  function state() {
    return { scene: cur?.def.id ?? null, p: cur?.p ?? 0, y: scrollY, dir, locked, gated, live: S.filter(s => s.live).map(s => ({ id: s.def.id, p: s.p })) };
  }
  // S2 timed sequence (spec S2): block user scrolling for at most maxMs, then unlock automatically
  function lock({ maxMs = 3200 } = {}) {
    if (locked) return;
    locked = true; html.classList.add('is-locked');
    addEventListener('wheel', block, { passive: false }); addEventListener('touchmove', block, { passive: false }); addEventListener('keydown', blockKeys);
    lockTimer = setTimeout(unlock, maxMs);
    if (debug) console.log('[v3] lock');
  }
  function unlock() {
    if (!locked) return;
    locked = false; clearTimeout(lockTimer); html.classList.remove('is-locked');
    removeEventListener('wheel', block); removeEventListener('touchmove', block); removeEventListener('keydown', blockKeys);
    if (debug) console.log('[v3] unlock');
  }
  const block = e => e.preventDefault();
  const blockKeys = e => { if (SCROLL_KEYS.has(e.key) && !e.target.closest?.('input, textarea, [contenteditable]')) e.preventDefault(); };

  /* ── resize (debounced 150ms, spec §8): keep the reader on the same (scene, p) ── */
  let rz = 0;
  function onResize() {
    clearTimeout(rz);
    rz = setTimeout(() => {
      const keep = cur && { id: cur.def.id, p: cur.p };
      if (gate()) return;
      layout();
      if (keep) seek(keep.id, keep.p); else refresh(true);
    }, 150);
  }
  function gate() {
    const g = innerWidth < MIN_W || innerHeight < MIN_H;
    const was = gated; gated = g; html.classList.toggle('gated', g);
    if (was && !g) { layout(); refresh(true); }
    return g;
  }

  /* ── idle clock: one anime timer drives tick(t, dt) for live scenes only (off-screen loops pause) ── */
  function startClock() {
    let last = performance.now(), frames = 0, fpsT = last;
    if (still) { hud?.fps('still'); return; }
    createTimer({
      onUpdate: () => {
        const now = performance.now(), dt = Math.min(0.1, (now - last) / 1000); last = now;
        clock.t += dt;
        if (!gated) for (const s of S) if (s.live && s.scene.tick) call(s, 'tick', clock.t, dt);
        frames++;
        if (now - fpsT >= 500) { hud?.fps(Math.round(frames * 1000 / (now - fpsT))); frames = 0; fpsT = now; }
      },
    });
  }

  async function start() {
    history.scrollRestoration = 'manual';
    build();
    await Promise.all(S.map(s => call(s, 'init', s.ctx)));
    if (debug) hud = createHud(params.get('debug'));
    gate();
    if (!gated) layout();
    lastY = scrollY;
    observer = onScroll({ target: document.body, enter: 'top top', leave: 'bottom bottom', onUpdate: () => refresh() });
    addEventListener('resize', onResize);
    refresh(true);
    startClock();
  }

  const api = { start, seek, yFor, state, lock, unlock, refresh: () => refresh(true), trace, budget, get clock() { return clock; } };
  return api;
}

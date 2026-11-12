// S0 · Hero: the swarm and the glitch word (prologue chat, 2026-11-12). Brief: docs/build/scenes/S0.md.
//
// p 0.00       ~420 roaches roam fast (wander() in swarm time, 45–90 px/s); the title (Protest Revolution, --fs-hero)
//              glitches where a roach stands on a glyph; a quiet "Scroll" cue with animated arrows, bottom-centre
// p 0.02–0.28  EVERY roach leaves its path for a spot on the word (staggered), the cue fades (0.02–0.08)
// p 0.16–0.59  each roach scrubs a short stroke across the letters; the word is wiped where they scrub (pure in p),
//              and whatever is left dissolves 0.44–0.56 (Vali 2026-11-12: "all the roaches remove the word")
// p 0.55–0.97  the roaches dissolve: each shrinks, fades and drifts a little, staggered. S0 p 1 = an empty stage (S1 p 0).
//
// The prologue BACKDROP lives here too (`backdrop`): a vertically periodic halftone tile that scrolls with the reader
// through the whole prologue (Vali 2026-11-12: "scroll from top to bottom"), offset = prologue scroll px × SPEED.
// Every prologue scene calls backdrop.scroll(def, p) in update, so it is pure in p and continuous across handovers.
//
// Layers: backdrop on layers.back; the word on a canvas in layers.text (below the swarm); roaches on layers.swarm;
// the cue and a visually hidden <h1> in the scene root.
import { tok, px, dpr } from '../lib/dom.js';
import { esc } from '../lib/text.js';
import { roach } from '../roach/roach.js';
import { rng } from '../lib/rng.js';
import { hash01, heroCount, heroSize, wander, fleeStep, clamp01, lerp, ease, angDiff, TAU } from '../roach/swarm.js';
import { glitchOn, glitchSlices, drawSlices } from '../lib/glitch.js';

const CSS = new URL('./s00-hero.css', import.meta.url).href;
export const loadCss = href => { if (!document.querySelector(`link[href="${href}"]`)) document.head.insertAdjacentHTML('beforeend', `<link rel="stylesheet" href="${href}">`); };

/* ── the scrolling backdrop (shared by S0–S4) ── */
// A 45° dot screen (row pitch 5 px, dot pitch 10 px ≈ the F2 7 px cell) over value noise that wraps every TILE px in y,
// so one tile repeats seamlessly. Same look as lib/halftone.js (thresholded noise, jittered radius, grain).
const TILE = 1250, SPEED = .5;
export const backdrop = {
  ctx: null, tile: null, w: 0, h: 0, last: NaN, starts: null,
  build(back, w, h, budget) {
    this.ctx = back; this.w = w; this.h = h; this.last = NaN;
    if (budget && !this.starts) {                        // prologue scene id → its start, in vh of prologue scroll
      this.starts = {}; let acc = 0;
      for (const d of budget) if (d.stage === 'prologue') { this.starts[d.id] = acc; acc += d.len; }
    }
    const c = document.createElement('canvas'); c.width = w; c.height = TILE;
    const g = c.getContext('2d'), r = rng(11), ink = tok('--ht-ink'), cell = px('--ht-cell') || 7;
    const GX = 128, GY = 60, grid = Array.from({ length: GX * GY }, r), s = 60 / TILE;   // noise: y wraps at GY cells = TILE px
    const at = (x, y) => grid[((y % GY + GY) % GY) * GX + ((x % GX + GX) % GX)], sm = t => t * t * (3 - 2 * t);
    const noise = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), xf = sm(x - xi), yf = sm(y - yi), a = at(xi, yi), b = at(xi + 1, yi), cc = at(xi, yi + 1), d = at(xi + 1, yi + 1); return a + (b - a) * xf + (cc - a) * yf + (a - b - cc + d) * xf * yf; };
    g.fillStyle = ink;
    for (let j = -1; j <= TILE / 5 + 1; j++) for (let i = -1; i <= w / 10 + 1; i++) {
      const x = i * 10 + (j & 1) * 5, y = j * 5;
      const t = Math.min(1, Math.max(0, noise(x * s, y * s) * 1.15 - .2));
      const jj = ((j % (TILE / 5)) + TILE / 5) % (TILE / 5);   // the same jitter for a dot and its wrapped twin
      const rr = cell * .42 * t * (1 + (hash01(i * 977 + jj, 90) - .5) * .3);
      if (rr < .35) continue;
      g.beginPath(); g.arc(x, y, rr, 0, TAU); g.fill();
      if (y < rr) { g.beginPath(); g.arc(x, y + TILE, rr, 0, TAU); g.fill(); }
      if (y > TILE - rr) { g.beginPath(); g.arc(x, y - TILE, rr, 0, TAU); g.fill(); }
    }
    for (let k = 0; k < w * TILE / 90; k++) { g.globalAlpha = r() * .35; g.fillRect(r() * w, r() * TILE, 1, 1); }
    this.tile = c;
  },
  offset(id, p) { return ((this.starts?.[id] ?? 0) + p * (this.lens?.[id] ?? 0)) / 100 * this.h * SPEED; },
  // draw at a prologue scroll offset (px); only when it changed
  draw(off) {
    if (!this.tile || off === this.last) return;
    this.last = off;
    const g = this.ctx, y0 = -(((off % TILE) + TILE) % TILE);
    g.clearRect(0, 0, this.w, this.h);
    for (let y = y0; y < this.h; y += TILE) g.drawImage(this.tile, 0, y, this.w, TILE);
  },
  scroll(def, p) { (this.lens ||= {})[def.id] = def.len; this.draw(this.offset(def.id, p)); },
};

/* ── the title word ── */
export const heroWord = {
  host: null, cv: null, g: null, src: null, red: null, mask: null, w: 0, h: 0, d: 1, box: null, fs: 0, pts: [],
  mount(layer, title) {
    if (this.host) return;
    this.title = title;
    this.host = document.createElement('div'); this.host.className = 's0-word'; this.host.hidden = true; this.host.setAttribute('aria-hidden', 'true');
    this.cv = document.createElement('canvas'); this.host.append(this.cv); layer.append(this.host);
  },
  // render the clean word (fg) and its red twin offscreen, plus a glyph mask in CSS px and a list of glyph points
  build(w, h) {
    const d = this.d = dpr(); this.w = w; this.h = h;
    this.cv.width = Math.round(w * d); this.cv.height = Math.round(h * d); this.cv.style.width = w + 'px'; this.cv.style.height = h + 'px';
    this.g = this.cv.getContext('2d'); this.g.setTransform(d, 0, 0, d, 0, 0);
    const font = sz => `${sz}px "Protest Revolution"`;
    const m0 = (() => { const c = document.createElement('canvas').getContext('2d'); c.font = font(100); return c.measureText(this.title); })();
    // --fs-hero, shrunk only if the word would pass 80% of the viewport width
    this.fs = Math.min(px('--fs-hero'), 100 * w * .8 / m0.width);
    const cx = w / 2, cy = h / 2 - 10 * h / 900;
    const mk = color => {
      const c = document.createElement('canvas'); c.width = Math.round(w * d); c.height = Math.round(h * d);
      const x = c.getContext('2d'); x.setTransform(d, 0, 0, d, 0, 0);
      x.font = font(this.fs); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = color; x.fillText(this.title, cx, cy);
      return c;
    };
    this.src = mk(tok('--fg')); this.red = mk(tok('--accent'));
    const mc = document.createElement('canvas'), MS = 2; mc.width = Math.ceil(w / MS); mc.height = Math.ceil(h / MS);
    const mx = mc.getContext('2d', { willReadFrequently: true }); mx.scale(1 / MS, 1 / MS);
    mx.font = font(this.fs); mx.textAlign = 'center'; mx.textBaseline = 'middle'; mx.fillText(this.title, cx, cy);
    const data = mx.getImageData(0, 0, mc.width, mc.height).data, cells = new Uint8Array(mc.width * mc.height);
    let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1; const pts = [];
    for (let j = 0; j < mc.height; j++) for (let i = 0; i < mc.width; i++) if (data[(j * mc.width + i) * 4 + 3] > 120) {
      cells[j * mc.width + i] = 1; x0 = Math.min(x0, i); x1 = Math.max(x1, i); y0 = Math.min(y0, j); y1 = Math.max(y1, j);
      if (!(i % 3) && !(j % 3)) pts.push([(i + .5) * MS, (j + .5) * MS]);
    }
    this.mask = { cells, mw: mc.width, mh: mc.height, MS };
    this.box = { x0: x0 * MS, y0: y0 * MS, x1: (x1 + 1) * MS, y1: (y1 + 1) * MS, cx, cy };
    this.pts = pts;
  },
  onGlyph(x, y) {
    const m = this.mask; if (!m) return false;
    const i = (x / m.MS) | 0, j = (y / m.MS) | 0;
    return i >= 0 && j >= 0 && i < m.mw && j < m.mh && m.cells[j * m.mw + i] === 1;
  },
  // draw the word: glitch hits [{ x, y, i, k }] at time t, wiped along `scrubs` [[x0, y0, x1, y1], …] (width bw), alpha a
  draw(a, hits = [], t = 0, scrubs = [], bw = 0) {
    if (!this.g) return;
    const g = this.g, b = this.box;
    this.host.hidden = a <= 0; if (a <= 0) return;
    this.cv.style.opacity = a;
    const m = 64, x0 = Math.max(0, b.x0 - m), y0 = Math.max(0, b.y0 - m), x1 = Math.min(this.w, b.x1 + m), y1 = Math.min(this.h, b.y1 + m), d = this.d;
    g.clearRect(x0, y0, x1 - x0, y1 - y0);
    g.drawImage(this.src, x0 * d, y0 * d, (x1 - x0) * d, (y1 - y0) * d, x0, y0, x1 - x0, y1 - y0);
    const cap = .35 * (b.x1 - b.x0) * (b.y1 - b.y0);   // spec: displaced area ≤ 35% of the word
    let area = 0;
    for (const h of hits) { if (area > cap) break; area += drawSlices(g, this.src, this.red, glitchSlices(h.x, h.y, h.i, t, h.k), this.d); }
    if (scrubs.length) {
      g.save(); g.globalCompositeOperation = 'destination-out'; g.lineCap = 'round'; g.lineWidth = bw; g.strokeStyle = '#000'; g.beginPath();
      for (const [ax, ay, bx, by] of scrubs) { g.moveTo(ax, ay); g.lineTo(bx, by); }
      g.stroke(); g.restore();
    }
  },
  hide() { if (this.host) this.host.hidden = true; },
};

// per-roach exit plan (pure in p): approach a spot on the word, scrub across it, dissolve
const APPROACH = [.02, .12, .16], SCRUB = .22, DISSOLVE = [.55, .30, .12];   // start, stagger, duration
function plan(i) {
  const a0 = APPROACH[0] + APPROACH[1] * hash01(i, 101), a1 = a0 + APPROACH[2], s1 = a1 + SCRUB * (.7 + .6 * hash01(i, 102));
  const d0 = DISSOLVE[0] + DISSOLVE[1] * hash01(i, 103);
  return { a0, a1, s1, d0, d1: d0 + DISSOLVE[2] };
}

export default def => {
  let ctx, W = 0, H = 0, p = 0, cue, title;
  const pose = {}, tgt = [];
  const scene = {
    id: def.id,
    async init(c) {
      ctx = c; loadCss(CSS);
      title = c.data.meta.title;
      await document.fonts.load(`100px "Protest Revolution"`, title);
      heroWord.mount(c.layers.text, title);
      c.root.classList.add('s0');
      if (c.clock.still) c.root.classList.add('is-still');   // freeze the cue's CSS animation for QA shots
      c.root.insertAdjacentHTML('beforeend', `<h1 class="sr-only">${esc(title)}</h1>
        <div class="s0-cue" aria-hidden="true"><span>Scroll</span><span class="ar"><i></i><i></i></span></div>`);
      cue = c.root.querySelector('.s0-cue');
    },
    resize(w, h) {
      W = w; H = h;
      backdrop.build(ctx.layers.back.ctx, w, h, ctx.controller.budget);
      heroWord.build(w, h);
      // each roach's spot on the word and its scrub stroke (word coordinates = screen; the word no longer moves)
      const P = heroWord.pts, b = heroWord.box, bw = heroWord.fs * .13;
      tgt.length = 0;
      for (let i = 0, n = heroCount(w, h); i < n; i++) {
        const q = P[Math.floor(hash01(i, 104) * P.length)] || [b.cx, b.cy];
        // scrub mostly sideways, always toward the inside of the word (no pile-ups at its edges)
        let ang = (hash01(i, 105) < .5 ? 0 : Math.PI) + (hash01(i, 106) - .5) * .9; const len = bw * (2.5 + 3 * hash01(i, 107));
        if (q[0] + Math.cos(ang) * len < b.x0 || q[0] + Math.cos(ang) * len > b.x1) ang = Math.PI - ang;
        if (q[1] + Math.sin(ang) * len < b.y0 || q[1] + Math.sin(ang) * len > b.y1) ang = -ang;
        const ex = Math.min(b.x1, Math.max(b.x0, q[0] + Math.cos(ang) * len)), ey = Math.min(b.y1, Math.max(b.y0, q[1] + Math.sin(ang) * len));
        tgt.push({ x: q[0], y: q[1], ex, ey, ...plan(i) });
      }
      tgt.bw = bw;
    },
    enter() {},
    exit() { heroWord.hide(); ctx.layers.swarm.ctx.clearRect(0, 0, W, H); },
    update(q) { p = q; backdrop.scroll(def, p); render(); },
    tick(t, dt) {
      ctx.swarm.tau += dt;
      if (p < .02) {                                     // cursor flee while the swarm roams freely
        const n = heroCount(W, H), list = ctx.swarm.list;
        for (let i = 0; i < n; i++) { wander(i, ctx.swarm.tau, W, H, pose); fleeStep(list[i], pose.x, pose.y, dt); }
      }
      render();
    },
  };

  function render() {
    const tau = ctx.swarm.tau, g = ctx.layers.swarm.ctx, list = ctx.swarm.list, n = Math.min(tgt.length, heroCount(W, H));
    const ca = 1 - clamp01((p - .02) / .06);
    cue.style.opacity = ca; cue.style.visibility = ca > 0 ? '' : 'hidden';
    g.clearRect(0, 0, W, H);
    const fg = tok('--roach'), bg = tok('--bg'), hits = [], scrubs = [], draw = [];
    for (let i = 0; i < n; i++) {
      const T = tgt[i], b = list[i];
      wander(i, tau, W, H, pose);
      let x = pose.x + b.fx, y = pose.y + b.fy, rot = pose.rot, legs = pose.legs, s = heroSize(i), a = 1;
      const ea = ease.inOutSine(clamp01((p - T.a0) / (T.a1 - T.a0)));
      if (ea > 0) {                                      // walk to the spot on the word
        const to = Math.atan2(T.y - y, T.x - x);
        legs += Math.hypot(T.x - x, T.y - y) * ea / 3;
        x = lerp(x, T.x, ea); y = lerp(y, T.y, ea);
        rot = rot + angDiff(rot, to) * clamp01(ea * 5);
      }
      const es = clamp01((p - T.a1) / (T.s1 - T.a1));
      if (es > 0) {                                      // scrub across the letters; the stroke so far is wiped
        const sx = lerp(T.x, T.ex, es), sy = lerp(T.y, T.ey, es), dir = Math.atan2(T.ey - T.y, T.ex - T.x);
        scrubs.push([T.x, T.y, sx, sy]);
        x = sx + Math.sin(es * 40 + i) * 1.5; y = sy + Math.cos(es * 33 + i) * 1.5;
        rot = dir + Math.sin(es * 30 + i) * .35; legs += es * 40;
      }
      const ed = clamp01((p - T.d0) / (T.d1 - T.d0));
      if (ed > 0) {                                      // dissolve: shrink, fade, drift outward
        const k = ease.inOutSine(ed), out = Math.atan2(y - heroWord.box.cy, x - heroWord.box.cx);
        x += Math.cos(out) * 24 * k; y += Math.sin(out) * 24 * k; s *= 1 - .6 * k; a = 1 - k;
      }
      if (a <= .01) continue;
      if (p < .3 && heroWord.onGlyph(x, y) && glitchOn(i, tau)) hits.push({ x, y, i, k: Math.min(1, s / 6) });
      draw.push([x, y, rot, s, legs, a, p < .02 && heroWord.onGlyph(x, y)]);
    }
    // while roaming, a roach on a letter is cut into it (v2 hero); once they head for the word every roach gets a dark
    // rim so it reads on white letters and on the dark stage alike
    for (const [x, y, r, s, l, a, cut] of draw) {
      g.globalAlpha = a;
      if (cut) { g.fillStyle = g.strokeStyle = bg; roach(g, x, y, r, s, l); continue; }
      if (p >= .02) { g.fillStyle = g.strokeStyle = bg; roach(g, x, y, r, s + 1.4, l); }
      g.fillStyle = g.strokeStyle = fg; roach(g, x, y, r, s, l);
    }
    g.globalAlpha = 1;
    heroWord.draw(1 - ease.smooth(clamp01((p - .44) / .12)), hits.slice(0, 16), tau, scrubs, tgt.bw);
  }
  return scene;
};

// WATCH · chapter "watched", "Four days, most of the views." (build/hybrid, 2026-11-13). Own pinned block, 260 vh.
// Port of the Gate 0 prototype design/hybrid/watched.js + frames.js watched() (signed off: qa/hybrid/gate0/06a–06d).
//
// The screen: exactly 1,000 halftone dots in the shape of a roach (the verbatim roach() renderer drawn big as a mask).
// One dot = 0.1% of all views in the YouTube clip corpus (data/timeline_clips.json), given to videos by largest
// remainder of their views, so every dot belongs to one video. Scroll runs the calendar (23 May → 21 Jul): a dot lights
// when its video's upload day passes. Before the window (timeline.json `detention`, 18 Jul) the few lit dots are
// scattered at random, grey; from 18 Jul the window's dots light from the centre out, white, and the roach resolves.
//
// p map   0–0.14   title card ([0, .05, .11, .14]); the cell grid, counter and date ticker fade in from 0.11
//         0.14–0.92 the calendar run: the prototype's PRE/WIN ranges on this scene's own 1000 ms timeline,
//                   seeked by the local p (quiet weeks fast, the four days slow)
//         0.92–1   hold: the counter lands on the window's share (93%)
//         captions 0 (the quiet weeks, {{beforePct}}) 0.16–0.55 · 1 (the four days, {{winPct}}) 0.58–1
// Purity: update(p) = tl.seek(local p × 1000) + redraw from the animated state; nothing else decides the frame.
// Interaction (UI only, never changes what p decides): hover a lit dot → its video's card in the right column; that
// video's dots pulse red (anime.js tween in, a breathing ring in tick). Pointer events on the scene root only.
import { createTimeline, stagger, animate } from 'animejs';
import { roach } from '../roach/roach.js';
import { rng } from '../lib/rng.js';
import { esc } from '../lib/text.js';
import { star } from '../lib/star.js';
import { fmtDate } from '../lib/dates.js';
import { halftone } from '../lib/halftone.js';
import { tok, fitCanvas } from '../lib/dom.js';
import { createChapter } from '../lib/chapter.js';
import { buildModel, istDay } from './s07/model.js';
import { load } from '../data/load.js';

const CSS = new URL('./h-watch.css', import.meta.url).href;
const loadCss = href => { if (!document.querySelector(`link[href="${href}"]`)) document.head.insertAdjacentHTML('beforeend', `<link rel="stylesheet" href="${href}">`); };

const TAU = Math.PI * 2, LEN = 1000, N = 1000;
const TITLE = [0, .05, .11, .14], RUN = [.14, .92], FADE = [.11, .16];
const CAPS = [[0, .16, .55], [1, .58, 1]];
// the prototype's budget (PRE 40–400, WIN 440–860 of 1000) stretched over the run; the last day's stagger ends by ~980
const PRE = [0, 430], WIN = [480, 930];
// ticker marks: timeline.json node → short label (prototype copy)
const MARKS = [['start', 'Start'], ['protest', 'Sit-in'], ['wangchuk', 'Fast'], ['detention', 'Wangchuk removed']];
const CORPUS = 'computed from the YouTube clip corpus';

const clamp01 = x => (x < 0 ? 0 : x > 1 ? 1 : x);
const seg = (p, a, b) => clamp01((p - a) / (b - a));
const pct = x => Math.round(x * 100) + '%';
const fmtIN = n => Math.round(n).toLocaleString('en-IN');

export default def => {
  let ctx, m, dots, days, preDays, winDays, from, tl, chapter, srcStar, rangeTxt;
  const el = {}, col = {};
  let W = 0, H = 0, L = null, dirty = true, lastP = 0, ms = 0, hover = null, pulseT = 0;
  const hs = { k: 0 };                                   // hover pulse 0 → 1 (one anime tween for all of a video's dots)
  const clock = { t: 0 };                                // the calendar, as a fraction of the run

  /* ── the model (viewport-independent): dots → videos, the timeline ── */
  function model(clipsFile) {
    m = buildModel(clipsFile, ctx.data.timeline.nodes);
    const clips = clipsFile.clips.filter(c => (c.views || 0) > 0);
    const total = clips.reduce((a, c) => a + c.views, 0);
    // 1,000 dots → videos, largest remainder of views
    const q = clips.map(c => ({ c, f: c.views / total * N }));
    q.forEach(o => { o.n = Math.floor(o.f); o.rem = o.f - o.n; });
    const left = N - q.reduce((a, o) => a + o.n, 0);
    [...q].sort((a, b) => b.rem - a.rem).slice(0, left).forEach(o => o.n++);
    dots = [];
    for (const o of q) for (let i = 0; i < o.n; i++) dots.push({ clip: o.c, day: istDay(o.c.date), r: 0, x: 0, y: 0 });
    dots.sort((a, b) => a.clip.date.localeCompare(b.clip.date));
    for (const d of dots) d.n = q.find(o => o.c === d.clip).n;
    from = m.window.from; days = m.series.map(x => x.d);
    preDays = days.filter(d => d < from); winDays = days.filter(d => d >= from);
    const to = m.window.to;
    rangeTxt = from.slice(0, 7) === to.slice(0, 7) ? `${+from.slice(8)} – ${fmtDate(to)}` : `${fmtDate(from)} – ${fmtDate(to)}`;

    // calendar day → timeline ms (two speeds); each day's dots pop in with a stagger
    const tOf = d => d < from
      ? PRE[0] + (PRE[1] - PRE[0]) * preDays.indexOf(d) / Math.max(1, preDays.length - 1)
      : WIN[0] + (WIN[1] - WIN[0]) * winDays.indexOf(d) / winDays.length;
    const slot = d => (d < from ? (PRE[1] - PRE[0]) / preDays.length : (WIN[1] - WIN[0]) / winDays.length);
    tl = createTimeline({ autoplay: false, defaults: { ease: 'outBack(1.6)', duration: 70 } });
    tl.add({ duration: LEN }, 0);
    clock.t = 0;
    tl.add(clock, { t: [0, 1], duration: WIN[1] - PRE[0], ease: 'linear' }, PRE[0]);
    for (const d of days) {
      const ds = dots.filter(o => o.day === d); if (!ds.length) continue;
      for (const o of ds) o.r = 0;                       // every tweened value starts at its `from`
      tl.add(ds, { r: [0, 1] }, stagger(slot(d) * .8 / ds.length, { start: tOf(d) }));
    }
  }
  const dateAt = t => {
    if (t <= PRE[0]) return days[0];
    if (t < WIN[0]) return preDays[Math.min(preDays.length - 1, Math.floor((t - PRE[0]) / (PRE[1] - PRE[0]) * preDays.length))];
    return winDays[Math.min(winDays.length - 1, Math.floor((t - WIN[0]) / (WIN[1] - WIN[0]) * winDays.length))];
  };

  /* ── layout (per viewport): the mask, the 1,000 cells, places, backdrop, ticker ── */
  function build() {
    dirty = false;
    W = ctx.root.clientWidth || W; H = ctx.root.clientHeight || H;   // the stage, not innerWidth (scrollbar-gutter: stable)
    const k = Math.min(W / 1440, H / 900);
    const colW = 360, colX = W - 24 - colW;
    // the roach's box: left of the right column (prototype: 90, 120, W − 560, H − 230 at k)
    const box = { x: 90 * k, y: 120 * k, w: Math.min(W - 560 * k, colX - 40 - 90 * k), h: H - 230 * k };
    ctx.root.style.setProperty('--k', k.toFixed(4));
    // 1. the mask: roach() big, nose up, fitted to the box
    const off = document.createElement('canvas'); off.width = Math.round(box.w); off.height = Math.round(box.h);
    const og = off.getContext('2d', { willReadFrequently: true }); og.fillStyle = og.strokeStyle = '#000';
    const s = Math.min(box.h * .40, box.w * .56);       // roach() body ≈ 1.9 s; legs and feelers reach further
    roach(og, box.w / 2, box.h / 2 + s * .08, -Math.PI / 2, s, .9);
    const A = og.getImageData(0, 0, off.width, off.height).data;
    const inside = (x, y) => { const i = (Math.round(y) * off.width + Math.round(x)) * 4 + 3; return x >= 0 && y >= 0 && x < off.width && y < off.height && A[i] > 128; };
    // 2. a 45° dot screen; pitch searched so the mask holds ≥ 1,000 cells, then trimmed to exactly 1,000 (seeded)
    const cellsAt = P => {
      const out = [], c = Math.SQRT1_2, R = Math.hypot(box.w, box.h);
      for (let u = -R; u < R; u += P) for (let v = -R; v < R; v += P) {
        const x = box.w / 2 + (u - v) * c, y = box.h / 2 + (u + v) * c;
        if (inside(x, y)) out.push({ x: box.x + x, y: box.y + y });
      }
      return out;
    };
    let lo = 3, hi = 40, cells = [];
    for (let i = 0; i < 30; i++) { const P = (lo + hi) / 2, c = cellsAt(P); if (c.length >= N) { lo = P; cells = c; } else hi = P; }
    const r = rng(6);
    while (cells.length > N) cells.splice(Math.floor(r() * cells.length), 1);
    const cx = box.x + box.w / 2, cy = box.y + box.h / 2;
    // 3. places: the quiet weeks scatter at random; the window fills from the centre outwards, in upload order
    const free = cells.map(c => ({ x: c.x, y: c.y }));
    for (const d of dots) if (d.day < from) Object.assign(d, free.splice(Math.floor(r() * free.length), 1)[0]);
    free.sort((a, b) => Math.hypot(a.x - cx, a.y - cy) - Math.hypot(b.x - cx, b.y - cy));
    let j = 0; for (const d of dots) if (d.day >= from) Object.assign(d, free[j++]);
    L = { k, box, cells, P: lo, R0: lo * .44, colX, colW };

    // backdrop + dot canvas
    halftone(fitCanvas(el.back, W, H), W, H, { seed: 11, cell: 7, ink: tok('--ht-ink') });
    el.g = fitCanvas(el.dots, W, H);
    col.cell = 'rgba(250,250,247,.07)'; col.pre = tok('--grey-1'); col.lit = tok('--white'); col.red = tok('--red');

    // the date ticker under the roach: a day axis, the window band in red, four story marks, the running marker
    const tx = box.x, tw = Math.max(200, colX - 40 - tx), x = i => i / (days.length - 1) * tw, wi = days.indexOf(from);
    Object.assign(el.tick.style, { left: tx + 'px', width: tw + 'px', bottom: 36 * k + 'px' });
    const byNode = ctx.data.byId.node;
    el.tick.innerHTML = `<svg width="${tw}" height="44" aria-hidden="true">
      <rect class="win" x="${x(wi)}" y="12" width="${tw - x(wi)}" height="10"/>
      <line class="axis" x1="0" x2="${tw}" y1="17" y2="17"/>
      ${days.map((_, i) => `<line class="day" x1="${x(i)}" x2="${x(i)}" y1="13" y2="21"/>`).join('')}
      ${MARKS.map(([id, l]) => { const i = days.indexOf(byNode[id]?.date); return i < 0 ? '' : `<text x="${x(i)}" y="40" text-anchor="${byNode[id].date === from ? 'end' : 'middle'}">${esc(l)}</text>`; }).join('')}
      <text x="0" y="6">${esc(fmtDate(days[0]))}</text><text x="${tw}" y="6" text-anchor="end">${esc(fmtDate(days.at(-1)))}</text>
      <g class="mark"><line y1="4" y2="30"/></g></svg>`;
    el.mark = el.tick.querySelector('.mark');
    L.tx = x;
    chapter.resize(W);
  }

  /* ── drawing (from the animated state + hover) ── */
  function draw() {
    const g = el.g, { cells, R0 } = L, fa = seg(lastP, FADE[0], FADE[1]);
    g.clearRect(0, 0, W, H);
    if (fa > 0) {
      g.globalAlpha = fa; g.fillStyle = col.cell;
      for (const c of cells) { g.beginPath(); g.arc(c.x, c.y, R0 * .55, 0, TAU); g.fill(); }
      g.globalAlpha = 1;
    }
    const pulse = .78 + .22 * Math.sin(pulseT * 4.2);
    for (const d of dots) {
      if (d.r <= .01) continue;
      const hi = hover && d.clip === hover.clip ? hs.k : 0;
      g.fillStyle = d.day < from ? col.pre : col.lit;
      g.beginPath(); g.arc(d.x, d.y, Math.max(0, R0 * d.r * (1 + hi * .5)), 0, TAU); g.fill();
      if (hi > .01) {
        g.globalAlpha = hi * pulse; g.strokeStyle = col.red; g.lineWidth = 2;
        g.beginPath(); g.arc(d.x, d.y, R0 * (1.7 + .35 * pulse), 0, TAU); g.stroke(); g.globalAlpha = 1;
      }
    }
  }
  function ticker() {
    const hold = lastP >= RUN[1], fa = seg(lastP, FADE[0], FADE[1]);
    const d = dateAt(ms), lit = dots.reduce((a, o) => a + (o.r > .5), 0) / N;
    el.big.style.opacity = el.tick.style.opacity = fa.toFixed(3);
    el.big.style.visibility = el.tick.style.visibility = fa > .001 ? '' : 'hidden';
    el.date.textContent = hold ? rangeTxt : fmtDate(d);
    el.val.textContent = pct(hold ? m.window.viewsShare : lit);
    el.lab.textContent = hold ? 'of all the views, from videos uploaded in those four days' : 'of all the views, from videos uploaded so far';
    el.big.classList.toggle('hold', hold);
    el.mark.setAttribute('transform', `translate(${L.tx(Math.max(0, days.indexOf(hold ? days.at(-1) : d))).toFixed(1)},0)`);
  }

  /* ── hover: nearest lit dot → its video's card; its dots pulse ── */
  function pick(x, y) {
    let best = null, bd = L.R0 * 2.2;
    for (const d of dots) { if (d.r < .5) continue; const dd = Math.hypot(d.x - x, d.y - y); if (dd < bd) { bd = dd; best = d; } }
    return best;
  }
  function card(d) {
    const src = ctx.data.byId.source;
    return `<p class="when">${esc(fmtDate(d.day))} · ${esc(d.clip.channel)}</p><p class="t">${esc(d.clip.title)}</p>
      <p class="meta">${fmtIN(d.clip.views)} views${srcStar} · ${d.n} of the 1,000 dots</p>`;
  }
  function setHover(d) {
    if (d?.clip === hover?.clip) return;
    hover = d; hs.k = 0;
    if (!d) { el.card.hidden = true; draw(); return; }
    el.card.innerHTML = card(d); el.card.hidden = false;
    // right column, under whichever caption is showing (never over the roach)
    const cap = chapter.el.caps.find(e => +e.style.opacity > .5);
    let top = cap ? cap.offsetTop + cap.offsetHeight + 16 : parseFloat(getComputedStyle(chapter.el.caps[0]).top);
    top = Math.min(top, H - 24 - el.card.offsetHeight);
    el.card.style.top = Math.round(top) + 'px';
    animate(hs, { k: [0, 1], duration: 320, ease: 'outQuad', onUpdate: draw });
  }

  return {
    id: def.id,
    async init(c) {
      ctx = c; loadCss(CSS);
      const root = ctx.root; root.classList.add('h-watch');
      model(await load('timeline_clips.json'));
      const src = ctx.data.byId.source;
      srcStar = src.timeline_clips ? star(['timeline_clips'], src, CORPUS) : '<span class="missing">[MISSING: timeline_clips]</span>';
      root.insertAdjacentHTML('beforeend', `
        <canvas class="hw-back" aria-hidden="true"></canvas>
        <canvas class="hw-dots" role="img" aria-label="One thousand dots in the shape of a roach. Each dot is one-thousandth of all the views."></canvas>
        <div class="hw-big"><p class="hy-kick hw-date"></p><p class="hw-pct t-num"><span class="v"></span>${srcStar}</p><p class="hw-lab"></p></div>
        <div class="hw-tick"></div>`);
      Object.assign(el, { back: root.querySelector('.hw-back'), dots: root.querySelector('.hw-dots'), big: root.querySelector('.hw-big'), tick: root.querySelector('.hw-tick') });
      el.date = el.big.querySelector('.hw-date'); el.val = el.big.querySelector('.v'); el.lab = el.big.querySelector('.hw-lab');
      const vars = { beforePct: pct(m.window.before.views / m.total.views), winPct: pct(m.window.viewsShare) };
      chapter = createChapter(root, 'watched', ctx.data, { title: TITLE, caps: CAPS, vars, capClass: 'hw-cap' });
      root.insertAdjacentHTML('beforeend', `<div class="hy-cap hw-card" role="status" hidden></div>`);
      el.card = root.querySelector('.hw-card');
      root.addEventListener('pointermove', e => {
        if (!L) return;
        const b = root.getBoundingClientRect();
        if (e.target.closest?.('.hy-cap, .hw-big, .hy-lock')) return;
        setHover(pick(e.clientX - b.left, e.clientY - b.top));
      });
      root.addEventListener('pointerleave', () => setHover(null));
    },
    enter() { if (dirty && W) build(); },
    update(p) {
      if (dirty) build();
      lastP = p;
      chapter.update(p);
      ms = seg(p, RUN[0], RUN[1]) * LEN;
      tl.seek(ms);
      if (hover && hover.r < .5) { hover = null; el.card.hidden = true; }
      draw(); ticker();
    },
    exit() { setHover(null); },
    resize(w, h) { W = w; H = h; dirty = true; chapter?.resize(w); if (!ctx.root.hidden) build(); },
    tick(t) { pulseT = t; if (hover && L) draw(); },
  };
};

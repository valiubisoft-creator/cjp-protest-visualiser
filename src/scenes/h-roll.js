// ROLL · Why they marched: "Find yourself on the roll." (hybrid build, 2026-11-13). Own pinned block, 380 vh.
// Static target: qa/hybrid/gate0/08-roll-*.png (prototype design/hybrid/frames.js → roll(), ported, not imported).
// p map (one paused anime.js timeline, 1000 ms = p 0 → 1; update(p) seeks it, then redraws from the animated state):
//   0.00–0.14  title card (in, hold, docks to the lockup)
//   0.14–0.34  Pick one: the roll page draws in, 100 entries on a 10 × 10 grid, staggered from the top-left. Caption 0.
//              Click (or Enter/Space) an entry to make it YOU; the pick lives in module state and survives scrolling.
//              No pick by p 0.30 → entry 38 is YOU for the frame (deterministic for QA; not stored).
//   0.34–0.56  The revision: 13 entries struck one after another (red diagonal draws, entry dims, DELETED); the counter
//              climbs 0 → 13 / 100. Caption 1, then the reader's fate in one line under it.
//   0.56–0.82  At scale: the entries shrink away and each multiplies into its block of 9,688 canvas marks (one mark =
//              100,000 voters, 2024 roll); a wave strikes 1,300 of them red. Your mark keeps its red ring. Caption 2.
//   0.82–1.00  The Commission: the marks dim to 40%, caption 3, hold.
// The struck sets (13 entries, 1,300 marks) are seeded and fixed: the pick never changes them. Each entry's own mark
// (the centre of its block) is struck exactly when the entry is, so your fate is the same at both scales.
// Idle (tick only, zero under ?still): a slow pulse on the YOU ring. It never touches what p decides.
// Facts: data/story/voter_roll.json only (vr_removed_130m, vr_denominator_2024, ratio.per_100); the final-roll caveat
// lives in the footer entry, not here.
import { createTimeline, utils, stagger, animate } from 'animejs';
import { createChapter } from '../lib/chapter.js';
import { halftone } from '../lib/halftone.js';
import { fitCanvas, tok } from '../lib/dom.js';
import { rng } from '../lib/rng.js';
import { esc, missing } from '../lib/text.js';
import { star } from '../lib/star.js';

const CSS = new URL('./h-roll.css', import.meta.url).href;
const loadCss = href => { if (!document.querySelector(`link[href="${href}"]`)) document.head.insertAdjacentHTML('beforeend', `<link rel="stylesheet" href="${href}">`); };

// New UI copy (not data; listed for Vali's sign-off)
const COPY = {
  struckYou: 'You were struck off.',
  keptYou: n => `You’re still on it. ${n === 13 ? 'Thirteen' : n} others aren’t.`,
  count: 'struck off',
  you: 'YOU',
  deleted: 'DELETED',
  entryAria: i => `Entry ${i}. Choose this entry as you.`,
};

const N = 100, COLS = 10, DEFAULT_YOU = 37, DEFAULT_AT = .30, UNIT = 1e5;   // entry 38 (index 37); one mark = 100,000
const LIVE = [.14, .565];                // entries are clickable while they are on the page
// timeline (ms): see the p map above
const T = { draw: 145, drawStep: 8, drawDur: 50, strike: 365, strikeStep: 12, line: 26, dimAt: 20, dimDur: 16,
  shrink: 565, shrinkStep: 4, shrinkDur: 50, mult: [585, 705], wave: [700, 805], dim: [820, 860] };
const CAPS = [[0, .17, .335], [1, .355, .555], [2, .58, .815], [3, .84, 1.1]];
const FATE = [.505, .53];               // the fate line fades in once the strikes are done
const COUNT = { in: [.335, .36], swap: [.575, .6] };   // counter in; 13 / 100 → 1,300 / 9,688

const clamp01 = x => (x < 0 ? 0 : x > 1 ? 1 : x);
const seg = (x, a, b) => clamp01((x - a) / (b - a));
const fmt = n => n.toLocaleString('en-IN');

// the module state the reader owns: their pick (null until they click)
let pick = null;

export default def => {
  let ctx, root, el = {}, tl, chapter, st, L = null, lastP = 0, VW = 0, VH = 0, C = {}, shown = { you: -2, fate: null, me: '' };
  let PER = null, NT = null, NS = null, STRUCK = [], isStruck = new Set();

  // ── facts ──
  function facts() {
    const vr = ctx.data.extra?.voter_roll, f = id => vr?.facts?.find(x => x.id === id);
    const rem = f('vr_removed_130m'), den = f('vr_denominator_2024');
    PER = vr?.ratio?.per_100 ?? null;
    NT = den?.value ? Math.round(den.value / UNIT) : null;     // 968,821,926 / 100,000 → 9,688
    NS = rem?.value ? Math.round(rem.value / UNIT) : null;     // 130,000,000 / 100,000 → 1,300
    const r = rng(13), s = new Set();                          // Gate 0's draw: the same 13 entries
    if (PER) while (s.size < PER) s.add(Math.floor(r() * N));
    STRUCK = [...s].sort((a, b) => a - b); isStruck = s;
  }

  // ── DOM ──
  function build() {
    const r = rng(38), src = ctx.data.byId.source;
    let cells = '';
    for (let i = 0; i < N; i++) {
      const b1 = 40 + Math.round(r() * 22), b2 = 22 + Math.round(r() * 20), s = isStruck.has(i);
      cells += `<button type="button" class="rl-e" data-i="${i}" aria-pressed="false" aria-label="${esc(COPY.entryAria(i + 1))}"><span class="rl-z"><span class="rl-in">
        <span class="rl-body"><span class="rl-n">${i + 1}</span><i class="rl-ph"></i><i class="rl-b1" style="width:${b1}%"></i><i class="rl-b2" style="width:${b2}%"></i></span>
        <b class="rl-you">${COPY.you}</b>${s ? `<span class="rl-x"><i></i></span><b class="rl-del">${COPY.deleted}</b>` : ''}
      </span></span></button>`;
    }
    const cStar = star(['repo_aljazeera_1008', 'fpj_0209_9688'], src, 'reported; 2024 roll: ECI said');
    root.insertAdjacentHTML('beforeend', `
      <canvas class="rl-back" aria-hidden="true"></canvas>
      <canvas class="rl-marks" aria-hidden="true"></canvas>
      <div class="rl-grid">${cells}</div>
      <div class="rl-me" aria-hidden="true"><i></i><b>${COPY.you}</b></div>
      <div class="rl-count" aria-live="off">
        <p class="rl-num t-num"><span class="a">0</span><span class="b"> / ${PER ? N : missing('ratio.per_100')}</span></p>
        <p class="rl-num t-num alt"><span class="a">0</span><span class="b"> / ${NT ? fmt(NT) : missing('vr_denominator_2024')}</span></p>
        <p class="rl-lab">${COPY.count}${cStar}</p>
      </div>`);
    chapter = createChapter(root, 'roll', ctx.data, { title: [0, .05, .11, .14], lock: { boxed: false }, caps: CAPS });
    el.back = root.querySelector('.rl-back'); el.marks = root.querySelector('.rl-marks');
    el.grid = root.querySelector('.rl-grid'); el.e = [...root.querySelectorAll('.rl-e')];
    el.in = el.e.map(e => e.querySelector('.rl-in')); el.z = el.e.map(e => e.querySelector('.rl-z'));
    el.me = root.querySelector('.rl-me'); el.count = root.querySelector('.rl-count');
    el.num = [...el.count.querySelectorAll('.rl-num')]; el.numA = el.num.map(n => n.querySelector('.a'));
    el.cap1 = chapter.el.caps[1];
    el.cap1.insertAdjacentHTML('beforeend', '<p class="rl-fate"></p>');   // the line under the caption-1 card
    el.fate = el.cap1.querySelector('.rl-fate');
    el.e.forEach((b, i) => b.addEventListener('click', () => choose(i)));
  }

  function choose(i) {
    pick = i;
    render();
    // time-based UI flourish only (an element and property the timeline never touches)
    animate(el.e[i].querySelector('.rl-body'), { scale: [1.1, 1], duration: 380, ease: 'outBack(2)' });
  }

  // ── the timeline ──
  function timeline() {
    tl = createTimeline({ autoplay: false, defaults: { ease: 'outQuart' } });
    tl.add({ duration: 1000 }, 0);
    // draw in: 100 entries from the top-left (grid stagger)
    utils.set(el.in, { opacity: 0, translateY: 12 });
    tl.add(el.in, { opacity: [0, 1], translateY: [12, 0], duration: T.drawDur, delay: stagger(T.drawStep, { grid: [COLS, N / COLS], from: 'first' }) }, T.draw);
    // strikes: one after another, in reading order
    const S = STRUCK.map(i => el.e[i]);
    const lines = S.map(e => e.querySelector('.rl-x i')), bodies = S.map(e => e.querySelector('.rl-body')), dels = S.map(e => e.querySelector('.rl-del'));
    if (S.length) {
      utils.set(lines, { scaleX: 0 }); utils.set(bodies, { opacity: 1 }); utils.set(dels, { opacity: 0 });
      tl.add(lines, { scaleX: [0, 1], duration: T.line, ease: 'inOutQuad', delay: stagger(T.strikeStep) }, T.strike);
      tl.add(bodies, { opacity: [1, .42], duration: T.dimDur, delay: stagger(T.strikeStep) }, T.strike + T.dimAt);
      tl.add(dels, { opacity: [0, 1], duration: T.dimDur, delay: stagger(T.strikeStep) }, T.strike + T.dimAt);
    }
    // at scale: the entries shrink toward their block centres (the marks bloom out of them on the canvas)
    utils.set(el.z, { scale: 1, opacity: 1 });
    tl.add(el.z, { scale: [1, .16], opacity: [1, 0], duration: T.shrinkDur, ease: 'inQuad', delay: stagger(T.shrinkStep, { grid: [COLS, N / COLS], from: 'first' }) }, T.shrink);
    // canvas state: multiply, the strike wave, the Commission dim
    st = { mult: 0, wave: 0, dim: 1 };
    tl.add(st, { mult: [0, 1], duration: T.mult[1] - T.mult[0], ease: 'linear' }, T.mult[0]);
    tl.add(st, { wave: [0, 1], duration: T.wave[1] - T.wave[0], ease: 'inOutSine' }, T.wave[0]);
    tl.add(st, { dim: [1, .4], duration: T.dim[1] - T.dim[0], ease: 'inOutQuad' }, T.dim[0]);
  }

  // ── layout (per viewport) ──
  function layout(W, H) {
    VW = W; VH = H; C = { grey: tok('--muted'), red: tok('--red') };
    const k = Math.min(W / 1440, H / 900);
    const gx = 120 * k, gy = 160 * k, gw = W - Math.max(520 * k, 432) - gx, gh = H - gy - 60 * k, cw = gw / COLS, ch = gh / (N / COLS);
    root.style.setProperty('--rl-top', gy + 'px');
    root.style.setProperty('--rl-bot', (H - gy - gh) + 'px');
    Object.assign(el.grid.style, { left: gx + 'px', top: gy + 'px', width: gw + 'px', height: gh + 'px' });
    el.grid.style.setProperty('--ch', (ch - 6) + 'px');
    const len = Math.hypot(cw - 6, ch - 6), ang = Math.atan2(ch - 6, cw - 6) * 180 / Math.PI;
    el.grid.style.setProperty('--x-len', len + 'px'); el.grid.style.setProperty('--x-ang', -ang + 'deg');
    el.e.forEach((b, i) => Object.assign(b.style, { left: (i % COLS) * cw + 3 + 'px', top: Math.floor(i / COLS) * ch + 3 + 'px', width: cw - 6 + 'px', height: ch - 6 + 'px' }));
    // backdrop
    halftone(fitCanvas(el.back, W, H), W, H, { seed: 11, cell: 7, ink: tok('--ht-ink') });
    el.g = fitCanvas(el.marks, W, H);
    L = marks(gx, gy, gw, gh, cw, ch);
    shown.me = '';
  }

  // the 9,688 marks: positions, bloom timing, the seeded struck set (fixed), and each entry's own mark
  function marks(gx, gy, gw, gh, cw, ch) {
    if (!NT) return null;
    const cols = Math.round(Math.sqrt(NT * gw / gh)), rows = Math.ceil(NT / cols);
    const pitch = Math.min(gw / cols, gh / rows), ox = gx + (gw - cols * pitch) / 2, oy = gy + (gh - rows * pitch) / 2;
    const x = new Float32Array(NT), y = new Float32Array(NT), start = new Float32Array(NT), ord = new Float32Array(NT);
    const r = rng(1300), maxD = Math.hypot(COLS - 1, N / COLS - 1);
    for (let j = 0; j < NT; j++) {
      const c = j % cols, rr = Math.floor(j / cols);
      x[j] = ox + (c + .5) * pitch; y[j] = oy + (rr + .5) * pitch;
      // its entry block (10 × 10 over the same box) and its distance from that block's centre
      const u = (x[j] - gx) / cw, v = (y[j] - gy) / ch, bc = Math.min(COLS - 1, Math.floor(u)), br = Math.min(9, Math.floor(v));
      const d = Math.min(1, Math.hypot(u - bc - .5, v - br - .5) / .7072);
      start[j] = Math.hypot(bc, br) / maxD * .55 + d * .3;      // block order (top-left first), then outward
      ord[j] = ((x[j] - gx) / gw + (y[j] - gy) / gh) / 2 * .8 + r() * .2;   // the wave: a diagonal sweep, jittered
    }
    // each entry's own mark: the mark nearest its block centre
    const own = Array.from({ length: N }, (_, i) => {
      const cx = gx + (i % COLS + .5) * cw, cy = gy + (Math.floor(i / COLS) + .5) * ch;
      const c = Math.max(0, Math.min(cols - 1, Math.floor((cx - ox) / pitch))), rr = Math.max(0, Math.min(rows - 1, Math.floor((cy - oy) / pitch)));
      return Math.min(NT - 1, rr * cols + c);
    });
    // the struck marks: a seeded draw of NS, then each entry's own mark is struck exactly when the entry is
    const red = new Uint8Array(NT), ownSet = new Set(own), pool = [];
    if (NS) {
      const rs = rng(130), idx = Array.from({ length: NT }, (_, j) => j);
      for (let j = NT - 1; j > 0; j--) { const t = Math.floor(rs() * (j + 1)); [idx[j], idx[t]] = [idx[t], idx[j]]; }
      for (let j = 0; j < NS; j++) red[idx[j]] = 1;
      for (let j = NS; j < NT; j++) if (!ownSet.has(idx[j])) pool.push(idx[j]);   // spare unstruck, not anyone's own
      const spareRed = idx.slice(0, NS).filter(j => !ownSet.has(j));
      own.forEach((j, i) => {
        const want = isStruck.has(i) ? 1 : 0;
        if (red[j] === want) return;
        red[j] = want;
        if (want) red[spareRed.pop()] = 0; else red[pool.pop()] = 1;   // keep the total at exactly NS
      });
    }
    const redIdx = [], greyIdx = [];
    for (let j = 0; j < NT; j++) (red[j] ? redIdx : greyIdx).push(j);
    const redOrd = redIdx.map(j => ord[j]).sort((a, b) => a - b);
    return { cols, rows, pitch, x, y, start, ord, red, redIdx, greyIdx, redOrd, own };
  }

  // ── the frame ──
  const appear = (j, mult) => clamp01((mult - L.start[j]) / .15);
  const youAt = p => (pick ?? (p >= DEFAULT_AT ? DEFAULT_YOU : -1));

  function render() {
    const p = lastP, ms = p * 1000;
    tl.seek(ms);
    chapter.update(p);
    const you = youAt(p);

    // YOU: the ring on the chosen entry
    if (you !== shown.you) {
      el.e.forEach((b, i) => { const on = i === you; b.classList.toggle('you', on); b.setAttribute('aria-pressed', String(on)); });
      shown.you = you;
    }
    if (you >= 0 && isStruck.has(you)) {   // a struck YOU: DELETED takes the label's place as it lands
      const d = el.e[you].querySelector('.rl-del');
      el.e[you].querySelector('.rl-you').style.opacity = String(1 - (+d.style.opacity || 0));
    }
    el.e.forEach((b, i) => { if (i !== you && isStruck.has(i)) b.querySelector('.rl-you').style.opacity = ''; });

    // clickable only while the page is up
    const live = p >= LIVE[0] && p < LIVE[1];
    if (el.grid.inert === live) el.grid.inert = !live;

    // the fate line under caption 1
    const fate = you < 0 ? null : isStruck.has(you);
    if (fate !== shown.fate) {
      el.fate.textContent = fate == null ? '' : fate ? COPY.struckYou : COPY.keptYou(PER);
      el.fate.classList.toggle('struck', !!fate); shown.fate = fate;
    }
    el.fate.style.opacity = (seg(p, ...FATE)).toFixed(3);

    // the counter: 0 → 13 / 100 with the strikes, then 0 → 1,300 / 9,688 with the wave
    const nE = STRUCK.reduce((n, _, k) => n + (ms >= T.strike + k * T.strikeStep + T.line / 2 ? 1 : 0), 0);
    let nM = 0;
    if (L && NS) { const w = st.wave; let lo = 0, hi = L.redOrd.length; while (lo < hi) { const m = (lo + hi) >> 1; if (L.redOrd[m] <= w) lo = m + 1; else hi = m; } nM = st.wave >= 1 ? NS : lo; }
    el.numA[0].textContent = PER ? String(nE) : '–';
    el.numA[1].innerHTML = NS ? fmt(nM) : missing('vr_removed_130m');
    const cIn = seg(p, ...COUNT.in), sw = seg(p, ...COUNT.swap);
    el.count.style.opacity = cIn.toFixed(3); el.count.style.visibility = cIn > .001 ? '' : 'hidden';
    el.num[0].style.opacity = (1 - sw).toFixed(3); el.num[1].style.opacity = sw.toFixed(3);

    draw(you);
  }

  function draw(you) {
    const g = el.g;
    g.clearRect(0, 0, VW, VH);
    const m = st.mult;
    if (!L || m <= 0) { el.me.style.opacity = '0'; el.me.style.visibility = 'hidden'; return; }
    const s0 = L.pitch * .62, wave = st.wave, dim = st.dim;
    const { grey, red } = C;
    g.fillStyle = grey;
    for (const j of L.greyIdx) mark(g, j, m, s0, .5 * dim);
    for (const j of L.redIdx) {   // struck marks are grey until the wave reaches them
      if (wave < L.ord[j]) { g.fillStyle = grey; mark(g, j, m, s0, .5 * dim); }
    }
    g.fillStyle = red;
    for (const j of L.redIdx) {
      const k = wave - L.ord[j];
      if (k < 0) continue;
      const pop = 1 + .9 * (1 - clamp01(k / .08));            // a brief swell as the wave passes
      mark(g, j, m, s0 * pop, dim);
    }
    // your mark: a DOM ring (so the idle pulse needs no canvas redraw)
    const j = you >= 0 ? L.own[you] : -1, a = j >= 0 ? appear(j, m) : 0;
    const key = `${j}|${L.pitch}`;
    if (key !== shown.me && j >= 0) {
      const sz = Math.max(12, L.pitch * 2.6);
      Object.assign(el.me.style, { left: L.x[j] - sz / 2 + 'px', top: L.y[j] - sz / 2 + 'px', width: sz + 'px', height: sz + 'px' });
      shown.me = key;
    }
    el.me.style.opacity = a.toFixed(3); el.me.style.visibility = a > .001 ? '' : 'hidden';
  }

  function mark(g, j, m, s, alpha) {
    const a = appear(j, m);
    if (a <= 0) return;
    const z = s * (.35 + .65 * a);
    g.globalAlpha = alpha * a;
    g.fillRect(L.x[j] - z / 2, L.y[j] - z / 2, z, z);
  }

  return {
    id: def.id,
    async init(c) {
      ctx = c; root = c.root; loadCss(CSS);
      root.classList.add('rl');
      facts(); build(); timeline();
      layout(c.viewport.w, c.viewport.h);
      await document.fonts.ready;
      chapter.resize(c.viewport.w);
    },
    enter() {},
    update(p) { lastP = p; render(); },
    exit() {},
    resize(w, h) {
      layout(w, h); chapter.resize(w); render();
    },
    // idle: a slow pulse on the YOU ring (entry and mark). t = 0 under ?still → no pulse.
    tick(t) {
      const v = ((t / 1.8) % 1).toFixed(3);
      const you = youAt(lastP);
      if (you >= 0) el.in[you].style.setProperty('--pulse', v);
      el.me.style.setProperty('--pulse', v);
    },
  };
};

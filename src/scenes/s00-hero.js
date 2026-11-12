// S0 · Hero: the swarm and the glitch word (prologue chat, 2026-11-12). Brief: docs/build/scenes/S0.md.
//
// p 0.00       ~420 roaches roam fast (wander() in swarm time, 45–90 px/s); the title (Protest Revolution, --fs-hero)
//              glitches where a roach stands on a glyph; "Scroll" cue on a label, bottom-centre
// p 0.02–0.90  the word is CLEANED AWAY (Vali 2026-11-12): a crew of cleaner roaches sweeps across it band by band, and
//              wherever they have walked the word is wiped (pure in p: the wiped area is each cleaner's path so far).
//              The cue fades as soon as the reader scrolls (p 0.02–0.10).
// p 0.60–1.00  the swarm slows to 70%, thins to 40% and fades to 25%. S1 p 0 continues exactly this picture.
//
// Layers: halftone on layers.back (drawn once per resize, kept by every later prologue scene); the word on a canvas
// in layers.text (below the swarm); roaches on layers.swarm; the cue and a visually hidden <h1> in the scene root.
import { tok, px, dpr } from '../lib/dom.js';
import { halftone } from '../lib/halftone.js';
import { esc } from '../lib/text.js';
import { roach } from '../roach/roach.js';
import { hash01, heroCount, heroSize, wander, fleeStep, clamp01, ease, TAU } from '../roach/swarm.js';
import { glitchOn, glitchSlices, drawSlices } from '../lib/glitch.js';

const CSS = new URL('./s00-hero.css', import.meta.url).href;
export const loadCss = href => { if (!document.querySelector(`link[href="${href}"]`)) document.head.insertAdjacentHTML('beforeend', `<link rel="stylesheet" href="${href}">`); };

// exit curve shared with S1 (S0 p 1 = S1 p 0)
export const heroExit = p => ease.inOutSine(clamp01((p - .6) / .4));
export const heroState = e => ({ scale: 1, lift: 0, alpha: 1, density: 1 - .6 * e, swarmAlpha: 1 - .75 * e, rate: 1 - .3 * e });
// cleaning progress 0…1 over S0 p 0.02–0.90
export const heroClean = p => clamp01((p - .02) / .88);
const CLEAN_BANDS = 7, CLEAN_PER_BAND = 2, CLEAN_D = .62;   // each cleaner crosses the screen in 0.62 of the clean

/* ── the title word, shared by S0 and S1 ── */
export const heroWord = {
  host: null, cv: null, g: null, src: null, red: null, mask: null, w: 0, h: 0, d: 1, box: null, fs: 0,
  mount(layer, title) {
    if (this.host) return;
    this.title = title;
    this.host = document.createElement('div'); this.host.className = 's0-word'; this.host.hidden = true; this.host.setAttribute('aria-hidden', 'true');
    this.cv = document.createElement('canvas'); this.host.append(this.cv); layer.append(this.host);
  },
  // render the clean word (fg) and its red twin offscreen, plus a glyph mask in CSS px
  build(w, h) {
    const d = this.d = dpr(); this.w = w; this.h = h;
    this.cv.width = Math.round(w * d); this.cv.height = Math.round(h * d); this.cv.style.width = w + 'px'; this.cv.style.height = h + 'px';
    this.g = this.cv.getContext('2d'); this.g.setTransform(d, 0, 0, d, 0, 0);
    const font = sz => `${sz}px "Protest Revolution"`;
    const m0 = (() => { const c = document.createElement('canvas').getContext('2d'); c.font = font(100); return c.measureText(this.title); })();
    // --fs-hero (200 px), shrunk only if the word would pass 80% of the viewport width
    this.fs = Math.min(px('--fs-hero'), 100 * w * .8 / m0.width);
    const cx = w / 2, cy = h / 2 - 10 * h / 900;
    const mk = color => {
      const c = document.createElement('canvas'); c.width = Math.round(w * d); c.height = Math.round(h * d);
      const x = c.getContext('2d', { willReadFrequently: color === 'mask' }); x.setTransform(d, 0, 0, d, 0, 0);
      x.font = font(this.fs); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = color === 'mask' ? '#000' : color;
      x.fillText(this.title, cx, cy);
      return c;
    };
    this.src = mk(tok('--fg')); this.red = mk(tok('--accent'));
    // glyph mask at 2 px cells (CSS px), for "is this roach on a letter?"
    const mc = document.createElement('canvas'), MS = 2; mc.width = Math.ceil(w / MS); mc.height = Math.ceil(h / MS);
    const mx = mc.getContext('2d', { willReadFrequently: true }); mx.scale(1 / MS, 1 / MS);
    mx.font = font(this.fs); mx.textAlign = 'center'; mx.textBaseline = 'middle'; mx.fillText(this.title, cx, cy);
    const data = mx.getImageData(0, 0, mc.width, mc.height).data, cells = new Uint8Array(mc.width * mc.height);
    let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
    for (let j = 0; j < mc.height; j++) for (let i = 0; i < mc.width; i++) if (data[(j * mc.width + i) * 4 + 3] > 120) {
      cells[j * mc.width + i] = 1; x0 = Math.min(x0, i); x1 = Math.max(x1, i); y0 = Math.min(y0, j); y1 = Math.max(y1, j);
    }
    this.mask = { cells, mw: mc.width, mh: mc.height, MS };
    this.box = { x0: x0 * MS, y0: y0 * MS, x1: (x1 + 1) * MS, y1: (y1 + 1) * MS, cx, cy };
    // the cleaning crew: CLEAN_BANDS horizontal bands over the word, CLEAN_PER_BAND cleaners each, walking a wavy line
    // edge to edge (alternate bands alternate direction). Brush width covers the band with overlap.
    const b = this.box, bandH = (b.y1 - b.y0 + 16) / CLEAN_BANDS, N = 90;
    this.brush = bandH * .78;
    this.cleaners = [];
    for (let k = 0; k < CLEAN_BANDS; k++) for (let m = 0; m < CLEAN_PER_BAND; m++) {
      const j = this.cleaners.length, dir = (k + m) % 2 ? -1 : 1, yc = b.y0 - 8 + bandH * (k + .5) + (m ? .22 : -.22) * bandH;
      const amp = bandH * (.25 + .3 * hash01(j, 80)), om = TAU / (180 + 160 * hash01(j, 81)), ph = TAU * hash01(j, 82);
      const pts = new Float32Array((N + 1) * 2), xa = dir > 0 ? -40 : w + 40, xb = dir > 0 ? w + 40 : -40;
      for (let q = 0; q <= N; q++) { const x = xa + (xb - xa) * q / N; pts[q * 2] = x; pts[q * 2 + 1] = yc + amp * Math.sin(om * x + ph); }
      // start: bands in the middle go first, then outwards, with a little jitter
      const d0 = (1 - CLEAN_D) * (Math.abs(k - (CLEAN_BANDS - 1) / 2) / ((CLEAN_BANDS - 1) / 2) * .75 + .25 * hash01(j, 83));
      this.cleaners.push({ pts, N, d0, len: Math.abs(xb - xa) });
    }
  },
  // cleaner j at clean progress c: { u (0…1 along its path), x, y, rot, walked (px) }
  cleaner(j, c) {
    const C = this.cleaners[j], u = ease.inOutSine(clamp01((c - C.d0) / CLEAN_D)), f = u * C.N, q = Math.min(C.N - 1, Math.floor(f)), t = f - q, P = C.pts;
    const x = P[q * 2] + (P[q * 2 + 2] - P[q * 2]) * t, y = P[q * 2 + 1] + (P[q * 2 + 3] - P[q * 2 + 1]) * t;
    return { u, x, y, q, rot: Math.atan2(P[q * 2 + 3] - P[q * 2 + 1], P[q * 2 + 2] - P[q * 2]), walked: u * C.len };
  },
  onGlyph(x, y) {
    const m = this.mask; if (!m) return false;
    const i = (x / m.MS) | 0, j = (y / m.MS) | 0;
    return i >= 0 && j >= 0 && i < m.mw && j < m.mh && m.cells[j * m.mw + i] === 1;
  },
  // screen → word coordinates for a given state (the word is scaled about its centre and lifted)
  toWord(x, y, st) {
    const b = this.box; return [b.cx + (x - b.cx) / st.scale, b.cy + (y - b.cy + st.lift * this.h) / st.scale];
  },
  // draw the word with a state and a list of glitch hits [{ x, y, i, k }] in word coordinates at time t
  draw(st, hits = [], t = 0, clean = 0) {
    if (!this.g) return;
    const g = this.g, b = this.box;
    this.host.hidden = st.alpha <= 0;
    this.cv.style.opacity = st.alpha;
    this.cv.style.transformOrigin = `${b.cx}px ${b.cy}px`;
    this.cv.style.transform = `translateY(${-st.lift * this.h}px) scale(${st.scale})`;
    // only the word's box (plus room for slice offsets) is redrawn each frame
    const m = 64, x0 = Math.max(0, b.x0 - m), y0 = Math.max(0, b.y0 - m), x1 = Math.min(this.w, b.x1 + m), y1 = Math.min(this.h, b.y1 + m), d = this.d;
    g.clearRect(x0, y0, x1 - x0, y1 - y0);
    g.drawImage(this.src, x0 * d, y0 * d, (x1 - x0) * d, (y1 - y0) * d, x0, y0, x1 - x0, y1 - y0);
    // spec: cap the displaced area at 35% of the word box so it always reads
    const cap = .35 * (b.x1 - b.x0) * (b.y1 - b.y0);
    let area = 0;
    for (const h of hits) {
      if (area > cap) break;
      area += drawSlices(g, this.src, this.red, glitchSlices(h.x, h.y, h.i, t, h.k), this.d);
    }
    // wipe what the cleaners have walked over (clean progress c)
    if (clean > 0 && this.cleaners) {
      g.save(); g.globalCompositeOperation = 'destination-out'; g.lineCap = g.lineJoin = 'round'; g.lineWidth = this.brush; g.strokeStyle = '#000';
      this.cleaners.forEach((C, j) => {
        const h = this.cleaner(j, clean); if (h.u <= 0) return;
        g.beginPath(); g.moveTo(C.pts[0], C.pts[1]);
        for (let q = 1; q <= h.q; q++) g.lineTo(C.pts[q * 2], C.pts[q * 2 + 1]);
        g.lineTo(h.x, h.y); g.stroke();
      });
      g.restore();
    }
    return area / ((b.x1 - b.x0) * (b.y1 - b.y0));
  },
  hide() { if (this.host) this.host.hidden = true; },
};

export default def => {
  let ctx, W = 0, H = 0, p = 0, cue, title;
  const pose = {};
  const scene = {
    id: def.id,
    async init(c) {
      ctx = c; loadCss(CSS);
      title = c.data.meta.title;
      await document.fonts.load(`100px "Protest Revolution"`, title);
      heroWord.mount(c.layers.text, title);
      c.root.classList.add('s0');
      c.root.insertAdjacentHTML('beforeend', `<h1 class="sr-only">${esc(title)}</h1>
        <div class="s0-cue" aria-hidden="true"><canvas width="56" height="56"></canvas><span>Scroll</span><i></i></div>`);
      cue = c.root.querySelector('.s0-cue');
      const cc = cue.querySelector('canvas').getContext('2d'); cc.scale(2, 2);
      cc.fillStyle = cc.strokeStyle = tok('--bg'); roach(cc, 14, 16, Math.PI / 2, 6.5, 1.2);   // heading down: "this way"
    },
    resize(w, h) {
      W = w; H = h;
      // the prologue backdrop: drawn once per resize, kept by S1–S4 (the canvas was just re-fitted, so it is blank)
      const back = ctx.layers.back;
      back.ctx.clearRect(0, 0, w, h);
      halftone(back.ctx, w, h, { seed: 11, cell: px('--ht-cell') || 7, ink: tok('--ht-ink') });
      heroWord.build(w, h);
    },
    enter() {},
    exit() { heroWord.hide(); ctx.layers.swarm.ctx.clearRect(0, 0, W, H); },
    update(q) { p = q; render(); },
    tick(t, dt) {
      const st = heroState(heroExit(p));
      ctx.swarm.tau += dt * st.rate;
      // cursor flee on the visible roaches (idle motion: offsets only)
      const n = heroCount(W, H), list = ctx.swarm.list;
      for (let i = 0; i < n; i++) { if (hash01(i, 22) >= st.density) continue; wander(i, ctx.swarm.tau, W, H, pose); fleeStep(list[i], pose.x, pose.y, dt); }
      render();
    },
  };

  function render() {
    const e = heroExit(p), st = heroState(e), tau = ctx.swarm.tau, clean = heroClean(p);
    const g = ctx.layers.swarm.ctx, list = ctx.swarm.list, n = heroCount(W, H);
    const ca = 1 - clamp01((p - .02) / .08);
    cue.style.opacity = ca; cue.style.visibility = ca > 0 ? '' : 'hidden';
    g.clearRect(0, 0, W, H);
    const fg = tok('--roach'), bg = tok('--bg'), hits = [], onWord = [];
    g.fillStyle = g.strokeStyle = fg;
    for (let i = 0; i < n; i++) {
      const h = hash01(i, 22);                     // density rank: roach i shows while h < density
      if (h >= st.density) continue;
      const a = clamp01((st.density - h) / .04) * st.swarmAlpha;
      const b = list[i];
      wander(i, tau, W, H, pose);
      const x = pose.x + b.fx, y = pose.y + b.fy, s = heroSize(i);
      const [wx, wy] = heroWord.toWord(x, y, st);
      if (heroWord.onGlyph(wx, wy) && clean < .02) {   // cut-out only while the word is whole
        onWord.push([x, y, pose.rot, s, pose.legs, a]);
        if (glitchOn(i, tau)) hits.push({ x: wx, y: wy, i, k: Math.min(1, s / 6) });
        continue;
      }
      g.globalAlpha = a;
      roach(g, x, y, pose.rot, s, pose.legs);
    }
    // a roach on a stroke reads as a dark shape cut into the letter (v2 hero)
    g.fillStyle = g.strokeStyle = bg;
    for (const [x, y, r, s, l, a] of onWord) { g.globalAlpha = a; roach(g, x, y, r, s, l); }
    g.globalAlpha = 1;
    // the cleaning crew, on top
    if (clean > 0 && clean < 1) {
      g.fillStyle = g.strokeStyle = fg;
      heroWord.cleaners.forEach((C, j) => {
        const h = heroWord.cleaner(j, clean); if (h.u <= 0 || h.u >= 1) return;
        roach(g, h.x, h.y, h.rot + Math.sin(tau * 9 + j) * .12, 7.5, TAU * hash01(j, 84) + h.walked / 3.5);
      });
    }
    heroWord.draw(st, clean < 1 ? hits.slice(0, 16) : [], tau, clean);
    if (clean >= 1) heroWord.hide();
  }
  return scene;
};

// S0 · Hero: the swarm and the glitch word (prologue chat, 2026-11-12). Brief: docs/build/scenes/S0.md.
//
// p 0.00–0.60  hold: ~420 roaches roam (wander() in swarm time), the title glitches where a roach stands on a glyph;
//              scroll cue bottom-centre (fades 0.45–0.60)
// p 0.60–1.00  exit: word 1.0 → 0.8 scale, lifts 12% of the viewport, fades to 25%; swarm slows to 70%, thins to 40%
//              and fades to 25%. S1 p 0 continues exactly this picture (S1 fades the word out over its p 0–0.12).
//
// Layers: halftone on layers.back (drawn once per resize, kept by every later prologue scene); the word on a canvas
// in layers.text (below the swarm); roaches on layers.swarm; the cue and a visually hidden <h1> in the scene root.
// The word canvas is shared with S1 through `heroWord` (S1 shows the faded word at its p 0).
import { tok, px, dpr } from '../lib/dom.js';
import { halftone } from '../lib/halftone.js';
import { esc } from '../lib/text.js';
import { roach } from '../roach/roach.js';
import { hash01, heroCount, heroSize, wander, fleeStep, clamp01, ease } from '../roach/swarm.js';
import { glitchOn, glitchSlices, drawSlices } from '../lib/glitch.js';

const CSS = new URL('./s00-hero.css', import.meta.url).href;
export const loadCss = href => { if (!document.querySelector(`link[href="${href}"]`)) document.head.insertAdjacentHTML('beforeend', `<link rel="stylesheet" href="${href}">`); };

// exit curve shared with S1 (S0 p 1 = S1 p 0)
export const heroExit = p => ease.inOutSine(clamp01((p - .6) / .4));
export const heroState = e => ({ scale: 1 - .2 * e, lift: .12 * e, alpha: 1 - .75 * e, density: 1 - .6 * e, swarmAlpha: 1 - .75 * e, rate: 1 - .3 * e });

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
  draw(st, hits = [], t = 0) {
    if (!this.g) return;
    const g = this.g, b = this.box;
    this.host.hidden = st.alpha <= 0;
    this.cv.style.opacity = st.alpha;
    this.cv.style.transformOrigin = `${b.cx}px ${b.cy}px`;
    this.cv.style.transform = `translateY(${-st.lift * this.h}px) scale(${st.scale})`;
    g.clearRect(0, 0, this.w, this.h);
    g.drawImage(this.src, 0, 0, this.w, this.h);
    // spec: cap the displaced area at 35% of the word box so it always reads
    const cap = .35 * (b.x1 - b.x0) * (b.y1 - b.y0);
    let area = 0;
    for (const h of hits) {
      if (area > cap) break;
      area += drawSlices(g, this.src, this.red, glitchSlices(h.x, h.y, h.i, t, h.k), this.d);
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
        <div class="s0-cue" aria-hidden="true"><canvas width="80" height="48"></canvas><span class="t-micro">scroll</span></div>`);
      cue = c.root.querySelector('.s0-cue');
      const cc = cue.querySelector('canvas').getContext('2d'); cc.scale(2, 2);
      cc.fillStyle = cc.strokeStyle = tok('--muted'); roach(cc, 16, 12, -Math.PI / 2, 6, 1.2);
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
    const e = heroExit(p), st = heroState(e), tau = ctx.swarm.tau;
    const g = ctx.layers.swarm.ctx, list = ctx.swarm.list, n = heroCount(W, H);
    cue.style.opacity = 1 - clamp01((p - .45) / .15);
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
      if (heroWord.onGlyph(wx, wy) && st.alpha > .3) {
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
    heroWord.draw(st, hits.slice(0, 16), tau);
  }
  return scene;
};

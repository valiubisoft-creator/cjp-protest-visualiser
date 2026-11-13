// S2 · Collapse and spawn (prologue chat, 2026-11-12). Brief: docs/build/scenes/S1-S2.md.
//
// The collapse itself is a TIMED sequence (spec §3 exception) started from S1 (click, Enter/Space, or auto at
// S1 p 0.92); see s01-quote.js. It ends on exactly the picture S2 draws at p 0, then S1 seeks to S2 p 0.
// S2 itself is scroll-scrubbed and always shows the DONE state (a deep link straight to S2 sets done):
//   p 0.00–0.70  the founder (s 36, --roach-founder) idles in a slow circle in the lower third; label holds
//   p 0.70–0.85  the label and its lead line fade; p 1 = S3 p 0 (one founder roach, no label)
//
// `spawn` is shared with S1 (its done state shows this same frame above p 0.5) and S3 (the founder's pose).
import { tok, px } from '../lib/dom.js';
import { esc } from '../lib/text.js';
import { star } from '../lib/star.js';
import { roach } from '../roach/roach.js';
import { clamp01, TAU } from '../roach/swarm.js';
import { loadCss, backdrop } from './s00-hero.js';

const ROOT = new URL('../../', import.meta.url); // repo root, so paths work under a subpath too

const CSS = new URL('./s02-spawn.css', import.meta.url).href;

export const spawn = {
  done: false,          // spec S2: set by the sequence; reset by S1 when the reader scrolls back above S1 p 0.5
  tf: 0,                // founder idle time (s): advanced in tick by whichever scene shows the resting founder
  el: null, W: 0, H: 0,
  rot0: -.35, legs0: .8,
  u() { return Math.min(this.W / 1440, this.H / 900); },
  // storyboard ORIGIN (720, 610) at 1440×900: centre, lower third
  spot() { return { x: this.W * .5, y: this.H * 610 / 900 }; },
  size() { return px('--roach-founder') || 36; },
  // the founder's resting pose: a slow circle (radius 10 px) that passes through the spot at tf = 0 heading rot0
  pose(tf = this.tf) {
    const s = this.spot(), R = 10 * this.u(), w = .45, ph0 = this.rot0 - Math.PI / 2;
    const cx = s.x - R * Math.cos(ph0), cy = s.y - R * Math.sin(ph0), ph = ph0 + w * tf;
    return { x: cx + R * Math.cos(ph), y: cy + R * Math.sin(ph), rot: ph + Math.PI / 2, legs: this.legs0 + tf * 3.2 };
  },
  // the portrait (Vali 2026-11-12): a circular photo above-right of the founder, the label centred beneath it, and the
  // photo credit (CC BY 4.0) under that. Photo and credit from the founder's `people[]` entry in timeline.json.
  mount(layer, data) {
    if (this.el) return;
    const f = data.meta.founder, fd = f.founded;
    const person = data.timeline.nodes.flatMap(n => [...(n.people || []), ...(n.sub_beats || []).flatMap(b => b.people || [])]).find(q => q.name === f.name);
    const img = person?.image;
    this.el = document.createElement('figure'); this.el.className = 's2-spawn'; this.el.hidden = true;
    this.el.innerHTML = `${img ? `<img class="s2-face" src="${esc(new URL(img.src, ROOT).href)}" alt="${esc(f.name)}">` : '<span class="s2-face"></span>'}
      <figcaption><p class="s2-label"><b>${esc(f.name)}</b> is spawned${star(fd.source_ids, data.byId.source, fd.claimant)}</p>
      <p class="s2-attr t-micro">${esc(fd.attribution)} · ${esc(fd.value_text)}</p>
      ${img ? `<p class="s2-credit">Photo: ${esc(img.credit)}</p>` : ''}</figcaption>`;
    layer.append(this.el);
  },
  // the portrait's centre and radius (CSS px): centred above the founder; the caption sits under it, then the roach
  face() { const s = this.spot(), u = this.u(); return { x: s.x, y: s.y - 390 * u, r: 70 * u }; },
  layout(w, h) {
    this.W = w; this.H = h;
    const F = this.face(), u = this.u();
    this.el.style.setProperty('--face', 2 * F.r + 'px');
    Object.assign(this.el.style, { left: F.x - 300 * u + 'px', top: F.y - F.r + 'px', width: 600 * u + 'px' });
  },
  // a short vertical lead from under the caption down to the founder
  lead(g, la) {
    if (!this.el || this.el.hidden) return;
    const P = this.pose(), u = this.u(), cap = this.el.getBoundingClientRect();
    const y0 = cap.bottom + 12 * u, y1 = P.y - 34 * u;
    if (y1 <= y0) return;
    g.save(); g.globalAlpha = la; g.strokeStyle = tok('--fg'); g.lineWidth = 1; g.beginPath();
    g.moveTo(this.spot().x, y0); g.lineTo(this.spot().x, y1); g.stroke(); g.restore();
  },
  // the done-state frame: founder at its idle pose, portrait + label + lead line at alpha la. g = the swarm canvas.
  drawDone(g, la = 1) {
    const P = this.pose();
    g.fillStyle = g.strokeStyle = tok('--roach');
    roach(g, P.x, P.y, P.rot, this.size(), P.legs);
    this.label(la);
    if (la > 0) this.lead(g, la);
  },
  label(a) { if (!this.el) return; this.el.hidden = a <= 0; this.el.style.opacity = a; },
  hide() { this.label(0); },
};

export default def => {
  let ctx, W = 0, H = 0, p = 0;
  return {
    id: def.id,
    init(c) { ctx = c; loadCss(CSS); spawn.mount(c.layers.annot, c.data); },
    resize(w, h) { W = w; H = h; spawn.layout(w, h); },
    enter() { spawn.done = true; },          // a deep link (or a fast scroll) past S1 lands on the done state
    exit(dir) { if (dir === 'down') spawn.hide(); ctx.layers.swarm.ctx.clearRect(0, 0, W, H); },
    update(q) { p = q; spawn.done = true; backdrop.scroll(def, p); render(); },
    tick(t, dt) { spawn.tf += dt; render(); },
  };
  function render() {
    const g = ctx.layers.swarm.ctx;
    g.clearRect(0, 0, W, H);
    spawn.drawDone(g, 1 - clamp01((p - .7) / .15));
  }
};

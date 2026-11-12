// S3 · Multiply (prologue chat, 2026-11-12). Brief: docs/build/scenes/S3.md.
//
// n(p) = round(N3^(p/0.85)), N3 = 1000 (Vali 2026-11-12: "more roaches, fill the screen end to end"; spec 380): roach i
// is born at p_i = 0.85 · ln(i + 0.5) / ln N3, from its parent (i − 1) >> 1. A newborn scales in over 0.02 of p, then
// walks out to its home over 0.14 of p (ease out), starting from where its parent is NOW, so scrolling up walks the
// youngest back into their parents and they vanish there (spec S3).
// Homes: N3 evenly spread points covering the WHOLE viewport (R2 low-discrepancy sequence, jittered), sorted by distance
// from the founder's spot, so the swarm grows outward from it until it fills the screen edge to edge at p 0.85.
// The founder (pool 0) leaves its S2 idle circle and shrinks from s 36 to swarm size over p 0–0.3 (Vali 2026-11-12).
// Text (Vali 2026-11-12): how many joined the movement, metrics row "Online sign-ups" (CJP claim), p 0.55–0.94.
// Every pose is a pure function of (p, clock.t): clock.t only adds the standing jitter (idle()).
// `mult.poses(p, t, P)` is exported: S3.5 starts from mult.poses(1, t).
import { tok } from '../lib/dom.js';
import { esc } from '../lib/text.js';
import { star } from '../lib/star.js';
import { roach } from '../roach/roach.js';
import { hash01, idle, clamp01, lerp, ease, angDiff, fleeStep, TAU } from '../roach/swarm.js';
import { spawn } from './s02-spawn.js';
import { loadCss } from './s00-hero.js';

const CSS = new URL('./s03-multiply.css', import.meta.url).href;
export const N3 = 1000;
const LN = Math.log(N3);
// spec S3: first split at p 0.10, full swarm 0.85–1.00 → n(p) = round(N3^(p / 0.85)), so everyone is born, grown and
// home by p 1 (the youngest is born at 0.85 and walks until 0.99): S3 p 1 = S3.5 p 0
const FULL = .85;
export const bornAt = i => i === 0 ? -1 : FULL * Math.log(i + .5) / LN;
export const parentOf = i => (i - 1) >> 1;
export const sizeOf = i => 5 * (1 + (hash01(i, 23) - .5) * .6);
const SCALE_IN = .02, WALK = .14;

export const mult = {
  W: 0, H: 0, homes: null,
  // N3 homes over the whole viewport (margin 12 px), nearest the founder's spot first; home 0 is the spot itself
  layout(w, h) {
    this.W = w; this.H = h;
    const O = { x: w * .5, y: h * 610 / 900 }, m = 12, a1 = .7548776662466927, a2 = .5698402909980532;
    const cell = Math.sqrt((w - 2 * m) * (h - 2 * m) / N3), pts = [];
    for (let k = 1; k < N3; k++) {
      const u = (.5 + a1 * k) % 1, v = (.5 + a2 * k) % 1;
      pts.push([m + u * (w - 2 * m) + (hash01(k, 33) - .5) * cell * .5, m + v * (h - 2 * m) + (hash01(k, 34) - .5) * cell * .5]);
    }
    pts.sort((a, b) => Math.hypot(a[0] - O.x, a[1] - O.y) - Math.hypot(b[0] - O.x, b[1] - O.y));
    this.homes = [[O.x, O.y], ...pts];
  },
  home(i) { return this.homes[i]; },
  // poses of pool 0 … N3−1 at (p, t) into P[i] = { x, y, rot, s, legs, a }. a = 0: not born yet.
  poses(p, t, P, list) {
    for (let i = 0; i < N3; i++) {
      const o = P[i] || (P[i] = {}), j = idle(i, t, 1.6), b = list?.[i], [h0, h1] = this.home(i);
      const hx = h0 + j.dx + (b?.fx || 0), hy = h1 + j.dy + (b?.fy || 0);
      const rest = TAU * hash01(i, 32) + j.dr;
      if (i === 0) {                                     // the founder: idle circle → home, s 36 → swarm size
        const e = ease.inOutSine(clamp01(p / .3)), F = spawn.pose();
        o.x = lerp(F.x, hx, e); o.y = lerp(F.y, hy, e);
        o.rot = F.rot + angDiff(F.rot, rest) * e; o.s = lerp(spawn.size(), sizeOf(0), e); o.legs = F.legs + e * 6; o.a = 1;
        continue;
      }
      const g = p - bornAt(i);
      if (g < 0) { o.a = 0; continue; }
      const par = P[parentOf(i)], k = clamp01(g / SCALE_IN), e = ease.outCubic(clamp01(g / WALK));
      o.x = lerp(par.x, hx, e); o.y = lerp(par.y, hy, e);
      const travel = Math.atan2(hy - par.y, hx - par.x), w = clamp01((e - .75) / .25);
      o.rot = travel + angDiff(travel, rest) * w;
      o.s = sizeOf(i) * (.25 + .75 * k); o.a = k;
      o.legs = b ? b.legs0 + e * Math.hypot(hx - par.x, hy - par.y) / o.s * 1.3 : 0;
    }
    return P;
  },
};

export default def => {
  let ctx, W = 0, H = 0, p = 0, note;
  const P = [];
  return {
    id: def.id,
    init(c) {
      ctx = c; loadCss(CSS);
      const row = c.data.metrics.rows.find(r => r.metric === 'Online sign-ups');
      c.root.classList.add('s3');
      if (row) c.root.innerHTML = `<div class="s3-note"><span class="v t-num">${esc(row.value_text)}${star(row.source_ids, c.data.byId.source, row.claimant)}</span>
        <span class="l">${esc(row.metric)}</span><span class="c t-micro">${esc(row.claimant)} · <span class="st st-${esc(row.status)}">${esc(row.status)}</span></span></div>`;
      note = c.root.querySelector('.s3-note');
    },
    resize(w, h) { W = w; H = h; mult.layout(w, h); },
    enter() {},
    exit() { ctx.layers.swarm.ctx.clearRect(0, 0, W, H); },
    update(q) { p = q; render(); },
    tick(t, dt) {
      if (p < .3) spawn.tf += dt * (1 - p / .3);        // the founder's circle winds down as it leaves it
      // cursor flee (spec S3 0.85–1: "cursor flee on"), eased in so it never yanks a walking newborn
      const k = clamp01((p - .8) / .05), list = ctx.swarm.list;
      for (let i = 0; i < N3; i++) if (P[i]?.a > 0) fleeStep(list[i], P[i].x - (list[i].fx || 0), P[i].y - (list[i].fy || 0), dt, k);
      render();
    },
  };
  function render() {
    if (note) { const a = clamp01((p - .55) / .06) * (1 - clamp01((p - .9) / .06)); note.style.opacity = a; note.style.visibility = a > 0 ? '' : 'hidden'; note.style.transform = `translateY(${(1 - ease.outCubic(clamp01((p - .55) / .06))) * 10}px)`; }
    const g = ctx.layers.swarm.ctx;
    mult.poses(p, ctx.clock.t, P, ctx.swarm.list);
    g.clearRect(0, 0, W, H);
    g.fillStyle = g.strokeStyle = tok('--roach');
    for (let i = N3 - 1; i >= 0; i--) {                  // founder drawn last, on top
      const o = P[i]; if (!(o.a > 0)) continue;
      g.globalAlpha = o.a; roach(g, o.x, o.y, o.rot, o.s, o.legs);
    }
    g.globalAlpha = 1;
  }
};

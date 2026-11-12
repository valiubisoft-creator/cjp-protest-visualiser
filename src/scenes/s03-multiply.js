// S3 · Multiply (prologue chat, 2026-11-12). Brief: docs/build/scenes/S3.md. No text: the swarm is the content.
//
// n(p) = round(N3^p), N3 = 760 (Vali 2026-11-12; spec 380): roach i (pool index) is born at p_i = ln(i + 0.5) / ln N3, from its parent (i − 1) >> 1.
// A newborn scales in over 0.02 of p, then walks out to its home over 0.14 of p (ease out), starting from where its
// parent is NOW, so scrolling up walks the youngest back into their parents and they vanish there (spec S3).
// The founder (pool 0) leaves its S2 idle circle and shrinks from s 36 to swarm size over p 0–0.3 (Vali 2026-11-12).
// Homes fill the viewport around the founder's spot (storyboard prologueSwarm geometry, scaled to the viewport).
// Every pose is a pure function of (p, clock.t): clock.t only adds the standing jitter (idle()).
// `mult.poses(p, t, P)` is exported: S3.5 starts from mult.poses(1, t).
// The homes' spread stays the storyboard's; with 760 the swarm is simply denser.
import { tok } from '../lib/dom.js';
import { roach } from '../roach/roach.js';
import { hash01, idle, clamp01, lerp, ease, angDiff, fleeStep, TAU } from '../roach/swarm.js';
import { spawn } from './s02-spawn.js';

// Vali 2026-11-12 (gate 1): more roaches after the spawn — the swarm grows to 760 (spec: 380), so n(p) = round(760^p)
export const N3 = 760;
const LN = Math.log(N3);
export const bornAt = i => i === 0 ? -1 : Math.log(i + .5) / LN;
export const parentOf = i => (i - 1) >> 1;
export const sizeOf = i => 5 * (1 + (hash01(i, 23) - .5) * .6);
const SCALE_IN = .02, WALK = .14;

export const mult = {
  W: 0, H: 0,
  layout(w, h) { this.W = w; this.H = h; },
  // home of roach i when the swarm holds nf roaches: older ones nearer the founder's spot, the newest at the rim; the
  // whole swarm widens with p until it fills the viewport by ~p 0.85 (storyboard prologueSwarm, scaled)
  home(i, p, nf) {
    const sx = this.W / 1440, sy = this.H / 900, O = { x: 720, y: 610 };
    if (!i) return [O.x * sx, O.y * sy];
    const spread = 520 * (.45 + .55 * ease.inOutSine(clamp01(p / .85)));
    const rad = spread * Math.sqrt(hash01(i, 30)) * (.35 + .65 * Math.sqrt(Math.min(1, i / Math.max(1, nf - 1)))), a = TAU * hash01(i, 31);
    return [Math.min(1410, Math.max(30, O.x + Math.cos(a) * rad * 1.45)) * sx, Math.min(870, Math.max(30, O.y + Math.sin(a) * rad * .95 - rad * .25)) * sy];
  },
  // poses of pool 0 … N3−1 at (p, t) into P[i] = { x, y, rot, s, legs, a }. a = 0: not born yet.
  poses(p, t, P, list) {
    const nf = Math.max(2, Math.pow(N3, p));
    for (let i = 0; i < N3; i++) {
      const o = P[i] || (P[i] = {}), j = idle(i, t, 1.6), b = list?.[i], [h0, h1] = this.home(i, p, nf);
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
  let ctx, W = 0, H = 0, p = 0;
  const P = [];
  return {
    id: def.id,
    init(c) { ctx = c; },
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

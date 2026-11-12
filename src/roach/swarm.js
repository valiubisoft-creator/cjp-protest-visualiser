// Shared swarm state for the prologue (S0 → S4), F3 2026-11-12; swarm model added by the prologue chat (S0–S4b).
// One pool of roach records, so the SAME individuals carry through S0, S1, S3, S3.5 and S4 (spec §7
// "Persistent layers"). Roach i has fixed, seeded traits (k[], rot0, legs0); scenes only write the pose
// (x, y, rot, s, legs, alpha) from p, so a given p always draws the same picture.
//
// Ownership: S0 may extend this module (it sets the swarm's look). S3, S3.5 and S4 may add to it, but must not
// change what earlier scenes rely on. Drawing always goes through the verbatim roach() renderer.
//
// The swarm model (prologue chat, 2026-11-12):
//   wander(i, tau, w, h)   the hero swarm's roaming path: a CLOSED-FORM curve in swarm time tau (drift + two sine
//                          wobbles, wrapped at the screen edges), so a pose is a pure function of tau. Scenes advance
//                          swarm.tau in tick() at their own rate (S0 slows to 70% on exit); ?still keeps tau = 0.
//   idle(i, t, amp)        a small Lissajous jitter for roaches that are "standing" (S3 homes, S3.5 clusters).
//   flee                   cursor flee (spec: 90 px). swarm.pointer is kept up to date by one window listener;
//                          fleeStep() eases a per-roach offset (b.fx, b.fy) in tick(). Offsets are idle motion only:
//                          they never change what p decides and are zero under ?still.
import { rng } from '../lib/rng.js';
import { roach } from './roach.js';

export const TAU = Math.PI * 2;

// stateless per-roach random in [0, 1): same (i, salt) → same value, no stream to keep in step
export function hash01(i, salt = 0) {
  let h = Math.imul(i ^ 0x9E3779B9, 0x85EBCA6B) ^ Math.imul(salt + 0x632BE5AB, 0xC2B2AE35);
  h ^= h >>> 15; h = Math.imul(h, 0x2C1B3C6D); h ^= h >>> 12; h = Math.imul(h, 0x297A2D39); h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

export const clamp01 = v => v < 0 ? 0 : v > 1 ? 1 : v;
export const lerp = (a, b, t) => a + (b - a) * t;
export const ease = {
  inOutSine: t => -(Math.cos(Math.PI * t) - 1) / 2,
  outCubic: t => 1 - (1 - t) ** 3,
  inOutCubic: t => t < .5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2,
  inOutQuart: t => t < .5 ? 8 * t ** 4 : 1 - (-2 * t + 2) ** 4 / 2,
  smooth: t => t * t * (3 - 2 * t),
};
// shortest signed angle from a to b
export const angDiff = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a));

/* ── hero swarm (S0, S1) ── */
// spec S0: ~420 roaches at 1440×900, scaled with viewport area, cap 700
export const heroCount = (w, h) => Math.min(700, Math.round(420 * (w * h) / (1440 * 900)));
// spec S0 size 8–14 px body length ≈ roach() s 4.2–7.4; the swarm token is 5 (F2)
export const heroSize = i => 5 * (1 + (hash01(i, 21) - .5) * .7);

// pose of hero roach i at swarm time tau: drift + two wobbles (curving paths), wrapped round the screen with a margin
export function wander(i, tau, w, h, out = {}) {
  const m = 30;
  // speed 45–90 px/s (spec S0 40–90; Vali 2026-11-12: faster than the first build's 16–42)
  const th = TAU * hash01(i, 10), v = 45 + 45 * hash01(i, 11);
  const a1 = 14 + 30 * hash01(i, 12), w1 = .5 + .8 * hash01(i, 13), p1 = TAU * hash01(i, 14);
  const a2 = 6 + 14 * hash01(i, 15), w2 = 1.2 + 1.4 * hash01(i, 16), p2 = TAU * hash01(i, 17);
  const x = w * hash01(i, 18) + v * Math.cos(th) * tau + a1 * Math.sin(w1 * tau + p1) + a2 * Math.cos(w2 * tau + p2);
  const y = h * hash01(i, 19) + v * Math.sin(th) * tau + a1 * Math.cos(w1 * 1.13 * tau + p1 * .7) + a2 * Math.sin(w2 * tau + p2);
  const dx = v * Math.cos(th) + a1 * w1 * Math.cos(w1 * tau + p1) - a2 * w2 * Math.sin(w2 * tau + p2);
  const dy = v * Math.sin(th) - a1 * w1 * 1.13 * Math.sin(w1 * 1.13 * tau + p1 * .7) + a2 * w2 * Math.cos(w2 * tau + p2);
  const W = w + 2 * m, H = h + 2 * m;
  out.x = ((x + m) % W + W) % W - m;
  out.y = ((y + m) % H + H) % H - m;
  out.rot = Math.atan2(dy, dx);
  out.legs = TAU * hash01(i, 20) + tau * (v + a1 * w1) * .3;    // leg phase ~ distance walked
  return out;
}

// small standing jitter (S3 homes, S3.5 clusters): ±amp px, slow, per-roach phase. Pure in t.
export function idle(i, t, amp = 1.6) {
  const w = .5 + .7 * hash01(i, 40), ph = TAU * hash01(i, 41);
  return { dx: Math.cos(ph + t * w) * amp, dy: Math.sin(ph + t * w * 1.4) * amp, dr: Math.sin(t * w * .6 + ph) * .35 };
}

/* ── cursor flee (spec S0 / S3 0.85–1: radius 90 px) ── */
export const FLEE_R = 90;
const pointer = { x: -1e4, y: -1e4, on: false };
if (typeof window !== 'undefined') {
  addEventListener('pointermove', e => { pointer.x = e.clientX; pointer.y = e.clientY; pointer.on = true; }, { passive: true });
  document.addEventListener('pointerleave', () => { pointer.on = false; });
  addEventListener('blur', () => { pointer.on = false; });
}
// ease roach b's flee offset toward "pushed out of the cursor circle" (or back to 0). x, y = its pose without offset.
export function fleeStep(b, x, y, dt, strength = 1) {
  let tx = 0, ty = 0;
  if (pointer.on && strength > 0) {
    const dx = x + (b.fx || 0) - pointer.x, dy = y + (b.fy || 0) - pointer.y, d = Math.hypot(dx, dy);
    if (d < FLEE_R) { const k = (FLEE_R - d + 18) * strength / (d || 1); tx = (b.fx || 0) + dx * k; ty = (b.fy || 0) + dy * k; }
    else { tx = (b.fx || 0) * .96; ty = (b.fy || 0) * .96; }
  }
  const a = Math.min(1, dt * (pointer.on ? 9 : 3));
  b.fx = (b.fx || 0) + (tx - (b.fx || 0)) * a;
  b.fy = (b.fy || 0) + (ty - (b.fy || 0)) * a;
  if (Math.abs(b.fx) < .05 && Math.abs(b.fy) < .05 && !pointer.on) b.fx = b.fy = 0;
}
export const fleeOff = b => { b.fx = 0; b.fy = 0; };

// capacity: S3.5 ends with 380; S4 tops up to ~1,140 slots with roaches joining from the edges (S4a, lanes 3)
export function createSwarm({ seed = 380, capacity = 1200 } = {}) {
  const r = rng(seed);
  const list = Array.from({ length: capacity }, (_, i) => {
    const k = [r(), r(), r(), r()];
    const rot0 = r() * TAU, legs0 = r() * TAU;
    return { i, k, rot0, legs0, x: 0, y: 0, rot: rot0, s: 5, legs: legs0, alpha: 0, fx: 0, fy: 0 };
  });
  return {
    seed, capacity, list,
    tau: 0,               // hero-swarm time (S0/S1), advanced in tick() at the scene's rate
    pointer,
    // hide every roach (alpha 0); a scene's update(p) then poses the ones it shows
    clear() { for (const b of list) b.alpha = 0; },
    // draw roaches [from, to) that have alpha > 0, in one colour
    draw(ctx, { from = 0, to = capacity, color } = {}) {
      if (color) ctx.fillStyle = ctx.strokeStyle = color;
      for (let i = from; i < to; i++) {
        const b = list[i];
        if (b.alpha <= 0) continue;
        ctx.globalAlpha = b.alpha;
        roach(ctx, b.x, b.y, b.rot, b.s, b.legs);
      }
      ctx.globalAlpha = 1;
    },
  };
}

// Shared swarm state for the prologue (S0 → S4), F3 2026-11-12.
// One pool of roach records, so the SAME individuals carry through S0, S1, S3, S3.5 and S4 (spec §7
// "Persistent layers"). Roach i has fixed, seeded traits (k[], rot0, legs0); scenes only write the pose
// (x, y, rot, s, legs, alpha) from p, so a given p always draws the same picture.
//
// Ownership: S0 may extend this module (it sets the swarm's look). S3, S3.5 and S4 may add to it, but must not
// change what earlier scenes rely on. Drawing always goes through the verbatim roach() renderer.
import { rng } from '../lib/rng.js';
import { roach } from './roach.js';

const TAU = Math.PI * 2;

// stateless per-roach random in [0, 1): same (i, salt) → same value, no stream to keep in step
export function hash01(i, salt = 0) {
  let h = Math.imul(i ^ 0x9E3779B9, 0x85EBCA6B) ^ Math.imul(salt + 0x632BE5AB, 0xC2B2AE35);
  h ^= h >>> 15; h = Math.imul(h, 0x2C1B3C6D); h ^= h >>> 12; h = Math.imul(h, 0x297A2D39); h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

// capacity: S3.5 ends with 380; S4 tops up to ~1,000 slots with roaches joining from the edges (Vali, 2026-11-12)
export function createSwarm({ seed = 380, capacity = 1200 } = {}) {
  const r = rng(seed);
  const list = Array.from({ length: capacity }, (_, i) => {
    const k = [r(), r(), r(), r()];
    const rot0 = r() * TAU, legs0 = r() * TAU;
    return { i, k, rot0, legs0, x: 0, y: 0, rot: rot0, s: 5, legs: legs0, alpha: 0 };
  });
  return {
    seed, capacity, list,
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

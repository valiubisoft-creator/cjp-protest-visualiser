// Glitch slices (S0, prologue chat 2026-11-12). Port of v2's patch-window idea to canvas: a band of the word
// image near a roach is cut out and redrawn shifted sideways, with a red copy split off it (spec S0).
//   band 6–14 px tall within 40 px of the roach · offset ±6–18 px · red split 2–4 px · lifetime 220–380 ms.
// Pure in its inputs: the slices for (roach i, epoch) come from a seeded RNG, so a given time draws the same glitch.
import { rng } from './rng.js';
import { hash01 } from '../roach/swarm.js';

// lifetime (s) and epoch of roach i's glitch at time t: a new set of slices every 220–380 ms
export const glitchLife = i => .22 + .16 * hash01(i, 50);
export const glitchEpoch = (i, t) => Math.floor(t / glitchLife(i) + hash01(i, 51));
// is roach i's glitch "on" in this epoch (about 2 epochs in 3), and how strong (decays over the lifetime)
export function glitchOn(i, t) {
  const e = glitchEpoch(i, t);
  return hash01(i * 7919 + e, 52) < .66;
}

// slices for a hit at (x, y) in the word canvas's CSS px; k scales the offset (roach size)
export function glitchSlices(x, y, i, t, k = 1) {
  const r = rng((i * 104729 + glitchEpoch(i, t) * 7907) >>> 0), out = [];
  const n = r() < .5 ? 1 : 2;
  for (let b = 0; b < n; b++) {
    const h = 6 + r() * 8, w = 60 + r() * 50;
    const cx = x + (r() - .5) * 40, cy = y + (r() - .5) * 40;
    const dx = (r() < .5 ? -1 : 1) * (6 + r() * 12) * k, split = 2 + r() * 2;
    out.push({ x: cx - w / 2, y: cy - h / 2, w, h, dx, split });
  }
  return out;
}

// draw slices onto g (already showing the clean word), taking pixels from the clean (src) and red (red) word canvases.
// Both sources are drawn in CSS px at the same transform as g. Returns the displaced area.
export function drawSlices(g, src, red, slices, dpr) {
  let area = 0;
  for (const s of slices) {
    const sx = s.x * dpr, sy = s.y * dpr, sw = s.w * dpr, sh = s.h * dpr;
    g.clearRect(s.x, s.y, s.w, s.h);
    g.drawImage(red, sx, sy, sw, sh, s.x + s.dx + s.split, s.y, s.w, s.h);
    g.drawImage(src, sx, sy, sw, sh, s.x + s.dx, s.y, s.w, s.h);
    area += s.w * s.h;
  }
  return area;
}

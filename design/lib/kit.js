// F2 design kit: shared helpers for board.html and storyboard.html (static frames, no motion).
// F3: the generic helpers were promoted to src/ (one copy each) and are re-exported here unchanged.
// What stays here: swarm() (design scatter). The base-map helpers moved to src/lib/map.js (S5 chat).
import { roach } from '../../src/roach/roach.js';
import { rng } from '../../src/lib/rng.js';
import { load } from '../../src/data/load.js';
export { roach, rng, load };
export { tok, px, canvasIn } from '../../src/lib/dom.js';
export { missing, esc, showable } from '../../src/lib/text.js';
export { halftone } from '../../src/lib/halftone.js';
export { DAY0, dayN, fmtDate } from '../../src/lib/dates.js';
export { story } from '../../src/data/load.js';

const TAU = Math.PI * 2;

// ── swarm: deterministic scatter of roaches ──
export function swarm(ctx, w, h, { seed = 3, count = 300, size = 5, color = '#0B0B0B', avoid = null, sizeJitter = .35 } = {}) {
  const r = rng(seed); ctx.fillStyle = color; ctx.strokeStyle = color;
  for (let i = 0; i < count; i++) {
    let x, y, k = 0;
    do { x = r() * w; y = r() * h; k++; } while (avoid && avoid(x, y) && k < 20);
    const s = size * (1 + (r() - .5) * 2 * sizeJitter);
    roach(ctx, x, y, r() * TAU, s, r() * TAU);
  }
}

// ── base map: promoted to src/lib/map.js by the S5 chat (2026-11-12), re-exported unchanged ──
export { baseMap, mapSVG, anchorXY, fitSites } from '../../src/lib/map.js';

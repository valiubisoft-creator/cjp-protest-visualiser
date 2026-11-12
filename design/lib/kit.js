// F2 design kit: shared helpers for board.html and storyboard.html (static frames, no motion).
// F3: the generic helpers were promoted to src/ (one copy each) and are re-exported here unchanged.
// What stays here: swarm() (design scatter) and the base-map helpers (S5a takes those over).
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

// ── base map (data/map/base.json) as SVG string inside a camera transform ──
let mapCache;
export async function baseMap() { return mapCache ??= load('map/base.json'); }
const pathD = (p, close) => { let d = ''; for (let i = 0; i < p.length; i += 2) d += (i ? 'L' : 'M') + p[i] + ' ' + p[i + 1]; return d + (close ? 'Z' : ''); };
const ROAD_W = { major: 16, secondary: 12, tertiary: 9, minor: 6, service: 3.5, path: 1.6 };
export async function mapSVG({ w, h, cx = 0, cy = 0, k = 1, fade = null } = {}) {
  const m = await baseMap(), L = m.layers;
  const tx = w / 2 - cx * k, ty = h / 2 - cy * k;
  const roads = c => L.roads.filter(r => !r.tunnel && r.c === c).map(r => pathD(r.p)).join('');
  const order = ['path', 'service', 'minor', 'tertiary', 'secondary', 'major'];
  return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" class="map" aria-hidden="true">
    <rect width="${w}" height="${h}" fill="var(--map-ground)"/>
    <g transform="translate(${tx} ${ty}) scale(${k})">
      <path d="${L.green.map(p => pathD(p, 1)).join('')}" fill="var(--map-green)"/>
      <path d="${L.water.map(p => pathD(p, 1)).join('')}" fill="var(--map-water)"/>
      ${order.map(c => `<path d="${roads(c)}" fill="none" stroke="var(--map-road-casing)" stroke-width="${ROAD_W[c] + 2}" stroke-linecap="round" stroke-linejoin="round"/>`).join('')}
      ${order.map(c => `<path d="${roads(c)}" fill="none" stroke="var(--map-road)" stroke-width="${ROAD_W[c]}" stroke-linecap="round" stroke-linejoin="round"/>`).join('')}
      <path d="${L.buildings.map(p => pathD(p, 1)).join('')}" fill="var(--map-building)" stroke="var(--map-building-stroke)" stroke-width="${0.6 / k}"/>
    </g>
  </svg>`;
}
// project a site anchor into frame px for a given camera
export async function anchorXY(id, { w, h, cx = 0, cy = 0, k = 1 }) {
  const a = (await baseMap()).anchors[id];
  return a ? { x: w / 2 + (a.x - cx) * k, y: h / 2 + (a.y - cy) * k, in: a.in_frame } : null;
}
// camera that fits a list of site ids (auto zoom per story marker, Vali 2026-11-11)
export async function fitSites(ids, { w, h, pad = 80, kMax = 3.2, kSingle = 2.2 }) {
  const A = (await baseMap()).anchors, pts = ids.map(i => A[i]).filter(a => a && a.in_frame);
  if (!pts.length) return { cx: 0, cy: 0, k: 1 };
  if (pts.length === 1) return { cx: pts[0].x, cy: pts[0].y, k: kSingle };
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const k = Math.min(kMax, (w - 2 * pad) / Math.max(1, x1 - x0), (h - 2 * pad) / Math.max(1, y1 - y0));
  return { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, k };
}

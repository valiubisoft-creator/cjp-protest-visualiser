// Base-map helpers (S5 chat, 2026-11-12). mapSVG / anchorXY / fitSites promoted from design/lib/kit.js unchanged
// (kit re-exports them, so board and storyboard keep working); the rest is the S5 canvas renderer and camera.
//
// The base map (data/map/base.json) is already projected: local metres about the protest site, y south (STATUS).
// A camera is { cx, cy, k }: world point (cx, cy) sits at the centre of a w × h frame, k px per metre.
//   screen = (w/2 + (x − cx)·k, h/2 + (y − cy)·k)
import { load } from '../data/load.js';

let mapCache;
export async function baseMap() { return mapCache ??= load('map/base.json'); }
const pathD = (p, close) => { let d = ''; for (let i = 0; i < p.length; i += 2) d += (i ? 'L' : 'M') + p[i] + ' ' + p[i + 1]; return d + (close ? 'Z' : ''); };
export const ROAD_W = { major: 16, secondary: 12, tertiary: 9, minor: 6, service: 3.5, path: 1.6 };
export const ROAD_ORDER = ['path', 'service', 'minor', 'tertiary', 'secondary', 'major'];

/* ── F2 SVG helpers (storyboard, board) ── */
export async function mapSVG({ w, h, cx = 0, cy = 0, k = 1, fade = null } = {}) {
  const m = await baseMap(), L = m.layers;
  const tx = w / 2 - cx * k, ty = h / 2 - cy * k;
  const roads = c => L.roads.filter(r => !r.tunnel && r.c === c).map(r => pathD(r.p)).join('');
  const order = ROAD_ORDER;
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
  return fitCam((await baseMap()).anchors, ids, { w, h, pad, kMax, kSingle });
}

/* ── sync versions (S5: the map is loaded before the first frame) ── */
// pads (optional, S5): { t, r, b, l } per side, for frames whose corners hold UI (HUD, legend); multi-site fits only
export function fitCam(anchors, ids, { w, h, pad = 80, kMax = 3.2, kSingle = 2.2, pads = null }) {
  const pts = ids.map(i => anchors[i]).filter(a => a && a.in_frame);
  if (!pts.length) return { cx: 0, cy: 0, k: 1 };
  if (pts.length === 1) return { cx: pts[0].x, cy: pts[0].y, k: kSingle };
  const P = pads || { t: pad, r: pad, b: pad, l: pad };
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const k = Math.min(kMax, (w - P.l - P.r) / Math.max(1, x1 - x0), (h - P.t - P.b) / Math.max(1, y1 - y0));
  // the padded box's centre sits on the sites' centre
  return { cx: (x0 + x1) / 2 - (P.l - P.r) / 2 / k, cy: (y0 + y1) / 2 - (P.t - P.b) / 2 / k, k };
}
export const project = (cam, w, h, x, y) => ({ x: w / 2 + (x - cam.cx) * cam.k, y: h / 2 + (y - cam.cy) * cam.k });

// van Wijk & Nuij smooth zoom (what d3.interpolateZoom does, rho = √2), hand-rolled (D10: no D3 in S5a).
// Views are [cx, cy, width-in-world-units]; returns t → camera for a frame of width w.
export function interpolateZoom(a, b, w) {
  const rho = Math.SQRT2, rho2 = 2, rho4 = 4, EPS = 1e-12;
  const ux0 = a.cx, uy0 = a.cy, w0 = w / a.k, ux1 = b.cx, uy1 = b.cy, w1 = w / b.k;
  const dx = ux1 - ux0, dy = uy1 - uy0, d2 = dx * dx + dy * dy;
  if (d2 < EPS) {
    const S = Math.log(w1 / w0) / rho;
    return t => ({ cx: ux0 + t * dx, cy: uy0 + t * dy, k: w / (w0 * Math.exp(rho * t * S)) });
  }
  const d1 = Math.sqrt(d2);
  const b0 = (w1 * w1 - w0 * w0 + rho4 * d2) / (2 * w0 * rho2 * d1), b1 = (w1 * w1 - w0 * w0 - rho4 * d2) / (2 * w1 * rho2 * d1);
  const r0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0), r1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1), S = (r1 - r0) / rho;
  const cosh = x => ((x = Math.exp(x)) + 1 / x) / 2, sinh = x => ((x = Math.exp(x)) - 1 / x) / 2, tanh = x => ((x = Math.exp(2 * x)) - 1) / (x + 1);
  return t => {
    const s = t * S, c0 = cosh(r0), u = w0 / (rho2 * d1) * (c0 * tanh(rho * s + r0) - sinh(r0));
    return { cx: ux0 + u * dx, cy: uy0 + u * dy, k: w / (w0 * c0 / cosh(rho * s + r0)) };
  };
}

/* ── canvas renderer: the kit mapSVG look, op for op the same as S4's release map (s04-date.js drawMap) ── */
export function mapPaths(m) {
  const poly = (list, close) => { const P = new Path2D(); for (const p of list) { for (let i = 0; i < p.length; i += 2) i ? P.lineTo(p[i], p[i + 1]) : P.moveTo(p[i], p[i + 1]); if (close) P.closePath(); } return P; };
  const Ly = m.layers;
  const paths = { green: poly(Ly.green, true), water: poly(Ly.water, true), buildings: poly(Ly.buildings, true), roads: {} };
  for (const c of ROAD_ORDER) paths.roads[c] = poly(Ly.roads.filter(r => !r.tunnel && r.c === c).map(r => r.p), false);
  return paths;
}
// colours: { ground, green, water, casing, road, building, buildingStroke } (read from tokens by the caller)
export function drawMap(g, paths, cam, w, h, col) {
  g.fillStyle = col.ground; g.fillRect(0, 0, w, h);
  g.save(); g.translate(w / 2 - cam.cx * cam.k, h / 2 - cam.cy * cam.k); g.scale(cam.k, cam.k);
  g.fillStyle = col.green; g.fill(paths.green);
  g.fillStyle = col.water; g.fill(paths.water);
  g.lineCap = g.lineJoin = 'round';
  g.strokeStyle = col.casing; for (const c of ROAD_ORDER) { g.lineWidth = ROAD_W[c] + 2; g.stroke(paths.roads[c]); }
  g.strokeStyle = col.road; for (const c of ROAD_ORDER) { g.lineWidth = ROAD_W[c]; g.stroke(paths.roads[c]); }
  g.fillStyle = col.building; g.fill(paths.buildings);
  g.strokeStyle = col.buildingStroke; g.lineWidth = .6 / cam.k; g.stroke(paths.buildings);
  g.restore();
}

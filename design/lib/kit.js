// F2 design kit: shared helpers for board.html and storyboard.html (static frames, no motion).
import { roach } from './roach.js';
export { roach };

const TAU = Math.PI * 2;

// ── deterministic RNG (mulberry32) ──
export function rng(seed) {
  let a = seed >>> 0;
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

// ── tokens ──
export const tok = (name, el = document.documentElement) => getComputedStyle(el).getPropertyValue(name).trim();
export const px = (name, el) => parseFloat(tok(name, el));

// ── data ──
const cache = {};
export async function load(name) {
  if (!cache[name]) cache[name] = fetch(`../data/${name}`).then(r => { if (!r.ok) throw new Error(name); return r.json(); });
  return cache[name];
}
export const story = n => load(`story/${n}.json`);
export const missing = key => `<span class="missing">[MISSING: ${key}]</span>`;
export const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// facts usable on screen: not held, not unverified
export const showable = f => f && !f.hold && f.status !== 'unverified';

// ── canvas helpers ──
export function canvasIn(el, w, h) {
  const c = document.createElement('canvas');
  const d = Math.min(devicePixelRatio || 1, 2);
  c.width = w * d; c.height = h * d; c.style.width = w + 'px'; c.style.height = h + 'px';
  const ctx = c.getContext('2d'); ctx.setTransform(d, 0, 0, d, 0, 0);
  el.appendChild(c);
  return ctx;
}

// ── halftone: noise field thresholded into a 45° dot screen, jittered radius (spec §5) ──
function valueNoise(r) {
  const G = 64, g = Array.from({ length: G * G }, r);
  const at = (x, y) => g[((y % G + G) % G) * G + ((x % G + G) % G)];
  const sm = t => t * t * (3 - 2 * t);
  return (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = sm(x - xi), yf = sm(y - yi);
    const a = at(xi, yi), b = at(xi + 1, yi), c = at(xi, yi + 1), d = at(xi + 1, yi + 1);
    return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
  };
}
export function halftone(ctx, w, h, { seed = 7, cell = 7, maxR = 0.42, jitter = 0.15, ink = 'rgba(0,0,0,.075)', scale = 0.006, bias = 0, grain = true } = {}) {
  const r = rng(seed), n = valueNoise(r);
  ctx.save(); ctx.fillStyle = ink;
  const diag = Math.hypot(w, h), cs = Math.SQRT1_2;
  for (let v = -diag; v < diag; v += cell) for (let u = -diag; u < diag; u += cell) {
    const x = (u - v) * cs + w / 2, y = (u + v) * cs + h / 2;   // 45° screen
    if (x < -cell || y < -cell || x > w + cell || y > h + cell) continue;
    const t = Math.min(1, Math.max(0, n(x * scale * 8, y * scale * 8) * 1.15 - 0.2 + bias));
    const rr = cell * maxR * t * (1 + (r() - .5) * 2 * jitter);
    if (rr < .35) continue;
    ctx.beginPath(); ctx.arc(x, y, rr, 0, TAU); ctx.fill();
  }
  if (grain) { for (let i = 0; i < w * h / 90; i++) { ctx.globalAlpha = r() * .35; ctx.fillRect(r() * w, r() * h, 1, 1); } }
  ctx.restore();
}

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

// ── small date helpers ──
export const DAY0 = Date.UTC(2026, 5, 6); // 6 Jun 2026 = day 0 of the street protest (D4)
export const dayN = iso => Math.round((Date.parse(iso + 'T00:00:00Z') - DAY0) / 864e5);
export const fmtDate = iso => new Date(iso + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });

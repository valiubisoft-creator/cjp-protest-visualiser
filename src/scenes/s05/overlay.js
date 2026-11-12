// S5 · the 20 Jul hour-by-hour overlay (S5 chat, Vali 2026-11-12: "special emphasis for the Sansad Chalo march …
// where the police were deployed, their strength, the barricades … approximate visual construction").
//
// Reads each hour beat's `step.map` (data/story/sansad_chalo.json):
//   places      new points { id, name, lat, lon, position }        → projected like the base map (meta.projection)
//   route       [id, …]       the march route: a dashed red arrowed line (approximate)
//   police      [{ at, strength_text, units, position }]           → a cordon of small grey blocks across the street
//   barricades  [{ at | from+to, kind, position }]                 → heavy dashed bars (always "illustrative")
//   incidents   [{ at, kind }]  tear_gas (halftone cloud) · lathi_charge (red burst) · pellets (red crosses) ·
//                               stone_throwing (small triangles) · detention (open brackets) · vehicle_damage · injury (red +)
//   closures    [{ kind: 'metro', ids }]                          → metro stations struck through
// None of these positions comes from a surveyed source: the key says so, and police/barricade glyphs never claim a
// count (strength is the sourced text label, with its *). Pure in p: hold → that step; transition → crossfade.
import { tok } from '../../lib/dom.js';
import { esc } from '../../lib/text.js';
import { star } from '../../lib/star.js';
import { project } from '../../lib/map.js';
import { barricade } from './map.js';
import { clamp01, ease, hash01, TAU } from '../../roach/swarm.js';

// lat/lon → base-map metres (data/map/base.json meta.projection: local equirectangular, y south)
export function projector(meta) {
  const P = meta.projection, R = P.R, la0 = P.origin.lat, lo0 = P.origin.lon, rad = Math.PI / 180;
  return (lat, lon) => ({ x: (lon - lo0) * rad * R * Math.cos(la0 * rad), y: -(lat - la0) * rad * R });
}
// every point an hour beat can name: site anchors + its own places (projected), id → { x, y, in_frame, name }
export function pointsFor(model, base, sites) {
  const pr = projector(base.meta), pts = {};
  for (const [id, a] of Object.entries(base.anchors)) pts[id] = { ...a, name: sites[id]?.name || id };
  for (const b of model.beats) for (const pl of b.step?.map?.places || []) if (pl.lat != null) pts[pl.id] = { ...pr(pl.lat, pl.lon), in_frame: true, name: pl.name, position: pl.position, place: true };
  return pts;
}

export const KEY = [
  ['police', 'Police'], ['barricade', 'Barricade'], ['route', 'March route'], ['tear_gas', 'Tear gas'],
  ['lathi_charge', 'Lathi charge'], ['pellets', 'Pellets'], ['detention', 'Detentions'], ['closed', 'Station closed'],
];

export function createOverlay({ model, pts, data, labelHost }) {
  let mw = 0, mh = 0, col = null;
  const SRC = data.byId.source;
  // DOM labels for police strength (sourced text + *) per hour beat
  const labs = model.beats.map(b => (b.step?.map?.police || []).map(po => {
    if (!po.strength_text) return null;
    const f = po.fact_ref != null ? b.step.summary_facts?.[po.fact_ref] : null;
    const el = document.createElement('span'); el.className = 's5-lab police';
    el.innerHTML = `${esc(po.strength_text)}${f ? star(f.source_ids, SRC, f.attribution) : ''}`;
    el.style.display = 'none'; labelHost.append(el); return el;
  }));
  function resize(w, h) {
    mw = w; mh = h;
    col = { police: tok('--muted'), polEdge: tok('--bg'), red: tok('--accent'), ink: tok('--map-label-bg'), illus: tok('--map-illustrative'), gas: tok('--muted'), gasFill: tok('--muted') };
  }
  const at = (id, cam) => { const q = pts[id]; return q ? project(cam, mw, mh, q.x, q.y) : null; };

  let T = 0;                                   // idle clock (tick only; 0 under ?still → the static frame)
  function draw(g, p, cam, alpha = 1, clock = 0) {
    T = clock;
    const { a, b, t } = model.phase(p), N = model.N;
    const show = (k, f) => k >= 0 && k < N && model.beats[k].step && f > 0 ? [k, f] : null;
    const layers = a === b ? [show(a, 1)] : [show(a, 1 - clamp01(t * 2)), show(b, clamp01(t * 2 - 1))];
    labs.forEach(L => L.forEach(el => { if (el) el.style.display = 'none'; }));
    g.save(); g.beginPath(); g.rect(0, 0, mw, mh); g.clip();
    for (const L of layers) if (L) one(g, L[0], L[1] * alpha, cam, a === b ? 1 : t);
    g.restore();
    return layers.some(Boolean);
  }
  function one(g, k, A, cam) {
    const m = model.beats[k].step.map || {};
    g.globalAlpha = A;
    // route: dashed red line with arrowheads at each leg's end
    if (m.route?.length > 1) {
      const P = m.route.map(id => at(id, cam)).filter(Boolean);
      g.save(); g.strokeStyle = col.red; g.lineWidth = 3; g.setLineDash([10, 7]); g.lineCap = 'round';
      g.beginPath(); P.forEach((q, i) => i ? g.lineTo(q.x, q.y) : g.moveTo(q.x, q.y)); g.stroke(); g.setLineDash([]);
      for (let i = 1; i < P.length; i++) arrowHead(g, P[i - 1], P[i], col.red);
      g.restore();
    }
    // closures: metro stations struck through
    for (const c of m.closures || []) for (const id of c.ids || []) {
      const q = at(id, cam); if (!q) continue;
      g.save(); g.strokeStyle = col.ink; g.lineWidth = 2; g.beginPath(); g.arc(q.x, q.y, 7, 0, TAU); g.stroke();
      g.beginPath(); g.moveTo(q.x - 6, q.y + 6); g.lineTo(q.x + 6, q.y - 6); g.stroke(); g.restore();
    }
    // incidents
    for (const inc of m.incidents || []) { const q = at(inc.at, cam); if (q) incident(g, inc.kind, q, k); }
    // barricades: heavy dashed bars across the way (perpendicular to the route if one passes, else horizontal)
    for (const br of m.barricades || []) {
      const q = br.at ? at(br.at, cam) : null, f = br.from ? at(br.from, cam) : null, t2 = br.to ? at(br.to, cam) : null;
      g.save(); const bar = (x0, y0, x1, y1) => barricade(g, x0, y0, x1, y1);
      if (f && t2 && !q) bar(f.x, f.y, t2.x, t2.y);
      else if (q) { const ang = across(m.route, br.at, cam); bar(q.x - Math.cos(ang) * 38, q.y - Math.sin(ang) * 38, q.x + Math.cos(ang) * 38, q.y + Math.sin(ang) * 38); }
      g.restore();
    }
    // police: a cordon of grey blocks across the street, offset a little toward the camera's bottom-right of the point
    (m.police || []).forEach((po, j) => {
      const q = at(po.at, cam); if (!q) return;
      const ang = across(m.route, po.at, cam), n = 8, P = 10;
      g.save(); g.fillStyle = col.police; g.strokeStyle = col.polEdge; g.lineWidth = 1.5;
      for (let r = 0; r < 2; r++) for (let i = 0; i < n; i++) {
        const d = (i - (n - 1) / 2) * P, o = 14 + r * P;
        const x = q.x + Math.cos(ang) * d + Math.cos(ang + Math.PI / 2) * o, y = q.y + Math.sin(ang) * d + Math.sin(ang + Math.PI / 2) * o;
        g.save(); g.translate(x, y); g.rotate(ang); g.fillRect(-4, -4, 8, 8); g.strokeRect(-4, -4, 8, 8); g.restore();
      }
      g.restore();
      const el = labs[k][j];
      if (el) { el.style.display = ''; el.style.opacity = A.toFixed(3); el.style.transform = `translate(${Math.round(q.x + 14)}px, ${Math.round(q.y + 30)}px)`; }
    });
    g.globalAlpha = 1;
  }
  // the angle across the street at a point: perpendicular to the route leg through it (or 0)
  function across(route, id, cam) {
    const i = route ? route.indexOf(id) : -1;
    if (i < 0) return 0;
    const p0 = at(route[Math.max(0, i - 1)], cam), p1 = at(route[Math.min(route.length - 1, i + 1)], cam);
    return Math.atan2(p1.y - p0.y, p1.x - p0.x) + Math.PI / 2;
  }
  function arrowHead(g, a, b, c) {
    const ang = Math.atan2(b.y - a.y, b.x - a.x), x = b.x - Math.cos(ang) * 6, y = b.y - Math.sin(ang) * 6;
    g.fillStyle = c; g.beginPath(); g.moveTo(x + Math.cos(ang) * 9, y + Math.sin(ang) * 9);
    g.lineTo(x + Math.cos(ang + 2.5) * 9, y + Math.sin(ang + 2.5) * 9); g.lineTo(x + Math.cos(ang - 2.5) * 9, y + Math.sin(ang - 2.5) * 9); g.closePath(); g.fill();
  }
  function incident(g, kind, q, k) {
    g.save();
    if (kind === 'tear_gas') {                       // halftone cloud: dots thinning outward (seeded)
      const br = Math.sin(T * 1.1 + k) - Math.sin(k), R = 58 * (1 + .07 * br), cx = q.x + 8 + 3 * (Math.sin(T * .6) ), cy = q.y - 6 - 2 * Math.sin(T * .45), A0 = g.globalAlpha;   // the cloud breathes and drifts
      const grd = g.createRadialGradient(cx, cy, 0, cx, cy, R); grd.addColorStop(0, col.gasFill); grd.addColorStop(1, 'transparent');
      g.globalAlpha = A0 * .55; g.fillStyle = grd; g.beginPath(); g.ellipse(cx, cy, R, R * .75, 0, 0, TAU); g.fill();
      g.globalAlpha = A0; g.fillStyle = col.gas;
      for (let j = -6; j <= 6; j++) for (let i = -8; i <= 8; i++) {           // a 45° halftone screen, dots shrinking outward
        const x = cx + i * 7 + (j & 1) * 3.5, y = cy + j * 6, d = Math.hypot((x - cx) / R, (y - cy) / (R * .75));
        const rr = 2.8 * (1 - d) * (.75 + .5 * hash01(i * 31 + j, 400 + k)); if (d >= 1 || rr < .5) continue;
        g.beginPath(); g.arc(x, y, rr, 0, TAU); g.fill();
      }
    } else if (kind === 'lathi_charge') {            // red burst
      g.fillStyle = col.polEdge; g.beginPath(); g.arc(q.x, q.y, 25, 0, TAU); g.fill();
      const pu = .5 - .5 * Math.cos(T * 3.2 + (q.x % 7));                  // the burst throbs (idle)
      g.globalAlpha *= 1 - .35 * pu * (T > 0); g.strokeStyle = col.red; g.lineWidth = 3.5; g.lineCap = 'round';
      for (let i = 0; i < 10; i++) { const a = i * TAU / 10 + .2, r1 = i % 2 ? 15 : 23; g.beginPath(); g.moveTo(q.x + Math.cos(a) * 6, q.y + Math.sin(a) * 6); g.lineTo(q.x + Math.cos(a) * r1, q.y + Math.sin(a) * r1); g.stroke(); }
    } else if (kind === 'pellets') {                 // small red crosses
      g.fillStyle = col.polEdge; g.fillRect(q.x - 26, q.y - 34, 52, 24);
      g.strokeStyle = col.red; g.lineWidth = 2.5;
      for (let i = 0; i < 5; i++) { const x = q.x - 18 + 9 * i, y = q.y - 26 + (i % 2) * 8; g.beginPath(); g.moveTo(x - 4, y - 4); g.lineTo(x + 4, y + 4); g.moveTo(x + 4, y - 4); g.lineTo(x - 4, y + 4); g.stroke(); }
    } else if (kind === 'stone_throwing') {
      g.fillStyle = col.ink;
      for (let i = 0; i < 4; i++) { const x = q.x + 12 + 6 * i, y = q.y - 12 - 4 * (i % 2); g.beginPath(); g.moveTo(x, y - 3); g.lineTo(x + 3, y + 2); g.lineTo(x - 3, y + 2); g.closePath(); g.fill(); }
    } else if (kind === 'detention') {               // open brackets round the point
      g.strokeStyle = col.ink; g.lineWidth = 2;
      g.beginPath(); g.moveTo(q.x - 10, q.y - 12); g.lineTo(q.x - 15, q.y - 12); g.lineTo(q.x - 15, q.y + 12); g.lineTo(q.x - 10, q.y + 12);
      g.moveTo(q.x + 10, q.y - 12); g.lineTo(q.x + 15, q.y - 12); g.lineTo(q.x + 15, q.y + 12); g.lineTo(q.x + 10, q.y + 12); g.stroke();
    } else if (kind === 'injury') {
      g.fillStyle = col.red; g.fillRect(q.x + 10, q.y - 16, 12, 4); g.fillRect(q.x + 14, q.y - 20, 4, 12);
    } else if (kind === 'vehicle_damage') {
      g.strokeStyle = col.ink; g.lineWidth = 2; g.strokeRect(q.x + 10, q.y - 18, 16, 9); g.beginPath(); g.moveTo(q.x + 10, q.y - 18); g.lineTo(q.x + 26, q.y - 9); g.stroke();
    }
    g.restore();
  }
  // a small symbol key (HTML) for the legend, shown while an hour beat is up
  function keyHTML() {
    return `<div class="lg-key">${KEY.map(([k, l]) => `<span class="k k-${k}"><i></i>${esc(l)}</span>`).join('')}</div>`;
  }
  // what a beat's card points at: hour beats → incident spots (then police), other beats → their in-frame sites; ≤ 3
  function targets(k) {
    const B = model.beats[k]; if (!B) return [];
    const m = B.step?.map, ids = m ? [...(m.incidents || []).map(i => i.at), ...(m.police || []).map(q => q.at)] : B.sites;
    return [...new Set(ids)].filter(id => pts[id]?.in_frame).slice(0, 3);
  }
  return { resize, draw, keyHTML, targets, at };
}

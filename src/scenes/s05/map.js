// S5 · base map + camera + site marks (S5 chat, 2026-11-12; the S5a part).
//
// Camera: each beat fits its in-frame site_ids (fitCam: pad 110, max zoom 3.2, single site 2.4; all three scaled by
// map width ÷ 893, the storyboard's map width, so 1280×720 frames like 1440×900). Across a transition the camera
// runs a van Wijk smooth zoom (interpolateZoom) with an inOutCubic ease. Pure in p.
// The base map is redrawn only when the camera changes (holds cost nothing).
// Site marks: red dot + label per in-frame site of the beat; labels are placed once per beat at that beat's camera
// (no jumps while the camera moves), cross-fade between beats, and the incoming beat's sites pulse once.
// Off-frame sites (Safdarjung Hospital) get an arrow on the map edge instead. Drawn graphics no source positions
// (the 20 Jul barricade) are dashed and labelled "illustrative" (methodology.illustrative_graphics).
import { tok } from '../../lib/dom.js';
import { esc } from '../../lib/text.js';
import { fitCam, interpolateZoom, project, mapPaths, drawMap } from '../../lib/map.js';
import { clamp01, ease, TAU } from '../../roach/swarm.js';

export const CAMERA = { ref: 893, pad: 110, kMax: 3.2, kSingle: 2.4,      // storyboard values at map width 893
  pullBack: day => Math.sqrt(6 / (6 + 22 * (1 - (1 - Math.min(1, Math.max(0, day / 49))) ** 3))) };   // √(6 ÷ spec size(day))
// builder's drawings tied to a beat (no source gives their position: always dashed + "illustrative")
const ILLUSTRATIVE = [{ beat: 'pa_0720', kind: 'barricade', between: ['patel_chowk', 'parliament_street'], label: 'Barricade · illustrative' }];

// a barricade bar, high contrast (Vali 2026-11-12): black casing, white bar, red stripes (Delhi police barricade colours)
export function barricade(g, x0, y0, x1, y1, w = 9) {
  g.save(); g.lineCap = 'butt'; g.setLineDash([]);
  g.strokeStyle = tok('--black'); g.lineWidth = w + 5; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
  g.strokeStyle = tok('--white'); g.lineWidth = w; g.stroke();
  g.strokeStyle = tok('--red'); g.setLineDash([7, 7]); g.stroke();
  g.restore();
}

export function createMap({ model, data, base, labelHost, legend, extent, points }) {
  const A = points || base.anchors, SITE = data.byId.site;   // points: site anchors + the hour beats' places (overlay.js)
  const paths = mapPaths(base);
  let mw = 0, mh = 0, sc = 1, cams = [], place = [], col = null, lastKey = '';
  const zooms = new Map();
  // one label element per site (+ one per illustrative graphic), reused across beats
  const labs = {};
  for (const id of new Set(model.beats.flatMap(b => b.sites))) {
    const s = SITE[id] || (A[id]?.name && { name: A[id].name }); if (!s || !A[id]) continue;
    const el = document.createElement('span');
    el.className = 's5-lab' + (A[id].in_frame ? '' : ' off') + (A[id].place ? ' place' : '');
    el.innerHTML = A[id].in_frame ? esc(s.name) : `${esc(s.name)} <span class="off-t">· off map</span>`;
    labelHost.append(el); labs[id] = el;
  }
  for (const g of ILLUSTRATIVE) { const el = document.createElement('span'); el.className = 's5-lab illus'; el.textContent = g.label; labelHost.append(el); labs['illus:' + g.beat] = el; }

  let camLead = null;
  const camOf = k => k < 0 && camLead ? camLead : cams[Math.max(0, Math.min(cams.length - 1, k))];
  // w × h: the full-screen map (Vali 2026-11-12). scaleW: the width zoom is scaled by (S4's 62% map box, so the S4
  // handover zoom is unchanged); reserveR: px on the right the narrative card occupies (the camera keeps it clear)
  let reserveR = 0;
  function resize(w, h, { scaleW = w, reserve = 0 } = {}) {
    mw = w; mh = h; sc = scaleW / CAMERA.ref; reserveR = reserve;
    col = { ground: tok('--map-ground'), green: tok('--map-green'), water: tok('--map-water'), casing: tok('--map-road-casing'), road: tok('--map-road'), building: tok('--map-building'), buildingStroke: tok('--map-building-stroke'), dot: tok('--accent'), ink: tok('--map-label-bg'), illus: tok('--map-illustrative') };
    // multi-site fits keep the legend's corner clear (UI never covers content): bottom pad = legend + inset
    const pad = CAMERA.pad * sc;
    // single-site beats pull back as the roaches grow (zoom × √(6 ÷ size(day)), CAMERA.pullBack), so a late close-up
    // shows big roaches with room round them instead of one white mass; day 0 is unchanged (the S4 handover camera)
    // multi-site fits also pad by the beat's cluster extent (extent(beat, k) from roaches.js), refined twice since the
    // roach size depends on the zoom it produces
    cams = model.beats.map(b => {
      const bot = Math.max(pad, (legend?.(b).h || 0) + 44), o = { w, h, pad, kMax: CAMERA.kMax * sc, kSingle: CAMERA.kSingle * sc * (CAMERA.pullBack?.(b.day) ?? 1), pads: { t: pad, r: pad + reserveR, b: bot, l: pad } };
      let cam = fitCam(A, b.sites, o);
      const multi = b.sites.filter(id => A[id]?.in_frame).length > 1;
      if (extent && multi) for (let it = 0; it < 2; it++) {
        const e = extent(b, cam.k, sc), lg = legend?.(b).h || 0;
        cam = fitCam(A, b.sites, { ...o, pads: { t: Math.max(pad, e), r: Math.max(pad, e) + reserveR, l: Math.max(pad, e), b: Math.max(bot, lg + 24 + e) } });
      }
      if (!multi) cam = { ...cam, cx: cam.cx + reserveR / 2 / cam.k };    // single site: centred in the area left of the card
      return cam;
    });
    const a0 = A[model.beats[0].sites[0]], k0 = CAMERA.kSingle * sc;
    camLead = a0 ? { cx: a0.x + (w / 2 - scaleW / 2) / k0, cy: a0.y, k: k0 } : null;   // S4 p 1: start site at the 62% box's centre
    zooms.clear(); lastKey = '';
    // label placement per beat at its own camera: right of the dot, flipped left near the edge, stacked on collision
    const wOf = {}; for (const [id, el] of Object.entries(labs)) { el.style.visibility = 'hidden'; el.style.display = ''; wOf[id] = el.offsetWidth + 10; }
    place = model.beats.map((b, k) => {
      const cam = cams[k], out = {}, boxes = [];
      for (const id of b.sites) {
        const a = A[id]; if (!a || !labs[id]) continue;
        if (!a.in_frame) { out[id] = edgeArrow(cam, a); continue; }
        const p = project(cam, w, h, a.x, a.y), lw = wOf[id], flip = p.x + 14 + lw > w - reserveR - 8;
        let dx = flip ? -24 - lw : 4, dy = 0;
        while (boxes.some(([x0, y0, w0]) => Math.abs(y0 - (p.y + dy)) < 22 && p.x + dx < x0 + w0 + 6 && p.x + dx + lw + 6 > x0)) dy += 22;
        boxes.push([p.x + dx, p.y + dy, lw]); out[id] = { dx, dy };
      }
      for (const g of ILLUSTRATIVE) if (g.beat === b.id) out['illus:' + g.beat] = illus(g, cam);
      return out;
    });
  }
  // the barricade: a short dashed bar across the line between two sites, at their midpoint (storyboard)
  function illus(g, cam) {
    const [p, q] = g.between.map(id => A[id]).map(a => project(cam, mw, mh, a.x, a.y));
    const mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2, ang = Math.atan2(q.y - p.y, q.x - p.x) + Math.PI / 2;
    return { kind: g.kind, wx: (A[g.between[0]].x + A[g.between[1]].x) / 2, wy: (A[g.between[0]].y + A[g.between[1]].y) / 2, ang, dx: -220 * Math.min(1, sc), dy: 30 };
  }
  // an off-frame site: arrow on the map edge (inset 44 px) on the ray from the frame centre toward the site
  function edgeArrow(cam, a) {
    const p = project(cam, mw, mh, a.x, a.y), cx = mw / 2, cy = mh / 2, vx = p.x - cx, vy = p.y - cy, ins = 44;
    const s = Math.min(Math.abs((mw / 2 - ins) / (vx || 1e-9)), Math.abs((mh / 2 - ins) / (vy || 1e-9)));
    let x = cx + vx * s; const y = cy + vy * s;
    if (y > mh - ins - 1) x = Math.max(x, (legend?.().w || 0) + 24 + 40);   // keep clear of the legend's corner
    return { arrow: true, x, y, ang: Math.atan2(vy, vx) };
  }

  // camera at p (pure)
  function camAt(p) {
    const { a, b, t } = model.phase(p);
    if (a === b || t <= 0) return camOf(a);
    if (t >= 1) return camOf(b);
    const key = a + '>' + b;
    let z = zooms.get(key);
    if (!z) zooms.set(key, z = interpolateZoom(camOf(a), camOf(b), mw));
    return z(ease.inOutCubic(t));
  }
  function drawBase(g, cam) {
    const key = `${cam.cx.toFixed(3)},${cam.cy.toFixed(3)},${cam.k.toFixed(5)},${mw},${mh}`;
    if (key === lastKey) return false;
    lastKey = key; drawMap(g, paths, cam, mw, mh, col); return true;
  }
  const dirty = () => { lastKey = ''; };

  // site marks for (p, cam): dots, pulse, arrows, illustrative graphics on the overlay canvas; labels in the DOM.
  // beat −1 (lead-in) and N (lead-out) have no marks.
  function marks(g, p, cam, alpha = 1) {
    const { a, b, t } = model.phase(p), N = model.N;
    const fA = a >= 0 && a < N ? 1 - clamp01(t * 2) : 0, fB = b >= 0 && b < N && b !== a ? clamp01(t * 2 - 1) : 0;
    const vis = {};                                        // id → { al, off }
    const add = (k, f) => {
      if (f <= 0) return;
      for (const [id, o] of Object.entries(place[k])) {
        const cur = vis[id];
        if (cur) { cur.al = Math.max(cur.al, a !== b && place[a]?.[id] && place[b]?.[id] ? 1 : f); cur.o2 = o; }
        else vis[id] = { al: f, o, k };
      }
    };
    if (a === b) add(a, a >= 0 && a < N ? 1 : 0); else { add(a, fA); add(b, fB); }
    // a site in both beats stays up and slides from one placement to the other
    for (const id in vis) if (a !== b && place[a]?.[id] && place[b]?.[id]) { vis[id].al = 1; vis[id].mix = ease.inOutSine(clamp01(t)); vis[id].o = place[a][id]; vis[id].o2 = place[b][id]; }
    g.clearRect(0, 0, mw, mh);
    g.save(); g.beginPath(); g.rect(0, 0, mw, mh); g.clip(); g.globalAlpha = alpha;
    for (const [id, el] of Object.entries(labs)) {
      const v = vis[id];
      if (!v || v.al * alpha <= .01) { if (el.style.display !== 'none') el.style.display = 'none'; continue; }
      const o = v.mix != null ? lerpO(v.o, v.o2, v.mix) : v.o;
      if (id.startsWith('illus:')) {
        const q = project(cam, mw, mh, o.wx, o.wy);
        g.save(); g.globalAlpha = alpha * v.al;
        barricade(g, q.x - Math.cos(o.ang) * 34, q.y - Math.sin(o.ang) * 34, q.x + Math.cos(o.ang) * 34, q.y + Math.sin(o.ang) * 34); g.restore();
        show(el, q.x + o.dx, q.y + o.dy, v.al * alpha); continue;
      }
      const s = A[id];
      if (o.arrow) {
        const e = edgeArrow(cam, s);
        g.save(); g.globalAlpha = alpha * v.al; g.fillStyle = g.strokeStyle = col.ink; g.lineWidth = 2;
        g.translate(e.x, e.y); g.rotate(e.ang); g.beginPath(); g.moveTo(-34, 0); g.lineTo(0, 0); g.stroke();
        g.beginPath(); g.moveTo(8, 0); g.lineTo(-4, -7); g.lineTo(-4, 7); g.closePath(); g.fill(); g.restore();
        const right = Math.cos(e.ang) > .3;
        show(el, e.x + (right ? -16 : 14), e.y - (Math.abs(Math.sin(e.ang)) > .7 ? 22 * Math.sign(Math.sin(e.ang)) : 0), v.al * alpha, right);
        continue;
      }
      const q = project(cam, mw, mh, s.x, s.y);
      g.save(); g.globalAlpha = alpha * v.al; g.fillStyle = col.dot; g.beginPath(); g.arc(q.x, q.y, 4, 0, TAU); g.fill();
      // pulse: the incoming beat's sites, once, over the second half of the transition
      if (a !== b && b < N && place[b]?.[id] && !(a >= 0 && place[a]?.[id])) {
        const u = clamp01(t * 2 - 1);
        if (u > 0 && u < 1) { g.globalAlpha = alpha * (1 - u); g.strokeStyle = col.dot; g.lineWidth = 2; g.beginPath(); g.arc(q.x, q.y, 4 + 16 * ease.outCubic(u), 0, TAU); g.stroke(); }
      }
      g.restore();
      show(el, q.x + o.dx, q.y + o.dy, v.al * alpha);
    }
    g.restore();
  }
  const lerpO = (o, q, m) => ({ ...q, dx: o.dx + (q.dx - o.dx) * m, dy: o.dy + (q.dy - o.dy) * m });
  function show(el, x, y, al, alignRight = false) {
    if (el.style.display === 'none') el.style.display = '';
    el.style.visibility = ''; el.style.opacity = al.toFixed(3);
    el.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px) translate(${alignRight ? '-100%' : '10px'}, -50%)`;   // whole px: crisp text, same raster both ways
  }
  return { resize, camAt, drawBase, marks, dirty, cams: () => cams, get sc() { return sc; } };
}

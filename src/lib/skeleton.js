// Date skeleton. F2 preview promoted in F3; rebuilt in S4a (2026-11-12) as a two-stage RUNTIME pipeline (no bake):
//
//   1. strokes(text, face): rasterise the string ONCE at a fixed reference size (REF px), Zhang–Suen thin, clean the
//      staircase pixels, trace the skeleton into polylines (endpoints / junction clusters / pure loops), prune the
//      thinning spurs, smooth. Cached per (text, face); cost is independent of the viewport.
//   2. skeleton(text, { w, h, spacing, face }): fit those polylines into a w × h box (same fit as F2: 98 % of the
//      box, centred on the advance width and ink height), resample every polyline at exact arc-length `spacing`,
//      and drop slots that crowd within 0.6 × spacing at junctions. Cheap; cached per (text, w, h, spacing, face).
//
// Contract (additive to F3): skeleton(text, { w, h, spacing, face, lanes = 1, laneGap = .68 × spacing })
//   → { slots: [{ x, y, a, path, u, lane, o }], paths: [{ pts, closed, len }], box, k, ms }
//   x, y   slot centre in box px              a     stroke tangent (rad); add π for the other heading
//   path   index into paths                   u     arc length (px) of the slot along its path (for walking / shimmer)
//   lane   0 … lanes − 1                      o     the lane's offset from the stroke centre along the normal (px)
//   paths  the fitted polylines, flat [x, y, …], ordered left to right
//   box    { x0, y0, x1, y1 } of the slots    k     box px per reference px     ms { strokes, layout }
// face 'sans' = Public Sans Black (Vali, 2026-11-12: the S4/S6 skeleton face); 'display' = Protest Revolution.
// Fonts: await skeletonReady(face) before the first call. If the face is not loaded the result is not cached
// and a warning is logged (the canvas would silently fall back to another font).
//
// brackets(ctx, box, pad, len, color, lw): the corner brackets around the date (unchanged).

const REF = 240;                       // reference raster font size (px); ≈ 1.25 × the 1440×900 layout size
const MERGE = 0.6;                     // slots closer than MERGE × spacing are merged (junctions)
const fontSpec = (face, sz) => face === 'display' ? `${sz}px "Protest Revolution"` : `900 ${sz}px "Public Sans"`;

export const skeletonReady = (face = 'sans') => document.fonts.load(fontSpec(face, 100), '0123456789/');

/* ── stage 1: reference strokes ── */
const strokeCache = {};
export function strokes(text, face = 'sans') {
  const key = `${text}|${face}`;
  if (strokeCache[key]) return strokeCache[key];
  const t0 = performance.now();
  const loaded = document.fonts.check(fontSpec(face, 100), text);
  if (!loaded) console.warn(`skeleton: font for face "${face}" is not loaded; result not cached`);

  // raster at REF, glyph origin (baseline, advance start) at (ox, oy)
  const probe = document.createElement('canvas').getContext('2d');
  probe.font = fontSpec(face, REF);
  const m = probe.measureText(text);
  const asc = m.actualBoundingBoxAscent, desc = m.actualBoundingBoxDescent;
  const pad = 6, ox = pad + Math.max(0, Math.ceil(m.actualBoundingBoxLeft)), oy = pad + Math.ceil(asc);
  const w = ox + Math.ceil(Math.max(m.width, m.actualBoundingBoxRight)) + pad, h = oy + Math.ceil(desc) + pad;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d', { willReadFrequently: true });
  x.font = fontSpec(face, REF); x.fillStyle = '#000'; x.fillText(text, ox, oy);
  const d = x.getImageData(0, 0, w, h).data, B = new Uint8Array(w * h);
  let fg = [];
  for (let i = 0; i < w * h; i++) if (d[i * 4 + 3] > 110) { B[i] = 1; fg.push(i); }

  // Zhang–Suen thinning over the foreground list only (not the whole raster)
  let iters = 0;
  for (let changed = true; changed && iters < 200; iters++) {
    changed = false;
    for (const step of [0, 1]) {
      const del = [];
      for (const i of fg) {
        if (!B[i]) continue;
        const p2 = B[i - w], p3 = B[i - w + 1], p4 = B[i + 1], p5 = B[i + w + 1], p6 = B[i + w], p7 = B[i + w - 1], p8 = B[i - 1], p9 = B[i - w - 1];
        const bn = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9; if (bn < 2 || bn > 6) continue;
        const a = (!p2 && p3) + (!p3 && p4) + (!p4 && p5) + (!p5 && p6) + (!p6 && p7) + (!p7 && p8) + (!p8 && p9) + (!p9 && p2); if (a !== 1) continue;
        if (step === 0 ? (p2 * p4 * p6 || p4 * p6 * p8) : (p2 * p4 * p8 || p2 * p6 * p8)) continue;
        del.push(i);
      }
      if (del.length) { changed = true; for (const i of del) B[i] = 0; }
    }
    fg = fg.filter(i => B[i]);
  }
  const half = iters;                  // ≈ half the thickest stroke, in reference px

  const N8 = [-w - 1, -w, -w + 1, 1, w + 1, w, w - 1, -1];
  const DX = [-1, 0, 1, 1, 1, 0, -1, -1], DY = [-1, -1, -1, 0, 1, 1, 1, 0];
  const nb = i => { const o = []; for (let k = 0; k < 8; k++) if (B[i + N8[k]]) o.push(k); return o; };
  // a pixel whose neighbours form one 8-connected group is redundant (staircase corner): removing it keeps the shape
  const redundant = i => {
    const n = nb(i); if (n.length < 2) return false;
    const seen = [n[0]], todo = [n[0]];
    while (todo.length) { const a = todo.pop(); for (const b of n) if (!seen.includes(b) && Math.abs(DX[a] - DX[b]) <= 1 && Math.abs(DY[a] - DY[b]) <= 1) { seen.push(b); todo.push(b); } }
    return seen.length === n.length;
  };

  let paths = [];
  for (let pass = 0; pass < 4; pass++) {
    for (const i of fg) if (B[i] && redundant(i)) B[i] = 0;
    fg = fg.filter(i => B[i]);
    const deg = new Uint8Array(w * h);
    for (const i of fg) { deg[i] = nb(i).length; if (!deg[i]) B[i] = 0; }
    fg = fg.filter(i => B[i]);
    // nodes: endpoints (deg 1) and junction clusters (8-connected pixels of deg ≥ 3)
    const node = new Int32Array(w * h).fill(-1), nodes = [];
    for (const i of fg) {
      if (deg[i] === 2 || node[i] >= 0) continue;
      const id = nodes.length, pix = [i], todo = [i]; node[i] = id;
      if (deg[i] >= 3) while (todo.length) { const a = todo.pop(); for (const k of N8) { const b = a + k; if (B[b] && deg[b] >= 3 && node[b] < 0) { node[b] = id; pix.push(b); todo.push(b); } } }
      let sx = 0, sy = 0; for (const p of pix) { sx += p % w; sy += (p / w) | 0; }
      nodes.push({ end: deg[i] === 1, x: sx / pix.length, y: sy / pix.length, pix });
    }
    const seen = new Uint8Array(w * h), edges = [];
    const walk = (from, first) => {          // follow deg-2 pixels from `first` until a node or a closed loop
      const pix = [first]; seen[first] = 1; let prev = from, cur = first;
      for (;;) {
        let next = -1;
        for (const k of N8) { const b = cur + k; if (!B[b] || b === prev) continue; if (node[b] >= 0) { next = b; break; } if (!seen[b]) next = b; }
        if (next < 0) return { pix, to: -1 };
        if (node[next] >= 0) return { pix, to: node[next] };
        pix.push(next); seen[next] = 1; prev = cur; cur = next;
      }
    };
    for (let id = 0; id < nodes.length; id++) for (const p of nodes[id].pix) for (const k of N8) {
      const q = p + k; if (!B[q] || node[q] >= 0 || seen[q]) continue;
      const { pix, to } = walk(p, q);
      edges.push({ a: id, b: to, pix, closed: false });
    }
    for (const i of fg) if (!seen[i] && deg[i] === 2 && node[i] < 0) {   // pure loops ("0")
      const { pix } = walk(-1, i); edges.push({ a: -1, b: -1, pix, closed: true });
    }
    // spurs: an endpoint hanging off a junction, shorter than ~1.6 half-widths (thinning artefacts at corners)
    const spurs = edges.filter(e => !e.closed && e.b >= 0 && nodes[e.a].end !== nodes[e.b].end && e.pix.length < half * 1.6);
    if (!spurs.length || pass === 3) {
      paths = edges.map(e => {
        const P = e.pix.map(i => [i % w, (i / w) | 0]);
        if (!e.closed) {                     // run edges into their node centroids so strokes meet at junctions
          const A = nodes[e.a], Bn = e.b >= 0 ? nodes[e.b] : null;
          P.unshift([A.x, A.y]);
          if (Bn) P.push([Bn.x, Bn.y]);
        }
        return { P, closed: e.closed };
      }).filter(p => p.P.length > 2);
      // a lone endpoint node with no edge (isolated dot) is dropped
      break;
    }
    for (const e of spurs) { for (const i of e.pix) B[i] = 0; const end = nodes[e.a].end ? nodes[e.a] : nodes[e.b]; for (const i of end.pix) B[i] = 0; }
    fg = fg.filter(i => B[i]);
  }

  // smooth (moving average, ±3 px, two passes; open ends pinned), then to glyph-origin coordinates
  const R = 3;
  const out = paths.map(({ P, closed }) => {
    let Q = P;
    for (let pass = 0; pass < 2; pass++) {
      const n = Q.length, S = Q.map(p => p.slice());
      for (let i = 0; i < n; i++) {
        if (!closed && (i === 0 || i === n - 1)) continue;
        const r = closed ? R : Math.min(R, i, n - 1 - i);
        let sx = 0, sy = 0;
        for (let j = -r; j <= r; j++) { const q = Q[closed ? (i + j + n) % n : i + j]; sx += q[0]; sy += q[1]; }
        S[i] = [sx / (2 * r + 1), sy / (2 * r + 1)];
      }
      Q = S;
    }
    const pts = new Float64Array(Q.length * 2); let len = 0;
    Q.forEach((p, i) => { pts[i * 2] = p[0] - ox; pts[i * 2 + 1] = p[1] - oy; if (i) len += Math.hypot(p[0] - Q[i - 1][0], p[1] - Q[i - 1][1]); });
    if (closed) len += Math.hypot(Q[0][0] - Q.at(-1)[0], Q[0][1] - Q.at(-1)[1]);
    let minX = Infinity; for (let i = 0; i < pts.length; i += 2) minX = Math.min(minX, pts[i]);
    return { pts, closed, len, minX };
  }).sort((a, b) => a.minX - b.minX);

  const res = { paths: out, width: m.width, asc, desc, half, ref: REF, ms: performance.now() - t0 };
  if (loaded) strokeCache[key] = res;
  return res;
}

/* ── stage 2: fit + slots ── */
const skelCache = {};
// box px per reference px for a w × h box (the F2 fit). Also lets a scene size roaches relative to 1440×900.
const fit = (r, w, h) => Math.min(w * .98 / r.width, h * .98 / (r.asc + r.desc));
export const fitScale = (text, w, h, face = 'sans') => fit(strokes(text, face), w, h);
export function skeleton(text, { w, h, spacing, face = 'sans', lanes = 1, laneGap = spacing * .68 }) {
  const key = `${text}|${w}|${h}|${spacing}|${face}|${lanes}|${laneGap}`;
  if (skelCache[key]) return skelCache[key];
  const r = strokes(text, face), t0 = performance.now();
  const k = fit(r, w, h);
  const tx = (w - r.width * k) / 2, ty = (h + (r.asc - r.desc) * k) / 2;
  const paths = r.paths.map(p => {
    const pts = new Float64Array(p.pts.length);
    for (let i = 0; i < pts.length; i += 2) { pts[i] = tx + p.pts[i] * k; pts[i + 1] = ty + p.pts[i + 1] * k; }
    return { pts, closed: p.closed, len: p.len * k };
  });
  // longest paths first so the strokes that run through a junction keep their slots and the branches give way
  const order = paths.map((_, i) => i).sort((a, b) => paths[b].len - paths[a].len);
  const cell = spacing, grid = new Map(), keep = [], lim = (MERGE * spacing) ** 2;
  const gk = (gx, gy) => gx * 73856093 ^ gy * 19349663;
  for (const pi of order) {
    const { pts, closed, len } = paths[pi], n = pts.length / 2;
    const m = closed ? n : n - 1, cum = new Float64Array(m + 1);
    for (let i = 0; i < m; i++) { const j = (i + 1) % n; cum[i + 1] = cum[i] + Math.hypot(pts[j * 2] - pts[i * 2], pts[j * 2 + 1] - pts[i * 2 + 1]); }
    const at = u => {                    // point on the polyline at arc length u (wraps for loops)
      u = closed ? ((u % len) + len) % len : Math.max(0, Math.min(len, u));
      let lo = 0, hi = m - 1;
      while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (cum[mid] <= u) lo = mid; else hi = mid - 1; }
      const i = lo, j = (i + 1) % n, L = cum[i + 1] - cum[i], t = L ? Math.min(1, (u - cum[i]) / L) : 0;
      return [pts[i * 2] + (pts[j * 2] - pts[i * 2]) * t, pts[i * 2 + 1] + (pts[j * 2 + 1] - pts[i * 2 + 1]) * t];
    };
    const cnt = Math.max(1, Math.round(len / spacing)), step = len / cnt;
    // lanes > 1: parallel tracks offset along the normal, alternate lanes shifted half a step (brick pattern)
    for (let lane = 0; lane < lanes; lane++) {
      const o = (lane - (lanes - 1) / 2) * laneGap, shift = lane % 2 ? step / 2 : 0;
      for (let s = 0; s < (closed ? cnt : cnt + 1); s++) {
        const u = s * step + shift; if (!closed && u > len) continue;
        const [px, py] = at(u), e = Math.min(step * .5, 3), [x0, y0] = at(u - e), [x1, y1] = at(u + e);
        const a = Math.atan2(y1 - y0, x1 - x0), x = px - Math.sin(a) * o, y = py + Math.cos(a) * o;
        const gx = Math.floor(x / cell), gy = Math.floor(y / cell); let near = false;
        for (let j = -1; j <= 1 && !near; j++) for (let i = -1; i <= 1 && !near; i++) for (const q of grid.get(gk(gx + i, gy + j)) || []) if ((q.x - x) ** 2 + (q.y - y) ** 2 < lim) { near = true; break; }
        if (near) continue;
        const slot = { x, y, a, path: pi, u, lane, o };
        keep.push(slot); const g = gk(gx, gy); (grid.get(g) || grid.set(g, []).get(g)).push(slot);
      }
    }
  }
  // reading order: by path (left to right), then along the path
  keep.sort((a, b) => a.path - b.path || a.u - b.u || a.lane - b.lane);
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const s of keep) { x0 = Math.min(x0, s.x); y0 = Math.min(y0, s.y); x1 = Math.max(x1, s.x); y1 = Math.max(y1, s.y); }
  const res = { slots: keep, paths, box: { x0, y0, x1, y1 }, k, ms: { strokes: r.ms, layout: performance.now() - t0 } };
  if (strokeCache[`${text}|${face}`]) skelCache[key] = res;
  return res;
}

export function brackets(ctx, b, pad, len, color, lw = 3) {
  const X0 = b.x0 - pad, Y0 = b.y0 - pad, X1 = b.x1 + pad, Y1 = b.y1 + pad;
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'square'; ctx.beginPath();
  ctx.moveTo(X0, Y0 + len); ctx.lineTo(X0, Y0); ctx.lineTo(X0 + len, Y0);
  ctx.moveTo(X1 - len, Y0); ctx.lineTo(X1, Y0); ctx.lineTo(X1, Y0 + len);
  ctx.moveTo(X1, Y1 - len); ctx.lineTo(X1, Y1); ctx.lineTo(X1 - len, Y1);
  ctx.moveTo(X0 + len, Y1); ctx.lineTo(X0, Y1); ctx.lineTo(X0, Y1 - len);
  ctx.stroke(); ctx.restore();
}

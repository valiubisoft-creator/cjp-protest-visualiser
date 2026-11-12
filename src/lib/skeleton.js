// Date skeleton helpers, promoted from design/storyboard.js in F3 (no behaviour change).
// skeleton(text, { w, h, spacing, face }): rasterise → Zhang–Suen thin → evenly spaced slots { x, y, a } + box.
//   face 'sans' = Public Sans Black (Vali, 2026-11-12: the S4/S6 skeleton face); 'display' = Protest Revolution.
//   This is the F2 runtime preview. S4a decides whether it stays runtime or becomes an offline bake.
// brackets(ctx, box, pad, len, color, lw): the corner brackets around the date.
/* ── skeleton slots: rasterise → Zhang–Suen thin → evenly spaced slots with tangents (S4a preview, not the bake) ── */
const skelCache = {};
export function skeleton(text, { w, h, spacing, face = 'sans' }) {
  const SKEL = face;
  const key = `${text}|${w}|${h}|${spacing}|${SKEL}`;
  if (skelCache[key]) return skelCache[key];
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d');
  const font = sz => SKEL === 'display' ? `${sz}px "Protest Revolution"` : `900 ${sz}px "Public Sans"`;
  x.font = font(100); let m = x.measureText(text);
  const sz = Math.min(100 * w * .98 / m.width, 100 * h * .98 / (m.actualBoundingBoxAscent + m.actualBoundingBoxDescent));
  x.font = font(sz); m = x.measureText(text);
  if (SKEL === 'sans') x.letterSpacing = '0px';
  const tx = (w - m.width) / 2, ty = (h + m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2;
  x.fillStyle = '#000'; x.fillText(text, tx, ty);
  const d = x.getImageData(0, 0, w, h).data, B = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) B[i] = d[i * 4 + 3] > 110 ? 1 : 0;
  // Zhang–Suen thinning
  const del = [];
  for (let changed = true, it = 0; changed && it < 200; it++) {
    changed = false;
    for (const step of [0, 1]) {
      del.length = 0;
      for (let yy = 1; yy < h - 1; yy++) for (let xx = 1; xx < w - 1; xx++) {
        const i = yy * w + xx; if (!B[i]) continue;
        const p2 = B[i - w], p3 = B[i - w + 1], p4 = B[i + 1], p5 = B[i + w + 1], p6 = B[i + w], p7 = B[i + w - 1], p8 = B[i - 1], p9 = B[i - w - 1];
        const bn = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9; if (bn < 2 || bn > 6) continue;
        const a = (!p2 && p3) + (!p3 && p4) + (!p4 && p5) + (!p5 && p6) + (!p6 && p7) + (!p7 && p8) + (!p8 && p9) + (!p9 && p2); if (a !== 1) continue;
        if (step === 0 ? (p2 * p4 * p6 || p4 * p6 * p8) : (p2 * p4 * p8 || p2 * p6 * p8)) continue;
        del.push(i);
      }
      if (del.length) { changed = true; for (const i of del) B[i] = 0; }
    }
  }
  // even slots (grid-hash Poisson pick), tangent from local PCA
  const cell = spacing, gw = Math.ceil(w / cell) + 1, grid = new Map(), slots = [];
  let x0 = w, y0 = h, x1 = 0, y1 = 0;
  for (let yy = 1; yy < h - 1; yy++) for (let xx = 1; xx < w - 1; xx++) {
    if (!B[yy * w + xx]) continue;
    const gx = Math.floor(xx / cell), gy = Math.floor(yy / cell); let ok = true;
    for (let j = -1; j <= 1 && ok; j++) for (let i = -1; i <= 1 && ok; i++) for (const p of grid.get((gy + j) * gw + gx + i) || []) if ((p.x - xx) ** 2 + (p.y - yy) ** 2 < spacing * spacing) { ok = false; break; }
    if (!ok) continue;
    let sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0, n = 0;
    for (let j = -6; j <= 6; j++) for (let i = -6; i <= 6; i++) { const X = xx + i, Y = yy + j; if (X < 0 || Y < 0 || X >= w || Y >= h || !B[Y * w + X]) continue; sx += i; sy += j; sxx += i * i; syy += j * j; sxy += i * j; n++; }
    const cxx = sxx / n - (sx / n) ** 2, cyy = syy / n - (sy / n) ** 2, cxy = sxy / n - (sx / n) * (sy / n);
    const p = { x: xx, y: yy, a: .5 * Math.atan2(2 * cxy, cxx - cyy) };
    slots.push(p); const k = gy * gw + gx; (grid.get(k) || grid.set(k, []).get(k)).push(p);
    x0 = Math.min(x0, xx); y0 = Math.min(y0, yy); x1 = Math.max(x1, xx); y1 = Math.max(y1, yy);
  }
  return (skelCache[key] = { slots, box: { x0, y0, x1, y1 } });
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

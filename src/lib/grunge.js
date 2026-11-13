// Grunge backdrop: splattered paint, dry-brush scuffs, scratches, mottled stains and speckle grain (hybrid, 2026-11-13:
// the client wants "grunge / splattered paint" in place of the halftone dot screen). Procedural, seeded, deterministic:
// the same seed and size give the same pixels. Everything is one colour, the ink token (--ht-ink), at alphas that are
// multiples of the ink's own alpha, so it reads as paint (thin wash → thicker core) but stays faint behind text.
//
// grunge(ctx, w, h, { seed, ink, wrapY, density, scale, grain })
//   ctx      a 2D context whose transform maps CSS px (fitCanvas() sets the dpr transform)
//   ink      'rgba(r,g,b,a)'; layers are drawn at a × INK_* below (peak where all layers stack stays ≲ 2.4 a)
//   wrapY    0, or the period in px (must equal h): every layer wraps in y, so the canvas tiles seamlessly
//   density  scales the number of splats, scuffs and scratches (halftone()'s bias maps onto it)
//   scale    scales the stain field's feature size
// Layers, bottom to top: stains (low-res noise, smoothed up), splats (bodies of overlapping irregular blobs, a thicker
// core, satellite droplets thrown outward, streaks, drips, spray mist), dry-brush scuffs, scratches (some cut through
// the paint with destination-out), speckle grain.
import { rng } from './rng.js';

const TAU = Math.PI * 2;
const SPLAT_A = [.55, .9, 1.3], CORE_A = .5, BRUSH_A = [.35, .6, .95], STAIN_MAX = .7;

export function parseInk(s) {
  const m = /rgba?\(([^)]+)\)/.exec(s || ''), v = m ? m[1].split(/[\s,/]+/).filter(Boolean).map(Number) : [0, 0, 0, .07];
  return { r: v[0] | 0, g: v[1] | 0, b: v[2] | 0, a: v.length > 3 ? v[3] : 1 };
}

// value noise on a lattice that is periodic in y with `cy` cells (so a field sampled over [0, H) wraps at H)
function lattice(r, cy) {
  const GX = 256, g = new Float32Array(GX * cy);
  for (let i = 0; i < g.length; i++) g[i] = r();
  const at = (x, y) => g[((y % cy + cy) % cy) * GX + ((x % GX + GX) % GX)], sm = t => t * t * (3 - 2 * t);
  return (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = sm(x - xi), yf = sm(y - yi);
    const a = at(xi, yi), b = at(xi + 1, yi), c = at(xi, yi + 1), d = at(xi + 1, yi + 1);
    return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
  };
}
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// a closed, smoothed, positively wound polygon (same winding as arc/ellipse, so a nonzero fill unions overlaps)
function smoothPoly(P, pts) {
  let s = 0; for (let i = 0; i < pts.length; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % pts.length]; s += x0 * y1 - x1 * y0; }
  if (s < 0) pts.reverse();
  const n = pts.length, mid = i => { const a = pts[i % n], b = pts[(i + 1) % n]; return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; };
  const m0 = mid(0); P.moveTo(m0[0], m0[1]);
  for (let i = 1; i <= n; i++) { const c = pts[i % n], m = mid(i); P.quadraticCurveTo(c[0], c[1], m[0], m[1]); }
  P.closePath();
}
function blobPts(r, cx, cy, R) {
  const harm = []; for (let k = 2; k <= 6; k++) harm.push([k, (.15 + r() * .5) / k, r() * TAU]);
  const nv = Math.max(10, Math.min(32, Math.round(R * .8))), pts = [];
  for (let i = 0; i < nv; i++) {
    const f = i / nv * TAU; let q = 1;
    for (const [k, a, ph] of harm) q += a * Math.sin(k * f + ph);
    q *= 1 + (r() - .5) * .1;
    pts.push([cx + Math.cos(f) * R * q, cy + Math.sin(f) * R * q]);
  }
  return pts;
}
// a tapered stroke from (x, y) along angle f: width w0 at the root, wf at the tip, a droplet head at the end
function streak(P, r, x, y, f, L, w0, wf, bend, head) {
  const ux = Math.cos(f), uy = Math.sin(f), nx = -uy, ny = ux, L1 = [], R1 = [], N = 10;
  let tx = x, ty = y;
  for (let i = 0; i <= N; i++) {
    const t = i / N, hw = w0 * Math.pow(1 - t, 1.3) + wf, b = bend * L * t * t;
    const cx = x + ux * L * t + nx * b, cy = y + uy * L * t + ny * b;
    L1.push([cx + nx * hw, cy + ny * hw]); R1.unshift([cx - nx * hw, cy - ny * hw]); tx = cx; ty = cy;
  }
  const pts = L1.concat(R1);
  let s = 0; for (let i = 0; i < pts.length; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % pts.length]; s += x0 * y1 - x1 * y0; }
  if (s < 0) pts.reverse();
  P.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) P.lineTo(pts[i][0], pts[i][1]); P.closePath();
  if (head > 0) { const hx = tx + ux * head * .6, hy = ty + uy * head * .6; P.moveTo(hx + ux * head * 1.3, hy + uy * head * 1.3); P.ellipse(hx, hy, head * 1.3, head, f, 0, TAU); }
}

// one splat around (cx, cy), radius R, thrown toward angle th, appended to P (positively wound, so a nonzero fill unions
// it); its thicker core goes to `core` (optional). r is a () → [0, 1) source. Also used by lib/alive.js for blooms.
export function splat(P, core, r, cx, cy, R, th) {
  // body: overlapping irregular blobs, nudged toward the throw direction
  const nb = 4 + Math.floor(r() * 6), body = [];
  for (let b = 0; b < nb; b++) {
    const d = R * .45 * Math.sqrt(r()), f = th + (r() - .5) * 2.4, br = R * (.35 + r() * .4);
    const bx = cx + Math.cos(f) * d, by = cy + Math.sin(f) * d;
    smoothPoly(P, blobPts(r, bx, by, br)); body.push([bx, by, br]);
  }
  // fingers: short tapered spikes all round the body (the star-shaped edge of a real splat), longer toward the throw
  for (let i = 0, n = Math.round(5 + R * (.2 + r() * .25)); i < n; i++) {
    const f = r() * TAU, fwd = Math.cos(f - th) * .5 + .5, L = R * (.2 + r() * .55) * (.6 + fwd * .9), w0 = R * (.05 + r() * .07);
    streak(P, r, cx + Math.cos(f) * R * .4, cy + Math.sin(f) * R * .4, f, L, w0, .25, (r() - .5) * .3, r() < .45 ? w0 * (.5 + r() * .5) + .3 : 0);
  }
  if (core && R > 12) for (let b = 0; b < Math.min(3, body.length); b++) { const [bx, by, br] = body[b]; smoothPoly(core, blobPts(r, bx, by, br * (.4 + r() * .2))); }
  // satellites: thrown outward, smaller with distance, stretched radially
  const ns = Math.round(6 + R * (.5 + r() * .5));
  for (let i = 0; i < ns; i++) {
    const f = r() < .7 ? th + (r() + r() - 1) * 1.3 : r() * TAU, u = Math.pow(r(), 1.5), d = R * (.95 + 3.2 * u);
    const sr = Math.max(.45, R * .17 * Math.pow(1 - u, 2) * (.4 + r() * .9)), st = 1 + r() * 1.4 * u;
    const x = cx + Math.cos(f) * d, y = cy + Math.sin(f) * d;
    P.moveTo(x + Math.cos(f) * sr * st, y + Math.sin(f) * sr * st); P.ellipse(x, y, sr * st, sr, f, 0, TAU);
  }
  // streaks: tapered throws ending in a droplet
  if (R > 10) for (let i = 0, n = Math.floor(r() * 4); i < n; i++) {
    const f = th + (r() - .5) * 1.6, L = R * (1.1 + r() * 2.6), w0 = R * (.09 + r() * .1);
    streak(P, r, cx + Math.cos(f) * R * .45, cy + Math.sin(f) * R * .45, f, L, w0, .3, (r() - .5) * .25, w0 * (.6 + r() * .6) + .4);
  }
  // drips: gravity, straight down from the body's lower edge
  if (R > 18) for (let i = 0, n = Math.floor(r() * 3); i < n; i++) {
    const x = cx + (r() - .5) * R * .9, w0 = R * (.05 + r() * .06);
    streak(P, r, x, cy + R * (.2 + r() * .25), Math.PI / 2 + (r() - .5) * .05, R * (.6 + r() * 2.2), w0 * .4, w0 * .7, 0, w0 * 1.1 + .4);
  }
}

export function grunge(ctx, w, h, { seed = 11, ink = 'rgba(0,0,0,.075)', wrapY = 0, density = 1, scale = 1, grain = true } = {}) {
  if (!(w > 0 && h > 0)) return;
  const r = rng(seed), I = parseInk(ink), A = I.a, area = w * h / 1e6;
  const col = m => `rgba(${I.r},${I.g},${I.b},${Math.min(1, A * m).toFixed(4)})`;
  const H = wrapY || h, offs = wrapY ? [0, -wrapY, wrapY] : [0];
  const fillAll = (P, style) => { ctx.fillStyle = style; for (const o of offs) { if (o) ctx.translate(0, o); ctx.fill(P); if (o) ctx.translate(0, -o); } };
  const strokeAll = (P, style, lw) => { ctx.strokeStyle = style; ctx.lineWidth = lw; for (const o of offs) { if (o) ctx.translate(0, o); ctx.stroke(P); if (o) ctx.translate(0, -o); } };
  const wy = y => wrapY ? ((y % wrapY) + wrapY) % wrapY : y;
  ctx.save();
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';

  /* ── 1. mottled stains: three octaves of noise at 1/F resolution, smoothed up; a tide line at each stain's edge ── */
  {
    const F = wrapY ? wrapY / Math.round(wrapY / 4) : 4;          // ≈ 4 px cells; a whole number of rows per period
    const cols = Math.ceil(w / F) + 2, rows = Math.ceil(H / F) + 2;
    const oct = [360, 130, 42, 14].map(c => { c *= scale; const cy = Math.max(1, Math.round(H / c)); return { n: lattice(r, cy), fx: 1 / c, fy: cy / H }; });
    const off = document.createElement('canvas'); off.width = cols; off.height = rows;
    const og = off.getContext('2d'), img = og.createImageData(cols, rows), d = img.data;
    for (let j = 0; j < rows; j++) {
      const y = (j - .5) * F;
      for (let i = 0; i < cols; i++) {
        const x = (i - .5) * F;
        const [n1, n2, n3, n4] = oct.map(o => o.n(x * o.fx, y * o.fy));
        const s = .5 * n1 + .27 * n2 + .14 * n3 + .09 * n4;          // the last octave makes the stain edges ragged
        const blot = sstep(.58, .62, s), tide = Math.exp(-(((s - .585) / .01) ** 2)), mottle = sstep(.6, .95, n2 * .5 + n3 * .3 + n4 * .2);
        const a = Math.min(STAIN_MAX, .4 * blot + .2 * tide + .22 * mottle) * A;
        const k = (j * cols + i) * 4; d[k] = I.r; d[k + 1] = I.g; d[k + 2] = I.b; d[k + 3] = Math.round(a * 255);
      }
    }
    og.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(off, -F, -F, cols * F, rows * F);
  }

  /* ── 2. splats ── */
  const buckets = SPLAT_A.map(() => new Path2D()), core = new Path2D(), mist = [];
  const nSplat = Math.max(3, Math.round(13 * area * density));
  for (let s = 0; s < nSplat; s++) {
    const R = 5 * Math.pow(15, Math.pow(r(), 1.6));            // 5–75 px, mostly small
    const cx = r() * w, cy = r() * H, th = r() * TAU, P = buckets[Math.floor(r() * SPLAT_A.length)];
    splat(P, core, r, cx, cy, R, th);
    // spray mist
    if (r() < .55) for (let i = 0, n = Math.round(R * (2 + r() * 4)); i < n; i++) {
      const f = r() * TAU, d = R * (1 + 2.2 * Math.sqrt(-2 * Math.log(1 - r() * .999)) * .6);
      mist.push(cx + Math.cos(f) * d, wy(cy + Math.sin(f) * d), .3 + r() * .7);
    }
  }
  buckets.forEach((P, i) => fillAll(P, col(SPLAT_A[i])));
  fillAll(core, col(CORE_A));

  /* ── 3. dry-brush scuffs: bristle lines that skip and dry out along a slightly curved pass ── */
  {
    const LW = [.6, 1.1, 1.8], paths = BRUSH_A.map(() => LW.map(() => new Path2D()));
    const nScuff = Math.max(1, Math.round(2.6 * area * density));
    for (let s = 0; s < nScuff; s++) {
      const sx = r() * w, sy = r() * H, L = 150 + r() * 380, W = 12 + r() * 34;
      const f = (r() < .5 ? 0 : -Math.PI / 4) + (r() - .5) * .6 + (r() < .5 ? Math.PI : 0);
      const dx = Math.cos(f), dy = Math.sin(f), nx = -dy, ny = dx, bend = (r() - .5) * .18;
      const B = Math.round(W / 1.5), STEP = 4, N = Math.ceil(L / STEP);
      for (let b = 0; b < B; b++) {
        const e = Math.abs(b / (B - 1) * 2 - 1), o = (b / (B - 1) - .5) * W + (r() - .5) * 1.4;
        const t0 = .1 * e * e + r() * .06, t1 = 1 - .3 * e * e - r() * .35;
        const P = paths[Math.floor(r() * BRUSH_A.length)][Math.floor(r() * LW.length)];
        let on = r() < .7, drawing = false;
        for (let i = 0; i <= N; i++) {
          const t = i / N; if (t < t0 || t > t1) { drawing = false; continue; }
          const tt = (t - t0) / (t1 - t0);
          on = on ? r() > .03 + .45 * tt * tt * tt : r() < .35 * (1 - tt);
          if (!on) { drawing = false; continue; }
          const bb = bend * L * 4 * t * (1 - t), x = sx + dx * L * t + nx * (o + bb), y = sy + dy * L * t + ny * (o + bb);
          if (drawing) P.lineTo(x, y); else { P.moveTo(x, y); drawing = true; }
        }
      }
    }
    paths.forEach((row, i) => row.forEach((P, j) => strokeAll(P, col(BRUSH_A[i]), LW[j])));
  }

  /* ── 4. scratches: thin broken lines; half are ink, half cut through the paint ── */
  {
    const inkP = new Path2D(), cut = new Path2D();
    const nScr = Math.max(2, Math.round(6 * area * density));
    for (let s = 0; s < nScr; s++) {
      const P = r() < .5 ? inkP : cut, L = 80 + r() * 420, f = r() * TAU, N = 8 + Math.floor(r() * 8);
      let x = r() * w, y = r() * H, a = f, drawing = false;
      for (let i = 0; i <= N; i++) {
        if (r() < .18) { drawing = false; } else if (drawing) P.lineTo(x, y); else { P.moveTo(x, y); drawing = true; }
        a += (r() - .5) * .12; x += Math.cos(a) * L / N; y += Math.sin(a) * L / N;
      }
    }
    strokeAll(inkP, col(.7), .7);
    ctx.globalCompositeOperation = 'destination-out';
    strokeAll(cut, 'rgba(0,0,0,.75)', .9);
    ctx.globalCompositeOperation = 'source-over';
  }

  /* ── 5. speckle grain and spray mist (single pixels, so they need no wrapped twins) ── */
  ctx.fillStyle = col(1);
  for (let i = 0; i < mist.length; i += 3) { ctx.globalAlpha = mist[i + 2]; ctx.fillRect(mist[i], mist[i + 1], 1, 1); }
  if (grain) {
    for (let i = 0, n = w * H / 90; i < n; i++) { ctx.globalAlpha = r() * .35; ctx.fillRect(r() * w, r() * H, 1, 1); }
    ctx.fillStyle = col(1.4);
    for (let i = 0, n = w * H / 2600; i < n; i++) { const s = 1 + r() * 1.6; ctx.globalAlpha = .3 + r() * .7; ctx.fillRect(r() * w, r() * H, s, s); }
  }
  ctx.restore();
}

// S4a skeleton spike (2026-11-12): is 06/06/2026 legible when drawn by roaches on a Public Sans Black skeleton,
// at 1440×900 and 1280×720, at 60 fps? Test page only; S4b builds the scene (src/scenes/s04-date.js).
//
// Serve: npx serve . -l 5173 → http://localhost:5173/design/spike-s4a   (clean URL: serve drops the query on .html)
// Params:
//   vw=1280x720     virtual viewport (default: the window). Larger than the window → scaled down to fit, measured at size.
//   face=display    Protest Revolution skeleton instead of Public Sans Black (comparison only)
//   algo=f2         the F2 raster-scan slot picker (before S4a), for A/B
//   s=6.2 sp=7      override roach size / slot spacing (default: 5.6 / 7.4 × max(1, k), k = date scale vs 1440×900)
//   lanes=1         parallel tracks per stroke (default 3, Vali 2026-11-12; spec: raise density, not the face weight)
//   speed=1.5       shimmer speed multiplier (default 1 = 1.2–2.4 Hz, doubled after Vali's review)
//   amp=3           shimmer amplitude along the tangent, px (± amp)
//   plan            overlay the converge plan: the 380 S3.5 roaches (red) vs joiners and their edge entry lines
//   still           freeze the clock at t = 0 (screenshots)       dpr=1|2   force the canvas pixel ratio
//   theme=paper     paper theme                                    H key     toggle the readout
// window.__spike holds every measured number (read by tools / CDP).
import { strokes, skeleton, fitScale, brackets, skeletonReady } from '../src/lib/skeleton.js';
import { roach } from '../src/roach/roach.js';
import { createSwarm, hash01 } from '../src/roach/swarm.js';
import { halftone } from '../src/lib/halftone.js';
import { tok } from '../src/lib/dom.js';
import { ddmmyyyy } from '../src/lib/dates.js';

const TAU = Math.PI * 2;
const Q = new URLSearchParams(location.search);
if (Q.get('theme') === 'paper') document.documentElement.dataset.theme = 'paper';
const [VW, VH] = (Q.get('vw') || `${innerWidth}x${innerHeight}`).split('x').map(Number);
const FACE = Q.get('face') === 'display' ? 'display' : 'sans';
const ALGO = Q.get('algo') === 'f2' ? 'f2' : 'runtime';
const LANES = Q.has('lanes') ? +Q.get('lanes') : 3;                 // Vali, 2026-11-12: lanes 3
const SPEED = Q.has('speed') ? +Q.get('speed') : 1;
const AMP = Q.has('amp') ? +Q.get('amp') : 3;
const STILL = Q.has('still'), PLAN = Q.has('plan');
const DPR = Q.has('dpr') ? +Q.get('dpr') : Math.min(devicePixelRatio || 1, 2);
const POOL = 1200, N35 = 380;

// the storyboard's S4 box at 1440×900 (x 110, y 250, 1220 × 330), as fractions of the viewport
const BOX = { x: 110 / 1440, y: 250 / 900, w: 1220 / 1440, h: 330 / 900 };
const S0 = 5.6, SP0 = 7.4;

const meta = await (await fetch('../data/story/meta.json')).json();
const DATE = ddmmyyyy(meta.protest_start_date);
await skeletonReady(FACE);
await document.fonts.ready;

/* ── layout + slots ── */
const bx = Math.round(BOX.x * VW), by = Math.round(BOX.y * VH), bw = Math.round(BOX.w * VW), bh = Math.round(BOX.h * VH);
const t0 = performance.now();
const ref = strokes(DATE, FACE);                                   // stage 1 (cached for the page's life)
const k = fitScale(DATE, bw, bh, FACE) / fitScale(DATE, 1220, 330, FACE);
const S = Q.has('s') ? +Q.get('s') : S0 * Math.max(1, k);
const SP = Q.has('sp') ? +Q.get('sp') : SP0 * Math.max(1, k);
const sk = ALGO === 'f2' ? skeletonF2(DATE, { w: bw, h: bh, spacing: SP, face: FACE }) : skeleton(DATE, { w: bw, h: bh, spacing: SP, face: FACE, lanes: LANES });
const buildMs = performance.now() - t0;
const slots = sk.slots.map(s => ({ ...s, x: s.x + bx, y: s.y + by }));
const box = { x0: sk.box.x0 + bx, y0: sk.box.y0 + by, x1: sk.box.x1 + bx, y1: sk.box.y1 + by };
const N = Math.min(slots.length, POOL);

/* ── canvases ── */
const stage = document.getElementById('stage');
stage.style.width = VW + 'px'; stage.style.height = VH + 'px';
const fit = Math.min(1, innerWidth / VW, innerHeight / VH);
if (fit < 1) stage.style.transform = `scale(${fit})`;
const mk = () => { const c = document.createElement('canvas'); c.width = Math.round(VW * DPR); c.height = Math.round(VH * DPR); c.style.width = VW + 'px'; c.style.height = VH + 'px'; stage.appendChild(c); const x = c.getContext('2d'); x.setTransform(DPR, 0, 0, DPR, 0, 0); return x; };
const back = mk(), cx = mk();
halftone(back, VW, VH, { seed: 11, cell: 7, ink: tok('--ht-ink'), bias: .05 });
const ROACH = tok('--roach'), FG = tok('--fg'), RED = tok('--red') || tok('--accent');

/* ── per-roach traits: the shared pool's seeded traits, so slot i is roach i ── */
const pool = createSwarm().list;
const R = slots.slice(0, N).map((s, i) => ({
  s, flip: hash01(i, 1) < .5 ? Math.PI : 0,
  w: SPEED * TAU * (1.2 + 1.2 * hash01(i, 2)), ph: TAU * hash01(i, 3), legs0: pool[i].legs0,
}));

/* ── converge plan (numbers for S4b). The S3.5 roaches take the centre lane (one lane ≈ 386 slots ≈ S3.5's 380),
      nearest to the S3.5 end first; joiners take the rest and walk straight in from the nearest screen edge. ── */
const plan = (() => {
  const c35 = { x: VW / 2, y: VH * 380 / 900 };                    // storyboard S3.5 clusters sit on y = 380 / 900
  const mid = Math.floor(LANES / 2);
  const order = slots.slice(0, N).map((s, i) => ({ i, d: Math.hypot(s.x - c35.x, s.y - c35.y), c: (s.lane ?? 0) === mid }))
    .sort((a, b) => (b.c - a.c) || a.d - b.d);
  const own = new Set(order.slice(0, N35).map(o => o.i));
  const off = 2.2 * S * 1.9;                                      // start ~2 body lengths off-screen
  const edges = { T: 0, B: 0, L: 0, R: 0 }, dist = [], lines = [];
  slots.slice(0, N).forEach((s, i) => {
    if (own.has(i)) return;
    // nearest screen edge, straight in (parallel paths, so joiners never cross each other)
    const cand = [['L', s.x + off, -off, s.y], ['R', VW - s.x + off, VW + off, s.y], ['T', s.y + off, s.x, -off], ['B', VH - s.y + off, s.x, VH + off]];
    const [e, d, ex, ey] = cand.reduce((a, b) => b[1] < a[1] ? b : a);
    edges[e]++; dist.push(d); lines.push([ex, ey, s.x, s.y]);
  });
  dist.sort((a, b) => a - b);
  const scrollPx = .45 * 1.8 * VH;                                // converge = S4 p 0 → 0.45 of 180 vh
  return { own, edges, lines, joiners: dist.length, mean: dist.reduce((a, b) => a + b, 0) / (dist.length || 1),
    p95: dist[Math.floor(dist.length * .95)] || 0, max: dist.at(-1) || 0, scrollPx };
})();

/* ── draw ── */
function draw(t) {
  cx.clearRect(0, 0, VW, VH);
  if (PLAN) {
    cx.save(); cx.strokeStyle = FG; cx.globalAlpha = .12; cx.lineWidth = 1; cx.beginPath();
    for (const [x0, y0, x1, y1] of plan.lines) { cx.moveTo(x0, y0); cx.lineTo(x1, y1); }
    cx.stroke(); cx.restore();
  }
  for (let i = 0; i < N; i++) {
    const r = R[i], j = AMP * Math.sin(r.w * t + r.ph), ca = Math.cos(r.s.a), sa = Math.sin(r.s.a);
    cx.fillStyle = cx.strokeStyle = PLAN && plan.own.has(i) ? RED : ROACH;
    roach(cx, r.s.x + ca * j, r.s.y + sa * j, r.s.a + r.flip, S, r.legs0 + j * 1.5);
  }
  brackets(cx, box, 30 * k, 46 * k, FG, 3);
}

/* ── loop + measurement ── */
const hud = document.getElementById('hud');
addEventListener('keydown', e => { if (e.key === 'h' || e.key === 'H') hud.classList.toggle('off'); });
if (Q.get('hud') === '0') hud.classList.add('off');
const iv = [], dm = [], T0 = performance.now();
let last = 0, frames = 0;
const pct = (a, q) => { const b = [...a].sort((x, y) => x - y); return b[Math.min(b.length - 1, Math.floor(b.length * q))] || 0; };
const out = window.__spike = {
  viewport: `${VW}x${VH}`, dpr: DPR, face: FACE, algo: ALGO, date: DATE,
  lanes: LANES, slots: slots.length, drawn: N, pool: POOL, s: +S.toFixed(2), spacing: +SP.toFixed(2), k: +k.toFixed(3),
  ms: { strokes: +ref.ms.toFixed(1), layout: +(sk.ms?.layout ?? buildMs).toFixed(2), firstBuild: +buildMs.toFixed(1) },
  paths: sk.paths?.length ?? null,
  plan: { joiners: plan.joiners, edges: plan.edges, entryMean: Math.round(plan.mean), entryP95: Math.round(plan.p95), entryMax: Math.round(plan.max), convergeScrollPx: Math.round(plan.scrollPx) },
};
function frame(now) {
  const t = STILL ? 0 : (now - T0) / 1000;
  const d0 = performance.now(); draw(t); const d1 = performance.now();
  if (last) { iv.push(now - last); dm.push(d1 - d0); if (iv.length > 600) { iv.shift(); dm.shift(); } }
  last = now; frames++;
  if (frames === 2) document.body.dataset.ready = '1';
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
setInterval(() => {
  const avg = iv.reduce((a, b) => a + b, 0) / (iv.length || 1);
  Object.assign(out, { fps: +(1000 / avg).toFixed(1), frameP50: +pct(iv, .5).toFixed(2), frameP95: +pct(iv, .95).toFixed(2), drawMean: +(dm.reduce((a, b) => a + b, 0) / (dm.length || 1)).toFixed(2), drawP95: +pct(dm, .95).toFixed(2), samples: iv.length });
  const p = out.plan, e = p.edges;
  hud.innerHTML = `<b>S4a spike</b> · ${VW}×${VH} @${DPR}x${fit < 1 ? ` (shown at ${Math.round(fit * 100)} %)` : ''} · ${FACE === 'sans' ? 'Public Sans Black' : 'Protest Revolution'} · ${ALGO === 'f2' ? 'F2 raster picker' : 'S4a runtime strokes'}
slots <b>${out.slots}</b>${out.slots > POOL ? ` (pool ${POOL}: ${out.slots - POOL} not drawn)` : ` of pool ${POOL}`} · s ${out.s} · spacing ${out.spacing} px · lanes ${LANES} · k ${out.k}${out.paths != null ? ` · ${out.paths} strokes` : ''}
build: strokes ${out.ms.strokes} ms (once per string) · layout ${out.ms.layout} ms
<b>${out.fps} fps</b> · frame p50 ${out.frameP50} / p95 ${out.frameP95} ms · draw ${out.drawMean} ms (p95 ${out.drawP95})
converge: ${N35} from S3.5 + <b>${p.joiners}</b> joiners (T ${e.T} · B ${e.B} · L ${e.L} · R ${e.R}) · entry ${p.entryMean} px mean / ${p.entryMax} max over ${p.convergeScrollPx} px of scroll`;
}, 500);

/* ── the F2 slot picker (before S4a), kept here only for the A/B (?algo=f2) ── */
function skeletonF2(text, { w, h, spacing, face = 'sans' }) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d', { willReadFrequently: true });
  const font = sz => face === 'display' ? `${sz}px "Protest Revolution"` : `900 ${sz}px "Public Sans"`;
  x.font = font(100); let m = x.measureText(text);
  const sz = Math.min(100 * w * .98 / m.width, 100 * h * .98 / (m.actualBoundingBoxAscent + m.actualBoundingBoxDescent));
  x.font = font(sz); m = x.measureText(text);
  const tx = (w - m.width) / 2, ty = (h + m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2;
  x.fillStyle = '#000'; x.fillText(text, tx, ty);
  const d = x.getImageData(0, 0, w, h).data, B = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) B[i] = d[i * 4 + 3] > 110 ? 1 : 0;
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
  return { slots, box: { x0, y0, x1, y1 } };
}

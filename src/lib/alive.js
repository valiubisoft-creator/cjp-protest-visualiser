// The living halftone (hybrid, Vali 2026-11-13: "dots randomly moving, fading, appearing at a slow pace so that it
// feels like the visualisation is alive"). Purely decorative idle motion over the static halftone backdrops.
//
// alive(canvas, { cell, ink }) registers a backdrop canvas (lib/halftone.js and the prologue backdrop call it). The
// first time the canvas is on screen, a sibling canvas (.ht-live) is inserted directly after it, so it sits above the
// backdrop and below everything the scene draws on top. One shared loop (~30 fps) animates a slow population of dots
// on the same 45° screen: most appear (ink), drift a few px and fade out; some "erase" an existing dot (page colour)
// and give it back. Nothing here depends on scroll, and no scene's p reads it.
// ?still (QA) and prefers-reduced-motion: the layer is never drawn, so key frames and handovers are unaffected.
const TAU = Math.PI * 2;
const params = new URLSearchParams(location.search);
const OFF = params.has('still') || matchMedia('(prefers-reduced-motion: reduce)').matches;
const reg = new Map();   // canvas → { cell, ink, live, g, w, h, dots, seen }
let raf = 0, last = 0;

export function alive(canvas, { cell = 7, ink = 'rgba(250,250,247,.07)' } = {}) {
  if (OFF || !canvas || !canvas.getContext) return;
  const e = reg.get(canvas) || { seen: performance.now() };
  Object.assign(e, { cell, ink }); e.w = 0;   // size again next frame
  reg.set(canvas, e);
  if (!raf) raf = requestAnimationFrame(loop);
}

const rnd = (a, b) => a + Math.random() * (b - a);
function spawn(e, t, born = t) {
  const s = e.cell * Math.SQRT1_2, erase = Math.random() < .3;
  // snap to the backdrop's 45° screen so new dots sit where dots belong
  const u = Math.round(rnd(-e.w, e.w) / s), v = Math.round(rnd(-e.h, e.h) / s);
  let x = (u - v) * s * Math.SQRT1_2 + e.w / 2, y = (u + v) * s * Math.SQRT1_2 + e.h / 2;
  if (x < 0 || y < 0 || x > e.w || y > e.h) { x = rnd(0, e.w); y = rnd(0, e.h); }
  const a = rnd(0, TAU), sp = rnd(1.5, 5);                  // px per second: slow
  return { x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: e.cell * .42 * rnd(.45, 1), t0: born, life: rnd(5, 11), erase };
}

function size(e, cv) {
  const w = cv.offsetWidth, h = cv.offsetHeight; if (!w || !h) return false;
  if (!e.live) {
    e.live = document.createElement('canvas'); e.live.className = 'ht-live'; e.live.setAttribute('aria-hidden', 'true');
    cv.after(e.live);
  }
  const d = Math.min(devicePixelRatio || 1, 2), st = e.live.style;
  e.live.width = Math.round(w * d); e.live.height = Math.round(h * d);
  Object.assign(st, { position: 'absolute', left: cv.offsetLeft + 'px', top: cv.offsetTop + 'px', width: w + 'px', height: h + 'px', pointerEvents: 'none', display: 'block' });
  const z = getComputedStyle(cv).zIndex; if (z !== 'auto') st.zIndex = z;
  e.g = e.live.getContext('2d'); e.g.setTransform(d, 0, 0, d, 0, 0);
  e.w = w; e.h = h;
  e.bg = getComputedStyle(cv).getPropertyValue('--bg').trim() || '#0B0B0B';
  const n = Math.round(w * h / 4200), t = performance.now() / 1000;
  e.dots = Array.from({ length: n }, () => { const o = spawn(e, t); o.t0 = t - Math.random() * o.life; return o; });   // mid-life at start
  return true;
}

function loop(now) {
  raf = requestAnimationFrame(loop);
  if (now - last < 33) return;                               // ~30 fps is plenty for this pace
  last = now;
  const t = now / 1000, vh = innerHeight;
  for (const [cv, e] of reg) {
    if (!cv.isConnected) { if (now - e.seen > 3000) { e.live?.remove(); reg.delete(cv); } continue; }
    e.seen = now;
    if (!cv.offsetParent) continue;                         // its scene is not live
    const b = cv.getBoundingClientRect(); if (b.bottom < 0 || b.top > vh) continue;
    if ((!e.w || e.w !== cv.offsetWidth || e.h !== cv.offsetHeight) && !size(e, cv)) continue;
    const g = e.g; g.clearRect(0, 0, e.w, e.h);
    for (let i = 0; i < e.dots.length; i++) {
      let o = e.dots[i], age = t - o.t0;
      if (age > o.life) { o = e.dots[i] = spawn(e, t); age = 0; }
      const f = Math.sin(Math.PI * age / o.life), x = o.x + o.vx * age, y = o.y + o.vy * age;
      if (o.erase) { g.globalAlpha = f; g.fillStyle = e.bg; g.beginPath(); g.arc(x, y, o.r * 1.15, 0, TAU); g.fill(); }
      else { g.globalAlpha = 1; g.fillStyle = e.ink; const r = o.r * (.35 + .65 * f); g.globalAlpha = f; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
    }
    g.globalAlpha = 1;
  }
  if (!reg.size) { cancelAnimationFrame(raf); raf = 0; }
}

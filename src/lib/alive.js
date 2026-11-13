// The living backdrop (hybrid, Vali 2026-11-13: "randomly moving, fading, appearing at a slow pace so that it feels
// like the visualisation is alive"). Since the backdrop became grunge / splattered paint (lib/grunge.js), the life is
// paint too: purely decorative idle motion over the static backdrops.
//
// alive(canvas, { cell, ink }) registers a backdrop canvas (lib/halftone.js and the prologue backdrop call it). The
// first time the canvas is on screen, a sibling canvas (.ht-live) is inserted directly after it, so it sits above the
// backdrop and below everything the scene draws on top. One shared loop (~30 fps, only for canvases on screen) draws:
//   specks   a slow population of paint specks and small droplets (some stretched): each fades in, creeps a few px,
//            fades out; about a quarter are "chips" in the page colour that knock a speck out of the paint and give it back
//   blooms   now and then (every ~6 s per canvas, at most two at once) a faint small splat lands: it spreads from 60 %
//            to full size as it appears, holds, and fades away
// Everything stays within the ink token's alpha range, so text over it reads as before. Nothing depends on scroll,
// and no scene's p reads it. ?still (QA) and prefers-reduced-motion: the layer is never drawn.
import { splat, parseInk } from './grunge.js';

const TAU = Math.PI * 2;
const params = new URLSearchParams(location.search);
const OFF = params.has('still') || matchMedia('(prefers-reduced-motion: reduce)').matches;
const reg = new Map();   // canvas → { cell, ink, live, g, w, h, specks, blooms, seen }
let raf = 0, last = 0;

export function alive(canvas, { cell = 7, ink = 'rgba(250,250,247,.07)' } = {}) {
  if (OFF || !canvas || !canvas.getContext) return;
  const e = reg.get(canvas) || { seen: performance.now() };
  const I = parseInk(ink);
  Object.assign(e, { cell, ink, rgb: `${I.r},${I.g},${I.b}`, a: I.a }); e.w = 0;   // size again next frame
  reg.set(canvas, e);
  if (!raf) raf = requestAnimationFrame(loop);
}

const rnd = (a, b) => a + Math.random() * (b - a);
function speck(e, t) {
  const chip = Math.random() < .25, ang = rnd(0, TAU), sp = rnd(.6, 3);   // px per second: barely moving
  const r = chip ? rnd(1, 2.6) : rnd(.5, 1) * (Math.random() < .2 ? rnd(2, 3.4) : 1.6);
  return { x: rnd(0, e.w), y: rnd(0, e.h), vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp + .4, r, st: Math.random() < .3 ? rnd(1.3, 2.2) : 1,
    rot: ang, k: chip ? rnd(.5, .9) : rnd(.7, 1.8), t0: t, life: rnd(5, 12), chip };
}
function bloom(e, t) {
  const R = rnd(6, 20), P = new Path2D();
  splat(P, null, Math.random, 0, 0, R, rnd(0, TAU));
  return { P, x: rnd(R, e.w - R), y: rnd(R, e.h - R), t0: t, life: rnd(7, 11), k: rnd(.7, 1.1) };
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
  const n = Math.round(w * h / 6000), t = performance.now() / 1000;
  e.specks = Array.from({ length: n }, () => { const o = speck(e, t); o.t0 = t - Math.random() * o.life; return o; });   // mid-life at start
  e.blooms = []; e.next = t + rnd(1, 4);
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
    const g = e.g, ink = `rgb(${e.rgb})`; g.clearRect(0, 0, e.w, e.h);
    // blooms first, so specks and chips sit over them
    if (t > e.next) { if (e.blooms.length < 2) e.blooms.push(bloom(e, t)); e.next = t + rnd(3, 9); }
    g.fillStyle = ink;
    e.blooms = e.blooms.filter(o => {
      const u = (t - o.t0) / o.life; if (u >= 1) return false;
      const sc = .6 + .4 * (1 - Math.pow(1 - Math.min(1, u / .3), 3));                    // spreads as it lands
      const f = u < .12 ? u / .12 : u < .5 ? 1 : 1 - (u - .5) / .5;                       // in fast, hold, fade slowly
      g.globalAlpha = Math.min(1, e.a * o.k * f * f * (3 - 2 * f));
      g.save(); g.translate(o.x, o.y); g.scale(sc, sc); g.fill(o.P); g.restore();
      return true;
    });
    for (let i = 0; i < e.specks.length; i++) {
      let o = e.specks[i], age = t - o.t0;
      if (age > o.life) { o = e.specks[i] = speck(e, t); age = 0; }
      const f = Math.sin(Math.PI * age / o.life), x = o.x + o.vx * age, y = o.y + o.vy * age;
      g.fillStyle = o.chip ? e.bg : ink;
      g.globalAlpha = o.chip ? f * o.k : Math.min(1, e.a * o.k * f);
      const r = o.r * (o.chip ? 1 : .5 + .5 * f);
      g.beginPath(); g.ellipse(x, y, r * o.st, r, o.rot, 0, TAU); g.fill();
    }
    g.globalAlpha = 1;
  }
  if (!reg.size) { cancelAnimationFrame(raf); raf = 0; }
}

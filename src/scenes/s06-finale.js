// S6 · Finale: the date returns, Victory (remaining-scenes chat, 2026-11-12). Brief: docs/build/scenes/S6.md.
//
// p 0.00        = S5 p 1: the prologue backdrop at its S4 p 1 offset on --bg, plus S5's last 400 map roaches
//                 (s5End.poses()), white. No map, card or HUD.
// p 0.00–0.30   converge: the map roaches walk to the 25/07/2026 skeleton (the S4 engine: Public Sans Black,
//               lanes LANES) and grow to finale size; joiners walk in from the nearest screen edge to fill the rest.
//               From FLOOD0 the dramatic stage floods out from the date as a circle: red ground and dark halftone
//               inside it, and roaches inside it turn black (ink: .stage-dramatic = red stage, black roaches).
// p 0.30–0.55   hold: roaches shimmer along their stroke (tick only). (Brackets removed, Vali 2026-11-13.)
// p 0.55–0.75   "Victory" (meta.finale.headline) wipes in beneath, left to right, in the display face; shimmer calms.
// p 0.75–1.00   meta.finale.line (verbatim, with its *) rises in.
// p 0.60–1.00   once the date has formed and Victory is in, every roach slowly wanders off its stroke in its own
//               direction and fades into the background (to FADE_TO), staggered (Vali 2026-11-13; was: 45% peel down).
// update(p) is pure in p (poses at t = 0 plus the clock's shimmer). Walk cycles are tied to distance walked.
import { tok, px, fitCanvas } from '../lib/dom.js';
import { esc } from '../lib/text.js';
import { ddmmyyyy } from '../lib/dates.js';
import { star } from '../lib/star.js';
import { skeleton, fitScale, skeletonReady } from '../lib/skeleton.js';
import { roach } from '../roach/roach.js';
import { hash01, clamp01, lerp, ease, angDiff, TAU } from '../roach/swarm.js';
import { loadCss, backdrop } from './s00-hero.js';
import { s5End } from './s05/roaches.js';
import { baseMap } from '../data/load.js';

const CSS = new URL('./s06-finale.css', import.meta.url).href;
// the storyboard's S6 date box at 1440×900 (x 170, y 150, 1100 × 290), as fractions of the viewport
const BOX = { x: 170 / 1440, y: 150 / 900, w: 1100 / 1440, h: 290 / 900 };
const S_F = 7.2, SPACING = 9.2, LANES = 2, AMP = 3;   // finale roaches: larger than S4's 5.6 (the "larger map roaches")
const CONV = .30, FLOOD0 = .14, FLOOD1 = .30, VIC0 = .55, VIC1 = .72, LINE0 = .75, LINE1 = .83;
const PEEL0 = .60, PEEL_SPAN = .22, FADE_LEN = .18, FADE_TO = .1;   // drift + fade: roach r starts at PEEL0 + PEEL_SPAN·r

// the victory node's fact that carries the finale line (for the star's attribution wording)
const victoryFact = (d, fin) => d.byId.node.victory?.facts.find(f => f.text === fin.line);
const landing = t => t < .8 ? t * .9 / .8 : .9 + .1 * (1 - (1 - (t - .8) / .2) ** 2);

export default def => {
  let ctx, W = 0, H = 0, p = 0, DATE = '', L = null, from = null, back, cv, gB, gR, vic, line, dram = null, col = {};
  const scene = {
    id: def.id,
    async init(c) {
      ctx = c; loadCss(CSS);
      const fin = c.data.meta.finale;
      DATE = ddmmyyyy(fin.date);
      await skeletonReady('sans');
      c.root.classList.add('s6');
      c.root.innerHTML = `
        <canvas class="s6-back" aria-hidden="true"></canvas>
        <canvas class="s6-roach" aria-hidden="true"></canvas>
        <div class="s6-text">
          <p class="sr-only">${esc(DATE)}</p>
          <h2 class="s6-victory t-display">${esc(fin.headline)}</h2>
          <p class="s6-line">${esc(fin.line)}${star(fin.source_ids, c.data.byId.source, victoryFact(c.data, fin)?.attribution)}</p>
        </div>`;
      back = c.root.querySelector('.s6-back'); cv = c.root.querySelector('.s6-roach');
      vic = c.root.querySelector('.s6-victory'); line = c.root.querySelector('.s6-line');
      // S5's end poses exist once its (lazy) base map has landed and S5 has laid out (S5 registers on that promise only
      // after its own story files load, so wait for the poses rather than for the map). A deep link may sit in S6.
      let tries = 0;
      const wait = () => { if (s5End.poses().length) { from = null; if (!ctx.root.hidden) render(); } else if (tries++ < 600) requestAnimationFrame(wait); };
      baseMap().then(wait).catch(() => {});
    },
    resize(w, h) {
      W = w; H = h; gB = fitCanvas(back, w, h); gR = fitCanvas(cv, w, h);
      // colours: the ink stage, then the dramatic stage (read from a .stage-dramatic probe so tokens stay the truth)
      const probe = document.createElement('div'); probe.className = 'stage-dramatic'; probe.hidden = true; ctx.root.append(probe);
      col = { bg: tok('--bg'), roach: tok('--roach'), red: tok('--bg', probe), dRoach: tok('--roach', probe), dInk: tok('--ht-ink', probe), ink: tok('--ht-ink') };
      probe.remove();
      dram = null; L = null; from = null;     // rebuilt on the next frame (S5's end poses are set on S5's resize)
    },
    enter() {},
    exit() {},
    update(q) { p = q; render(); },
    tick() { render(); },
  };

  /* ── per viewport: slots, assignment, timings ── */
  function layout() {
    const w = W, h = H;
    const bx = Math.round(BOX.x * w), by = Math.round(BOX.y * h), bw = Math.round(BOX.w * w), bh = Math.round(BOX.h * h);
    const k = fitScale(DATE, bw, bh) / fitScale(DATE, 1100, 290), S = S_F * Math.max(1, k), SP = SPACING * Math.max(1, k);
    const sk = skeleton(DATE, { w: bw, h: bh, spacing: SP, lanes: LANES });
    const slots = sk.slots.map(s => ({ ...s, x: s.x + bx, y: s.y + by }));
    const box = { x0: sk.box.x0 + bx, y0: sk.box.y0 + by, x1: sk.box.x1 + bx, y1: sk.box.y1 + by };
    // S5's roaches take an even share of the slots, both sorted by x (few crossings); joiners take the rest
    const src = from.length;
    const byX = [...slots.keys()].sort((a, b) => slots[a].x - slots[b].x);
    const pick = new Set(Array.from({ length: Math.min(src, slots.length) }, (_, j) => byX[Math.floor(j * slots.length / Math.min(src, slots.length))]));
    const own = byX.filter(i => pick.has(i));
    const srcX = [...from.keys()].sort((a, b) => from[a].x - from[b].x);
    const R = [];
    srcX.forEach((f, j) => {
      const o = from[f];
      if (j < own.length) R.push({ slot: own[j], sx: o.x, sy: o.y, s0: o.s, rot0: o.rot, legs0: o.legs, joiner: false, id: o.i });
      else R.push({ slot: -1, sx: o.x, sy: o.y, s0: o.s, rot0: o.rot, legs0: o.legs, joiner: false, id: o.i });   // surplus: leaves
    });
    let id = 2000;
    slots.forEach((s, i) => {
      if (pick.has(i)) return;
      const off = 2.4 * S * 1.9 + 120 * hash01(id, 607) * S / S_F, lat = (hash01(id, 608) - .5) * 90 * S / S_F;
      const cand = [[s.x, -off, s.y + lat], [w - s.x, w + off, s.y + lat], [s.y, s.x + lat, -off], [h - s.y, s.x + lat, h + off]];
      const [, ex, ey] = cand.reduce((a, b) => b[0] < a[0] ? b : a);
      R.push({ slot: i, sx: ex, sy: ey, s0: S, rot0: Math.atan2(s.y - ey, s.x - ex), legs0: TAU * hash01(id, 609), joiner: true, id: id++ });
    });
    // surplus S5 roaches (more than slots): crawl off the nearest edge during the converge
    for (const o of R) if (o.slot < 0) {
      const d = [o.sx, w - o.sx, o.sy, h - o.sy], e = d.indexOf(Math.min(...d)), out = 4 * S * 1.9;
      o.tx = [-out, w + out, o.sx, o.sx][e]; o.ty = [o.sy, o.sy, -out, h + out][e];
    }
    // stagger by distance (far ones start later): everyone home by CONV
    let dmax = 1;
    for (const o of R) { const tx = o.slot >= 0 ? slots[o.slot].x : o.tx, ty = o.slot >= 0 ? slots[o.slot].y : o.ty; o.d = Math.hypot(tx - o.sx, ty - o.sy); dmax = Math.max(dmax, o.d); }
    for (const o of R) {
      const f = o.d / dmax, i = o.id;
      o.delay = .02 + .05 * f + .04 * hash01(i, 611); o.dur = Math.min(CONV - o.delay, .12 + .14 * f);
      o.flip = hash01(i, 612) < .5 ? Math.PI : 0;
      o.w = TAU * (1.2 + 1.2 * hash01(i, 613)); o.ph = TAU * hash01(i, 614);
      // drift + fade: everyone, staggered by rank; each in its own direction, slowly
      o.p0 = PEEL0 + PEEL_SPAN * hash01(i, 615);
      o.pa = TAU * hash01(i, 616); o.sp = .25 + .2 * hash01(i, 617);
    }
    const cx = (box.x0 + box.x1) / 2, cy = (box.y0 + box.y1) / 2;
    const rmax = Math.max(...[[0, 0], [w, 0], [0, h], [w, h]].map(([x, y]) => Math.hypot(x - cx, y - cy)));
    return { slots, box, R, S, k, cx, cy, rmax };
  }

  // the dramatic halftone: the prologue tile's dot pattern recoloured to the dramatic --ht-ink
  function dramTile() {
    const t = backdrop.tile, c = document.createElement('canvas'); c.width = t.width; c.height = t.height;
    const g = c.getContext('2d'); g.drawImage(t, 0, 0);
    g.globalCompositeOperation = 'source-in'; g.fillStyle = '#000'; g.fillRect(0, 0, c.width, c.height);
    const a0 = alphaOf(col.ink), a1 = alphaOf(col.dInk);   // tile alpha is a0; reach a1 by drawing it a1/a0 times over
    return { c, reps: Math.max(1, a1 / Math.max(.01, a0)), rgb: col.dInk };
  }
  const alphaOf = s => { const m = /rgba?\(([^)]+)\)/.exec(s); const v = m ? m[1].split(',').map(Number) : []; return v.length > 3 ? v[3] : 1; };

  function drawTile(g, tile, alpha = 1) {
    const s4 = ctx.controller.budget.find(d => d.id === 'S4');
    (backdrop.lens ||= {}).S4 ??= s4.len;
    const off = backdrop.offset('S4', 1), T = tile.height, y0 = -(((off % T) + T) % T);
    g.globalAlpha = alpha;
    for (let y = y0; y < H; y += T) g.drawImage(tile, 0, y, W, T);
    g.globalAlpha = 1;
  }

  let backKey = '';
  function drawBack(rad) {
    const key = `${W}|${H}|${rad.toFixed(1)}`;
    if (key === backKey && backdrop.tile) return; backKey = key;
    const g = gB; g.clearRect(0, 0, W, H);
    if (!backdrop.tile) return;
    if (rad < L.rmax + BAND) drawTile(g, backdrop.tile);              // the ink stage outside the flood (stage bg = --bg)
    if (rad <= 0) return;
    dram ||= dramTile();
    g.save(); g.clip(floodPath(rad));
    g.fillStyle = col.red; g.fillRect(0, 0, W, H);
    // tile at alpha a0 drawn whole times, then the fraction: ≈ the dramatic --ht-ink
    const n = Math.floor(dram.reps), fr = dram.reps - n;
    for (let j = 0; j < n; j++) drawTile(g, dram.c, 1);
    if (fr > .05) drawTile(g, dram.c, fr);
    g.restore();
  }

  // the flood's shape: a solid disc out to rad − BAND, then a dot screen whose dots grow toward the core (a halftone
  // wipe, the piece's print texture, rather than a hard circle). Dots on a 45° grid of pitch CELL; r ≥ 0.71 CELL covers.
  const BAND = 260, CELL = 16;
  let fpKey = '', fpPath = null;
  function floodPath(rad) {
    const key = rad.toFixed(1);
    if (key === fpKey) return fpPath; fpKey = key;
    const P = new Path2D(), core = rad - BAND, { cx, cy } = L;
    if (core > 0) P.arc(cx, cy, core, 0, TAU);
    if (rad > 0 && core < L.rmax) {
      const r0 = Math.max(0, core), y0 = Math.max(-CELL, Math.floor((cy - rad) / CELL) * CELL), y1 = Math.min(H + CELL, cy + rad);
      for (let y = y0, row = 0; y <= y1; y += CELL / 2, row++) {
        const dy = y - cy, half = Math.sqrt(Math.max(0, rad * rad - dy * dy)), off = (Math.round(y / (CELL / 2)) & 1) * CELL / 2;
        for (let x = Math.floor((cx - half) / CELL) * CELL + off; x <= cx + half; x += CELL) {
          if (x < -CELL || x > W + CELL) continue;
          const d = Math.hypot(x - cx, dy); if (d < r0 - CELL || d > rad) continue;
          const c = clamp01((rad - d) / BAND), r = .74 * CELL * Math.sqrt(c);
          if (r < .6) continue;
          P.moveTo(x + r, y); P.arc(x, y, r, 0, TAU);
        }
      }
    }
    fpPath = P; return P;
  }

  /* ── one frame for (p, clock.t) ── */
  function render() {
    if (!W) return;
    if (!from) { const f = s5End.poses(); if (!f.length) return; from = f.map(o => ({ ...o })); L = layout(); }
    const t = ctx.clock.t, { slots, R, S, box, k } = L, g = gR;
    // flood (eased radius from the date's centre out past the far corner)
    const fl = ease.inOutCubic(clamp01((p - FLOOD0) / (FLOOD1 - FLOOD0))), rad = fl * (L.rmax + BAND + CELL);
    drawBack(rad);
    g.clearRect(0, 0, W, H);
    g.fillStyle = g.strokeStyle = col.roach;
    const calm = 1 - .65 * ease.inOutSine(clamp01((p - VIC0) / (VIC1 - VIC0)));
    for (const o of R) {
      const e0 = clamp01((p - o.delay) / o.dur);
      let x, y, size, rot, legs, al = 1;
      if (o.slot < 0) {                                       // surplus: off the nearest edge
        const e = ease.inOutSine(e0), dirA = Math.atan2(o.ty - o.sy, o.tx - o.sx);
        x = lerp(o.sx, o.tx, e); y = lerp(o.sy, o.ty, e); size = o.s0;
        rot = e0 < .1 ? o.rot0 + angDiff(o.rot0, dirA) * e0 / .1 : dirA; legs = o.legs0 + e * o.d / size * 1.2;
      } else {
        const s = slots[o.slot], fl2 = s.a + o.flip, e = o.joiner ? landing(e0) : ease.inOutSine(e0);
        x = lerp(o.sx, s.x, e); y = lerp(o.sy, s.y, e); size = o.joiner ? S : lerp(o.s0, S, e);
        const travel = Math.atan2(s.y - o.sy, s.x - o.sx);
        rot = e0 <= 0 ? o.rot0 : e0 < .15 && !o.joiner ? o.rot0 + angDiff(o.rot0, travel) * (e0 / .15) : travel + angDiff(travel, fl2) * clamp01((e - .85) / .15);
        legs = o.legs0 + e * o.d / Math.max(2, (o.s0 + S) / 2) * 1.2;
        // shimmer once home (time only; calms under "Victory", stops as the roach peels)
        const pe = clamp01((p - o.p0) / .06);
        const arr = clamp01((e0 - .9) / .1) * calm * (1 - pe);
        if (arr > 0 && t > 0) { const j = AMP * Math.max(1, k) * Math.sin(o.w * t + o.ph) * arr; x += Math.cos(s.a) * j; y += Math.sin(s.a) * j; legs += 1.5 * j; }
        if (p > o.p0) {                                       // drift: turn, walk slowly in its own direction, fade back
          const u = p - o.p0, turn = clamp01(u / .04), d = Math.max(0, u - .01) * H * o.sp;
          rot = fl2 + angDiff(fl2, o.pa) * ease.inOutSine(turn);
          x += Math.cos(o.pa) * d; y += Math.sin(o.pa) * d; legs += d / S * 1.2;
          al = lerp(1, FADE_TO, ease.inOutSine(clamp01(u / FADE_LEN)));
        }
      }
      g.globalAlpha = al; roach(g, x, y, rot, size, legs);
    }
    g.globalAlpha = 1;
    // roaches inside the flood turn black (recolour what is already drawn)
    if (rad > 0) {
      g.save(); g.globalCompositeOperation = 'source-atop'; g.fillStyle = col.dRoach; g.fill(floodPath(rad)); g.restore();
    }
    // brackets: removed (Vali, hybrid Gate 0 review 2026-11-13: "remove the target crosshairs"; S4 dropped them too)
    // text
    const v = ease.inOutSine(clamp01((p - VIC0) / (VIC1 - VIC0)));
    const pad = 30 * Math.max(1, k), vy = box.y1 + pad + 22 * H / 900;   // below the bottom brackets (storyboard: +60 at 900)
    vic.style.top = vy + 'px';
    vic.style.clipPath = `inset(-20% ${((1 - v) * 100).toFixed(2)}% -20% 0)`;
    vic.style.visibility = v > 0 ? 'visible' : 'hidden';
    const ln = ease.outCubic(clamp01((p - LINE0) / (LINE1 - LINE0)));
    line.style.top = (vy + vic.offsetHeight + 28 * H / 900) + 'px';
    line.style.opacity = ln.toFixed(3); line.style.transform = `translateY(${((1 - ln) * 10).toFixed(1)}px)`;
    line.style.visibility = ln > 0 ? 'visible' : 'hidden';
  }
  return scene;
};

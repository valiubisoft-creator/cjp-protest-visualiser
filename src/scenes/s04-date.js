// S4 · The date on the skeleton (prologue chat, 2026-11-12). Brief: docs/build/scenes/S4b.md; skeleton: S4a (STATUS).
//
// p 0.00–0.52  converge. S3.5's 760 roaches take the centre lane of a 3-lane Public Sans Black skeleton plus an even
//              share of the outer lanes (sorted by x onto them, so paths barely cross); the remaining ~380 slots
//              (~250 at 1280×720) fill with joiners that walk straight in from the nearest screen edge. Staggered by
//              distance: far ones start later and arrive last (p 0.45 still has late arrivals). At p 0 nothing has
//              moved yet (= S3.5 p 1) and every joiner is still off-screen.
// p 0.52–0.80  hold: each roach shimmers ±3 px along its stroke (1.2–2.4 Hz, legs 1.5× the displacement, S4a);
//              corner brackets draw in over p 0.52–0.58. Caption slot left EMPTY (Vali 2026-11-12).
// p 0.80–1.00  release, left to right: roaches peel off toward the Jantar Mantar landing point and shrink to map size
//              (s = 6 / 1.9: the spec's day-0 size ÷ 1.9, zoom 2.4); the map fades in under them (map region, soft
//              edges); the date's readout appears top-left as the HUD. p 1 is the frame S5 p 0 must match.
// Walk cycles are tied to distance walked, so legs move when scrubbed and freeze when the reader stops.
import { tok, px, dpr } from '../lib/dom.js';
import { esc } from '../lib/text.js';
import { ddmmyyyy, dayN } from '../lib/dates.js';
import { skeleton, fitScale, skeletonReady, brackets } from '../lib/skeleton.js';
import { baseMap } from '../data/load.js';
import { roach } from '../roach/roach.js';
import { hash01, clamp01, lerp, ease, angDiff, TAU } from '../roach/swarm.js';
import { claim } from './s03-5-claim.js';
import { N3 } from './s03-multiply.js';
import { loadCss } from './s00-hero.js';

const CSS = new URL('./s04-date.css', import.meta.url).href;
// the storyboard's S4 box at 1440×900 (x 110, y 250, 1220 × 330), as fractions of the viewport (S4a)
const BOX = { x: 110 / 1440, y: 250 / 900, w: 1220 / 1440, h: 330 / 900 };
const S_TYPE = 5.6, SPACING = 7.4, LANES = 3, AMP = 3;     // Vali 2026-11-12 (S4a review)
const CONV = .52, HOLD_B = [.52, .58], REL = .80;     // converge ends .52 so p .45 still has late arrivals (storyboard)
const MAP_S = 6 / 1.9;                                     // spec S5 size at day 0 (6 px) ÷ 1.9, at zoom 2.4
const MAP_K = 2.4;                                         // camera zoom for a single site (storyboard kSingle)
const ROAD_W = { major: 16, secondary: 12, tertiary: 9, minor: 6, service: 3.5, path: 1.6 };   // design/lib/kit.js mapSVG
const ROAD_ORDER = ['path', 'service', 'minor', 'tertiary', 'secondary', 'major'];

// walking pace, then a short settle onto the slot (slope stays continuous: linear to 0.8, quadratic ease-out after)
const landing = t => t < .8 ? t * .9 / .8 : .9 + .1 * (1 - (1 - (t - .8) / .2) ** 2) * 1;

export default def => {
  let ctx, W = 0, H = 0, p = 0, DATE = '', host, mapCv, hud, map = null, paths = null, landN = 0;
  let L = null;                                             // layout for the current viewport
  const S35 = [], S3 = [];
  const scene = {
    id: def.id,
    async init(c) {
      ctx = c; loadCss(CSS);
      DATE = ddmmyyyy(c.data.meta.protest_start_date);
      // how many roaches stay on the map at day 0: the start node's crowd tier (methodology D6), as S5 shows it
      const start = c.data.byId.node.start;
      const tier = c.data.methodology.crowd_tiers?.tiers.find(t => t.tier === start.crowd_tier);
      landN = tier?.roaches ?? 0;
      await skeletonReady('sans');
      host = document.createElement('div'); host.className = 's4-map'; host.hidden = true; host.setAttribute('aria-hidden', 'true');
      mapCv = document.createElement('canvas'); host.append(mapCv); c.layers.text.append(host);
      c.root.classList.add('s4');
      c.root.innerHTML = `<p class="sr-only">${esc(DATE)}</p><div class="s4-cap"></div>
        <div class="s4-hud" aria-hidden="true"><span class="d t-num">${esc(DATE)}</span><span class="t-micro">Day ${dayN(c.data.meta.protest_start_date)}</span></div>`;
      hud = c.root.querySelector('.s4-hud');
      // the base map is lazy (~540 KB): fetch now, draw when it lands
      baseMap().then(m => { map = m; if (L) drawMap(); if (!ctx.root.hidden) render(); }).catch(e => console.error('[S4] base map', e));
    },
    resize(w, h) { W = w; H = h; L = layout(w, h); if (map) drawMap(); },
    enter() {},
    exit() { host.hidden = true; ctx.layers.swarm.ctx.clearRect(0, 0, W, H); },
    update(q) { p = q; render(); },
    tick() { render(); },
  };

  /* ── layout: slots, assignment, paths (per viewport) ── */
  function layout(w, h) {
    const bx = Math.round(BOX.x * w), by = Math.round(BOX.y * h), bw = Math.round(BOX.w * w), bh = Math.round(BOX.h * h);
    // S4a size rule: never fewer slots than at 1440×900's scale; bigger screens get bigger roaches
    const k = fitScale(DATE, bw, bh) / fitScale(DATE, 1220, 330), S = S_TYPE * Math.max(1, k), SP = SPACING * Math.max(1, k);
    const sk = skeleton(DATE, { w: bw, h: bh, spacing: SP, lanes: LANES });
    const slots = sk.slots.slice(0, ctx.swarm.capacity).map(s => ({ ...s, x: s.x + bx, y: s.y + by }));
    const box = { x0: sk.box.x0 + bx, y0: sk.box.y0 + by, x1: sk.box.x1 + bx, y1: sk.box.y1 + by };
    const end = claim.poses(1, 0, [], ctx.swarm.list, []);   // S3.5's end layout (t = 0) for the assignment
    // the S3.5 roaches (N3 = 760) take the whole centre lane plus an even share of the outer lanes, both sorted by x
    // (few crossings); joiners take the rest. If the centre lane alone exceeds N3, it is thinned evenly.
    const mid = (LANES - 1) >> 1, bx_ = i => slots[i].x;
    const centre = slots.map((s, i) => i).filter(i => slots[i].lane === mid).sort((a, b) => bx_(a) - bx_(b));
    const outer = slots.map((s, i) => i).filter(i => slots[i].lane !== mid).sort((a, b) => bx_(a) - bx_(b));
    const even = (arr, n) => Array.from({ length: Math.min(n, arr.length) }, (_, j) => arr[Math.floor(j * arr.length / n)]);
    const pick = new Set(centre.length >= N3 ? even(centre, N3) : [...centre, ...even(outer, N3 - centre.length)]);
    const own = [...pick].sort((a, b) => bx_(a) - bx_(b));
    const byX = [...Array(N3).keys()].sort((a, b) => end[a].x - end[b].x);
    const R = [];                                           // R[r] for pool roach r
    byX.forEach((r, j) => { if (j < own.length) R[r] = { slot: own[j], joiner: false }; });
    // joiners: every other slot, pool N3 …, entering straight from the nearest edge (~2 body lengths off-screen)
    const off = 2.2 * S * 1.9;
    let r = N3;
    slots.forEach((s, i) => {
      if (pick.has(i)) return;
      // nearest edge, entered from a little further back and a little to the side, so joiners trickle in rather than
      // arrive as a wall (straight paths, nearly parallel: no crossings)
      const o2 = off + 140 * hash01(r, 67) * S / S_TYPE, lat = (hash01(r, 68) - .5) * 80 * S / S_TYPE;
      const cand = [[s.x, -o2, s.y + lat], [w - s.x, w + o2, s.y + lat], [s.y, s.x + lat, -o2], [h - s.y, s.x + lat, h + o2]];
      const [, ex, ey] = cand.reduce((a, b) => b[0] < a[0] ? b : a);
      R[r++] = { slot: i, joiner: true, sx: ex, sy: ey };
    });
    const n = r;
    // stagger by distance, far ones last; S3.5 roaches and joiners each against their own longest path:
    //   S3.5 roaches  delay ≤ 0.20, walk 0.08–0.32        joiners  delay ≤ 0.10, walk 0.20–0.48 (first on screen ~p 0.03)
    //   (the random part of each delay breaks up lockstep rows)
    // everyone is home by p 0.52 (so p 0.45 still has the farthest arrivals walking in)
    const dmax = [1, 1];
    for (let i = 0; i < n; i++) {
      const o = R[i]; if (!o) continue; const s = slots[o.slot];
      const sx = o.joiner ? o.sx : end[i].x, sy = o.joiner ? o.sy : end[i].y;
      o.d = Math.hypot(s.x - sx, s.y - sy); dmax[+o.joiner] = Math.max(dmax[+o.joiner], o.d);
    }
    for (let i = 0; i < n; i++) {
      const o = R[i]; if (!o) continue; const f = o.d / dmax[+o.joiner], s = slots[o.slot];
      if (o.joiner) { o.delay = .04 * f + .06 * hash01(i, 61); o.dur = Math.min(CONV - o.delay, .2 + .28 * f); }
      else { o.delay = .15 * f + .05 * hash01(i, 61); o.dur = Math.min(CONV - o.delay, .08 + .24 * f); }
      o.flip = hash01(i, 1) < .5 ? Math.PI : 0;
      o.w = TAU * (1.2 + 1.2 * hash01(i, 2)); o.ph = TAU * hash01(i, 3);
      // release: left to right across the date, 0.08 of p each, the last one lands at p 1
      o.r0 = REL + .12 * (s.x - box.x0) / Math.max(1, box.x1 - box.x0); o.r1 = o.r0 + .08;
      o.stay = false;
    }
    // map camera: the landing point is the start site's anchor; single site → centred, zoom 2.4 (scaled to the map width)
    const mw = Math.round(w * (parseFloat(tok('--map-w')) || 62) / 100), mh = h - (px('--scrubber-h') || 96);
    const cam = { w: mw, h: mh, k: MAP_K * mw / 893 };
    const land = { x: mw / 2, y: mh / 2 };
    // who stays: landN roaches (spread across the date by a seeded rank) settle loosely round the anchor, as the
    // storyboard's S5 start frame shows them; the rest arrive and fade into that crowd
    const order = [...Array(n).keys()].filter(i => R[i]).sort((a, b) => hash01(a, 62) - hash01(b, 62));
    const rad = 62 * Math.sqrt(cam.k / MAP_K);
    order.forEach((i, j) => {
      const o = R[i], a = TAU * hash01(i, 63), rr = rad * Math.sqrt(hash01(i, 64)) * (j < landN ? 1 : .7);
      o.stay = j < landN; o.lx = land.x + Math.cos(a) * rr * 1.1; o.ly = land.y + Math.sin(a) * rr * .75;
      o.lrot = TAU * hash01(i, 65);
    });
    return { slots, box, R, n, S, k, cam, land };
  }

  /* ── the map under the release (same look as design/lib/kit.js mapSVG; S5a takes the map over at S5 p 0) ── */
  function drawMap() {
    const { cam } = L, d = dpr(), m = map, a = m.anchors?.jantar_mantar_road;
    if (!a) return;
    const startIds = ctx.data.byId.node.start.site_ids;
    const A = m.anchors[startIds?.[0]] || a;
    mapCv.width = Math.round(cam.w * d); mapCv.height = Math.round(cam.h * d);
    mapCv.style.width = cam.w + 'px'; mapCv.style.height = cam.h + 'px';
    const g = mapCv.getContext('2d'); g.setTransform(d, 0, 0, d, 0, 0);
    if (!paths) {
      const poly = (list, close) => { const P = new Path2D(); for (const p of list) { for (let i = 0; i < p.length; i += 2) i ? P.lineTo(p[i], p[i + 1]) : P.moveTo(p[i], p[i + 1]); if (close) P.closePath(); } return P; };
      const Ly = m.layers;
      paths = { green: poly(Ly.green, true), water: poly(Ly.water, true), buildings: poly(Ly.buildings, true), roads: {} };
      for (const c of ROAD_ORDER) paths.roads[c] = poly(Ly.roads.filter(r => !r.tunnel && r.c === c).map(r => r.p), false);
    }
    g.fillStyle = tok('--map-ground'); g.fillRect(0, 0, cam.w, cam.h);
    g.save(); g.translate(cam.w / 2 - A.x * cam.k, cam.h / 2 - A.y * cam.k); g.scale(cam.k, cam.k);
    g.fillStyle = tok('--map-green'); g.fill(paths.green);
    g.fillStyle = tok('--map-water'); g.fill(paths.water);
    g.lineCap = g.lineJoin = 'round';
    g.strokeStyle = tok('--map-road-casing'); for (const c of ROAD_ORDER) { g.lineWidth = ROAD_W[c] + 2; g.stroke(paths.roads[c]); }
    g.strokeStyle = tok('--map-road'); for (const c of ROAD_ORDER) { g.lineWidth = ROAD_W[c]; g.stroke(paths.roads[c]); }
    g.fillStyle = tok('--map-building'); g.fill(paths.buildings);
    g.strokeStyle = tok('--map-building-stroke'); g.lineWidth = .6 / cam.k; g.stroke(paths.buildings);
    g.restore();
  }

  /* ── one frame for (p, clock.t) ── */
  function render() {
    if (!L) return;
    const t = ctx.clock.t, g = ctx.layers.swarm.ctx, { slots, R, n, S, box, k } = L;
    claim.poses(1, t, S35, ctx.swarm.list, S3);
    // map + HUD (release)
    const mapA = ease.inOutSine(clamp01((p - REL) / .15));
    host.hidden = !(mapA > 0 && map); host.style.opacity = mapA;
    const hudA = clamp01((p - .88) / .08);
    hud.style.opacity = hudA; hud.style.visibility = hudA > 0 ? '' : 'hidden';
    hud.style.transform = `translateY(${(1 - ease.outCubic(hudA)) * 8}px)`;

    g.clearRect(0, 0, W, H);
    g.fillStyle = g.strokeStyle = tok('--roach');
    const list = ctx.swarm.list;
    for (let i = 0; i < n; i++) {
      const o = R[i]; if (!o) continue;
      const s = slots[o.slot], fl = s.a + o.flip;
      const sx = o.joiner ? o.sx : S35[i].x, sy = o.joiner ? o.sy : S35[i].y;
      const e0 = clamp01((p - o.delay) / o.dur), e = o.joiner ? landing(e0) : ease.inOutSine(e0);
      let x = lerp(sx, s.x, e), y = lerp(sy, s.y, e), size = o.joiner ? S : lerp(S35[i].s, S, e), alpha = o.joiner ? 1 : lerp(S35[i].a, 1, e);
      const travel = Math.atan2(s.y - sy, s.x - sx);
      const startRot = o.joiner ? travel : S35[i].rot;
      let rot = e0 <= 0 ? startRot : e0 < .15 && !o.joiner ? startRot + angDiff(startRot, travel) * (e0 / .15) : travel + angDiff(travel, fl) * clamp01((e - .85) / .15);
      let legs = list[i].legs0 + e * o.d / S * 1.2;
      // shimmer once home (time only; amplitude grows on arrival and dies away in the release)
      const rel = clamp01((p - o.r0) / (o.r1 - o.r0));
      const arr = clamp01((e0 - .9) / .1) * (1 - clamp01(rel * 4));
      if (arr > 0) { const j = AMP * Math.max(1, k) * Math.sin(o.w * t + o.ph) * arr; x += Math.cos(s.a) * j; y += Math.sin(s.a) * j; legs += 1.5 * j; }
      if (rel > 0) {                                        // release: slot → landing point, shrink to map size
        const er = ease.inOutCubic(rel), bend = Math.sin(er * Math.PI) * 60 * (hash01(i, 66) - .35) * H / 900;
        const tx = o.lx, ty = o.ly, dirA = Math.atan2(ty - s.y, tx - s.x);
        x = lerp(x, tx, er) + Math.cos(dirA + Math.PI / 2) * bend; y = lerp(y, ty, er) + Math.sin(dirA + Math.PI / 2) * bend;
        size = lerp(S, MAP_S, er);
        rot = rel < .15 ? fl + angDiff(fl, dirA) * (rel / .15) : rel > .85 ? dirA + angDiff(dirA, o.lrot) * ((rel - .85) / .15) : dirA;
        legs += er * Math.hypot(tx - s.x, ty - s.y) / S * 1.2;
        if (!o.stay) alpha *= 1 - ease.smooth(clamp01((rel - .55) / .45));
      }
      if (alpha <= .01) continue;
      g.globalAlpha = alpha;
      roach(g, x, y, rot, size, legs);
    }
    g.globalAlpha = 1;
    // brackets draw in over p 0.50–0.56 (two strokes per corner, dashed reveal) and go as the release starts
    const bIn = clamp01((p - HOLD_B[0]) / (HOLD_B[1] - HOLD_B[0])), bOut = 1 - clamp01((p - REL) / .05);
    if (bIn > 0 && bOut > 0) {
      const len = 46 * Math.max(1, k);
      g.save(); g.globalAlpha = bOut; g.setLineDash([2 * len * ease.outCubic(bIn), 1e5]);
      brackets(g, box, 30 * Math.max(1, k), len, tok('--fg'), 3);
      g.restore();
    }
  }
  return scene;
};

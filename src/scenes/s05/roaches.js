// S5 · roaches as protester markers (S5 chat, 2026-11-12; the S5c part) + the legend.
//
// Count = the beat's crowd tier (methodology.crowd_tiers; null = carry the previous tier, legend says "no count
// reported"). Size = days elapsed (spec: size(day) = lerp(6, 28, easeOutCubic(day / 49)) px body length), drawn at
// roach() s = size ÷ 1.9, × √(zoom ÷ close zoom) on wide shots (Vali-approved), never below sMin.
// Everything a reader can change lives in `roachEncoding`.
//
// Placement (pure in p): roach i belongs to one of the beat's in-frame sites (weighted: Jantar Mantar Road heavier on
// multi-site beats), at a seeded unit offset u_i scaled by the cluster's spread (√n · s, in screen px, so clusters
// stay legible at any zoom). Positions are anchored to the map, so they ride the camera. Across a transition each
// roach walks from its old spot to its new one (staggered), heading along its path; new roaches walk in from the
// nearest map edge. Walk cycles come from distance walked (legs move when scrubbed, freeze when the reader stops).
// Idle (tick only, zero under ?still): a small standing jitter.
//
// Handover in: the first roaches are S4's landed roaches (release.landed(): same pool order, pose, size), so S5 p 0
// draws exactly S4 p 1. Handover out: `s5End.poses()` is the S5 p 1 picture for S6 to start from.
import { roach } from '../../roach/roach.js';
import { hash01, clamp01, lerp, ease, angDiff, TAU } from '../../roach/swarm.js';
import { esc } from '../../lib/text.js';
import { star } from '../../lib/star.js';
import { tok } from '../../lib/dom.js';
import { project } from '../../lib/map.js';
import { CAMERA } from './map.js';

export const roachEncoding = {
  size: { min: 6, max: 28, maxDay: 49, ease: t => 1 - (1 - t) ** 3 },   // spec S5, px body length
  sPerPx: 1 / 1.9,                       // roach() s per px of body length
  zoomRef: CAMERA.kSingle,               // close zoom (× map width ÷ 893); wider shots shrink by √(k ÷ ref)
                                         // (late single-site beats are wider too: CAMERA.pullBack in map.js)
  sMin: 2.6,                             // never smaller (legs stay visible)
  jmrWeight: .6,                         // Jantar Mantar Road's weight on multi-site beats = max(1, sites × 0.6)
  spread: (n, s) => Math.sqrt(n) * s * 1.05 + 6,   // cluster radius scale, screen px (storyboard)
  spreadMax: .17,                        // … capped at 0.17 × the map's short side, so late close-ups stay in frame
  // count comes from methodology.crowd_tiers (tier → roaches), carried when a beat's tier is null
};
const sizeAt = day => { const e = roachEncoding.size; return e.min + (e.max - e.min) * e.ease(clamp01(day / e.maxDay)); };

// how far a beat's biggest cluster reaches from its site (px) at zoom k: the camera pads multi-site fits by it
export function clusterExtent(beat, k, sc, w, h) {
  const n = beat.sites.length > 1 ? beat.count * Math.max(1, beat.sites.length * roachEncoding.jmrWeight) / (Math.max(1, beat.sites.length * roachEncoding.jmrWeight) + beat.sites.length - 1) : beat.count;
  const s = Math.max(roachEncoding.sMin, sizeAt(beat.day) * roachEncoding.sPerPx * Math.min(1, Math.sqrt(k / (roachEncoding.zoomRef * sc))));
  return 1.6 * Math.min(roachEncoding.spread(n, s), roachEncoding.spreadMax * Math.min(w, h)) + s * 1.9;
}

// S6 contract: the S5 p 1 picture (screen poses at t = 0), set on resize
export const s5End = { poses: () => [] };

export function createRoaches({ model, data, mapApi, anchors, legendHost, landed }) {
  const A = anchors, NMAX = Math.max(...model.beats.map(b => b.count));
  let mw = 0, mh = 0, sc = 1, L = null, guard = 1, slow = 0, col = '';
  const SRC = data.byId.source;

  /* ── per viewport: per-beat assignment and spreads ── */
  function resize(w, h, { scaleW = w } = {}) {
    mw = w; mh = h; sc = scaleW / CAMERA.ref; col = tok('--roach');   // scaleW: S4's 62% box (zoom/size scale)
    const cams = mapApi.cams(), land = landed?.() || null;
    const R = [];
    for (let i = 0; i < NMAX; i++) {
      // seeded unit offset (ellipse 1 × 0.8, Gaussian-ish radius) and rest heading
      const a = TAU * hash01(i, 301), r = Math.sqrt(-2 * Math.log(1 - hash01(i, 302) * .97)) * .7;
      R.push({ ux: Math.cos(a) * r, uy: Math.sin(a) * r * .8, rot: TAU * hash01(i, 303), legs: TAU * hash01(i, 304), delay: .35 * hash01(i, 305) });
    }
    // per beat: site of each roach, count per site, spread per site (at the beat's own day and camera)
    const B = model.beats.map((b, k) => {
      const cam = cams[k], crowd = (b.step?.map?.crowd || []).filter(c => A[c.at]?.in_frame && c.share > 0);
      // clusters: an hour beat's crowd entries (share; moving_to = a stream along the way), else the beat's sites
      const ids = crowd.length ? crowd.map(c => c.at) : b.sites.filter(id => A[id]?.in_frame);
      const toward = crowd.length ? crowd.map(c => (A[c.moving_to]?.in_frame ? c.moving_to : null)) : ids.map(() => null);
      const wts = crowd.length ? crowd.map(c => c.share) : ids.map(id => id === 'jantar_mantar_road' && ids.length > 1 ? Math.max(1, ids.length * roachEncoding.jmrWeight) : 1);
      const tot = wts.reduce((s, x) => s + x, 0), cum = []; let run = 0; wts.forEach((x, j) => { run += x; cum[j] = run / tot; });
      const site = new Int16Array(b.count), n = new Array(ids.length).fill(0);
      for (let i = 0; i < b.count; i++) { const u = hash01(i, 310); let j = cum.findIndex(c => u < c); if (j < 0) j = ids.length - 1; site[i] = j; n[j]++; }
      const s = sAt(b.day, cam.k);
      return { ids, toward, site, spread: n.map(m => Math.min(roachEncoding.spread(m, s), roachEncoding.spreadMax * Math.min(w, h)) * (crowd.length ? .8 : 1)), cam, count: b.count };
    });
    // S4's landed roaches take indices 0…; their unit offsets reproduce S4's landing spots at beat 0
    if (land) {
      const b0 = B[0], c = land.land;
      land.roaches.forEach((o, i) => {
        if (i >= NMAX) return;
        const sp = b0.spread[b0.site[i]] || 1, q = R[i];
        q.ux = (o.x - c.x) / sp; q.uy = (o.y - c.y) / sp; q.rot = o.rot; q.legs = o.legs; q.landed = o;
      });
    }
    // walk-cycle bases: legs accumulated over earlier transitions (distance in px at each beat's own camera)
    for (let i = 0; i < NMAX; i++) {
      const q = R[i]; q.lb = [q.legs];
      for (let k = 1; k < B.length; k++) {
        const p0 = spot(B[k - 1], i, B[k - 1].cam), p1 = spot(B[k], i, B[k].cam);
        const d = p0 && p1 ? Math.hypot(p1.x - p0.x, p1.y - p0.y) : 0;
        q.lb.push(q.lb[k - 1] + d / Math.max(1, sAt(model.beats[k].day, B[k].cam.k)) * 1.2);
      }
    }
    L = { R, B, land };
    s5End.poses = () => posesAt(1, 0);
  }
  const sAt = (day, k) => Math.max(roachEncoding.sMin, sizeAt(day) * roachEncoding.sPerPx * Math.min(1, Math.sqrt(k / (roachEncoding.zoomRef * sc))));
  // roach i's spot at beat B under camera cam (null if the beat has fewer roaches)
  function spot(Bk, i, cam) {
    if (!Bk || i >= Bk.count || !Bk.ids.length) return null;
    const j = Bk.site[i], a = A[Bk.ids[j]], to = Bk.toward?.[j] ? A[Bk.toward[j]] : null, q = L ? L.R[i] : null, sp = Bk.spread[j];
    // a moving crowd strings out along the way toward its target (0–70% of the leg, seeded per roach)
    const f = to ? .7 * hash01(i, 330) : 0, wx = to ? a.x + (to.x - a.x) * f : a.x, wy = to ? a.y + (to.y - a.y) * f : a.y;
    const c = project(cam, mw, mh, wx, wy), k = to ? .45 : 1;
    return { x: c.x + (q ? q.ux : 0) * sp * k, y: c.y + (q ? q.uy : 0) * sp * k };
  }
  // where a new roach enters: straight out from its target to the nearest map edge, a body length beyond it
  function edgeIn(p, s) {
    const out = 4 * s * 1.9, d = [p.x, mw - p.x, p.y, mh - p.y], k = d.indexOf(Math.min(...d));
    return [{ x: -out, y: p.y }, { x: mw + out, y: p.y }, { x: p.x, y: -out }, { x: p.x, y: mh + out }][k];
  }

  /* ── poses at (p, t) ── */
  function posesAt(p, t, out = []) {
    out.length = 0;
    if (!L) return out;
    const { a, b, t: u } = model.phase(p), N = model.N, cam = mapApi.camAt(p);
    const s = sAt(Math.max(0, (model.dateAt(p) - model.beats[0].t) / 864e5), cam.k);
    const Ba = L.B[Math.max(0, Math.min(N - 1, a))], Bb = L.B[Math.max(0, Math.min(N - 1, b))], ka = Math.max(0, Math.min(N - 1, a)), kb = Math.max(0, Math.min(N - 1, b));
    const n = Math.max(Ba.count, a === b ? 0 : Bb.count);
    for (let i = 0; i < n; i++) {
      const q = L.R[i];
      const P = spot(Ba, i, cam), Q = a === b || u <= 0 ? P : spot(Bb, i, cam);
      let x, y, rot = q.rot, legs = q.lb[ka];
      if (a === b || u <= 0 || !Q) { if (!P) continue; x = P.x; y = P.y; }
      else {
        const from = P || edgeIn(Q, s), e0 = clamp01((u - q.delay) / (1 - q.delay * .9 - .05)), e = ease.inOutSine(e0);
        x = lerp(from.x, Q.x, e); y = lerp(from.y, Q.y, e);
        const dist = Math.hypot(Q.x - from.x, Q.y - from.y);
        if (dist > .5 && e0 > 0) {
          const head = Math.atan2(Q.y - from.y, Q.x - from.x), startRot = P ? q.rot : head;
          rot = e0 < .15 ? startRot + angDiff(startRot, head) * (e0 / .15) : e0 > .85 ? head + angDiff(head, q.rot) * ((e0 - .85) / .15) : head;
        } else if (!P) rot = Math.atan2(Q.y - from.y, Q.x - from.x);
        legs = q.lb[ka] + e * dist / s * 1.2;
      }
      // landed S4 roaches keep S4's exact pose until they first move (handover)
      if (q.landed && a <= 0 && b <= 0 && (a === b || u <= 0)) { x = q.landed.x; y = q.landed.y; legs = q.landed.legs; }
      out.push({ i, x, y, rot, s, legs });
    }
    return out;
  }

  /* ── draw ── */
  const buf = [];
  function draw(g, p, t, { clip = true } = {}) {
    posesAt(p, t, buf);
    g.save(); g.fillStyle = g.strokeStyle = col;
    if (clip) { g.beginPath(); g.rect(0, 0, mw, mh); g.clip(); }
    const lim = Math.ceil(buf.length * guard);
    for (let j = 0; j < lim; j++) {
      const r = buf[j];
      let { x, y, legs } = r;
      if (t > 0) {                                     // standing jitter (idle only; 0 at t = 0)
        const w = TAU * (.6 + .8 * hash01(r.i, 320)), ph = TAU * hash01(r.i, 321), j1 = 1.2 * (Math.sin(w * t + ph) - Math.sin(ph));
        x += Math.cos(r.rot) * j1; y += Math.sin(r.rot) * j1; legs += 1.5 * j1;
        // and a slow amble round its spot (spec: idle-walk within the site footprint), radius ~ a body length
        const wa = .25 + .35 * hash01(r.i, 322), pa = TAU * hash01(r.i, 323), ra = r.s * 1.9 * (.6 + .8 * hash01(r.i, 324));
        x += ra * (Math.cos(wa * t + pa) - Math.cos(pa)); y += ra * (Math.sin(wa * t + pa) - Math.sin(pa)); legs += ra * wa * t / r.s * 1.2;
      }
      roach(g, x, y, r.rot, r.s, legs);
    }
    g.restore();
    return buf;
  }
  // spec §8 frame-time guard: average frame over 20 ms for 2 s → 15% fewer roaches (never below half)
  function frame(dt) {
    slow = dt > .02 ? slow + dt : Math.max(0, slow - dt);
    if (slow > 2 && guard > .5) { guard = Math.max(.5, guard * .85); slow = 0; console.warn(`[S5] frame guard: roaches × ${guard.toFixed(2)}`); }
  }

  /* ── legend (bottom-left of the map) ── */
  let legKey = '', legIcon = null;
  // collapsible (Vali 2026-11-12: smaller, a dropdown): collapsed = the toggle + the tier row; open = notes + symbol key
  legendHost.innerHTML = `<button class="lg-h" type="button" aria-expanded="false" aria-controls="s5-lg-more">Reading the map<span class="lg-car" aria-hidden="true"></span></button>
    <div class="lg-row t-num"><canvas class="lg-ico" width="88" height="52" aria-hidden="true"></canvas><span class="lg-t"></span></div>
    <div class="lg-more" id="s5-lg-more"><p class="lg-n">${esc(data.methodology.roach_size)} Dashed = illustrative. ${esc((data.methodology.map.base.match(/Credit: (.*)$/) || [])[1] || '')}</p></div>`;
  legendHost.querySelector('.lg-h').addEventListener('click', e => {
    const open = legendHost.classList.toggle('open'); e.currentTarget.setAttribute('aria-expanded', open);
  });
  legIcon = legendHost.querySelector('canvas'); const legT = legendHost.querySelector('.lg-t');
  function legend(p) {
    const { a, b, t } = model.phase(p), k = Math.max(0, Math.min(model.N - 1, t < .5 ? a : b)), B = model.beats[k];
    const cam = mapApi.camAt(p), s = sAt(Math.max(0, (model.dateAt(p) - model.beats[0].t) / 864e5), cam.k);
    const key = `${k}|${s.toFixed(2)}`;
    if (key === legKey) return; legKey = key;
    const T = B.tierInfo;
    legT.innerHTML = T ? `Tier ${B.tier} · “${esc(T.label)}” → ${T.roaches} roaches${B.tierFact ? star(B.tierFact.source_ids, SRC, B.tierFact.attribution) : ''}${B.tierOwn ? '' : ' · <span class="nc">no count reported</span>'}` : '';
    const g = legIcon.getContext('2d'); g.setTransform(2, 0, 0, 2, 0, 0); g.clearRect(0, 0, 44, 26);
    g.fillStyle = g.strokeStyle = col; roach(g, 16, 13, 0, Math.min(9, s), 1.2);
  }
  return { resize, draw, frame, legend, posesAt, get count() { return L ? L.B.length : 0; } };
}

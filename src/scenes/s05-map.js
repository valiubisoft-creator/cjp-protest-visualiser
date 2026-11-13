// S5 · Map stage: Jantar Mantar day by day (S5 chat, 2026-11-12: S5a + S5b + S5c in one chat).
// Briefs: docs/build/scenes/S5a.md, S5b.md, S5c.md. Composes the parts in ./s05/:
//   beats.js     the beat model: segments → beats, phase(p), dateAt(p), pAt(date)   (shared by every part)
//   map.js       base map, camera, site marks                                      (S5a)
//   roaches.js   count / size encodings, clusters, legend                          (S5c)
//   rail.js      scroll-driven rail cards, click-to-load YouTube                   (S5b)
//   scrubber.js  the timeline strip: a view of p and a control over it (seek)      (S5b)
//
// Layout (spec S5): map = --map-w of the width × (h − --scrubber-h), rail to its right, scrubber full width below.
// p 0 – lead-in end   (60 vh)  the S4 p 1 frame (= S5 p 0: halftone backdrop, soft-edged map at the start camera,
//                              S4's 120 landed roaches, HUD) builds into the stage: map edges harden, the rail panel
//                              and legend fade in, the scrubber slides up from below.
// beats                         see beats.js (in 0–0.20, hold, out 0.85–1 per beat; camera, roaches, card, date move
//                              together in each transition).
// lead-out            (60 vh)  map, rail, scrubber, HUD and legend dissolve; the backdrop returns; the roaches stay.
//                              S5 p 1 = backdrop (S4 p 1 offset) + the last beat's roaches: the S6 p 0 contract
//                              (s5End.poses() in roaches.js).
import { tok, px, fitCanvas } from '../lib/dom.js';
import { esc } from '../lib/text.js';
import { ddmmyyyy, DAY0 } from '../lib/dates.js';
import { baseMap, story } from '../data/load.js';
import { clamp01, ease } from '../roach/swarm.js';
import { loadCss, backdrop } from './s00-hero.js';
import { release } from './s04-date.js';
import { buildModel } from './s05/beats.js';
import { createMap } from './s05/map.js';
import { createRoaches, clusterExtent } from './s05/roaches.js';
import { createRail } from './s05/rail.js';
import { createScrubber } from './s05/scrubber.js';
import { createOverlay, pointsFor } from './s05/overlay.js';
import { createHybrid, HY } from './s05/hybrid.js';

const HYCSS = new URL('./s05/hybrid.css', import.meta.url).href;

const CSS = new URL('./s05-map.css', import.meta.url).href;

export default def => {
  let ctx, W = 0, H = 0, MW = 0, MH = 0, M62 = 0, CARD = 400, p = 0, model, mapApi, roaches, rail, scrub, overlay, points, ready = false, hy = null;
  let el = {}, g = {};
  const scene = {
    id: def.id,
    async init(c) {
      ctx = c; loadCss(CSS); loadCss(HYCSS);
      // body copy, extra imagery and the 20 Jul hour-by-hour (S5 chat; optional files, small)
      const opt = n => story(n).catch(() => null);
      const [narrative, imagery, sansad] = await Promise.all(['narrative', 'imagery', 'sansad_chalo'].map(opt));
      // sources the 20 Jul research added (sansad_chalo.json new_sources): appended to the shared ledger so every *
      // resolves; footer numbers continue after sources.json (S10 renders data.sources.sources, so they appear there too)
      for (const ns of sansad?.new_sources || []) if (!c.data.byId.source[ns.id]) { c.data.sources.sources.push(ns); c.data.byId.source[ns.id] = { ...ns, n: c.data.sources.sources.length }; }
      // hybrid (build/hybrid, Vali 2026-11-13): the cut beat list, chapter titles, ≤ 3 labels, the ledgers (s05/hybrid.js)
      model = buildModel(def, c.data, { narrative, imagery, sansad, hybrid: HY });
      const r = c.root; r.classList.add('s5', 'hy');
      r.innerHTML = `
        <canvas class="s5-back" aria-hidden="true"></canvas>
        <div class="s5-mapbox" aria-hidden="true"><canvas class="s5-base"></canvas></div>
        <canvas class="s5-roach" aria-hidden="true"></canvas>
        <div class="s5-marks" aria-hidden="true"><canvas class="s5-ov"></canvas><div class="s5-labs"></div></div>
        <div class="s5-hud"><span class="d t-num"></span><span class="t-micro t-num"></span></div>
        <div class="s5-legend"></div>
        <aside class="s5-rail" aria-label="What happened"></aside>
        <div class="s5-scrub"></div>
        <p class="sr-only s5-live" aria-live="polite"></p>`;
      const q = s => r.querySelector(s);
      el = { back: q('.s5-back'), box: q('.s5-mapbox'), marks: q('.s5-marks'), base: q('.s5-base'), ov: q('.s5-ov'), labs: q('.s5-labs'), roach: q('.s5-roach'), hud: q('.s5-hud'), hudD: q('.s5-hud .d'), hudT: q('.s5-hud .t-micro'), legend: q('.s5-legend'), rail: q('.s5-rail'), scrub: q('.s5-scrub'), live: q('.s5-live') };
      // hybrid: the rail is replaced by s05/hybrid.js (built once the map points exist); this stub keeps the rail's API
      rail = { update() {}, resize() {}, unload() {}, metrics: () => [], anchor: () => hy?.anchor(p) ?? null, cardBox: () => hy?.cardBox() ?? { x: 0, y: 0, w: 0, h: 0 } };
      if (c.debug) Object.assign(window, { __s5rail: rail, __s5model: model });   // QA: rail.metrics(), beat slots
      scrub = createScrubber({ host: el.scrub, model, controller: c.controller, sceneId: def.id });
      // the base map is the one big asset (~540 KB): lazy, never blocks boot (S4's release asks for it first)
      baseMap().then(base => {
        points = pointsFor(model, base, c.data.byId.site);
        overlay = createOverlay({ model, pts: points, data: c.data, labelHost: el.labs });
        hy = createHybrid({ host: c.root, model, data: c.data, pts: points });
        mapApi = createMap({ model, data: c.data, base, points, labelHost: el.labs, legend: b => ({ w: el.legend.offsetWidth, h: Math.max(el.legend.offsetHeight, 62) + (b?.kind === 'hour' ? 18 : 0) }), extent: (b, k, sc) => clusterExtent(b, k, sc, M62, MH) });
        roaches = createRoaches({ model, data: c.data, mapApi, anchors: points, legendHost: el.legend, landed: () => release.landed(0) });
        el.legend.querySelector('.lg-more').insertAdjacentHTML('beforeend', overlay.keyHTML());
        el.legend.insertAdjacentHTML('beforeend', '<p class="lg-ill">Police, barricades and clashes: positions approximate, illustrative</p>');
        ready = true;
        if (W) { scene.resize(W, H); if (!ctx.root.hidden) render(ctx.clock.t); }
      }).catch(e => console.error('[S5] base map', e));
    },
    resize(w, h) {
      W = w; H = h;
      if (!ready) return;
      // full-screen map (Vali 2026-11-12); M62 = S4's 62% map box: the handover frame and the zoom/size scale
      MW = w; MH = h - (px('--scrubber-h') || 96); M62 = Math.round(w * (parseFloat(tok('--map-w')) || 62) / 100);
      CARD = 360;                                         // hybrid caption card (was the 400/360 rail)
      const r = ctx.root.style;
      r.setProperty('--s5-mw', MW + 'px'); r.setProperty('--s5-mh', MH + 'px'); r.setProperty('--s5-card-w', CARD + 'px');
      g.back = fitCanvas(el.back, w, h); g.roach = fitCanvas(el.roach, w, h);
      g.base = fitCanvas(el.base, MW, MH); g.ov = fitCanvas(el.ov, MW, MH);
      mapApi.resize(MW, MH, { scaleW: M62, reserve: CARD + 48 }); mapApi.dirty(); overlay.resize(MW, MH);
      roaches.resize(MW, MH, { scaleW: M62 });
      rail.resize(MW, MH); hy.resize(w, h, MW, MH); scrub.resize(w, h - MH);
      drawBackdrop();
    },
    enter() {},
    exit() { rail.unload?.(); },
    update(q) { p = q; render(ctx.clock.t); },
    tick(t, dt) {
      if (!ready) return; roaches.frame(dt); drawRoaches(t);
      if (hourLive) drawMarks(t);     // tear gas breathes, bursts throb (idle only)
    },
  };

  // the prologue backdrop, frozen at its S4 p 1 offset (it stops where the map takes over, STATUS)
  function drawBackdrop() {
    const tile = backdrop.tile; if (!tile) return;
    const s4 = ctx.controller.budget.find(d => d.id === 'S4');
    (backdrop.lens ||= {}).S4 ??= s4.len;
    const off = backdrop.offset('S4', 1), T = tile.height, y0 = -(((off % T) + T) % T);
    g.back.clearRect(0, 0, W, H);
    for (let y = y0; y < H; y += T) g.back.drawImage(tile, 0, y, W, T);
  }
  function drawRoaches(t) {
    g.roach.clearRect(0, 0, W, H);
    roaches.draw(g.roach, p, t);
  }

  /* ── one frame for (p, clock.t) ── */
  function render(t) {
    if (!ready || !W) return;
    rail.update(p);                 // first: its first measurement re-slots the beats (model.reslot) before anything reads them
    const L = model.lead(p), li = L.in, lo = L.out;
    // lead-in: soft S4 edges → hard map frame; rail and legend fade in; scrubber slides up. lead-out: all dissolve.
    const eIn = ease.inOutSine(li), eOut = ease.inOutSine(lo), stage = 1 - eOut;
    const s = ctx.root.style;
    // S4's soft edges sat on a 62% box (black to 70%, clear at 100% of it): grow them out to the full screen
    s.setProperty('--s5-mx', (.7 * M62 + (W + 2 - .7 * M62) * eIn).toFixed(1) + 'px'); s.setProperty('--s5-mx2', (M62 + (W + 4 - M62) * eIn).toFixed(1) + 'px');
    s.setProperty('--s5-my', (80 + 20 * eIn).toFixed(2) + '%');
    el.box.classList.toggle('hard', eIn >= 1);
    el.box.style.opacity = stage.toFixed(3); el.marks.style.opacity = stage.toFixed(3);
    const railA = ease.inOutSine(clamp01((li - .2) / .8)) * stage;
    el.rail.style.opacity = railA.toFixed(3); el.rail.style.transform = `translateX(${((1 - ease.outCubic(clamp01((li - .2) / .8))) * 24).toFixed(1)}px)`;
    const linkA = railA;
    el.rail.style.visibility = railA > 0 ? '' : 'hidden';
    const scrA = ease.outCubic(clamp01((li - .1) / .9));
    el.scrub.style.transform = `translateY(calc(${((1 - scrA) * 100 + eOut * 100).toFixed(2)}% + ${((1 - scrA) + eOut) * 4}px))`;
    el.scrub.style.visibility = scrA > 0 && eOut < 1 ? '' : 'hidden';
    s.setProperty('--s5h-dock', eIn.toFixed(4));          // hybrid: HUD slides under the lockup over the lead-in
    const ledA = hy.ledgerAlpha(p);                       // the ledgers: map chrome steps back under the veil
    const legA = clamp01((li - .4) / .6) * stage * (1 - ledA);
    el.legend.style.opacity = legA.toFixed(3); el.legend.style.visibility = legA > 0 ? '' : 'hidden';
    el.hud.style.opacity = (stage * (1 - ledA)).toFixed(3); el.hud.style.visibility = stage * (1 - ledA) > 0 ? '' : 'hidden';
    el.marks.style.opacity = (stage * (1 - ledA)).toFixed(3);
    // map + marks
    const cam = mapApi.camAt(p);
    mapApi.drawBase(g.base, cam);
    linkAlpha = linkA * (1 - ledA); drawMarks(t, cam);
    hy.update(p, cam);
    const hour = hourLive;
    el.legend.classList.toggle('hour', hour);
    drawRoaches(t);
    roaches.legend(p);
    hud();
    scrub.update(p);
  }
  // pointer lines: from the narrative card's left edge to what the beat is about on the map (overlay.targets)
  function leaders(g2, cam, A) {
    const an = rail.anchor?.(); if (!an || A * an.alpha <= .01) return;
    const { a, b, t } = model.phase(p), k = a === b || t < .5 ? a : b;
    const tg = hy ? [hy.target(k)].filter(Boolean) : overlay.targets(k);   // hybrid: one leader, to the beat's first label
    const T = tg.map(id => overlay.at(id, cam)).filter(q => q && q.x < an.x - 30 && q.x > 0 && q.y > 0 && q.y < MH);
    if (!T.length) return;
    const fade = a === b ? 1 : Math.abs(t - .5) * 2;                 // lines blink off at the card swap
    g2.save(); g2.globalAlpha = A * an.alpha * fade; g2.strokeStyle = tok('--fg'); g2.fillStyle = tok('--fg'); g2.lineWidth = 1.25;
    const sx = an.x - 18;
    g2.beginPath(); g2.moveTo(an.x, an.y); g2.lineTo(sx, an.y); g2.stroke();
    for (const q of T) {
      g2.beginPath(); g2.moveTo(sx, an.y); g2.lineTo(q.x, q.y); g2.stroke();
      g2.beginPath(); g2.arc(q.x, q.y, 3.5, 0, Math.PI * 2); g2.fill();
    }
    g2.beginPath(); g2.arc(sx, an.y, 2.5, 0, Math.PI * 2); g2.fill();
    g2.restore();
  }
  let hourLive = false, linkAlpha = 0;
  function drawMarks(t, cam = mapApi.camAt(p)) {
    mapApi.marks(g.ov, p, cam);
    hourLive = overlay.draw(g.ov, p, cam, 1, t);
    leaders(g.ov, cam, linkAlpha);
  }
  let hudKey = '';
  function hud() {
    const time = model.dateAt(p), day = model.dayOf(time), iso = new Date(day * 864e5 + model.beats[0].t).toISOString().slice(0, 10);
    const { a, b, t } = model.phase(p), k = Math.max(0, Math.min(model.N - 1, t < .5 ? a : b)), B = model.beats[k];
    const fast = (a === b || t < .5 ? a : b) >= 0 && (a === b || t < .5 ? a : b) < model.N ? B.fast : null;
    // the 20 Jul hour-by-hour: a running clock (5-minute steps) while an hour beat is up or being reached
    const hourOn = [a, b].some(k => model.beats[k]?.kind === 'hour');
    const mins = Math.round(((time - DAY0) % 864e5) / 6e4 / 5) * 5, clock = hourOn ? `${String(Math.floor(mins / 60) % 24).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}` : '';
    const key = iso + '|' + fast + '|' + clock;
    if (key === hudKey) return; hudKey = key;
    el.hudD.innerHTML = `${ddmmyyyy(iso)}${clock ? ` <span class="clk">${clock}</span>` : ''}`;
    el.hudT.innerHTML = `Day ${day}${fast ? ` · <b>Fast day ${fast}</b>` : ''}`;
    el.live.textContent = `${ddmmyyyy(iso)}${clock ? ' ' + clock : ''}, day ${day}${fast ? `, fast day ${fast}` : ''}`;
  }
  return scene;
};

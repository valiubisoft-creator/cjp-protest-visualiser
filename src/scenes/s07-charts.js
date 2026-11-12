// S7a, S7b, S7c · Charts: media engagement (S7 chat, 2026-11-12; anime.js redesign, Vali 2026-11-12).
// Brief: docs/build/scenes/S7.md. One factory, called three times (def.sub = 0, 1, 2); each chart is its own pinned
// 170 vh block on a paper (.reading) stage.
//   ./s07/model.js     the corpus → series, waffle cells, unit marks and callout numbers (pure; one shared model)
//   ./s07/common.js    formatting, spec timings, frame markup, corpus star, tooltip, the scrubbed timeline helpers
//   ./s07/chart-a.js   A · views by upload day: a line that waits, then breaks its own scale
//   ./s07/chart-b.js   B · who carried it: 1,000-cell waffle of all views, by channel
//   ./s07/chart-c.js   C · who filmed it: 1,244 roaches, one per video, by day and source tag
//
// Motion = anime.js v4, scrubbed. Per layout we build ONE paused timeline, 1000 ms long (= p 0 → 1, common.js T):
// 0–200 kicker, title (split into characters) and axes in · 200–700 the chart's own draw-in, callouts counting up
// in step · 700–1000 hold. update(p) calls tl.seek(p × 1000), then the chart redraws from its animated state, so the
// frame is a pure function of p (anime's clock never runs). Reduced motion (M9 wires ctx.reducedMotion, else the
// media query) → p = 1. Idle motion (tick) is a separate, p-independent layer and stops under ?still.
// Data (D11, Vali's one exception to data/story): data/timeline_clips.json, read through the shared loader's cache.
import { splitText, stagger } from 'animejs';
import { load } from '../data/load.js';
import { buildBudget } from '../scroll/budget.js';
import { loadCss } from './s00-hero.js';
import { buildModel } from './s07/model.js';
import { frameHTML, scrubTimeline, fromTo, at, T, S7_CSS } from './s07/common.js';
import { chartA } from './s07/chart-a.js';
import { chartB } from './s07/chart-b.js';
import { chartC } from './s07/chart-c.js';

const CHARTS = [chartA, chartB, chartC];
let shared = null;   // one model for the three scenes
const getModel = data => (shared ??= load('timeline_clips.json').then(f => buildModel(f, data.timeline.nodes)));

export default def => {
  let ctx, chart, el = {}, key = '', lastP = 0, tl = null, counts = [];
  const reduced = () => ctx.reducedMotion ?? matchMedia('(prefers-reduced-motion: reduce)').matches;

  // one paused timeline per layout; every target starts at its `from` (fromTo) so seek() is pure both ways
  function build() {
    tl?.pause();
    tl = scrubTimeline();
    fromTo(tl, el.chars, { opacity: 0, y: '0.45em' }, { opacity: 1, y: '0em' }, T.intro, { duration: 150, delay: stagger(3), ease: 'outExpo' });
    fromTo(tl, [el.kick, el.count], { opacity: 0 }, { opacity: 1 }, T.intro, { duration: 100 });
    fromTo(tl, el.axisText, { opacity: 0 }, { opacity: 1 }, 80, { duration: 120 });
    fromTo(tl, el.note, { opacity: 0 }, { opacity: 1 }, 120, { duration: 80 });
    // callouts: in step with the draw-in; each value counts up (fmt(n) is the final string)
    const n = el.facts.length, cAt = chart.calloutAt || [];
    counts = chart.callouts.map(() => ({ v: 0 }));
    el.facts.forEach((f, i) => {
      const f0 = cAt[i] ?? (i / n) * .8 + .1, pos = at(Math.max(0, Math.min(.82, f0 - .06)));
      fromTo(tl, f, { opacity: 0, y: 14 }, { opacity: 1, y: 0 }, pos, { duration: 70, ease: 'outQuart' });
      const c = chart.callouts[i];
      if (c.n != null) tl.add(counts[i], { v: [0, c.n], duration: 60, ease: 'outExpo' }, pos);
    });
    chart.build(tl);
  }

  function relayout() {
    const w = el.plot.clientWidth, h = el.plot.clientHeight;
    if (!w || !h) return false;
    const k = `${w}x${h}`;
    if (k !== key) { key = k; chart.layout(w, h); build(); }
    return true;
  }

  function render(p) {
    if (!relayout()) return;
    tl.seek(p * T.len);
    counts.forEach((c, i) => {
      const co = chart.callouts[i];
      if (co.n != null) el.values[i].textContent = co.fmt(c.v);
    });
    chart.draw(ctx.clock.t);
  }

  const scene = {
    id: def.id,
    async init(c) {
      ctx = c; loadCss(S7_CSS);
      const model = await getModel(c.data);
      chart = CHARTS[def.sub](model, c.data);
      const charts = (c.controller?.budget ?? buildBudget()).filter(d => d.stage === 'chart');
      const r = c.root;
      r.classList.add('s7', 'reading', `s7-${'abc'[def.sub]}`);
      r.setAttribute('aria-label', chart.title);
      r.innerHTML = frameHTML({ sub: def.sub, index: charts.findIndex(d => d.id === def.id) + 1, total: charts.length, ...chart });
      const q = s => r.querySelector(s);
      el = { head: q('.s7-head'), title: q('.s7-title'), kick: q('.s7-kick'), count: q('.s7-count'), plot: q('.s7-plot'), cell: q('.s7-cell'),
        tip: q('.s7-tip'), note: q('.s7-note'), facts: [...r.querySelectorAll('.s7-fact')], values: [...r.querySelectorAll('.s7-fact .v')],
        axisText: [...r.querySelectorAll('.s7-ylab, .s7-legend')] };
      await Promise.all([
        document.fonts.load('48px "Protest Revolution"', chart.title),
        document.fonts.load('900 40px "Public Sans"'), document.fonts.load('400 15px "Redaction"'),
      ]).catch(() => {});
      el.chars = splitText(el.title, { chars: true }).chars;
      chart.mount(el.plot, el.tip, el.cell, c);
      document.fonts?.ready.then(() => { key = ''; if (!r.hidden) render(lastP); });
    },
    enter() {},
    update(p) { lastP = reduced() ? 1 : p; render(lastP); },
    tick(t) { if (!ctx.clock.still && chart?.idle && !ctx.root.hidden && key) chart.draw(t); },
    exit() { el.tip.hidden = true; },
    resize() { key = ''; if (chart && !ctx.root.hidden) render(lastP); },
  };
  return scene;
};

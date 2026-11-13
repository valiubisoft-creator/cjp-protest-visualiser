// v3 boot (F3, 2026-11-12): load data → build the budget → load scene modules → start the one controller.
// URL params: ?debug[=tr|tl|br|bl]  HUD + console enter/exit log
//             ?p=S4:0.6               deep-link to an exact frame (also S10:top, S7:0.5 → S7a)
//             ?still                  freeze the idle clock (t = 0) for reproducible QA shots
//             ?trace                  record every (y, live scenes, p) in window.__v3.trace for the harness
import { loadStory } from './data/load.js';
import { buildBudget } from './scroll/budget.js';
import { createController } from './scroll/controller.js';
import { createSwarm } from './roach/swarm.js';
import { mountProgress } from './lib/progress.js';
import { gapMap } from './scroll/gap.js';

const params = new URLSearchParams(location.search);
history.scrollRestoration = 'manual';

const data = await loadStory();
const budget = buildBudget({ quoteCount: data.quotes.quotes.filter(q => q.selected).length });

// one import per scene file (S7 and S8 share a file across their sub-scenes)
const files = [...new Set(budget.map(d => d.file))];
const mods = Object.fromEntries(await Promise.all(files.map(async f => [f, (await import(`./scenes/${f}`)).default])));
const scenes = budget.map(def => {
  const m = mods[def.file];
  const s = typeof m === 'function' ? m(def) : m;
  s.id ??= def.id;
  if (def.gap) {                                    // title gap (review 3): the scene sees its own p, held at t over the gap
    const { inner } = gapMap(def), up = s.update.bind(s);
    s.update = p => up(inner(p));
  }
  return s;
});

await document.fonts.ready;
const controller = createController({
  budget, scenes, params,
  mount: document.getElementById('piece'),
  shared: { data, swarm: createSwarm() },   // swarm: the prologue's shared pool (S0–S4); other scenes ignore it
});
await controller.start();
window.__v3 = controller;
mountProgress(controller);   // the reading-progress bar (Vali 2026-11-13)   // QA harness and console: __v3.state(), __v3.seek('S4', .6), __v3.yFor(…), __v3.trace

// deep link: ?p=S4:0.6
const deep = params.get('p');
if (deep) {
  const [id, p] = deep.split(':');
  try { controller.seek(id, p === 'top' ? 'top' : +p); } catch (e) { console.error(e); }
}
document.body.dataset.ready = '1';

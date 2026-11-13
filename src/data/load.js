// Data loading: fetch + cache data/story/*.json and data/map/base.json (F3).
// URLs resolve from this module, so the same loader works from /v3/, /design/ and (later) the root index.html.
// Scenes read ONLY these files (CLAUDE.md "Facts"); never the PDF.
const DATA = new URL('../../data/', import.meta.url);
const cache = {};

export function load(name) {
  if (!cache[name]) cache[name] = fetch(new URL(name, DATA)).then(r => { if (!r.ok) throw new Error(`data/${name}: ${r.status}`); return r.json(); });
  return cache[name];
}
export const story = n => load(`story/${n}.json`);

// every story file, keyed by name (epilogue_october → epilogue)
export const STORY_FILES = ['meta', 'timeline', 'metrics', 'quotes', 'sites', 'sources', 'methodology', 'epilogue_october'];
// drafts that carry new_sources, merged in this order (sansad then apparatus first: the numbering S5/S7d established)
export const EXTRA_FILES = ['sansad_chalo', 'apparatus', 'withheld', 'october_counts', 'voter_roll', 'neet', 'detentions'];
export async function loadStory() {
  const all = await Promise.all(STORY_FILES.map(story));
  const d = Object.fromEntries(STORY_FILES.map((n, i) => [n === 'epilogue_october' ? 'epilogue' : n, all[i]]));
  // lookups every scene wants; built once here so scenes don't each rebuild them
  // hybrid (build/hybrid, 2026-11-13): the draft files' new_sources join the ledger HERE, once, in a fixed order, so
  // every * resolves and footer numbers are stable whichever scene loads first (S5/S7d's own merges become no-ops)
  const extra = await Promise.all(EXTRA_FILES.map(n => story(n).catch(() => null)));
  d.extra = Object.fromEntries(EXTRA_FILES.map((n, i) => [n, extra[i]]));
  for (const f of extra) for (const ns of f?.new_sources || []) if (!d.sources.sources.some(s => s.id === ns.id)) d.sources.sources.push(ns);
  d.byId = {
    node: Object.fromEntries(d.timeline.nodes.map(n => [n.id, n])),
    site: Object.fromEntries(d.sites.sites.map(s => [s.id, s])),
    source: Object.fromEntries(d.sources.sources.map((s, i) => [s.id, { ...s, n: i + 1 }])),  // n = footer number
  };
  return d;
}

// the base map is ~540 KB: loaded lazily by the S5 stage, not at boot
export const baseMap = () => load('map/base.json');

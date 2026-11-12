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
export async function loadStory() {
  const all = await Promise.all(STORY_FILES.map(story));
  const d = Object.fromEntries(STORY_FILES.map((n, i) => [n === 'epilogue_october' ? 'epilogue' : n, all[i]]));
  // lookups every scene wants; built once here so scenes don't each rebuild them
  d.byId = {
    node: Object.fromEntries(d.timeline.nodes.map(n => [n.id, n])),
    site: Object.fromEntries(d.sites.sites.map(s => [s.id, s])),
    source: Object.fromEntries(d.sources.sources.map((s, i) => [s.id, { ...s, n: i + 1 }])),  // n = footer number
  };
  return d;
}

// the base map is ~540 KB: loaded lazily by the S5 stage, not at boot
export const baseMap = () => load('map/base.json');

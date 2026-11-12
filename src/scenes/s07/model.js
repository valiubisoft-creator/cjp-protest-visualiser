// S7 · the chart model (S7 chat, 2026-11-12). Pure: corpus in, chart series and callout numbers out. No DOM, so
// node can import it to verify the numbers on screen (see the S7 report).
//
// Corpus (D11): data/timeline_clips.json, 1,244 clips, machine-tagged, unreviewed, collected 2026-07-21T18:54:05Z.
// Column mapping
//   A  line      x = upload day (clip.date → IST calendar day)   y = Σ clip.views that day (views at collection)
//   B  waffle    1,000 cells = all views (1 cell = 0.1%); groups = the 10 most-viewed clip.channel values + the rest;
//                cells per group by largest remainder of Σ clip.views; the party channel (0.63 cell) drawn to scale
//   C  units     one mark per clip (1,244), grouped by upload day (IST; days with none skipped), stacked in
//                columns of R per day block, coloured by clip.source (news / citizen / party, bottom → top)
// Days with no uploads are real zeros (A) and flat steps (C): the axis is every calendar day, first to last upload.

export const IST_MS = 5.5 * 36e5;
export const DAY_MS = 864e5;
export const SOURCES = ['news', 'citizen', 'party'];     // clip.source, the corpus's own machine tag; stack order bottom → top

export const istDay = iso => new Date(Date.parse(iso) + IST_MS).toISOString().slice(0, 10);
const dayT = d => Date.parse(d + 'T00:00:00Z');
const isoOf = t => new Date(t).toISOString().slice(0, 10);

export function buildModel(clipsFile, nodes = []) {
  const clips = clipsFile.clips;
  const total = { clips: clips.length, views: 0 };
  const byDay = new Map(), byCh = new Map();
  for (const k of clips) {
    const d = istDay(k.date), v = k.views || 0;
    total.views += v;
    const o = byDay.get(d) || { views: 0, n: 0, news: 0, citizen: 0, party: 0 };
    o.views += v; o.n++; o[k.source] = (o[k.source] || 0) + 1; byDay.set(d, o);
    const c = byCh.get(k.channel) || { name: k.channel, views: 0, n: 0, source: k.source };
    c.views += v; c.n++; byCh.set(k.channel, c);
  }
  const days = [...byDay.keys()].sort();
  const t0 = dayT(days[0]), t1 = dayT(days.at(-1));

  // A + C share one daily axis
  const series = [];
  const cum = { news: 0, citizen: 0, party: 0 };
  for (let t = t0; t <= t1; t += DAY_MS) {
    const d = isoOf(t), o = byDay.get(d) || { views: 0, n: 0, news: 0, citizen: 0, party: 0 };
    for (const s of SOURCES) cum[s] += o[s];
    series.push({ d, t, views: o.views, n: o.n, day: { news: o.news, citizen: o.citizen, party: o.party }, cum: { ...cum } });
  }
  const peak = series.reduce((a, b) => (b.views > a.views ? b : a));

  // the crackdown window: the detention node's date to the last corpus day (18–21 Jul), from timeline.json
  const det = nodes.find(n => n.id === 'detention');
  const winFrom = det ? det.date : null;
  const inWin = s => winFrom && s.d >= winFrom;
  const win = series.filter(inWin);
  const before = series.filter(s => !inWin(s));
  const sum = (a, f) => a.reduce((x, s) => x + f(s), 0);
  const window = winFrom && {
    from: winFrom, to: series.at(-1).d, days: win.length,
    views: sum(win, s => s.views), clips: sum(win, s => s.n),
    viewsShare: sum(win, s => s.views) / total.views, clipsShare: sum(win, s => s.n) / total.clips,
    before: { views: sum(before, s => s.views), clips: sum(before, s => s.n), party: sum(before, s => s.day.party) },
  };

  // B
  const channels = [...byCh.values()].sort((a, b) => b.views - a.views || b.n - a.n || a.name.localeCompare(b.name));
  const top = channels[0];
  const top10 = channels.slice(0, 10);
  const party = channels.filter(c => c.source === 'party');

  // B · waffle: 1,000 cells, largest-remainder rounding (the counts on screen stay exact; cells are the picture)
  const CELLS = 1000;
  const groups = [...top10.map(c => ({ name: c.name, views: c.views, n: c.n, channels: 1 })),
    { name: 'other', other: true, views: total.views - sum(top10, c => c.views), n: total.clips - sum(top10, c => c.n), channels: channels.length - top10.length }];
  for (const g of groups) { g.exact = g.views / total.views * CELLS; g.cells = Math.floor(g.exact); }
  let left = CELLS - groups.reduce((a, g) => a + g.cells, 0);
  for (const g of [...groups].sort((a, b) => (b.exact % 1) - (a.exact % 1))) { if (left-- <= 0) break; g.cells++; }
  const waffle = { cells: CELLS, perCell: total.views / CELLS, groups };

  // C · units: one per clip, in day order, news → citizen → party within a day
  const units = [], blocks = [];
  for (const s of series) {
    if (!s.n) continue;
    const b = { d: s.d, t: s.t, n: s.n, day: s.day, from: units.length };
    for (const src of SOURCES) for (let k = 0; k < s.day[src]; k++) units.push({ d: s.d, src, k: units.length - b.from });
    blocks.push(b);
  }

  const bySource = Object.fromEntries(SOURCES.map(s => [s, series.at(-1).cum[s]]));

  return {
    total, series, peak, window, bySource,
    first: series[0], last: series.at(-1),
    channels, top, top10: { list: top10, views: sum(top10, c => c.views), share: sum(top10, c => c.views) / total.views },
    party, waffle, units, blocks,
    nodes: nodes.filter(n => n.date >= series[0].d && n.date <= series.at(-1).d).map(n => ({ id: n.id, d: n.date, t: dayT(n.date), label: n.label })),
  };
}

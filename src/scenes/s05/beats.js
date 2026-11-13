// S5 beat model (S5 chat, 2026-11-12): the one timeline that the map, roaches, rail, scrubber and HUD all read.
// Pure: built once from data/story + the S5 budget entry; every query is a function of p.
//
// Beats. Each S5 node segment (budget `segments`) is split into beats:
//   - the node's own beat, merged with its first sub-beat when they share the node's date (2a, Day 1, 18 Jul, 20 Jul);
//   - then every sub-beat that is ON THIS MAP (non-empty site_ids) and dated on or after the node, in date order.
//   Sub-beats with no site_ids (pushback, Pune, Hyderabad, the re-test) are not map beats.
//   Slot weights: the node's own beat 2, each further sub-beat 1 (the node beat carries the card with media + people).
// Within a beat slot (spec "within each node", applied per beat): in 0–0.20, hold 0.20–0.85, out 0.85–1.
//   The out of beat k and the in of beat k+1 form ONE transition (camera, roaches, date and card all move together).
//   The first beat's in is the transition from the lead-in; the last beat holds until the lead-out.
// Time (spec "time mapping", piecewise-linear): during a hold the date is the beat's date; across a transition it
//   runs linearly from one beat's date to the next. So the scrubber handle follows real dates and the HUD counts days.
import { segmentP } from '../../scroll/budget.js';
import { dayN, DAY0 } from '../../lib/dates.js';
import { showable } from '../../lib/text.js';

export const IN = .2, OUT = .85;
const ms = iso => Date.parse(iso + 'T00:00:00Z');
export const DAY_MS = 864e5;
// rail facts: showable and not web-unconfirmed (the storyboard's `featured` rule)
export const featured = f => showable(f) && f.web_check !== 'unconfirmed';
const CROWD_UNIT = /^(crowd|marchers|camping)/i;

// extra (S5 chat, Vali 2026-11-12: narrative body copy, more imagery, the 20 Jul hour-by-hour):
//   narrative  data/story/narrative.json   { beats: { <beat or step id>: [paragraph, …] } }  (star tokens {*ids|claimant})
//   imagery    data/story/imagery.json     { by_beat: { <id>: [media…] }, sansad_chalo: [media with "time"] }
//   sansad     data/story/sansad_chalo.json { steps: [{ id, time, title, summary_facts, map, … }] }  → hour beats after pa_0720
// Each is optional: a missing file just means no copy / no extra media / no hour beats.
export const WEIGHT = { main: 2, sub: 1, hour: 1.25 };   // share of the node segment per beat
export function buildModel(def, data, extra = {}) {
  const tiers = Object.fromEntries(data.methodology.crowd_tiers.tiers.map(t => [t.tier, t]));
  const segIds = new Set(def.segments.map(([id]) => id));
  const nodes = data.timeline.nodes.filter(n => segIds.has(n.id));       // victory has no segment: never in S5
  const copyOf = id => extra.narrative?.beats?.[id] || [];
  const steps = extra.sansad?.steps || [], hourMedia = extra.imagery?.sansad_chalo || [];
  const hm = s => { const [h, m] = String(s || '0:0').split(':').map(Number); return (h * 60 + (m || 0)) * 6e4; };
  const mediaOf = (id, own) => {                          // the beat's own media first, then imagery.json picks (deduped)
    const out = [...own], seen = new Set(own.map(m => m.src));
    for (const m of extra.imagery?.by_beat?.[id] || []) {
      const i = out.findIndex(o => o.src === m.original);
      if (i >= 0) { out[i] = { ...out[i], ...m }; seen.add(m.src); continue; }   // web-sized copy of an image we already use
      if (!seen.has(m.src)) { out.push(m); seen.add(m.src); }
    }
    return out;
  };
  const beats = [];
  let tier = null, tierFact = null;
  for (const node of nodes) {
    const subs = (node.sub_beats || []).map((b, i) => ({ b, i }))
      .filter(({ b }) => b.site_ids?.length && b.date >= node.date)
      .sort((x, y) => x.b.date < y.b.date ? -1 : x.b.date > y.b.date ? 1 : x.i - y.i).map(x => x.b);
    const list = [{ node, sub: subs[0]?.date === node.date ? subs.shift() : null, kind: 'main' }, ...subs.map(sub => ({ node, sub, kind: 'sub' }))];
    // the 20 Jul hour-by-hour: its steps follow the 20 Jul beat
    const j = list.findIndex(o => o.sub?.id === 'pa_0720');
    if (j >= 0 && steps.length) list.splice(j + 1, 0, ...steps.map((st, k) => ({ node, sub: list[j].sub, kind: 'hour', step: st, next: steps[k + 1] })));
    // hybrid (build/hybrid, 2026-11-13): the chapter's own beat list replaces the node's (filter + order + title and
    // ledger pseudo-beats), with explicit vh weights; entries: [id, vh, opts] (s05/hybrid.js HY)
    let use = list.map(o => ({ o, w: WEIGHT[o.kind], opt: {} }));
    if (extra.hybrid) {
      const H = extra.hybrid[node.id] || [], byId = Object.fromEntries(list.map(o => [o.step ? o.step.id : o.sub?.id || node.id, o]));
      use = H.map(([id, w, opt = {}], j) => {
        const [kind, arg] = id.split(':');
        if (kind === 'title') { const nxt = H.slice(j + 1).find(([x]) => !x.startsWith('title:'))?.[0] || ''; const src = byId[nxt] || byId[nxt.split(':')[0] === 'ledger' ? opt.camera : nxt]; return { o: { ...src, kind: 'title' }, w, opt: { ...opt, id, chapter: arg } }; }
        if (kind === 'ledger') return { o: { ...byId[opt.camera], kind: 'ledger' }, w, opt: { ...opt, id, ledger: +arg } };
        if (!byId[id]) throw new Error(`[S5 hybrid] no beat ${id} under ${node.id}`);
        return { o: byId[id], w, opt: { ...opt, id } };
      });
    }
    const a = segmentP(def, node.id, 0), b = segmentP(def, node.id, 1);
    const W = use.reduce((s, u) => s + u.w, 0);
    let acc = 0;
    for (const { o, w, opt } of use) {
      const sa = a + (b - a) * acc / W, sb = a + (b - a) * (acc + w) / W; acc += w;
      const main = o.kind === 'main', st = o.step;
      const src = o.sub || node;
      const own = st ? null : o.sub ? o.sub.crowd_tier : node.crowd_tier;
      const facts = st ? st.summary_facts || [] : [...(o.sub?.facts || []), ...(main ? node.facts : [])];
      if (own != null) { tier = own; tierFact = facts.find(f => showable(f) && CROWD_UNIT.test(f.unit || '')) || tierFact; }
      const date = src.date, id = st ? st.id : o.sub?.id || node.id;
      const media = st ? hourMedia.filter(m => m.time && hm(m.time) >= hm(st.time) && (!o.next || hm(m.time) < hm(o.next.time)))
        : mediaOf(id, [...(o.sub?.media || []), ...(main ? node.media : [])]);
      beats.push({
        i: beats.length, id: opt.id || id, node, sub: o.sub, main, kind: o.kind, step: st || null, hy: extra.hybrid ? opt : null,
        title: st ? st.title : o.sub && !main ? o.sub.title : (o.sub?.title || node.title),
        date, time: st?.time || null, t: ms(date) + (st ? hm(st.time) : 0), day: dayN(date),
        fast: o.sub ? o.sub.hunger_strike_day ?? null : node.hunger_strike_day ?? null,
        sites: opt.sites || (st?.map?.focus_sites?.length ? st.map.focus_sites : o.sub?.site_ids?.length ? o.sub.site_ids : node.site_ids) || [],
        labelSites: opt.labels || null,                        // hybrid: ≤ 3 labels (Vali 2026-11-13); null = all sites
        tier, tierOwn: own != null, tierFact, tierInfo: tiers[tier], count: tiers[tier]?.roaches ?? 0,
        facts, media, copy: copyOf(id), people: main ? node.people || [] : [],
        a: sa, b: sb, ha: sa + (sb - sa) * IN, hb: sb - (sb - sa) * (1 - OUT),
      });
    }
  }
  const N = beats.length;
  const leadIn = segmentP(def, def.segments[1][0], 0), leadOut = segmentP(def, def.segments.at(-1)[0], 0);
  beats[N - 1].hb = leadOut;                       // the last beat holds until the lead-out
  const t0 = ms(nodes[0].date_window?.start || nodes[0].date), t1 = beats[N - 1].t;

  // phase(p) → { a, b, t }: beat indices (−1 = lead-in, N = lead-out); a === b in a hold (t = 0)
  function phase(p) {
    if (p < beats[0].ha) return p < leadIn ? { a: -1, b: -1, t: 0 } : { a: -1, b: 0, t: (p - leadIn) / (beats[0].ha - leadIn) };
    for (let k = 0; k < N; k++) {
      const B = beats[k];
      if (p < B.hb) return { a: k, b: k, t: 0 };
      if (k < N - 1 && p < beats[k + 1].ha) return { a: k, b: k + 1, t: (p - B.hb) / (beats[k + 1].ha - B.hb) };
    }
    return { a: N - 1, b: N, t: Math.min(1, (p - leadOut) / (1 - leadOut)) };
  }
  const tOf = k => beats[Math.max(0, Math.min(N - 1, k))].t;
  // continuous date (ms, UTC midnight-based) at p
  function dateAt(p) { const { a, b, t } = phase(p); return tOf(a) + (tOf(b) - tOf(a)) * t; }
  // inverse for the scrubber: a beat's exact date → the middle of its hold; between dates → linear in the transition
  function pAt(time) {
    if (time <= beats[0].t) return (beats[0].ha + beats[0].hb) / 2;
    for (let k = 0; k < N; k++) {
      const B = beats[k], C = beats[k + 1];
      if (time === B.t) return (B.ha + B.hb) / 2;
      if (C && time < C.t && time > B.t) return B.hb + (time - B.t) / (C.t - B.t) * (C.ha - B.hb);
    }
    return (beats[N - 1].ha + beats[N - 1].hb) / 2;
  }
  // lead-in / lead-out progress (0 → 1), for the stage build-up and dissolve
  const lead = p => ({ in: Math.min(1, Math.max(0, p / leadIn)), out: Math.min(1, Math.max(0, (p - leadOut) / (1 - leadOut))) });
  const nodeMarks = nodes.map(n => { const B = beats.find(x => x.node === n && x.main) || beats.find(x => x.node === n && x.kind !== 'title'); return { id: n.id, label: n.label, title: n.title, date: n.date, t: ms(n.date), day: dayN(n.date), p: (B.ha + B.hb) / 2, beat: B.i }; });
  // slots by content (S5 chat): within each node segment, split by the rail's measured section heights (+ gap), with a
  // floor so a short beat still gets a map moment. Called by the scene on resize; pure for a given viewport.
  function reslot(heights, { gap = 96, floor = 380 } = {}) {
    if (!heights?.length || extra.hybrid) return;          // hybrid: explicit vh slots, no content re-slotting
    for (const node of nodes) {
      const ks = beats.filter(b => b.node === node), a = segmentP(def, node.id, 0), b = segmentP(def, node.id, 1);
      const w = ks.map(B => Math.max(floor, (heights[B.i] || 0) + gap)), W = w.reduce((s, x) => s + x, 0);
      let acc = 0;
      ks.forEach((B, j) => { B.a = a + (b - a) * acc / W; acc += w[j]; B.b = a + (b - a) * acc / W; B.ha = B.a + (B.b - B.a) * IN; B.hb = B.b - (B.b - B.a) * (1 - OUT); });
    }
    beats[N - 1].hb = leadOut;
    for (const m of nodeMarks) { const B = beats[m.beat]; m.p = (B.ha + B.hb) / 2; }
  }
  return { reslot, beats, N, nodes, nodeMarks, tiers, phase, dateAt, pAt, lead, leadIn, leadOut, axis: { t0, t1 }, dayOf: t => Math.floor((t - DAY0) / DAY_MS + 1e-9) };
}

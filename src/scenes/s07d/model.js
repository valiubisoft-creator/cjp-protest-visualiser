// S7d · The apparatus: the ledger (data/story/apparatus.json) → groups, actors, showable actions and the scroll plan.
// Pure; no DOM. Every on-screen word about an actor comes from apparatus.json (labels, dates, text, claimant,
// attribution, status, effect). Facts with hold or status 'unverified' are dropped here (showable()).
import { showable } from '../../lib/text.js';
import { fmtDate } from '../../lib/dates.js';

// edge kind from the actor's `kind`: restriction → red solid, court → dashed, anything else (e.g. "trigger") → neutral
export const edgeKind = k => (k === 'restriction' ? 'r' : k === 'court' ? 'c' : 'n');

// "20 Jul", "20 Jul · 13:00", "18–22 Jul", "30 Jun – 2 Jul"
export function whenText(f) {
  if (!f.date) return '';
  let s = fmtDate(f.date);
  if (f.date_end && f.date_end !== f.date) {
    const [a, b] = [f.date.slice(0, 7), f.date_end.slice(0, 7)];
    s = a === b ? `${+f.date.slice(8)}–${fmtDate(f.date_end)}` : `${s} – ${fmtDate(f.date_end)}`;
  }
  return f.time ? `${s} · ${f.time}` : s;
}

// p plan (300 vh): 0–0.06 hub · 0.06–0.27 spokes draw out group by group, nodes follow · 0.27–WALK0 whole network,
// roster panel · WALK0–WALK1 the walk, one actor at a time (slot length ∝ 1 + 0.4 × actions, so long records get more
// scroll) · WALK1–1 hold: whole network, roster + "select" hint.
export const P = { hub: [0, .06], draw: [.06, .27], walk: [.31, .95] };

export function buildModel(app) {
  const groups = (app.groups || []).map((g, i) => ({ ...g, i, actors: [] }));
  const byGroup = Object.fromEntries(groups.map(g => [g.id, g]));
  const actors = [], hidden = [];
  for (const a of app.actors || []) {
    const acts = (a.actions || []).filter(showable);
    for (const f of a.actions || []) if (!showable(f)) hidden.push({ actor: a.id, why: f.hold ? 'hold' : f.status, text: f.text });
    let g = byGroup[a.group];
    if (!g) { g = { id: a.group, label: a.group, i: groups.length, actors: [] }; groups.push(g); byGroup[a.group] = g; }
    if (!acts.length) { hidden.push({ actor: a.id, why: 'no showable actions' }); continue; }
    const actor = { id: a.id, label: a.label, kind: a.kind, edge: edgeKind(a.kind), group: g, acts };
    g.actors.push(actor);
  }
  // draw order = group order, then data order inside a group
  for (const g of groups) for (const a of g.actors) { a.i = actors.length; actors.push(a); }
  const live = groups.filter(g => g.actors.length);

  // walk slots
  const w = actors.map(a => 1 + .4 * a.acts.length), W = w.reduce((s, x) => s + x, 0);
  const [w0, w1] = P.walk;
  let acc = w0;
  const slots = actors.map((a, i) => { const s = { a: acc, b: acc + (w1 - w0) * w[i] / W }; acc = s.b; return s; });

  // draw schedule per group (fractions of p)
  const [d0, d1] = P.draw, gl = (d1 - d0) / Math.max(1, live.length);
  live.forEach((g, k) => { g.draw = [d0 + k * gl, d0 + (k + 1) * gl]; });

  return { hub: app.hub || { id: 'cjp', label: '' }, groups: live, actors, slots, hidden, nActs: actors.reduce((s, a) => s + a.acts.length, 0) };
}

// which actor the walk shows at p (or -1 outside the walk), and the local slot progress u ∈ [0, 1)
export function walkAt(m, p) {
  if (p < P.walk[0] || p >= P.walk[1]) return { k: -1, u: 0 };
  for (let k = 0; k < m.slots.length; k++) { const s = m.slots[k]; if (p < s.b) return { k, u: (p - s.a) / (s.b - s.a) }; }
  return { k: -1, u: 0 };
}

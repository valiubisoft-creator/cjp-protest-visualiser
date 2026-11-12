// Scroll budget: scene order and lengths. THE single source of truth (F3, 2026-11-12).
// Change lengths here only, and record the change in docs/build/STATUS.md ("Scroll budget").
// 2026-11-12 (Vali, prologue chat): S3.5 160 → 240 vh (more scroll before the minister's claim); S3 180 → 260 vh
// (the sign-ups figure stays up longer after the swarm is full).
//
// len   scroll distance in vh (percent of viewport height) over which the scene's p runs 0 → 1.
//       'auto' = the scene's own content height (flow scenes only).
// block consecutive scenes with the same block share one pinned (sticky) viewport. A block's section is
//       Σlen + 100vh tall, so it is pinned for exactly Σlen and then scrolls away over 100vh.
//       null = a flow scene: not pinned, scrolls like a normal page section.
// stage within a block, scenes with the same stage share one stage layer (the prologue's canvas stack,
//       the map stage, the finale stage). Stages in one block hand over in place, with no slide:
//       S4 p 1 must look exactly like S5 p 0, and S5 p 1 like S6 p 0.
// file  the scene module in src/scenes/.
// segments (S5 only) named sub-ranges in vh, in order; they must sum to len. Node ids match timeline.json.

export const VH = 100;

export function buildBudget({ quoteCount = 3 } = {}) {
  const quoteIds = Array.from({ length: quoteCount }, (_, i) => `S8${String.fromCharCode(97 + i)}`); // S8a, S8b, …
  return [
    // ── main block: prologue → map → finale, one sticky viewport, stages hand over in place ──
    { id: 'S0',   name: 'Hero: the swarm and the glitch word', len: 80,  block: 'main', stage: 'prologue', file: 's00-hero.js' },
    { id: 'S1',   name: 'The CJI quote and the click',         len: 150, block: 'main', stage: 'prologue', file: 's01-quote.js' },
    { id: 'S2',   name: 'Collapse and spawn',                  len: 60,  block: 'main', stage: 'prologue', file: 's02-spawn.js', timed: true },
    { id: 'S3',   name: 'Multiply',                            len: 260, block: 'main', stage: 'prologue', file: 's03-multiply.js' },
    { id: 'S3.5', name: 'The claim and the correction',        len: 240, block: 'main', stage: 'prologue', file: 's03-5-claim.js' },
    { id: 'S4',   name: 'The date on the skeleton',            len: 180, block: 'main', stage: 'prologue', file: 's04-date.js' },
    { id: 'S5',   name: 'Map stage: day by day',               len: 2070, block: 'main', stage: 'map',      file: 's05-map.js',
      // spec §6 880vh minus the 70vh Victory node (Vali, 2026-11-12: Victory lives only in S6) = 810; then the S5 chat
      // (Vali 2026-11-12: narrative body copy + the 20 Jul hour-by-hour) sized each node to its rail copy at ~1.25×
      // page-scroll reading pace: protest_arrest holds the ten hour beats of 20 Jul (~770 vh of its 1200)
      segments: [['lead_in', 60], ['start', 160], ['protest', 180], ['wangchuk', 240], ['detention', 170], ['protest_arrest', 1200], ['lead_out', 60]] },
    { id: 'S6',   name: 'Finale: the date returns, Victory',  len: 260, block: 'main', stage: 'finale',   file: 's06-finale.js' },
    // ── reading and charts ──
    { id: 'S6.5', name: 'October epilogue',                    len: 'auto', block: null, file: 's06-5-epilogue.js' },
    { id: 'S7a',  name: 'Chart A: views over time',            len: 170, block: 'S7a', stage: 'chart', file: 's07-charts.js', sub: 0 },
    { id: 'S7b',  name: 'Chart B: channels',                   len: 170, block: 'S7b', stage: 'chart', file: 's07-charts.js', sub: 1 },
    { id: 'S7c',  name: 'Chart C: source type per day',        len: 170, block: 'S7c', stage: 'chart', file: 's07-charts.js', sub: 2 },
    // one 100vh scene per selected quote (quotes.json `selected: true`), crossfading in one pinned stage
    ...quoteIds.map((id, i) => ({ id, name: `Quote ${i + 1} of ${quoteCount}`, len: 100, block: 'S8', stage: 'quotes', file: 's08-quotes.js', sub: i })),
    { id: 'S9',   name: 'Follow and share',                    len: 100, block: null, file: 's09-cta.js' },
    { id: 'S10',  name: 'Credit, methodology, disclaimer',     len: 'auto', block: null, file: 's10-footer.js' },
  ];
}

// group aliases for deep links: ?p=S7:0.5 → S7a, ?p=S8:0.5 → S8a
export const ALIAS = { S7: 'S7a', S8: 'S8a' };

// S5 helpers: p ↔ (segment, local p). Pure; S5a/S5b/S5c use these instead of hard-coding vh.
export function segmentAt(def, p) {
  let acc = 0;
  for (const [id, len] of def.segments) {
    const a = acc / def.len, b = (acc + len) / def.len;
    if (p < b || id === def.segments.at(-1)[0]) return { id, p: Math.min(1, Math.max(0, (p - a) / (b - a))), a, b };
    acc += len;
  }
}
export function segmentP(def, id, local = 0) {
  let acc = 0;
  for (const [sid, len] of def.segments) { if (sid === id) return (acc + len * local) / def.len; acc += len; }
  throw new Error(`no segment ${id} in ${def.id}`);
}

// Scroll budget: scene order and lengths. THE single source of truth (F3, 2026-11-12).
// Change lengths here only, and record the change in docs/build/STATUS.md ("Scroll budget").
// 2026-11-13 (Vali, hybrid Gate 0 sign-off): the hybrid running order: NEET + HELD in the prologue stage, S5 1,370,
//   WATCH / OCT / ROLL / CAGE / CLOSE added, S6.5 and S7a–d out of the flow (files kept). See docs/build/hybrid/GATE0.md.
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
    // ── hybrid (build/hybrid, Vali 2026-11-13): NEET and Withheld join the prologue stage; both start and end on
    //    S3.5's last frame (claim.poses(1, t)), so S3.5 → NEET → HELD → S4 hand over in place ──
    { id: 'NEET', name: 'The grievance: the NEET leak',         len: 200, block: 'main', stage: 'prologue', file: 'h-neet.js' },
    { id: 'HELD', name: 'Withheld: blocked 48 days, back in hours', len: 240, block: 'main', stage: 'prologue', file: 'h-held.js' },
    { id: 'S4',   name: 'The date on the skeleton',            len: 180, block: 'main', stage: 'prologue', file: 's04-date.js' },
    // hybrid S5 (Vali 2026-11-13, Gate 0): street cut to four beats + chapter titles, 20 July cut to three hours + 23 Jul,
    // the three ledgers on the dimmed map. Was 2,070 vh. Beat slots inside each node segment: s05/hybrid.js
    { id: 'S5',   name: 'Map stage: street, 20 July, ledgers', len: 1370, block: 'main', stage: 'map',      file: 's05-map.js',
      segments: [['lead_in', 60], ['start', 140], ['protest', 90], ['wangchuk', 90], ['detention', 90], ['protest_arrest', 840], ['lead_out', 60]] },
    { id: 'S6',   name: 'Finale: the date returns, Victory',  len: 260, block: 'main', stage: 'finale',   file: 's06-finale.js' },
    // ── hybrid second act (S6.5, S7a–c and the S7d spokes leave the flow; their files stay) ──
    { id: 'WATCH', name: 'The country watched: 1,000-dot screen', len: 260, block: 'WATCH', stage: 'watch', file: 'h-watch.js' },
    { id: 'OCT',   name: 'October: count them one by one',     len: 500, block: 'OCT',   stage: 'oct',   file: 'h-oct.js' },
    { id: 'ROLL',  name: 'Why they marched: the voter roll',   len: 380, block: 'ROLL',  stage: 'roll',  file: 'h-roll.js' },
    { id: 'CAGE',  name: 'The apparatus: the cage',            len: 340, block: 'CAGE',  stage: 'cage',  file: 'h-cage.js' },
    // one 100vh scene per selected quote (quotes.json `selected: true`), crossfading in one pinned stage
    // Vali 2026-11-12: Ambedkar only, typed out like a typewriter, so each quote scene gets 160 vh (was 100)
    ...quoteIds.map((id, i) => ({ id, name: `Quote ${i + 1} of ${quoteCount}`, len: 160, block: 'S8', stage: 'quotes', file: 's08-quotes.js', sub: i })),
    // Vali 2026-11-13: the closing line on its own scene, not inside the footer
    { id: 'CLOSE', name: 'The closing line',                   len: 140, block: 'CLOSE', stage: 'close', file: 'h-close.js' },
    { id: 'S9',   name: 'Follow and share',                    len: 100, block: null, file: 's09-cta.js' },
    { id: 'S10',  name: 'Credit, methodology, disclaimer',     len: 'auto', block: null, file: 's10-footer.js' },
  ];
}

// group aliases for deep links: ?p=S7:0.5 → S7a, ?p=S8:0.5 → S8a
export const ALIAS = { S8: 'S8a' };   // hybrid: S7a–d left the flow (2026-11-13)

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

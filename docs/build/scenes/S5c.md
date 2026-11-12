# S5c: Map stage, part 3: roach encodings and per-node beats

**Model:** Opus 5.5, high. **Paste to start:** `Read CLAUDE.md, then docs/build/STATUS.md and docs/build/scenes/S5c.md, and do S5c. Stop for my review at the key frames, and again at the end.`
**Spec:** `sed -n 336,404p PROTEST_VIZ_SPEC.md` (S5: Roach markers and the Lifecycle table). Shared rules: [README.md](README.md).

## Purpose
Roaches as protester markers on the map: count encodes the crowd tier, size encodes days elapsed, clustered at each node's sites, with the per-node beats from `timeline.json`.

## Allowed data keys
- `timeline.nodes[].{crowd_tier, crowd_basis, site_ids, date, hunger_strike_day, sub_beats[]}`. `crowd_tier: null` = carry the previous tier (spec: show "no count reported").
- `methodology.crowd_tiers` (tier → roach count: 1 → 40, 2 → 120, 3 → 250, 4 → 400; disputed crowds use the lower documented tier), `methodology.roach_size`, `methodology.founder_roach`.
- `data/map/base.json` anchors / site footprints for clustering.

## Files it owns
- `src/scenes/s05/roaches.js` (+ the legend) and its wiring in `s05-map.js`.

## Must not touch
The common list in README; `s05/map.js` (S5a), `s05/scrubber.js` and `s05/rail.js` (S5b).

## Contracts it consumes
- `roach()` only; a canvas overlay over S5a's map (DPR ≤ 2).
- **One config object `roachEncoding`** holds count and size rules so Vali can change them (spec).
- Size: `size(day) = lerp(6, 28, easeOutCubic(day / 49))` px read as body length → `s = size ÷ 1.9`, × √(zoom ÷ 2.4) on wide shots (Vali-approved rule).
- S5's camera (S5a) and `segmentAt()`; positions and counts are pure in `p` (seeded per roach).
- Roaches released by S4 land at Jantar Mantar Road during the lead-in (S4 p 1 = S5 p 0).
- Off-screen loops pause: idle walking only in `tick`, and only while S5 is live (the controller already only ticks live scenes).

## Key frames
| p | Expected picture | Storyboard |
|---|---|---|
| S5 0.1358 | Tier of node 1 → roach count at day-0 size, clustered on the start site. Legend bottom-left of the map. | `ink-S5-start.png` |
| S5 0.8309 | Tier 4 → 400 roaches, weighted to Jantar Mantar Road, at day-44 size × the zoom factor; not a solid black mass. | `ink-S5-0720.png` |

## Done when
- Roach size and count change as specified when scrolling, both ways; no popping between nodes.
- Frame-time guard (spec §8): if the average frame exceeds 20 ms for 2 s, drop the roach count by 15%.
- 60 fps at 1440×900 with 400 walking roaches.
- QA both ways, compare sheets with down≠up 0% (`?still`), `qa-shell` all PASS.

## Vali's notes
- Crowd tiers are the builder's judgement (D6), and every stat on screen carries a `*`.
- Node 2c "camera across sites": every 20–27 Jun event is at Jantar Mantar Road; the multi-site sweep fits node 5 (GAPS).

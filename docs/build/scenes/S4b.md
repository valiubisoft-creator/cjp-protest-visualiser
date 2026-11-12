# S4b: The date on the skeleton (converge, shimmer, release)

**Model:** Opus 5.5, high. **Paste to start:** `Read CLAUDE.md, then docs/build/STATUS.md and docs/build/scenes/S4b.md, and do S4b. Stop for my review at the key frames, and again at the end.`
**Spec:** `sed -n 309,334p PROTEST_VIZ_SPEC.md` (S4). Shared rules: [README.md](README.md). Read the S4a result in STATUS first.

## Purpose
The protest's start date, 06/06/2026, built from roaches walking on the skeleton of the glyphs, then released into the map stage.

## Allowed data keys
- `meta.protest_start_date` (→ `ddmmyyyy()`).
- For the release: `timeline.nodes[start].site_ids` and the `jantar_mantar_road` anchor in `data/map/base.json` (via `baseMap()` in `src/data/load.js`), only to aim the landing point.

## Files it owns
- `src/scenes/s04-date.js` (+ CSS).
- May add to `src/roach/swarm.js` (additive only).

## Must not touch
The common list in README; `src/lib/skeleton.js` belongs to S4a (ask if it needs a change).

## Contracts it consumes
- `skeleton()` / `brackets()` as settled by S4a; `ctx.swarm` (380 from S3.5 plus the joiners); prologue layers; `roach()`.
- **Handovers:** S4 p 0 = S3.5 p 1 (start from its end layout). S4 p 1 = S5 p 0: the S5 stage replaces the prologue stage in place at that exact scroll position, so S4's last frame and S5's first must match (agree the picture with S5a; until S5a exists, end on the storyboard's p 0.9 direction).
- Map roach size rule (for roaches landing on the map): s = spec size ÷ 1.9, × √(zoom ÷ 2.4) on wide shots.

## Key frames
| p | Expected picture | Storyboard |
|---|---|---|
| S4 0.00 | Converge begins from the S3.5 end layout; both clusters break up toward their slots; first joiners stream in from all four edges; date not yet visible. | `ink-S4-0.png` |
| S4 0.45 | End of converge: near slots filled, farthest arrivals still walking in. No brackets yet. | `ink-S4-0.45.png` |
| S4 0.60 | Hold: every roach on its segment, shimmer ±3 px along the tangent; corner brackets drawn. **No caption** (empty slot). | `ink-S4-0.6.png` |
| S4 0.90 | Release left to right toward the Jantar Mantar landing point; backdrop cross-dissolves into the map; the date becomes the HUD readout top-left. | `ink-S4-0.9.png` |

## Done when
- The date reads correctly at 1440×900 and 1280×720 at p 0.6; roaches visibly walk along strokes; converge staggered by distance (far ones last).
- ~600 roaches join from the screen edges during converge (Vali, 2026-11-12); surplus roaches (if any) crawl off the edges.
- Release flows into S5 with no jump. 60 fps with all roaches.
- QA both ways (`targets/S4.json`), compare sheets with down≠up 0%, `qa-shell` all PASS.

## Vali's notes
- Skeleton face Public Sans Black; roach s 5.6 at 7.4 px spacing (2026-11-12).
- The spec's caption "The day the protest at Jantar Mantar officially began" is **not** shown: the slot stays empty until Vali supplies text (GAPS).

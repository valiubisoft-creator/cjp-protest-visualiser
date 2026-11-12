# S5a: Map stage, part 1: base map, projection, camera

**Model:** Opus 5.5, high. **Paste to start:** `Read CLAUDE.md, then docs/build/STATUS.md and docs/build/scenes/S5a.md, and do S5a. Stop for my review at the key frames, and again at the end.`
**Spec:** `sed -n 336,404p PROTEST_VIZ_SPEC.md` (S5; this chat does the Map and Camera parts and the lead-in/lead-out). Shared rules: [README.md](README.md).

## Purpose
The pinned map stage: a line-art base map of the Jantar Mantar area and a camera driven by `p`, node by node. S5b adds the scrubber and rail, S5c the roach encodings. S5a sets the module structure all three share.

## Allowed data keys
- `data/map/base.json` (`meta`, `anchors`, `layers`): load with `baseMap()` (`src/data/load.js`, lazy, ~540 KB).
- `sites.sites[].{id, name, type, coord_status}` for labels; `timeline.nodes[].{id, site_ids, date}` and `sub_beats[].site_ids` (if present) for camera fits.
- `methodology.map` and `map.meta.attribution` (the OSM/ODbL credit: S10 shows it; the map may carry a tiny one too).

## Files it owns
- `src/scenes/s05-map.js` (the scene; composes the parts) and a new folder `src/scenes/s05/`: `map.js` (base map + camera, yours), plus empty stubs `scrubber.js`, `rail.js` (S5b) and `roaches.js` (S5c) with the interfaces you agree in STATUS.
- New `src/lib/map.js`: promote `mapSVG`, `anchorXY`, `fitSites` from `design/lib/kit.js` (re-export them from kit, as F3 did for the other helpers; re-shoot the storyboard S5 frames and confirm they match).
- `tools/map/*` if the base map needs a re-bake with a wider bbox (Safdarjung hospital is ~6.5 km south, outside the frame: inset or off-frame arrow, see GAPS).

## Must not touch
The common list in README. No D3 in this chat (D10: the projection is hand-rolled; `base.json` is already projected).

## Contracts it consumes
- `segments` on the S5 budget entry: `lead_in 60, start 100, protest 260, wangchuk 110, detention 110, protest_arrest 110, lead_out 60` (vh, sum 810). Use `segmentAt(def, p)` / `segmentP(def, id, local)` from `src/scroll/budget.js`; never hard-code vh.
- Within each node (spec): in 0–0.20 (camera tween, site pulse, card enters), hold 0.20–0.85, out 0.85–1.
- **Handovers in place:** S5 p 0 must look exactly like S4 p 1 (agree it with S4b's release frame), and S5 p 1 like S6 p 0.
- Layout at 1440×900: map ~62% (the storyboard uses 893×804), rail ~38% (`--rail-w`), scrubber `--scrubber-h` full width at the bottom.

## Key frames
| p | Expected picture | Storyboard |
|---|---|---|
| S5 0 | Lead-in start = S4 p 1. | none |
| S5 0.1358 | Node 1 Start, hold: camera fitted to `start.site_ids` (single site, close zoom), base map and labels. (Roaches, rail, scrubber come in S5b/S5c; draw their boxes as placeholders.) | `ink-S5-start.png` |
| S5 0.8309 | Node 5, 20 Jul sub-beat hold: camera fits the eleven 20 Jul `site_ids`; red site dots; barricade dashed and labelled **illustrative**. | `ink-S5-0720.png` |
| S5 1 | End of lead-out = S6 p 0. | none |

## Done when
- The camera is a pure function of `p` (scrub backward = forward), tweening between node fits with zoom interpolation.
- No raster tiles or network calls; the map is the only big asset and loads lazily.
- QA both ways (`targets/S5.json`), compare sheets with down≠up 0%, `qa-shell` all PASS.

## Vali's notes
- Map inspiration: SITU's Maidan platform (see STATUS change log).
- **Victory is not in the map stage** (2026-11-12): S5 ends at node 5 (20–24 Jul). The budget already dropped its 70vh.
- Map roach size rule (S5c applies it): s = spec size ÷ 1.9, × √(zoom ÷ 2.4) on wide shots.

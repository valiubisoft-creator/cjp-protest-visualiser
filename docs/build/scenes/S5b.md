# S5b: Map stage, part 2: scrubber and rail

**Model:** Opus 5.5, high. **Paste to start:** `Read CLAUDE.md, then docs/build/STATUS.md and docs/build/scenes/S5b.md, and do S5b. Stop for my review at the key frames, and again at the end.`
**Spec:** `sed -n 336,404p PROTEST_VIZ_SPEC.md` (S5: the Day readout, Scrubber, Rail card and YouTube parts). Shared rules: [README.md](README.md). Read S5a's module notes in STATUS first.

## Purpose
The timeline scrubber (a view **and** a control over the one scroll position) and the scroll-driven rail cards: facts, media, people, and click-to-load YouTube.

## Allowed data keys
- `timeline.nodes[]` except `victory`: `id, label, title, date, date_window, hunger_strike_day, media_mode, facts[], people[], media[], sub_beats[]` (same fact/media shape). Facts only if `showable()` and `web_check !== 'unconfirmed'` (the storyboard's `featured` rule).
- `byId.source` for `*` numbers; `meta.protest_start_date` for the HUD; `methodology.videos` for the YouTube note.
- People images under `media/people/` and `media/cjp-public-images/` with their credits as given in the data.

## Files it owns
- `src/scenes/s05/scrubber.js`, `src/scenes/s05/rail.js` (+ CSS), and their wiring in `s05-map.js` (coordinate with S5a's structure).
- **D3 (D10):** you may add `d3-scale` and `d3-array` (ESM, pinned versions) to the import map in `v3/index.html`. That is the only shell edit allowed; log it in STATUS.

## Must not touch
The common list in README (except the import-map line above); `s05/map.js` (S5a), `s05/roaches.js` (S5c).

## Contracts it consumes
- **Scroll is the single source of truth.** Drag maps pointer x → date → `ctx.controller.seek('S5', p)`; clicking a node marker glides there with `seek('S5', p, { duration: 800 })` (inOutCubic); release within 10 px of a marker snaps to it. Never keep a second timeline state.
- `segments` / `segmentP()` in `budget.js`; time axis: piecewise-linear scroll → date inside each node (spec).
- The rail does not scroll on its own; its content advances with page scroll (no nested scrolling).
- Keyboard: `role="slider"`, `aria-valuetext` "Day N, node title", arrow keys step by node (via `seek`).

## Key frames
| p | Expected picture | Storyboard |
|---|---|---|
| S5 0.1358 | Rail card for node 1 (kicker date + Day N, title, media, two featured facts with `*`); scrubber with the handle at 6 Jun; HUD "06/06/2026 · Day 0" top-left of the map. | `ink-S5-start.png` |
| S5 0.8309 | Rail on the 20 Jul sub-beat; scrubber handle at 20 Jul; **no Victory marker**. Move this target if your sub-beat timing differs, and update `targets/S5.json`. | `ink-S5-0720.png` |

## Done when
- Map, rail and scrubber stay in sync with scrolling and with drag, both ways; scrub backward is identical to forward.
- YouTube: poster only until clicked, `youtube-nocookie.com/embed/ID?rel=0&modestbranding=1&playsinline=1`, one iframe alive at a time, unloaded when its node exits, never autoplay with sound.
- Missing media or facts degrade without empty boxes or console errors.
- QA both ways, compare sheets, `qa-shell` all PASS.

## Vali's notes
- Videos are random picks from `data/timeline_clips.json` per node window (D13), all `review: "pending"`. One node-5 pick may be misinformation framing (GAPS → Media): flag it in the rail data for Vali, don't silently drop it.
- The scrubber axis in `design/lib/parts.js` still runs to 25 Jul; trim it to the end of node 5 (2026-11-12). Open nit from F2: the riding roach touches the active label when that label sits in the middle row.

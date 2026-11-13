# Build status

Branch: `build/scene-by-scene`. Plan: [BUILD_PLAN.md](BUILD_PLAN.md). Decisions are in BUILD_PLAN section 4.

| Chat | State | Effort (Opus 5.5) | Notes |
|---|---|---|---|
| Plan | done 2026-11-11 | — | Decisions D2–D8, D12 and D13 resolved |
| F1 Editorial and data ledger | **done** 2026-11-12 | medium | Kickoff: [kickoffs/F1.md](kickoffs/F1.md). Output: `data/story/*.json`, generator `f1/build_story.py`, [GAPS.md](GAPS.md) |
| F2 Design system and storyboard | **done** 2026-11-12 | high | Brief: [kickoffs/F2.md](kickoffs/F2.md). Theme: **ink**. Visual target: `design/storyboard` + `design/shots/frames/` (19 frames) |
| F3 Shell and harness | **done** 2026-11-12 (Vali approved) | high | Kickoff: [kickoffs/F3.md](kickoffs/F3.md). Shell at http://localhost:5173/v3/. Briefs + targets: [scenes/](scenes/README.md). QA: `qa/v3/` |
| S4a Skeleton spike | **done** 2026-11-12 (Vali approved) | high | Brief: [scenes/S4a.md](scenes/S4a.md). Spike: http://localhost:5173/design/spike-s4a. Shots: `qa/v3/S4a/`. **Lanes 3**, runtime skeleton |
| **Prologue (S0–S4b, one chat)** | **built** 2026-11-12, awaiting Vali's review | high | Vali 2026-11-12: one chat for S0, S1–S2, S3, S3.5 and S4b. Gate 1 approved and pushed (`2084092`). Shots: `qa/v3/{S0,S1,S2,S3,S3-5,S4}`, `qa/v3/prologue-gate1`, `qa/v3/handover`, `qa/v3/S2/seq` |
| **S5 map stage (S5a+b+c, one chat)** | **built** 2026-11-12, awaiting Vali's review | high | Vali: one chat for S5a, S5b, S5c. Gate-1 shots: `qa/v3/S5/gate1c`. Rail + scrubber and the 20 Jul research/imagery built by sub-agents, reviewed by the lead |
| **Remaining scenes (S6, S6.5, S7a–d, S8–S10, one chat)** | gate 1 in review 2026-11-12 | high | Kickoff: [kickoffs/remaining.md](kickoffs/remaining.md). Gate-1 shots: `qa/v3/gate1-S6`, `qa/v3/gate1-S7`, `qa/v3/gate1-S7d`, `qa/v3/gate1-S8-S10`. Sub-agents: S7 charts, S7d apparatus, S8–S10, apparatus data |
| M9 | — | high | Plus architect and GPU review agents |
| **Hybrid (branch `build/hybrid`)** | **built** 2026-11-13 (Gate 0 signed off; motion built, QA'd; committed and pushed to `build/hybrid` at Vali's request) | high | Kickoff: [kickoffs/hybrid.md](kickoffs/hybrid.md). Gate 0: [hybrid/GATE0.md](hybrid/GATE0.md), copy [hybrid/COPY.md](hybrid/COPY.md), frames `qa/hybrid/gate0/`, board http://localhost:5173/design/hybrid/gate0. `src/` untouched |

## Contracts in force
**Data ledger (F1).** Scenes read only `data/story/*.json`, never the PDF.
- `sources.json` `{ sources[] }`: `{ id, title, publisher, url|null, date|null, note }`.
- `meta.json`: `title` ("Cockroaches"), `background_facts[]` (12 May NEET cancellation), `protest_start_date`, `finale_date`, `cji_quote { text, speaker, date, keyword, source_id: null, context_facts[] }`, `founder`, `finale { date, headline, line, source_ids }`, `handles: []`, `designer_credit`.
- `sites.json` `{ sites[], base_map: null }`: `{ id, name, type, lat, lon, coord_status: verified|approx, coord_origin, source_ids, role_in_story? }`.
- `timeline.json` `{ nodes[] }`: six Phase-1 nodes (`start`, `protest`, `wangchuk`, `detention` 18 Jul, `protest_arrest` 20 Jul, `victory`). Each node has `date_window`, `crowd_tier` (null = carry previous), `hunger_strike_day`, `route`, `facts[]`, `people[]`, `media[]` and `sub_beats[]`, and each sub-beat has the same fact and media shape.
- **Fact shape everywhere**: `{ text, value?, value_text?, unit?, claimant, attribution, status: documented|claimed|alleged|disputed|unverified, source_ids[], page, note? }`. `unverified` was added after review, for items the dossier itself flags as unverified or unsourced. Metrics rows may carry `value_later` (an open-ended later count such as 118 → 130+), which is not a range; `value_max` is used only for true ranges such as 15–20. `attribution` holds the on-screen wording ("police said", "CJP claims", "reported", "alleged").
- `metrics.json` `{ rows[], tactics[] }`: one row per claim (`value` is the lower bound, `value_max` is optional), and the police-tactics table with a `chartable` flag.
- `epilogue_october.json` `{ framing, bridge[], facts[], narratives[], status_line }`.
- `quotes.json` `{ quotes[] }`: placeholders only.
- `data/map/base.json`: `{ meta { viewBox, projection, attribution }, anchors { site_id: {x, y, in_frame} }, layers { buildings[], green[], water[], roads[{c, p, n?, tunnel?, rb?}], rail[] } }`. All geometry is flat [x,y,…] arrays.
- `methodology.json`: `map`, `illustrative_graphics`, status definitions, the `*` convention, crowd tier → roach count table, video-pick algorithm, collection dates, `caveats[]`, `disputed_claims[]`, `disclaimer` (null, a gap).

**Shell (F3, 2026-11-12).** v3 lives in `v3/index.html` (D1). Serve `npx serve . -l 5173`, open http://localhost:5173/v3/ (`/v3` works too: paths are root-absolute). Import map: `animejs` 4.5.0 from jsDelivr (v2's pattern; self-hosting is an M9 item). `<html data-theme="ink">`.
- Files: `src/main.js` (boot), `src/scroll/{budget,controller,hud}.js`, `src/scenes/sNN-*.js` + `placeholder.js`, `src/roach/{roach,swarm}.js`, `src/lib/{rng,text,dom,dates,halftone,skeleton,star}.js`, `src/data/load.js`, `src/shell.css`. `design/lib/{roach,kit}.js` and `design/storyboard.js` now import the promoted helpers (one copy each; storyboard re-shot byte-identical except S0, which already varied run to run).
- URL params: `?p=S4:0.6` deep link (also `S10:top`, `S7:x` → S7a, `S8:x` → S8a); `?debug[=tr|tl|br|bl]` HUD (scene, p to 3 dp, scrollY, direction, FPS; backtick moves it) + console enter/exit log; `?still` freezes the idle clock at t = 0; `?trace` records every mapping step in `__v3.trace`.
- Desktop gate: below **1280×720** the piece is hidden and the spec's desktop message shows (`html.gated`).

**Scroll budget (F3; single source of truth: `src/scroll/budget.js`).** `len` = scroll distance in vh over which the scene's p runs 0 → 1.

| Block (pinned unless flow) | Stage | Scenes and lengths (vh) | Section height |
|---|---|---|---|
| `main` | `prologue` | S0 80 · S1 150 · S2 60 (+ timed sequence) · **S3 260** (was 180) · **S3.5 240** (was 160) · S4 180 = 970 | |
| `main` | `map` | S5 **810** (lead_in 60, start 100, protest 260, wangchuk 110, detention 110, protest_arrest 110, lead_out 60) | |
| `main` | `finale` | S6 260 | 2,040 + 100 |
| flow | | S6.5 auto | content |
| `S7a`, `S7b`, `S7c` | `chart` | 170 each | 270 each |
| `S7d` | `chart` | 300 (apparatus spokes, Vali 2026-11-12) | 400 |
| `S8` | `quotes` | **160** per `selected` quote (Vali 2026-11-12: Ambedkar only → S8a) | 260 |
| flow | | S9 100 · S10 auto | 100 · content |

Changes from spec §6: S3.5 added (160); S5 880 → 810 (Victory node removed); S8 is one pinned block of N quote scenes; prologue, S5 and S6 share **one** pinned block so the stages hand over in place (no slide) at S4→S5 and S5→S6. At 1440×900 the page is 31,410 px.

**Controller contract (`src/scroll/controller.js`).** The only scroll owner: one anime.js `onScroll` observer on the document + CSS sticky. Scenes never listen to scroll, wheel or resize.
- Ranges in px of scrollY. Pinned scene: `a` = block top + earlier lens in the block, `b = a + len`; live on `[a, b)`, plus the block's first scene while its stage slides in (`blockTop − vh`) and the last while it slides out (`b + vh`). Flow scene: `a = top − vh`, `b = top + height − vh`, live until it has left through the top. `p = clamp((y − a)/(b − a))`. Same scrollY → same p, both directions.
- Boundaries are half-open: at the exact end of S3, S3 has exited and S3.5 is at p 0. So **within a block, scene N at p 1 must look exactly like scene N+1 at p 0** (S2→S3, S3→S3.5, S3.5→S4, S4→S5, S5→S6, and so on). `yFor(id, 1)` stops 1 px short so `?p=S3:1` shows S3.
- Each frame: exits (`exit(dir)`) → stage visibility → enters (`enter(dir)`) → `update(p)` for every live scene whose p changed. Pinned scene roots are `hidden` when not live; flow roots never are (they are page sections).
- API (`ctx.controller`, also `window.__v3`): `seek(id, p, { duration, ease })` (instant, or a glide: S5b uses 800 ms inOutCubic), `yFor(id, p)`, `state()` → `{ scene, p, y, dir, locked, gated, live[] }`, `lock({ maxMs = 3200 })` / `unlock()` (blocks wheel, touch and scroll keys; auto-unlocks), `refresh()`, `trace`, `budget`.
- Resize: debounced 150 ms; re-fits stage canvases, calls every scene's `resize(w, h)`, re-measures, and puts the reader back on the same (scene, p).
- Idle clock: one anime `createTimer` calls `tick(t, dt)` on **live scenes only** (off-screen loops pause by construction). `?still` never starts it.

**Scene contract (`src/scenes/sNN-*.js`).** Default export: a factory `(def) => scene` (a plain scene object also works). S7 and S8 use one factory for several scenes (`def.sub`).
- `scene = { id, init(ctx), enter(dir), update(p), exit(dir), resize(w, h), tick?(t, dt) }`. `init` may be async; it runs once for every scene at boot, before layout. `dir` is `'down'` or `'up'`.
- **`update(p)` is pure in p**: it draws the complete frame for (p, `ctx.clock.t`). `tick` may redraw at a new t but never changes what p decides. Only exception: S2's timed sequence (spec §3, `done` flag, reset above S1 p 0.5).
- `ctx = { def, root, stage, layers, data, swarm, controller, viewport: { w, h }, clock: { t, still }, params, debug }`. `root` is the scene's own element: inside its stage for pinned scenes (for the prologue, inside `layers.annot`), or the page section itself for flow scenes. `def` is the budget entry (`id, name, len, block, stage, file, segments?, sub?`).
- Prologue stage layers (shared by S0–S4, persistent): `layers.back` and `layers.swarm` = `{ canvas, ctx }` (viewport-sized, DPR ≤ 2, re-fitted before `resize`), `layers.text` and `layers.annot` = divs (pointer-events pass through except on scene content).
- `data` = `loadStory()`: `{ meta, timeline, metrics, quotes, sites, sources, methodology, epilogue, byId: { node, site, source } }`; `byId.source[id].n` is the footer number. The map is lazy: `baseMap()`.
- Stars: `star(source_ids, data.byId.source, label)` (`src/lib/star.js`) → `<a class="star" href="#src-N">`. S10 renders `id="src-N"`.

**Roach contract.** `roach(ctx, x, y, rot, s, legs)` in `src/roach/roach.js` is the verbatim v2 renderer (`design/lib/roach.js` re-exports it). Never edit it; wrap it. `src/roach/swarm.js`: `createSwarm({ seed = 380, capacity = 1200 })` → `{ list, clear(), draw(ctx, { from, to, color }) }`; roach *i* keeps seeded traits (`k[4]`, `rot0`, `legs0`) from S0 to S4 and scenes write only its pose (`x, y, rot, s, legs, alpha`). `hash01(i, salt)` for stateless per-roach randomness. S0 owns the swarm model; S3/S3.5/S4 may add to it. The spec's `Roach` class interface (`update`, `setPath`, `setTarget`) is not built: S0/S4b add what they need on top of the pool.

**Skeleton contract (S4a, 2026-11-12; additive to F3).** `src/lib/skeleton.js`, runtime (no bake).
- `await skeletonReady(face)` before the first call (loads the face; if it isn't loaded the result is not cached and a warning is logged).
- `strokes(text, face)` → reference polylines (raster at 240 px → Zhang–Suen → staircase clean → trace → spur prune → smooth). Once per string, viewport-independent.
- `skeleton(text, { w, h, spacing, face = 'sans', lanes = 1, laneGap = .68 × spacing })` → `{ slots: [{ x, y, a, path, u, lane, o }], paths: [{ pts, closed, len }], box, k, ms }`. Slots are evenly spaced along arc length (merged within 0.6 × spacing at junctions), in reading order (path left to right, then `u`). `a` = tangent; `u` = arc length along `paths[path]` (for walking/shimmer); `lane`/`o` = lane index and its normal offset. Same fit and box as F2.
- `fitScale(text, w, h, face)` → box px per reference px. **S4 size rule:** `k = fitScale(box) / fitScale(1220 × 330)`; roach `s = 5.6 × max(1, k)`, spacing `7.4 × max(1, k)`. So the slot count never exceeds the 1440×900 count (bigger screens get bigger roaches) and s never drops below 5.6 (legs stay visible).
- `brackets()` unchanged; pad 30 and length 46 scale by `k`.

**Prologue contracts (prologue chat, 2026-11-12; additive).**
- **Swarm model** (`src/roach/swarm.js`): `wander(i, tau, w, h)` is the hero swarm's closed-form roaming path in swarm time `swarm.tau` (advanced in `tick` by S0/S1 only; 0 under `?still`). `idle(i, t, amp)` is the standing jitter. `fleeStep(b, x, y, dt, k)` eases a per-roach cursor-flee offset `b.fx/b.fy` (radius 90 px), which is idle motion only. Also exported: `heroCount(w, h)` (420 at 1440×900, area-scaled, cap 700), `heroSize`, `clamp01`, `lerp`, `ease`, `angDiff`.
- **Shared scene state:** `heroWord` (`s00-hero.js`) is the title canvas in `layers.text`, used by S0 and S1. `spawn` (`s02-spawn.js`) holds the `done` flag, the founder's resting pose `pose(tf)`, and the label in `layers.annot`, used by S1, S2 and S3. `mult.poses(p, t)` (`s03-multiply.js`) and `claim.poses(p, t)` (`s03-5-claim.js`) are pure pose functions; each next scene starts from the previous one's p 1.
- **Swarm count: 1000** (Vali, gate 1 → 760, then review 2026-11-12 → 1000, "fill the screen end to end"; spec 380). S3 `n(p) = round(1000^(p/0.78))`: first split at p 0.10, full swarm at 0.78, everyone home by 0.92. Homes cover the whole viewport (R2 sequence, nearest the founder's spot first).
- **S3.5: 240 vh** (budget change, Vali 2026-11-12: more scroll before the BJP minister's claim; was 160). Sort 0–0.20, with the right cluster turning red **gradually as it sorts** · pause 0.20–0.44 (no text) · claim caption and 51/49 at 0.44–0.50 · re-sort 0.62–0.88 · correction from 0.88 · text out 0.97–1. Key frames: **0.32, 0.54, 0.75, 0.94**. The `main` block is now 1,960 + 100 vh.
- **S4:** the 1000 S3.5 roaches take the centre lane plus an even share of the outer lanes (sorted by x). **Joiners: ~140 at 1440×900, ~7 at 1280×720**, entering from the nearest edge; any surplus (slots < 1000) crawls off the nearest edge. Converge ends at p **0.52**; **no corner brackets** (Vali 2026-11-12); release 0.80–1.
- **S4 p 1 = the S5 p 0 contract (for S5a).** The map at the start camera: map box 62% × (h − scrubber); single site centred at zoom 2.4 × (map width ÷ 893); the kit `mapSVG` look drawn to a canvas, with soft right and bottom edges. 120 roaches (the start node's crowd tier) stay loosely round the `jantar_mantar_road` anchor at s 6/1.9; the other ~1,020 fade into them as they land. HUD `06/06/2026 · Day 0` top-left (`.s4-hud`). No rail, scrubber or site label yet. Reference: `qa/v3/S4/S4-1-down.png`, `qa/v3/handover/S4-1_vs_S5-0-*-A.png`.
- **S2 sequence:** runs on its own rAF clock (so it also runs under `?still`), locked ≤ 3.2 s. It ends by seeking to S2 p 0 unless the reader is already past it. Leaving S1 mid-sequence finishes it at once. A deep link to S2 or later sets `done`.

**S5 contracts (S5 chat, 2026-11-12; gate 1, Vali reviewing).**
- **Budget:** S5 810 → **2070 vh** (Vali's narrative + 20 Jul hour-by-hour; `src/scroll/budget.js` edited, needs Vali's OK): lead_in 60 · start 160 · protest 180 · wangchuk 240 · detention 170 · protest_arrest 1200 · lead_out 60.
- **Beats** (`src/scenes/s05/beats.js`, the one model every part reads): per node, the node beat (merged with a same-date sub-beat), its on-map sub-beats in date order, and after `pa_0720` the ten 20 Jul **hour beats** (`data/story/sansad_chalo.json` steps). In/hold/out 0.20/0.85 per beat; transitions move camera, roaches, date, card together. `reslot()` splits each node's segment by the measured card heights (floor 380 px), on the first visible frame per viewport. `phase(p)`, `dateAt(p)` (hours on 20 Jul), `pAt(t)`.
- **Labels:** solid boxes with a 3 px black ring, 12 px black weight, whole-pixel positions (legible over the white swarm). **Legend:** collapsible dropdown (collapsed: tier row; open: notes + symbol key; on 20 Jul hours a one-line "positions approximate, illustrative" note always shows).
- **Idle motion** (`tick`, zero under `?still`): roaches jitter and amble about a body length round their spot; tear-gas clouds breathe and drift; lathi bursts throb.
- **Layout:** full-screen map (Vali 2026-11-12); narrative in one floating card top-right (400 px at ≥1440, 360 px below) with leader lines to the beat's sites/incidents; sources as small footnotes in the card (no big stat blocks). The camera keeps the card's area clear (`reserve`). Zoom/size scale stays on S4's 62% box (`scaleW`).
- **New data files** (drafts for Vali): `data/story/narrative.json` (body copy per beat/step; star tokens `{*ids|claimant}`), `data/story/sansad_chalo.json` (10 steps, 75 facts, 20 `new_sources` merged into `data.sources` at runtime after sources.json's numbering), `data/story/imagery.json` (picks + catalogue; web copies in `media/web/`). Loaded by S5 with `story()`; `load.js` untouched.
- **Handover in:** `release.landed()` exported from `s04-date.js` (additive; S4 frames unchanged; needs Vali's OK). S4→S5 0.033% / 0.043%.
- **Handover out (for S6):** S5 p 1 = the S4-p-1 backdrop offset + the last beat's 400 roaches; poses from `s5End.poses()` (`s05/roaches.js`). No map, card, HUD.
- `src/lib/map.js`: promoted `mapSVG/anchorXY/fitSites` (kit re-exports; storyboard byte-identical to HEAD) + `fitCam` (optional per-side pads), `interpolateZoom` (hand-rolled van Wijk), canvas `drawMap`.

**Hybrid contracts (build/hybrid, 2026-11-13; supersede the v3 running order on this branch).**
- **Running order** (`budget.js`): S0–S3.5 · **NEET 200** · **HELD 240** · S4 180 · **S5 1,370** · S6 260 · **WATCH 260** · **OCT 500** · **ROLL 380** · **CAGE 340** · S8a 160 · S9 100 · S10.
  - S6.5, S7a–c, S7d and (review 2) CLOSE are out of the flow; their files stay.
  - `main` block: 3,140 vh incl. scroll-away. Whole piece: ≈ 5,380 vh + S10.
- **Layout grid (review 2):** 12 columns inside an outer margin `--g-m` = 8.333% of the width clamped to 96–160 px, 24 px gutters (`src/shell.css` :root; `src/lib/grid.js` mirrors it in px). Content sits in columns 1–8; the caption column stays at the right inset (24 px, 360 wide) and the lockup at the top-left inset. Opening cards, NEET, HELD, the ledgers, the OCT quote, S8a, S9 and S10 are on it.
- **Opening cards (review 2):** `createChapter` adds `.hy-open`, a full-bleed page-colour card behind the title (in with the kicker, out as the title docks), so each chapter opens on its own frame. p 0 of every chapter is unchanged (card alpha 0), so the handovers hold.
- **Living halftone (review 2):** `src/lib/alive.js`. `halftone()` and the prologue backdrop register their canvas; a sibling `.ht-live` canvas above it animates slow dots (appear, drift, fade; some erase). Idle-only, ~30 fps, only while on screen; never drawn under `?still` or reduced motion, so QA frames and handovers are unaffected.
- **Reading progress (review 2):** `src/lib/progress.js`, a 3 px bar on the window's top edge with a notch at each chapter start (shell UI, mounted in `main.js`).
- **Footer (review 2):** S10 is compact: the disclaimer always visible; References and map/image credits in `<dialog>` modals; methodology and caveats in `<details>`. Any `a.star` click opens References on its entry without scrolling the page (`id="src-N"` kept).
- **Copy:** `src/data/copy.js` is the one source for every chapter headline, dek and caption (`{*ids|claimant}` star tokens, `{{var}}` slots). `docs/build/hybrid/COPY.md` is generated from it (`tools/hybrid/copy-md.mjs`).
- **Chapter chrome:** `src/lib/chapter.js/.css`, `createChapter(host, id, data, { title: [in0, in1, out0, out1], caps: [[k, a, b]], lock, vars })`.
  - Title card: words rise in a seeked anime.js timeline, the headline stays on one line (fitted lazily on the first visible frame), then the card docks to a top-left lockup.
  - Caption cards crossfade by p. Each chapter sits in its own `.hy-ch` wrapper (display: contents).
- **Data:** `loadStory()` merges the `new_sources` of `EXTRA_FILES` once, in a fixed order: sansad_chalo, apparatus, withheld, october_counts, voter_roll, neet, detentions.
  - Drafts are exposed as `data.extra.<file>`. S5's and S7d's own merges are now no-ops.
- **Prologue-stage scenes NEET and HELD:** both start and end on `claim.poses(1, t)`, and their walk legs use whole cycles, so S3.5 → NEET → HELD → S4 hand over in place.
- **S5 hybrid mode** (`s05/hybrid.js` `HY`): `buildModel(..., { hybrid: HY })` replaces each node's beats with `[id, vh, opts]`.
  - `title:<chapter>` and `ledger:<k>` are pseudo-beats; `opts.labels` caps the labels at three; `opts.notes` takes `signal`, `order` or `metro`.
  - The rail is replaced; `reslot` is off.
  - The HUD docks under the lockup over the lead-in (`--s5h-dock`). The ledger veil lifts in the lead-out, so the S4→S5 and S5→S6 contracts hold.

**Harness.** `tools/cdp-scroll.mjs` (legacy list mode unchanged; a targets file → down pass then up pass, p checked per target, per-scene monotonic check, `qa-log.json`), `tools/compare.mjs` (storyboard | down | up sheet + down/up pixel diff), `tools/qa-shell.mjs` (shell regression), `tools/lib/cdp.mjs` (shared driver, exact viewport via Emulation). New in the prologue chat: `tools/shoot-frames.mjs` (deep-link key frames at any `SIZE`; keep for now, Vali may delete it later), `tools/qa-sequence.mjs` (the S1→S2 click, keyboard, auto-trigger, lock, reset and replay), `tools/qa-handover.mjs` (in-block A p 1 vs B p 0 pixel diff). Targets: `docs/build/scenes/targets/*.json` `{ scene, brief, note, targets: [{ name, at: "S4:0.6", frame?, expect }] }`.

## Change log
- 2026-11-11: plan, CLAUDE.md and F1 kickoff written.
- 2026-11-11: D1, D9, D10 (D3 added late, in S5b and S7 only) and D11 resolved.
- 2026-11-11: design direction set in DESIGN.md (Protest Revolution and Public Sans; red, white and black).
- 2026-11-11: F1 built the data ledger in `data/story/` (8 files) with `docs/build/f1/build_story.py`, which is seeded and reproducible. Decisions made in F1:
  - Crowd tiers 1–4 map to 40, 120, 250 and 400 roaches.
  - Disputed crowds use the lower documented tier.
  - Metrics rows that held several claimants are split, one row per claimant.
  - The `wikipedia` chip stays a separate source from the two repo Wikipedia URLs, because the chip doesn't name an article.
  - A review agent checked every value against the page images. It found 22 mismatches and 10 omissions and no wrong numbers. All were fixed except two, which are logged in GAPS.md: the ~70 claimant conflict, and the Phase-2 map sites, left out by scope.
  - Most site coordinates are `approx`, and 13 come from builder recall. They need an OSM check before S5.
- 2026-11-11, Vali's answers to F1:
  - The title is **"Cockroaches"**.
  - The 20 Jul ~70 detained figure stays attributed to "Delhi Police (PTI) / CJP".
  - The map takes inspiration from SITU's Maidan platform (http://maidan.situplatform.com/report/3). Research notes go in `research/maidan-map.md`.
  - Gaps (CJI quote source, handles, portraits, quotes, coordinates) may be filled from the web, with the **source shown on screen** beneath the item or elsewhere in the UI. This supersedes D8 for the quotes: candidates are sourced from the web and Vali picks.
  - Vali's original sketches are saved in `sketches/`. The sketch shows the date as `[21|02|06]`; D4 (06/06/2026) still stands unless Vali says otherwise.
- **Standing rule for every scene chat:** when the scene is built, start a dev server (`npx serve .`) and give Vali the local URL.
- 2026-11-12, map decisions from Vali:
  - Crop tight around the story sites.
  - The camera auto-zooms in and out to fit each node's or sub-beat's `site_ids`.
  - Barricade lines and other drawn graphics are allowed, but marked **illustrative** in the legend, because no source records their positions.
  - Built the base map at `data/map/base.json` (529 KB, 179 KB gzipped) with `tools/map/build_basemap.py`. It is OSM data, projected to local metres about the protest site, with SVG-ready coordinates where y points south. Each site has a projected anchor. Preview: `f1/base_map_preview.png`. The raw dump is `data/map/raw/overpass.json` (4.3 MB); keep it out of git.
- 2026-11-12: web check of 180 fact–source pairs. **Vali: primary source wins** when the web contradicts the dossier.
  - 22 conflicts resolved. Examples: pellets are now a disputed pair, 2 rounds per police records vs 7 rounds and 5 hits per a CRPF report via The Wire. Pradhan's remark now uses NDTV's "B Team Of Disruptive Elements". Several dates moved by 1–3 days. The 36/49-day sources are corrected. The 22M-followers fact was removed.
  - **Fact contract additions:** `links[]` (per-outlet URLs), `web_check` (verified | partial | unconfirmed | resolved), `web_notes[]` and `resolution`.
  - Link data: `f1/fact_links.json`.
- 2026-11-12: web sourcing added.
  - CJI quote: sourced to LiveLaw and The News Minute, with the text changed to their "in profession". Kant's 16 May LiveLaw clarification is now verbatim.
  - Handles: 2 confirmed, 4 pending.
  - Portraits: 7 in `media/people/`, 3 of them GODL-India pending Vali.
  - Quotes: 8 candidates in `quotes.json`, `selected: null` until Vali picks.
  - **Contract change:** `quotes.json` now holds candidates `{id, role, author, nationality, year, work, language, original_text, roman, text, translator, translation_is_ours, source_url, source_note, disputed, public_domain, notes, selected}`. Each person's `image` is `{src, credit, license, license_url, commons_page, license_ok}`. Each handle is `{platform, handle, url, official, show, note, source_ids}`.
- 2026-11-12, Vali's picks:
  - Quotes: Ambedkar (Annihilation of Caste), Bhagat Singh (Red Pamphlet; credit him as quoting Vaillant) and Faiz ("Bol", with the Urdu original). This makes three quotes. Faiz is in copyright, so it's a short quote under fair dealing.
  - GODL-India portraits approved with credit.
  - The CJI quote uses the source wording "in profession".
- 2026-11-12, Vali's round 3:
  - Ranka's photo was added; it still needs a credit line.
  - Neha Bora confirmed.
  - Handles: Instagram and X (@Cockroachisback) only.
  - Disclaimer drafted.
  - Victory node uses **kinetic typography** (`media_mode: "kinetic_type"`, no videos). Every other node has `media_mode: "rail"`.
  - **Paywalled sources are excluded** (`PAYWALLED_URLS` in the generator).
  - Wangchuk's role line comes from public Indian outlets; research in progress.
- 2026-11-12: Wangchuk facts re-sourced from public Indian outlets.
  - Role chip: "Engineer-turned-activist" (Al Jazeera).
  - 6 Jun attendance restored, with his quote "I don't like protests, but we have to do it for justice" (FPJ).
  - New sub-beats: day 17 (14 Jul) and day 19 (16 Jul).
  - The fast ends on the night of 23–24 Jul.
  - The F1 data run is complete, and every check passes.
- 2026-11-12, F1 sign-off:
  - Disclaimer approved, with the corrections contact added.
  - Wangchuk's "why he fasted" sentence and two 19 Jul quotes (his wife's and the judge's) added from Al Jazeera.
  - The Wire pellet source was checked by Vali.
  - The NDTV-based Pradhan fact is marked `hold` (backbench): **scenes must not feature facts that have `hold`**.
  - Ranka's photo is credited to Wikigama (CC BY-SA 4.0 site default), with `license_ok: caution`.
- 2026-11-12, F2 part 1 (board), in progress.
  - **Done:**
    - `styles/fonts.css` + `static/fonts/` (self-hosted: Protest Revolution, Public Sans variable, Noto Sans Devanagari, Noto Nastaliq Urdu).
    - `styles/tokens.css`, with `paper` and `ink` themes and contrast checked. In the ink theme, the dramatic stage uses white text on red, because black on red fails AA.
    - `design/board.html` + `board.js` + `board.css`: palette, type (skeleton digits in both faces), roach sizes and map ramp, halftone, map tile, scrubber, rail card, facts with `*`, charts, quotes, and a kinetic-type sample.
    - `design/lib/{kit,parts,roach}.js`. `roach.js` is a verbatim copy of v2's `roach()`, used for the board only.
    - `design/shoot.mjs`: full-page CDP screenshots, run as `node design/shoot.mjs <url> <out.png> [width] [selector]`.
    - Shots: `design/shots/board-{paper,ink}.png`.
  - **Next:**
    - `design/storyboard.html`: one 1440×900 key frame per scene. Reuse `kit.js` and `parts.js`. The `.frame` CSS is already in `board.css`.
    - Then screenshot both themes, and have Vali pick a theme and approve.
  - **Open board nits:**
    - The illustrative-barricade label still sits close to the Patel Chowk label.
    - The top of the board (palette and type) hasn't been visually reviewed in the ink theme.
  - **Serve with:** `npx serve . -l 5173`, then open http://localhost:5173/design/board.html (add `?theme=ink` for the dark theme).
- 2026-11-12, F2 part 2 (storyboard), awaiting Vali's review.
  - **Done:** `design/storyboard.html` + `storyboard.js` + `storyboard.css`: 17 static 1440×900 frames (S0, S1 p .5, S2, S3 p .8, S4 at p 0 / .45 / .6 / .9, S5 at Start / 20 Jul / Victory (kinetic type), S6 p .85, S6.5, S7 chart A, S8 Faiz, S9, S10). Reuses `kit.js` and `parts.js`; every string from `data/story` (S7 from the YouTube corpus).
  - Shots: `design/shots/frames/{paper,ink}-<frame>.png`, plus `skel-display-{S4-0.6,S6}.png` (Protest Revolution skeleton, for comparison). `board-ink.png` re-shot (the old one was paper, see below).
  - **`shoot.mjs`:** a clip selector ending in ` *all` writes one PNG per match. Storyboard frames: `node design/shoot.mjs "http://localhost:5173/design/storyboard?fz=1&theme=ink" design/shots/frames/ink.png 1520 '.frame *all'`.
  - **Gotcha:** `npx serve` 301-redirects `x.html` to `x` and **drops the query string**. Use clean URLs (`/design/board?theme=ink`, `/design/storyboard?theme=ink`). Storyboard params: `theme`, `skel=display`, `fz`.
  - **Token change:** `.stage-dramatic` primitive in `tokens.css` (paper: black stage, white roaches, `--red-bright` text; ink: red stage, black roaches, white text). Used by S6 and the Victory kinetic panel.
  - **Proposed, need Vali's yes:**
    - S4/S6 skeleton face: **Public Sans Black** (Protest Revolution's brush spurs make 0 and 6 noisy). S4a confirms.
    - S4 roach s 5.6 (not `--roach-type` 4, which reads as a dashed line) at 7.4 px slot spacing: ~1,000 roaches for 06/06/2026, versus about 380 at the end of S3. S4a must reconcile (top up during converge, or thin the slots).
    - Map roach size: spec size read as body length (s = size ÷ 1.9), times √(zoom ÷ 2.4) on wide shots. Without that the 20 Jul frame is solid ink.
    - The founder roach stays at s 36 through S3 as an anchor.
  - Board nit fixed in the storyboard: the barricade label sits clear of Patel Chowk.
  - Open nit: the scrubber's riding roach touches the active node label when that label sits in the middle row (20 Jul, 25 Jul).
- 2026-11-12, **Vali's review 1 of the F2 storyboard** (decisions):
  - **Theme: ink.** `tokens.css` now defaults to ink (`:root:not([data-theme="paper"])`); paper is opt-in with `<html data-theme="paper">`. Board and storyboard default to ink (`?theme=paper` to compare).
  - **Skeleton face: Public Sans Black** for the S4/S6 date (Protest Revolution stays for headings).
  - **S4 roach count:** S3.5 ends with 380 roaches; the rest (~600 more for 06/06/2026 at s 5.6, 7.4 px spacing) **join from the screen edges during converge**. S4a builds to this.
  - **Map roach size:** s = spec size ÷ 1.9, × √(zoom ÷ 2.4) on wide shots. Approved.
  - **Founder roach shrinks into the swarm** over S3 p 0–0.3. No s 36 marker after S2.
  - **No `[MISSING]` placeholders** for the S4 caption, the S6.5 heading or the S9 headline: those slots are left empty until Vali supplies text. (Overrides the CLAUDE.md `[MISSING]` rule for these three only.)
  - **Victory leaves the map stage.** It is a standalone full-bleed kinetic-type frame (dramatic stage, like S6), key frame at p 0.85. S5 ends at node 5. Open: S6 repeats “Victory” under the date; merge or keep both.
  - **S8 quotes are centred**, with no role label (“POET”).
  - **New scene S3.5, “The claim and the correction”**, between S3 and S4. It ports v2's swarm split (`index.html` “01 · The swarm”, SPLITS 2 → 3: phyllotaxis clusters, anime.js `stagger({ from: 'random' })`, `inOutQuart`). The 380 roaches sort into “Indian” / “Pakistani” at the minister's 49 % (red cluster), then re-sort to Dipke's >94 % Indian. Facts: `start_pushback` (both sentences verbatim) and metrics rows `Share of Pakistani followers` / `Share of Indian audience`, both `disputed`. The unclaimed complements (51 %, ≤6 %) are drawn but carry no number. S4's converge starts from S3.5's end layout. Key frames: p 0.30, 0.60, 0.90.
  - Storyboard is now 20 frames; shots re-taken in both themes (`design/shots/frames/`).
- 2026-11-12, **Vali's review 2: F2 signed off.**
  - **“Victory” appears only in S6** (the finale with the Pradhan line). The standalone Victory frame is removed, and the S5 scrubber has no Victory marker (`S5_NODES` filters it out). S5 ends at node 5 (20–24 Jul). The `victory` node stays in `timeline.json` for its facts; S6 may draw on them. The scrubber axis still runs to 25 Jul (`parts.js`); S5b can trim it.
  - **S3.5 claim frame uses the minister's numbers on both sides:** Pakistani 49 % (data) and Indian 51 % (= 100 − 49, attributed to the same claimant and status). The correction frame keeps “Elsewhere” without a number.
  - Storyboard final: 19 frames, both themes, in `design/shots/frames/`.
- 2026-11-12: F3 kickoff written. **Vali: every chat from F3 on (F3, all scene chats, M9) runs on Opus 5.5 at high effort.** BUILD_PLAN's effort column is updated to match.
- 2026-11-12, **F3 built**. Shell, controller, budget, placeholders, harness, 13 briefs and 13 targets files. Decisions made in F3 (Vali to confirm):
  - Prologue, S5 and S6 share **one pinned block** with three stages, so S4→S5 and S5→S6 hand over in place with no slide (kickoff: "pinned stages: the prologue, S5 and S6"; spec: "release flows into S5 with no jump"). Charts are three separate pinned blocks; S8 is one pinned block of quote scenes.
  - Flow-scene p runs from the section's top entering the viewport to its bottom reaching the viewport bottom; `S10:top`-style targets exist for "top of section" frames.
  - `tick(t, dt)` added to the scene contract for idle motion (the kickoff contract had only `update(p)`); `?still` freezes it for QA.
  - The S8 count comes from `quotes.json` (`selected: true`, 3 today), so adding a quote adds a 100vh scene without touching the budget.
  - New `src/lib/star.js` so S1, S3.5 and S5 can emit `*` links before S10 exists; S10 owns it afterwards.
  - Kept anime.js on the jsDelivr CDN as the kickoff asked (v2 pattern). Spec §8 wants no runtime network calls: self-host it in M9.
  - Desktop gate at 1280×720 (CLAUDE.md), not the spec's 1024 px. Note: a 1280×800 laptop's browser viewport is usually under 720 px tall, so it will see the gate.
- 2026-11-12, **Vali approved F3** as built, including the decisions above. Next chat: **S4a** (`Read CLAUDE.md, then docs/build/STATUS.md and docs/build/scenes/S4a.md, and do S4a. Stop for my review at the end.`).
- 2026-11-12, **S4a built** (awaiting Vali's review). Files: `src/lib/skeleton.js` (rewritten, contract above), `design/spike-s4a.{html,js}`, shots in `qa/v3/S4a/`. `s04-date.js` untouched (still the F3 placeholder for S4b).
  - **Correction: the "~1,000 roaches" in F2 was wrong.** At s 5.6 and 7.4 px spacing, one track along the skeleton needs **386** slots at 1440×900 (the F2 raster picker made **334**, and that is what the approved `ink-S4-0.6.png` shows). That is about S3.5's 380, so the "~600 join from the edges" premise doesn't hold at the approved look.
  - **New option, `lanes`** (raises slot density, as the spec's legibility rule allows; the face weight is unchanged): parallel tracks offset along the stroke normal, in a brick pattern. Slots at 1280×720 / 1440×900 / 2560×1440: **lanes 1: 341 / 386 / 386 · lanes 2: 670 / 762 / 762 · lanes 3: 1,007 / 1,143 / 1,143.** The pool (1,200) covers every case because of the size rule; 3 lanes leaves 57 spare.
  - **Recommendation: lanes 3.** It reads as a bold date at both viewports (the single track reads, but light), and it restores Vali's ~1,000 and the join-from-the-edges beat: **S3.5's 380 take the centre lane** (386 slots, so +6 joiners) and draw the thin date first; **763 joiners** (627 at 1280×720) walk straight in from the nearest edge (T 289 · B 94 · L 193 · R 187 at 1440×900) and thicken it. Paths: mean 360 px, max 473 px against 729 px of converge scroll (S4 p 0–0.45); 299 / 383 of 583 at 1280×720; 598 / 762 of 1,166 at 2560×1440. Parallel paths, so no crossings. Spike: `?lanes=3&plan`.
  - **Runtime, not bake.** Reference strokes: 60–66 ms cold, 17–22 ms warm (headless); 33–60 ms in Vali's Chrome. Viewport-independent, and layout costs 1–2 ms per size. The F2 version re-thinned at viewport size: 97 ms at 1440×900 and growing with area. A bake would save at most ~60 ms once at boot, but it would add a tool, a data file per date string (S4 and S6) and a regeneration step. Stage 1's output is plain JSON-able arrays if M9 ever wants one.
  - **Frame time** (all slots shimmering ±3 px, lanes 3, DPR 2): Vali's Chrome (M-series, 120 Hz) **120 fps**, frame p95 8.6 ms, draw 1.2 ms at 1434×788; 120 fps, p95 9.1 ms at a 2560×1440 virtual viewport. Headless: 59 fps, draw 2.0–2.3 ms at 1280×720, 1440×900 and 2560×1440.
  - Storyboard re-shot to scratch: S4-0/0.45/0.6/0.9 and S6 differ from `design/shots/frames/` **by slot positions only**. The new slots are evenly spaced along arc length, while F2's raster-scan picker left gaps; same box, size and composition. Every other frame is byte-identical. `design/shots/frames/*` not re-shot (never-touch); `storyboard.js` unchanged.
  - QA: `cdp-scroll` S4 targets down + up at 1440×900 and 1280×720: all PASS (placeholder). `qa-shell`: ALL PASS.
  - For S4b: shimmer in the spike is `j = 3 · sin(ωt + φ)` along `a`, ω in 1.2–2.4 Hz (peak ≈ 34 px/s), legs phase `legs0 + 1.5 j`, heading flipped for half (`hash01(i, 1)`). Slot i = pool roach i. `?speed=` scales ω for tuning.
- 2026-11-12, **Vali's review of S4a: approved.**
  - **Lanes 3** for S4 (`skeleton(…, { lanes: 3 })`; the spike now defaults to it). The function default stays 1, so S6 and the storyboard are unchanged.
  - **Converge plan adopted:** S3.5's 380 take the centre lane; ~760 joiners walk straight in from the nearest edge and thicken the date.
  - **Runtime skeleton** (no bake).
  - **Legibility passes** at 1440×900 and 1280×720.
  - **Roaches were too slow:** shimmer doubled from 0.55–1.15 Hz to 1.2–2.4 Hz, and the legs swing 1.5× the displacement (was 1.1×). S4b uses these, and should keep the converge and release walks brisk to match.

- 2026-11-12, **prologue chat (S0–S4b in one chat, Vali).**
  - **Gate 1 (static key frames):** approved by Vali with two additions: more roaches after the spawn (760), and a scroll pause before the BJP minister's 49% claim. Also approved: S4:0 as the handover frame with the storyboard S4-0 picture at p 0.08; the 120-roach map landing; converge ending at 0.52; keeping `tools/shoot-frames.mjs`. Committed and pushed as `2084092`.
  - **Gate 2 (motion):** hero roaming plus glitch slices (≤ 35% displaced, ≤ 16 hits); cursor flee; the S1 keyword idle (1 px stepped jitter, a roach walking the underline); the S2 timed sequence; S3 births walking out from their parents; the S3.5 sorts; the S4 converge, shimmer and release.
  - **Handovers:** S0→S1→S2→S3→S3.5→S4 measure **0.000%** differing pixels at 1440×900 and 1280×720 (`tools/qa-handover.mjs`). **S4→S5 fails (44%)**: S5 is still the F3 placeholder, so S5a must build to the S4 p 1 contract above.
  - QA at both sizes: all targets PASS down and up, monotonic, compare down≠up 0.000%. `qa-shell` ALL PASS. `qa-sequence` ALL PASS. Live clock: 60 fps (headless, vsync-capped) at S0, S1, S2, S3 0.95, S3.5 0.42/0.69, S4 0.3/0.6/0.9.
  - **Spec deviations:**
    - The S2 keyword doesn't open its letter-spacing (it reflowed the quote), so it only scales.
    - The founder is red while it forms and turns white as it starts to walk.
    - Hero roaches standing on a glyph are drawn in the background colour, cut into the letter (v2 hero).
- 2026-11-12, **Vali's review of the prologue motion** (edits made; committed and pushed):
  - **S0:**
    - `--fs-hero` 200 → 150 px.
    - Roaches move at 45–90 px/s (was 16–42).
    - As the reader scrolls, a crew of 14 cleaner roaches sweeps the word away band by band (p 0.02–0.90, pure in p). The word no longer scales or fades.
    - The "Scroll" cue sits on a white label and fades as soon as scrolling starts. S1 no longer shows the word.
  - **Type:** **Redaction** (MCKL, OFL-1.1, self-hosted from redaction.us 2.001: Regular, Bold, Italic, plus the 35%-degraded Bold) **replaces Public Sans as `--font-text`** (body copy, the quote, captions, labels).
    - Public Sans stays as `--font-ui` (the S0 cue) and as the S4/S6 skeleton face.
    - `tokens.css` and `fonts.css` changed with Vali's OK. **DESIGN.md is superseded on the body face.** Scenes S5–S10 inherit Redaction through the token.
  - **S1:** the keyword is set in Redaction 35 Bold, white on a procedural dry red brush stroke (no wavy underline). In the sequence, both letters and brush collapse into particles.
  - **S2 sequence:** the founder walks one Bézier curve whose tangent is its heading, ending on its resting heading, so it no longer flips at 1400 ms. The leg cycle is continuous.
  - **S3:** 1000 roaches fill the screen edge to edge. The text "350,000+ Online sign-ups · CJP claim · claimed *" (metrics `Online sign-ups`) shows at p 0.55–0.94 in a bottom-left label box.
  - **S3.5:** 240 vh, a longer pause before the claim, and red applied gradually during the sort.
  - **S4:** corner brackets removed.
  - QA after the edits (both sizes): every target passes down and up, compare down≠up 0.000%. Handovers S0→…→S4 are 0.000%. `qa-sequence` and `qa-shell` ALL PASS. 60 fps live (headless).
- 2026-11-12, **Vali's review 3** (edits made; committed and pushed):
  - **Scrolling backdrop:** `backdrop` in `s00-hero.js` is a seamless vertical halftone tile drawn on `layers.back`. Its offset is prologue scroll (vh) × 0.5 vh, computed from the budget, so it is pure in p and continuous across scenes. Every prologue scene calls `backdrop.scroll(def, p)` in `update`. During the S2 sequence it glides to its S2 p 0 offset. **For S5a:** the backdrop stops at S4 p 1; the map stage replaces it.
  - **S0:**
    - Every roach walks to a spot on the word (0.02–0.28), scrubs a stroke across it (to 0.59), and the remainder fades (0.44–0.56). Then the roaches dissolve (0.55–0.97). S0 p 1 is an empty stage; S1 no longer draws a swarm.
    - The scroll cue is a thin outlined "Scroll" label with two CSS-animated chevrons (frozen under `?still`). No roach.
  - **S1:**
    - Typewriter: one span per character. Typed = max(scroll: all by p 0.30, time: 55 chars/s from entering), so QA frames are reproducible. The keyword's brush grows with its letters, and the `*` appears with the closing quote mark.
    - The hint is a red brush arrow drawn over p 0.38–0.46, with "click the word" in italic at its tail.
  - **S2:** a circular portrait of Abhijeet Dipke above the founder (`people[].image`, CC BY 4.0, credit line shown). Under it: "Abhijeet Dipke is spawned *", the attribution, the photo credit, and a thin line down to the roach.
  - **S3:** 260 vh. The full swarm at 0.78; the sign-ups label stays up until 0.92.
  - **S3.5:** the cluster labels arrive with the sort (0.17–0.23), and the claim caption follows at 0.40.
  - QA: every target passes both ways at both sizes, down≠up 0.000%. Handovers S0→…→S4 are ≤ 0.11% (the half-pixel backdrop move over the 1 px between the shots). `qa-sequence` and `qa-shell` ALL PASS. 60 fps idle and while scrolling (headless).
- 2026-11-12, **Vali: the charts reuse v2's "07 · The apparatus" spokes network** (13 state actors around the CJP). Recorded in `scenes/S7.md` → Vali's notes. The actor data has to be ported into `data/story` with sources first.
- 2026-11-12: **next chat is the map (S5a + S5b + S5c in one chat)**, run by Vali in a new chat.
- 2026-11-12, **S5 chat (map stage S5a+b+c), gate 1** (Vali reviewing; motion not started; committed at Vali's request):
  - Built: beat model, map + camera (van Wijk zoom, single-site pull-back as roaches grow), roach encodings + legend, scrubber (drag/keys/marker glide, release snaps to the nearest hold), narrative card, 20 Jul hour-by-hour overlay (route, police cordons with sourced strength labels, red/white barricades, tear gas, lathi charges, pellets, detentions, closed stations; all positions illustrative), HUD clock on 20 Jul.
  - Vali's review 1: narrative body copy instead of facts only; taller video; hour-by-hour Sansad Chalo; more imagery. Review 2: sources as small footnotes; full-screen map with the narrative in small boxes and pointer lines; contrasting barricades.
  - Sub-agents: rail/scrubber/card (built, lead-reviewed), 20 Jul research, imagery catalogue.
- 2026-11-12, **S5 chat, Vali's review 3** (labels legible over the swarm; legend smaller / collapsible; then motion and finish): done. Labels ringed and solid; legend is a dropdown; idle motion added.
  - QA: S5 targets (11) PASS down and up at 1440×900 and 1280×720, p monotonic. Compare down≠up 0.000% everywhere except two card-photo boxes (S5-0720 1.06% / 1.29%, S5-0720-0720 0.56% at 1280), where the photo was still decoding in one pass (load timing, not logic). `qa-shell` ALL PASS. Handover S4→S5 0.033% / 0.043% PASS; **S5→S6 FAIL 16.3% / 18.9%** because S6 is the F3 placeholder (S6 must build to the S5 p 1 contract, now written into `scenes/S6.md`).
  - Frame rate: headless measured 30 fps across the whole piece this run, prologue included (machine load; the prologue was 60 fps earlier). S5 JS ≈ 0.6 ms/frame. Re-measure on Vali's Chrome.
  - **Next chat: the remaining scenes** — kickoff `docs/build/kickoffs/remaining.md` (S6 → S6.5 → S7 → S8–S10; then M9).
- 2026-11-12, **remaining-scenes chat, gate 1** (S6, S6.5 by the lead; S7, S8–S10 and the apparatus data by sub-agents):
  - **S6** (`s06-finale.js/.css`): S5's 400 map roaches walk onto a 2-lane 25/07/2026 skeleton (s 7.2, spacing 9.2) and grow; joiners fill from the edges; from p 0.14 the dramatic stage floods out from the date as a halftone dot-screen wipe (roaches inside turn black); brackets 0.30–0.40; "Victory" wipes in 0.55–0.72; line 0.75–0.83; peel-away downward from 0.76 (~45% gone by p 1). Handover S5→S6 **0.000%** at 1440×900 and 1280×720. Reads `s5End.poses()` after S5's lazy layout (polls until set).
  - **S6.5** (`s06-5-epilogue.js/.css`): paper reading section; framing, bridge[], status_line; all disputed October facts on the right, same-date claims side by side; no heading; top edge is a red dot screen dissolving into paper (continues S6's red).
  - **Shell note for M9:** `scrollbar-gutter: stable` paints a 15 px `--bg` strip at the right in headless/classic-scrollbar browsers (visible against S6's red and the paper sections).
  - **Apparatus data draft:** `data/story/apparatus.json` (13 actors, 31 actions, 4 `new_sources`; research log `docs/build/f1/apparatus_research.md`).
- 2026-11-12, **Vali's review of gate 1** (remaining-scenes chat):
  - **S7 charts redesigned with anime.js** (Vali wrote "anima.js"; read as anime.js v4.5, already in the import map; no new dependency). Paused timelines driven by `seek(p)`, so update(p) stays pure.
  - **v2's apparatus spokes are included** as a new scene **S7d** (`s07-apparatus.js`, own pinned block, **300 vh**, after S7c; budget edited). Its `new_sources` are merged at runtime in its init like S5's (centralise in `load.js` at M9).
  - **S5 scrubber: log time axis** (position ∝ −log(5 + days left to 24 Jul)) with every node marker ≥ 150 px from the next ("more visual space between each section"); `scrubber.js` + `.css` edited at Vali's request. Small "LOG" tag left of the strip; aria-label says so.
  - **Quotes: Ambedkar only, typed like a typewriter.** `SELECTED_QUOTES` in `docs/build/f1/build_story.py` → Ambedkar only; regenerated (only `quotes.json` changed). Quote scenes are now **160 vh** each (was 100), so S8 = S8a only.
  - **S9 handle buttons: plain and simple.**
- 2026-11-12, **remaining-scenes chat, after Vali's review** (committed and pushed to `build/scene-by-scene` at Vali's request):
  - **S7a–c redesigned with anime.js:** one paused timeline per chart (1000 ms = p 0→1), `update(p)` = `tl.seek(p × 1000)`; every tween preset to its start value so backward seeks match. A: drawn line on a zoomed scale that widens to 0–60M, halftone area, a roach walks the pen tip. B: 1,000-square waffle of all views (one square = 0.1%), top 10 channels outlined, the party channel as 0.63 of a square in red. C: one roach per video (1,244) by upload day and tag, empty days skipped (said on the axis). Import map now keeps only `d3-scale@4.0.2`. Shared helpers in `src/scenes/s07/common.js` (`headHTML`, `noteHTML`, `S7_CSS`, `fromTo`, `drawIn`, …). Header count "n / 4".
  - **S7d apparatus** (`s07-apparatus.js`, `s07d/{model,net}.js`): hub → spokes by group (0–0.27) → one-actor-at-a-time walk with dated actions and stars (0.31–0.95) → full network + roster. Hover/click pins a record. Merges sansad then apparatus `new_sources` (stable numbering 97–116, 117–120). All 13 actors, 31 actions shown. Targets: `targets/S7d.json`.
  - **S8:** Ambedkar only; typewriter pure in p (rule 0–0.08, typing 0.08–0.70, attribution 0.72–0.80, fade 0.92–1); the roach walks the rule with the typing; caret blink tick-only. **S9:** two plain solid follow buttons + plain share row.
  - **QA:** `cdp-scroll` targets S5, S6, S6-5, S7 (9), S7d, S8, S9, S10 at 1440×900 and 1280×720: **0 FAIL**, monotonic both ways (`qa/v3/final/`). `qa-shell` **ALL PASS** (49/49 deep links). Handovers S4→S5 0.033% / 0.043%, S5→S6 **0.000%** at both sizes.
  - **Still gate 1 (static, Vali to approve before motion):** S6 and S6.5 motion polish (S6 already scrubs pure in p), S10. Open questions are in GAPS.md "Remaining scenes".
- 2026-11-13, **Vali: build a hybrid on a new branch `build/hybrid`** (v2's thematic narrative spine + v3's visual system, roach engine and sourcing). Evaluation and running order: [kickoffs/hybrid.md](kickoffs/hybrid.md); comparison sheets `qa/hybrid-eval/`. Starts with a Gate 0 storyboard.
- 2026-11-13, **hybrid chat, Gate 0** (branch `build/hybrid` from `daea514`; `src/` and `budget.js` untouched; awaiting Vali):
  - **X-account conflict resolved from primary sources:** the original handle @CJP_2029 was withheld 21 May → order revoked by the Delhi HC 7 Jul (Day 48); @Cockroachisback opened **"hours after"** the block (Business Today, verbatim), not "within minutes" (ledger, via Wikipedia). "Forty-eight days of silence" is wrong; proposed "Blocked for 48 days. Back within hours." Ledger correction proposed, not applied (needs Vali's OK).
  - **Proposed running order** (GATE0.md §2): prologue (unchanged) → **Withheld, new scene W between S3.5 and S4** → S4 → S5 cut to street 4 beats + 20 Jul 3 hours + 23 Jul + **three ledgers on the map stage** → S6 (in-place handover kept) → S7a only → **October (new block, replaces S6.5)** → **the roll (new block)** → S7d → S8a → S9 (v2 closing line) → S10. S5 2,070 → 1,370 vh; `main` block 3,300 → 2,840 vh. S7b/S7c out of the flow (Vali decides).
  - **New data drafts** (research sub-agents on Sonnet, lead spot-checked): `data/story/withheld.json`, `october_counts.json`, `voter_roll.json` + notes in `docs/build/research/`. Not yet read by any scene. New sources merge at runtime after sansad and apparatus.
  - **Storyboard tooling (storyboard only, nothing ships):** `design/hybrid/{copy,chrome,overlay,frames}.js`, `hybrid.css`, `frames.html`, `gate0.html`; `tools/hybrid/shoot-gate0.mjs` (live v3 + injected chrome, or the frames page), `tools/hybrid/copy-md.mjs` (COPY.md from copy.js). `npx serve` redirects `*.html` to clean URLs and drops the query: link `/design/hybrid/frames?f=…`.
- 2026-11-13, **hybrid Gate 0, revision 1** (Vali's review; still awaiting sign-off; nothing committed). Details: [hybrid/GATE0.md](hybrid/GATE0.md) "Revision 1".
  - **Redesigns (anime.js prototypes in `design/hybrid/`, to move into `src/` at Gate 2):** ch. 07 "watched" = a 1,000-dot halftone roach screen (`watched.js`), 0.1% of corpus views per dot, hover to see a dot's video. Ch. 10 apparatus = the cage (`cage.js`): radial calendar, four group rings, 31 action bars drawn by a sweep hand, hover a bar or a roster actor. Both seek a paused timeline (`update(p)` pure).
  - **`src/` edits at Vali's request:**
    - `s06-finale.js/.css`: brackets removed, "Victory" black.
    - `s09-cta.js/.css`: follow buttons with inline Instagram and X icons on a 640 px grid; no headline slot.
    - `s10-footer.js/.css`: ink (no `.reading`).
    - `qa-shell` ALL PASS.
  - **New chapters and beats:** ch. 02 NEET "The joke found its grievance." (`data/story/neet.json`); October beat "10 October, one day" (`data/story/detentions.json`, `media/people/dhruv-rathee.jpg` CC BY 3.0). Rathee was taken from home before 8 am; Dipke, Das and Ranka were detained on landing at about 10.30 am. Dipke was not detained at dawn.
  - **Chapters renumbered:** 02 NEET, 03 Withheld, 04 street, 05 20 July, 06 ledgers, 07 watched, 08 October, 09 roll, 10 apparatus.
  - **Other changes:** title headlines are one line; map labels are capped at 3 per beat with one leader line; the closing line gets its own 140 vh scene.
  - **Proposed `main` block:** 3,040 vh. **Whole piece:** 5,620 vh + S10.
- 2026-11-13, **hybrid build** (Vali signed off Gate 0 with decisions: lead's call on 4b/4c placement → ledgers on the map stage, YouTube after Victory; NEET headline "22 lakh students, one cancelled exam."; Rathee photo as is; length fine; "build with motion and anime.js; commit and push when done").
  - **Lead built:**
    - shared chrome and copy (`src/lib/chapter.*`, `src/data/copy.js`);
    - the budget;
    - `load.js` source merging;
    - NEET (answer sheet, stamp, swarm rings the sheet);
    - HELD (two accounts, withheld notice, movers, 48-day tally);
    - S5 hybrid mode (4 street beats, 3 hours of 20 Jul plus 23 Jul with the dead-signal zone, the 1.5 km order ring and a grouped metro label, 3 labels per beat, one leader line, the three ledgers on a veil with anime.js-seeked dots);
    - CLOSE (the line typed in word by word).
  - **Sub-agents built (lead reviewed):**
    - WATCH (the 1,000-dot roach screen, 93%, hover a dot for its video);
    - CAGE (radial calendar, 31 bars drawn by a sweep hand, roster and bar hover, pin and keyboard);
    - OCT (2 Oct pen, 10 Oct one-day strip with Rathee / plane, 15,000-roach field with 8 count lines and hover tips, Mumbai, the cell, Amnesty);
    - ROLL (pick yourself on a 100-entry roll, 13 struck, 9,688 marks with 1,300 struck).
  - **Ledger fix** (Vali: primary source wins): timeline `start_pushback` "reappeared within minutes" → "Hours after the block…" (Business Today). Applied in `timeline.json`, `narrative.json` and `build_story.py`. The S10 disclaimer scope now runs 16 May – 7 Nov 2026.
  - **QA:**
    - `cdp-scroll` targets for NEET, HELD, S5-hybrid, CLOSE, WATCH, CAGE, OCT and ROLL: 0 FAIL, p monotonic down and up, at 1440×900 and 1280×720.
    - Handovers S3.5→NEET 0.095%, NEET→HELD 0.078%, HELD→S4 0.083%, S4→S5 0.001%, S5→S6 0.000%.
    - `qa-shell`: ALL PASS (18 scenes, 77/77 deep links).
    - The v3 targets for removed or re-cut scenes moved to `targets/v3-retired/`.
  - `.gitignore`: raw down/up shots, dev `shots/` and compare sheets under `qa/hybrid` (as for `qa/v3`).
- 2026-11-13 (hybrid, review 2, Vali): chapter openings get their own full-bleed card; Mumbai beat cut from OCT and the Amnesty quote stands alone; HELD notice centred; ledgers on the grid with collision-free labels (caption no longer over the scales); Victory roaches drift and fade back after the date; CLOSE out of the flow; S8a quote in Protest Revolution; S9 follow-only (share row removed); S10 compact (accordions + modals); 12-column grid; living halftone; reading-progress bar. From the UX review agent: WATCH counter reads exact view shares (7% matches the caption; climbs to 93% for the window, never 100%), HELD tally parks on Day 9 under the 29 May caption, NEET sheet and HELD boxes clear of the caption column at 1280, stars ≥ 12 px with a 24 px hit box.

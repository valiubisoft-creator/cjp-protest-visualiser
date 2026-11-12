# Build status

Branch: `build/scene-by-scene`. Plan: [BUILD_PLAN.md](BUILD_PLAN.md). Decisions are in BUILD_PLAN section 4.

| Chat | State | Effort (Opus 5.5) | Notes |
|---|---|---|---|
| Plan | done 2026-11-11 | — | Decisions D2–D8, D12 and D13 resolved |
| F1 Editorial and data ledger | **done** 2026-11-12 | medium | Kickoff: [kickoffs/F1.md](kickoffs/F1.md). Output: `data/story/*.json`, generator `f1/build_story.py`, [GAPS.md](GAPS.md) |
| F2 Design system and storyboard | **done** 2026-11-12 | high | Brief: [kickoffs/F2.md](kickoffs/F2.md). Theme: **ink**. Visual target: `design/storyboard` + `design/shots/frames/` (19 frames) |
| F3 Shell and harness | **next**: kickoff ready, [kickoffs/F3.md](kickoffs/F3.md) | high | Writes the per-scene briefs in `scenes/`. Must add S3.5 to the scene list and scroll budget |
| S4a Skeleton spike | waiting on F3 | high | |
| S0 | — | high | |
| S1–S2 | — | high | |
| S3 | — | high | |
| S3.5 The claim and the correction | — | high | **New scene** (Vali 2026-11-12). Suggest it rides with the S3 chat |
| S4b | — | high | |
| S5a / S5b / S5c | — | high | |
| S6 | — | high | |
| S6.5 October epilogue (text) | — | high | |
| S7 | — | high | |
| S8–S10 | — | high | Quotes are placeholders |
| M9 | — | high | Plus architect and GPU review agents |

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

_F3 defines the scene module, controller and roach contracts here._

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

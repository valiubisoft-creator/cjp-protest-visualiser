# Build plan: scene-by-scene scrollytelling (v3)

Branch: `build/scene-by-scene`. Plan only. Nothing here is built yet.

Inputs read: `PROTEST_VIZ_SPEC.md` (the scene spec), `Claude.pdf` (the 22-page sourced research dossier: timeline, police tactics, claimant-labelled metrics, disputed claims), and the current repo (`index.html` "Field File", `data/`, `media/`, `static/`, `docs/archive/within-earshot.md`).

---

## 1. Where we actually stand

**Tech we keep (overrides spec section 3):**

| Spec says | We use | Why |
|---|---|---|
| Vite build | No build step. Native ES modules plus an import map, served with `npx serve .` | This is what the current piece does |
| GSAP + ScrollTrigger | anime.js v4.5 `onScroll` + CSS `position: sticky` for pinning, with one small scroll controller of our own | Already used throughout `index.html` |
| D3 v7 everywhere | **Decision needed (D10).** The current piece hand-rolls SVG | See section 5 |
| opentype.js skeleton bake (Node) | A browser-run bake page (`tools/bake-skeleton.html`): rasterise glyphs on canvas, Zhang-Suen thinning in vanilla JS, download the JSON, commit it | No dependency, and nothing runs at page load |
| `src/roach/Roach.js` wrapping the "existing animation" | Extract the existing procedural `roach(ctx, x, y, rot, s, legs)` from `index.html:512`, then wrap it in a class with `update / draw / setPath / setTarget` | It is already vector, leg-animated and cheap. Pre-render a sprite atlas only if profiling says so |
| Base map "from the data folder" | Not in the folder. Bake it once from OSM with the Within Earshot prep script (in the `geo-spatial-audio` skill), using a wider bbox. Output to `data/geo/` | The spec says stop if it's missing. This is the fix |

**Already built and reusable:**

- S0 is largely done. The hero has the word "Cockroaches" glitched by roaches crawling over a glyph mask (`index.html` hero block, about lines 590–735), plus a wandering swarm with cursor flee.
- The roach renderer, swarm sim, `hiDPI` canvas helper, tooltip, sources list markup and step/scrub wiring.
- Cursor SVGs, keystroke audio and the typewriter idea from the old intro screen. These could serve S1.
- The `tools/cdp-scroll.mjs` headless scroll QA harness.
- Within Earshot geography lessons. The protest site is **Jantar Mantar Road** (OSM way 24583495), not the observatory point. The verified origin and projection approach carry over.
- 48 openly licensed Wikimedia photos with full credits. July only: none exist for October.

**Gaps (the hallucination traps):**

1. **No story data file exists.** All facts for S5 and S6 sit in a PDF with no text layer. `data/` holds the YouTube corpus, not the spec's `meta / timeline / sites / sources` contract.
2. **No verbatim CJI quote.** The sources give only the fragments "cockroaches" and "parasites", plus his later clarification.
3. **No activist or poet quotes at all (S8).** This is the highest fabrication risk in the project.
4. **Headcounts are qualitative** ("hundreds", "thousands", "more than 10,000", "tens of thousands"). There is no number for `ceil(headcount / perRoach)`.
5. **`data/events.json` is still `[SAMPLE]` placeholder video.** `timeline_clips.json` (1,244 clips) is machine-tagged and unreviewed.
6. **No CJP social handles in the data (S9).**
7. **Name spelling conflict:** "Abhijit" (spec) vs "Abhijeet" (PDF, current page).
8. **The PDF's own caveat:** several figures come via Wikipedia and need checking against the originals before publishing.

---

## 2. Recommended approach: one foundation pass, then one chat per scene

Agents drift and invent when three things combine: facts that aren't in a file, a huge context (a 1,225-line monolith, a 556-line spec and a 22-page PDF), and open scope. The plan removes all three.

1. **Facts get transcribed once into a ledger, then nobody reads the PDF again.** Every scene chat reads only `data/story/*.json`. If a fact isn't in the ledger, it can't go on screen.
2. **Split the code into one file per scene (still no build step).** Each chat owns one file and can't break the others.
3. **Each scene chat gets a one-page brief** containing only its own spec section, the data keys it may use and its contracts. It never gets the whole spec.
4. **Design before motion.** Each scene first produces static key frames at fixed `p` values for your approval. Animation only starts once the frames are signed off.
5. **Hand-off through files, not memory.** `docs/build/STATUS.md` and the decisions log carry state between chats. A project `CLAUDE.md` carries the rules and loads automatically in every chat.

### Phase 0: Foundation (3 chats, in order, each ending with your sign-off)

**F1. Editorial and data ledger (Opus 5.5, medium).** Highest stakes, so it gets its own chat.

- Transcribe the PDF into structured, claimant-labelled files:
  - `data/story/sources.json`
  - `timeline.json` (nodes, sub-beats, facts with `source_id`)
  - `metrics.json`, from the consolidated CSV table
  - `people.json`, `sites.json` (lat/lon checked against OSM)
  - `meta.json`
- Every row carries `claimant` and `status` (documented, alleged, claimed or disputed), as the PDF recommends.
- A second agent then checks the ledger line by line against the PDF page images, and every mismatch is listed.
- Write `docs/build/GAPS.md`: everything the spec needs that the ledger can't supply (section 1 gaps), plus all open decisions (section 4).
- **Exit:** you review the ledger and answer the decisions. Nothing downstream starts until then.

**F2. Design system and storyboard (Opus 5.5, high).** This is your design-control gate.

- `styles/tokens.css`: palette, type and spacing, so one file re-skins the piece.
- A static `design/board.html`: type specimens (including the digits and "/" the S4 skeleton needs), the roach at every size, halftone variants, the scrubber strip and rail card, chart styling, and a quote card in Latin and Devanagari.
- A **storyboard**: one static key frame per scene at its key `p` values (for example S4 at p 0, 0.45, 0.6 and 0.9), as a single scrollable page plus screenshots.
- **Exit:** you approve the board and storyboard. These frames become the visual target each scene chat is checked against.

**F3. Shell and harness (Opus 5.5, medium).**

- Split into modules with no behaviour change to anything reused:

  ```
  index.html
  src/main.js
  src/scroll/controller.js
  src/scenes/sNN-*.js
  src/roach/roach.js + swarm.js
  src/lib/*
  src/data/load.js
  ```

- The scroll controller turns scroll into per-scene `p` using the spec's budget table. Scenes follow the spec's `init / enter / update(p) / exit / resize` contract and its determinism rule.
- Placeholder scenes at the correct heights, the desktop gate, and a `?debug` HUD showing scene and `p`.
- A `?p=S4:0.6` deep-link that jumps to an exact frame. QA and design review depend on this.
- Extend `tools/cdp-scroll.mjs` so each scene has a `targets.json` of key frames. Screenshots get compared side by side with the F2 storyboard.
- **Exit:** scrolling the placeholders logs correct `p` values both ways.

### Phase 1: Scene chats (each one is a fresh chat)

| Chat | Scope | Notes | Opus 5.5 effort |
|---|---|---|---|
| S0 | Hero: port the existing glitch hero into the module and tune it to spec | Mostly reuse, but it sets the visual tone | high |
| S1–S2 | Quote, keyword click, collapse, founder spawn | One chat because they're coupled by the timed sequence and its reset rule | high |
| S3 | Multiply (scrub-safe birth and death order) | Determinism is the hard part | medium |
| S4a | Skeleton bake tool. A **spike first**: prove the date is legible before building the scene | Highest technical risk. Do it early, even before S0 | medium |
| S4b | Date scene: converge, shimmer, release into the map | | high |
| S5a | Map bake (OSM, wider bbox), line-art base map, projection, camera driven by `p` | Reuses Within Earshot prep | medium |
| S5b | Scrubber (scroll is the single source of truth), rail cards, YouTube click-to-load | | high |
| S5c | Roach encodings (tiers × days), per-node beats from `timeline.json` | | medium |
| S6 | Finale (reuses the S4 engine) | Small once S4 exists | high |
| S7 | Three charts. One chat, or one per chart if they turn out heavy | Mapping chosen in F1 | high |
| S6.5 | October epilogue: a plain text piece after the finale | Text only, no map or roach set-piece | medium |
| S8–S10 | Quotes (placeholders for now), CTA, footer, `[n]` and `*` linking | Activist and poet quotes stay as visible placeholders | medium |
| M9 | Polish: architect review agent, GPU/perf agent, a11y, reduced motion, 4 viewports | Per your usual review process | medium for fixes; review agents run as usual |

**Order:** F1 → F2 → F3 → **S4a spike** → S0 → S1–S2 → S3 → S4b → S5a → S5b → S5c → S6 → S6.5 → S7 → S8–S10 → M9.

Run the prologue scenes (S0 to S4) **sequentially**, because they share one swarm and canvas stack. S7 and S8–S10 depend only on the shell and the ledger, so they could run in parallel in a git worktree once F3 is done.

### The loop every scene chat follows

1. Read `CLAUDE.md`, `STATUS.md` and that scene's brief only.
2. Build static key frames that match the storyboard → screenshots → **your approval**.
3. Implement the motion → QA screenshots at the brief's `targets.json` frames, scrolling both down and up.
4. Run a review agent over that scene's diff only.
5. Check the scene's "Done when" list, update `STATUS.md` and the decisions log, and commit only if you say so.

**Per-scene brief template** (`docs/build/scenes/SNN.md`, written during F3):

- Purpose
- Allowed data keys
- Files it owns
- Files it must not touch
- Contracts it consumes
- Key frames (`p` → expected picture)
- Done-when list
- Your notes (the spec's "Vali's notes" block)

---

## 3. Guardrails for `CLAUDE.md` (auto-loaded in every chat)

- Facts on screen come only from `data/story/`. If one is missing, log it in `GAPS.md` and leave a visible `[MISSING: key]` box. Never paraphrase or fill in.
- Quotes are verbatim. Numbers keep their claimant labels ("police said", "CJP claims").
- No new runtime dependency without your explicit opt-in.
- Stay inside the files the scene owns. Shared modules (`roach`, `controller`, `tokens`) change only in a dedicated chat.
- Pushing to `main` deploys to Vercel, so work happens on this branch only.
- Performance budget: pause off-screen loops, cap DPR at 2, and use the `?debug` frame-time readout.

---

## 4. Decisions

Default model: **Opus 5.5 at medium effort**, and **high** for design-heavy chats (F2, S0, S1–S2, S4b, S5b, S6, S7). The effort column in section 2 follows this.

### Resolved (2026-11-11)

| # | Decision |
|---|---|
| D2 | **Phase 1 (16 May – 25 Jul) is the story.** October becomes a short text-only epilogue (S6.5) after the finale. No map nodes and no set-piece |
| D3 | S5 "Detention" and "Protest and arrest" are the **July arrests and detentions by police**: 18 Jul (Wangchuk forcibly removed to hospital; Dipke alleges he was beaten and detained) and 20 Jul (Sansad Chalo: lathi charges, tear gas, pellets, about 70 detained per police, later denied) |
| D4 | S4 date: **06/06/2026** |
| D5 | Finale date: **25/07/2026** (Pradhan resigns). Taken from my recommendation, which you didn't object to |
| D6 | **Crowd tiers at the builder's judgement**: an ordinal tier mapped to a roach count. **Every stat on screen carries an asterisk `*`** that links to its claimant, status and source in the footer |
| D7 | CJI quote (verbatim, supplied by Vali): "There are youngsters like cockroaches, who don't get any employment and don't have any place in the profession. Some of them become media, some of them become social media, some of them become RTI activists, some of them become other activists, and they start attacking everyone." The keyword token is **"cockroaches"**. Source: supplied by Vali. A `source_id` still needs attaching, so it's logged in `GAPS.md` |
| D8 | Activist and poet quotes: **placeholders** with a visible `[QUOTE PLACEHOLDER]` treatment. Nothing is written by an agent |
| D12 | Spelling: **Abhijeet** Dipke |
| D13 | Rail and scrubber videos: **random picks from `data/timeline_clips.json`**, drawn from each node's date window (seeded, so reproducible) and tagged `review: "pending"` for you to check later. Mostly used in S5 |

### Resolved (2026-11-11, second round)

| # | Decision |
|---|---|
| D1 | v3 is built in `v3/index.html` and promoted to `index.html` at the end; the Field File moves to `archive/index-v2-fieldfile.html` |
| D9 | Palette and type are settled in F2 from two board variants |
| D10 | **D3 approved, added late.** `d3-scale`, `d3-shape`, `d3-hierarchy` and `d3-array` come in via the import map only when S5b (scrubber) and S7 (charts) need them. The F1–F3 foundation and the prologue scenes stay dependency-free. The map projection is hand-rolled |
| D11 | Charts use the YouTube corpus: views over time (line), channels (bubbles), source type per day (stream) |

# Kickoff: the hybrid build (v2's narrative spine, v3's visual system and sourcing)

**Model:** Opus 5.5, high. **Branch:** `build/hybrid`, created from `build/scene-by-scene` (Vali, 2026-11-13). This overrides CLAUDE.md's "stay on `build/scene-by-scene`" for this chat only. Never push to `main` (it deploys).

## Why (the evaluation, 2026-11-13)
Vali prefers v2 (`main`, `index.html`) for narrative flow; v3 (`build/scene-by-scene`, `v3/`) is more visually striking but reads as a chronology with too many facts in the way. The lead compared both step by step (contact sheets: `qa/hybrid-eval/sheet-v2-*.jpg`, `sheet-v3-*.jpg`).
- **v2 wins on:** a claim headline per chapter ("Forty-eight days of silence", "One march, three ledgers", "Thirteen hands on one protest"); one visual metaphor per chapter matched to that claim; short captions (2–4 sentences, one source line); a real second act (October: detentions, voter rolls); a closing argument (the apparatus).
- **v3 wins on:** the prologue (S0–S4: word → CJI quote → click → spawn → multiply → 49%/51% claim → date in roaches), the Victory finale (S6), the procedural roach as protagonist, a distinctive type/colour/halftone system, and sourcing discipline (claimant + status + `*` → footer).
- **v3's problems:** the S5 map is 2,070 vh of dense cards (paragraph + 3–5 source rows + status chips per beat); empty headline slots remove signposting; after Victory it trails into appendices (text epilogue, four media charts).
- **v2's problems:** loosely sourced (porting its apparatus data found ≥6 claims that don't match sources, see `docs/build/f1/apparatus_research.md`); falsely exact counters ("1,22,06,742 followers"); a generic dark-dashboard look.

**Rule of the hybrid:** v2's structure and restraint, v3's look, engine and data discipline. No v2 fact goes on screen until it is in `data/story` with claimant, status and sources.

## Running order (proposed; Gate 0 confirms it)
| # | Chapter | Headline (v2 copy, Vali to confirm) | Source of the build | Work |
|---|---|---|---|---|
| 1 | Prologue | — | v3 S0–S4 | Keep. Consider trimming S3 / S3.5 lengths. Covers v2 ch. 01. |
| 2 | Withheld | "Forty-eight days of silence." | Port v2 ch. 02 (phone + day tally) into v3's look | **Data conflict first:** the ledger says the X account "reappeared within minutes as 'Cockroach is Back'" (narrative.json, timeline.json), while v2 counts 48 days until the 7 Jul HC restoration (apparatus.json has the 7 Jul restore). Resolve from sources (primary source wins) before designing; the headline may change. |
| 3 | The street | (new copy needed) | v3 S5 map, cut down | 3–4 beats (6 Jun first protest, 20 Jun sit-in, 28 Jun Wangchuk, 18 Jul detention). Card ≤ 40 words + headline; no source lists or status chips in cards (the `*` links to the footer, which shows claimant/status). Shrink the S5 budget accordingly. Keep the log scrubber. |
| 4a | 20 July | "No signal, no order." | v3's 20 Jul hour-by-hour map + v2 ch. 03's internet-cut idea | Make the internet cuts and closed stations the focus; fewer hour beats. |
| 4b | 20 July, again | "One march, three ledgers." | Port v2 ch. 04 (one scale per question: state / records / movement) | All disputed 20 Jul figures live here, not scattered across cards. Data: metrics.json rows + sansad_chalo.json. |
| 4c | The country watched | (new copy) | v3 S7a (YouTube views, anime.js) | One beat only: "93% of views in four days". S7b/S7c move to an appendix or are cut (Vali decides at Gate 0). |
| 5 | Victory | — | v3 S6 | Keep (handover from the map must be re-checked after the S5 cut). |
| 6a | October | "Count them one by one." | Port v2 ch. 05 (one figure per person, then the two leaders) | Replaces the S6.5 text section. Source every number into `epilogue_october.json` (or a new file) first; disputed counts side by side. |
| 6b | Why they marched | "Find yourself on the roll." | Port v2 ch. 06 (interactive voter roll) | Needs sourced voter-roll figures (130 M removed / 969 M eligible, EC commissioners' concerns) in the ledger first. |
| 7 | The apparatus | "Thirteen hands on one protest." | v3 S7d (sourced), moved here as the closing argument | Open decisions in GAPS ("Remaining scenes"). |
| 8 | Close | v2's closing line ("It began as a joke about a slur…"), Vali to confirm | v3 S8 (Ambedkar typewriter), S9, S10 | Keep. |

## Rules (in addition to CLAUDE.md)
- Facts only from `data/story/*.json`; v2 headlines and dek lines are Vali's editorial copy and may be reused, but list every reused or new line for Vali's sign-off. Anything missing → GAPS.md + `[MISSING: key]` (except slots Vali left empty).
- **Restraint budget:** one claim headline + one visual metaphor + ≤ 40-word caption per screen; at most one `*`-bearing figure in a caption sentence; source lists and status chips live in the footer (S10), not in the reading flow. Disputed figures are shown side by side only where the chapter is about the dispute (4b, 6a).
- Keep v3's contracts: one scroll controller, `update(p)` pure in p, idle in `tick`, roach renderer wrapped not redrawn, tokens only, desktop ≥ 1280×720, no new runtime dependency (anime.js; D3 only where already approved).
- Budget changes live in `src/scroll/budget.js` (this chat owns it on this branch); log every change in STATUS.md.
- Data ports: write new ledger facts through the F1 generator or as new `data/story/*.json` drafts with the fact shape (see STATUS "Contracts in force"); paywalled sources excluded; primary source wins over v2 and the dossier.

## Gates
- **Gate 0 (storyboard of the hybrid):** one static key frame per chapter at 1440×900 (and 1280×720 for anything text-heavy), plus the running order with vh lengths and the full copy list (headlines, deks, captions). Stop for Vali's approval. No motion, no budget surgery before this.
- **Then per chapter group** (prologue untouched; 2; 3 + 4a; 4b + 4c; 5; 6a + 6b; 7 + 8): Gate 1 static key frames at both sizes → Vali approves → Gate 2 motion, QA down and up (`tools/cdp-scroll.mjs`), handovers (`tools/qa-handover.mjs`), `qa-shell` ALL PASS.
- Use sub-agents for independent ports (e.g. 4b, 6a, 6b, and their data sourcing) with narrow, file-scoped briefs; the lead reviews their frames before showing Vali.
- Finish each group with STATUS/GAPS updates, the three-list report (passed / caveated / untested) and the local URL (`npx serve . -l 5173` → http://localhost:5173/v3/). Commit only when Vali says; push only to `build/hybrid`.

## Read first
`CLAUDE.md` → `docs/build/STATUS.md` (contracts + the last three change-log entries) → this file → `docs/build/GAPS.md` ("Remaining scenes") → v2 source via `git show main:index.html` (chapters are marked `<!-- ───── 0N NAME ───── -->`; script per chapter further down) → the v3 scene files you are changing. To see v2 running: `git worktree add --detach <scratch>/main-wt main` and serve it on another port.

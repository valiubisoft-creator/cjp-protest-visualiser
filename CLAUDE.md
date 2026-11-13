# CJP Protest Visualiser: rules for every build chat

**Current work: the hybrid build** on branch `build/hybrid`. It combines v2's narrative spine (a claim headline per chapter, one visual metaphor, short captions) with v3's look, roach engine and sourcing. It replaced the one-chat-per-scene v3 build on `build/scene-by-scene`; that branch is frozen.

Start every chat by reading, in this order:
1. `docs/build/STATUS.md`: the top table, "Hybrid contracts" (running order, budgets, gaps, click gate) and the latest change-log entries.
2. `docs/build/GAPS.md`: the "Hybrid, review N" sections hold open decisions for Vali.
3. Your brief, if Vali gives one. Otherwise use `docs/build/kickoffs/hybrid.md`, with Vali's message as the brief.

Copy (headlines, deks and captions) lives in `src/data/copy.js`. After editing it, regenerate `docs/build/hybrid/COPY.md` with `node tools/hybrid/copy-md.mjs`.

Read `docs/build/BUILD_PLAN.md` only if the brief points to it. Do **not** read `Claude.pdf` or the whole of `PROTEST_VIZ_SPEC.md` unless the brief says to.

## Facts
- On-screen facts, numbers, names, dates and quotes come **only** from `data/story/*.json`. If something is missing, add it to `docs/build/GAPS.md` and render a visible `[MISSING: key]`. Never fill a gap from memory, never paraphrase, never "round out" a sentence.
- Quotes are verbatim. Activist and poet quotes are placeholders until Vali supplies them.
- Every stat on screen carries a `*` that links to its footer entry (claimant, status, source). Keep claimant wording: "police said", "CJP claims", "reported".
- The spelling is **Abhijeet** Dipke.
- Headlines and deks are Vali's editorial copy. List every new or changed line for Vali's sign-off.

## Tech (overrides spec section 3)
- No build step: plain HTML, native ES modules and an import map. Serve with `npx serve . -l 5173` → http://localhost:5173/v3/ (`npm run dev` does the same).
- Scroll comes from anime.js v4.5 `onScroll` plus CSS sticky, with one controller (`src/scroll/controller.js`).
  - A scene is `{init, enter, update(p), exit, resize, tick}`.
  - `update` is pure in `p`; idle motion lives only in `tick`.
  - `?still` freezes the clock; every QA tool uses it.
  - Deep link with `?p=ID:x`.
- Scene lengths live in `src/scroll/budget.js`.
  - A `gap: [t, vh]` entry holds the scene's inner `p` at `t` for `vh` of scroll (the breathing room after a chapter opening). See `src/scroll/gap.js`.
  - If you change a length or gap, re-express the scene's targets in `docs/build/scenes/targets/*.json`.
- Layout uses a 12-column grid: `--g-m`/`--g-gut` in CSS, mirrored in px by `src/lib/grid.js`. No overlap, and no graphic overflows its column.
- The backdrop is a grunge, splattered-paint texture (`src/lib/grunge.js`, via `halftone.js`) with a slow living layer (`src/lib/alive.js`). It is off under `?still` and reduced motion.
- **No new runtime dependency** without Vali's explicit yes. The approved D3 modules (`d3-scale`, `d3-shape`, `d3-hierarchy`, `d3-array`) are the only exception, and only where already used.
- The roach is the existing procedural `roach()` renderer. Wrap it; don't redraw it.

## Scope and git
- Stay on `build/hybrid`. **Pushing to `main` deploys to Vercel; never push there.**
- **`build/hybrid` is live on GitHub Pages** (repo root, no Jekyll): https://valiubisoft-creator.github.io/cjp-protest-visualiser/v3/. Every push to `build/hybrid` redeploys that public site within a minute or so, so only push QA'd work.
  - Keep every path relative (or resolve it with `import.meta.url`); a path starting with `/` breaks under the `/cjp-protest-visualiser/` subpath.
  - Check the deploy with `gh api repos/valiubisoft-creator/cjp-protest-visualiser/pages/builds/latest --jq .status`.
- Commit and push only when Vali says so, and push only to `build/hybrid`.
- Shared modules (`roach`, `controller`, `tokens.css`, `data/story`) change only with a clear reason, and the change is logged in STATUS.md.
- Sub-agents get narrow, file-scoped briefs. The lead reviews their output before it reaches Vali.
- Desktop only, with a minimum viewport of 1280x720. No mobile layout.

## Design
For new scenes or big visual changes, show static key frames (screenshots at fixed `p`) and get Vali's approval **before** writing motion. Small review fixes can go straight in.

Type and colour are fixed in `docs/build/DESIGN.md`:
- Protest Revolution for major headings only, and Public Sans for everything else. Never Inter or IBM Plex.
- A red, white and black palette. Use the tokens.
- UI never covers content.

## QA (all with `SIZE=w,h`; run at 1440,900 and 1280,720)
- **Per-scene targets, down and up:** `node tools/cdp-scroll.mjs http://localhost:5173/v3/ <outDir> docs/build/scenes/targets/<ID>.json`
- **Seams:** `node tools/qa-handover.mjs <dir> 'S0>S1' 'S1>S2' …` (≤0.2% of pixels may differ).
- **Whole shell** (must report ALL PASS): `node tools/qa-shell.mjs`
- **Ad-hoc frames:** `node tools/shoot-frames.mjs <dir> ID:p ID:p …`. Give each frame as its own argument.
- **Hygiene:**
  - If a run hangs, look for stray headless Chromes: `pkill -f "user-data-dir=/tmp/cdp-"`.
  - Start the server with `ulimit -n 10240` so it doesn't crash with EMFILE.

## Finish every chat by
1. Running the QA above at the brief's key frames, scrolling both down and up.
2. Updating `docs/build/STATUS.md` (what's done, any contract changes, new decisions) and `GAPS.md`.
3. Writing a short report with three lists (passed, caveated, untested), plus the local URL.

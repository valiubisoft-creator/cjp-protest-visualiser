# CJP Protest Visualiser: rules for every build chat

The v3 scrollytelling piece is built **one chat per scene** on branch `build/scene-by-scene`.
Start every chat by reading, in this order:
1. `docs/build/STATUS.md`
2. Your brief: `docs/build/kickoffs/<chat>.md` or `docs/build/scenes/<scene>.md`

Read `docs/build/BUILD_PLAN.md` for context only if the brief points you to it. Do **not** read `Claude.pdf` or the whole of `PROTEST_VIZ_SPEC.md` unless your brief says to.

## Facts
- On-screen facts, numbers, names, dates and quotes come **only** from `data/story/*.json`. If something is missing, add it to `docs/build/GAPS.md` and render a visible `[MISSING: key]`. Never fill a gap from memory, never paraphrase, never "round out" a sentence.
- Quotes are verbatim. Activist and poet quotes are placeholders until Vali supplies them.
- Every stat on screen carries a `*` that links to its footer entry (claimant, status, source). Keep claimant wording: "police said", "CJP claims", "reported".
- The spelling is **Abhijeet** Dipke.

## Tech (overrides spec section 3)
- No build step: plain HTML, native ES modules and an import map. Serve with `npx serve .`
- Scroll comes from anime.js v4.5 `onScroll` plus CSS sticky, with one controller (`src/scroll/controller.js` once F3 lands).
- **No new runtime dependency** without Vali's explicit yes. The one approved exception is the D3 modules (`d3-scale`, `d3-shape`, `d3-hierarchy`, `d3-array`), and only in S5b and S7 (BUILD_PLAN D10).
- The roach is the existing procedural `roach()` renderer. Wrap it; don't redraw it.

## Scope and git
- Only touch the files your brief says your chat owns. Shared modules (`roach`, `controller`, `tokens.css`, `data/story`) change only in their own chat, or with Vali's OK.
- Stay on `build/scene-by-scene`. **Pushing to `main` deploys to Vercel.** Commit only when Vali says so.
- Desktop only, with a minimum viewport of 1280x720. No mobile layout.

## Design gate
Show static key frames (screenshots at fixed `p`) and get Vali's approval **before** writing motion. Design preferences:
- Characterful display face for headlines only.
- Uncommon grotesk for body text. Never Inter or IBM Plex.
- UI never covers content.

## Finish every chat by
1. Running QA screenshots (`tools/cdp-scroll.mjs`) at the brief's key frames, scrolling both down and up.
2. Updating `docs/build/STATUS.md` (what's done, any contract changes, new decisions) and `GAPS.md`.
3. Writing a short report with three lists: passed, caveated, untested.

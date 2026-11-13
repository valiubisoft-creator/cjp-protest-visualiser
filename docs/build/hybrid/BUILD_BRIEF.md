# Hybrid build: brief for scene sub-agents (2026-11-13)

Vali signed off the Gate 0 storyboard and asked for the build **with motion, in anime.js**. You build ONE scene (or two) end to end. The lead builds the shared parts, the prologue-stage scenes, S5 and the close, and reviews your frames.

## Read first (in this order, only what you need)
1. `CLAUDE.md` (facts, tech, scope rules; ignore "stay on build/scene-by-scene": this work is on `build/hybrid`. **Never commit, push or switch branches.**)
2. `docs/build/STATUS.md` → "Contracts in force": the **Controller contract** and the **Scene contract** only.
3. `docs/build/hybrid/GATE0.md` "Revision 1" + the running-order table: your scene's row.
4. Your Gate 0 key frames in `qa/hybrid/gate0/` (the static target) and their prototype code in `design/hybrid/frames.js` / `watched.js` / `cage.js` (port it; don't import from `design/` at runtime).
5. `src/lib/chapter.js` + `src/lib/chapter.css` (the shared title card, lockup and captions) and `src/data/copy.js` (all copy: your chapter's `headline`, `dek`, `captions[]`).

## Contract recap
- **Files you own:** `src/scenes/h-<name>.js` + `h-<name>.css`, and a targets file `docs/build/scenes/targets/<ID>.json`. Shots go to `qa/hybrid/<ID>/`.
  - **Touch nothing else.** In particular: `budget.js`, `controller.js`, `load.js`, `copy.js`, `chapter.js/.css`, `tokens.css`, `data/story/*`, other scenes.
  - If you need a change there, stop and say so in your report.
- **Your scene's block** is already in `src/scroll/budget.js` (id, len) and is stubbed with the placeholder. Replace the stub.
- **Scene shape:** default export `def => ({ id, init(ctx), enter(dir), update(p), exit(dir), resize(w, h), tick?(t, dt) })`.
  - `init` may be async.
  - `update(p)` must be **pure in p**: the same p gives the same frame, scrolling down or up.
  - Idle motion (wander, pulses) goes only in `tick` and must not change what p decides.
  - With `?still`, the clock is frozen at t = 0.
- **Animation:** anime.js v4.5 is already in the import map (`import { createTimeline, utils, stagger, animate, svg } from 'animejs'`).
  - The established pattern is ONE paused timeline, 1000 ms = p 0→1, with `update(p) → tl.seek(p * 1000)` then redraw from the animated state. See `src/scenes/s07/common.js` (`scrubTimeline`, `fromTo`, `drawIn`).
  - Preset every tweened value to its start so backward seeks match.
  - Hover/click interactions may use `animate()` (time-based UI) but never change what p decides.
  - No new runtime dependency. No D3 in these scenes.
- **Chrome:** use `createChapter(ctx.root, '<chapter id>', ctx.data, { title: [in0, in1, out0, out1], caps: [[captionIndex, pFrom, pTo], …], vars })`.
  - Call `chapter.resize(w)` in `resize` and `chapter.update(p)` in `update`.
  - The title card enters, holds, then docks to the lockup. Captions crossfade on their p ranges.
  - Position `.hy-cap` with your own CSS (scope selectors under your scene class). Captions must never cover the visual: "UI never covers content".
- **Data:** `ctx.data` = `loadStory()`.
  - The hybrid drafts are in `ctx.data.extra`: `october_counts`, `detentions`, `voter_roll`, `apparatus`, `neet`, `withheld`, `sansad_chalo`.
  - Their `new_sources` are already merged, so `star(source_ids, ctx.data.byId.source, claimant)` from `src/lib/star.js` resolves.
  - Every figure on screen carries a star. Never put a fact on screen that isn't in `data/story`.
  - Portraits: `media/people/*`, credits from `detentions.json` `people[].image` or `timeline.json` people. Show the credit.
- **Look:** ink theme (black), tokens only (`styles/tokens.css`).
  - Protest Revolution only for the chapter headline (via chapter.js); Redaction (`--font-text`) for prose; Public Sans (`--font-ui`) for UI and numbers (`tabular-nums`).
  - Red only for meaning. Halftone backdrop: `halftone()` from `src/lib/halftone.js` on a canvas in your root. Roaches: `roach()` from `src/roach/roach.js` (verbatim renderer; never edit it).
  - Desktop only: check **1440×900 and 1280×720**.

## QA (both sizes, both directions)
- Server: `http://localhost:5173/v3/` (already running; `npx serve . -l 5173` if not).
- Deep link: `/v3/?p=<ID>:0.5&still&debug`.
- Quick shots: `SIZE=1440,900 node tools/shoot-frames.mjs qa/hybrid/<ID>/shots <ID>:0.2 <ID>:0.6`.
- **Required:** a targets file with 5–8 key frames (each with an `expect` sentence), then `SIZE=1440,900 node tools/cdp-scroll.mjs http://localhost:5173/v3/ qa/hybrid/<ID>/1440 docs/build/scenes/targets/<ID>.json` and the same with `SIZE=1280,720` → `qa/hybrid/<ID>/1280`.
  - It must report 0 FAIL, p monotonic, and no console errors.
  - Look at the down and up shots yourself and fix what's wrong: overlaps, text off-screen, captions over the visual, empty frames.
- Performance: canvas redraws only on update/tick; DPR ≤ 2; ≤ 60 fps idle; no per-frame DOM thrash for thousands of elements (use canvas for > ~300 marks).

## Report (final message, ≤ 300 words)
- What you built, the p map (which p range does what), and which interactions exist.
- QA results with paths to the 1440 and 1280 down/up shots.
- Anything you could not do, any data gap (render `[MISSING: key]` and list it), and any change you need in a file you don't own.

# Scene briefs (written in F3, 2026-11-12)

One brief per Phase 1 chat, in build order:

| Order | Chat | Brief | Scenes / files | Targets |
|---|---|---|---|---|
| 1 | S4a skeleton spike | [S4a.md](S4a.md) | `src/lib/skeleton.js`, spike page | [S4](targets/S4.json) (p 0.6 only) |
| 2 | S0 | [S0.md](S0.md) | S0 | [S0](targets/S0.json) |
| 3 | S1–S2 | [S1-S2.md](S1-S2.md) | S1, S2 | [S1](targets/S1.json), [S2](targets/S2.json) |
| 4 | S3 + S3.5 | [S3.md](S3.md) | S3, S3.5 | [S3](targets/S3.json), [S3-5](targets/S3-5.json) |
| 5 | S4b | [S4b.md](S4b.md) | S4 | [S4](targets/S4.json) |
| 6 | S5a | [S5a.md](S5a.md) | S5: map, camera | [S5](targets/S5.json) |
| 7 | S5b | [S5b.md](S5b.md) | S5: scrubber, rail | [S5](targets/S5.json) |
| 8 | S5c | [S5c.md](S5c.md) | S5: roach encodings | [S5](targets/S5.json) |
| 9 | S6 | [S6.md](S6.md) | S6 | [S6](targets/S6.json) |
| 10 | S6.5 | [S6-5.md](S6-5.md) | S6.5 | [S6-5](targets/S6-5.json) |
| 11 | S7 | [S7.md](S7.md) | S7a, S7b, S7c | [S7](targets/S7.json) |
| 12 | S8–S10 | [S8-S10.md](S8-S10.md) | S8a…, S9, S10 | [S8](targets/S8.json), [S9](targets/S9.json), [S10](targets/S10.json) |
| 13 | M9 | [M9.md](M9.md) | polish, review | all |

S7 and S8–S10 depend only on the shell and the ledger, so they can run in parallel in a git worktree (BUILD_PLAN §2). The prologue (S0–S4) runs in order: one shared swarm and canvas stack.

## Rules every brief inherits
- `CLAUDE.md` applies in full. Contracts are in `docs/build/STATUS.md` → "Contracts in force" (scene, controller, roach, budget). They override the spec.
- Read **only** your brief, your spec section (the brief gives the `sed -n` line range) and the files the brief names.
- **Never touch** (unless your brief says so): `index.html` (v2), `data/story/*`, `styles/tokens.css`, `styles/fonts.css`, `design/shots/frames/*`, `src/scroll/*`, `src/main.js`, `src/roach/roach.js`, `src/data/load.js`, `src/shell.css`, `v3/index.html`, `tools/lib/cdp.mjs`, and any other chat's scene file. Need a change in one of them? Ask Vali, then log it in STATUS.
- Put the scene's CSS in its own file (`src/scenes/sNN-*.css`), loaded by the scene in `init` (`<link>` appended to `<head>`), or inline in the module. Use tokens; never hard-code colours or sizes.
- `update(p)` is pure in `p`. Idle motion goes in `tick(t, dt)` and must not change what `p` decides. With `?still` the clock is frozen at t = 0, so QA shots are reproducible.
- No `[MISSING]` tag for the S4 caption, the S6.5 heading or the S9 headline: leave those slots empty (Vali, 2026-11-12). Every other missing fact renders `[MISSING: key]` and goes in GAPS.md.
- Facts with `hold: true` or `status: "unverified"` never go on screen (`showable()` in `src/lib/text.js`).
- Every stat's `*` comes from `star(fact.source_ids, ctx.data.byId.source, fact.claimant)` (`src/lib/star.js`): it links to the footer entry `#src-N` that S10 renders. Don't hand-roll stars.

## The loop (BUILD_PLAN §2)
1. Static key frames at the brief's `p` values, matching the storyboard → screenshots → **Vali approves** before any motion.
2. Motion. Then QA both ways and the compare sheets.
3. A review agent over this scene's diff only.
4. Done-when list, STATUS.md and GAPS.md updated, the three-list report. Commit only when Vali says.

## QA commands
```sh
npx serve . -l 5173                                    # http://localhost:5173/v3/  (clean URL; ?debug for the HUD)
node tools/cdp-scroll.mjs http://localhost:5173/v3/ qa/v3/S4 docs/build/scenes/targets/S4.json   # down then up, p checked
node tools/compare.mjs docs/build/scenes/targets/S4.json qa/v3/S4                                # storyboard | down | up
node tools/qa-shell.mjs                                # shell regression: sweep, deep links, lock, gate, resize, console
```
- Deep link any frame: `http://localhost:5173/v3/?p=S4:0.6` (also `S10:top`, `S7:0.5` → S7a). Add `&debug` for the HUD (backtick moves it to another corner), `&still` to freeze idle motion.
- `SIZE=1280,720 node tools/cdp-scroll.mjs …` for the minimum viewport. The storyboard frames are 1440×900, so compare at the default size.
- If your key frames change, update your `targets/*.json` (and say so in STATUS).

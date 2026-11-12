# S4a: Skeleton spike (the date must be legible)

**Model:** Opus 5.5, high. **Paste to start:** `Read CLAUDE.md, then docs/build/STATUS.md and docs/build/scenes/S4a.md, and do S4a. Stop for my review at the end.`
**Spec:** `sed -n 309,334p PROTEST_VIZ_SPEC.md` (S4 only). Shared rules: [README.md](README.md).

## Purpose
Prove, before any scene is built, that **06/06/2026** reads at a glance when drawn by roaches on a Public Sans Black skeleton, at 1440×900 and at 1280×720, at 60 fps. This is the project's highest technical risk (BUILD_PLAN), so it runs first. Output: a decision (runtime skeleton or offline bake), the slot set, and a measured roach budget. Not the scene: S4b builds the motion.

## Allowed data keys
- `meta.protest_start_date` (→ `ddmmyyyy()` in `src/lib/dates.js`).

## Files it owns
- `src/lib/skeleton.js` (promoted from the storyboard in F3; you may change it, but `design/storyboard.js` imports it, so re-shoot the storyboard S4 frames to `/tmp` and confirm they still match, or tell Vali why not).
- `design/spike-s4a.html` + `design/spike-s4a.js` (new): a full-viewport test page, roaches on slots, with `?vw=`/`?face=` switches and an FPS readout.
- Optional: `tools/bake-skeleton.mjs` and `data/skeleton/*.json`, **only** if you choose an offline bake. Any bake tool must be dependency-free (no opentype.js) unless Vali says yes; the F2 approach (canvas raster → Zhang–Suen thinning) needs none.
- May prototype in `src/scenes/s04-date.js`, but leave it as a working placeholder at the end (S4b owns it).

## Must not touch
The common list in README, plus `design/storyboard.js` beyond what a `skeleton.js` signature change forces.

## Contracts it consumes
- `skeleton(text, { w, h, spacing, face })` → `{ slots: [{ x, y, a }], box }` and `brackets(ctx, box, pad, len, color, lw)` (`src/lib/skeleton.js`).
- `roach(ctx, x, y, rot, s, legs)` (`src/roach/roach.js`): draw only through it. Shared pool: `createSwarm()` (`src/roach/swarm.js`), capacity 1,200.

## Key frames
| p | Expected picture | Storyboard |
|---|---|---|
| S4 0.60 | Hold: every slot filled, roach s 5.6, slot spacing 7.4 px, shimmer ±3 px along the tangent, corner brackets. Public Sans Black skeleton. **The legibility frame.** | `ink-S4-0.6.png` |

## Done when
- The date reads at a glance at 1440×900 **and** 1280×720 (Vali judges from screenshots). If not: raise slot density or roach size, not the face weight (spec).
- Measured: slot count at both viewports, skeleton build time at load (ms), and frame time with all roaches shimmering (target 60 fps on an M-series Mac, `?debug` FPS).
- A recommendation with numbers: runtime skeleton vs offline bake, and how the ~600 roaches beyond S3.5's 380 join from the screen edges during converge (Vali, 2026-11-12). Check the pool capacity (1,200) covers the slot count at 2560×1440, or say what it needs.
- STATUS.md: the decision, numbers and any contract change to `skeleton()`.

## Vali's notes
- Skeleton face: **Public Sans Black** (2026-11-12). Protest Revolution stays for headings; its brush spurs make 0 and 6 noisy (see `design/shots/frames/skel-display-S4-0.6.png`).
- Roach s 5.6 (legs show above s 5; `--roach-type` 4 reads as a dashed line), spacing 7.4 px: about 1,000 roaches. S3.5 ends with 380; the rest join from the edges.
- No caption under the date: the slot stays empty until Vali supplies text.

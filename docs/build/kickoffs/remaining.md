# Kickoff: the remaining scenes (S6, S6.5, S7, S8–S10), one chat

**Model:** Opus 5.5, high. **Paste to start:**
`Read CLAUDE.md, then docs/build/STATUS.md and docs/build/kickoffs/remaining.md. This chat builds the remaining scenes in order: S6, S6.5, S7, then S8–S10. Read each brief in docs/build/scenes/ when you reach it. Work in two gates per scene group: static key frames at 1440×900 and 1280×720, stop for my approval; then motion, QA down and up, handovers, STATUS/GAPS, the three-list report and the local URL. Use sub-agents for independent parts. Commit only when I say.`

## Order and why
1. **S6 Finale** (`scenes/S6.md`): same pinned block as S5, so it must start from the S5 p 1 picture (contract in S6.md and STATUS "S5 contracts"). Reuse the S4 skeleton engine (`skeleton()`, lanes 3) with the larger map roaches from `s5End.poses()`. Handover check: `node tools/qa-handover.mjs qa/v3/handover 'S5>S6'` at both sizes.
2. **S6.5 October epilogue** (`scenes/S6-5.md`): a flow (reading) section; heading slot stays empty (Vali).
3. **S7 charts** (`scenes/S7.md`): Vali wants v2's "07 · The apparatus" spokes network; the actor data has to be ported into `data/story` with sources first (ask Vali). D3 allowed here only (D10).
4. **S8–S10** (`scenes/S8-S10.md`): S10 must render every footer source, **including the 20 new sources S5 adds at runtime** and all photo credits (see the brief's S5 note).
5. Then **M9** (`scenes/M9.md`) in its own chat.

## State you inherit (S5 chat, 2026-11-12)
- S5 is built (gate 1 approved with edits, motion done). Full-screen map, floating narrative card with leader lines and footnoted sources, 20 Jul hour-by-hour (illustrative police/barricades/clashes), collapsible legend. S5 is 2,070 vh (budget change; see STATUS).
- Draft data Vali still has to review: `data/story/narrative.json`, `sansad_chalo.json`, `imagery.json`.
- Headless QA ran at 30 fps across the whole piece on the last S5 run (machine load); S5's JS cost is ~0.6 ms/frame. Re-measure on Vali's Chrome in M9.

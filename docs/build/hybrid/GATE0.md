# Hybrid · Gate 0 storyboard (2026-11-13, for Vali's sign-off)

Branch `build/hybrid` (from `build/scene-by-scene` at `daea514`). Brief: [kickoffs/hybrid.md](../kickoffs/hybrid.md).
**Frames:** `qa/hybrid/gate0/*.png` (1440×900, plus 1280×720 for text-heavy frames). Board: http://localhost:5173/design/hybrid/gate0
**Copy list:** [COPY.md](COPY.md) (every headline, dek and caption, with origin, word count and ledger ids).
No motion and no budget surgery yet: `src/` is untouched on this branch.

How the frames were made: frames for chapters v3 already has are **live v3** (real map, roaches and charts) with the hybrid chrome and copy injected on top (`design/hybrid/overlay.js`). New chapters are drawn with the real `roach()`, halftone and tokens (`design/hybrid/frames.js`). Both read `design/hybrid/copy.js` and `data/story`. Shooter: `node tools/hybrid/shoot-gate0.mjs`.

## Revision 1: Vali's review (2026-11-13)
| Note | Done | Frames |
|---|---|---|
| 06 as an anime.js visualisation, not a chart; black | **New scene**: a 1,000-dot halftone screen in the shape of a roach. Each dot is 0.1% of all views in the YouTube corpus, assigned to its video by largest remainder. Scroll runs the calendar: grey noise for eight weeks, then the 18–21 Jul dots light from the centre out and the roach resolves. The counter lands on **93%** (92.56%, computed live). Hover a dot to see its video; that video's dots pulse (anime.js). Prototype: `design/hybrid/watched.js` | `06a`–`06d` |
| 09 black; a unique, interactive anime.js visual | **The cage**: a radial calendar (21 May → 21 Oct, clockwise) with four rings (street, online, courts, power). Each of the 31 documented actions is a bar at its date. A sweep hand draws them in with scroll, and the roach in the centre turns to face the newest bar. Red = restriction; courts dashed (white restored, red restricted, grey mixed); Election Commission grey. Hover a bar for its record; hover a body in the roster to light its bars. Prototype: `design/hybrid/cage.js` | `09a`–`09c` |
| Whole piece in black | S7a/S7d paper sections are replaced by the two scenes above. **S10 footer switched to ink** in `src/` (no `.reading`) | `s10/S10-top` |
| 02: the sentence must flow, not break after the "comma" | Protest Revolution's full stop looks like a comma, so the forced break after "days." read as a broken sentence. Title-card headlines are now **one line**, fitted to the width (wrapped and balanced only if they can't fit) | `02a` |
| Map: too many labels; proper line breaks | **At most three labels per beat.** For 20 Jul 09:23: the site, the dead-signal zone, and one grouped metro label (the station glyphs stay, unlabelled). Long labels break into short lines. One leader line from the card to the site, instead of one per incident. S5's label and leader logic changes at the street + 20 July gate | `04-july` |
| Victory: no crosshairs; date and word in black | **Done in `src/`**: brackets removed from `s06-finale.js`; "Victory" black. Date roaches were already black. The small line under it stays white: black on red fails AA at 22 px | `05x-victory` |
| Closing line on its own scene, not in the footer | **New pinned scene** (140 vh) between S8a and S9 | `10a-closing-line` |
| Follow buttons simple, Instagram / X icons, structured spacing | **Done in `src/`** (`s09-cta.js/.css`): one centred 640 px column on the 8 px scale. Two equal outlined buttons (icon · platform · handle), then the share row on the same width. Inline SVG icons, no dependency. The X mark is used because the handle is on x.com | `10b-follow` |

| Add why the protests began: the NEET paper leak | **New chapter 02, "The joke found its grievance."** (prologue stage, after S3.5): an answer sheet of 2,279 filled bubbles (one per 1,000 registered candidates) stamped *Cancelled · 12 May 2026 · NTA*, with the swarm gathering at its edges. Three captions: exam and alleged leak → cancellation, CBI case, re-test → the CJP takes up the leak on 22 May. Sourced in `data/story/neet.json` (21 facts, snippets verbatim). **The CJP was not founded over NEET** (the CJI remark came in a non-NEET hearing); the copy keeps that order | `01b-neet` |
| Dipke and Dhruv Rathee detained early in the morning and on landing (photo from the web) | **New October beat: "10 October, one day"** on a 24-hour strip. Sources: `data/story/detentions.json` (13 events, snippets checked verbatim). **Rathee** was taken from his family home in Gurugram before 8 am (reported times differ, 6–8 am; drawn as a hatched band) and released around 3 am. **Dipke, Das and Ranka** were detained inside the plane minutes after landing, about 10.30 am. *Dipke was not detained early in the morning*: his home detention on 16 Oct has no clock time, and context puts it in the afternoon or evening. Rathee photo: Commons, NewsClick (YouTube) CC BY 3.0, credited on screen; the licence was checked by the lead | `07c-october-dawn` |

`qa-shell` ALL PASS after the S6/S9/S10 edits. All 71 stars in the copy resolve; no caption is over 40 words.

## 1. The "48 days withheld" vs "reappeared within minutes" conflict: resolved
Primary sources, checked verbatim by the lead (Business Today page text, LawBeat's quotation of the order), plus the research agent's note [research/withheld.md](../research/withheld.md):
- **Both events happened. They are about two different accounts.** The original X handle, **@CJP_2029**, was withheld in India by an emailed MeitY order dated 21 May 2026 (Sec. 69A). The Delhi High Court revoked that order on **7 Jul** (Day 48, counting 21 May as Day 1). In between, on 29 May, the court refused interim restoration and sent the matter to MeitY's review committee.
- **@Cockroachisback** opened **"hours after"** the block (Business Today, 21 May, verbatim), not "within minutes". It had over 2,80,000 followers by 7 Jul (PTI).
- **So "Forty-eight days of silence" is wrong.** The party was never silent. The ledger's "within minutes" (timeline `start_pushback`, sourced to Wikipedia) is also wrong against the primary report.
- **Proposed headline:** "Blocked for 48 days. Back within hours." (alternatives in COPY.md).
- **Needs your OK:** correct `timeline.json` and `narrative.json` ("within minutes" → "hours after", source Business Today), under your "primary source wins" rule.
- **Also corrected from v2:** the Instagram "blocked for two hours" was 15 Aug, not May. 22 Jul was a separate Instagram restriction, restored the same day. Neither is on screen.

## 2. Running order and lengths

| # | Chapter | Built from | Key frame | vh |
|---|---|---|---|---|
| 1 | Prologue | v3 S0–S3.5, unchanged | `01-prologue` | 790 (80 · 150 · 60 · 260 · 240) |
| 1b | **The grievance**: "The joke found its grievance." (new) | **new scene** on the prologue stage after S3.5 | `01b-neet` | **200** (title 50 · exam 50 · cancelled 50 · demand 50) |
| 2 | **Withheld**: "Blocked for 48 days. Back within hours." | **new scene W** on the prologue stage, between S3.5 and S4 (21 May comes before the 6 Jun date) | `02a` title, `02b` | **240** (title 50 · block 40 · new handle 50 · court 50 · Day 48 50) |
| 3 | The street: "Off the feed, onto the road." | S4 date → S5 map, **cut to four beats** (6 Jun, 20 Jun, 28 Jun, 18 Jul) | `03-street` | S4 180 + S5: lead-in 60 · title 50 · 4 × 90 |
| 4 | 20 July: "No signal, no order." | S5, same stage: three 20 Jul hours (09:23, 15:08, 17:38) + 23 Jul, focused on the internet cut and the metro | `04-july` | S5: title 50 · 4 × 110 |
| 5 | 20 July, again: "One march, three ledgers." | **on the S5 map stage** (map dimmed), three scales: injured / detained / pellets | `05-ledgers` | S5: title 50 · 3 × 100 · lead-out 60 |
| — | Victory | v3 S6, unchanged, **in-place handover from the map kept** | `05x-victory` | 260 |
| 6 | The country watched: "Four days, most of the views." | **new anime.js scene**: the 1,000-dot roach screen (replaces S7a–c in the flow) | `06a`–`06d` | **260** (block 360) |
| 7 | October: "Count them one by one." | **new block**, replaces S6.5: Delhi 10 Oct field (one roach = one person, every count a line), then the two leaders | `07-october`, `07c-october-dawn`, `07b-october-cell` | **500** (title 60 · 2 Oct 80 · 10 Oct dawn/landing 80 · 10 Oct field 120 · Mumbai 60 · cell 100) |
| 8 | Why they marched: "Find yourself on the roll." | **new block** (port of v2 ch. 06): 100 entries on a roll page, pick yourself, 13 struck, then 9,688 marks | `08-roll` | **380** (title 60 · pick 80 · strike 80 · scale 100 · Commission 60) |
| 9 | The apparatus: "Thirteen hands on one protest." | **new anime.js scene**: the cage (replaces the S7d spokes), the closing argument | `09a`–`09c` | **340** (block 440) |
| — | Close | S8a Ambedkar (unchanged) → **the closing line, its own scene** → S9 follow and share (restyled, icons) → S10 (ink) | `10a`, `10b` | 160 · **140** · 100 · auto |

- **S5 goes from 2,070 to 1,370 vh:** lead-in 60, street 410, 20 July 490, ledgers 350, lead-out 60.
- **The `main` block goes from 3,300 to 3,040 vh** (prologue 790 + NEET 200 + W 240 + S4 180 + S5 1,370 + S6 260).
- **Whole piece (revision 1):** 5,620 vh + S10 (blocks include their 100 vh scroll-away: main 3,140 · watched 360 · October 600 · roll 480 · cage 440 · S8 260 · closing 240 · S9 100). v3 is 4,970 vh + S6.5 + S10. About 13% longer, for two new beats (NEET, 10 Oct) and the closing scene.
- (Gate 0 first pass: 4,970 vh.) The same length, but it now carries a second act (October and the roll) with one claim per screen.
- **Out of the reading flow:** S6.5 (replaced by ch. 7), S7b and S7c (you decide: cut, or an appendix after the footer). Their code stays.
- **Chapter chrome (all new chapters):** a title card (kicker, claim headline in Protest Revolution, red rule, dek; `02a`) that docks to a lockup at the top left while the chapter plays (`02b`–`08`). On the map the HUD date sits under the lockup. Captions are one small card: date kicker, ≤ 40 words, sources only as `*`. Status chips and source lists move to the footer.

## 3. Decisions for you
1. **Where 4b/4c sit (structural).** The brief puts 4b and 4c between 20 Jul and Victory. But map → Victory is one pinned block with a 0.000% in-place handover.
   - **Recommended:** put 4b *on the map stage* (it is "20 July, again", so the dimmed 20 Jul map is its natural backdrop). The handover stays, and 4c follows Victory as a short coda before October.
   - **Alternative:** 4c before Victory as its own block. Then S6 loses the in-place handover and needs a new opening.
2. **Withheld headline:** "Blocked for 48 days. Back within hours." / "Forty-eight days under a block." / "Silenced in India, not online."
3. **New headlines:** street "Off the feed, onto the road." (alt "They came back, and stayed."); 4c "Four days, most of the views." (alt "The country watched.").
4. **"Thirteen hands"**: the cage (like S7d) draws the Election Commission as a *trigger* (grey), not a restriction. Keep the headline, or make it twelve hands and one trigger?
5. **Ledger fixes** (needs your OK; shared data): "within minutes" → "hours after" (above).
6. ~~Theme~~: resolved, the whole piece is black (revision 1).
7. **Prologue:** untouched. The brief offered trimming S3/S3.5; I left them at your 260/240.
8. **Close kicker** "As of 7 November 2026" (the ledger's last event, the Kochi march). v2 had 22 Oct.

9. **NEET headline:** "The joke found its grievance." (alt "22 lakh students, one cancelled exam.").
10. **Rathee's photo** is a 2019 frame from a NewsClick YouTube video (CC BY 3.0): fine to use with the credit, or would you rather supply one?

## 4. Data added in this chat (drafts, not yet read by any scene)
Research agents (Sonnet) wrote these drafts; the lead spot-checked them:
- `data/story/withheld.json` + [research/withheld.md](../research/withheld.md)
- `data/story/october_counts.json` + [research/october-counts.md](../research/october-counts.md)
- `data/story/voter_roll.json` + [research/voter-roll.md](../research/voter-roll.md)
- `data/story/neet.json` + [research/neet.md](../research/neet.md) (revision 1)
- `data/story/detentions.json` + [research/detentions.md](../research/detentions.md) + `media/people/dhruv-rathee.jpg` (revision 1)

The new sources are merged at runtime after sansad's and apparatus's ids, as S5 and S7d do. All 59 stars in the copy resolve.

**v2 claims that did not survive:**
- 2 Oct "500+": unattributed reports. Police counts rose to nearly 1,000.
- Mumbai "internet restricted": unsupported.
- "About 1,200 across three cities": mixes dates and claimants.
- Jantar Mantar de-listed on 12 Oct, not 13.
- Instagram "two hours": 15 Aug, not May.
- "Forty-eight days of silence": see section 1.

**Voter roll:**
- 130M+ is a cumulative **draft-roll** count, reported via the BJP's use of ECI data; there is no ECI national total.
- 130 / 968.8 (the 2024 roll) ≈ 13 in 100, which holds. The caption says "draft rolls so far".
- The final-roll net (about 10 in 100, Bihar + Phase 2) goes in the footer entry.

**Caveat:** much of the agents' web text came through a summarising fetch tool. Every snippet marked `verified: false` gets a verbatim re-check before it reaches the screen (Gate 1 for each group).

## 5. After Gate 0
Per the brief, groups in this order, each with two gates (static key frames at both sizes → your OK → motion, QA down and up, handovers, qa-shell):
1. Withheld (2)
2. Street + 20 July (3 + 4a)
3. Ledgers + watched (4b + 4c)
4. Victory (5)
5. October + roll (6a + 6b)
6. Apparatus + close (7 + 8)

The budget changes go into `src/scroll/budget.js` at the first motion gate and are logged in STATUS.

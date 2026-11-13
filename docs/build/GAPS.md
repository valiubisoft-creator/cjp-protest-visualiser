# Gaps

Data the build needs but doesn't have. Scenes render `[MISSING: key]` for any of these that reach the screen. Close a gap by editing `docs/build/f1/build_story.py` (or the JSON directly once F1 is signed off) and striking the line here.

## Needs Vali

_2026-11-12: web sourcing is done. Details are in [f1/sourcing.json](f1/sourcing.json)._

| Key | State | Decision needed |
|---|---|---|
| `people.ranka.image` | Credited as 'Wikigama, CC BY-SA 4.0'. The file page names no photographer or source, and it looks like an agency photo, so `license_ok` is 'caution' | Keep, or swap if an original credit turns up |

## Source URLs (`url: null`)

The dossier shows outlet chips, not links, so every source in `sources.json` except the `repo_*` entries has `url: null`. Sources used by on-screen facts:

- **`wikipedia`**: the chip doesn't say which article. The repo has two candidates (`wiki_cjp`, `wiki_protests`). This is the most-cited source, so resolving it fixes the most footer entries.
- `aljazeera`, `theprint`, `thestatesman`, `outlookindia`, `businesstoday`, `tribuneindia`, `thefederal`, `christiandaily`, `dynamitenews`, `yahoo`, `dainikjagranmpcg`, `cnn` (the repo's CNN 22 Jul URL isn't confirmed to be the cited article), `pbs`, `altnews`, `newslaundry`, `imnindia`, `asiaone`, `india` (the chip reads "india"; assumed to be India.com), `nbcnews`, `indianexpress`, `bbc`, `economictimes`, `deccanherald`, `guardian`, `ap`, `reuters`, `pti`, `thehindu`, `ndtv`, `boom`, `uni`, `independent`, `righttoinformation`.
- Epilogue and metrics only: `wagingnonviolence`, `siasat`, `thedailyjagran`, `business_standard`, `thelogicalindian`, `telanganatoday`, `lawtrend`, `barandbench`, `theweek`, `etvbharat`, `zeenews`, `ani`, `hansindia`, `indiatv`, `livelaw`, `ips` (never expanded in the dossier), `ratopati`.

## Facts with no outlet in the dossier (`source_ids: ["dossier"]`)

These dossier rows cite no outlet, so the footer can only say "research dossier":

- 11 Jun: SPPU Pune campaign and ₹10,000 demand
- 17 Jul: government tells HC it will intervene; Delhi HC petition
- 18 Jul: Delhi Police leadership change; barricades removed
- 23 Jul: Dipke vows to continue; MEA "no information"; PM announces fast-track courts
- 25 Jul: "hundreds" celebrating on site; Special CP and 2 officers hurt, then lathi charge and tear gas

## Coordinates (`sites.json`)

_2026-11-11: checked against OpenStreetMap. 16 of 18 sites are now `verified` with a named OSM id. OSM data needs an "© OpenStreetMap contributors, ODbL" credit in the footer._

- **`parliament_street`** is `approx`: it's a street (Sansad Marg), and the exact flashpoint position isn't recorded.
- **`metro_udyog_bhawan`** is `approx`: OSM now names that station "Seva Teerth", so the name match is unconfirmed.
- **`parliament`**: uses the **new** Parliament House. The dossier doesn't say which building. Vali to confirm.
- **`safdarjung_hospital`**: is about 6.5 km south, outside the main map frame. S5 needs an inset or an off-frame arrow.
- **Unnamed metro stations**: the dossier names five of the closed stations; the July count reached 18.
- **Base map**: built at `data/map/base.json` (OSM). Barricades and other drawn graphics are **illustrative only**: no source records their positions.
- **Phase-2 map sites not added**: police stations (Parliament Street, Connaught Place, Mandir Marg, Jafarpur Kalan, Crime Branch Rajouri Garden) and the replacement protest sites (Ramlila Maidan, CBD Ground Shahdara, Burari). The map is Phase 1 only (D2), so these aren't needed unless that changes.
- **No `route`**: nothing in the dossier gives a path for the 18 Jul removal or the 20 Jul march, so node 4's `route` is null. The spec draws the dashed path only if `route` exists.

## Media

- **Victory node**: no videos. Vali (2026-11-12) chose kinetic typography instead (`media_mode: "kinetic_type"`). The 20–24 Jul node only draws clips from 20–21 Jul.
- **No Commons images** for nodes 2 (sit-in), 3 (Wangchuk) and 4 (detention). Node 1 uses the CJP flag, which is a symbol, not a protest photo.
- **Video picks are all `review: "pending"`**. Note: one pick in node 5 is titled "CJP Protest was funded by Pakistan?😳" and may be misinformation framing.
- The Bengaluru poster photo (on the Hyderabad sub-beat) is under an active Commons deletion request, and it's Bengaluru, not Hyderabad.
- Most protest photos show identifiable faces, so blurring is a decision for Vali (see IMAGE_SOURCES.md).

## Spec items the data can't supply

- **S4 caption** (`meta.protest_start_caption`), **S9 headline** (`meta.cta.headline`), **S6.5 heading** (`epilogue_october.title`): not in the data. Vali (2026-11-12): leave these slots empty, no `[MISSING]` tag; Vali will add text if needed.
- **S3.5 “Indian 51%”** is derived (100 − the minister's 49%), shown with the minister as claimant at Vali's request (2026-11-12). It is not a separate row in `metrics.json`.
- **S3.5 cluster labels**: "Indian" and "Pakistani" come from the `start_pushback` fact; "Elsewhere" (the small remainder cluster) is UI wording, not data.
- **S7 kicker**: "Media engagement" is the spec's default for O3, taken from the sketch, not from data. Vali to confirm.

- **Headcounts**: there are no numeric headcounts per node, only descriptions ("hundreds", "thousands", ">10,000"). Roach counts come from `crowd_tier` (D6), not `ceil(headcount / perRoach)`.
- **S5 sub-beat 2c** ("camera moves across the relevant sites"): between 20 and 27 Jun every event is at Jantar Mantar Road, so there are no multi-site moments. The multi-site sweep fits node 5 (20 Jul flashpoints) better.
- **Dossier collection date**: not stated.
- **No source for figures named as unsourced in the dossier**: the dossier found no source for "about 20,000" (a CJP claim before 20 Jul) or for "1,000–2,000 police". Don't use either.

## F3 (2026-11-12)

- No new data gaps: the shell shows no facts.
- **Footer anchors**: scenes emit `*` links to `#src-N` (`src/lib/star.js`) before S10 exists, so they dead-end until S8–S10 renders the sources list.
- **Runtime network call**: anime.js loads from jsDelivr (kept from v2 at the kickoff's request). Spec §8 wants none; self-host in M9.

## The web contradicts the dossier (2026-11-12): resolved

A web agent checked 180 fact–source pairs: 134 have a found URL, 24 have none, and 22 conflict with the dossier. **Vali (2026-11-12): primary source wins.** Every conflict below is now resolved in `build_story.py`, and each changed fact carries a `resolution` note. 0 facts are left `contradicted`.

**Paywall rule (Vali, 2026-11-12):** paywalled items are kept out. The Indian Express RML fact and the LiveLaw 15 May quote source are removed; the CJI quote now cites The News Minute.

**Still to click-check before ship:**
- NDTV's 'B Team Of Disruptive Elements' interview: on the **backbench** (`hold`). The fact isn't featured until someone can view it.
- The Wire's CRPF pellet report: checked by Vali on 2026-11-12.
- Every Wikipedia section anchor, since those were inferred.

Facts marked `unverified` must not be charted: 2 ACPs hurt, the compensation wording, the 9 Oct SC hearing, and Chouhan's 'hooligans'. The raw results are in [f1/fact_links.json](f1/fact_links.json). The main conflicts:

| Fact | Dossier | Web |
|---|---|---|
| 20 Jul pellets | RAF fired 7 rounds, 5 hit (Indian Express) | Delhi Police records (PTI, HT, ThePrint, Tribune): **2 rounds**. 7/5 appears only in The Wire, citing a CRPF report |
| Pradhan, ~23 Jun | "B-team of terrorists" (to NDTV) | NDTV's own headline: **"B Team Of Disruptive Elements"**. "Terrorists" appears only in The Wire and Dainik Jagran |
| Agitation length | 36 days and 49 days, sources mixed | 36: Al Jazeera, Telangana Today. 49: Christian Daily, plus the Wikipedia infobox (1 month 19 days). The ledger's attributions are swapped |
| Late-June followers | 22 million (yahoo) | The page says "over 20 million"; 22M is not found anywhere |
| 20 Jul ">10,000" | Media (AJ/AP/Reuters) | Al Jazeera attributes it to DCP Sachin Sharma, a police estimate; AP says "thousands" |
| Dates | HC challenge 26 May; ASG Raju 22 Jul; Parliament adjourned 22 Jul; Singh "unauthorised sources" ~6 Nov | 25 May filed / 29 May first hearing; 21 Jul; 23 Jul; 3 Nov |
| Founding | "launched the CJP from the US"; 15–16 May | Wikipedia doesn't say "from the US"; the launch was online on 16 May |
| 25 Jul deal | "NDA-ruled states", "maximum compensation" | Christian Daily: "governed by the BJP", "honourable compensation within existing rules" |
| HPEC portal, 15 Oct | MHA says priorities… | It was the SC committee, not the MHA; the wording is "harassment of female protesters" |
| Other | Kharge detained 21 Jul; 45 metro stations 9 Oct; "about 4 hours, 70 questions"; Pralhad Joshi "new" minister | Kharge led but wasn't reported detained; IANS says 57; the hours and questions are unsupported; Joshi holds Education as an additional charge |

Also: `india` may be Zee rather than India.com for the October items; confirm which outlet is meant. One web sub-agent wrote a helper script to `/tmp`, outside the scratchpad; it's harmless but noted here.

## Wangchuk (2026-11-12): resolved from public Indian outlets

Sources: Scroll, The Wire, Free Press Journal, Kashmir Life, Al Jazeera, Newslaundry (free), ThePrint/PTI/ANI, Outlook, DT Next/PTI. Raw notes are in [f1/wangchuk.json](f1/wangchuk.json).

- **Role chip:** "Engineer-turned-activist" (Al Jazeera, 14 Jul).
- **Vali's summary** ("detained and carried away when he started his hunger strike") **conflates two dates.**
  - He joined the protest on 6 Jun and began fasting voluntarily on 28 Jun.
  - Police **removed** him to hospital on **18 Jul** (day 21), citing medical care under an HC order.
  - Only the CJP called it "detained" or "kidnapped", and the data attributes those words to the CJP.
- **Fast end:** now "night of 23–24 Jul", because most outlets say just after midnight on Friday 24 Jul.
- **Assurances:** "written" was dropped, because outlets disagree on whether the assurances were written or read out.
- **Other corrections:**
  - Appeal of 1,800+: moved to 14 Jul.
  - Weight: "more than 9 kg" on 16 Jul, day 19. The exact 9.1 kg appeared only on a mirror of BBC copy.
  - "Honorary cockroach": dated 23 May, verbatim.
  - "Independent student Hamad": dropped as unconfirmed.
- **Why he fasted:** now verbatim from Al Jazeera, 19 Jul: 'three weeks on hunger strike in solidarity with the Cockroach Janta Party (CJP) protest movement'. The same article adds his wife's 'illegal detention' quote and the judge's reply, both attributed.

## Prologue (S0–S4b), 2026-11-12

- **Swarm count 1000, not the spec's 380** (Vali, gate 1 and review). Spec S3 and the S3.5/S4 briefs say 380; STATUS records the change.
- **S4 map landing count** comes from `methodology.crowd_tiers` (start node tier 2 → 120 roaches). That key isn't on S4b's allowed list; Vali approved it at gate 1.
- **S4 → S5 handover is open**: S5 is still the F3 placeholder. S5a must build its p 0 frame to the S4 p 1 contract in STATUS.
- **Keyword aria-label** reads "Click the word cockroaches to continue". The spec says "cockroach"; the build uses the data's keyword as written.
- **S4 caption** stays empty (Vali 2026-11-12); there's no `meta.protest_start_caption`.
- No new data gaps: every on-screen string in S0–S4 comes from `data/story`.
- **S3 "how many joined"**: uses the metrics row `Online sign-ups` (350,000+, CJP claim, claimed). The other candidate is `Members 'within days'` (over 100,000, media, claimed). Vali can swap it.
- **Body face changed to Redaction** (Vali 2026-11-12). DESIGN.md still says Public Sans; update it if this sticks. Redaction has only 400/700, so `--w-medium` and `--w-black` render as Bold.
- **Founder portrait** uses `people[abhijeet-dipke].image` (CC BY 4.0 screenshot, LetsUpp Marathi via Commons), with its credit on screen. It isn't on S1–S2's allowed-keys list; Vali asked for it (2026-11-12).

## S5 map stage (2026-11-12)
- **Narrative copy is a builder draft** (`data/story/narrative.json`): built only from ledger facts + the 20 Jul research, quotes verbatim, claimants kept, but it paraphrases. Needs Vali's edit.
- **20 Jul research** (`data/story/sansad_chalo.json`, `docs/build/research/sansad-chalo-0720.md`): some snippets came via a summarising fetch tool (facts carry a re-check note); HT/TOI/News18/BS/Deccan Herald blocked; The Wire pellet article headline-only; Caravan may be paywalled. Conflicts open: first baton charge 7.30 am vs 10.37 am; detentions 20+/100+/~70/denied; RML ~100/65 MLC/200+; crowd one lakh/50,000+/10,000+; barricade heights 6/7/8 ft. **No source positions barricades or police units**: all drawn illustrative. South First's machine-gun positions rest on one outlet.
- **20 new sources** are merged at runtime; S10 (or the F1 generator) must absorb them into the footer properly.
- **Imagery:** all 31 open 20 Jul photos are 07:35–07:56 (morning gathering); none of the march or clashes. Most show identifiable young faces. 11 of 17 Raydann 21 Jul photos not downloaded (Commons 429); Raydann and Alnitak-Alnilam-Mintaka may be one photographer. Bengaluru photo still under deletion request; LA photo EXIF date wrong.
- **Flagged video** (`eAmtVu_Sqhk`, "funded by Pakistan?") flagged by id in `rail.js`; a `flag` field in the data would be cleaner. It never renders (first-media rule).
- Long place labels overlap on some 20 Jul hour frames; late-day roaches at close zoom crowd the incident glyphs.


## Remaining scenes: S6, S6.5, S7a–d, S8–S10 (2026-11-12)
- **S6:** "Victory" and the line come from `meta.finale`; the `*` uses the victory node fact's attribution ("reported"). No new gaps. Brackets kept per the brief, but S4 dropped them (Vali to confirm).
- **S6.5:** the "Epilogue" kicker is a section label from the storyboard, not data. Narratives (`epilogue_october.narratives[]`) are not shown (not in the approved frame).
- **S7 corpus (charts A–C):**
  - `clip.source` tags are per channel and undefined in `vocab.json`. The Indian Express, Hindustan Times, The Hindu, IndiaTV and LokmatHindi are tagged "citizen"; "party" = only the channel named Cockroach Janta Party. Needs a reviewed channel → type map.
  - Channel count: `channels.json` / `data_profile.channels` say 310 (309 unique, The Hindu twice); the clips have 255 distinct channels. Charts use 255.
  - 8 channels have 0 views (no circle in chart B).
  - Collection time 2026-07-21T18:54Z = 22 Jul 00:24 IST; the screen says "collected 21 Jul" (UTC date).
  - Kicker "Media engagement" is the spec default (O3), not data. Chart titles, callouts and notes are new copy.
  - `.reading` doesn't re-point `--chart-*` tokens in the ink theme; S7's CSS does it locally (belongs in tokens.css).
  - The D3 modules load from jsDelivr; one failed load stops boot (self-host at M9).
- **S7d apparatus** (`data/story/apparatus.json`, draft): Election Commission `kind: "trigger"` drawn grey (v2: red); Bengaluru tied to the CJP only by Amnesty; Home Ministry grouped online but its CRPF order is a street action (duplicates the CRPF fact); two actions not in v2 (RAF 7 rounds, 45 metro stations); the Delhi High Court 18 Jul item reads "police: on medical advice and per HC directions" verbatim. Kicker "The state response", title "The apparatus" and the "See also: Rapid Action Force" cross-reference are new copy. 4 new sources merged at runtime (117–120); `devdiscourse_0523` is cited by no action.
- **Runtime source merges** (S5, S7d, S10) should move into `load.js` (needs Vali's OK); today S7d merges sansad's sources first so numbering is stable (97–116 sansad, 117–120 apparatus).
- **S8:** Bhagat Singh and Faiz deselected (Vali); the generic original-script/translation path stays.
- **S9 `<head>` tags:** no share image (1200×630) and no production URL. Proposed tags are in the S8–S10 report (STATUS).
- **S10 shows builder-facing text** from `methodology.json`: `roach_size` starts "Spec S5:"; `collection_dates` mentions "the PDF", `IMAGE_SOURCES.md`, `timeline_clips.json`; some caveats are instructions ("verify against the originals before publishing"); the `dossier` source reads "Research dossier (Claude.pdf, supplied by Vali)"; ~50 entries read "Outlet, Outlet (article not specified)". Needs reader-facing wording.
- **S10 open:** url-null sources by outlet only (`methodology.asterisk`)? Claimant/status appear only in each star's aria-label; YouTube videos credited only in S5 cards; "no unused sources" not yet checked (65 of 116 not seen in a coarse sweep).

## Hybrid, Gate 0 (build/hybrid, 2026-11-13)
- **Ledger error:** `timeline.json` start_pushback and `narrative.json` say the CJP "reappeared within minutes" (Wikipedia). Business Today (primary, 21 May): "hours after being withheld". Fix pending Vali's OK.
- **X account:** actual date @CJP_2029 became visible again is disputed (PTI: shortly after the 7 Jul order; Reuters: still withheld that evening). PTI names the handle "CJP_for_India"; the order says @CJP_2029. Outcome of the 24 Jun MeitY review-committee hearing not found. Dipke's 23 May claim that the backup account was taken down is unconfirmed.
- **October counts:** Delhi 10 Oct has eight published counts (about 200 to more than 15,000), never summed; `epilogue_october.json`'s "2,000 to 15,000" understates the range. v2 errors dropped: 2 Oct "500+" (unattributed), Mumbai internet, "about 1,200 across three cities", de-listing on 13 Oct (it was 12 Oct). Bengaluru: Amnesty "at least 100" vs South First "about 50–60". CNN, Zee, Deccan Herald, Statesman unfetchable.
- **Voter roll:** 130M+ is a cumulative draft-roll count reported via the BJP's use of ECI data; no ECI national total found. Final-roll net (Bihar + Phase 2) about 6 crore (about 10 in 100), for the footer. ECI 2024 electorate 96,88,21,926 confirmed only via news. The ECI reasons snippet and several others are fetch-tool paraphrases (`verified: false`).
- **All three new drafts:** much web text came through a summarising fetch tool; every `verified: false` snippet needs a verbatim re-check before it reaches the screen (each group's Gate 1).
- **Copy:** every hybrid headline, dek and caption is listed for sign-off in `docs/build/hybrid/COPY.md`; "Thirteen hands" counts the Election Commission, which S7d draws as a trigger; the close kicker "As of 7 November 2026" is new.
- **Storyboard only:** the 20 Jul dead-signal zone is drawn by eye round the Jantar Mantar label (no source maps the cut); the S5 scrubber in the frames still shows v3's six nodes; ledger labels sit close at 1280×720.
- **Revision 1 (2026-11-13):**
  - **NEET:** the CJP was not founded over NEET; it took up the leak on 22 May (PTI). NTA, PIB and nta.ac.in were not fetched, so every NTA quote is via press copy. Open conflicts: suicide counts (CJP 21 vs one open letter 11); the leak's origin (a Kerala student vs a printing press); 5,400 centres is from ANI copy only.
  - **Detentions:** Rathee's clock time (6, 7, 7:10, 7.48 or 8 am) and the detaining force (Delhi vs Gurugram police) are disputed; his "kidnapped" account is his own (alleged). Dipke's 10.30 am time rests on one outlet (Oneindia). ThePrint and The Week were unreadable.
  - **Rathee photo:** `license_ok: caution` (CC BY 3.0 rests on a YouTube CC label).
  - **S10 disclaimer** still says the piece covers "16 May to 25 July 2026"; the hybrid runs to 7 Nov.
- **Hybrid build (2026-11-13):**
  - **S5 hybrid** drops v3's narrative body copy, media cards and people chips from the reading flow (restraint budget). `narrative.json` and `imagery.json` are still loaded but unused on screen.
  - **Rail code** (`rail.js`) is still imported but unused.
  - **20 Jul dead-signal zone** is still illustrative (no source maps the cut).
  - **The 1.5 km ring** is drawn to scale from the ISOC-reported order, centred on the Jantar Mantar Road anchor.
  - **Ledger dot labels** shorten the claimant wording; the `*` aria-label carries the full claimant.
  - **ROLL's new UI copy** ("You were struck off." / "You're still on it. Thirteen others aren't.") is for Vali's sign-off.
  - **OCT's short claimant labels** abbreviate `october_counts` claimants; the hover tips show them in full.
  - **S10** still lists sources by number; the footer now carries the hybrid drafts' new sources (merged in `load.js`).
  - **Verified verbatim by the lead (2026-11-13):** the 2024 roll size (now Free Press Journal; The Statesman 403s), the ECI's removal reasons (ThePrint/Reuters), and Business Today's "hours after". Every fact the hybrid puts on screen now has at least one verified link. The `verified: false` snippets that remain are on off-screen facts: the 13.37 crore draft count, phase electorates, the final-roll net, the HRW and Yadav counter-figures, and the Instagram events.

## Hybrid, review 2 (2026-11-13)
- **S10 disclaimer wording:** it still says figures are "linked in the sources below"; the sources now open in a References modal from a button. Left verbatim (methodology text is Vali's to change).
- **OCT:** the Mumbai count (`oc_1010_mumbai_amnesty`) is no longer on screen; its source stays in the References list.
- **UX review findings not acted on** (design calls for Vali): ROLL counter resets to 0 while the 13 struck entries are up, and "Click any name" (entries have no names); S5 scrubber parked on 20 Jul for ~820 vh; hover detail in WATCH/OCT/CAGE has no on-screen hint and is mouse-only (CAGE chips excepted); CAGE has no captions for 340 vh; S6 "Victory" reason (Pradhan resignation) arrives last and small; the swarm re-forms the 94% circles between NEET and HELD; deks are visible only ~20 vh before docking; lockup boxed in S5 only; OCT's dark CJP band near-black; WATCH unlit cells too dark; WATCH hover card's star can't be clicked; OCT "Rathee released" flashes ~15 vh.

## Hybrid, review 3 (2026-11-13)
- **NEET headline "22 lakh students, one cancelled exam."** rounds 22.79 lakh and carries no star (Vali's chosen wording; the dek and first caption give 22.79 lakh with stars). Vali to decide.
- **Copy facts the data lacks** (copywriter agent): 49,100 followers by 21 May evening (FPJ, unverified); Jantar Mantar's protest-site designation year; a verbatim SG line on "blocked at a time when NEET…"; the de-notification date (11 vs 12 Oct); a clock time for RML's emergency closing; a verified 20 June crowd figure; whether the 23 July MHA order was published; corpus totals for the YouTube views.
- **CAGE:** grey is used for the Election Commission and for "mixed" court bars; the dek now says "Grey marks the Election Commission". A legend chip would settle it.
- **S5 note tags** carry stars inside `aria-hidden` tags (pre-existing pattern): the stars are not reachable by screen readers there.

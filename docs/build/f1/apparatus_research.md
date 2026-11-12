# Apparatus spokes: research log (draft, 2026-11-12)

Port of v2 "07 · The apparatus" (`index.html`, `N` array) into `data/story/apparatus.json` (`draft: true`).
The rule throughout was **primary source wins**: where a source disagrees with v2, the source's wording and date are used and the v2 text is kept in `v2_action`.
Ledger facts are copied verbatim (`from: "ledger:<file>#<path>"`). Web facts (`from: "web"`) use the source's wording. Paywalled pages were not used.

**Totals.** 13 actors and 31 actions: 15 from the ledger and 16 from the web.
- web_check: 26 verified, 5 partial, 0 unconfirmed.
- status: 19 documented, 8 disputed, 4 claimed, 0 unverified.
- All 27 v2 actions were sourced. Two actions are additions with `v2_action: null` (RAF 7 rounds, Metro 45 stations).
- **The 4 new sources are not yet in `sources.json`.** They sit in `apparatus.json → new_sources` and must be merged before S7 renders.

## Per actor

**Delhi Police** (v2: Wikipedia · Amnesty)
- 20 Jul, Section 163: ledger `sansad_chalo#steps[5].summary_facts[0]`. That fact already carries a conflict note: the DCP said Section 163 was already in force.
- 20 Jul, batons and tear gas: ledger `timeline#protest_arrest.facts[2]` (partial).
- **Moved here from v2's RAF node:** the "completely false and misleading" pellet denial. It is a Delhi Police "Fake News Alert" post on X, dated **21 Jul** (v2 said 20 Jul).
  - Source: ThePrint (PTI) https://theprint.in/india/delhi-police-denies-cjps-claim-of-pellet-gun-use-against-protesters-calls-post-fake/2992645/
  - Marked disputed. It must be shown next to the General Diary entry and the CRPF report.
- 12 Oct, Jantar Mantar removed from permitted areas: Amnesty, verbatim.
  - The ledger has the standing order dated 11 Oct (epilogue `#facts[5]`, unconfirmed). 12 Oct is the reporting day.
- 13 Oct, Das and Ranka arrested and remanded for 5 days: Amnesty. Delhi Police called it "preventive" (epilogue `#facts[12]`).
  - Amnesty: https://www.amnesty.org/en/latest/news/2026/10/india-release-cjp-leaders-arrested-after-attempting-peaceful-protests-at-jantar-mantar/

**Rapid Action Force**
- General Diary, two rounds: ledger `sansad_chalo#steps[7].summary_facts[4]`.
- **Added:** the CRPF report's 7 rounds and 5 hits (`#steps[7].summary_facts[3]`). This keeps the disputed pair together.

**CRPF**
- 20 companies airlifted: ledger `timeline#pa_0721.facts[1]`.
- **Date conflict:** v2 says 22 Jul. Wikipedia files it under 22 July but says the MHA gave the order on "Tuesday night" (21 Jul). The ledger's 21 Jul stands.

**Delhi Metro**
- 5, then 16/17, then 18 stations: ledger facts (sansad step 2, `pa_0721`, `pa_0724`).
  - Wikipedia now puts the 16 on 22 Jul and the 17 on 23 Jul. That is a known split; metrics m42 notes it.
- 2 Oct, "at least 11" stations: Al Jazeera, verbatim. Al Jazeera says "Authorities", not DMRC.
  - https://www.aljazeera.com/news/2026/10/2/indian-authorities-clamp-down-as-cockroach-movement-launches-new-protests
- **Added:** 9 Oct, 45 stations (epilogue `#facts[1]`, disputed).

**Mumbai Police**
- **v2 was wrong on two counts.** v2 said "Jul–Aug, FIRs against 400". PTI reports **13 FIRs and 400 booked, 18–22 Jul**, citing officials.
  - Source: https://theprint.in/india/mumbai-400-booked-13-firs-registered-in-five-days-for-staging-protests-without-permission/2994070/
- 10 Oct, "more than 600" **detained**: Amnesty.
  - Ledger m61 says "Arrested (Mumbai) ~600" (ANI via Al Jazeera). The status is kept as `claimed` to match it.

**Bengaluru Police**
- 12 Oct: Amnesty reports "at least 100" detained.
- **Count conflict:** The South First reports "around 50–60".
  - https://thesouthfirst.com/karnataka/anti-sir-protesters-detained-near-ceo-office-in-bengaluru-women-allege-police-excesses/
- **Link conflict:** The South First and other search results name the "My Vote My Right" coalition, not the CJP. Only Amnesty links the march to the CJP. Marked disputed.

**Home Ministry**
- CRPF order: the same ledger fact as the CRPF node.
- 23 Jul, mobile internet suspended within 1.5 km of Jantar Mantar, 9:30–16:00: Internet Society Pulse.
  - https://pulse.internetsociety.org/en/shutdowns/internet-suspended-in-new-dehli-nct-india-23-july-2026/
  - Partial: the same page quotes a 4 pm–12 am window and orders extended to 25 Jul.

**MeitY**
- 21 May, Section 69A block: ledger `timeline#start.facts[4]`. It had no links; India.com and LawBeat links were added.
  - LawBeat quotes the order as "Email dated 21.05.2026".
- 7 Jul, "no difficulty":
  - MediaNama has "no difficulty"; LawBeat has "no objection".
  - **Speaker conflict:** both quote the Solicitor General for the Union, not MeitY by name. Partial.

**Intelligence Bureau**
- India.com (citing Indian Express): "reportedly came after inputs from the Intelligence Bureau citing 'national security concerns'".
- **Wording conflict:** v2's "inflammatory content" does not appear. India.com says "allegedly inflammatory posts", raised by "intelligence agencies". The source wording is used. Claimed.

**Telecom operators**
- 20 Jul: IFF says "No copy of any suspension order has been published".
  - **Gap:** no source names an operator.
  - The "government instructions" text is an SMS the CJP posted; The Week reports it but does not confirm it. Partial.
  - v2's "The Wire" chip was not needed.
- 2 Oct, Connaught Place at 9:40 am, before the 11 am protest: IFF. The Jio SMS is quoted.

**Delhi High Court** (dashed; each action has `effect`)
- 7 Jul, restore (LawBeat/MediaNama): blocking order "directed to be revoked".
- 18 Jul, restrict: ledger `detention.facts[1]`, police say "per HC directions" (disputed).
  - **v2 overstated this.** v2's "orders … removed from the site" is not supported: no HC removal order was found.
- 19 Jul, restrict: ledger `detention.facts[6]`, Judge Pushkarna. Al Jazeera link added; quote verified.
- 21 Jul, mixed: Division Bench, "shifted immediately to Medanta Hospital" (ThePrint/ANI).

**Election Commission**
- "more than 130 million names" removed: Al Jazeera, 8 Oct.
  - **v2 conflict:** v2's "2025–26" period is not in the source.
- "at least 14 times in the past 10 months": Al Jazeera, citing Indian Express. The Indian Express original was not fetched.
- kind `trigger`, not `restriction`.

**Union ministers**
- Majumdar 49%: ledger `start_pushback.facts[3]`. **23 May confirmed** by PTI via Devdiscourse (Deccan Herald returned 403).
- Pradhan resigns: ledger `victory.facts[0]`.
- **Excluded:**
  - The Pradhan "B Team" fact (`hold`).
  - The Jitendra Singh fact (5 Nov, outside v2's date range).

## New sources (in `apparatus.json → new_sources`)
- `theprint_0721_pellet_denial`
- `theprint_0723_mumbai`
- `southfirst_1012_bengaluru`
- `devdiscourse_0523`

`repo_medianama` and `repo_lawbeat` have `date: null` in `sources.json`. The web gives 7 Jul and 8 Jul; those dates are in the links only.

## For Vali
1. Should Bengaluru stay on the network? Only Amnesty ties that march to the CJP.
2. The Election Commission is not a restriction on the CJP. Should it get a solid red spoke as in v2, or a different style (`kind: trigger`)?
3. The Home Ministry is grouped "digital" but also ordered the CRPF airlift. Keep it there, or split it?
4. **The court spokes have sourced actions:** 4 for the Delhi HC (1 restore, 2 restrict, 1 mixed). The **Election Commission's** 2 are sourced but are not court actions. In v2 it is in "politics", with a solid spoke.
5. Keep or drop the two additions (RAF 7 rounds, Metro 45)?

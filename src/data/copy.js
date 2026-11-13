// Hybrid copy (build/hybrid; Gate 0 signed off by Vali 2026-11-13): every chapter headline, dek and caption.
// The scenes (src/scenes/h-*.js, s05 hybrid mode) render from this file; docs/build/hybrid/COPY.md is generated
// from it (tools/hybrid/copy-md.mjs), so what Vali signs is what renders. Facts come only from data/story (ids noted per caption); star tokens {*ids|claimant}
// render as the footer `*`. origin: 'v2' = Vali's v2 copy reused verbatim, 'v2*' = v2 copy edited to fit the
// sources, 'new' = drafted in this chat from ledger facts, 'v3' = already on screen in v3.
// Restraint budget: one claim headline + one visual + caption ≤ 40 words, ≤ one starred figure per sentence.

export const CHAPTERS = [
  { id: 'prologue', n: '01', label: 'Prologue', scenes: 'S0–S3.5 (v3, unchanged)', origin: 'v3', kicker: null, headline: null,
    note: 'Unchanged v3 prologue: word → CJI quote → click → spawn → multiply → 49% / 94% claim. No chapter head (the prologue is its own title).' },

  { id: 'neet', n: '02', label: 'The grievance', scenes: 'new scene on the prologue stage, after S3.5 (before Withheld)',
    kicker: '3 – 22 May',
    headline: '22 lakh students, one cancelled exam.', origin: 'new', alts: ['The joke found its grievance.'],   // Vali 2026-11-13
    dek: 'The party began on 16 May as satire about a slur. Four days earlier, an exam 22.79 lakh students had registered for was cancelled{*neet_scroll_0512|NTA said}.', dekOrigin: 'new',
    legend: 'One bubble = 1,000 registered candidates (2,279 bubbles)',
    captions: [
      { when: '3 May · the exam', origin: 'new', facts: 'neet.json neet02, neet06',
        html: 'NEET-UG was held on 3 May; 22.79 lakh students registered{*neet_tnm_0515|reported}. Police in Rajasthan later said a “guess paper” had matched about 120 chemistry questions{*neet_scroll_0512|police said}.' },
      { when: '12 May · cancelled', origin: 'new', facts: 'neet.json neet05, neet09, neet10',
        html: 'Nine days after the exam, the testing agency cancelled it{*neet_scroll_0512|NTA said}, and the CBI registered a case{*neet_careers360_0512|officials said}. A re-test was set for 21 June{*neet_tnm_0515|NTA said}.' },
      { when: '22 May · the demand', origin: 'new', facts: 'neet.json neet16, neet17',
        html: 'The party had begun as satire. On 22 May it took up the leak and demanded the education minister’s resignation{*neet_dtnext_0522|reported}. Its slogan: “We asked for Make in India, you gave us Leak in India.”{*neet_fpj_0606|reported}' },
    ],
    note: 'Sourced in data/story/neet.json (research/neet.md). The CJP was not founded over NEET (the CJI remark came in a non-NEET hearing); the copy keeps that order. Pradhan’s resignation note ties it back at Victory.' },

  { id: 'withheld', n: '03', label: 'Withheld', scenes: 'new scene W (prologue stage, between S3.5 and S4)',
    kicker: '21 May – 7 Jul',
    headline: 'Blocked for 48 days. Back within hours.', origin: 'new',
    alts: ['Forty-eight days under a block.', 'Silenced in India, not online.'],
    rejected: { text: 'Forty-eight days of silence.', why: 'Sources: the party posted throughout from a second handle, @Cockroachisback, opened hours after the block (Business Today, 21 May, read verbatim). The 48-day span itself holds: 21 May withholding (Day 1) → 7 Jul High Court order (Day 48).' },
    dek: 'On 21 May the government had the party’s X account withheld in India. It took a court 48 days to lift the order. It took the party hours to open another.', dekOrigin: 'new',
    captions: [
      { when: '21 May · Day 1', origin: 'new', facts: 'withheld.json x_withheld_2026_05_21',
        html: 'The IT ministry had the party’s X account, @CJP_2029, withheld in India under Section 69A of the IT Act{*repo_lawbeat,repo_indiacom_xblock|reported}, reportedly on Intelligence Bureau inputs{*repo_indiacom_xblock|reported}.' },
      { when: '21 May · hours later', origin: 'new', facts: 'withheld.json cib_launch_2026_05_21 (Business Today verbatim)',
        html: 'Hours later the party was back as “Cockroach is Back”{*withheld_bt_newavatar|reported}. Its first post: “You thought you can get rid of us? Lol!”' },
      { when: '29 May · Day 9', origin: 'new', facts: 'withheld.json hc_29_may_no_interim_relief',
        html: 'The Delhi High Court declined to restore the account and sent the case to the IT ministry’s review committee{*withheld_patriot_pti|reported}.' },
      { when: '7 Jul · Day 48', origin: 'v2*', facts: 'apparatus.json meity[1], delhi_high_court[0]; withheld.json cib_status_2026_07_07',
        html: 'The court revoked the order{*repo_lawbeat|court order}. The government’s lawyer said why the block could end: “Now the examination is over.”{*repo_medianama|reported} By then the second account had over 2,80,000 followers{*withheld_patriot_pti|reported}.' },
    ] },

  { id: 'street', n: '04', label: 'The street', scenes: 'S4 (date) → S5 map, cut to four beats',
    kicker: '6 Jun – 19 Jul',
    headline: 'Off the feed, onto the road.', origin: 'new', alts: ['They came back, and stayed.'],
    dek: 'Six weeks at Jantar Mantar, New Delhi. The roaches grow with the crowd: the more people reports counted, the more roaches.', dekOrigin: 'new',
    captions: [
      { when: '6 Jun · Day 0', origin: 'new', facts: 'timeline start: “Hundreds”, fpj_0606 quote',
        html: 'The first street protest at Jantar Mantar. Reports counted “Hundreds”{*aljazeera,theweek|reported}. Sonam Wangchuk came too: “I don’t like protests, but we have to do it for justice.”{*fpj_0606|said}' },
      { when: '20 Jun · Day 14', origin: 'new', facts: 'timeline protest_2a',
        html: 'Two weeks later they came back. Police declared the protest past its permitted hours{*wikipedia,dynamitenews|police said}. Dipke refused to leave, thalis were banged, and an indefinite sit-in began{*wikipedia,cnn|reported}.' },
      { when: '28 Jun · Day 22 · Fast day 1', origin: 'new', facts: 'timeline protest_2b (Outlook), wangchuk',
        html: 'For nearly three weeks it was, in Outlook’s words, a fringe story{*outlookindia|reported}. Then Sonam Wangchuk began an indefinite fast at the site{*wire_0630,scroll_0718|reported}. In May he had said: “But I consider myself an honorary cockroach.”{*theprint_0523|said}' },
      { when: '18 Jul · Day 42 · Fast day 21', origin: 'new', facts: 'timeline detention',
        html: 'Two days before the march on Parliament, police removed Wangchuk to Safdarjung Hospital{*wikipedia|reported}, on medical advice, they said{*wikipedia,scroll_0718|police said}. The CJP: “he has been forcefully kidnapped by the Police and taken away.”{*newslaundry_0718,scroll_0718|CJP claims}' },
    ] },

  { id: 'july', n: '05', label: '20 July', scenes: 'S5 map, 20 Jul hours cut to three + 23 Jul',
    kicker: '20 – 24 Jul',
    headline: 'No signal, no order.', origin: 'v2',
    dek: 'The march on Parliament. Phones went dark around the site and the metro shut its gates. On 20 July no order was published. On 23 July there was one.', dekOrigin: 'new',
    captions: [
      { when: '20 Jul · 09:23', origin: 'new', facts: 'sansad_chalo 0720_0900; apparatus delhi_metro[0]',
        html: 'By nine the area was sealed. The metro closed five stations{*theprint,theweek_0720|officials said}. At 9.23 am: “Mobile internet services are unavailable at Jantar Mantar.”{*tribuneindia|reported}' },
      { when: '20 Jul · 15:08', origin: 'new', facts: 'apparatus telecom_operators[0]; sansad_chalo 0720_1430',
        html: '“No copy of any suspension order has been published by the Ministry of Home Affairs.”{*repo_iff_central_delhi|IFF} Near Patel Chowk metro station, police lathi-charged and fired tear gas{*theprint_0720_live|reported}.' },
      { when: '20 Jul · 17:38', origin: 'new', facts: 'sansad_chalo 0720_1730',
        html: '“Disruptions to internet services in the area have affected app-based cab services.” The suspension “remained in effect until the evening of July 20”{*repo_iff_central_delhi,tribuneindia|reported}.' },
      { when: '23 Jul', origin: 'v2*', facts: 'apparatus home_ministry[1]; metrics m44',
        html: 'This time the order was written down: no mobile internet within 1.5 km of Jantar Mantar, 9.30 am to 4 pm{*repo_isoc_0723|reported}. By 24 July the metro was shutting 18 stations{*wikipedia|officials said}.' },
    ] },

  { id: 'ledgers', n: '06', label: '20 July, again', scenes: 'S5 map stage, after the hours (map dimmed under three scales)',
    kicker: '20 July, again',
    headline: 'One march, three ledgers.', origin: 'v2',
    dek: 'The police, the hospitals and the movement each kept a count of the same afternoon. They rarely count the same thing, and where one says zero, another has paperwork.', dekOrigin: 'v2',
    legend: 'Solid red: what the state said · hatched: what a record shows · open: what the movement said',
    captions: [
      { when: 'Injured', origin: 'v2*', facts: 'metrics m29, m32, m33 (dots also m30, m31)',
        html: 'Police said 118 officers were hurt{*theprint,pti|police said}. By 7 pm RML hospital had logged 65 medico-legal cases{*wikipedia|reported}. The CJP says about 150 protesters were hospitalised{*wikipedia|CJP claims}.' },
      { when: 'Detained', origin: 'v2*', facts: 'metrics m34, m35; sansad_chalo 0720_1730',
        html: 'Police later said no protesters were detained{*wikipedia|police said}. On the day, police sources told reporters “more than 100”{*deccanchronicle_0720_detained|police said}; police and the CJP had put it at about 70{*theprint,pti|police said / CJP claims}.' },
      { when: 'Pellets', origin: 'v2*', facts: 'apparatus delhi_police[2], raf[0], raf[1]',
        html: 'Police called pellet reports “completely false and misleading”{*theprint_0721_pellet_denial|police said}. Their own diary records two rounds{*tribuneindia|police records}. A CRPF report, via The Wire, says seven rounds, five hits{*thewire|reported}.' },
    ] },

  { id: 'victory', n: '—', label: 'Victory', scenes: 'S6 (v3, unchanged; in-place handover from the map)', origin: 'v3',
    kicker: null, headline: 'Victory', note: '“Victory” + “Education Minister Dharmendra Pradhan resigned on 25 July*” (meta.finale), unchanged.' },

  { id: 'watched', n: '07', label: 'The country watched', scenes: 'new anime.js scene (replaces S7a–c in the reading flow): a 1,000-dot screen in the shape of a roach',
    kicker: '23 May – 21 Jul',
    headline: 'Four days, most of the views.', origin: 'new', alts: ['The country watched.'],
    dek: 'Each dot is one-thousandth of every view the movement’s YouTube videos drew. A dot lights up on the day its video was uploaded.', dekOrigin: 'new',
    captions: [
      { when: '23 May – 17 Jul', origin: 'new', facts: 'timeline_clips.json (computed live: window.before.views / total)',
        html: 'For eight weeks the videos came in a trickle. By 17 July they had drawn {{beforePct}} of all the views{*timeline_clips|computed from the YouTube clip corpus}.' },
      { when: '18 – 21 Jul', origin: 'new', facts: 'timeline_clips.json (window.viewsShare); the S7a callout',
        html: 'Then Wangchuk was removed and the march went ahead. Videos uploaded in those four days drew {{winPct}} of all the views{*timeline_clips|computed from the YouTube clip corpus}.' },
    ],
    note: 'Hover any dot: its video, channel and views; that video’s other dots pulse. The corpus is machine-collected and stops at 21 Jul (said in the footer entry). S7b and S7c leave the reading flow (Vali to decide: cut, or an appendix).' },

  { id: 'october', n: '08', label: 'October', scenes: 'new pinned block (replaces the S6.5 text epilogue)',
    kicker: 'October', headline: 'Count them one by one.', origin: 'v2',
    dek: 'In October the demand moved to the Election Commission, and so did the crackdown. Here every roach is one person.', dekOrigin: 'v2*',
    captions: [
      { when: '2 Oct · Delhi', origin: 'v2*', facts: 'october_counts.json oc_1002_delhi_150 → _1000 (v2’s “500+” was unattributed; corrected)',
        html: 'The first day in Delhi. Police counts climbed through the afternoon, to nearly 1,000 by evening{*oct_theprint_1002_1000|police said}.' },
      { when: '10 Oct · before the protest', origin: 'new', facts: 'detentions.json rathee-2026-10-10-detention, dipke-2026-10-10 (Vali 2026-11-13: expose the dawn / on-landing detentions)',
        html: 'Police took Dhruv Rathee from his family home in Gurugram before 8 am{*det_oneindia_rathee_release_1011|reported}. Minutes after their flight landed in Delhi, police detained Dipke, Das and Ranka inside the plane{*oct_aj_1010|reported}.' },
      { when: '10 Oct · Delhi', origin: 'new', facts: 'october_counts.json oc_1010_delhi_* (eight counts, eight claimants)',
        html: 'The biggest day has no single number. Each red line is one published count, and each roach one person: from about 2,000, an MHA official’s{*oct_aj_1010|reported}, to more than 15,000, the CJP’s{*oct_gulfnews_1010|CJP claims}.' },
      { when: '13 – 21 Oct', origin: 'v2*', facts: 'october_counts.json people; apparatus delhi_police[3], [4]',
        html: 'Jantar Mantar was struck off the list of permitted protest sites{*repo_amnesty_1014|reported}. Saurav Das and Ashutosh Ranka protested there anyway. They were held seven days in judicial custody{*repo_amnesty_1014,thelogicalindian|reported}.' },
      { when: '14 Oct', origin: 'v2', facts: 'october_counts.json quotes[0] (verbatim)',
        html: '<span class="q">“Authorities cannot use the criminal justice system to punish people for exercising their right to peaceful assembly.”</span> Aakar Patel, Amnesty International India{*repo_amnesty_1014|said}' },
    ] },

  { id: 'roll', n: '09', label: 'Why they marched', scenes: 'new pinned block',
    kicker: 'Why they marched in October', headline: 'Find yourself on the roll.', origin: 'v2',
    dek: 'Below are a hundred people registered to vote in 2024. One of them is you.', dekOrigin: 'v2*',
    captions: [
      { when: 'Pick one', origin: 'v2*', facts: '—',
        html: '<b>Click any name.</b> That’s you, registered to vote in 2024.' },
      { when: 'The revision', origin: 'v2*', facts: 'voter_roll.json vr_removed_130m, vr_denominator_2024, ratio',
        html: 'The revision has removed more than 130 million names from draft rolls so far{*repo_aljazeera_1008|reported}. Against the 2024 roll{*fpj_0209_9688|ECI said}, that is about 13 in every 100.' },
      { when: 'At scale', origin: 'v2*', facts: 'same, ÷ 100,000',
        html: 'Now each mark is 100,000 voters: 9,688 of them. 1,300 are struck off.' },
      { when: 'The Commission', origin: 'v2*', facts: 'voter_roll.json vr_eci_reasons, vr_commissioners_14',
        html: 'The Commission says it removes only voters who died, moved, were listed twice or can’t be traced{*reuters_0109_explainer|ECI said}. Two of its own commissioners objected at least 14 times in ten months{*repo_aljazeera_1002|reported}.' },
    ] },

  { id: 'apparatus', n: '10', label: 'The apparatus', scenes: 'new anime.js scene (replaces the S7d spokes): the cage, a radial calendar of every documented action',
    kicker: '21 May – 13 Oct', headline: 'Thirteen hands on one protest.', origin: 'v2',
    dek: 'Every documented action against the movement, on a calendar that runs clockwise from 21 May. Red bars restrict. Courts are dashed: white where they restored, red where they restricted.', dekOrigin: 'new',
    note: 'Hover a bar for its record; hover a body in the list to light its bars. The Election Commission is drawn grey, a trigger rather than a restriction (GAPS, open): Vali to decide whether the headline stays “Thirteen hands”.' },

  { id: 'close', n: '—', label: 'Close', scenes: 'S8a Ambedkar (unchanged) → the closing line, its own pinned scene (new, 140 vh) → S9 follow and share (restyled) → S10',
    kicker: 'As of 7 November 2026',
    headline: 'It began as a joke about a slur. Five months later the joke had a minister’s resignation, a court order, and thousands of detentions on its record.', origin: 'v2',
    starAfter: '{*wikipedia,repo_lawbeat,reuters|reported}',
    note: 'Its own scene (Vali 2026-11-13: not inside the footer). Display face at 64 px (--fs-d2), not 112: it is a sentence. “Thousands of detentions” rests on the lowest October count (about 2,000, an MHA official via Reuters).' },
];

// star tokens → html (render) or plain text (word count)
export const plain = s => s.replace(/\{\*[^}]*\}/g, '').replace(/<[^>]+>/g, '');
export const words = s => plain(s).split(/\s+/).filter(w => /[\p{L}\p{N}]/u.test(w)).length;
export function render(s, sources, star) {
  return s.replace(/\{\*([^|}]+)\|?([^}]*)\}/g, (_, ids, who) => star(ids.split(','), sources, who));
}

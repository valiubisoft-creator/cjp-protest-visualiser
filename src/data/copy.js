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
    dek: 'The party began on 16 May as satire about a slur. It found its grievance in an exam: four days earlier, a test 22.79 lakh students had registered for{*neet_tnm_0515|reported} was cancelled after an alleged leak{*neet_scroll_0512|NTA said}.', dekOrigin: 'new',
    legend: 'One bubble = 1,000 registered candidates (2,279 bubbles)',
    captions: [
      { when: '3 May · the exam', origin: 'new', facts: 'neet.json neet02, neet06',
        html: 'NEET-UG, India’s undergraduate medical entrance exam, was held on 3 May; 22.79 lakh students registered{*neet_tnm_0515|reported}. Rajasthan police later said a “guess paper” had circulated beforehand, and about 120 of its questions matched the chemistry section{*neet_scroll_0512|police said}.' },
      { when: '12 May · cancelled', origin: 'new', facts: 'neet.json neet05, neet09, neet10',
        html: 'On 12 May, nine days after the exam, the National Testing Agency cancelled it{*neet_scroll_0512|NTA said}. The Central Bureau of Investigation registered a case that day{*neet_careers360_0512|officials said}, and a re-test was set for 21 June{*neet_tnm_0515|NTA said}.' },
      { when: '22 May · the demand', origin: 'new', facts: 'neet.json neet16 (Dipke quote, PTI via DT Next); the slogan moved to street[0] (6 Jun)',
        html: 'On 22 May the party took up the leak and demanded the resignation of the education minister, Dharmendra Pradhan{*neet_dtnext_0522|reported}. Its founder, Abhijeet Dipke: “It was the fault of the system that over 22 lakh students’ future was impacted”{*neet_dtnext_0522|reported}.' },
    ],
    note: 'Sourced in data/story/neet.json (research/neet.md). The CJP was not founded over NEET (the CJI remark came in a non-NEET hearing); the copy keeps that order. Pradhan’s resignation note ties it back at Victory.' },

  { id: 'withheld', n: '03', label: 'Withheld', scenes: 'new scene W (prologue stage, between S3.5 and S4)',
    kicker: '21 May – 7 Jul',
    headline: 'Blocked for 48 days. Back within hours.', origin: 'new',
    alts: ['Forty-eight days under a block.', 'Silenced in India, not online.'],
    rejected: { text: 'Forty-eight days of silence.', why: 'Sources: the party posted throughout from a second handle, @Cockroachisback, opened hours after the block (Business Today, 21 May, read verbatim). The 48-day span itself holds: 21 May withholding (Day 1) → 7 Jul High Court order (Day 48).' },
    dek: 'On 21 May the government had the party’s X account withheld in India. A court took 48 days to lift the order. The party took hours to open another.', dekOrigin: 'new',
    captions: [
      { when: '21 May · Day 1', origin: 'new', facts: 'withheld.json x_withheld_2026_05_21',
        html: 'The IT ministry had the party’s X account, @CJP_2029, withheld in India under Section 69A of the IT Act{*repo_lawbeat,repo_indiacom_xblock|reported}, reportedly on Intelligence Bureau inputs citing “national security concerns”{*repo_indiacom_xblock|reported}.' },
      { when: '21 May · hours later', origin: 'new', facts: 'withheld.json cib_launch_2026_05_21 (Business Today verbatim)',
        html: 'Hours later the party was back on X as “Cockroach is Back”{*withheld_bt_newavatar|reported}. Its first post: “You thought you can get rid of us? Lol!”' },
      { when: '29 May · Day 9', origin: 'new', facts: 'withheld.json dipke_petition_2026_05_25, hc_29_may_no_interim_relief',
        html: 'Dipke took the block to the Delhi High Court{*barandbench|reported}. On 29 May the court declined to restore the account and asked the IT ministry’s review committee to decide before 7 July{*withheld_patriot_pti|reported}.' },
      { when: '7 Jul · Day 48', origin: 'v2*', facts: 'withheld.json hc_order_2026_07_07 (court via PTI, verified snippet), cib_status_2026_07_07; apparatus.json meity[1]',
        html: 'The court revoked the order: “Since NEET is already over, the primary concern is no longer of any relevance.”{*withheld_patriot_pti|court order} The Solicitor General had told it: “Now the examination is over.”{*repo_medianama|reported} By then the second account had over 2,80,000 followers{*withheld_patriot_pti|reported}.' },
    ] },

  { id: 'street', n: '—', label: 'The street', scenes: 'S4 (date) → S5 map, cut to four beats',
    kicker: '6 Jun – 19 Jul',
    headline: 'Off the feed, onto the road.', origin: 'new', alts: ['They came back, and stayed.'],
    dek: 'Six weeks at Jantar Mantar, New Delhi. The roaches grow with the crowd: the more people reports counted, the more roaches.', dekOrigin: 'new',
    captions: [
      { when: '6 Jun · Day 0', origin: 'new', facts: 'timeline start: “Hundreds” (aljazeera, theweek), slogan (theweek); folds in the street dek (no title card)',
        html: 'On 6 June the party took to the street at Jantar Mantar, New Delhi. Reports counted “Hundreds”{*aljazeera,theweek|reported}; the bigger the reported crowd, the more roaches. The slogan: “We asked for Make in India, you gave us Leak in India”{*theweek|reported}.' },
      { when: '20 Jun · Day 14', origin: 'new', facts: 'timeline protest_2a (Wikipedia: “permission ran only until 5 P.M.”; metal plates)',
        html: 'On 20 June the party came back. When police said its permission had run out at 5 pm{*wikipedia,dynamitenews|police said}, Dipke refused to leave. Protesters banged metal plates, and an indefinite sit-in began{*wikipedia,cnn|reported}.' },
      { when: '28 Jun · Day 22 · Fast day 1', origin: 'new', facts: 'timeline protest_2b (Outlook), wangchuk; “activist” per scroll_0714',
        html: 'For nearly three weeks the protest was, in Outlook’s words, a fringe story{*outlookindia|reported}. Then the activist Sonam Wangchuk began an indefinite fast there{*wire_0630,scroll_0718|reported}. In May he had said: “But I consider myself an honorary cockroach.”{*theprint_0523|said}' },
      { when: '18 Jul · Day 42 · Fast day 21', origin: 'new', facts: 'timeline detention (police: medical advice and HC directions)',
        html: 'Two days before the march on Parliament, police removed Wangchuk to Safdarjung Hospital{*wikipedia|reported}, on medical advice and under High Court directions, they said{*wikipedia,scroll_0718|police said}. The CJP: “he has been forcefully kidnapped by the Police and taken away.”{*newslaundry_0718,scroll_0718|CJP claims}' },
    ] },

  { id: 'july', n: '04', label: '20 July', scenes: 'S5 map, 20 Jul hours cut to three + 23 Jul',
    kicker: '20 – 24 Jul',
    headline: 'No signal, no order.', origin: 'v2',
    dek: 'On 20 July, the monsoon session’s first day, the CJP tried to march on Parliament. Around Jantar Mantar, mobile internet went dark and metro stations shut. No order was published that day. On 23 July there was one.', dekOrigin: 'new',
    captions: [
      { when: '20 Jul · 09:23', origin: 'new', facts: 'sansad_chalo 0720_0900 (Outlook: never formally started; DMRC closures before 9.15 am; Tribune 9:23); apparatus delhi_metro[0]',
        html: 'The procession was due to start at 9 am; it never formally started{*outlook_0720|reported}. By 9.15 the metro had closed five stations{*theprint,theweek_0720|officials said}. At 9.23 The Tribune reported: “Mobile internet services are unavailable at Jantar Mantar.”{*tribuneindia|reported}' },
      { when: '20 Jul · 15:08', origin: 'new', facts: 'sansad_chalo 0720_1430 (3.08 pm: lathi charge, tear gas, bottles); apparatus telecom_operators[0]',
        html: 'At 3.08 pm police lathi-charged and fired tear gas near Patel Chowk metro station, and protesters threw bottles{*theprint_0720_live,theprint_0720_top10|reported}. The Internet Freedom Foundation said: “No copy of any suspension order has been published by the Ministry of Home Affairs.”{*repo_iff_central_delhi|IFF}' },
      { when: '20 Jul · evening', origin: 'new', facts: 'sansad_chalo 0720_1730 (Newslaundry: RML stopped admitting, Lady Hardinge; The Week: until the evening)',
        html: 'By evening RML hospital’s emergency was overwhelmed: it stopped admitting patients, and many injured were diverted to Lady Hardinge Hospital{*newslaundry|reported}. The internet shutdown “remained in effect until the evening of July 20”{*repo_theweek_0722|reported}.' },
      { when: '23 Jul', origin: 'v2*', facts: 'apparatus home_ministry[1]; metrics m44',
        html: 'On 23 July there was an order: the Home Ministry suspended mobile internet within 1.5 km of Jantar Mantar, 9.30 am to 4 pm{*repo_isoc_0723|reported}. By 24 July the metro was closing 18 stations{*wikipedia|officials said}.' },
    ] },

  { id: 'ledgers', n: '05', label: '20 July, again', scenes: 'S5 map stage, after the hours (map dimmed under three scales)',
    kicker: '20 July, again',
    headline: 'One march, three ledgers.', origin: 'v2',
    dek: 'The police, the hospitals and the movement each kept a count of the same afternoon. They rarely count the same thing, and where one says zero, another has paperwork.', dekOrigin: 'v2',
    legend: 'Solid red: what the state said · hatched: what a record shows · open: what the movement said',
    captions: [
      { when: 'Injured', origin: 'v2*', facts: 'metrics m29, m32, m33 (dots also m30, m31)',
        html: 'Police said more than 118 police personnel were hurt{*theprint,pti|police said}. By 7 pm RML hospital had logged 65 medico-legal cases, protesters and police together{*wikipedia|reported}. The CJP says about 150 protesters were hospitalised{*wikipedia|CJP claims}.' },
      { when: 'Detained', origin: 'v2*', facts: 'metrics m34, m35; sansad_chalo 0720_1730 (8.25 pm “more than 100”; 11.54 pm police statement ~70) and open_questions (the day’s sequence)',
        html: 'That evening, police sources said “more than 100” protesters were detained{*deccanchronicle_0720_detained|police said}. Late that night a police statement put it at about 70, as did the CJP{*theprint,pti|police said / CJP claims}. Later, police said no protesters were detained{*wikipedia|police said}.' },
      { when: 'Pellets', origin: 'v2*', facts: 'apparatus delhi_police[2], raf[0], raf[1]',
        html: 'The next day police called reports of pellet guns “completely false and misleading”{*theprint_0721_pellet_denial|police said}. Their own General Diary records two rounds of plastic pellets{*tribuneindia|police said}. A CRPF report, via The Wire, says seven rounds were fired and five hit protesters{*thewire|reported}.' },
    ] },

  { id: 'victory', n: '—', label: 'Victory', scenes: 'S6 (v3, unchanged; in-place handover from the map)', origin: 'v3',
    kicker: null, headline: 'Victory', note: '“Victory” + “Education Minister Dharmendra Pradhan resigned on 25 July*” (meta.finale), unchanged.' },

  { id: 'watched', n: '06', label: 'The country watched', scenes: 'new anime.js scene (replaces S7a–c in the reading flow): a 1,000-dot screen in the shape of a roach',
    kicker: '23 May – 21 Jul',
    headline: 'Four days, most of the views.', origin: 'new', alts: ['The country watched.'],
    dek: 'Each of these 1,000 dots is 0.1% of all the views drawn by YouTube videos about the movement, up to 21 July. A dot lights up on the day its video was uploaded.', dekOrigin: 'new',
    captions: [
      { when: '23 May – 17 Jul', origin: 'new', facts: 'timeline_clips.json (computed live: window.before.views / total)',
        html: 'Through the X block, the sit-in and Wangchuk’s fast, the videos came in a trickle. Those uploaded by 17 July drew {{beforePct}} of all the views{*timeline_clips|computed from the YouTube clip corpus}.' },
      { when: '18 – 21 Jul', origin: 'new', facts: 'timeline_clips.json (window.viewsShare); the S7a callout',
        html: 'Then police removed Wangchuk, and two days later came the march on Parliament. Videos uploaded in those four days drew {{winPct}} of all the views{*timeline_clips|computed from the YouTube clip corpus}.' },
    ],
    note: 'Hover any dot: its video, channel and views; that video’s other dots pulse. The corpus is machine-collected and stops at 21 Jul (said in the footer entry). S7b and S7c leave the reading flow (Vali to decide: cut, or an appendix).' },

  { id: 'october', n: '07', label: 'October', scenes: 'new pinned block (replaces the S6.5 text epilogue)',
    kicker: 'October', headline: 'Count them one by one.', origin: 'v2',
    dek: 'In October the party marched again, now against the Election Commission. Amnesty says police detained thousands{*repo_amnesty_1014|Amnesty said}, and the published counts disagree. Here every roach is one person.', dekOrigin: 'v2*',
    captions: [
      { when: '2 Oct · Delhi', origin: 'v2*', facts: 'october_counts.json oc_1002_delhi_150, _700, _1000 (the pen’s three counts; v2’s “500+” was unattributed; corrected)',
        html: 'On 2 October the party protested at Jantar Mantar. Police counts of those detained rose through the day: about 150{*oct_theprint_1002_500|police said}, then more than 700{*oct_theprint_1002_1000,oct_theweek_1002|police said}, then nearly 1,000{*oct_theprint_1002_1000|police said}.' },
      { when: '10 Oct · before the protest', origin: 'new', facts: 'detentions.json rathee-2026-10-10-detention (time disputed, 6–8 am: “early”), dipke-2026-10-10, das/ranka roles (co-convenors) (Vali 2026-11-13: expose the dawn / on-landing detentions)',
        html: 'Early that morning, police took the YouTuber Dhruv Rathee from his family home in Gurugram{*det_oneindia_rathee_release_1011|reported}. Minutes after their flight from Mumbai landed in Delhi, police detained Dipke and the co-convenors Saurav Das and Ashutosh Ranka inside the plane{*oct_aj_1010|reported}.' },
      { when: '10 Oct · Delhi', origin: 'new', facts: 'october_counts.json oc_1010_delhi_2000_mha, _7000_pti, _cjp_15000 (the three tones of the fill; all eight lines are labelled on screen)',
        html: 'The biggest day has no single number. Each red line is one published count, each roach one person. An MHA official put it at about 2,000{*oct_aj_1010|reported}; PTI reported police detained nearly 7,000{*oct_fpj_1011|reported}; the CJP claims more than 15,000{*oct_gulfnews_1010|CJP claims}.' },
      { when: '13 – 21 Oct', origin: 'v2*', facts: 'apparatus delhi_police[3], [4]; october_counts.json people (7 days in judicial custody); epilogue_october 21 Oct (thelogicalindian: undertaking while de-notified)',
        html: 'Police struck Jantar Mantar off the list of protest sites{*repo_amnesty_1014|reported}. On 13 October Das and Ranka tried to protest there. After seven days in judicial custody they were freed, promising not to call protests there while it stays de-listed{*thelogicalindian|reported}.' },
      { when: '14 Oct', origin: 'v2', facts: 'october_counts.json quotes[0] (verbatim; role “Chair of Board, Amnesty International India”)',
        html: '<span class="q">“Authorities cannot use the criminal justice system to punish people for exercising their right to peaceful assembly.”</span> Aakar Patel, chair of the board, Amnesty International India{*repo_amnesty_1014|said}' },
    ] },

  { id: 'roll', n: '08', label: 'Why they marched', scenes: 'new pinned block',
    kicker: 'Why they marched in October', headline: 'Find yourself on the roll.', origin: 'v2',
    dek: 'The October marches were over the Election Commission’s revision of the voter rolls. Below are a hundred people registered to vote in 2024. One of them is you.', dekOrigin: 'v2*',
    captions: [
      { when: 'Pick one', origin: 'v2*', facts: '— (the entries are numbered, not named: h-roll.js)',
        html: '<b>Click any entry.</b> That’s you, registered to vote in 2024.' },
      { when: 'The revision', origin: 'v2*', facts: 'voter_roll.json vr_removed_130m, vr_denominator_2024, ratio',
        html: 'The revision has removed more than 130 million names from draft rolls so far{*repo_aljazeera_1008|reported}. Against the 2024 roll{*fpj_0209_9688|ECI said}, that is about 13 in every 100.' },
      { when: 'At scale', origin: 'v2*', facts: 'same, ÷ 100,000 (96,88,21,926 → 9,688 marks; 130 million → 1,300)',
        html: 'Now each mark is 100,000 voters, and the 2024 roll is 9,688 marks{*fpj_0209_9688|ECI said}. The revision has struck off 1,300 of them{*repo_aljazeera_1008|reported}.' },
      { when: 'The Commission', origin: 'v2*', facts: 'voter_roll.json vr_eci_reasons, vr_commissioners_14',
        html: 'The Commission says it removes only voters who have died, moved, are listed twice or can’t be traced{*reuters_0109_explainer|ECI said}. Two of its own commissioners formally objected to revision decisions at least 14 times in ten months{*repo_aljazeera_1002|reported}.' },
    ] },

  { id: 'apparatus', n: '09', label: 'The apparatus', scenes: 'new anime.js scene (replaces the S7d spokes): the cage, a radial calendar of every documented action',
    kicker: '21 May – 13 Oct', headline: 'Thirteen hands on one protest.', origin: 'v2',
    dek: 'Every documented action by the state, on a calendar that runs clockwise from 21 May. Red bars restrict. Court bars are dashed: white where judges restored, red where they restricted. Grey marks the Election Commission.', dekOrigin: 'new',
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

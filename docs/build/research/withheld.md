# "Forty-eight days of silence": fact-check (collected 2026-11-13)

Companion data: `data/story/withheld.json`. Snippets marked verified:false came from the fetch tool's paraphrase, not verbatim page text.

## Verdict
**Misleading.** One account was withheld, but the CJP was not silent: it posted from "Cockroach is Back" (@Cockroachisback) from 21 May onward. The span itself is correct: 21 May (Day 1) to 7 Jul (court order) is 48 days inclusive. Whether the original handle was actually visible again on 7 Jul is disputed (Q2).

## 1. Original handle, 21 May to 7 Jul
- Exact handle: **@CJP_2029** (LawBeat, quoting the order: "restore the X handle @CJP_2029"; BOOM embed dated 17 May; a Dipke post quoted via a search summary). PTI/The Patriot says "CJP_for_India". Court-order text wins; treat PTI as an error.
- Withheld under Sec. 69A by email dated 21 May ("Email dated 21.05.2026", LawBeat). Reported IB inputs: India.com, citing Indian Express. Notice: "Account Withheld in IN in response to a legal demand" (South First).
- No partial restoration found. On 29 May the HC refused interim restoration and sent it to the MeitY Review Committee, to decide before 7 Jul (PTI). Dipke appeared before it 24 Jun (Telangana Today); outcome not found.
- Weekday conflict: India.com says "Thursday" and also "Wednesday". 21 May 2026 is a Thursday; the order email date settles it.

## 2. When it was visible again
- PTI/The Patriot: "Shortly after the court order, the CJP's original handle, CJP_for_India, could be accessed on X." (7 Jul)
- Reuters via Khaleej Times: as of Tuesday evening (7 Jul) it "remained withheld in India" (paraphrase, verified:false).
- Quint, Republic, The Logical Indian, ThePrint, FPJ, MediaNama, LawBeat: order reported, compliance not confirmed.
- **Open.** Supportable: the order was 7 Jul; actual visibility is 7 Jul (PTI) or later (Reuters). No later date found.

## 3. @Cockroachisback
- Launched 21 May: "hours after" (Business Today), "less than two hours" (India.com). **"Within minutes" is unsupported.** First post: "You thought you can get rid of us? Lol!". Caption "cockroaches don't die".
- 49,100 followers within hours, as of 7:10 pm 21 May (FPJ, paraphrase).
- 23 May: Dipke posted "Back up account also taken down" (Business Today identifies the backup as the Cockroach is Back handle). This is a claim, nothing else confirms it. By 7 Jul PTI gives 2,80,000+ followers and Quint 2,82,000, so it was posting by July. Wikipedia: the alternative account "remained operational".
- Undated snapshot, unverified: about 448.4K followers (page returned HTTP 402).

## 4. Instagram
- **21 May:** users reported "temporarily inaccessible on multiple occasions overnight", with no Meta confirmation (National Herald). No duration. On 23 May Dipke claimed the page and his personal Instagram were "hacked" (Business Today).
- **22 Jul:** Business Today: "Account not available in India. This is because we complied with a legal request to restrict this content." FPJ: restored the same day, Dipke: "It has been restored now." IFF said no order was published. This is what meta.json's note means.
- **15 Aug:** Outlook's "blocked for two hours" is this event, not May. The CJP said it recovered access. Outlook calls it the second block and mentions a prior one on 22 Jul. **v2's "two hours" is mis-dated if attached to May.**

## 5. 7 Jul hearing
- Justice Swarana Kanta Sharma; petitioner's counsel Akhil Sibal; Abhijeet Dipke v. Union of India.
- Mehta (FPJ): "It was blocked at a time when NEET examination was to take place." / "Now the examination is over," / "I have no difficulty. I just want everyone to be more circumspect."
- Mehta (PTI): "Several posts would have created chaos among the students and their parents. Of course, now the examination is over." and "I would only request everyone to be a little more circumspect considering the students." The "no difficulty" wording differs by outlet, so cite one outlet per quote.
- Court (PTI): "Since NEET is already over, the primary concern is no longer of any relevance. In these circumstances, the order is revoked. The petition is allowed."
- Order (LawBeat): "since the NEET Examinations are already over, the aforesaid primary concern of respondent no. 1 does not survive"; "the impugned blocking order as referred in Email dated 21.05.2026" "is directed to be revoked."
- Existing apparatus.json attributes "no difficulty with the unblocking of the account" and "Now the examination is over" to Mehta; MediaNama and FPJ support the second.

## Proposed headlines (<= 6 words)
1. "One account silenced, one kept shouting"
2. "Forty-eight days under a block"
3. "Silenced in India, not online"

Counting must say "X account withheld" not "CJP silent". Day count supported: 48 days, from the 21 May withholding (Day 1) to the 7 Jul HC order (Day 48).

## Conflicts left open
1. Actual date the original handle became visible (PTI vs Reuters).
2. Handle: @CJP_2029 (order) vs "CJP_for_India" (PTI).
3. Was @Cockroachisback ever down (Dipke's 23 May claim vs 280K followers in July)?
4. Ledger "within minutes" vs sources' "hours".
5. Outcome of the 24 Jun MeitY Review Committee hearing.
6. Mehta's exact words differ across outlets; full order text not obtained.

## Fetch failures / limits
- 403: ANI, Business Standard (7 Jul and 23 May), The Statesman.
- 402: x.com/Cockroachisback, IFF post (text seen only in a search snippet).
- Partial: LiveLaw (paywalled/truncated), The Wire (both articles, headline only), Bar and Bench (25 May and 7 Jul, "Loading content"), India.com (possibly truncated).
- Wikipedia: only the first 100,000 characters read.
- WebFetch returns model summaries; only the raw-HTML curl checks on LawBeat, The Patriot and BOOM are verbatim.

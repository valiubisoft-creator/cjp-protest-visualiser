#!/usr/bin/env python3
"""F1 generator: writes data/story/*.json.

Editorial content is transcribed by hand from Claude.pdf (the research dossier,
22 image-only pages). `page` on every fact/row is the PDF page it was read from.
Media is derived from repo files only:
  - images: media/cjp-public-images/sources.json (+ IMAGE_SOURCES.md for the faces column)
  - videos: data/timeline_clips.json, seeded random picks per node window (D13)

Run from the repo root:  python3 docs/build/f1/build_story.py
Re-running gives byte-identical output (seeded RNG, sorted inputs).
"""
import datetime
import json
import math
import random
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / "data" / "story"
OUT.mkdir(parents=True, exist_ok=True)

SOURCING = json.loads((ROOT / "docs/build/f1/sourcing.json").read_text())  # web sourcing, 2026-11-12
PEOPLE_IMG = {x["name"]: x for x in json.loads((ROOT / "media/people/sources.json").read_text())}
# Vali 2026-11-12: paywalled items stay out. Only public sources count as fact-gathering points.
PAYWALLED_URLS = {
    "https://indianexpress.com/article/cities/delhi/hit-on-head-multiple-times-now-in-icu-more-than-100-cjp-protesters-at-rml-emergency-10795772/",
    "https://www.livelaw.in/top-stories/if-hc-makes-you-senior-we-will-set-it-aside-supreme-court-pulls-up-lawyer-for-repeated-pleas-over-delhi-hc-senior-designations-534311",
}
STATUSES = {"documented", "alleged", "claimed", "disputed", "unverified"}


def F(text, claimant, attribution, status, src, page, value=None, unit=None, value_text=None, note=None, resolution=None, hold=None):
    assert status in STATUSES, status
    f = {"text": text}
    if value is not None:
        f["value"] = value
    if value_text is not None:
        f["value_text"] = value_text
    if unit is not None:
        f["unit"] = unit
    f.update({"claimant": claimant, "attribution": attribution, "status": status,
              "source_ids": src if isinstance(src, list) else [src], "page": page})
    if note:
        f["note"] = note
    if resolution:
        f["resolution"] = resolution
    if hold:
        f["hold"] = hold
    return f


# ───────────────────────── sources ─────────────────────────
# PDF outlet chips have no URLs. URL only where it already exists in the repo.
def S(id, title, publisher, url=None, date=None, note=""):
    return {"id": id, "title": title, "publisher": publisher, "url": url, "date": date, "note": note}

CHIP = "Cited as an outlet chip in the dossier; the dossier gives no URL or article title."
NAMED = "Named in the dossier text (not as a chip); no URL or article title given."
sources = [
    S("dossier", "The Cockroach Janta Party (CJP) Protests at Jantar Mantar, New Delhi (May–November 2026): A Sourced Timeline and Dataset for a D3.js Visualisation",
      "Research dossier (Claude.pdf, supplied by Vali)", None, None,
      "Primary input for this ledger. Used as the source only where a dossier row cites no outlet."),
    S("wikipedia", "Wikipedia (article not specified)", "Wikipedia", None, None,
      CHIP + " Probably one of wiki_cjp or wiki_protests; the chip doesn't say which."),
    S("wiki_cjp", "Cockroach Janta Party", "Wikipedia", "https://en.wikipedia.org/wiki/Cockroach_Janta_Party", None,
      "From the v2 index.html sources list. The v2 list notes the page flags parts as unverified."),
    S("wiki_protests", "2026 Delhi Jantar Mantar protests", "Wikipedia", "https://en.wikipedia.org/wiki/2026_Delhi_Jantar_Mantar_protests", None,
      "From the v2 index.html sources list."),
    S("christiandaily", "Christian Daily (article not specified)", "Christian Daily", None, None,
      CHIP + " The dossier warns this outlet misdates the resignation to 2025."),
    S("aljazeera", "Al Jazeera (article not specified)", "Al Jazeera", None, None, CHIP),
    S("india", "india (article not specified)", "India.com (assumed from chip 'india')", None, None,
      CHIP + " Chip reads 'india'; the outlet is not certain."),
    S("theweek", "The Week (article not specified)", "The Week", None, None, CHIP),
    S("barandbench", "Bar and Bench (article not specified)", "Bar and Bench", None, None, CHIP),
    S("dainikjagranmpcg", "dainikjagranmpcg (article not specified)", "Dainik Jagran MP/CG", None, None, CHIP),
    S("wionews", "WION (article not specified)", "WION", None, None, CHIP),
    S("yahoo", "Yahoo (article not specified)", "Yahoo", None, None, CHIP + " The dossier pairs it with The Independent on ~23 Jun."),
    S("outlookindia", "Outlook (article not specified)", "Outlook India", None, None, CHIP),
    S("businesstoday", "BusinessToday (article not specified)", "BusinessToday", None, None, CHIP + " Dossier dates: 12 May and 21 May."),
    S("indiatvnews", "indiatvnews (article not specified)", "India TV News", None, None, CHIP),
    S("thestatesman", "The Statesman (article not specified)", "The Statesman", None, None, CHIP),
    S("cnn", "CNN (article not specified)", "CNN", None, None, CHIP + " The repo has a CNN 22 Jul URL (repo_cnn_0722); it is not confirmed to be the same article."),
    S("dynamitenews", "Dynamite News (article not specified)", "Dynamite News", None, None, CHIP),
    S("thefederal", "The Federal (article not specified)", "The Federal", None, None, CHIP),
    S("theprint", "ThePrint (article not specified)", "ThePrint", None, None, CHIP),
    S("pbs", "PBS (article not specified)", "PBS", None, None, CHIP),
    S("wagingnonviolence", "Waging Nonviolence (article not specified)", "Waging Nonviolence", None, None, CHIP),
    S("tribuneindia", "The Tribune (article not specified)", "The Tribune", None, None, CHIP),
    S("siasat", "Siasat (article not specified)", "Siasat", None, None, CHIP),
    S("thedailyjagran", "thedailyjagran (article not specified)", "The Daily Jagran", None, None, CHIP),
    S("business_standard", "Business Standard (article not specified)", "Business Standard", None, None, CHIP),
    S("thelogicalindian", "The Logical Indian (article not specified)", "The Logical Indian", None, None, CHIP),
    S("telanganatoday", "Telangana Today (article not specified)", "Telangana Today", None, None, CHIP),
    S("lawtrend", "LawTrend (article not specified)", "LawTrend", None, None, CHIP),
    S("righttoinformation", "righttoinformation.wiki (page not specified)", "righttoinformation.wiki", None, None, CHIP),
    S("thewire", "The Wire (article not specified)", "The Wire", None, None, CHIP),
    S("asiaone", "AsiaOne (article not specified)", "AsiaOne", None, None, CHIP),
    S("newslaundry", "Newslaundry (article not specified)", "Newslaundry", None, None, CHIP),
    S("altnews", "Alt News (article not specified)", "Alt News", None, None, CHIP),
    S("fairobserver", "Fair Observer (article not specified)", "Fair Observer", None, None, CHIP),
    S("countercurrents", "Countercurrents (op-ed, Nov)", "Countercurrents", None, None, CHIP + " The dossier labels it an op-ed with a clear editorial position."),
    S("organiser", "Organiser (article not specified)", "Organiser (RSS-affiliated)", None, None, CHIP + " The dossier labels it RSS-affiliated."),
    S("thequint", "The Quint (article not specified)", "The Quint", None, None, CHIP),
    S("imnindia", "imnindia (article not specified)", "IMN India", None, None, CHIP),
    S("ratopati", "Ratopati (article not specified)", "Ratopati", None, None, CHIP),
    # outlets named only in the text / consolidated table
    S("deccanherald", "Deccan Herald (article not specified)", "Deccan Herald", None, None, NAMED),
    S("etvbharat", "ETV Bharat (article not specified)", "ETV Bharat", None, None, NAMED),
    S("indianexpress", "Indian Express (article not specified)", "Indian Express", None, None, NAMED + " Several figures reach the dossier via Wikipedia or Newslaundry."),
    S("bbc", "BBC (article not specified)", "BBC", None, None, NAMED + " Figures reach the dossier via Wikipedia."),
    S("economictimes", "Economic Times (article not specified)", "Economic Times", None, None, NAMED + " Via Wikipedia."),
    S("nbcnews", "NBC News (article not specified)", "NBC News", None, None, NAMED + " Dossier date: 25 Jul."),
    S("guardian", "The Guardian (article not specified)", "The Guardian", None, None, NAMED),
    S("ap", "Associated Press (article not specified)", "AP", None, None, NAMED),
    S("reuters", "Reuters (article not specified)", "Reuters", None, None, NAMED),
    S("ani", "ANI (article not specified)", "ANI", None, None, NAMED + " Via Al Jazeera."),
    S("pti", "PTI (article not specified)", "PTI", None, None, NAMED),
    S("zeenews", "Zee News (article not specified)", "Zee News", None, None, NAMED + " The dossier notes Zee figures were taken from a TV programme."),
    S("hansindia", "Hans India (article not specified)", "Hans India", None, None, NAMED),
    S("indiatv", "India TV (article not specified)", "India TV", None, None, NAMED),
    S("livelaw", "LiveLaw (article not specified)", "LiveLaw", None, None, NAMED),
    S("thehindu", "The Hindu (article not specified)", "The Hindu", None, None, NAMED),
    S("dainikbhaskar", "Dainik Bhaskar (video report)", "Dainik Bhaskar", None, None, NAMED),
    S("ips", "IPS (article not specified)", "IPS (not expanded in the dossier)", None, None, NAMED),
    S("independent", "The Independent (article not specified)", "The Independent", None, None, NAMED),
    S("ndtv", "NDTV (interview)", "NDTV", None, None, NAMED),
    S("boom", "BOOM (fact-check)", "BOOM", None, None, NAMED),
    S("uni", "UNI (article not specified)", "UNI", None, None, NAMED),
    S("theprint_0523", "Sonam Wangchuk calls himself 'honorary cockroach', urges govt to hear voices of youth", "ThePrint (PTI)",
      "https://theprint.in/india/sonam-wangchuk-calls-himself-honorary-cockroach-urges-govt-to-hear-voices-of-youth/2939511/", "2026-05-23", "Wangchuk research 2026-11-12."),
    S("fpj_0606", "I don't like protests, but we need justice: Sonam Wangchuk joins CJP rally at Jantar Mantar", "Free Press Journal",
      "https://www.freepressjournal.in/india/i-dont-like-protests-but-we-need-justice-sonam-wangchuk-joins-cjp-rally-at-jantar-mantar", "2026-06-06", "Wangchuk research 2026-11-12."),
    S("kashmirlife_0606", "Students, activists rally at Jantar Mantar as Sonam Wangchuk joins protest", "Kashmir Life",
      "https://kashmirlife.net/students-activists-rally-at-jantar-mantar-as-sonam-wangchuk-joins-protest-439078/", "2026-06-06", "Wangchuk research 2026-11-12."),
    S("wire_0630", "In photos: Sonam Wangchuk, Left students on hunger strike at CJP's Jantar Mantar protest", "The Wire",
      "https://m.thewire.in/article/rights/in-photos-sonam-wangchuk-left-students-hunger-strike-cjp-jantar-mantar", "2026-06-30", "Title from URL slug. Wangchuk research 2026-11-12."),
    S("aljazeera_0714", "Indian activist Wangchuk urged to end hunger strike over exam paper leaks", "Al Jazeera",
      "https://www.aljazeera.com/news/2026/7/14/indian-activist-wangchuk-urged-to-end-hunger-strike-over-exam-paper-leaks", "2026-07-14", "Wangchuk research 2026-11-12."),
    S("scroll_0714", "More than 1,800 members of civil society urge Sonam Wangchuk to end hunger strike", "Scroll",
      "https://scroll.in/latest/1094273/scroll_in", "2026-07-14", "Title paraphrased from the lede; URL slug is generic. Wangchuk research 2026-11-12."),
    S("dtnext_0716", "Sonam Wangchuk loses over 9 kg after 19 days of hunger strike, doctors warn it could affect organs", "DT Next",
      "https://www.dtnext.in/news/national/sonam-wangchuk-loses-over-9-kg-after-19-days-of-hunger-strike-doctors-warn-it-could-affect-organs", "2026-07-16", "Wangchuk research 2026-11-12."),
    S("scroll_0718", "Delhi Police says Sonam Wangchuk shifted to hospital under HC order; CJP alleges he was detained", "Scroll",
      "https://scroll.in/latest/1094360/delhi-police-says-sonam-wangchuk-shifted-to-hospital-under-hc-order-cjp-alleges-he-was-detained", "2026-07-18", "Wangchuk research 2026-11-12."),
    S("newslaundry_0718", "Sonam Wangchuk taken to hospital as Delhi Police tighten grip on Jantar Mantar protest", "Newslaundry",
      "https://newslaundry.com/2026/07/18/sonam-wangchuk-taken-to-hospital-as-delhi-police-tighten-grip-on-jantar-mantar-protest", "2026-07-18", "Free article. Wangchuk research 2026-11-12."),
    S("theprint_0721", "Sonam Wangchuk shifted from Safdarjung Hospital to Medanta after Delhi HC order", "ThePrint (ANI)",
      "https://theprint.in/india/sonam-wangchuk-shifted-from-safdarjung-hospital-to-medanta-after-delhi-hc-order/2992562/", "2026-07-21", "Wangchuk research 2026-11-12."),
    S("fpj_0722", "Sonam Wangchuk seeks written govt assurance before ending 25-day hunger strike", "Free Press Journal",
      "https://www.freepressjournal.in/india/sonam-wangchuk-seeks-written-govt-assurance-before-ending-25-day-hunger-strike", "2026-07-22", "Wangchuk research 2026-11-12."),
    S("scroll_0724", "Activist Sonam Wangchuk breaks fast after 26 days in presence of Union ministers", "Scroll",
      "https://scroll.in/latest/1094491/activist-sonam-wangchuk-breaks-fast-after-26-days-in-presence-of-union-ministers", "2026-07-24", "Wangchuk research 2026-11-12."),
    S("outlook_0724", "Why did Sonam Wangchuk end his hunger strike? What the Centre promised and what comes next", "Outlook",
      "https://www.outlookindia.com/national/why-did-sonam-wangchuk-end-his-hunger-strike-what-the-centre-promised-and-what-comes-next", "2026-07-24", "Wangchuk research 2026-11-12."),
    S("dtnext_0724", "Wangchuk ends 26-day fast following govt assurance; CJP to continue protest", "DT Next (PTI)",
      "https://www.dtnext.in/news/national/wangchuk-ends-26-day-fast-following-govt-assurance-cjp-to-continue-protest", "2026-07-24", "Wangchuk research 2026-11-12."),
    S("aljazeera_0719", "Indian court rejects bid to release hunger-striking activist from hospital", "Al Jazeera",
      "https://www.aljazeera.com/news/2026/7/19/indian-court-rejects-bid-to-release-hunger-striking-activist-from-hospital", "2026-07-19",
      "Supplied by Vali 2026-11-12; text read from the page."),
    S("tnm_0516", "CJI Surya Kant sparks row by calling activists, media 'cockroaches'", "The News Minute (citing LiveLaw)",
      "https://www.thenewsminute.com/news/cji-surya-kant-sparks-row-by-calling-activists-media-cockroaches", "2026-05-16", "Prints the full quote; matches the ledger text word for word."),
    S("livelaw_0516", "Section Of Media Misquoted Me, Criticised Only Those Who Join Professions With Fake Degrees: CJI Surya Kant Clarifies Remarks On Youth", "LiveLaw",
      "https://www.livelaw.in/top-stories/section-of-media-misquoted-me-criticised-only-those-who-join-professions-with-fake-degrees-cji-surya-kant-clarifies-remarks-on-youth-534448",
      "2026-05-16", "Verbatim statement read from the page HTML."),
    S("fpj_cockroachisback", "Cockroach Janata Party launches new X handle 'Cockroach is Back' after original account withheld in India", "Free Press Journal",
      "https://www.freepressjournal.in/india/cockroach-janata-party-launches-new-x-handle-cockroach-is-back-after-original-account-withheld-in-india", "2026-05-22", "Evidence for the @Cockroachisback handle."),
    S("telanganatoday_0725", "Jantar Mantar falls silent after 36-day NEET protest ends with Pradhan's resignation", "Telangana Today",
      "https://telanganatoday.com/jantar-mantar-falls-silent-after-36-day-neet-protest-ends-with-pradhans-resignation", "2026-07-25", "Found by the 2026-11-12 web check."),
    # URLs that already exist in the repo
    S("repo_cnn_0722", "India’s CJP protests: why Gen-Z’s political fury is boiling over", "CNN",
      "https://www.cnn.com/2026/07/22/india/india-cockroach-party-protest-anger-intl-hnk", "2026-07-22", "From the v2 index.html sources list."),
    S("repo_amnesty_1014", "India: Release CJP leaders arrested at Jantar Mantar", "Amnesty International",
      "https://www.amnesty.org/en/latest/news/2026/10/india-release-cjp-leaders-arrested-after-attempting-peaceful-protests-at-jantar-mantar/", "2026-10-14", "From the v2 index.html sources list."),
    S("repo_aljazeera_1002", "Authorities clamp down as ‘cockroach’ movement launches new protests", "Al Jazeera",
      "https://www.aljazeera.com/news/2026/10/2/indian-authorities-clamp-down-as-cockroach-movement-launches-new-protests", "2026-10-02", "From the v2 index.html sources list."),
    S("repo_aljazeera_1008", "‘Cockroach’ movement says members detained as protests continue", "Al Jazeera",
      "https://www.aljazeera.com/news/2026/10/8/indias-cockroach-movement-says-members-detained-as-protests-continue", "2026-10-08", "From the v2 index.html sources list."),
    S("repo_aljazeera_1019", "Indian court extends detention of cockroach leaders", "Al Jazeera",
      "https://www.aljazeera.com/news/2026/10/19/indian-court-extends-detention-of-cockroach-leaders", "2026-10-19",
      "From media/cjp-public-images/IMAGE_SOURCES.md. Title taken from the URL slug."),
    S("repo_medianama", "Delhi HC orders unblocking of CJP X account", "MediaNama",
      "https://www.medianama.com/2026/07/223-delhi-hc-cockroach-janta-party-x-account-unblocked/", None, "From the v2 index.html sources list."),
    S("repo_lawbeat", "Delhi High Court orders restoration of CJP’s X account", "LawBeat",
      "https://lawbeat.in/news-updates/delhi-high-court-orders-restoration-of-cockroach-janta-partys-x-account-1610149", None, "From the v2 index.html sources list."),
    S("repo_indiacom_xblock", "X account blocked over IB security concerns", "India.com",
      "https://www.india.com/news/india/cockroach-janta-party-x-account-blocked-india-over-alleged-security-concerns-by-intelligence-bureau-abhijeet-dipke-receives-death-threats-8423047/", None,
      "From the v2 index.html sources list. Same event as the 21 May X block, but the dossier doesn't cite it."),
    S("repo_outlook_instagram", "Instagram account blocked for two hours", "Outlook",
      "https://www.outlookindia.com/national/cockroach-janta-partys-instagram-account-blocked-in-india-for-two-hours", None, "From the v2 index.html sources list."),
    S("repo_iff_central_delhi", "IFF condemns internet shutdown in central Delhi", "Internet Freedom Foundation",
      "https://internetfreedom.in/iff-condemns-the-internet-shutdown-in-parts-of-central-delhi-no-suspension-order-has-been-made-public/", None, "From the v2 index.html sources list."),
    S("repo_iff_cp", "Shutdown before the first protester arrived", "Internet Freedom Foundation",
      "https://internetfreedom.in/shutdown-before-the-first-protester-arrived-iff-condemns-the-internet-suspension-in-connaught-place/", None, "From the v2 index.html sources list (dated 'Oct' there)."),
    S("repo_isoc_0723", "Internet suspended in New Delhi, 23 July", "Internet Society Pulse",
      "https://pulse.internetsociety.org/en/shutdowns/internet-suspended-in-new-dehli-nct-india-23-july-2026/", "2026-07-23", "From the v2 index.html sources list."),
    S("repo_theweek_0722", "Blanket blackout, no order", "The Week",
      "https://www.theweek.in/news/india/2026/07/22/blanket-blackout-no-order-sudden-internet-shutdown-amid-cjp-s-chalo-sansad-protest-raises-questions.html", "2026-07-22", "From the v2 index.html sources list."),
    S("timeline_clips", "YouTube clip corpus (machine-tagged, unreviewed)", "data/timeline_clips.json", None, "2026-07-21",
      "Generated 2026-07-21T18:54:05Z. Place geo is a gazetteer keyword match. Used for video picks and approximate site coordinates."),
    S("within_earshot", "Within Earshot prototype, geography notes", "docs/archive/within-earshot.md, section 4", None, None,
      "OSM Nominatim origin for the observatory and the Jantar Mantar Road local frame."),
]
SRC_IDS = {s["id"] for s in sources}

# ───────────────────────── sites ─────────────────────────
OBS = (28.62718, 77.21662)
R = 6378137.0
def local_to_ll(east, north):
    lat = OBS[0] + math.degrees(north / R)
    lon = OBS[1] + math.degrees(east / (R * math.cos(math.radians(OBS[0]))))
    return round(lat, 5), round(lon, 5)

jmr = local_to_ll(-75, -210)
RECALL = ("Builder's estimate from general knowledge of central New Delhi. Not taken from a dataset and not verified. "
          "Verify against OSM before use.")
CLIPS_GAZ = "data/timeline_clips.json places[] (gazetteer keyword match, flagged approximate by its own meta note)"

def site(id, name, type, lat, lon, status, origin, source_ids, note=None, flashpoint_note=None):
    s = {"id": id, "name": name, "type": type, "lat": lat, "lon": lon,
         "coord_status": status, "coord_origin": origin, "source_ids": source_ids}
    if flashpoint_note:
        s["role_in_story"] = flashpoint_note
    if note:
        s["note"] = note
    return s

OSM = "OpenStreetMap {}, Overpass/Nominatim lookup 2026-11-11 (© OpenStreetMap contributors, ODbL)."
sites = [
    site("jantar_mantar_road", "Jantar Mantar Road", "protest_site", 28.62553, 77.21579, "verified",
         OSM.format("way 1493039594 'Jantar Mantar Protest Site' (amenity=events_venue), centre point")
         + " Cross-check: the derived point from docs/archive/within-earshot.md (centre of the demonstration band) is about 27 m away. Road = OSM way 24583495.",
         ["within_earshot", "business_standard"],
         note="The protest street, not the observatory. The dossier: 'Jantar Mantar Road is about 1 km from Parliament House.'",
         flashpoint_note="Main protest and sit-in site, 6 Jun – 25 Jul."),
    site("jantar_mantar_observatory", "Jantar Mantar (observatory)", "landmark", OBS[0], OBS[1], "verified",
         "OSM Nominatim point for way 223456559, per docs/archive/within-earshot.md section 4 (0 m from Nominatim, 23 m from Wikipedia's coordinate).",
         ["within_earshot"], note="Map anchor only. Not the protest location."),
    site("parliament", "Parliament House (new)", "landmark", 28.61712, 77.21022, "verified",
         OSM.format("relation 12737019 'New Parliament House'") + " The Old Parliament House is relation 6087635 (28.61719, 77.20819).",
         ["business_standard"], flashpoint_note="Destination of the 20 Jul 'Sansad Chalo' march.",
         note="The dossier doesn't say which building the march targeted; the Monsoon Session sits in the new building (assumption, check)."),
    site("parliament_street", "Parliament Street (Sansad Marg)", "flashpoint", 28.62554, 77.21424, "approx",
         OSM.format("way 24583327 'Sansad Marg', centre of the segment between Jantar Mantar Road and Patel Chowk") + " A street, not a point; the exact flashpoint position isn't recorded.",
         ["imnindia", "wikipedia"],
         flashpoint_note="20 Jul: lathi charges and tear gas. PS Parliament Street registered FIR 128/26 on 13 Oct."),
    site("patel_chowk", "Patel Chowk", "flashpoint", 28.62340, 77.21280, "verified",
         OSM.format("roundabout ways 24583324/447141147/447141148/572511730/572511731/590609994/1493678697, mean of centres"),
         ["imnindia", "wikipedia"], flashpoint_note="20 Jul: lathi charges and tear gas."),
    site("rail_bhawan", "Rail Bhawan", "flashpoint", 28.61586, 77.21139, "verified",
         OSM.format("node 10264397115 'Rail Bhavan' (government=ministry)"), ["imnindia", "wikipedia"],
         flashpoint_note="20 Jul: lathi charges and tear gas."),
    site("mandi_house", "Mandi House", "flashpoint", 28.62569, 77.23195, "verified",
         OSM.format("way 700293873 'Mandi House Gol Chakkar Park' (the roundabout); metro stop area relation 8076975 is at 28.62561, 77.23399"),
         ["imnindia", "wikipedia"],
         flashpoint_note="20 Jul: start of the flashpoint sequence 'Mandi House → Parliament Street'. 16 Oct: Neha Bora detained here."),
    site("shastri_bhawan", "Shastri Bhawan", "flashpoint", 28.61608, 77.21543, "verified",
         OSM.format("relation 5262900 'Shastri Bhawan'") + " (The clip-corpus gazetteer point, 28.6142, 77.2196, was about 450 m off.)",
         ["imnindia", "wikipedia"], flashpoint_note="20 Jul flashpoint (dossier spells it 'Shastri Bhavan')."),
    site("palika_bazar", "Palika Bazar", "flashpoint", 28.63071, 77.21884, "verified",
         OSM.format("way 1393736849 'Palika Bazar' (landuse=retail)"), ["imnindia", "wikipedia"],
         flashpoint_note="20 Jul: pellet injuries."),
    site("gurdwara_bangla_sahib", "Gurdwara Bangla Sahib", "refuge", 28.62631, 77.20909, "verified",
         OSM.format("way 111695183 'Gurudwara Bangla Sahib Sikh Temple'"), ["imnindia", "wikipedia"],
         flashpoint_note="20 Jul: refuge."),
    site("rml_hospital", "RML Hospital", "hospital", 28.62606, 77.20075, "verified",
         OSM.format("way 34404757 'Dr. Ram Manohar Lohia Hospital'"), ["imnindia", "wikipedia"],
         flashpoint_note="20 Jul: injured taken here."),
    site("safdarjung_hospital", "Safdarjung Hospital", "hospital", 28.56734, 77.20497, "verified",
         OSM.format("way 454523330 'Safdarjung Hospital'") + " About 6.5 km south of Jantar Mantar Road: outside the main map frame.",
         ["wikipedia"], flashpoint_note="18 Jul: police removed Wangchuk here."),
    site("constitution_club", "Constitution Club", "flashpoint", 28.61959, 77.21328, "verified",
         OSM.format("node 14289213396 'Constitution Club of India'"), ["imnindia", "wikipedia"],
         flashpoint_note="20 Jul flashpoint."),
    site("metro_udyog_bhawan", "Udyog Bhawan metro station", "metro_closed", 28.60951, 77.21180, "approx",
         OSM.format("node 7018886727 (railway=station)") + " OSM now names this station 'Seva Teerth'; position matches Udyog Bhawan station but the name match is unconfirmed.",
         ["wikipedia"], flashpoint_note="Closed before 20 Jul."),
    site("metro_central_secretariat", "Central Secretariat metro station", "metro_closed", 28.61629, 77.21228, "verified",
         OSM.format("relation 8076972 'Central Secretariat (Yellow Line)' stop area"), ["wikipedia"], flashpoint_note="Closed before 20 Jul."),
    site("metro_patel_chowk", "Patel Chowk metro station", "metro_closed", 28.62280, 77.21397, "verified",
         OSM.format("relation 9561642 'Patel Chowk' stop area"), ["wikipedia"], flashpoint_note="Closed before 20 Jul."),
    site("metro_janpath", "Janpath metro station", "metro_closed", 28.62531, 77.21840, "verified",
         OSM.format("relation 8032896 'Janpath' stop area"), ["wikipedia"], flashpoint_note="Closed before 20 Jul."),
    site("metro_rajiv_chowk", "Rajiv Chowk metro station", "metro_closed", 28.63281, 77.21959, "verified",
         OSM.format("relation 8032902 'Rajiv Chowk (Blue Line)' stop area"), ["wikipedia"], flashpoint_note="Closed before 20 Jul."),
]
sites_doc = {
    "note": ("Every coordinate states its origin. 'verified' = an OpenStreetMap feature with a named id (lookup 2026-11-11). "
             "'approx' = a street rather than a point, or an unconfirmed name match; do not present as precise. OSM data © OpenStreetMap contributors, ODbL: credit it in the footer. The dossier names only five of the "
             "closed metro stations (5 → 16 → 17 → 18 in July); the other 13 are unnamed."),
    "base_map": None,
    "base_map_status": "missing: no GeoJSON/SVG base map exists in the repo. See GAPS.md.",
    "sites": sites,
}

# ───────────────────────── people ─────────────────────────
def P(name, role, src, page, note=None):
    img = PEOPLE_IMG.get(name)
    image = None
    if img:
        image = {"src": img["local_file"], "credit": img["credit_line"], "license": img["license"], "license_url": img.get("license_url"),
                 "commons_page": img["commons_page"],
                 "license_ok": ("caution: site-default licence; photographer unknown" if "wikigama" in (img.get("commons_page") or "") else True)}  # GODL-India approved 2026-11-12
    p = {"name": name, "role": role, "image": image, "source_ids": src, "page": page}
    if note:
        p["note"] = note
    return p

DIPKE = P("Abhijeet Dipke", "Founder of the CJP; a Boston University-trained communications strategist", ["dossier", "wikipedia"], 1,
           note="Role wording is from p1 (no chip); biography carries a Wikipedia chip on p2.")
WANGCHUK = P("Sonam Wangchuk", "Engineer-turned-activist", ["aljazeera_0714"], 0,
             note="Role wording from Al Jazeera (14 Jul): 'an engineer-turned-activist who inspired a character in the blockbuster Bollywood film, 3 Idiots'. "
                  "He joined the CJP protest on 6 Jun and fasted 28 Jun – 24 Jul in support of it. page 0 = not from the dossier.")
PRADHAN = P("Dharmendra Pradhan", "Education Minister (resigned 25 July)", ["wikipedia"], 1)
DAS = P("Saurav Das", "CJP co-convenor; one of the first three spokespeople", ["wikipedia"], 3)
RANKA = P("Ashutosh Ranka", "CJP co-convenor; one of the first three spokespeople", ["wikipedia"], 3)
BORA = P("Neha Bora", "AISA student; joined Wangchuk's fast on 28 Jun", ["wikipedia"], 5)
NADDA = P("J.P. Nadda", "Government negotiator", ["wikipedia"], 14)
JSINGH = P("Jitendra Singh", "Union minister; government negotiator", ["wikipedia"], 14)

# ───────────────────────── media: images ─────────────────────────
img_manifest = json.loads((ROOT / "media/cjp-public-images/sources.json").read_text())
img_by_file = {x["local_file"]: x for x in img_manifest}
faces = {}
for line in (ROOT / "media/cjp-public-images/IMAGE_SOURCES.md").read_text().splitlines():
    m = re.match(r"^\| `([^`]+)` \|(.*)$", line)
    if m:
        cols = [c.strip() for c in m.group(2).split("|")]
        if len(cols) >= 3:
            faces[m.group(1)] = cols[2]

def IMG(local_file, note=None):
    x = img_by_file[local_file]
    lic = x["license"]
    credit = f"Photo: {x['artist']} / Wikimedia Commons / {lic}" if lic.startswith("CC BY") else f"{x['artist']} / Wikimedia Commons / {lic}"
    m = {"type": "image", "src": f"media/cjp-public-images/{local_file}",
         "caption": x["desc"], "credit": credit, "license": lic, "license_url": x.get("license_url"),
         "commons_page": x["page"], "date": x["date"], "identifiable_faces": faces.get(local_file),
         "source_ids": []}
    if note:
        m["note"] = note
    return m

# ───────────────────────── media: videos (D13) ─────────────────────────
clips = sorted(json.loads((ROOT / "data/timeline_clips.json").read_text())["clips"], key=lambda c: c["id"])
def ist_date(s):
    t = datetime.datetime.fromisoformat(s.replace("Z", "+00:00")) + datetime.timedelta(hours=5, minutes=30)
    return t.date().isoformat()

def pick_videos(node_id, start, end):
    pool = [c for c in clips if start <= ist_date(c["date"]) <= end and not c["graphic"]]
    rng = random.Random(f"F1:{node_id}")
    k = min(len(pool), rng.randint(2, 4))
    chosen = sorted(rng.sample(pool, k), key=lambda c: c["date"])
    return [{"type": "youtube", "youtube_id": c["id"], "caption": c["title"],
             "credit": f"YouTube: {c['channel']}", "upload_date": ist_date(c["date"]),
             "channel": c["channel"], "source_type": c["source"], "cw": c["cw"],
             "source_ids": ["timeline_clips"], "review": "pending"} for c in chosen], len(pool)

# ───────────────────────── timeline (Phase 1) ─────────────────────────
nodes = []
pool_sizes = {}
KINETIC_NODES = {"victory"}  # Vali 2026-11-12: no video; the node is told with kinetic typography

def node(id, order, label, date, window, title, summary, site_ids, crowd_tier, crowd_basis, facts,
         people, images, sub_beats=None, hunger_strike_day=None, route=None):
    vids, n = ([], 0) if id in KINETIC_NODES else pick_videos(id, *window)
    pool_sizes[id] = n
    nd = {"id": id, "order": order, "label": label, "date": date,
          "date_window": {"start": window[0], "end": window[1]},
          "title": title, "summary": summary, "site_ids": site_ids,
          "crowd_tier": crowd_tier, "crowd_basis": crowd_basis,
          "hunger_strike_day": hunger_strike_day, "route": route,
          "media_mode": "kinetic_type" if id in KINETIC_NODES else "rail",
          "facts": facts, "people": people, "media": images + vids,
          "sub_beats": sub_beats or []}
    nodes.append(nd)

def SB(id, date, title, facts, crowd_tier=None, crowd_basis=None, site_ids=None, hunger_strike_day=None, images=None):
    return {"id": id, "date": date, "title": title, "site_ids": site_ids or [],
            "crowd_tier": crowd_tier, "crowd_basis": crowd_basis,
            "hunger_strike_day": hunger_strike_day, "facts": facts, "media": images or []}

# Node 1: Start
node("start", 1, "Start", "2026-06-06", ("2026-05-16", "2026-06-19"), "How it began",
     {"text": "It moved to the streets with a permitted one-day Jantar Mantar protest on 6 June (hundreds attended), then held an indefinite sit-in from 20 June.",
      "source_ids": ["dossier"], "page": 1},
     ["jantar_mantar_road"], 2,
     "6 Jun: 'Hundreds' (Al Jazeera, Statesman/UNI) vs 'a few dozen students' (Outlook, retrospective). Tier uses the majority report; the dispute is shown as two facts.",
     [
        F("CJI remark; CJP founded", "media", "reported", "documented", ["wikipedia", "dainikjagranmpcg"], 4, value_text="15–16 May"),
        F("Abhijeet Dipke (born 29 Sept 1995, Aurangabad; Boston University MSc in public relations; AAP social-media volunteer 2020–23) launched the CJP …",
          "Wikipedia", "reported", "documented", "wikipedia", 2, value_text="16 May",
          resolution="Vali 2026-11-12: primary source wins. 'from the US' cut: Wikipedia, the cited source, doesn't say it. The launch was online on 16 May."),
        F("3 million Instagram followers within 78 hours", "BusinessToday", "reported", "claimed", "businesstoday", 2, value=3000000, unit="Instagram followers",
          note="Dossier: no platform-verified data; label as organiser/media-reported."),
        F("over 20 million by 22 May", "Economic Times (via Wikipedia)", "reported", "claimed", ["economictimes", "wikipedia"], 2, value=20000000, unit="Instagram followers",
          value_text="20 million+"),
        F("MeitY ordered the X account withheld in India under Section 69A of the IT Act, citing IB inputs on “national security” (21 May).",
          "MeitY", "officials said", "documented", ["dossier", "repo_indiacom_xblock"], 3,
          note="No chip on this item in the dossier. repo_indiacom_xblock covers the same event but the dossier doesn't cite it."),
        F("“Hundreds”", "Al Jazeera, The Week", "reported", "disputed", ["aljazeera", "theweek"], 4, value_text="Hundreds", unit="crowd, 6 Jun",
          resolution="Vali 2026-11-12: primary source wins. The Week (verified) says 'drawing hundreds of participants'. Statesman/UNI dropped: unfetchable, and search summaries suggest the Statesman said 'thousands'."),
        F("“a few dozen students”", "Outlook (retrospective)", "reported", "disputed", "outlookindia", 4, value_text="a few dozen students", unit="crowd, 6 Jun"),
        F("One-time exemption, 10am–5pm (New Delhi District Police letter)", "New Delhi District Police", "police said", "documented", "thestatesman", 4, value_text="10:00–17:00"),
        F("about 5,000 personnel in New Delhi district (per Wikipedia summary of reports)", "media (Wikipedia summary)", "reported", "claimed", "wikipedia", 4, value=5000, unit="police personnel",
          note="Dossier caveat: no official Delhi Police deployment figure for 6 Jun beyond secondary summaries."),
        F("slogan “We asked for Make in India, you gave us Leak in India”", "The Week", "reported", "documented", "theweek", 4,
          resolution="Vali 2026-11-12: primary source wins. The Week (verified) carries the chant. 'Wangchuk attends; 7-day ultimatum' dropped: The Week doesn't say it, and Statesman coverage (search only) mentions Wangchuk present with a 5 PM ultimatum."),
        F("Sonam Wangchuk on Saturday joined a protest at Jantar Mantar in New Delhi organised by the Cockroach Janata Party", "Kashmir Life", "reported", "documented", ["kashmirlife_0606", "fpj_0606"], 0,
          resolution="Wangchuk research 2026-11-12 (public Indian outlets; Vali: primary source wins). Restores Wangchuk's 6 Jun attendance, now sourced to free articles."),
        F("I don't like protests, but we have to do it for justice", "Sonam Wangchuk (via Free Press Journal)", "said", "documented", ["fpj_0606"], 0),
        F("AIYF/AISF allege RSS-linked harassment", "AIYF/AISF", "alleged", "alleged", ["thestatesman", "wikipedia"], 4),
        F("The CJP’s 6 June event was described as the first major Jantar Mantar demonstration since the wrestlers.", "media", "reported", "documented", "wikipedia", 16,
          note="Chip reads 'Wikipedia + 3'; the other three outlets are not named."),
     ],
     [DIPKE], [IMG("cjp_flag_variant-a.png", note="CJP flag on Commons, dated 16 May. Symbol, not a protest photo.")],
     sub_beats=[
        SB("start_pushback", "2026-05-21", "State pushback and disinformation", [
            F("The CJP reappeared within minutes as “Cockroach is Back” (@Cockroachisback).", "media", "reported", "documented", "wikipedia", 3),
            F("Dipke approached the Delhi High Court against the block (Bar and Bench, 25 May).", "Bar and Bench", "reported", "documented", "barandbench", 3, value_text="25 May",
              resolution="Vali 2026-11-12: primary source wins. Dossier said 26 May; the Bar and Bench article is dated 25 May. First hearing reported as 29 May (search only)."),
            F("A Supreme Court plea seeking a CBI probe into the CJP, and an Allahabad HC (Lucknow) PIL by a Karnataka BJP worker seeking NIA/ED probes and Dipke’s extradition, were both dismissed.",
              "media", "reported", "documented", "wikipedia", 3),
            F("Union minister Sukanta Majumdar claimed 49% of followers were Pakistani. Dipke’s screen recording showed over 94% were Indian.", "Sukanta Majumdar; Abhijeet Dipke", "claimed", "disputed", "wikipedia", 3),
            F("Kiren Rijiju alluded to followers from “Pakistan & George Soros gang”.", "Kiren Rijiju", "said", "documented", "wikipedia", 3),
            F("TraceX Labs (reported by The Hindu) flagged a fake “Cockroach Janta Party” Android app with spyware or RAT-like behaviour.", "TraceX Labs (via The Hindu)", "reported", "documented", ["wikipedia", "thehindu"], 3),
          ], site_ids=[]),
        SB("start_pune", "2026-06-11", "Nationwide campaign launched at SPPU Pune",
           [F("Nationwide campaign launched at SPPU Pune; “exam manifesto” with ₹10,000 compensation demand", "dossier", "reported", "documented", "dossier", 4,
              value=10000, unit="INR compensation demand", note="Dossier row cites no outlet.")], site_ids=[]),
        SB("start_hyderabad", "2026-06-14", "Hyderabad protest",
           [F("Hyderabad protest (AP photo)", "Al Jazeera", "reported", "documented", "aljazeera", 4)], site_ids=[],
           images=[IMG("bengaluru_dinkan-poster-photo_2026-06-14.jpg",
                       note="Bengaluru, not Hyderabad. Under an active Commons deletion request (Aug 2026): check before use.")]),
     ])

# Node 2: Protest
node("protest", 2, "Protest", "2026-06-20", ("2026-06-20", "2026-06-27"), "The sit-in",
     {"text": "Second protest from 1pm; Dipke refuses to leave after 5pm; thalis banged; indefinite sit-in begins",
      "source_ids": ["wikipedia", "cnn"], "page": 4},
     ["jantar_mantar_road"], 2, "20 Jun: 'Hundreds', mostly students. ~23 Jun: 'Hundreds' camping (Yahoo/Independent).",
     [], [DIPKE, PRADHAN], [],
     sub_beats=[
        SB("protest_2a", "2026-06-20", "The sit-in begins", [
            F("Second protest from 1pm; Dipke refuses to leave after 5pm; thalis banged; indefinite sit-in begins", "media", "reported", "documented", ["wikipedia", "cnn"], 4),
            F("“Hundreds”, mostly students", "Wikipedia/Deccan Herald", "reported", "claimed", ["wikipedia", "deccanherald"], 4, value_text="Hundreds", unit="crowd", note="Sources from the p18 table row."),
            F("Police declare the protest past permitted hours", "Delhi Police", "police said", "documented", ["wikipedia", "dynamitenews"], 4),
          ], crowd_tier=2, crowd_basis="'Hundreds', mostly students", site_ids=["jantar_mantar_road"]),
        SB("protest_2b", "2026-06-23", "Growth", [
            F("Pradhan, to NDTV, calls the CJP a “B Team Of Disruptive Elements”; Dipke responds on day 4 of the sit-in", "Dharmendra Pradhan (NDTV interview)", "said", "disputed", ["ndtv", "thewire", "dainikjagranmpcg"], 5,
              note="Dossier dates this '~23 Jun' (approximate).",
              hold="Vali 2026-11-12: kept on the backbench. NDTV interview not viewable; don't feature on screen until checked.",
              resolution="Vali 2026-11-12: primary source wins. NDTV's own headline (23 Jun) reads 'B Team Of Disruptive Elements'. The Wire, Dainik Jagran and The Federal report it as 'B-team of terrorists'. NDTV body not fetched (blocked): click-check the wording before ship."),
            F("“Hundreds” camping (Yahoo/Independent)", "Yahoo/Independent", "reported", "claimed", ["yahoo", "independent"], 5, value_text="Hundreds", unit="camping"),
            F("Outlook’s ground report describes the movement as a fringe story for nearly three weeks until Wangchuk’s fast.", "Outlook", "reported", "documented", "outlookindia", 2),
          ], crowd_tier=2, crowd_basis="'Hundreds' camping", site_ids=["jantar_mantar_road"]),
        SB("protest_2c", "2026-06-20", "Key moments: the state responds", [
            F("CJP alleges water, lights, food and washroom access cut, later restored", "CJP", "CJP claims", "alleged", ["wikipedia", "dynamitenews"], 4,
              note="Tactics table: 'CJP allegation; reported live by Dynamite News; access later restored' (p13).",
              resolution="Kept as a CJP allegation: Wikipedia states it as a police tactic, but its primary reports (Independent 23 Jun, Al Jazeera 21 Jun) weren't fetched."),
            F("police tried to disperse, then withdrew", "media", "reported", "documented", ["wikipedia", "dynamitenews"], 5),
            F("Volunteer Mohammad Junaid later alleged he was picked up, held for about 6 hours and dropped in Dehradun", "Mohammad Junaid", "alleged", "alleged", ["wikipedia", "dynamitenews"], 5,
              value=6, unit="hours held (alleged)"),
          ], site_ids=["jantar_mantar_road"]),
        SB("protest_retest", "2026-06-21", "NEET re-test held", [
            F("The re-test was held on 21 June at 5,440 centres, with about 20 lakh appearing (secondary source).", "secondary source", "reported", "claimed", ["businesstoday", "righttoinformation"], 11,
              value=5440, unit="centres"),
          ], site_ids=[]),
     ])

# Node 3: Sonam Wangchuk
node("wangchuk", 3, "Sonam Wangchuk", "2026-06-28", ("2026-06-28", "2026-07-17"), "The fast",
     {"text": "Wangchuk begins indefinite fast with 6 AISA students (incl. Neha Bora) and independent student Hamad",
      "source_ids": ["wikipedia"], "page": 5},
     ["jantar_mantar_road"], 2, "28 Jun: 'Hundreds' (The Federal).",
     [
        F("Wangchuk begins an indefinite fast with six students from the All India Students' Association (AISA), including Neha Bora", "media", "reported", "documented", ["wire_0630", "scroll_0718"], 5,
          resolution="Wangchuk research 2026-11-12 (public Indian outlets; Vali: primary source wins). 'six students from the All India Students' Association' is The Wire's wording; Scroll (18 Jul) names Neha Bora. 'Independent student Hamad' dropped: not confirmed in any public article."),
        F("“Hundreds” (The Federal)", "The Federal", "reported", "claimed", "thefederal", 5, value_text="Hundreds", unit="crowd"),
        F("CJP alleges water and sanitation cut again", "CJP", "CJP claims", "alleged", "thefederal", 5),
        F("But I consider myself an honorary cockroach", "Sonam Wangchuk (via ThePrint/PTI)", "said", "documented", ["theprint_0523"], 14, value_text="23 May",
          resolution="Wangchuk research 2026-11-12 (public Indian outlets; Vali: primary source wins). Said on 23 May, before the street protest; verbatim from ThePrint (PTI)."),
        F("… after three weeks on hunger strike in solidarity with the Cockroach Janta Party (CJP) protest movement.", "Al Jazeera", "reported", "documented", ["aljazeera_0719"], 0,
          note="Verbatim from Al Jazeera, 19 Jul (source supplied by Vali). Same article: 'The movement’s main demand is the resignation of Education Minister Dharmendra Pradhan.'"),
     ],
     [WANGCHUK, BORA], [], hunger_strike_day=1,
     sub_beats=[
        SB("wangchuk_day1", "2026-06-28", "Day 1", [], crowd_tier=2, crowd_basis="'Hundreds' (The Federal)", site_ids=["jantar_mantar_road"], hunger_strike_day=1),
        SB("wangchuk_march_called", "2026-07-09", "The march is called", [
            F("CJP announces 20 July Parliament march (PTI/The Hindu)", "CJP", "reported", "documented", ["wikipedia", "pti", "thehindu"], 5),
          ], site_ids=["jantar_mantar_road", "parliament"], hunger_strike_day=12),
        SB("wangchuk_day17", "2026-07-14", "Day 17", [
            F("More than 1,800 members of civil society on Tuesday urged activist Sonam Wangchuk to withdraw his hunger strike in Delhi.", "Scroll", "reported", "documented", ["scroll_0714"], 18,
              value=1800, unit="signatories", value_text="1,800+", resolution="Wangchuk research 2026-11-12 (public Indian outlets; Vali: primary source wins). Dossier dated this ~17 Jul; Scroll dates the letter Tuesday 14 Jul."),
          ], site_ids=["jantar_mantar_road"], hunger_strike_day=17),
        SB("wangchuk_day19", "2026-07-16", "Day 19", [
            F("Wangchuk has lost more than nine kg after 19 days of hunger strike", "doctors (via DT Next)", "reported", "claimed", ["dtnext_0716"], 18, value=9, unit="kg", value_text="9+ kg",
              resolution="Wangchuk research 2026-11-12 (public Indian outlets; Vali: primary source wins). The exact 9.1 kg figure is BBC copy found only on a mirror site, so the free DT Next wording ('over 9 kg', day 19, 16 Jul) is used."),
            F("The next stage can be alarming. Organs can be impacted.", "a doctor (via DT Next)", "said", "documented", ["dtnext_0716"], 0),
          ], site_ids=["jantar_mantar_road"], hunger_strike_day=19),
        SB("wangchuk_day20", "2026-07-17", "Day 20", [
            F("Government tells HC it will intervene if his health worsens", "Government", "officials said", "documented", "dossier", 5, note="Dossier row cites no outlet."),
            F("Delhi HC petition", "dossier", "reported", "documented", "dossier", 5, note="Dossier row cites no outlet."),
          ], site_ids=["jantar_mantar_road"], hunger_strike_day=20),
     ])

# Node 4: Detention (D3: 18 Jul)
node("detention", 4, "Detention", "2026-07-18", ("2026-07-18", "2026-07-19"), "Removed to hospital",
     {"text": "Police remove Wangchuk to Safdarjung Hospital (police: on medical advice and per HC directions; CJP: “kidnapping”); Dipke starts a fast and alleges he was beaten and detained; SFI leaders join the fast",
      "source_ids": ["wikipedia"], "page": 5},
     ["jantar_mantar_road", "safdarjung_hospital"], 3,
     "18 Jul: no crowd figure (carry previous tier). 19 Jul: 'Thousands' (Tribune live blog).",
     [
        F("Police remove Wangchuk to Safdarjung Hospital", "media", "reported", "documented", "wikipedia", 5),
        F("police: on medical advice and per HC directions", "Delhi Police", "police said", "disputed", ["wikipedia", "scroll_0718"], 5,
          note="Scroll quotes the police as citing 'essential medical care' under a High Court order."),
        F("he has been forcefully kidnapped by the Police and taken away.", "CJP (via Newslaundry)", "CJP claims", "disputed", ["newslaundry_0718", "scroll_0718"], 5,
          resolution="Wangchuk research 2026-11-12 (public Indian outlets; Vali: primary source wins). Verbatim CJP wording from Newslaundry; Scroll reports the CJP alleging he was 'detained'. Police didn't use 'detained'; they cited 'essential medical care' under an HC order."),
        F("Dipke starts a fast and alleges he was beaten and detained", "Abhijeet Dipke", "alleged", "alleged", "wikipedia", 5),
        F("SFI leaders join the fast", "media", "reported", "documented", "wikipedia", 6),
        F("It is not medical care. It is illegal detention.", "Gitanjali Angmo, Wangchuk's wife (via Al Jazeera)", "said", "disputed", ["aljazeera_0719"], 0,
          value_text="19 Jul", note="Said on X on 19 Jul. Same article: police 'seized' Wangchuk at Jantar Mantar on 18 Jul and took him to Safdarjung Hospital."),
        F("It cannot be said that any force is being used against Mr Sonam Wangchuk or that his bodily autonomy is being violated in any manner whatsoever.", "Justice Mini Pushkarna, Delhi High Court (via Al Jazeera)", "said", "disputed", ["aljazeera_0719"], 0,
          value_text="19 Jul", note="The court declined to order his discharge; doctors had given only oral fluids and supplements with his consent."),
     ],
     [WANGCHUK, DIPKE], [], hunger_strike_day=21, route=None,
     sub_beats=[
        SB("detention_0718", "2026-07-18", "Wangchuk removed", [
            F("Leadership change in Delhi Police reported; barricades removed", "media", "reported", "documented", "dossier", 5, note="Dossier row cites no outlet for this cell."),
          ], crowd_tier=None, crowd_basis="No count reported; carry the previous tier.", site_ids=["jantar_mantar_road", "safdarjung_hospital"], hunger_strike_day=21),
        SB("detention_0719", "2026-07-19", "Crowds swell ahead of the march", [
            F("Crowds swell ahead of the march", "media", "reported", "documented", "dossier", 6, note="Events cell cites no outlet."),
            F("“Thousands” (Tribune live blog)", "The Tribune (live blog)", "reported", "claimed", "tribuneindia", 6, value_text="Thousands", unit="crowd"),
            F("300+ personnel at the site with conveyor-belt bag scanners, frisking, plain-clothes officers and riot vehicles with tear-gas mounts (ThePrint)",
              "Delhi Police (official)", "police said", "claimed", "theprint", 6, value=300, unit="police personnel", value_text="300+"),
            F("DCP Sachin Sharma: no permission sought or granted, Section 163 BNSS in force", "DCP Sachin Sharma", "police said", "documented", "theprint", 6),
          ], crowd_tier=3, crowd_basis="'Thousands' (Tribune live blog)", site_ids=["jantar_mantar_road"], hunger_strike_day=22),
     ])

# Node 5: Protest and arrest (D3: 20 Jul)
flash = ["mandi_house", "parliament_street", "patel_chowk", "rail_bhawan", "constitution_club", "shastri_bhawan",
         "palika_bazar", "gurdwara_bangla_sahib", "rml_hospital"]
metros = ["metro_udyog_bhawan", "metro_central_secretariat", "metro_patel_chowk", "metro_janpath", "metro_rajiv_chowk"]
node("protest_arrest", 5, "Protest and arrest", "2026-07-20", ("2026-07-20", "2026-07-24"), "Sansad Chalo",
     {"text": "“Sansad Chalo” march on Monsoon Session Day 1; Dipke ends his fast; 3 AISA fasters end theirs; Das and Ranka meet J.P. Nadda",
      "source_ids": ["wikipedia"], "page": 6},
     ["jantar_mantar_road", "parliament"] + flash + metros, 4,
     "'More than 10,000' (Al Jazeera/AP/Reuters) vs 'tens of thousands' (Guardian, Deccan Herald, CJP). Tier uses the lower, documented floor.",
     [
        F("“More than 10,000”", "DCP Sachin Sharma (via Al Jazeera)", "police said", "disputed", ["aljazeera"], 6, value=10000, unit="marchers", value_text=">10,000",
          resolution="Vali 2026-11-12: primary source wins. Al Jazeera attributes the figure to DCP Sachin Sharma (a police estimate). AP and Reuters dropped: AP reports 'thousands'; Reuters wasn't reachable."),
        F("“tens of thousands”", "Guardian, Deccan Herald, CJP", "reported", "disputed", ["wikipedia", "guardian", "deccanherald"], 6, value_text="tens of thousands", unit="marchers"),
        F("Lathi charges, tear gas at Parliament Street, Patel Chowk and Rail Bhawan", "media and police statements", "reported", "documented", ["wikipedia", "theprint", "asiaone"], 6,
          note="Tactics table: 'Documented by AP, Reuters, Al Jazeera and police statements' (p13)."),
        F("RAF personnel fired seven pellet gun rounds on July 20, five hit protesters", "CRPF report (via The Wire)", "reported", "disputed", ["thewire"], 6,
          value=7, unit="pellet rounds", note="Under HPEC review (p13). Wording from The Wire's headline (search result only, not fetched).",
          resolution="Vali 2026-11-12: primary source wins. Dossier cited Indian Express via Wikipedia; no Indian Express page was found. The 7/5 figure is The Wire, citing a CRPF report. Delhi Police records say two rounds (separate fact)."),
        F("nail-fitted batons (Alt News/BOOM verified)", "Alt News, BOOM", "reported", "disputed", ["wikipedia", "altnews", "boom"], 6,
          note="Tactics table: 'Police denied; Alt News and BOOM found the videos authentic' (p13)."),
        F("A Delhi Police statement said more than 118 personnel were injured, including officers up to special commissioner rank and several women officers; the count later rose to 130+.",
          "Delhi Police", "police said", "disputed", ["theprint", "wikipedia", "india", "pti"], 1, value=118, unit="police injured", value_text="118+ (later 130+)"),
        F("About 60 protesters were injured by police count.", "Delhi Police", "police said", "disputed", ["theprint", "pti"], 1, value=60, unit="protesters injured", value_text="~60"),
        F("around 100 injured people at RML Hospital’s emergency by 5.30 pm, including 10 police personnel, with 4 protesters in the ICU",
          "Newslaundry, citing Indian Express hospital sources", "reported", "disputed", ["newslaundry"], 1, value=100, unit="injured at RML", value_text="~100",
          note="Dossier: includes 10 police, so it should not be read as '100+ protesters'."),
        F("The CJP claims about 150 were hospitalised.", "CJP", "CJP claims", "disputed", "wikipedia", 1, value=150, unit="protesters hospitalised", value_text="~150"),
        F("about 70 detained; police later denied detaining anyone", "Delhi Police (PTI) / CJP", "reported; police later denied", "disputed", ["theprint", "pti", "telanganatoday", "wikipedia"], 19, value=70, unit="detained", value_text="~70",
          note="The dossier contradicts itself on who gave the ~70 (p2: CJP; p21: police; p19 table: both). Vali, 2026-11-11: keep 'Delhi Police (PTI) / CJP'."),
        F("5,000+ personnel and 25+ CAPF battalions (India.com)", "India.com", "reported", "claimed", "india", 6, value=5000, unit="personnel", value_text="5,000+ plus 25+ CAPF battalions"),
        F("internet suspended", "media", "reported", "documented", "wikipedia", 6),
        F("stage and tents dismantled", "media", "reported", "documented", "wikipedia", 6),
        F("Delhi Police records show two rounds of pellets were used on 20 July", "Delhi Police records (via Hindustan Times, The Tribune)", "police said", "disputed", ["wikipedia", "tribuneindia"], 13,
          value=2, unit="pellet rounds", resolution="Added by the 2026-11-12 web check (Vali: primary source wins). Contests the CRPF report's seven rounds."),
     ],
     [DIPKE, DAS, RANKA, NADDA], [
        IMG("jantar-mantar_parliament-march_2026-07-20_01.jpg", note="Morning gathering, 07:35. Shows the gathering, not the later clashes."),
        IMG("jantar-mantar_parliament-march_2026-07-20_11.jpg", note="Morning gathering, 07:41."),
     ], hunger_strike_day=23,
     sub_beats=[
        SB("pa_0720", "2026-07-20", "The march and the crackdown", [
            F("Medico-legal cases at RML by 7pm", "Hospital via media", "reported", "claimed", "wikipedia", 19, value=65, unit="medico-legal cases"),
            F("Government vehicles damaged", "Delhi Police (official)", "police said", "claimed", "wikipedia", 19, value_text="15–20", unit="vehicles"),
            F("Metro stations closed", "DMRC", "officials said", "documented", "wikipedia", 19, value=5, unit="stations"),
            F("Flashpoints on 20 July: Mandi House → Parliament Street, Patel Chowk, Rail Bhawan, Constitution Club, Shastri Bhavan, Palika Bazar (pellet injuries), Gurdwara Bangla Sahib (refuge), RML Hospital (injured).",
              "media", "reported", "documented", ["imnindia", "wikipedia"], 15),
            F("A Newslaundry investigation found the truck had been in police custody since 16 July; police confirmed this but called conspiracy claims baseless.",
              "Newslaundry; Delhi Police", "reported", "disputed", "wikipedia", 2),
          ], crowd_tier=4, crowd_basis="'More than 10,000' / 'tens of thousands'", site_ids=["jantar_mantar_road", "parliament"] + flash, hunger_strike_day=23),
        SB("pa_0721", "2026-07-21", "The camp is rebuilt", [
            F("Protesters rebuild the camp in the rain; Delhi HC orders Wangchuk moved to Medanta, Gurugram; Rahul Gandhi, Kharge and other MPs protest outside the PM’s residence; Rahul Gandhi is detained",
              "media", "reported", "documented", ["wikipedia", "pbs", "theprint_0721"], 6,
              resolution="Vali 2026-11-12: primary source wins. Wikipedia says Kharge led the protest but doesn't report him detained; Rahul Gandhi's detention is on p14."),
            F("20 CRPF companies airlifted from Kolkata (MHA order)", "MHA (official)", "officials said", "documented", "wikipedia", 6, value=20, unit="CRPF companies"),
            F("16 then 17 metro stations closed", "DMRC", "officials said", "documented", "wikipedia", 6, value=17, unit="stations",
              note="Consolidated table dates the 17 to 22 Jul (p19)."),
            F("ASG S.V. Raju tells Delhi HC that videos show stone-throwing; HC declines urgent hearing (“Don’t drag us into it”)", "media", "reported", "documented", "wikipedia", 7,
              resolution="Vali 2026-11-12: primary source wins. Dossier dated this 22 Jul; Wikipedia's timeline has it on 21 Jul (original, The Hindu, not fetched)."),
          ], crowd_tier=None, crowd_basis="No count reported; carry the previous tier.", site_ids=["jantar_mantar_road"] + metros, hunger_strike_day=24,
          images=[IMG("jantar-mantar_evening_2026-07-21.jpg"), IMG("jantar-mantar_crowd-night_2026-07-21.jpg")]),
        SB("pa_0722", "2026-07-22", "In court and in Parliament", [
            F("about 65 opposition MPs write to Wangchuk", "ThePrint (via Wikipedia)", "reported", "documented", ["theprint", "wikipedia"], 7, value=65, unit="MPs", value_text="~65"),
            F("2 ACPs and 4 other personnel reported hurt by stones", "media", "reported", "unverified", "wikipedia", 7,
              resolution="Wikipedia's source (Deccan Chronicle) headline mentions one ACP; body not checked. Unverified until checked."),
          ], site_ids=["jantar_mantar_road", "parliament"], hunger_strike_day=25),
        SB("pa_0723", "2026-07-23", "Wangchuk ends his fast", [
            F("Wangchuk ends his fast after 26 days in the presence of Nadda and Jitendra Singh after assurances (cases withdrawn, compensation, debate on leaks)",
              "media", "reported", "documented", ["scroll_0724", "outlook_0724", "dtnext_0724", "wikipedia"], 7, value=26, unit="days", value_text="night of 23–24 Jul",
              resolution="Wangchuk research 2026-11-12 (public Indian outlets; Vali: primary source wins). Scroll, TNM, Outlook and PTI put the end shortly after midnight on Friday 24 Jul; The Week says Thursday night. 'Written' dropped: Outlook and The Week say written, while Scroll, TNM and PTI say the assurances were read out. He had sought a written assurance on 22 Jul (FPJ).",
              note="Day-by-day row cites no outlet; 'Written assurances to Wangchuk (23 July)' carries a Wikipedia chip (p12). Duration also in the table: NBC, 25 Jul (p19)."),
            F("Parliament adjourned for a 4th day", "media", "reported", "documented", "wikipedia", 7, resolution="Vali 2026-11-12: primary source wins. Dossier dated this 22 Jul; Wikipedia has 23 Jul."),
            F("Minister Jitendra Singh says 4 talk proposals sent since 22 Jul", "Jitendra Singh", "said", "claimed", "wikipedia", 7, value=4, unit="talk proposals",
              resolution="Vali 2026-11-12: primary source wins. Dossier dated this 22 Jul; Wikipedia has 23 Jul."),
            F("Dipke vows to continue; MEA “no information” on foreign funding; PM announces fast-track courts", "media", "reported", "documented", "dossier", 7, note="Dossier row cites no outlet."),
          ], site_ids=["jantar_mantar_road"], hunger_strike_day=26),
        SB("pa_0724", "2026-07-24", "Holding on", [
            F("Government source: resigning “equates to running away”", "a government source", "reported", "claimed", "christiandaily", 7),
            F("Protest continues; Kolkata solidarity march", "media", "reported", "documented", "altnews", 7),
            F("Checkpoints about 5 km out (Ranka alleges)", "Ashutosh Ranka", "alleged", "alleged", "outlookindia", 7, value=5, unit="km"),
            F("18 metro stations closed on 24 Jul", "DMRC", "officials said", "documented", "wikipedia", 7, value=18, unit="stations"),
          ], site_ids=["jantar_mantar_road"] + metros,
          images=[IMG("solidarity_los-angeles_2026-07.jpg", note="Los Angeles solidarity protest. EXIF says 2019-07-24; the banner in frame reads July 24, 2026.")]),
     ])

# Node 6: Victory
node("victory", 6, "Victory", "2026-07-25", ("2026-07-25", "2026-07-25"), "Pradhan resigns",
     {"text": "Pradhan announces his resignation on X after talks with the CJP (NBC News), with a letter to “young friends”; joint press conference with Nadda and Singh; CJP calls off protest; site swept clean",
      "source_ids": ["nbcnews"], "page": 7},
     ["jantar_mantar_road"], 2,
     "'Hundreds' celebrating on site; 'Lakhs' galvanised overall (Outlook). Tier is the on-site figure. Spec S5 'largest roaches' refers to size (days elapsed), not count.",
     [
        F("Education Minister Dharmendra Pradhan resigned on 25 July", "media", "reported", "documented", "wikipedia", 1),
        F("“Lakhs” galvanised overall (Outlook)", "Outlook", "reported", "claimed", "outlookindia", 7, value_text="Lakhs"),
        F("“hundreds” celebrating on site", "dossier", "reported", "claimed", "dossier", 7, value_text="hundreds", note="Dossier row cites no outlet for this cell."),
        F("Police report a Special CP and 2 officers hurt by stones, followed by lathi charge and tear gas", "Delhi Police", "police said", "claimed", "dossier", 7, note="Dossier row cites no outlet for this cell."),
        F("36 days (sit-in)", "media", "reported", "documented", ["aljazeera", "telanganatoday_0725"], 19, value=36, unit="days",
          resolution="Vali 2026-11-12: primary source wins. 36 is in Al Jazeera (25 Jul) and Telangana Today. The dossier's mixed attribution is corrected."),
        F("49 days (from 6 Jun)", "media", "reported", "documented", ["christiandaily", "wikipedia"], 19, value=49, unit="days",
          resolution="Vali 2026-11-12: primary source wins. 49 is in Christian Daily; the Wikipedia infobox gives 6 Jun – 25 Jul (1 month 19 days)."),
        F("An agreement to withdraw cases in NDA-ruled states and pay “maximum compensation per the rules”.", "media", "reported", "unverified", ["wikipedia", "christiandaily"], 12,
          resolution="Web check 2026-11-12: Christian Daily says 'BJP-governed states' and 'honourable compensation' within existing rules; Moneylife says 'maximum possible compensation'. The quoted wording isn't confirmed in any source: don't quote it until checked."),
        F("Outlook’s metadata names Pralhad Joshi as the new Education Minister.", "Outlook (metadata)", "reported", "claimed", "outlookindia", 12,
          note="Web check 2026-11-12: Outlook reports Joshi took charge of Education as an additional charge (he keeps Consumer Affairs, Food and Public Distribution)."),
     ],
     [PRADHAN, NADDA, JSINGH], [
        IMG("jantar-mantar_kys-victory-march_2026-07-25.jpg"),
        IMG("cartoon_cockroach-atop-constitution_2026-07-25.jpg", note="Editorial cartoon, not a photograph."),
     ])

timeline_doc = {
    "phase": 1, "start": "2026-05-16", "end": "2026-07-25",
    "note": ("Phase 1 only (D2). Node mapping follows D3: Detention = 18 Jul, Protest and arrest = 20 Jul. "
             "Media lists images first, then videos. Videos are seeded random picks (D13) tagged review: 'pending'. "
             "upload_date is the YouTube upload date in IST, not the date the footage was shot."),
    "video_pool_sizes": pool_sizes,
    "nodes": nodes,
}

# ───────────────────────── meta ─────────────────────────
meta = {
    "title": "Cockroaches",
    "title_source": "Vali, 2026-11-11",
    "protest_start_date": "2026-06-06",
    "finale_date": "2026-07-25",
    "cji_quote": {
        "text": ("There are youngsters like cockroaches, who don't get any employment and don't have any place in profession. "
                 "Some of them become media, some of them become social media, some of them become RTI activists, "
                 "some of them become other activists, and they start attacking everyone."),
        "speaker": "Surya Kant, Chief Justice of India",
        "date": "2026-05-15",
        "keyword": "cockroaches",
        "source_id": "tnm_0516",
        "source_ids": ["tnm_0516"],
        "source_status": ("Vali confirmed the source wording 2026-11-12. Web check 2026-11-12: The News Minute (16 May, citing LiveLaw; free to read) prints "
                          "'in profession' where D7 had 'in the profession'; otherwise word for word. Free Press Journal and Scroll print a shorter variant; "
                          "Bar and Bench paraphrases ('parasites in society') and must not be cited for the verbatim text."),
        "d7_text_variant": "don't have any place in the profession",
        "context_facts": [
            F("A CJI Surya Kant–led bench, hearing a contempt plea about senior-advocate designation, compared some unemployed youth who turn to media, social media and RTI activism to “cockroaches” and “parasites”.",
              "media", "reported", "documented", "dainikjagranmpcg", 2),
            F("Kant later said he had been misquoted and was referring to people with fake degrees.", "Surya Kant", "said", "documented", ["wikipedia", "livelaw_0516"], 2),
            F(SOURCING["cji_clarification_sources"][0]["verbatim"], "Surya Kant (statement)", "said", "documented", ["livelaw_0516"], 0,
              note="Verbatim from LiveLaw, 16 May (read from the page HTML). The '...' is LiveLaw's own elision between two passages. page 0 = not from the dossier."),
        ],
    },
    "founder": {"name": "Abhijeet Dipke", "source_ids": ["wikipedia"],
                "founded": F("Abhijeet Dipke … launched the CJP …", "Wikipedia", "reported", "documented", "wikipedia", 2, value_text="16 May 2026"),
                "note": "Spelling is Abhijeet (D12). The labelled founder roach is a symbolic marker."},
    "finale": {"date": "2026-07-25", "headline": "Victory",
               "line": "Education Minister Dharmendra Pradhan resigned on 25 July",
               "source_ids": ["wikipedia"], "page": 1},
    "background_facts": [
        F("NTA cancels NEET-UG (held 3 May); CBI probe ordered", "media", "reported", "documented", ["businesstoday", "indiatvnews"], 4, value_text="12 May"),
        F("NEET-UG was cancelled on 12 May; the NTA notice, cited by Deccan Herald, said nearly 22.79 lakh candidates had taken the exam at 5,400+ centres, and ETV Bharat reported fee refunds of more than Rs 300 crore.",
          "NTA; ETV Bharat", "reported", "documented", ["deccanherald", "etvbharat"], 1),
    ],
    "handles": [
        {"platform": "Instagram", "handle": "@cockroachjantaparty", "url": "https://www.instagram.com/cockroachjantaparty/", "official": "reported",
         "show": True, "note": "Business Today (22 Jul) calls the account official; restricted in India after a legal request.", "source_ids": ["businesstoday"]},
        {"platform": "X", "handle": "@Cockroachisback", "url": "https://x.com/Cockroachisback", "official": "self-declared + reported",
         "show": True, "note": "Replacement after the original was withheld on 21 May; bio says it is the only official account.", "source_ids": ["fpj_cockroachisback"]},
    ],
    "handles_status": "Vali 2026-11-12: use Instagram and X (@Cockroachisback) only.",
    "designer_credit": "Design and development: Vali Hashmi",
}

# ───────────────────────── metrics (pp17–21) ─────────────────────────
rows = []
def M(date, metric, value_text, claimant, source_text, source_ids, status, page, value=None, value_max=None, value_later=None, unit=None, date_note=None, note=None, phase=None):
    r = {"id": f"m{len(rows)+1:02d}", "date": date}
    if date_note:
        r["date_note"] = date_note
    r.update({"metric": metric, "value_text": value_text, "value": value})
    if value_max is not None:
        r["value_max"] = value_max
    if value_later is not None:
        r["value_later"] = value_later
    r.update({"unit": unit, "claimant": claimant, "source_text": source_text, "source_ids": source_ids,
              "status": status, "phase": phase or (1 if date <= "2026-07-25" else (2 if date >= "2026-10-01" else "gap")),
              "page": page})
    if note:
        r["note"] = note
    rows.append(r)

M("2026-05-03", "NEET-UG candidates (registered)", "22.79 lakh", "NTA (official)", "NTA notice of 12 May via Deccan Herald; righttoinformation.wiki", ["deccanherald", "righttoinformation"], "documented", 17, value=2279000, unit="candidates")
M("2026-05-03", "NEET-UG exam centres", "5,400+ centres", "NTA (official)", "NTA notice of 12 May via Deccan Herald; righttoinformation.wiki", ["deccanherald", "righttoinformation"], "documented", 17, value=5400, unit="centres")
M("2026-05-12", "NEET-UG candidates affected", "22 lakh+", "Media", "BusinessToday, 12 May", ["businesstoday"], "claimed", 17, value=2200000, unit="candidates")
M("2026-05-19", "Instagram followers, 78 hrs after launch", "3 million", "Media", "BusinessToday, 21 May", ["businesstoday"], "claimed", 17, value=3000000, unit="followers", date_note="approx.")
M("2026-05-20", "Instagram followers", "9 million+ (vs BJP ~8.7 million)", "Media", "BusinessToday, 21 May", ["businesstoday"], "claimed", 17, value=9000000, unit="followers")
M("2026-05-20", "Followers gained in 24 hrs", "3.7 million", "Media", "The Tribune, 20 May", ["tribuneindia", "wikipedia"], "claimed", 17, value=3700000, unit="followers")
M("2026-05-21", "X followers", "165,500 (disputed vs ~90,000 / ~200,000)", "Media", "BusinessToday, 21 May", ["businesstoday"], "disputed", 17, value=165500, unit="followers")
M("2026-05-21", "X followers when blocked", "~90,000", "Officials via media", "Indian Express (via Wikipedia)", ["indianexpress", "wikipedia"], "disputed", 17, value=90000, unit="followers")
M("2026-05", "X followers", "about 200,000", "BBC", "BBC (dossier text, p2)", ["bbc"], "disputed", 2, value=200000, unit="followers",
  date_note="undated in the dossier", note="Not a row in the consolidated table; added from the p2 text so each contested figure has its own row.")
M("2026-05-22", "Instagram followers", "20 million+", "Media", "Economic Times (via Wikipedia)", ["economictimes", "wikipedia"], "claimed", 17, value=20000000, unit="followers")
M("2026-05", "Members 'within days'", "over 100,000", "Media", "WION", ["wionews"], "claimed", 2, value=100000, unit="members",
  note="From p2 text, not the consolidated table.")
M("2026-05", "NEET-UG fee refunds", "more than Rs 300 crore", "Media", "ETV Bharat (p1–2 text)", ["etvbharat"], "claimed", 2, value=3000000000, unit="INR",
  note="From the Key Findings text, not the consolidated table.")
M("2026-05", "Online sign-ups", "350,000+", "CJP claim", "Al Jazeera", ["wikipedia", "aljazeera"], "claimed", 17, value=350000, unit="sign-ups")
M("2026-05", "Share of Indian audience", ">94%", "CJP (Dipke screen recording)", "Wikipedia", ["wikipedia"], "disputed", 17, value=94, unit="percent")
M("2026-05", "Share of Pakistani followers", "49%", "Union minister (government)", "Wikipedia", ["wikipedia"], "disputed", 17, value=49, unit="percent",
  note="Dossier: 'The Pakistan-followers claim was rebutted' (p15).")
M("2026-06-06", "Crowd", "Hundreds", "Media", "Al Jazeera, 6 Jun", ["aljazeera"], "disputed", 17, unit="people",
  note="Outlook (retrospective): 'a few dozen students' (p4).")
M("2026-06-06", "Crowd", "a few dozen students", "Media", "Outlook (retrospective)", ["outlookindia"], "disputed", 4, unit="people",
  note="Not a row in the consolidated table; added from p4 so each contested figure has its own row.")
M("2026-06-06", "Police deployed, New Delhi district", "~5,000", "Media", "Wikipedia summary", ["wikipedia"], "claimed", 18, value=5000, unit="personnel")
M("2026-06-06", "Permitted hours", "10:00–17:00", "Delhi Police (official)", "The Statesman, 6 Jun", ["thestatesman"], "documented", 18, unit="hours")
M("2026-06-20", "Crowd", "Hundreds", "Media", "Wikipedia/Deccan Herald", ["wikipedia", "deccanherald"], "claimed", 18, unit="people")
M("2026-06-21", "NEET re-test appearing", "~20 lakh", "Secondary", "righttoinformation.wiki", ["righttoinformation"], "claimed", 18, value=2000000, unit="candidates")
M("2026-06-21", "NEET re-test centres", "5,440 centres", "Secondary", "righttoinformation.wiki", ["righttoinformation"], "claimed", 18, value=5440, unit="centres")
M("2026-07-16", "Wangchuk weight loss", "more than 9 kg (day 19)", "Doctors via media", "DT Next, 16 Jul", ["dtnext_0716"], "claimed", 18, value=9, unit="kg",
  note="Dossier: 9.1 kg (BBC via Wikipedia, 17 Jul). Corrected to the free DT Next report by the 2026-11-12 Wangchuk research.")
M("2026-07-14", "Appeal signatories", "1,800+", "Media", "Scroll, 14 Jul", ["scroll_0714"], "claimed", 18, value=1800, unit="signatories",
  note="Dossier dated this 17 Jul; Scroll dates it 14 Jul.")
M("2026-07-19", "Police at site", "300+", "Delhi Police (official)", "ThePrint, 20 Jul", ["theprint"], "claimed", 18, value=300, unit="personnel")
M("2026-07-20", "Marchers", ">10,000", "Delhi Police (DCP Sachin Sharma, via Al Jazeera)", "Al Jazeera, 20 Jul", ["aljazeera"], "disputed", 18, value=10000, unit="people",
  note="Web check 2026-11-12: Al Jazeera attributes it to the DCP; the dossier said Al Jazeera/AP/Reuters (media).")
M("2026-07-20", "Marchers", "Tens of thousands", "Media / CJP", "Guardian, Deccan Herald; CJP", ["guardian", "deccanherald", "wikipedia"], "disputed", 18, unit="people",
  note="Dossier: no sourced figure found for a CJP claim of about 20,000 before 20 July; mark as unverified if used (p21).")
M("2026-07-20", "Security deployed", "5,000+ plus 25+ CAPF battalions", "Media", "India.com", ["india"], "claimed", 18, value=5000, unit="personnel")
M("2026-07-20", "Police injured", "118+ (later 130+)", "Delhi Police (official)", "Delhi Police statement via India.com and ThePrint/PTI, 20 Jul", ["theprint", "wikipedia", "india", "pti"], "disputed", 18, value=118, value_later=130, unit="police",
  note="130+ is a later, open-ended count, not an upper bound.")
M("2026-07-20", "Protesters injured", "~60", "Delhi Police (official)", "ThePrint/PTI, 20 Jul", ["theprint", "pti"], "disputed", 18, value=60, unit="protesters")
M("2026-07-20", "Injured at RML Hospital emergency by 5.30pm", "~100 (incl. 10 police; 4 protesters in ICU)", "Media (hospital sources)", "Newslaundry, 21 Jul, citing Indian Express", ["newslaundry", "indianexpress"], "disputed", 18, value=100, unit="people",
  note="Includes 10 police; not '100+ protesters' (p21).")
M("2026-07-20", "Medico-legal cases at RML by 7pm", "65", "Hospital via media", "Wikipedia", ["wikipedia"], "claimed", 19, value=65, unit="cases")
M("2026-07-20", "Protesters hospitalised", "~150", "CJP claim", "Wikipedia", ["wikipedia"], "disputed", 19, value=150, unit="protesters")
M("2026-07-20", "Detained", "~70", "Delhi Police (PTI) / CJP", "ThePrint/PTI, Telangana Today, 20 Jul", ["theprint", "pti", "telanganatoday"], "disputed", 19, value=70, unit="people",
  note="The dossier attributes the ~70 to CJP on p2 and to police on p21; the table lists both claimants.")
M("2026-07-20", "Detained", "0 (denial)", "Delhi Police (later statement)", "Wikipedia", ["wikipedia"], "disputed", 19, value=0, unit="people")
M("2026-07-20", "Government vehicles damaged", "15–20", "Delhi Police (official)", "Wikipedia", ["wikipedia"], "claimed", 19, value=15, value_max=20, unit="vehicles")
M("2026-07-20", "Pellet rounds fired", "7", "CRPF report (via The Wire)", "The Wire", ["thewire"], "disputed", 19, value=7, unit="rounds",
  note="Dossier: 'Media / Indian Express (via Wikipedia)'. Web check 2026-11-12 found the figure only in The Wire, citing a CRPF report.")
M("2026-07-20", "Pellet rounds fired", "2", "Delhi Police records", "Hindustan Times (via Wikipedia); The Tribune", ["wikipedia", "tribuneindia"], "disputed", 19, value=2, unit="rounds",
  note="Added by the 2026-11-12 web check.")
M("2026-07-20", "Pellet hits", "5", "CRPF report (via The Wire)", "The Wire", ["thewire"], "disputed", 19, value=5, unit="people hit")
M("2026-07-20", "Metro stations closed", "5", "DMRC", "Wikipedia", ["wikipedia"], "documented", 19, value=5, unit="stations")
M("2026-07-21", "CRPF companies airlifted", "20", "MHA (official)", "Wikipedia", ["wikipedia"], "documented", 19, value=20, unit="companies")
M("2026-07-22", "Metro stations closed", "17", "DMRC", "Wikipedia", ["wikipedia"], "documented", 19, value=17, unit="stations",
  note="The day-by-day table puts '16 then 17' on 21 Jul (p6).")
M("2026-07-22", "Opposition MPs’ letter to Wangchuk", "~65 MPs", "Media", "ThePrint (via Wikipedia)", ["theprint", "wikipedia"], "documented", 19, value=65, unit="MPs")
M("2026-07-24", "Metro stations closed", "18", "DMRC", "Wikipedia", ["wikipedia"], "documented", 19, value=18, unit="stations")
M("2026-07-23", "Hunger strike duration", "26 days (28 Jun–23 Jul)", "Media", "NBC, 25 Jul", ["nbcnews"], "documented", 19, value=26, unit="days")
M("2026-07-25", "Agitation length (sit-in)", "36 days (sit-in)", "Media", "Al Jazeera, 25 Jul; Telangana Today", ["aljazeera", "telanganatoday_0725"], "documented", 19, value=36, unit="days",
  note="Sources corrected by the 2026-11-12 web check.")
M("2026-07-25", "Agitation length (from 6 Jun)", "49 days (from 6 Jun)", "Media", "Christian Daily; Wikipedia infobox", ["christiandaily", "wikipedia"], "documented", 19, value=49, unit="days",
  note="Sources corrected by the 2026-11-12 web check.")
M("2026-07-28", "Protesters arrested nationwide after deal", "100+", "CJP claim", "Waging Nonviolence", ["wagingnonviolence"], "claimed", 20, value=100, unit="protesters", date_note="approx.", phase="gap")
M("2026-07-20", "People with criminal antecedents present", "2,873", "Delhi Police (official)", "Wikipedia", ["wikipedia"], "alleged", 20, value=2873, unit="people", date_note="2026-07-20 to 25", phase=1,
  note="Dossier day-by-day table: 'Police later allege' (p8).")
M("2026-10-09", "Metro stations closed", "45", "DMRC via media", "ETV Bharat", ["etvbharat"], "documented", 20, value=45, unit="stations", date_note="2026-10-09/10")
for v, claimant, src in [(20000, "PTI", ["pti", "ratopati"]), (25000, "ETV Bharat", ["etvbharat"]), (30000, "IPS", ["ips"]), (35000, "Tribune", ["tribuneindia"]), (43000, "Zee", ["zeenews"])]:
    M("2026-10-10", "Security deployed", (f"~{v:,}" if v == 43000 else f"{v:,}+"), claimant, "Various", src, "disputed", 20, value=v, unit="personnel",
      note="One of five deployment figures the table gives in a single row; split here so each claimant has its own row." + (" Zee figure taken from a TV programme." if claimant == "Zee" else ""))
M("2026-10-10", "Detained (Delhi)", "~2,000", "MHA official", "Reuters via Al Jazeera, 10 Oct", ["reuters", "aljazeera"], "disputed", 20, value=2000, unit="people")
M("2026-10-10", "Detained (Delhi)", "~2,500", "Delhi Police sources", "The Hindu via Al Jazeera", ["thehindu", "aljazeera"], "disputed", 20, value=2500, unit="people")
M("2026-10-10", "Detained (Delhi)", "~3,000", "Police sources", "The Tribune, 11 Oct", ["tribuneindia"], "disputed", 20, value=3000, unit="people")
M("2026-10-10", "Detained (Delhi)", "5,900 → 7,000+", "Media sources", "Zee News", ["zeenews"], "disputed", 20, value=5900, value_later=7000, unit="people",
  note="7,000+ is a later, open-ended count, not an upper bound.")
M("2026-10-10", "Detained (Delhi)", "~15,000", "CJP claim", "Zee News", ["zeenews"], "disputed", 20, value=15000, unit="people")
M("2026-10-10", "Arrested (Mumbai)", "~600", "Media", "ANI via Al Jazeera", ["ani", "aljazeera"], "claimed", 20, value=600, unit="people")
M("2026-10-10", "UP women police deployed", "300+", "Media", "The Tribune", ["tribuneindia"], "claimed", 20, value=300, unit="personnel")
M("2026-10-12", "Social posts taken down", "300", "Delhi Police (official)", "Business Standard", ["business_standard"], "claimed", 20, value=300, unit="posts")
M("2026-10-12", "Years as designated protest site", "33", "Media", "Daily Jagran", ["thedailyjagran"], "documented", 21, value=33, unit="years")
M("2026-10-13", "People breaching site", "14 (police)", "Official", "Hans India", ["hansindia"], "disputed", 21, value=14, unit="people")
M("2026-10-13", "People breaching site", "~20 (Al Jazeera)", "Media", "Al Jazeera", ["aljazeera"], "disputed", 21, value=20, unit="people")
M("2026-10-14", "Days in judicial custody (Das, Ranka)", "7", "Court via media", "India TV, LiveLaw", ["indiatv", "livelaw"], "documented", 21, value=7, unit="days", date_note="2026-10-14 to 21")
M("2026-10-16", "Detained, Tiranga march", "~150", "Delhi Police (official)", "ThePrint/PTI, 16 Oct", ["theprint", "pti"], "disputed", 21, value=150, unit="people")
M("2026-10-16", "Detained, Tiranga march", "more than 100", "Media", "Fair Observer", ["fairobserver", "theprint"], "disputed", 10, value=100, unit="people",
  note="From the p10 day-by-day row (crowd cell carries a theprint chip); contests the police ~150.")
M("2026-10-21", "Bail bond", "₹50,000 each", "Court", "The Tribune, 5 Nov", ["tribuneindia", "thelogicalindian"], "documented", 21, value=50000, unit="INR")
M("2026-11-05", "Questions at Crime Branch", "~70 in ~4 hrs", "Police sources", "ThePrint/PTI, 5 Nov", ["theprint", "pti"], "claimed", 21, value=70, unit="questions")
M("2026-11-07", "Kochi marchers", "~500", "CJP (organisers)", "The Week, 7 Nov", ["theweek"], "claimed", 21, value=500, unit="people")

# Police tactics (pp13–14)
def T(tactic, dates, status_text, status, src, page, chart=True):
    return {"tactic": tactic, "dates": dates, "status_text": status_text, "status": status, "source_ids": src, "page": page, "chartable": chart}
tactics = [
    T("Permission limited to 10am–5pm, “one-time exemption”", "6 Jun, 20 Jun", "Documented (police letter, The Statesman)", "documented", ["thestatesman"], 13),
    T("Lights, water, food and washroom access cut at the site", "20 Jun, 28 Jun", "CJP allegation; reported live by Dynamite News; access later restored", "alleged", ["thefederal", "dynamitenews"], 13),
    T("No force used; police withdrew", "6 Jun, 20 Jun night", "Reported (Wikipedia citing media)", "claimed", ["wikipedia"], 13),
    T("Bag scanners, frisking, plain-clothes officers, QRTs, inter-state border checks", "19–20 Jul", "Documented (ThePrint, senior officer quoted)", "documented", ["theprint"], 13),
    T("Section 163 BNSS (assemblies of 5+ banned)", "20 Jul; 16 Oct", "Documented (DCP X post)", "documented", ["theprint"], 13),
    T("Lathi charge, tear gas", "20 Jul, 25 Jul", "Documented by AP, Reuters, Al Jazeera and police statements", "documented", ["theprint", "asiaone"], 13),
    T("Pellet guns (RAF; 2 rounds per police records, 7 rounds and 5 hits per a CRPF report; 3 named victims including an Outlook journalist)", "20 Jul", "Count disputed; under HPEC review", "documented", ["wikipedia", "tribuneindia", "thewire", "newslaundry"], 13),
    T("Nail-fitted batons", "20 Jul", "Police denied; Alt News and BOOM found the videos authentic", "disputed", ["wikipedia"], 13),
    T("Electric shock batons", "20 Jul", "Dainik Bhaskar video report; unverified", "unverified", ["wikipedia", "dainikbhaskar"], 13),
    T("Officer slapping a woman (Addl DCP Sandeep Lamba); baton toward a woman’s groin (Inspector Naveen Rathi)", "20 Jul", "Video and press reports; cited in PIL; Saket Gokhale filed an FIR complaint", "alleged", ["wikipedia"], 13),
    T("Missing name badges; plain-clothes men with batons", "20 Jul", "Media reports", "alleged", ["newslaundry", "wikipedia"], 13),
    T("RAF IG says force “did not align with prescribed standards”", "Post-20 Jul", "ThePrint, quoting an officer at an internal meeting", "documented", ["wikipedia", "theprint"], 13),
    T("Internet shutdowns; metro closures (5 → 16 → 17 → 18 stations in July; 45 in October)", "Jul, Oct", "Documented (DMRC, ETV Bharat)", "documented", ["aljazeera", "wikipedia", "etvbharat"], 13),
    T("Mass preventive detention; detention aboard an aircraft; buses used to remove protesters", "10 Oct", "Documented (Al Jazeera/Reuters/AP)", "documented", ["aljazeera"], 14),
    T("Water cannon, drones, kettling", "—", "No credible source found; do not chart", "unverified", ["dossier"], 14, chart=False),
]
metrics_doc = {
    "note": ("One row per claim, with the claimant kept. Contested figures stay as separate rows; never average them. "
             "value is the lower bound when value_text has '+', '~' or a range; value_max is the upper bound where given. "
             "value_text is the dossier's own wording. Rows marked phase 'gap' fall between 25 Jul and October."),
    "rows": rows,
    "tactics": tactics,
}

# ───────────────────────── epilogue ─────────────────────────
E = lambda date, text, claimant, attribution, status, src, page, **kw: {"date": date, **F(text, claimant, attribution, status, src, page, **kw)}
epilogue = {
    "note": "Text-only epilogue (D2, S6.5). The October phase is a different story: the dossier says treat it as a separate phase, not a continuation (p2).",
    "framing": F("The October phase is a different kind of story. The issue (SIR electoral rolls), the opponent (the CEC) and the state posture (mass preventive detention, internet shutdowns, de-notification of the site) all differ from the summer.",
                 "dossier", "reported", "documented", ["aljazeera"], 2),
    "bridge": [
        E("2026-07-28", "CJP says 100+ protesters arrested nationwide (Delhi, Assam, West Bengal, Bihar) despite assurances", "CJP", "CJP claims", "claimed", ["wagingnonviolence"], 8, value=100, value_text="100+"),
        E("2026-08-18", "Supreme Court constitutes High-Powered Enquiry Committee (HPEC) under Justice R. Subhash Reddy", "Supreme Court", "reported", "documented", ["tribuneindia", "siasat"], 8),
        E("2026-09-10", "SC refuses to reconstitute the HPEC (order uploaded later)", "Supreme Court", "reported", "documented", ["siasat"], 8),
    ],
    "facts": [
        E("2026-10-01", "Delhi Police deny permission for a Jantar Mantar protest (challenged in HC)", "Delhi Police", "reported", "documented", ["thedailyjagran"], 8),
        E("2026-10-09", "45 metro stations’ gates shut from 9pm (ETV Bharat); mobile internet suspended within 4 km of Jantar Mantar, 10pm 9 Oct – 10pm 10 Oct", "media (ETV Bharat)", "reported", "disputed", ["etvbharat"], 8, value=45, unit="stations",
          note="ETV Bharat itself notes an earlier count of 57; IANS (via Telangana Today) reports 57."),
        E("2026-10-10", "Reports put 10 October detentions anywhere from about 2,000 (an MHA official, cited by Reuters via Al Jazeera) to 15,000 (CJP claim).", "MHA official; CJP", "reported", "disputed", ["reuters", "aljazeera", "zeenews"], 1,
          note="Range of separate claims; see metrics.json rows for 10 Oct. Never average."),
        E("2026-10-09", "SC hearing calls for rethink of Jantar Mantar as the protest site", "Supreme Court", "reported", "unverified", ["thedailyjagran"], 8,
          resolution="Dossier-only: no source found for a 9 Oct hearing. A 3 Aug SC hearing on Jantar Mantar's suitability exists (LiveLaw, search only)."),
        E("2026-10-10", "Dipke, Das and Ranka detained aboard an Air India plane on landing", "media", "reported", "documented", ["aljazeera"], 9),
        E("2026-10-11", "Commissioner Anurag Kumar signs standing order de-notifying Jantar Mantar", "Delhi Police", "reported", "documented", ["business_standard"], 9),
        E("2026-10-11", "Executive magistrate releases Dipke and others (“no breach of peace for one year”)", "court", "reported", "documented", ["aljazeera"], 9),
        E("2026-10-12", "Opposition “March for Democracy” to SC stopped at Bhagwan Dass Road", "media", "reported", "documented", ["business_standard"], 9),
        E("2026-10-12", "Delhi Police get 300 social-media posts taken down for “rumours” (Business Standard)", "Delhi Police", "police said", "claimed", ["business_standard"], 9, value=300, unit="posts"),
        E("2026-10-12", "Jantar Mantar was stripped of its 33-year protest-site status", "media", "reported", "documented", ["dossier", "thedailyjagran"], 1, value=33, unit="years",
          note="p1 wording has no chip; the 33 figure is sourced to Daily Jagran in the p21 table."),
        E("2026-10-12", "new sites: Ramlila Maidan (3 km), CBD Ground Shahdara (12 km), Burari (23 km)", "Delhi Police", "reported", "documented", ["business_standard"], 9),
        E("2026-10-13", "Das, Ranka and Shinde among those who enter the de-notified site: 14 people (police, via Hans India) / about 20 volunteers who jumped barricades (Al Jazeera)", "police / Al Jazeera", "reported", "disputed", ["india", "hansindia", "aljazeera"], 9,
          resolution="Vali 2026-11-12: primary source wins. 'via private premises' dropped: Al Jazeera says volunteers jumped barricades. 14 is the police figure from the consolidated table (Hans India)."),
        E("2026-10-13", "FIR 128/26 at PS Parliament Street (BNS 221/115(2)/132/121(1)/3(5)); second FIR at Connaught Place; “preventive arrest”", "Delhi Police", "reported", "documented", ["india"], 9),
        E("2026-10-14", "SEM at Mandir Marg remands Das and Ranka to 5 days’ judicial custody (Tihar)", "court", "reported", "documented", ["india"], 10, value=5, unit="days"),
        E("2026-10-14", "Rahul Gandhi calls it “an act of cowardice”", "Rahul Gandhi", "said", "documented", ["india"], 10),
        E("2026-10-15", "HPEC portal (hpec.nic.in) launched; the SC-appointed committee lists pellet gun use, harassment of female protesters and property destruction among its priorities", "HPEC (SC-appointed committee)", "reported", "documented", ["theprint", "tribuneindia"], 10,
          resolution="Vali 2026-11-12: primary source wins. ThePrint attributes the priorities to the committee, not the MHA, and uses 'harassment of female protesters'."),
        E("2026-10-16", "“Lehra Do Tiranga” march, Connaught Place; Dipke detained at home (20+ police, 2 notices); Bora detained at Mandi House", "media", "reported", "documented", ["theprint"], 10),
        E("2026-10-16", "~150 detained (police)", "Delhi Police", "police said", "disputed", ["theprint"], 10, value=150, unit="detained"),
        E("2026-10-16", "“more than 100” (Fair Observer)", "Fair Observer", "reported", "disputed", ["fairobserver", "theprint"], 10, value=100, unit="detained"),
        E("2026-10-19", "Custody extended by 2 days; cases moved to Crime Branch Inter-State Cell", "court", "reported", "documented", ["dossier"], 10, note="Dossier row cites no outlet."),
        E("2026-10-21", "Das and Ranka released after 7 days; SEM Ritu Raj rejects 3-day extension; ₹50,000 bonds and an undertaking not to call Jantar Mantar protests", "court", "reported", "documented", ["thelogicalindian"], 10, value=7, unit="days"),
        E("2026-11-05", "Crime Branch questioning, Rajouri Garden: about 4 hours, about 70 questions (PTI)", "police sources (PTI)", "reported", "claimed", ["telanganatoday", "theweek", "pti"], 11,
          value=70, unit="questions", note="Dossier dates this '23 Oct / 5 Nov'."),
        E("2026-11-05", "SC directs HPEC to file its first fact-finding report within a month", "Supreme Court", "reported", "documented", ["barandbench"], 11,
          resolution="LawTrend dropped: its 5 Nov article sets no one-month deadline. Bar and Bench does."),
        E("2026-11-05", "Union minister Jitendra Singh alleges CJP is funded from “unauthorised sources”; Ranka responds “Why were you negotiating with us then?”", "Jitendra Singh; Ashutosh Ranka", "alleged", "alleged", ["theweek"], 11,
          note="Dossier dates this '~6 Nov'.",
          resolution="Vali 2026-11-12: primary source wins. The Week's article is dated 5 Nov; UNI/Deccan Herald (search only) say Singh spoke on 3 Nov. Ranka's reply is verbatim in The Week, 7 Nov."),
        E("2026-11-07", "“Jantar Mantar @ Kochi” march, Marine Drive to Rajendra Maidan, led by Prakash Raj", "CJP (organisers)", "reported", "documented", ["theweek"], 11),
        E("2026-11-07", "~500 (organisers)", "CJP (organisers)", "CJP claims", "claimed", ["theweek"], 11, value=500, unit="marchers"),
    ],
    "narratives": [
        F("“anarchic elements” and a “flop show” (BJP’s Sambit Patra)", "Sambit Patra", "said", "documented", ["aljazeera"], 12,
          resolution="Split by the 2026-11-12 web check: Al Jazeera (10 Oct) carries Patra's phrases only."),
        F("“group of hooligans” (Shivraj Singh Chouhan)", "Shivraj Singh Chouhan", "said", "unverified", ["dossier"], 12,
          resolution="Dossier-only: not in the Al Jazeera piece and not found elsewhere. Jitendra Singh's foreign-funding claim is dated 5 Nov (separate fact)."),
        F("India’s UN mission in Geneva called UN concerns “unwarranted interference”.", "India's UN mission", "said", "documented", ["aljazeera"], 12),
    ],
    "status_line": F("The movement is still active (Kochi rally, 7 November) and a Supreme Court-appointed inquiry into the July police violence is pending.",
                     "dossier", "reported", "documented", ["theweek", "barandbench"], 1),
}

# ───────────────────────── quotes ─────────────────────────
def _quote(q):
    return {"id": q["id"], "role": q["type"], "author": q["author"], "nationality": q.get("nationality"), "year": q.get("year"), "work": q.get("work"),
            "language": q.get("original_language"), "original_text": q.get("original_text"), "roman": q.get("roman"),
            "text": q.get("english_text"), "translator": q.get("translator"), "translation_is_ours": q.get("translation_is_ours", False),
            "source_url": q.get("source_url"), "source_note": q.get("source_note"), "disputed": q.get("disputed"),
            "public_domain": q.get("public_domain"), "notes": q.get("notes"), "selected": q["id"] in SELECTED_QUOTES}
SELECTED_QUOTES = {"ambedkar-annihilation-of-caste", "bhagat-singh-red-pamphlet", "faiz-bol"}  # Vali, 2026-11-12
quotes = {
    "note": ("Candidates sourced from the web 2026-11-12 (Vali approved web sourcing; supersedes D8). Vali picked Ambedkar, Bhagat Singh and Faiz (2026-11-12); the rest stay as unselected candidates. "
             "Render original_text with text beneath it, plus a visible source line. Poets are in copyright in India: short quotes need a fair-dealing call. "
             "'translation_is_ours: true' means no published translation was found: label the English 'Translation: CJP Visualiser' or find a published one."),
    "quotes": [_quote(q) for q in SOURCING["quotes"]],
}

# ───────────────────────── methodology ─────────────────────────
methodology = {
    "statuses": {
        "documented": "Recorded in an official document, or reported as fact by the outlets the dossier cites, with no competing account in the dossier.",
        "claimed": "A figure or statement asserted by a named party (police, officials, the CJP, organisers, a single outlet) and not contested in the dossier.",
        "alleged": "An accusation of wrongdoing that the dossier records as an allegation, not as established.",
        "disputed": "The dossier records conflicting figures or accounts. Each side is kept as a separate fact or row.",
        "unverified": "The dossier itself flags the item as unverified, single-sourced or without a credible source. Don't chart; show only with the flag.",
    },
    "attribution": ("Every fact keeps its claimant. On screen use the dossier's attribution words: 'police said', 'CJP claims', "
                    "'reported', 'alleged'. Never merge competing figures, never average them."),
    "asterisk": ("Every stat on screen carries an asterisk * that links to its footer entry: claimant, status and source(s). "
                 "Footer entries are generated from source_ids; sources with url null are listed by outlet name only."),
    "crowd_tiers": {
        "basis": "D6: ordinal tiers at the builder's judgement, mapped to a roach count. Tiers encode reported descriptions, not headcounts.",
        "tiers": [
            {"tier": 1, "label": "dozens", "roaches": 40, "matches": "'a few dozen'"},
            {"tier": 2, "label": "hundreds", "roaches": 120, "matches": "'Hundreds', 'hundreds camping', 'hundreds celebrating'"},
            {"tier": 3, "label": "thousands", "roaches": 250, "matches": "'Thousands'"},
            {"tier": 4, "label": "ten thousand or more", "roaches": 400, "matches": "'More than 10,000', 'tens of thousands'"},
        ],
        "null_rule": "crowd_tier null means no count reported: carry the previous tier and show 'no count reported'.",
        "disputed_rule": "Where reports conflict, the tier uses the lower documented description and both reports appear as facts.",
        "config_note": "These roach counts are defaults for roachEncoding; S5 may retune them. Spec S5 caps the largest node at about 400 (max 600).",
    },
    "roach_size": "Spec S5: roach size encodes days elapsed, not crowd size.",
    "founder_roach": "The labelled founder roach is a symbolic marker for Abhijeet Dipke. It is not a position, a tracked person or a headcount.",
    "videos": ("D13: per node, k = 2–4 clips drawn with Python random.Random('F1:<node_id>') from data/timeline_clips.json clips "
               "sorted by id, filtered to the node's date_window (upload date converted to IST) and graphic == false. "
               "Every pick is tagged review: 'pending'. Upload date is not the filming date. "
               "Generator: docs/build/f1/build_story.py."),
    "images": "Wikimedia Commons files in media/cjp-public-images, credited per license. Most protest photos show identifiable faces (see identifiable_faces); IMAGE_SOURCES.md advises considering blurring, and a blurred CC BY-SA image must stay CC BY-SA.",
    "collection_dates": {
        "dossier": "Not stated in the PDF. Its latest event is 7 Nov 2026 and it treats the HPEC report (due about a month after 5 Nov) as pending.",
        "images": "2026-10-22 (IMAGE_SOURCES.md)",
        "video_corpus": "2026-07-21T18:54:05Z (timeline_clips.json meta.generated_at)",
        "ledger_built": "2026-11-11",
    },
    "caveats": [
        F("Several figures rely on Wikipedia summaries of primary reports (The Hindu, Indian Express, BBC); verify against the originals before publishing.", "dossier", "reported", "documented", "dossier", 22),
        F("No official Delhi Police deployment figures were found for 6 June beyond secondary summaries, and none for barricade layers on any date.", "dossier", "reported", "documented", "dossier", 22),
        F("No hashtag-trend analytics or platform-verified reach data exist in the sources found.", "dossier", "reported", "documented", "dossier", 22),
        F("The HPEC’s findings are not yet public; its first report was due about one month after 5 November.", "dossier", "reported", "documented", "barandbench", 22),
        F("Some outlets (Organiser; Zee figures taken from a TV programme; Countercurrents op-ed) have clear editorial positions; they are labelled accordingly.", "dossier", "reported", "documented", "dossier", 22),
        F("One outlet (Christian Daily) misdates the resignation to 2025; disregard.", "dossier", "reported", "documented", "christiandaily", 22),
        F("Wikipedia’s infobox marks the outcome “successful” and lists a 2026 amendment act; several entries carry “failed verification” tags.", "dossier", "reported", "documented", "wikipedia", 22),
        F("PM-announced fast-track courts and a stricter paper-leak law. The Wikipedia infobox lists a Public Examinations (Prevention of Unfair Means) Amendment Act, 2026; independent confirmation is needed.", "dossier", "reported", "unverified", "wikipedia", 12),
    ],
    "disputed_claims": [
        F("20 July violence: police say stone-pelting came first; protesters and CJP videos say police threw stones or charged peaceful crowds. The ASG cited the “stone truck”, which Newslaundry showed was in police custody.", "police / CJP", "disputed", "disputed", "wikipedia", 21),
        F("20 July detentions: police said about 70, then denied any detentions.", "Delhi Police", "police said", "disputed", "wikipedia", 21),
        F("Injury counts: police 118 → 130+ vs. protesters about 60 (police) and about 150 (CJP). The RML figure of about 100 (Newslaundry, citing Indian Express hospital sources) includes 10 police, so it should not be read as “100+ protesters”.", "various", "disputed", "disputed", "dossier", 21,
          note="An Indian Express headline ('More than 100 CJP protesters at RML emergency') conflicts with this caveat, but the article is paywalled, so it is kept out (Vali, 2026-11-12)."),
        F("Crowd sizes: “tens of thousands” vs. “more than 10,000”. No sourced figure was found for a CJP claim of about 20,000 before 20 July, or for 1,000–2,000 police personnel; mark as unverified if used.", "various", "disputed", "disputed", "dossier", 21),
        F("X follower counts: about 90,000 (at blocking), 165,500 (BusinessToday, 21 May) and about 200,000 (BBC) conflict.", "various", "disputed", "disputed", "dossier", 21),
        F("10 October detentions and deployments: they vary by a factor of about 7.", "various", "disputed", "disputed", ["aljazeera", "india"], 21),
        F("Foreign funding: alleged by Jitendra Singh; MEA said it had “no information”; the CJP denies it.", "Jitendra Singh / MEA / CJP", "alleged", "disputed", ["wikipedia", "theweek"], 21),
        F("Vijeta Dahiya’s removal as spokesperson (reportedly for a fast-food break during the clashes): a single Wikipedia-sourced claim; treat as unverified.", "Wikipedia", "reported", "unverified", "wikipedia", 21),
        F("An ink attack on Dipke by a woman chanting Hindutva slogans (mid-July): Wikipedia-sourced only.", "Wikipedia", "reported", "unverified", "wikipedia", 22),
    ],
    "map": {
        "base": "data/map/base.json, built by tools/map/build_basemap.py from OpenStreetMap (Overpass, 2026-11-11). Credit: © OpenStreetMap contributors (ODbL).",
        "crop": "Tight around the story sites (Vali, 2026-11-11). Safdarjung Hospital is off-frame (~6.5 km south).",
        "camera": "Auto zoom in/out per story marker (Vali, 2026-11-11): each node and sub-beat fits the bounds of its site_ids with padding; a single-site beat uses a set close zoom.",
    },
    "web_check": ("2026-11-12: each fact carries links[] (article URLs found by a web agent) and web_check: "
                  "verified | partial | unconfirmed | contradicted. A 'contradicted' fact must not ship until Vali resolves it (GAPS.md). "
                  "Footer links use links[].url where present; Wikipedia section anchors are inferred and need a click-check."),
    "illustrative_graphics": ("Vali approved drawn graphic elements such as barricade lines (2026-11-11). No source records barricade positions on any date "
                              "(dossier p22), so every drawn element not backed by a site or fact is marked 'illustrative' in the map legend, and positions are never presented as factual. "
                              "A fact may trigger a graphic (e.g. 18 Jul 'barricades removed'); the drawing itself stays illustrative."),
    "disclaimer": {
        "status": "approved by Vali 2026-11-12",
        "paragraphs": [
            "Cockroaches is an independent visual reconstruction of the Cockroach Janta Party protest at Jantar Mantar, New Delhi, from 16 May to 25 July 2026. It is not affiliated with, commissioned by or endorsed by the Cockroach Janta Party, any political party or any government body.",
            "Every figure, date and quotation on this page comes from publicly available reporting, linked in the sources below. We did not use paywalled material. Some facts rely on Wikipedia's summaries of news reports; where we could reach the original report, we link it.",
            "Many figures are contested. Where the police, the organisers and the press disagree, we show each claim separately with who made it. We do not average or reconcile them, and an asterisk beside a number leads to its source.",
            "The cockroaches on the map are a visual device. Their number reflects reported crowd descriptions in broad bands, not headcounts; their size reflects days elapsed. The labelled founder roach is a symbolic marker, not a location. Barricades and other drawn map elements are illustrative.",
            "Videos are third-party YouTube uploads, embedded as published; an upload date is not necessarily the date the footage was filmed. Quotations are reproduced verbatim from the cited source, and translations are credited.",
            "Map data © OpenStreetMap contributors (ODbL). Photographs are credited individually.",
            "To report an error: valiullah.hashmi90@gmail.com",
        ],
    },
}

def dump(name, obj):
    (OUT / name).write_text(json.dumps(obj, ensure_ascii=False, indent=2) + "\n")

dump("sources.json", {"sources": sources})
dump("meta.json", meta)
dump("sites.json", sites_doc)
dump("timeline.json", timeline_doc)
dump("epilogue_october.json", epilogue)
dump("metrics.json", metrics_doc)
dump("quotes.json", quotes)
dump("methodology.json", methodology)

# ───────────────────────── web links (2026-11-12) ─────────────────────────
# docs/build/f1/fact_links.json: per-(fact, source) article URLs found and checked by a web agent.
# Attached as fact.links[]; never changes fact text. Contradictions are flagged for Vali, not resolved here.
import re as _re
LINKS = json.loads((ROOT / "docs/build/f1/fact_links.json").read_text())["items"]
link_report = {"attached": 0, "path_mismatch": [], "contradicted": [], "partial": 0, "dropped_with_source": 0}
docs_cache = {}
MANUAL_LINKS = [  # added while resolving the web check (2026-11-12)
    {"file": "timeline.json", "match": "“Hundreds”", "source_id": "theweek", "url": "https://www.theweek.in/news/india/2026/06/06/cockroach-janata-party-cjp-jantar-mantar-protest.html",
     "title": None, "publisher": "The Week", "date": "2026-06-06", "snippet": "drawing hundreds of participants", "verified": True, "notes": ""},
    {"file": "timeline.json", "match": "slogan “We asked", "source_id": "theweek", "url": "https://www.theweek.in/news/india/2026/06/06/cockroach-janata-party-cjp-jantar-mantar-protest.html",
     "title": None, "publisher": "The Week", "date": "2026-06-06", "snippet": "We asked for Make in India, you gave us Leak in India", "verified": True, "notes": ""},
    {"file": "timeline.json", "match": "Dipke approached the Delhi High Court", "source_id": "barandbench", "url": "https://www.barandbench.com/news/cockroach-janta-party-founder-abhijeet-dipke-moves-delhi-high-court-against-blocking-of-x-account",
     "title": None, "publisher": "Bar and Bench", "date": "2026-05-25", "snippet": None, "verified": True, "notes": ""},
    {"file": "timeline.json", "match": "Pradhan, to NDTV", "source_id": "ndtv", "url": "https://www.ndtv.com/india-news/b-team-of-disruptive-elements-education-minister-dharmendra-pradhan-to-ndtv-on-cjp-11675087",
     "title": "B Team Of Disruptive Elements: Education Minister Dharmendra Pradhan To NDTV On CJP", "publisher": "NDTV", "date": "2026-06-23", "snippet": None, "verified": False,
     "notes": "Title from URL slug and search; NDTV blocks fetching."},
    {"file": "timeline.json", "match": "RAF personnel fired seven", "source_id": "thewire", "url": "https://thewire.in/rights/raf-personnel-fired-seven-pellet-gun-rounds-on-july-20-five-hit-protesters-crpf-report-finds",
     "title": "RAF Fired Seven Pellet Gun Rounds on July 20, Five Hit Protesters, CRPF Report Finds", "publisher": "The Wire", "date": None, "snippet": None, "verified": True, "notes": "Checked by Vali 2026-11-12."},
    {"file": "timeline.json", "match": "Delhi Police records show two rounds", "source_id": "wikipedia", "url": "https://en.wikipedia.org/wiki/2026_Delhi_Jantar_Mantar_protests#Delhi_Police_response",
     "title": None, "publisher": "Wikipedia", "date": None, "snippet": "recorded the use of two rounds of pellets on 20 July", "verified": True, "notes": ""},
    {"file": "timeline.json", "match": "Delhi Police records show two rounds", "source_id": "tribuneindia", "url": "https://www.tribuneindia.com/news/delhi/raf-fired-pellet-gun-on-order-of-dcp-at-cjp-protest-general-diary-details-reveal/",
     "title": None, "publisher": "The Tribune", "date": None, "snippet": None, "verified": True, "notes": "Tribune's General Diary report: two pellet rounds."},
    {"file": "timeline.json", "match": "36 days (sit-in)", "source_id": "telanganatoday_0725", "url": "https://telanganatoday.com/jantar-mantar-falls-silent-after-36-day-neet-protest-ends-with-pradhans-resignation",
     "title": None, "publisher": "Telangana Today", "date": "2026-07-25", "snippet": "ended its 36-day protest", "verified": True, "notes": ""},
    {"file": "epilogue_october.json", "match": "Union minister Jitendra Singh", "source_id": "theweek", "url": "https://www.theweek.in/news/india/2026/11/07/its-not-over-dipkes-message-ahead-of-cjp-protest-who-all-to-attend-kochi-jantar-mantar-stir.html",
     "title": None, "publisher": "The Week", "date": "2026-11-07", "snippet": "Why were you negotiating with us then?", "verified": True, "notes": "Carries Ranka's reply verbatim."},
]


def all_facts(o):
    if isinstance(o, dict):
        if "claimant" in o and "text" in o:
            yield o
        for v in o.values():
            yield from all_facts(v)
    elif isinstance(o, list):
        for v in o:
            yield from all_facts(v)


# Facts reworded while resolving the web check: old dossier wording -> new wording (prefix match).
TEXT_REMAP = {
    "Dipke challenged the block in the Delhi High Court": "Dipke approached the Delhi High Court",
    "Pradhan (to NDTV) calls the CJP": "Pradhan, to NDTV, calls the CJP",
    "RAF fired 7 pellet rounds": "RAF personnel fired seven",
    "Abhijeet Dipke ... launched the CJP from the US.": "Abhijeet Dipke … launched the CJP",
    "Das, Ranka, Shinde plus 11 others": "Das, Ranka and Shinde among those",
    "HPEC portal (hpec.nic.in) launched; MHA": "HPEC portal (hpec.nic.in) launched; the SC",
    "In October: “anarchic elements”": "“anarchic elements” and a “flop show”",
}
for it in LINKS:
    for old, new in TEXT_REMAP.items():
        if it["fact_text"].startswith(old):
            it.pop("json_path", None); it["match"] = new
RANK = {"verified": 0, "partial": 1, "unconfirmed": 2, "contradicted": 3}
link_report["dropped_with_source"] = 0
link_report["contradicted"] = []
for it in LINKS + MANUAL_LINKS:
    fname = it["file"]
    doc = docs_cache.setdefault(fname, json.loads((OUT / fname).read_text()))
    node = None
    if "json_path" in it:
        node = doc
        try:
            for tok in _re.findall(r"\.(\w+)|\[(\d+)\]", it["json_path"]):
                node = node[tok[0]] if tok[0] else node[int(tok[1])]
        except (KeyError, IndexError, TypeError):
            node = None
        if not (isinstance(node, dict) and node.get("text", "").startswith(it["fact_text"][:40])):
            hits = [f for f in all_facts(doc) if f["text"].startswith(it["fact_text"][:40])]
            node = hits[0] if len(hits) == 1 else None
    else:
        hits = [f for f in all_facts(doc) if f["text"] == it["match"]] or [f for f in all_facts(doc) if f["text"].startswith(it["match"])]
        node = hits[0] if len(hits) == 1 else None
    if node is None:
        link_report["path_mismatch"].append(it.get("json_path") or it["match"]); continue
    if it["source_id"] not in node.get("source_ids", []):
        link_report["dropped_with_source"] += 1  # the fact no longer cites this outlet
        continue
    if it.get("url") in PAYWALLED_URLS:
        link_report.setdefault("paywalled_dropped", 0); link_report["paywalled_dropped"] += 1
        continue
    notes = it.get("notes") or ""
    node.setdefault("links", []).append({k: it.get(k) for k in ("source_id", "url", "title", "publisher", "date", "snippet", "verified")})
    link_report["attached"] += 1
    if "CONTRADICT" in notes.upper():
        level = "contradicted"
    elif "PARTIAL" in notes.upper():
        level = "partial"; link_report["partial"] += 1
    elif it.get("verified"):
        level = "verified"
    else:
        level = "unconfirmed"
    if RANK[level] >= RANK.get(node.get("web_check"), -1):
        node["web_check"] = level
    if level != "verified" and notes:
        node.setdefault("web_notes", []).append(f"{it['source_id']}: {notes}")
for doc in docs_cache.values():
    for f in all_facts(doc):
        if f.get("resolution") and f.get("web_check") == "contradicted":
            f["web_check"] = "resolved"
        if f.get("web_check") == "contradicted":
            link_report["contradicted"].append(f["text"][:70])
for fname, doc in docs_cache.items():
    dump(fname, doc)
print("links:", {k: (len(v) if isinstance(v, list) else v) for k, v in link_report.items()})
for t in link_report["contradicted"]:
    print("  STILL CONTRADICTED:", t)
if link_report["path_mismatch"]:
    print("  path mismatches:", link_report["path_mismatch"][:10])

# ───────────────────────── validation ─────────────────────────
problems = []
site_ids = {s["id"] for s in sites}
def walk(o, path):
    if isinstance(o, dict):
        if "claimant" in o and "status" in o:
            if not o.get("source_ids"):
                problems.append(f"{path}: no source_ids")
            if o["status"] not in STATUSES:
                problems.append(f"{path}: bad status {o['status']}")
            if not o.get("claimant"):
                problems.append(f"{path}: no claimant")
        for k in ("source_ids",):
            for sid in o.get(k, []) or []:
                if sid not in SRC_IDS:
                    problems.append(f"{path}: unknown source {sid}")
        if "site_ids" in o:
            for sid in o["site_ids"]:
                if sid not in site_ids:
                    problems.append(f"{path}: unknown site {sid}")
        for k, v in o.items():
            walk(v, f"{path}.{k}")
    elif isinstance(o, list):
        for i, v in enumerate(o):
            walk(v, f"{path}[{i}]")
for name in ["meta", "sites", "timeline", "epilogue_october", "metrics", "methodology"]:
    walk(json.loads((OUT / f"{name}.json").read_text()), name)
for n in nodes:
    vids = [m for m in n["media"] if m["type"] == "youtube"]
    if n["id"] not in KINETIC_NODES and not (2 <= len(vids) <= 4):
        problems.append(f"timeline.{n['id']}: {len(vids)} videos (pool {pool_sizes[n['id']]})")
print("pool sizes:", pool_sizes)
print("PROBLEMS:" if problems else "OK: all checks passed")
for p in problems:
    print("  ", p)

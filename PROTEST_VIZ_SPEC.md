# CJP Jantar Mantar Protest: Scrollytelling Build Spec (v1)

Desktop-only scrollytelling data visualisation about the Jantar Mantar protest and the Cockroach Janta Party (CJP). Designed and sketched by Vali. Built by Claude Code from this document.

---

## 0. Kickoff prompt (paste this into Claude Code)

```
Read PROTEST_VIZ_SPEC.md fully before writing code.

Step 0, recon (no building yet):
1. Search this project folder for: the data files (json/csv/geojson), the existing cockroach vector animation code (search for roach, cockroach, crawl, walk, sprite), image/video assets, and the sourcing/credits data.
2. Write BUILD_NOTES.md with: a file inventory, the field mapping from the real data to the data contract in section 4, anything the spec needs that the data does not have, and any claim on screen that has no source id.
3. Stop and show me BUILD_NOTES.md. Then build milestone by milestone (section 9), committing or checkpointing after each.

Rules: never invent data, quotes, numbers or sources. Reuse the existing roach animation code; do not rewrite it. When the spec says DEFAULT and I have not overridden it, use the default and log it in BUILD_NOTES.md. Ask me only when blocked.
```

---

## 1. Brief

**What it is:** a single long page. A swarm of cockroaches (the movement's own symbol) becomes the data: each roach is a protester marker. The reader scrolls from a quote, to the birth of the movement, to a day-by-day map of the Jantar Mantar protest, to the victory, then a small series of D3 charts, quotes from Indian activists and poets, a call to follow CJP, and credits.

**Core idea:** one recurring motif (the roach) carries the whole story: it is the type effect, the date, the map marker, the data point.

**Audience and device:** desktop only. Minimum supported viewport 1280x720. No mobile layout.

**Tone:** serious, rugged, protest-poster energy; playful only in the roach motion.

---

## 2. Legend and decisions log

Every instruction in this doc carries one of these tags so you know where it came from.

| Tag | Meaning |
|---|---|
| `SKETCH` | Read directly from Vali's hand sketches |
| `CONFIRMED` | Vali clarified this in chat |
| `DEFAULT` | Proposed value so you can build now; Vali can override |
| `ADDED` | Not in the sketch; small addition for usability or robustness. Strike if unwanted |

Confirmed decisions:

1. Date format is `dd/mm/yyyy`, set in a bold typeface. It is the day the official Jantar Mantar protest started. Read it from data. `CONFIRMED`
2. The click trigger is a click on the word "cockroach" inside the quote. `CONFIRMED`
3. The map is a 2D map of the Jantar Mantar area and other sites around it, used to tell the protest scene by scene with factual data. `CONFIRMED`
4. The charts are D3.js and their data already lives in the project folder. `CONFIRMED`
5. The struck-through words in the quotes line of the sketch are cut. Quotes are from Indian activists and poets only. `CONFIRMED`
6. CJP is the Cockroach Janta Party. `CONFIRMED`
7. Scroll model: scroll position is the single source of truth; the timeline scrubber reflects it and can also drive it (section 6). `CONFIRMED`
8. Desktop only, no mobile view. `CONFIRMED`
9. The date is formed by the existing cockroach vector animations walking on the skeleton of the typeface. `CONFIRMED`
10. Sourcing is already in the data files. `CONFIRMED`

---

## 3. Tech and architecture

`DEFAULT` unless the existing code in the folder already uses something else (if it does, keep it and log it).

- **Build:** Vite, vanilla JS (ES modules). No framework needed.
- **Scroll:** GSAP + ScrollTrigger for pinning and scrubbing (or scrollama if already in the folder). One scroll controller.
- **Charts and map:** D3 v7 (`d3-geo`, `d3-zoom`, `d3-scale`, `d3-shape`, `d3-hierarchy`).
- **Swarm and roaches:** Canvas 2D, one shared full-viewport canvas for the prologue (S0 to S4). Map is SVG (paths) with a canvas overlay for roach markers. Charts are SVG.
- **Existing roach code:** wrap it, do not rewrite it. Create `src/roach/Roach.js` exposing the interface below. If the existing animation is SVG or frame-based, pre-render the walk cycle to an offscreen sprite atlas (e.g. 12 frames at 3 sizes) and draw with `drawImage` for performance.

```js
// Required Roach interface (adapt existing code to this)
roach.x, roach.y, roach.heading, roach.size, roach.speed, roach.opacity
roach.update(dt)            // walk cycle + movement
roach.draw(ctx)
roach.setPath(pathSampler)  // walk along a polyline (used for the date skeleton)
roach.setTarget(x, y)       // steer toward a point (used for converge / map landing)
```

Suggested structure:

```
index.html
src/
  main.js                 // boot, desktop gate, scene registry
  scroll/controller.js    // single scroll owner, progress per scene
  scenes/
    s0-hero.js  s1-quote.js  s2-spawn.js  s3-multiply.js  s4-date.js
    s5-map-stage.js  s6-finale.js  s7-charts.js  s8-quotes.js  s9-cta.js  s10-footer.js
  roach/                  // wrapper over the existing code
  lib/ glitch.js  halftone.js  skeleton.js  swarm.js  scrubber.js
  data/ adapters.js       // maps real files to the contract in section 4
  styles/ tokens.css  base.css
scripts/bake-skeleton.mjs // offline: typeface to skeleton JSON
BUILD_NOTES.md
```

Scene module contract:

```js
export default {
  id, range,                 // set by controller from the budget in section 6
  init(ctx),                 // build DOM/canvas once
  enter(direction),          // direction: 'down' | 'up'
  update(p, dt, ctx),        // p in 0..1 across this scene's scroll range
  exit(direction),
  resize(),
  destroy()
}
```

**Determinism rule:** `update(p)` must produce the same frame for the same `p` regardless of how the user got there (scroll back, jump, drag scrubber). The only exception is the timed click sequence in S2, which has an explicit `done` flag and reset rule.

---

## 4. Data contract

Claude Code: do not assume file names. Inspect the folder, then write `src/data/adapters.js` mapping the real files to this logical model. List every missing field in BUILD_NOTES.md. Never fabricate.

```
meta
  title, protest_start_date (ISO)            // drives the S4 date
  cji_quote { text, speaker, date, source_id, keyword }   // keyword: "cockroach"
  founder { name, source_id }                // sketch: Abhijit Dipke
  handles[ { platform, url, label } ]        // CJP social handles
  designer_credit                            // default: "Design and development: Vali Hashmi"

sites[]      { id, name, lat, lon, type, footprint? (GeoJSON), note? }
base_map     // GeoJSON or SVG for the Jantar Mantar area; if missing, STOP and report, do not fetch tiles

timeline[]   { id, order, label, date, title, summary,
               facts[ { text, value?, unit?, source_id } ],
               site_ids[], headcount?, route?,
               media[ { type: 'image'|'youtube', src|youtube_id, caption, credit, source_id } ],
               people[ { name, role, image?, source_id } ],
               sub_beats?[ ... ], camera? }

finale       { date?, headline: "Victory", line, source_id }   // sketch: "Dharmendra Pradhan resigns"

charts       { line:{...}, bubble:{...}, stream:{...} }        // map real columns in BUILD_NOTES.md
quotes[]     { text, original_text?, language?, author, role: 'activist'|'poet', year?, work?, source_id }
sources[]    { id, title, publisher, url, date, note }
methodology, disclaimer, credits
```

**Editorial guardrails** (real people and a sitting judge are named):

- Quotes are rendered verbatim from data. No trimming without ellipsis, no paraphrase.
- Every number and factual claim on screen carries a `source_id` and a small `[n]` marker that links to the numbered source list in the footer.
- Headcounts are labelled as reported or estimated, per the data.
- Any on-screen claim with no source id must be listed in BUILD_NOTES.md under "Unsourced claims" and shown to Vali before ship.
- The labelled roach for the founder is a symbolic marker. The methodology footer must say so.

---

## 5. Visual system

All tokens in `src/styles/tokens.css` so Vali can retune in one place.

- **Backdrop:** a rugged halftone texture, generated once into an offscreen canvas and tiled. `SKETCH`
  - Method `DEFAULT`: noise field thresholded into a 45 degree dot screen, cell 6 to 8px, dot radius jittered 15% for a rough print feel, plus faint paper grain. Subtle parallax (0.1x scroll). Optional: density increases slightly as the roaches multiply.
- **Palette** `DEFAULT`, easy to flip: light newsprint paper (`--bg` around `#e9e4d8`), near-black roaches and type (`--ink` around `#111`), one accent for emphasis and the glitch channel split (`--accent`, protest red). Reason: black roaches read best on light stock. Vali to confirm or flip to dark.
- **Display typeface:** a bold typeface, variable `--font-display`. Vali has not named one. `DEFAULT`: use any heavy grotesque already in the folder; otherwise Archivo Black, and log the choice. It must have clean, open digits 0 to 9 and "/" because the date skeleton is baked from it.
- **Text face:** a neutral grotesque or serif for body and quotes (`--font-text`). For quotes in Indian scripts, load matching Noto families (Devanagari, Nastaliq or Naskh for Urdu, and others found in the data).
- **Motif rule:** the roach is the only recurring illustration. Charts stay legible; do not replace chart marks with roaches.
- **Hatched strip:** the scrubber track uses a diagonal hatch pattern. `SKETCH`

---

## 6. Scroll model and budget

**Scroll owner:** document scroll. One controller converts `scrollY` into per-scene progress `p`.

**Pinned stages:** Prologue (S0 to S4), Map Stage (S5), Finale (S6). Each is a sticky/pinned full-viewport stage with a spacer sized from the budget. Charts use short sticky stages per chart.

**Scrubber (S5):** a view and a control over the same scroll position. Dragging maps pointer x to `scrollTo(...)` inside the S5 range. Clicking a node marker animates scroll to that node (800ms, easeInOutCubic). Never keep a second timeline state.

**No nested scrolling:** the right-hand rail in S5 does not scroll independently; its content advances with page scroll.

Scroll budget (`DEFAULT`, in viewport heights; tune freely):

| Scene | Name | Pinned | Length |
|---|---|---|---|
| S0 | Hero: swarm and glitch word | Prologue | 80vh |
| S1 | CJI quote and the click | Prologue | 150vh |
| S2 | Collapse and spawn | Prologue | 60vh (plus timed sequence) |
| S3 | Multiply | Prologue | 180vh |
| S4 | Date on the skeleton | Prologue | 180vh |
| | **Prologue total** | | **650vh** |
| S5 | Map stage | yes | 880vh (60 lead-in, 100 start, 260 protest, 110 Wangchuk, 110 detention, 110 protest and arrest, 70 victory, 60 lead-out) |
| S6 | Finale | yes | 260vh |
| S7 | Charts | per chart | 3 x 170vh |
| S8 | Quotes | per quote | N x 100vh |
| S9 | CTA | no | 100vh |
| S10 | Footer | no | auto |

Prologue sub-ranges of master progress: S0 0.00 to 0.12, S1 0.12 to 0.35, S2 0.35 to 0.45, S3 0.45 to 0.72, S4 0.72 to 1.00.

---

## 7. Scenes

Convention in keyframe tables: `p` is progress inside that scene. "Vali's notes" blocks are for Vali's frame-by-frame additions; when filled they override the keyframes above them.

### Persistent layers in the Prologue (S0 to S4)

One fixed full-viewport canvas stack, shared so the same roaches carry through every scene:

1. Halftone backdrop (CSS background or canvas)
2. Text layer (DOM for the quote, offscreen canvas for glitch and skeleton text)
3. Swarm canvas (roaches)
4. Annotation layer (labels, brackets)

---

### S0. Hero: the swarm and the glitch word `SKETCH`

**Purpose:** establish the roach as an alive, unsettling, slightly comic swarm, and the word "cockroaches" as the title.

**State in:** page load. Halftone backdrop visible. The word "cockroaches" centred, very large, in `--font-display`. A field of roaches wandering across the whole viewport.

**Swarm** `DEFAULT`: about 420 roaches at 1440x900 (scale with viewport area, cap 700). Size 8 to 14px. Speed 40 to 90px/s. Heading follows smooth noise so paths curve naturally. Cursor flee radius 90px (`ADDED`, cheap and makes it feel alive).

**Glitch effect** `SKETCH`: when a roach crosses the word, the letters around it glitch. Implementation `DEFAULT`:

- Render the word to an offscreen canvas once per resize.
- Each frame, for each roach overlapping the word's bounding box and the glyph mask, queue a glitch at that point.
- A glitch is: horizontal slice displacement of the word image in a band 6 to 14px tall within 40px of the roach, offset by plus or minus 6 to 18px, plus an RGB channel split of 2 to 4px using `--accent`. Lifetime 220 to 380ms with decay.
- Cap total displaced area at 35% of the word so it always stays readable.

| p | What happens |
|---|---|
| 0.00 | Swarm roaming, word static and centred, glitches firing |
| 0.00 to 0.60 | Hold. Subtle scroll cue at bottom centre (`ADDED`: tiny roach and the word "scroll") |
| 0.60 to 1.00 | Word scales 1.0 to 0.8, lifts 12% and fades to 25% opacity; swarm slows by 30% and thins to 40% density; the quote begins to enter (S1) |

**Done when:** roaches visibly cause letter glitches; word stays legible; 60fps at 1440x900.

> **Vali's notes (S0):** _add precise frame notes here_

---

### S1. The CJI quote and the click `SKETCH` + `CONFIRMED`

**Purpose:** the quote that names the movement's symbol. The reader clicks the word to trigger the origin.

**Content:** `meta.cji_quote.text` verbatim, with speaker, date and source marker. The word in `meta.cji_quote.keyword` (first occurrence, case-insensitive, whole token) is wrapped in a `<button class="kw">`.

**Keyword affordance** `DEFAULT`: wavy underline, 1px idle jitter, a tiny roach crawling along the underline, pointer cursor, visible focus ring, `aria-label="Click the word cockroach to continue"`. After p 0.4, a small hint appears: "click the word" (`ADDED`).

| p | What happens |
|---|---|
| 0.00 to 0.15 | Quote enters: opacity 0 to 1, translateY 24px to 0, words reveal staggered 25ms each. Hero swarm continues faintly behind (25% opacity, 40% count) |
| 0.15 to 0.90 | Hold. Keyword idle animation. Hint appears at 0.4 |
| 0.92 | If the keyword has not been clicked, auto-trigger S2 (`ADDED`, prevents anyone getting stuck) |

**Interaction:** click or Enter/Space on the keyword starts the S2 timed sequence.

**Done when:** keyword is keyboard and mouse operable; quote text matches data exactly; hint and auto-trigger work.

> **Vali's notes (S1):** _add here_

---

### S2. Collapse and spawn: "Abhijit Dipke is spawned" `SKETCH`

**Purpose:** the word becomes a living roach; the first roach is the movement's founder. This is a **timed sequence**, not scroll-scrubbed.

**Rules:** scroll input is locked for the duration (max 3.2s) so scroll and animation cannot desync. Sequence sets `s2.done = true`. Scrolling back above S1 p 0.5 resets `done` and restores the quote. Replay is allowed.

| t (ms) | What happens |
|---|---|
| 0 | Click registered |
| 0 to 400 | Keyword is emphasised: scale 1.0 to 1.15, accent colour, letter-spacing opens slightly |
| 0 to 600 | Rest of the quote fades to blank. Remaining hero-swarm roaches speed up and crawl off the nearest screen edges |
| 400 to 1400 | Keyword collapses: letters shrink toward the word's centroid (sample letter pixels into particles that stream to the centroid) while the existing roach vector animation fades in at that point and starts crawling |
| 1400 to 2400 | The roach walks to the lower-third of the viewport |
| 2000 to 3000 | A label attaches: `${founder.name} is spawned`, name in bold, small source marker |
| 3200 | Sequence ends, scroll unlocks |

After the sequence, over the remaining 60vh of S2 scroll: the single roach idles (slow circular crawl), label holds, and at p 0.7 the label fades and the roach begins to split into S3.

**Done when:** one roach on screen, labelled, nothing else; sequence is replayable; no scroll desync.

> **Vali's notes (S2):** _add here_

---

### S3. Multiply `SKETCH`

**Purpose:** one becomes many.

**Count curve** `DEFAULT`: `n(p) = round(Nmax ** p)` with `Nmax = 380`. At p 0 there is 1 roach; at p 1 about 380. Spawn animation: a new roach emerges from a parent, scale 0 to 1 over 250ms, then disperses radially and wanders. Roaches face varied headings as in the sketch.

| p | What happens |
|---|---|
| 0.00 | Single roach, label gone |
| 0.10 | First split (2) |
| 0.10 to 0.85 | Exponential growth, swarm spreading from the origin outward until it fills the viewport |
| 0.85 to 1.00 | Full swarm, cursor flee on, ready to converge |

Must be scrub-safe: scrolling up removes roaches deterministically (the most recently born leave first, walking back into their parent).

**Done when:** count tracks `p` both directions; no popping; stays 60fps.

> **Vali's notes (S3):** _add here_

---

### S4. The date, formed by roaches on the typeface skeleton `SKETCH` + `CONFIRMED`

**Purpose:** the protest's start date, `dd/mm/yyyy`, set bold, built from roaches walking on the skeleton of the glyphs.

**Date source:** `meta.protest_start_date`, formatted `DD / MM / YYYY` with slashes. Full four-digit year.

**Skeleton pipeline** `DEFAULT`:

1. `scripts/bake-skeleton.mjs`: load the display font (opentype.js), rasterise glyphs `0-9` and `/` at 400px, thin to a one-pixel skeleton (Zhang-Suen or similar), vectorise to polylines, simplify (RDP epsilon about 1.5). Output `skeleton.json` with `{ glyph: { paths: [[x,y]...], advance, bbox } }`.
2. Runtime `lib/skeleton.js`: lay out the string with tracking, scale so digit height is about 38% of viewport height, arc-length parametrise every path, create slots every `roachLength * 0.55`. De-duplicate slots within 0.4 of spacing at junctions so "4" and "8" are not double-dense.
3. Each roach is assigned a slot (deterministic seed, nearest-first greedy), then uses `roach.setPath()` to walk along its local segment. Heading follows the tangent; half the roaches walk in reverse for variety.
4. Corner brackets drawn as thin lines around the date. `SKETCH`

| p | What happens |
|---|---|
| 0.00 to 0.45 | Converge: roaches steer to their slots, staggered by distance so far ones arrive last. Surplus roaches (those without a slot) crawl off the screen edges |
| 0.45 to 0.80 | Hold: roaches ping-pong over roughly 6px along their segment so the letters shimmer yet stay legible. Corner brackets draw in at 0.50 (400ms equivalent stroke draw). Caption fades in beneath: "The day the protest at Jantar Mantar officially began" (`ADDED`, with source marker) |
| 0.80 to 1.00 | Release: roaches peel off left to right toward their map landing points, backdrop cross-dissolves to the map stage, the date shrinks to a small HUD readout at top-left of the stage |

**Legibility check:** at 1440x900 the date must be readable at a glance at p 0.6. If not, raise slot density or roach size, not the typeface weight.

**Done when:** date reads correctly; roaches visibly walk along strokes; release flows into S5 with no jump.

> **Vali's notes (S4):** _add here_

---

### S5. Map stage: Jantar Mantar day by day `SKETCH` + `CONFIRMED`

**Purpose:** tell the protest scene by scene with factual data on a 2D map. Roaches are the protester markers.

**Layout** (viewport-sized, pinned) `SKETCH`, `DEFAULT` proportions at 1440x900:

```
+--------------------------------+-------------------+
|                                |  RAIL             |
|   2D MAP (fixed frame)         |  image / video    |
|   Jantar Mantar + nearby sites |  fact blocks      |
|   roach markers                |  key people       |
|                                |                   |
+--------------------------------+-------------------+
|  TIMELINE SCRUBBER (hatched strip, 96px)           |
+----------------------------------------------------+
```

Map about 62% width; rail about 38%; scrubber full width. The sketch labels the right column "scroll area". Interpretation `DEFAULT`: the rail content is **scroll-driven** (cards advance with page scroll), not an independently scrollable box.

**Interpretation to confirm:** the sketch note says this section "shows a mix of YouTube videos along with facts and figures as separate text blocks". Built as: each rail card can hold a YouTube embed and/or separate fact blocks. If Vali meant a separate panel below the scrubber, the card component is reusable; move it.

**Map** `DEFAULT`:

- `d3.geoMercator().fitExtent()` over the bounds of `sites` with padding. No raster tiles, no network calls. Base map from the data folder; if absent, stop and report.
- Line-art style with the halftone feel: thin ink strokes for roads and footprints, no fill or a light screen tint. Sites get small labels.
- Camera: `d3.zoom` transform interpolated with `d3.interpolateZoom`, driven by scroll progress (scrubbed, not time-based). Each node focuses on `fitBounds(node.site_ids)` unless `node.camera` is given.

**Roach markers** `DEFAULT`:

- Count encodes protester numbers: `ceil(headcount / perRoach)`, with `perRoach` chosen so the largest node is about 400 roaches (cap 600). If a node has no headcount, carry the previous count and show "no count reported".
- Size encodes days elapsed: `size(day) = lerp(6px, 28px, easeOutCubic(day / maxDay))`. `SKETCH`: "show cockroaches growing in size as the days go by".
- Roaches cluster at the node's `site_ids`, idle-walk within the site footprint.
- Both encodings live in one config object `roachEncoding` so Vali can change them. A legend (small, bottom of map) explains them (`ADDED`).

**Day readout** `ADDED`: small HUD at top-left of map: the date from S4 plus "Day N", updating continuously from the scrubber.

**Scrubber** `SKETCH`:

- Hatched strip track. Ticks per day, longer tick weekly. Node markers (filled circle, label with date and short title, alternating above and below to avoid collision).
- Handle: vertical bar with a small roach riding it.
- **Time mapping:** the time axis is a real `d3.scaleTime`; scroll maps piecewise-linearly inside each node to the interpolated date between that node's date and the next node's date. So handle position follows real dates even though each node gets equal scroll.
- Drag: pointer capture, maps x to date to scroll position, no second timeline state. Click a marker: animated scroll. Release within 10px of a marker snaps to it (`ADDED`).
- Keyboard: it is `role="slider"` with `aria-valuetext` "Day N, node title"; arrow keys step by node.

**Rail card** (one per node): kicker (date and "Day N"), title, media block (image with caption and credit, or YouTube poster), 2 to 4 separate fact blocks (large value, label, source marker), people chips with photos for key individuals. `SKETCH`: images of key individuals and events.

**YouTube behaviour** `DEFAULT`: click-to-load poster (no iframe until clicked), `youtube-nocookie.com/embed/ID?rel=0&modestbranding=1&playsinline=1`. Only one iframe alive at a time. Pause and unload when the node exits. Never autoplay with sound.

**Lifecycle and nodes**

| Segment | Length | What happens |
|---|---|---|
| Lead-in | 60vh | Backdrop cross-dissolve to map; base map strokes draw on; released roaches land on the Jantar Mantar site as the first cluster; scrubber slides up from below (translateY 96px to 0); HUD date appears |
| 1. Start: how it began | 100vh | Camera on the first site. Card explains how it began. First cluster only |
| 2. Protest | 260vh | Three sub-beats: **2a** the protest with a YouTube embed; **2b** growth, roach count and size climb visibly; **2c** key moments, camera moves across the relevant sites and highlights them in turn |
| 3. Sonam Wangchuk | 110vh | Card with his image and facts; highlight relevant site |
| 4. Detention | 110vh | Detention site(s) highlighted; route drawn as an animated dashed path if `route` exists in data; roaches move or thin out per data |
| 5. Protest and arrest | 110vh | Return to protest site, arrest data and facts |
| 6. Victory | 70vh | Map holds the final state with the largest roaches; card with the resolution facts; scrubber reaches the end |
| Lead-out | 60vh | Map and rail dissolve out; backdrop returns for the finale |

Within each node: in 0 to 0.20 (camera tween, site pulse, card enters from below), hold 0.20 to 0.85, out 0.85 to 1.00 (overlaps the next node's in). Node count and labels come from the data; the sketch's six nodes are the default. If the data has more events, use `sub_beats`.

**Done when:** map and rail stay in sync with scrolling and with scrubber drag; roach size and count change as specified; no iframe leaks; scrub backward is identical to forward.

> **Vali's notes (S5):** _add precise per-node frame notes here_

---

### S6. Finale: the date returns, Victory `SKETCH`

**Purpose:** the payoff. Pinned, 260vh.

**Date:** `data.finale.date` if present, otherwise `meta.protest_start_date`. (Open item O1.)

| p | What happens |
|---|---|
| 0.00 to 0.30 | Map stage gone; halftone backdrop returns; the large roaches walk in and the date re-forms on the skeleton using the S4 engine with a faster converge |
| 0.30 to 0.55 | Date holds, brackets drawn, roaches shimmer |
| 0.55 to 0.75 | The word "Victory" appears beneath in the bold typeface; the roaches calm |
| 0.75 to 1.00 | The line from `finale.line` appears (sketch: "Dharmendra Pradhan resigns") with its source marker. Roaches begin to peel away toward the next section |

**Done when:** the line is exactly the data text with a source marker; if there is no `source_id`, log it under "Unsourced claims" in BUILD_NOTES.md.

> **Vali's notes (S6):** _add here_

---

### S7. Charts: a small series of facts `SKETCH` + `CONFIRMED`

**Purpose:** step back from the story into the numbers. Three D3 charts, each in a short sticky stage (170vh).

**Chart types from the sketch icons** `SKETCH`: (A) a line chart with peaks, (B) a bubble chart with clustered circles, (C) a layered, stream-like or stepped area chart.

**Data:** already in the folder. Step 1 of this scene is to inspect the files and write a column mapping to BUILD_NOTES.md (what x, y, series, size are). If the data does not suit a sketched type, build the sketched type anyway if feasible and note an alternative in BUILD_NOTES.md.

**Section kicker:** the sketch has a heading "media engagement and development". `DEFAULT`: use "Media engagement" as the kicker above the charts. Vali to confirm placement (O3).

Each chart stage layout: chart about 68% width on the left; a short stack of fact callouts about 28% on the right; kicker and title above.

| p (per chart) | What happens |
|---|---|
| 0.00 to 0.20 | Title, kicker and axes enter |
| 0.20 to 0.70 | Scrubbed draw-in. Line: draws left to right. Bubbles: grow in staggered by value. Stream: layers rise. Fact callouts appear in step |
| 0.70 to 1.00 | Hold; hover tooltips active at all times |

Optional link back to the story (`ADDED`): on the line chart, draw thin vertical markers at the story's node dates labelled with the node titles.

Standards: axes labelled with units; tooltips show value, date and source; colour from tokens, not decorative; reduced-motion shows final state immediately.

**Done when:** three charts render from real data, animate with scroll, are hover-inspectable, and match the data exactly.

> **Vali's notes (S7):** _add here_

---

### S8. Quotes on protest `SKETCH` + `CONFIRMED`

**Purpose:** voices. Quotes on protest from famous Indian activists and poets. No dead-or-personal qualifiers; they were cut in the sketch. Only items in `quotes[]`.

**Layout** `DEFAULT`: one quote per 100vh, large text, left aligned, attribution beneath with a role chip (Activist or Poet), year and work when present, source marker. If `original_text` exists, show it in its own script above the translation with the correct font. Crossfade between quotes with a slight halftone density shift. A single roach idles on the attribution line (`ADDED`, optional).

**Done when:** every quote is verbatim from data, with attribution and a working source link.

> **Vali's notes (S8):** _add here_

---

### S9. CTA: follow CJP and share `SKETCH` + `CONFIRMED`

**Content** `DEFAULT`:

- Headline: "Follow the Cockroach Janta Party" with one button per entry in `meta.handles` (open in a new tab, `rel="noopener noreferrer"`).
- "Share this visualisation": Copy link (with a confirmation toast), native share via `navigator.share` when available, plus intent links for X, WhatsApp and LinkedIn.
- Page `<head>`: title, description, Open Graph and Twitter card tags (image placeholder path in BUILD_NOTES.md).

**Done when:** all links resolve, copy link works, no tracking scripts.

> **Vali's notes (S9):** _add here_

---

### S10. Footer: credit, methodology, disclaimer `SKETCH`

Three underlined section headings as in the sketch: **Credit**, **Methodology**, **Disclaimer**. Content from `meta.designer_credit`, `credits`, `methodology`, `disclaimer`. Below: the numbered **Sources** list from `sources[]`; every `[n]` marker on the page links to its entry, and each entry links back.

Methodology must state: how roach count and size are encoded, that the founder roach is symbolic, which figures are reported versus estimated, and the data collection dates.

**Done when:** every `[n]` marker resolves; no unused sources; the disclaimer is present without edits.

> **Vali's notes (S10):** _add here_

---

## 8. Cross-cutting requirements

**Desktop gate** `ADDED`: under 1024px viewport width, show a static screen: "This experience is built for desktop. Please open it on a larger screen." Do not build any mobile layout.

**Accessibility**

- The keyword button is fully keyboard operable; every interactive element has a visible focus state.
- The scrubber is a labelled slider (section 7, S5).
- Images have alt text from `caption`; videos are click-to-load with titles.
- `prefers-reduced-motion`: replace the swarm with a static composition, scenes become static sections, charts show the final state; the keyword still works and crossfades instead of collapsing.
- Text contrast at least WCAG AA against the halftone (check body and captions; keep the halftone low-contrast behind text).

**Performance**

- Target 60fps at 1440x900 on an M-series Mac; check at 1280x720, 1920x1080, 2560x1440.
- Pause every canvas loop when its scene is off-screen. Cap roach count by measured frame time: if the average frame exceeds 20ms for 2 seconds, drop the roach count by 15%.
- Debounce resize (150ms) and rebuild canvases, projection and skeleton slots.
- Lazy-load images and iframes. First meaningful paint (hero) under 3 seconds on a normal connection.

**Robustness**

- Missing optional data (route, headcount, image) must degrade gracefully with no console errors and no empty boxes.
- No console errors or warnings in production build.
- No external network calls at runtime except YouTube embeds the reader explicitly starts, and fonts if self-hosting is not possible (prefer self-host).

---

## 9. Milestones and QA

Work in this order. After each milestone: run the dev server, take screenshots at 1440x900 and 1280x720, confirm "Done when" for each scene, and update BUILD_NOTES.md.

| # | Milestone | Exit check |
|---|---|---|
| M0 | Recon: inventory, data mapping, missing fields, unsourced claims | BUILD_NOTES.md reviewed by Vali |
| M1 | Shell: Vite, scroll controller, scene registry, placeholders with correct scroll budgets, desktop gate, tokens, halftone backdrop | Scrolling through placeholder scenes gives correct `p` values |
| M2 | S0 hero: swarm, word, glitch | Glitch reads well, 60fps |
| M3 | S1 to S3: quote, click, collapse, spawn, multiply | Sequence replayable; scrub-safe multiply |
| M4 | S4: skeleton bake and the date | Date legible, roaches walk strokes |
| M5 | S5: map stage, rail, scrubber, YouTube | Scroll and scrubber stay in sync; encodings correct |
| M6 | S6: finale | Date to Victory to line, sourced |
| M7 | S7: three D3 charts | Matches data; hover and scroll animation |
| M8 | S8 to S10: quotes, CTA, footer, source linking | All `[n]` markers resolve |
| M9 | Polish, perf, a11y, reduced motion, cross-viewport QA, production build | Checklist below |

**Final checklist**

- [ ] Every scene matches its "Done when"
- [ ] Scroll up and down, and scrubber jumps, always give identical frames
- [ ] All data on screen traces to a source id; unsourced claims list is empty or approved
- [ ] No fabricated text anywhere (search for lorem, TODO, placeholder strings)
- [ ] 60fps, no console errors, reduced-motion works
- [ ] 1280x720, 1440x900, 1920x1080, 2560x1440 all look intentional

---

## 10. Open items (defaults apply until Vali answers)

| # | Question | Default used |
|---|---|---|
| O1 | Does the finale show the same date as S4, or a resolution date? | `finale.date` if present, else the start date |
| O2 | Roach encoding: does size mean days and count mean headcount? | Yes, both, in one config object |
| O3 | Where does the sketch heading "media engagement and development" belong? | Kicker above the charts section |
| O4 | Is the YouTube and facts block in the rail or below the scrubber? | In the rail as scroll-driven cards |
| O5 | Display typeface and final palette | Heavy grotesque from the folder, else Archivo Black; light paper, black ink, red accent |
| O6 | Roach behaviour after the click: do all hero roaches leave, or only some? | All remaining hero roaches crawl off |
| O7 | Label copy for the founder roach | "`${founder.name}` is spawned" |

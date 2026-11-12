# Research: SITU "Euromaidan Event Reconstruction" map

Fetched 2026-11-11 from http://maidan.situplatform.com/report/3 (also /report/21, /report/23), its JS/CSS, and its S3 assets.
Tags: **[seen]** = read in fetched code/HTML/images. **[inferred]** = my deduction.

## Summary

- **The "map" in the Overview is not a live map.** `basemap_off: true`, `layers: []`, `raster: []` on report 3. The left 60% is a `.map_view` div into which pre-rendered, muted, autoplaying MP4s (plus PNG posters, 1104x1152) are swapped as you scroll the text column. **[seen]**
- Live Leaflet is only used on the Archive page (report 21): `L.circleMarker` points for video cameras and deaths on a greyscale OSM tile base, with a d3 timeline beneath. The Cases page (23) is static `ai2html` artboards over PNG basemaps. **[seen]**
- Stack is 2016-era and dated: jQuery 1.10, Leaflet 1.0.0-b1, d3 v4, video.js 5.6, Express/nginx server, assets on S3. No build step on the client, but no public repo for the platform. **[seen]**
- The look comes from the **basemap artwork**, not code: a CAD-derived plan (site-survey drawing) flattened to light-grey fills and hairlines, with a few saturated overlays (blue crowd heat, red radii) and white-on-black label tags. Fully reproducible in SVG. **[seen]**
- Reuse: take the design ideas, not the code or assets. No licence is stated anywhere, so default copyright applies. Dependencies (Leaflet BSD-2, d3-tip MIT, canvid MIT) have their own licences but we need none of them. **[seen / inferred]**

## Stack (with evidence)

From `view-source:http://maidan.situplatform.com/report/3` **[seen]**:

- Server: `Server: nginx/1.4.6 (Ubuntu)`, `X-Powered-By: Express`. Server-rendered HTML with a `report_object` JSON blob inlined (`var report_object = {...}`), plus `report_object.attached_timeline_csv` (the whole timeline as CSV rows in JSON). CMS-like: layers, raster, icons, `s3_bucket: "maidan1.situ.mapping"`.
- Libs in `<head>`: `leaflet-1.0.0-b1`, `jquery-1.10.1`, `jquery-ui 1.10.3`, `d3.v4.min.js`, `video.js 5.6.0`, `moment.min.js`, `leaflet.markercluster`, `leaflet.label`, `leaflet.textpath`, `d3-tip.js` (Justin Palmer, MIT), `canvid.js`, `jquery.mCustomScrollbar`, a custom `Bing.js` (`L.BingLayer = L.TileLayer.extend`), Font Awesome 4.0.3, Roboto 300/400/700. Analytics: Google Universal Analytics `UA-79647304-3`.
- App code: single file `/javascripts/specific/alternate_frontend.js` (66 KB, unminified, jQuery `$(document).ready`). CSS: `/stylesheets/frontend.alternate.css` (20 KB).
- Hosting: videos/posters/basemaps on `https://s3.amazonaws.com/maidan1.situ.mapping/...`; raster tile code points at `http://maidan1_tiles.situplatform.com/{name}/{z}/{x}/{y}.png` (unused on the pages fetched, since `raster` is empty). Backend references `http://situplatform.com:7012/`.
- Repos/write-ups: GitHub `SITU-Research` has one public repo, `codec` (AGPL-3.0, "collaborative tool for managing video evidence"), which is a different tool. No repo for this platform found. SITU project page (https://situ.nyc/research/projects/euromaidan-event-reconstruction) says only that SITU "designed and developed the presentation tool" with CMU CHRS and names no libraries. CMU page: https://www.cmu.edu/chrs/cases/euromaidan.html; paper: https://www.cmu.edu/chrs/publications/pdf/JHRP_Maidan.pdf (not read; cannot extract PDFs here). Searches for talks/case studies on how the front end was built found none.

## Map data & rendering

- **Base geometry: a client-supplied CAD/survey plan, not OSM.** SITU page: "The 2D plan of Kiev came from the legal team's site survey data". Basemap PNGs show building footprints, kerbs, steps, paving patterns, trees and fountains at survey detail. **[seen]**. Exporting from CAD/Illustrator to PNG/ai2html is **[inferred]** from the `ai2html` boilerplate in `/report/23` (`ai2html-output/Dmytriv_svg/`, `...Dmytriv_basemap_3.png`).
- **Rendering by page [seen]:**
  - Overview (3): pre-rendered video in a div. Poster `https://s3.amazonaws.com/maidan1.situ.mapping/01_Overview/01_Overview_Videos/Overview_d.png` (+ `.mp4`). Video element is `<video width='864' class='overview_mainVideo' muted autoplay poster=...>`. Animation was authored offline (**[inferred]**: After Effects or similar).
  - Cases (23): static artboards `02_Cases/01_Dmytriv/Dmytriv_basemap_3.png` etc., 1152x1840, 8-bit palette PNG, with live HTML/SVG labels layered by ai2html.
  - Archive (21): Leaflet map `L.map('map')` with `L.tileLayer('http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png')` (greyscale OSM, Wikimedia Labs), `min_zoom: 15`. Markers are SVG `L.CircleMarker` (Leaflet default renderer): videos `fillColor:'#000', color:'#fff', weight:2, radius:5, fillOpacity:.5`; deaths `fillColor:'red'`, same stroke.
- **Projection:** Leaflet's Web Mercator for Archive; start centre `x:30.5284, y:50.4489`, zoom 16. Overview/Cases are plain images, so no projection (local pixel frame). The overview tiles all share the same 1104x1152 extent, so shared framing makes cross-fades possible **[inferred]**.
- **Look of the basemap [seen in Overview_d.png, Dmytriv_basemap_3.png]:**
  - Ground/blocks: near-white `#fff` roads (negative space), pale grey `#e6e7e8`-ish block fill (the CSS sets `.map_view{background-color:#e6e7e8}`).
  - Buildings: mid-grey fills (~`#b9bbbe`/`#c8c9cb`) with darker grey hairline outlines (~1px, `#8c8c8c`); inner courtyard and detail lines even lighter; no hatching.
  - Streets drawn as white gaps between kerb outlines, not as strokes. Pedestrian paving and stairs as fine dashed/ticked hairlines.
  - Labels: white Roboto on solid black rectangles ("PROTESTERS", "MILITSIYA", "Barricade 1", "Area of Interest", "d_camera1 = 80 m"), ~16-18px, small padding; place names as small grey text (Hotel Ukraine, Metro Kreshchatyk), street name rotated along the kerb.
  - Overlays: protester presence as a saturated blue radial heat blob; police as dark navy-grey diffuse blobs; camera range as pale red translucent circles with red dashed outline; viewing cone in stronger red; barricades as short thick dark-grey bars. Clock "08:43" top-left as white mono-ish text on black tag.

## Sync & scrubber

All from `alternate_frontend.js` **[seen]** unless noted.

- **Layout:** `#report` is a flex row: `#map_container` 3/5 (`.three_fifths`, `overflow:hidden`) + `#content_container` 2/5 (`.two_fifths`, column flex) containing `#overview` (scrolling text) and `#timeline_container` underneath. Black top nav `#nav_bar` (`background:#000`, white title, red `color: red` accent at css line 35).
- **Scroll-sync is an inner scroll box, not page scroll.** `overview.scroll(...)` sets a 75 ms debounce (`isScrolling = setTimeout(..., 75)`), pauses all videos, loops sections with `isSectionOnScreen(id)` (`bounds.top < overview_bounds.bottom && bounds.bottom > 1.4 * overview_bounds.top`), then calls `setActiveSection(id)` and `handleOverviewPoints(id)`. Discrete steps, no continuous `p`.
- **Map switch:** `append_mainVideo(id)` appends a new `<video>` into `.map_view`; when 3 exist it removes the first (`.overview_mainVideo:first-child`). So a new map state simply stacks on top. No cross-fade code seen.
- **Timeline:** d3 v4 `d3.scaleTime()`, domain = first event minus 25 min to last plus 15 min, `d3.axisBottom(x).ticks(d3.timeMinute.every(15)).tickSizeInner(25)`. Event dots: `circle r=7.5, fill grey, stroke white, stroke-width 2` on a 15px-high bar `rgba(0,0,0,.2)`; hover turns black; active section gets class `active_overview_point`; axis `stroke:white; shape-rendering:crispEdges`. Click a dot animates `#overview` scrollTop over 1000 ms. Re-draw on window resize. It is a **event index, not a scrubber**: no drag handle, no playhead. Data columns: `id, time, moment, timeline(y/n), title, content, content_video, main_video`.
- **Archive timeline:** d3 `scaleTime` + `d3.zoom()`, one horizontal bar per video (start+duration, opacity .25, .75 on hover), red bars for deaths; hovering a bar highlights the Leaflet marker and vice versa (`timeline_marker_hover`, `death_marker_hover`, `reset_chart_videos`). Clicking a marker/bar opens the video in the right panel (`#viewer`, `.viewer_vid`, `#assets`).
- **Videos next to the map:** per-section `<figure><video class='overview_contentVideo' controls>` or YouTube iframe appended inside the text column's section, with `<figcaption>Video: filename</figcaption>`. Videos pause on every scroll stop. 520 clips / ~65 h in the archive.

## Visual traits to borrow

Concrete and reproducible in SVG/CSS:

1. **Quiet cartography:** roads as white negative space between grey blocks; buildings one grey step darker than ground; hairline outlines only (0.75-1px at 1x). Colour is reserved for evidence.
2. **Two-accent palette:** one cool saturated hue for "crowd" (their blue ~`#1e6bff` glow) and desaturated navy-grey for "police"; red only for deaths/ranges/active state. For us: red/white/black direction fits (red = active/incident).
3. **Black label tags:** uppercase/sentence text, white on `#000`, 4-6px padding, no radius, never on a bare map; place names in small grey type that does not compete.
4. **Soft blobs for groups, hard bars for fixed objects:** crowd/police = blurred radial gradients (SVG `feGaussianBlur` or radial gradient circles), barricades = short thick lines.
5. **Measured geometry as annotation:** translucent circle + dashed 1px outline + label "d = 80 m"; cone/wedge for area of interest. Good for "kettle", "barricade line" etc.
6. **Time tag on the map:** large clock chip top-left of the stage ("08:43") that changes per step; time axis ticks every 15 min.
7. **Event-index timeline:** grey dots with white 2px stroke on a thin translucent bar, hover = black, active = red, click scrolls to that step. Easy to build with d3-scale.
8. **Fixed map + scrolling narrative column** (3:2 split) with small section headings (date/time as `h2`, title as `h3`).
9. **Marker styling for sources:** black 50%-opacity dots with white 2px stroke = camera/witness; red = casualty. Keep one marker vocabulary.
10. **Evidence captions:** every embedded video has a `Video: <file>` caption; matches our "every stat carries a footer entry" rule.

## What to avoid / not applicable

- Video-as-map: heavy, non-seekable by scroll, can't be inspected or restyled, and breaks our scroll-linked `p` model. We should draw layers live in SVG and drive them from `onScroll`.
- Inner scroll container + 75 ms debounce: janky; our controller should use page scroll with sticky and continuous progress.
- Leaflet, jQuery, video.js, canvid, moment, markercluster, d3 v4 whole bundle: not allowed or unneeded (no new deps; projection hand-rolled).
- Mixed content (`http://` assets), `d3.event`, old APIs: dated.
- Their basemap needs a survey CAD file we do not have; OSM will be coarser (no stairs/paving/trees detail).
- Their timeline has no playhead/scrub; if we want a scrubber we must design it ourselves.
- Mobile note: they themselves say "optimized for desktop"; irrelevant to us.
- Roboto everywhere: our brief calls for the Protest Revolution display face plus Public Sans, not Roboto.

## Licence

- No licence or copyright statement found on the site, the SITU project page (only a Privacy Notice in the footer), the CSS, or `alternate_frontend.js`. **Default: all rights reserved.** Do not copy `alternate_frontend.js`, `frontend.alternate.css`, the basemap PNGs, videos or posters. Treat as inspiration only. **[seen / inferred legal reading; not legal advice]**
- Third-party pieces inside carry their own licences (Leaflet BSD-2, d3-tip MIT per its header "Copyright (c) 2013-2017 Justin Palmer", jQuery MIT), but we won't use them. The only SITU open-source repo (`SITU-Research/codec`, AGPL-3.0) is unrelated to the map; AGPL would be a poor fit anyway.
- Visual language (grey plan + sparse colour + black label tags) is a style, not protectable expression; reproducing it from our own OSM data is fine. Credit SITU Research and CMU CHRS as inspiration in the footer if Vali wants.
- Content is evidentiary (real deaths, legal case); do not reuse any of their data or footage.

## Recommended approach for our build

Target: Jantar Mantar Road, bbox 28.605-28.640 N, 77.195-77.240 E (about 3.9 km x 3.4 km; the story itself likely needs a much tighter crop, around Jantar Mantar/Sansad Marg/Parliament St, decided in the scene brief).

**Pipeline** (all offline scripts under `tools/`, committed outputs in `data/map/`; no runtime dependency)

1. **Fetch (Overpass, one-off, not at runtime):** `tools/osm-fetch.mjs` POSTs to `https://overpass-api.de/api/interpreter` with `[out:json][bbox:28.605,77.195,28.640,77.240]; (way[building]; way[highway]; way[railway]; way[waterway]; way[natural=water]; way[leisure~"park|garden"]; way[landuse~"grass|recreation_ground"]; node[amenity|tourism|historic][name]; relation[building]; relation[type=multipolygon][leisure];); out geom;`. Save raw to `data/map/raw/overpass.json` (gitignored if large). Keep the ODbL attribution.
2. **Convert to GeoJSON:** a small script (or `osmtogeojson` run once with `npx`, dev-only, not shipped) -> layers: `buildings`, `roads` (with `highway` class), `paths`, `green`, `water`, `landmarks` (points with `name`).
3. **Project + simplify in Node:** hand-rolled spherical Mercator about the story centre, `x = R*(lon-lon0)*PI/180`, `y = R*ln(tan(PI/4+lat*PI/360))` minus centre, then scale to a local metre/pixel frame (origin at Jantar Mantar). Optionally Douglas-Peucker with ~0.5 m tolerance, snap to 0.1 m, drop buildings < ~20 m2. Output **pre-projected** coordinates so the browser does no projection for the base map; ship `proj.js` (about 15 lines) for the runtime-placed markers.
4. **Write `data/map/*.json`:** GeoJSON, or compact TopoJSON-like arrays if size > ~300 KB. Target < 400 KB total, gzip-friendly. Roads need stroke widths by class (motorway/trunk 14 m, primary 10, secondary 7, residential 5, footway 1.5 m in world units).
5. **Render as SVG layers** in one `<svg viewBox>` with a single `<g class="camera">` whose `transform` the scroll controller animates (zoom/pan = changing the transform, not re-rendering). Layer order: `ground` (rect `#e6e7e8`), `green` (slightly cooler grey), `roads-casing` (white `stroke-linecap:round`, wide), `roads` (white, narrower, or the reverse: grey kerb casing + white core, as Maidan), `buildings` (fill ~`#b9bbbe`, stroke `#8c8c8c` 0.75px with `vector-effect: non-scaling-stroke`), `labels` (HTML-in-SVG or `<text>` tags: white on black rect), `overlays` (crowd blobs via radial gradient, dashed radius circles, barricade lines), `markers` (black 50% dots with white 2px stroke; red for incident), `clock` chip (DOM overlay, outside the camera).
6. **Camera moves:** each scene declares `{cx, cy, k}`; the controller interpolates between neighbours using the single scroll `p`. Keep strokes constant on screen via `vector-effect: non-scaling-stroke` (and scale text inversely, or render labels in a non-scaled HTML layer positioned from projected coords).
7. **Timeline:** d3-scale `scaleTime`, a 15px bar + circles per story step (grey, white 2px stroke, active red), driven by the same `p`; add a playhead line since Maidan lacks one.
8. **QA/perf:** SVG with a few thousand paths is fine; if buildings > ~3k, pre-bake the static layers into one `<path d>` per layer. Verify with `tools/cdp-scroll.mjs` at the key frames, scrolling up and down.

**Open questions for Vali**
- Tight story crop vs the full bbox (changes simplification and detail level).
- Whether OSM is enough for Jantar Mantar's small features (the site itself, barricade lines): those may need hand-drawn additions in `data/map/annotations.json`, which must come from `data/story/*.json` per the facts rule.

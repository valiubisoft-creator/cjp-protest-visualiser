# Archive: Within Earshot: Jantar Mantar (prototype, retired)

**Status:** Retired 2026-11-05. The branch `proto/within-earshot` was deleted locally and on GitHub. Its last commit was `a1dbed0`, "Add Within Earshot: Jantar Mantar spatial audio prototype": 83 files, all in `within-earshot/` plus `.gitignore` lines. It was never merged to `main`.

This file keeps the decisions, the systems and the lessons, so the prototype can be rebuilt or mined later without the branch.

**Recovering the code.** Until git garbage-collects it, run `git branch within-earshot a1dbed0` locally. GitHub may also keep the commit reachable by SHA for a while. After that, the code exists only in this document and in the skill `~/.claude/skills/geo-spatial-audio/`.

---

## 1. What it was

It was a short geo-spatial audio experience for exploring how sound, location and time can help someone understand a protest. It was intended to inform a future documentary about the CJP protest period.

- **Map:** a line-art 3D fragment of central New Delhi around Jantar Mantar, built from cached OpenStreetMap data.
- **Markers:** five clickable sound markers, each with dotted, audio-reactive concentric rings that reverberate outward.
- **Listener:** an explicit listener position with three presets, independent of the camera.
- **Narrative:** a four-scene scroll narrative ("Scene 01–04", about 20 s each) and an 80-second guided journey.
- **Inspiration:** the Washington Post / Polygraph / Pudding "Reconstructing seven days of protests in Minneapolis" livestream map. It was used for inspiration only; no equivalence was claimed.

The notice, shown everywhere:
> Spatial audio prototype. Public placeholder recordings are placed illustratively around Jantar Mantar. They are not recordings of these protests.

## 2. Decisions (all confirmed by the user)

| Topic | Decision |
|---|---|
| Location | Its own branch, self-contained `within-earshot/` folder with its own `package.json`. The main piece (`index.html`, `data/`, `static/`) was never touched. |
| Audio spec | The brief's audio spec was implemented as written. The repo had no prior spatial audio. |
| Timeline labels | "Scene 01–04" plus elapsed composition time only. Sourced dates went in a separate caveated "Documented context" strip: 6 Jun, 20 Jun, 20 Jul, 23 Jul and 25 Jul 2026, plus the 12–13 Oct de-notification. The brief's "July–August continuous protest" framing was rejected as unsupported. |
| Look | CJP colour tokens plus a single muted amber accent (`#D9A441`), used only for the active source. |
| Typography | Display face: **Protest Strike** (Google Fonts), used only for the title, scene numbers and scene headlines, never below about 24 px. Body and UI: **Schibsted Grotesk** at 400–700, chosen as a deliberately uncommon newsroom grotesk instead of Inter or Plex, with tabular figures for times and offsets. Fallback if needed: Instrument Sans. |
| Rings | Made of **dots**, not lines, and reverberating from the centre outward with a delay of k × 110 ms per ring. |
| Layout | Desktop only, with no mobile layout. Below 1024 px a note was shown. The UI chrome sits at the edges of the scene and never covers the map centre or the narrative. |
| Licences | CC0/PD preferred, then CC BY. CC BY-SA was allowed, with attribution and ShareAlike noted. No NC licences. |
| Tests | Playwright on Chromium and WebKit. |
| Build model | Opus at high effort. Research used Sonnet sub-agents, plus an architect-review agent and a GPU-efficiency research agent. |
| GPU budget | The laptop must stay cool: 0 fps when idle, a 30 fps cap while audio plays, DPR ≤ 1.5, `powerPreference: 'low-power'`. |

## 3. Stack

The stack was Vite 8.3.6, TypeScript 7.0.2, three 0.187.0, @types/three 0.187.0 and @playwright/test 1.64.1, all pinned exactly. It used no React, R3F, Tone.js, physics engine or backend. Only one rendering system was used, a standalone three.js scene; there was no second map library.

Scripts:
- `dev`: port 5174.
- `build`: `tsc --noEmit && vite build`.
- `preview`: port 4174.
- `test`: builds, serves and runs Playwright.
- `prepare:geo`.
- `prepare:audio`.

## 4. Geography: what was verified

**Origin.** 28.62718 N, 77.21662 E, the OSM Nominatim point for way 223456559 (the observatory). It is 0 m from Nominatim and 23 m from Wikipedia's 28°37′38″N 77°12′59″E.

**The protest street is not the observatory.** Geocoders return the landmark, but the demonstration site is **Jantar Mantar Road** (OSM way 24583495). The road starts at the Tolstoy Marg / Sansad Marg junction at the complex's south-west corner and runs south. The prep script asserted all of the following:
- The road's north end is ≤ 40 m from the enclosure; the measured distance was 9 m.
- The road has no vertex inside the observatory polygon.
- Every marker and listener position lies outside the polygon.

**Overpass bbox.** S 28.6235, W 77.2135, N 28.6300, E 77.2200, about 550 × 650 m. The query fetched `highway`, `building`, `landuse`, `leisure`, `tourism` and `historic` ways and relations, named POI nodes and stations. Mirrors used:
- `overpass-api.de`
- `overpass.private.coffee`
- `maps.mail.ru/osm/tools/overpass`

Overpass failed intermittently (406s and timeouts), so the script needed retries plus the mirror list.

**Projection.** A local east/north tangent plane (equirectangular about the origin) with WGS84 R = 6378137. Scene axes: x = east, z = −north, y = up, so north is −z and a camera with no azimuth looks north. GeoJSON stays `[lon, lat]` everywhere.

Checks:
- Haversine and projected lengths of Jantar Mantar Road agree to < 0.5 %.
- Geo↔local round-trip drift is < 0.06 m.

**Heights.** Taken from OSM `height`, else `building:levels × 3.2 m`, else a 12 m default (8 m for monuments). Only 13 of 77 buildings were tagged; assumed heights were drawn dashed and dimmer.

**Not modelled, deliberately.** Barricades, police positions, crowd distributions and routes. Current map data establishes none of them.

**Demonstration-stretch band.** Drawn on Jantar Mantar Road from N −120 to −300 m and labelled "(approximate)".

## 5. Scene authoring (local metres, `[east, north]`)

**Markers.** All placements are illustrative. "Bed" markers keep their stereo image instead of being panned as point sources.

| Marker | Asset | Local | Mode |
|---|---|---|---|
| m-footsteps | a-footsteps | [-73, -338] | point |
| m-crowd | a-crowd | [-80, -205] | point |
| m-applause | a-applause | [-90, -252] | point |
| m-street | a-street | [-112, -62] | bed (stereo) |
| m-quiet | a-quiet | [-66, 4] | bed (stereo) |

**Listener positions.**

| Position | Local | Bearing |
|---|---|---|
| Approach | [-71, -382] | 0° |
| Edge of gathering | [-66, -180] | 215° |
| Across the street | [8, -160] | 245° |

**Camera views.**

| View | Target | Bearing | Tilt | Zoom |
|---|---|---|---|---|
| establishing | [-35, -95] | 22° | 56 | 1.0 |
| closeA | [-80, -222] | 32° | 52 | 2.7 |
| closeB | [-52, -142] | 250° | 54 | 1.9 |
| overview | [-30, -70] | 0° | 38 | 0.95 |

**Scenes.**
1. **Approach.** "Before we can make out the words, we can hear that people are there." Wide view; footsteps and distant crowd; the listener marker is introduced.
2. **Among people.** "A gathering is made of many small conversations." closeA view; crowd and a brief applause cue; the reader compares Approach with Edge of gathering.
3. **Across the street.** "Distance changes what reaches us." closeB view; a "Move me across the street" action; a Designed perspective vs Original recording toggle at the same playback offset.
4. **What remains.** "When the gathering leaves, the place sounds different." Overview; collective sound fades into quiet ambience; ends with access to the sources.

## 6. Placeholder audio

All placeholder audio came from Wikimedia Commons, with metadata from the live API.

**Discovery.** Commons MediaWiki Action API, no credentials, `origin=*` for CORS:
- `prop=imageinfo`
- `iiprop=url|size|mime|mediatype|extmetadata|timestamp|user`
- `iiextmetadatafilter=LicenseShortName|LicenseUrl|Artist|Credit|AttributionRequired|UsageTerms|…`

`upload.wikimedia.org` sends `Access-Control-Allow-Origin: *`, but playback still used a vendored local pack. Commons rate-limits ("You are making too many requests"), so the script slept between calls and retried.

| Asset | File | Licence | Creator | Excerpt | Ch |
|---|---|---|---|---|---|
| a-footsteps | Pildammsparken20190928-fåglar-4-promenad.wav | CC BY-SA 4.0 | Johan Jönsson | 0 s + 13 s | 1 |
| a-street | Praha, KoubkovaxBělehradská.ogg | PD | Juandev | 60 s + 24 s | 2 |
| a-crowd | 1 minute at the alexa mall in berlin.ogg | PD | thore | 5 s + 24 s | 1 |
| a-applause | Clapping for Carers in Oxford, April 2020.opus | CC0 | Pierre Marshall | 2 s + 20 s | 1 |
| a-quiet | Covid dawn 2020-05-13 0630 part 3.mp3 | CC BY-SA 4.0 | Robert EA Harvey | 120 s + 26 s | 2 |

Alternates on record:
- Walkingongravel.ogg
- Karlova 0001.ogg
- Restaurant ambience.ogg
- Applause ii.ogg
- Royal Natal National Park dawn chorus (CC BY 4.0)
- Urban_Street_on_a_Rainy_Afternoon.flac (CC0)

**ffmpeg chain** (AAC was used so Safari can play it; Ogg is unreliable there):
```
atrim=start=S:duration=D,asetpts=PTS-STARTPTS,highpass=f=40,
afade=t=in:st=0:d=0.6,afade=t=out:st=D-0.8:d=0.8,
loudnorm=I=-23(point)|-26(bed):TP=-3:LRA=11,alimiter=limit=0.56:level=false
→ -ac 1|2 -ar 48000 -c:a aac -b:a 80k(mono)|112k(stereo) -movflags +faststart
```
- The `alimiter` was needed because AAC encoding pushed peaks above target after `loudnorm`.
- Review images came from `showspectrumpic=s=1200x360:legend=1:scale=log:fscale=log`, and levels from `astats` + `silencedetect`.
- The total pack was 1.3 MB.

**Gaps that were never closed:**
- No CC0/PD outdoor footsteps recording was found.
- No openly licensed South Asian street ambience without speech was found.
- The human listening pass was never done.

## 7. Systems

### Audio graph (raw Web Audio, one AudioContext, one listener)
```
per voice:  src → fade ─┬→ analyser (tap, fftSize 512, smoothing 0)
                        ├→ spatialSend → Panner(HRTF, inverse) ─┐
                        └→ drySend → bedDist ───────────────────┴→ air(low-pass) → bus
master:     bus → master(volume²) → mute → DynamicsCompressor(safety limiter) → stereo | mono downmix → destination
```
- **Point sources.**
  - `refDistance` 12–18 m and `rolloff` 0.6–0.7. This is artistic scaling for a compact site, and the README documented it.
  - The panner sits at y = 1.5 and the listener at y = 1.6.
  - Air low-pass cutoff = `max(3200, 18000 − d·50)` Hz.
- **Beds.** They bypass the panner: gain = `ref/(ref + rolloff·max(0, d − ref))`, clamped to a floor of 0.28, plus the same air filter.
- **"Listen clearly".** spatialSend 0, dry 1, bedDist 1, air 20 kHz. Every change goes through `setTargetAtTime` with τ = 0.3.
- **Click-free gain changes.** `holdAt(param, t)` uses `cancelAndHoldAtTime` where available. Otherwise it reads `value`, calls `cancelScheduledValues` and then `setValueAtTime`. This was used before every ramp.
- **Offset tracking.** Pause stores `startOffset + (ctx.currentTime − startedAt)`. Resume creates a new `AudioBufferSourceNode` at that offset, because sources are single-use.
- **Listener orientation.** Stepped through 12 intermediate unit vectors over 0.9 s. Interpolating the components directly passes near a zero vector on turns close to 180° and makes the HRTF image snap.
- **Mono toggle.** Dip the mute gain to 0 over 40 ms, reroute after 50 ms, ramp back up over 60 ms.
- **Latest selection wins.**
  - The scene and the foreground each have a token counter. After every `await`, `if (token !== this.token) return`.
  - A bug from the build: `stopForeground` bumped the token and cancelled the click's own load. Fix: a private `dropForeground()` that does not touch the token.
- **Director.**
  - `SCENE_S` = 20 and `CROSSFADE` = 1.2.
  - Composed scenes schedule looped voices on the audio clock.
  - The single foreground "inspection" voice solos a marker: click pauses, click again resumes, another marker fades the first out over 0.3 s and it is disposed after `fade + 120 ms`.
  - `tick()` fires `onSceneEnd` once.
- **Engine.**
  - `load()` caches decode promises and evicts them on failure.
  - `latencyHint: 'playback'`.
  - `onstatechange` surfaces browser suspension.

### Rendering
- **Camera.**
  - `OrthographicCamera` with `FRUSTUM_H` = 640 m at zoom 1.
  - The camera sits `DIST` = 1400 from the target, posed by compass bearing and tilt from vertical.
  - Tweens use a cubic ease, take the shortest path in angle and interpolate zoom geometrically: `exp(lerp(log a, log b))`.
- **OrbitControls.** Enabled only through "Explore map", so page scroll is never captured.
  - Zoom 0.7–5.
  - Polar angle 0.18–1.15 rad.
  - Damping 0.12.
  - An azimuth window of ±75° around the scene bearing. It is unlocked to ±∞ during tweens and re-applied when the tween ends; otherwise the clamp fights the tween.
- **Line art.**
  - **Buildings:** `ExtrudeGeometry` merged with `mergeGeometries`, with very dark faces. Outlines are `EdgesGeometry` drawn with `LineSegments2`/`LineMaterial`; assumed heights are dashed, using `computeLineDistances`.
  - **Roads:** a casing pass and a fill pass with screen-space widths, `width_px = max(1, w_m · k / metresPerPixel)` with `k = 0.5·(1 + cos tilt)`. That gives exact ~1 px outlines and round joins. Earlier attempts in world units gave sawtooth joins and roads that read as light bands. The fix was to make the road fill darker than the ground.
- **Layering.** Flat layers (ground, grid, parks, observatory, stretch, roads) have `depthTest: false` and are ordered purely by `renderOrder`. The reason: a wide screen-space line quad has constant depth, so depth-testing it against tilted ground clips half of it. Buildings (renderOrder 12+) write depth. Markers, rings and the listener also have `depthTest: false` so buildings never hide them.
- **Palette.** Opaque pre-blended colours with no alpha stacking. Colours used:
  - Ground `#141413`.
  - Road fill `#0D0D0C`.
  - Stretch `#242320`.
  - Amber `#D9A441`.
- **Labels.** Projected DOM labels positioned with the CSS `translate` property. Only verified landmarks and the illustrative listening points were labelled: the observatory, Jantar Mantar Road, Sansad Marg, Tolstoy Marg, Janpath and NDMC.
- **Picking.** A `Raycaster` ray intersected with the ground plane (y = 0), then a nearest-marker test within a generous radius. The test did not raycast the ring Points.

### Dotted rings (one `THREE.Points` per marker, one draw call)
- **Layout.** Five rings with dot counts [20, 30, 40, 50, 60], radius `R0` = 4.2 plus `DR` = 3.7 per ring, and a 48-dot progress arc just outside. The arc fills clockwise from north.
- **Shader.** A round-sprite ShaderMaterial: `gl_PointSize = aSize·uDpr`, `smoothstep(0.5, 0.3, d)` alpha, `discard` below 0.01 and `#include <colorspace_fragment>`. One material is shared by all markers, with `transparent`, `depthWrite: false` and `depthTest: false`.
- **History.**
  - Pushes are time-based (≥ 26 ms apart), so depth is the same at 60 or 120 Hz.
  - H = 48 frames × 72 bins of signed, loudness-normalised waveform, plus per-frame energy: `db = 20·log10(rms)`, mapped from (−50 … −16 dB) to 0..1, with a 0.55 attack and 0.14 release.
- **Reverberation.** Ring k reads the frame at `now − k·110 ms`. `frameAt` returns the newest frame at or before t, or the oldest available frame. An early bug returned the newest frame on wrap. Ring k:
  - Radius displacement: `w·(0.35 + 1.5e)`.
  - Size: `2.2 + 3.4e`.
  - Alpha: `(0.18 + 0.82e)·(1 − 0.14k)`.
- **States.**

  | State | What the rings show |
  |---|---|
  | idle | Sparse outer ring |
  | highlight | Outer ring plus ring 1 |
  | hover | Bright rings |
  | loading | A chasing head on the outer ring |
  | playing | Live, reverberating rings |
  | paused | Frozen at the last frame, dimmed amber |
  | muted | Flat rings; only the progress arc moves |
  | finished | Settled rings with a replay glyph |
  | error | Gapped dots in the error colour |
  | reduced motion | Static amber rings; progress only |

- **Fixed bounds.** `boundingSphere` set to radius `R_PROGRESS + 4`. Without it, Points crashed on a null `boundingSphere.center`. Also `frustumCulled = false`.
- **Uploads.** Attributes were re-uploaded only when the visual state or step changed, tracked with `lastVis` and `lastStep`.
- **Caption.** The rings visualise playback. Their radius is not acoustic reach or crowd size.

### Render loop (power)
- **Loop.** One `requestAnimationFrame` loop. `request()` renders a frame immediately; `hold(reason)` and `release(reason)` keep it alive for audio, tweens or loading. When nothing is animating and nothing holds it, the loop stops completely (0 fps).
- **Throttle.** If the last frame was not interactive and only audio work is pending, frames are skipped until 33 ms have passed (30 fps). Camera tweens and orbit damping run at display rate.
  - A bug from the build: the throttle checked the wrong flag and the loop ran at about 148 fps. Fix: test `animatingLast`, make history pushes time-based and remove a stray 4 Hz `request()`.
- **Renderer.** `antialias: true, alpha: false, stencil: false, powerPreference: 'low-power'`. DPR is capped at 1.5 and updated on resize, which also updates the ring `uDpr`.
- **Lifecycle.** `ResizeObserver` for sizing. `webglcontextlost` calls `preventDefault`, stops the loop and switches to the 2D SVG plan. Disposal is full.
- **Measured.** About 34 draw calls, 0 fps idle and 30 fps with audio. The JS heap grew by under 8 MB across 30 toggles, and the geometry count stayed under 40.

### Narrative and modes
- **Chapter detection.** `IntersectionObserver` with `rootMargin: '-42% 0px -42% 0px'`, a narrow centre band. A 350 ms dwell commits a candidate scene, which gives hysteresis. `sync(n)` is used for programmatic changes so the observer doesn't bounce back.
- **Chapter change.** Tween the camera, highlight the scene's markers and crossfade over 1.2 s. Re-entering a chapter restarts that scene. Scroll never scrubs the audio.
- **Journey.** Four 20 s scenes on the audio clock. Each chapter is scrolled into view once per scene.
  - User `wheel`, `touchmove` or scroll keys exit the journey; the current scene keeps playing.
  - A marker click pauses the journey and shows "Resume journey".
- **Tab hidden.** `visibilitychange` pauses everything and requires an explicit Resume.
- **Accessibility.**
  - Every 3D marker has HTML buttons: chapter chips, the inspector and the 2D plan.
  - Play/pause/resume/replay labels are accurate, and `aria-pressed` is set on toggles.
  - The focus ring is distinct from the amber "playing" colour.
  - Waveform changes are not announced to screen readers.

### Layout
- Grid split of 62/38: a sticky scene on the left and the narrative on the right (max 460 px).
- Chrome placement:
  - **Top-left:** scene tag and the listener radiogroup.
  - **Top-right:** compass, Reset view and North up.
  - **Bottom:** transport and an SVG timeline.
  - **Right:** a collapsible inspector drawer whose bottom sits 101 px up so the transport stays usable. It closes with Esc.
- 8 px grid, hairline dividers and a 2 px radius.

## 8. Verification at retirement

Playwright on Chromium (1440 and 1280) and WebKit: **29 passed, 1 skipped**. The skip was the WebGL-disabled fallback on WebKit, which relies on a Chromium flag.

The tests covered:
- Fonts and attribution.
- Layout overlap.
- Every marker playing its own asset.
- Click-pause-resume offset.
- A single foreground voice.
- Ring energy isolation and history depth.
- Mute vs pause.
- Orbit not moving the listener.
- Listener convergence.
- No scroll hijack.
- Boundary jiggle causing at most one start.
- Fast scroll leaving no orphaned voices.
- Journey enter and exit.
- Tab-hide pause.
- Idle fps and memory.
- Reduced motion.
- No-WebGL and context-loss fallbacks.

Tests drove the app through a `window.__we` debug hook exposing `state()` and `markerScreen()`.

**Never tested:**
- Listening by ear, including HRTF impression.
- Real Safari and Firefox.
- Screen readers.
- Energy use on real hardware.

## 9. Lessons worth keeping
1. **Geocoders return landmarks, not protest sites.** Verify the street from OSM geometry and assert placements with point-in-polygon in the prep script.
2. **Check dates against sources before labelling a timeline.** Neutral "Scene 0n" labels plus a separate caveated context strip are a safe pattern.
3. **Keep recordings separate from placements** (`manifest.json` vs `markers.json`). Swapping in a real documentary recording then needs no code change.
4. **For screen-space lines, set `depthTest: false` and order with `renderOrder`.** Fat lines are quads at constant depth and get clipped by tilted ground.
5. **Render on demand.** An idle three.js page should draw 0 frames; cap audio-driven animation at 30 fps and measure it in a test.
6. **Use tokens for async audio, and don't let a stop function cancel its own caller.**
7. **Use `cancelAndHoldAtTime` before ramps** and step listener orientation through intermediate vectors.
8. **Make audio-reactive history time-based, not frame-based.**
9. **An agent cannot listen.** Generate spectrograms and a checklist page, and hand the listening pass to a human.

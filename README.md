# CJP Protest Visualiser — Field File

A single-page scrollytelling piece on the CJP protests: the swarm, account withholding, the Jantar Mantar blackout, contested casualty counts, detentions, voter-roll deletions and the state apparatus. Built with anime.js v4.5.0 (`onScroll`), Archivo + Public Sans.

## Open it

No build step. Serve the folder and open `index.html`:

```
npx serve .
# or: python3 -m http.server 8000
```

anime.js and the fonts load from CDNs, so it needs a network connection.

## Folder

| Path | What it is |
|---|---|
| `index.html` | The scrollytelling piece (self-contained; loads anime.js and fonts from CDNs) |
| `archive/index-v1-slides.html` | Earlier click-through version |
| `data/` | Datasets: channels, events, footage clusters/edges, timeline clips, stats snapshots, vocab, ref lists, event schema |
| `data/youtube-coverage/` | Index of YouTube coverage of the protests (`.md`, `.csv`, `.json`) |
| `media/cjp-public-images/` | Openly licensed CJP photos, logos and flags; credits in `IMAGE_SOURCES.md` and `sources.json` |
| `static/` | Cursor, favicon, fonts and audio (credits in `static/audio/CREDITS.txt`) |
| `docs/` | Curation, anonymisation, taxonomy, data dictionary and sourcing/takedown policy |
| `docs/brief/` | Original PRD, video-capture inputs and research prompt |
| `docs/research/prior-art/` | Prior-art and tech research, with screenshots |
| `tools/cdp-scroll.mjs` | Headless-Chrome scroll QA: `SIZE=1440,900 node tools/cdp-scroll.mjs <url> <outDir> targets.json` |
| `qa/` | QA screenshots (desktop and mobile) |
| `curation/` | Raw curation pulls and tag audits (gitignored) |

An earlier SvelteKit video-wall version lives in the archived repo `valiubisoft-creator/CJPVisualArchive`.

Figures marked "claimed" or "unverified" in the piece are the movement's own numbers and have not been independently confirmed.

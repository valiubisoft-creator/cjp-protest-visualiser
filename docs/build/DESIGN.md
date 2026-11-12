# Design direction (v3)

Set by Vali on 2026-11-11. F2 turns this into `styles/tokens.css` and the design board. Later chats use the tokens and never hard-code values.

## Typography

| Role | Face | Use |
|---|---|---|
| Display | **Protest Revolution** (Google Fonts, OFL) | Major headings only: the hero word, scene titles, "Victory", the S4/S6 date if the spike approves it (see below). Never body text, labels or UI |
| Text and UI | **Public Sans** (Google Fonts, OFL, variable weight). **2026-11-12 (Vali): body copy is now Redaction** (`--font-text`); Public Sans stays as `--font-ui` and for the skeleton date | Everything else: body, quotes, captions, rail cards, scrubber labels, chart axes, footer |
| Numbers in UI | Public Sans with `font-variant-numeric: tabular-nums` | Stats, readouts, the HUD date |
| Indian scripts | Noto family matching the script (Devanagari first) | Original-language quotes and titles |

- **Self-host** the fonts as woff2 in `static/fonts/` (download once, subset to Latin plus the needed scripts). No Google Fonts CDN at runtime.
- Protest Revolution has a single weight. Hierarchy comes from size, case and colour, not faux bold.
- **Check in the S4a spike:** Protest Revolution's rough, brushed edges may thin into a noisy skeleton for the roach-formed date. Test its digits 0–9 and "/" first. If the date isn't legible at a glance, use Public Sans Black for the skeleton digits only, and log the change in BUILD_PLAN.

## Colour: red, white and black

Inspired by the Electronic Frontier Foundation's look: a stark, poster-like system of a single campaign red, white and black. These are a starting point. F2 tunes the exact values on the board.

| Token | Proposed | Role |
|---|---|---|
| `--black` | `#0B0B0B` | Ink, roaches, full-bleed dark stages |
| `--white` | `#FAFAF7` | Paper and the main background |
| `--red` | `#E0201B` | The one accent: the keyword, state action, active scrubber node, `*` markers, glitch channel split |
| `--red-deep` | `#A8130F` | Red text on white (contrast) and pressed states |
| `--grey-1` | `#6B6B66` | Secondary text and captions |
| `--grey-2` | `#C9C8C2` | Rules, map roads, chart gridlines |
| `--grey-3` | `#1E1E1C` | Raised surfaces on black (rail cards in dark stages) |

Rules:
- Red is used sparingly, for meaning only. Big red areas are reserved for major beats (the click, the 20 Jul crackdown, Victory).
- Black roaches on white paper is the default stage, as the spec recommends. Black full-bleed stages are allowed for dramatic beats.
- The halftone backdrop is black dots on white at low contrast. Behind text it must stay faint enough for WCAG AA.
- Red text on black, and red body text on white, must pass AA. Use `--red-deep` for small red text on white.
- Charts are black and grey series with red highlights only. No rainbow palettes. Claimant colours are distinguished by pattern or shade (solid, hatched, outline), not by new hues.

## F2 board variants
Show two variants inside this palette: **white-dominant** (paper stages, black for dramatic beats) and **black-dominant** (dark stages, white paper for reading sections). Vali picks one.

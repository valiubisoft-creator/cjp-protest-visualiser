// S7 · shared pieces for the chart stages (S7 chat, 2026-11-12; anime.js redesign 2026-11-12): formatting, the
// spec's p timings, the frame (kicker, title, chart cell, callouts, note), the corpus star, the tooltip, and the
// scrubbed anime.js timeline every chart is built on.
//
// Purity (scene contract): every chart is ONE paused anime.js timeline per layout, 1000 ms long = p 0 → 1, and
// update(p) only calls tl.seek(p × 1000) and then redraws from the animated state. anime's clock never runs.
// Rule that keeps seek() pure in both directions: every animated value starts at its tween's `from` (fromTo()
// sets it before the tween is added), and each property of a target is tweened once.
import { createTimeline, utils, svg as asvg } from 'animejs';
import { esc } from '../../lib/text.js';
import { star } from '../../lib/star.js';
import { fmtDate } from '../../lib/dates.js';

export const S7_CSS = new URL('../s07-charts.css', import.meta.url).href;   // S7d may load the same sheet

// ── formatting ──
export const fmtInt = n => Math.round(n).toLocaleString('en-GB');
export const fmtM = v => (v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${Math.round(v / 1e3)}K` : String(v));
export const fmtTick = v => (v === 0 ? '0' : v >= 1e6 ? `${+(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${+(v / 1e3).toFixed(1)}K` : fmtInt(v));
export const pct = x => `${Math.round(x * 100)}%`;
export const day = d => fmtDate(d);                     // '2026-07-20' → '20 Jul'
export const span = (a, b) => `${fmtDate(a)} – ${fmtDate(b)}`.replace(/ /g, ' ');   // a date range never breaks
// the same as HTML for running text: nowrap, since Chrome may still break after an en dash
export const spanHTML = (a, b) => `<span class="nw">${esc(span(a, b))}</span>`;

// ── spec timings (S7): 0–0.20 title, kicker and axes enter · 0.20–0.70 scrubbed draw-in · 0.70–1 hold ──
// On the timeline: 1 ms = 0.001 p. INTRO = [0, 200], DRAW = [200, 700], hold 700–1000.
export const T = { len: 1000, intro: 0, introEnd: 200, draw: 200, drawEnd: 700 };
export const at = f => T.draw + f * (T.drawEnd - T.draw);   // draw-in fraction → timeline ms
export const clamp01 = x => (x < 0 ? 0 : x > 1 ? 1 : x);
export const seg = (p, a, b) => clamp01((p - a) / (b - a));
export const easeOut = t => 1 - (1 - t) ** 3;
export const easeInOut = t => (t < .5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
export const phases = p => ({ intro: easeOut(seg(p, 0, .2)), draw: seg(p, .2, .7) });
export const calloutT = (draw, i, n, at_) => (at_ && at_[i] != null
  ? easeOut(seg(draw, Math.max(0, at_[i] - .12), Math.min(1, at_[i] + .04) || 1))
  : easeOut(seg(draw, i / n * .8, i / n * .8 + .2)));

// a paused timeline exactly T.len long
export function scrubTimeline() {
  const tl = createTimeline({ autoplay: false, defaults: { ease: 'outQuart', duration: 120 } });
  tl.add({ duration: T.len }, 0);                         // a bare timer pins the length to 1000 ms
  return tl;
}
// set the start state, then tween to the end state: from/to are { prop: value } maps
export function fromTo(tl, targets, from, to, pos, params = {}) {
  utils.set(targets, from);
  const props = {};
  for (const k of Object.keys(to)) props[k] = [from[k], to[k]];
  tl.add(targets, { ...props, ...params }, pos);
  return tl;
}
// SVG line drawing (anime's createDrawable), starting undrawn so seek() is pure: draws `el` in over `params`
export function drawIn(tl, el, pos, params = {}) {
  const d = asvg.createDrawable(el);
  utils.set(d, { draw: '0 0' });
  tl.add(d, { draw: ['0 0', '0 1'], ...params }, pos);
  return tl;
}
// a plain state object for chart-specific drawing (anime tweens its numbers; the chart redraws from it)
export const state = o => ({ ...o });

// ── the corpus star: every number computed from the corpus links to the timeline_clips footer entry ──
export function corpusStar(data) {
  const id = 'timeline_clips';
  if (!data.byId.source[id]) return '<span class="missing">[MISSING: corpus source id]</span>';
  return star([id], data.byId.source, 'computed from the YouTube clip corpus');
}
// "collected 21 Jul" from methodology.collection_dates.video_corpus ("2026-07-21T18:54:05Z (…)")
export function collected(data) {
  const s = data.methodology?.collection_dates?.video_corpus;
  const m = s && s.match(/^\d{4}-\d{2}-\d{2}/);
  return m ? fmtDate(m[0]) : null;
}

// ── the frame: kicker + title above; chart cell (≈68%) left, callouts (≈28%) right; note below ──
// The kicker "Media engagement" is the spec default (O3), not data: Vali to confirm (GAPS).
export const KICKER = 'Media engagement';

// header only (S7d can reuse it): <header class="s7-head"> kicker, Protest Revolution title, "i / n" count
export function headHTML({ title, index, total, kicker = KICKER, dek = '' }) {
  return `<header class="s7-head">
      <p class="s7-kick t-micro">${esc(kicker)}</p>
      <h2 class="s7-title t-display">${esc(title)}</h2>
      ${dek ? `<p class="s7-dek">${dek}</p>` : ''}
      ${index ? `<p class="s7-count t-micro t-num">${index} / ${total}</p>` : ''}
    </header>`;
}
// chart note (S7d can reuse it): small muted line under the stage; `html` is trusted markup
export const noteHTML = html => `<p class="s7-note">${html}</p>`;

// callouts: { value (final string), n + fmt (count-up; fmt(n) must equal value), swatch?, star, text, attr }
export function frameHTML({ sub, index = sub + 1, total = 3, title, sub2 = '', legend = '', callouts, note }) {
  return `
    ${headHTML({ title, index, total, dek: sub2 })}
    <div class="s7-main">
      <figure class="s7-cell">${legend}<div class="s7-plot"></div><div class="s7-tip" role="status" hidden></div></figure>
      <aside class="s7-side">${callouts.map((c, i) => `
        <div class="s7-fact" data-i="${i}">
          <div class="s7-fv">${c.swatch ? `<i class="s7-sw s7-sw-${c.swatch}" aria-hidden="true"></i>` : ''}<span class="v" aria-label="${esc(c.value)}">${esc(c.value)}</span>${c.star}</div>
          <p class="s7-ft">${c.text}</p>
          <p class="s7-fa">${esc(c.attr)}</p>
        </div>`).join('')}
      </aside>
    </div>
    ${noteHTML(note)}`;
}

// ── tooltip: placed beside the pointer, flipped so it never covers the hovered mark ──
export function placeTip(tip, cell, x, y, html, { side = 'auto', gap = 14 } = {}) {
  tip.innerHTML = html; tip.hidden = false;
  const cw = cell.clientWidth, tw = tip.offsetWidth, th = tip.offsetHeight;
  let left = side === 'left' || (side === 'auto' && x + gap + tw > cw) ? x - gap - tw : x + gap;
  left = Math.max(0, Math.min(cw - tw, left));
  const top = Math.max(0, Math.min(cell.clientHeight - th, y - th - gap));
  tip.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;
}
export const hideTip = tip => { tip.hidden = true; };

// ── story-node labels in rows that never collide (A and C) ──
// items: [{ x, text: SVGTextElement }]; returns the y of each label's row (baseline). Right-edge labels flip left.
export function rowLabels(items, right, { y0 = 14, dy = 15, gap = 10 } = {}) {
  const rows = [];
  return items.map(({ x, text }) => {
    const tw = text.getComputedTextLength(), flip = x + 5 + tw > right;
    const a = flip ? x - 5 - tw : x + 5, b = a + tw;
    let r = 0; while ((rows[r] || []).some(([p, q]) => a < q + gap && b > p - gap)) r++;
    (rows[r] ||= []).push([a, b]);
    const y = y0 + r * dy;
    text.setAttribute('x', flip ? x - 5 : x + 5); text.setAttribute('y', y); text.setAttribute('text-anchor', flip ? 'end' : 'start');
    return y;
  });
}

// Hybrid chapter chrome (build/hybrid, 2026-11-13; Gate 0 frames 02a / 02b). Shared by every hybrid chapter.
//   title card  kicker (number + dates), claim headline (Protest Revolution, ONE line, fitted to the width:
//               Vali 2026-11-13), red rule, dek. Enters with an anime.js stagger (words rise), then docks:
//   opening     a full-bleed card in the page colour behind the title: the chapter opening is its own scene
//   lockup      the same headline small, top-left, for the rest of the chapter (signposting; never over content)
//   captions    one card at a time (date kicker + ≤ 40 words + stars), crossfaded by p
// Purity: one paused anime.js timeline per chapter, 1000 ms long; update(p) maps the scene's p into the title window
// and seeks it. Captions are plain functions of p. Nothing here listens to scroll or time.
import { createTimeline, utils } from 'animejs';
import { esc } from './text.js';
import { star } from './star.js';
import { CHAPTERS, render } from '../data/copy.js';

const CSS = new URL('./chapter.css', import.meta.url).href;
const loadCss = href => { if (!document.querySelector(`link[href="${href}"]`)) document.head.insertAdjacentHTML('beforeend', `<link rel="stylesheet" href="${href}">`); };
export const CH = Object.fromEntries(CHAPTERS.map(c => [c.id, c]));
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const kick = c => `<p class="hy-kick">${c.n && c.n !== '—' ? `<span class="n">${esc(c.n)}</span>` : ''}${esc(c.kicker || c.label)}</p>`;
// caption html with {{vars}} filled ([MISSING: var] if absent) and {*ids|claimant} → footer stars
export function captionHTML(id, k, sources, vars = {}) {
  const c = CH[id].captions[k];
  const html = c.html.replace(/\{\{(\w+)\}\}/g, (_, v) => vars[v] ?? `<span class="missing">[MISSING: ${esc(v)}]</span>`);
  return `<p class="when">${esc(c.when)}</p><p>${render(html, sources, star)}</p>`;
}

// host: the scene root. opts.title = [in0, in1, out0, out1] in the scene's p (title in, hold, docks out).
// opts.lock: { boxed } ; opts.caps: [[k, a, b], …] caption k shown on p ∈ [a, b] (0.025 crossfades), placed by CSS
export function createChapter(host, id, data, { title = [0, .06, .12, .17], lock = {}, caps = [], vars = {}, capClass = '' } = {}) {
  loadCss(CSS);
  const c = CH[id], src = data.byId.source;
  const words = c.headline.split(' ').map(w => `<span class="w">${esc(w)}</span>`).join(' ');
  // each chapter in its own wrapper (display: contents, so children still position against host): S5 hosts three
  host.insertAdjacentHTML('beforeend', `<div class="hy-ch" data-ch="${esc(id)}">
    <div class="hy-open" aria-hidden="true"></div>
    <div class="hy-title"><div class="in">${kick(c)}<h2>${words}</h2><div class="rule"></div><p class="dek">${render(esc(c.dek || ''), src, star)}</p></div></div>
    <div class="hy-lock${lock.boxed ? ' boxed' : ''}" aria-hidden="true">${kick(c)}<h2>${esc(c.headline)}</h2></div>
    ${caps.map(([k], i) => `<div class="hy-cap ${capClass}" data-cap="${i}">${captionHTML(id, k, src, vars)}</div>`).join('')}</div>`);
  const box = host.lastElementChild;
  const el = { box, open: box.querySelector(':scope > .hy-open'), title: box.querySelector(':scope > .hy-title'), lock: box.querySelector(':scope > .hy-lock'), caps: [...box.querySelectorAll(':scope > .hy-cap')] };
  const h2 = el.title.querySelector('h2'), ws = [...h2.querySelectorAll('.w')];
  // the timeline: 0–450 in (kicker, words, rule, dek), 450–700 hold, 700–1000 out (title up and away, lockup in)
  const tl = createTimeline({ autoplay: false, defaults: { ease: 'outQuart', duration: 260 } });
  tl.add({ duration: 1000 }, 0);
  const set = (t, from, to, pos, params = {}) => { utils.set(t, from); const pr = {}; for (const k in to) pr[k] = [from[k], to[k]]; tl.add(t, { ...pr, ...params }, pos); };
  set(el.title.querySelector('.hy-kick'), { opacity: 0, translateY: 14 }, { opacity: 1, translateY: 0 }, 0);
  ws.forEach((w, i) => set(w, { opacity: 0, translateY: 46 }, { opacity: 1, translateY: 0 }, 60 + i * 40, { duration: 300 }));
  set(el.title.querySelector('.rule'), { scaleX: 0 }, { scaleX: 1 }, 260, { duration: 220 });
  set(el.title.querySelector('.dek'), { opacity: 0, translateY: 18 }, { opacity: 1, translateY: 0 }, 320, { duration: 200 });
  set(el.title.querySelector('.in'), { opacity: 1, translateY: 0 }, { opacity: 0, translateY: -40 }, 700, { duration: 240, ease: 'inQuad' });   // inner: .hy-title keeps its CSS centring
  // the opening card covers the scene while the title holds (Vali 2026-11-13: chapter openings get their own scene)
  utils.set(el.open, { opacity: 0 });
  tl.add(el.open, { opacity: [0, 1], duration: 140, ease: 'linear' }, 0);
  tl.add(el.open, { opacity: [1, 0], duration: 240, ease: 'inOutSine' }, 720);
  set(el.lock, { opacity: 0, translateY: -8 }, { opacity: 1, translateY: 0 }, 820, { duration: 180 });
  const fit = w => {   // one line, fitted (Vali 2026-11-13); balanced wrap only if even 56 px can't fit
    h2.style.fontSize = ''; h2.style.whiteSpace = 'nowrap'; h2.style.textWrap = '';
    const max = w - 2 * parseFloat(getComputedStyle(el.title).left || 120);
    let fs = parseFloat(getComputedStyle(h2).fontSize);
    while (h2.scrollWidth > max && fs > 56) { fs -= 2; h2.style.fontSize = fs + 'px'; }
    if (h2.scrollWidth > max) { h2.style.whiteSpace = 'normal'; h2.style.textWrap = 'balance'; }
  };
  // window → timeline ms: [in0, in1] → 0–450, [in1, out0] → 450–700, [out0, out1] → 700–1000
  const msAt = p => {
    const [a, b, c2, d] = title;
    if (p <= a) return 0; if (p < b) return 450 * (p - a) / (b - a);
    if (p < c2) return 450 + 250 * (p - b) / (c2 - b); if (p < d) return 700 + 300 * (p - c2) / (d - c2);
    return 1000;
  };
  // fit lazily: a pinned scene's root is display:none until it is live, and a hidden h2 measures 0 wide
  let fitW = 0, fitted = 0;
  return {
    el,
    resize(w) { fitW = w; fitted = 0; },
    // p: the scene's p. lockAlpha: an extra multiplier for the lockup (scenes fade it at their own ends)
    update(p, { lockAlpha = 1, capAlpha = 1 } = {}) {
      if (fitted !== fitW && el.title.offsetParent) { fit(fitW || innerWidth); fitted = fitW; }
      tl.seek(msAt(p));
      el.title.style.visibility = p > title[3] ? 'hidden' : '';
      el.open.style.visibility = +el.open.style.opacity > .001 ? 'visible' : 'hidden';
      if (lockAlpha !== 1) el.lock.style.opacity = String(Math.min(+el.lock.style.opacity || 0, lockAlpha));
      el.lock.style.visibility = +el.lock.style.opacity > .001 ? '' : 'hidden';
      caps.forEach(([, a, b], i) => {
        const al = clamp01((p - a) / .025) * (1 - clamp01((p - b) / .025)) * capAlpha, e = el.caps[i];
        e.style.opacity = al.toFixed(3); e.style.visibility = al > .001 ? '' : 'hidden';
        e.style.transform = `translateY(${((1 - Math.min(1, al * 1.4)) * 10).toFixed(1)}px)`;
      });
    },
  };
}

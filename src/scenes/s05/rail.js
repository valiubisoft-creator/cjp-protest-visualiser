// S5 · rail (S5b part; third build 2026-11-12 after Vali's review: "fact sources in small text as a footnote; the
// map spans the screen; the narrative comes on small modal boxes on the map with line pointers").
// createRail({ host, model, data, onMeasure }) → { resize(w, h), update(p), unload(), metrics(), anchor(), cardBox() }
//
// The host covers the map area (transparent, pointer-events none; s05-map.css). One floating card per beat, all
// pre-built and stacked at the same top-right spot (right 24, top 24, width --s5-card-w, max-height host − 48); only
// the current one shows, plus the outgoing / incoming one during a transition. Card: kicker (hour beats: the time
// large) · title · one media item (16:9 video poster or image ≤ 200 px) · narrative paragraphs (beat.copy, star tokens
// {*ids|claimant} → star()) · Sources footnotes (≤ 5 facts: featured, or showable for hour beats; text — attribution ·
// STATUS + star) · people chips (28 px avatar, name, role, licence credit).
//
// Motion, pure in p (model.phase): hold of beat k → its card at rest, inner content translated up by its overflow
// O_k·u (u = (p − ha)/(hb − ha)) so a long card reads through. Transition a→b: a fades and rises 16 px over t 0–0.5
// (inner at its end), b fades in from 16 px below over t 0.5–1 (inner at its start). Lead-in / lead-out: no card on
// that side. No timers: the same p always gives the same DOM.
//
// Measure (per viewport, after fonts): content height H_k of each card → onMeasure(H) (the scene re-slots beats by
// reading length). anchor() gives the leader-line start on the dominant card's left edge (title middle).
// Images lazy (±2 cards around the current). YouTube: poster only, no network until clicked; one iframe, only in
// the current card, back to the poster when it stops being current and in unload(). Flagged media show
// "Flagged for review" + data-flag (GAPS → Media).
import { esc, showable } from '../../lib/text.js';
import { fmtDate, dayN } from '../../lib/dates.js';
import { star } from '../../lib/star.js';
import { clamp01, ease } from '../../roach/swarm.js';
import { loadCss } from '../s00-hero.js';
import { featured } from './beats.js';

const CSS = new URL('./rail.css', import.meta.url).href;
const asset = src => new URL('../../../' + src, import.meta.url).href;   // data paths are repo-relative
const INSET = 24;                    // card offset from the host's top and right edges (px)
const RISE = 16;                     // px a card travels in a transition
const LAZY = 2;
const MAX_SRC = 5, MAX_PEOPLE = 2;
const FLAGGED = { eAmtVu_Sqhk: 'misinfo-review' };   // GAPS → Media; a media `flag` field wins
const flagOf = m => m.flag || FLAGGED[m.youtube_id] || null;

export function createRail({ host, model, data, onMeasure }) {
  loadCss(CSS);
  const sources = data.byId.source, N = model.N;
  host.innerHTML = '';
  host.classList.add('s5r-host');
  const cards = model.beats.map(B => buildCard(B, sources));
  for (const c of cards) host.append(c.el);
  host.addEventListener('click', onClick);

  let H = 0, HW = 0, CW = 0, CH = 0, measured = false, cur = -2, live = null, lastP = null, dom = null;
  const SH = new Float64Array(N), O = new Float64Array(N), TY = new Float64Array(N), VH = new Float64Array(N);
  const shown = new Set();
  document.fonts?.ready.then(() => { measured = false; if (lastP != null) update(lastP); });

  function resize(w, h) { H = h; measured = false; measure(); if (lastP != null) update(lastP); }

  // ── measure (needs a box: the host is display:none while S5 isn't live) ──
  function measure() {
    if (measured || !H || !host.clientHeight) return measured;
    HW = host.clientWidth; CH = host.clientHeight - 2 * INSET;
    host.style.setProperty('--s5r-max', CH + 'px');
    for (let k = 0; k < N; k++) {
      const { el, inner, title } = cards[k];
      SH[k] = inner.offsetHeight;                          // full content height (padding included)
      VH[k] = Math.min(SH[k], el.clientHeight || CH);      // visible height of the card box
      O[k] = Math.max(0, SH[k] - VH[k]);
      TY[k] = title ? title.offsetTop + title.offsetHeight / 2 : 24;
    }
    CW = cards[0]?.el.offsetWidth || 0;
    measured = true;
    onMeasure?.(Array.from(SH));   // the scene re-slots beats by content (beats.js reslot)
    return true;
  }

  // ── one frame for p ──
  function update(p) {
    lastP = p;
    if (!N || !measure()) return;
    const { a, b, t } = model.phase(p);
    const want = new Map();                                 // k → [card y, opacity, inner y]
    if (a === b) {
      if (a >= 0 && a < N) { const B = model.beats[a], u = clamp01((p - B.ha) / Math.max(1e-9, B.hb - B.ha)); want.set(a, [0, 1, -O[a] * u]); }
    } else {
      if (a >= 0 && t < .5) { const e = ease.inOutSine(clamp01(t / .5)); want.set(a, [-RISE * e, 1 - e, -O[a]]); }
      if (b < N && t > .5) { const e = ease.inOutSine(clamp01((t - .5) / .5)); want.set(b, [RISE * (1 - e), e, 0]); }
    }
    for (const k of shown) if (!want.has(k)) { hide(cards[k]); shown.delete(k); }
    dom = null;
    for (const [k, v] of want) { show(cards[k], v); shown.add(k); if (!dom || v[1] > dom.o) dom = { k, o: v[1], y: v[0], iy: v[2] }; }

    const k = a === b ? a : t < .5 ? a : b, now = k >= 0 && k < N ? k : -1;
    if (now !== cur) {
      if (cur >= 0) cards[cur].el.setAttribute('aria-hidden', 'true');
      if (now >= 0) cards[now].el.setAttribute('aria-hidden', 'false');
      cur = now;
      if (live != null && live !== cur) unloadVideo();
      for (let j = now - LAZY; j <= now + LAZY; j++) if (cards[j]) arm(cards[j]);
    }
  }
  function show(c, [y, o, iy]) {
    const key = `${y.toFixed(1)}|${o.toFixed(3)}|${iy.toFixed(1)}`;
    if (c.key === key) return; c.key = key;
    c.el.style.transform = `translateY(${Math.round(y)}px)`; c.el.style.opacity = o.toFixed(3); c.el.style.visibility = '';
    c.inner.style.transform = `translateY(${Math.round(iy)}px)`;
    c.el.classList.toggle('at-top', iy > -1); c.el.classList.toggle('at-end', iy < -O[c.i] + 1);
    arm(c);
  }
  function hide(c) { c.key = null; c.el.style.visibility = 'hidden'; c.el.style.opacity = '0'; }
  function arm(c) { if (c.armed) return; c.armed = true; for (const img of c.el.querySelectorAll('img[data-src]')) { img.src = img.dataset.src; img.removeAttribute('data-src'); } }

  // ── YouTube: click-to-load (current card only) ──
  function onClick(e) {
    const btn = e.target.closest('.s5r-yt-load'); if (!btn) return;
    const k = +btn.closest('.s5r-card').dataset.beat;
    if (k !== cur) return;
    unloadVideo();
    const box = btn.closest('.s5r-media');
    const f = document.createElement('iframe');
    f.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(box.dataset.yt)}?rel=0&modestbranding=1&playsinline=1`;
    f.title = box.dataset.title; f.allow = 'encrypted-media; picture-in-picture; fullscreen'; f.allowFullscreen = true;
    f.referrerPolicy = 'strict-origin-when-cross-origin'; f.className = 's5r-frame';
    cards[k].poster = btn; btn.replaceWith(f);
    live = k; f.focus?.();
  }
  function unloadVideo() {
    if (live == null) return;
    const c = cards[live], f = c.el.querySelector('iframe.s5r-frame');
    if (f) { f.src = 'about:blank'; f.replaceWith(c.poster); }
    live = null;
  }

  return {
    resize, update,
    unload() { unloadVideo(); },
    // per-card content height and overflow past the card box, for the current viewport
    metrics() { measure(); return model.beats.map((B, k) => ({ id: B.id, h: Math.round(SH[k]), overflow: Math.round(O[k]) })); },
    // leader-line start (host px): the dominant card's left edge at its title's middle, clamped inside the card
    anchor() {
      if (!dom || !measured) return null;
      const top = INSET + dom.y, y = Math.max(top + 12, Math.min(top + VH[dom.k] - 12, top + TY[dom.k] + dom.iy));
      return { x: HW - INSET - CW, y, alpha: dom.o };
    },
    // the card's box for camera padding (static per viewport: the max height)
    cardBox() { measure(); return { x: HW - INSET - CW, y: INSET, w: CW, h: CH }; },
  };
}

/* ── card builders (strings from data only; every stat carries a star) ── */
function buildCard(B, sources) {
  const hour = B.kind === 'hour';
  const facts = (B.facts || []).filter(hour ? showable : featured).slice(0, MAX_SRC);
  const media = (B.media || []).filter(m => (m.type === 'youtube' && m.youtube_id) || (m.type !== 'youtube' && m.src));
  const people = (B.people || []).slice(0, MAX_PEOPLE);
  const copy = (B.copy || []).filter(s => s && String(s).trim());
  const fast = B.fast ? ` · Fast day ${B.fast}` : '';
  const kick = hour
    ? `<p class="s5r-kick hour"><span class="s5r-time t-num">${esc(B.time)}</span><span class="t-micro t-num">${esc(fmtDate(B.date))} · Day ${dayN(B.date)}${fast}</span></p>`
    : `<p class="s5r-kick t-micro t-num">${esc(`${fmtDate(B.date)} ${B.date.slice(0, 4)} · Day ${dayN(B.date)}${fast}`)}</p>`;
  const el = document.createElement('article');
  el.className = 's5r-card' + (hour ? ' is-hour' : ''); el.dataset.beat = B.i; el.dataset.id = B.id;
  el.setAttribute('aria-hidden', 'true'); el.style.visibility = 'hidden'; el.style.opacity = '0';
  el.innerHTML = `<div class="s5r-in">${kick}
    <h3 class="s5r-title">${esc(B.title)}</h3>
    ${media[0] ? mediaBlock(media[0]) : ''}
    ${copy.length ? `<div class="s5r-copy">${copy.map(s => `<p>${prose(s, sources)}</p>`).join('')}</div>` : ''}
    ${facts.length ? `<div class="s5r-src"><p class="t-micro">Sources</p><ol>${facts.map(f => footnote(f, sources)).join('')}</ol></div>` : ''}
    ${people.length ? `<div class="s5r-people">${people.map(personChip).join('')}</div>` : ''}
  </div><div class="s5r-fade t" aria-hidden="true"></div><div class="s5r-fade b" aria-hidden="true"></div>`;
  return { i: B.i, el, inner: el.firstElementChild, title: el.querySelector('.s5r-title'), poster: null, armed: false, key: null };
}

// body copy: escape the text, turn {*id1,id2|claimant} into star() links
function prose(s, sources) {
  let out = '', i = 0;
  for (const m of String(s).matchAll(/\{\*([^}|]*)(?:\|([^}]*))?\}/g)) {
    out += esc(s.slice(i, m.index)) + star(m[1].split(',').map(x => x.trim()).filter(Boolean), sources, m[2] || '');
    i = m.index + m[0].length;
  }
  return out + esc(s.slice(i));
}

// a fact as a footnote: text — attribution · STATUS *
function footnote(f, sources) {
  return `<li>${esc(f.text)} — ${esc(f.attribution)} · <span class="s5r-st st-${esc(f.status)}">${esc(f.status)}</span>${star(f.source_ids, sources, f.claimant)}</li>`;
}

function personChip(p) {
  const img = p.image?.src ? `<img data-src="${esc(asset(p.image.src))}" alt="" decoding="async">`
    : `<span class="ini" aria-hidden="true">${esc(p.name.split(' ').map(w => w[0]).join(''))}</span>`;
  return `<figure class="s5r-person">${img}<figcaption><b>${esc(p.name)}</b>${p.role ? ` <span>${esc(p.role)}</span>` : ''}${p.image?.credit ? `<small>${esc(p.image.credit)}</small>` : ''}</figcaption></figure>`;
}

function mediaBlock(m) {
  const flag = flagOf(m);
  const fl = flag ? ` data-flag="${esc(flag)}"` : '';
  const flagLine = flag ? `<small class="s5r-flag">Flagged for review</small>` : '';
  if (m.type === 'youtube') return `<figure class="s5r-media yt"${fl} data-yt="${esc(m.youtube_id)}" data-title="${esc(m.caption)}">
    <div class="s5r-vid"><button type="button" class="s5r-poster s5r-yt-load" aria-label="Load video: ${esc(m.caption)}"><span class="play" aria-hidden="true"></span><span class="yt-t">${esc(m.caption)}</span></button></div>
    <figcaption>${flagLine}<span class="cap">${esc(m.credit)}${m.upload_date ? ` · uploaded ${esc(fmtDate(m.upload_date))}` : ''}</span><small>Click to load · video review ${esc(m.review || 'pending')}</small></figcaption></figure>`;
  const ar = m.w > 0 && m.h > 0 ? `${m.w} / ${m.h}` : '3 / 2';
  const time = m.time ? `<span class="s5r-mt t-num">${esc(m.time)}</span> ` : '';
  return `<figure class="s5r-media img"${fl}><div class="s5r-img" style="aspect-ratio:${ar}"><img data-src="${esc(asset(m.src))}" alt="${esc(m.alt || '')}" decoding="async"></div>
    <figcaption>${flagLine}${m.caption ? `<span class="cap">${time}${esc(m.caption)}</span>` : time}${m.credit ? `<small>${esc(m.credit)}</small>` : ''}</figcaption></figure>`;
}

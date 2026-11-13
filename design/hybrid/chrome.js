// Hybrid storyboard chrome (Gate 0): title card, docked lockup, caption card, all from copy.js.
// Used both by frames.html (new chapters) and overlay.js (injected over live v3 frames).
import { load } from '../../src/data/load.js';
import { star } from '../../src/lib/star.js';
import { esc } from '../../src/lib/text.js';
import { CHAPTERS, render, words } from './copy.js';

export const CH = Object.fromEntries(CHAPTERS.map(c => [c.id, c]));

// sources.json, then the runtime merges in v3's order (sansad, apparatus), then this chat's drafts
let SRC;
export async function sources() {
  if (SRC) return SRC;
  const base = (await load('story/sources.json')).sources;
  const extra = await Promise.all(['sansad_chalo', 'apparatus', 'withheld', 'october_counts', 'voter_roll', 'neet', 'detentions']
    .map(n => load(`story/${n}.json`).then(j => j.new_sources || []).catch(() => [])));
  const all = [...base];
  for (const list of extra) for (const s of list) if (!all.some(a => a.id === s.id)) all.push(s);
  SRC = Object.fromEntries(all.map((s, i) => [s.id, { ...s, n: i + 1 }]));
  return SRC;
}
export const missingIds = (html, S) => [...html.matchAll(/\{\*([^|}]+)/g)].flatMap(m => m[1].split(',')).filter(id => !S[id]);

export function css() {
  if (!document.querySelector('link[data-hy]')) document.head.insertAdjacentHTML('beforeend', `<link rel="stylesheet" data-hy href="/design/hybrid/hybrid.css">`);
  return new Promise(r => setTimeout(r, 120));
}
export function root() {
  let r = document.querySelector('.hy-root');
  if (!r) { r = document.createElement('div'); r.className = 'hy-root'; document.body.append(r); }
  return r;
}
const kick = c => `<p class="hy-kick">${c.n && c.n !== '—' ? `<span class="n">${esc(c.n)}</span>` : ''}${esc(c.kicker || c.label)}</p>`;

export function titleCard(host, id, S) {
  const c = CH[id];
  // Vali 2026-11-13: the headline flows as one line (Protest Revolution's full stop reads like a comma, so a break
  // after it looked like a sentence broken after a comma). Fit the size to the width; balance only if it can't fit.
  host.insertAdjacentHTML('beforeend', `<div class="hy-title">${kick(c)}<h2 style="white-space:nowrap">${esc(c.headline)}</h2><div class="rule"></div><p class="dek">${render(esc(c.dek), S, star)}</p></div>`);
  const el = host.lastElementChild, h2 = el.querySelector('h2'), max = innerWidth - 240;
  el.style.maxWidth = max + 'px';
  let fs = parseFloat(getComputedStyle(h2).fontSize);
  while (h2.scrollWidth > max && fs > 56) { fs -= 2; h2.style.fontSize = fs + 'px'; }
  if (h2.scrollWidth > max) Object.assign(h2.style, { whiteSpace: 'normal', textWrap: 'balance' });
  return el;
}
export function lock(host, id, { boxed = true, style = '' } = {}) {
  const c = CH[id];
  host.insertAdjacentHTML('beforeend', `<div class="hy-lock${boxed ? ' boxed' : ''}" style="${style}">${kick(c)}<h2>${esc(c.headline)}</h2></div>`);
  return host.lastElementChild;
}
// caption k of chapter id, positioned by style; shows a small word count (storyboard only)
export function cap(host, id, k, S, { style = '', title = '', vars = {} } = {}) {
  const c0 = CH[id].captions[k], c = { ...c0, html: c0.html.replace(/\{\{(\w+)\}\}/g, (_, v) => vars[v] ?? `[MISSING: ${v}]`) };
  const miss = missingIds(c.html, S);
  if (miss.length) console.warn('[hybrid] unresolved source ids', id, k, miss);
  host.insertAdjacentHTML('beforeend', `<div class="hy-cap" style="${style}"><p class="when">${esc(c.when)}</p>${title ? `<h3>${esc(title)}</h3>` : ''}<p>${render(c.html, S, star)}</p><span class="hy-wc">${words(c.html)} words</span></div>`);
  return host.lastElementChild;
}
export const stamp = (host, text) => host.insertAdjacentHTML('beforeend', `<div class="hy-stamp">${esc(text)}</div>`);

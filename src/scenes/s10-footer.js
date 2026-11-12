// S10 · Credit, methodology, disclaimer + numbered sources (S8-S10 chat, 2026-11-12, GATE 1: static).
// Brief: docs/build/scenes/S8-S10.md. Last flow section on the page, auto height (S10 p 1 = page end). Reading section:
// paper colours inside the ink theme (`.reading`).
//
// Sources: every entry of data.sources.sources, numbered N = data.byId.source[id].n, rendered with id="src-N" and a
// back-link (returns to where the reader clicked the *). The 20 Jul sources (sansad_chalo.json new_sources) are appended
// to the ledger by S5's init; inits run concurrently, so S10 applies the SAME idempotent merge (same order, same
// numbering, skipped if already there) before it renders, so its height is final before the controller's layout.
// update() re-renders the list if the ledger has grown since (defensive).
//
// Text is verbatim from meta.designer_credit, methodology.* (disclaimer unedited), sources.json, the timeline people /
// media and imagery.json credits, and data/map/base.json meta.attribution (lazy map file; filled in when it lands).
// Facts with hold / status 'unverified' never show (showable()).
import { esc, showable } from '../lib/text.js';
import { star } from '../lib/star.js';
import { story, baseMap } from '../data/load.js';
import { loadCss } from './s00-hero.js';

const CSS = new URL('./s10-footer.css', import.meta.url).href;
const ext = 'target="_blank" rel="noopener noreferrer"';
const link = (url, text) => url ? `<a href="${esc(url)}" ${ext}>${text}</a>` : text;
const human = k => k.replace(/_/g, ' ').replace(/^./, c => c.toUpperCase());   // collection_dates keys → labels

export default def => {
  let ctx, el = {}, rendered = 0, lastStar = null;
  const scene = {
    id: def.id,
    async init(c) {
      ctx = c; loadCss(CSS);
      const opt = n => story(n).catch(() => null);
      const [imagery, sansad] = await Promise.all([opt('imagery'), opt('sansad_chalo')]);
      // same merge as s05-map.js init (idempotent; whichever runs first wins, the numbering is identical)
      for (const ns of sansad?.new_sources || []) if (!c.data.byId.source[ns.id]) { c.data.sources.sources.push(ns); c.data.byId.source[ns.id] = { ...ns, n: c.data.sources.sources.length }; }

      const r = c.root; r.classList.add('s10', 'reading'); r.id = 'sources-footer';
      r.innerHTML = `<div class="s10-in">
        <div class="s10-cols">
          <section class="s10-credit" aria-labelledby="s10-h-credit"><h2 id="s10-h-credit">Credit</h2>${credit(c.data, imagery)}</section>
          <section class="s10-meth" aria-labelledby="s10-h-meth"><h2 id="s10-h-meth">Methodology</h2>${method(c.data)}</section>
          <section class="s10-disc" aria-labelledby="s10-h-disc"><h2 id="s10-h-disc">Disclaimer</h2>${disclaimer(c.data)}</section>
          ${notes(c.data)}
        </div>
        <section class="s10-src" id="sources" aria-labelledby="s10-h-src"><h2 id="s10-h-src">Sources</h2><ol class="s10-list"></ol></section>
      </div>`;
      el = { list: r.querySelector('.s10-list'), osm: r.querySelector('.s10-osm') };
      renderSources();
      // OSM credit from the (lazy, cached) base map; the line is reserved so the height doesn't change
      baseMap().then(m => { el.osm.textContent = m?.meta?.attribution ?? ''; if (!m?.meta?.attribution) el.osm.innerHTML = '<span class="missing">[MISSING: base.json meta.attribution]</span>'; })
        .catch(() => { el.osm.innerHTML = '<span class="missing">[MISSING: base.json meta.attribution]</span>'; });

      // back-links: remember where the reader was when they followed a *
      document.addEventListener('click', e => { const a = e.target.closest?.('a.star'); if (a) lastStar = { y: scrollY, n: a.getAttribute('href') }; }, true);
      r.addEventListener('click', e => {
        const b = e.target.closest('.s10-back'); if (!b) return;
        e.preventDefault();
        if (lastStar) { scrollTo({ top: lastStar.y, behavior: 'instant' }); return; }
        const s = document.querySelector(`a.star[href="#src-${b.dataset.n}"]`);   // no * followed yet: the first * citing it
        const id = s?.closest('[data-scene]')?.dataset.scene;
        if (id && ctx.controller) ctx.controller.seek(id, .5);
      });
    },
    resize() {},
    enter() {},
    update() { if (ctx.data.sources.sources.length !== rendered) renderSources(); },   // pure: the list only grows with the ledger
    exit() {},
  };

  function renderSources() {
    const { sources, byId } = { sources: ctx.data.sources.sources, byId: ctx.data.byId.source };
    el.list.innerHTML = sources.map(s => {
      const n = byId[s.id]?.n;
      const title = s.title && s.title !== s.publisher ? `, ${link(s.url, esc(s.title))}` : '';
      const pub = !title && s.url ? link(s.url, esc(s.publisher)) : esc(s.publisher);
      return `<li id="src-${n}"><b class="t-num">[${n}]</b><span>${pub}${title}${s.date ? `, <span class="t-num">${esc(s.date)}</span>` : ''}`
        + ` <a class="s10-back" href="#" data-n="${n}" aria-label="Back to the text (source ${n})">↩</a></span></li>`;
    }).join('');
    rendered = sources.length;
  }
  return scene;
};

/* ── Credit: the designer, the map data, portraits (people[].image) and photographs (timeline media + imagery.json) ── */
function credit(data, imagery) {
  const nodes = data.timeline.nodes;
  const people = [...new Map(nodes.flatMap(n => [...(n.people || []), ...(n.sub_beats || []).flatMap(b => b.people || [])])
    .filter(p => p.image?.credit).map(p => [p.name, p])).values()];
  const imgs = [...nodes.flatMap(n => [...(n.media || []), ...(n.sub_beats || []).flatMap(b => b.media || [])]),
    ...Object.values(imagery?.by_beat || {}).flat(), ...(imagery?.sansad_chalo || [])].filter(m => m.type === 'image' && m.credit);
  const uniq = [...new Map(imgs.map(m => [m.commons_page || m.original || m.src, m])).values()];
  const groups = new Map();
  for (const m of uniq) { if (!groups.has(m.credit)) groups.set(m.credit, []); groups.get(m.credit).push(m); }
  const files = list => list.length === 1
    ? (list[0].commons_page ? ` <a class="s10-f" href="${esc(list[0].commons_page)}" ${ext} aria-label="File on Wikimedia Commons">file</a>` : '')
    : ` <span class="s10-files">${list.map((m, i) => m.commons_page ? `<a class="s10-f t-num" href="${esc(m.commons_page)}" ${ext} aria-label="File ${i + 1} on Wikimedia Commons">${i + 1}</a>` : '').join(' ')}</span>`;
  return `<p class="s10-me"><b>${esc(data.meta.designer_credit)}</b></p>
    <p class="s10-k t-micro">Map data</p><p class="s10-small s10-osm">&nbsp;</p>
    <p class="s10-k t-micro">Portraits</p>
    <ul class="s10-small">${people.map(p => `<li>${esc(p.name)}: ${link(p.image.commons_page, esc(p.image.credit))}</li>`).join('')}</ul>
    <p class="s10-k t-micro">Photographs</p>
    <ul class="s10-small">${[...groups].map(([cr, list]) => `<li>${esc(cr)}${files(list)}</li>`).join('')}</ul>`;
}

/* ── Methodology: how roach count and size encode, the founder roach, the * convention, statuses, collection dates ──
   `attribution` and `illustrative_graphics` are left out: they are written as builder instructions ("On screen use…",
   "Vali approved…"); the disclaimer already says the drawn map elements are illustrative. The `unverified` status is
   left out of the list because unverified facts never reach the screen (showable()). Reader-facing wording: GAPS. */
const READER_KEYS = ['roach_size', 'founder_roach', 'asterisk'];
function method(data) {
  const M = data.methodology;
  const tiers = M.crowd_tiers?.tiers || [];
  const cd = M.collection_dates || {};
  return `<table class="s10-tiers"><tbody>${tiers.map(t => `<tr><td>Tier ${t.tier} · ${esc(t.label)}</td><td class="t-num">${t.roaches} roaches</td></tr>`).join('')}</tbody></table>
    ${READER_KEYS.filter(k => M[k]).map(k => `<p>${esc(M[k])}</p>`).join('')}
    <p class="s10-k t-micro">Statuses</p>
    <dl class="s10-dl">${Object.entries(M.statuses || {}).filter(([k]) => k !== 'unverified').map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>
    <p class="s10-k t-micro">Collection dates</p>
    <dl class="s10-dl">${Object.entries(cd).map(([k, v]) => `<dt>${esc(human(k))}</dt><dd>${esc(v)}</dd>`).join('')}</dl>`;
}

/* ── Disclaimer: verbatim, unedited (approved by Vali 2026-11-12); an e-mail address becomes a mailto link ── */
function disclaimer(data) {
  const d = data.methodology.disclaimer;
  if (!d?.paragraphs?.length) return `<p><span class="missing">[MISSING: methodology.disclaimer]</span></p>`;
  return d.paragraphs.map(p => `<p>${esc(p).replace(/([\w.+-]+@[\w-]+\.[\w.]+)/g, '<a href="mailto:$1">$1</a>')}</p>`).join('');
}

/* ── Caveats and disputed claims (methodology): spans the methodology + disclaimer columns ── */
function notes(data) {
  const M = data.methodology, by = data.byId.source;
  const item = f => `<li>${esc(f.text)}${star(f.source_ids, by, f.attribution)}</li>`;
  const cav = (M.caveats || []).filter(showable), dis = (M.disputed_claims || []).filter(showable);
  if (!cav.length && !dis.length) return '';
  return `<div class="s10-notes">
    ${cav.length ? `<div><p class="s10-k t-micro">Caveats</p><ul class="s10-ul">${cav.map(item).join('')}</ul></div>` : ''}
    ${dis.length ? `<div><p class="s10-k t-micro">Disputed claims</p><ul class="s10-ul">${dis.map(item).join('')}</ul></div>` : ''}
  </div>`;
}

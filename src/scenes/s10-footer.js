// S10 · Disclaimer, credit, methodology + numbered sources (S8-S10 chat, 2026-11-12; compacted 2026-11-13, hybrid).
// Brief: docs/build/scenes/S8-S10.md. Last flow section on the page, auto height (S10 p 1 = page end). Ink theme.
//
// Compact footer (Vali 2026-11-13): one 12-column grid (shell.css --g-m outer margin, --g-gut gutters).
//   cols 1–7   the disclaimer, always fully visible (the one thing that must be evident)
//   cols 9–12  the designer credit, two buttons that open modals (References, Map and image credits), then two
//              collapsed accordions (native <details>): Methodology, Caveats and disputed claims
// The modals are native <dialog>s opened with showModal(): a visible Close button, Esc closes, a click on the backdrop
// closes, and focus returns to whatever opened them.
//
// The * contract (src/lib/star.js): every stat carries <a class="star" href="#src-N">*</a>. A click on ANY star on the
// page (one delegated listener on document) opens the References modal, scrolls entry src-N into view inside the modal
// and highlights it; the page itself never scrolls. href="#sources" (unresolved) just opens the modal. Each entry's back
// link (↩) closes the modal and returns the reader to the * they clicked; if the modal was opened from the footer button
// instead, it seeks to the first * that cites the entry. A page loaded with #src-N or #sources opens the modal too.
//
// Sources: every entry of data.sources.sources, numbered N = data.byId.source[id].n, rendered with id="src-N". The 20 Jul
// sources (sansad_chalo.json new_sources) are appended to the ledger by S5's init; inits run concurrently, so S10 applies
// the SAME idempotent merge (same order, same numbering, skipped if already there) before it renders. update()
// re-renders the list if the ledger has grown since (defensive).
//
// Text is verbatim from meta.designer_credit, methodology.* (disclaimer unedited), sources.json, the timeline people /
// media and imagery.json credits, and data/map/base.json meta.attribution (lazy map file; filled in when it lands).
// Facts with hold / status 'unverified' never show (showable()). Button / summary labels are UI copy.
import { esc, showable } from '../lib/text.js';
import { star } from '../lib/star.js';
import { story, baseMap } from '../data/load.js';
import { loadCss } from './s00-hero.js';

const CSS = new URL('./s10-footer.css', import.meta.url).href;
const ext = 'target="_blank" rel="noopener noreferrer"';
const link = (url, text) => url ? `<a href="${esc(url)}" ${ext}>${text}</a>` : text;
const human = k => k.replace(/_/g, ' ').replace(/^./, c => c.toUpperCase());   // collection_dates keys → labels
const MISSING_OSM = '<span class="missing">[MISSING: base.json meta.attribution]</span>';

export default def => {
  let ctx, el = {}, rendered = 0;
  let from = null;   // { opener, y } of the current References session: the * (or button) that opened it and the page's scrollY
  const scene = {
    id: def.id,
    async init(c) {
      ctx = c; loadCss(CSS);
      const opt = n => story(n).catch(() => null);
      const [imagery, sansad] = await Promise.all([opt('imagery'), opt('sansad_chalo')]);
      // same merge as s05-map.js init (idempotent; whichever runs first wins, the numbering is identical)
      for (const ns of sansad?.new_sources || []) if (!c.data.byId.source[ns.id]) { c.data.sources.sources.push(ns); c.data.byId.source[ns.id] = { ...ns, n: c.data.sources.sources.length }; }

      const r = c.root; r.classList.add('s10'); r.id = 'sources-footer';   // ink (Vali 2026-11-13, hybrid: the whole piece in black)
      const notes = notesHtml(c.data);
      r.innerHTML = `<div class="s10-in">
        <section class="s10-disc" aria-labelledby="s10-h-disc"><h2 id="s10-h-disc">Disclaimer</h2>${disclaimer(c.data)}</section>
        <div class="s10-side">
          <p class="s10-k t-micro">Credit</p>
          <p class="s10-me">${esc(c.data.meta.designer_credit)}</p>
          <div class="s10-btns">
            <button type="button" class="s10-open" data-dlg="refs" aria-haspopup="dialog"><span>References</span><span class="s10-count t-num"></span></button>
            <button type="button" class="s10-open" data-dlg="credits" aria-haspopup="dialog"><span>Map and image credits</span></button>
          </div>
          <details class="s10-acc"><summary><span>Methodology</span></summary><div class="s10-acc-in">${method(c.data)}</div></details>
          ${notes ? `<details class="s10-acc"><summary><span>Caveats and disputed claims</span></summary><div class="s10-acc-in">${notes}</div></details>` : ''}
        </div>
      </div>
      ${dialog('refs', 'sources', 'References', '<ol class="s10-list"></ol>')}
      ${dialog('credits', 's10-credits', 'Map and image credits', credit(imagery, c.data))}`;
      const $ = s => r.querySelector(s);
      el = { list: $('.s10-list'), count: $('.s10-count'), osm: $('.s10-osm'),
        refs: $('[data-dlg-id="refs"]'), credits: $('[data-dlg-id="credits"]') };
      renderSources();
      // OSM credit from the (lazy, cached) base map
      baseMap().then(m => { if (m?.meta?.attribution) el.osm.textContent = m.meta.attribution; else el.osm.innerHTML = MISSING_OSM; })
        .catch(() => { el.osm.innerHTML = MISSING_OSM; });

      // footer buttons open their modal
      r.querySelectorAll('.s10-open').forEach(b => b.addEventListener('click', () => {
        if (b.dataset.dlg === 'refs') openRefs(null, b); else el.credits.showModal();
      }));
      // every dialog: Close button, backdrop click (the dialog box itself has no padding, so a click ON it is the backdrop)
      for (const d of [el.refs, el.credits]) {
        d.querySelector('.s10-x').addEventListener('click', () => d.close());
        d.addEventListener('click', e => { if (e.target === d) d.close(); });
      }
      el.credits.addEventListener('close', () => r.querySelector('[data-dlg="credits"]').focus({ preventScroll: true }));
      el.refs.addEventListener('close', () => {
        const f = from; from = null;
        if (!f) return;
        f.opener?.isConnected && f.opener.focus({ preventScroll: true });   // focus back where the reader was
        if (Math.abs(scrollY - f.y) > 1) scrollTo({ top: f.y, behavior: 'instant' });   // and never move the page
        if (f.seekTo) f.seekTo();
      });

      // the * contract: any star anywhere opens the References modal on its entry (capture: before any scene handler)
      document.addEventListener('click', e => {
        const a = e.target.closest?.('a.star'); if (!a) return;
        e.preventDefault();
        const m = /^#src-(\d+)$/.exec(a.getAttribute('href') || '');
        openRefs(m ? +m[1] : null, a);
      }, true);
      // back links: return to the * that opened the modal (else seek to the first * citing the entry)
      el.list.addEventListener('click', e => {
        const b = e.target.closest('.s10-back'); if (!b) return;
        e.preventDefault();
        if (from && !from.star) {
          const s = document.querySelector(`a.star[href="#src-${b.dataset.n}"]`);
          const id = s?.closest('[data-scene]')?.dataset.scene;
          if (id && ctx.controller) from.seekTo = () => ctx.controller.seek(id, .5);
        }
        el.refs.close();
      });
      // a page loaded with #src-N / #sources (old deep links) opens the modal on that entry
      const h = /^#(?:src-(\d+)|sources)$/.exec(location.hash);
      if (h) requestAnimationFrame(() => openRefs(h[1] ? +h[1] : null, null));
    },
    resize() {},
    enter() {},
    update() { if (ctx.data.sources.sources.length !== rendered) renderSources(); },   // pure: the list only grows with the ledger
    exit() {},
  };

  // open References (if not open), then bring entry n into view inside the modal and highlight it
  function openRefs(n, opener) {
    const d = el.refs;
    if (d.open) { if (opener) from = { ...from, opener, star: opener.matches('a.star') }; }
    else {
      from = { opener, y: scrollY, star: !!opener?.matches?.('a.star') };
      d.showModal();
    }
    el.list.querySelectorAll('.is-hit').forEach(li => li.classList.remove('is-hit'));
    const li = n ? el.list.querySelector(`#src-${n}`) : null;
    const body = d.querySelector('.s10-dlg-body');
    if (!li) { body.scrollTop = 0; d.querySelector('.s10-x').focus({ preventScroll: true }); return; }
    li.classList.add('is-hit');
    const off = li.getBoundingClientRect().top - body.getBoundingClientRect().top + body.scrollTop;
    body.scrollTop = Math.max(0, off - body.clientHeight * .3);
    li.focus({ preventScroll: true });   // screen readers land on the cited entry
  }

  function renderSources() {
    const { sources, byId } = { sources: ctx.data.sources.sources, byId: ctx.data.byId.source };
    el.list.innerHTML = sources.map(s => {
      const n = byId[s.id]?.n;
      const title = s.title && s.title !== s.publisher ? `, ${link(s.url, esc(s.title))}` : '';
      const pub = !title && s.url ? link(s.url, esc(s.publisher)) : esc(s.publisher);
      return `<li id="src-${n}" tabindex="-1"><b class="t-num">[${n}]</b><span>${pub}${title}${s.date ? `, <span class="t-num">${esc(s.date)}</span>` : ''}`
        + ` <a class="s10-back" href="#" data-n="${n}" aria-label="Back to the text (source ${n})">↩</a></span></li>`;
    }).join('');
    rendered = sources.length;
    el.count.textContent = String(sources.length);
  }
  return scene;
};

/* ── a modal: header (title + visible Close) over a scrolling body ── */
function dialog(key, id, title, body) {
  return `<dialog class="s10-dlg" id="${id}" data-dlg-id="${key}" aria-labelledby="s10-dt-${key}">
    <div class="s10-dlg-in">
      <header class="s10-dlg-head"><h2 id="s10-dt-${key}">${title}</h2>
        <button type="button" class="s10-x" aria-label="Close ${title.toLowerCase()}"><span aria-hidden="true">Close</span><i aria-hidden="true"></i></button></header>
      <div class="s10-dlg-body">${body}</div>
    </div>
  </dialog>`;
}

/* ── Credit (modal): the map data, portraits (people[].image) and photographs (timeline media + imagery.json) ── */
function credit(imagery, data) {
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
  return `<div class="s10-cred">
    <div><p class="s10-k t-micro">Map data</p><p class="s10-small s10-osm">&nbsp;</p>
      <p class="s10-k t-micro">Portraits</p>
      <ul class="s10-small">${people.map(p => `<li>${esc(p.name)}: ${link(p.image.commons_page, esc(p.image.credit))}</li>`).join('')}</ul></div>
    <div><p class="s10-k t-micro">Photographs</p>
      <ul class="s10-small">${[...groups].map(([cr, list]) => `<li>${esc(cr)}${files(list)}</li>`).join('')}</ul></div>
  </div>`;
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

/* ── Caveats and disputed claims (methodology), each with its * ── */
function notesHtml(data) {
  const M = data.methodology, by = data.byId.source;
  const item = f => `<li>${esc(f.text)}${star(f.source_ids, by, f.attribution)}</li>`;
  const cav = (M.caveats || []).filter(showable), dis = (M.disputed_claims || []).filter(showable);
  if (!cav.length && !dis.length) return '';
  return `${cav.length ? `<p class="s10-k t-micro">Caveats</p><ul class="s10-ul">${cav.map(item).join('')}</ul>` : ''}
    ${dis.length ? `<p class="s10-k t-micro">Disputed claims</p><ul class="s10-ul">${dis.map(item).join('')}</ul>` : ''}`;
}

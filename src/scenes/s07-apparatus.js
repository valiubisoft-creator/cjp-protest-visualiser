// S7d · The apparatus (S7d chat, 2026-11-12): v2's "07 · The apparatus" spokes network, ported. Own pinned block,
// 300 vh, on a paper (.reading) chart stage. Brief: the lead's S7d kickoff; Vali's note in docs/build/scenes/S7.md.
//   ./s07d/model.js   apparatus.json → groups, actors, showable actions, the p plan and the walk slots (pure)
//   ./s07d/net.js     geometry, SVG markup, and the paused anime.js timeline that draws the network (seek(p × T))
// p: 0–0.06 hub · 0.06–0.27 spokes draw out group by group, nodes follow, roster fills in · 0.27–0.31 whole network ·
//    0.31–0.95 the walk: one actor at a time highlighted, its dated actions in the side panel (with *) · 0.95–1 hold.
// update(p) is pure in p. tick only breathes the hub ring (t = 0 under ?still). Pointer: hover previews an actor,
// click/Enter pins it until the reader scrolls on; the scroll walk works without it.
// Facts: only data/story/apparatus.json (draft ledger), filtered by showable(); its new_sources are merged into the
// shared ledger here (as S5 does for sansad_chalo) so every * resolves and S10 lists them.
import { story } from '../data/load.js';
import { esc } from '../lib/text.js';
import { star } from '../lib/star.js';
import { loadCss } from './s00-hero.js';
import { buildModel, walkAt, whenText, P } from './s07d/model.js';
import { layout, svgHTML, buildTimeline, T, DOT_R } from './s07d/net.js';

const CSS = new URL('./s07-apparatus.css', import.meta.url).href;
// New copy (not data; flagged for Vali): kicker, title, the key's kind words, the roster/hold hint, the cross-reference.
const COPY = {
  kicker: 'The state response',
  title: 'The apparatus',
  kinds: { r: 'Restriction', c: 'Court', n: 'Other role' },
  hint: 'Select any actor to read its dated record.',
  see: 'See also',
};
// facts the ledger says must never stand alone (apparatus.json delhi_police pellet denial note: "Show it next to those,
// never alone"): a cross-reference to the actor that holds the counter-facts
const XREF = { theprint_0721_pellet_denial: 'raf' };

const clamp01 = x => (x < 0 ? 0 : x > 1 ? 1 : x);
const seg = (p, a, b) => clamp01((p - a) / (b - a));
const pad2 = n => String(n).padStart(2, '0');

function mergeSources(data, list) {
  for (const ns of list || []) if (!data.byId.source[ns.id]) { data.sources.sources.push(ns); data.byId.source[ns.id] = { ...ns, n: data.sources.sources.length }; }
}

export default def => {
  let ctx, m, el = {}, L = null, tl = null, key = '', lastP = 0, hover = -1, pin = null;
  const reduced = () => ctx.reducedMotion ?? matchMedia('(prefers-reduced-motion: reduce)').matches;

  function actHTML(f, actor) {
    const src = ctx.data.byId.source;
    const chips = [f.status && f.status !== 'documented' ? `<span class="chip st">${esc(f.status)}</span>` : '',
      f.effect ? `<span class="chip ef ef-${esc(f.effect)}">${esc(f.effect)}</span>` : ''].join('');
    const x = (f.source_ids || []).map(id => XREF[id]).find(Boolean), xa = x && m.actors.find(a => a.id === x && a !== actor);
    return `<li class="s7d-act">
      <p class="s7d-when"><span class="d t-num">${esc(whenText(f))}</span>${chips}</p>
      <p class="s7d-tx">${esc(f.text)}</p>
      <p class="s7d-by">${esc(f.claimant)} · ${esc(f.attribution)}${star(f.source_ids, src, f.attribution)}</p>
      ${xa ? `<p class="s7d-x">${esc(COPY.see)}: <button type="button" data-i="${xa.i}">${esc(xa.label)}</button></p>` : ''}
    </li>`;
  }

  function cardsHTML() {
    const n = m.actors.length;
    const roster = `<section class="s7d-card s7d-roster" data-c="roster">
      ${m.groups.map(g => `<div class="s7d-rg" data-g="${m.groups.indexOf(g)}">
        <h3 class="s7d-rgh t-micro">${esc(g.label)}</h3>
        <ul>${g.actors.map(a => `<li><button type="button" data-i="${a.i}"><i class="sw k-${a.edge}" aria-hidden="true"></i>${esc(a.label)}</button></li>`).join('')}</ul>
      </div>`).join('')}
      <p class="s7d-hint">${esc(COPY.hint)}</p></section>`;
    const cards = m.actors.map(a => `<section class="s7d-card s7d-actor k-${a.edge}" data-c="${a.i}" aria-label="${esc(a.label)}">
      <p class="s7d-ck t-micro"><span>${esc(a.group.label)}</span><span class="t-num">${pad2(a.i + 1)} / ${pad2(n)}</span></p>
      <h3 class="s7d-an">${esc(a.label)}</h3>
      <ol class="s7d-acts">${a.acts.map(f => actHTML(f, a)).join('')}</ol></section>`).join('');
    return roster + cards;
  }

  function keyHTML() {
    const kinds = [...new Set(m.actors.map(a => a.edge))].sort((a, b) => 'rcn'.indexOf(a) - 'rcn'.indexOf(b));
    return kinds.map(k => `<li><svg width="28" height="10" aria-hidden="true"><line class="k-${k}" x1="0" y1="5" x2="28" y2="5"/></svg>${esc(COPY.kinds[k])}</li>`).join('');
  }

  // fit each card to the panel height: step the type down until it fits (per viewport, measured once)
  function fitCards() {
    const H = el.panel.clientHeight;
    for (const c of el.cards) {
      c.classList.remove('tight', 'tighter');
      if (c.scrollHeight > H) c.classList.add('tight');
      if (c.scrollHeight > H) c.classList.add('tighter');
      if (c.scrollHeight > H) console.warn(`S7d: card ${c.dataset.c} overflows the panel (${c.scrollHeight} > ${H})`);
    }
  }

  function relayout() {
    const w = el.net.clientWidth, h = el.net.clientHeight;
    if (!w || !h) return false;
    const k = `${w}x${h}`;
    if (k === key) return true;
    key = k;
    tl?.revert();
    L = layout(m, w, h, { labelFont: getComputedStyle(el.svg).getPropertyValue('--s7d-label-font').trim() || '760 13px "Public Sans"' });
    el.svg.setAttribute('width', w); el.svg.setAttribute('height', h); el.svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    el.svg.innerHTML = svgHTML(m, L);
    const q = s => [...el.svg.querySelectorAll(s)];
    el.nd = q('.s7d-nd'); el.sp = q('.s7d-sp'); el.dot = q('.s7d-nd .dot'); el.sec = q('.s7d-sec'); el.pulse = el.svg.querySelector('.pulse');
    el.nd.forEach(g => {
      const i = +g.dataset.i;
      g.addEventListener('pointerenter', () => { hover = i; render(); });
      g.addEventListener('pointerleave', () => { hover = -1; render(); });
      g.addEventListener('click', () => open(i));
      g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i); } });
    });
    tl = buildTimeline(m, L, el.svg);
    fitCards();
    return true;
  }

  function open(i) { pin = { i, p: lastP }; render(); }

  // the complete frame for lastP (+ pointer focus, which only ever adds a preview on top)
  function render() {
    if (!relayout()) return;
    const p = lastP;
    tl.seek((reduced() ? Math.max(p, P.draw[1]) : p) * T);
    const walk = walkAt(m, p), focus = hover >= 0 ? hover : pin ? pin.i : -1;
    const k = focus >= 0 ? focus : walk.k, ka = k >= 0 ? m.actors[k] : null;

    // network emphasis
    m.actors.forEach((a, i) => {
      const o = !ka ? 1 : i === k ? 1 : a.group === ka.group ? .5 : .16;
      el.nd[i].style.opacity = o; el.sp[i].style.opacity = o;
      el.nd[i].classList.toggle('on', i === k); el.sp[i].classList.toggle('on', i === k);
      el.dot[i].setAttribute('r', i === k ? DOT_R.on : DOT_R.off);
    });
    el.sec.forEach((s, gi) => s.classList.toggle('dim', !!ka && m.groups[gi] !== ka.group));

    // panel
    const [w0, w1] = P.walk;
    let rosterO, rosterGroups, hintO;
    if (focus >= 0) { rosterO = 0; }
    else if (p < w0) { rosterO = seg(p, P.draw[0], P.draw[0] + .02) * (1 - seg(p, w0 - .008, w0)); }
    else rosterO = seg(p, w1, w1 + .012);
    rosterGroups = m.groups.map(g => (p >= w1 ? 1 : seg(p, g.draw[0], g.draw[0] + .03)));
    hintO = seg(p, w1, w1 + .012);
    const cardO = i => {
      if (focus >= 0) return i === focus ? 1 : 0;
      if (i !== walk.k) return 0;
      return seg(walk.u, 0, .07) * (1 - seg(walk.u, .95, 1));
    };
    const show = (c, o) => { c.style.opacity = o; c.style.transform = `translateY(${Math.round((1 - o) * 10)}px)`; c.style.visibility = o > 0 ? 'visible' : 'hidden'; };
    show(el.roster, rosterO);
    el.rg.forEach((g, i) => { g.style.opacity = rosterGroups[i]; });
    el.hint.style.opacity = hintO;
    el.actorCards.forEach((c, i) => show(c, cardO(i)));
  }

  return {
    id: def.id,
    async init(c) {
      ctx = c; loadCss(CSS);
      const opt = n => story(n).catch(() => null);
      const [app, sansad] = await Promise.all([story('apparatus'), opt('sansad_chalo')]);
      // shared-ledger merge, same rule as S5/S10 (skip if present; n = length after push). sansad_chalo first, whoever
      // inits first, so the footer numbering doesn't depend on which scene's fetch lands first.
      mergeSources(c.data, sansad?.new_sources);
      mergeSources(c.data, app.new_sources);
      m = buildModel(app);
      if (m.hidden.length) console.info('S7d: not shown', m.hidden);
      const r = c.root;
      r.classList.add('s7d', 'reading');
      r.setAttribute('aria-label', COPY.title);
      r.innerHTML = `
        <header class="s7d-head">
          <div><p class="s7d-kick t-micro">${esc(COPY.kicker)}</p>
          <h2 class="s7d-title t-display">${esc(COPY.title)}</h2></div>
          <ul class="s7d-key">${keyHTML()}</ul>
        </header>
        <div class="s7d-main">
          <figure class="s7d-net"><svg class="s7d-svg" role="img" aria-label="${esc(`${m.hub.label}: ${m.actors.map(a => a.label).join(', ')}`)}"></svg></figure>
          <aside class="s7d-panel">${cardsHTML()}</aside>
        </div>`;
      const q = s => r.querySelector(s);
      el = { net: q('.s7d-net'), svg: q('.s7d-svg'), panel: q('.s7d-panel'), roster: q('.s7d-roster'), hint: q('.s7d-hint'),
        rg: [...r.querySelectorAll('.s7d-rg')], cards: [...r.querySelectorAll('.s7d-card')], actorCards: [...r.querySelectorAll('.s7d-actor')] };
      el.panel.addEventListener('click', e => { const b = e.target.closest('button[data-i]'); if (b) open(+b.dataset.i); });
      await Promise.all([document.fonts.load(`48px "Protest Revolution"`, COPY.title), document.fonts.load('760 13px "Public Sans"'),
        document.fonts.load('400 15px "Redaction"')]).catch(() => {});
    },
    enter() {},
    update(p) {
      if (pin && Math.abs(p - pin.p) > .015) pin = null;
      lastP = p; render();
    },
    exit() { hover = -1; pin = null; },
    resize() { key = ''; if (m && !ctx.root.hidden) render(); },
    tick(t) {
      if (!el.pulse) return;
      const ph = (t / 2.4) % 1;
      el.pulse.setAttribute('r', (30 + ph * 42).toFixed(1));
      el.pulse.style.opacity = (.45 * (1 - ph)).toFixed(3);
    },
  };
};

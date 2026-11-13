// CAGE · chapter "apparatus", "Thirteen hands on one protest." (build/hybrid, 2026-11-13). Own pinned block, 340 vh.
// Port of the Gate 0 prototype design/hybrid/cage.js + frames.js apparatus() (signed off: qa/hybrid/gate0/09a–09c).
// Data: ctx.data.extra.apparatus (data/story/apparatus.json; its new_sources are merged by loadStory()).
//
// The CJP roach in the centre of a radial calendar, 21 May → 21 Oct, clockwise from the top. Four rings, one per group
// (inner → outer: in power, in court, online, on the street). Every documented action is one bar across its group's
// ring at its date: red = a restriction; courts dashed (white = restored, red = restricted, grey = mixed); grey = the
// Election Commission (a trigger, not a restriction). A sweep hand runs the calendar; each bar draws in as the hand
// passes it; the roach turns to face the newest bar. The roster on the right lights an actor once its first bar is in.
//
// p map   0–0.14      title card ([0, .05, .11, .14])
//         0.14–0.20   rings, month ticks, the dek (under the lockup) and the roster fade in (chips dim)
//         0.20–0.82   the sweep: 21 May → 21 Oct (the prototype's SWEEP remapped); bars draw / court bars fade in
//         0.82–0.88   the hand fades; the last bars finish
//         0.88–1      hold: every bar, the roster fully lit
// Purity: ONE paused anime.js timeline, 1000 ms = p 0 → 1; update(p) = tl.seek(p × 1000) + redraw from its state.
// Idle (tick only; frozen under ?still): the roach's legs twitch, the hand's glow breathes.
// Interaction (UI only; never changes what p decides): hover a bar → its record card; hover / focus a roster chip →
// that actor's bars light, the rest dim (anime animate on opacity), with the actor's card; click a chip pins it
// (Escape or a second click unpins). Cards sit in the right column under the roster, never over the cage.
import { createTimeline, animate, utils, svg as asvg } from 'animejs';
import { roach } from '../roach/roach.js';
import { esc, showable } from '../lib/text.js';
import { star } from '../lib/star.js';
import { halftone } from '../lib/halftone.js';
import { tok, fitCanvas, dpr } from '../lib/dom.js';
import { createChapter, CH } from '../lib/chapter.js';
import { render } from '../data/copy.js';
import { whenText } from './s07d/model.js';

const CSS = new URL('./h-cage.css', import.meta.url).href;
const loadCss = href => { if (!document.querySelector(`link[href="${href}"]`)) document.head.insertAdjacentHTML('beforeend', `<link rel="stylesheet" href="${href}">`); };

const TAU = Math.PI * 2, LEN = 1000;
const TITLE = [0, .05, .11, .14];
const FRAME = [140, 200], SWEEP = [200, 820], HAND_OUT = [820, 880];
const D0 = Date.parse('2026-05-21'), D1 = Date.parse('2026-10-21');
const RINGS = { politics: [96, 136], courts: [146, 186], digital: [196, 246], street: [256, 336] };
const ORDER = ['street', 'digital', 'courts', 'politics'];
const R_HAND = 342, R_LABEL = 368, R_FIT = 380;          // unit radii (k = 1 at 1440×900)

const clamp01 = x => (x < 0 ? 0 : x > 1 ? 1 : x);
const seg = (p, a, b) => clamp01((p - a) / (b - a));
const frac = iso => clamp01((Date.parse(iso) - D0) / (D1 - D0));
const ang = f => -Math.PI / 2 + f * TAU * .92 + TAU * .04;   // a 0.04-turn gap either side of 12 o'clock

export default def => {
  let ctx, groups, actors, bars, chapter, tl = null;
  const el = {}, st = { a: 0 };
  let W = 0, H = 0, L = null, dirty = true, lastP = 0, sel = null, pin = null, hideT = 0;

  /* ── the model (viewport-independent) ── */
  function model(ap) {
    groups = Object.fromEntries(ap.groups.map(g => [g.id, g.label]));
    actors = ap.actors.map(a => ({ ...a, acts: (a.actions || []).filter(showable) })).filter(a => a.acts.length)
      .sort((a, b) => ORDER.indexOf(a.group) - ORDER.indexOf(b.group));
    bars = [];
    for (const a of actors) for (const x of a.acts) bars.push({ a, x, f: frac(x.date), d: x.date });
    bars.sort((p, q) => p.d.localeCompare(q.d));
    // same day, same ring: fan out by 1.6° so no bar hides another
    const seen = {};
    for (const b of bars) { const key = b.a.group + b.d; b.n = seen[key] = (seen[key] ?? -1) + 1; b.th = ang(b.f) + b.n * .028; }
    bars.forEach((b, i) => { b.i = i; b.kind = b.a.kind === 'trigger' ? 'trigger' : b.a.group === 'courts' ? `court-${b.x.effect || 'mixed'}` : 'restrict'; });
    for (const a of actors) a.first = Math.min(...bars.filter(b => b.a === a).map(b => b.f));
  }
  const atMs = f => SWEEP[0] + f * (SWEEP[1] - SWEEP[0]);

  /* ── layout (per viewport): SVG cage, hub canvas, the timeline ── */
  function build() {
    dirty = false;
    W = ctx.root.clientWidth || W; H = ctx.root.clientHeight || H;   // the stage, not innerWidth (scrollbar-gutter)
    const wide = W >= 1400, RW = wide ? 380 : 340, colX = W - 24 - RW;
    const k = Math.min(1, (H - 96 - 16) / (2 * R_FIT));
    const c = { x: Math.round(colX - 24 - (R_FIT + 8) * k), y: Math.round(96 + (H - 112) / 2) };
    ctx.root.style.setProperty('--rw', RW + 'px');
    ctx.root.style.setProperty('--dek-w', (wide ? 420 : 300) + 'px');
    const R = r => r * k, P = (r, th) => [+(c.x + Math.cos(th) * R(r)).toFixed(2), +(c.y + Math.sin(th) * R(r)).toFixed(2)];
    L = { k, c, R, P, RW };

    halftone(fitCanvas(el.back, W, H), W, H, { seed: 11, cell: 7, ink: tok('--ht-ink') });

    let s = `<svg class="hc-svg" width="${W}" height="${H}" aria-hidden="true"><g class="hc-frame">`;
    for (const g of ORDER) {
      const [r0, r1] = RINGS[g];
      s += `<circle class="hc-band" cx="${c.x}" cy="${c.y}" r="${R((r0 + r1) / 2)}" stroke-width="${R(r1 - r0)}"/>`;
      for (const rr of [r0, r1]) s += `<circle class="hc-edge" cx="${c.x}" cy="${c.y}" r="${R(rr)}"/>`;
      const [lx, ly] = P(r1 - 6, -Math.PI / 2 - .05);
      s += `<text class="hc-ring" x="${lx}" y="${ly}" text-anchor="end">${esc(groups[g].toUpperCase())}</text>`;
    }
    for (let m = 5; m <= 10; m++) {
      const iso = `2026-${String(m).padStart(2, '0')}-01`, th = ang(frac(iso));
      const [x0, y0] = P(R_HAND, th), [x1, y1] = P(R_HAND + 10, th), [tx, ty] = P(R_LABEL, th);
      s += `<line class="hc-tick" x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}"/><text class="hc-month" x="${tx}" y="${ty + 4}" text-anchor="middle">${m === 5 ? '21 May' : new Date(iso).toLocaleString('en-GB', { month: 'short', timeZone: 'UTC' })}</text>`;
    }
    s += `</g><g class="hc-bars">`;
    for (const b of bars) {
      const [r0, r1] = RINGS[b.a.group], [x0, y0] = P(r0 + 3, b.th), [x1, y1] = P(r1 - 3, b.th);
      s += `<g class="hc-b" data-i="${b.i}"><line class="bar k-${b.kind}" x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" stroke-width="${b.a.group === 'courts' ? 3 : 4}"${b.kind.startsWith('court') ? ' stroke-dasharray="5 4"' : ''}/></g>`;
    }
    const [hx, hy] = P(R_HAND, -Math.PI / 2);
    s += `</g><line class="hc-glow" x1="${c.x}" y1="${c.y}" x2="${hx}" y2="${hy}"/><line class="hc-hand" x1="${c.x}" y1="${c.y}" x2="${hx}" y2="${hy}"/>
      <circle class="hc-hub" cx="${c.x}" cy="${c.y}" r="${R(72)}"/><g class="hc-hits">`;
    for (const b of bars) {
      const [r0, r1] = RINGS[b.a.group], [x0, y0] = P(r0 + 3, b.th), [x1, y1] = P(r1 - 3, b.th);
      s += `<line class="hc-hit" data-i="${b.i}" x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}"/>`;
    }
    s += `</g></svg>`;
    el.svgHost.innerHTML = s;
    const svg = el.svgHost.firstElementChild;
    el.frame = svg.querySelector('.hc-frame'); el.hub = svg.querySelector('.hc-hub'); el.hand = svg.querySelector('.hc-hand'); el.glow = svg.querySelector('.hc-glow');
    el.lines = [...svg.querySelectorAll('.hc-b > .bar')]; el.groupsB = [...svg.querySelectorAll('.hc-b')];
    svg.querySelectorAll('.hc-hit').forEach(h => {
      h.addEventListener('pointerenter', () => { const b = bars[+h.dataset.i]; if (lastP * LEN < atMs(b.f)) return; show('bar', b); });
      h.addEventListener('pointerleave', later);
    });
    // the roach in the hub
    const cs = Math.round(R(140)), d = dpr();
    Object.assign(el.roach.style, { left: c.x - cs / 2 + 'px', top: c.y - cs / 2 + 'px', width: cs + 'px', height: cs + 'px' });
    el.roach.width = cs * d; el.roach.height = cs * d;
    el.rg = el.roach.getContext('2d'); el.rg.setTransform(d, 0, 0, d, 0, 0);
    L.cs = cs; L.ink = tok('--white');

    // the timeline: frame in, the hand sweeps, each bar draws in (outward) as the hand passes its date, chips light
    tl = createTimeline({ autoplay: false, defaults: { ease: 'outQuart', duration: 60 } });
    tl.add({ duration: LEN }, 0);
    const fromTo = (t, from, to, pos, params = {}) => { utils.set(t, from); const pr = {}; for (const key in to) pr[key] = [from[key], to[key]]; tl.add(t, { ...pr, ...params }, pos); };
    const fd = FRAME[1] - FRAME[0];
    fromTo([el.frame, el.hub], { opacity: 0 }, { opacity: 1 }, FRAME[0], { duration: fd, ease: 'linear' });
    fromTo([el.dek, el.roster], { opacity: 0 }, { opacity: 1 }, FRAME[0], { duration: fd, ease: 'linear' });
    st.a = 0;
    tl.add(st, { a: [0, 1], duration: SWEEP[1] - SWEEP[0], ease: 'linear' }, SWEEP[0]);
    bars.forEach((b, i) => {
      const at = atMs(b.f);
      // court bars are dashed, and anime's drawable owns stroke-dasharray, so they fade in instead of drawing
      if (b.a.group === 'courts') { fromTo(el.lines[i], { opacity: 0 }, { opacity: 1 }, at, { duration: 80 }); return; }
      const dr = asvg.createDrawable(el.lines[i]); utils.set(dr, { draw: '0 0' });
      tl.add(dr, { draw: ['0 0', '0 1'] }, at);
    });
    for (const a of actors) fromTo(el.chips[a.id], { opacity: .38 }, { opacity: 1 }, atMs(a.first), { duration: 60 });
    chapter.resize(W);
    if (sel) focus(sel, true);
  }

  /* ── drawing (from the timeline's state, the scroll p and the idle clock) ── */
  function draw(t = ctx.clock.t) {
    const { c, P } = L;
    const [x, y] = P(R_HAND, ang(st.a));
    const ho = seg(lastP * LEN, SWEEP[0], SWEEP[0] + 8) * (1 - seg(lastP * LEN, HAND_OUT[0], HAND_OUT[1]));
    for (const h of [el.hand, el.glow]) { h.setAttribute('x2', x); h.setAttribute('y2', y); }
    el.hand.style.opacity = (ho * .55).toFixed(3);
    el.glow.style.opacity = (ho * (.07 + .05 * Math.sin(t * 2.4))).toFixed(3);
    // the roach faces the newest bar (nose up before the first)
    let last = null;
    if (st.a > 0) for (const b of bars) if (b.f <= st.a + 1e-6) last = b;
    const g = el.rg, cs = L.cs;
    g.clearRect(0, 0, cs, cs); g.fillStyle = g.strokeStyle = L.ink;
    g.globalAlpha = seg(lastP * LEN, FRAME[0], FRAME[1]);
    roach(g, cs / 2, cs / 2, last ? last.th : -Math.PI / 2, L.R(26), .8 + .18 * Math.sin(t * 7.3) * Math.sin(t * 2.1));
    g.globalAlpha = 1;
  }

  /* ── focus + cards (time-based UI; p never depends on it) ── */
  function focus(actorId, now = false) {
    sel = actorId;
    for (const [id, ch] of Object.entries(el.chips)) ch.classList.toggle('on', id === actorId);
    animate(el.groupsB, { opacity: g => (!actorId || bars[+g.dataset.i].a.id === actorId ? 1 : .14), duration: now ? 0 : 280, ease: 'outQuad' });
  }
  const recordHTML = b => {
    const S = ctx.data.byId.source, x = b.x;
    return `<p class="when">${esc(whenText(x))} · ${esc(groups[b.a.group])}</p><h3>${esc(b.a.label)}</h3>
      <p>${esc(x.text)}${star(x.source_ids, S, x.attribution)}</p><p class="meta">${esc(x.claimant)} · ${esc(x.attribution)}</p>`;
  };
  const actorHTML = a => {
    const S = ctx.data.byId.source;
    return `<p class="when">${esc(groups[a.group])} · ${a.acts.length} action${a.acts.length > 1 ? 's' : ''}</p><h3>${esc(a.label)}</h3>
      ${a.acts.map(x => `<p class="act"><b class="d">${esc(whenText(x))}</b> ${esc(x.text)}${star(x.source_ids, S, x.attribution)} <span class="att">${esc(x.attribution)}</span></p>`).join('')}`;
  };
  function show(kind, it) {
    clearTimeout(hideT);
    const a = kind === 'bar' ? it.a : it;
    if (pin && pin !== a.id) return;                     // a pinned actor keeps the card
    focus(a.id);
    el.card.innerHTML = kind === 'bar' ? recordHTML(it) : actorHTML(it);
    el.card.hidden = false; el.card.scrollTop = 0;
    // right column, under the roster; capped to the viewport (scrolls inside if longer)
    const top = el.roster.offsetTop + el.roster.offsetHeight + 16;
    el.card.style.top = top + 'px';
    el.card.style.maxHeight = Math.max(120, H - top - 16) + 'px';
    more();
  }
  const more = () => { const c = el.card; c.classList.toggle('more', c.scrollTop + c.clientHeight < c.scrollHeight - 2); };
  function hide() {
    clearTimeout(hideT);
    if (pin) { const a = actors.find(x => x.id === pin); show('actor', a); return; }
    el.card.hidden = true; focus(null);
  }
  const later = () => { clearTimeout(hideT); hideT = setTimeout(hide, 180); };
  function setPin(id) {
    pin = id;
    for (const [aid, ch] of Object.entries(el.chips)) ch.setAttribute('aria-pressed', String(aid === id));
    if (id) show('actor', actors.find(x => x.id === id)); else hide();
  }

  return {
    id: def.id,
    init(c) {
      ctx = c; loadCss(CSS);
      const root = ctx.root; root.classList.add('h-cage');
      const ap = ctx.data.extra?.apparatus;
      if (!ap) { root.innerHTML = '<p class="missing">[MISSING: apparatus.json]</p>'; return; }
      model(ap);
      let lastG = '';
      root.insertAdjacentHTML('beforeend', `
        <canvas class="hc-back" aria-hidden="true"></canvas>
        <div class="hc-svghost"></div>
        <canvas class="hc-roach" aria-hidden="true"></canvas>
        <p class="hc-dek">${render(esc(CH.apparatus.dek || ''), ctx.data.byId.source, star)}</p>
        <div class="hc-roster" role="group" aria-label="Who acted">${actors.map(a => {
          const head = a.group !== lastG ? `${lastG ? '</div>' : ''}<div class="hc-rg"><p class="hy-kick">${esc(groups[a.group])}</p>` : ''; lastG = a.group;
          return `${head}<button type="button" class="hc-chip" data-a="${esc(a.id)}" aria-pressed="false">${esc(a.label)} <b>${a.acts.length}</b></button>`;
        }).join('')}</div></div>`);
      chapter = createChapter(root, 'apparatus', ctx.data, { title: TITLE });
      root.insertAdjacentHTML('beforeend', `<div class="hy-cap hc-card" role="status" aria-live="polite" hidden></div>`);
      Object.assign(el, {
        back: root.querySelector('.hc-back'), svgHost: root.querySelector('.hc-svghost'), roach: root.querySelector('.hc-roach'),
        dek: root.querySelector('.hc-dek'), roster: root.querySelector('.hc-roster'), card: root.querySelector('.hc-card'),
      });
      el.chips = Object.fromEntries([...root.querySelectorAll('.hc-chip')].map(b => [b.dataset.a, b]));
      for (const [id, b] of Object.entries(el.chips)) {
        const a = actors.find(x => x.id === id);
        b.addEventListener('pointerenter', () => show('actor', a));
        b.addEventListener('pointerleave', later);
        b.addEventListener('focus', () => show('actor', a));
        b.addEventListener('blur', later);
        b.addEventListener('click', () => setPin(pin === id ? null : id));
      }
      el.card.addEventListener('pointerenter', () => clearTimeout(hideT));
      el.card.addEventListener('pointerleave', later);
      el.card.addEventListener('scroll', more, { passive: true });
      root.addEventListener('keydown', e => { if (e.key === 'Escape') { setPin(null); hide(); } });
    },
    enter() { if (dirty && bars && W) build(); },
    update(p) {
      if (!bars) return;
      if (dirty) build();
      lastP = p;
      chapter.update(p);
      tl.seek(p * LEN);
      draw();
    },
    exit() { pin = null; clearTimeout(hideT); if (el.card) { el.card.hidden = true; for (const ch of Object.values(el.chips)) ch.setAttribute('aria-pressed', 'false'); } if (L) focus(null, true); },
    resize(w, h) { W = w; H = h; dirty = true; chapter?.resize(w); if (bars && !ctx.root.hidden) build(); },
    tick(t) { if (L && !dirty) draw(t); },
  };
};

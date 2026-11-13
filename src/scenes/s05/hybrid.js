// S5 · hybrid mode (build/hybrid, Vali 2026-11-13; Gate 0 frames 03-street, 04-july, 05-ledgers). Replaces the rail.
//
// HY: per node segment, the beats the hybrid keeps, in order: [id, vh, opts]. 'title:<chapter>' holds the next beat's
// camera while the chapter's title card plays; 'ledger:<k>' holds the wide 20 Jul camera (opts.camera) under a veil
// for the three ledgers. opts.cap = [chapter, caption index] (src/data/copy.js); opts.labels = the ≤ 3 site labels
// (Vali 2026-11-13: "only the top 3 most important pieces of information"); opts.notes = hybrid annotations:
//   signal  the 20 Jul dead-signal zone round Jantar Mantar: dashed, labelled illustrative (no source maps the cut)
//   order   the 23 Jul written order: a solid ring of the ordered 1.5 km radius (map units are metres), sourced
//   metro   one grouped label for the closed stations (their glyphs stay, unlabelled)
// Everything here is a pure function of p (and the camera at p); anime.js drives the ledger reveal (seeked timeline).
import { createTimeline, utils } from 'animejs';
import { esc } from '../../lib/text.js';
import { star } from '../../lib/star.js';
import { project } from '../../lib/map.js';
import { clamp01, ease } from '../../roach/swarm.js';
import { createChapter, captionHTML } from '../../lib/chapter.js';
import { grid } from '../../lib/grid.js';

export const HY = {
  // review 3 (Vali 2026-11-13): no title card before the map (it read as arbitrary); the street chapter opens on the map
  start: [['start', 140, { cap: ['street', 0], labels: ['jantar_mantar_road'] }]],
  protest: [['protest_2a', 90, { cap: ['street', 1], labels: ['jantar_mantar_road'] }]],
  wangchuk: [['wangchuk_day1', 90, { cap: ['street', 2], labels: ['jantar_mantar_road'] }]],
  detention: [['detention_0718', 90, { cap: ['street', 3], labels: ['jantar_mantar_road', 'safdarjung_hospital'] }]],
  protest_arrest: [
    ['title:july', 80],                          // 80 vh: the card in the first 62.5%, then ~30 vh of map before the first caption
    ['0720_0900', 110, { cap: ['july', 0], labels: ['jantar_mantar_road'], notes: ['signal', 'metro'] }],
    ['0720_1430', 110, { cap: ['july', 1], labels: ['metro_patel_chowk', 'parliament_street'], notes: ['signal'] }],
    ['0720_1730', 110, { cap: ['july', 2], labels: ['rml_hospital', 'jantar_mantar_road'], notes: ['signal'] }],
    ['pa_0723', 110, { cap: ['july', 3], labels: ['jantar_mantar_road'], notes: ['order'],
      sites: ['jantar_mantar_road', 'metro_rajiv_chowk', 'metro_central_secretariat', 'parliament_circle', 'metro_udyog_bhawan'] }],
    ['title:ledgers', 80, { camera: 'pa_0720' }],
    ['ledger:0', 100, { camera: 'pa_0720', cap: ['ledgers', 0] }],
    ['ledger:1', 100, { camera: 'pa_0720', cap: ['ledgers', 1] }],
    ['ledger:2', 100, { camera: 'pa_0720', cap: ['ledgers', 2] }],
  ],
};
const ORDER_KM = 1.5;                           // apparatus.json home_ministry 23 Jul: "a 1.5 km radius of Jantar Mantar"

// the three ledgers (metrics.json rows; apparatus.json for the pellet denial and the diary). kind: state | record | movement | split
const LEDGERS = [
  { q: 'Injured', unit: 'people', max: 160, dots: [
    { v: 60, k: 'state', l: 'protesters hurt, police said', ids: ['theprint', 'pti'], who: 'Delhi Police' },
    { v: 65, k: 'record', l: 'medico-legal cases, RML by 7 pm', ids: ['wikipedia'], who: 'hospital via media' },
    { v: 100, k: 'record', l: 'injured at RML by 5.30 pm', ids: ['newslaundry', 'indianexpress'], who: 'hospital sources' },
    { v: 118, k: 'state', l: 'officers hurt, police said', ids: ['theprint', 'pti'], who: 'Delhi Police' },
    { v: 150, k: 'movement', l: 'protesters hospitalised, CJP', ids: ['wikipedia'], who: 'CJP claims' }] },
  { q: 'Detained', unit: 'people', max: 120, dots: [
    { v: 0, k: 'state', l: '“no protesters”, police later', ids: ['wikipedia'], who: 'Delhi Police' },
    { v: 70, k: 'split', l: 'about 70, police (PTI) / CJP', ids: ['theprint', 'pti'], who: 'Delhi Police (PTI) / CJP' },
    { v: 100, k: 'state', l: '“more than 100”, police sources', ids: ['deccanchronicle_0720_detained'], who: 'police sources' }] },
  { q: 'Pellets', unit: 'rounds fired', max: 8, dots: [
    { v: 0, k: 'state', l: '“completely false”, police', ids: ['theprint_0721_pellet_denial'], who: 'Delhi Police' },
    { v: 2, k: 'record', l: 'police diary', ids: ['tribuneindia'], who: 'Delhi Police General Diary' },
    { v: 7, k: 'record', l: 'CRPF report (The Wire)', ids: ['thewire'], who: 'CRPF report via The Wire' }] },
];

export function createHybrid({ host, model, data, pts }) {
  const src = data.byId.source, B = model.beats;
  // chapters with an opening card (street has none since review 3). The card plays in the first 62.5% of its 80 vh beat;
  // the rest is a gap (the map alone) before the chapter's first caption (Vali: "sufficient gaps")
  const chapters = ['july', 'ledgers'].map(id => {
    const t = B.find(b => b.hy?.chapter === id), L = t.b - t.a;
    const last = [...B].reverse().find(b => b.hy?.cap?.[0] === id);
    return { id, t, last, c: createChapter(host, id, data, { title: [t.a, t.a + L * .19, t.a + L * .47, t.a + L * .625], lock: { boxed: true } }) };
  });
  // caption cards: one per captioned beat
  const cards = B.map(b => {
    if (!b.hy?.cap) return null;
    const [ch, k] = b.hy.cap;
    host.insertAdjacentHTML('beforeend', `<div class="hy-cap s5h-cap${b.kind === 'ledger' ? ' ledger' : ''}" data-beat="${b.i}">${captionHTML(ch, k, src)}</div>`);
    return host.lastElementChild;
  });
  // notes (DOM tags) and the ledger layer
  host.insertAdjacentHTML('beforeend', `<svg class="s5h-zone" aria-hidden="true"></svg>
    <div class="s5h-tag red sig" aria-hidden="true">Mobile internet down, 9.23 am${star(['tribuneindia'], src, 'reported')}<br>No order published${star(['repo_iff_central_delhi'], src, 'IFF said')}</div>
    <div class="s5h-tag ill sig-ill" aria-hidden="true">Zone illustrative: no source maps the cut</div>
    <div class="s5h-tag red ord" aria-hidden="true">Home Ministry order: no mobile internet<br>within 1.5 km, 9.30 am to 4 pm${star(['repo_isoc_0723'], src, 'reported')}</div>
    <div class="s5h-tag metro" aria-hidden="true">Metro: five stations<br>shut before 9.15 am${star(['theprint', 'theweek_0720'], src, 'officials said')}</div>
    <div class="s5h-veil" aria-hidden="true"></div><div class="s5h-ledgers"></div>`);
  const q = s => host.querySelector(s);
  const el = { zone: q('.s5h-zone'), sig: q('.s5h-tag.sig'), sigI: q('.s5h-tag.sig-ill'), ord: q('.s5h-tag.ord'), metro: q('.s5h-tag.metro'), veil: q('.s5h-veil'), led: q('.s5h-ledgers') };
  let W = 0, H = 0, MW = 0, MH = 0, tl = null, L0 = 0, L1 = 1, rows = [];
  const lb = B.filter(b => b.kind === 'ledger'), lt = B.find(b => b.hy?.chapter === 'ledgers');

  // text width in the ledger label fonts (Public Sans), for collision-free placement before the layer is visible
  const mctx = document.createElement('canvas').getContext('2d');
  const textW = (t, px, wt) => { mctx.font = `${wt} ${px}px ${getComputedStyle(document.documentElement).getPropertyValue('--font-ui') || 'sans-serif'}`; return mctx.measureText(t).width; };
  function buildLedgers() {
    // on the grid (Vali 2026-11-13): row names in columns 1–2, scales in 3–8, the caption in 9–12. Labels never cross col 8
    const G = grid(W), X0 = Math.round(G.x(2) + 12), RX = Math.round(G.end(7)), X1 = RX - 16, Y0 = Math.round(H * .31), DY = Math.round(H * .195), lw = W < 1400 ? 128 : 170;
    for (const c of host.querySelectorAll('.s5h-cap.ledger')) Object.assign(c.style, { left: Math.round(G.x(8)) + 'px', right: 'auto', width: Math.round(G.span(4)) + 'px' });
    let svg = `<svg width="${W}" height="${H}" class="s5h-lsvg"><defs><pattern id="s5h-hatch" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="2" height="4" fill="#FAFAF7"/></pattern></defs>`;
    let html = '';
    LEDGERS.forEach((r, i) => {
      const y = Y0 + i * DY, x = v => X0 + (X1 - X0) * v / r.max;
      svg += `<g class="row" data-r="${i}"><line class="axis" x1="${X0}" x2="${X1}" y1="${y}" y2="${y}"/>${[0, r.max].map(t => `<text x="${x(t)}" y="${y + 26}" text-anchor="middle">${t}</text>`).join('')}`;
      html += `<div class="lq" data-r="${i}" style="left:${Math.round(G.m)}px;width:${Math.round(G.span(2))}px;top:${y - 22}px"><div class="q">${esc(r.q)}</div><div class="u">${esc(r.unit)}, one scale each</div></div>`;
      // labels: measured, each dot's label on the side (above / below) with more room, then pushed apart so no two
      // labels on a side overlap and none crosses the scale's column (Vali 2026-11-13: no overlap). A leader joins a
      // label that had to move to its dot.
      const R = 9, P0 = X0 - 40, last = { up: -1e9, dn: -1e9 }, sides = { up: [], dn: [] };
      const lab = r.dots.map((d, j) => {
        const tw = Math.max(textW(String(d.v), 15, 700) + 10, textW(d.l, 12, 400)) + 2, w = Math.min(lw, Math.ceil(tw)), two = tw > lw;
        return { d, j, cx: x(d.v), w, two };
      }).sort((a, b) => a.cx - b.cx);
      let prev = 'dn';
      for (const L of lab) {
        const l0 = L.cx - L.w / 2, cu = Math.max(0, last.up + 10 - l0), cd = Math.max(0, last.dn + 10 - l0);
        const side = cu < cd ? 'up' : cd < cu ? 'dn' : (prev === 'up' ? 'dn' : 'up');
        L.up = side === 'up'; prev = side; last[side] = L.cx + L.w / 2; sides[side].push(L);
      }
      for (const arr of Object.values(sides)) {
        let edge = P0;
        for (const L of arr) { L.lx = Math.max(L.cx - L.w / 2, edge); edge = L.lx + L.w + 10; }
        edge = RX;
        for (let n = arr.length - 1; n >= 0; n--) { const L = arr[n]; L.lx = Math.min(L.lx, edge - L.w); edge = L.lx - 10; }
      }
      for (const L of lab) {
        const { d, j, cx, w, two, up, lx } = L, ly = up ? y - 22 : y + 22, lxc = Math.max(lx + 8, Math.min(lx + w - 8, cx));
        const fill = d.k === 'state' ? '#E0201B' : d.k === 'record' ? 'url(#s5h-hatch)' : 'none', stroke = d.k === 'state' ? '#E0201B' : '#FAFAF7';
        svg += `<g class="dot" data-r="${i}" data-d="${j}" style="transform-origin:${cx}px ${y}px">` + (d.k === 'split'
          ? `<path d="M${cx} ${y - R} A${R} ${R} 0 0 0 ${cx} ${y + R} Z" fill="#E0201B"/><circle cx="${cx}" cy="${y}" r="${R}" fill="none" stroke="#FAFAF7" stroke-width="2"/>`
          : `<circle cx="${cx}" cy="${y}" r="${R}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`) + `<line x1="${cx}" x2="${lxc.toFixed(1)}" y1="${y + (up ? -R : R)}" y2="${ly + (up ? 6 : -6)}" class="tick"/></g>`;
        html += `<div class="ll" data-r="${i}" data-d="${j}" style="left:${lx.toFixed(1)}px;top:${up ? ly - (two ? 50 : 36) : ly + 4}px;width:${w}px"><b>${d.v}</b>${star(d.ids, src, d.who)}<br><span>${esc(d.l)}</span></div>`;
      }
      svg += '</g>';
    });
    // the key sits under the last row's lower labels (two lines max), not at a fixed bottom offset (1280×720 overlap)
    html += `<div class="lkey" style="left:${Math.round(G.m)}px;top:${Y0 + (LEDGERS.length - 1) * DY + 80}px;bottom:auto"><span><i class="st"></i>what the state said</span><span><i class="rec"></i>what a record shows</span><span><i class="mv"></i>what the movement said</span></div>`;
    el.led.innerHTML = svg + '</svg>' + html;
    // one paused timeline over the ledger region: row k's axis, label and dots arrive during ledger beat k
    L0 = lt.a; L1 = lb.at(-1).b;
    const ms = p => (p - L0) / (L1 - L0) * 1000;
    tl = createTimeline({ autoplay: false, defaults: { ease: 'outBack(1.8)', duration: 70 } });
    tl.add({ duration: 1000 }, 0);
    rows = LEDGERS.map((r, i) => {
      const b = lb[i], a0 = ms(b.a), a1 = ms(b.ha);
      const axis = el.led.querySelector(`.row[data-r="${i}"] .axis`), lq = el.led.querySelector(`.lq[data-r="${i}"]`);
      utils.set(axis, { opacity: 0 }); utils.set(lq, { opacity: 0, translateX: -12 });
      tl.add(axis, { opacity: [0, 1], duration: 50, ease: 'linear' }, a0);
      tl.add(lq, { opacity: [0, 1], translateX: [-12, 0], duration: 60, ease: 'outQuart' }, a0);
      r.dots.forEach((d, j) => {
        const g = el.led.querySelector(`.dot[data-r="${i}"][data-d="${j}"]`), lab = el.led.querySelector(`.ll[data-r="${i}"][data-d="${j}"]`);
        const at = a0 + (a1 - a0) * (.25 + .6 * j / r.dots.length);
        utils.set(g, { scale: 0, opacity: 0 }); utils.set(lab, { opacity: 0, translateY: 6 });
        tl.add(g, { scale: [0, 1], opacity: [0, 1] }, at);
        tl.add(lab, { opacity: [0, 1], translateY: [6, 0], duration: 60, ease: 'outQuart' }, at + 20);
      });
    });
    tl.seek(0);
  }

  return {
    resize(w, h, mw, mh) {
      W = w; H = h; MW = mw; MH = mh;
      for (const ch of chapters) ch.c.resize(w);
      el.zone.setAttribute('width', mw); el.zone.setAttribute('height', mh);
      buildLedgers();
    },
    // leader-line start for map.js: the dominant caption card's left edge, by its first text line
    anchor(p) {
      const { a, b, t } = model.phase(p), k = a === b || t < .5 ? a : b, c = cards[k];
      if (!c || B[k].kind === 'ledger') return null;
      const r = c.getBoundingClientRect(); if (!r.width) return null;
      return { x: r.left, y: r.top + 46, alpha: a === b ? 1 : Math.abs(t - .5) * 2 };
    },
    cardBox: () => ({ x: MW - 24 - 360, y: 24, w: 360, h: 200 }),
    // the one leader target: the beat's first label site
    target: k => B[k]?.labelSites?.[0] || null,
    // veil 0 → 0.86 across the ledgers' title; titles on the map get a lighter veil while they play
    veil(p) {
      const led = clamp01((p - lt.a) / (lt.b - lt.a) * 1.4), titleOn = Math.max(...chapters.map(ch => clamp01((p - ch.t.a) / .004) * (1 - clamp01((p - ch.t.b + (ch.t.b - ch.t.a) * .3) / ((ch.t.b - ch.t.a) * .3)))));
      return Math.max(led * .86, titleOn * .62);
    },
    ledgerAlpha: p => clamp01((p - lt.a) / (lt.b - lt.a) * 1.4),
    update(p, cam) {
      const { a, b, t } = model.phase(p);
      // chapters: title card, then the lockup until the next chapter's title starts
      chapters.forEach((ch, i) => {
        const next = chapters[i + 1]?.t.a ?? 2, end = Math.min(next, model.leadOut);
        ch.c.update(p, { lockAlpha: p < end ? 1 - clamp01((p - end + .006) / .006) : 0 });
      });
      // caption cards: the hold's card; across a transition the old fades out, then the new in
      cards.forEach((c, k) => {
        if (!c) return;
        const al = a === b ? (k === a ? 1 : 0) : k === a ? 1 - clamp01(t * 2) : k === b ? clamp01(t * 2 - 1) : 0;
        const o = al * (1 - model.lead(p).out);
        c.style.opacity = o.toFixed(3); c.style.visibility = o > .001 ? 'visible' : 'hidden';
        c.style.transform = `translateY(${((1 - o) * 8).toFixed(1)}px)`;
      });
      // notes for the hold (cross-faded like the cards)
      const noteA = n => [a, b].reduce((m, k, j) => { const bb = B[k]; if (!bb?.hy?.notes?.includes(n)) return m; const f = a === b ? 1 : j === 0 ? 1 - clamp01(t * 2) : clamp01(t * 2 - 1); return Math.max(m, f); }, 0);
      const sig = noteA('signal'), ord = noteA('order'), met = noteA('metro');
      const J = pts.jantar_mantar_road, c0 = J ? project(cam, MW, MH, J.x, J.y) : null;
      let svg = '';
      if (c0 && sig > 0) {
        const r = Math.min(230, MH * .27);
        svg += `<g opacity="${sig.toFixed(3)}"><circle cx="${c0.x}" cy="${c0.y}" r="${r}" fill="url(#s5h-dots)" opacity=".38"/><circle cx="${c0.x}" cy="${c0.y}" r="${r}" fill="none" stroke="#E0201B" stroke-width="2" stroke-dasharray="7 6"/></g>`;
        place(el.sig, c0.x + r * .62, c0.y + r * .62, sig); place(el.sigI, c0.x + r * .62, c0.y + r * .62 + 46, sig);
      } else { place(el.sig, 0, 0, 0); place(el.sigI, 0, 0, 0); }
      if (c0 && ord > 0) {
        const r = ORDER_KM * 1000 * cam.k;
        svg += `<g opacity="${ord.toFixed(3)}"><circle cx="${c0.x}" cy="${c0.y}" r="${r}" fill="#E0201B" fill-opacity=".10" stroke="#E0201B" stroke-width="2.5"/><line x1="${c0.x}" y1="${c0.y}" x2="${c0.x - r * Math.SQRT1_2}" y2="${c0.y + r * Math.SQRT1_2}" stroke="#E0201B" stroke-width="1.5"/></g>`;
        // label outside the ring, lower right, clear of the caption card (top-right) and the legend (bottom-left)
        place(el.ord, Math.min(MW - 24 - el.ord.offsetWidth, c0.x + r * .74 + 14), Math.min(MH - 24 - el.ord.offsetHeight, c0.y + r * .74 + 14), ord);
      } else place(el.ord, 0, 0, 0);
      if (met > 0) {
        const ids = (B[a === b || t < .5 ? a : b]?.step?.map?.closures || []).flatMap(c => c.ids || []).filter(id => pts[id]);
        const P = ids.map(id => project(cam, MW, MH, pts[id].x, pts[id].y));
        if (P.length) place(el.metro, Math.max(24, Math.min(...P.map(q => q.x)) - 230), P.reduce((s, q) => s + q.y, 0) / P.length + 40, met);
        else place(el.metro, 0, 0, 0);
      } else place(el.metro, 0, 0, 0);
      el.zone.innerHTML = `<defs><pattern id="s5h-dots" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="4.5" cy="4.5" r="1.6" fill="#E0201B"/></pattern></defs>${svg}`;
      // veil + ledgers
      const v = this.veil(p) * (1 - model.lead(p).out);     // the lead-out lifts the veil: S5 p 1 = backdrop + roaches (S6 contract)
      el.veil.style.opacity = v.toFixed(3); el.veil.style.visibility = v > .001 ? 'visible' : 'hidden';
      const la = this.ledgerAlpha(p) * (1 - model.lead(p).out);
      el.led.style.opacity = la.toFixed(3); el.led.style.visibility = la > .001 ? 'visible' : 'hidden';
      if (tl) tl.seek(clamp01((p - L0) / (L1 - L0)) * 1000);
    },
    unload() {},
  };
  function place(e, x, y, a) {
    e.style.opacity = a.toFixed(3); e.style.visibility = a > .001 ? 'visible' : 'hidden';
    if (a > .001) e.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
  }
}

import { story, load, esc, tok, canvasIn, halftone, swarm, roach, mapSVG, fitSites, anchorXY, showable, fmtDate } from './lib/kit.js';
import { factBlock, railCard, scrubber, handleRoach, quoteCard, PARTS_CSS, fmtNum } from './lib/parts.js';

const theme = new URLSearchParams(location.search).get('theme') === 'paper' ? 'paper' : 'ink';
document.documentElement.dataset.theme = theme;
document.querySelectorAll('.theme button').forEach(b => {
  b.setAttribute('aria-pressed', b.dataset.t === theme);
  b.onclick = () => { const u = new URL(location); u.searchParams.set('theme', b.dataset.t); location = u; };
});
document.head.insertAdjacentHTML('beforeend', `<style>${PARTS_CSS}</style>`);
await document.fonts.ready;

const [meta, timeline, metrics, quotes, sites] = await Promise.all([story('meta'), story('timeline'), story('metrics'), story('quotes'), story('sites')]);
const $ = s => document.querySelector(s);
const main = $('#board');
const sec = (id, kicker, title, intro, body) => `<section class="b" id="${id}"><header><p class="t-micro">${kicker}</p><h2>${title}</h2>${intro ? `<p>${intro}</p>` : ''}</header>${body}</section>`;

/* ── palette ── */
const SW = [['--black', 'Ink, roaches, dramatic stages'], ['--white', 'Paper, main background'], ['--red', 'The one accent. Marks and large type only'],
  ['--red-deep', 'Small red text on white · 7.3:1'], ['--red-bright', 'Small red text on black · 5.5:1'], ['--grey-1', 'Captions on white · 5.1:1'],
  ['--grey-1-ink', 'Captions on black · 7.7:1'], ['--grey-2', 'Rules, gridlines, roads'], ['--grey-3', 'Raised surface on black'], ['--paper-2', 'Raised surface on white']];
let html = sec('palette', '01 · Colour', 'Red, white and black', `Theme shown: <b>${theme}</b>. Switch with the toggle. Red carries meaning only: the keyword, state action, the active node, the * marker.`,
  `<div class="grid g4">${SW.map(([v, d]) => `<div class="sw"><div class="chip" style="background:var(${v})"></div><div class="meta"><b>${v}</b>${tok(v)}<br>${d}</div></div>`).join('')}</div>`);

/* ── type ── */
const faiz = quotes.quotes.find(q => q.id === 'faiz-bol'), dinkar = quotes.quotes.find(q => q.id === 'dinkar-singhasan');
html += sec('type', '02 · Type', 'Protest Revolution × Public Sans', 'Display face for major headings only, never body or UI. The S4 skeleton digits are shown in both faces: the S4a spike decides which one is legible as roaches.', `
  <div class="spec"><div class="lab">Display · hero · ${tok('--fs-hero')}</div><div class="t-display hero-spec">${esc(meta.title)}</div></div>
  <div class="spec"><div class="lab">Display · finale headline · ${tok('--fs-d1')}</div><div class="t-display" style="font-size:var(--fs-d1)">${esc(meta.finale.headline)}</div></div>
  <div class="spec"><div class="lab">Skeleton digits · Protest Revolution</div><div class="t-display date-spec t-num">0123456789/</div></div>
  <div class="spec"><div class="lab">Skeleton digits · Public Sans Black (S4a fallback)</div><div class="date-spec t-num" style="font-weight:900;letter-spacing:-.02em">0123456789/</div></div>
  <div class="spec"><div class="lab">S4 date (D4) · S6 date (D5)</div><div><span class="t-display t-num" style="font-size:96px">06/06/2026</span> &nbsp; <span class="t-display t-num" style="font-size:96px;color:var(--accent)">25/07/2026</span></div></div>
  <div class="spec"><div class="lab">H1 · Public Sans 900 · ${tok('--fs-h1')}</div><div style="font:var(--w-black) var(--fs-h1)/1.1 var(--font-text)">${esc(timeline.nodes[4].title)}</div></div>
  <div class="spec"><div class="lab">Quote · Public Sans 560 · ${tok('--fs-quote')}</div><div style="font:var(--w-medium) var(--fs-quote)/1.3 var(--font-text);max-width:30ch">${esc(meta.cji_quote.text.split('. ')[0])}.</div></div>
  <div class="spec"><div class="lab">Body · ${tok('--fs-body')} / ${tok('--lh-body')}</div><p style="margin:0;max-width:var(--measure)">${esc(timeline.nodes[0].summary.text)}</p></div>
  <div class="spec"><div class="lab">Micro · kicker · tracked caps</div><div class="t-micro" style="color:var(--accent-text)">20 Jul 2026 · Day 44 · Fast day 23</div></div>
  <div class="spec"><div class="lab">Stat · tabular nums</div><div class="t-num" style="font:var(--w-black) var(--fs-stat)/1 var(--font-text)">118+ &nbsp; 10,000 &nbsp; 1,800+</div></div>
  <div class="spec"><div class="lab">Urdu · Noto Nastaliq Urdu (Faiz, selected)</div><div class="q-urdu" dir="rtl" lang="ur" style="font:400 44px/2.1 var(--font-urdu)">${esc(faiz.original_text).replace(/\n/g, '<br>')}</div></div>
  <div class="spec"><div class="lab">Devanagari · Noto Sans Devanagari (specimen: Dinkar, not selected)</div><div lang="hi" style="font:600 40px/1.6 var(--font-deva)">${esc(dinkar.original_text).replace(/\n/g, '<br>')}</div></div>`);

/* ── roach ── */
html += sec('roach', '03 · Motif', 'The roach, at every size', 'The existing procedural renderer, verbatim (legs drawn above s = 5). Map size encodes days elapsed: lerp(6, 28, easeOutCubic(day / 49)).', `
  <div class="roach-row" id="roach-sizes"></div>
  <p class="t-micro" style="margin-top:var(--s-6)">Map ramp · 6 Jun (day 0) → 25 Jul (day 49)</p>
  <div class="roach-row" id="roach-ramp"></div>`);

/* ── halftone ── */
html += sec('halftone', '04 · Backdrop', 'Rugged halftone', 'Noise field thresholded into a 45° dot screen with jittered radius and paper grain. The middle tile is the proposed default; text over it must stay AA.', `
  <div class="grid g3" id="ht"></div>`);

/* ── map ── */
html += sec('map', '05 · Map', 'Line-art base map (SITU Maidan-inspired)', 'OSM base cropped tight around the story sites; camera auto-fits each beat. Labels are white-on-black tags. Dashed elements are illustrative, never factual positions.', `
  <div class="map-tile" id="maptile"></div>`);

/* ── S5 rail + scrubber ── */
const node5 = timeline.nodes.find(n => n.id === 'protest_arrest');
html += sec('s5', '06 · Map stage parts', 'Rail card and hatched scrubber', 'Rail card per node: kicker, title, media (photos in grayscale, video as click-to-load poster), 2–4 fact blocks, people chips. Scrubber: ticks per day, longer weekly, node markers alternate above/below, red handle with a roach riding it.', `
  <div id="scrub-wrap" style="margin-bottom:var(--s-7)">${scrubber(timeline.nodes, { activeId: 'protest_arrest', dateISO: '2026-07-20', width: 1376 })}</div>
  <div style="width:460px">${railCard(node5, node5.sub_beats[0], { nStart: 12 })}</div>`);

/* ── facts & * ── */
const ex = node5.facts.filter(showable).filter(f => f.value != null).slice(0, 3);
html += sec('facts', '07 · Claims', 'Every stat carries a *', 'Claimant wording kept ("police said", "CJP claims", "reported"). Disputed and alleged statuses are flagged in red. The * jumps to the footer entry.', `
  <div class="grid g3">${ex.map((f, i) => factBlock(f, 21 + i)).join('')}</div>
  <div style="margin-top:var(--s-6)">${ex.map((f, i) => `<div class="footer-entry" id="src-${21 + i}"><b>*${21 + i}</b>${esc(f.claimant)} · ${esc(f.attribution)} · <span class="st st-${f.status}">${esc(f.status)}</span> · ${(f.links || []).filter(l => l.url).slice(0, 2).map(l => `<a href="${esc(l.url)}">${esc(l.publisher || new URL(l.url).hostname)}</a>`).join(', ') || esc(f.source_ids.join(', '))}</div>`).join('')}</div>`);

/* ── charts ── */
html += sec('charts', '08 · Charts', 'Black and grey, red for the highlight', 'Claimants are told apart by pattern, never by new hues: <b>solid</b> = official/police, <b>outline</b> = media, <b>hatched</b> = CJP/organisers. Contested figures stay separate points; never averaged.', `
  <div class="grid g3"><div id="ch-line"></div><div id="ch-x"></div><div id="ch-oct"></div></div>
  <div class="legend"><span><svg width="14" height="14"><rect width="14" height="14" fill="var(--chart-1)"/></svg>official / police</span><span><svg width="14" height="14"><rect x="1" y="1" width="12" height="12" fill="none" stroke="var(--chart-1)" stroke-width="2"/></svg>media</span><span><svg width="14" height="14"><rect width="14" height="14" fill="url(#hatchLegend)"/><defs><pattern id="hatchLegend" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line y2="4" stroke="var(--chart-1)" stroke-width="1.5"/></pattern></defs></svg>CJP / organisers</span><span><svg width="14" height="14"><rect width="14" height="14" fill="var(--chart-hi)"/></svg>highlight</span></div>`);

/* ── quotes ── */
const sel = quotes.quotes.filter(q => q.selected);
html += sec('quotes', '09 · Quotes', 'Quote cards: Latin, Urdu, Devanagari', 'Original script above, English beneath, source line always visible. Dashed card = specimen only.', `
  <div class="grid g2">${sel.map(q => quoteCard(q)).join('')}${quoteCard(dinkar, { specimen: true })}</div>
  <div style="margin-top:var(--s-7)" class="note">Kinetic type sample (Victory node, D: Vali 2026-11-12): <span class="kin" style="font-size:72px;color:var(--accent)">${esc(meta.finale.headline)}</span></div>`);

main.innerHTML = html;

/* ── canvases ── */
const ink = tok('--roach');
const rs = $('#roach-sizes');
for (const s of [4, 5, 6, 8, 12, 16, 20, 28, 36]) {
  const f = document.createElement('figure'); rs.appendChild(f);
  const ctx = canvasIn(f, Math.max(40, s * 3.4), Math.max(30, s * 2.2)); ctx.fillStyle = ctx.strokeStyle = ink;
  roach(ctx, Math.max(40, s * 3.4) / 2 - s * .5, Math.max(30, s * 2.2) / 2, 0, s, 1.1);
  f.insertAdjacentHTML('beforeend', `<figcaption>s = ${s}${s === 36 ? ' · founder' : s === 5 ? ' · swarm' : s === 4 ? ' · date' : ''}</figcaption>`);
}
const ramp = $('#roach-ramp');
for (const day of [0, 7, 14, 22, 30, 44, 49]) {
  const s = 6 + (28 - 6) * (1 - Math.pow(1 - day / 49, 3));
  const f = document.createElement('figure'); ramp.appendChild(f);
  const ctx = canvasIn(f, 100, 60); ctx.fillStyle = ctx.strokeStyle = ink; roach(ctx, 40, 30, -.3, s, 2);
  f.insertAdjacentHTML('beforeend', `<figcaption>day ${day} · s ${s.toFixed(1)}</figcaption>`);
}

const ht = $('#ht'), body = timeline.nodes[1].summary.text;
[[{ cell: 6, bias: -.1 }, 'cell 6 · light'], [{ cell: 7, bias: 0 }, 'cell 7 · default'], [{ cell: 8, bias: .18 }, 'cell 8 · heavy (dramatic beats)']].forEach(([o, lab], i) => {
  const t = document.createElement('div'); t.className = 'ht-tile'; ht.appendChild(t);
  halftone(canvasIn(t, 440, 260), 440, 260, { seed: 11 + i, ink: tok('--ht-ink'), ...o });
  t.insertAdjacentHTML('beforeend', `<p>${esc(body)}</p>`);
  const wrap = document.createElement('div'); t.replaceWith(wrap); wrap.append(t); wrap.insertAdjacentHTML('beforeend', `<p class="cap">${lab}</p>`);
});

/* map tile: 20 Jul flashpoints */
{
  const el = $('#maptile'), w = el.clientWidth, h = 520;
  const beat = node5.sub_beats[0];
  const cam = await fitSites(beat.site_ids, { w, h, pad: 70 });
  el.innerHTML = await mapSVG({ w, h, ...cam });
  const ctx = canvasIn(el, w, h); ctx.fillStyle = ctx.strokeStyle = tok('--roach');
  const R = (await import('./lib/kit.js')).rng(5);
  const s = 6 + 22 * (1 - Math.pow(1 - 44 / 49, 3)), placed = [];
  for (const id of beat.site_ids) {
    const a = await anchorXY(id, { w, h, ...cam }); if (!a) continue;
    const n = id === 'jantar_mantar_road' ? 26 : id === 'parliament' ? 4 : 7;
    for (let i = 0; i < n; i++) roach(ctx, a.x + (R() - .5) * 34, a.y + (R() - .5) * 26, R() * 6.28, s * .3, R() * 6);
    const site = sites.sites.find(x => x.id === id);
    let ly = a.y; const lw = site.name.length * 7.4 + 14;
    while (placed.some(([x0, y0, w0]) => Math.abs(y0 - ly) < 20 && a.x + 10 < x0 + w0 && a.x + 10 + lw > x0)) ly += 21;
    placed.push([a.x + 10, ly, lw]);
    el.insertAdjacentHTML('beforeend', `<span class="lab" style="left:${a.x}px;top:${ly}px">${esc(site.name)}</span>`);
  }
  // illustrative barricade on Sansad Marg near Patel Chowk
  const pc = await anchorXY('patel_chowk', { w, h, ...cam }), ps = await anchorXY('parliament_street', { w, h, ...cam });
  ctx.save(); ctx.strokeStyle = tok('--map-illustrative'); ctx.lineWidth = 4; ctx.setLineDash([8, 6]);
  const mx = (pc.x + ps.x) / 2, my = (pc.y + ps.y) / 2, ang = Math.atan2(ps.y - pc.y, ps.x - pc.x) + Math.PI / 2;
  ctx.beginPath(); ctx.moveTo(mx - Math.cos(ang) * 34, my - Math.sin(ang) * 34); ctx.lineTo(mx + Math.cos(ang) * 34, my + Math.sin(ang) * 34); ctx.stroke(); ctx.restore();
  el.insertAdjacentHTML('beforeend', `<span class="lab illus" style="left:${mx + 40}px;top:${my + 46}px">Barricade · illustrative</span>
    <div class="map-legend"><b>Reading the map</b><br>Each roach = protesters, by reported crowd band (not a headcount). Size grows with days since 6 Jun. Dashed = illustrative. Map © OpenStreetMap contributors (ODbL).</div>`);
}



/* ── charts (static SVG, styling only) ── */
const C = { fg: 'var(--chart-1)', g: 'var(--chart-grid)', hi: 'var(--chart-hi)' };
const defs = `<defs><pattern id="hp" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line y2="5" stroke="var(--chart-1)" stroke-width="1.6"/></pattern></defs>`;
const mark = (cat, x, y, r = 7) => cat === 'official' ? `<circle cx="${x}" cy="${y}" r="${r}" fill="${C.fg}"/>` : cat === 'cjp' ? `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#hp)" stroke="${C.fg}" stroke-width="1.5"/>` : `<circle cx="${x}" cy="${y}" r="${r - 1}" fill="var(--bg)" stroke="${C.fg}" stroke-width="2"/>`;
const cat = c => /cjp|organis/i.test(c) ? 'cjp' : /police|official|mha|dmrc|court|government/i.test(c) ? 'official' : 'media';
const rows = metrics.rows;

// line: Instagram followers (claimed, organiser/media-reported)
{
  const pts = rows.filter(r => /^Instagram followers/.test(r.metric)).map(r => ({ d: r.date, v: r.value, r }));
  const W = 440, H = 300, x = i => 50 + i * (W - 90) / (pts.length - 1), y = v => H - 40 - v / 2.2e7 * (H - 80);
  $('#ch-line').innerHTML = `<p class="t-micro">Instagram followers, May (claimed)</p><svg class="chart" viewBox="0 0 ${W} ${H}">${defs}
    ${[0, 1e7, 2e7].map(v => `<line x1="40" x2="${W - 20}" y1="${y(v)}" y2="${y(v)}" stroke="${C.g}"/><text x="0" y="${y(v) + 4}">${fmtNum(v)}</text>`).join('')}
    <polyline points="${pts.map((p, i) => `${x(i)},${y(p.v)}`).join(' ')}" fill="none" stroke="${C.fg}" stroke-width="2.5"/>
    ${pts.map((p, i) => mark('media', x(i), y(p.v), 6) + `<text class="lbl" x="${x(i)}" y="${y(p.v) - 14}" text-anchor="middle">${esc(p.r.value_text.split(' (')[0])}*</text><text x="${x(i)}" y="${H - 14}" text-anchor="middle">${esc(fmtDate(p.d))}</text>`).join('')}
    </svg><p class="cap">Reported by media (BusinessToday, Economic Times via Wikipedia). No platform-verified data.</p>`;
}
// dot plot: X followers, 21 May, conflicting claims
{
  const pts = rows.filter(r => /^X followers/.test(r.metric));
  const W = 440, H = 300, x = v => 40 + v / 2.2e5 * (W - 80);
  $('#ch-x').innerHTML = `<p class="t-micro">X followers around 21 May (disputed)</p><svg class="chart" viewBox="0 0 ${W} ${H}">${defs}
    ${[0, 1e5, 2e5].map(v => `<line x1="${x(v)}" x2="${x(v)}" y1="30" y2="${H - 40}" stroke="${C.g}"/><text x="${x(v)}" y="${H - 20}" text-anchor="middle">${fmtNum(v)}</text>`).join('')}
    ${pts.map((r, i) => { const yy = 70 + i * 70; return mark(cat(r.claimant), x(r.value), yy, 9) + `<text class="lbl" x="${x(r.value)}" y="${yy - 16}" text-anchor="middle">${esc(r.value_text.split(' (')[0])}*</text><text x="${x(r.value)}" y="${yy + 26}" text-anchor="middle">${esc(r.claimant)}</text>`; }).join('')}
    </svg><p class="cap">Three sources, three figures. Shown side by side, not reconciled.</p>`;
}
// range: 10 Oct detentions
{
  const pts = rows.filter(r => r.metric === 'Detained (Delhi)');
  const W = 440, H = 300, x = v => 30 + v / 1.6e4 * (W - 60);
  $('#ch-oct').innerHTML = `<p class="t-micro">Detained in Delhi, 10 Oct (disputed)</p><svg class="chart" viewBox="0 0 ${W} ${H}">${defs}
    ${[0, 5e3, 1e4, 1.5e4].map(v => `<line x1="${x(v)}" x2="${x(v)}" y1="20" y2="${H - 40}" stroke="${C.g}"/><text x="${x(v)}" y="${H - 20}" text-anchor="middle">${fmtNum(v)}</text>`).join('')}
    ${pts.map((r, i) => { const yy = 40 + i * 46, c = cat(r.claimant); return (r.value_later ? `<line x1="${x(r.value)}" x2="${x(r.value_later)}" y1="${yy}" y2="${yy}" stroke="${C.fg}" stroke-width="2" stroke-dasharray="3 3"/>` + mark(c, x(r.value_later), yy, 5) : '') + mark(c, x(r.value), yy, 7) + (() => { const right = x(r.value) > W * .62, tx = right ? x(r.value) - 12 : x(r.value_later || r.value) + 12, an = right ? 'end' : 'start'; return `<text x="${tx}" y="${yy + 4}" class="lbl" text-anchor="${an}">${esc(r.value_text)}*</text><text x="${tx}" y="${yy + 18}" text-anchor="${an}">${esc(r.claimant)}</text>`; })(); }).join('')}
    </svg><p class="cap">Varies by a factor of about 7 (dossier). Each claimant is its own point.</p>`;
}
document.body.dataset.ready = '1';

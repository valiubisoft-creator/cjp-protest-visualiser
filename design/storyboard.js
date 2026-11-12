// F2 storyboard: one static 1440×900 key frame per scene. Strings and numbers come from data/story only.
import { story, load, esc, missing, tok, canvasIn, halftone, swarm, roach, rng, mapSVG, fitSites, anchorXY, showable, dayN, fmtDate } from './lib/kit.js';
import { factBlock, railCard, scrubber, quoteCard, PARTS_CSS, fmtNum } from './lib/parts.js';
import { skeleton as skeletonAt, brackets } from '../src/lib/skeleton.js';

const TAU = Math.PI * 2, W = 1440, H = 900;
const Q = new URLSearchParams(location.search);
const theme = Q.get('theme') === 'paper' ? 'paper' : 'ink';
document.documentElement.dataset.theme = theme;
document.querySelectorAll('.theme button').forEach(b => {
  b.setAttribute('aria-pressed', b.dataset.t === theme);
  b.onclick = () => { const u = new URL(location); u.searchParams.set('theme', b.dataset.t); location = u; };
});
document.head.insertAdjacentHTML('beforeend', `<style>${PARTS_CSS}</style>`);
// the skeleton face: display (Protest Revolution) or sans (Public Sans Black, the S4a fallback)
const SKEL = Q.get('skel') === 'display' ? 'display' : 'sans';
await Promise.all(['100px "Protest Revolution"', '900 100px "Public Sans"', '500 40px "Public Sans"', '40px "Noto Nastaliq Urdu"'].map(f => document.fonts.load(f, f.includes('Nastaliq') ? 'بول' : '0123456789/Cockroaches')));
await document.fonts.ready;

const [meta, timeline, metrics, quotes, sites, sources, methodology, epilogue] = await Promise.all(
  ['meta', 'timeline', 'metrics', 'quotes', 'sites', 'sources', 'methodology', 'epilogue_october'].map(story));
const NODE = Object.fromEntries(timeline.nodes.map(n => [n.id, n]));
const SITE = Object.fromEntries(sites.sites.map(s => [s.id, s]));
const TIERS = Object.fromEntries(methodology.crowd_tiers.tiers.map(t => [t.tier, t]));
const SRC = Object.fromEntries(sources.sources.map((s, i) => [s.id, { ...s, n: i + 1 }]));
const ddmmyyyy = iso => iso.split('-').reverse().join('/');
const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
// spec S5: size(day) = lerp(6, 28, easeOutCubic(day / 49)). Read as body length in px; roach() s ≈ length / 1.9.
const mapSize = day => 6 + 22 * easeOutCubic(Math.min(1, Math.max(0, day / 49)));
const S_PER_PX = 1 / 1.9;
const featured = f => showable(f) && f.web_check !== 'unconfirmed';
let starN = 0; const star = (label = '') => `<a class="star" href="#" aria-label="Source ${++starN}${label ? ': ' + esc(label) : ''}">*</a>`;

const frames = [];
const $f = document.getElementById('frames');
function frame(id, code, title, why, { cls = '' } = {}) {
  $f.insertAdjacentHTML('beforeend', `<section class="frame-wrap" id="f-${id}">
    <h3><span class="t-micro">${code}</span>${title}</h3><p class="why">${why}</p>
    <div class="frame-scaler"><div class="frame ${cls}" data-id="${id}"></div></div></section>`);
  frames.push({ id, code });
  return $f.lastElementChild.querySelector('.frame');
}
const layer = (F, html, cls = 'layer') => { F.insertAdjacentHTML('beforeend', `<div class="${cls}">${html}</div>`); return F.lastElementChild; };
const ctxAbs = (el, w = W, h = H) => { const c = canvasIn(el, w, h); c.canvas.classList.add('abs'); return c; };
const back = (F, o = {}) => halftone(ctxAbs(F), W, H, { seed: 11, cell: 7, ink: tok('--ht-ink', F), ...o });
const ink = F => tok('--roach', F);
function roachURL(color, s = 8, w = 56, h = 34) {
  const c = document.createElement('canvas'); c.width = w * 2; c.height = h * 2;
  const x = c.getContext('2d'); x.scale(2, 2); x.fillStyle = x.strokeStyle = color; roach(x, w * .36, h / 2, 0, s, 1.2);
  return c.toDataURL();
}

// skeleton() and brackets() were promoted to src/lib/skeleton.js in F3 (no behaviour change).
const skeleton = (text, o) => skeletonAt(text, { ...o, face: SKEL });

// the prologue swarm (S3 end state): deterministic positions shared by S3 and S4 p 0
const ORIGIN = { x: 720, y: 610 };
function prologueSwarm(n, spread, seed = 21) {
  const r = rng(seed), out = [];
  for (let i = 0; i < n; i++) {
    const t = i / Math.max(1, n - 1), rad = spread * Math.sqrt(r()) * (.35 + .65 * Math.sqrt(t)), a = r() * TAU;
    out.push({ x: ORIGIN.x + Math.cos(a) * rad * 1.45, y: ORIGIN.y + Math.sin(a) * rad * .95 - rad * .25, rot: r() * TAU, s: 5 * (1 + (r() - .5) * .6), legs: r() * TAU, born: t });
  }
  return out;
}

/* ════════════════ S0 · Hero ════════════════ */
{
  const F = frame('S0', 'S0 · p 0.00', 'Hero: the swarm and the glitch word',
    `About 420 roaches (s ≈ 5, the swarm token) roam over <code>meta.title</code> in Protest Revolution at <code>--fs-hero</code>. Glitches are frozen mid-life: 6–14 px slices displaced ±6–18 px with a 3 px red channel split, only where a roach crosses a glyph. Scroll cue bottom-centre.`);
  back(F);
  const wc = ctxAbs(F), sw = ctxAbs(F);
  const off = document.createElement('canvas'); off.width = W; off.height = H;
  const o = off.getContext('2d'); o.font = `var(--fs-hero)`; o.font = `${tok('--fs-hero')} "Protest Revolution"`; o.textAlign = 'center'; o.textBaseline = 'middle';
  o.fillStyle = tok('--fg', F); o.fillText(meta.title, W / 2, H / 2 - 10);
  const offR = document.createElement('canvas'); offR.width = W; offR.height = H;
  const oR = offR.getContext('2d'); oR.font = o.font; oR.textAlign = 'center'; oR.textBaseline = 'middle'; oR.fillStyle = tok('--accent', F); oR.fillText(meta.title, W / 2, H / 2 - 10);
  wc.drawImage(off, 0, 0, W, H);
  // glitch points: roaches standing on glyph pixels
  const mask = o.getImageData(0, 0, W, H).data, r = rng(4), hits = [];
  for (let k = 0; hits.length < 9 && k < 8000; k++) {
    const x = 280 + r() * 880, y = 330 + r() * 200;
    if (mask[((y | 0) * W + (x | 0)) * 4 + 3] > 200 && hits.every(h => Math.abs(h.x - x) > 90)) hits.push({ x, y });
  }
  for (const h of hits) {
    for (let b = 0; b < 2; b++) {
      const bh = 6 + r() * 8, bw = 80 + r() * 60, bx = h.x - bw / 2, by = h.y - bh / 2 + (b ? 14 : -10) + (r() - .5) * 10, dx = (r() < .5 ? -1 : 1) * (6 + r() * 12);
      wc.clearRect(bx, by, bw, bh);
      wc.drawImage(offR, bx, by, bw, bh, bx + dx + 2 + r() * 2, by, bw, bh);
      wc.drawImage(off, bx, by, bw, bh, bx + dx, by, bw, bh);
    }
  }
  sw.fillStyle = sw.strokeStyle = ink(F);
  swarm(sw, W, H, { seed: 3, count: 410, size: 5, color: ink(F) });
  for (const h of hits) roach(sw, h.x, h.y, r() * TAU, 5.5, r() * TAU);
  layer(F, `<div class="cue"><img src="${roachURL(tok('--fg', F), 6, 40, 24)}" width="40" height="24" alt=""><span class="t-micro">scroll</span></div>`);
}

/* ════════════════ S1 · CJI quote ════════════════ */
{
  const q = meta.cji_quote;
  const F = frame('S1', 'S1 · p 0.50', 'The CJI quote and the click',
    `Hold state, hint showing (after p 0.4). <code>meta.cji_quote.text</code> verbatim; the first whole-word <code>keyword</code> is a <code>&lt;button class="kw"&gt;</code>: black weight in <code>--accent-text</code>, wavy red underline, a small roach on the underline. The hero swarm continues behind at 25 % opacity and 40 % count.`);
  back(F);
  const sw = ctxAbs(F); sw.globalAlpha = .25; swarm(sw, W, H, { seed: 3, count: 168, size: 5, color: ink(F) }); sw.globalAlpha = 1;
  const re = new RegExp(`\\b(${q.keyword})\\b`, 'i'), parts = q.text.split(re);
  const kwIdx = parts.findIndex(p => re.test(p));
  const html = parts.map((p, i) => i === kwIdx ? `<button class="kw" aria-label="Click the word ${esc(q.keyword)} to continue">${esc(p)}<img class="kw-roach" src="${roachURL(tok('--accent', F), 7, 28, 17)}" alt=""></button>` : esc(p)).join('');
  const src = SRC[q.source_id];
  const L = layer(F, `<div class="s1-quote"><blockquote>“${html}”${star(src?.publisher)}</blockquote>
    <div class="s1-attr"><b>${esc(q.speaker)}</b><span class="t-num">${esc(fmtDate(q.date))} 2026</span><span>Source: ${esc(src?.publisher ?? missing('cji_quote.source_id'))}</span></div></div>`);
  const kw = L.querySelector('.kw'), fr = F.getBoundingClientRect(), kr = kw.getBoundingClientRect(), z = fr.width / W;
  layer(F, `<div class="hint t-micro" style="left:${(kr.left - fr.left) / z}px;top:${(kr.top - fr.top) / z - 40}px">click the word</div>`);
}

/* ════════════════ S2 · Spawn ════════════════ */
{
  const fd = meta.founder;
  const F = frame('S2', 'S2 · after the timed sequence (p 0.30)', 'Collapse and spawn',
    `The quote has gone; one roach at <code>--roach-founder</code> (s 36) idles in the lower third. Label: <code>meta.founder.name</code> + “is spawned” (spec copy), with a * to <code>founder.founded</code>. Nothing else on screen.`);
  back(F);
  const c = ctxAbs(F); c.fillStyle = c.strokeStyle = ink(F); roach(c, ORIGIN.x, ORIGIN.y, -.35, 36, .8);
  layer(F, `<div class="lead-line" style="left:${ORIGIN.x + 64}px;top:${ORIGIN.y - 40}px;width:120px;transform:rotate(-24deg)"></div>
    <div class="spawn-label" style="left:${ORIGIN.x + 176}px;top:${ORIGIN.y - 108}px"><b>${esc(fd.name)}</b> is spawned${star(fd.founded.claimant)}
      <div class="t-micro" style="color:var(--muted);margin-top:8px">${esc(fd.founded.attribution)} · ${esc(fd.founded.value_text)}</div></div>`);
}

/* ════════════════ S3 · Multiply ════════════════ */
{
  const n = Math.round(Math.pow(380, .8));
  const F = frame('S3', `S3 · p 0.80 · n = ${n}`, 'Multiply',
    `n(p) = round(380<sup>p</sup>) = ${n} at p 0.8. Births spread outward from the founder's spot; the youngest (outermost) are still scaling in. No text: the swarm is the content. The founder (Vali, 2026-11-12) shrinks from s 36 to swarm size over p 0–0.3 and is one of the crowd by now: no marker.`);
  back(F, { bias: .05 });
  const c = ctxAbs(F); c.fillStyle = c.strokeStyle = ink(F);
  for (const b of prologueSwarm(n, 520)) roach(c, b.x, b.y, b.rot, b.s * (b.born > .92 ? .45 + (1 - b.born) * 6 : 1), b.legs);
  roach(c, ORIGIN.x, ORIGIN.y, -.35, 5.5, .8);
}

/* ════════════════ S3.5 · The claim and the correction (new scene, Vali 2026-11-12) ════════════════ */
// Port of v2's "01 · The swarm" split (index.html, SPLITS 2 → 3): phyllotaxis clusters, anime.js
// stagger({ from: 'random' }) + inOutQuart in motion. Facts: timeline start_pushback (both sentences, verbatim)
// and metrics rows "Share of Pakistani followers" / "Share of Indian audience". Complements (51 %, ≤6 %) are not
// claimed by anyone, so those clusters carry no number.
const N35 = 380;
const PUSH = NODE.start.sub_beats.find(b => b.id === 'start_pushback').facts.find(f => /Pakistani/.test(f.text));
const [CLAIM_TXT, REBUT_TXT] = PUSH.text.split(/(?<=\.)\s+/);
const ROW = m => metrics.rows.find(r => r.metric === m);
const PAK = ROW('Share of Pakistani followers'), IND = ROW('Share of Indian audience');
const GOLD = Math.PI * (3 - Math.sqrt(5));
const phyllo = (n, cx, cy, sp) => Array.from({ length: n }, (_, i) => [cx + Math.cos(i * GOLD) * sp * Math.sqrt(i + .5), cy + Math.sin(i * GOLD) * sp * Math.sqrt(i + .5)]);
function clusters(rightShare) {
  const nR = Math.round(N35 * rightShare / 100), nL = N35 - nR, sp = 12.5, gap = 150, cy = 380;
  const rL = sp * Math.sqrt(nL), rR = sp * Math.sqrt(nR), cxL = (W - (2 * rL + gap + 2 * rR)) / 2 + rL, cxR = cxL + rL + gap + rR;
  return { pts: [...phyllo(nL, cxL, cy, sp).map(p => [...p, 0]), ...phyllo(nR, cxR, cy, sp).map(p => [...p, 1])], cxL, cxR, rL, rR, cy, nL, nR };
}
const CLAIM = clusters(PAK.value), REBUT = clusters(100 - IND.value);
const perm = (() => { const r = rng(35), a = [...Array(N35).keys()]; for (let i = a.length - 1; i > 0; i--) { const j = (r() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; })();
// roach k: claim target CLAIM.pts[k], correction target REBUT.pts[perm[k]] — so the red side visibly breaks up
const R35 = (() => { const r = rng(36); return Array.from({ length: N35 }, () => ({ rot: r() * TAU, legs: r() * TAU, delay: r() * .55 })); })();
const label35 = (x, y, name, f, n) => `<div class="cl-lab" style="left:${x}px;top:${y}px"><span class="nm">${esc(name)}</span>${f ? `<span class="v t-num">${esc(f.value_text)}${star(f.claimant)}</span><span class="cl t-micro">${esc(f.claimant)} · <span class="st st-${f.status}">${esc(f.status)}</span></span>` : ''}</div>`;
function s35Frame(id, code, title, why, t, labels, caption) {
  const F = frame(id, code, title, why);
  back(F, { bias: .05 });
  const c = ctxAbs(F), red = tok('--accent', F), fg = ink(F);
  for (let k = 0; k < N35; k++) {
    const a = CLAIM.pts[k], b = REBUT.pts[perm[k]], tk = Math.min(1, Math.max(0, (t - R35[k].delay) / .45)), e = tk < .5 ? 8 * tk ** 4 : 1 - (-2 * tk + 2) ** 4 / 2;
    const x = a[0] + (b[0] - a[0]) * e, y = a[1] + (b[1] - a[1]) * e - Math.sin(e * Math.PI) * 40;
    c.fillStyle = c.strokeStyle = a[2] === 1 && e < .5 ? red : fg;
    c.globalAlpha = b[2] === 1 && e > .5 ? .55 : 1;
    roach(c, x, y, tk > 0 && tk < 1 ? Math.atan2(b[1] - a[1], b[0] - a[0]) : R35[k].rot, 5, R35[k].legs);
  }
  c.globalAlpha = 1;
  layer(F, labels + `<p class="cl-cap">${caption}</p>`);
}
s35Frame('S3-5-claim', 'S3.5 · p 0.30', 'The claim: sorted as “Pakistani” and “Indian”',
  `The S3 swarm sorts into two phyllotaxis clusters at the minister's split. Both numbers follow the minister's claim (Vali, 2026-11-12): 49 % from the data, Indian = the remaining ${100 - PAK.value} %, attributed to the same claimant. The claimed-Pakistani cluster is red (state action). Caption is the first sentence of the <code>start_pushback</code> fact, verbatim. In motion: v2's <code>animate(pts, …, delay: stagger([0, 700], { from: 'random' }), ease: 'inOutQuart')</code>.`,
  0, label35(CLAIM.cxL, CLAIM.cy + CLAIM.rL + 28, 'Indian', { value_text: `${100 - PAK.value}%`, claimant: PAK.claimant, status: PAK.status }) + label35(CLAIM.cxR, CLAIM.cy + CLAIM.rR + 28, 'Pakistani', PAK),
  `${esc(CLAIM_TXT)}${star(PUSH.claimant)} <span class="cl-a">${esc(PUSH.attribution)} · <span class="st st-${PUSH.status}">${esc(PUSH.status)}</span></span>`);
s35Frame('S3-5-mid', 'S3.5 · p 0.60', 'The correction, in transit',
  `Mid-transition: roaches leave the red cluster in random stagger, arcing left and dropping the red as they cross. Same roaches, re-sorted; nothing is born or killed here.`,
  .5, '', `${esc(REBUT_TXT)}${star(IND.claimant)}`);
s35Frame('S3-5-rebut', 'S3.5 · p 0.90', 'The correction: over 94% Indian',
  `End state: Dipke's screen recording (<code>Share of Indian audience</code>). The small cluster is the remainder, unlabelled with a number because nobody claimed one; drawn at 55 % so it reads as residue. This layout is where S4's converge starts.`,
  1, label35(REBUT.cxL, REBUT.cy + REBUT.rL + 28, 'Indian', IND) + label35(REBUT.cxR, REBUT.cy + REBUT.rR + 28, 'Elsewhere'),
  `${esc(REBUT_TXT)}${star(IND.claimant)} <span class="cl-a">${esc(IND.claimant)} · <span class="st st-${IND.status}">${esc(IND.status)}</span></span>`);

/* ════════════════ S4 · the date on the skeleton ════════════════ */
const startDate = ddmmyyyy(meta.protest_start_date);
const S4BOX = { x: 110, y: 250, w: 1220, h: 330 };
const sk4 = skeleton(startDate, { w: S4BOX.w, h: S4BOX.h, spacing: 7.4 });
const slots4 = sk4.slots.map(s => ({ ...s, x: s.x + S4BOX.x, y: s.y + S4BOX.y }));
const box4 = { x0: sk4.box.x0 + S4BOX.x, y0: sk4.box.y0 + S4BOX.y, x1: sk4.box.x1 + S4BOX.x, y1: sk4.box.y1 + S4BOX.y };
const S4_S = 5.6;
const s4why = `${slots4.length} slots at ${SKEL === 'display' ? 'Protest Revolution' : 'Public Sans Black (S4a fallback)'} skeleton, roach s ${S4_S} (legs show above s 5; the <code>--roach-type</code> 4 reads as a dashed line), spacing 7.4 px. <b>S4a (Vali, 2026-11-12):</b> S3.5 ends with ${N35} roaches; the other ~${Math.round((slots4.length - N35) / 10) * 10} join from the screen edges during converge.`;
function s4Frame(p, title, extra, draw) {
  const F = frame(`S4-${p}`, `S4 · p ${p.toFixed(2)}`, title, extra + ' ' + s4why);
  back(F, { bias: .05 });
  draw(F);
}
s4Frame(0, 'The date: converge begins', 'Starts from the S3.5 end layout: both clusters break up, every roach turning toward its slot, while the first joiners stream in from all four edges. The date is not yet visible.', F => {
  const c = ctxAbs(F); c.fillStyle = c.strokeStyle = ink(F); const r = rng(40);
  REBUT.pts.forEach(([x, y], k) => { const s = slots4[(k * 7919) % slots4.length]; const a = Math.atan2(s.y - y, s.x - x); roach(c, x + Math.cos(a) * 14, y + Math.sin(a) * 14, a + (r() - .5) * .5, 5, r() * TAU); });
  for (let i = 0; i < 150; i++) {
    const e = (r() * 4) | 0, u = r(), d = 10 + r() * 70, x = e === 0 ? u * W : e === 1 ? W - d : e === 2 ? u * W : d, y = e === 0 ? d : e === 1 ? u * H : e === 2 ? H - d : u * H;
    const s = slots4[(r() * slots4.length) | 0]; roach(c, x, y, Math.atan2(s.y - y, s.x - x) + (r() - .5) * .4, 5, r() * TAU);
  }
});
s4Frame(.45, 'The date: arrival', 'End of converge: near slots filled, the farthest arrivals still walking in along their approach line. No brackets yet.', F => {
  const c = ctxAbs(F); c.fillStyle = c.strokeStyle = ink(F); const r = rng(9);
  slots4.forEach((s, i) => {
    const far = Math.hypot(s.x - 720, s.y - 415) / 640, late = r() < .14 * far + .02;
    if (!late) return roach(c, s.x, s.y, s.a + (r() < .5 ? Math.PI : 0), S4_S, r() * TAU);
    const a = r() * TAU, d = 40 + r() * 240;
    roach(c, s.x + Math.cos(a) * d, s.y + Math.sin(a) * d, a + Math.PI, S4_S + 1, r() * TAU);
  });
});
s4Frame(.6, 'The date: hold (legibility check)', 'Hold: every roach on its segment, shimmering ±3 px along the tangent; corner brackets drawn. No caption (the data has none; Vali may add one later). This is the frame the spec\'s legibility rule is judged on.', F => {
  const c = ctxAbs(F); c.fillStyle = c.strokeStyle = ink(F); const r = rng(10);
  for (const s of slots4) { const j = (r() - .5) * 6; roach(c, s.x + Math.cos(s.a) * j, s.y + Math.sin(s.a) * j, s.a + (r() < .5 ? Math.PI : 0), S4_S, r() * TAU); }
  brackets(c, box4, 30, 46, tok('--fg', F));
});
await (async () => {
  const MW = 893, MH = 804;
  const cam = await fitSites(NODE.start.site_ids, { w: MW, h: MH, pad: 90 });
  const land = await anchorXY('jantar_mantar_road', { w: MW, h: MH, ...cam });
  s4Frame(.9, 'The date: release into the map', 'Release, left to right: the first glyphs have peeled away toward the Jantar Mantar landing point; the backdrop cross-dissolves into the map; the date has become the HUD readout top-left.', async F => {});
  const F = document.querySelector('[data-id="S4-0.9"]');
  const m = layer(F, await mapSVG({ w: MW, h: MH, ...cam }), 'layer'); m.style.cssText = `width:${MW}px;height:${MH}px;opacity:.55`; m.classList.add('map-fade');
  const c = ctxAbs(F); c.fillStyle = c.strokeStyle = ink(F); const r = rng(12);
  const cut = box4.x0 + (box4.x1 - box4.x0) * .62;
  for (const s of slots4) {
    if (s.x > cut) { roach(c, s.x, s.y, s.a + (r() < .5 ? Math.PI : 0), S4_S, r() * TAU); continue; }
    const t = Math.min(1, (cut - s.x) / (cut - box4.x0) * 1.15 + r() * .1);
    if (t > .98 && r() < .7) continue;
    const ex = land.x + (r() - .5) * 60, ey = land.y + (r() - .5) * 40, bend = Math.sin(t * Math.PI) * 120 * (r() - .3);
    const x = s.x + (ex - s.x) * easeOutCubic(t), y = s.y + (ey - s.y) * easeOutCubic(t) + bend;
    roach(c, x, y, Math.atan2(ey - s.y, ex - s.x) + (r() - .5) * .6, S4_S + t * (mapSize(0) * S_PER_PX + 1 - S4_S), r() * TAU);
  }
  layer(F, `<div class="hud"><span class="d t-num">${startDate}</span><span class="t-micro">Day 0</span></div>`, 'hud-wrap');
})();

/* ════════════════ S5 · map stage ════════════════ */
const tierCount = id => {
  let t = null; for (const n of timeline.nodes) { if (n.crowd_tier != null) t = n.crowd_tier; if (n.id === id) break; }
  return t;
};
// Victory is not part of the map stage (Vali, 2026-11-12): it lives only in S6.
const S5_NODES = timeline.nodes.filter(n => n.id !== 'victory');
async function s5Frame({ id, code, title, why, node, beat = null, dateISO, kinetic = false }) {
  const F = frame(id, code, title, why);
  const MW = 893, MH = 804, ids = beat?.site_ids?.length ? beat.site_ids : node.site_ids;
  const tierOwn = beat?.crowd_tier ?? node.crowd_tier, tier = tierOwn ?? tierCount(node.id), T = TIERS[tier];
  const cam = await fitSites(ids, { w: MW, h: MH, pad: 110, kSingle: 2.4 });
  const map = layer(F, await mapSVG({ w: MW, h: MH, ...cam }), 's5-map');
  const c = ctxAbs(map, MW, MH); c.fillStyle = c.strokeStyle = ink(F);
  const day = dayN(dateISO), sz = mapSize(day), zf = Math.min(1, Math.sqrt(cam.k / 2.4)), s = Math.max(2.6, sz * S_PER_PX * zf), r = rng(31 + day);
  const pts = (await Promise.all(ids.map(i => anchorXY(i, { w: MW, h: MH, ...cam }).then(a => a && a.in && { id: i, ...a })))).filter(Boolean);
  const wts = pts.map(p => p.id === 'jantar_mantar_road' ? Math.max(1, pts.length * .6) : 1), wsum = wts.reduce((a, b) => a + b, 0);
  const placed = [];
  pts.forEach((p, k) => {
    const n = Math.round(T.roaches * wts[k] / wsum), sig = Math.sqrt(n) * s * 1.05 + 6;
    for (let i = 0; i < n; i++) { const a = r() * TAU, d = sig * Math.sqrt(-2 * Math.log(1 - r() * .97)) * .7; roach(c, p.x + Math.cos(a) * d, p.y + Math.sin(a) * d * .8, r() * TAU, s, r() * TAU); }
    const lw = SITE[p.id].name.length * 7.6 + 16, flip = p.x + 14 + lw > MW - 8, lx = flip ? p.x - 24 - lw : p.x + 4; let ly = p.y;
    while (placed.some(([x0, y0, w0]) => Math.abs(y0 - ly) < 22 && lx < x0 + w0 + 6 && lx + lw + 6 > x0)) ly += 22;
    placed.push([lx, ly, lw]);
    c.save(); c.fillStyle = tok('--accent', F); c.beginPath(); c.arc(p.x, p.y, 4, 0, TAU); c.fill(); c.restore();
    map.insertAdjacentHTML('beforeend', `<span class="lab" style="left:${lx}px;top:${ly}px">${esc(SITE[p.id].name)}</span>`);
  });
  if (node.id === 'protest_arrest') {
    // illustrative barricade on Sansad Marg between Patel Chowk and Parliament Street (no source gives positions)
    const pc = pts.find(p => p.id === 'patel_chowk'), ps = pts.find(p => p.id === 'parliament_street');
    if (pc && ps) {
      c.save(); c.strokeStyle = tok('--map-illustrative', F); c.lineWidth = 4; c.setLineDash([8, 6]);
      const mx = (pc.x + ps.x) / 2, my = (pc.y + ps.y) / 2, ang = Math.atan2(ps.y - pc.y, ps.x - pc.x) + Math.PI / 2;
      c.beginPath(); c.moveTo(mx - Math.cos(ang) * 30, my - Math.sin(ang) * 30); c.lineTo(mx + Math.cos(ang) * 30, my + Math.sin(ang) * 30); c.stroke(); c.restore();
      map.insertAdjacentHTML('beforeend', `<span class="lab illus" style="left:${mx - 220}px;top:${my + 30}px">Barricade · illustrative</span>`);
    }
  }
  const fast = beat?.hunger_strike_day ?? node.hunger_strike_day;
  map.insertAdjacentHTML('beforeend', `<div class="hud"><span class="d t-num">${ddmmyyyy(dateISO)}</span><span class="t-micro t-num">Day ${day}${fast ? ` · <b>Fast day ${fast}</b>` : ''}</span></div>
    <div class="s5-legend"><b>Reading the map</b>
      <div class="row t-num">${(() => { const q = document.createElement('canvas'); return `<img src="${roachURL(ink(F), Math.max(3, s), 44, 26)}" width="44" height="26" alt="">`; })()}
        <span>Tier ${tier} · “${esc(T.label)}” → ${T.roaches} roaches${tierOwn == null ? ' · <span class="nc">no count reported</span>' : ''}</span></div>
      ${esc(methodology.roach_size)} Dashed = illustrative. ${esc((methodology.map.base.match(/Credit: (.*)$/) || [])[1] || '')}</div>`);
  const rail = layer(F, '', 's5-rail');
  const pick = o => ({ ...o, facts: (o.facts || []).filter(featured) });
  if (kinetic) {
    const KF = (node.facts || []).filter(featured);
    rail.innerHTML = `<div class="kin-panel stage-dramatic">
        <p class="t-micro t-num">${esc(fmtDate(node.date))} 2026 · Day ${day}</p>
        <span class="kin-word kin-ghost" style="left:30px;top:96px;font-size:150px;transform:translate(-18px,10px) rotate(-3deg)">${esc(node.label)}</span>
        <span class="kin-word" style="left:30px;top:86px;font-size:150px">${esc(node.label)}</span>
        ${node.title.split(' ').map((w, i) => `<span class="kin-word" style="left:${34 + i * 6}px;top:${236 + i * 92}px;font-size:${96 - i * 6}px;transform:translateX(${i * 54}px) rotate(${i ? -2 : 0}deg);${i ? 'opacity:.92' : ''}">${esc(w)}</span>`).join('')}
      </div>
      <div class="facts">${KF.slice(0, 2).map(f => factBlock(f, ++starN)).join('')}</div>`;
  } else rail.innerHTML = railCard(pick(node), beat && pick(beat), { nStart: starN + 1, maxFacts: 2 });
  rail.insertAdjacentHTML('beforeend', '<div class="rail-more"></div>');
  layer(F, scrubber(S5_NODES, { activeId: node.id, dateISO, width: 1440, height: 96 }), 's5-scrub');
}
await s5Frame({ id: 'S5-start', code: 'S5 · node 1 (Start), hold', title: 'Map stage: how it began', node: NODE.start, dateISO: NODE.start.date,
  why: `Camera fitted to <code>start.site_ids</code> (single site, close zoom). Tier ${NODE.start.crowd_tier} → ${TIERS[NODE.start.crowd_tier].roaches} roaches at day 0 size. Rail card = <code>railCard(node)</code>, two featured facts (hold, unverified and web-unconfirmed facts are skipped). HUD top-left and legend bottom-left sit in map margins, never over the rail.` });
await s5Frame({ id: 'S5-0720', code: 'S5 · node 5, sub-beat 20 Jul, hold', title: 'Map stage: Sansad Chalo, 20 Jul', node: NODE.protest_arrest, beat: NODE.protest_arrest.sub_beats[0], dateISO: '2026-07-20',
  why: `Camera fits the eleven 20 Jul <code>site_ids</code>; tier 4 → ${TIERS[4].roaches} roaches, weighted to Jantar Mantar Road; red dots mark the sites. Barricade dashed and labelled illustrative (label moved clear of Patel Chowk: board nit). <b>Decision for Vali:</b> map roach s = spec size ÷ 1.9 (size read as body length), then × √(zoom ÷ close zoom) so wide shots don't drown in ink. Without the zoom factor this frame is a solid black mass.` });

/* ════════════════ S6 · Finale ════════════════ */
{
  const fin = meta.finale, d = ddmmyyyy(fin.date);
  const F = frame('S6', 'S6 · p 0.85', 'Finale: the date returns, Victory', `The only place “Victory” appears (Vali, 2026-11-12): the map stage ends at node 5 and its scrubber has no Victory marker. Dramatic stage (<code>.stage-dramatic</code>: black on paper, red on ink). <code>meta.finale.date</code> re-formed by the larger map roaches, brackets drawn, <code>finale.headline</code> in display type, then <code>finale.line</code> verbatim with its *. The first roaches peel away downward toward S7.`, { cls: 'stage-dramatic' });
  back(F, { bias: .05 });
  const box = { x: 170, y: 150, w: 1100, h: 290 };
  const sk = skeleton(d, { w: box.w, h: box.h, spacing: 8.5 });
  const c = ctxAbs(F); c.fillStyle = c.strokeStyle = ink(F); const r = rng(14);
  for (const s of sk.slots) {
    const x = s.x + box.x, y = s.y + box.y;
    if (r() < .06) { roach(c, x + (r() - .5) * 60, 690 + r() * 180, Math.PI / 2 + (r() - .5), 6.5, r() * TAU); continue; }
    roach(c, x, y, s.a + (r() < .5 ? Math.PI : 0), 6.5, r() * TAU);
  }
  const b = { x0: sk.box.x0 + box.x, y0: sk.box.y0 + box.y, x1: sk.box.x1 + box.x, y1: sk.box.y1 + box.y };
  brackets(c, b, 30, 46, tok('--fg', F));
  layer(F, `<div class="s6-victory t-display" style="top:${b.y1 + 60}px">${esc(fin.headline)}</div>
    <p class="s6-line" style="top:${b.y1 + 210}px">${esc(fin.line)}${star(fin.source_ids.join(', '))}</p>`);
}

/* ════════════════ S6.5 · October epilogue (text) ════════════════ */
{
  const E = epilogue;
  const F = frame('S6-5', 'S6.5 · reading', 'October epilogue', `Text only (D2): <code>framing</code>, the dated <code>bridge[]</code>, then <code>status_line</code>. A reading section, so it stays paper in the ink theme. The right column shows the disputed October figures side by side, as written in the data. No heading: the data has no title key (Vali may add one later).`, { cls: 'reading' });
  const disputed = E.facts.filter(f => showable(f) && f.status === 'disputed').slice(0, 3);
  layer(F, `<div class="epi"><div>
      <p class="kick t-micro">Epilogue</p>
      <p class="framing">${esc(E.framing.text)}${star(E.framing.attribution)}</p>
      <ol>${E.bridge.filter(showable).map(b => `<li><span class="t-micro t-num">${esc(fmtDate(b.date))}</span><span>${b.value_text ? `<span class="v t-num">${esc(b.value_text)}</span> · ` : ''}${esc(b.text)}${star(b.attribution)} <span class="st st-${b.status}" style="font-size:11px">${esc(b.attribution)}</span></span></li>`).join('')}</ol>
    </div><div>${disputed.map(f => `<div class="fact"><p class="fact-t" style="font-size:var(--fs-body)">${esc(f.text)}${star(f.attribution)}</p><p class="fact-a">${esc(f.attribution)} · <span class="st st-${f.status}">${esc(f.status)}</span></p></div>`).join('')}</div></div>
    <p class="epi-status">${esc(E.status_line.text)}${star(E.status_line.attribution)}</p>`);
}

/* ════════════════ S7 · Charts (chart A shown) ════════════════ */
{
  const [clips, profile] = await Promise.all([load('timeline_clips.json'), load('data_profile.json')]);
  const ist = iso => new Date(Date.parse(iso) + 5.5 * 36e5).toISOString().slice(0, 10);
  const byDay = new Map(); for (const k of clips.clips) { const d = ist(k.date); byDay.set(d, (byDay.get(d) || 0) + (k.views || 0)); }
  const d0 = Date.parse(ist(clips.meta.date_range.first)), d1 = Date.parse(ist(clips.meta.date_range.last));
  const series = []; for (let t = d0; t <= d1; t += 864e5) { const d = new Date(t).toISOString().slice(0, 10); series.push({ d, t, v: byDay.get(d) || 0 }); }
  const peak = series.reduce((a, b) => b.v > a.v ? b : a);
  const CW = 960, CH = 560, L = 64, R = 20, T = 40, B = 46;
  const X = t => L + (t - d0) / (d1 - d0) * (CW - L - R), vmax = Math.ceil(peak.v / 1e7) * 1e7, Y = v => CH - B - v / vmax * (CH - T - B);
  const F = frame('S7', 'S7 · chart A, p 0.75 (hold)', 'Charts: media engagement', `Chart A of three (D11, YouTube corpus): summed views by upload day (IST), fully drawn. Black line, red only for the peak. Story nodes as thin markers with <code>node.label</code>. Right: callouts computed from <code>data_profile.json</code> and the clips, each with a *. Kicker is the spec default for O3 (from Vali's sketch), not data. Reading section: paper in both themes. The corpus is machine-tagged and unreviewed; it stops at 21 Jul.`, { cls: 'reading' });
  const grid = Array.from({ length: vmax / 1e7 + 1 }, (_, i) => i * 1e7);
  const weekTicks = series.filter(p => new Date(p.t).getUTCDay() === 1);
  const nodes = timeline.nodes.filter(n => Date.parse(n.date) <= d1);
  layer(F, `<div class="s7"><p class="kick t-micro">Media engagement</p><h2>YouTube views, by upload day</h2><p class="count t-micro">1 / 3</p></div>
    <svg class="s7-chart" width="${CW}" height="${CH}" viewBox="0 0 ${CW} ${CH}">
      ${grid.map(v => `<line x1="${L}" x2="${CW - R}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--chart-grid)"/><text x="${L - 10}" y="${Y(v) + 4}" text-anchor="end">${v ? fmtNum(v) : '0'}</text>`).join('')}
      ${weekTicks.map(p => `<line x1="${X(p.t)}" x2="${X(p.t)}" y1="${CH - B}" y2="${CH - B + 6}" stroke="var(--chart-1)"/><text x="${X(p.t)}" y="${CH - B + 22}" text-anchor="middle">${esc(fmtDate(p.d))}</text>`).join('')}
      ${nodes.map((n, i) => { const x = X(Date.parse(n.date)), right = x > CW * .8, y = T + 4 + (right ? (i % 2) * 16 : 0); return `<line x1="${x}" x2="${x}" y1="${y + 4}" y2="${CH - B}" stroke="var(--chart-3)" stroke-dasharray="2 4"/><text x="${right ? x - 5 : x + 5}" y="${y}" text-anchor="${right ? 'end' : 'start'}" class="lbl" style="font-size:11px">${esc(n.label)}</text>`; }).join('')}
      <path d="M${series.map(p => `${X(p.t).toFixed(1)} ${Y(p.v).toFixed(1)}`).join('L')}L${X(d1)} ${Y(0)}L${X(d0)} ${Y(0)}Z" fill="var(--chart-1)" opacity=".06"/>
      <polyline points="${series.map(p => `${X(p.t).toFixed(1)},${Y(p.v).toFixed(1)}`).join(' ')}" fill="none" stroke="var(--chart-1)" stroke-width="2.5" stroke-linejoin="round"/>
      <line x1="${L}" x2="${CW - R}" y1="${Y(0)}" y2="${Y(0)}" stroke="var(--chart-1)" stroke-width="1.5"/>
      <circle cx="${X(peak.t)}" cy="${Y(peak.v)}" r="7" fill="var(--chart-hi)"/>
      <text x="${X(peak.t) - 12}" y="${Y(peak.v) + 5}" text-anchor="end" class="hi" paint-order="stroke" stroke="var(--bg)" stroke-width="5">${fmtNum(peak.v)}*</text>
      <text x="${X(peak.t) - 12}" y="${Y(peak.v) + 22}" text-anchor="end">${esc(fmtDate(peak.d))}</text>
      <text x="${L}" y="${CH - 4}" style="font-size:11px">Views at collection, summed by upload day</text>
    </svg>
    <div class="s7-side">
      <div class="fact"><div class="fact-v t-num">${fmtNum(profile.videos)}${star('YouTube public metadata')}</div><p class="fact-t">videos in the corpus</p><p class="fact-a">YouTube public metadata · collected ${esc(fmtDate(methodology.collection_dates.video_corpus.slice(0, 10)))}</p></div>
      <div class="fact"><div class="fact-v t-num">${fmtNum(profile.channels)}${star('YouTube public metadata')}</div><p class="fact-t">channels</p><p class="fact-a">YouTube public metadata</p></div>
      <div class="fact"><div class="fact-v t-num">${fmtNum(profile.views.median)}${star('YouTube public metadata')}</div><p class="fact-t">median views per video</p><p class="fact-a">YouTube public metadata</p></div>
    </div>
    <p class="s7-cap">${esc((methodology.videos.match(/Upload date is not the filming date\./) || [''])[0])} Corpus window ${esc(fmtDate(series[0].d))} – ${esc(fmtDate(series.at(-1).d))}.</p>`);
}

/* ════════════════ S8 · Quotes (Faiz shown) ════════════════ */
{
  const q = quotes.quotes.find(x => x.id === 'faiz-bol'), host = new URL(q.source_url).hostname.replace('www.', '');
  const n = quotes.quotes.filter(x => x.selected).length;
  const F = frame('S8', `S8 · quote 3 of ${n}, p 0.50`, 'Quotes on protest', `One quote per 100vh. Centred on the screen, no role label (Vali, 2026-11-12). Original script first (Noto Nastaliq Urdu, RTL), the English beneath, then author, work, translation credit and source. Year is omitted because <code>year</code> is not verified. A single roach idles on the attribution rule.`);
  back(F, { bias: -.08 });
  const L = layer(F, `<div class="s8">
    <blockquote class="ur" lang="ur" dir="rtl">${esc(q.original_text).replace(/\n/g, '<br>')}</blockquote>
    <blockquote class="en">“${esc(q.text)}”</blockquote>
    <div class="attr"><b>${esc(q.author)}</b><span>${esc(q.work)}</span><small>Translation: unattributed, ${esc(host)} · Source: <a href="${esc(q.source_url)}">${esc(host)}</a></small></div></div>`);
  const a = L.querySelector('.attr'), fr = F.getBoundingClientRect(), ar = a.getBoundingClientRect(), z = fr.width / W;
  const c = ctxAbs(F); c.fillStyle = c.strokeStyle = ink(F); roach(c, (ar.left - fr.left) / z + ar.width / z / 2 + 150, (ar.top - fr.top) / z - 7, Math.PI, 8, 2);
}

/* ════════════════ S9 · CTA ════════════════ */
{
  const hs = meta.handles.filter(h => h.show);
  const F = frame('S9', 'S9 · in view', 'Follow and share', `Not pinned. One solid button per <code>meta.handles[show]</code>, a row of share actions (copy link is the red primary). No headline: the data has none (Vali may add one later). Roaches wander only in the margins, never over the buttons.`);
  back(F, { bias: -.08 });
  const c = ctxAbs(F); swarm(c, W, H, { seed: 8, count: 70, size: 5, color: ink(F), avoid: (x, y) => x > 120 && x < 1320 && y > 100 && y < 780 });
  layer(F, `<div class="s9"><p class="kick t-micro">Follow</p>
    <div class="handles">${hs.map(h => `<a class="btn-h" href="${esc(h.url)}"><img src="${roachURL(tok('--bg', F), 10, 64, 38)}" alt=""><span><span class="p">${esc(h.platform)}</span><br><span class="h">${esc(h.handle)}</span></span><span class="arrow">↗</span></a>`).join('')}</div>
    <div class="share"><span class="t-micro">Share this visualisation</span><button class="btn-s primary">Copy link</button><button class="btn-s">Share…</button><button class="btn-s">X</button><button class="btn-s">WhatsApp</button><button class="btn-s">LinkedIn</button></div></div>`);
}

/* ════════════════ S10 · Footer ════════════════ */
{
  const F = frame('S10', 'S10 · top of footer', 'Credit, methodology, disclaimer', `Three underlined headings, then the numbered sources (${sources.sources.length}; the frame shows the first rows). All text verbatim from <code>meta.designer_credit</code>, <code>methodology.*</code> and <code>methodology.disclaimer</code>. Reading section: paper in both themes.`, { cls: 'reading' });
  const people = [...new Map(timeline.nodes.flatMap(n => n.people).filter(p => p.image).map(p => [p.name, p])).values()];
  const M = methodology;
  layer(F, `<div class="s10"><div class="cols">
      <div><h4>Credit</h4><p><b>${esc(meta.designer_credit)}</b></p>
        <ul>${people.map(p => `<li class="credit-small">${esc(p.name)}: ${esc(p.image.credit)}</li>`).join('')}</ul></div>
      <div><h4>Methodology</h4>
        <table class="tiers">${M.crowd_tiers.tiers.map(t => `<tr><td>Tier ${t.tier} · ${esc(t.label)}</td><td class="t-num">${t.roaches} roaches</td></tr>`).join('')}</table>
        <p>${esc(M.roach_size)}</p><p>${esc(M.founder_roach)}</p><p>${esc(M.asterisk)}</p></div>
      <div><h4>Disclaimer</h4>${M.disclaimer.paragraphs.slice(0, 5).map(p => `<p>${esc(p)}</p>`).join('')}</div></div>
    <div class="src"><h4>Sources</h4><ol>${sources.sources.slice(0, 24).map((s, i) => `<li id="src-${i + 1}"><b class="t-num">[${i + 1}]</b>${esc(s.publisher)}${s.title ? ', ' + esc(s.title) : ''}</li>`).join('')}</ol></div></div>`);
}

/* ── nav, scale ── */
document.getElementById('nav').innerHTML = frames.map(f => `<a href="#f-${f.id}">${f.code.split(' · ')[0]}${/S4|S5|S3-5/.test(f.id) ? ' ' + f.id.split('-').at(-1) : ''}</a>`).join('');
const fit = () => { const w = document.getElementById('frames').clientWidth; document.documentElement.style.setProperty('--fz', Q.get('fz') ?? Math.min(1, w / W).toFixed(4)); };
fit(); addEventListener('resize', fit);
document.body.dataset.ready = '1';

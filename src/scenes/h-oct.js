// OCT · October: "Count them one by one." (hybrid build, 2026-11-13). Brief: docs/build/hybrid/BUILD_BRIEF.md.
// Gate 0 targets: qa/hybrid/gate0/07-october-*, 07c-october-dawn-*, 07b-october-cell-*. Prototype: design/hybrid/frames.js.
//
// p map (500 vh, its own pinned block):
//   0.000–0.120  title card (chapter.js), then the lockup for the rest
//   0.120–0.270  2 Oct, Delhi: a ruled holding pen draws in; roaches walk in one by one through its gate (fill from the
//                far wall). The police counts are reached in order: about 150 → more than 700 → nearly 1,000 (each with
//                its star and claimant, shown when that roach arrives). Caption 0
//   0.270–0.450  10 Oct, one day: the 24-hour strip draws in (anime drawable); a clock hand sweeps 00:00 → 04:00.
//                Rathee (hatched 6–8 am band) at 6 am; the plane (Dipke, Das, Ranka) at 10.30 am; "About 3 am · Rathee
//                released" at 3 am. Portraits stagger in; photo credits at the bottom. Caption 1
//   0.450–0.700  10 Oct, Delhi, the field: 15,000 roaches (one per person, canvas) fill column by column from the left.
//                Each published count is a red line that draws in when the fill reaches it, with its label. The loupe
//                appears once the fill passes 2,000. Caption 2
//   (Mumbai beat removed, Vali 2026-11-13)
//   0.720–0.890  the cell: two roaches walk in, the bars close behind them, names under it; the tally ticks 1 → 7. Caption 3.
//                The cell then fades out completely (0.865–0.890)
//   0.895–1.000  the Amnesty quote (caption 4) on its own: centred, no card, nothing behind it (Vali 2026-11-13)
// Purity: one paused anime.js timeline per layout (1000 ms = p 0 → 1) for every DOM/SVG entrance and the tweened state
// (clock hand, Mumbai fill, cell walk, days). Roach poses and beat fades are plain functions of p. tick() only moves the
// two cell roaches' legs (idle) and never changes what p decides. Hover on a count line or label: a tip (claimant, date).
import { createTimeline, utils, stagger, svg as asvg } from 'animejs';
import { tok, fitCanvas, dpr } from '../lib/dom.js';
import { halftone } from '../lib/halftone.js';
import { esc } from '../lib/text.js';
import { star } from '../lib/star.js';
import { fmtDate } from '../lib/dates.js';
import { createChapter } from '../lib/chapter.js';
import { roach } from '../roach/roach.js';
import { hash01, clamp01, lerp, ease } from '../roach/swarm.js';
import { loadCss } from './s00-hero.js';

const CSS = new URL('./h-oct.css', import.meta.url).href;
const ROOT = new URL('../../', import.meta.url);
const NS = 'http://www.w3.org/2000/svg';
const TAU = Math.PI * 2;

// ── the p map ──
const P = {
  title: [0, .04, .09, .12],
  pen: [.12, .262], penDraw: .12,
  // launch schedule (p, roaches launched): holds let the walkers land before each count is shown
  launch: [[.138, 0], [.160, 150], [.172, 150], [.198, 700], [.208, 700], [.228, 1000]], walk: .012,
  dawn: [.272, .44], strip: .272, hand: [.29, .41],
  field: [.45, .712], fillA: .462, fillB: .65, lines: [.45, .70], fillPow: 1.6,
  cell: [.72, 1], frame: .725, walkC: [.727, .77], bars: .77, names: .785, tally: [.795, .84], dim: [.865, .89],
};
const CAPS = [[0, .13, .25], [1, .282, .42], [2, .47, .68], [3, .73, .855], [4, .895, 1.5]];
const win = (p, a, b, f = .012) => clamp01((p - a) / f) * (1 - clamp01((p - b) / f));
const ms = p => p * 1000;

// counts on screen (ids in data/story/october_counts.json). Short claimant labels as signed off at Gate 0; the tip shows
// the data's full claimant.
const PEN = [['oc_1002_delhi_150'], ['oc_1002_delhi_700'], ['oc_1002_delhi_1000']];
const FIELD = [
  ['oc_1010_delhi_200_reuters', 'lo', 'police source (Reuters)'],
  ['oc_1010_delhi_500', 'lo', 'Delhi Police'],
  ['oc_1010_delhi_1000', 'lo', 'Delhi Police sources'],
  ['oc_1010_delhi_2000_mha', 'hi', 'MHA official (Reuters)'],
  ['oc_1010_delhi_2500_hindu', 'lo', 'Delhi Police sources (The Hindu)'],
  ['oc_1010_delhi_3000_pti', 'lo', 'Delhi Police (PTI)'],
  ['oc_1010_delhi_7000_pti', 'hi', 'Delhi Police (PTI)'],
  ['oc_1010_delhi_cjp_15000', 'hi', 'CJP'],
];
const FACES = ['dhruv-rathee', 'abhijeet-dipke', 'saurav-das', 'ashutosh-ranka'];

export default def => {
  let ctx, data, W = 0, H = 0, p = 0, L = null, tl = null, chapter, S = {}, col = {}, built = false;
  let back, cv, g, svg, layer, tip, field = null;          // field: the pre-rendered 15,000 (built on first need)
  let OC, DET, credits = {}, missing = [];
  const src = () => data.byId.source;

  const scene = {
    id: def.id,
    async init(c) {
      ctx = c; data = c.data; loadCss(CSS);
      OC = data.extra?.october_counts; DET = data.extra?.detentions;
      // portrait credits: detentions.json people[].image first, then the media/people ledger
      try {
        const ledger = await fetch(new URL('media/people/sources.json', ROOT)).then(r => r.json());
        for (const e of ledger) credits[e.local_file] = e.credit_line;
      } catch { /* credits fall back to [MISSING] */ }
      c.root.classList.add('oct');
      c.root.innerHTML = `<canvas class="oct-back" aria-hidden="true"></canvas><canvas class="oct-cv" aria-hidden="true"></canvas>
        <div class="oct-layer"></div><div class="oct-tip" role="tooltip" hidden></div>`;
      back = c.root.querySelector('.oct-back'); cv = c.root.querySelector('.oct-cv');
      layer = c.root.querySelector('.oct-layer'); tip = c.root.querySelector('.oct-tip');
      chapter = createChapter(c.root, 'october', data, { title: P.title, caps: CAPS, capClass: 'oct-cap' });
    },
    resize(w, h) {
      W = w; H = h;
      const gb = fitCanvas(back, w, h);
      halftone(gb, w, h, { seed: 11, cell: 7, ink: tok('--ht-ink') });
      g = fitCanvas(cv, w, h);
      col = { roach: tok('--roach'), grey: tok('--grey-1-ink'), dark: tok('--grey-2-ink'), red: tok('--red'), fg: tok('--fg'), bg: tok('--bg'), rule: tok('--grey-2-ink') };
      L = layout(w, h); field = null;
      build();
      chapter.resize(w);
      placeCaps();
      if (built) render();
    },
    enter() {},
    exit() { hover(null); },
    update(q) {
      p = q;
      if (!L) scene.resize(ctx.viewport.w, ctx.viewport.h);
      render();
    },
    tick() { if (!ctx.clock.still && p > P.walkC[1] && p < 1) drawCanvas(); },   // idle legs in the cell only
  };

  /* ── data helpers ── */
  function count(id) {
    const c = OC?.counts?.find(x => x.id === id);
    if (!c && !missing.includes(id)) { missing.push(id); console.warn(`[OCT] missing count ${id}`); }
    return c;
  }
  const miss = k => `<span class="missing">[MISSING: ${esc(k)}]</span>`;
  const valHTML = (c, id) => c ? `${esc(c.value_text)}${star(c.source_ids, src(), c.attribution)}` : miss(id);
  const person = id => DET?.people?.find(x => x.id === id);
  function face(id) {
    const pp = person(id), file = pp?.image?.src || ({ 'abhijeet-dipke': 'media/people/abhijeet-dipke.jpg', 'saurav-das': 'media/people/saurav-das.png', 'ashutosh-ranka': 'media/people/Ashutosh_Ranka.png' })[id];
    const credit = pp?.image?.credit || credits[file];
    return { name: pp?.name, file, credit };
  }

  /* ── layout (per viewport) ── */
  function layout(w, h) {
    const k = Math.min(w / 1440, h / 900);
    const X0 = Math.round(120 * k), XR = Math.round(w - 24 - 360 - 48 * k);
    const Y0 = Math.round(210 * k), Y1 = Math.round(h - 190 * k);
    const fw = XR - X0, fh = Y1 - Y0;
    // the pen: 1,000 legible roaches in the field's box (inner pad), filled from the far wall back to the gate
    const pad = Math.round(14 * k), PN = count(PEN[2][0])?.value || 0;
    const pRows = Math.max(1, Math.round(Math.sqrt(PN * (fh - 2 * pad) / (fw - 2 * pad)))), pCols = Math.ceil(PN / pRows || 1);
    const ppx = (fw - 2 * pad) / pCols, ppy = (fh - 2 * pad) / pRows;
    const gy = Math.round(Y0 + fh * .5), gh = Math.round(24 * k);
    // the field: 15,000 roaches, column-major from the left
    const N = count(FIELD[7][0])?.value || 0;
    const rows = Math.max(1, Math.round(Math.sqrt(N * fh / fw))), cols = Math.ceil(N / rows || 1), pitch = fw / cols, py = fh / rows;
    const xOf = n => X0 + Math.floor(n / rows) * pitch;
    // the day strip
    const Y = Math.round(h * .66), hx = t => X0 + fw * t / 28;
    // the cell
    const cx = Math.round((X0 + XR) / 2), cy = Math.round(h * .53), cw = Math.round(420 * k), ch = Math.round(300 * k);
    return { k, X0, XR, Y0, Y1, fw, fh, pad, PN, pRows, pCols, ppx, ppy, gy, gh, N, rows, cols, pitch, py, xOf, Y, hx, cx, cy, cw, ch,
      sh: .6, faceS: Math.round(88 * Math.max(.9, k)) };
  }

  // pen: p at which roach i starts walking (inverse of the launch schedule)
  function launchP(i) {
    const s = P.launch;
    for (let j = 1; j < s.length; j++) {
      const [p0, c0] = s[j - 1], [p1, c1] = s[j];
      if (c1 > c0 && i >= c0 && i < c1) return p0 + (i - c0) / (c1 - c0) * (p1 - p0);
    }
    return s.at(-1)[0];
  }
  const arriveP = v => launchP(v - 1) + P.walk;              // the v-th roach lands
  const fillN = q => L.N * clamp01((q - P.fillA) / (P.fillB - P.fillA)) ** P.fillPow;
  const fillP = v => P.fillA + (P.fillB - P.fillA) * (v / L.N) ** (1 / P.fillPow);

  /* ── DOM + SVG + timeline (rebuilt per layout) ── */
  function build() {
    const { k, X0, XR, Y0, Y1, fw, fh, gy, gh, hx, Y, cx, cy, cw, ch } = L;
    const R = n => Math.round(n);
    // pen outline: from the gate's top, round the box, back to the gate's bottom (the gate is a gap in the left wall)
    const penD = `M${X0},${gy - gh}V${Y0}H${XR}V${Y1}H${X0}V${gy + gh}`;
    // strip ticks
    const ticks = Array.from({ length: 29 }, (_, t) => `<line class="oct-tick" x1="${hx(t)}" x2="${hx(t)}" y1="${Y - (t % 6 ? 4 : 9)}" y2="${Y + (t % 6 ? 4 : 9)}"/>`).join('');
    // field lines + leaders
    const lo = FIELD.filter(f => f[1] === 'lo');
    const loTop = Y1 + R(16 * k), loX = X0 + R(300 * k), loStep = 17;
    const fLines = FIELD.map(([id, lvl], j) => {
      const c = count(id); if (!c) return '';
      const x = R(L.xOf(c.value)) + .5, y0 = lvl === 'hi' ? Y0 - R(34 * k) : Y0 - 8, y1 = Y1 + (lvl === 'lo' ? R(4 * k) : 4);
      let s = `<line class="oct-cl" data-k="${j}" x1="${x}" x2="${x}" y1="${y0}" y2="${y1}"/><line class="oct-hit" data-k="${j}" x1="${x}" x2="${x}" y1="${y0}" y2="${y1}"/>`;
      if (lvl === 'lo') { const ly = loTop + lo.indexOf(FIELD[j]) * loStep + 7; s += `<path class="oct-lead" data-k="${j}" d="M${x},${Y1 + 4}V${ly}H${loX}"/>`; }
      return s;
    }).join('');
    // cell: the frame opens on the left (the roaches walk in), then the left wall and 11 bars close it
    const cl = cx - cw / 2, ct = cy - ch / 2;
    const frameD = `M${cl},${ct}H${cl + cw}V${ct + ch}H${cl}`;
    const bars = Array.from({ length: 12 }, (_, i) => { const x = R(cl + i * cw / 12); return `<line class="oct-bar${i ? '' : ' wall'}" x1="${x}" x2="${x}" y1="${ct}" y2="${ct + ch}"/>`; }).join('');
    const tallyX = cl, tallyY = ct - R(96 * k);
    // the tally: a five-bar gate, then two (one stroke per day, drawn as the count ticks); its own small SVG in the row
    const tally = `<svg class="oct-tally" width="104" height="${R(48 * k)}" viewBox="0 0 104 48" aria-hidden="true">${Array.from({ length: 7 }, (_, j) => j === 4
      ? '<line class="oct-tal" x1="2" y1="40" x2="52" y2="8"/>'
      : `<line class="oct-tal" x1="${j < 4 ? 8 + j * 12 : 74 + (j - 5) * 12}" x2="${j < 4 ? 8 + j * 12 : 74 + (j - 5) * 12}" y1="4" y2="44"/>`).join('')}</svg>`;

    svg = `<svg class="oct-svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true">
      <defs><pattern id="oct-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(-50)"><line x1="0" y1="0" x2="0" y2="6" stroke="${col.red}" stroke-width="2.4"/></pattern></defs>
      <g class="oct-g-pen"><path class="oct-pen" d="${penD}"/>
        <path class="oct-gate" d="M${X0 - 10},${gy - gh}H${X0}M${X0 - 10},${gy + gh}H${X0}"/></g>
      <g class="oct-g-dawn">
        <line class="oct-axis" x1="${hx(0)}" x2="${hx(28)}" y1="${Y}" y2="${Y}"/>${ticks}
        <rect class="oct-band" x="${hx(6)}" y="${Y - 10}" width="0" height="20" fill="url(#oct-hatch)"/>
        <rect class="oct-band-o" x="${hx(6)}" y="${Y - 10}" width="0" height="20"/>
        <line class="oct-held" x1="${hx(8)}" x2="${hx(8)}" y1="${Y}" y2="${Y}"/>
        <line class="oct-pin oct-pin-r" x1="${R(hx(7)) + .5}" x2="${R(hx(7)) + .5}" y1="${Y - R(120 * k) + 10}" y2="${Y - 14}"/>
        <line class="oct-pin oct-pin-p" x1="${R(hx(10.5)) + .5}" x2="${R(hx(10.5)) + .5}" y1="${Y - R(120 * k) + 10}" y2="${Y - 12}"/>
        <circle class="oct-plane" cx="${hx(10.5)}" cy="${Y}" r="7"/>
        <circle class="oct-rel" cx="${hx(27)}" cy="${Y}" r="6"/>
        <g class="oct-hand"><line x1="0" x2="0" y1="${Y - 16}" y2="${Y + 26}"/><circle class="face" cx="-12" cy="${Y + 38}" r="8"/><line class="hh" x1="-12" y1="${Y + 38}" x2="-12" y2="${Y + 32}"/></g>
      </g>
      <g class="oct-g-field">${fLines}</g>
      <g class="oct-g-cell"><path class="oct-frame" d="${frameD}"/>${bars}</g>
    </svg>`;

    // ── HTML ──
    const penStops = PEN.map(([id], j) => { const c = count(id); return `<div class="oct-stop" data-j="${j}"><b>${valHTML(c, id)}</b><span>${c ? esc(c.claimant) : ''}</span></div>`; }).join('');
    const hours = [[0, '00:00'], [6, '06:00'], [12, 'Noon'], [18, '18:00'], [24, 'Midnight'], [28, '04:00']]
      .map(([t, l]) => `<div class="oct-hr" style="left:${R(hx(t)) - 40}px;top:${Y + 14}px">${l}</div>`).join('');
    const fig = id => { const f = face(id); return `<figure class="oct-face" style="width:${L.faceS}px"><img src="${f.file ? new URL(f.file, ROOT).href : ''}" alt="" style="width:${L.faceS}px;height:${L.faceS}px"><figcaption>${f.name ? esc(f.name) : miss(`detentions.people.${id}`)}</figcaption></figure>`; };
    const credLine = FACES.map(id => { const f = face(id); return `${f.name ? esc(f.name) : miss(id)}: ${f.credit ? esc(f.credit) : miss(`credit ${id}`)}`; }).join(' · ');
    const fs = Math.max(24, R(30 * k)), blockB = H - (Y - R(120 * k));
    const rathee = person('dhruv-rathee')?.events?.find(e => e.id === 'rathee-2026-10-10-detention');
    const fLabels = FIELD.map(([id, lvl, who], j) => {
      const c = count(id); if (!c) return `<div class="oct-fl lo" style="left:${loX + 6}px;top:${loTop + j * loStep}px">${miss(id)}</div>`;
      const x = R(L.xOf(c.value));
      if (lvl === 'hi') {
        const right = x + 160 > XR + 40;
        return `<div class="oct-fl hi${right ? ' r' : ''}" data-k="${j}" style="${right ? `right:${W - x - 4}px` : `left:${x - 4}px`};top:${Y0 - R(78 * k)}px"><b>${valHTML(c, id)}</b><br><span>${esc(who)}</span></div>`;
      }
      return `<div class="oct-fl lo" data-k="${j}" style="left:${loX + 6}px;top:${loTop + lo.indexOf(FIELD[j]) * loStep}px"><b>${valHTML(c, id)}</b> <span>${esc(who)}</span></div>`;
    }).join('');
    const people = OC?.people || [];
    const days = people[0]?.days;
    const nameOf = j => people[j]?.name ? esc(people[j].name) : miss(`october_counts.people[${j}].name`);
    const lz = { x: R(L.xOf(2000) + 70 * k), y: R(Y0 + 170 * k), r: R(78 * k) };
    L.loupe = { ...lz, z: 3.2, sx: L.xOf(2000) - 4, sy: Y0 + 60 * k };
    L.loupeN = Math.max(2000, Math.ceil((lz.x + lz.r - X0) / L.pitch) * L.rows);   // the loupe waits for the fill to pass under it

    layer.innerHTML = `${svg}
      <div class="oct-pen-ui">
        <div class="oct-stops" style="left:${X0}px;top:${Y0 - R(80 * k)}px;width:${fw}px">${penStops}</div>
        <p class="oct-note oct-pnote" style="left:${X0}px;top:${Y1 + R(14 * k)}px">2 Oct, Delhi: police counts as the day went on. One roach = one person, walked into the pen one at a time.</p>
      </div>
      <div class="oct-dawn-ui">
        ${hours}
        <div class="oct-clock" style="top:${Y + 32}px">00:00</div>
        <p class="hy-kick oct-dk" style="left:${X0}px;top:${Y + 62}px">Saturday 10 October · Delhi and Gurugram</p>
        <div class="oct-blk oct-blk-r" style="right:${W - R(hx(7)) - 12}px;bottom:${blockB}px">
          <div class="oct-in oct-faces r">${fig('dhruv-rathee')}</div>
          <div class="oct-in oct-t" style="font-size:${fs}px">6–8 am${rathee ? star(['det_oneindia_rathee_release_1011', 'det_outlook_rathee_1010'], src(), 'reported; times differ') : miss('rathee-2026-10-10-detention')}</div>
          <div class="oct-in oct-d">Taken from his family home, Gurugram. Reported times differ.</div>
        </div>
        <div class="oct-blk oct-blk-p" style="left:${R(hx(10.5)) - 12}px;bottom:${blockB}px">
          <div class="oct-faces">${fig('abhijeet-dipke')}${fig('saurav-das')}${fig('ashutosh-ranka')}</div>
          <div class="oct-in oct-t" style="font-size:${fs}px">About 10.30 am${star(['det_oneindia_lockdown_1010', 'oct_aj_1010'], src(), 'reported')}</div>
          <div class="oct-in oct-d">Detained inside the plane, minutes after it landed from Mumbai.</div>
        </div>
        <div class="oct-relL" style="left:${R(hx(27)) - 160}px;top:${Y - 74}px"><b>About 3 am, 11 Oct</b>${star(['det_oneindia_rathee_release_1011'], src(), 'police said')}<br>Rathee released</div>
        <p class="oct-cred" style="left:${X0}px;width:${fw}px">Photos: ${credLine}</p>
      </div>
      <div class="oct-field-ui">
        ${fLabels}
        <div class="oct-loupeL" style="left:${lz.x + lz.r + 8}px;top:${lz.y - 9}px">One roach, one person</div>
        <p class="oct-note oct-fnote" style="left:${X0}px;top:${loTop + lo.length * loStep + 10}px">10 Oct, Delhi. One roach = one person. White: up to the MHA official’s count · grey: up to the highest reported police count (PTI) · dark: the CJP’s count</p>
      </div>
      <div class="oct-cell-ui">
        <div class="oct-days" style="left:${tallyX}px;top:${tallyY}px"><span class="n" style="font-size:${R(64 * k)}px">1</span><span class="hy-kick">days in judicial custody${days ? star(people[0].source_ids, src(), 'reported') : miss('october_counts.people[0].days')}<br>14 – 21 Oct</span>${tally}</div>
        <div class="oct-names" style="left:${cl}px;top:${ct + ch + 14}px;width:${cw}px"><span>${nameOf(0)}</span><span>${nameOf(1)}</span></div>
      </div>`;
    L.days = days || 0;

    // ── timeline ──
    tl?.pause?.();
    tl = createTimeline({ autoplay: false, defaults: { ease: 'outQuart', duration: 10 } });
    tl.add({ duration: 1000 }, 0);
    const $ = s => layer.querySelector(s), $$ = s => [...layer.querySelectorAll(s)];
    const set = (t, from, to, pos, prm = {}) => { utils.set(t, from); const pr = {}; for (const kk in to) pr[kk] = [from[kk], to[kk]]; tl.add(t, { ...pr, ...prm }, pos); };
    const rise = (t, pos, prm = {}, dy = 12) => set(t, { opacity: 0, translateY: dy }, { opacity: 1, translateY: 0 }, pos, prm);
    const draw = (el, pos, prm = {}) => { const d = asvg.createDrawable(el); utils.set(d, { draw: '0 0' }); tl.add(d, { draw: ['0 0', '0 1'], ...prm }, pos); };
    S = { hand: 0, mum: 0, walk: 0, days: 1, shrink: 0 };

    // pen
    draw($('.oct-pen'), ms(P.penDraw), { duration: 20, ease: 'inOutQuad' });
    set($('.oct-gate'), { opacity: 0 }, { opacity: 1 }, ms(P.penDraw + .016), { duration: 6 });
    rise($('.oct-pnote'), ms(P.penDraw + .01), { duration: 10 });
    $$('.oct-stop').forEach((el, j) => { const v = count(PEN[j][0])?.value; rise(el, ms(v ? arriveP(v) : P.pen[1]), { duration: 8 }, 14); });
    // dawn
    draw($('.oct-axis'), ms(P.strip), { duration: 18, ease: 'inOutQuad' });
    set($$('.oct-tick'), { opacity: 0 }, { opacity: 1 }, ms(P.strip), { duration: 4, delay: stagger(.5) });
    rise($$('.oct-hr'), ms(P.strip + .008), { duration: 8 }, 6);
    rise($('.oct-dk'), ms(P.strip + .012), { duration: 8 });
    tl.add(S, { hand: [0, 28], ease: 'linear', duration: ms(P.hand[1] - P.hand[0]) }, ms(P.hand[0]));
    const hp = hrs => ms(P.hand[0] + (P.hand[1] - P.hand[0]) * hrs / 28);
    set($('.oct-clock'), { opacity: 0 }, { opacity: 1 }, ms(P.hand[0] - .004), { duration: 4 });
    $$('.oct-blk-r .oct-in').forEach((el, i) => rise(el, hp(6) + i * 2.4, { duration: 8 }, 16));
    draw($('.oct-pin-r'), hp(6.4), { duration: 5 });
    set($('.oct-plane'), { opacity: 0 }, { opacity: 1 }, hp(10.5), { duration: 3 });
    $$('.oct-blk-p .oct-face').forEach((el, i) => rise(el, hp(10.5) + i * 2.2, { duration: 8 }, 18));
    $$('.oct-blk-p .oct-in').forEach((el, i) => rise(el, hp(10.5) + 6 + i * 2.4, { duration: 8 }, 16));
    draw($('.oct-pin-p'), hp(10.8), { duration: 5 });
    set($('.oct-cred'), { opacity: 0 }, { opacity: 1 }, hp(11), { duration: 10 });
    set($('.oct-rel'), { opacity: 0 }, { opacity: 1 }, hp(27), { duration: 3 });
    rise($('.oct-relL'), hp(27), { duration: 6 }, 8);
    // field
    FIELD.forEach(([id], j) => {
      const c = count(id); if (!c) return;
      const at = ms(fillP(c.value));
      for (const el of $$(`.oct-cl[data-k="${j}"]`)) draw(el, at, { duration: 8, ease: 'inOutQuad' });
      for (const el of $$(`.oct-lead[data-k="${j}"]`)) draw(el, at + 3, { duration: 8 });
      for (const el of $$(`.oct-fl[data-k="${j}"]`)) rise(el, at + 2, { duration: 7 }, 8);
    });
    set($('.oct-loupeL'), { opacity: 0 }, { opacity: 1 }, ms(fillP(Math.min(L.N, L.loupeN + 600))), { duration: 8 });
    rise($('.oct-fnote'), ms(P.fillA), { duration: 10 });
    // Mumbai
    // cell
    draw($('.oct-frame'), ms(P.frame), { duration: 14, ease: 'inOutQuad' });
    tl.add(S, { walk: [0, 1], ease: 'linear', duration: ms(P.walkC[1] - P.walkC[0]) }, ms(P.walkC[0]));
    $$('.oct-bar').forEach((el, i) => draw(el, ms(P.bars) + i * 1.2, { duration: 6, ease: 'inOutQuad' }));
    rise($('.oct-names'), ms(P.names), { duration: 8 });
    rise($('.oct-days'), ms(P.tally[0] - .004), { duration: 6 });
    const dDays = ms(P.tally[1] - P.tally[0]), nD = Math.max(1, L.days);
    tl.add(S, { days: [1, nD + .999], ease: 'linear', duration: dDays }, ms(P.tally[0]));
    $$('.oct-tal').forEach((el, j) => draw(el, ms(P.tally[0]) + (j < nD ? j * dDays / nD : dDays), { duration: 3, ease: 'linear' }));

    // groups and hover
    L.el = {
      gPen: $('.oct-g-pen'), gDawn: $('.oct-g-dawn'), gField: $('.oct-g-field'), gCell: $('.oct-g-cell'),
      pen: $('.oct-pen-ui'), dawn: $('.oct-dawn-ui'), field: $('.oct-field-ui'), cell: $('.oct-cell-ui'),
      band: $('.oct-band'), bandO: $('.oct-band-o'), held: $('.oct-held'), hand: $('.oct-hand'), hh: $('.oct-hand .hh'),
      clock: $('.oct-clock'), daysN: $('.oct-days .n'), stops: $$('.oct-stop'),
    };
    for (const el of $$('.oct-hit, .oct-fl[data-k]')) {
      el.addEventListener('pointerenter', () => hover(+el.dataset.k, el));
      el.addEventListener('pointerleave', () => hover(null));
    }
    built = true;
  }

  function placeCaps() {
    const caps = chapter.el.caps, { k, Y0, Y, cy, ch } = L;
    const top = [Y0, Math.round(Y - 330 * k), Y0, Math.round(cy - ch / 2)];
    caps.forEach((c, i) => { if (i < 4) c.style.top = top[i] + 'px'; });
    // the quote: centred on the grid, 8 of 12 columns, vertically centred (CSS translate)
    const q = caps[4]; if (q) { const m = Math.min(160, Math.max(96, W / 12)), col = (W - 2 * m - 11 * 24) / 12, qw = Math.round(8 * col + 7 * 24); q.style.width = qw + 'px'; q.style.left = Math.round((W - qw) / 2) + 'px'; q.style.top = '50%'; }
  }

  /* ── hover: highlight a count's line and label; tip with claimant + date (time-based UI, never p) ── */
  function hover(j, el) {
    if (!L?.el) return;
    L.el.field.classList.toggle('has-hi', j != null); L.el.gField.classList.toggle('has-hi', j != null);
    for (const n of layer.querySelectorAll('[data-k]')) n.classList.toggle('is-hi', j != null && +n.dataset.k === j);
    if (j == null) { tip.hidden = true; return; }
    const c = count(FIELD[j][0]); if (!c) return;
    tip.innerHTML = `<b>${esc(c.value_text)}</b> ${esc(c.unit || '')}<br><span>${esc(c.claimant)}</span><br><span class="m">${esc(fmtDate(c.date))} · ${esc(c.attribution || '')} · ${esc(c.status || '')}</span>`;
    tip.hidden = false;
    const r = el.getBoundingClientRect(), rr = ctx.root.getBoundingClientRect(), lbl = el.classList.contains('oct-fl');
    let x = (lbl ? r.left : r.left + 10) - rr.left, y = (lbl ? r.bottom + 8 : Math.min(r.bottom - 120, L.Y0 + 40)) - rr.top;
    x = Math.min(x, L.XR - 280); tip.style.left = Math.max(8, x) + 'px'; tip.style.top = y + 'px';
  }

  /* ── one frame ── */
  function render() {
    if (!built) return;
    tl.seek(ms(p));
    chapter.update(p);
    const E = L.el;
    // beat groups (plain functions of p)
    const aPen = win(p, P.pen[0], P.pen[1]), aDawn = win(p, P.dawn[0], P.dawn[1]), aLines = win(p, P.lines[0], P.lines[1]);
    const aCell = cellA(p);
    vis(E.gPen, aPen); vis(E.pen, aPen); vis(E.gDawn, aDawn); vis(E.dawn, aDawn);
    vis(E.gField, aLines); vis(E.field, aLines); vis(E.gCell, aCell); vis(E.cell, aCell);
    if (aLines < .5) hover(null);
    // pen stops: the latest reached is bright, earlier ones step back
    let last = -1; PEN.forEach(([id], j) => { const v = count(id)?.value; if (v && p >= arriveP(v)) last = j; });
    E.stops.forEach((el, j) => el.classList.toggle('past', j < last));
    // dawn: band, held line, hand, clock
    const h = S.hand, x = L.hx(h);
    E.band.setAttribute('width', Math.max(0, L.hx(Math.min(8, Math.max(6, h))) - L.hx(6)).toFixed(1));
    E.bandO.setAttribute('width', E.band.getAttribute('width')); E.bandO.style.opacity = h > 6 ? 1 : 0;
    E.held.setAttribute('x2', L.hx(Math.min(27, Math.max(8, h))).toFixed(1));
    E.hand.setAttribute('transform', `translate(${x.toFixed(1)},0)`); E.hand.style.opacity = p >= P.hand[0] - .004 ? 1 : 0;
    E.hh.setAttribute('transform', `rotate(${((h % 12) / 12 * 360).toFixed(1)} -12 ${L.Y + 38})`);
    const hm = Math.floor(h % 24), mm = Math.floor((h % 1) * 60 / 10) * 10;
    E.clock.textContent = `${String(hm).padStart(2, '0')}:${String(mm).padStart(2, '0')}`; E.clock.style.left = (x + 2).toFixed(1) + 'px';
    // cell tally
    E.daysN.textContent = String(Math.min(L.days || 1, Math.floor(S.days)));
    drawCanvas(aPen, aCell);
  }
  // the cell fades out completely before the quote: the quote stands alone (Vali 2026-11-13)
  const cellA = q => win(q, P.cell[0], 2) * (1 - clamp01((q - P.dim[0]) / (P.dim[1] - P.dim[0])));
  const vis = (el, a) => { el.style.opacity = a.toFixed(3); el.style.visibility = a > .001 ? '' : 'hidden'; };

  /* ── canvas: pen roaches, the field, the loupe, Mumbai, the cell ── */
  function drawCanvas(aPen = win(p, P.pen[0], P.pen[1]), aCell = null) {
    if (aCell == null) aCell = cellA(p);
    g.clearRect(0, 0, W, H);
    if (aPen > 0) drawPen(aPen);
    const aField = win(p, P.field[0], P.field[1]);
    if (aField > 0) drawField(aField);
    if (aCell > 0) drawCell(aCell);
  }

  function drawPen(a) {
    const { X0, XR, Y0, pad, PN, pRows, ppx, ppy, gy, gh, k } = L, s = Math.min(ppx, ppy) * .34;
    g.save(); g.globalAlpha = a; g.fillStyle = g.strokeStyle = col.roach;
    for (let i = 0; i < PN; i++) {
      const t0 = launchP(i); if (p <= t0) continue;
      const u = clamp01((p - t0) / P.walk);
      const c = Math.floor(i / pRows), r = i % pRows;
      const sx = XR - pad - (c + .5) * ppx + (hash01(i, 3) - .5) * ppx * .22, sy = Y0 + pad + (r + .5) * ppy + (hash01(i, 4) - .5) * ppy * .22;
      const ax = -30 - hash01(i, 5) * 90 * k, ay = gy + (hash01(i, 6) - .5) * 160 * k, bx = X0 + 6, by = gy + (hash01(i, 7) - .5) * gh * 1.3;
      const l1 = Math.hypot(bx - ax, by - ay), l2 = Math.hypot(sx - bx, sy - by), d = ease.inOutSine(u) * (l1 + l2);
      let x, y, rot;
      if (d < l1) { const f = d / l1; x = lerp(ax, bx, f); y = lerp(ay, by, f); rot = Math.atan2(by - ay, bx - ax); }
      else { const f = (d - l1) / (l2 || 1); x = lerp(bx, sx, f); y = lerp(by, sy, f); rot = Math.atan2(sy - by, sx - bx); }
      const rest = -Math.PI / 2 + (hash01(i, 8) - .5) * .7, turn = clamp01((u - .82) / .18);
      rot = rot + Math.atan2(Math.sin(rest - rot), Math.cos(rest - rot)) * turn;
      roach(g, x, y, rot, s, d / (s * .45) + hash01(i, 9) * TAU);
    }
    g.restore();
  }

  // the 15,000, pre-rendered once per layout (colour bands from the counts: white ≤ MHA 2,000, grey ≤ 7,000, dark above)
  const bandCol = i => i < (count(FIELD[3][0])?.value || 0) ? col.roach : i < (count(FIELD[6][0])?.value || 0) ? col.grey : col.dark;
  const fpos = i => { const c = Math.floor(i / L.rows), r = i % L.rows; return [L.X0 + (c + .5) * L.pitch, L.Y0 + (r + .5) * L.py]; };
  const frot = i => -Math.PI / 2 + (hash01(i, 11) - .5) * .5, fleg = i => hash01(i, 12) * TAU, fs = () => L.pitch * .52;
  function buildField() {
    const d = dpr(), c = document.createElement('canvas');
    c.width = Math.ceil(L.fw * d); c.height = Math.ceil(L.fh * d);
    const o = c.getContext('2d'); o.setTransform(d, 0, 0, d, -L.X0 * d, -L.Y0 * d);
    for (let i = 0; i < L.N; i++) { const [x, y] = fpos(i); o.fillStyle = o.strokeStyle = bandCol(i); roach(o, x, y, frot(i), fs(), fleg(i)); }
    field = { c, d };
  }
  function drawField(a) {
    if (!field) buildField();
    const { X0, Y0, fw, fh, rows, pitch } = L, d = field.d;
    const sh = S.shrink;
    g.save(); g.globalAlpha = a * lerp(1, .3, sh);
    if (sh > 0) {
      const sc = lerp(1, L.sh, sh), x = X0, y = lerp(Y0, L.fb.y, sh);
      g.drawImage(field.c, x, y, fw * sc, fh * sc);
    } else {
      const n = fillN(p), full = Math.floor(n / rows), cw = Math.min(fw, full * pitch);
      if (cw > 0) g.drawImage(field.c, 0, 0, cw * d, fh * d, X0, Y0, cw, fh);
      // the leading columns, one roach at a time, fading in
      const i0 = full * rows, i1 = Math.min(L.N, Math.ceil(n));
      for (let i = i0; i < i1; i++) {
        const [x, y] = fpos(i); g.globalAlpha = a * clamp01((n - i) / (rows * .5));
        g.fillStyle = g.strokeStyle = bandCol(i); roach(g, x, y, frot(i), fs(), fleg(i));
      }
    }
    g.restore();
    // the loupe: after the fill passes 2,000 (fades with the count lines)
    const n = fillN(p), aL = clamp01((n - L.loupeN) / 1200) * win(p, P.lines[0], P.lines[1]) * (1 - sh);
    if (aL > 0) drawLoupe(aL, n);
  }
  function drawLoupe(a, n) {
    const { x, y, r, z, sx, sy } = L.loupe;
    g.save(); g.globalAlpha = a;
    g.beginPath(); g.arc(x, y, r, 0, TAU); g.fillStyle = col.bg; g.fill(); g.clip();
    const c0 = Math.max(0, Math.floor((sx - r / z - L.X0) / L.pitch) - 1), c1 = Math.min(L.cols, Math.ceil((sx + r / z - L.X0) / L.pitch) + 1);
    const r0 = Math.max(0, Math.floor((sy - r / z - L.Y0) / L.py) - 1), r1 = Math.min(L.rows, Math.ceil((sy + r / z - L.Y0) / L.py) + 1);
    for (let c = c0; c < c1; c++) for (let rr = r0; rr < r1; rr++) {
      const i = c * L.rows + rr; if (i >= n) continue;
      const [fx, fy] = fpos(i);
      g.fillStyle = g.strokeStyle = bandCol(i); roach(g, x + (fx - sx) * z, y + (fy - sy) * z, frot(i), fs() * z, fleg(i));
    }
    g.restore();
    g.save(); g.globalAlpha = a; g.strokeStyle = col.fg; g.lineWidth = 1.5; g.beginPath(); g.arc(x, y, r, 0, TAU); g.stroke(); g.restore();
  }
  function drawCell(a) {
    const { cx, cy, cw, k } = L, s = 22 * k, w = S.walk, t = ctx.clock.still ? 0 : ctx.clock.t || 0;
    g.save(); g.globalAlpha = a; g.fillStyle = g.strokeStyle = col.roach;
    [[-.2, .1, -.15, 0], [.2, 0, .2, 1]].forEach(([fx, lag, tilt, j]) => {
      const u = clamp01((w - lag) / (1 - .1)), e = ease.inOutSine(u);
      const x0 = -60 - j * 70 * k, y0 = cy + (j ? -30 : 34) * k, x1 = cx + fx * cw, y1 = cy + 10 * k;
      const x = lerp(x0, x1, e), y = lerp(y0, y1, e), dist = Math.hypot(x - x0, y - y0);
      const heading = Math.atan2(y1 - y0, x1 - x0), rest = -Math.PI / 2 + tilt, turn = clamp01((u - .8) / .2);
      const rot = heading + Math.atan2(Math.sin(rest - heading), Math.cos(rest - heading)) * turn;
      const idle = u >= 1 ? Math.sin(t * 2.2 + j * 1.7) * .25 : 0;           // tick only: a twitch of the legs
      roach(g, x, y, rot, s, dist / (s * .35) + j * 1.7 + idle);
    });
    g.restore();
  }

  return scene;
};

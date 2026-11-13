// Hybrid ch. 09 "The apparatus" as a cage (Vali 2026-11-13: black theme; a unique, interactive anime.js visual
// instead of v2's spokes). Prototype for Gate 0; replaces the S7d network at Gate 2. Data: data/story/apparatus.json.
//
// The CJP roach in the centre of a radial calendar, 21 May → 21 Oct, clockwise from the top. Four rings, one per
// group (inner → outer: in power, in court, online, on the street). Every documented action is one bar across its
// group's ring at its date: red = a restriction; courts dashed (white = restored, red = restricted, grey = mixed);
// grey = the Election Commission (a trigger, not a restriction). A sweep hand runs the calendar with scroll and
// anime.js draws each bar in as the hand passes; the roach turns to face the newest bar. The bars close in: a cell.
// Purity: one paused timeline, 1000 ms = p 0 → 1; update(p) = tl.seek(p × 1000). Interaction is idle-only:
// hover a bar → its record; hover an actor in the roster → its bars light, the rest dim (anime tweens).
import { createTimeline, animate, utils, svg as asvg } from 'animejs';
import { roach } from '../../src/roach/roach.js';
import { esc } from '../../src/lib/text.js';
import { star } from '../../src/lib/star.js';
import { fmtDate } from '../../src/lib/dates.js';
import { load } from '../../src/data/load.js';

const TAU = Math.PI * 2, LEN = 1000, SWEEP = [90, 860];
const D0 = Date.parse('2026-05-21'), D1 = Date.parse('2026-10-21');
const RINGS = { politics: [96, 136], courts: [146, 186], digital: [196, 246], street: [256, 336] };
const ORDER = ['street', 'digital', 'courts', 'politics'];

export async function createCage({ host, w, h, c, S, k = 1, onCard }) {
  const ap = await load('story/apparatus.json');
  const groups = Object.fromEntries(ap.groups.map(g => [g.id, g.label]));
  const actors = [...ap.actors].sort((a, b) => ORDER.indexOf(a.group) - ORDER.indexOf(b.group));
  const frac = iso => (Date.parse(iso) - D0) / (D1 - D0);
  const ang = f => -Math.PI / 2 + f * TAU * .92 + TAU * .04;          // a 0.04-turn gap either side of 12 o'clock
  const bars = [];
  for (const a of actors) for (const x of a.actions) bars.push({ a, x, f: frac(x.date), d: x.date });
  bars.sort((p, q) => p.d.localeCompare(q.d));
  // same day, same ring: fan out by 1.6° so no bar hides another
  const seen = {};
  for (const b of bars) { const key = b.a.group + b.d; b.n = seen[key] = (seen[key] ?? -1) + 1; b.th = ang(b.f) + b.n * .028; }
  const kind = b => b.a.kind === 'trigger' ? 'trigger' : b.a.group === 'courts' ? `court-${b.x.effect || 'mixed'}` : 'restrict';
  const STROKE = { restrict: '#E0201B', trigger: '#8A8984', 'court-restore': '#FAFAF7', 'court-restrict': '#E0201B', 'court-mixed': '#8A8984' };

  // SVG: rings, month ticks, bars, sweep hand
  const R = r => r * k, P = (r, th) => [c.x + Math.cos(th) * R(r), c.y + Math.sin(th) * R(r)];
  let svgs = `<svg width="${w}" height="${h}" style="position:absolute;inset:0;overflow:visible" class="cg">`;
  for (const g of ORDER) {
    const [r0, r1] = RINGS[g];
    svgs += `<circle class="cg-ring" cx="${c.x}" cy="${c.y}" r="${R((r0 + r1) / 2)}" fill="none" stroke="#141413" stroke-width="${R(r1 - r0)}"/>`;
    for (const rr of [r0, r1]) svgs += `<circle cx="${c.x}" cy="${c.y}" r="${R(rr)}" fill="none" stroke="#2A2A27" stroke-width="1"/>`;
    const [lx, ly] = P(r1 - 6, -Math.PI / 2 - .05);
    svgs += `<text x="${lx}" y="${ly}" fill="#A3A29C" font-family="Public Sans" font-weight="760" font-size="10" letter-spacing="1.2" text-anchor="end">${esc(groups[g].toUpperCase())}</text>`;
  }
  for (let m = 5; m <= 10; m++) {
    const iso = `2026-${String(m).padStart(2, '0')}-01`, f = Math.max(0, frac(iso)), th = ang(f);
    const [x0, y0] = P(342, th), [x1, y1] = P(352, th), [tx, ty] = P(368, th);
    svgs += `<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" stroke="#6B6B66" stroke-width="1.5"/><text x="${tx}" y="${ty + 4}" fill="#A3A29C" font-family="Public Sans" font-size="11" text-anchor="middle">${m === 5 ? '21 May' : new Date(iso).toLocaleString('en-GB', { month: 'short' })}</text>`;
  }
  bars.forEach((b, i) => {
    const [r0, r1] = RINGS[b.a.group], [x0, y0] = P(r0 + 3, b.th), [x1, y1] = P(r1 - 3, b.th), kd = kind(b);
    svgs += `<line class="cg-bar" data-i="${i}" x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" stroke="${STROKE[kd]}" stroke-width="${b.a.group === 'courts' ? 3 : 4}" stroke-linecap="round" ${kd.startsWith('court') ? 'stroke-dasharray="5 4"' : ''}/>`;
    // invisible fat hit line for hover
    svgs += `<line class="cg-hit" data-i="${i}" x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" stroke="transparent" stroke-width="14" style="pointer-events:stroke;cursor:pointer"/>`;
  });
  const [hx, hy] = P(342, -Math.PI / 2);
  svgs += `<line class="cg-hand" x1="${c.x}" y1="${c.y}" x2="${hx}" y2="${hy}" stroke="#FAFAF7" stroke-opacity=".5" stroke-width="1"/><circle cx="${c.x}" cy="${c.y}" r="${R(72)}" fill="#0B0B0B" stroke="#3A3A37"/></svg>`;
  host.insertAdjacentHTML('beforeend', svgs);
  const svg = host.lastElementChild, lines = [...svg.querySelectorAll('.cg-bar')], hand = svg.querySelector('.cg-hand');
  // the roach in the centre (canvas over the hub)
  const cv = document.createElement('canvas'), dp = Math.min(devicePixelRatio || 1, 2), cs = R(140);
  cv.width = cs * dp; cv.height = cs * dp; Object.assign(cv.style, { position: 'absolute', left: c.x - cs / 2 + 'px', top: c.y - cs / 2 + 'px', width: cs + 'px', height: cs + 'px', pointerEvents: 'none' });
  host.append(cv); const g = cv.getContext('2d'); g.setTransform(dp, 0, 0, dp, 0, 0);

  // the timeline: the hand sweeps; each bar draws in (outward) as the hand passes its date
  const tl = createTimeline({ autoplay: false, defaults: { ease: 'outQuart', duration: 60 } });
  tl.add({ duration: LEN }, 0);
  const st = { a: 0 };
  tl.add(st, { a: [0, 1], duration: SWEEP[1] - SWEEP[0], ease: 'linear' }, SWEEP[0]);
  bars.forEach((b, i) => {
    const at = SWEEP[0] + b.f * (SWEEP[1] - SWEEP[0]);
    // court bars are dashed, and anime's drawable owns stroke-dasharray, so they fade in instead of drawing
    if (b.a.group === 'courts') { utils.set(lines[i], { opacity: 0 }); tl.add(lines[i], { opacity: [0, 1], duration: 80 }, at); return; }
    const d = asvg.createDrawable(lines[i]); utils.set(d, { draw: '0 0' });
    tl.add(d, { draw: ['0 0', '0 1'] }, at);
  });

  let sel = null;
  function draw() {
    const th = ang(st.a);                                     // st.a is the calendar fraction (0 = 21 May, 1 = 21 Oct)
    const [x, y] = P(342, th);
    hand.setAttribute('x2', x); hand.setAttribute('y2', y); hand.style.opacity = st.a > 0 && st.a < 1 ? 1 : 0;
    // the roach faces the newest bar
    const last = [...bars].reverse().find(b => b.f <= st.a + 1e-6);
    g.clearRect(0, 0, cs, cs); g.fillStyle = g.strokeStyle = '#FAFAF7';
    roach(g, cs / 2, cs / 2, last ? last.th : -Math.PI / 2, R(26), .8);
  }
  // hover/select: anime tweens the bars' opacity (idle UI; p never depends on it)
  function focus(actorId) {
    sel = actorId;
    animate(lines, { opacity: (el) => (!actorId || bars[+el.dataset.i].a.id === actorId ? 1 : .14), duration: 280, ease: 'outQuad' });
  }
  svg.querySelectorAll('.cg-hit').forEach(el => {
    el.addEventListener('pointerenter', () => { const b = bars[+el.dataset.i]; focus(b.a.id); onCard?.(cardOne(b)); });
    el.addEventListener('pointerleave', () => { focus(null); onCard?.(null); });
  });
  const cardOne = b => `<p class="when">${esc(fmtDate(b.d))} · ${esc(groups[b.a.group])}</p><h3>${esc(b.a.label)}</h3><p>${esc(b.x.text)}${star(b.x.source_ids, S, b.x.claimant)}</p><p style="font:400 12px/1.4 var(--font-ui);color:var(--muted);margin-top:8px">${esc(b.x.claimant)} · ${esc(b.x.attribution)}</p>`;
  const cardActor = a => `<p class="when">${esc(groups[a.group])} · ${a.actions.length} action${a.actions.length > 1 ? 's' : ''}</p><h3>${esc(a.label)}</h3>${a.actions.map(x => `<p style="margin-top:8px"><b style="font:760 12px/1 var(--font-ui)">${esc(fmtDate(x.date))}</b> ${esc(x.text)}${star(x.source_ids, S, x.claimant)}</p>`).join('')}`;
  return {
    actors, bars, groups,
    update(p) { tl.seek(p * LEN); draw(); },
    focus, cardActor: id => cardActor(actors.find(a => a.id === id)),
  };
}

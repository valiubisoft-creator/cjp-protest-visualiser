// Hybrid ch. 06 "The country watched" (Vali 2026-11-13: an anime.js visualisation, not a simple chart; black theme).
// Prototype for Gate 0; moves into src/scenes at Gate 2 (replaces S7a in the reading flow).
//
// The screen: exactly 1,000 halftone dots in the shape of a roach (the verbatim roach() rendered big as a mask).
// One dot = 0.1% of all views in the YouTube clip corpus, given to videos by largest remainder of their views,
// so every dot belongs to one video. Scroll runs the calendar (23 May → 21 Jul): a dot lights when its video's
// upload day passes. Before the crackdown window the few lit dots are scattered at random (noise, grey); from
// 18 Jul the window's dots light from the centre out, white, and the roach resolves.
// Purity: one paused anime.js timeline, 1000 ms = p 0 → 1; update(p) = tl.seek(p × 1000) + redraw from the state.
// Interaction (idle, never changes what p decides): hover a lit dot → card with its video; that video's dots pulse.
import { createTimeline, stagger, animate } from 'animejs';
import { roach } from '../../src/roach/roach.js';
import { rng } from '../../src/lib/rng.js';
import { esc } from '../../src/lib/text.js';
import { fmtDate } from '../../src/lib/dates.js';
import { buildModel, istDay } from '../../src/scenes/s07/model.js';
import { load } from '../../src/data/load.js';

const TAU = Math.PI * 2, LEN = 1000;
// p budget: the quiet weeks fast, the window slow, then a hold
const PRE = [40, 400], WIN = [440, 860];

export async function createWatched({ host, w, h, box, ticker }) {
  const [clipsFile, timeline] = await Promise.all([load('timeline_clips.json'), load('story/timeline.json')]);
  const m = buildModel(clipsFile, timeline.nodes);
  const clips = clipsFile.clips.filter(c => (c.views || 0) > 0);
  const total = clips.reduce((a, c) => a + c.views, 0);

  // 1. the mask: roach() big, nose up, fitted to the box
  const off = document.createElement('canvas'); off.width = Math.round(box.w); off.height = Math.round(box.h);
  const og = off.getContext('2d'); og.fillStyle = og.strokeStyle = '#000';
  const s = Math.min(box.h * .40, box.w * .56);           // roach() body length ≈ 1.9 s; legs and feelers reach further
  roach(og, box.w / 2, box.h / 2 + s * .08, -Math.PI / 2, s, .9);
  const A = og.getImageData(0, 0, off.width, off.height).data;
  const inside = (x, y) => { const i = (Math.round(y) * off.width + Math.round(x)) * 4 + 3; return x >= 0 && y >= 0 && x < off.width && y < off.height && A[i] > 128; };
  // 2. a 45° dot screen; pitch searched so the mask holds ≥ 1,000 cells, then trimmed to exactly 1,000 (seeded)
  const cellsAt = P => {
    const out = [], c = Math.SQRT1_2, R = Math.hypot(box.w, box.h);
    for (let u = -R; u < R; u += P) for (let v = -R; v < R; v += P) {
      const x = box.w / 2 + (u - v) * c, y = box.h / 2 + (u + v) * c;
      if (inside(x, y)) out.push({ x: box.x + x, y: box.y + y });
    }
    return out;
  };
  let lo = 3, hi = 40, cells = [];
  for (let i = 0; i < 30; i++) { const P = (lo + hi) / 2, c = cellsAt(P); if (c.length >= 1000) { lo = P; cells = c; } else hi = P; }
  const P = lo, r = rng(6);
  while (cells.length > 1000) cells.splice(Math.floor(r() * cells.length), 1);
  const cx = box.x + box.w / 2, cy = box.y + box.h / 2;

  // 3. 1,000 dots → videos (largest remainder of views)
  const q = clips.map(c => ({ c, f: c.views / total * 1000 }));
  q.forEach(o => { o.n = Math.floor(o.f); o.rem = o.f - o.n; });
  let left = 1000 - q.reduce((a, o) => a + o.n, 0);
  [...q].sort((a, b) => b.rem - a.rem).slice(0, left).forEach(o => o.n++);
  const dots = [];
  for (const o of q) for (let i = 0; i < o.n; i++) dots.push({ clip: o.c, day: istDay(o.c.date), r: 0 });
  dots.sort((a, b) => a.clip.date.localeCompare(b.clip.date));
  const from = m.window.from, days = m.series.map(x => x.d);
  const pre = dots.filter(d => d.day < from), win = dots.filter(d => d.day >= from);
  // places: the quiet weeks scatter at random; the window fills from the centre outwards, in upload order
  const free = cells.map((c, i) => ({ ...c, i }));
  for (const d of pre) Object.assign(d, free.splice(Math.floor(r() * free.length), 1)[0]);
  free.sort((a, b) => Math.hypot(a.x - cx, a.y - cy) - Math.hypot(b.x - cx, b.y - cy));
  win.forEach((d, i) => Object.assign(d, free[i]));

  // 4. the timeline: calendar day → timeline ms (two speeds), each day's dots pop in with a stagger
  const preDays = days.filter(d => d < from), winDays = days.filter(d => d >= from);
  const tOf = d => d < from
    ? PRE[0] + (PRE[1] - PRE[0]) * preDays.indexOf(d) / Math.max(1, preDays.length - 1)
    : WIN[0] + (WIN[1] - WIN[0]) * winDays.indexOf(d) / winDays.length;
  const slot = d => (d < from ? (PRE[1] - PRE[0]) / preDays.length : (WIN[1] - WIN[0]) / winDays.length);
  const tl = createTimeline({ autoplay: false, defaults: { ease: 'outBack(1.6)', duration: 70 } });
  tl.add({ duration: LEN }, 0);
  const clock = { t: 0 };                                     // the calendar, as a fraction of the day list
  tl.add(clock, { t: [0, 1], duration: WIN[1] - PRE[0], ease: 'linear' }, PRE[0]);
  for (const d of days) {
    const ds = dots.filter(o => o.day === d); if (!ds.length) continue;
    tl.add(ds, { r: [0, 1] }, stagger(slot(d) * .8 / ds.length, { start: tOf(d) }));
  }
  const dateAt = ms => {
    if (ms <= PRE[0]) return days[0];
    if (ms < WIN[0]) return preDays[Math.min(preDays.length - 1, Math.floor((ms - PRE[0]) / (PRE[1] - PRE[0]) * preDays.length))];
    return winDays[Math.min(winDays.length - 1, Math.floor((ms - WIN[0]) / (WIN[1] - WIN[0]) * winDays.length))];
  };

  // 5. drawing
  const cv = document.createElement('canvas'); const d0 = Math.min(devicePixelRatio || 1, 2);
  cv.width = w * d0; cv.height = h * d0; Object.assign(cv.style, { position: 'absolute', left: 0, top: 0, width: w + 'px', height: h + 'px' });
  host.append(cv); const g = cv.getContext('2d'); g.setTransform(d0, 0, 0, d0, 0, 0);
  const R0 = P * .44;
  let ms = 0, hover = null;
  const hs = { k: 0 };                                      // hover pulse 0 → 1 (one anime tween for all of a video's dots)
  function draw() {
    g.clearRect(0, 0, w, h);
    g.fillStyle = 'rgba(250,250,247,.07)';
    for (const c of cells) { g.beginPath(); g.arc(c.x, c.y, R0 * .55, 0, TAU); g.fill(); }
    for (const d of dots) {
      if (d.r <= 0.01) continue;
      g.fillStyle = d.day < from ? '#8A8984' : '#FAFAF7';
      g.beginPath(); const hi = hover && d.clip === hover.clip ? hs.k : 0;
      g.arc(d.x, d.y, Math.max(0, R0 * d.r * (1 + hi * .5)), 0, TAU); g.fill();
      if (hi > .01) { g.strokeStyle = `rgba(224,32,27,${hi})`; g.lineWidth = 2; g.beginPath(); g.arc(d.x, d.y, R0 * 1.9, 0, TAU); g.stroke(); }
    }
    ticker?.(dateAt(ms), dots.filter(d => d.r > .5).length / 1000, m, ms >= WIN[1]);
  }
  // hover: nearest lit dot; the video's dots pulse (anime, time-based UI, independent of p)
  function pick(x, y) {
    let best = null, bd = R0 * 2.2;
    for (const d of dots) { if (d.r < .5) continue; const dd = Math.hypot(d.x - x, d.y - y); if (dd < bd) { bd = dd; best = d; } }
    return best;
  }
  function setHover(d) {
    if (d?.clip === hover?.clip) return;
    hover = d; hs.k = 0;
    if (d) animate(hs, { k: [0, 1], duration: 320, ease: 'outQuad', onUpdate: draw }); else draw();
  }
  return {
    m, total, dots, cells, P,
    update(p) { ms = p * LEN; tl.seek(ms); draw(); },
    hoverAt(x, y) { const d = pick(x, y); setHover(d); return d; },
    hoverClip(id) { const d = dots.find(o => o.clip.id === id); setHover(d); return d; },
    biggest: () => q.reduce((a, b) => (b.c.views > a.c.views ? b : a)).c,
    card: d => d && `<p class="when">${esc(fmtDate(d.day))} · ${esc(d.clip.channel)}</p><p>${esc(d.clip.title)}</p><p style="font:400 12px/1.4 var(--font-ui);color:var(--muted);margin-top:8px">${Math.round(d.clip.views).toLocaleString('en-IN')} views · ${dots.filter(o => o.clip === d.clip).length} of the 1,000 dots</p>`,
  };
}

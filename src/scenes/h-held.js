// HELD · "Blocked for 48 days. Back within hours." (hybrid, build/hybrid, 2026-11-13; Gate 0 frames 02a / 02b).
// Prologue stage, between NEET and S4. Starts and ends on S3.5's last frame (claim.poses(1, t)): the swarm walks into
// the original account (@CJP_2029), the account is withheld (its roaches grey out), about 45% stream out into the new
// one (@Cockroachisback) within "hours", a 48-day tally runs to the court order, the notice lifts, and everyone walks
// home, so NEET → HELD → S4 hand over in place. Facts: withheld.json (verified against Business Today and LawBeat).
//
// p 0.00–0.20  title card; the swarm dims behind it
// p 0.18–0.34  box A draws in; the roaches walk into it (seeded delays). Caption 0 (21 May · Day 1) from 0.22
// p 0.32–0.36  the notice stamps over A ("Withheld in India"); A's roaches turn grey
// p 0.38–0.56  box B draws in; the movers (hash < .45) stream out of A's right edge into B and light up. Caption 1
// p 0.26–0.80  the tally (shown from 0.26 at Day 1; counts 0.56–0.80): Day 1 → Day 48, 48 red strokes in fives (anime-seeked counter). Caption 2 (29 May) 0.58–0.72
// p 0.74–0.80  Day 48: the notice lifts, A's roaches light up again. Caption 3 (7 Jul) 0.74–0.88
// p 0.86–1.00  boxes, tally and notice fade (0.86–0.92); the roaches walk home (0.88–0.98); p ≥ 0.98 is S3.5's frame
import { createTimeline, utils } from 'animejs';
import { tok, fitCanvas } from '../lib/dom.js';
import { esc } from '../lib/text.js';
import { roach } from '../roach/roach.js';
import { idle, clamp01, lerp, ease, hash01, TAU } from '../roach/swarm.js';
import { claim } from './s03-5-claim.js';
import { N3 } from './s03-multiply.js';
import { loadCss, backdrop } from './s00-hero.js';
import { createChapter } from '../lib/chapter.js';
import { grid as colGrid } from '../lib/grid.js';

const CSS = new URL('./h-held.css', import.meta.url).href;
const IN = [.18, .34], MOVE = [.38, .56], HOME = [.88, .98], DAY = [.56, .80], DAY9 = [.585, .72];   // Day 1 until the movers are out, then to Day 48
const mover = i => hash01(i, 81) < .45;

export default def => {
  let ctx, W = 0, H = 0, p = 0, chap, el = {}, L = null, g2 = null;
  const P = [], S3 = [], TA = [], TB = [];
  const st = { day: 0, notice: 0, lift: 0 };
  const tl = createTimeline({ autoplay: false, defaults: { ease: 'outQuart' } });
  tl.add({ duration: 1000 }, 0);
  utils.set(st, { day: 0, notice: 0, lift: 0 });
  // the tally parks on Day 9 while caption 2 ("29 May · Day 9") is up, then runs on to Day 48 (UX review 2026-11-13)
  tl.add(st, { day: [0, 8], duration: (DAY9[0] - DAY[0]) * 1000, ease: 'linear' }, DAY[0] * 1000);
  tl.add(st, { day: [8, 47], duration: (DAY[1] - DAY9[1]) * 1000, ease: 'linear' }, DAY9[1] * 1000);
  tl.add(st, { notice: [0, 1], duration: 40, ease: 'outBack(2)' }, 320);
  tl.add(st, { lift: [0, 1], duration: 60, ease: 'inOutSine' }, 740);

  return {
    id: def.id,
    init(c) {
      ctx = c; loadCss(CSS);
      c.root.classList.add('hheld');
      c.root.innerHTML = `<canvas class="hheld-cv" aria-hidden="true"></canvas>
        <div class="hheld-box a"><div class="bar"><b>@CJP_2029</b><span class="t-micro">X · original account</span></div></div>
        <div class="hheld-box b"><div class="bar"><b>@Cockroachisback</b><span class="t-micro">opened 21 May</span></div></div>
        <div class="hheld-notice" role="img" aria-label="Withheld in India"><div class="t-micro">Withheld in India</div><p>Section 69A, IT Act. Order by email, 21&nbsp;May&nbsp;2026.</p></div>
        <div class="hheld-tally" aria-live="off"><div class="t-micro">Days the order stood</div><div class="row"><span class="n t-num">1</span><svg class="marks" viewBox="0 0 520 48" aria-hidden="true"></svg></div></div>`;
      const q = s => c.root.querySelector(s);
      el = { cv: q('.hheld-cv'), A: q('.hheld-box.a'), B: q('.hheld-box.b'), notice: q('.hheld-notice'), tally: q('.hheld-tally'), n: q('.hheld-tally .n'), marks: q('.hheld-tally .marks') };
      el.marks.innerHTML = Array.from({ length: 48 }, (_, i) => {
        const grp = Math.floor(i / 5), j = i % 5, x = grp * 52 + j * 9;
        return j === 4 ? `<line data-i="${i}" x1="${x - 38}" y1="40" x2="${x + 2}" y2="8"/>` : `<line data-i="${i}" x1="${x}" y1="6" x2="${x}" y2="42"/>`;
      }).join('');
      el.lines = [...el.marks.querySelectorAll('line')];
      chap = createChapter(c.root, 'withheld', c.data, { title: [0, .06, .14, .20], caps: [[0, .22, .36], [1, .40, .56], [2, .58, .72], [3, .74, .88]] });
    },
    resize(w, h) {
      W = w; H = h; chap.resize(w); g2 = fitCanvas(el.cv, w, h);
      const k = Math.min(w / 1440, h / 900), top = 150 * k;
      // on the grid (Vali 2026-11-13): A in columns 1–4, B in 6–8; the caption column (right 24 px, 360) stays clear
      const G = colGrid(w), A = { x: G.x(0), y: top, w: G.span(4), h: h - top - 210 * k };
      const B = { x: G.x(5), y: top + 70 * k, w: G.span(3), h: A.h - 70 * k };
      L = { A, B, k };
      const box = (e, b) => Object.assign(e.style, { left: b.x + 'px', top: b.y + 'px', width: b.w + 'px', height: b.h + 'px' });
      box(el.A, A); box(el.B, B);
      Object.assign(el.notice.style, { left: A.x + 28 * k + 'px', top: A.y + A.h / 2 + 'px', width: A.w - 56 * k + 'px' });   // centred in A (box-sizing: border-box; Vali 2026-11-13)
      Object.assign(el.tally.style, { left: A.x + 'px', top: A.y + A.h + 34 * k + 'px' });
      el.n.style.fontSize = 64 * k + 'px'; el.marks.style.width = 520 * k + 'px'; el.marks.style.height = 48 * k + 'px';
      for (const cap of chap.el.caps) Object.assign(cap.style, { right: '24px', top: top + 'px' });
      // seeded slots inside A (everyone) and B (the movers)
      const grid = (b, n, seed, pad = 26) => Array.from({ length: n }, (_, i) => ({ x: b.x + pad + hash01(i, seed) * (b.w - 2 * pad), y: b.y + 46 + hash01(i, seed + 1) * (b.h - 46 - pad) }));
      const ga = grid(A, N3, 83), gb = grid(B, N3, 85, 20);
      for (let i = 0; i < N3; i++) { TA[i] = ga[i]; TB[i] = gb[i]; }
    },
    enter() {},
    exit() { ctx.layers.swarm.ctx.clearRect(0, 0, W, H); },
    update(q) { p = q; backdrop.scroll(def, p); tl.seek(p * 1000); render(); },
    tick() { render(); },
  };

  function render() {
    if (!L) return;
    const t = ctx.clock.t, { A, B } = L;
    chap.update(p, { lockAlpha: 1 - clamp01((p - .9) / .06) });
    const out = 1 - clamp01((p - .86) / .06);
    const aA = clamp01((p - .18) / .04) * out, aB = clamp01((p - .38) / .04) * out;
    show(el.A, aA); show(el.B, aB); show(el.tally, clamp01((p - .26) / .03) * out);
    el.A.style.clipPath = `inset(0 0 ${((1 - clamp01((p - .18) / .05)) * 100).toFixed(1)}% 0)`;
    el.B.style.clipPath = `inset(0 0 ${((1 - clamp01((p - .38) / .05)) * 100).toFixed(1)}% 0)`;
    const na = st.notice * (1 - st.lift) * out;
    show(el.notice, na);
    el.notice.style.transform = `translateY(-50%) scale(${(1 + (1 - st.notice) * .5).toFixed(3)}) translateY(${(-st.lift * 30).toFixed(1)}px)`;
    const day = Math.min(48, 1 + Math.floor(st.day + 1e-6));
    el.n.textContent = day;
    el.lines.forEach((ln, i) => ln.style.opacity = i < day ? 1 : .12);
    // the swarm
    claim.poses(1, t, P, ctx.swarm.list, S3);
    const dim = 1 - .78 * clamp01(p / .06) * (1 - clamp01((p - .14) / .06));
    const grey = st.notice * (1 - st.lift);                 // A's roaches grey while the order stands
    const sw = ctx.layers.swarm.ctx; sw.clearRect(0, 0, W, H);
    const fg = tok('--roach'), red = tok('--accent'), gr = tok('--grey-1');
    const pass = (col, pick) => {
      sw.fillStyle = sw.strokeStyle = col;
      for (let i = 0; i < N3; i++) {
        const o = P[i], d = hash01(i, 87) * .5, j = idle(i, t, 1.1), m = mover(i);
        const ei = ease.inOutCubic(clamp01(((p - IN[0]) / (IN[1] - IN[0]) - d) / .5));
        const em = m ? ease.inOutCubic(clamp01(((p - MOVE[0]) / (MOVE[1] - MOVE[0]) - d) / .5)) : 0;
        const eh = ease.inOutCubic(clamp01(((p - HOME[0]) / (HOME[1] - HOME[0]) - d) / .5));
        // path: base → A slot → (movers) out of A's right edge → B slot → home
        const a = TA[i], b = TB[i];
        let x = lerp(o.x, a.x + j.dx, ei), y = lerp(o.y, a.y + j.dy, ei), dir = Math.atan2(a.y - o.y, a.x - o.x);
        if (em > 0) {
          const gx = A.x + A.w, gy = A.y + A.h * .55;           // the gap they leave through
          const u = em < .5 ? em * 2 : (em - .5) * 2;
          const [sx, sy, tx, ty] = em < .5 ? [a.x, a.y, gx, gy + (hash01(i, 88) - .5) * 40] : [gx, gy + (hash01(i, 88) - .5) * 40, b.x + j.dx, b.y + j.dy];
          x = lerp(sx, tx, ease.inOutSine(u)); y = lerp(sy, ty, ease.inOutSine(u)); dir = Math.atan2(ty - sy, tx - sx);
        }
        if (eh > 0) { const fx = x, fy = y; x = lerp(fx, o.x, eh); y = lerp(fy, o.y, eh); dir = Math.atan2(o.y - fy, o.x - fx); }
        const moving = (ei > 0 && ei < 1) || (em > 0 && em < 1) || (eh > 0 && eh < 1);
        const rot = ei <= 0 || eh >= 1 ? o.rot : moving ? dir : o.rot + j.dr;
        // colour: A's stayers grey while withheld; movers white once they leave; the base red mix as S3.5 left it
        const inA = ei > .5 && (!m || em < .5) && eh < .5;
        const kind = inA && grey > .5 ? 'g' : o.c > .5 ? 'r' : 'w';
        if (kind !== pick) continue;
        const al = o.a * dim * (kind === 'g' ? .55 : 1);
        // leg phase: whole cycles per stage, so at p 1 the pose is S3.5's exactly (handover to S4)
        if (al > .01) { sw.globalAlpha = al; roach(sw, x, y, rot, o.s, o.legs + (ei + em + eh) * TAU * 6); }
      }
    };
    pass(fg, 'w'); pass(gr, 'g'); pass(red, 'r'); sw.globalAlpha = 1;
    // the walk-out trail: a faint ribbon between the boxes while the movers cross
    const g = g2; g.clearRect(0, 0, W, H);
  }
  function show(e, a) { e.style.opacity = a.toFixed(3); e.style.visibility = a > .001 ? 'visible' : 'hidden'; }
};

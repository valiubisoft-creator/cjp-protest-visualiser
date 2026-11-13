// NEET · "22 lakh students, one cancelled exam." (hybrid, build/hybrid, 2026-11-13; Gate 0 frame 01b-neet).
// Prologue stage, between S3.5 and HELD. Starts and ends on S3.5's last frame (claim.poses(1, t), alpha 1): the
// swarm leaves the clusters to ring an answer sheet and comes back, so S3.5 → NEET → HELD hand over in place.
//
// p 0.00–0.22  title card (chapter.js); the swarm dims to 0.22 behind it (back to 1 as the card docks)
// p 0.20–0.44  the sheet draws in: 2,279 bubbles (one per 1,000 registered candidates; neet.json neet02), filled in
//              reading order by a seeked anime.js tween; the roaches walk to the sheet's edges (seeded delays)
// p 0.24–0.45  caption 0 (3 May, the exam and the alleged "guess paper")
// p 0.47–0.53  the stamp: "Cancelled · 12 May 2026 · NTA" slams in (anime: scale 1.7 → 1, rotate, opacity)
// p 0.47–0.66  caption 1 (cancelled, CBI case, re-test)       p 0.68–0.84  caption 2 (22 May, the demand)
// p 0.84–1.00  the sheet and stamp fade (0.84–0.90), the roaches walk home (0.86–0.98), the lockup fades; at p ≥ 0.98
//              every pose is exactly claim.poses(1, t): HELD p 0 is the same frame.
import { createTimeline, utils } from 'animejs';
import { tok } from '../lib/dom.js';
import { rng } from '../lib/rng.js';
import { roach } from '../roach/roach.js';
import { idle, clamp01, lerp, ease, TAU, hash01 } from '../roach/swarm.js';
import { claim } from './s03-5-claim.js';
import { N3 } from './s03-multiply.js';
import { loadCss, backdrop } from './s00-hero.js';
import { createChapter } from '../lib/chapter.js';
import { fitCanvas } from '../lib/dom.js';

const CSS = new URL('./h-neet.css', import.meta.url).href;
const NB = 2279;                                       // bubbles: 22.79 lakh registered ÷ 1,000 (neet02)
const OUT = [.20, .44], HOME = [.86, .98];             // walk out / walk home windows

export default def => {
  let ctx, W = 0, H = 0, p = 0, chap, el = {}, sheet = null, g2 = null;
  const P = [], S3 = [], T = [];                       // base poses, scratch, margin targets
  const st = { fill: 0, stamp: 0 };                    // anime-tweened state (seeked)
  const tl = createTimeline({ autoplay: false, defaults: { ease: 'outQuart' } });
  tl.add({ duration: 1000 }, 0);
  utils.set(st, { fill: 0, stamp: 0 });
  tl.add(st, { fill: [0, 1], duration: 220, ease: 'inOutSine' }, 210);
  tl.add(st, { stamp: [0, 1], duration: 60, ease: 'outBack(2.2)' }, 470);

  return {
    id: def.id,
    init(c) {
      ctx = c; loadCss(CSS);
      c.root.classList.add('hneet');
      c.root.innerHTML = `<canvas class="hneet-sheet" aria-hidden="true"></canvas>
        <div class="hneet-head t-micro" aria-hidden="true"><span>NEET-UG 2026 · 3 May</span><span>One bubble = 1,000 registered candidates</span></div>
        <div class="hneet-stamp" role="img" aria-label="Cancelled, 12 May 2026, NTA"><div class="big">Cancelled</div><div class="sub">12 May 2026 · NTA</div></div>`;
      el = { cv: c.root.querySelector('.hneet-sheet'), head: c.root.querySelector('.hneet-head'), stamp: c.root.querySelector('.hneet-stamp') };
      chap = createChapter(c.root, 'neet', c.data, { title: [0, .06, .16, .22], caps: [[0, .24, .45], [1, .47, .66], [2, .68, .84]] });
    },
    resize(w, h) {
      W = w; H = h; chap.resize(w);
      g2 = fitCanvas(el.cv, w, h);
      const k = Math.min(w / 1440, h / 900);
      const sx = 120 * k, sy = 140 * k, sw = w - 600 * k, sh = h - sy - 90 * k;
      const top = sy + 36, cols = Math.round(Math.sqrt(NB * sw / (sh - 46))), rows = Math.ceil(NB / cols);
      sheet = { sx, sy, sw, sh, top, cols, rows, px: (sw - 32) / cols, py: (sh - 52) / rows };
      sheet.rad = Math.min(sheet.px, sheet.py) * .36;
      Object.assign(el.head.style, { left: sx + 16 + 'px', top: sy + 10 + 'px', width: sw - 32 + 'px' });
      Object.assign(el.stamp.style, { left: sx + sw / 2 + 'px', top: sy + sh / 2 + 'px', fontSize: 84 * k + 'px' });
      for (const cap of c_caps()) Object.assign(cap.style, { right: '24px', top: sy + 'px' });
      // margin targets: rows of slots just outside the sheet, matched to roaches by angle around its centre
      const cx = sx + sw / 2, cy = sy + sh / 2, slots = [], gap = 12;
      for (let ring = 0; ring < 4; ring++) {
        const o = 22 + ring * gap, L = 2 * (sw + sh + 4 * o), n = Math.ceil(L / 11);
        for (let i = 0; i < n; i++) {
          let d = i / n * L, x, y;
          const w2 = sw + 2 * o, h2 = sh + 2 * o;
          if (d < w2) { x = sx - o + d; y = sy - o; } else if ((d -= w2) < h2) { x = sx + sw + o; y = sy - o + d; }
          else if ((d -= h2) < w2) { x = sx + sw + o - d; y = sy + sh + o; } else { d -= w2; x = sx - o; y = sy + sh + o - d; }
          if (y < 104 || y > h - 8 || x < 8 || x > w - 400) continue;   // clear of the lockup (~96 px), the caption (360 + 24 + gap), the edge
          slots.push({ x, y, a: Math.atan2(y - cy, x - cx) });
        }
      }
      claim.poses(1, 0, P, ctx.swarm.list, S3);
      const ord = [...Array(N3).keys()].sort((i, j) => Math.atan2(P[i].y - cy, P[i].x - cx) - Math.atan2(P[j].y - cy, P[j].x - cx));
      slots.sort((a, b) => a.a - b.a);
      const step = slots.length / N3;
      ord.forEach((i, r) => { const s = slots[Math.floor(r * step) % slots.length]; T[i] = { x: s.x + (hash01(i, 71) - .5) * 6, y: s.y + (hash01(i, 72) - .5) * 6, face: Math.atan2(cy - s.y, cx - s.x) }; });
    },
    enter() {},
    exit() { ctx.layers.swarm.ctx.clearRect(0, 0, W, H); },
    update(q) { p = q; backdrop.scroll(def, p); tl.seek(p * 1000); render(); },
    tick() { render(); },
  };
  function c_caps() { return chap.el.caps; }

  function render() {
    if (!sheet) return;
    const t = ctx.clock.t;
    chap.update(p, { lockAlpha: 1 - clamp01((p - .9) / .06) });
    // the sheet
    const sheetA = clamp01((p - .2) / .04) * (1 - clamp01((p - .84) / .06));
    const g = g2; g.clearRect(0, 0, W, H);
    if (sheetA > 0) {
      const { sx, sy, sw, sh, top, cols, px, py, rad } = sheet;
      g.globalAlpha = sheetA;
      g.fillStyle = '#151514'; g.fillRect(sx, sy, sw, sh); g.strokeStyle = tok('--rule-c'); g.lineWidth = 1; g.strokeRect(sx + .5, sy + .5, sw - 1, sh - 1);
      const n = Math.round(st.fill * NB);
      g.fillStyle = tok('--grey-2');
      for (let i = 0; i < n; i++) { g.beginPath(); g.arc(sx + 16 + (i % cols + .5) * px, top + (Math.floor(i / cols) + .5) * py, rad, 0, TAU); g.fill(); }
      g.strokeStyle = '#3A3A37';
      for (let i = n; i < NB; i++) { g.beginPath(); g.arc(sx + 16 + (i % cols + .5) * px, top + (Math.floor(i / cols) + .5) * py, rad, 0, TAU); g.stroke(); }
      g.globalAlpha = 1;
    }
    el.head.style.opacity = sheetA.toFixed(3);
    const sa = st.stamp * (1 - clamp01((p - .84) / .06));
    el.stamp.style.opacity = clamp01(st.stamp * 3).toFixed(3) * (1 - clamp01((p - .84) / .06));
    el.stamp.style.transform = `translate(-50%, -50%) rotate(${-11 + (1 - st.stamp) * -8}deg) scale(${(1 + (1 - st.stamp) * .7).toFixed(3)})`;
    el.stamp.style.visibility = sa > .001 ? 'visible' : 'hidden';
    // the swarm: S3.5's last frame, out to the sheet's edge and home again
    claim.poses(1, t, P, ctx.swarm.list, S3);
    const dim = 1 - .78 * clamp01(p / .06) * (1 - clamp01((p - .16) / .06));
    const sw = ctx.layers.swarm.ctx; sw.clearRect(0, 0, W, H);
    const fg = tok('--roach'), red = tok('--accent');
    const draw = (pass) => {
      sw.fillStyle = sw.strokeStyle = pass ? red : fg;
      for (let i = 0; i < N3; i++) {
        const o = P[i], tg = T[i]; if (!tg) continue;
        const d = hash01(i, 73) * .5;
        const eo = ease.inOutCubic(clamp01(((p - OUT[0]) / (OUT[1] - OUT[0]) - d) / .5));
        const eh = ease.inOutCubic(clamp01(((p - HOME[0]) / (HOME[1] - HOME[0]) - d) / .5));
        const e = eo * (1 - eh), j = idle(i, t, 1.2);
        const x = lerp(o.x, tg.x + j.dx * e, e), y = lerp(o.y, tg.y + j.dy * e, e);
        const out = eo < 1 ? Math.atan2(tg.y - o.y, tg.x - o.x) : tg.face, back = Math.atan2(o.y - tg.y, o.x - tg.x);
        const moving = (eo > 0 && eo < 1) || (eh > 0 && eh < 1);
        const rot = e <= 0 ? o.rot : moving ? (eh > 0 ? back : out) : tg.face + j.dr;
        // walk phase rounded to whole leg cycles, so p 1 (eo = eh = 1) lands on the base pose exactly (handover)
        const cyc = TAU * Math.max(1, Math.round(2 * Math.hypot(tg.x - o.x, tg.y - o.y) / 5 * 1.3 / TAU)), legs = o.legs + (eo + eh) / 2 * cyc;
        const a = o.a * dim * (pass ? o.c : 1 - o.c);
        if (a > .01) { sw.globalAlpha = a; roach(sw, x, y, e > .02 && e < .98 ? rot : e >= .98 ? tg.face + j.dr : o.rot, o.s, legs); }
      }
    };
    draw(0); draw(1); sw.globalAlpha = 1;
  }
};

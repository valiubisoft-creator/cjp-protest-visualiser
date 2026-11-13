// S1 · The CJI quote and the click (prologue chat, 2026-11-12). Brief: docs/build/scenes/S1-S2.md.
//
// The stage is empty at p 0 (S0's roaches have wiped the title and dissolved). Quote and body copy in Redaction.
// TYPEWRITER (Vali 2026-11-12): the quote types itself character by character. Typed count = the larger of
//   scroll-driven  all characters by p 0.30 (so a scrubbed or deep-linked frame is complete and reproducible), and
//   time-driven    ~55 characters a second from entering S1 (idle reading; frozen under ?still; reset on leaving upward)
// The keyword types on a red dry-brush stroke that grows with it; the attribution follows the last character.
// p 0.38–0.46  the hint: a red brush ARROW draws in from "click the word" to the keyword (Vali 2026-11-12)
// p 0.55       THE CLICK GATE (Vali 2026-11-13, review 3: "the scroll stops till someone clicks on the word"): until the
//              keyword is clicked, scrolling down holds at p 0.55 (the quote typed, the hint drawn); scrolling up is free.
//              Leaving S1 downward any other way (scrollbar drag, End) snaps back to the gate.
// p 0.92       auto-trigger if the keyword hasn't been clicked: ONLY under ?still (the QA harness sweeps through S1)
//
// THE S2 TIMED SEQUENCE (spec S2; the determinism exception, spec §3). Click / Enter / Space on the keyword, or the
// auto-trigger, runs it on its own rAF clock (it runs under ?still too), with scroll locked (controller.lock, ≤ 3.2 s):
//      0–400 ms   keyword scales 1 → 1.15 (scale only: opening the letter-spacing would reflow the quote)
//      0–600      the rest of the quote and the hint fade
//    400–1400     the keyword and its brush collapse: their pixels stream to the centroid as particles; the roach fades
//                 in there (s 0 → 36), red, already facing along its path
//   1400–2400     it walks ONE curve (quadratic Bézier, heading = tangent) to the founder's resting spot; the curve ends
//                 on the resting heading, so it never flips; red crossfades to white 1400–1700
//   2000–3000     the portrait and label attach (spawn.label)
//   0–3200        the backdrop glides to its S2 p 0 offset (the scroll position the sequence hands over to)
//   3200          done: spawn.done = true, unlock, seek to S2 p 0 (the same frame)
// Done state (spawn.done) at S1 p > 0.5 shows that frame. Back to S1 p ≤ 0.5 resets done and restores the quote.
import { tok } from '../lib/dom.js';
import { esc } from '../lib/text.js';
import { star } from '../lib/star.js';
import { roach } from '../roach/roach.js';
import { hash01, clamp01, lerp, ease } from '../roach/swarm.js';
import { heroWord, backdrop, loadCss } from './s00-hero.js';
import { spawn } from './s02-spawn.js';

const CSS = new URL('./s01-quote.css', import.meta.url).href;
const fmtLong = iso => new Date(iso + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const AUTO = .92, GATE = .55, RESET = .5, SEQ_MS = 3200, TYPE_P = .3, CPS = 55, HINT = [.38, .46];
const seg = (ms, a, b) => clamp01((ms - a) / (b - a));
const chars = s => [...s].map(ch => /\s/.test(ch) ? ch : `<span class="c">${esc(ch)}</span>`).join('');

export default def => {
  let ctx, W = 0, H = 0, p = 0, typedT = 0, needLayout = true;
  let quote, segs = [], cs = [], kwCs = [], kw, kwRoach, kwg, kwBrush, hint, hintCv, hintTx, attr, arrow = null;
  let seq = null;                                         // the running sequence, or null
  const scene = {
    id: def.id,
    init(c) {
      ctx = c; loadCss(CSS);
      const q = c.data.meta.cji_quote, src = c.data.byId.source[q.source_id];
      // keyword: first whole-token, case-insensitive occurrence (spec S1)
      const re = new RegExp(`\\b(${q.keyword})\\b`, 'i'), m = re.exec(q.text);
      const before = m ? q.text.slice(0, m.index) : q.text, word = m ? m[1] : '', after = m ? q.text.slice(m.index + word.length) : '';
      c.root.classList.add('s1');
      if (c.clock.still) c.root.classList.add('is-still');
      c.root.insertAdjacentHTML('beforeend', `<div class="s1-quote">
        <blockquote cite="${esc(src?.url ?? '')}" aria-label="${esc('“' + q.text + '”')}"><span class="seg">${chars('“' + before)}</span>${m ? `<button class="kw" type="button" aria-label="Click the word ${esc(q.keyword)} to continue"><canvas class="kw-brush" aria-hidden="true"></canvas><span class="kw-t">${chars(word)}</span><canvas class="kw-roach" width="56" height="34" aria-hidden="true"></canvas></button>` : ''}<span class="seg">${chars(after + '”')}</span><span class="seg">${star(q.source_ids ?? q.source_id, c.data.byId.source, src?.publisher)}</span></blockquote>
        <div class="s1-attr"><b>${esc(q.speaker)}</b><span class="t-num">${esc(fmtLong(q.date))}</span><span>Source: ${esc(src?.publisher ?? '')}</span></div>
        <div class="s1-hint" aria-hidden="true"><canvas></canvas><span>click the word</span></div>
      </div>`);
      quote = c.root.querySelector('.s1-quote'); segs = [...quote.querySelectorAll('.seg')];
      cs = [...quote.querySelectorAll('blockquote .c')];
      kw = quote.querySelector('.kw'); kwCs = kw ? [...kw.querySelectorAll('.c')] : [];
      hint = quote.querySelector('.s1-hint'); hintCv = hint.querySelector('canvas'); hintTx = hint.querySelector('span');
      attr = quote.querySelector('.s1-attr');
      kwRoach = kw?.querySelector('.kw-roach'); kwBrush = kw?.querySelector('.kw-brush');
      if (kwRoach) { kwg = kwRoach.getContext('2d'); kwg.scale(2, 2); }
      kw?.addEventListener('click', () => start('click'));    // a <button>: Enter and Space click it too
    },
    resize(w, h) { W = w; H = h; needLayout = true; },
    enter() {},
    exit(dir) {
      if (seq) finish(false);                             // left mid-sequence (a deep link or a programmatic scroll)
      if (dir === 'up') { spawn.hide(); typedT = 0; }     // re-entering from S0 types the quote again
      if (dir === 'down' && gated()) hold();              // jumped past the gate without clicking: back to the word
      heroWord.hide();
      ctx.layers.swarm.ctx.clearRect(0, 0, W, H);
    },
    update(q) {
      p = q;
      if (seq) return;                                    // the sequence owns the frame (scroll is locked)
      backdrop.scroll(def, p);
      if (spawn.done && p <= RESET) spawn.done = false;   // spec S2: scrolling back above S1 p 0.5 restores the quote
      if (gated() && p > GATE) { p = GATE; hold(); }        // the gate: hold at the word until it is clicked
      if (!spawn.done && p >= AUTO && ctx.clock.still) { start('auto'); return; }
      render();
    },
    tick(t, dt) {
      if (seq) return;
      if (spawn.done) spawn.tf += dt; else typedT += dt;
      render();
    },
  };

  /* ── the click gate (not under ?still: QA sweeps through on the auto-trigger) ── */
  const gated = () => !ctx.clock.still && !spawn.done && !seq;
  let holding = false;
  function hold() {
    if (holding) return; holding = true;
    requestAnimationFrame(() => { holding = false; if (gated()) scrollTo(0, ctx.controller.yFor(def.id, GATE)); });
    kw?.classList.add('is-waiting');                      // nudge: the keyword pulses while the reader is held
  }

  /* ── layout-dependent pieces: the brush behind the keyword, the hint arrow ── */
  function layout() {
    if (!kw || !quote.offsetParent) return;
    needLayout = false;
    paintBrush();
    // the arrow: from just left of the hint text (above-right of the keyword) curving down onto the keyword
    const qr = quote.getBoundingClientRect(), kr = kw.getBoundingClientRect(), u = Math.min(1, H / 900);
    const T = { x: kr.left - qr.left + kr.width * .55, y: kr.top - qr.top - 4 };
    const A = { x: kr.right - qr.left + 70 * u, y: kr.top - qr.top - 78 * u };
    hintTx.style.left = A.x + 'px'; hintTx.style.top = (A.y - 14) + 'px';
    const S = { x: A.x - 10, y: A.y }, C = { x: T.x + 30 * u, y: S.y - 6 * u };
    const pad = 24, x0 = Math.min(S.x, T.x) - pad, y0 = Math.min(S.y, T.y, C.y) - pad, x1 = Math.max(S.x, T.x) + pad, y1 = Math.max(S.y, T.y) + pad;
    const d = Math.min(devicePixelRatio || 1, 2);
    Object.assign(hintCv.style, { left: x0 + 'px', top: y0 + 'px', width: (x1 - x0) + 'px', height: (y1 - y0) + 'px' });
    hintCv.width = Math.round((x1 - x0) * d); hintCv.height = Math.round((y1 - y0) * d);
    arrow = { S: { x: S.x - x0, y: S.y - y0 }, C: { x: C.x - x0, y: C.y - y0 }, T: { x: T.x - x0, y: T.y - y0 }, d, w: x1 - x0, h: y1 - y0 };
  }

  // a dry red brush stroke behind the keyword: a slightly tilted band with ragged ends and bristle streaks, seeded
  function paintBrush() {
    if (!kwBrush) return;
    const w = kwBrush.offsetWidth, h = kwBrush.offsetHeight, d = Math.min(devicePixelRatio || 1, 2);
    kwBrush.width = Math.round(w * d); kwBrush.height = Math.round(h * d);
    const g = kwBrush.getContext('2d'); g.setTransform(d, 0, 0, d, 0, 0); g.clearRect(0, 0, w, h);
    g.fillStyle = g.strokeStyle = tok('--accent');
    const R = k => hash01(k, 90), tilt = -.018, yAt = x => h * .5 + (x - w / 2) * tilt;
    for (let k = 0, lines = 46; k < lines; k++) {
      const v = (k + .5) / lines, y0 = h * (.1 + .8 * v), th = 1.4 + 2.6 * R(k);
      const x0 = w * (.01 + .07 * R(k + 100) + (v < .15 || v > .85 ? .05 : 0)), x1 = w * (.99 - .06 * R(k + 200) - (v < .15 || v > .85 ? .07 : 0));
      g.lineWidth = th; g.lineCap = 'round'; g.beginPath();
      const gaps = R(k + 300) < .35 ? 2 : 0, L = (x1 - x0) / (gaps + 1); let x = x0;
      g.moveTo(x, y0 + yAt(x) - h / 2);
      for (let q = 0; q <= gaps; q++) {
        const xe = x + L * (q === gaps ? 1 : .82 + .1 * R(k * 7 + q));
        g.lineTo(xe, y0 + yAt(xe) - h / 2 + (R(k + q + 400) - .5) * 1.5);
        x += L; if (q < gaps) g.moveTo(x, y0 + yAt(x) - h / 2);
      }
      g.stroke();
    }
    g.globalAlpha = .9; g.beginPath();
    g.moveTo(w * .05, yAt(w * .05) - h * .3); g.lineTo(w * .96, yAt(w * .96) - h * .28); g.lineTo(w * .95, yAt(w * .95) + h * .3); g.lineTo(w * .06, yAt(w * .06) + h * .32); g.closePath(); g.fill();
    g.globalAlpha = 1;
  }

  // the brush arrow, drawn up to r (0…1): bristle strokes along the curve, then a two-stroke head
  function drawArrow(r) {
    if (!arrow) return;
    const { S, C, T, d, w, h } = arrow, g = hintCv.getContext('2d');
    g.setTransform(d, 0, 0, d, 0, 0); g.clearRect(0, 0, w, h);
    if (r <= 0) return;
    g.strokeStyle = tok('--accent'); g.lineCap = 'round';
    const bz = t => [(1 - t) ** 2 * S.x + 2 * (1 - t) * t * C.x + t * t * T.x, (1 - t) ** 2 * S.y + 2 * (1 - t) * t * C.y + t * t * T.y];
    const N = 40, end = Math.max(1, Math.round(N * Math.min(1, r / .8)));
    for (let k = 0; k < 7; k++) {                          // bristles: offset copies, thinner and broken toward the tip
      const o = (k - 3) * .9, th = 3.2 - Math.abs(k - 3) * .65;
      g.lineWidth = th; g.globalAlpha = .55 + .45 * hash01(k, 95); g.beginPath();
      for (let q = 0; q <= end; q++) {
        const t = q / N, [x, y] = bz(t), [x2, y2] = bz(Math.min(1, t + .01)), a = Math.atan2(y2 - y, x2 - x);
        const ox = -Math.sin(a) * o * (1 - t * .6), oy = Math.cos(a) * o * (1 - t * .6);
        if (q && hash01(k * 100 + q, 96) < .06 + .12 * t) { g.moveTo(x + ox, y + oy); continue; }   // dry gaps
        q ? g.lineTo(x + ox, y + oy) : g.moveTo(x + ox, y + oy);
      }
      g.stroke();
    }
    g.globalAlpha = 1;
    const hr = clamp01((r - .8) / .2);
    if (hr > 0) {                                          // the head: two short strokes back from the tip
      const [xa, ya] = bz(.92), a = Math.atan2(T.y - ya, T.x - xa), L = 16 * hr;
      g.lineWidth = 3.4;
      for (const s of [-1, 1]) { g.beginPath(); g.moveTo(T.x, T.y); g.lineTo(T.x - Math.cos(a + s * .55) * L, T.y - Math.sin(a + s * .55) * L); g.stroke(); }
    }
  }

  // the small roach walking along the bottom of the brush: ping-pong ~30 px/s; at t = 0 it sits at 62%
  function kwIdle(t) {
    if (!kwg) return;
    const span = Math.max(1, kw.offsetWidth - 28), v = 30 / span;
    let u = (.62 + t * v) % 2; const back = u > 1; if (back) u = 2 - u;
    kwRoach.style.left = (u * span) + 'px';
    kwg.clearRect(0, 0, 28, 17);
    kwg.fillStyle = kwg.strokeStyle = tok('--accent');
    roach(kwg, 14, 8.5, back ? Math.PI : 0, 7, 1.2 + t * 9);
    const k = Math.floor(t * 8);                          // 1 px idle jitter, stepped at 8 Hz
    kw.style.transform = t ? `translate(${(hash01(k, 70) - .5) * 1.2}px, ${(hash01(k, 71) - .5) * 1.2}px)` : '';
  }

  /* ── scroll-driven frame (quote, or the done state) ── */
  function render() {
    const g = ctx.layers.swarm.ctx;
    g.clearRect(0, 0, W, H);
    heroWord.hide();
    if (spawn.done) {                                    // after the sequence: S2's p 0 frame
      quote.style.visibility = 'hidden'; quote.style.opacity = '0';   // opacity too: typed .c.on chars set visibility: visible
      spawn.drawDone(g, 1);
      return;
    }
    spawn.hide();
    quote.style.visibility = ''; quote.style.opacity = '';
    if (needLayout) layout();
    kw.style.opacity = ''; attr.style.transform = '';
    for (const sg of segs) sg.style.opacity = '';          // undo a finished sequence's fade (replay after reset)
    // the typewriter
    const N = cs.length, raw = Math.max(N * p / TYPE_P, typedT * CPS), n = Math.min(N, Math.floor(raw));
    cs.forEach((c, k) => { c.classList.toggle('on', k < n); c.classList.toggle('cur', k === n - 1 && n < N); });
    const kwFirst = kwCs.length ? cs.indexOf(kwCs[0]) : 0, kwN = clamp01((n - kwFirst) / Math.max(1, kwCs.length));
    if (kwBrush) kwBrush.style.clipPath = `inset(0 ${100 * (1 - kwN)}% 0 0)`;
    if (kwRoach) kwRoach.style.visibility = kwN >= 1 ? '' : 'hidden';
    kwIdle(kwN >= 1 ? ctx.clock.t : 0);
    attr.style.opacity = clamp01((raw - N) / 12);
    segs.at(-1).style.opacity = n >= N ? 1 : 0;           // the * appears with the closing quote mark
    // the hint arrow
    const r = clamp01((p - HINT[0]) / (HINT[1] - HINT[0]));
    drawArrow(r); hint.style.visibility = r > 0 ? '' : 'hidden'; hintTx.style.opacity = clamp01((r - .55) / .3);
  }

  /* ── the timed sequence ── */
  function start(why) {
    if (seq || spawn.done || !kw) return;
    ctx.controller.lock({ maxMs: SEQ_MS });
    for (const c of cs) c.classList.add('on');            // whatever the typewriter had left, it is all there now
    attr.style.opacity = 1; segs.at(-1).style.opacity = 1;
    if (kwBrush) kwBrush.style.clipPath = '';
    // particles: the keyword's letter pixels (white) and its brush stroke (red), sampled from the live layout
    const kt = kw.querySelector('.kw-t'), kr = kt.getBoundingClientRect(), st = getComputedStyle(kt);
    const c = document.createElement('canvas'), pw = Math.ceil(kr.width) + 8, ph = Math.ceil(kr.height) + 8;
    c.width = pw; c.height = ph;
    const x = c.getContext('2d', { willReadFrequently: true });
    x.font = `${st.fontWeight} ${st.fontSize} ${st.fontFamily}`; x.textBaseline = 'middle'; x.fillStyle = '#000';
    x.fillText(kt.textContent, 4, ph / 2);
    const data = x.getImageData(0, 0, pw, ph).data, pts = [];
    for (let j = 0; j < ph; j += 3) for (let i = 0; i < pw; i += 3) if (data[(j * pw + i) * 4 + 3] > 140) pts.push([kr.left - 4 + i, kr.top - 4 + j, 0]);
    if (kwBrush && kwBrush.width) {
      const br = kwBrush.getBoundingClientRect(), bd = kwBrush.getContext('2d').getImageData(0, 0, kwBrush.width, kwBrush.height).data, sx = kwBrush.width / br.width;
      for (let j = 0; j < br.height; j += 5) for (let i = 0; i < br.width; i += 5) if (bd[(Math.round(j * sx) * kwBrush.width + Math.round(i * sx)) * 4 + 3] > 120) pts.push([br.left + i, br.top + j, 1]);
    }
    const cx = kr.left + kr.width / 2, cy = kr.top + kr.height / 2;
    const dmax = Math.max(1, ...pts.map(q => Math.hypot(q[0] - cx, q[1] - cy)));
    const off0 = backdrop.offset(def.id, p), off1 = backdrop.offset('S2', 0);
    seq = { why, t0: performance.now(), pts, cx, cy, dmax, raf: 0, off0, off1 };
    spawn.tf = 0;
    if (ctx.debug) console.log(`[S1] sequence start (${why})`);
    seq.raf = requestAnimationFrame(step);
  }
  function step() {
    if (!seq) return;
    const ms = performance.now() - seq.t0;
    drawSeq(ms);
    if (ms >= SEQ_MS) return finish(true);
    seq.raf = requestAnimationFrame(step);
  }
  function drawSeq(ms) {
    const g = ctx.layers.swarm.ctx, red = tok('--accent');
    backdrop.draw(lerp(seq.off0, seq.off1, ease.inOutSine(seg(ms, 0, SEQ_MS))));
    g.clearRect(0, 0, W, H);
    const em = ease.outCubic(seg(ms, 0, 400)), fade = 1 - seg(ms, 0, 600);
    kw.style.transform = `scale(${1 + .15 * em})`;
    kw.style.opacity = 1 - seg(ms, 400, 450);
    for (const s of segs) s.style.opacity = fade;
    attr.style.opacity = fade; hint.style.opacity = fade;
    if (kwRoach) kwRoach.style.opacity = 1 - seg(ms, 0, 200);
    const { pts, cx, cy, dmax } = seq;
    if (ms >= 400 && ms < 1400) {                         // collapse: particles stream to the centroid, inner first
      const white = tok('--fg');
      for (const [px, py, isBrush] of pts) {
        const ox = cx + (px - cx) * 1.15, oy = cy + (py - cy) * 1.15;
        const f = Math.hypot(px - cx, py - cy) / dmax, tt = ease.inOutCubic(seg(ms, 400 + 300 * f, 1000 + 300 * f));
        if (tt >= 1) continue;
        const sz = 3 * (1 - tt * .7);
        g.fillStyle = isBrush ? red : white; g.globalAlpha = 1 - tt * tt;
        g.fillRect(lerp(ox, cx, tt) - sz / 2, lerp(oy, cy, tt) - sz / 2, sz, sz);
      }
      g.globalAlpha = 1;
    }
    if (ms >= 900) {                                      // the founder: forms, then walks one curve to its spot
      const grow = ease.outCubic(seg(ms, 900, 1400)), walk = ease.inOutSine(seg(ms, 1400, 2400));
      spawn.tf = Math.max(0, ms - 2400) / 1000;
      const S = spawn.size(), P0 = spawn.pose(0);
      const L = Math.hypot(P0.x - cx, P0.y - cy) * .55;
      const qx = P0.x - Math.cos(P0.rot) * L, qy = P0.y - Math.sin(P0.rot) * L;
      const bz = t => [(1 - t) ** 2 * cx + 2 * (1 - t) * t * qx + t * t * P0.x, (1 - t) ** 2 * cy + 2 * (1 - t) * t * qy + t * t * P0.y];
      const tan = t => Math.atan2(2 * (1 - t) * (qy - cy) + 2 * t * (P0.y - qy), 2 * (1 - t) * (qx - cx) + 2 * t * (P0.x - qx));
      const arc = t => { let a = 0, [x0, y0] = bz(0); for (let k = 1; k <= 24; k++) { const [x1, y1] = bz(t * k / 24); a += Math.hypot(x1 - x0, y1 - y0); x0 = x1; y0 = y1; } return a; };
      let x, y, rot, legs;
      if (ms < 2400) {
        [x, y] = bz(walk); rot = tan(walk) + (ms < 1400 ? Math.sin(ms / 90) * .18 * (1 - seg(ms, 1200, 1400)) : 0);
        legs = spawn.legs0 - arc(1) / S * 1.2 + arc(walk) / S * 1.2 + (ms < 1400 ? Math.sin(ms / 70) * .6 : 0);
      } else { const P = spawn.pose(); x = P.x; y = P.y; rot = P.rot; legs = P.legs; }
      const toWhite = seg(ms, 1400, 1700);
      g.globalAlpha = grow * (1 - toWhite); g.fillStyle = g.strokeStyle = red; if (toWhite < 1) roach(g, x, y, rot, S * grow, legs);
      g.globalAlpha = grow * toWhite; g.fillStyle = g.strokeStyle = tok('--roach'); if (toWhite > 0) roach(g, x, y, rot, S * grow, legs);
      g.globalAlpha = 1;
    }
    const la = ease.outCubic(seg(ms, 2000, 3000));        // portrait + label attach (drawn by spawn: the done-state label)
    if (la > 0) { spawn.label(la); spawn.lead(g, la); } else spawn.hide();
  }
  function finish(natural) {
    if (!seq) return;
    cancelAnimationFrame(seq.raf);
    const why = seq.why; seq = null;
    spawn.done = true;
    spawn.tf = (SEQ_MS - 2400) / 1000;
    kw.style.transform = ''; kw.style.opacity = ''; hint.style.opacity = '';
    if (kwRoach) kwRoach.style.opacity = '';
    ctx.controller.unlock();
    if (ctx.debug) console.log(`[S1] sequence done (${why}${natural ? '' : ', cut short'})`);
    if (!natural) return;
    const y2 = ctx.controller.yFor('S2', 0);              // hand the reader to S2 p 0 (the same picture)
    if (scrollY < y2) ctx.controller.seek('S2', 0); else render();
  }
  return scene;
};

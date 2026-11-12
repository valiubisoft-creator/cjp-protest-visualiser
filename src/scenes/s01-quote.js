// S1 · The CJI quote and the click (prologue chat, 2026-11-12). Brief: docs/build/scenes/S1-S2.md.
//
// p 0.00–0.15  the quote enters (24 px rise, words staggered); the hero swarm continues behind at 25% opacity and 40%
//              count (= S0 p 1; S0 has cleaned the title away). Quote and body copy in Redaction (Vali 2026-11-12).
// p 0.15–0.90  hold; the keyword sits on a red brush stroke and idles (1 px jitter, a small roach crawls along the bottom
//              of the stroke); hint "click the word" from 0.40
// p 0.92       auto-trigger if the keyword hasn't been clicked
//
// THE S2 TIMED SEQUENCE (spec S2; the determinism exception, spec §3). Click / Enter / Space on the keyword, or the
// auto-trigger, runs it on its own rAF clock (it runs under ?still too), with scroll locked (controller.lock, ≤ 3.2 s):
//      0–400 ms   keyword scales 1 → 1.15 (spec also opens the letter-spacing; dropped: it reflows the quote)
//      0–600      the rest of the quote fades; the hero swarm speeds up and crawls off the nearest edges
//    400–1400     the keyword collapses: its letter pixels stream to the centroid as particles; the roach fades in
//                 there (s 0 → 36) and starts crawling
//   1400–2400     the roach walks to the lower third (the founder's resting spot)
//   2000–3000     the label attaches ("<founder> is spawned", *, attribution)
//   3200          done: spawn.done = true, unlock, and seek to S2 p 0 (the same frame)
// Done state (spawn.done) at S1 p > 0.5 shows that frame. Scrolling back to S1 p ≤ 0.5 resets done and restores the
// quote; the sequence can then be replayed. Leaving S1 downward mid-sequence finishes it at once.
import { tok } from '../lib/dom.js';
import { esc } from '../lib/text.js';
import { star } from '../lib/star.js';
import { roach } from '../roach/roach.js';
import { hash01, heroCount, heroSize, wander, clamp01, lerp, ease, angDiff, TAU } from '../roach/swarm.js';
import { heroWord, heroState, loadCss } from './s00-hero.js';
import { spawn } from './s02-spawn.js';

const CSS = new URL('./s01-quote.css', import.meta.url).href;
const fmtLong = iso => new Date(iso + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const AUTO = .92, RESET = .5, SEQ_MS = 3200;
const seg = (ms, a, b) => clamp01((ms - a) / (b - a));

export default def => {
  let ctx, W = 0, H = 0, p = 0, needHint = true, quote, words = [], others = [], kw, kwRoach, kwg, kwBrush, hint, attr;
  let seq = null;                                         // the running sequence, or null
  const pose = {}, END = heroState(1);
  const scene = {
    id: def.id,
    init(c) {
      ctx = c; loadCss(CSS);
      const q = c.data.meta.cji_quote, src = c.data.byId.source[q.source_id];
      // keyword: first whole-token, case-insensitive occurrence (spec S1)
      const re = new RegExp(`\\b(${q.keyword})\\b`, 'i'), m = re.exec(q.text);
      const before = m ? q.text.slice(0, m.index) : q.text, word = m ? m[1] : '', after = m ? q.text.slice(m.index + word.length) : '';
      const spans = s => s.split(/(\s+)/).map(t => /^\s+$/.test(t) || !t ? t : `<span class="w">${esc(t)}</span>`).join('');
      c.root.classList.add('s1');
      c.root.insertAdjacentHTML('beforeend', `<div class="s1-quote">
        <blockquote cite="${esc(src?.url ?? '')}">${spans('“' + before)}${m ? `<button class="kw w" type="button" aria-label="Click the word ${esc(q.keyword)} to continue"><canvas class="kw-brush" aria-hidden="true"></canvas><span class="kw-t">${esc(word)}</span><canvas class="kw-roach" width="56" height="34" aria-hidden="true"></canvas></button>` : ''}${spans(after + '”')}<span class="w">${star(q.source_ids ?? q.source_id, c.data.byId.source, src?.publisher)}</span></blockquote>
        <div class="s1-attr w"><b>${esc(q.speaker)}</b><span class="t-num">${esc(fmtLong(q.date))}</span><span>Source: ${esc(src?.publisher ?? '')}</span></div>
        <div class="s1-hint t-micro" aria-hidden="true">click the word</div>
      </div>`);
      quote = c.root.querySelector('.s1-quote'); words = [...quote.querySelectorAll('.w')];
      kw = quote.querySelector('.kw'); hint = quote.querySelector('.s1-hint'); attr = quote.querySelector('.s1-attr');
      others = words.filter(w => w !== kw);
      kwRoach = kw?.querySelector('.kw-roach');
      if (kwRoach) { kwg = kwRoach.getContext('2d'); kwg.scale(2, 2); }
      kwBrush = kw?.querySelector('.kw-brush');
      kw?.addEventListener('click', () => start('click'));    // a <button>: Enter and Space click it too
    },
    resize(w, h) { W = w; H = h; needHint = true; },
    enter() {},
    exit(dir) {
      if (seq) finish(false);                             // left mid-sequence (a deep link or a programmatic scroll)
      heroWord.hide();
      if (dir === 'up') spawn.hide();
      ctx.layers.swarm.ctx.clearRect(0, 0, W, H);
    },
    update(q) {
      p = q;
      if (seq) return;                                    // the sequence owns the frame (scroll is locked)
      if (spawn.done && p <= RESET) spawn.done = false;   // spec S2: scrolling back above S1 p 0.5 restores the quote
      if (!spawn.done && p >= AUTO) { start('auto'); return; }
      render();
    },
    tick(t, dt) {
      if (seq) return;
      if (spawn.done) spawn.tf += dt; else ctx.swarm.tau += dt * END.rate;
      render();
    },
  };

  // "click the word" sits above the keyword, its rule pointing at it
  function placeHint() {
    if (!kw || !quote.offsetParent) return;
    needHint = false;
    const qr = quote.getBoundingClientRect(), kr = kw.getBoundingClientRect();
    hint.style.left = (kr.left - qr.left) + 'px';
    hint.style.top = (kr.top - qr.top - 40 * Math.min(1, H / 900)) + 'px';
    paintBrush();
  }

  // a dry red brush stroke behind the keyword (Vali 2026-11-12): a slightly tilted band with ragged ends and bristle
  // streaks, seeded so it is the same every time. Drawn once per layout into .kw-brush (CSS sizes it round the word).
  function paintBrush() {
    if (!kwBrush) return;
    const w = kwBrush.offsetWidth, h = kwBrush.offsetHeight, d = Math.min(devicePixelRatio || 1, 2);
    kwBrush.width = Math.round(w * d); kwBrush.height = Math.round(h * d);
    const g = kwBrush.getContext('2d'); g.setTransform(d, 0, 0, d, 0, 0); g.clearRect(0, 0, w, h);
    g.fillStyle = g.strokeStyle = tok('--accent');
    const R = k => hash01(k, 90), tilt = -.018, yAt = x => h * .5 + (x - w / 2) * tilt;
    // body: many overlapping bristle lines of varying length and thickness
    const lines = 46;
    for (let k = 0; k < lines; k++) {
      const v = (k + .5) / lines, y0 = h * (.1 + .8 * v), th = 1.4 + 2.6 * R(k);
      const x0 = w * (.01 + .07 * R(k + 100) + (v < .15 || v > .85 ? .05 : 0)), x1 = w * (.99 - .06 * R(k + 200) - (v < .15 || v > .85 ? .07 : 0));
      g.lineWidth = th; g.lineCap = 'round'; g.beginPath();
      // a bristle runs dry: broken into 1–3 dashes near the end
      const gaps = R(k + 300) < .35 ? 2 : 0; let x = x0;
      g.moveTo(x, y0 + yAt(x) - h / 2);
      const seg = (x1 - x0) / (gaps + 1);
      for (let q = 0; q <= gaps; q++) {
        const xe = x + seg * (q === gaps ? 1 : .82 + .1 * R(k * 7 + q));
        g.lineTo(xe, y0 + yAt(xe) - h / 2 + (R(k + q + 400) - .5) * 1.5);
        x = x + seg; if (q < gaps) g.moveTo(x, y0 + yAt(x) - h / 2);
      }
      g.stroke();
    }
    // a solid core so the white word always sits on red (contrast)
    g.globalAlpha = .9; g.beginPath();
    g.moveTo(w * .05, yAt(w * .05) - h * .3); g.lineTo(w * .96, yAt(w * .96) - h * .28); g.lineTo(w * .95, yAt(w * .95) + h * .3); g.lineTo(w * .06, yAt(w * .06) + h * .32); g.closePath(); g.fill();
    g.globalAlpha = 1;
  }

  // the small roach walking the keyword's underline: ping-pong at ~30 px/s; at t = 0 it sits at 62% (storyboard)
  function kwIdle(t) {
    if (!kwg) return;
    const kwW = kw.offsetWidth, span = Math.max(1, kwW - 28), v = 30 / span;
    let u = (.62 + t * v) % 2; const back = u > 1; if (back) u = 2 - u;
    kwRoach.style.left = (u * span) + 'px';
    kwg.clearRect(0, 0, 28, 17);
    kwg.fillStyle = kwg.strokeStyle = tok('--accent');
    roach(kwg, 14, 8.5, back ? Math.PI : 0, 7, 1.2 + t * 9);
    // 1 px idle jitter, stepped at 8 Hz so it reads as a twitch, not a wobble
    const k = Math.floor(t * 8);
    kw.style.transform = t ? `translate(${(hash01(k, 70) - .5) * 1.2}px, ${(hash01(k, 71) - .5) * 1.2}px)` : '';
  }

  /* ── scroll-driven frame (quote, or the done state) ── */
  function render() {
    const g = ctx.layers.swarm.ctx;
    g.clearRect(0, 0, W, H);
    if (spawn.done) {                                    // after the sequence: S2's p 0 frame
      quote.style.visibility = 'hidden'; heroWord.hide();
      spawn.drawDone(g, 1);
      return;
    }
    spawn.hide();
    quote.style.visibility = '';
    if (needHint) placeHint();
    kw.style.opacity = ''; kw.style.letterSpacing = ''; attr.style.opacity = '';
    kwIdle(ctx.clock.t);
    // the quote enters over p 0–0.15: container rises 24 px, words fade in staggered
    const e = ease.outCubic(clamp01(p / .15));
    quote.style.transform = `translateY(${24 * (1 - e)}px)`;
    const n = words.length;
    words.forEach((w, k) => { w.style.opacity = clamp01((p - .1 * k / n) / .05); });
    hint.style.opacity = clamp01((p - .38) / .04);
    heroWord.hide();                                     // S0 has cleaned the word away by its p 1
    drawHero(g, 0);
  }

  // the hero swarm at S0's end state (40% count, 25% opacity). flee 0…1: crawl off the nearest edge (sequence)
  function drawHero(g, flee) {
    const tau = ctx.swarm.tau, list = ctx.swarm.list, nn = heroCount(W, H);
    g.fillStyle = g.strokeStyle = tok('--roach');
    for (let i = 0; i < nn; i++) {
      const h = hash01(i, 22); if (h >= END.density) continue;
      wander(i, tau, W, H, pose);
      let x = pose.x + list[i].fx, y = pose.y + list[i].fy, rot = pose.rot, legs = pose.legs, a = clamp01((END.density - h) / .04) * END.swarmAlpha;
      if (flee > 0) {
        // nearest edge, straight out; speeding up (ease in), turning first
        const d = [x, W - x, y, H - y], k = d.indexOf(Math.min(...d)), out = [Math.PI, 0, -Math.PI / 2, Math.PI / 2][k];
        const f = clamp01(flee * (1 + .4 * hash01(i, 72))), dist = (d[k] + 40) * f * f;
        x += Math.cos(out) * dist; y += Math.sin(out) * dist;
        rot = rot + angDiff(rot, out) * clamp01(f * 4); legs += dist / 3;
      }
      g.globalAlpha = a; roach(g, x, y, rot, heroSize(i), legs);
    }
    g.globalAlpha = 1;
  }

  /* ── the timed sequence ── */
  function start(why) {
    if (seq || spawn.done || !kw) return;
    ctx.controller.lock({ maxMs: SEQ_MS });
    // particles: the keyword's letter pixels (white) and its brush stroke (red), sampled from the live layout
    const kt = kw.querySelector('.kw-t'), kr = kt.getBoundingClientRect(), cs = getComputedStyle(kt);
    const c = document.createElement('canvas'), pw = Math.ceil(kr.width) + 8, ph = Math.ceil(kr.height) + 8;
    c.width = pw; c.height = ph;
    const x = c.getContext('2d', { willReadFrequently: true });
    x.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`; x.textBaseline = 'middle'; x.fillStyle = '#000';
    x.fillText(kt.textContent, 4, ph / 2);
    const data = x.getImageData(0, 0, pw, ph).data, pts = [], STEP = 3;
    for (let j = 0; j < ph; j += STEP) for (let i = 0; i < pw; i += STEP) if (data[(j * pw + i) * 4 + 3] > 140) pts.push([kr.left - 4 + i, kr.top - 4 + j, 0]);
    if (kwBrush) {
      const br = kwBrush.getBoundingClientRect(), bd = kwBrush.getContext('2d').getImageData(0, 0, kwBrush.width, kwBrush.height).data, sx = kwBrush.width / br.width, BS = 5;
      for (let j = 0; j < br.height; j += BS) for (let i = 0; i < br.width; i += BS) if (bd[((Math.round(j * sx)) * kwBrush.width + Math.round(i * sx)) * 4 + 3] > 120) pts.push([br.left + i, br.top + j, 1]);
    }
    const cx = kr.left + kr.width / 2, cy = kr.top + kr.height / 2;
    const dmax = Math.max(1, ...pts.map(q => Math.hypot(q[0] - cx, q[1] - cy)));
    seq = { why, t0: performance.now(), pts, cx, cy, dmax, raf: 0, tf0: 0 };
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
    g.clearRect(0, 0, W, H);
    heroWord.hide(); hint.style.opacity = 0;
    // 0–400 keyword emphasis; 0–600 the rest fades; 400–450 the keyword hands over to its particles
    const em = ease.outCubic(seg(ms, 0, 400)), fade = 1 - seg(ms, 0, 600);
    kw.style.transform = `scale(${1 + .15 * em})`;   // scale only: opening the letter-spacing would reflow the paragraph
    kw.style.opacity = 1 - seg(ms, 400, 450);           // brush + word hand over to their particles
    for (const w of others) w.style.opacity = fade;
    attr.style.opacity = fade;
    if (kwRoach) kwRoach.style.opacity = 1 - seg(ms, 0, 200);
    // the hero swarm runs for the edges
    drawHero(g, seg(ms, 0, 900));
    // collapse: particles stream to the centroid (inner first), shrinking as they arrive
    const { pts, cx, cy, dmax } = seq;
    if (ms >= 400 && ms < 1400) {
      const white = tok('--fg');
      for (const [px, py, isBrush] of pts) {
        g.fillStyle = isBrush ? red : white;
        const sc = 1.15, ox = cx + (px - cx) * sc, oy = cy + (py - cy) * sc;
        const f = Math.hypot(px - cx, py - cy) / dmax, tt = ease.inOutCubic(seg(ms, 400 + 300 * f, 1000 + 300 * f));
        if (tt >= 1) continue;
        const sz = 3 * (1 - tt * .7);
        g.globalAlpha = 1 - tt * tt;
        g.fillRect(lerp(ox, cx, tt) - sz / 2, lerp(oy, cy, tt) - sz / 2, sz, sz);
      }
      g.globalAlpha = 1;
    }
    // the roach: fades in at the centroid (900–1400) already facing along its path, then crawls (1400–2400) along ONE
    // curved path (quadratic Bézier) to the founder's resting spot, its heading always the path's tangent; the curve's
    // end tangent is the resting heading, so it arrives without turning (Vali 2026-11-12: no sudden flip)
    if (ms >= 900) {
      const grow = ease.outCubic(seg(ms, 900, 1400)), walk = ease.inOutSine(seg(ms, 1400, 2400));
      spawn.tf = Math.max(0, ms - 2400) / 1000;
      const S = spawn.size(), P0 = spawn.pose(0);
      const L = Math.hypot(P0.x - cx, P0.y - cy) * .55;
      const qx = P0.x - Math.cos(P0.rot) * L, qy = P0.y - Math.sin(P0.rot) * L;   // control point behind the end heading
      const bz = t => [(1 - t) ** 2 * cx + 2 * (1 - t) * t * qx + t * t * P0.x, (1 - t) ** 2 * cy + 2 * (1 - t) * t * qy + t * t * P0.y];
      const tan = t => Math.atan2(2 * (1 - t) * (qy - cy) + 2 * t * (P0.y - qy), 2 * (1 - t) * (qx - cx) + 2 * t * (P0.x - qx));
      // arc length so far (for the leg cycle), by sampling
      const arc = t => { let a = 0, [x0, y0] = bz(0); for (let k = 1; k <= 24; k++) { const [x1, y1] = bz(t * k / 24); a += Math.hypot(x1 - x0, y1 - y0); x0 = x1; y0 = y1; } return a; };
      let x, y, rot, legs;
      if (ms < 2400) {
        [x, y] = bz(walk); rot = tan(walk) + (ms < 1400 ? Math.sin(ms / 90) * .18 * (1 - seg(ms, 1200, 1400)) : 0);
        legs = spawn.legs0 - arc(1) / S * 1.2 + arc(walk) / S * 1.2 + (ms < 1400 ? Math.sin(ms / 70) * .6 : 0);
      } else { const P = spawn.pose(); x = P.x; y = P.y; rot = P.rot; legs = P.legs; }
      // red while it forms, crossfading to the swarm's white as it starts to walk
      const toWhite = seg(ms, 1400, 1700);
      g.globalAlpha = grow * (1 - toWhite); g.fillStyle = g.strokeStyle = red; if (toWhite < 1) roach(g, x, y, rot, S * grow, legs);
      g.globalAlpha = grow * toWhite; g.fillStyle = g.strokeStyle = tok('--roach'); if (toWhite > 0) roach(g, x, y, rot, S * grow, legs);
      g.globalAlpha = 1;
    }
    // the label attaches 2000–3000 (text and lead line together; drawn by spawn so it is the done-state label)
    const la = ease.outCubic(seg(ms, 2000, 3000));
    if (la > 0) { spawn.label(la); drawLead(g, la); } else spawn.hide();
  }
  function drawLead(g, la) {
    const P = spawn.pose(), s = spawn.spot(), u = spawn.u(), a = -24 * Math.PI / 180;
    g.save(); g.globalAlpha = la; g.strokeStyle = tok('--fg'); g.lineWidth = 1; g.beginPath();
    g.moveTo(P.x + 64 * u, P.y - 40 * u); g.lineTo(s.x + 64 * u + 120 * u * Math.cos(a), s.y - 40 * u + 120 * u * Math.sin(a)); g.stroke(); g.restore();
  }
  function finish(natural) {
    if (!seq) return;
    cancelAnimationFrame(seq.raf);
    const why = seq.why; seq = null;
    spawn.done = true;
    spawn.tf = (SEQ_MS - 2400) / 1000;
    kw.style.transform = ''; kw.style.letterSpacing = ''; kw.style.opacity = '';
    if (kwRoach) kwRoach.style.opacity = '';
    ctx.controller.unlock();
    if (ctx.debug) console.log(`[S1] sequence done (${why}${natural ? '' : ', cut short'})`);
    if (!natural) return;
    // hand the reader to S2 p 0 (the same picture), unless they are already past it
    const y2 = ctx.controller.yFor('S2', 0);
    if (scrollY < y2) ctx.controller.seek('S2', 0); else render();
  }
  return scene;
};

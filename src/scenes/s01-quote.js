// S1 · The CJI quote and the click (prologue chat, 2026-11-12). Brief: docs/build/scenes/S1-S2.md.
//
// p 0.00–0.15  the quote enters (opacity, 24 px rise, words staggered); the hero word left over from S0 fades out
//              (p 0–0.12); the hero swarm continues behind at 25% opacity and 40% count (= S0 p 1)
// p 0.15–0.90  hold; the keyword idles (a small roach crawls its underline); hint "click the word" from p 0.40
// p 0.92       auto-trigger if the keyword hasn't been clicked
// Click / Enter / Space on the keyword starts the S2 timed sequence (scroll locked ≤ 3.2 s); it ends on S2's p 0
// frame and seeks there. Done state (spawn.done) above p 0.5: the founder frame. At or below p 0.5 (scrolling
// back up) done resets and the quote returns (spec S2).
import { tok } from '../lib/dom.js';
import { esc } from '../lib/text.js';
import { star } from '../lib/star.js';
import { roach } from '../roach/roach.js';
import { hash01, heroCount, heroSize, wander, clamp01, ease } from '../roach/swarm.js';
import { heroWord, heroState, loadCss } from './s00-hero.js';
import { spawn } from './s02-spawn.js';

const CSS = new URL('./s01-quote.css', import.meta.url).href;
const fmtLong = iso => new Date(iso + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

export default def => {
  let ctx, W = 0, H = 0, p = 0, needHint = true, quote, words = [], kw, kwRoach, hint;
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
        <blockquote cite="${esc(src?.url ?? '')}">${spans('“' + before)}${m ? `<button class="kw w" type="button" aria-label="Click the word ${esc(q.keyword)} to continue">${esc(word)}<canvas class="kw-roach" width="56" height="34" aria-hidden="true"></canvas></button>` : ''}${spans(after + '”')}${star(q.source_ids ?? q.source_id, c.data.byId.source, src?.publisher)}</blockquote>
        <div class="s1-attr w"><b>${esc(q.speaker)}</b><span class="t-num">${esc(fmtLong(q.date))}</span><span>Source: ${esc(src?.publisher ?? '')}</span></div>
        <div class="s1-hint t-micro" aria-hidden="true">click the word</div>
      </div>`);
      quote = c.root.querySelector('.s1-quote'); words = [...quote.querySelectorAll('.w')];
      kw = quote.querySelector('.kw'); hint = quote.querySelector('.s1-hint');
      kwRoach = kw?.querySelector('.kw-roach');
      if (kwRoach) { const g = kwRoach.getContext('2d'); g.scale(2, 2); g.fillStyle = g.strokeStyle = tok('--accent'); roach(g, 10, 8.5, 0, 7, 1.2); }
    },
    resize(w, h) { W = w; H = h; needHint = true; },
    enter() {},
    exit(dir) {
      heroWord.hide();
      if (dir === 'up') spawn.hide();
      ctx.layers.swarm.ctx.clearRect(0, 0, W, H);
    },
    update(q) {
      p = q;
      if (spawn.done && p <= .5) spawn.done = false;     // spec S2: scrolling back above S1 p 0.5 restores the quote
      render();
    },
    tick(t, dt) {
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
  }

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
    // the quote enters over p 0–0.15: container rises 24 px, words fade in staggered
    const e = ease.outCubic(clamp01(p / .15));
    quote.style.transform = `translateY(${24 * (1 - e)}px)`;
    const n = words.length;
    words.forEach((w, k) => { w.style.opacity = clamp01((p - .1 * k / n) / .05); });
    hint.style.opacity = clamp01((p - .38) / .04);
    // the faded hero word (S0 p 1) goes over p 0–0.12
    const a = END.alpha * (1 - clamp01(p / .12));
    if (a > 0) heroWord.draw({ ...END, alpha: a }); else heroWord.hide();
    // the hero swarm at S0's end state: 40% count, 25% opacity
    const tau = ctx.swarm.tau, list = ctx.swarm.list, nn = heroCount(W, H);
    g.fillStyle = g.strokeStyle = tok('--roach');
    for (let i = 0; i < nn; i++) {
      const h = hash01(i, 22); if (h >= END.density) continue;
      wander(i, tau, W, H, pose);
      g.globalAlpha = clamp01((END.density - h) / .04) * END.swarmAlpha;
      roach(g, pose.x + list[i].fx, pose.y + list[i].fy, pose.rot, heroSize(i), pose.legs);
    }
    g.globalAlpha = 1;
  }
  return scene;
};

// S8a… · Quotes on protest (S8-S10 chat, 2026-11-12). Brief: docs/build/scenes/S8-S10.md.
// One factory; def.sub = index into quotes.quotes filtered `selected: true` (Vali's review 2026-11-12: Ambedkar only,
// so the budget makes one 160 vh scene, S8a; the component stays generic for any future selected quote).
//
// Layout: centred, no role label, no `year` (not verified). If the quote is not in English the original script sits
// above (Urdu: --font-urdu, RTL). Then a rule with one roach on it, then author, work, translation credit (non-English
// only) and the source link. Text verbatim from quotes.json; where `text` is the "(same; written in English)" marker the
// English IS `original_text`.
//
// p (pure; Vali 2026-11-12 "load it like a typewriter"):
//   0.00–0.08  the rule draws out from its centre; the roach stands at its left end
//   0.08–0.70  the quote types, one span per character (count pure in p); the roach walks the rule in step with it
//   0.72–0.80  author / work / source fade in
//   0.80–0.92  hold (fully shown)
//   0.92–1.00  everything fades out → p 1 is the backdrop only, and so is p 0 (clean block handovers)
// Idle (tick only, frozen under ?still): the caret blinks.
import { esc } from '../lib/text.js';
import { tok, fitCanvas } from '../lib/dom.js';
import { halftone } from '../lib/halftone.js';
import { roach } from '../roach/roach.js';
import { loadCss } from './s00-hero.js';

const CSS = new URL('./s08-quotes.css', import.meta.url).href;
const RULE = [0, .08], TYPE = [.08, .70], ATTR = [.72, .80], OUT = [.92, 1];
const ROACH_S = 8, ROACH_REST = 150;   // body 8 px; comes to rest 150 px right of the rule's centre (storyboard)
const PAD = 24;                       // the roach canvas overhangs the rule by this much each side

const clamp01 = v => Math.min(1, Math.max(0, v));
const seg = (p, [a, b]) => clamp01((p - a) / (b - a));
const smooth = t => t * t * (3 - 2 * t);
const host = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } };
// author strings may carry a parenthetical note ("Name (…)"): name bold, the note beneath, both verbatim
const splitAuthor = a => { const i = a.indexOf(' ('); return i < 0 ? [a, ''] : [a.slice(0, i), a.slice(i + 1)]; };

export default def => {
  let ctx, q, el = {}, cs = [], rc = null, ruleW = 0, p = 0;
  const scene = {
    id: def.id,
    init(c) {
      ctx = c; loadCss(CSS);
      q = c.data.quotes.quotes.filter(x => x.selected)[def.sub];
      const r = c.root; r.classList.add('s8');
      if (c.clock.still) r.classList.add('is-still');
      if (!q) { r.innerHTML = `<div class="s8-q"><p class="missing">[MISSING: quotes.quotes[selected][${def.sub}]]</p></div>`; return; }
      const english = q.language === 'English';
      const en = english ? q.original_text : q.text;
      const typed = `“${en}”`;
      const [name, note] = splitAuthor(q.author || '');
      const src = q.source_url ? `Source: <a href="${esc(q.source_url)}" target="_blank" rel="noopener noreferrer">${esc(host(q.source_url))}</a>` : '';
      // translator is a sentence with a parenthetical; the credit shows its head, verbatim (needs a short field: GAPS)
      const tr = !english && q.translator ? `Translation: ${esc(q.translator.split(' (')[0])}` : '';
      const langAttr = q.language === 'Urdu' ? 'lang="ur" dir="rtl"' : q.language === 'Hindi' ? 'lang="hi"' : '';
      r.innerHTML = `
        <canvas class="s8-back" aria-hidden="true"></canvas>
        <figure class="s8-q${english ? ' is-en' : ''}">
          ${english ? '' : `<blockquote class="s8-orig${q.language === 'Urdu' ? ' ur' : ''}" ${langAttr}>${esc(q.original_text).replace(/\n/g, '<br>')}</blockquote>`}
          <blockquote class="s8-en" lang="en"><span class="sr-only">${esc(typed)}</span><span aria-hidden="true">${[...typed].map(ch => `<span class="c">${esc(ch)}</span>`).join('')}</span></blockquote>
          <div class="s8-rule"><i></i><canvas class="s8-roach" aria-hidden="true"></canvas></div>
          <figcaption class="s8-attr">
            <b class="s8-name">${esc(name)}</b>${note ? `<span class="s8-note">${esc(note)}</span>` : ''}
            ${q.work ? `<span class="s8-work">${esc(q.work)}</span>` : ''}
            <small class="s8-src">${[tr, src].filter(Boolean).join(' · ')}</small>
          </figcaption>
        </figure>`;
      const $ = s => r.querySelector(s);
      el = { back: $('.s8-back'), q: $('.s8-q'), orig: $('.s8-orig'), rule: $('.s8-rule'), line: $('.s8-rule i'), attr: $('.s8-attr'), roach: $('.s8-roach') };
      cs = [...r.querySelectorAll('.s8-en .c')];
    },
    resize(w, h) {
      if (!el.back) return;
      const b = fitCanvas(el.back, w, h);
      halftone(b, w, h, { seed: 11, cell: 7, ink: tok('--ht-ink', ctx.root), bias: -.08 });
      ruleW = 0;   // pinned roots are hidden while not live: the rule is measured on the first visible render
      render();
    },
    enter() {},
    update(q) { p = q; render(); },
    exit() {},
    // idle: the caret blinks (never runs under ?still, so QA frames keep a solid caret)
    tick(t) { el.q?.classList.toggle('caret-off', (t % 1) >= .5); },
  };

  function render() {
    if (!el.q) return;
    const out = 1 - smooth(seg(p, OUT));
    el.q.style.opacity = out.toFixed(4);
    el.q.style.visibility = out > 0 ? 'visible' : 'hidden';
    // typing: count pure in p; the caret rides the last typed character while typing
    const N = cs.length, tt = seg(p, TYPE), n = Math.floor(N * tt + 1e-9);
    cs.forEach((c, k) => { c.classList.toggle('on', k < n); c.classList.toggle('cur', k === n - 1 && n < N); });
    if (el.orig) el.orig.style.opacity = smooth(seg(p, [TYPE[0], TYPE[0] + .12])).toFixed(4);
    // the rule draws out from its centre
    const ru = smooth(seg(p, RULE));
    el.line.style.transform = `scaleX(${ru.toFixed(4)})`;
    // attribution
    const a = smooth(seg(p, ATTR));
    el.attr.style.opacity = a.toFixed(4);
    el.attr.style.visibility = a > 0 ? 'visible' : 'hidden';
    drawRoach(ru, tt);
  }

  // the roach walks the rule left → rest point as the quote types (legs phase = distance walked, so it's pure in p)
  function drawRoach(ru, tt) {
    if (!ruleW) { ruleW = el.rule.offsetWidth; if (!ruleW) return; rc = fitCanvas(el.roach, ruleW + PAD * 2, 28); }
    const cw = ruleW + PAD * 2, x0 = PAD + ROACH_S, x1 = PAD + ruleW / 2 + ROACH_REST;
    const k = tt < 1 ? tt : 1, ease = k < .85 ? k / .85 * .92 : .92 + .08 * (1 - (1 - (k - .85) / .15) ** 2);   // walk, then settle
    const x = x0 + (x1 - x0) * ease;
    rc.clearRect(0, 0, cw, 28);
    rc.globalAlpha = ru;
    rc.fillStyle = rc.strokeStyle = tok('--roach', ctx.root);
    roach(rc, x, 14 - 7, 0, ROACH_S, (x - x0) / ROACH_S * 1.6);
    rc.globalAlpha = 1;
  }
  return scene;
};

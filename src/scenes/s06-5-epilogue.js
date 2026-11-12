// S6.5 · October epilogue (remaining-scenes chat, 2026-11-12). Brief: docs/build/scenes/S6-5.md. A flow (reading)
// section: paper inside the ink theme (.reading). Every string verbatim from epilogue_october.json:
//   left   framing, then the dated bridge[] (July to September)
//   right  the disputed October figures, as written; facts that share a date sit side by side in one card
//   foot   status_line
// No heading (Vali 2026-11-12: the slot stays empty, no [MISSING]). The kicker "Epilogue" is a section label, not data
// (as in the approved storyboard). Facts with hold or status unverified never show (showable()).
// Top edge: it scrolls up over the finale's red stage, so it opens with a red dot screen whose dots shrink into the
// paper (the S6 flood edge run backwards). update(p) does nothing: a reading section ignores p.
import { esc, showable } from '../lib/text.js';
import { fmtDate } from '../lib/dates.js';
import { star } from '../lib/star.js';
import { tok, fitCanvas } from '../lib/dom.js';
import { loadCss } from './s00-hero.js';

const CSS = new URL('./s06-5-epilogue.css', import.meta.url).href;
const EDGE = 120, CELL = 16;

export default def => {
  let ctx, edge;
  const scene = {
    id: def.id,
    init(c) {
      ctx = c; loadCss(CSS);
      const E = c.data.epilogue, SRC = c.data.byId.source;
      const st = f => star(f.source_ids, SRC, f.attribution);
      const chip = f => `<span class="ep-att t-micro">${esc(f.attribution)}${f.status !== 'documented' ? ` · <b class="st-${esc(f.status)}">${esc(f.status)}</b>` : ''}</span>`;
      const bridge = E.bridge.filter(showable).map(b => `<li><span class="ep-date t-micro t-num">${esc(fmtDate(b.date))}</span>
        <span>${b.value_text ? `<b class="ep-v t-num">${esc(b.value_text)}</b> · ` : ''}${esc(b.text)}${st(b)} ${chip(b)}</span></li>`).join('');
      // disputed October figures, grouped by date (same-date claims side by side)
      const groups = [];
      for (const f of E.facts.filter(f => showable(f) && f.status === 'disputed')) {
        const g = groups.find(g => g.date === f.date); g ? g.items.push(f) : groups.push({ date: f.date, items: [f] });
      }
      const cards = groups.map(g => `<div class="ep-card${g.items.length > 1 ? ' pair' : ''}"><span class="ep-date t-micro t-num">${esc(fmtDate(g.date))}</span>
        <div class="ep-claims">${g.items.map(f => `<div class="ep-claim"><p>${esc(f.text)}${st(f)}</p>${chip(f)}</div>`).join('')}</div></div>`).join('');
      c.root.classList.add('s6-5', 'reading');
      c.root.innerHTML = `<canvas class="ep-edge" aria-hidden="true"></canvas>
        <div class="ep">
          <div class="ep-main">
            <p class="ep-kick t-micro">Epilogue</p>
            <h2 class="ep-h" hidden></h2>
            ${showable(E.framing) ? `<p class="ep-framing">${esc(E.framing.text)}${st(E.framing)}</p>` : ''}
            <ol class="ep-bridge">${bridge}</ol>
          </div>
          <aside class="ep-side" aria-label="Disputed October figures"><p class="ep-side-k t-micro">October · disputed figures</p>${cards}</aside>
          ${showable(E.status_line) ? `<p class="ep-status">${esc(E.status_line.text)}${st(E.status_line)}</p>` : ''}
        </div>`;
      edge = c.root.querySelector('.ep-edge');
    },
    resize(w) {
      // red dots on a 45° grid, radius shrinking from full cover at the top edge to nothing at EDGE px
      const g = fitCanvas(edge, w, EDGE); g.clearRect(0, 0, w, EDGE); g.fillStyle = tok('--stage-dramatic-bg');
      for (let y = 0, row = 0; y <= EDGE; y += CELL / 2, row++) {
        const c = 1 - y / EDGE, r = .74 * CELL * Math.sqrt(Math.max(0, c)) * (c > .9 ? 1.05 : 1);
        if (r < .6) continue;
        for (let x = (row & 1) * CELL / 2; x <= w + CELL; x += CELL) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
      }
      g.fillRect(0, 0, w, 2);
    },
    enter() {}, exit() {}, update() {},
  };
  return scene;
};

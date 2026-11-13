// S9 · Follow the CJP (S8-S10 chat, 2026-11-12, GATE 1: static, no motion yet). Brief: docs/build/scenes/S8-S10.md.
// Flow section, 100vh (p 1 = the section fills the viewport).
//
// - No headline (hybrid, Vali 2026-11-13: the closing line gets its own scene before S9, not inside it).
// - Follow buttons (Vali 2026-11-13: simple, with Instagram / X icons, aligned on a grid): one equal outlined button
//   per meta.handles[show], icon + platform + @handle from the data; new tab, rel="noopener noreferrer".
//   Centred on the 12-column grid S10 uses (shell.css --g-m margin, --g-gut gutters): label cols 3–10, buttons 3–6 and 7–10.
// - No share row (Vali 2026-11-13, hybrid: removed; follow buttons only).
// - Roaches only in the margins (static at gate 1; gate 2 makes them wander in tick, still never over the buttons).
import { esc } from '../lib/text.js';
import { tok, fitCanvas } from '../lib/dom.js';
import { rng } from '../lib/rng.js';
import { halftone } from '../lib/halftone.js';
import { roach } from '../roach/roach.js';
import { loadCss } from './s00-hero.js';

const CSS = new URL('./s09-cta.css', import.meta.url).href;
const TAU = Math.PI * 2;
const MARGIN_ROACHES = 70;   // storyboard: 70, size 5
// follow-button icons (Vali 2026-11-13, hybrid: "use twitter/instagram icons"): inline SVG in currentColor, no dependency.
// X is the platform's current mark (the handle lives on x.com); Instagram is the camera glyph.
const ICON = {
  Instagram: '<svg viewBox="0 0 24 24" width="24" height="24"><rect x="3" y="3" width="18" height="18" rx="5.2" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4.1" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.3" cy="6.7" r="1.25" fill="currentColor"/></svg>',
  X: '<svg viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
};

export default def => {
  let ctx, el = {};
  const scene = {
    id: def.id,
    init(c) {
      ctx = c; loadCss(CSS);
      const { meta } = c.data;
      const hs = (meta.handles || []).filter(h => h.show);
      const r = c.root; r.classList.add('s9');
      const ext = 'target="_blank" rel="noopener noreferrer"';
      r.innerHTML = `
        <canvas class="s9-back" aria-hidden="true"></canvas>
        <div class="s9-in">
          <p class="s9-l t-micro" id="s9-follow">Follow the Cockroach Janta Party</p>
          <div class="s9-handles" role="list" aria-labelledby="s9-follow">${hs.map(h => `<a class="s9-h" role="listitem" href="${esc(h.url)}" ${ext}>
            <span class="s9-ico" aria-hidden="true">${ICON[h.platform] || ''}</span>
            <span class="s9-ht"><b>${esc(h.platform)}</b><span>${esc(h.handle)}</span></span><span class="sr-only">(opens in a new tab)</span></a>`).join('')}</div>
        </div>`;
      el = { back: r.querySelector('.s9-back') };
    },
    resize(w, h) {
      if (!el.back) return;
      const c = fitCanvas(el.back, w, h);
      halftone(c, w, h, { seed: 11, cell: 7, ink: tok('--ht-ink', ctx.root), bias: -.08 });
      drawMargins(c, w, h);
    },
    enter() {},
    update() {},   // static section: nothing depends on p at gate 1
    exit() {},
  };

  // margin roaches: seeded, kept out of the content box (label + buttons, + a 24 px gutter)
  function drawMargins(c, w, h) {
    const a = ctx.root.querySelector('.s9-l').getBoundingClientRect(), b = ctx.root.querySelector('.s9-handles').getBoundingClientRect();
    const top = ctx.root.getBoundingClientRect().top;
    const g = 24, L = Math.min(a.left, b.left) - g, R = Math.max(a.right, b.right) + g, T = Math.min(a.top, b.top) - top - g, B = Math.max(a.bottom, b.bottom) - top + g;
    const r = rng(8), col = tok('--roach', ctx.root);
    c.fillStyle = c.strokeStyle = col;
    for (let i = 0, n = 0; n < MARGIN_ROACHES && i < MARGIN_ROACHES * 40; i++) {
      const x = r() * w, y = r() * h, rot = r() * TAU, s = 5 * (1 + (r() - .5) * .7), legs = r() * TAU;
      if (x > L - 12 && x < R + 12 && y > T - 12 && y < B + 12) continue;
      roach(c, x, y, rot, s, legs); n++;
    }
  }
  return scene;
};

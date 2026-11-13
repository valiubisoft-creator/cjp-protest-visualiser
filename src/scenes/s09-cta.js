// S9 · Follow the CJP (S8-S10 chat, 2026-11-12, GATE 1: static, no motion yet). Brief: docs/build/scenes/S8-S10.md.
// Flow section, 100vh (p 1 = the section fills the viewport).
//
// - No headline (hybrid, Vali 2026-11-13: the closing line gets its own scene before S9, not inside it).
// - Follow buttons (Vali 2026-11-13: simple, with Instagram / X icons, aligned on a grid): one equal outlined button
//   per meta.handles[show], icon + platform + @handle from the data; new tab, rel="noopener noreferrer".
//   Centred on the 12-column grid S10 uses (shell.css --g-m margin, --g-gut gutters): label cols 3–10, buttons 3–6 and 7–10.
// - No share row (Vali 2026-11-13, hybrid: removed; follow buttons only).
// - Roaches only in the margins. Review 3 (Vali 2026-11-13): they move (tick only: each wanders a small closed loop
//   around its seat, legs tied to distance, heading along its path), never over the buttons; static under ?still.
// - Review 3: the section is 55vh (was 100vh): less empty space before the footer.
import { esc } from '../lib/text.js';
import { tok, fitCanvas } from '../lib/dom.js';
import { rng } from '../lib/rng.js';
import { halftone } from '../lib/halftone.js';
import { roach } from '../roach/roach.js';
import { loadCss } from './s00-hero.js';

const CSS = new URL('./s09-cta.css', import.meta.url).href;
const TAU = Math.PI * 2;
const MARGIN_ROACHES = 46;   // was 70 in a 100vh section; the section is 55vh since review 3
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
        <canvas class="s9-back" aria-hidden="true"></canvas><canvas class="s9-roach" aria-hidden="true"></canvas>
        <div class="s9-in">
          <p class="s9-l t-micro" id="s9-follow">Follow the Cockroach Janta Party</p>
          <div class="s9-handles" role="list" aria-labelledby="s9-follow">${hs.map(h => `<a class="s9-h" role="listitem" href="${esc(h.url)}" ${ext}>
            <span class="s9-ico" aria-hidden="true">${ICON[h.platform] || ''}</span>
            <span class="s9-ht"><b>${esc(h.platform)}</b><span>${esc(h.handle)}</span></span><span class="sr-only">(opens in a new tab)</span></a>`).join('')}</div>
        </div>`;
      el = { back: r.querySelector('.s9-back'), cv: r.querySelector('.s9-roach') };
    },
    resize(w, h) {
      if (!el.back) return;
      const c = fitCanvas(el.back, w, h);
      halftone(c, w, h, { seed: 11, cell: 7, ink: tok('--ht-ink', ctx.root), bias: -.08 });
      g = fitCanvas(el.cv, w, h); W = w; H = h;
      seat(w, h); draw(ctx.clock.t || 0);
    },
    tick(t) { draw(ctx.clock.still ? 0 : t); },
    enter() {},
    update() {},   // static section: nothing depends on p at gate 1
    exit() {},
  };

  // margin roaches: seeded seats outside the content box (label + buttons + gutter + the wander radius); each walks a
  // small closed loop (two sines) around its seat, so it moves forever without leaving the margin
  let g = null, W = 0, H = 0, seats = [];
  function seat(w, h) {
    const a = ctx.root.querySelector('.s9-l').getBoundingClientRect(), b = ctx.root.querySelector('.s9-handles').getBoundingClientRect();
    const top = ctx.root.getBoundingClientRect().top, A = 26;
    const pad = 24 + A + 10, L = Math.min(a.left, b.left) - pad, R = Math.max(a.right, b.right) + pad, T = Math.min(a.top, b.top) - top - pad, B = Math.max(a.bottom, b.bottom) - top + pad;
    const r = rng(8); seats = [];
    for (let i = 0; i < MARGIN_ROACHES * 40 && seats.length < MARGIN_ROACHES; i++) {
      const x = A + r() * (w - 2 * A), y = A + r() * (h - 2 * A);
      const o = { x, y, s: 5 * (1 + (r() - .5) * .7), ax: A * (.5 + .5 * r()), ay: A * (.5 + .5 * r()), wx: .18 + .22 * r(), wy: .18 + .22 * r(), px: r() * TAU, py: r() * TAU, dir: r() < .5 ? 1 : -1 };
      if (x > L && x < R && y > T && y < B) continue;
      seats.push(o);
    }
  }
  function draw(t) {
    if (!g) return;
    g.clearRect(0, 0, W, H); g.fillStyle = g.strokeStyle = tok('--roach', ctx.root);
    for (const o of seats) {
      const u = o.dir * t, x = o.x + o.ax * Math.sin(o.wx * u + o.px), y = o.y + o.ay * Math.sin(o.wy * u + o.py);
      const dx = o.ax * o.wx * Math.cos(o.wx * u + o.px) * o.dir, dy = o.ay * o.wy * Math.cos(o.wy * u + o.py) * o.dir;
      const rot = Math.atan2(dy, dx), legs = (o.ax + o.ay) * .5 * t * .9 / o.s + o.px;
      roach(g, x, y, rot, o.s, legs);
    }
  }
  return scene;
};

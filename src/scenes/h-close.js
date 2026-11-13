// CLOSE · the closing line on its own scene (Vali 2026-11-13: "should be on its own scene and not inside the footer").
// Own pinned block, 140 vh. Copy: src/data/copy.js chapter `close` (headline = the line, kicker, starAfter).
// p 0.00–0.08  kicker in            p 0.06–0.52  the line, word by word (anime.js stagger, seeked: rise + unblur)
// p 0.50–0.56  the star             p 0.56–1.00  hold (the block then scrolls away into S9)
// Idle (tick only, frozen under ?still): margin roaches wander a little; never over the text box.
import { createTimeline, utils } from 'animejs';
import { tok, fitCanvas } from '../lib/dom.js';
import { esc } from '../lib/text.js';
import { star } from '../lib/star.js';
import { rng } from '../lib/rng.js';
import { halftone } from '../lib/halftone.js';
import { roach } from '../roach/roach.js';
import { idle, TAU } from '../roach/swarm.js';
import { loadCss } from './s00-hero.js';
import { CH } from '../lib/chapter.js';
import { render as renderCopy } from '../data/copy.js';

const CSS = new URL('./h-close.css', import.meta.url).href;

export default def => {
  let ctx, W = 0, H = 0, p = 0, el = {}, back = null, g = null, M = [];
  const tl = createTimeline({ autoplay: false, defaults: { ease: 'outQuart', duration: 160 } });
  tl.add({ duration: 1000 }, 0);
  return {
    id: def.id,
    init(c) {
      ctx = c; loadCss(CSS);
      const C = CH.close;
      c.root.classList.add('hclose');
      const words = C.headline.split(' ').map(w => `<span class="w">${esc(w)}</span>`).join(' ');
      c.root.innerHTML = `<canvas class="hclose-back" aria-hidden="true"></canvas><canvas class="hclose-roach" aria-hidden="true"></canvas>
        <div class="hclose-in"><p class="hy-kick">${esc(C.kicker)}</p><h2 class="hclose-line">${words}<span class="hclose-star">${renderCopy(C.starAfter, c.data.byId.source, star)}</span></h2></div>`;
      el = { back: c.root.querySelector('.hclose-back'), cv: c.root.querySelector('.hclose-roach'), box: c.root.querySelector('.hclose-in'), kick: c.root.querySelector('.hy-kick'), ws: [...c.root.querySelectorAll('.w')], star: c.root.querySelector('.hclose-star') };
      const set = (t, from, to, pos, params = {}) => { utils.set(t, from); const pr = {}; for (const k in to) pr[k] = [from[k], to[k]]; tl.add(t, { ...pr, ...params }, pos); };
      set(el.kick, { opacity: 0, translateY: 10 }, { opacity: 1, translateY: 0 }, 0, { duration: 80 });
      const n = el.ws.length;
      el.ws.forEach((w, i) => set(w, { opacity: 0, translateY: 28, filter: 'blur(6px)' }, { opacity: 1, translateY: 0, filter: 'blur(0px)' }, 60 + i * (400 / n)));
      set(el.star, { opacity: 0 }, { opacity: 1 }, 500, { duration: 60 });
    },
    resize(w, h) {
      W = w; H = h;
      back = fitCanvas(el.back, w, h); halftone(back, w, h, { seed: 11, cell: 7, ink: tok('--ht-ink', ctx.root) });
      g = fitCanvas(el.cv, w, h);
      const k = Math.min(w / 1440, h / 900);
      el.box.style.width = Math.min(1040, w - 240) + 'px';
      ctx.root.querySelector('.hclose-line').style.fontSize = Math.round(60 * k) + 'px';
      M = null;   // margin roaches are placed on the first visible frame (the box measures 0 while hidden)
    },
    enter() {},
    exit() {},
    update(q) { p = q; tl.seek(p * 1000); draw(); },
    tick() { draw(); },
  };
  function draw() {
    if (!g) return;
    if (!M && el.box.offsetParent) {
      const b = el.box.getBoundingClientRect(), top = ctx.root.getBoundingClientRect().top, r = rng(8);
      M = [];
      for (let i = 0; M.length < 60 && i < 4000; i++) {
        const x = r() * W, y = r() * H;
        if (x > b.left - 50 && x < b.right + 50 && y > b.top - top - 50 && y < b.bottom - top + 50) continue;
        M.push({ x, y, rot: r() * TAU, s: 5 * (1 + (r() - .5) * .6), legs: r() * TAU });
      }
    }
    g.clearRect(0, 0, W, H);
    if (!M) return;
    g.fillStyle = g.strokeStyle = tok('--roach', ctx.root);
    const t = ctx.clock.t, a = Math.min(1, p / .08);
    g.globalAlpha = a;
    M.forEach((m, i) => { const j = idle(i, t, 2.2); roach(g, m.x + j.dx, m.y + j.dy, m.rot + j.dr, m.s, m.legs + t * 3); });
    g.globalAlpha = 1;
  }
};

// S9 · Follow and share (S8-S10 chat, 2026-11-12, GATE 1: static, no motion yet). Brief: docs/build/scenes/S8-S10.md.
// Flow section, 100vh (p 1 = the section fills the viewport).
//
// - No headline (hybrid, Vali 2026-11-13: the closing line gets its own scene before S9, not inside it).
// - Follow buttons (Vali 2026-11-13: simple, with Instagram / X icons, aligned on a grid): one equal outlined button
//   per meta.handles[show], icon + platform + @handle from the data; new tab, rel="noopener noreferrer".
// - Share row: Copy link (red primary, with a status line under the row, never over content); the native Share…
//   button only when navigator.share exists; X, WhatsApp and LinkedIn intent links. No tracking scripts.
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

// the canonical URL to share: this page without the deep-link / debug query
const pageUrl = () => location.origin + location.pathname;
// fallback when the async clipboard is refused (no focus / permission): a selected off-screen textarea
function legacyCopy(text) {
  const t = Object.assign(document.createElement('textarea'), { value: text, readOnly: true });
  t.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
  document.body.append(t); t.select();
  let ok = false; try { ok = document.execCommand('copy'); } catch { ok = false; }
  t.remove(); return ok;
}

export default def => {
  let ctx, el = {};
  const scene = {
    id: def.id,
    init(c) {
      ctx = c; loadCss(CSS);
      const { meta } = c.data;
      const hs = (meta.handles || []).filter(h => h.show);
      const r = c.root; r.classList.add('s9');
      const url = pageUrl(), title = meta.title || '';
      const enc = encodeURIComponent;
      const intents = [
        ['X', `https://x.com/intent/tweet?url=${enc(url)}&text=${enc(title)}`],
        ['WhatsApp', `https://wa.me/?text=${enc(title ? title + ' ' + url : url)}`],
        ['LinkedIn', `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`],
      ];
      const ext = 'target="_blank" rel="noopener noreferrer"';
      r.innerHTML = `
        <canvas class="s9-back" aria-hidden="true"></canvas>
        <div class="s9-in">
          <p class="s9-l t-micro" id="s9-follow">Follow the Cockroach Janta Party</p>
          <div class="s9-handles" role="list" aria-labelledby="s9-follow">${hs.map(h => `<a class="s9-h" role="listitem" href="${esc(h.url)}" ${ext}>
            <span class="s9-ico" aria-hidden="true">${ICON[h.platform] || ''}</span>
            <span class="s9-ht"><b>${esc(h.platform)}</b><span>${esc(h.handle)}</span></span><span class="sr-only">(opens in a new tab)</span></a>`).join('')}</div>
          <p class="s9-l t-micro" id="s9-share-l">Share this visualisation</p>
          <div class="s9-share" role="group" aria-labelledby="s9-share-l">
            <button type="button" class="s9-b primary" data-act="copy">Copy link</button>
            ${'share' in navigator ? '<button type="button" class="s9-b" data-act="share">Share…</button>' : ''}
            ${intents.map(([n, u]) => `<a class="s9-b" href="${esc(u)}" ${ext}>${n}</a>`).join('')}
          </div>
          <p class="s9-toast t-micro" role="status" aria-live="polite"></p>
        </div>`;
      const $ = s => r.querySelector(s);
      el = { back: $('.s9-back'), toast: $('.s9-toast') };
      let tid = 0;
      const say = msg => { el.toast.textContent = msg; clearTimeout(tid); tid = setTimeout(() => { el.toast.textContent = ''; }, 2600); };
      $('[data-act="copy"]').addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(pageUrl()); say('Link copied'); }
        catch { say(legacyCopy(pageUrl()) ? 'Link copied' : 'Copy failed: ' + pageUrl()); }
      });
      $('[data-act="share"]')?.addEventListener('click', async () => {
        try { await navigator.share({ title, url: pageUrl() }); } catch { /* cancelled */ }
      });
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

  // margin roaches: seeded, kept out of the content box (+ a 24 px gutter)
  function drawMargins(c, w, h) {
    const box = ctx.root.querySelector('.s9-in').getBoundingClientRect(), top = ctx.root.getBoundingClientRect().top;
    const g = 24, L = box.left - g, R = box.right + g, T = box.top - top - g, B = box.bottom - top + g;
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

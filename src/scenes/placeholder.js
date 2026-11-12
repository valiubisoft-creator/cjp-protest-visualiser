// F3 placeholder scene: a flat panel with the scene id, its name and a p bar. Deliberately plain (no design).
// Every sNN-*.js starts as one of these; each scene chat replaces its own file with the real scene.
import { esc } from '../lib/text.js';
import { segmentAt } from '../scroll/budget.js';

export function placeholder(def) {
  let bar, num;
  return {
    id: def.id,
    init(ctx) {
      if (def.len === 'auto') ctx.root.style.minHeight = ctx.viewport.h + 'px';   // auto scenes: one screen until built
      ctx.root.classList.add('ph-host');
      ctx.root.insertAdjacentHTML('beforeend', `<div class="ph" data-ph="${esc(def.id)}">
        <div class="ph-id">${esc(def.id)}</div><div class="ph-name">${esc(def.name)}</div>
        <div class="ph-bar"><i></i></div><div class="ph-p t-num">p 0.000</div></div>`);
      bar = ctx.root.querySelector('.ph-bar i'); num = ctx.root.querySelector('.ph-p');
    },
    enter() {},
    update(p) {
      bar.style.transform = `scaleX(${p})`;
      const seg = def.segments ? segmentAt(def, p) : null;
      num.textContent = `p ${p.toFixed(3)}` + (seg ? ` · ${seg.id} ${seg.p.toFixed(2)}` : '');
    },
    exit() {},
    resize(w, h) {},
  };
}

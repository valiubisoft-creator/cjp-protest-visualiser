// Token and canvas helpers. tok/px/canvasIn promoted from design/lib/kit.js in F3, no behaviour change.
export const tok = (name, el = document.documentElement) => getComputedStyle(el).getPropertyValue(name).trim();
export const px = (name, el) => parseFloat(tok(name, el));

// DPR is capped at 2 everywhere (BUILD_PLAN §3 performance budget).
export const dpr = () => Math.min(devicePixelRatio || 1, 2);

// a fixed-size canvas appended to el (static frames)
export function canvasIn(el, w, h) {
  const c = document.createElement('canvas');
  const d = Math.min(devicePixelRatio || 1, 2);
  c.width = w * d; c.height = h * d; c.style.width = w + 'px'; c.style.height = h + 'px';
  const ctx = c.getContext('2d'); ctx.setTransform(d, 0, 0, d, 0, 0);
  el.appendChild(c);
  return ctx;
}

// F3: fit an existing canvas to its CSS box (used by the shell on resize). Returns the context in CSS px.
export function fitCanvas(c, w, h) {
  const d = dpr();
  c.width = Math.max(1, Math.round(w * d)); c.height = Math.max(1, Math.round(h * d));
  c.style.width = w + 'px'; c.style.height = h + 'px';
  const ctx = c.getContext('2d'); ctx.setTransform(d, 0, 0, d, 0, 0);
  return ctx;
}

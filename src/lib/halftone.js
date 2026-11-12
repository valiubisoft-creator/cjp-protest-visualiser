// Halftone backdrop. Promoted from design/lib/kit.js in F3, no behaviour change.
import { rng } from './rng.js';

const TAU = Math.PI * 2;

// ── halftone: noise field thresholded into a 45° dot screen, jittered radius (spec §5) ──
function valueNoise(r) {
  const G = 64, g = Array.from({ length: G * G }, r);
  const at = (x, y) => g[((y % G + G) % G) * G + ((x % G + G) % G)];
  const sm = t => t * t * (3 - 2 * t);
  return (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = sm(x - xi), yf = sm(y - yi);
    const a = at(xi, yi), b = at(xi + 1, yi), c = at(xi, yi + 1), d = at(xi + 1, yi + 1);
    return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
  };
}
export function halftone(ctx, w, h, { seed = 7, cell = 7, maxR = 0.42, jitter = 0.15, ink = 'rgba(0,0,0,.075)', scale = 0.006, bias = 0, grain = true } = {}) {
  const r = rng(seed), n = valueNoise(r);
  ctx.save(); ctx.fillStyle = ink;
  const diag = Math.hypot(w, h), cs = Math.SQRT1_2;
  for (let v = -diag; v < diag; v += cell) for (let u = -diag; u < diag; u += cell) {
    const x = (u - v) * cs + w / 2, y = (u + v) * cs + h / 2;   // 45° screen
    if (x < -cell || y < -cell || x > w + cell || y > h + cell) continue;
    const t = Math.min(1, Math.max(0, n(x * scale * 8, y * scale * 8) * 1.15 - 0.2 + bias));
    const rr = cell * maxR * t * (1 + (r() - .5) * 2 * jitter);
    if (rr < .35) continue;
    ctx.beginPath(); ctx.arc(x, y, rr, 0, TAU); ctx.fill();
  }
  if (grain) { for (let i = 0; i < w * h / 90; i++) { ctx.globalAlpha = r() * .35; ctx.fillRect(r() * w, r() * h, 1, 1); } }
  ctx.restore();
}

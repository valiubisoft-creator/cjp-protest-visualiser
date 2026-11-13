// The backdrop texture. Was a 45° halftone dot screen (F3); since hybrid 2026-11-13 it is grunge / splattered paint
// (lib/grunge.js), at the client's request. The name and signature stay so no caller changes.
//   cell, maxR, jitter   kept for compatibility (ignored by the paint texture)
//   bias                 < 0 thins the paint (fewer splats, scuffs, scratches), > 0 adds; −0.08 ≈ 70 %
//   scale                the stain field's feature size, relative to the old 0.006 default
// The seed is salted with the owning scene's id (data-scene), so each chapter gets its own splats (still deterministic:
// same scene, seed and size → same pixels).
import { grunge } from './grunge.js';
import { alive } from './alive.js';

const salt = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; };

export function halftone(ctx, w, h, { seed = 7, cell = 7, maxR = 0.42, jitter = 0.15, ink = 'rgba(0,0,0,.075)', scale = 0.006, bias = 0, grain = true } = {}) {
  const id = ctx.canvas?.closest?.('[data-scene]')?.dataset.scene || '';
  grunge(ctx, w, h, { seed: (seed ^ salt(id)) >>> 0, ink, density: Math.max(.2, 1 + bias * 4), scale: .006 / scale, grain });
  if (ctx.canvas) alive(ctx.canvas, { cell, ink });   // the living layer above it (lib/alive.js; off under ?still)
}

// Canonical roach renderer. VERBATIM copy of roach() from index.html (v2, line ~512), moved here in F3
// from design/lib/roach.js (which now re-exports this file). Do not edit: CLAUDE.md "wrap it; don't redraw it".
const TAU = Math.PI * 2;

// a cockroach, nose along +x
export function roach(ctx, x, y, rot, s, legs = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  if (s > 5) {
    ctx.lineWidth = Math.max(.8, s * .08); ctx.beginPath();
    for (let k = -1; k <= 1; k++) {
      const sw = Math.sin(legs + k * 2.1) * s * .28, lx = k * s * .32;
      ctx.moveTo(lx, 0); ctx.lineTo(lx + sw, -s * .78);
      ctx.moveTo(lx, 0); ctx.lineTo(lx - sw, s * .78);
    }
    ctx.moveTo(s * .9, -s * .1); ctx.quadraticCurveTo(s * 1.5, -s * .4, s * 2.1, -s * .8);
    ctx.moveTo(s * .9, s * .1); ctx.quadraticCurveTo(s * 1.5, s * .4, s * 2.1, s * .8);
    ctx.stroke();
  }
  ctx.beginPath(); ctx.ellipse(0, 0, s * .78, s * .44, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(s * .84, 0, s * .22, s * .27, 0, 0, TAU); ctx.fill();
  ctx.restore();
}

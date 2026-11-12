// S3.5 · The claim and the correction (prologue chat, 2026-11-12). Brief: docs/build/scenes/S3.md (this scene has
// no spec section; the brief is its spec). Port of v2's "01 · The swarm" split (SPLITS 2 → 3: phyllotaxis clusters,
// stagger({ from: 'random' }) + inOutQuart), expressed as a function of p with a per-roach delay, not a timeline.
//
// Budget 240 vh (Vali 2026-11-12: more scroll before the BJP minister's claim; was 160).
// p 0.00–0.20  sort: the roaches leave their S3 homes for two clusters at the minister's split; the right cluster's
//              roaches turn red GRADUALLY as they walk to it (Vali 2026-11-12), so the colour is there before any text
// p 0.17–0.23  the cluster labels (Indian 51% / Pakistani 49%, the minister's) come in as the last roaches settle
//              (Vali 2026-11-12: "bring them in sooner")
// p 0.23–0.40  pause on the labelled clusters (key frame 0.32)
// p 0.40–0.45  the claim caption (the minister's sentence) fades in
// p 0.45–0.62  hold the claim (key frame 0.54)
// p 0.62–0.88  re-sort to Dipke's >94% Indian: roaches leave the red cluster in random stagger, arcing, dropping the
//              red as they cross (key frame 0.75 = halfway); correction caption from 0.64; labels as they land (0.82)
// p 0.88–1.00  hold the correction ("Elsewhere" at 55%, no number; key frame 0.94); labels and caption fade
//              0.97–1.0 so p 1 is roaches only: S4's converge starts from claim.poses(1, t).
// Nothing is born or killed here. Facts: start_pushback (both sentences verbatim), metrics rows m15 / m14.
import { tok } from '../lib/dom.js';
import { esc } from '../lib/text.js';
import { star } from '../lib/star.js';
import { rng } from '../lib/rng.js';
import { roach } from '../roach/roach.js';
import { idle, clamp01, lerp, ease, angDiff, TAU } from '../roach/swarm.js';
import { mult, N3 } from './s03-multiply.js';
import { loadCss, backdrop } from './s00-hero.js';

const CSS = new URL('./s03-5-claim.css', import.meta.url).href;
const GOLD = Math.PI * (3 - Math.sqrt(5));
const phyllo = (n, cx, cy, sp) => Array.from({ length: n }, (_, i) => [cx + Math.cos(i * GOLD) * sp * Math.sqrt(i + .5), cy + Math.sin(i * GOLD) * sp * Math.sqrt(i + .5)]);
const shuffle = seed => { const r = rng(seed), a = [...Array(N3).keys()]; for (let i = a.length - 1; i > 0; i--) { const j = (r() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
const A = [0, .20], B = [.62, .88];                     // the two sorts, in p

export const claim = {
  W: 0, H: 0, CLAIM: null, REBUT: null,
  permA: shuffle(34), permB: shuffle(35),
  R: (() => { const r = rng(36); return Array.from({ length: N3 }, () => ({ rot: r() * TAU, legs: r() * TAU, delay: r() * .55 })); })(),
  // storyboard clusters(): sp 12.5 (for 380 roaches; tighter for more, same cluster size), gap 150, cy 380 at 1440×900, scaled by u
  clusters(rightShare) {
    // shorter viewports shrink the clusters a little more, so the labels clear the caption (1280×720)
    const u = Math.min(this.W / 1440, this.H / 900) * (this.H < 800 ? .9 : 1);
    const nR = Math.round(N3 * rightShare / 100), nL = N3 - nR, sp = 12.5 * Math.sqrt(380 / N3) * u, gap = 150 * u, cy = 360 * this.H / 900;
    const rL = sp * Math.sqrt(nL), rR = sp * Math.sqrt(nR), cxL = (this.W - (2 * rL + gap + 2 * rR)) / 2 + rL, cxR = cxL + rL + gap + rR;
    return { pts: [...phyllo(nL, cxL, cy, sp).map(p => [...p, 0]), ...phyllo(nR, cxR, cy, sp).map(p => [...p, 1])], cxL, cxR, rL, rR, cy, nL, nR };
  },
  layout(w, h, pak, ind) { this.pak = pak; this.ind = ind; this.W = w; this.H = h; this.CLAIM = this.clusters(pak); this.REBUT = this.clusters(100 - ind); },
  // poses at (p, t) into P[i] = { x, y, rot, s, legs, a, c } (c = red mix, 0…1). Starts from mult.poses(1, t).
  poses(p, t, P, list, S3 = []) {
    mult.poses(1, t, S3, list);
    const tA = clamp01((p - A[0]) / (A[1] - A[0])), tB = clamp01((p - B[0]) / (B[1] - B[0]));
    for (let k = 0; k < N3; k++) {
      const o = P[k] || (P[k] = {}), j = idle(k, t, 1.6), R = this.R[k], s3 = S3[k];
      const a = this.CLAIM.pts[this.permA[k]], b = this.REBUT.pts[this.permB[k]];
      const eA = ease.inOutQuart(clamp01((tA - R.delay) / .45)), eB = ease.inOutQuart(clamp01((tB - R.delay) / .45));
      const ax = a[0] + j.dx, ay = a[1] + j.dy, bx = b[0] + j.dx, by = b[1] + j.dy, rest = R.rot + j.dr;
      let x, y, rot, travel;
      if (tB <= 0) {                                       // sort A: S3 home → claim cluster, a low arc
        x = lerp(s3.x, ax, eA); y = lerp(s3.y, ay, eA) - Math.sin(eA * Math.PI) * 30;
        travel = Math.atan2(ay - s3.y, ax - s3.x);
        rot = eA <= 0 ? s3.rot : eA >= 1 ? rest : travel + angDiff(travel, rest) * clamp01((eA - .8) / .2);
        // the right cluster's roaches turn red gradually as they walk to it (Vali 2026-11-12)
        o.c = a[2] === 1 ? ease.smooth(clamp01(eA / .9)) : 0;
        o.a = 1; o.s = lerp(s3.s, 5, eA);
        o.legs = s3.legs + eA * Math.hypot(ax - s3.x, ay - s3.y) / 5 * 1.3;   // continues S3's walk cycle
      } else {                                             // sort B: claim → correction, arcing up (storyboard)
        x = lerp(ax, bx, eB); y = lerp(ay, by, eB) - Math.sin(eB * Math.PI) * 40 * this.H / 900;
        travel = Math.atan2(by - ay, bx - ax);
        rot = eB <= 0 || eB >= 1 ? rest : travel + (eB > .8 ? angDiff(travel, rest) * (eB - .8) / .2 : 0);
        o.c = a[2] === 1 ? 1 - ease.smooth(clamp01((eB - .35) / .3)) : 0;
        o.a = b[2] === 1 ? lerp(1, .55, ease.smooth(clamp01((eB - .5) / .5))) : 1;
        o.s = 5;
        o.legs = s3.legs + Math.hypot(ax - s3.x, ay - s3.y) / 5 * 1.3 + eB * Math.hypot(bx - ax, by - ay) / 5 * 1.3;
      }
      o.x = x; o.y = y; o.rot = rot;
    }
    return P;
  },
};

export default def => {
  let ctx, W = 0, H = 0, p = 0, el = {};
  const P = [], S3 = [];
  return {
    id: def.id,
    init(c) {
      ctx = c; loadCss(CSS);
      const d = c.data, src = d.byId.source;
      const start = d.byId.node.start, beat = start.sub_beats.find(b => b.id === 'start_pushback');
      const push = beat?.facts.find(f => /Pakistani/.test(f.text));
      const row = m => d.metrics.rows.find(r => r.metric === m);
      const pak = row('Share of Pakistani followers'), ind = row('Share of Indian audience');
      this.pak = pak; this.ind = ind;
      const [claimTxt, rebutTxt] = push ? push.text.split(/(?<=\.)\s+/) : ['', ''];
      const st = s => `<span class="st st-${esc(s)}">${esc(s)}</span>`;
      // a cluster label: name, value with *, claimant · status (the 51% is the minister's own complement: GAPS)
      const lab = (cls, name, f) => `<div class="cl-lab ${cls}"><span class="nm">${esc(name)}</span>${f ? `<span class="v t-num">${esc(f.value_text)}${star(f.source_ids, src, f.claimant)}</span><span class="cl t-micro">${esc(f.claimant)} · ${st(f.status)}</span>` : ''}</div>`;
      c.root.classList.add('s35');
      c.root.innerHTML = `
        ${lab('claim-l', 'Indian', pak && { ...pak, value_text: `${100 - pak.value}%` })}
        ${lab('claim-r', 'Pakistani', pak)}
        ${lab('rebut-l', 'Indian', ind)}
        ${lab('rebut-r', 'Elsewhere', null)}
        <p class="cl-cap cap-claim">${esc(claimTxt)}${push ? star(push.source_ids, src, push.claimant) : ''}<span class="cl-a">${esc(push?.attribution)} · ${st(push?.status)}</span></p>
        <p class="cl-cap cap-rebut">${esc(rebutTxt)}${ind ? star(ind.source_ids, src, ind.claimant) : ''}<span class="cl-a">${esc(ind?.claimant)} · ${st(ind?.status)}</span></p>`;
      for (const k of ['claim-l', 'claim-r', 'rebut-l', 'rebut-r']) el[k] = c.root.querySelector('.' + k);
      el.capC = c.root.querySelector('.cap-claim'); el.capR = c.root.querySelector('.cap-rebut');
      el.capRa = el.capR.querySelector('.cl-a');
      this.ready = !!(pak && ind);
    },
    resize(w, h) {
      W = w; H = h; claim.layout(w, h, this.pak?.value ?? 49, this.ind?.value ?? 94);
      const C = claim.CLAIM, R = claim.REBUT, gap = 28 * h / 900;
      const at = (e, x, y) => { e.style.left = x + 'px'; e.style.top = y + 'px'; };
      at(el['claim-l'], C.cxL, C.cy + C.rL + gap); at(el['claim-r'], C.cxR, C.cy + C.rR + gap);
      at(el['rebut-l'], R.cxL, R.cy + R.rL + gap); at(el['rebut-r'], R.cxR, R.cy + R.rR + gap);
    },
    enter() {},
    exit() { ctx.layers.swarm.ctx.clearRect(0, 0, W, H); },
    update(q) { p = q; backdrop.scroll(def, p); render(); },
    tick() { render(); },
  };
  function fade(e, a) { e.style.opacity = a; e.style.visibility = a > 0 ? '' : 'hidden'; }
  function render() {
    // DOM: labels and captions are functions of p only
    const out = 1 - clamp01((p - .97) / .03);
    const inOut = (a, b, c, d) => clamp01((p - a) / (b - a)) * (1 - clamp01((p - c) / (d - c)));
    fade(el['claim-l'], inOut(.17, .23, .59, .62)); fade(el['claim-r'], inOut(.17, .23, .59, .62));
    fade(el.capC, inOut(.40, .45, .59, .62));
    fade(el.capR, clamp01((p - .64) / .05) * out);
    el.capRa.style.opacity = clamp01((p - .82) / .05);
    fade(el['rebut-l'], clamp01((p - .82) / .05) * out); fade(el['rebut-r'], clamp01((p - .82) / .05) * out);
    // swarm
    const g = ctx.layers.swarm.ctx, fg = tok('--roach'), red = tok('--accent');
    claim.poses(p, ctx.clock.t, P, ctx.swarm.list, S3);
    g.clearRect(0, 0, W, H);
    g.fillStyle = g.strokeStyle = fg;
    for (const o of P) { const a = o.a * (1 - o.c); if (a > .01) { g.globalAlpha = a; roach(g, o.x, o.y, o.rot, o.s, o.legs); } }
    g.fillStyle = g.strokeStyle = red;
    for (const o of P) { const a = o.a * o.c; if (a > .01) { g.globalAlpha = a; roach(g, o.x, o.y, o.rot, o.s, o.legs); } }
    g.globalAlpha = 1;
  }
};

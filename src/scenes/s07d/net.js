// S7d · the spokes network: geometry, SVG markup and the paused anime.js timeline that draws it (seeked by p).
// CJP at the hub; actors on spokes, grouped in angular sectors (group order, gap between groups). Labels outside.
import { createTimeline, utils } from 'animejs';
import { esc } from '../../lib/text.js';
import { P } from './model.js';

export const T = 10000;   // timeline length in ms ≙ p 0 → 1 (seek(p × T))
const GAP = .8;           // gap between groups, in node slots
const DOT = 6.5, DOT_ON = 10, HUB = 30;

let measureCtx;
function textW(s, font) {
  measureCtx ??= document.createElement('canvas').getContext('2d');
  measureCtx.font = font;
  return measureCtx.measureText(s).width;
}

// positions for a w × h box
export function layout(m, w, h, { labelFont }) {
  const n = m.actors.length, units = n + m.groups.length * GAP, step = Math.PI * 2 / units;
  const lw = Math.max(...m.actors.map(a => textW(a.label, labelFont)));
  const R = Math.max(110, Math.min(h / 2 - 30, w / 2 - lw - 30));
  const cx = w / 2, cy = h / 2;
  let u = GAP / 2;
  const nodes = [], sectors = [];
  for (const g of m.groups) {
    const u0 = u;
    for (const a of g.actors) {
      const ang = -Math.PI / 2 + (u + .5) * step, c = Math.cos(ang), s = Math.sin(ang);
      nodes[a.i] = { a, ang, x: cx + c * R, y: cy + s * R, hx: cx + c * (HUB + 4), hy: cy + s * (HUB + 4),
        tx: cx + c * (R + DOT + 9), ty: cy + s * (R + DOT + 9), anchor: c > .2 ? 'start' : c < -.2 ? 'end' : 'middle', c, s };
      u += 1;
    }
    sectors.push({ g, n: g.actors.length, mid: -Math.PI / 2 + ((u0 + u) / 2) * step });
    u += GAP;
  }
  return { w, h, cx, cy, R, step, nodes, sectors };
}

const f1 = v => v.toFixed(1);

export function svgHTML(m, L) {
  const { cx, cy, R } = L;
  // group labels inside the ring, at the sector's middle; for an odd count that is on a spoke, so step half a slot
  // clockwise into the gap between spokes (for a one-actor group: the gap after it). Haloed; spokes pass behind.
  const sectors = L.sectors.map(({ g, mid, n }) => {
    const ang = mid + (n % 2 ? L.step / 2 : 0), r = R * .6, lx = cx + Math.cos(ang) * r, ly = cy + Math.sin(ang) * r;
    return `<g class="s7d-sec" data-g="${g.i}"><text class="s7d-glab" x="${f1(lx)}" y="${f1(ly + 4)}" text-anchor="middle">${esc(g.label)}</text></g>`;
  }).join('');
  const spokes = L.nodes.map(n => `<line class="s7d-sp k-${n.a.edge}" data-i="${n.a.i}" x1="${f1(n.hx)}" y1="${f1(n.hy)}" x2="${f1(n.hx)}" y2="${f1(n.hy)}"/>`).join('');
  const nodes = L.nodes.map(n => {
    const a = n.a;
    return `<g class="s7d-nd k-${a.edge}" data-i="${a.i}" tabindex="0" role="button" aria-label="${esc(a.label)}">
      <g class="s7d-ndi" style="transform-origin:${f1(n.x)}px ${f1(n.y)}px">
        <circle class="hit" cx="${f1(n.x)}" cy="${f1(n.y)}" r="20"/>
        <circle class="dot" cx="${f1(n.x)}" cy="${f1(n.y)}" r="${DOT}"/>
        <text x="${f1(n.tx)}" y="${f1(n.ty + 4 + n.s * 5)}" text-anchor="${n.anchor}">${esc(a.label)}</text>
      </g></g>`;
  }).join('');
  return `<g class="s7d-secs">${sectors}</g><g class="s7d-sps">${spokes}</g>
    <g class="s7d-hub" style="transform-origin:${f1(cx)}px ${f1(cy)}px">
      <circle class="pulse" cx="${f1(cx)}" cy="${f1(cy)}" r="${HUB}"/>
      <circle class="core" cx="${f1(cx)}" cy="${f1(cy)}" r="${HUB}"/>
      <text x="${f1(cx)}" y="${f1(cy + 4.5)}" text-anchor="middle">${esc(m.hub.label)}</text></g>
    <g class="s7d-nds">${nodes}</g>`;
}

// the draw-in as one paused timeline: hub grows, then each group's spokes grow from the hub (staggered), each node
// pops in as its spoke arrives, and the group's label fades in. Scrubbed with tl.seek(p × T); never plays.
export function buildTimeline(m, L, svg) {
  const q = s => [...svg.querySelectorAll(s)];
  const hub = svg.querySelector('.s7d-hub'), sps = q('.s7d-sp'), ndi = q('.s7d-ndi'), secs = q('.s7d-sec');
  // start state (so any seek, including 0, renders the same frame)
  utils.set(hub, { scale: 0, opacity: 0 });
  utils.set(ndi, { scale: .3, opacity: 0 });
  utils.set(secs, { opacity: 0 });
  const tl = createTimeline({ autoplay: false, defaults: { ease: 'outCubic' } });
  tl.add(hub, { scale: [0, 1], opacity: [0, 1], duration: (P.hub[1] - P.hub[0]) * T, ease: 'outBack(1.4)' }, P.hub[0] * T);
  for (const g of m.groups) {
    const t0 = g.draw[0] * T, len = (g.draw[1] - g.draw[0]) * T;
    const st = Math.min(110, len * .5 / Math.max(1, g.actors.length));
    const dur = len - st * (g.actors.length - 1) - 120;
    g.actors.forEach((a, j) => {
      const n = L.nodes[a.i], at = t0 + j * st;
      tl.add(sps[a.i], { x2: [n.hx, n.x], y2: [n.hy, n.y], duration: dur * .7 }, at);
      tl.add(ndi[a.i], { scale: [.3, 1], opacity: [0, 1], duration: dur * .45, ease: 'outBack(1.6)' }, at + dur * .55);
    });
    tl.add(secs[m.groups.indexOf(g)], { opacity: [0, 1], duration: len * .6 }, t0 + len * .3);
  }
  tl.add({ duration: 1 }, T - 1);   // pad to T so seek(p × T) maps 1:1
  return tl;
}

export const DOT_R = { off: DOT, on: DOT_ON };

// S7c · Chart C: who filmed it. One roach per video (1,244, the existing roach() renderer, wrapped), grouped by
// upload day (IST) left to right, each day a block of columns up to R roaches tall, stacked by the corpus's own
// source tag: news (black) at the bottom, citizen (grey), party (red) on top. Days with no uploads are skipped,
// so the x axis is the order of upload days, not to scale in time (said in the note and on the axis).
// Motion (one scrubbed anime.js timeline): each roach crawls up from below the baseline into its slot; the delay is
// the block's position along the axis, so the record fills in upload order and the four crackdown days flood in
// last. Legs move with distance crawled (pure in p). Story-node markers and day labels draw in as their day fills.
import { stagger } from 'animejs';
import { esc } from '../../lib/text.js';
import { tok, fitCanvas } from '../../lib/dom.js';
import { roach } from '../../roach/roach.js';
import { hash01 } from '../../roach/swarm.js';
import { SOURCES } from './model.js';
import { fmtInt, day, span, spanHTML, corpusStar, collected, at, fromTo, drawIn, placeTip, hideTip, rowLabels } from './common.js';

const NS = 'http://www.w3.org/2000/svg';
const M = { l: 40, r: 8, t: 44, b: 40 };
const DAYGAP = .3;            // gap between day blocks, in cells
const CLS = { news: 's1', citizen: 's2', party: 'hi' };
const UP = -Math.PI / 2;      // roaches at rest face up the column

export function chartC(m, data) {
  const st = corpusStar(data), col = collected(data);
  const attr = `Computed from the YouTube clip corpus${col ? ` · collected ${col}` : ''}`;
  const W = m.window;
  const busiest = m.series.reduce((a, b) => (b.n > a.n ? b : a));
  const partyCh = m.party.length === 1 ? m.party[0].name : null;
  let svg, g = {}, cv, c2, tip, cell, plot, w = 0, h = 0, R = 40, cs = 10, y0 = 0, U = [], B = [], ink = {};

  const api = {
    title: 'Who filmed it: videos by source tag',
    legend: `<div class="s7-legrow"><p class="s7-ylab">Each roach is one video, by upload day (IST) and the corpus’s own source tag</p>
      <ul class="s7-legend">${SOURCES.map(s => `<li><i class="s7-sw s7-sw-${CLS[s]}" aria-hidden="true"></i>${esc(s)}</li>`).join('')}</ul></div>`,
    // before → the crackdown → the last day
    callouts: [
      W && { value: fmtInt(W.before.party), n: W.before.party, fmt: v => fmtInt(v), swatch: 'hi', star: st, attr,
        text: `of the ${fmtInt(W.before.clips)} videos uploaded before ${esc(day(W.from))} carry the “party” tag${partyCh ? `, all from the channel named ${esc(partyCh)}` : ''}` },
      W && { value: fmtInt(W.clips), n: W.clips, fmt: v => fmtInt(v), star: st, attr,
        text: `of the ${fmtInt(m.total.clips)} videos were uploaded in the ${W.days} days ${spanHTML(W.from, W.to)}` },
      { value: fmtInt(busiest.n), n: busiest.n, fmt: v => fmtInt(v), star: st, attr,
        text: `videos on ${esc(day(busiest.d))}, the busiest upload day${busiest.d === m.last.d ? ' and the corpus’s last' : ''}` },
    ].filter(Boolean),
    calloutAt: null,          // set in layout (where the blocks fall on the axis)
    note: `Source tags (news, citizen, party) are the corpus’s own machine tags, unreviewed and sometimes wrong. Days with no uploads are left out, so the axis is not to scale in time. Upload date is not the filming date. The corpus stops at ${esc(day(m.last.d))}.`,

    mount(plotEl, tipEl, cellEl) {
      plot = plotEl; tip = tipEl; cell = cellEl;
      svg = document.createElementNS(NS, 'svg'); svg.classList.add('s7-svg');
      svg.setAttribute('role', 'img');
      svg.setAttribute('aria-label', `Unit chart: ${fmtInt(m.total.clips)} videos, one mark each, by upload day and source tag: ${SOURCES.map(s => `${s} ${m.bySource[s]}`).join(', ')}.`);
      svg.innerHTML = `<g class="grid"></g><g class="nodes"></g><g class="xt"></g><text class="s7-xlab" text-anchor="end"></text><path class="base"/><g class="cnt"></g>`;
      plot.append(svg);
      cv = document.createElement('canvas'); cv.className = 's7-roach'; cv.setAttribute('aria-hidden', 'true'); plot.append(cv);
      svg.insertAdjacentHTML('beforeend', '<g class="hover" visibility="hidden"><rect class="hb"/></g><rect class="hit" fill="transparent"/>');
      g = Object.fromEntries(['grid', 'nodes', 'xt', 'base', 'cnt', 'hover', 'hb', 'hit'].map(k => [k, svg.querySelector('.' + k)]));
      g.xlab = svg.querySelector('.s7-xlab');
      g.hit.addEventListener('pointermove', onMove);
      g.hit.addEventListener('pointerleave', () => { g.hover.setAttribute('visibility', 'hidden'); hideTip(tip); });
    },

    layout(W_, H_) {
      w = W_; h = H_;
      svg.setAttribute('width', w); svg.setAttribute('height', h); svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      c2 = fitCanvas(cv, w, h);
      ink = Object.fromEntries(SOURCES.map(s => [s, tok({ news: '--chart-1', citizen: '--chart-2', party: '--chart-hi' }[s], cell)]));
      // the column height that gives the biggest roaches in the space
      const pw = w - M.l - M.r, ph = h - M.t - M.b;
      let best = 0;
      for (let r = 25; r <= 60; r += 5) {
        const ncol = m.blocks.reduce((a, b) => a + Math.ceil(b.n / r), 0) + DAYGAP * (m.blocks.length - 1);
        const s = Math.min(pw / ncol, ph / r);
        if (s > best + .2) { best = s; R = r; }
      }
      cs = best; y0 = h - M.b;
      // block geometry
      let x = M.l; B = m.blocks.map(b => { const ncol = Math.ceil(b.n / R), o = { ...b, x, ncol, w: ncol * cs }; x += (ncol + DAYGAP) * cs; return o; });
      const xEnd = x - DAYGAP * cs, span01 = v => (v - M.l) / (xEnd - M.l);
      // units: slot in its day block, column-major from the bottom
      U = m.units.map((u, i) => {
        const b = B.find(bb => bb.d === u.d), c = Math.floor(u.k / R), r = u.k % R;
        const sx = b.x + (c + .5) * cs, sy = y0 - (r + .5) * cs;
        const ox = sx + (hash01(i, 3) - .5) * 60, oy = y0 + 30 + hash01(i, 5) * 60;     // start: below the baseline
        return { src: u.src, d: u.d, sx, sy, ox, oy, x01: span01(sx), u: 0 };
      });
      // row scale: videos per column
      const ticks = []; for (let v = 10; v < R; v += 10) ticks.push(v); ticks.push(R);
      g.grid.innerHTML = ticks.map(v => `<line x1="${M.l}" x2="${xEnd}" y1="${y0 - v * cs}" y2="${y0 - v * cs}"/><text x="${M.l - 8}" y="${y0 - v * cs + 4}" text-anchor="end">${v}</text>`).join('')
        + `<text class="ycap" transform="translate(${M.l - 30} ${y0 - R * cs / 2}) rotate(-90)" text-anchor="middle">videos per column</text>`;
      g.base.setAttribute('d', `M${M.l} ${y0}H${xEnd}`);
      // day labels under chosen blocks (first, the story nodes, the window days), skipping any that would collide
      const want = new Set([B[0].d, ...m.nodes.map(n => n.d), ...(W ? B.filter(b => b.d >= W.from).map(b => b.d) : [])]);
      let last = -Infinity; const xt = [];
      for (const b of B) {
        if (!want.has(b.d)) continue;
        const cx = b.x + b.w / 2, lw = 38;
        if (cx - lw / 2 < last + 6) continue;
        last = cx + lw / 2; xt.push(`<g data-d="${b.d}"><line x1="${cx}" x2="${cx}" y1="${y0}" y2="${y0 + 5}"/><text x="${cx}" y="${y0 + 20}" text-anchor="middle">${esc(day(b.d))}</text></g>`);
      }
      g.xt.innerHTML = xt.join('');
      g.xlab.setAttribute('x', xEnd); g.xlab.setAttribute('y', h - 2); g.xlab.textContent = 'Upload days with videos, in order (IST)';
      // counts over the big blocks
      g.cnt.innerHTML = B.filter(b => b.ncol >= 2).map(b => `<text class="t-num" data-d="${b.d}" x="${b.x + b.w / 2}" y="${y0 - R * cs - 6}" text-anchor="middle">${fmtInt(b.n)}</text>`).join('');
      // story nodes: label above, line down to the top of that day's stack
      g.nodes.innerHTML = m.nodes.map(n => `<g data-id="${esc(n.id)}"><path/><text>${esc(n.label)}</text></g>`).join('');
      const items = [...g.nodes.children].map((el, i) => {
        const b = B.find(bb => bb.d === m.nodes[i].d);
        return { b, x: b ? b.x + b.w / 2 : -999, text: el.querySelector('text') };
      });
      rowLabels(items, xEnd + M.r, { y0: 12 }).forEach((y, i) => {
        const { b, x: nx } = items[i], top = b ? y0 - Math.min(b.n, R) * cs - (b.ncol >= 2 ? 22 : 4) : y0;
        items[i].text.parentNode.querySelector('path').setAttribute('d', `M${nx} ${y + 4}V${top}`);
        if (!b) items[i].text.parentNode.style.display = 'none';
      });
      g.hit.setAttribute('x', M.l); g.hit.setAttribute('y', M.t); g.hit.setAttribute('width', xEnd - M.l); g.hit.setAttribute('height', y0 - M.t);
      // callouts appear as their part of the record fills: before the window, the window, the last day
      const winB = W && B.find(b => b.d === W.from), lastB = B.at(-1);
      api.calloutAt = [winB ? span01(winB.x) * .55 + .02 : .4, winB ? .55 + .25 : .7, span01(lastB.x) * .55 + .27];
      api._fill = .55;    // the share of the draw-in the crawl takes (a block at x01 starts at x01 × this)
    },

    build(tl) {
      const crawl = at(api._fill) - at(0);
      tl.add(U, { u: [0, 1], duration: 150, ease: 'outQuart',
        delay: (o, i) => o.x01 * crawl + hash01(i, 9) * 40 }, at(0));
      drawIn(tl, g.base, 30, { duration: 150, ease: 'inOutQuart' });
      fromTo(tl, [g.grid, g.xlab], { opacity: 0 }, { opacity: 1 }, 60, { duration: 120 });
      // day labels, counts and node markers arrive with their block
      const xOf = d => U.find(u => u.d === d)?.x01 ?? 0;
      for (const el of g.xt.children) fromTo(tl, el, { opacity: 0 }, { opacity: 1 }, at(xOf(el.dataset.d) * api._fill), { duration: 40 });
      for (const el of g.cnt.children) fromTo(tl, el, { opacity: 0 }, { opacity: 1 }, at(xOf(el.dataset.d) * api._fill + .2), { duration: 60 });
      [...g.nodes.children].forEach((el, i) => {
        const pos = at(xOf(m.nodes[i].d) * api._fill + .05);
        drawIn(tl, el.querySelector('path'), pos, { duration: 50 });
        fromTo(tl, el.querySelector('text'), { opacity: 0 }, { opacity: 1 }, pos, { duration: 40 });
      });
    },

    draw(t = 0) {
      c2.clearRect(0, 0, w, h);
      const s = Math.min(6, cs * .44), still = !t;
      for (let i = 0; i < U.length; i++) {
        const o = U[i]; if (o.u <= 0) continue;
        const x = o.ox + (o.sx - o.ox) * o.u, y = o.oy + (o.sy - o.oy) * o.u;
        if (y > y0 + s) continue;                                        // still below the baseline: not drawn yet
        const head = Math.atan2(o.sy - o.oy, o.sx - o.ox), k = Math.max(0, (o.u - .75) / .25);
        const rot = head + (UP - head) * k * k * (3 - 2 * k);
        const walked = Math.hypot(o.sx - o.ox, o.sy - o.oy) * o.u;
        const idle = still || o.u < 1 ? 0 : Math.sin(t * (1.3 + hash01(i, 7)) + i) * .5;
        c2.fillStyle = c2.strokeStyle = ink[o.src];
        roach(c2, x, y, rot, s, walked / 3 + idle);
      }
    },
    idle: true,
  };

  function onMove(e) {
    const r = svg.getBoundingClientRect(), x = e.clientX - r.left;
    const b = B.find(bb => x >= bb.x - cs * DAYGAP / 2 && x <= bb.x + bb.w + cs * DAYGAP / 2);
    if (!b || !(U[b.from]?.u > .9)) { g.hover.setAttribute('visibility', 'hidden'); hideTip(tip); return; }
    g.hover.setAttribute('visibility', 'visible');
    const top = y0 - Math.min(b.n, R) * cs;
    Object.entries({ x: b.x - 2, y: top - 2, width: b.w + 4, height: y0 - top + 2 }).forEach(([k, v]) => g.hb.setAttribute(k, v));
    const pr = plot.getBoundingClientRect(), cr = cell.getBoundingClientRect();
    placeTip(tip, cell, b.x + b.w + pr.left - cr.left, top + pr.top - cr.top,
      `<b>${esc(day(b.d))}</b> <span class="u">upload day (IST)</span><br><span class="t-num">${fmtInt(b.n)}</span> video${b.n === 1 ? '' : 's'}: ${SOURCES.filter(q => b.day[q]).map(q => `${q} <span class="t-num">${b.day[q]}</span>`).join(' · ')}<br><span class="src">YouTube clip corpus${col ? `, collected ${esc(col)}` : ''}</span>`, { side: b.x + b.w + 260 > w ? 'left' : 'auto' });
  }

  return api;
}

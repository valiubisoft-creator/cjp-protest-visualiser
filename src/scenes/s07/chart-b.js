// S7b · Chart B: who carried it. A 1,000-cell waffle of ALL views in the corpus (1 cell = 0.1% = 117,731 views),
// filled column by column from the bottom left in rank order: the 10 most-viewed channels (alternating black and
// grey so neighbours stay apart), then the other 245 channels as one light-grey block. The channel named
// "Cockroach Janta Party" is too small for one cell (0.63 of a cell): it is drawn beside the grid to the same scale,
// in red. Cells per group use largest-remainder rounding; every exact count is in the tooltip and the callouts.
// Motion (one scrubbed anime.js timeline): the cells ripple in from the bottom-left corner (stagger on a grid), the
// top-10 outline draws itself (createDrawable), then the scale key and the red speck.
import { stagger, utils } from 'animejs';
import { esc } from '../../lib/text.js';
import { fmtInt, fmtM, pct, day, corpusStar, collected, at, fromTo, drawIn, placeTip, hideTip } from './common.js';

const NS = 'http://www.w3.org/2000/svg';
const SIDE = 190;        // right band for the scale key and the party speck
const BOTTOM = 52;       // band under the grid for the group labels
const GAP = 2;           // surface gap between cells

export function chartB(m, data) {
  const st = corpusStar(data), col = collected(data);
  const attr = `Computed from the YouTube clip corpus${col ? ` · collected ${col}` : ''}`;
  const party = m.party[0], wf = m.waffle, G = wf.groups, other = G.find(g => g.other);
  const top10 = G.filter(g => !g.other), top10cells = top10.reduce((a, g) => a + g.cells, 0);
  let svg, g = {}, tip, cell, plot, w = 0, h = 0, rows = 25, cols = 40, cs = 0, gx = 0, gy = 0, owner = [];

  const api = {
    title: 'Who carried it: views by channel',
    legend: `<p class="s7-ylab">All ${fmtInt(m.total.views)} views in the corpus as 1,000 squares · one square = 0.1% = ${fmtInt(wf.perCell)} views</p>`,
    callouts: [
      { value: pct(m.top.views / m.total.views), n: Math.round(m.top.views / m.total.views * 100), fmt: v => `${Math.round(v)}%`, star: st, attr,
        text: `of all views went to one channel, ${esc(m.top.name)}, across its ${fmtInt(m.top.n)} videos` },
      { value: pct(m.top10.share), n: Math.round(m.top10.share * 100), fmt: v => `${Math.round(v)}%`, star: st, attr,
        text: `of all views went to the 10 most-viewed of the corpus’s ${fmtInt(m.channels.length)} channels` },
      party && { value: fmtInt(party.views), n: party.views, fmt: v => fmtInt(v), swatch: 'hi', star: st, attr,
        text: `views in all for the ${fmtInt(party.n)} videos from the channel named ${esc(party.name)}` },
    ].filter(Boolean),
    calloutAt: [.30, .70, .82],
    note: `Squares are rounded to the nearest 0.1% of views (largest remainder); exact counts are in the callouts and on hover. Channel names are as the corpus records them. Views are counted at collection. The corpus is machine-tagged and unreviewed, and it stops at ${esc(day(m.last.d))}.`,

    mount(plotEl, tipEl, cellEl) {
      plot = plotEl; tip = tipEl; cell = cellEl;
      svg = document.createElementNS(NS, 'svg'); svg.classList.add('s7-svg');
      svg.setAttribute('role', 'img');
      svg.setAttribute('aria-label', `Waffle chart: all views as 1,000 squares. ${top10.map(x => `${x.name} ${x.cells}`).join(', ')}, ${other.channels} other channels ${other.cells}.`);
      svg.innerHTML = `<g class="cells"></g><path class="outline"/><g class="glab"></g><g class="key"><rect class="k1"/><text class="kt1"/><rect class="speck"/><path class="lead"/><text class="kt2"/></g>`;
      plot.append(svg);
      plot.insertAdjacentHTML('beforeend', '<div class="s7-blabs"></div>');
      g = { cells: svg.querySelector('.cells'), outline: svg.querySelector('.outline'), glab: svg.querySelector('.glab'), key: svg.querySelector('.key'),
        blabs: plot.querySelector('.s7-blabs') };
      g.cells.addEventListener('pointerover', onOver);
      g.cells.addEventListener('pointerleave', () => { hideTip(tip); g.cells.classList.remove('hov'); });
    },

    layout(W_, H_) {
      w = W_; h = H_;
      svg.setAttribute('width', w); svg.setAttribute('height', h); svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      // the grid shape that gives the biggest squares in the space
      let best = 0;
      for (const r of [20, 25]) { const c = wf.cells / r, s = Math.min((w - SIDE) / c, (h - BOTTOM) / r); if (s > best) { best = s; rows = r; cols = c; } }
      cs = Math.floor(best * 2) / 2; gx = 0; gy = Math.max(0, Math.round((h - BOTTOM - rows * cs) / 2));
      // owner of each cell index (column-major from the bottom left)
      owner = []; G.forEach((grp, gi) => { for (let k = 0; k < grp.cells; k++) owner.push(gi); });
      const pos = i => { const c = Math.floor(i / rows), r = rows - 1 - (i % rows); return [gx + c * cs, gy + r * cs]; };
      // DOM order row-major (so anime's grid stagger reads it as a grid); data-i = fill index
      const html = [];
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const i = c * rows + (rows - 1 - r), gi = owner[i], grp = G[gi], cls = grp.other ? 'o' : gi % 2 ? 'b' : 'a';
        html.push(`<rect data-i="${i}" data-g="${gi}" class="${cls}" x="${(gx + c * cs + GAP / 2).toFixed(1)}" y="${(gy + r * cs + GAP / 2).toFixed(1)}" width="${(cs - GAP).toFixed(1)}" height="${(cs - GAP).toFixed(1)}"/>`);
      }
      g.cells.innerHTML = html.join('');
      // outline round the top-10 cells (a stair-step: full columns, then the part-filled one)
      const fullC = Math.floor(top10cells / rows), part = top10cells % rows, o = 3;
      const x0 = gx - o, yT = gy - o, yB = gy + rows * cs + o, xF = gx + fullC * cs + o - GAP / 2;
      const yP = gy + (rows - part) * cs - o + GAP / 2, xP = gx + (fullC + 1) * cs + o - GAP / 2;
      g.outline.setAttribute('d', part
        ? `M${x0} ${yB}V${yT}H${xF}V${yP}H${xP}V${yB}Z`
        : `M${x0} ${yB}V${yT}H${xF}V${yB}Z`);
      // group labels under the grid
      const yl = gy + rows * cs + 22;
      g.glab.innerHTML = `<text class="g1" x="${gx}" y="${yl}"><tspan class="nm">The 10 most-viewed channels</tspan><tspan class="t-num" x="${gx}" dy="15">${fmtInt(m.top10.views)} views · ${pct(m.top10.share)}</tspan></text>
        <text class="g2" x="${gx + cols * cs}" y="${yl}" text-anchor="end"><tspan class="nm">${fmtInt(other.channels)} other channels</tspan><tspan class="t-num" x="${gx + cols * cs}" dy="15">${fmtInt(other.views)} views · ${pct(other.views / m.total.views)}</tspan></text>`;
      // names inside the blocks big enough to hold them (HTML, so long names can wrap)
      g.blabs.innerHTML = '';
      let start = 0;
      G.forEach((grp, gi) => {
        const a = start, b = start + grp.cells; start = b;
        const c0 = Math.ceil(a / rows), c1 = Math.floor(b / rows);        // full columns of this block
        if (grp.other || c1 - c0 < 3) return;
        g.blabs.insertAdjacentHTML('beforeend', `<div class="s7-blab ${gi % 2 ? 'b' : 'a'}" data-g="${gi}" style="left:${gx + c0 * cs}px;top:${gy}px;width:${(c1 - c0) * cs - GAP}px;height:${rows * cs - GAP}px"><p><b>${esc(grp.name)}</b><span class="t-num">${pct(grp.views / m.total.views)}</span></p></div>`);
      });
      // scale key and the party speck, to the same scale, in the right band
      const kx = gx + cols * cs + 28, ky = gy + 6, s1 = cs - GAP;
      const q = s => g.key.querySelector(s);
      Object.entries({ x: kx, y: ky, width: s1, height: s1 }).forEach(([k, v]) => q('.k1').setAttribute(k, v));
      q('.kt1').setAttribute('x', kx + s1 + 10); q('.kt1').setAttribute('y', ky + s1 / 2 + 4);
      q('.kt1').innerHTML = `<tspan class="t-num">= ${fmtInt(wf.perCell)} views</tspan>`;
      if (party) {
        // the party channel's views as a square of the same scale (0.63 of a square), with its label beside it
        const ps = Math.sqrt(party.views / wf.perCell) * s1, py = ky + s1 + 34, tx = kx + s1 + 10;
        Object.entries({ x: kx + (s1 - ps) / 2, y: py + (s1 - ps) / 2, width: ps, height: ps }).forEach(([k, v]) => q('.speck').setAttribute(k, v.toFixed(2)));
        q('.kt2').setAttribute('x', tx); q('.kt2').setAttribute('y', py + s1 / 2 + 4);
        q('.kt2').innerHTML = `<tspan class="nm" x="${tx}">${esc(party.name)}</tspan><tspan x="${tx}" dy="15" class="t-num">${fmtInt(party.views)} views</tspan><tspan x="${tx}" dy="15" class="t-num">${fmtInt(party.n)} videos</tspan>`;
        q('.lead').setAttribute('d', `M${kx - 6} ${py - 12}H${kx + 150}`);
      }
    },

    build(tl) {
      const rects = [...g.cells.children];
      // ripple in from the bottom-left corner over the first ~55% of the draw-in
      utils.set(rects, { scale: 0, opacity: 0 });
      tl.add(rects, { scale: [0, 1], opacity: [0, 1], duration: 70, ease: 'outQuart',
        delay: stagger([0, at(.5) - at(0)], { grid: [cols, rows], from: (rows - 1) * cols, ease: 'inOutSine' }) }, at(0));
      // block names as their block lands
      [...g.blabs.children].forEach(el => {
        const gi = +el.dataset.g, mid = G.slice(0, gi).reduce((a, x) => a + x.cells, 0) / wf.cells;
        fromTo(tl, el, { opacity: 0 }, { opacity: 1 }, at(Math.min(.6, mid * .5 + .12)), { duration: 50 });
      });
      drawIn(tl, g.outline, at(.6), { duration: at(.76) - at(.6), ease: 'inOutQuad' });
      fromTo(tl, g.glab.querySelector('.g1'), { opacity: 0 }, { opacity: 1 }, at(.68), { duration: 50 });
      fromTo(tl, g.glab.querySelector('.g2'), { opacity: 0 }, { opacity: 1 }, at(.72), { duration: 50 });
      const q = s => g.key.querySelector(s);
      fromTo(tl, [q('.k1'), q('.kt1')], { opacity: 0 }, { opacity: 1 }, at(.76), { duration: 50 });
      fromTo(tl, q('.speck'), { opacity: 0, scale: 6 }, { opacity: 1, scale: 1 }, at(.84), { duration: 70, ease: 'outExpo' });
      drawIn(tl, q('.lead'), at(.80), { duration: 40 });
      fromTo(tl, q('.kt2'), { opacity: 0 }, { opacity: 1 }, at(.88), { duration: 40 });
    },

    draw() {},
  };

  function onOver(e) {
    const r = e.target.closest('rect'); if (!r || +getComputedStyle(r).opacity < .5) return;
    const gi = +r.dataset.g, grp = G[gi];
    g.cells.classList.add('hov');
    for (const x of g.cells.children) x.classList.toggle('on', x.dataset.g === r.dataset.g);
    const pr = plot.getBoundingClientRect(), cr = cell.getBoundingClientRect(), b = r.getBoundingClientRect();
    const name = grp.other ? `${fmtInt(grp.channels)} other channels` : esc(grp.name);
    placeTip(tip, cell, b.right - cr.left, b.top - cr.top,
      `<b>${name}</b><br><span class="t-num">${fmtInt(grp.views)}</span> views (${(grp.views / m.total.views * 100).toFixed(1)}%) · <span class="t-num">${fmtInt(grp.n)}</span> video${grp.n === 1 ? '' : 's'}<br>${grp.cells} squares<br><span class="src">YouTube clip corpus${col ? `, collected ${esc(col)}` : ''}</span>`);
  }

  return api;
}

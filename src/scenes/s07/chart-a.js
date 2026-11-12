// S7a · Chart A: YouTube views, by upload day (IST): "the line that waited".
// Act 1 (draw 0–0.56): the line is drawn left to right on a ZOOMED linear scale (0–1.5M), so the seven weeks before
//   the crackdown are readable: the 6 Jun spike, the slow July climb. Story-node markers draw down as the pen passes.
// Act 2 (0.56–0.68): the pen reaches 18–21 Jul and the line runs off the top of its own scale.
// Act 3 (0.68–0.90): the scale gives way: both tick sets and the line move together to the full linear scale
//   (0–60M); every in-between frame is still a true linear scale from the same baseline (the slope is interpolated,
//   log-spaced), so nothing is distorted, only re-scaled. Then the peak lands in red.
// A roach walks the pen tip (the existing roach() renderer, wrapped) and rests at the last day. Hold = the honest
// static chart at full scale. All motion is one scrubbed anime.js timeline (see s07-charts.js).
import { stagger } from 'animejs';
import { scaleLinear } from 'd3-scale';
import { esc } from '../../lib/text.js';
import { tok, fitCanvas } from '../../lib/dom.js';
import { roach } from '../../roach/roach.js';
import { fmtInt, fmtM, fmtTick, pct, day, span, spanHTML, corpusStar, collected, at, fromTo, drawIn, state, placeTip, hideTip, rowLabels } from './common.js';

const NS = 'http://www.w3.org/2000/svg';
const M = { l: 56, r: 22, t: 46, b: 46 };
const ACT1 = .56, ACT2 = .68, SCALE_END = .90;

export function chartA(m, data) {
  const st = corpusStar(data), col = collected(data);
  const attr = `Computed from the YouTube clip corpus${col ? ` · collected ${col}` : ''}`;
  const W = m.window;
  const filming = (data.methodology?.videos || '').match(/Upload date is not the filming date\./)?.[0] ?? '';
  const t0 = m.first.t, t1 = m.last.t, frac = t => (t - t0) / (t1 - t0);
  const fWin = W ? frac(Date.parse(W.from + 'T00:00:00Z')) : 1;          // where the pen meets 18 Jul
  const fPre = W ? frac(Date.parse(W.from + 'T00:00:00Z') - 864e5) : 1;   // 17 Jul: the last day before the window
  const preMax = Math.max(...m.series.filter(s => !W || s.d < W.from).map(s => s.views));
  // the pen's draw-in fraction → x fraction (act 1 linear to 17 Jul, act 2 the last four days)
  const penAt = f => (f <= fPre ? f / fPre * ACT1 : ACT1 + (f - fPre) / (1 - fPre) * (ACT2 - ACT1));

  let svg, g = {}, cv, cx2, tip, cell, plot, w = 0, h = 0, Xs, Yz, Yf, y0 = 0, S, ink = '#000';
  let zTicks = [], fTicks = [], curY = null;

  const api = {
    title: 'YouTube views, by upload day',
    legend: `<p class="s7-ylab">Views at collection, summed by upload day (IST)</p>`,
    // context → concentration → peak; each counts up as the line reaches what it describes
    callouts: [
      { value: fmtInt(m.total.clips), n: m.total.clips, fmt: v => fmtInt(v), star: st, attr,
        text: `videos in the corpus, uploaded ${spanHTML(m.first.d, m.last.d)}` },
      W && { value: pct(W.viewsShare), n: Math.round(W.viewsShare * 100), fmt: v => `${Math.round(v)}%`, star: st, attr,
        text: `of all views went to videos uploaded ${spanHTML(W.from, W.to)}, ${W.days} of the corpus’s ${m.series.length} days` },
      { value: fmtM(m.peak.views), n: +(m.peak.views / 1e6).toFixed(1), fmt: v => `${v.toFixed(1)}M`, swatch: 'hi', star: st, attr,
        text: `views on the ${fmtInt(m.peak.n)} videos uploaded on ${esc(day(m.peak.d))}, the peak day` },
    ].filter(Boolean),
    calloutAt: [.06, ACT2, .82],
    note: `${esc(filming)} Views are counted at collection, so the latest uploads had the least time to gather them. The scale starts zoomed in to show the weeks before 18 Jul, then widens to fit the peak. The corpus is machine-tagged and unreviewed, and it stops at ${esc(day(m.last.d))}.`,

    mount(plotEl, tipEl, cellEl) {
      plot = plotEl; tip = tipEl; cell = cellEl;
      svg = document.createElementNS(NS, 'svg'); svg.classList.add('s7-svg');
      svg.setAttribute('role', 'img');
      svg.setAttribute('aria-label', `Line chart of YouTube views by upload day, ${span(m.first.d, m.last.d)}. Peak ${fmtInt(m.peak.views)} views on ${day(m.peak.d)}.`);
      svg.innerHTML = `<defs>
          <clipPath id="s7a-pen"><rect class="pen" x="0" y="0" width="0" height="0"/></clipPath>
          <pattern id="s7a-dots" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="2.5" cy="2.5" r="1.05" class="dot"/></pattern>
        </defs>
        <g class="grid"></g><g class="xt"></g><text class="s7-xlab" text-anchor="end"></text>
        <g class="nodes"></g>
        <g clip-path="url(#s7a-pen)"><path class="wash"/><path class="ln"/></g>
        <path class="base"/>
        <g class="hover" visibility="hidden"><line class="guide"/><circle class="hd" r="4"/></g>
        <circle class="peak" r="6"/>
        <rect class="hit" fill="transparent"/>`;
      plot.append(svg);
      cv = document.createElement('canvas'); cv.className = 's7-roach'; cv.setAttribute('aria-hidden', 'true'); plot.append(cv);
      plot.insertAdjacentHTML('beforeend', `<div class="s7-plab s7-peaklab"><b class="t-num">${esc(fmtM(m.peak.views))}${st}</b><span>${esc(day(m.peak.d))}</span></div>`);
      g = Object.fromEntries(['pen', 'grid', 'xt', 'nodes', 'wash', 'ln', 'base', 'hover', 'guide', 'hd', 'peak', 'hit'].map(k => [k, svg.querySelector('.' + k)]));
      g.xlab = svg.querySelector('.s7-xlab'); g.peakLab = plot.querySelector('.s7-peaklab');
      g.hit.addEventListener('pointermove', onMove);
      g.hit.addEventListener('pointerleave', () => { g.hover.setAttribute('visibility', 'hidden'); hideTip(tip); });
    },

    layout(W_, H_) {
      w = W_; h = H_;
      svg.setAttribute('width', w); svg.setAttribute('height', h); svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      cx2 = fitCanvas(cv, w, h); ink = tok('--chart-1', cell);
      Xs = scaleLinear([t0, t1], [M.l, w - M.r]);
      y0 = h - M.b;
      Yz = scaleLinear([0, preMax], [y0, M.t]).nice(4);                 // act 1: 0–1.5M
      Yf = scaleLinear([0, m.peak.views], [y0, M.t]).nice(6);           // hold: 0–60M
      zTicks = Yz.ticks(3).filter(v => v > 0); fTicks = Yf.ticks(6).filter(v => v > 0);
      // tick rows: zoomed set + full set, both positioned per frame from the current scale
      g.grid.innerHTML = `<g class="t0"><line x1="${M.l}" x2="${w - M.r}" y1="${y0}" y2="${y0}"/><text x="${M.l - 10}" y="${y0 + 4}" text-anchor="end">0</text></g>`
        + [...zTicks.map(v => ['z', v]), ...fTicks.map(v => ['f', v])].map(([s, v]) => `<g class="tk ${s}" data-v="${v}"><line x1="${M.l}" x2="${w - M.r}"/><text x="${M.l - 10}" text-anchor="end">${fmtTick(v)}</text></g>`).join('');
      g.xt.innerHTML = m.series.filter(s => new Date(s.t).getUTCDay() === 1).map(s => `<line x1="${Xs(s.t)}" x2="${Xs(s.t)}" y1="${y0}" y2="${y0 + 5}"/><text x="${Xs(s.t)}" y="${y0 + 20}" text-anchor="middle">${esc(day(s.d))}</text>`).join('');
      g.xlab.setAttribute('x', w - M.r); g.xlab.setAttribute('y', h - 4); g.xlab.textContent = 'Upload day (IST)';
      g.base.setAttribute('d', `M${M.l} ${y0}H${w - M.r}`);
      g.pen.setAttribute('y', -h); g.pen.setAttribute('height', 3 * h);
      g.hit.setAttribute('x', M.l); g.hit.setAttribute('y', M.t); g.hit.setAttribute('width', w - M.l - M.r); g.hit.setAttribute('height', y0 - M.t);
      g.guide.setAttribute('y1', M.t); g.guide.setAttribute('y2', y0);
      g.nodes.innerHTML = m.nodes.map(n => `<g data-id="${esc(n.id)}"><path/><text>${esc(n.label)}</text></g>`).join('');
      const items = [...g.nodes.children].map((el, i) => ({ x: Xs(m.nodes[i].t), text: el.querySelector('text') }));
      rowLabels(items, w - M.r).forEach((y, i) => items[i].text.parentNode.querySelector('path').setAttribute('d', `M${items[i].x} ${y + 4}V${y0}`));
      g.peakLab.style.transform = `translate(${Math.round(Xs(m.peak.t) - 14)}px, ${Math.round(Yf(m.peak.views) - 11)}px) translateX(-100%)`;
    },

    build(tl) {
      S = state({ axes: 0, pen: 0, k: 0, peak: 0 });
      tl.add(S, { axes: [0, 1], duration: 140, ease: 'outQuad' }, 40);
      drawIn(tl, g.base, 20, { duration: 160, ease: 'inOutQuart' });
      tl.add(S, { pen: [0, fPre], duration: at(ACT1) - at(0), ease: 'linear' }, at(0));
      tl.add(S, { pen: [fPre, 1], duration: at(ACT2) - at(ACT1), ease: 'inQuad' }, at(ACT1));
      tl.add(S, { k: [0, 1], duration: at(SCALE_END) - at(ACT2), ease: 'inOutCubic' }, at(ACT2));
      tl.add(S, { peak: [0, 1], duration: 40, ease: 'outExpo' }, at(SCALE_END) - 10);
      // node markers: each drops from its label to the baseline as the pen arrives
      [...g.nodes.children].forEach((el, i) => {
        const pos = at(penAt(frac(m.nodes[i].t))) - 20;
        drawIn(tl, el.querySelector('path'), pos, { duration: 60, ease: 'outQuart' });
        fromTo(tl, el.querySelector('text'), { opacity: 0 }, { opacity: 1 }, pos, { duration: 40 });
      });
      fromTo(tl, [g.xt, g.xlab], { opacity: 0 }, { opacity: 1 }, 60, { duration: 120, delay: stagger(20) });
    },

    draw(t) {
      if (!S) return;
      // the current scale: slope interpolated in log space between zoomed and full, from the same baseline
      const sz = (y0 - M.t) / Yz.domain()[1], sf = (y0 - M.t) / Yf.domain()[1];
      const slope = Math.exp(Math.log(sz) + (Math.log(sf) - Math.log(sz)) * S.k);
      const Y = curY = v => y0 - v * slope;
      // ticks: zoomed labels compress out, full labels arrive from above; hidden outside the plot
      for (const el of g.grid.querySelectorAll('.tk')) {
        const v = +el.dataset.v, y = Y(v), z = el.classList.contains('z');
        const o = (z ? 1 - S.k : S.k) * S.axes * (y >= M.t - .5 && y <= y0 - 8 ? 1 : 0);
        el.setAttribute('transform', `translate(0 ${y.toFixed(2)})`); el.style.opacity = o.toFixed(3);
        el.querySelector('text').setAttribute('y', 4);
      }
      g.grid.querySelector('.t0').style.opacity = S.axes;
      // the line and its halftone wash, revealed up to the pen, clipped a little above the plot
      const pts = m.series.map(s => [Xs(s.t), Math.max(M.t - 30, Y(s.views))]);
      const d = 'M' + pts.map(p => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join('L');
      g.ln.setAttribute('d', d);
      g.wash.setAttribute('d', `${d}L${pts.at(-1)[0]} ${y0}L${pts[0][0]} ${y0}Z`);
      const px = M.l + (w - M.r - M.l) * S.pen;
      g.pen.setAttribute('width', Math.max(0, px + 1));
      // the peak, in red, once the scale has settled
      const pk = S.peak;
      g.peak.setAttribute('cx', Xs(m.peak.t)); g.peak.setAttribute('cy', Y(m.peak.views));
      g.peak.style.opacity = pk; g.peak.setAttribute('r', (6 * (.3 + .7 * pk)).toFixed(2));
      g.peakLab.style.opacity = pk;
      // the roach at the pen tip (wrapped roach(); legs tied to distance walked, so they move only when scrubbed)
      cx2.clearRect(0, 0, w, h);
      if (S.pen > 0) {
        const xf = S.pen * (m.series.length - 1), i = Math.min(m.series.length - 2, Math.floor(xf)), u = xf - i;
        const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
        const rx = ax + (bx - ax) * u, ry = ay + (by - ay) * u;
        let walked = 0; for (let j = 0; j < i; j++) walked += Math.hypot(pts[j + 1][0] - pts[j][0], pts[j + 1][1] - pts[j][1]);
        walked += Math.hypot(bx - ax, by - ay) * u;
        const idle = t && S.pen >= 1 ? Math.sin(t * 2.1) * .35 : 0;               // only the resting roach twitches
        cx2.fillStyle = cx2.strokeStyle = ink;
        roach(cx2, rx, Math.max(M.t - 24, ry) - 1, Math.atan2(by - ay, bx - ax), 9, walked / 5 + idle);
      }
    },
    idle: true,
  };

  function onMove(e) {
    if (!S || !curY) return;
    const r = svg.getBoundingClientRect(), x = e.clientX - r.left;
    const i = Math.max(0, Math.min(m.series.length - 1, Math.round((Xs.invert(x) - t0) / 864e5)));
    const s = m.series[i], y = Math.max(M.t, curY(s.views));                // the scale on screen right now
    if (frac(s.t) > S.pen + 1e-6) { g.hover.setAttribute('visibility', 'hidden'); hideTip(tip); return; }
    g.hover.setAttribute('visibility', 'visible');
    g.guide.setAttribute('x1', Xs(s.t)); g.guide.setAttribute('x2', Xs(s.t));
    g.hd.setAttribute('cx', Xs(s.t)); g.hd.setAttribute('cy', y);
    const pr = plot.getBoundingClientRect(), cr = cell.getBoundingClientRect();
    placeTip(tip, cell, Xs(s.t) + pr.left - cr.left, y + pr.top - cr.top,
      `<b>${esc(day(s.d))}</b> <span class="u">upload day (IST)</span><br><span class="t-num">${fmtInt(s.views)}</span> views · <span class="t-num">${fmtInt(s.n)}</span> video${s.n === 1 ? '' : 's'}<br><span class="src">YouTube clip corpus${col ? `, collected ${esc(col)}` : ''}</span>`);
  }

  return api;
}

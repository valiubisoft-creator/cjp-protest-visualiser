// S5 · scrubber (S5b part, 2026-11-12): the timeline strip. A VIEW of p and a CONTROL over it; it keeps no timeline
// state of its own. update(p) is the only thing that moves the handle; drag, clicks and keys call controller.seek().
// createScrubber({ host, model, controller, sceneId }) → { resize(w, h), update(p) }
//
// Geometry (96 px tall, built for the real width in resize):
//   top label row (baseline 18) · riding roach (centre y 38) · strip y 52–76 with day ticks and node markers ·
//   bottom label row (baseline 92). Labels alternate above / below; no middle row, so the roach on the handle never
//   meets a label (F2 nit). Axis: model.axis t0 (16 May, start of node 1's window) → t1 (24 Jul, the last beat).
// Drag: pointer x → whole day (clamped to [first node, t1]) → seek(pAt(day)), instant. Release within 10 px of a
// marker → glide to it (800 ms). Keys: arrows step node to node (glide), Home / End jump to the first / last.
import { esc } from '../../lib/text.js';
import { fmtDate } from '../../lib/dates.js';
import { tok, dpr } from '../../lib/dom.js';
import { roach } from '../../roach/roach.js';
import { loadCss } from '../s00-hero.js';
import { DAY_MS } from './beats.js';

const CSS = new URL('./scrubber.css', import.meta.url).href;
const PAD = 56, SNAP = 10, GLIDE = 800;
const Y = { lab0: 18, roach: 38, s0: 52, s1: 76, lab1: 92, bar0: 46, bar1: 82 };
const svgNS = 'http://www.w3.org/2000/svg';

export function createScrubber({ host, model, controller, sceneId }) {
  loadCss(CSS);
  const { t0, t1 } = model.axis, marks = model.nodeMarks;
  const tMin = marks[0].t, dayMax = model.dayOf(t1), dayMin = model.dayOf(tMin);
  let W = 0, H = 96, svg, el = {}, X = () => 0, T = () => t0, checkW = false;
  let lastP = null, hxKey = '', active = null, ariaKey = '', drag = null, keyTarget = null;

  host.innerHTML = '';
  host.classList.add('s5s');

  // w is the viewport width; the host's own box wins when it has one (it is display:none while S5 isn't live)
  function resize(w, h) {
    W = host.clientWidth || w; H = h || 96; checkW = !host.clientWidth;
    X = t => PAD + (t - t0) / (t1 - t0) * (W - 2 * PAD);
    T = x => t0 + (x - PAD) / (W - 2 * PAD) * (t1 - t0);
    build(H);
    hxKey = ''; active = null; ariaKey = '';
    if (lastP != null) update(lastP);
  }

  function build(h) {
    // ticks: one per day, longer on Mondays
    let ticks = '';
    for (let t = t0; t <= t1 + 1; t += DAY_MS) {
      const x = X(t).toFixed(1), mon = new Date(t).getUTCDay() === 1;
      ticks += `<line x1="${x}" x2="${x}" y1="${Y.s1}" y2="${mon ? Y.s0 + 8 : Y.s1 - 8}" class="${mon ? 'wk' : ''}"/>`;
    }
    // labels: alternate rows by index; if the preferred row collides, take the other; else nudge sideways
    const font = `700 12px ${tok('--font-text') || 'serif'}`, mctx = document.createElement('canvas').getContext('2d');
    mctx.font = font;
    const rows = [[], []], place = marks.map((m, i) => {
      const x = X(m.t), lab = `${fmtDate(m.date)} · ${m.label}`, wd = mctx.measureText(lab).width + 2;
      let x0 = Math.max(4, Math.min(W - 4 - wd, x - wd / 2));
      const hit = (r, a) => rows[r].some(([p, q]) => a < q + 12 && a + wd > p - 12);
      let row = [i % 2, 1 - i % 2].find(r => !hit(r, x0));
      if (row == null) { row = i % 2; const q = Math.max(...rows[row].map(s => s[1])); x0 = Math.min(W - 4 - wd, q + 12); }
      rows[row].push([x0, x0 + wd]);
      return { x, x0, row, lab };
    });
    const markSvg = marks.map((m, i) => {
      const P = place[i];
      return `<g class="mk" data-i="${i}"><circle cx="${P.x.toFixed(1)}" cy="${(Y.s0 + Y.s1) / 2}" r="5"/>
        <text x="${P.x0.toFixed(1)}" y="${P.row ? Y.lab1 : Y.lab0}" class="t-num">${esc(P.lab)}</text></g>`;
    }).join('');
    const sw = W - 2 * PAD, sh = Y.s1 - Y.s0;
    host.innerHTML = `<svg class="s5s-svg" width="${W}" height="${h}" viewBox="0 0 ${W} ${h}" role="slider" tabindex="0" aria-label="Timeline"
        aria-valuemin="${dayMin}" aria-valuemax="${dayMax}" aria-orientation="horizontal">
      <defs><pattern id="s5s-hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><line x1="0" y1="0" x2="0" y2="7"/></pattern></defs>
      <rect class="hit" x="0" y="0" width="${W}" height="${h}"/>
      <rect class="strip" x="${PAD}" y="${Y.s0}" width="${sw}" height="${sh}" fill="url(#s5s-hatch)"/>
      <rect class="dim" x="${PAD}" y="${Y.s0}" width="0" height="${sh}"/>
      <rect class="frame" x="${PAD}" y="${Y.s0}" width="${sw}" height="${sh}"/>
      <g class="ticks">${ticks}</g>
      <g class="marks">${markSvg}</g>
      <g class="handle"><line x1="0" x2="0" y1="${Y.bar0}" y2="${Y.bar1}"/><image width="44" height="24" x="-18" y="${Y.roach - 12}"/></g>
    </svg>`;
    svg = host.firstElementChild;
    el = { dim: svg.querySelector('.dim'), handle: svg.querySelector('.handle'), mk: [...svg.querySelectorAll('.mk')] };
    el.handle.querySelector('image').setAttribute('href', roachURL());
    svg.addEventListener('pointerdown', onDown);
    svg.addEventListener('pointermove', onMove);
    svg.addEventListener('pointerup', onUp);
    svg.addEventListener('pointercancel', onCancel);
    svg.addEventListener('keydown', onKey);
  }

  // ── view: p → handle, dim, active marker, aria ──
  function update(p) {
    lastP = p;
    if (checkW && host.clientWidth) { checkW = false; if (Math.abs(host.clientWidth - W) > .5) return resize(host.clientWidth, H); }
    if (!svg) return;
    const time = model.dateAt(p), hx = X(time), key = hx.toFixed(1);
    if (key !== hxKey) {
      hxKey = key;
      el.handle.setAttribute('transform', `translate(${key} 0)`);
      el.dim.setAttribute('x', key); el.dim.setAttribute('width', Math.max(0, W - PAD - hx).toFixed(1));
    }
    const { a, b, t } = model.phase(p), k = Math.max(0, Math.min(model.N - 1, a === b || t < .5 ? a : b));
    const B = model.beats[k], i = marks.findIndex(m => m.id === B.node.id);
    if (i !== active) {
      if (active != null && el.mk[active]) el.mk[active].classList.remove('on');
      if (el.mk[i]) el.mk[i].classList.add('on');
      active = i;
    }
    const day = model.dayOf(time), ak = day + '|' + B.node.id;
    if (ak !== ariaKey) {
      ariaKey = ak;
      svg.setAttribute('aria-valuenow', day);
      svg.setAttribute('aria-valuetext', `Day ${day}, ${B.node.title}`);
    }
  }

  // ── control: pointer ──
  const localX = e => { const r = svg.getBoundingClientRect(); return (e.clientX - r.left) * (W / r.width); };
  const dayAt = x => { const t = Math.round(T(x) / DAY_MS) * DAY_MS; return Math.max(tMin, Math.min(t1, t)); };
  const nearMark = x => { let best = null, d = SNAP + 1e-6; for (const m of marks) { const dd = Math.abs(X(m.t) - x); if (dd <= d) { d = dd; best = m; } } return best; };
  const seek = (q, o) => controller.seek(sceneId, q, o);
  function onDown(e) {
    if (e.button !== 0) return;
    e.preventDefault(); svg.focus({ preventScroll: true });
    svg.setPointerCapture(e.pointerId);
    drag = { id: e.pointerId, day: null };
    host.classList.add('is-drag');
    move(localX(e));
  }
  function onMove(e) { if (drag && e.pointerId === drag.id) move(localX(e)); }
  function move(x) {
    const d = dayAt(x); if (d === drag.day) return;
    drag.day = d; keyTarget = null;
    seek(model.pAt(d));
  }
  function onUp(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const m = nearMark(localX(e));
    end(e);
    if (m) { glide(m.p); return; }
    // otherwise settle on the nearest beat's hold, so the rail is never left mid-transition (lead, 2026-11-12)
    const p = controller.state().p, B = model.beats.reduce((best, b) => Math.abs((b.ha + b.hb) / 2 - p) < Math.abs((best.ha + best.hb) / 2 - p) ? b : best);
    if (p < B.ha || p > B.hb) glide((B.ha + B.hb) / 2);
  }
  function onCancel(e) { if (drag && e.pointerId === drag.id) end(e); }
  function end(e) { try { svg.releasePointerCapture(e.pointerId); } catch {} drag = null; host.classList.remove('is-drag'); }
  function glide(q) {
    keyTarget = q;
    seek(q, { duration: GLIDE }).then(() => { if (keyTarget === q) keyTarget = null; });
  }

  // ── control: keyboard (step node to node from the current p, or from a glide still in flight) ──
  function onKey(e) {
    if (lastP == null) return;
    const from = keyTarget ?? lastP, eps = 1e-4;
    let to = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') to = marks.find(m => m.p > from + eps);
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') to = [...marks].reverse().find(m => m.p < from - eps);
    else if (e.key === 'Home') to = marks[0];
    else if (e.key === 'End') to = marks.at(-1);
    else return;
    e.preventDefault(); e.stopPropagation();
    if (to) glide(to.p);
  }

  return { resize, update };
}

// the riding roach: roach() (wrapped, not redrawn) into a small bitmap, nose to the right
let _url = null;
function roachURL() {
  if (_url) return _url;
  const d = Math.max(2, dpr()), c = document.createElement('canvas');
  c.width = 44 * d; c.height = 24 * d;
  const g = c.getContext('2d'); g.scale(d, d);
  g.fillStyle = g.strokeStyle = tok('--accent');
  roach(g, 18, 12, 0, 8, 1.2);
  return (_url = c.toDataURL());
}

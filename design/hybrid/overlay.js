// Hybrid Gate 0: storyboard overlays injected over LIVE v3 frames (real map, roaches, charts), so the key frames show
// the hybrid's chrome and copy on the actual engine. Storyboard only: nothing here ships; Gate 1 moves the chosen
// pieces into the scenes. Usage (tools/hybrid/shoot-gate0.mjs): load /v3/?still&debug&p=…, then
//   import('/design/hybrid/overlay.js').then(m => m.apply('street'))
import { css, root, sources, lock, cap, stamp, CH } from './chrome.js';
import { esc } from '../../src/lib/text.js';
import { star } from '../../src/lib/star.js';
import { render } from './copy.js';

const sleep = ms => new Promise(r => setTimeout(r, ms));
const $ = s => document.querySelector(s);
// a stylesheet rule, not inline styles: v3 parts (the rail cards) re-set their own visibility every frame
const hide = (...sels) => document.head.insertAdjacentHTML('beforeend', `<style>${sels.join(',')}{visibility:hidden !important;opacity:0 !important}</style>`);

// seek S5 to the middle of a beat's hold, wait for the map
async function s5At(id) {
  for (let i = 0; i < 60 && !(window.__s5model && document.querySelector('.s5-labs')); i++) await sleep(100);
  const B = __s5model.beats.find(b => b.id === id);
  const p = (B.ha + B.hb) / 2;
  __v3.seek('S5', p); await sleep(900);
  return p;
}
// the leader line: point S5's own leader drawing at our card instead of v3's rail card
async function relead(card, p) {
  const r = card.getBoundingClientRect(), t = card.querySelector('p:not(.when)').getBoundingClientRect();
  __s5rail.anchor = () => ({ x: r.left, y: Math.round(t.top + 12), alpha: 1 });
  __v3.seek('S5', p + 1e-5); await sleep(300); __v3.seek('S5', p); await sleep(500);
}

const FRAMES = {
  async street(R, S) {
    const p = await s5At('protest_2a');
    hide('.s5-rail', '.s5-rail *', '.hud-debug');
    lock(R, 'street');
    $('.s5-hud').style.top = '118px';                    // HUD date docks under the chapter lockup
    const c = cap(R, 'street', 1, S, { style: 'right:24px; top:24px;' });
    await relead(c, p);
  },
  async july(R, S) {
    const p = await s5At('0720_0900');
    hide('.s5-rail', '.s5-rail *', '.hud-debug');
    lock(R, 'july');
    $('.s5-hud').style.top = '118px';
    const c = cap(R, 'july', 0, S, { style: 'right:24px; top:24px;' });
    await relead(c, p);
    // Vali 2026-11-13: at most THREE labels on the map: the site, the dead-signal zone, the closed metro (one
    // grouped label; the station glyphs stay, unlabelled). Long labels break into short lines, never run on.
    const labs = [...document.querySelectorAll('.s5-lab')];
    const site = labs.find(e => /jantar mantar/i.test(e.textContent));
    const stations = labs.filter(e => /metro station/i.test(e.textContent)).map(e => e.getBoundingClientRect());
    hide('.s5-lab:not(.hy-keep)');
    site?.classList.add('hy-keep');
    document.head.insertAdjacentHTML('beforeend', '<style>.s5-lab.hy-keep{visibility:visible !important;opacity:1 !important}</style>');
    const tag = (x, y, lines, red) => `<div style="position:absolute;left:${x}px;top:${y}px;background:${red ? 'var(--red)' : 'var(--white)'};color:${red ? 'var(--white)' : 'var(--black)'};border:${red ? '0' : '1px solid var(--black)'};box-shadow:0 0 0 3px var(--black);font:760 12px/1.35 var(--font-ui);letter-spacing:.1em;text-transform:uppercase;padding:6px 9px">${lines.join('<br>')}</div>`;
    if (site) {
      const b = site.getBoundingClientRect(), cx = b.left + 30, cy = b.top + b.height / 2, rad = Math.min(230, innerHeight * .27);
      R.insertAdjacentHTML('afterbegin', `<svg class="hy-sig" width="${innerWidth}" height="${innerHeight}" style="position:absolute;inset:0">
        <defs><pattern id="hy-dots" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="4.5" cy="4.5" r="1.6" fill="#E0201B"/></pattern></defs>
        <circle cx="${cx}" cy="${cy}" r="${rad}" fill="url(#hy-dots)" opacity=".38"/>
        <circle cx="${cx}" cy="${cy}" r="${rad}" fill="none" stroke="#E0201B" stroke-width="2" stroke-dasharray="7 6"/></svg>`);
      R.insertAdjacentHTML('beforeend', tag(cx + rad * .62, cy + rad * .62, ['No mobile internet, 9.23 am.', 'No order published.'], true));
      // one leader line, card → the site (v3 drew one per incident; with three labels that is noise)
      __s5rail.anchor = () => null; __v3.seek('S5', __v3.state().p + 1e-5); await sleep(250); __v3.seek('S5', __v3.state().p); await sleep(250);
      const k = c.getBoundingClientRect(), ax = k.left, ay = k.top + 52;
      R.insertAdjacentHTML('afterbegin', `<svg width="${innerWidth}" height="${innerHeight}" style="position:absolute;inset:0"><g stroke="#FAFAF7" stroke-width="1.25" fill="#FAFAF7">
        <line x1="${ax}" y1="${ay}" x2="${ax - 18}" y2="${ay}"/><line x1="${ax - 18}" y1="${ay}" x2="${b.right + 4}" y2="${cy}"/><circle cx="${b.right + 4}" cy="${cy}" r="3"/></g></svg>`);
    }
    if (stations.length) {
      const mx = Math.min(...stations.map(r => r.left)), my = stations.reduce((a, r) => a + r.top, 0) / stations.length;
      R.insertAdjacentHTML('beforeend', tag(Math.max(24, mx - 230), my + 40, ['Metro: five stations', 'shut by 9 am'], false));
    }
  },
  async ledgers(R, S) {
    await s5At('0720_2040');
    hide('.s5-rail', '.s5-rail *', '.s5-hud', '.s5-legend', '.s5-marks', '.hud-debug', '.s5-scrub');
    R.insertAdjacentHTML('afterbegin', `<div style="position:absolute;inset:0;background:var(--black);opacity:.86"></div>`);
    lock(R, 'ledgers', { boxed: false });
    R.insertAdjacentHTML('beforeend', ledgerSVG(S));
    cap(R, 'ledgers', 2, S, { style: `right:24px; top:${Math.round(innerHeight * .33) - 38}px;` });
    const L = CH.ledgers.legend.split(' · ');
    R.insertAdjacentHTML('beforeend', `<div style="position:absolute;left:120px;bottom:36px;display:flex;gap:28px;font:400 13px/1 var(--font-ui);color:var(--muted)">
      <span><i style="display:inline-block;width:12px;height:12px;border-radius:50%;background:var(--red);vertical-align:-2px;margin-right:7px"></i>${esc(L[0].replace('Solid red: ', ''))}</span>
      <span><i style="display:inline-block;width:12px;height:12px;border-radius:50%;background:repeating-linear-gradient(45deg,var(--white) 0 2px,transparent 2px 4px);border:1.5px solid var(--white);vertical-align:-2px;margin-right:7px"></i>${esc(L[1].replace('hatched: ', ''))}</span>
      <span><i style="display:inline-block;width:12px;height:12px;border-radius:50%;border:2px solid var(--white);vertical-align:-2px;margin-right:7px"></i>${esc(L[2].replace('open: ', ''))}</span></div>`);
  },
  async watched(R, S) {
    for (let i = 0; i < 40 && !$('.s7-title'); i++) await sleep(100);
    const c = CH.watched, head = [...document.querySelectorAll('.s7-head')].find(h => h.offsetParent);
    head.querySelector('.s7-kick').innerHTML = `<span style="color:var(--accent-text);margin-right:.9em">${c.n}</span>${esc(c.kicker)}`;
    head.querySelector('.s7-title').textContent = c.headline;
    head.querySelector('.s7-count')?.remove();
    head.insertAdjacentHTML('beforeend', `<p style="font:400 var(--fs-lead)/1.45 var(--font-text);max-width:44em;margin:10px 0 0">${esc(c.dek)}</p>`);
    document.querySelectorAll('.s7-fact').forEach(f => { if (!/93%/.test(f.textContent)) f.style.visibility = 'hidden'; });
    hide('.hud-debug');
  },
  async victory() { hide('.hud-debug'); },
  async apparatus(R, S) {
    for (let i = 0; i < 40 && !$('.s7d-title'); i++) await sleep(100);
    const c = CH.apparatus, head = $('.s7d-head');
    head.querySelector('.s7d-kick').innerHTML = `<span style="color:var(--accent-text);margin-right:.9em">${c.n}</span>${esc(c.kicker)}`;
    head.querySelector('.s7d-title').textContent = c.headline;
    head.querySelector('.s7d-title').insertAdjacentHTML('afterend', `<p style="font:400 var(--fs-body)/1.45 var(--font-text);max-width:38em;margin:8px 0 0">${esc(c.dek)}</p>`);
    hide('.hud-debug');
  },
  async close() { hide('.hud-debug'); },   // S9 as built (restyled in src); the closing line is its own scene (frames.js)
};

// three number lines, one scale per question (v2 ch. 04), metrics.json values; kinds: state | record | movement | split
function ledgerSVG(S) {
  const rows = [
    { q: 'Injured', unit: 'people', max: 160, dots: [
      { v: 60, k: 'state', l: 'protesters hurt, police said', ids: ['theprint'] },
      { v: 65, k: 'record', l: 'medico-legal cases, RML by 7 pm', ids: ['wikipedia'] },
      { v: 100, k: 'record', l: 'injured at RML by 5.30 pm, hospital sources', ids: ['newslaundry'] },
      { v: 118, k: 'state', l: 'officers hurt, police said', ids: ['theprint'] },
      { v: 150, k: 'movement', l: 'protesters hospitalised, CJP', ids: ['wikipedia'] }] },
    { q: 'Detained', unit: 'people', max: 120, dots: [
      { v: 0, k: 'state', l: '“no protesters”, police later', ids: ['wikipedia'] },
      { v: 70, k: 'split', l: 'about 70, police (PTI) / CJP', ids: ['theprint'] },
      { v: 100, k: 'state', l: '“more than 100”, police sources', ids: ['deccanchronicle_0720_detained'] }] },
    { q: 'Pellets', unit: 'rounds fired', max: 8, dots: [
      { v: 0, k: 'state', l: '“completely false”, police', ids: ['theprint_0721_pellet_denial'] },
      { v: 2, k: 'record', l: 'police diary', ids: ['tribuneindia'] },
      { v: 7, k: 'record', l: 'CRPF report (The Wire)', ids: ['thewire'] }] },
  ];
  const X0 = 300, X1 = innerWidth - 480, Y0 = Math.round(innerHeight * .33), DY = Math.round(innerHeight * .205);
  let out = `<svg width="${innerWidth}" height="${innerHeight}" style="position:absolute;inset:0;overflow:visible">
    <defs><pattern id="hy-hatch" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="2" height="4" fill="#FAFAF7"/></pattern></defs>`;
  const labels = [];
  rows.forEach((r, i) => {
    const y = Y0 + i * DY, x = v => X0 + (X1 - X0) * v / r.max;
    out += `<line x1="${X0}" x2="${X1}" y1="${y}" y2="${y}" stroke="#3A3A37" stroke-width="2"/>`;
    for (const t of [0, r.max]) out += `<text x="${x(t)}" y="${y + 26}" fill="#A3A29C" font-family="Public Sans" font-size="11" text-anchor="middle">${t}</text>`;
    labels.push(`<div style="position:absolute;left:120px;top:${y - 22}px;width:160px"><div style="font:400 34px/1 var(--font-display)">${r.q}</div><div style="font:400 12px/1.4 var(--font-ui);color:var(--muted);margin-top:4px">${r.unit}, one scale each</div></div>`);
    r.dots.forEach((d, j) => {
      const cx = x(d.v), R = 9, up = j % 2 === 0;
      const fill = d.k === 'state' ? '#E0201B' : d.k === 'record' ? 'url(#hy-hatch)' : 'none';
      const stroke = d.k === 'state' ? '#E0201B' : '#FAFAF7';
      out += d.k === 'split'
        ? `<path d="M${cx} ${y - R} A${R} ${R} 0 0 0 ${cx} ${y + R} Z" fill="#E0201B"/><circle cx="${cx}" cy="${y}" r="${R}" fill="none" stroke="#FAFAF7" stroke-width="2"/>`
        : `<circle cx="${cx}" cy="${y}" r="${R}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
      const ly = up ? y - 22 : y + 22;
      out += `<line x1="${cx}" x2="${cx}" y1="${y + (up ? -R : R)}" y2="${ly + (up ? 6 : -6)}" stroke="#6B6B66"/>`;
      const lw = innerWidth < 1400 ? 128 : 180;
      labels.push(`<div style="position:absolute;left:${cx - lw / 2}px;top:${up ? ly - (lw < 180 ? 50 : 36) : ly + 4}px;width:${lw}px;text-align:center;font:400 12px/1.3 var(--font-ui);color:var(--fg)"><b style="font:760 15px/1 var(--font-ui)">${d.v}</b>${star(d.ids, S)}<br><span style="color:var(--muted)">${esc(d.l)}</span></div>`);
    });
  });
  return out + '</svg>' + labels.join('');
}

export async function apply(name) {
  await css();
  const S = await sources(), R = root();
  await FRAMES[name](R, S);
  stamp(R, `hybrid gate 0 · ${name}`);
  await sleep(250);
  document.body.dataset.hy = '1';
}

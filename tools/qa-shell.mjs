// Shell regression checks for v3 (F3). Run after any change to the controller, budget or a scene's init.
// usage: node tools/qa-shell.mjs [baseUrl=http://localhost:5173/v3/]   → prints PASS/FAIL lines, exit 1 on any FAIL
//   1 sweep      scroll the whole page down then up in vh/8 steps (40ms apart): scenes become current in budget order
//                (reversed going up) and every scene's p is monotonic on each leg
//   2 deep links every target in docs/build/scenes/targets/*.json, loaded fresh as ?p=<at>, lands on that p
//   3 lock       lock() blocks wheel and keyboard scrolling, unlock() restores it, maxMs auto-unlocks
//   4 gate       below 1280×720 the piece is replaced by the desktop message; back above, the piece returns
//   5 resize     a resize keeps the reader on the same (scene, p)
//   6 no-slash   /v3 (no trailing slash) boots too
//   + no console errors or exceptions anywhere
import { readdirSync, readFileSync } from 'node:fs';
import { launch, sleep } from './lib/cdp.mjs';

const BASE = process.argv[2] || 'http://localhost:5173/v3/';
const b = await launch();
const { ev, send } = b;
let fails = 0;
const ok = (cond, msg) => { console.log(`${cond ? 'PASS' : 'FAIL'} ${msg}`); if (!cond) fails++; };
const url = q => BASE + (q ? '?' + q : '');

/* 1 · sweep */
await b.goto(url('still&trace'), { ready: true });
const ids = await ev('__v3.budget.map(d => d.id)');
const maxY = await ev('document.documentElement.scrollHeight - innerHeight');
for (const leg of ['down', 'up']) {
  await ev(`scrollTo(0, ${leg === 'down' ? 0 : maxY})`); await sleep(200); await ev('__v3.trace.length = 0');
  // record the leg's starting frame (no scroll event fires there, so the trace would miss it): since review 3 the last
  // section (S10) is shorter than two sweep steps, and without this it never shows its p 1 on the way up
  await ev(`__v3.trace.push({ y: scrollY, dir: '${leg}', live: __v3.state().live.map(l => [l.id, l.p]) })`);
  const step = b.h / 8, n = Math.ceil(maxY / step);
  for (let k = 1; k <= n; k++) { await ev(`scrollTo(0, ${leg === 'down' ? Math.min(maxY, k * step) : Math.max(0, maxY - k * step)})`); await sleep(40); }
  await sleep(200);
  const tr = await ev('__v3.trace.map(e => e.live)');
  const order = [], seq = {};
  for (const live of tr) {
    for (const [id, p] of live) (seq[id] ||= []).push(p);
    // current = the latest live scene whose own p is strictly inside (0,1), else the latest live one (same rule as the controller, approximately)
    const c = [...live].reverse().find(([, p]) => p > 0 && p < 1)?.[0] ?? live.at(-1)?.[0];
    if (c && order.at(-1) !== c) order.push(c);
  }
  const want = leg === 'down' ? ids : [...ids].reverse();
  ok(JSON.stringify(order) === JSON.stringify(want), `sweep ${leg}: scenes current in budget order (${order.length}/${ids.length}) ${JSON.stringify(order) === JSON.stringify(want) ? '' : '\n  got  ' + order.join(' ') + '\n  want ' + want.join(' ')}`);
  const bad = Object.entries(seq).filter(([, ps]) => ps.some((p, i) => i && (leg === 'down' ? p < ps[i - 1] : p > ps[i - 1])));
  ok(!bad.length, `sweep ${leg}: p monotonic in all ${Object.keys(seq).length} scenes over ${tr.length} samples${bad.length ? ' — broken: ' + bad.map(x => x[0]).join(', ') : ''}`);
  const ends = Object.entries(seq).filter(([, ps]) => Math.min(...ps) > 0.25 || Math.max(...ps) < 0.75).map(x => x[0]);
  ok(!ends.length, `sweep ${leg}: every scene's p spans its range${ends.length ? ' — not: ' + ends.join(', ') : ''}`);
}

/* 2 · deep links */
const dir = 'docs/build/scenes/targets';
let n = 0, bad = [];
for (const f of readdirSync(dir).filter(f => f.endsWith('.json'))) {
  for (const t of JSON.parse(readFileSync(`${dir}/${f}`, 'utf8')).targets) {
    await b.goto(url('still&p=' + t.at), { ready: true });
    const [id, p] = t.at.split(':');
    const r = await ev(`(() => { const st = __v3.state(), id = ({S7:'S7a',S8:'S8a'})[${JSON.stringify(id)}] || ${JSON.stringify(id)}; const len = __v3.yFor(id,1) - __v3.yFor(id,0);
      const mine = st.live.find(l => l.id === id); return { y: st.y, want: __v3.yFor(id, ${p === 'top' ? "'top'" : +p}), p: mine?.p ?? null, tol: Math.max(0.0015, 1.5 / Math.max(1, len)) }; })()`);
    const good = r.p !== null && (p === 'top' ? Math.abs(r.y - r.want) <= 1 : Math.abs(r.p - +p) <= r.tol);
    n++; if (!good) bad.push(`${t.at} → p ${r.p} y ${r.y}`);
  }
}
ok(!bad.length, `deep links: ${n - bad.length}/${n} land on their p${bad.length ? '\n  ' + bad.join('\n  ') : ''}`);

/* 3 · lock */
await b.goto(url('still&p=S2:0.2'), { ready: true });
const wheel = async dy => { await send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: 700, y: 450, deltaX: 0, deltaY: dy }); await sleep(400); };
const key = async k => { for (const type of ['keyDown', 'keyUp']) await send('Input.dispatchKeyEvent', { type, key: k, code: k, windowsVirtualKeyCode: k === 'PageDown' ? 34 : 32 }); await sleep(400); };
let y0 = await ev('scrollY');
await ev('__v3.lock()'); await wheel(600); await key('PageDown');
ok(await ev('scrollY') === y0 && await ev('__v3.state().locked'), 'lock: wheel and PageDown do not scroll while locked');
await ev('__v3.unlock()'); await wheel(600);
ok(await ev('scrollY') > y0, 'unlock: wheel scrolls again');
await ev('__v3.lock({ maxMs: 300 })'); await sleep(500);
ok(!(await ev('__v3.state().locked')), 'lock: auto-unlocks after maxMs');

/* 4 · gate */
const size = async (w, h) => { await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false }); await sleep(450); };
await b.goto(url('still&p=S4:0.6'), { ready: true });
const vis = `[getComputedStyle(document.getElementById('gate')).display !== 'none', getComputedStyle(document.getElementById('piece')).display !== 'none']`;
for (const [w, h] of [[1279, 900], [1440, 719]]) { await size(w, h); const [g, p] = await ev(vis); ok(g && !p, `gate: ${w}×${h} shows the desktop message, hides the piece`); }
await size(1280, 720); { const [g, p] = await ev(vis); ok(!g && p, 'gate: 1280×720 shows the piece'); }

/* 5 · resize keeps (scene, p) */
await size(1440, 900); await ev(`__v3.seek('S4', 0.6)`); await sleep(200);
for (const [w, h] of [[1920, 1080], [2560, 1440], [1280, 720], [1440, 900]]) {
  await size(w, h);
  const st = await ev('__v3.state()');
  ok(st.scene === 'S4' && Math.abs(st.p - 0.6) < 0.002, `resize to ${w}×${h}: still S4 p ${st.p.toFixed(4)}`);
}

/* 6 · no trailing slash */
await b.goto(BASE.replace(/\/$/, '') + '?still&p=S3.5:0.3', { ready: true });
{ const st = await ev('__v3.state()'); ok(st.scene === 'S3.5' && Math.abs(st.p - 0.3) < 0.002, `/v3 (no slash) boots and deep-links: ${st.scene} p ${st.p.toFixed(4)}`); }

const errs = b.logs.filter(l => /^(error|EXC|LOG)/.test(l));
ok(!errs.length, `console: no errors or exceptions${errs.length ? '\n  ' + errs.slice(0, 10).join('\n  ') : ''}`);
b.close();
console.log(fails ? `${fails} FAILED` : 'ALL PASS');
process.exitCode = fails ? 1 : 0;

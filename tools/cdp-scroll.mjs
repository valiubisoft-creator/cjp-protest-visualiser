// Scroll-and-screenshot QA through headless Chrome (CDP). Extended in F3 for v3 scene targets.
//
// usage: SIZE=w,h node tools/cdp-scroll.mjs <url> <outDir> <targets.json>
//
// 1. Legacy list (unchanged CLI): [[name, expr, waitMs], ...]
//    expr is a JS expression returning a scrollY, or (new) a v3 target "S4:0.6". One downward pass, <name>.png.
//
// 2. v3 targets file (docs/build/scenes/targets/SNN.json):
//    { "scene": "S4", "targets": [{ "name": "S4-0.6", "at": "S4:0.6", "frame": "S4-0.6", "wait": 600 }, ...] }
//    Runs DOWN through the targets, then UP through them in reverse (QA rule: always both ways).
//    Writes <name>-down.png and <name>-up.png, logs (scene, p) at every target, checks that p hits the target
//    and that every scene's p was monotonic on each leg. Summary → <outDir>/qa-log.json; exit 1 on any failure.
//    The url gets ?trace (needed) and ?still (frozen idle clock) added unless LIVE=1.
//
// e.g. node tools/cdp-scroll.mjs http://localhost:5173/v3/ qa/v3/S4 docs/build/scenes/targets/S4.json
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { launch, sleep } from './lib/cdp.mjs';

const [url, out, tfile] = process.argv.slice(2);
if (!url || !out || !tfile) { console.error('usage: SIZE=w,h node tools/cdp-scroll.mjs <url> <outDir> <targets.json>'); process.exit(2); }
mkdirSync(out, { recursive: true });
const spec = JSON.parse(readFileSync(tfile, 'utf8'));
const V3 = /^([A-Za-z0-9.]+):(top|[\d.]+)$/;
const yExpr = at => { const m = V3.exec(at); return m ? `__v3.yFor(${JSON.stringify(m[1])}, ${m[2] === 'top' ? "'top'" : +m[2]})` : at; };

const b = await launch();
const { ev, logs } = b;

if (Array.isArray(spec)) {
  /* ── legacy mode: single downward pass ── */
  await b.goto(url, { wait: +(process.env.LOAD || 2500) });
  await ev(`document.documentElement.style.scrollBehavior='auto'`);
  for (const [name, expr, wait = 1500] of spec) {
    const y = await ev(yExpr(expr));
    const cur = await ev('scrollY'); const n = 8;   // step there so scroll observers see the journey
    for (let k = 1; k <= n; k++) { await ev(`scrollTo(0, ${cur + (y - cur) * k / n})`); await sleep(60); }
    await sleep(wait);
    const info = await ev(`JSON.stringify({y:scrollY, ow: document.documentElement.scrollWidth > innerWidth${V3.test(expr) ? ', v3: __v3.state()' : ''}})`);
    await b.shot(`${out}/${name}.png`, writeFileSync);
    console.log(name, info);
  }
} else {
  /* ── v3 mode: down, then up ── */
  const u = new URL(url);
  if (!process.env.LIVE) { u.searchParams.set('still', ''); }
  u.searchParams.set('trace', '');
  await b.goto(u.href.replace(/=(?=&|$)/g, ''), { ready: true });
  await ev(`document.documentElement.style.scrollBehavior='auto'`);
  const vh = b.h, results = [];
  const T = await Promise.all(spec.targets.map(async t => {
    const m = V3.exec(t.at); if (!m) throw new Error(`bad target ${t.at}`);
    const id = m[1], top = m[2] === 'top', p = top ? null : +m[2];
    const y = await ev(yExpr(t.at)), len = await ev(`__v3.yFor(${JSON.stringify(id)},1) - __v3.yFor(${JSON.stringify(id)},0)`);
    const sid = await ev(`({S7:'S7a',S8:'S8a'})[${JSON.stringify(id)}] || ${JSON.stringify(id)}`);
    return { ...t, id: sid, p, top, y, tol: Math.max(0.0015, 1.5 / Math.max(1, len)) };
  }));
  const maxY = await ev('document.documentElement.scrollHeight - innerHeight');
  async function glide(to) {
    const from = await ev('scrollY'), n = Math.min(40, Math.max(6, Math.ceil(Math.abs(to - from) / (vh / 3))));
    for (let k = 1; k <= n; k++) { await ev(`scrollTo(0, ${from + (to - from) * k / n})`); await sleep(40); }
  }
  for (const leg of ['down', 'up']) {
    const order = leg === 'down' ? [...T].sort((a, b) => a.y - b.y) : [...T].sort((a, b) => b.y - a.y);
    await ev(`scrollTo(0, ${leg === 'down' ? Math.max(0, order[0].y - vh) : Math.min(maxY, order[0].y + vh)})`);
    await sleep(300);
    await ev('__v3.trace.length = 0');
    for (const t of order) {
      await glide(t.y);
      await sleep(t.wait ?? 500);
      const st = await ev('__v3.state()');
      const mine = st.live.find(l => l.id === t.id);
      const ok = t.top ? Math.abs(st.y - t.y) <= 1 && !!mine : !!mine && Math.abs(mine.p - t.p) <= t.tol;
      await b.shot(`${out}/${t.name}-${leg}.png`, writeFileSync);
      const ow = await ev('document.documentElement.scrollWidth > innerWidth');
      results.push({ leg, name: t.name, at: t.at, frame: t.frame ?? null, ok, y: Math.round(st.y), current: st.scene, p: mine ? +mine.p.toFixed(4) : null, live: st.live.map(l => `${l.id}@${l.p.toFixed(3)}`).join(' '), overflowX: ow });
      console.log(`${ok ? 'PASS' : 'FAIL'} ${leg.padEnd(4)} ${t.name.padEnd(16)} at ${t.at.padEnd(10)} → ${mine ? `${t.id} p=${mine.p.toFixed(4)}` : `${t.id} not live`}  y=${Math.round(st.y)}  live: ${results.at(-1).live}${ow ? '  OVERFLOW-X' : ''}`);
    }
    // every scene's p must move one way on each leg
    const tr = await ev('__v3.trace.map(e => e.live)');
    const seq = {};
    for (const live of tr) for (const [id, p] of live) (seq[id] ||= []).push(p);
    const bad = Object.entries(seq).filter(([, ps]) => ps.some((p, i) => i && (leg === 'down' ? p < ps[i - 1] - 1e-9 : p > ps[i - 1] + 1e-9)));
    const mono = { leg, samples: tr.length, scenes: Object.keys(seq).length, nonMonotonic: bad.map(([id]) => id) };
    results.push({ monotonic: mono });
    console.log(`${bad.length ? 'FAIL' : 'PASS'} ${leg} monotonic p: ${tr.length} samples over ${mono.scenes} scenes${bad.length ? ' — broken in ' + mono.nonMonotonic.join(', ') : ''}`);
  }
  writeFileSync(`${out}/qa-log.json`, JSON.stringify({ url: u.href, size: `${b.w}x${b.h}`, targets: tfile, results, console: logs }, null, 1));
  process.exitCode = results.some(r => r.ok === false || r.monotonic?.nonMonotonic.length) ? 1 : 0;
}
if (logs.length) console.log(logs.slice(0, 30).join('\n'));
b.close();

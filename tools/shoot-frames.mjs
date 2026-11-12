// Deep-link key-frame shooter (prologue chat, 2026-11-12): one fresh load per frame, ?still&p=<at>, one PNG each.
// usage: SIZE=w,h node tools/shoot-frames.mjs <outDir> <at> [<at> …]     e.g. node tools/shoot-frames.mjs qa/v3/gate1 S0:0 S4:0.6
// Prints console errors per frame. Base URL: $BASE or http://localhost:5173/v3/
import { writeFileSync, mkdirSync } from 'node:fs';
import { launch, sleep } from './lib/cdp.mjs';
const [out, ...ats] = process.argv.slice(2);
if (!out || !ats.length) { console.error('usage: SIZE=w,h node tools/shoot-frames.mjs <outDir> <at> …'); process.exit(2); }
mkdirSync(out, { recursive: true });
const base = process.env.BASE || 'http://localhost:5173/v3/';
const b = await launch();
for (const at of ats) {
  b.logs.length = 0;
  await b.goto(`${base}?still&p=${at}`, { ready: true });
  await sleep(+(process.env.WAIT || 400));
  const st = await b.ev('JSON.stringify(__v3.state().live.map(l => l.id + "@" + l.p.toFixed(3)))');
  const name = `${at.replace(':', '-')}-${b.w}x${b.h}.png`;
  await b.shot(`${out}/${name}`, writeFileSync);
  console.log(name, st, b.logs.length ? '\n  ' + b.logs.join('\n  ') : '');
}
b.close();

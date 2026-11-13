// Hybrid Gate 0 storyboard shooter (build/hybrid, 2026-11-13). One fresh load per frame and size.
// v3 frames: /v3/?still&debug&p=<at>, then design/hybrid/overlay.js apply(name). New frames: /design/hybrid/frames?f=<name>.
// usage: node tools/hybrid/shoot-gate0.mjs [outDir=qa/hybrid/gate0] [name …]     (server: npx serve . -l 5173)
import { writeFileSync, mkdirSync } from 'node:fs';
import { launch, sleep } from '../lib/cdp.mjs';

const BASE = process.env.BASE || 'http://localhost:5173';
const BIG = '1440,900', SMALL = '1280,720';
// order = the hybrid running order; sizes: 1280×720 too for text-heavy frames
export const FRAMES = [
  { name: '01-prologue',   v3: 'S3.5:0.54',  sizes: [BIG] },
  { name: '01b-neet',      page: 'neet', sizes: [BIG, SMALL] },
  { name: '02a-withheld-title', page: 'withheld-title', sizes: [BIG, SMALL] },
  { name: '02b-withheld',  page: 'withheld', sizes: [BIG, SMALL] },
  { name: '03-street',     v3: 'S5:0.5', overlay: 'street', sizes: [BIG, SMALL] },
  { name: '04-july',       v3: 'S5:0.5', overlay: 'july', sizes: [BIG, SMALL] },
  { name: '05-ledgers',    v3: 'S5:0.5', overlay: 'ledgers', sizes: [BIG, SMALL] },
  { name: '05x-victory',   v3: 'S6:0.85', overlay: 'victory', sizes: [BIG, SMALL] },
  { name: '06a-watched-p035', page: 'watched&p=0.35', sizes: [BIG] },
  { name: '06b-watched-p070', page: 'watched&p=0.70', sizes: [BIG] },
  { name: '06c-watched-p100', page: 'watched&p=1', sizes: [BIG, SMALL] },
  { name: '06d-watched-hover', page: 'watched&p=1&hover=1', sizes: [BIG] },
  { name: '07-october',    page: 'october', sizes: [BIG, SMALL] },
  { name: '07c-october-dawn', page: 'october-dawn', sizes: [BIG, SMALL] },
  { name: '07b-october-cell', page: 'october-cell', sizes: [BIG] },
  { name: '08-roll',       page: 'roll', sizes: [BIG, SMALL] },
  { name: '09a-apparatus-p045', page: 'apparatus&p=0.45', sizes: [BIG] },
  { name: '09b-apparatus-p100', page: 'apparatus&p=1', sizes: [BIG, SMALL] },
  { name: '09c-apparatus-hover', page: 'apparatus&p=1&hover=delhi_metro', sizes: [BIG] },
  { name: '10a-closing-line', page: 'closing', sizes: [BIG, SMALL] },
  { name: '10b-follow',    v3: 'S9:0.999', overlay: 'close', sizes: [BIG, SMALL] },
];

const [out = 'qa/hybrid/gate0', ...only] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const list = only.length ? FRAMES.filter(f => only.some(o => f.name.includes(o))) : FRAMES;
for (const size of [BIG, SMALL]) {
  const todo = list.filter(f => f.sizes.includes(size));
  if (!todo.length) continue;
  const b = await launch({ size });
  for (const f of todo) {
    b.logs.length = 0;
    if (f.v3) {
      await b.goto(`${BASE}/v3/?still&debug&p=${f.v3}`, { ready: true });
      await sleep(900);
      if (f.overlay) await b.ev(`import('/design/hybrid/overlay.js').then(m => m.apply(${JSON.stringify(f.overlay)}))`);
    } else {
      await b.goto(`${BASE}/design/hybrid/frames?f=${f.page}`);
      for (let i = 0; i < 80; i++) { if (await b.ev(`document.body.dataset.ready === '1'`)) break; await sleep(150); }
    }
    await sleep(+(process.env.WAIT || 500));
    const file = `${out}/${f.name}-${b.w}x${b.h}.png`;
    await b.shot(file, writeFileSync);
    console.log(file, b.logs.length ? '\n  ' + b.logs.join('\n  ') : '');
  }
  b.close();
}

// In-block handover check (prologue chat, 2026-11-12): scene A at p 1 must look exactly like scene B at p 0.
// usage: SIZE=w,h node tools/qa-handover.mjs [outDir=qa/v3/handover] [A>B …]   default: the prologue chain S0>S1 … S4>S5
// For each pair, in one page with ?still: deep-link to B p 0.3 (so S2's done flag is set as a reader would have it),
// seek A p 1 (1 px short of the boundary) → shot, seek B p 0 → shot, then count differing pixels (Σ|ΔRGB| > 24).
// PASS at ≤ 0.2% of the frame (the 1 px of scroll between the two shots moves things by up to 1/len of their path).
import { writeFileSync, mkdirSync } from 'node:fs';
import { launch, sleep } from './lib/cdp.mjs';
const args = process.argv.slice(2);
const out = args[0] && !args[0].includes('>') ? args.shift() : 'qa/v3/handover';
const pairs = (args.length ? args : ['S0>S1', 'S1>S2', 'S2>S3', 'S3>S3.5', 'S3.5>S4', 'S4>S5']).map(s => s.split('>'));
mkdirSync(out, { recursive: true });
const BASE = process.env.BASE || 'http://localhost:5173/v3/', LIMIT = +(process.env.LIMIT || .002);
const b = await launch(); const { ev, send } = b;
let fails = 0;
const grab = async () => (await send('Page.captureScreenshot', { format: 'png' })).result.data;
for (const [A, B] of pairs) {
  await b.goto(`${BASE}?still&p=${B}:0.3`, { ready: true }); await sleep(400);
  await ev(`__v3.seek(${JSON.stringify(A)}, 1)`); await sleep(350);
  const sa = await ev('JSON.stringify(__v3.state().live.map(l => l.id + "@" + l.p.toFixed(4)))');
  const pa = await grab();
  await ev(`__v3.seek(${JSON.stringify(B)}, 0)`); await sleep(350);
  const sb = await ev('JSON.stringify(__v3.state().live.map(l => l.id + "@" + l.p.toFixed(4)))');
  const pb = await grab();
  const tag = `${A}-1_vs_${B}-0-${b.w}x${b.h}`;
  writeFileSync(`${out}/${tag}-A.png`, Buffer.from(pa, 'base64')); writeFileSync(`${out}/${tag}-B.png`, Buffer.from(pb, 'base64'));
  const diff = await ev(`(async () => {
    const load = s => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = 'data:image/png;base64,' + s; });
    const [x, y] = await Promise.all([load(${JSON.stringify(pa)}), load(${JSON.stringify(pb)})]);
    const w = x.naturalWidth, h = x.naturalHeight, a = new OffscreenCanvas(w, h).getContext('2d'), c = new OffscreenCanvas(w, h).getContext('2d');
    a.drawImage(x, 0, 0); c.drawImage(y, 0, 0);
    const P = a.getImageData(0, 0, w, h).data, Q = c.getImageData(0, 0, w, h).data; let n = 0;
    for (let i = 0; i < P.length; i += 4) if (Math.abs(P[i] - Q[i]) + Math.abs(P[i + 1] - Q[i + 1]) + Math.abs(P[i + 2] - Q[i + 2]) > 24) n++;
    return n / (w * h);
  })()`);
  const ok = diff <= LIMIT; if (!ok) fails++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${A} p 1 → ${B} p 0  ${(diff * 100).toFixed(3)}% pixels differ   A: ${sa}  B: ${sb}`);
}
if (b.logs.length) console.log(b.logs.slice(0, 20).join('\n'));
b.close(); process.exitCode = fails ? 1 : 0;

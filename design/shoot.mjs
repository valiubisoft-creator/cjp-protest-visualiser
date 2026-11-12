// Full-page screenshots of the F2 board / storyboard via Chrome DevTools Protocol.
// usage: node design/shoot.mjs <url> <out.png> [width=1440] [clipSelector]
//   clipSelector ending in ' *all' shoots every match to <out>-<data-id>.png (storyboard frames: add ?fz=1 and width 1520)
// Waits for document.body.dataset.ready === '1', prints console errors and exceptions.
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
const [url, out, width = '1440', clipSel] = process.argv.slice(2);
const CH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const port = 9700 + Math.floor(Math.random() * 200);
const proc = spawn(CH, ['--headless=new', `--remote-debugging-port=${port}`, '--hide-scrollbars', `--window-size=${width},900`, `--user-data-dir=/tmp/f2-shoot-${port}`, 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let tabs; for (let i = 0; i < 60; i++) { try { tabs = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); break; } catch { await sleep(150); } }
const ws = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
let id = 0; const pending = new Map(); const logs = [];
ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id) pending.get(d.id)?.(d); else if (d.method === 'Runtime.consoleAPICalled' && /error|warn/.test(d.params.type)) logs.push(d.params.type + ': ' + d.params.args.map(a => a.value ?? a.description).join(' ')); else if (d.method === 'Runtime.exceptionThrown') logs.push('EXC: ' + (d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text)); else if (d.method === 'Log.entryAdded' && d.params.entry.level === 'error') logs.push('LOG: ' + d.params.entry.text + ' ' + (d.params.entry.url || '')); };
const send = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async e => (await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })).result?.result?.value;
await send('Runtime.enable'); await send('Page.enable'); await send('Log.enable');
await send('Page.navigate', { url });
for (let i = 0; i < 100; i++) { if (await ev(`document.body && document.body.dataset.ready === '1'`)) break; await sleep(200); }
await sleep(600);
if (clipSel && clipSel.endsWith(' *all')) {
  const sel = clipSel.slice(0, -5);
  const rects = await ev(`[...document.querySelectorAll(${JSON.stringify(sel)})].map(e => { const r = e.getBoundingClientRect(); return { id: e.dataset.id, x: r.left + scrollX, y: r.top + scrollY, width: r.width, height: r.height, scale: 1 }; })`);
  for (const { id, ...clip } of rects) {
    const s = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip });
    writeFileSync(out.replace(/\.png$/, '') + '-' + id + '.png', Buffer.from(s.result.data, 'base64'));
  }
  console.log(rects.length, 'frames ->', out.replace(/\.png$/, '') + '-*.png', logs.length ? '\n' + logs.join('\n') : 'no errors');
  ws.close(); proc.kill(); process.exit(0);
}
let clip;
if (clipSel) clip = await ev(`(() => { const r = document.querySelector(${JSON.stringify(clipSel)}).getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, width: r.width, height: r.height, scale: 1 }; })()`);
const h = await ev('document.documentElement.scrollHeight');
const s = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: clip || { x: 0, y: 0, width: +width, height: Math.min(h, 16000), scale: 1 } });
writeFileSync(out, Buffer.from(s.result.data, 'base64'));
console.log(out, 'height', h, logs.length ? '\n' + logs.join('\n') : 'no errors');
ws.close(); proc.kill();

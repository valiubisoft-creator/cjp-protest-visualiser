// Minimal Chrome DevTools Protocol driver shared by tools/cdp-scroll.mjs and tools/compare.mjs (F3).
// No dependencies: headless Chrome + Node's built-in WebSocket and fetch.
import { spawn } from 'node:child_process';

const CH = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
export const sleep = ms => new Promise(r => setTimeout(r, ms));

// size "w,h": the exact CSS viewport (forced with Emulation, so window chrome can't shrink it)
export async function launch({ size = process.env.SIZE || '1440,900' } = {}) {
  const [w, h] = size.split(',').map(Number);
  const port = 9300 + Math.floor(Math.random() * 600);
  const proc = spawn(CH, ['--headless=new', `--remote-debugging-port=${port}`, '--hide-scrollbars', `--window-size=${w},${h}`, '--user-data-dir=/tmp/cdp-' + port, 'about:blank'], { stdio: 'ignore' });
  let tabs;
  for (let i = 0; i < 60; i++) { try { tabs = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); break; } catch { await sleep(150); } }
  if (!tabs) { proc.kill(); throw new Error('Chrome did not start'); }
  const ws = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  let id = 0; const pending = new Map(); const logs = [];
  ws.onmessage = m => {
    const d = JSON.parse(m.data);
    if (d.id) return pending.get(d.id)?.(d);
    if (d.method === 'Runtime.consoleAPICalled') logs.push(d.params.type + ': ' + d.params.args.map(a => a.value ?? a.description).join(' '));
    else if (d.method === 'Runtime.exceptionThrown') logs.push('EXC: ' + (d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text));
    else if (d.method === 'Log.entryAdded' && d.params.entry.level === 'error') logs.push('LOG: ' + d.params.entry.text + ' ' + (d.params.entry.url || ''));
  };
  const send = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async e => {
    const r = await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true });
    if (r.result?.exceptionDetails) throw new Error('eval: ' + (r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text) + '\n  in: ' + e.slice(0, 200));
    return r.result?.result?.value;
  };
  await send('Runtime.enable'); await send('Page.enable'); await send('Log.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
  return {
    w, h, send, ev, logs,
    async goto(url, { ready = false, wait = 2500 } = {}) {
      await send('Page.navigate', { url });
      if (ready) { for (let i = 0; i < 100; i++) { try { if (await ev(`document.body && document.body.dataset.ready === '1'`)) break; } catch {} await sleep(150); } await sleep(300); }
      else await sleep(wait);
    },
    async shot(file, write) { const s = await send('Page.captureScreenshot', { format: 'png' }); write(file, Buffer.from(s.result.data, 'base64')); },
    close() { ws.close(); proc.kill(); },
  };
}

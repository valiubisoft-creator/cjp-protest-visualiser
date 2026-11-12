// Side-by-side QA sheets (F3): storyboard frame | QA shot scrolling down | QA shot scrolling up, in one PNG.
// Also measures how many pixels differ between the down and up shots (determinism check: should be ~0
// for a scene whose update(p) is pure, given ?still).
//
// usage: node tools/compare.mjs <targets.json> <qaDir> [theme=ink]
//   reads  design/shots/frames/<theme>-<frame>.png and <qaDir>/<name>-{down,up}.png
//   writes <qaDir>/compare-<name>.png, and adds the down/up diff to <qaDir>/compare.json
// e.g. node tools/compare.mjs docs/build/scenes/targets/S4.json qa/v3/S4
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { launch } from './lib/cdp.mjs';

const [tfile, dir, theme = 'ink'] = process.argv.slice(2);
if (!tfile || !dir) { console.error('usage: node tools/compare.mjs <targets.json> <qaDir> [theme=ink]'); process.exit(2); }
const spec = JSON.parse(readFileSync(tfile, 'utf8'));
const uri = f => existsSync(f) ? 'data:image/png;base64,' + readFileSync(f).toString('base64') : null;

const b = await launch({ size: '800,600' });
await b.goto('about:blank', { wait: 100 });
const out = [];
for (const t of spec.targets) {
  const sb = t.frame ? `design/shots/frames/${theme}-${t.frame}.png` : null;
  const imgs = [
    { label: sb ? `STORYBOARD  ${theme}-${t.frame}` : 'STORYBOARD  (no frame for this target)', src: sb && uri(sb) },
    { label: `QA DOWN  ${t.at}`, src: uri(`${dir}/${t.name}-down.png`) },
    { label: `QA UP  ${t.at}`, src: uri(`${dir}/${t.name}-up.png`) },
  ];
  if (!imgs[1].src && !imgs[2].src) { console.log(`skip ${t.name}: no QA shots in ${dir}`); continue; }
  // composite in the page: three panels at half size, labels on top, then read back as PNG
  const res = await b.ev(`(async () => {
    const imgs = ${JSON.stringify(imgs)};
    const load = s => new Promise(r => { if (!s) return r(null); const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = s; });
    const I = await Promise.all(imgs.map(x => load(x.src)));
    const W = 720, H = 450, G = 16, L = 28;
    const c = document.createElement('canvas'); c.width = W * 3 + G * 4; c.height = H + L + G * 2;
    const x = c.getContext('2d'); x.fillStyle = '#2a2a28'; x.fillRect(0, 0, c.width, c.height);
    x.font = '600 13px system-ui'; x.textBaseline = 'middle';
    I.forEach((im, k) => {
      const X = G + k * (W + G);
      x.fillStyle = '#FAFAF7'; x.fillText(imgs[k].label, X, G + L / 2 - 4);
      if (im) x.drawImage(im, X, G + L, W, H); else { x.fillStyle = '#444'; x.fillRect(X, G + L, W, H); x.fillStyle = '#bbb'; x.fillText('missing', X + W / 2 - 24, G + L + H / 2); }
    });
    // down vs up pixel diff at full size
    let diff = null;
    if (I[1] && I[2]) {
      const w = I[1].naturalWidth, h = I[1].naturalHeight, a = new OffscreenCanvas(w, h).getContext('2d'), d = new OffscreenCanvas(w, h).getContext('2d');
      a.drawImage(I[1], 0, 0); d.drawImage(I[2], 0, 0);
      const A = a.getImageData(0, 0, w, h).data, B = d.getImageData(0, 0, w, h).data; let n = 0;
      for (let i = 0; i < A.length; i += 4) if (Math.abs(A[i] - B[i]) + Math.abs(A[i + 1] - B[i + 1]) + Math.abs(A[i + 2] - B[i + 2]) > 24) n++;
      diff = n / (w * h);
    }
    return { png: c.toDataURL('image/png').split(',')[1], diff };
  })()`);
  writeFileSync(`${dir}/compare-${t.name}.png`, Buffer.from(res.png, 'base64'));
  out.push({ name: t.name, at: t.at, frame: t.frame ?? null, downUpDiff: res.diff });
  console.log(`${dir}/compare-${t.name}.png  down≠up pixels: ${res.diff == null ? 'n/a' : (res.diff * 100).toFixed(3) + '%'}`);
}
writeFileSync(`${dir}/compare.json`, JSON.stringify(out, null, 1));
b.close();

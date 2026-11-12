// S1 → S2 timed sequence QA (prologue chat, 2026-11-12). usage: SIZE=w,h node tools/qa-sequence.mjs [outDir=qa/v3/S2/seq]
//   1 click     mouse click on the keyword: scroll locks, filmstrip shots, ends unlocked on S2 p 0 with spawn.done
//   2 keyboard  focus the keyword + Enter starts it too; the button has its aria-label and a visible focus ring
//   3 auto      scrolling to S1 p 0.92 without clicking triggers it
//   4 reset     scrolling back to S1 p ≤ 0.5 restores the quote; scrolling down past 0.92 replays it
//   5 deep link ?p=S2:0.3 renders the done state without running the sequence
//   + wheel during the sequence does not move the page; no console errors
import { writeFileSync, mkdirSync } from 'node:fs';
import { launch, sleep } from './lib/cdp.mjs';
const out = process.argv[2] || 'qa/v3/S2/seq';
mkdirSync(out, { recursive: true });
const BASE = process.env.BASE || 'http://localhost:5173/v3/';
const b = await launch(); const { ev, send } = b;
let fails = 0; const ok = (c, m) => { console.log(`${c ? 'PASS' : 'FAIL'} ${m}`); if (!c) fails++; };
const st = () => ev('JSON.stringify({ s: __v3.state(), quote: getComputedStyle(document.querySelector(".s1-quote")).visibility, label: !document.querySelector(".s2-spawn").hidden })').then(JSON.parse);
const kwBox = () => ev('(() => { const r = document.querySelector(".kw").getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()');
async function wheel(dy) { const { x, y } = { x: 700, y: 450 }; await send('Input.dispatchMouseEvent', { type: 'mouseWheel', x, y, deltaX: 0, deltaY: dy }); }

/* 1 · click */
await b.goto(BASE + '?p=S1:0.5', { ready: true }); await sleep(600);
const k = await kwBox();
await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: k.x, y: k.y });
await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: k.x, y: k.y, button: 'left', clickCount: 1 });
await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: k.x, y: k.y, button: 'left', clickCount: 1 });
const t0 = Date.now(), y0 = await ev('scrollY');
const marks = [150, 500, 800, 1150, 1700, 2300, 2700];
let locked = false;
for (const m of marks) {
  await sleep(Math.max(0, m - (Date.now() - t0)));
  await b.shot(`${out}/seq-${String(m).padStart(4, '0')}ms.png`, writeFileSync);
  if (m === 500) { locked = (await st()).s.locked; await wheel(600); await sleep(80); }
}
const yMid = await ev('scrollY');
ok(locked, 'click: scroll is locked during the sequence');
ok(Math.abs(yMid - y0) < 2, `click: wheel does not move the page mid-sequence (Δy ${yMid - y0})`);
await sleep(3600 - (Date.now() - t0));
let s = await st();
await b.shot(`${out}/seq-3600ms-end.png`, writeFileSync);
ok(!s.s.locked && s.s.scene === 'S2' && s.s.p < .01, `click: ends unlocked on S2 p 0 (got ${s.s.scene} p ${s.s.p.toFixed(3)}, locked ${s.s.locked})`);
ok(s.label, 'click: the spawn label is showing');
const y2 = await ev('__v3.yFor("S2", 0)');
ok(Math.abs(s.s.y - y2) <= 1, 'click: scroll position is S2 p 0');

/* 4 · reset + replay (continuing from the done state) */
await ev('__v3.seek("S1", 0.7)'); await sleep(200); s = await st();
ok(s.quote === 'hidden', 'reset: S1 p 0.7 above the reset line still shows the done state');
await ev('__v3.seek("S1", 0.45)'); await sleep(200); s = await st();
ok(s.quote === 'visible' && !s.label, 'reset: S1 p 0.45 restores the quote');
await b.shot(`${out}/reset-S1-0.45.png`, writeFileSync);

/* 3 · auto-trigger (replay) */
await ev('__v3.seek("S1", 0.93)'); await sleep(300); s = await st();
ok(s.s.locked, 'auto: S1 p 0.93 without a click starts the sequence (replay after reset)');
await sleep(3500); s = await st();
ok(!s.s.locked && s.s.scene === 'S2', `auto: ends on S2 (got ${s.s.scene} p ${s.s.p.toFixed(3)})`);

/* 2 · keyboard */
await ev('__v3.seek("S1", 0.3)'); await sleep(300);
const aria = await ev('document.querySelector(".kw").getAttribute("aria-label")');
ok(/^Click the word cockroaches to continue$/.test(aria), `keyboard: aria-label "${aria}"`);
// reach it the way a keyboard user does: from the page, Tab (it is the first focusable element on this frame)
await ev('document.activeElement?.blur()');
for (let i = 0; i < 4 && !(await ev('document.activeElement?.classList.contains("kw")')); i++) {
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
}
await sleep(100);
const ring = await ev('getComputedStyle(document.querySelector(".kw")).outlineStyle');
await b.shot(`${out}/focus-ring.png`, writeFileSync);
ok(ring !== 'none', `keyboard: focus ring visible (outline ${ring})`);
await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r' });
await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
await sleep(300); s = await st();
ok(s.s.locked, 'keyboard: Enter starts the sequence');
await sleep(3500); s = await st();
ok(s.s.scene === 'S2' && !s.s.locked, 'keyboard: ends on S2');

/* 5 · deep link */
await b.goto(BASE + '?still&p=S2:0.3', { ready: true }); await sleep(400); s = await st();
ok(!s.s.locked && s.label && s.s.scene === 'S2', 'deep link: S2 p 0.3 shows the done state, no sequence');
ok(!b.logs.some(l => /^(EXC|error|LOG)/.test(l)), 'console: no errors' + (b.logs.length ? '\n  ' + b.logs.join('\n  ') : ''));
console.log(fails ? `${fails} FAIL` : 'ALL PASS');
b.close(); process.exitCode = fails ? 1 : 0;

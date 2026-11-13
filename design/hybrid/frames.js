// Hybrid Gate 0: static key frames for the NEW chapters (Withheld, October, the roll), at the viewport size.
// Storyboard only. Real parts: the verbatim roach() renderer, the halftone backdrop, the tokens, copy.js + data/story.
import { roach } from '../../src/roach/roach.js';
import { halftone } from '../../src/lib/halftone.js';
import { canvasIn, tok } from '../../src/lib/dom.js';
import { rng } from '../../src/lib/rng.js';
import { esc } from '../../src/lib/text.js';
import { star } from '../../src/lib/star.js';
import { load } from '../../src/data/load.js';
import { sources, root, lock, cap, titleCard, stamp, CH } from './chrome.js';
import { createWatched } from './watched.js';
import { createCage } from './cage.js';
import { render } from './copy.js';

const W = innerWidth, H = innerHeight, TAU = Math.PI * 2;
const Q = new URLSearchParams(location.search), F = Q.get('f') || 'withheld', PQ = +(Q.get('p') ?? 1), HOVER = Q.get('hover');
await document.fonts.load('100px "Protest Revolution"'); await document.fonts.load('900 40px "Public Sans"'); await document.fonts.load('40px "Redaction"');
await document.fonts.ready;
const S = await sources(), R = root();
const layer = () => { const g = canvasIn(document.body, W, H); g.canvas.classList.add('abs'); return g; };
const back = () => halftone(layer(), W, H, { seed: 11, cell: 7, ink: tok('--ht-ink') });
const k = Math.min(W / 1440, H / 900);           // layout scale (1 at 1440×900)
const html = (s, host = R) => { host.insertAdjacentHTML('beforeend', s); return host.lastElementChild; };
const fmt = n => n.toLocaleString('en-IN');
const renderStar = s => render(s, S, star);
// portraits already in the ledger (timeline people) for the people detentions.json has no image for
const PEOPLE = {
  'abhijeet-dipke': { src: 'media/people/abhijeet-dipke.jpg', credit: 'Screenshot from LetsUpp Marathi on YouTube, CC BY 4.0, via Wikimedia Commons' },
  'saurav-das': { src: 'media/people/saurav-das.png', credit: 'Screenshot from Teesta Setalvad on YouTube, CC BY 4.0, via Wikimedia Commons' },
  'ashutosh-ranka': { src: 'media/people/Ashutosh_Ranka.png', credit: 'Wikigama (uploaded 31 Jul 2026), CC BY-SA 4.0' },
};

const FR = {
  // 02 · the grievance: an answer sheet of 2,279 bubbles (one per 1,000 registered candidates), stamped cancelled
  neet() {
    back(); lock(R, 'neet', { boxed: false });
    const g = layer(), r = rng(21), N = 2279;
    const sx = 120 * k, sy = 140 * k, sw = W - 560 * k, sh = H - sy - 90 * k;
    // the sheet: paper-dark panel with the OMR header strip
    g.fillStyle = '#151514'; g.fillRect(sx, sy, sw, sh); g.strokeStyle = '#3A3A37'; g.lineWidth = 1; g.strokeRect(sx + .5, sy + .5, sw - 1, sh - 1);
    html(`<div style="position:absolute;left:${sx + 16}px;top:${sy + 10}px;right:${W - sx - sw + 16}px;display:flex;justify-content:space-between;font:760 11px/1 var(--font-ui);letter-spacing:.14em;text-transform:uppercase;color:var(--muted)"><span>NEET-UG 2026 · 3 May</span><span>One bubble = 1,000 registered candidates</span></div>`);
    const top = sy + 36, cols = Math.round(Math.sqrt(N * sw / (sh - 46))), rows = Math.ceil(N / cols), px = (sw - 32) / cols, py = (sh - 52) / rows, rad = Math.min(px, py) * .36;
    for (let i = 0; i < N; i++) {
      const x = sx + 16 + (i % cols + .5) * px, y = top + (Math.floor(i / cols) + .5) * py;
      g.beginPath(); g.arc(x, y, rad, 0, TAU); g.fillStyle = '#C9C8C2'; g.fill();
    }
    // the stamp
    html(`<div style="position:absolute;left:${sx + sw / 2}px;top:${sy + sh / 2}px;transform:translate(-50%,-50%) rotate(-11deg);border:5px solid var(--red);color:var(--red);padding:14px 26px 10px;text-align:center;background:rgba(11,11,11,.86)">
      <div style="font:400 ${84 * k}px/1 var(--font-display)">Cancelled</div><div style="font:760 14px/1.4 var(--font-ui);letter-spacing:.18em;text-transform:uppercase;margin-top:4px">12 May 2026 · NTA</div></div>`);
    // the movement at the margins: S3.5's roaches gathering round the sheet
    g.fillStyle = g.strokeStyle = tok('--roach');
    for (let i = 0, n = 0; n < 120 && i < 4000; i++) {
      const x = sx - 70 + r() * (sw + 140), y = sy - 40 + r() * (sh + 80);
      if (x > sx - 8 && x < sx + sw + 8 && y > sy - 8 && y < sy + sh + 8) continue;
      roach(g, x, y, Math.atan2(sy + sh / 2 - y, sx + sw / 2 - x), 5, r() * TAU); n++;
    }
    cap(R, 'neet', 1, S, { style: `right:24px;top:${sy}px;` });
  },

  // the Withheld title card, over the S3.5 end state (dimmed)
  'withheld-title'() {
    back(); const g = layer();
    const r = rng(5);
    g.globalAlpha = .16; g.fillStyle = tok('--roach');
    for (let i = 0; i < 1000; i++) {
      const left = i < 940, cx = left ? W * .34 : W * .66, rad = (left ? 190 : 46) * k * Math.sqrt(r()), a = r() * TAU;
      roach(g, cx + Math.cos(a) * rad, H * .46 + Math.sin(a) * rad, r() * TAU, 5, r() * TAU);
    }
    titleCard(R, 'withheld', S);
  },

  // one account withheld for 48 days; the swarm walks out into a second account within hours
  withheld() {
    back(); const g = layer(); const r = rng(9);
    lock(R, 'withheld', { boxed: false });
    const top = 150 * k, A = { x: 120 * k, y: top, w: 430 * k, h: H - top - 210 * k }, B = { x: A.x + A.w + 150 * k, y: top + 70 * k, w: 300, h: A.h - 70 * k };
    const box = (b, handle, sub, red) => html(`<div style="position:absolute;left:${b.x}px;top:${b.y}px;width:${b.w}px;height:${b.h}px;border:2px solid ${red ? 'var(--red)' : 'var(--fg)'}">
      <div style="padding:10px 14px;border-bottom:1px solid var(--rule-c);display:flex;justify-content:space-between;align-items:baseline;background:var(--bg)">
        <b style="font:760 15px/1 var(--font-ui)">${esc(handle)}</b><span class="hy-kick" style="font-size:11px">${esc(sub)}</span></div></div>`);
    box(A, '@CJP_2029', 'X · original account', true);
    box(B, '@Cockroachisback', 'opened 21 May', false);
    // A: the followers, frozen and greyed behind the notice
    g.fillStyle = '#3A3A37';
    for (let i = 0; i < 260; i++) roach(g, A.x + 24 + r() * (A.w - 48), A.y + 60 + r() * (A.h - 84), r() * TAU, 5, r() * TAU);
    html(`<div style="position:absolute;left:${A.x + 28 * k}px;top:${A.y + A.h * .36}px;width:${A.w - 56 * k}px;background:var(--red);color:var(--white);padding:16px 18px">
      <div style="font:760 12px/1.2 var(--font-ui);letter-spacing:.14em;text-transform:uppercase">Withheld in India</div>
      <div style="font:400 15px/1.4 var(--font-text);margin-top:6px">Section 69A, IT Act. Order by email, 21 May 2026.</div></div>`);
    // the walk-out: roaches stream from A's right edge into B and fill it (white = live)
    g.fillStyle = tok('--roach');
    for (let i = 0; i < 70; i++) {
      const t = r(), x = A.x + A.w + t * (B.x - A.x - A.w) + 10, y = A.y + A.h * .55 + Math.sin(t * 5 + r()) * 24 * k + (r() - .5) * 30 * k;
      roach(g, x, y, (r() - .5) * .7, 5.4, r() * TAU);
    }
    for (let i = 0; i < 190; i++) roach(g, B.x + 20 + r() * (B.w - 40), B.y + 56 + r() * (B.h - 76), r() * TAU, 5.4, r() * TAU);
    // the tally: 48 days the order stood
    const ty = A.y + A.h + 34 * k;
    html(`<div style="position:absolute;left:${A.x}px;top:${ty}px;display:flex;align-items:flex-end;gap:22px">
      <div><div class="hy-kick">Days the order stood</div><div style="font:900 ${64 * k}px/1 var(--font-ui);font-variant-numeric:tabular-nums;margin-top:6px">48</div></div>
      <svg width="${520 * k}" height="${48 * k}" viewBox="0 0 520 48" style="margin-bottom:6px">${Array.from({ length: 48 }, (_, i) => {
        const grp = Math.floor(i / 5), j = i % 5, x = grp * 52 + j * 9;
        return j === 4 ? `<line x1="${x - 38}" y1="40" x2="${x + 2}" y2="8" stroke="#E0201B" stroke-width="3"/>` : `<line x1="${x}" y1="6" x2="${x}" y2="42" stroke="#E0201B" stroke-width="3"/>`;
      }).join('')}</svg></div>`);
    cap(R, 'withheld', 3, S, { style: `right:24px;top:${top}px;` });
  },

  // Delhi, 10 Oct: one field of people, one roach each; every published count is a line through it
  october() {
    back(); const g = layer();
    lock(R, 'october', { boxed: false });
    const counts = [
      [200, 'about 200', 'police source (Reuters)', 'oct_dailystar_1010', 'lo'], [500, 'around 500', 'Delhi Police', 'oct_openmag_1010', 'lo'],
      [1000, 'around 1,000', 'police sources', 'oct_gulfnews_1010', 'lo'], [2000, 'about 2,000', 'MHA official (Reuters)', 'oct_aj_1010', 'hi'],
      [2500, 'nearly 2,500', 'police sources (The Hindu)', 'oct_aj_1010', 'lo'], [3000, 'more than 3,000', 'Delhi Police (PTI)', 'oct_dc_1010', 'lo'],
      [7000, 'nearly 7,000', 'Delhi Police (PTI)', 'oct_fpj_1011', 'hi'], [15000, 'more than 15,000', 'CJP', 'oct_gulfnews_1010', 'hi']];
    const X0 = 120 * k, X1 = W - 470 * k, Y0 = 210 * k, Y1 = H - 170 * k, N = 15000;
    const rows = Math.round(Math.sqrt(N * (Y1 - Y0) / (X1 - X0))), cols = Math.ceil(N / rows), pitch = (X1 - X0) / cols;
    const xOf = n => X0 + Math.floor(n / rows) * pitch;
    const r = rng(3);
    for (let i = 0; i < N; i++) {
      const c = Math.floor(i / rows), rr = i % rows, x = X0 + c * pitch + pitch / 2, y = Y0 + rr * (Y1 - Y0) / rows + (Y1 - Y0) / rows / 2;
      g.fillStyle = i < 2000 ? tok('--roach') : i < 7000 ? '#8A8984' : '#4A4A46';
      roach(g, x, y, -Math.PI / 2 + (r() - .5) * .5, pitch * .52, r() * TAU);
    }
    g.strokeStyle = '#E0201B'; g.lineWidth = 1.5;
    for (const [n, , , , lvl] of counts) { const x = xOf(n); g.beginPath(); g.moveTo(x, lvl === 'hi' ? Y0 - 34 * k : Y0 - 8); g.lineTo(x, Y1 + (lvl === 'lo' ? 30 * k : 4)); g.stroke(); }
    // labels: the big three above the field; the crowded low counts stacked below with leaders
    let lo = 0;
    for (const [n, v, who, id, lvl] of counts) {
      const x = xOf(n);
      if (lvl === 'hi') { html(`<div style="position:absolute;left:${x - 4}px;top:${Y0 - 78 * k}px;font:400 12px/1.3 var(--font-ui);white-space:nowrap"><b style="font:760 15px/1 var(--font-ui)">${esc(v)}</b>${star([id], S, who)}<br><span style="color:var(--muted)">${esc(who)}</span></div>`); continue; }
      const ly = Y1 + 16 * k + lo++ * 17;
      g.strokeStyle = '#6B6B66'; g.lineWidth = 1; g.beginPath(); g.moveTo(x, Y1 + 4); g.lineTo(x, ly + 7); g.lineTo(X0 + 300 * k, ly + 7); g.stroke();
      html(`<div style="position:absolute;left:${X0 + 306 * k}px;top:${ly}px;font:400 11px/14px var(--font-ui);color:var(--muted);white-space:nowrap"><b style="color:var(--fg)">${esc(v)}</b>${star([id], S, who)} ${esc(who)}</div>`);
    }
    // zoom inset: at this density each person is a grain, so a loupe shows they are roaches
    { const zx = xOf(2000) + 70 * k, zy = Y0 + 170 * k, zr = 78 * k, z = 3.2, sx = xOf(2000) - 4, sy = Y0 + 60 * k;
      g.save(); g.beginPath(); g.arc(zx, zy, zr, 0, TAU); g.fillStyle = tok('--bg'); g.fill(); g.clip();
      const rr = rng(3);
      for (let i = 0; i < N; i++) {
        const c = Math.floor(i / rows), q = i % rows, x = X0 + c * pitch + pitch / 2, y = Y0 + q * (Y1 - Y0) / rows + (Y1 - Y0) / rows / 2, rot = -Math.PI / 2 + (rr() - .5) * .5, lg = rr() * TAU;
        if (Math.abs(x - sx) > zr / z + 8 || Math.abs(y - sy) > zr / z + 8) continue;
        g.fillStyle = g.strokeStyle = i < 2000 ? tok('--roach') : '#8A8984';
        roach(g, zx + (x - sx) * z, zy + (y - sy) * z, rot, pitch * .52 * z, lg);
      }
      g.restore(); g.strokeStyle = tok('--fg'); g.lineWidth = 1.5; g.beginPath(); g.arc(zx, zy, zr, 0, TAU); g.stroke();
      html(`<div style="position:absolute;left:${zx + zr + 8}px;top:${zy - 8}px;font:760 11px/1.2 var(--font-ui);letter-spacing:.1em;text-transform:uppercase;background:var(--bg);padding:3px 5px">One roach, one person</div>`); }
    html(`<div style="position:absolute;left:${X0}px;top:${Y1 + 112 * k}px;font:400 11px/1.3 var(--font-ui);color:var(--muted)">10 Oct, Delhi. One roach = one person. White: up to the lowest official count · grey: up to the highest police count · dark: the CJP’s count</div>`);
    cap(R, 'october', 2, S, { style: `right:24px;top:${Y0}px;` });
  },

  // 08 · 10 October, one day: taken at dawn, detained on landing (detentions.json)
  async 'october-dawn'() {
    back(); lock(R, 'october', { boxed: false });
    const det = await load('story/detentions.json'), P = Object.fromEntries(det.people.map(p => [p.id, p]));
    const X0 = 120 * k, X1 = W - 470 * k, Y = H * .66, hx = h => X0 + (X1 - X0) * h / 28;   // 00:00 10 Oct → 04:00 11 Oct
    const g = layer();
    // the day strip
    g.strokeStyle = '#3A3A37'; g.lineWidth = 2; g.beginPath(); g.moveTo(X0, Y); g.lineTo(X1, Y); g.stroke();
    for (let t = 0; t <= 28; t++) { g.beginPath(); g.moveTo(hx(t), Y - (t % 6 ? 4 : 9)); g.lineTo(hx(t), Y + (t % 6 ? 4 : 9)); g.stroke(); }
    for (const [t, l] of [[0, '00:00'], [6, '06:00'], [12, 'Noon'], [18, '18:00'], [24, 'Midnight'], [28, '04:00']])
      html(`<div style="position:absolute;left:${hx(t) - 40}px;top:${Y + 16}px;width:80px;text-align:center;font:400 11px/1 var(--font-ui);color:var(--muted)">${l}</div>`);
    html(`<div class="hy-kick" style="position:absolute;left:${X0}px;top:${Y + 44}px">Saturday 10 October · Delhi and Gurugram</div>`);
    // Rathee: a hatched band 06:00–08:00 (reports differ), then released ~03:00 next day
    g.save(); g.beginPath(); g.rect(hx(6), Y - 10, hx(8) - hx(6), 20); g.clip();
    g.strokeStyle = '#E0201B'; g.lineWidth = 2; for (let x = hx(6) - 30; x < hx(8) + 30; x += 6) { g.beginPath(); g.moveTo(x, Y + 12); g.lineTo(x + 20, Y - 12); g.stroke(); } g.restore();
    g.strokeStyle = '#E0201B'; g.lineWidth = 1.5; g.strokeRect(hx(6), Y - 10, hx(8) - hx(6), 20);
    g.setLineDash([4, 4]); g.beginPath(); g.moveTo(hx(8), Y); g.lineTo(hx(27), Y); g.stroke(); g.setLineDash([]);
    g.fillStyle = '#E0201B'; g.beginPath(); g.arc(hx(10.5), Y, 7, 0, TAU); g.fill();
    g.strokeStyle = '#FAFAF7'; g.lineWidth = 2; g.beginPath(); g.arc(hx(27), Y, 6, 0, TAU); g.stroke();
    // people above their moments
    const face = (id, x, w = 96) => { const im = P[id].image || PEOPLE[id]; return `<figure style="margin:0;width:${w}px"><img src="/${im.src}" alt="" style="width:${w}px;height:${w}px;object-fit:cover;filter:grayscale(1) contrast(1.1);border:2px solid var(--fg);display:block"><figcaption style="font:760 11px/1.25 var(--font-ui);margin-top:6px;white-space:nowrap">${esc(P[id].name)}</figcaption></figure>`; };
    const credits = ['dhruv-rathee', 'abhijeet-dipke', 'saurav-das', 'ashutosh-ranka'].map(id => `${esc(P[id].name)}: ${esc((P[id].image || PEOPLE[id]).credit)}`).join(' · ');
    const pin = (x, top, h) => `<div style="position:absolute;left:${x}px;top:${top}px;width:1px;height:${h}px;background:var(--muted)"></div>`;
    // two stacked blocks: Rathee's ends at its pin (right-aligned), the plane's starts at its pin; pins measured
    const yT = Y - 330 * k;
    const r1 = html(`<div style="position:absolute;right:${W - hx(7) - 12}px;top:${yT}px;width:240px;text-align:right">
      <div style="display:flex;justify-content:flex-end">${face('dhruv-rathee', 88)}</div>
      <div style="font:900 ${Math.max(24, 30 * k)}px/1 var(--font-ui);margin-top:12px">6–8 am<span style="font-size:.6em">${star(['det_oneindia_rathee_release_1011', 'det_outlook_rathee_1010'], S, 'reported; times differ')}</span></div>
      <div style="font:400 13px/1.35 var(--font-text);color:var(--muted);margin-top:4px">Taken from his family home, Gurugram. Reported times differ.</div></div>`);
    const r2 = html(`<div style="position:absolute;left:${hx(10.5) - 12}px;top:${yT}px;width:300px">
      <div style="display:flex;gap:10px">${face('abhijeet-dipke', 88)}${face('saurav-das', 88)}${face('ashutosh-ranka', 88)}</div>
      <div style="font:900 ${Math.max(24, 30 * k)}px/1 var(--font-ui);margin-top:12px">About 10.30 am<span style="font-size:.6em">${star(['det_oneindia_lockdown_1010', 'oct_aj_1010'], S, 'reported')}</span></div>
      <div style="font:400 13px/1.35 var(--font-text);color:var(--muted);margin-top:4px">Detained inside the plane, minutes after it landed from Mumbai.</div></div>`);
    for (const [el, x] of [[r1, hx(7)], [r2, hx(10.5)]]) { const bb = el.getBoundingClientRect(); html(pin(x, bb.bottom + 8, Y - bb.bottom - 16)); }
    html(`<div style="position:absolute;left:${hx(27) - 150}px;top:${Y - 74}px;width:150px;text-align:right;font:400 12px/1.35 var(--font-ui);color:var(--muted)"><b style="color:var(--fg)">About 3 am</b>${star(['det_oneindia_rathee_release_1011'], S, 'police said')}<br>Rathee released</div>`);
    html(`<div style="position:absolute;left:${X0}px;bottom:14px;width:${X1 - X0}px;font:400 10px/1.3 var(--font-ui);color:var(--muted)">Photos: ${credits}</div>`);
    cap(R, 'october', 1, S, { style: `right:24px;top:${yT}px;` });
  },

  // the two leaders: seven days in judicial custody
  'october-cell'() {
    back(); const g = layer();
    lock(R, 'october', { boxed: false });
    const cx = W * .36, cy = H * .5, w = 420 * k, h = 300 * k;
    g.strokeStyle = tok('--fg'); g.lineWidth = 3; g.strokeRect(cx - w / 2, cy - h / 2, w, h);
    g.lineWidth = 2; for (let i = 1; i < 12; i++) { const x = cx - w / 2 + i * w / 12; g.beginPath(); g.moveTo(x, cy - h / 2); g.lineTo(x, cy + h / 2); g.stroke(); }
    g.fillStyle = tok('--roach');
    roach(g, cx - w * .2, cy + 10, -Math.PI / 2 + .15, 22, .4); roach(g, cx + w * .2, cy + 10, -Math.PI / 2 - .2, 22, 2.1);
    html(`<div style="position:absolute;left:${cx - w / 2}px;top:${cy + h / 2 + 14}px;width:${w}px;display:flex;justify-content:space-around;font:760 15px/1.2 var(--font-ui)"><span>Saurav Das</span><span>Ashutosh Ranka</span></div>`);
    html(`<div style="position:absolute;left:${cx - w / 2}px;top:${cy - h / 2 - 96 * k}px;display:flex;align-items:flex-end;gap:18px">
      <div style="font:900 ${64 * k}px/1 var(--font-ui)">7</div><div class="hy-kick" style="margin-bottom:8px">days in judicial custody<br>14 – 21 Oct</div></div>`);
    cap(R, 'october', 4, S, { style: `right:24px;top:${cy - h / 2}px;` });
  },

  // the roll: a hundred entries, one is you; 13 struck off (about 13 in 100, draft rolls, so far)
  roll() {
    back(); lock(R, 'roll', { boxed: false });
    const r = rng(13), cols = 10, gx = 120 * k, gy = 160 * k, gw = W - 520 * k - gx, gh = H - gy - 60 * k;
    const cw = gw / cols, chh = gh / 10, struck = new Set();
    while (struck.size < 13) struck.add(Math.floor(r() * 100));
    let you = 37; while (struck.has(you)) you++;
    let cells = '';
    for (let i = 0; i < 100; i++) {
      const x = gx + (i % cols) * cw, y = gy + Math.floor(i / cols) * chh, s = struck.has(i), me = i === you;
      cells += `<div style="position:absolute;left:${x + 3}px;top:${y + 3}px;width:${cw - 6}px;height:${chh - 6}px;border:${me ? '2px solid var(--red)' : '1px solid var(--rule-c)'};background:${me ? 'var(--surface)' : 'transparent'};opacity:${s ? .55 : 1}">
        <span style="position:absolute;left:6px;top:5px;font:600 10px/1 var(--font-ui);color:var(--muted);font-variant-numeric:tabular-nums">${i + 1}</span>
        <i style="position:absolute;right:6px;top:6px;width:${chh * .32}px;height:${chh * .4}px;background:#2A2A27"></i>
        <i style="position:absolute;left:6px;top:${chh * .46}px;width:52%;height:4px;background:#3A3A37"></i>
        <i style="position:absolute;left:6px;top:${chh * .62}px;width:36%;height:4px;background:#2E2E2B"></i>
        ${me ? `<b style="position:absolute;left:6px;bottom:5px;font:760 11px/1 var(--font-ui);letter-spacing:.12em;color:var(--accent-text)">YOU</b>` : ''}
        ${s ? `<svg width="100%" height="100%" style="position:absolute;inset:0" preserveAspectRatio="none" viewBox="0 0 10 10"><line x1="0" y1="10" x2="10" y2="0" stroke="#E0201B" stroke-width=".5" vector-effect="non-scaling-stroke" style="stroke-width:3px"/></svg><b style="position:absolute;left:6px;bottom:5px;font:760 10px/1 var(--font-ui);letter-spacing:.1em;color:var(--red-bright)">DELETED</b>` : ''}
      </div>`;
    }
    html(`<div>${cells}</div>`);
    cap(R, 'roll', 1, S, { style: `right:24px;top:${gy}px;` });
    // the draft-vs-final caveat (about 10 in 100 net on final rolls, Bihar + Phase 2) goes in the * footer entry, not here
  },

  // 06 · the 1,000-dot screen (anime.js); ?p= the scroll position, ?hover=1 the biggest video's dots
  async watched() {
    back(); lock(R, 'watched', { boxed: false });
    const box = { x: 90 * k, y: 120 * k, w: W - 560 * k, h: H - 230 * k };
    const tick = html(`<div style="position:absolute;left:${box.x}px;right:${430 * k}px;bottom:${36 * k}px;height:44px"></div>`);
    const big = html(`<div style="position:absolute;right:24px;top:${120 * k}px;width:360px"><div class="hy-kick" data-d></div>
      <div style="font:900 ${76 * k}px/1 var(--font-ui);font-variant-numeric:tabular-nums;margin-top:8px" data-v></div>
      <div data-l style="font:400 15px/1.4 var(--font-text);color:var(--muted);margin-top:6px"></div></div>`);
    let span = null;
    const ticker = (d, lit, m, hold) => {
      // running: the share of all views uploaded so far; at the hold it lands on the claim (the window's share)
      big.querySelector('[data-d]').textContent = hold ? '18 – 21 Jul' : new Date(d + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
      big.querySelector('[data-v]').textContent = Math.round((hold ? m.window.viewsShare : lit) * 100) + '%';
      big.querySelector('[data-l]').textContent = hold ? 'of all the views, from videos uploaded in those four days' : 'of all the views, from videos uploaded so far';
      const days = m.series.map(s => s.d), i = days.indexOf(d), tw = tick.offsetWidth, x = j => j / (days.length - 1) * tw;
      if (!span) {
        const wi = days.indexOf(m.window.from);
        const nodes = [['2026-06-06', 'Start'], ['2026-06-20', 'Sit-in'], ['2026-06-28', 'Fast'], ['2026-07-18', 'Wangchuk removed']];
        tick.innerHTML = `<svg width="${tw}" height="44" style="overflow:visible">
          <rect x="${x(wi)}" y="12" width="${tw - x(wi)}" height="10" fill="#E0201B"/>
          <line x1="0" x2="${tw}" y1="17" y2="17" stroke="#3A3A37" stroke-width="2"/>
          ${days.map((_, j) => `<line x1="${x(j)}" x2="${x(j)}" y1="13" y2="21" stroke="#3A3A37"/>`).join('')}
          ${nodes.map(([nd, l]) => { const j = days.indexOf(nd); return j < 0 ? '' : `<text x="${x(j)}" y="40" fill="#A3A29C" font-family="Public Sans" font-size="11" text-anchor="${nd === m.window.from ? 'end' : 'middle'}">${l}</text>`; }).join('')}
          <text x="0" y="6" fill="#A3A29C" font-family="Public Sans" font-size="11">23 May</text><text x="${tw}" y="6" fill="#A3A29C" font-family="Public Sans" font-size="11" text-anchor="end">21 Jul</text>
          <g data-m><line y1="4" y2="30" stroke="#FAFAF7" stroke-width="2"/></g></svg>`;
        span = tick.querySelector('[data-m]');
      }
      span.setAttribute('transform', `translate(${x(Math.max(0, i))},0)`);
    };
    const v = await createWatched({ host: R, w: W, h: H, box, ticker });
    R.lastElementChild.style.zIndex = -1;                      // the dot canvas sits under the chrome
    v.update(PQ);
    const pct = x => Math.round(x * 100) + '%';
    const vars = { beforePct: pct(v.m.window.before.views / v.m.total.views), winPct: pct(v.m.window.viewsShare) };
    const capEl = cap(R, 'watched', PQ < .42 ? 0 : 1, S, { style: `right:24px;top:${330 * k}px;`, vars });
    if (HOVER) {
      const d = v.hoverClip(v.biggest().id); await new Promise(r => setTimeout(r, 450));
      html(`<div class="hy-cap" style="left:${Math.min(d.x + 28, W - 420)}px;top:${d.y - 30}px;width:320px;border-color:var(--red)">${v.card(d)}</div>`);
    }
    console.log('[watched] pitch', v.P.toFixed(2), 'dots', v.dots.length, 'cells', v.cells.length, 'window share', v.m.window.viewsShare.toFixed(4));
  },

  // 09 · the cage (anime.js); ?p=, ?hover=<actor id>
  async apparatus() {
    back(); lock(R, 'apparatus', { boxed: false });
    html(`<p style="position:absolute;left:24px;top:${112}px;width:${420 * k}px;font:400 15px/1.5 var(--font-text);color:var(--muted);margin:0">${esc(CH.apparatus.dek)}</p>`);
    const card = html(`<div class="hy-cap" style="right:24px;top:${300 * k}px;width:380px;display:none"></div>`);
    const cg = await createCage({ host: R, w: W, h: H, c: { x: W * .45, y: H * .56 }, S, k: Math.min(1, H / 860), onCard: x => { card.style.display = x ? '' : 'none'; card.innerHTML = x || ''; } });
    cg.update(PQ);
    // roster: the thirteen bodies by group, a hover target each
    let last = '';
    html(`<div style="position:absolute;right:24px;top:${112}px;width:380px;font:400 13px/1.25 var(--font-ui)">${cg.actors.map(a => {
      const head = a.group !== last ? `<div class="hy-kick" style="margin:${last ? 10 : 0}px 0 4px">${esc(cg.groups[a.group])}</div>` : ''; last = a.group;
      return `${head}<span data-a="${a.id}" style="display:inline-block;margin:0 6px 5px 0;padding:4px 8px;border:1px solid var(--rule-c);cursor:pointer">${esc(a.label)} <b style="color:var(--muted)">${a.actions.length}</b></span>`; }).join('')}</div>`);
    if (HOVER) {
      cg.focus(HOVER); R.querySelector(`[data-a="${HOVER}"]`).style.borderColor = 'var(--fg)';
      card.style.display = ''; card.style.top = `${Math.min(H - 330, 420 * k)}px`; card.innerHTML = cg.cardActor(HOVER);
      await new Promise(r => setTimeout(r, 400));
    }
  },

  // the closing line, its own scene (Vali 2026-11-13: not inside the footer)
  closing() {
    back(); const g = layer(), r = rng(8);
    const c = CH.close, bw = Math.min(1040, W - 240), bx = (W - bw) / 2;
    html(`<div style="position:absolute;left:${bx}px;width:${bw}px;top:50%;transform:translateY(-50%)"><p class="hy-kick" style="margin:0 0 22px">${esc(c.kicker)}</p>
      <h2 style="font:400 ${Math.round(60 * k)}px/1.12 var(--font-display);margin:0;text-wrap:balance">${esc(c.headline)}${renderStar(c.starAfter)}</h2></div>`);
    const b = R.lastElementChild.getBoundingClientRect();
    g.fillStyle = g.strokeStyle = tok('--roach');
    for (let i = 0, n = 0; n < 60 && i < 3000; i++) { const x = r() * W, y = r() * H; if (x > b.left - 40 && x < b.right + 40 && y > b.top - 40 && y < b.bottom + 40) continue; roach(g, x, y, r() * TAU, 5 * (1 + (r() - .5) * .6), r() * TAU); n++; }
  },
};

await FR[F]();
stamp(R, `hybrid gate 0 · ${F}`);
await new Promise(r => setTimeout(r, 200));
document.body.dataset.ready = '1';

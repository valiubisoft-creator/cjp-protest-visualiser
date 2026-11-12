// F2 parts: static HTML builders shared by board and storyboard. Strings come from data only.
import { esc, missing, showable, dayN, fmtDate, roach, canvasIn } from './kit.js';

const TAU = Math.PI * 2;
export const fmtNum = v => v >= 1e6 ? (v / 1e6).toLocaleString('en-IN', { maximumFractionDigits: 1 }) + 'M' : v.toLocaleString('en-IN');

// ── fact block: large value, label, attribution, * marker → footer entry ──
export function factBlock(f, n) {
  if (!showable(f)) return '';
  let big = f.value_text ?? (f.value != null ? fmtNum(f.value) : null), extra = '';
  if (big && big.length > 9 && f.value != null) { extra = big; big = fmtNum(f.value) + (/\+/.test(big) ? '+' : ''); }
  return `<div class="fact">
    ${big ? `<div class="fact-v t-num">${esc(big)}<a class="star" href="#src-${n}" aria-label="Source ${n}: ${esc(f.claimant)}, ${esc(f.status)}">*</a></div>` : ''}
    ${f.unit && big ? `<div class="fact-u t-micro">${esc(f.unit)}${extra ? ' · ' + esc(extra) : ''}</div>` : ''}
    <p class="fact-t">${esc(f.text)}${big ? '' : `<a class="star" href="#src-${n}">*</a>`}</p>
    <p class="fact-a">${esc(f.attribution)} · <span class="st st-${f.status}">${esc(f.status)}</span></p>
  </div>`;
}

export function personChip(p) {
  const img = p.image ? `<img src="../${esc(p.image.src)}" alt="">` : `<span class="ini">${esc(p.name.split(' ').map(w => w[0]).join(''))}</span>`;
  return `<figure class="person">${img}<figcaption><b>${esc(p.name)}</b>${p.role ? `<span>${esc(p.role)}</span>` : ''}${p.image ? `<small>${esc(p.image.credit)}</small>` : ''}</figcaption></figure>`;
}

export function mediaBlock(m) {
  if (!m) return '';
  if (m.type === 'image') return `<figure class="media"><img src="../${esc(m.src)}" alt="${esc(m.caption)}"><figcaption>${esc(m.caption)}<small>${esc(m.credit)}</small></figcaption></figure>`;
  return `<figure class="media yt"><div class="poster"><span class="play" aria-hidden="true"></span><span class="yt-t">${esc(m.caption)}</span></div>
    <figcaption>${esc(m.credit)} · uploaded ${esc(fmtDate(m.upload_date))}<small>Click to load · video review ${esc(m.review)}</small></figcaption></figure>`;
}

// rail card for a node or sub-beat (spec S5 rail)
export function railCard(node, beat = null, { nStart = 1, maxFacts = 3, media = null } = {}) {
  const src = beat || node;
  const facts = [...(beat ? beat.facts : []), ...node.facts].filter(showable);
  const withValue = facts.filter(f => f.value != null || f.value_text);
  const pick = [...withValue, ...facts.filter(f => !withValue.includes(f))].slice(0, maxFacts);
  const m = media ?? (src.media?.[0] || node.media?.[0]);
  return `<article class="rail-card">
    <p class="kick t-micro t-num">${esc(fmtDate(src.date))} 2026 · Day ${dayN(src.date)}${node.hunger_strike_day || beat?.hunger_strike_day ? ` · Fast day ${beat?.hunger_strike_day ?? node.hunger_strike_day}` : ''}</p>
    <h3>${esc(beat ? beat.title : node.title)}</h3>
    ${mediaBlock(m)}
    <div class="facts">${pick.map((f, i) => factBlock(f, nStart + i)).join('')}</div>
    ${node.people?.length ? `<div class="people">${node.people.slice(0, 3).map(personChip).join('')}</div>` : ''}
  </article>`;
}

// ── scrubber: hatched strip, day ticks, node markers, handle with a roach ──
export function scrubber(nodes, { activeId, dateISO, width = 1440, height = 96 } = {}) {
  const t0 = Date.UTC(2026, 4, 16), t1 = Date.UTC(2026, 6, 25);
  const pad = 56, X = iso => pad + (Date.parse(iso + 'T00:00:00Z') - t0) / (t1 - t0) * (width - 2 * pad);
  let ticks = '';
  for (let t = t0, i = 0; t <= t1; t += 864e5, i++) {
    const x = pad + (t - t0) / (t1 - t0) * (width - 2 * pad), wk = new Date(t).getUTCDay() === 1;
    ticks += `<line x1="${x}" x2="${x}" y1="${height - 30}" y2="${height - (wk ? 14 : 22)}" stroke="var(--fg)" stroke-width="${wk ? 1.2 : .6}"/>`;
  }
  const rows = [[], [], []], ROWY = [16, height - 2, 33], est = s => s.length * 6.6;
  const place = nodes.map((n, i) => {
    const x = X(n.date), lab = `${fmtDate(n.date)} · ${n.label}`, wdt = est(lab);
    let anchor = 'middle', x0 = x - wdt / 2;
    if (x0 < 4) { anchor = 'start'; x0 = x; } if (x0 + wdt > width - 4) { anchor = 'end'; x0 = x - wdt; }
    const hit = r => rows[r].some(([a, b]) => x0 < b + 10 && x0 + wdt > a - 10);
    const row = [i % 2, 1 - i % 2, 2].find(r => !hit(r)) ?? 2;
    rows[row].push([x0, x0 + wdt]);
    return { y: ROWY[row], anchor, lab };
  });
  const marks = nodes.map((n, i) => {
    const x = X(n.date), on = n.id === activeId;
    return `<g class="node${on ? ' on' : ''}"><circle cx="${x}" cy="${height - 30}" r="${on ? 7 : 5}" fill="${on ? 'var(--accent)' : 'var(--bg)'}" stroke="${on ? 'var(--accent)' : 'var(--fg)'}" stroke-width="2"/>
      <text x="${x}" y="${place[i].y}" text-anchor="${place[i].anchor}" font-size="12" font-weight="${on ? 800 : 600}" fill="${on ? 'var(--accent-text)' : 'var(--fg)'}" class="t-num">${esc(place[i].lab)}</text></g>`;
  }).join('');
  const hx = X(dateISO);
  return `<svg class="scrubber" viewBox="0 0 ${width} ${height}" width="100%" style="max-width:${width}px;display:block" role="slider" aria-label="Timeline" aria-valuetext="Day ${dayN(dateISO)}">
    <defs><pattern id="hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><line x1="0" y1="0" x2="0" y2="7" stroke="var(--fg)" stroke-width="1.1" opacity=".55"/></pattern></defs>
    <rect x="0" y="0" width="${width}" height="${height}" fill="var(--bg)"/>
    <rect x="${pad}" y="${height - 42}" width="${width - 2 * pad}" height="24" fill="url(#hatch)"/>
    <rect x="${hx}" y="${height - 42}" width="${width - pad - hx}" height="24" fill="var(--bg)" opacity=".72"/>
    <rect x="${pad}" y="${height - 42}" width="${width - 2 * pad}" height="24" fill="none" stroke="var(--fg)" stroke-width="1"/>
    ${ticks}${marks}
    <line x1="${hx}" x2="${hx}" y1="${height - 52}" y2="${height - 10}" stroke="var(--accent)" stroke-width="3"/>
    <image href="${handleRoachURL()}" x="${hx - 20}" y="${height - 66}" width="40" height="24"/>
  </svg>`;
}
// the riding roach, rendered by roach() into a bitmap so it scales with the SVG
let _hr;
function handleRoachURL() {
  if (_hr) return _hr;
  const c = document.createElement('canvas'); c.width = 80; c.height = 48;
  const ctx = c.getContext('2d'); ctx.scale(2, 2);
  ctx.fillStyle = ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#E0201B';
  roach(ctx, 16, 12, 0, 8, 1.2);
  return (_hr = c.toDataURL());
}
export function handleRoach() {}

// ── quote card ──
export function quoteCard(q, { specimen = false } = {}) {
  const lang = (q.language || '').toLowerCase();
  const scriptCls = lang.startsWith('urdu') ? 'q-urdu' : lang.startsWith('hindi') ? 'q-deva' : '';
  const orig = q.original_text && scriptCls ? `<blockquote class="q-orig ${scriptCls}" lang="${scriptCls === 'q-urdu' ? 'ur' : 'hi'}" dir="${scriptCls === 'q-urdu' ? 'rtl' : 'ltr'}">${esc(q.original_text).replace(/\n/g, '<br>')}</blockquote>` : '';
  const en = q.text && !q.text.startsWith('(same') ? q.text : q.original_text;
  return `<figure class="quote-card${specimen ? ' specimen' : ''}">
    ${specimen ? '<p class="t-micro spec-flag">Specimen only · not selected</p>' : ''}
    ${orig}
    <blockquote class="q-en">“${esc(en)}”</blockquote>
    <figcaption><b>${esc(q.author.split(' (')[0])}</b><span>${esc((q.work || '').split(' (')[0].split(', section')[0])}${/^\d{4}/.test(String(q.year)) ? ', ' + esc(String(q.year).slice(0, 4)) : ''}</span>
      ${scriptCls ? `<small>Translation: ${q.translation_is_ours ? 'CJP Visualiser' : /^(not named|none)/i.test(q.translator || '') || !q.translator ? 'unattributed, ' + esc(new URL(q.source_url).hostname.replace('www.', '')) : esc(q.translator.split('.')[0].split('(')[0])}</small>` : ''}
      <small class="src">Source: <a href="${esc(q.source_url)}">${esc(new URL(q.source_url).hostname.replace('www.', ''))}</a></small></figcaption>
  </figure>`;
}

// parts CSS (inject once)
export const PARTS_CSS = `
.fact { border-top: var(--rule-heavy) solid var(--fg); padding: var(--s-3) 0 var(--s-4); }
.fact-v { font: var(--w-black) var(--fs-stat)/1 var(--font-text); letter-spacing: -.02em; }
.fact-u { color: var(--muted); margin-top: var(--s-1); }
.fact-t { margin: var(--s-2) 0 var(--s-1); font-size: var(--fs-small); line-height: 1.45; }
.fact-a { margin: 0; color: var(--muted); font-size: var(--fs-micro); }
.st { text-transform: uppercase; letter-spacing: .08em; font-weight: var(--w-bold); }
.st-disputed, .st-alleged { color: var(--accent-text); }
.person { display: flex; gap: var(--s-3); align-items: center; margin: 0; }
.person img, .person .ini { width: 48px; height: 48px; border-radius: 50%; object-fit: cover; filter: grayscale(1) contrast(1.05); flex: none; }
.person .ini { display: grid; place-items: center; background: var(--surface); font: var(--w-black) var(--fs-small)/1 var(--font-text); }
.person figcaption { min-width: 0; display: flex; flex-direction: column; font-size: var(--fs-micro); line-height: 1.35; }
.person b { font-size: var(--fs-small); }
.person small { color: var(--muted); font-size: 10px; }
.media { margin: 0; }
.media img { width: 100%; height: 190px; object-fit: cover; display: block; filter: grayscale(1) contrast(1.08); }
.media figcaption { font-size: var(--fs-micro); line-height: 1.4; margin-top: var(--s-2); color: var(--fg); display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.media small { display: block; color: var(--muted); }
.media.yt .poster { position: relative; height: 190px; background: var(--fg); color: var(--bg); display: flex; align-items: flex-end; padding: var(--s-4); }
.media.yt .play { position: absolute; left: 50%; top: 42%; width: 64px; height: 64px; margin: -32px; border: 2px solid var(--bg); border-radius: 50%; }
.media.yt .play::after { content: ''; position: absolute; left: 25px; top: 19px; border: 13px solid transparent; border-left: 20px solid var(--accent); border-right: 0; }
.media.yt .yt-t { font: var(--w-bold) var(--fs-small)/1.3 var(--font-text); max-width: 90%; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.rail-card { display: flex; flex-direction: column; gap: var(--s-4); }
.rail-card h3 { margin: 0; font: var(--w-black) var(--fs-h1)/1.05 var(--font-text); letter-spacing: -.01em; }
.rail-card .kick { color: var(--accent-text); margin: 0; }
.rail-card .facts { display: grid; gap: 0; }
.rail-card .people { display: grid; gap: var(--s-3); border-top: var(--rule) solid var(--rule-c); padding-top: var(--s-4); }
.quote-card { margin: 0; border-left: var(--rule-heavy) solid var(--accent); padding: var(--s-2) 0 var(--s-2) var(--s-6); }
.quote-card blockquote { margin: 0; }
.q-en { font: var(--w-medium) var(--fs-quote)/1.3 var(--font-text); letter-spacing: -.01em; }
.q-orig + .q-en { font-size: var(--fs-lead); color: var(--muted); margin-top: var(--s-4); }
.q-urdu { font: 400 40px/2.1 var(--font-urdu); text-align: right; }
.q-deva { font: 600 36px/1.6 var(--font-deva); }
.quote-card figcaption { margin-top: var(--s-5); display: flex; flex-direction: column; gap: 2px; font-size: var(--fs-small); }
.quote-card figcaption span, .quote-card small { color: var(--muted); font-size: var(--fs-micro); }
.quote-card.specimen { opacity: .75; border-left-style: dashed; }
.spec-flag { color: var(--accent-text); margin: 0 0 var(--s-3); }
.handle-roach-c { color: var(--accent); }
`;

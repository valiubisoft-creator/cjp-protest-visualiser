// Date helpers. DAY0/dayN/fmtDate promoted from design/lib/kit.js, ddmmyyyy from design/storyboard.js (F3, no behaviour change).
export const DAY0 = Date.UTC(2026, 5, 6); // 6 Jun 2026 = day 0 of the street protest (D4)
export const dayN = iso => Math.round((Date.parse(iso + 'T00:00:00Z') - DAY0) / 864e5);
export const fmtDate = iso => new Date(iso + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
export const ddmmyyyy = iso => iso.split('-').reverse().join('/');

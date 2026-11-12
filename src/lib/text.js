// Text helpers. Promoted from design/lib/kit.js in F3, no behaviour change.
// missing(): the visible [MISSING: key] box (CLAUDE.md). Exception (Vali, 2026-11-12): the S4 caption,
// the S6.5 heading and the S9 headline are left EMPTY, not [MISSING].
export const missing = key => `<span class="missing">[MISSING: ${key}]</span>`;
export const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// facts usable on screen: not held, not unverified
export const showable = f => f && !f.hold && f.status !== 'unverified';

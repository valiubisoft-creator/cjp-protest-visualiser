// The * convention (methodology.asterisk, D6), F3: every stat on screen carries a * that links to its footer entry.
// Footer entries are numbered in sources.json order (loadStory() → byId.source[id].n); S10 renders each entry
// with id="src-N" and a link back. Until S10 exists the links point at anchors that aren't there yet.
//
// star(sourceIds, sources, label?) → '<a class="star" href="#src-N" …>*</a>'
//   sourceIds  a fact's source_ids (array or single id); the first resolvable one is the link target
//   sources    data.byId.source
//   label      optional claimant/attribution for the aria-label (keep the data's wording)
import { esc } from './text.js';

export function star(sourceIds, sources, label = '') {
  const ns = [].concat(sourceIds ?? []).map(id => sources[id]?.n).filter(Boolean);
  const href = ns.length ? `#src-${ns[0]}` : '#sources';
  const aria = `Source${ns.length > 1 ? 's' : ''} ${ns.join(', ') || 'not found'}${label ? ': ' + label : ''}`;
  return `<a class="star" href="${href}" data-src="${ns.join(' ')}" aria-label="${esc(aria)}">*</a>`;
}

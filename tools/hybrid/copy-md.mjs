// Writes docs/build/hybrid/COPY.md from design/hybrid/copy.js (the one copy source the storyboard renders).
// usage: node tools/hybrid/copy-md.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import { CHAPTERS, plain, words } from '../../src/data/copy.js';

const ORIGIN = { v2: 'v2 verbatim', 'v2*': 'v2, edited to the sources', new: 'new', v3: 'v3 (on screen today)' };
const star = s => s.replace(/\{\*([^|}]+)\|?([^}]*)\}/g, (_, ids, who) => `\\* <sub>[${ids.replace(/,/g, ', ')}${who ? ' · ' + who : ''}]</sub>`).replace(/<(?!\/?sub)[^>]+>/g, '');
let md = `# Hybrid copy list (Gate 0, for Vali's sign-off)

Generated from \`design/hybrid/copy.js\` by \`tools/hybrid/copy-md.mjs\`. The storyboard renders from the same file, so this list is exactly what the frames show.
\`*\` = the footer star; the bracket gives the source ids and the on-screen claimant. **Origin:** ${Object.values(ORIGIN).join(' · ')}.
Rule: one claim headline, one visual, caption ≤ 40 words, ≤ 1 starred figure per sentence. Word counts exclude stars.

`;
for (const c of CHAPTERS) {
  md += `## ${c.n !== '—' ? c.n + ' · ' : ''}${c.label}\n_${c.scenes}_\n\n`;
  if (c.kicker) md += `- **Kicker:** ${c.kicker}\n`;
  if (c.headline) md += `- **Headline** (${ORIGIN[c.origin] || c.origin}): **${c.headline}**${c.starAfter ? ' \\*' : ''}\n`;
  if (c.alts) md += `- Alternatives: ${c.alts.map(a => `“${a}”`).join(' · ')}\n`;
  if (c.rejected) md += `- **Not used:** “${c.rejected.text}” ${c.rejected.why}\n`;
  if (c.dek) md += `- **Dek** (${ORIGIN[c.dekOrigin] || c.dekOrigin}): ${star(c.dek)}\n`;
  if (c.legend) md += `- **Legend:** ${c.legend}\n`;
  if (Array.isArray(c.captions)) {
    md += `\n| # | When | Caption | Words | Origin | Ledger |\n|---|---|---|---|---|---|\n`;
    c.captions.forEach((x, i) => { md += `| ${i + 1} | ${x.when} | ${star(x.html).replace(/\|/g, '/')} | ${words(x.html)} | ${ORIGIN[x.origin] || x.origin} | ${x.facts} |\n`; });
  }
  if (c.note) md += `\n${c.note}\n`;
  md += '\n';
}
mkdirSync('docs/build/hybrid', { recursive: true });
writeFileSync('docs/build/hybrid/COPY.md', md);
console.log('docs/build/hybrid/COPY.md', md.length, 'chars');

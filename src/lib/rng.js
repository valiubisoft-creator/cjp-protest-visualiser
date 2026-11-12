// Deterministic RNG (mulberry32). Promoted from design/lib/kit.js in F3, no behaviour change.
// Same seed → same sequence, so every scene can be pure in p (determinism rule, spec §3).
export function rng(seed) {
  let a = seed >>> 0;
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

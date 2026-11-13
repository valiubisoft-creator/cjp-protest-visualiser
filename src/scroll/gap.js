// Title gaps (review 3, Vali 2026-11-13). A scene with def.gap = [t, vh] holds its own p = t for vh of extra scroll right
// after its chapter's opening card, so the card and the scene's first beat don't run into each other. def.len already
// includes the gap; this maps the controller's p (over def.len) to the scene's p (over def.len − vh). Ends are fixed
// (0 → 0, 1 → 1), so in-block handovers are untouched. Pure.
export function gapMap(def) {
  const [t, g] = def.gap, L = def.len, L0 = L - g, a = t * L0 / L, w = g / L;
  return {
    inner: p => (p <= a ? p * L / L0 : p < a + w ? t : t + (p - a - w) * L / L0),
    outer: q => (q <= t ? q * L0 / L : (q * L0 + g) / L),
  };
}

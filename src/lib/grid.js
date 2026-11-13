// The layout grid in px (hybrid, Vali 2026-11-13: "a proper column based layout"). Mirrors src/shell.css :root
// (--g-m, --g-gut, --g-col): 12 columns inside an outer margin of 8.333% of the width, clamped to 96–160 px.
//   x(i)     left edge of column i (0-based)       span(n)  width of n columns with their gutters
//   end(i)   right edge of column i
export function grid(W) {
  const m = Math.min(160, Math.max(96, W / 12)), gut = 24, col = (W - 2 * m - 11 * gut) / 12;
  return { m, gut, col, x: i => m + i * (col + gut), end: i => m + i * (col + gut) + col, span: n => n * col + (n - 1) * gut };
}

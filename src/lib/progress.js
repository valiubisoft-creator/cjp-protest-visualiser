// Reading progress (hybrid, Vali 2026-11-13: "a visual marker to show how much of the visualisation they are scrolling
// through"). A 3 px bar on the top edge of the window: the red fill is how far through the piece the reader is, and a
// small notch marks where each chapter starts. Shell UI, not a scene: it reads scroll position only to draw itself.
// It sits on the very top edge (above every inset), so it never covers content.
const CHAPTERS = ['NEET', 'HELD', 'S5', 'S6', 'WATCH', 'OCT', 'ROLL', 'CAGE', 'S8a', 'S9'];

export function mountProgress(controller) {
  const bar = document.createElement('div');
  bar.className = 'progress';
  bar.setAttribute('role', 'progressbar'); bar.setAttribute('aria-label', 'Reading progress');
  bar.setAttribute('aria-valuemin', '0'); bar.setAttribute('aria-valuemax', '100');
  bar.innerHTML = '<i class="fill"></i>';
  document.body.append(bar);
  const fill = bar.firstElementChild;
  let max = 1, queued = false;
  const layout = () => {
    max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    bar.querySelectorAll('.notch').forEach(n => n.remove());
    for (const id of CHAPTERS) {
      let y; try { y = controller.yFor(id, 0); } catch { continue; }
      const n = document.createElement('b'); n.className = 'notch'; n.style.left = (100 * y / max).toFixed(3) + '%';
      bar.append(n);
    }
    draw();
  };
  const draw = () => {
    queued = false;
    const f = Math.min(1, Math.max(0, scrollY / max));
    fill.style.transform = `scaleX(${f.toFixed(4)})`;
    bar.setAttribute('aria-valuenow', String(Math.round(f * 100)));
  };
  addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(draw); } }, { passive: true });
  addEventListener('resize', () => requestAnimationFrame(layout));
  new ResizeObserver(() => requestAnimationFrame(layout)).observe(document.getElementById('piece') || document.body);   // late-loading flow sections
  layout();
  return { layout };
}

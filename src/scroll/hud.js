// ?debug HUD (F3): scene id, p to 3 decimals, scrollY, direction, FPS. Small, in one corner, never interactive.
// Corner: ?debug=tr (default) | tl | br | bl. Press "`" (backtick) to move it to the next corner if it sits on content.
const CORNERS = ['tr', 'br', 'bl', 'tl'];

export function createHud(corner) {
  let c = CORNERS.includes(corner) ? corner : 'tr';
  const box = document.createElement('div');
  box.className = 'hud-debug'; box.dataset.corner = c; box.setAttribute('aria-hidden', 'true');
  box.innerHTML = '<b class="id">–</b> <span class="p">p –</span><br><span class="y">y –</span> <span class="d"></span> · <span class="f">– fps</span><span class="l"></span>';
  document.body.append(box);
  const $ = s => box.querySelector(s);
  addEventListener('keydown', e => { if (e.key === '`') { c = CORNERS[(CORNERS.indexOf(c) + 1) % 4]; box.dataset.corner = c; } });
  return {
    update(st) {
      $('.id').textContent = st.scene ?? '–';
      $('.p').textContent = 'p ' + st.p.toFixed(3);
      $('.y').textContent = 'y ' + Math.round(st.y);
      $('.d').textContent = st.dir === 'down' ? '↓' : '↑';
      $('.l').textContent = (st.locked ? ' · LOCK' : '') + (st.live.length > 1 ? ' · ' + st.live.map(l => l.id).join('+') : '');
    },
    fps(n) { $('.f').textContent = typeof n === 'number' ? n + ' fps' : n; },
  };
}

// S7a, S7b, S7c (one factory, def.sub = 0, 1, 2): F3 placeholder. Owned by the S7 chat, which replaces this file (brief: docs/build/scenes/S7.md).
// Contract (docs/build/STATUS.md "Scene contract"): default export (def) => { id, init(ctx), enter(dir), update(p), exit(dir), resize(w, h), tick?(t, dt) }.
import { placeholder } from './placeholder.js';

export default def => placeholder(def);

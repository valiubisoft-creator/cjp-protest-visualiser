// S5: F3 placeholder. Built in three chats, in order: S5a (map, camera), S5b (scrubber, rail), S5c (roach encodings). Briefs: docs/build/scenes/S5a.md, S5b.md, S5c.md.
// Contract (docs/build/STATUS.md "Scene contract"): default export (def) => { id, init(ctx), enter(dir), update(p), exit(dir), resize(w, h), tick?(t, dt) }.
import { placeholder } from './placeholder.js';

export default def => placeholder(def);

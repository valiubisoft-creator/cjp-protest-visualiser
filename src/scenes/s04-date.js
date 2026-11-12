// S4: F3 placeholder. The S4a spike proves the skeleton (it may prototype here); the S4b chat builds the scene. Briefs: docs/build/scenes/S4a.md, S4b.md.
// Contract (docs/build/STATUS.md "Scene contract"): default export (def) => { id, init(ctx), enter(dir), update(p), exit(dir), resize(w, h), tick?(t, dt) }.
import { placeholder } from './placeholder.js';

export default def => placeholder(def);

# Multi-Shot Interactivity Quiz — Conversation Log

**Date:** 2026-10-02 to 2026-10-03
**Topic:** Building an interactive quiz plugin using a WordPress Block and the WordPress Interactivity API
**Phases:** Three-phase build (Phase 1: Architecture & Boilerplate, Phase 2: Coding Core Component, Phase 3: Improving core logic and UI + optimization)

---

## Phase 1: Architecture & Boilerplate

### Brainstorming Session

Acted as senior WordPress developer. Used brainstorming skill to explore design before implementation.

#### Q1: Authoring Model

**Question:** How should the quiz be authored in the block editor?

**Answer:** One block contains one question and unlimited number of answers. For each question, there should only be one correct answer. For question and answer, use WP Component TextControl component. Each answer should have a star icon beside it and when clicked, it should be saved as the answer to that question. Show a Button component that allows the user to add options for answer. Hold the answers in an array. Initially, show a TextControl component for both the question and answer inside an innerblock.

#### Q2: Quiz Container

**Question:** How do multiple Question blocks combine into one quiz with shared progress/scoring?

**Answer:** Standalone Question blocks, shared store.

#### Q3: Quiz Flow

**Question:** How should the user move through the quiz questions on the front end?

**Answer:** All visible, sticky submit bar.

#### Q4: Feedback Timing

**Question:** When should the user learn whether each answer is correct?

**Answer:** Immediate per-question feedback.

#### Q5: End State & Restart

**Question:** After answering (immediate feedback), can the user change their answer, and what's the end-of-quiz experience?

**Answer:** Lock on answer, final panel + Retry.

#### Q6: Architecture Choice

**Question:** Which architecture for the shared store + sticky bar?

**Answer:** A — Single block, injected bar (recommended).

### Design Summary

- **One block type:** `multi-shot-interactivity-quiz/question` — renders a single question with answers
- **Standalone blocks** placed freely on a page, grouped by shared `quizId` attribute
- **All questions visible** on the front end; a runtime-injected sticky bar shows live progress and score
- **Immediate feedback:** clicking an answer locks the question and reveals correct/incorrect
- **End state:** results panel with final score + Retry button
- **Architecture:** `render.php` seeds per-block data via `data-wp-context`; `view.js` merges same-`quizId` blocks into one store and injects one sticky bar per quiz at runtime

### Design Sections Approved

1. **Architecture Overview** — Single Question block, store namespace `multi-shot-interactivity-quiz`, `quizId` partitions state
2. **Data Model & Attributes** — `quizId` (string, default "default"), `question` (string, default ""), `answers` (array of {text, isCorrect}, default two empty). Per-block context: `selectedId`, `locked`. Store: per-quiz aggregate map.
3. **Editor UX** — TextControl for question, answer rows with TextControl + star toggle + remove Button, Add answer Button (max 6, min 2), InspectorControls with quizId, warning when no correct answer
4. **Front End** — `render.php` emits `data-wp-interactive` + `data-wp-context` with directives (`data-wp-text`, `data-wp-on--click`, `data-wp-bind--disabled`, `data-wp-class--is-selected/is-correct/is-wrong`). `view.js` store with `selectAnswer`, `retry`, sticky bar injection, results panel.
5. **Phases & Scope** — Phase 1 (boilerplate), Phase 2 (core behavior), Phase 3 (polish/optimization). Out of scope: persistence, accounts, analytics, multiple-correct, timed, shuffling, media, CPT, REST API.

### Design Spec

Written to: `docs/superpowers/specs/2026-10-02-multi-shot-interactivity-quiz-design.md`
Committed: `9c1b8fe`
Spec self-review fix: `state.locked` → `context.locked` in render.php directive (`c569171`)

### Implementation Plan

Written to: `docs/superpowers/plans/2026-10-02-phase-1-architecture-boilerplate.md`
Committed: `af154bf`

### Execution: Subagent-Driven Development

Executed the 6-task plan using fresh subagents per task with two-stage review (spec compliance + code quality).

---

### Task 1: Add Dependencies and Test Setup

**Commit:** `8e34840`

- Updated `package.json`: added `@wordpress/interactivity`, `@wordpress/components`, `@wordpress/element` to dependencies; `vitest ^5.0.0` to devDependencies; `test` and `test:watch` scripts
- `npm install` — 26 packages added
- `npx vitest --version` → `vitest/5.0.3`
- Spec review: ✅ compliant
- Code quality: ✅ approved (reviewer incorrectly flagged `wp-scripts test-unit-js` as Jest — it actually resolves to Vitest in wp-scripts ^36)

### Task 2: Rename Block and Update Metadata

**Commit:** `ea1b345`

- Created `tests/block-json.test.js` (7 assertions, TDD: verified fail → pass)
- Updated `block.json`: name → `multi-shot-interactivity-quiz/question`, title "Quiz Question", icon "forms", added `quizId`/`question`/`answers` attributes with defaults
- Updated `index.js`: spread `...metadata` on `registerBlockType`
- Updated `multi-shot-interactivity-quiz.php`: Description + `@package MultiShotInteractivityQuiz`
- Tests: 7/7 pass. Build: success. Manifest confirms new block name.
- Spec review: ✅ compliant
- Code quality: ✅ approved (minor: build artifacts in commit, commit type could be `feat:`)

### Task 3: Build Editor UI (edit.js + editor.scss)

**Commit:** `b6e1f71`

- Full editor UI: TextControl for question, answer rows with TextControl + star toggle (mark correct) + remove Button, Add answer Button (max 6, min 2), InspectorControls with quizId, warning when no correct answer
- Editor SCSS: flex layout, `msiq-` prefix classes, star toggle, warning styling
- Lint-driven deviations: `sprintf( __( 'Answer %d' ), index + 1 )` for i18n compliance, curly braces on if-returns
- Build ✓, lint:js ✓, lint:css ✓
- Spec review: ✅ compliant
- Code quality: ✅ approved with minor follow-ups:
  - `key={ index }` on answer rows (Phase 3: add stable answer IDs)
  - Star toggle `&.is-primary` CSS rule is dead (no `variant="primary"` set)
  - Emoji `⚠` inside `__()` (move outside in Phase 3)

### Task 4: Server-Render with Directives (render.php + style.scss)

**Commits:** `095ff13` (implementation), `7b1eb0f` (security fix)

- `render.php`: emits `data-wp-interactive` + `data-wp-context`, directives for text/click/disabled/class toggles, filters empty answers, shows not-ready notice for incomplete questions
- `style.scss`: front-end layout with hover/selected/correct/wrong/not-ready states
- Build ✓, lint:css ✓
- Spec review: ✅ compliant
- Code quality: Found important security issue — `wp_json_encode()` without HTML-safe flags allows single-quote breakout in `data-wp-context` attribute
- **Security fix** (`7b1eb0f`): Added `JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT` flags
- Known issue deferred: `data-wp-bind--disabled` on `<li>` is non-functional (Phase 2 fix)

### Task 5: Store Skeleton (view.js)

**Commit:** `4a26612`

- `store()` with namespace `multi-shot-interactivity-quiz`
- `state.quizzes: {}` (per-quiz aggregate map, keyed by quizId)
- Empty `selectAnswer` and `retry` action stubs with `// Implemented in Phase 2.` comments
- Empty `callbacks: {}`
- Added `// eslint-disable-next-line no-unused-vars` on `const { state }` (Phase 2 will use it)
- Build ✓, lint:js ✓
- Spec review: ✅ compliant
- Code quality: ✅ approved (minor: eslint-disable is pragmatic, remove when state is used in Phase 2)

### Task 6: Final Build and Lint Verification

No new commit (working tree clean).

- Tests: 7/7 pass
- Build: success, no warnings
- lint:js: clean
- lint:css: clean
- Build artifacts: all present (block.json, index.js, index.css, render.php, view.js, style-index.css, .asset.php files)
- Manifest: correct (attributes quizId, question, answers present)

### Final Code Review

Reviewed entire Phase 1 diff (`af154bf..4a26612`).

**Strengths:**
- Security solid (HTML-safe JSON encoding, proper escaping throughout)
- Architecture matches spec exactly
- Not-ready guard prevents broken quizzes
- Editor logic clean (exactly-one-correct invariant, clear-on-remove)
- Scope discipline (no Phase 2/3 creep)

**Issues found and fixed:**
- Star toggle label said "click to unmark" but `markCorrect` only marked (never unmarked) — fixed in `ecfa76c`

**Issues deferred:**
- `data-wp-bind--disabled` on `<li>` non-functional → Phase 2
- `key={ index }` on answer rows → Phase 3
- Star toggle visual affordance weak → Phase 3
- `eslint-disable no-unused-vars` → removed when Phase 2 uses `state`

### Star Toggle Fix

**Commit:** `ecfa76c`

Changed `markCorrect` from always-set-true to true toggle:
```js
isCorrect: i === index ? ! a.isCorrect : false
```
Now clicking an already-correct star unmarks it; clicking a non-correct star marks it as sole correct.

---

## Phase 1 Commits Summary

```
ecfa76c fix: make star toggle actually toggle (unmark when already correct)
4a26612 feat: register Interactivity store skeleton
7b1eb0f security: use HTML-safe JSON encoding for data-wp-context attribute
095ff13 feat: server-render question with Interactivity API directives
b6e1f71 feat: build editor UI with TextControl question, answer rows, star toggle
ea1b345 refactor: rename block to multi-shot-interactivity-quiz/question
8e34840 chore: add interactivity, components, element deps and vitest
af154bf docs: add Phase 1 implementation plan  (plan, pre-implementation)
c569171 docs: fix directive to read context.locked, not state.locked  (spec fix)
9c1b8fe docs: add design spec for multi-shot interactivity quiz  (spec)
```

## Phase 1 Exit Criteria

- [x] `npm run build` passes
- [x] `npm test` passes (7 block.json structure tests)
- [x] `npm run lint:js` passes
- [x] `npm run lint:css` passes
- [x] Block name is `multi-shot-interactivity-quiz/question`
- [x] Attributes `quizId`, `question`, `answers` are defined
- [x] `edit.js` has TextControl question, answer rows with star/remove, Add answer button, Inspector quizId
- [x] `render.php` emits `data-wp-interactive` + `data-wp-context` with directives
- [x] `view.js` registers store with namespace `multi-shot-interactivity-quiz`
- [x] Store has empty `selectAnswer` and `retry` stubs

---

## Next: Phase 2 — Core Quiz Behavior

**Goal:** Playable quiz.

- Implement `selectAnswer` in `view.js` — set `selectedId`, `locked`, update `state.quizzes[quizId]` aggregate
- Immediate feedback via `data-wp-class--is-correct`/`is-wrong`/`is-selected` toggles
- Sticky bar: inject once per `quizId`, show live "answered / total — correct"
- Results panel: when all answered, show final score
- `retry()`: reset all blocks + aggregate + panel
- Fix `data-wp-bind--disabled` on `<li>` (use action guard or switch to `<button>`)
- Remove `eslint-disable no-unused-vars` when `state` is used

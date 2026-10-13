# Phase 2 Handoff — Instructions for AI Continuation

**Project:** Multi-Shot Interactivity Quiz — WordPress block plugin using the Interactivity API
**Current state:** Phase 1 complete (HEAD commit `ecfa76c`). Phase 2 not started.
**Purpose:** This file gives a fresh AI session everything needed to pick up and implement Phase 2 without re-discovering context.

---

## How to Use This File

1. Read this file in full — it contains the project history, architecture, current code state, known issues, and Phase 2 requirements.
2. Read the design spec: `docs/superpowers/specs/2026-10-02-multi-shot-interactivity-quiz-design.md`
3. Write a Phase 2 implementation plan (use the `writing-plans` skill if available).
4. Execute the plan (use `subagent-driven-development` skill if available, or implement inline).
5. Do NOT skip the brainstorming/design phase — Phase 2 has open questions (see below) that need decisions before coding.

---

## Quick Reference

| What | Where |
|------|-------|
| Design spec (full) | `docs/superpowers/specs/2026-10-02-multi-shot-interactivity-quiz-design.md` |
| Phase 1 plan | `docs/superpowers/plans/2026-10-02-phase-1-architecture-boilerplate.md` |
| Conversation log | `CONVERSATION.md` |
| Plugin entry | `multi-shot-interactivity-quiz.php` |
| Block source | `src/multi-shot-interactivity-quiz/` |
| Build output | `build/multi-shot-interactivity-quiz/` |
| Tests | `tests/block-json.test.js` |
| Git HEAD | `ecfa76c` |

---

## Project Architecture

### What we're building

An interactive multiple-choice quiz plugin for WordPress using the Block Editor and the WordPress Interactivity API. Authors place Question blocks on a page, group them by a shared `quizId` attribute, and visitors answer questions with immediate feedback (correct/incorrect reveal on click). A sticky bar shows live progress and score; a results panel appears when all questions are answered; a Retry button resets the quiz.

### Key design decisions (locked, do not change)

1. **One block type only:** `multi-shot-interactivity-quiz/question`. No parent block, no InnerBlocks. Each block = one question.
2. **Standalone blocks grouped by `quizId`:** Blocks sharing the same `quizId` attribute form one quiz. Default `quizId` is `"default"`.
3. **All questions visible** on the front end (not one-at-a-time). A sticky bar is injected at runtime per quiz.
4. **Immediate feedback:** Clicking an answer locks the question and reveals correct/incorrect instantly.
5. **Lock on answer:** Once answered, a question cannot be changed.
6. **Results panel + Retry:** When all questions are answered, a results panel shows the final score. A Retry button resets everything.
7. **Architecture (Approach A):** `render.php` is the single source of truth for front-end data. It emits `data-wp-interactive` + `data-wp-context` with per-block data. `view.js` merges same-`quizId` blocks into one store and injects one sticky bar per quiz at runtime.
8. **Store namespace:** `multi-shot-interactivity-quiz` (one store serves all quizzes; `quizId` partitions state inside it).

### Data flow

```
Editor (edit.js)                 Front end (render.php + view.js)
+---------------------+          +----------------------------------+
| TextControl: Q text |  attrs   | render.php emits:                |
| Answer rows:        | ------>  |  <div data-wp-interactive=...    |
|  [TextControl][*]   |          |       data-wp-context='{...}'>    |
|  [TextControl][*]   |          |    question + answers markup     |
|  [+ Add answer]     |          |  </div>                           |
| quizId in Inspector |          +----------------------------------+
+---------------------+                        |
                          view.js store scans all [data-wp-interactive]
                          blocks grouped by quizId -> one store per quiz
                                               |
                          Injects ONE sticky bar per quiz + results panel
```

### Per-block context (emitted by render.php via `data-wp-context`)

```json
{
  "quizId":     "default",
  "question":   "Capital of France?",
  "answers": [
    { "text": "Paris",  "isCorrect": true,  "id": "a0" },
    { "text": "London", "isCorrect": false, "id": "a1" }
  ],
  "selectedId": null,
  "locked":     false
}
```

- `selectedId` and `locked` are per-block runtime state (start `null`/`false`), mutated by the store on answer click.
- The store keeps a parallel per-quiz aggregate: `{ [quizId]: { answered, correct, total, finished } }` for the sticky bar and results panel.

### Why split per-block context + store map

`data-wp-context` is the Interactivity API's reactive scope — perfect for per-question state (selected answer, locked). The aggregate (score, progress) is cross-block, so it lives in the store's top-level `state.quizzes` object keyed by `quizId`. The sticky bar reads `state.quizzes`; each Question block reads its own `context`.

---

## Tech Stack

- WordPress Block API (apiVersion 3)
- WordPress Interactivity API (`@wordpress/interactivity` — ESM, exports `store`)
- `@wordpress/components` (TextControl, Button)
- `@wordpress/block-editor` (useBlockProps, InspectorControls)
- `@wordpress/scripts` ^36.0.0 (webpack build, ESLint, Stylelint)
- `@wordpress/i18n` (`__`, `sprintf`)
- `@wordpress/element` (React for editor)
- Vitest 5 (unit tests, via `wp-scripts test-unit-js` which resolves to Vitest in wp-scripts ^36)
- Build: `npm run build` → `wp-scripts build --webpack-copy-php --blocks-manifest`
- Lint: `npm run lint:js` (ESLint), `npm run lint:css` (Stylelint)
- Test: `npm test` (Vitest via wp-scripts)

### Important wp-scripts notes

- `@wordpress/*` packages are webpack externals — `import { store } from '@wordpress/interactivity'` compiles to `window.wp.interactivity` at runtime. The Dependency Extraction Webpack Plugin handles this.
- `wp-scripts test-unit-js` in wp-scripts ^36 resolves to **Vitest 5**, not Jest. The script at `node_modules/@wordpress/scripts/scripts/test-unit-js.js` explicitly requires `vitest/package.json`.
- `@wordpress/interactivity` is ESM-only (`"exports": { ".": { "import": "./build-module/index.mjs" } }`). No CommonJS entry.

---

## Current Code State (at HEAD `ecfa76c`)

### block.json (`src/multi-shot-interactivity-quiz/block.json`)

```json
{
	"$schema": "https://schemas.wp.org/trunk/block.json",
	"apiVersion": 3,
	"name": "multi-shot-interactivity-quiz/question",
	"version": "0.1.0",
	"title": "Quiz Question",
	"category": "widgets",
	"icon": "forms",
	"description": "A multiple-choice question block for interactive quizzes using the WordPress Interactivity API.",
	"example": {},
	"supports": { "html": false },
	"attributes": {
		"quizId":   { "type": "string", "default": "default" },
		"question": { "type": "string", "default": "" },
		"answers":  {
			"type": "array",
			"default": [
				{ "text": "", "isCorrect": false },
				{ "text": "", "isCorrect": false }
			]
		}
	},
	"textdomain": "multi-shot-interactivity-quiz",
	"editorScript": "file:./index.js",
	"editorStyle": "file:./index.css",
	"style": "file:./style-index.css",
	"render": "file:./render.php",
	"viewScript": "file:./view.js"
}
```

### view.js (`src/multi-shot-interactivity-quiz/view.js`) — SKELETON, Phase 2 fills this in

```js
import { store } from '@wordpress/interactivity';

// eslint-disable-next-line no-unused-vars
const { state } = store( 'multi-shot-interactivity-quiz', {
	state: {
		quizzes: {},
	},
	actions: {
		selectAnswer() {
			// Implemented in Phase 2.
		},
		retry() {
			// Implemented in Phase 2.
		},
	},
	callbacks: {},
} );
```

### render.php (`src/multi-shot-interactivity-quiz/render.php`) — complete, may need tweaks for Phase 2

```php
<?php
/**
 * PHP file to use when rendering the block type on the server to show on the front end.
 *
 * @see https://github.com/WordPress/gutenberg/blob/trunk/docs/reference-guides/block-api/block-metadata.md#render
 */

// Filter out answers with non-empty text.
$renderable = array();
$has_correct = false;

if ( ! empty( $attributes['answers'] ) ) {
	foreach ( $attributes['answers'] as $i => $answer ) {
		$text = trim( $answer['text'] ?? '' );
		if ( '' === $text ) {
			continue;
		}
		$is_correct = ! empty( $answer['isCorrect'] );
		$renderable[] = array(
			'text'       => $text,
			'isCorrect'  => $is_correct,
			'id'         => 'a' . $i,
		);
		if ( $is_correct ) {
			$has_correct = true;
		}
	}
}

$is_ready = count( $renderable ) >= 2 && $has_correct;

$context = array(
	'quizId'     => $attributes['quizId'] ?? 'default',
	'question'   => $attributes['question'] ?? '',
	'answers'    => $renderable,
	'selectedId' => null,
	'locked'     => false,
);
?>

<?php if ( ! $is_ready ) : ?>
	<div <?php echo get_block_wrapper_attributes(); ?>>
		<p class="msiq-not-ready">
			<?php esc_html_e( 'This question is not ready. Complete it in the editor.', 'multi-shot-interactivity-quiz' ); ?>
		</p>
	</div>
<?php else : ?>
	<div
		<?php echo get_block_wrapper_attributes( array( 'data-wp-interactive' => 'multi-shot-interactivity-quiz' ) ); ?>
		data-wp-context='<?php echo wp_json_encode( $context, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT ); ?>'
	>
		<p class="msiq-question" data-wp-text="context.question"><?php echo esc_html( $context['question'] ); ?></p>
		<ul class="msiq-answers">
			<?php foreach ( $renderable as $i => $answer ) : ?>
				<li
					data-wp-on--click="actions.selectAnswer"
					data-wp-bind--disabled="context.locked"
					data-wp-class--is-selected="context.selectedId === '<?php echo esc_attr( $answer['id'] ); ?>'"
					data-wp-class--is-correct="context.locked && context.answers[<?php echo (int) $i; ?>].isCorrect"
					data-wp-class--is-wrong="context.locked && context.selectedId === '<?php echo esc_attr( $answer['id'] ); ?>' && ! context.answers[<?php echo (int) $i; ?>].isCorrect"
					class="msiq-answer"
				>
					<span data-wp-text="context.answers[<?php echo (int) $i; ?>].text">
						<?php echo esc_html( $answer['text'] ); ?>
					</span>
				</li>
			<?php endforeach; ?>
		</ul>
	</div>
<?php endif; ?>
```

### edit.js (`src/multi-shot-interactivity-quiz/edit.js`) — complete, no Phase 2 changes expected

Full editor UI with TextControl for question, answer rows with star toggle + remove button, Add answer button, InspectorControls with quizId, warning when no correct answer. Star toggle is a true toggle (clicking an already-correct star unmarks it).

### style.scss (`src/multi-shot-interactivity-quiz/style.scss`) — has CSS for all states

Front-end styling: `.msiq-question`, `.msiq-answers` (list-style none), `.msiq-answer` (border, hover, is-selected/is-correct/is-wrong states), `.msiq-not-ready`.

### index.js (`src/multi-shot-interactivity-quiz/index.js`)

```js
import { registerBlockType } from '@wordpress/blocks';
import './style.scss';
import Edit from './edit';
import metadata from './block.json';

registerBlockType( metadata.name, {
	...metadata,
	edit: Edit,
} );
```

### Git history (Phase 1)

```
ecfa76c fix: make star toggle actually toggle (unmark when already correct)
4a26612 feat: register Interactivity store skeleton
7b1eb0f security: use HTML-safe JSON encoding for data-wp-context attribute
095ff13 feat: server-render question with Interactivity API directives
b6e1f71 feat: build editor UI with TextControl question, answer rows, star toggle
ea1b345 refactor: rename block to multi-shot-interactivity-quiz/question
8e34840 chore: add interactivity, components, element deps and vitest
af154bf docs: add Phase 1 implementation plan
c569171 docs: fix directive to read context.locked, not state.locked
9c1b8fe docs: add design spec for multi-shot interactivity quiz
```

---

## Phase 1 Verification Status (all passing at HEAD)

- `npm test` → 7/7 pass (block.json structure tests)
- `npm run build` → success, no warnings
- `npm run lint:js` → clean
- `npm run lint:css` → clean

---

## Known Issues from Phase 1 (carry into Phase 2)

These were identified during code review and explicitly deferred. Address them during Phase 2 implementation:

### 1. `data-wp-bind--disabled` on `<li>` is non-functional (MUST FIX in Phase 2)

**File:** `src/multi-shot-interactivity-quiz/render.php:68`
**Issue:** The `disabled` attribute is only valid on form elements (`<button>`, `<input>`, etc.). On an `<li>`, it has no effect — the Interactivity API sets a meaningless DOM property, the `:disabled` CSS pseudo-class won't match, and clicks are NOT prevented.
**Impact:** When a question is locked, users can still click answers (the `selectAnswer` action must guard on `context.locked` itself). The CSS rule `&:disabled { cursor: default; }` in `style.scss` is dead code.
**Fix options (decide during Phase 2 planning):**
- **(a)** Switch `<li>` to `<button type="button">` so `disabled` works natively (also improves accessibility — keyboard-focusable, native semantics). This is the recommended option.
- **(b)** Remove `data-wp-bind--disabled` from the `<li>`, replace with `data-wp-class--is-locked="context.locked"` and style `.is-locked` (no click prevention via attribute, rely on action guard).
- **(c)** Keep `<li>` but use `data-wp-bind--aria-disabled="context.locked"` for accessibility + action guard for click prevention.
**If switching to `<button>`:** update `style.scss` (remove `list-style: none` from `<ul>`, reset button defaults), update `render.php` markup, and ensure the button doesn't submit any form.

### 2. `eslint-disable-next-line no-unused-vars` in view.js (REMOVE in Phase 2)

**File:** `src/multi-shot-interactivity-quiz/view.js:3`
**Issue:** `const { state }` is destructured but unused because the store skeleton has no logic. The eslint-disable is a placeholder.
**Fix:** When Phase 2 implements `selectAnswer` and uses `state.quizzes`, the `state` destructure will be used and the eslint-disable line should be removed.

### 3. Answer `id` is positional, not sequential (VERIFY in Phase 2)

**File:** `src/multi-shot-interactivity-quiz/render.php:27`
**Issue:** Answer `id` is `'a' . $i` where `$i` is the index from the original `$attributes['answers']` array (pre-filtering). If the author has answers `[empty, "Paris", "London"]`, the renderable IDs become `a1`, `a2` (not `a0`, `a1`). This is functionally correct (uniqueness holds, directives use renderable index `$i` for `context.answers[i]`), but the gap in IDs could be surprising.
**Action:** Verify this doesn't cause issues in Phase 2's `selectAnswer` logic. If it does, reindex after filtering: `$renderable[] = array( ..., 'id' => 'a' . count( $renderable ) )`.

### 4. Star toggle visual affordance weak (Phase 3, but noted here)

**File:** `src/multi-shot-interactivity-quiz/editor.scss:29`
**Issue:** The `&.is-primary` CSS rule for `.msiq-star-toggle` is dead code — the star `Button` in `edit.js` doesn't set `variant="primary"`, so the gold (`#f0b849`) highlight never applies. The "marked correct" state is conveyed only by the icon swap (`star-filled` vs `star-empty`).
**Fix (Phase 3):** Either add `variant={ answer.isCorrect ? 'primary' : undefined }` to the Button, or add a custom `.is-marked-correct` class and style it.

### 5. `key={ index }` on answer rows in edit.js (Phase 3)

**File:** `src/multi-shot-interactivity-quiz/edit.js:81`
**Issue:** Using array index as React key is fragile when items are removed — focus and cursor position can jump. Acceptable for Phase 1 since inputs are fully controlled.
**Fix (Phase 3):** Add stable IDs to each answer object.

---

## Phase 2 Requirements (from design spec)

**Goal:** Playable quiz.

### What to implement

#### 1. `selectAnswer` action in `view.js`

The core action, triggered by `data-wp-on--click="actions.selectAnswer"` on each answer `<li>` (or `<button>` if issue #1 is fixed by switching element).

**Algorithm (from design spec):**
1. Read this block's context (`quizId`, `answers`, `selectedId`, `locked`).
2. If `locked`, bail (locked on first answer — no changes allowed).
3. Set `context.selectedId = clickedAnswerId`, `context.locked = true`.
4. Update `state.quizzes[quizId]`: increment `answered`, add `correct += clicked.isCorrect ? 1 : 0`.
5. If `answered === total` → set `state.quizzes[quizId].finished = true` → results panel shows.

**How to read context in an Interactivity action:** Use `getContext()` from `@wordpress/interactivity`. The context is the `data-wp-context` object emitted by `render.php`. The action receives the event; the element's context is available via the store's scope functions.

```js
import { store, getContext, getElement } from '@wordpress/interactivity';

const { state } = store( 'multi-shot-interactivity-quiz', {
	actions: {
		selectAnswer() {
			const context = getContext();
			if ( context.locked ) return;

			const element = getElement();
			const clickedId = element.attributes[ 'data-answer-id' ];

			context.selectedId = clickedId;
			context.locked = true;

			const clicked = context.answers.find( a => a.id === clickedId );
			const quiz = state.quizzes[ context.quizId ];
			quiz.answered++;
			if ( clicked.isCorrect ) quiz.correct++;

			if ( quiz.answered === quiz.total ) {
				quiz.finished = true;
			}
		},
	},
} );
```

**Note:** The `data-answer-id` attribute is NOT currently on the `<li>` elements in `render.php`. You will need to add it (or use an alternative method to identify which answer was clicked — e.g., `data-wp-context` per-answer, or index from the element's position). This is an open implementation question to resolve during planning.

**Open question:** How does the clicked answer identify itself to the action? Options:
- **(a)** Add `data-answer-id="<?php echo esc_attr( $answer['id'] ); ?>"` to each `<li>` in `render.php`, read via `getElement().attributes['data-answer-id']`.
- **(b)** Wrap each answer in its own `data-wp-context` with the answer `id`, read via nested `getContext()`.
- **(c)** Use the element's index in the parent `<ul>` to look up `context.answers[index]`.
Option (a) is simplest and recommended.

#### 2. Initialize the per-quiz aggregate (`state.quizzes`)

The store needs to know how many questions each quiz has. This requires scanning the DOM on init.

**Algorithm:**
- On store init (use `useInit` or run at module level), query all `[data-wp-interactive="multi-shot-interactivity-quiz"]` elements.
- For each, parse its `data-wp-context` JSON to get `quizId`.
- Group by `quizId` and initialize `state.quizzes[quizId] = { answered: 0, correct: 0, total: <count>, finished: false }`.

**Open question:** The Interactivity API's `store()` runs once when the module loads. At that point, are all blocks in the DOM? The design spec says: "Interactivity hydrates after DOM ready, so all blocks exist when the store runs." Verify this is true. If not, use a callback or `useInit` hook.

**Alternative:** Instead of scanning the DOM, have each Question block register itself. Use a `data-wp-init` directive on each block's root `<div>` that calls a callback to increment `state.quizzes[quizId].total` on init. This is more declarative and avoids DOM scanning.

```php
// In render.php, add to the root <div>:
data-wp-init="callbacks.registerQuestion"
```

```js
// In view.js:
callbacks: {
	registerQuestion() {
		const context = getContext();
		const quizId = context.quizId;
		if ( ! state.quizzes[ quizId ] ) {
			state.quizzes[ quizId ] = { answered: 0, correct: 0, total: 0, finished: false };
		}
		state.quizzes[ quizId ].total++;
	},
}
```

**This is the recommended approach** — it's declarative, avoids DOM scanning, and works with the Interactivity API's hydration model.

#### 3. Immediate feedback via CSS classes

Already wired in `render.php` via directives:
- `data-wp-class--is-selected="context.selectedId === '<id>'"` — blue highlight on selected answer
- `data-wp-class--is-correct="context.locked && context.answers[<i>].isCorrect"` — green on correct answer (shown when locked)
- `data-wp-class--is-wrong="context.locked && context.selectedId === '<id>' && ! context.answers[<i>].isCorrect"` — red on wrong selected answer

CSS classes are already in `style.scss`:
- `.is-selected` → blue border/bg
- `.is-correct` → green border/bg
- `.is-wrong` → red border/bg

**This should work automatically once `selectAnswer` sets `context.selectedId` and `context.locked`.** Verify during implementation.

#### 4. Sticky bar injection

**What it shows:**
- During play: `"2 of 5 answered · 1 correct"` (live updating)
- When finished: `"You scored 3/5"` + Retry button

**How to inject:**
- On store init (or via `data-wp-init` on the first block), inject ONE sticky bar element per quiz into the DOM.
- The bar should be `position: sticky` at the bottom of the page.
- The bar reads `state.quizzes[quizId]` for its content.

**Open question:** How to inject the bar? Options:
- **(a)** Inject via JS DOM manipulation in a callback (imperative — `document.createElement`, set innerHTML, append to body). Not declarative, but works.
- **(b)** Add a hidden bar element in `render.php` of each block, show it only for the first block per quiz (determined at runtime). Fragile ordering.
- **(c)** Use `data-wp-init` on each block to check if a bar already exists for this `quizId`; if not, create one. The bar is a Preact vdom rendered by the Interactivity API.

**Recommended:** Option (a) — imperative injection. The bar is a runtime UI element, not authored content. Create it in a callback, bind it to `state.quizzes[quizId]` via directives, append to the page.

**Sticky bar SCSS:** Add to `style.scss` (or a new `bar.scss`):
```scss
.msiq-sticky-bar {
	position: sticky;
	bottom: 0;
	background: #fff;
	border-top: 1px solid #ddd;
	padding: 0.75rem 1rem;
	display: flex;
	justify-content: space-between;
	align-items: center;
	z-index: 1000;
}
```

#### 5. Results panel

When `state.quizzes[quizId].finished === true`:
- The sticky bar transforms to show: `"You scored 3/5"` + Retry button
- All question blocks are already locked (can't change answers)
- Optionally show a message based on score (e.g., "Perfect!" for 5/5, "Good try!" for 3/5)

**Implementation:** The sticky bar's content changes based on `state.quizzes[quizId].finished`. Use `data-wp-text` or `data-wp-class--is-finished` directives on the bar element to toggle between "progress" view and "results" view.

#### 6. `retry` action

Resets the entire quiz:
1. Iterate all blocks in the quiz group.
2. For each, set `context.selectedId = null`, `context.locked = false`.
3. Reset `state.quizzes[quizId] = { answered: 0, correct: 0, total: <same>, finished: false }`.
4. Hide results panel (it's bound to `finished` state, so this is automatic).
5. CSS classes reset automatically (directives re-evaluate).

**Open question:** How to iterate all blocks in a quiz group from the `retry` action? The `retry` action runs in the context of the sticky bar (or the Retry button), not a Question block. Options:
- **(a)** Store references to all Question block contexts in `state.quizzes[quizId].blocks` array during `registerQuestion` callback. Then `retry` iterates that array.
- **(b)** Query the DOM for all `[data-wp-interactive]` elements with matching `quizId` and reset each.

**Recommended:** Option (a) — store context references during registration. This is cleaner and avoids DOM queries.

**Note:** Interactivity API contexts are reactive proxies. Storing a reference to a context object and mutating it later should work — but verify this during implementation. If contexts are not stable references, you may need to store element selectors instead.

### Phase 2 Exit Criteria

- On the front end, clicking an answer locks the question
- Locked question shows correct (green) and wrong-selected (red) answers
- Sticky bar shows live progress: "N of M answered · K correct"
- When all questions answered, results panel shows final score
- Retry button resets all blocks (clears selected, unlocked) and aggregate state
- `npm run build` passes
- `npm run lint:js` passes
- `npm run lint:css` passes
- `npm test` passes

---

## Open Questions for Phase 2 Planning

These need decisions BEFORE writing the implementation plan:

1. **Answer identification:** How does `selectAnswer` know which answer was clicked? Add `data-answer-id` attribute (recommended), use nested context, or use index? → **Recommend `data-answer-id` on each answer element.**

2. **Quiz registration:** How does the store know how many questions each quiz has? DOM scan on init, or `data-wp-init="callbacks.registerQuestion"` per block? → **Recommend `data-wp-init` callback (declarative).**

3. **Sticky bar injection:** Imperative JS DOM creation, or render in PHP, or use a hidden element? → **Recommend imperative injection in a callback.**

4. **Retry context iteration:** How does `retry` find all blocks in a quiz to reset them? Store context references during registration, or DOM query? → **Recommend storing references during `registerQuestion`.**

5. **`<li>` vs `<button>` for answers:** Fix the non-functional `data-wp-bind--disabled` by switching to `<button>` (improves a11y too), or keep `<li>` and guard in the action? → **Recommend `<button type="button">` for native disabled + keyboard accessibility.**

6. **Interactivity API context stability:** Are context proxy references stable enough to store in an array and mutate later (for retry)? Verify against the Interactivity API source in `node_modules/@wordpress/interactivity/src/`.

---

## Interactivity API Reference (key APIs for Phase 2)

All from `@wordpress/interactivity`:

- `store(namespace, { state, actions, callbacks })` — registers the store, returns `{ state }`
- `getContext()` — returns the reactive context for the current block (from `data-wp-context`)
- `getElement()` — returns the element that triggered the action (with `attributes`, `ref`)
- `state` — the store's reactive state (shared across all blocks in the namespace)

### Directives (used in render.php, evaluated by the Interactivity API)

- `data-wp-interactive="<namespace>"` — opts the element into the Interactivity API
- `data-wp-context='<json>'` — sets the block's context (reactive scope)
- `data-wp-text="state.<path>"` or `"context.<path>"` — binds text content
- `data-wp-on--click="actions.<name>"` — binds click handler
- `data-wp-bind--<attr>="state.<path>"` or `"context.<path>"` — binds attribute value
- `data-wp-class--<class>="state.<path>"` or `"context.<path>"` — toggles class
- `data-wp-init="callbacks.<name>"` — runs callback on init

### Directives reference

- `data-wp-interactive` docs: https://developer.wordpress.org/block-editor/reference-guides/interactivity-api-api-reference/
- The Interactivity API uses Preact signals under the hood (`@preact/signals`)
- Contexts are proxied for reactivity — mutating a property triggers re-render of bound directives

---

## Files Phase 2 Will Touch

| File | Expected changes |
|------|-----------------|
| `src/multi-shot-interactivity-quiz/view.js` | **Major** — implement `selectAnswer`, `retry`, `callbacks.registerQuestion`, sticky bar injection |
| `src/multi-shot-interactivity-quiz/render.php` | **Minor** — add `data-answer-id` to answer elements, add `data-wp-init="callbacks.registerQuestion"` to root div, possibly switch `<li>` to `<button>`, remove `data-wp-bind--disabled` or keep if switching to `<button>` |
| `src/multi-shot-interactivity-quiz/style.scss` | **Minor** — add sticky bar styles, results panel styles, adjust if switching to `<button>` |
| `src/multi-shot-interactivity-quiz/edit.js` | **None expected** — editor UI is complete |
| `src/multi-shot-interactivity-quiz/block.json` | **None expected** — attributes are complete |
| `src/multi-shot-interactivity-quiz/editor.scss` | **None expected** — editor styling is complete |
| `tests/` | **Possible** — add tests for store logic if feasible (Interactivity store testing may require mocking) |

---

## Phase 3 Preview (for context only, do not implement in Phase 2)

- UI: transitions on feedback colors, accessibility (focus states, ARIA, keyboard nav), responsive sticky bar, editor preview closer to front end
- Logic: empty/invalid answer filtering robustness, `quizId` collision detection, lazy-loaded block re-injection, min/max answer enforcement
- Optimization: `view.js` bundle size, directive count, cache DOM lookups, memo guards
- Tech debt: remove `eslint-disable no-unused-vars`, fix `key={ index }` in edit.js, fix star toggle visual affordance

---

## Out of Scope (all phases)

Persistence of scores to the server, user accounts, analytics, multiple-correct-answer questions, timed quizzes, question shuffling, media answers (images/video), CPT backing, REST API.

---

## How to Verify Phase 2 Is Complete

1. `npm run build` — no errors
2. `npm run lint:js` — no errors
3. `npm run lint:css` — no errors
4. `npm test` — all tests pass
5. Manual test (if WordPress environment available):
   - Create a page, add 3+ Question blocks with the same `quizId`
   - Fill in questions and answers, mark one correct per question
   - View the front end: all questions visible, sticky bar shows "0 of 3 answered"
   - Click an answer: question locks, shows correct (green) and wrong (red), sticky bar updates
   - Answer all questions: results panel shows final score, Retry button appears
   - Click Retry: all questions reset (unlocked, no selection), sticky bar resets to "0 of 3"

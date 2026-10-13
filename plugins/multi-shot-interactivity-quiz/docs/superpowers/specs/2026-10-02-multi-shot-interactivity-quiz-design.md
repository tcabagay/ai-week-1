# Multi-Shot Interactivity Quiz — Design

Date: 2026-10-02
Status: Approved (pending user spec review)
Phase: 1 — Architecture & Boilerplate

## Summary

A WordPress block plugin that builds interactive multiple-choice quizzes using the WordPress Interactivity API. One Question block holds a question and an array of answers; blocks sharing a `quizId` form one quiz. All questions render visible on the page; a runtime-injected sticky bar shows live progress and score. Feedback is immediate (selecting an answer locks the question and reveals correct/incorrect); finishing all questions shows a results panel with a Retry button.

## Decisions (locked from brainstorming)

- **Authoring model:** One block = one question. Question text and each answer are `TextControl` components. A star toggle marks exactly one correct answer. An "Add answer" `Button` grows the answers array.
- **Block grouping:** Standalone Question blocks placed freely on a page, grouped by a shared `quizId` attribute (default `"default"`). No parent block, no InnerBlocks for grouping.
- **Quiz flow:** All questions visible; a sticky progress/submit bar shows answered count and live score.
- **Feedback:** Immediate per-question. Clicking an answer locks the question and reveals correct/incorrect.
- **End state:** Lock on answer. When all questions answered, a results panel shows final score. A Retry button resets the quiz.
- **Architecture:** Approach A — single Question block; `render.php` seeds per-block data via `data-wp-context`; `view.js` merges same-`quizId` blocks into one store and injects one sticky bar per quiz at runtime.

## Architecture

One block type: `multi-shot-interactivity-quiz/question` (renamed from the scaffolded `create-block/multi-shot-interactivity-quiz`). Plugin slug stays `multi-shot-interactivity-quiz`. Interactivity store namespace: `multi-shot-interactivity-quiz` (one store serves all quizzes; `quizId` partitions state inside it).

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

### Key principle

`render.php` is the single source of truth for front-end data. The editor writes attributes; `render.php` serializes them into `data-wp-context`; `view.js` never parses the editor's React state — it only reads contexts the server emitted. This keeps server-rendered HTML correct on first paint and lets Interactivity hydrate.

## Data Model & Attributes

### `block.json` attributes

```json
{
  "quizId":   { "type": "string", "default": "default" },
  "question": { "type": "string", "default": "" },
  "answers":  {
    "type": "array",
    "default": [
      { "text": "", "isCorrect": false },
      { "text": "", "isCorrect": false }
    ]
  }
}
```

- `quizId` — groups Question blocks into one quiz. Default `"default"` so a single quiz "just works"; author sets distinct IDs (Inspector `TextControl`) to run multiple quizzes on one page.
- `question` — the question text (`TextControl` in editor).
- `answers` — array of `{ text: string, isCorrect: boolean }`. Exactly one `isCorrect: true` (enforced in editor: toggling a star on clears others). Minimum 2 answers (the "Add answer" button grows the array; a remove button shrinks it down to a floor of 2).

### Validation rules (editor-side)

- Exactly one correct answer — selecting a star on answer N sets `answers[N].isCorrect = true` and all others `false`. If no answer is starred, the block shows an editor-only warning ("Mark one correct answer").
- Empty answer text allowed in editor (author may be mid-edit); `render.php` filters out empty `text` answers so the front end never shows blank options. A question with zero non-empty answers or no correct answer renders a front-end notice instead of interactive controls.

### Front-end context (`render.php` emits via `data-wp-context`)

```json
{
  "quizId":     "default",
  "question":   "Capital of France?",
  "answers": [
    { "text": "Paris",  "isCorrect": true,  "id": "a1" },
    { "text": "London", "isCorrect": false, "id": "a2" }
  ],
  "selectedId": null,
  "locked":     false
}
```

`selectedId` and `locked` are per-block runtime state (start `null`/`false`), mutated by the store on answer click. The store keeps a parallel per-quiz map: `{ quizId: { answeredCount, correctCount, questions: [] } }` for the sticky bar and results panel.

### Why split per-block context + store map

`data-wp-context` is the Interactivity API's reactive scope — perfect for per-question state (selected answer, locked). The aggregate (score, progress) is cross-block, so it lives in the store's top-level state keyed by `quizId`. The sticky bar reads the store; each Question block reads its own context.

## Editor UX (`edit.js`)

The block is the authoring surface. No preview of the front-end interactive state — just the input controls. Layout (vertically stacked, block-padded):

```
+-- Question block -----------------------------+
|  [ Question text                ] TextControl  |
|                                                |
|  Answers                                       |
|  +-------------------------+----+----+          |
|  | Answer 1               | *  | x  |           |
|  +-------------------------+----+----+          |
|  +-------------------------+----+----+          |
|  | Answer 2               | o  | x  |           |
|  +-------------------------+----+----+          |
|  [ + Add answer ]   (Button component)         |
|                                                |
|  ! Mark one correct answer   (only if none)    |
+------------------------------------------------+
```

### Components (all `@wordpress/components`)

- `TextControl` — question text, full-width.
- Each answer row: `TextControl` (flex-grow) + star toggle (`Button` with `dashicons-star-filled` / `dashicons-star-empty`) + remove `Button` (`dashicons-no`).
- `Button` — "Add answer", appends `{ text: "", isCorrect: false }`. Disabled at a sane max (default 6 — tunable; prevents a runaway array). Remove disabled at min 2.
- Warning: inline `Notice` or plain red text, editor-only, when no answer is starred.

### Inspector (right sidebar, `InspectorControls`)

- `TextControl` — `quizId` (label "Quiz ID", help text "Group questions by giving them the same ID").

### Wiring

- `setAttributes({ question: value })` on change.
- Answer text change: clone array, set `answers[i].text`, `setAttributes`.
- Star click: clone array, set only `answers[i].isCorrect = true`, rest `false`.
- Add: `[...answers, { text: "", isCorrect: false }]`.
- Remove: filter by index; if the removed was correct, clear all `isCorrect` (forces author to re-mark).
- `useBlockProps()` on the root wrapper.

### Why no InnerBlocks

You chose standalone blocks + shared store, so each Question is a leaf — no nesting. The answers array lives in one block's attributes, not child blocks.

## Front End

### `render.php` — server-rendered HTML per Question block

```php
<div
  <?php echo get_block_wrapper_attributes( [
    'data-wp-interactive' => 'multi-shot-interactivity-quiz',
    'data-wp-context'    => wp_json_encode( [
      'quizId'     => $attributes['quizId'],
      'question'   => $attributes['question'],
      'answers'    => $renderable,   // non-empty, each gets an 'id'
      'selectedId' => null,
      'locked'     => false,
    ] ),
  ] ); ?>
>
  <p class="msiq-question" data-wp-text="context.question"></p>
  <ul class="msiq-answers">
    <?php foreach ( $renderable as $i => $a ) : ?>
      <li
        data-wp-on--click="actions.selectAnswer"
        data-wp-bind--disabled="context.locked"
        data-wp-class--is-selected="context.selectedId === '<?php echo esc_js( $a['id'] ); ?>'"
        data-wp-class--is-correct="state.locked && <?php echo $a['isCorrect'] ? 'true' : 'false'; ?>"
        data-wp-class--is-wrong="state.locked && context.selectedId === '<?php echo esc_js( $a['id'] ); ?>' && !<?php echo $a['isCorrect'] ? 'true' : 'false'; ?>"
      >
        <span data-wp-text="context.answers[<?php echo $i; ?>].text"></span>
      </li>
    <?php endforeach; ?>
  </ul>
</div>
```

`$renderable` = array_filter of answers with non-empty `text`, each given a stable `id` (`'a' . $i`). A block with fewer than 2 renderable answers or no correct answer renders a front-end notice ("This question isn't ready") instead of the interactive markup — so a half-edited block never ships a broken quiz.

### Why directives over JS DOM building

The Interactivity API is declarative — `render.php` emits the full structure with `data-wp-*` hooks, and `view.js` only defines `state` + `actions`. Server-rendered HTML is correct on first paint; hydration is automatic. No manual `createElement`.

### `view.js` — the store

One namespace serves all quizzes; `quizId` partitions the aggregate state.

```js
import { store } from '@wordpress/interactivity';

const { state } = store( 'multi-shot-interactivity-quiz', {
  state: {
    // per-quiz aggregate, keyed by quizId
    quizzes: {},        // { [quizId]: { answered, correct, total } }
    get currentQuiz() { /* derive from nearest context */ },
  },
  actions: {
    selectAnswer() { /* ... */ },
    retry()        { /* ... */ },
  },
  callbacks: {
    updateBar()   { /* recalc aggregate, inject/sticky bar */ },
    injectBar()   { /* once per quiz */ },
  },
} );
```

#### `selectAnswer()` (the core action)

1. Read this block's context (`quizId`, `answers`, `selectedId`, `locked`).
2. If `locked`, bail (locked on first answer).
3. Set `context.selectedId = clickedAnswerId`, `context.locked = true`.
4. Update `state.quizzes[quizId]`: `answered++`, `correct += clicked.isCorrect ? 1 : 0`.
5. If `answered === total` -> flip `state.quizzes[quizId].finished = true` -> results panel shows.

#### Sticky bar (injected once per quiz on init)

- On store init, `view.js` queries all `[data-wp-interactive="multi-shot-interactivity-quiz"]` blocks, groups by `quizId` from their contexts, and for each group inserts ONE sticky bar element (fixed-positioned, `position: sticky` bottom) bound to that quiz's aggregate state via directives.
- Bar shows: `"2 of 5 answered - 1 correct"` (live) and becomes a results panel when `finished`: `"You scored 3/5"` + `Retry` button (`data-wp-on--click="actions.retry"`).
- `retry()` resets all blocks in the quiz: iterates the group, sets each `context.selectedId = null`, `context.locked = false`, clears `state.quizzes[quizId]` aggregate, hides results panel.

#### Two tricky bits handled explicitly

- **Cross-block context:** `data-wp-context` is block-scoped, so `selectAnswer` reads its own block's context via the directive's element — no cross-block context leakage. The aggregate stays in `state.quizzes` (one shared object), readable by the injected bar.
- **Init ordering:** Interactivity hydrates after DOM ready, so all blocks exist when the store runs. `injectBar` runs once; if a block is added later (e.g. lazy-loaded), we skip re-injection for simplicity in Phase 1 and note it as a Phase 3 concern.

## Phases & Scope

### Phase 1 — Architecture & Boilerplate (current phase)

Goal: working build, no real quiz behavior yet.

- Rename block `name` -> `multi-shot-interactivity-quiz/question`; update `block.json`, `index.js`, `render.php`, plugin header.
- Define `block.json` attributes (`quizId`, `question`, `answers`).
- `edit.js`: skeleton with `TextControl` (question) + answer rows + Add button + star/remove + Inspector `quizId`. No styling polish.
- `render.php`: emit `data-wp-interactive` + `data-wp-context` with real data; render question + answer list with directives. No interactive behavior yet.
- `view.js`: `store()` with empty `state`/`actions` skeleton; confirm it hydrates (one console check).
- `style.scss`/`editor.scss`: bare layout (flex rows) so it's usable, not pretty.

Exit criteria: `npm run build` passes; block inserts in editor; author can fill question/answers/star; front end renders the static structure with directives in the DOM; store namespace registered (no errors).

### Phase 2 — Core Quiz Behavior

Goal: playable quiz.

- `view.js`: implement `selectAnswer` — set `selectedId`, `locked`, update `state.quizzes[quizId]` aggregate.
- Immediate feedback: `data-wp-class--is-correct`/`is-wrong`/`is-selected` toggles color (green/red/selected) once `locked`.
- Sticky bar: inject once per `quizId`, show live `"answered / total - correct"`.
- Results panel: when `answered === total`, show final score in the bar; hide answer interactions (already locked).
- `retry()`: reset all blocks in the quiz + aggregate + panel.

Exit criteria: on the front end, clicking an answer locks it, shows right/wrong, updates the bar; finishing all shows the score; Retry resets everything.

### Phase 3 — Polish & Optimization

Goal: production feel.

- UI: transitions on feedback colors; accessibility (focus states, ARIA for selected/correct/wrong, keyboard answer via Enter/Space, role=radio or button); responsive sticky bar; editor preview closer to front end.
- Logic: empty/invalid answer filtering robustness; `quizId` collision detection (editor notice if two blocks share an ID the author didn't intend — open); lazy-loaded block re-injection; min/max answer enforcement.
- Optimization: `view.js` bundle size; directive count per block; avoid re-scanning DOM on every action (cache the group lookup); `memo`-style guards in callbacks.

Exit criteria: passes `lint:js`/`lint:css`; keyboard-navigable; no console warnings; clean build.

## Out of scope (all phases)

Persistence of scores to the server, user accounts, analytics, multiple-correct-answer questions, timed quizzes, question shuffling, media answers (images/video), CPT backing, REST API. These are future-work notes, not commitments.

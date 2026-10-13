# One Shot Interactivity Quiz — Plugin Build Session

**Date:** 2026-10-02

---

## Task

Create an interactive quiz plugin using a WordPress Block and the WordPress Interactivity API.

### Requirements

- **Editor (admin):** User enters a question and unlimited answer choices. "Add Answer" button appends new fields. Star icon beside each answer marks it as the correct answer.
- **Frontend:** Visitors select an answer and get immediate feedback (correct/incorrect).
  - Correct → green background (`#393`, web-safe).
  - Incorrect → red background (`#c00`, web-safe).
  - Check icon (`✓`) beside selected answer when correct.
  - X icon (`✗`) beside selected answer when incorrect.
  - Selected answer matched against the answer marked with the star in the editor.
- After answering: all buttons disabled, non-selected answers faded, correct answer revealed if wrong choice made.
- Use WordPress components for common UI elements.

---

## Design (Approved)

**Architecture:** Server-rendered dynamic block using the WordPress Interactivity API for frontend interactivity. `view.js` registers an interactivity store with state for selected answer + correctness. Editor uses `RichText`/`TextControl` components and a star toggle `Button`.

**Block attributes:**
- `question` (string) — the quiz question text
- `answers` (array of `{ text: string, isCorrect: boolean }`) — answer choices
- Only one answer marked correct at a time (clicking a star unsets others)

**Editor (`edit.js`):**
- `RichText` for the question
- Repeater of answer rows: `TextControl` + star toggle `Button` (filled star = correct, outline = not)
- "Add Answer" `Button` appends a new empty answer
- Remove button per answer row (trash icon)
- Uses `@wordpress/components` (`Button`, `TextControl`, `Icon`, `RichText`)

**Frontend (`render.php`):**
- `data-wp-interactive` directive on container; passes answers + correct index as initial state via `data-wp-context`
- Each answer is a `<button>` with `data-wp-on--click` → `selectAnswer` callback
- `data-wp-class--is-correct` / `data-wp-class--is-incorrect` on container (green/red backgrounds)
- `data-wp-bind--disabled` on all buttons after selection
- Check icon shown beside selected answer if correct; X icon if incorrect
- Incorrect (non-selected) answers get faded opacity class
- Correct answer gets highlighted/revealed when an incorrect answer is chosen

**Interactivity store (`view.js`):**
- State: `selectedAnswer` (index or null), `isSelected` (bool), `isCorrect` (bool), `correctIndex` (int)
- Actions: `selectAnswer` — sets selected, compares to `correctIndex`
- Derived state flags drive class binding

---

## Implementation

### Files Modified

1. **`src/one-shot-interactivity-quiz/block.json`** — Added `question` and `answers` attributes; kept `viewScript` for Interactivity API.
2. **`src/one-shot-interactivity-quiz/edit.js`** — `RichText` for question; repeater of `TextControl` + star toggle (`starFilled`/`starEmpty` icons from `@wordpress/icons`) + remove button (`trash`); "Add Answer" `Button` (`plus` icon). Only one answer can be marked correct at a time.
3. **`src/one-shot-interactivity-quiz/render.php`** — Server-rendered with `data-wp-interactive` + `data-wp-context` seeding initial state. Each answer is a `<button>` with directives for click handling, disabled binding, class toggling (correct/incorrect/faded/revealed), and icon visibility.
4. **`src/one-shot-interactivity-quiz/view.js`** — Interactivity store with `selectAnswer` action comparing clicked index against `correctIndex`; sets `isSelected`, `selectedAnswer`, `isCorrect` in context.
5. **`src/one-shot-interactivity-quiz/style.scss`** — Green (`#393`) background on correct, red (`#c00`) on incorrect; check (`✓`) / X (`✗`) icons; faded opacity for non-selected answers after answering; revealed correct answer highlighted when wrong choice made.
6. **`src/one-shot-interactivity-quiz/editor.scss`** — Editor layout for answer rows with flex alignment.
7. **`package.json`** — Added `@wordpress/components`, `@wordpress/icons`, `@wordpress/interactivity` dependencies.

### Verification

- `npm run lint:js` — clean (0 errors)
- `npm run lint:css` — clean (0 errors)
- `npm run build` — compiled successfully

---

## Key Technical Details

### Interactivity API Directives Used

| Directive | Purpose |
|---|---|
| `data-wp-interactive` | Binds interactivity store namespace to container |
| `data-wp-context` | Seeds initial state (answers, correctIndex, isSelected, etc.) |
| `data-wp-on--click` | Binds `selectAnswer` action to answer buttons |
| `data-wp-bind--disabled` | Disables all buttons after answering |
| `data-wp-class--is-correct` | Green background on container when correct |
| `data-wp-class--is-incorrect` | Red background on container when incorrect |
| `data-wp-class--is-selected-correct` | Highlights selected correct answer |
| `data-wp-class--is-selected-incorrect` | Highlights selected incorrect answer |
| `data-wp-class--is-faded` | Fades non-selected answers after answering |
| `data-wp-class--is-revealed-correct` | Reveals correct answer when wrong choice made |
| `data-wp-bind--hidden` | Toggles icon visibility |

### Web-Safe Colors

- Correct: `#393` (green)
- Incorrect: `#c00` (red)

### WordPress Components Used

- `RichText` — question input in editor
- `TextControl` — answer text inputs in editor
- `Button` — star toggle, add answer, remove answer
- `Icon` — renders SVG icons
- `@wordpress/icons` — `starFilled`, `starEmpty`, `plus`, `trash`

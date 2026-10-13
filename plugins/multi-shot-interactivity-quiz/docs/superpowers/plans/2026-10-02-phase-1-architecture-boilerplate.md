# Multi-Shot Interactivity Quiz — Phase 1: Architecture & Boilerplate

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename the scaffolded block, define the quiz data model, build the editor authoring UI, emit server-rendered HTML with Interactivity API directives, and register a minimal store — producing a working build with no interactive behavior yet.

**Architecture:** Single Question block (`multi-shot-interactivity-quiz/question`) using `render.php` to emit `data-wp-interactive` + `data-wp-context` directives. The Interactivity store (`view.js`) is registered with an empty skeleton. The editor (`edit.js`) provides `TextControl`-based authoring for a question, an array of answers, a star toggle for the correct answer, and an Inspector `quizId` control.

**Tech Stack:** WordPress Block API (apiVersion 3), WordPress Interactivity API (`@wordpress/interactivity`), `@wordpress/components` (TextControl, Button), `@wordpress/block-editor` (InspectorControls), `@wordpress/scripts` (webpack build, ESLint, Stylelint), Vitest 5 (structural tests).

**Spec:** `docs/superpowers/specs/2026-10-02-multi-shot-interactivity-quiz-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `package.json` | Modify | Add `@wordpress/interactivity`, `@wordpress/components`, `@wordpress/element` deps; add `vitest` devDep; add `test` script |
| `multi-shot-interactivity-quiz.php` | Modify | Update plugin header description |
| `src/multi-shot-interactivity-quiz/block.json` | Modify | Rename block, add `quizId`/`question`/`answers` attributes, update title/icon/description |
| `src/multi-shot-interactivity-quiz/index.js` | Modify | Register block with new name from metadata |
| `src/multi-shot-interactivity-quiz/edit.js` | Modify | Full editor UI: TextControl for question, answer rows with star/remove, Add answer button, Inspector quizId |
| `src/multi-shot-interactivity-quiz/editor.scss` | Modify | Editor layout: flex rows, spacing, star/remove button styling |
| `src/multi-shot-interactivity-quiz/render.php` | Modify | Emit `data-wp-interactive` + `data-wp-context`, render question + answer list with directives |
| `src/multi-shot-interactivity-quiz/style.scss` | Modify | Front-end layout: question/answer list styling, directive class hooks |
| `src/multi-shot-interactivity-quiz/view.js` | Modify | `store()` skeleton: namespace + empty `state`/`actions`/`callbacks` |
| `tests/block-json.test.js` | Create | Vitest test verifying block.json name, attributes, and defaults |

---

### Task 1: Add Dependencies and Test Setup

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add dependencies and test script to package.json**

Read the current `package.json`, then update it to add `@wordpress/interactivity`, `@wordpress/components`, and `@wordpress/element` to `dependencies`, add `vitest` to `devDependencies`, and add a `test` script.

```json
{
	"name": "multi-shot-interactivity-quiz",
	"version": "0.1.0",
	"description": "Interactive multiple-choice quiz block using the WordPress Interactivity API.",
	"author": "The WordPress Contributors",
	"license": "GPL-2.0-or-later",
	"main": "build/index.js",
	"scripts": {
		"build": "wp-scripts build --webpack-copy-php --blocks-manifest",
		"format": "wp-scripts format",
		"lint:css": "wp-scripts lint-style",
		"lint:js": "wp-scripts lint-js",
		"packages-update": "wp-scripts packages-update",
		"plugin-zip": "wp-scripts plugin-zip",
		"start": "wp-scripts start --webpack-copy-php --blocks-manifest",
		"test": "wp-scripts test-unit-js",
		"test:watch": "wp-scripts test-unit-js --watch"
	},
	"dependencies": {
		"@wordpress/block-editor": "latest",
		"@wordpress/blocks": "latest",
		"@wordpress/components": "latest",
		"@wordpress/element": "latest",
		"@wordpress/i18n": "latest",
		"@wordpress/interactivity": "latest"
	},
	"devDependencies": {
		"@wordpress/scripts": "^36.0.0",
		"vitest": "^5.0.0"
	}
}
```

- [ ] **Step 2: Install new dependencies**

Run:
```bash
npm install
```
Expected: installs `@wordpress/interactivity`, `@wordpress/components`, `@wordpress/element` as explicit deps, and `vitest` as a devDep. No errors.

- [ ] **Step 3: Verify Vitest is available**

Run:
```bash
npx vitest --version
```
Expected: prints `5.x.x` (version 5).

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add interactivity, components, element deps and vitest"
```

---

### Task 2: Rename Block and Update Metadata

**Files:**
- Modify: `src/multi-shot-interactivity-quiz/block.json`
- Modify: `src/multi-shot-interactivity-quiz/index.js`
- Modify: `multi-shot-interactivity-quiz.php`
- Create: `tests/block-json.test.js`

- [ ] **Step 1: Write the failing test for block.json structure**

Create `tests/block-json.test.js`:

```js
import { describe, it, expect } from 'vitest';
import blockJson from '../src/multi-shot-interactivity-quiz/block.json';

describe( 'block.json', () => {
	it( 'has the correct block name', () => {
		expect( blockJson.name ).toBe(
			'multi-shot-interactivity-quiz/question'
		);
	} );

	it( 'has quizId, question, and answers attributes', () => {
		expect( blockJson.attributes ).toHaveProperty( 'quizId' );
		expect( blockJson.attributes ).toHaveProperty( 'question' );
		expect( blockJson.attributes ).toHaveProperty( 'answers' );
	} );

	it( 'quizId defaults to "default"', () => {
		expect( blockJson.attributes.quizId.default ).toBe( 'default' );
	} );

	it( 'question defaults to empty string', () => {
		expect( blockJson.attributes.question.default ).toBe( '' );
	} );

	it( 'answers defaults to two empty answers', () => {
		expect( blockJson.attributes.answers.default ).toEqual( [
			{ text: '', isCorrect: false },
			{ text: '', isCorrect: false },
		] );
	} );

	it( 'uses the interactivity store namespace as viewScript module', () => {
		expect( blockJson.viewScript ).toBe( 'file:./view.js' );
	} );

	it( 'renders via PHP', () => {
		expect( blockJson.render ).toBe( 'file:./render.php' );
	} );
} );
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
npm test
```
Expected: FAIL — `blockJson.name` is `'create-block/multi-shot-interactivity-quiz'`, not `'multi-shot-interactivity-quiz/question'`. Also, `blockJson.attributes` is undefined.

- [ ] **Step 3: Update block.json with new name, attributes, and metadata**

Replace the entire contents of `src/multi-shot-interactivity-quiz/block.json`:

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
	"supports": {
		"html": false
	},
	"attributes": {
		"quizId": {
			"type": "string",
			"default": "default"
		},
		"question": {
			"type": "string",
			"default": ""
		},
		"answers": {
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

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
npm test
```
Expected: PASS — all 7 assertions pass.

- [ ] **Step 5: Update index.js to spread metadata**

Replace the entire contents of `src/multi-shot-interactivity-quiz/index.js`:

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

- [ ] **Step 6: Update plugin header description**

In `multi-shot-interactivity-quiz.php`, change the `Description` line:

```php
 * Description:       Interactive multiple-choice quiz block using the WordPress Interactivity API.
```

Also change the `@package` line:

```php
 * @package MultiShotInteractivityQuiz
```

- [ ] **Step 7: Build to verify no errors**

Run:
```bash
npm run build
```
Expected: build succeeds. The `build/blocks-manifest.php` should now contain `'name' => 'multi-shot-interactivity-quiz/question'`.

- [ ] **Step 8: Verify the manifest contains the new block name**

Run:
```bash
grep 'multi-shot-interactivity-quiz/question' build/blocks-manifest.php
```
Expected: prints a line containing `'name' => 'multi-shot-interactivity-quiz/question'`.

- [ ] **Step 9: Commit**

```bash
git add src/multi-shot-interactivity-quiz/block.json src/multi-shot-interactivity-quiz/index.js multi-shot-interactivity-quiz.php tests/block-json.test.js build/
git commit -m "refactor: rename block to multi-shot-interactivity-quiz/question

- Update block.json with new name, attributes (quizId, question, answers)
- Update index.js to spread metadata on registerBlockType
- Update plugin header description and package name
- Add Vitest test for block.json structure"
```

---

### Task 3: Build Editor UI (edit.js + editor.scss)

**Files:**
- Modify: `src/multi-shot-interactivity-quiz/edit.js`
- Modify: `src/multi-shot-interactivity-quiz/editor.scss`

- [ ] **Step 1: Write the full editor UI in edit.js**

Replace the entire contents of `src/multi-shot-interactivity-quiz/edit.js`:

```js
import { __ } from '@wordpress/i18n';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { TextControl, Button } from '@wordpress/components';
import './editor.scss';

const MAX_ANSWERS = 6;
const MIN_ANSWERS = 2;

export default function Edit( { attributes, setAttributes } ) {
	const { quizId, question, answers } = attributes;
	const blockProps = useBlockProps();

	const updateQuestion = ( value ) =>
		setAttributes( { question: value } );

	const updateAnswerText = ( index, text ) => {
		const newAnswers = [ ...answers ];
		newAnswers[ index ] = { ...newAnswers[ index ], text };
		setAttributes( { answers: newAnswers } );
	};

	const markCorrect = ( index ) => {
		const newAnswers = answers.map( ( a, i ) => ( {
			...a,
			isCorrect: i === index,
		} ) );
		setAttributes( { answers: newAnswers } );
	};

	const addAnswer = () => {
		if ( answers.length >= MAX_ANSWERS ) return;
		setAttributes( {
			answers: [ ...answers, { text: '', isCorrect: false } ],
		} );
	};

	const removeAnswer = ( index ) => {
		if ( answers.length <= MIN_ANSWERS ) return;
		const wasCorrect = answers[ index ].isCorrect;
		const newAnswers = answers
			.filter( ( _, i ) => i !== index )
			.map( ( a ) =>
				wasCorrect ? { ...a, isCorrect: false } : a
			);
		setAttributes( { answers: newAnswers } );
	};

	const hasCorrectAnswer = answers.some( ( a ) => a.isCorrect );

	return (
		<>
			<InspectorControls>
				<TextControl
					label={ __(
						'Quiz ID',
						'multi-shot-interactivity-quiz'
					) }
					value={ quizId }
					onChange={ ( value ) =>
						setAttributes( { quizId: value } )
					}
					help={ __(
						'Group questions by giving them the same ID.',
						'multi-shot-interactivity-quiz'
					) }
				/>
			</InspectorControls>

			<div { ...blockProps }>
				<TextControl
					label={ __(
						'Question',
						'multi-shot-interactivity-quiz'
					) }
					value={ question }
					onChange={ updateQuestion }
					placeholder={ __(
						'Enter your question…',
						'multi-shot-interactivity-quiz'
					) }
				/>

				<div className="msiq-answers">
					<p className="msiq-answers-label">
						{ __(
							'Answers',
							'multi-shot-interactivity-quiz'
						) }
					</p>
					{ answers.map( ( answer, index ) => (
						<div className="msiq-answer-row" key={ index }>
							<TextControl
								value={ answer.text }
								onChange={ ( value ) =>
									updateAnswerText( index, value )
								}
								placeholder={ __(
									`Answer ${ index + 1 }`,
									'multi-shot-interactivity-quiz'
								) }
							/>
							<Button
								icon={ answer.isCorrect
									? 'star-filled'
									: 'star-empty'
								}
								label={
									answer.isCorrect
										? __(
											'Correct answer (click to unmark)',
											'multi-shot-interactivity-quiz'
										)
										: __(
											'Mark as correct',
											'multi-shot-interactivity-quiz'
										)
								}
								onClick={ () => markCorrect( index ) }
								className="msiq-star-toggle"
							/>
							<Button
								icon="no"
								label={ __(
									'Remove answer',
									'multi-shot-interactivity-quiz'
								) }
								onClick={ () => removeAnswer( index ) }
								disabled={
									answers.length <= MIN_ANSWERS
								}
								className="msiq-remove-answer"
							/>
						</div>
					) ) }
				</div>

				<Button
					icon="plus"
					text={ __(
						'Add answer',
						'multi-shot-interactivity-quiz'
					) }
					onClick={ addAnswer }
					disabled={ answers.length >= MAX_ANSWERS }
					className="msiq-add-answer"
				/>

				{ ! hasCorrectAnswer && (
					<p className="msiq-warning">
						{ __(
							'⚠ Mark one correct answer.',
							'multi-shot-interactivity-quiz'
						) }
					</p>
				) }
			</div>
		</>
	);
}
```

- [ ] **Step 2: Write editor styles in editor.scss**

Replace the entire contents of `src/multi-shot-interactivity-quiz/editor.scss`:

```scss
.wp-block-multi-shot-interactivity-quiz-question {
	padding: 1rem;
	border: 1px solid #ddd;
	border-radius: 4px;

	.msiq-answers {
		margin-top: 1rem;
	}

	.msiq-answers-label {
		font-weight: 600;
		margin: 0 0 0.5rem;
	}

	.msiq-answer-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.5rem;

		.components-text-control__input {
			flex: 1;
		}
	}

	.msiq-star-toggle {
		flex-shrink: 0;

		&.is-primary {
			color: #f0b849;
		}
	}

	.msiq-remove-answer {
		flex-shrink: 0;
	}

	.msiq-add-answer {
		margin-top: 0.5rem;
	}

	.msiq-warning {
		color: #d63638;
		font-size: 0.875rem;
		margin: 0.5rem 0 0;
	}
}
```

- [ ] **Step 3: Build to verify no errors**

Run:
```bash
npm run build
```
Expected: build succeeds with no errors.

- [ ] **Step 4: Lint to verify code quality**

Run:
```bash
npm run lint:js
```
Expected: no errors. If lint reports issues, fix them and re-run.

- [ ] **Step 5: Lint styles**

Run:
```bash
npm run lint:css
```
Expected: no errors. If lint reports issues, fix them and re-run.

- [ ] **Step 6: Commit**

```bash
git add src/multi-shot-interactivity-quiz/edit.js src/multi-shot-interactivity-quiz/editor.scss build/
git commit -m "feat: build editor UI with TextControl question, answer rows, star toggle

- TextControl for question text
- Answer rows: TextControl + star toggle (mark correct) + remove button
- Add answer button (max 6, min 2)
- Inspector quizId TextControl
- Warning when no correct answer marked
- Editor SCSS layout"
```

---

### Task 4: Server-Render with Directives (render.php + style.scss)

**Files:**
- Modify: `src/multi-shot-interactivity-quiz/render.php`
- Modify: `src/multi-shot-interactivity-quiz/style.scss`

- [ ] **Step 1: Write render.php with Interactivity API directives**

Replace the entire contents of `src/multi-shot-interactivity-quiz/render.php`:

```php
<?php
/**
 * PHP file to use when rendering the block type on the server to show on the front end.
 *
 * The following variables are exposed to the file:
 *     $attributes (array): The block attributes.
 *     $content (string): The block default content.
 *     $block (WP_Block): The block instance.
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

// A question is "ready" when it has at least 2 answers and one correct answer.
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
			<?php esc_html_e(
				'This question is not ready. Complete it in the editor.',
				'multi-shot-interactivity-quiz'
			); ?>
		</p>
	</div>
<?php else : ?>
	<div
		<?php echo get_block_wrapper_attributes(
			array( 'data-wp-interactive' => 'multi-shot-interactivity-quiz' )
		); ?>
		data-wp-context='<?php echo wp_json_encode( $context ); ?>'
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

- [ ] **Step 2: Write front-end styles in style.scss**

Replace the entire contents of `src/multi-shot-interactivity-quiz/style.scss`:

```scss
.wp-block-multi-shot-interactivity-quiz-question {
	.msiq-question {
		font-size: 1.125rem;
		font-weight: 600;
		margin: 0 0 0.75rem;
	}

	.msiq-answers {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.msiq-answer {
		padding: 0.75rem 1rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		margin-bottom: 0.5rem;
		cursor: pointer;
		transition: background-color 0.15s ease, border-color 0.15s ease;

		&:hover {
			background-color: #f6f7f7;
		}

		&:disabled,
		&.is-selected {
			cursor: default;
		}

		&.is-selected {
			border-color: #2271b1;
			background-color: #eff6ff;
		}

		&.is-correct {
			border-color: #00a32a;
			background-color: #edfaef;
		}

		&.is-wrong {
			border-color: #d63638;
			background-color: #fcf0f1;
		}
	}

	.msiq-not-ready {
		color: #757575;
		font-style: italic;
		padding: 1rem;
		border: 1px dashed #ddd;
		border-radius: 4px;
	}
}
```

- [ ] **Step 3: Build to verify no errors**

Run:
```bash
npm run build
```
Expected: build succeeds. The `build/multi-shot-interactivity-quiz/render.php` is copied from `src/`.

- [ ] **Step 4: Verify render.php was copied to build**

Run:
```bash
grep 'data-wp-interactive' build/multi-shot-interactivity-quiz/render.php
```
Expected: prints a line containing `data-wp-interactive` — confirming the PHP was copied to the build directory.

- [ ] **Step 5: Lint styles**

Run:
```bash
npm run lint:css
```
Expected: no errors. If lint reports issues, fix them and re-run.

- [ ] **Step 6: Commit**

```bash
git add src/multi-shot-interactivity-quiz/render.php src/multi-shot-interactivity-quiz/style.scss build/
git commit -m "feat: server-render question with Interactivity API directives

- render.php emits data-wp-interactive + data-wp-context
- Directives: data-wp-text, data-wp-on--click, data-wp-bind--disabled,
  data-wp-class--is-selected/is-correct/is-wrong
- Filters empty answers; shows notice for incomplete questions
- Front-end SCSS: answer list with hover/selected/correct/wrong states"
```

---

### Task 5: Store Skeleton (view.js)

**Files:**
- Modify: `src/multi-shot-interactivity-quiz/view.js`

- [ ] **Step 1: Write the store skeleton in view.js**

Replace the entire contents of `src/multi-shot-interactivity-quiz/view.js`:

```js
import { store } from '@wordpress/interactivity';

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

- [ ] **Step 2: Build to verify no errors**

Run:
```bash
npm run build
```
Expected: build succeeds. The `build/multi-shot-interactivity-quiz/view.js` is generated with the store code.

- [ ] **Step 3: Lint to verify code quality**

Run:
```bash
npm run lint:js
```
Expected: no errors.

- [ ] **Step 4: Verify the store namespace is in the build output**

Run:
```bash
grep 'multi-shot-interactivity-quiz' build/multi-shot-interactivity-quiz/view.js | head -5
```
Expected: prints lines containing the store namespace string, confirming the store code was bundled.

- [ ] **Step 5: Commit**

```bash
git add src/multi-shot-interactivity-quiz/view.js build/
git commit -m "feat: register Interactivity store skeleton

- store() with namespace 'multi-shot-interactivity-quiz'
- state.quizzes map (per-quiz aggregate, keyed by quizId)
- Empty selectAnswer and retry action stubs for Phase 2"
```

---

### Task 6: Final Build and Lint Verification

**Files:**
- None (verification only)

- [ ] **Step 1: Run full test suite**

Run:
```bash
npm test
```
Expected: PASS — all block.json tests pass.

- [ ] **Step 2: Run full build**

Run:
```bash
npm run build
```
Expected: build succeeds with no errors or warnings.

- [ ] **Step 3: Run JS lint**

Run:
```bash
npm run lint:js
```
Expected: no errors.

- [ ] **Step 4: Run CSS lint**

Run:
```bash
npm run lint:css
```
Expected: no errors.

- [ ] **Step 5: Verify build artifacts exist**

Run:
```bash
ls build/multi-shot-interactivity-quiz/
```
Expected: directory contains `block.json`, `index.js`, `index.css`, `render.php`, `view.js`, `style-index.css`, and `.asset.php` files.

- [ ] **Step 6: Verify the manifest has the new block name and attributes**

Run:
```bash
grep -A 5 "'attributes'" build/blocks-manifest.php
```
Expected: prints the attributes array with `quizId`, `question`, and `answers`.

- [ ] **Step 7: Commit any remaining build artifacts**

```bash
git add -A
git commit -m "chore: Phase 1 complete — build verified, all lint and tests pass"
```

---

## Phase 1 Exit Criteria Recap

- [x] `npm run build` passes
- [x] `npm test` passes (block.json structure)
- [x] `npm run lint:js` passes
- [x] `npm run lint:css` passes
- [x] Block name is `multi-shot-interactivity-quiz/question`
- [x] Attributes `quizId`, `question`, `answers` are defined
- [x] `edit.js` has TextControl question, answer rows with star/remove, Add answer button, Inspector quizId
- [x] `render.php` emits `data-wp-interactive` + `data-wp-context` with directives
- [x] `view.js` registers store with namespace `multi-shot-interactivity-quiz`
- [x] Store has empty `selectAnswer` and `retry` stubs

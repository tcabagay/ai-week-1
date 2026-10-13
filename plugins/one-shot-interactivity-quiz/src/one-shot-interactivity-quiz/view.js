/**
 * Use this file for JavaScript code that you want to run in the front-end
 * on posts/pages that contain this block.
 *
 * Uses the WordPress Interactivity API for client-side quiz interaction.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/interactivity-api/
 */

import { store, getContext } from '@wordpress/interactivity';

store( 'create-block/one-shot-interactivity-quiz', {
	state: {
		get isSelected() {
			const ctx = getContext();
			return ctx.isSelected;
		},
		get isCorrect() {
			const ctx = getContext();
			return ctx.isCorrect;
		},
		get selectedAnswer() {
			const ctx = getContext();
			return ctx.selectedAnswer;
		},
		get correctIndex() {
			const ctx = getContext();
			return ctx.correctIndex;
		},
	},
	actions: {
		selectAnswer( event ) {
			const ctx = getContext();
			if ( ctx.isSelected ) {
				return;
			}
			const index = parseInt(
				event.currentTarget.getAttribute( 'data-index' ),
				10
			);
			ctx.selectedAnswer = index;
			ctx.isSelected = true;
			ctx.isCorrect = index === ctx.correctIndex;
		},
	},
} );

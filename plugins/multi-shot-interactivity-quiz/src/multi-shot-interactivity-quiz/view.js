import { store, getContext } from '@wordpress/interactivity';

// Context refs stored outside state to avoid proxy wrapping.
const blockContexts = new Map();

const { state } = store( 'multi-shot-interactivity-quiz', {
	state: {
		quizzes: {},
		get isSelected() {
			const ctx = getContext();
			return ctx.selectedId === ctx.id;
		},
		get isCorrect() {
			const ctx = getContext();
			return ctx.locked && ctx.isCorrect;
		},
		get isWrong() {
			const ctx = getContext();
			return ctx.locked && ctx.selectedId === ctx.id && ! ctx.isCorrect;
		},
		get isPrimary() {
			const ctx = getContext();
			return ctx.blockIndex === 0;
		},
		get isFinished() {
			const ctx = getContext();
			return state.quizzes[ ctx.quizId ]?.finished ?? false;
		},
		get barText() {
			const ctx = getContext();
			const q = state.quizzes[ ctx.quizId ];
			if ( ! q ) {
				return '';
			}
			if ( q.finished ) {
				return `You scored ${ q.correct }/${ q.total }`;
			}
			return `${ q.answered } of ${ q.total } answered · ${ q.correct } correct`;
		},
		get resultMessage() {
			const ctx = getContext();
			const q = state.quizzes[ ctx.quizId ];
			if ( ! q || ! q.finished ) {
				return '';
			}
			if ( q.correct === q.total ) {
				return 'Perfect!';
			}
			if ( q.correct >= q.total * 0.6 ) {
				return 'Good try!';
			}
			return 'Keep practicing!';
		},
	},
	actions: {
		selectAnswer() {
			const context = getContext();
			if ( context.locked ) {
				return;
			}
			context.selectedId = context.id;
			context.locked = true;
			const quiz = state.quizzes[ context.quizId ];
			if ( ! quiz ) {
				return;
			}
			quiz.answered++;
			if ( context.isCorrect ) {
				quiz.correct++;
			}
			if ( quiz.answered === quiz.total ) {
				quiz.finished = true;
			}
		},
		retry() {
			const context = getContext();
			const quiz = state.quizzes[ context.quizId ];
			if ( ! quiz ) {
				return;
			}
			const blocks = blockContexts.get( context.quizId );
			if ( blocks ) {
				blocks.forEach( ( blockCtx ) => {
					blockCtx.selectedId = null;
					blockCtx.locked = false;
				} );
			}
			quiz.answered = 0;
			quiz.correct = 0;
			quiz.finished = false;
		},
	},
	callbacks: {
		registerQuestion() {
			const context = getContext();
			const quizId = context.quizId;
			if ( ! state.quizzes[ quizId ] ) {
				state.quizzes[ quizId ] = {
					answered: 0,
					correct: 0,
					total: 0,
					finished: false,
				};
			}
			const quiz = state.quizzes[ quizId ];
			context.blockIndex = quiz.total;
			quiz.total++;
			if ( ! blockContexts.has( quizId ) ) {
				blockContexts.set( quizId, [] );
			}
			blockContexts.get( quizId ).push( context );
		},
	},
} );

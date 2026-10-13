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
		expect( blockJson.viewScriptModule ).toBe( 'file:./view.js' );
	} );

	it( 'renders via PHP', () => {
		expect( blockJson.render ).toBe( 'file:./render.php' );
	} );
} );

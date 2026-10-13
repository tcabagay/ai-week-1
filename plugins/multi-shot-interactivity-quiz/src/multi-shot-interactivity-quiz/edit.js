import { __, sprintf } from '@wordpress/i18n';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { TextControl, Button } from '@wordpress/components';
import './editor.scss';

const MAX_ANSWERS = 6;
const MIN_ANSWERS = 2;

export default function Edit( { attributes, setAttributes } ) {
	const { quizId, question, answers } = attributes;
	const blockProps = useBlockProps();

	const updateQuestion = ( value ) => setAttributes( { question: value } );

	const updateAnswerText = ( index, text ) => {
		const newAnswers = [ ...answers ];
		newAnswers[ index ] = { ...newAnswers[ index ], text };
		setAttributes( { answers: newAnswers } );
	};

	const markCorrect = ( index ) => {
		const newAnswers = answers.map( ( a, i ) => ( {
			...a,
			isCorrect: i === index ? ! a.isCorrect : false,
		} ) );
		setAttributes( { answers: newAnswers } );
	};

	const addAnswer = () => {
		if ( answers.length >= MAX_ANSWERS ) {
			return;
		}
		setAttributes( {
			answers: [ ...answers, { text: '', isCorrect: false } ],
		} );
	};

	const removeAnswer = ( index ) => {
		if ( answers.length <= MIN_ANSWERS ) {
			return;
		}
		const wasCorrect = answers[ index ].isCorrect;
		const newAnswers = answers
			.filter( ( _, i ) => i !== index )
			.map( ( a ) => ( wasCorrect ? { ...a, isCorrect: false } : a ) );
		setAttributes( { answers: newAnswers } );
	};

	const hasCorrectAnswer = answers.some( ( a ) => a.isCorrect );

	return (
		<>
			<InspectorControls>
				<TextControl
					label={ __( 'Quiz ID', 'multi-shot-interactivity-quiz' ) }
					value={ quizId }
					onChange={ ( value ) => setAttributes( { quizId: value } ) }
					help={ __(
						'Group questions by giving them the same ID.',
						'multi-shot-interactivity-quiz'
					) }
				/>
			</InspectorControls>

			<div { ...blockProps }>
				<TextControl
					label={ __( 'Question', 'multi-shot-interactivity-quiz' ) }
					value={ question }
					onChange={ updateQuestion }
					placeholder={ __(
						'Enter your question…',
						'multi-shot-interactivity-quiz'
					) }
				/>

				<div className="msiq-answers">
					<p className="msiq-answers-label">
						{ __( 'Answers', 'multi-shot-interactivity-quiz' ) }
					</p>
					{ answers.map( ( answer, index ) => (
						<div className="msiq-answer-row" key={ index }>
							<TextControl
								value={ answer.text }
								onChange={ ( value ) =>
									updateAnswerText( index, value )
								}
								placeholder={ sprintf(
									/* translators: %d: answer number */
									__(
										'Answer %d',
										'multi-shot-interactivity-quiz'
									),
									index + 1
								) }
							/>
							<Button
								icon={
									answer.isCorrect
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
								disabled={ answers.length <= MIN_ANSWERS }
								className="msiq-remove-answer"
							/>
						</div>
					) ) }
				</div>

				<Button
					icon="plus"
					text={ __( 'Add answer', 'multi-shot-interactivity-quiz' ) }
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

/**
 * Retrieves the translation of text.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-i18n/
 */
import { __ } from '@wordpress/i18n';
/**
 * React hook that is used to mark the block wrapper element.
 * It provides all the necessary props like the class name.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-block-editor/#useblockprops
 */
import { useBlockProps, RichText } from '@wordpress/block-editor';
/**
 * WordPress components for building the editor UI.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/components/
 */
import { Button, TextControl, Icon } from '@wordpress/components';
import { starFilled, starEmpty, plus, trash } from '@wordpress/icons';

/**
 * Lets webpack process CSS, SASS or SCSS files referenced in JavaScript files.
 * Those files can contain any CSS code that gets applied to the editor.
 *
 * @see https://www.npmjs.com/package/@wordpress/scripts#using-css
 */
import './editor.scss';

/**
 * The edit function describes the structure of your block in the context of the
 * editor. This represents what the editor will render when the block is used.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#edit
 *
 * @param {Object}                  props               Block props.
 * @param {Object}                  props.attributes    Block attributes.
 * @param {(value: Object) => void} props.setAttributes Update attributes.
 *
 * @return {Element} Element to render.
 */
export default function Edit( { attributes, setAttributes } ) {
	const { question, answers } = attributes;
	const blockProps = useBlockProps( {
		className:
			'wp-block-create-block-one-shot-interactivity-quiz quiz-editor',
	} );

	const updateAnswer = ( index, text ) => {
		const newAnswers = answers.map( ( answer, i ) =>
			i === index ? { ...answer, text } : answer
		);
		setAttributes( { answers: newAnswers } );
	};

	const markCorrect = ( index ) => {
		const newAnswers = answers.map( ( answer, i ) => ( {
			...answer,
			isCorrect: i === index,
		} ) );
		setAttributes( { answers: newAnswers } );
	};

	const addAnswer = () => {
		setAttributes( {
			answers: [ ...answers, { text: '', isCorrect: false } ],
		} );
	};

	const removeAnswer = ( index ) => {
		const newAnswers = answers.filter( ( _, i ) => i !== index );
		setAttributes( { answers: newAnswers } );
	};

	return (
		<div { ...blockProps }>
			<RichText
				tagName="h3"
				className="quiz-question"
				placeholder={ __(
					'Enter your question…',
					'one-shot-interactivity-quiz'
				) }
				value={ question }
				onChange={ ( value ) => setAttributes( { question: value } ) }
				allowedFormats={ [] }
			/>

			<div className="quiz-answers">
				{ answers.map( ( answer, index ) => (
					<div key={ index } className="quiz-answer-row">
						<TextControl
							className="quiz-answer-input"
							value={ answer.text }
							placeholder={ __(
								'Answer choice…',
								'one-shot-interactivity-quiz'
							) }
							onChange={ ( value ) =>
								updateAnswer( index, value )
							}
						/>
						<Button
							className="quiz-star-toggle"
							icon={
								answer.isCorrect ? (
									<Icon icon={ starFilled } />
								) : (
									<Icon icon={ starEmpty } />
								)
							}
							label={
								answer.isCorrect
									? __(
											'Marked as correct answer',
											'one-shot-interactivity-quiz'
										)
									: __(
											'Mark as correct answer',
											'one-shot-interactivity-quiz'
										)
							}
							onClick={ () => markCorrect( index ) }
						/>
						{ answers.length > 2 && (
							<Button
								className="quiz-remove-answer"
								icon={ <Icon icon={ trash } /> }
								label={ __(
									'Remove answer',
									'one-shot-interactivity-quiz'
								) }
								onClick={ () => removeAnswer( index ) }
							/>
						) }
					</div>
				) ) }
			</div>

			<Button
				className="quiz-add-answer"
				icon={ <Icon icon={ plus } /> }
				variant="secondary"
				text={ __( 'Add Answer', 'one-shot-interactivity-quiz' ) }
				onClick={ addAnswer }
			/>
		</div>
	);
}

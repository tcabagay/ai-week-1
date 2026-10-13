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

$question = isset( $attributes['question'] ) ? $attributes['question'] : '';
$answers  = isset( $attributes['answers'] ) ? $attributes['answers'] : array();

$correct_index = -1;
foreach ( $answers as $i => $answer ) {
	if ( ! empty( $answer['isCorrect'] ) ) {
		$correct_index = $i;
		break;
	}
}

$initial_state = array(
	'isSelected'  => false,
	'selectedAnswer' => -1,
	'isCorrect'   => false,
	'correctIndex' => $correct_index,
	'answers'     => $answers,
);

$wrapper_attributes = get_block_wrapper_attributes(
	array(
		'class'                              => 'wp-block-create-block-one-shot-interactivity-quiz quiz-container',
		'data-wp-interactive'                => 'create-block/one-shot-interactivity-quiz',
		'data-wp-context'                    => wp_json_encode( $initial_state ),
		'data-wp-class--is-correct'          => 'state.isCorrect',
		'data-wp-class--is-incorrect'        => '!state.isCorrect && state.isSelected',
	)
);
?>
<div <?php echo $wrapper_attributes; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
	<h3 class="quiz-question"><?php echo wp_kses_post( $question ); ?></h3>

	<ul class="quiz-answers">
		<?php foreach ( $answers as $index => $answer ) : ?>
			<?php
			$answer_text = isset( $answer['text'] ) ? $answer['text'] : '';
			?>
			<li class="quiz-answer-item">
				<button
					type="button"
					class="quiz-answer-button"
					data-wp-on--click="actions.selectAnswer"
					data-wp-bind--disabled="state.isSelected"
					data-wp-class--is-selected="state.selectedAnswer === <?php echo (int) $index; ?>"
					data-wp-class--is-selected-correct="state.isSelected && state.selectedAnswer === <?php echo (int) $index; ?> && state.isCorrect"
					data-wp-class--is-selected-incorrect="state.isSelected && state.selectedAnswer === <?php echo (int) $index; ?> && !state.isCorrect"
					data-wp-class--is-faded="state.isSelected && state.selectedAnswer !== <?php echo (int) $index; ?>"
					data-wp-class--is-revealed-correct="state.isSelected && !state.isCorrect && <?php echo (int) $index; ?> === state.correctIndex"
					data-index="<?php echo (int) $index; ?>"
				>
					<span class="quiz-answer-text"><?php echo esc_html( $answer_text ); ?></span>

					<span
						class="quiz-icon quiz-icon-correct"
						data-wp-bind--hidden="!(state.isSelected && state.selectedAnswer === <?php echo (int) $index; ?> && state.isCorrect)"
					>
						&#10003;
					</span>
					<span
						class="quiz-icon quiz-icon-incorrect"
						data-wp-bind--hidden="!(state.isSelected && state.selectedAnswer === <?php echo (int) $index; ?> && !state.isCorrect)"
					>
						&#10007;
					</span>
					<span
						class="quiz-icon quiz-icon-revealed"
						data-wp-bind--hidden="!(state.isSelected && !state.isCorrect && <?php echo (int) $index; ?> === state.correctIndex)"
					>
						&#10003;
					</span>
				</button>
			</li>
		<?php endforeach; ?>
	</ul>
</div>

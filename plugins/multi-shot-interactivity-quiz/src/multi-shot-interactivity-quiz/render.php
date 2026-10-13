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
		data-wp-context='<?php echo wp_json_encode( $context, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT ); ?>'
		data-wp-init="callbacks.registerQuestion"
	>
		<p class="msiq-question" data-wp-text="context.question"><?php echo esc_html( $context['question'] ); ?></p>
		<ul class="msiq-answers">
			<?php foreach ( $renderable as $i => $answer ) : ?>
				<?php
				$answer_context = array(
					'id'        => $answer['id'],
					'isCorrect' => $answer['isCorrect'],
					'text'      => $answer['text'],
				);
				?>
				<li
					data-wp-context='<?php echo wp_json_encode( $answer_context, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT ); ?>'
					data-wp-on--click="actions.selectAnswer"
					data-wp-bind--disabled="context.locked"
					data-wp-class--is-selected="state.isSelected"
					data-wp-class--is-correct="state.isCorrect"
					data-wp-class--is-wrong="state.isWrong"
					class="msiq-answer"
				>
					<span data-wp-text="context.text">
						<?php echo esc_html( $answer['text'] ); ?>
					</span>
				</li>
			<?php endforeach; ?>
		</ul>
		<div
			class="msiq-sticky-bar"
			data-wp-class--msiq-hidden="!state.isPrimary"
			data-wp-class--msiq-finished="state.isFinished"
		>
			<div class="msiq-bar-info">
				<span class="msiq-progress" data-wp-text="state.barText">
					<?php esc_html_e( 'Loading…', 'multi-shot-interactivity-quiz' ); ?>
				</span>
				<span
					class="msiq-result-msg"
					data-wp-text="state.resultMessage"
					data-wp-class--msiq-hidden="!state.isFinished"
				></span>
			</div>
			<button
				type="button"
				class="msiq-retry-btn"
				data-wp-on--click="actions.retry"
				data-wp-class--msiq-hidden="!state.isFinished"
			>
				<?php esc_html_e( 'Retry', 'multi-shot-interactivity-quiz' ); ?>
			</button>
		</div>
	</div>
<?php endif; ?>

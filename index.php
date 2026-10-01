<?php
/**
 * Gabarit par défaut (pages, articles, panier, commande, compte).
 */

get_header();
?>
<main class="page-main wrap">
	<?php while ( have_posts() ) : the_post(); ?>
		<article <?php post_class( 'entry' ); ?>>
			<h1 class="page-title"><?php the_title(); ?></h1>
			<div class="entry-content"><?php the_content(); ?></div>
		</article>
	<?php endwhile; ?>
</main>
<?php
get_footer();

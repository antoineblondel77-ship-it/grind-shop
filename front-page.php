<?php
/**
 * Accueil — Drop 001.
 */

get_header();

$product = grind_featured_product();
$shop    = function_exists( 'wc_get_page_permalink' ) ? wc_get_page_permalink( 'shop' ) : home_url( '/' );
$link    = $product ? $product->get_permalink() : $shop;
$locked  = grind_drop_locked();
?>

<section class="hero" aria-label="Drop 001">
	<video class="hero__video" autoplay muted loop playsinline preload="auto" poster="<?php echo grind_asset( 'img/hero-poster.jpg' ); ?>">
		<source src="<?php echo grind_video( 'hero.mp4' ); ?>" type="video/mp4">
	</video>
	<div class="hero__shade"></div>
	<div class="grain"></div>

	<div class="hero__content">
		<p class="eyebrow"><?php echo $locked ? 'Drop 001 — Ouverture ' . esc_html( grind_drop_label() ) : 'Drop 001 — Le t-shirt du clip'; ?></p>
		<h1 class="hero__title">GRIND</h1>
		<?php if ( $locked ) : ?>
			<?php grind_countdown( 'countdown--hero' ); ?>
			<?php grind_waitlist_form( 'Me prévenir', 'accueil' ); ?>
		<?php else : ?>
			<div class="hero__ctas">
				<a class="btn btn--red" href="<?php echo esc_url( $link ); ?>">Shop le drop</a>
			</div>
		<?php endif; ?>
	</div>

	<div class="hero__corner hero__corner--l">Toulouse — 31</div>
	<div class="hero__corner hero__corner--r"><span class="rec"></span> Clip officiel</div>
</section>

<div class="ticker ticker--red" aria-hidden="true">
	<div class="ticker__track">
		<?php for ( $i = 0; $i < 4; $i++ ) : ?>
			<span>Parental Advisory</span><i>✦</i><span>Explicit Content</span><i>✦</i><span>GRIND</span><i>✦</i><span>Drop 001</span><i>✦</i>
		<?php endfor; ?>
	</div>
</div>

<?php
$sizes = $product ? grind_size_stock( $product ) : array();
$total = $product ? grind_total_stock( $product ) : null;
?>
<section class="tee3d" aria-label="Le t-shirt en 3D"<?php echo grind_tee_attrs(); // phpcs:ignore -- échappé dans la fonction ?>>
	<span id="drop" class="tee3d__anchor" aria-hidden="true"></span>
	<div class="tee3d__sticky">
		<div class="tee3d__bgtext" aria-hidden="true"><span>Parental Advisory — Explicit Content — Parental Advisory</span></div>
		<img class="tee3d__fallback" src="<?php echo grind_asset( 'img/tee-front.jpg' ); ?>" alt="T-shirt Parental Advisory, face avant">
		<canvas class="tee3d__canvas" aria-hidden="true"></canvas>
		<div class="grain"></div>

		<div class="tee3d__step tee3d__step--left" data-from="0.06" data-to="0.36">
			<p class="eyebrow">01 — Le visuel</p>
			<h3>Ciel en feu,<br>billets en l'air.</h3>
			<p>Une cover sur le cœur, et l'étiquette <em>Parental Advisory</em> répétée jusqu'à saturation.</p>
		</div>
		<div class="tee3d__step tee3d__step--right" data-from="0.48" data-to="0.66">
			<p class="eyebrow">02 — La coupe</p>
			<h3>Oversize.<br>Épaules tombantes.</h3>
			<p>Coupe large, tombé lourd. Il se porte comme dans le clip.</p>
		</div>
		<div class="tee3d__step tee3d__step--right" data-from="0.68" data-to="0.84">
			<p class="eyebrow">03 — Drop 001</p>
			<h3>Édition<br>limitée.</h3>
			<p>Tiré en série limitée pour la sortie du clip.</p>
		</div>
		<?php if ( $product ) : ?>
			<div class="tee3d__step tee3d__panel" data-from="0.84" data-to="2">
				<p class="eyebrow">Drop 001 / 001</p>
				<h2 class="tee3d__panel-title"><?php echo esc_html( $product->get_name() ); ?></h2>
				<p class="drop__price"><?php echo wp_kses_post( $product->get_price_html() ); ?></p>
				<div class="drop__desc"><?php echo wp_kses_post( wpautop( $product->get_short_description() ) ); ?></div>

				<?php if ( $sizes ) : ?>
					<p class="label">Taille</p>
					<div class="size-row">
						<?php foreach ( $sizes as $slug => $s ) :
							$note = grind_stock_note( $s );
							$cls  = $s['in_stock'] ? ( $note ? ' is-low' : '' ) : ' is-out';
							?>
							<?php if ( $s['in_stock'] ) : ?>
								<a class="size-chip<?php echo esc_attr( $cls ); ?>" href="<?php echo esc_url( add_query_arg( 'attribute_pa_taille', $slug, $link ) ); ?>"><?php echo esc_html( $s['name'] ); ?><?php if ( $note ) : ?><em><?php echo esc_html( $note ); ?></em><?php endif; ?></a>
							<?php else : ?>
								<span class="size-chip is-out"><?php echo esc_html( $s['name'] ); ?><em>Sold out</em></span>
							<?php endif; ?>
						<?php endforeach; ?>
					</div>
				<?php endif; ?>

				<?php if ( $locked ) : ?>
					<p class="label">Ouverture <?php echo esc_html( grind_drop_label() ); ?></p>
					<?php grind_countdown( 'countdown--inline' ); ?>
					<a class="btn btn--red btn--block" href="<?php echo esc_url( $link ); ?>">Me prévenir à l'ouverture</a>
				<?php else : ?>
					<a class="btn btn--red btn--block" href="<?php echo esc_url( $link ); ?>">Commander</a>
				<?php endif; ?>

				<dl class="specs">
					<div><dt>Coupe</dt><dd>Oversize</dd></div>
					<div><dt>Matière</dt><dd>100 % coton</dd></div>
					<div><dt>Impression</dt><dd>Face avant</dd></div>
					<div><dt>Stock</dt><dd><?php echo null === $total ? 'Limité' : esc_html( sprintf( '%d pièces', $total ) ); ?></dd></div>
				</dl>
			</div>
		<?php endif; ?>

		<div class="tee3d__progress" aria-hidden="true"><span></span></div>
		<p class="tee3d__hint" aria-hidden="true">Scroll</p>
	</div>
</section>

<section class="manifesto">
	<div class="grain"></div>
	<div class="wrap">
		<p class="eyebrow">Explicit content</p>
		<p class="manifesto__text">Des toits du centre aux parkings <em>du sous-sol</em>, on porte ce qu'on vit.</p>
	</div>
</section>

<?php $spotify = '2hbINRr5c5L1ghgMnPv25i'; ?>
<section class="listen" aria-labelledby="listen-title">
	<div class="listen__bgtext" aria-hidden="true">GUTS</div>
	<div class="wrap listen__grid">
		<a class="listen__deck" href="https://open.spotify.com/artist/<?php echo esc_attr( $spotify ); ?>" target="_blank" rel="noopener" aria-label="Écouter GUTS sur Spotify">
			<span class="listen__card">
				<span class="listen__vinyl" aria-hidden="true"><span class="listen__label">GUTS</span></span>
				<span class="listen__sleeve">
					<img src="<?php echo grind_asset( 'img/sleeve.jpg' ); ?>" alt="" loading="lazy">
					<span class="listen__glare"></span>
				</span>
				<span class="listen__sticker" aria-hidden="true"><b>Parental</b> Advisory <i>Explicit content</i></span>
			</span>
		</a>

		<div class="listen__body">
			<p class="eyebrow">En écoute</p>
			<h2 id="listen-title" class="listen__title">GUTS <em>sur Spotify</em></h2>
			<p class="listen__text">Le son derrière le drop. Abonne-toi pour ne rater aucune sortie.</p>
			<iframe class="listen__embed" src="https://open.spotify.com/embed/artist/<?php echo esc_attr( $spotify ); ?>?utm_source=generator&amp;theme=0" title="GUTS sur Spotify" height="352" loading="lazy" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"></iframe>
			<div class="listen__links">
				<a class="btn btn--ghost" href="https://open.spotify.com/artist/<?php echo esc_attr( $spotify ); ?>" target="_blank" rel="noopener">Spotify</a>
				<?php // TODO : remplacer « # » par les liens de l'artiste. ?>
				<a class="btn btn--ghost" href="#" target="_blank" rel="noopener">Apple Music</a>
				<a class="btn btn--ghost" href="#" target="_blank" rel="noopener">Deezer</a>
			</div>
		</div>
	</div>
</section>

<section class="cta-band">
	<div class="grain"></div>
	<div class="cta-band__content">
		<h2 class="cta-band__title">GRIND</h2>
		<a class="btn btn--red" href="<?php echo esc_url( $link ); ?>">Récupérer le tee</a>
	</div>
</section>

<?php
get_footer();

<?php
/**
 * Accueil — Drop 001.
 */

get_header();

$product = grind_featured_product();
$shop    = function_exists( 'wc_get_page_permalink' ) ? wc_get_page_permalink( 'shop' ) : home_url( '/' );
$link    = $product ? $product->get_permalink() : $shop;
?>

<section class="hero" aria-label="Drop 001">
	<video class="hero__video" autoplay muted loop playsinline preload="auto" poster="<?php echo grind_asset( 'img/hero-poster.jpg' ); ?>">
		<source src="<?php echo grind_asset( 'video/hero.mp4' ); ?>" type="video/mp4">
	</video>
	<div class="hero__shade"></div>
	<div class="grain"></div>

	<div class="hero__content">
		<p class="eyebrow">Drop 001 — Le t-shirt du clip</p>
		<h1 class="hero__title">GRIND</h1>
		<div class="hero__ctas">
			<a class="btn btn--red" href="<?php echo esc_url( $link ); ?>">Shop le drop</a>
			<a class="btn btn--ghost" href="#lookbook">Lookbook</a>
		</div>
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

<section class="tee3d" aria-label="Le t-shirt en 3D" data-print="<?php echo grind_asset( 'img/print.png' ); ?>">
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
		<div class="tee3d__step tee3d__step--cta" data-from="0.88" data-to="1.2">
			<?php if ( $product ) : ?>
				<p class="tee3d__price"><?php echo wp_kses_post( $product->get_price_html() ); ?></p>
			<?php endif; ?>
			<a class="btn btn--red" href="<?php echo esc_url( $link ); ?>">Choisir ma taille</a>
		</div>

		<div class="tee3d__progress" aria-hidden="true"><span></span></div>
		<p class="tee3d__hint" aria-hidden="true">Scroll</p>
	</div>
</section>

<?php if ( $product ) :
	$gallery = $product->get_gallery_image_ids();
	$hover   = $gallery ? wp_get_attachment_image_url( $gallery[0], 'large' ) : '';
	$sizes   = array();
	if ( $product->is_type( 'variable' ) ) {
		$attrs = $product->get_variation_attributes();
		$sizes = $attrs['pa_taille'] ?? array();
		$terms = get_terms( array( 'taxonomy' => 'pa_taille', 'hide_empty' => false, 'orderby' => 'menu_order' ) );
		$sizes = array_values( array_filter( wp_list_pluck( $terms, 'slug' ), fn( $s ) => in_array( $s, $sizes, true ) ) );
	}
	?>
<section id="drop" class="drop wrap">
	<a class="drop__media" href="<?php echo esc_url( $link ); ?>">
		<?php echo $product->get_image( 'large', array( 'class' => 'drop__img' ) ); ?>
		<?php if ( $hover ) : ?>
			<img class="drop__img drop__img--hover" src="<?php echo esc_url( $hover ); ?>" alt="" loading="lazy">
		<?php endif; ?>
		<span class="tag">Nouveau</span>
	</a>

	<div class="drop__info">
		<p class="eyebrow">Drop 001 / 001</p>
		<h2 class="display display--lg"><?php echo esc_html( $product->get_name() ); ?></h2>
		<p class="drop__price"><?php echo wp_kses_post( $product->get_price_html() ); ?></p>
		<div class="drop__desc"><?php echo wp_kses_post( wpautop( $product->get_short_description() ) ); ?></div>

		<?php if ( $sizes ) : ?>
			<p class="label">Taille</p>
			<div class="size-row">
				<?php foreach ( $sizes as $slug ) :
					$term = get_term_by( 'slug', $slug, 'pa_taille' );
					?>
					<a class="size-chip" href="<?php echo esc_url( add_query_arg( 'attribute_pa_taille', $slug, $link ) ); ?>"><?php echo esc_html( $term ? $term->name : strtoupper( $slug ) ); ?></a>
				<?php endforeach; ?>
			</div>
		<?php endif; ?>

		<a class="btn btn--red btn--block" href="<?php echo esc_url( $link ); ?>">Commander</a>

		<dl class="specs">
			<div><dt>Coupe</dt><dd>Oversize</dd></div>
			<div><dt>Matière</dt><dd>100 % coton</dd></div>
			<div><dt>Impression</dt><dd>Face avant</dd></div>
			<div><dt>Stock</dt><dd>Limité</dd></div>
		</dl>
	</div>
</section>
<?php endif; ?>

<section class="manifesto">
	<div class="grain"></div>
	<div class="wrap">
		<p class="eyebrow">Explicit content</p>
		<p class="manifesto__text">Des toits du centre aux parkings <em>du sous-sol</em>, on porte ce qu'on vit.</p>
	</div>
</section>

<section id="lookbook" class="lookbook wrap">
	<header class="section-head">
		<p class="eyebrow">Lookbook</p>
		<h2 class="display display--md">Vu dans le clip</h2>
	</header>

	<div class="lb-grid">
		<?php
		$shots = array(
			array( 'lb-antenna', 'Le tee, porté', 'lb--tall' ),
			array( 'lb-rooftop', 'Sur les toits', 'lb--wide' ),
			array( 'lb-tee', 'Détail du print', '' ),
			array( 'lb-parking', 'Niveau -2', '' ),
			array( 'lb-toulouse', 'La ville rose', 'lb--wide' ),
			array( 'lb-arches', 'Sous les arches', '' ),
			array( 'lb-fisheye', 'Sous-sol', '' ),
			array( 'lb-profile', 'Vue sur la ville', 'lb--wide' ),
		);
		foreach ( $shots as $s ) :
			?>
			<figure class="lb <?php echo esc_attr( $s[2] ); ?>">
				<img src="<?php echo grind_asset( 'img/' . $s[0] . '.jpg' ); ?>" alt="<?php echo esc_attr( $s[1] ); ?>" loading="lazy">
				<figcaption><?php echo esc_html( $s[1] ); ?></figcaption>
			</figure>
		<?php endforeach; ?>
	</div>
</section>

<section class="cta-band">
	<img src="<?php echo grind_asset( 'img/lb-closeup.jpg' ); ?>" alt="" loading="lazy">
	<div class="cta-band__shade"></div>
	<div class="cta-band__content">
		<h2 class="cta-band__title">GRIND</h2>
		<a class="btn btn--red" href="<?php echo esc_url( $link ); ?>">Récupérer le tee</a>
	</div>
</section>

<?php
get_footer();

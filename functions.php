<?php
/**
 * GRIND — fonctions du thème.
 */

defined( 'ABSPATH' ) || exit;

define( 'GRIND_VERSION', '0.3.7' );

require_once __DIR__ . '/inc/drop.php';

add_action( 'after_setup_theme', function () {
	add_theme_support( 'title-tag' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support( 'html5', array( 'search-form', 'gallery', 'caption', 'style', 'script' ) );
	add_theme_support( 'woocommerce', array(
		'thumbnail_image_width' => 800,
		'single_image_width'    => 1000,
		'product_grid'          => array( 'default_columns' => 3, 'default_rows' => 4 ),
	) );
	add_theme_support( 'wc-product-gallery-zoom' );
	add_theme_support( 'wc-product-gallery-lightbox' );
	add_theme_support( 'wc-product-gallery-slider' );

	register_nav_menus( array(
		'primary' => 'Menu principal',
		'footer'  => 'Menu pied de page',
	) );
} );

add_action( 'wp_enqueue_scripts', function () {
	$uri = get_template_directory_uri();
	wp_enqueue_style(
		'grind-fonts',
		'https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,300..800&family=Noto+Serif+Display:wdth,wght@62.5..100,300..800&display=swap',
		array(),
		null
	);
	wp_enqueue_style( 'grind-main', $uri . '/assets/css/main.css', array(), GRIND_VERSION );
	wp_enqueue_script( 'grind-main', $uri . '/assets/js/main.js', array(), GRIND_VERSION, true );
	wp_localize_script( 'grind-main', 'GRIND', array( 'waitlist' => esc_url_raw( rest_url( 'grind/v1/waitlist' ) ) ) );

	wp_register_script_module( 'grind-tee-core', $uri . '/assets/js/tee-core.js', array(), GRIND_VERSION );
	if ( is_front_page() ) {
		wp_enqueue_script_module( 'grind-tee3d', $uri . '/assets/js/tee3d.js', array( 'grind-tee-core' ), GRIND_VERSION );
		wp_enqueue_script_module( 'grind-player', $uri . '/assets/js/player.js', array(), GRIND_VERSION );
	}
	if ( function_exists( 'is_product' ) && is_product() ) {
		wp_enqueue_script_module( 'grind-viewer', $uri . '/assets/js/tee-viewer.js', array( 'grind-tee-core' ), GRIND_VERSION );
	}
} );

/** Data-attributes du tee 3D : print, et modèle .glb s'il existe (réglages dans tee.json). */
function grind_tee_attrs() {
	$dir   = get_template_directory() . '/assets/models/';
	$attrs = sprintf(
		' data-print="%s" data-print-alpha="%s"',
		grind_asset( 'img/print.png' ),
		grind_asset( 'img/print-alpha.png' )
	);
	if ( file_exists( $dir . 'tee.glb' ) ) {
		$attrs .= sprintf(
			' data-model="%s" data-model-options="%s"',
			grind_asset( 'models/tee.glb?v=' . filemtime( $dir . 'tee.glb' ) ),
			esc_attr( file_exists( $dir . 'tee.json' ) ? file_get_contents( $dir . 'tee.json' ) : '{}' )
		);
	}
	return $attrs;
}

/** URL d'un asset du thème. */
function grind_asset( $path ) {
	return esc_url( get_template_directory_uri() . '/assets/' . ltrim( $path, '/' ) );
}

/**
 * URL d'une vidéo : fichier local s'il est présent, sinon la copie servie par jsDelivr
 * (branche « media » du dépôt, gardée hors de main pour alléger la démo Playground).
 */
function grind_video( $file ) {
	if ( file_exists( get_template_directory() . '/assets/video/' . $file ) ) {
		return grind_asset( 'video/' . $file );
	}
	return esc_url( 'https://cdn.jsdelivr.net/gh/antoineblondel77-ship-it/grind-shop@media/' . $file );
}

/** Liens par défaut si aucun menu n'est assigné. */
function grind_menu_fallback() {
	$shop = function_exists( 'wc_get_page_permalink' ) ? wc_get_page_permalink( 'shop' ) : home_url( '/' );
	echo '<ul class="nav-list">';
	echo '<li><a href="' . esc_url( $shop ) . '">Boutique</a></li>';
	echo '<li><a href="' . esc_url( home_url( '/#drop' ) ) . '">Drop 001</a></li>';
	echo '<li><a href="' . esc_url( home_url( '/#lookbook' ) ) . '">Lookbook</a></li>';
	echo '</ul>';
}

/** Compteur panier, rafraîchi en AJAX par WooCommerce. */
function grind_cart_count() {
	$count = ( function_exists( 'WC' ) && WC()->cart ) ? WC()->cart->get_cart_contents_count() : 0;
	return '<span class="cart-count" data-count="' . esc_attr( $count ) . '">' . esc_html( $count ) . '</span>';
}
add_filter( 'woocommerce_add_to_cart_fragments', function ( $fragments ) {
	$fragments['span.cart-count'] = grind_cart_count();
	return $fragments;
} );

/** Produit vedette : premier produit publié (le drop en cours). */
function grind_featured_product() {
	if ( ! function_exists( 'wc_get_products' ) ) {
		return null;
	}
	$products = wc_get_products( array( 'limit' => 1, 'status' => 'publish', 'orderby' => 'date', 'order' => 'ASC' ) );
	return $products ? $products[0] : null;
}

/* ---------- WooCommerce ---------- */

// Pas de sidebar ni de fil d'Ariane par défaut.
remove_action( 'woocommerce_sidebar', 'woocommerce_get_sidebar', 10 );
remove_action( 'woocommerce_before_main_content', 'woocommerce_breadcrumb', 20 );

add_filter( 'loop_shop_columns', fn() => 3 );

// Survol façon "recto / porté" : 2e image de la galerie dans les cartes produit.
add_action( 'woocommerce_before_shop_loop_item_title', function () {
	global $product;
	$ids = $product ? $product->get_gallery_image_ids() : array();
	if ( $ids ) {
		echo wp_get_attachment_image( $ids[0], 'woocommerce_thumbnail', false, array( 'class' => 'card-hover-img', 'alt' => '' ) );
	}
}, 11 );

// Bouton des cartes : libellé court.
add_filter( 'woocommerce_product_add_to_cart_text', function ( $text, $product ) {
	return $product->is_type( 'variable' ) ? 'Choisir la taille' : $text;
}, 10, 2 );

// Onglets produit : on garde description + infos.
add_filter( 'woocommerce_product_tabs', function ( $tabs ) {
	unset( $tabs['reviews'] );
	return $tabs;
} );

// Pas de produits apparentés (un seul article pour l'instant).
remove_action( 'woocommerce_after_single_product_summary', 'woocommerce_output_related_products', 20 );

// Fiche produit : configurateur 3D + photos (onglets).
remove_action( 'woocommerce_before_single_product_summary', 'woocommerce_show_product_images', 20 );
add_action( 'woocommerce_before_single_product_summary', function () {
	?>
	<div class="product-media" data-view="3d">
		<div class="media-tabs" role="tablist" aria-label="Affichage">
			<button type="button" role="tab" aria-selected="true" data-view="3d">3D</button>
			<button type="button" role="tab" aria-selected="false" data-view="photos">Photos</button>
		</div>
		<div class="tee-viewer"<?php echo grind_tee_attrs(); // phpcs:ignore -- échappé dans la fonction ?>>
			<img class="tee-viewer__fallback" src="<?php echo grind_asset( 'img/tee-front.jpg' ); ?>" alt="">
			<canvas aria-label="T-shirt en 3D : glisser pour tourner, pincer ou molette pour zoomer"></canvas>
			<p class="tee-viewer__hint">Glisse pour tourner</p>
			<p class="tee-viewer__size" aria-live="polite"></p>
			<div class="tee-viewer__views">
				<button type="button" data-cam="front">Face</button>
				<button type="button" data-cam="back">Dos</button>
				<button type="button" data-cam="print">Zoom print</button>
			</div>
		</div>
		<?php woocommerce_show_product_images(); ?>
	</div>
	<?php
}, 20 );

// Petit badge "Drop 001" au-dessus du titre produit.
add_action( 'woocommerce_single_product_summary', function () {
	echo '<p class="eyebrow">Drop 001 — Édition limitée</p>';
}, 4 );

// Réassurance sous le bouton d'ajout au panier.
add_action( 'woocommerce_single_product_summary', function () {
	echo '<ul class="reassure"><li>Livraison offerte dès 60 €</li><li>Expédié sous 72 h depuis Toulouse</li><li>Retours sous 14 jours</li></ul>';
}, 35 );

<?php
/**
 * GRIND — fonctions du thème.
 */

defined( 'ABSPATH' ) || exit;

define( 'GRIND_VERSION', '0.2.0' );

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
	if ( is_front_page() ) {
		wp_enqueue_script_module( 'grind-tee3d', $uri . '/assets/js/tee3d.js', array(), GRIND_VERSION );
	}
} );

/** URL d'un asset du thème. */
function grind_asset( $path ) {
	return esc_url( get_template_directory_uri() . '/assets/' . ltrim( $path, '/' ) );
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

// Petit badge "Drop 001" au-dessus du titre produit.
add_action( 'woocommerce_single_product_summary', function () {
	echo '<p class="eyebrow">Drop 001 — Édition limitée</p>';
}, 4 );

// Réassurance sous le bouton d'ajout au panier.
add_action( 'woocommerce_single_product_summary', function () {
	echo '<ul class="reassure"><li>Livraison offerte dès 60 €</li><li>Expédié sous 72 h depuis Toulouse</li><li>Retours sous 14 jours</li></ul>';
}, 35 );

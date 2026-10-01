<?php
/**
 * Démo WordPress Playground : configure WooCommerce et crée le produit du Drop 001.
 * Appelé par blueprint.json, une fois WooCommerce et le thème installés.
 */

require_once ABSPATH . 'wp-admin/includes/image.php';

// Réglages boutique.
update_option( 'blogname', 'GRIND' );
update_option( 'blogdescription', 'Drop 001 — Parental Advisory' );
update_option( 'woocommerce_currency', 'EUR' );
update_option( 'woocommerce_default_country', 'FR' );
update_option( 'woocommerce_currency_pos', 'right_space' );
update_option( 'woocommerce_price_decimal_sep', ',' );
update_option( 'woocommerce_price_thousand_sep', ' ' );
update_option( 'woocommerce_coming_soon', 'no' );
update_option( 'woocommerce_store_pages_only', 'no' );
update_option( 'woocommerce_permalinks', array( 'product_base' => '/produit', 'category_base' => 'categorie', 'tag_base' => 'etiquette', 'attribute_base' => '', 'use_verbose_page_rules' => false ) );

// Pages WooCommerce en français.
$pages = array(
	'shop'      => array( 'Boutique', 'boutique' ),
	'cart'      => array( 'Panier', 'panier' ),
	'checkout'  => array( 'Commande', 'commande' ),
	'myaccount' => array( 'Mon compte', 'mon-compte' ),
);
foreach ( $pages as $key => $p ) {
	$id = wc_get_page_id( $key );
	if ( $id > 0 ) {
		wp_update_post( array( 'ID' => $id, 'post_title' => $p[0], 'post_name' => $p[1] ) );
	}
}
$cart = get_post( wc_get_page_id( 'cart' ) );
if ( $cart ) {
	wp_update_post( array(
		'ID'           => $cart->ID,
		'post_content' => str_replace(
			array( '>New in store<', '>You may be interested in&hellip;<', '>Your cart is currently empty!<' ),
			array( '>Le drop en cours<', '>Tu pourrais aimer&hellip;<', '>Ton panier est vide.<' ),
			$cart->post_content
		),
	) );
}

// Page d'accueil.
$home = wp_insert_post( array( 'post_type' => 'page', 'post_title' => 'Accueil', 'post_status' => 'publish' ) );
update_option( 'show_on_front', 'page' );
update_option( 'page_on_front', $home );

// Images : importées depuis le thème.
function grind_demo_import( $file ) {
	$upload = wp_upload_bits( basename( $file ), null, file_get_contents( $file ) );
	if ( ! empty( $upload['error'] ) ) {
		return 0;
	}
	$id = wp_insert_attachment( array(
		'post_mime_type' => 'image/jpeg',
		'post_title'     => 'T-shirt GRIND',
		'post_status'    => 'inherit',
	), $upload['file'] );
	update_post_meta( $id, '_wp_attachment_image_alt', 'T-shirt GRIND Parental Advisory' );
	wp_update_attachment_metadata( $id, wp_generate_attachment_metadata( $id, $upload['file'] ) );
	return $id;
}
$dir     = get_stylesheet_directory();
$front   = grind_demo_import( $dir . '/assets/img/tee-front.jpg' );
$gallery = array();
foreach ( array( 'grind-tee-porte-1', 'grind-tee-closeup', 'grind-tee-porte-2', 'grind-tee-porte-3' ) as $f ) {
	$gallery[] = grind_demo_import( $dir . '/playground/img/' . $f . '.jpg' );
}
$gallery[] = grind_demo_import( $dir . '/assets/img/tee-front-light.jpg' );

// Attribut "Taille".
$attr_id = wc_attribute_taxonomy_id_by_name( 'pa_taille' );
if ( ! $attr_id ) {
	$attr_id = wc_create_attribute( array( 'name' => 'Taille', 'slug' => 'taille', 'type' => 'select', 'order_by' => 'menu_order' ) );
	register_taxonomy( 'pa_taille', 'product' );
}
$sizes = array( 'S', 'M', 'L', 'XL', 'XXL' );
foreach ( $sizes as $i => $s ) {
	$t = term_exists( strtolower( $s ), 'pa_taille' ) ?: wp_insert_term( $s, 'pa_taille', array( 'slug' => strtolower( $s ) ) );
	update_term_meta( is_array( $t ) ? $t['term_id'] : $t, 'order', $i );
}

$cat    = term_exists( 'drop-001', 'product_cat' ) ?: wp_insert_term( 'Drop 001', 'product_cat', array( 'slug' => 'drop-001' ) );
$cat_id = is_array( $cat ) ? (int) $cat['term_id'] : (int) $cat;

// Produit.
$p = new WC_Product_Variable();
$p->set_name( 'T-shirt Parental Advisory' );
$p->set_slug( 'tshirt-grind-parental-advisory' );
$p->set_status( 'publish' );
$p->set_sku( 'GRIND-TEE-001' );
$p->set_category_ids( array( $cat_id ) );
$p->set_short_description( 'Le t-shirt porté dans le clip <strong>GRIND</strong>. Tee blanc oversize, cover rouge sang et cascade d\'étiquettes <em>Parental Advisory</em> sur le cœur. Tiré en série limitée.' );
$p->set_description(
	"<p>Pensé comme une pochette d'album qu'on porte sur soi : un ciel rouge, une silhouette seule, et le sticker que tout le monde connaît, répété jusqu'à saturation.</p>\n" .
	"<ul>\n<li>Coupe oversize, épaules tombantes</li>\n<li>100 % coton, maille épaisse</li>\n<li>Impression face avant</li>\n<li>Col côtelé</li>\n<li>Lavage 30 °C à l'envers, pas de sèche-linge</li>\n</ul>\n" .
	"<p><strong>Guide :</strong> taille normalement pour un effet oversize, prends une taille en dessous pour un fit classique.</p>"
);
$p->set_image_id( $front );
$p->set_gallery_image_ids( array_filter( $gallery ) );

$attr = new WC_Product_Attribute();
$attr->set_id( $attr_id );
$attr->set_name( 'pa_taille' );
$attr->set_options( array_map( fn( $s ) => get_term_by( 'slug', strtolower( $s ), 'pa_taille' )->term_id, $sizes ) );
$attr->set_visible( true );
$attr->set_variation( true );
$p->set_attributes( array( $attr ) );
$id = $p->save();

foreach ( $sizes as $s ) {
	$v = new WC_Product_Variation();
	$v->set_parent_id( $id );
	$v->set_attributes( array( 'pa_taille' => strtolower( $s ) ) );
	$v->set_regular_price( '35' );
	$v->set_sku( 'GRIND-TEE-001-' . $s );
	$v->set_manage_stock( true );
	$v->set_stock_quantity( 25 );
	$v->save();
}
WC_Product_Variable::sync( $id );
wc_delete_product_transients( $id );

// Permaliens : les règles seront régénérées à la prochaine requête (avec la base /produit).
update_option( 'permalink_structure', '/%postname%/' );
delete_option( 'rewrite_rules' );

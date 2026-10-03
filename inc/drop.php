<?php
/**
 * Drop : date d'ouverture, verrouillage de la boutique, compte à rebours,
 * liste d'attente et affichage du stock par taille.
 */

defined( 'ABSPATH' ) || exit;

const GRIND_LOW_STOCK = 5;

/* ---------- Réglage : Apparence > Personnaliser > Drop ---------- */

add_action( 'customize_register', function ( $wp_customize ) {
	$wp_customize->add_section( 'grind_drop', array(
		'title'       => 'Drop',
		'priority'    => 30,
		'description' => "Avant cette date, la boutique est verrouillée : compte à rebours et liste d'attente. Laisser vide pour ouvrir la boutique.",
	) );
	$wp_customize->add_setting( 'grind_drop_date', array(
		'default'           => '',
		'sanitize_callback' => fn( $v ) => ( '' === trim( (string) $v ) || false !== strtotime( $v ) ) ? trim( (string) $v ) : '',
	) );
	$wp_customize->add_control( 'grind_drop_date', array(
		'section' => 'grind_drop',
		'label'   => 'Date et heure du drop',
		'type'    => 'datetime-local',
	) );
} );

/** Horodatage du drop (0 si aucune date). La date est saisie dans le fuseau du site. */
function grind_drop_timestamp() {
	$value = get_theme_mod( 'grind_drop_date', '' );
	if ( ! $value ) {
		return 0;
	}
	$date = date_create( $value, wp_timezone() );
	return $date ? $date->getTimestamp() : 0;
}

/** La boutique est-elle encore fermée ? */
function grind_drop_locked() {
	$ts = grind_drop_timestamp();
	return $ts && time() < $ts;
}

/** Date lisible : « lundi 6 octobre à 20h ». */
function grind_drop_label() {
	$ts = grind_drop_timestamp();
	return $ts ? wp_date( 'l j F \à G\hi', $ts ) : '';
}

/* ---------- Verrouillage ---------- */

add_filter( 'woocommerce_is_purchasable', fn( $ok ) => grind_drop_locked() ? false : $ok );
add_filter( 'woocommerce_variation_is_purchasable', fn( $ok ) => grind_drop_locked() ? false : $ok );

add_filter( 'woocommerce_product_add_to_cart_text', function ( $text ) {
	return grind_drop_locked() ? 'Bientôt' : $text;
}, 20 );

// Fiche produit : le formulaire d'achat laisse place au compte à rebours.
add_action( 'woocommerce_single_product_summary', function () {
	if ( grind_drop_locked() ) {
		remove_action( 'woocommerce_single_product_summary', 'woocommerce_template_single_add_to_cart', 30 );
		add_action( 'woocommerce_single_product_summary', 'grind_drop_box', 30 );
	}
}, 1 );

function grind_drop_box() {
	global $product;
	echo '<div class="drop-box">';
	echo '<p class="eyebrow">Ouverture ' . esc_html( grind_drop_label() ) . '</p>';
	grind_countdown();
	if ( $product ) {
		grind_size_preview( $product );
	}
	grind_waitlist_form( 'Me prévenir', 'produit' );
	echo '</div>';
}

/* ---------- Composants ---------- */

/** Compte à rebours (rafraîchit la page à l'ouverture). */
function grind_countdown( $class = '' ) {
	$ts = grind_drop_timestamp();
	if ( ! $ts ) {
		return;
	}
	$left  = max( 0, $ts - time() );
	$units = array(
		'd' => array( intdiv( $left, DAY_IN_SECONDS ), 'Jours' ),
		'h' => array( intdiv( $left % DAY_IN_SECONDS, HOUR_IN_SECONDS ), 'Heures' ),
		'm' => array( intdiv( $left % HOUR_IN_SECONDS, MINUTE_IN_SECONDS ), 'Min' ),
		's' => array( $left % MINUTE_IN_SECONDS, 'Sec' ),
	);
	printf( '<div class="countdown %s" data-drop="%d" role="timer" aria-label="Temps restant avant le drop">', esc_attr( $class ), (int) $ts * 1000 );
	foreach ( $units as $key => $u ) {
		printf( '<div class="countdown__unit"><span data-u="%s">%02d</span><small>%s</small></div>', esc_attr( $key ), (int) $u[0], esc_html( $u[1] ) );
	}
	echo '</div>';
}

/** Formulaire de liste d'attente (envoyé en AJAX à l'API REST). */
function grind_waitlist_form( $button = 'Me prévenir', $source = 'site' ) {
	$id = wp_unique_id( 'waitlist-' );
	?>
	<form class="waitlist" data-source="<?php echo esc_attr( $source ); ?>" novalidate>
		<label class="sr-only" for="<?php echo esc_attr( $id ); ?>">Adresse e-mail</label>
		<input id="<?php echo esc_attr( $id ); ?>" type="email" name="email" placeholder="ton@email.fr" autocomplete="email" required>
		<input class="waitlist__hp" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
		<button type="submit" class="btn btn--red"><?php echo esc_html( $button ); ?></button>
		<p class="waitlist__msg" role="status"></p>
	</form>
	<?php
}

/* ---------- Stock par taille ---------- */

/** [ slug => [ name, qty|null, in_stock ] ] dans l'ordre des tailles. */
function grind_size_stock( $product ) {
	if ( ! $product || ! $product->is_type( 'variable' ) ) {
		return array();
	}
	$out = array();
	foreach ( $product->get_children() as $vid ) {
		$v    = wc_get_product( $vid );
		$slug = $v ? $v->get_attributes()['pa_taille'] ?? '' : '';
		if ( ! $slug ) {
			continue;
		}
		$term         = get_term_by( 'slug', $slug, 'pa_taille' );
		$out[ $slug ] = array(
			'name'     => $term ? $term->name : strtoupper( $slug ),
			'qty'      => $v->managing_stock() ? (int) $v->get_stock_quantity() : null,
			'in_stock' => $v->is_in_stock(),
			'order'    => $term ? (int) get_term_meta( $term->term_id, 'order', true ) : 0,
		);
	}
	uasort( $out, fn( $a, $b ) => $a['order'] <=> $b['order'] );
	return $out;
}

/** Total restant (null si stock non géré). */
function grind_total_stock( $product ) {
	$sum = 0;
	foreach ( grind_size_stock( $product ) as $s ) {
		if ( null === $s['qty'] ) {
			return null;
		}
		$sum += max( 0, $s['qty'] );
	}
	return $sum;
}

/** Étiquette d'urgence pour une taille. */
function grind_stock_note( $s ) {
	if ( ! $s['in_stock'] ) {
		return 'Sold out';
	}
	if ( null !== $s['qty'] && $s['qty'] <= GRIND_LOW_STOCK ) {
		return 'Plus que ' . $s['qty'];
	}
	return '';
}

/** Tailles en lecture seule (boutique fermée) avec l'état du stock. */
function grind_size_preview( $product ) {
	$sizes = grind_size_stock( $product );
	if ( ! $sizes ) {
		return;
	}
	echo '<div class="size-row size-row--preview">';
	foreach ( $sizes as $s ) {
		$note = grind_stock_note( $s );
		printf(
			'<span class="size-chip%s">%s%s</span>',
			$s['in_stock'] ? ( $note ? ' is-low' : '' ) : ' is-out',
			esc_html( $s['name'] ),
			$note ? '<em>' . esc_html( $note ) . '</em>' : ''
		);
	}
	echo '</div>';
}

/* ---------- Liste d'attente : stockage + API ---------- */

add_action( 'init', function () {
	register_post_type( 'grind_waitlist', array(
		'labels'          => array(
			'name'          => "Liste d'attente",
			'singular_name' => 'Inscription',
			'menu_name'     => "Liste d'attente",
			'all_items'     => 'Inscriptions',
		),
		'public'          => false,
		'show_ui'         => true,
		'show_in_menu'    => true,
		'menu_icon'       => 'dashicons-email-alt',
		'supports'        => array( 'title' ),
		'capability_type' => 'post',
		'capabilities'    => array( 'create_posts' => 'do_not_allow' ),
		'map_meta_cap'    => true,
	) );
} );

add_filter( 'manage_grind_waitlist_posts_columns', fn( $cols ) => array(
	'cb'     => $cols['cb'],
	'title'  => 'E-mail',
	'source' => 'Formulaire',
	'date'   => 'Inscrit le',
) );
add_action( 'manage_grind_waitlist_posts_custom_column', function ( $col, $id ) {
	if ( 'source' === $col ) {
		echo esc_html( get_post_meta( $id, '_source', true ) );
	}
}, 10, 2 );

add_action( 'rest_api_init', function () {
	register_rest_route( 'grind/v1', '/waitlist', array(
		'methods'             => 'POST',
		'permission_callback' => '__return_true',
		'callback'            => function ( WP_REST_Request $req ) {
			if ( '' !== (string) $req->get_param( 'website' ) ) {
				return array( 'ok' => true ); // pot de miel : robot, on ignore en silence
			}
			$email = sanitize_email( (string) $req->get_param( 'email' ) );
			if ( ! is_email( $email ) ) {
				return new WP_Error( 'invalid_email', 'Adresse e-mail invalide.', array( 'status' => 400 ) );
			}
			$exists = get_posts( array(
				'post_type'   => 'grind_waitlist',
				'post_status' => 'private',
				'title'       => $email,
				'fields'      => 'ids',
				'numberposts' => 1,
			) );
			if ( ! $exists ) {
				$id = wp_insert_post( array(
					'post_type'   => 'grind_waitlist',
					'post_status' => 'private',
					'post_title'  => $email,
				) );
				update_post_meta( $id, '_source', sanitize_key( (string) $req->get_param( 'source' ) ) );
			}
			return array( 'ok' => true );
		},
	) );
} );

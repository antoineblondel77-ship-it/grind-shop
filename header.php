<!doctype html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<meta name="theme-color" content="#0b0a0a">
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<a class="skip-link" href="#content">Aller au contenu</a>

<div class="announce" aria-label="Annonces">
	<div class="announce__track">
		<?php for ( $i = 0; $i < 2; $i++ ) : ?>
			<span>Drop 001 disponible</span><span>✦</span>
			<span>Livraison offerte dès 60 €</span><span>✦</span>
			<span>Parental Advisory — Explicit Content</span><span>✦</span>
			<span>Édition limitée</span><span>✦</span>
		<?php endfor; ?>
	</div>
</div>

<header class="site-header<?php echo is_front_page() ? ' site-header--overlay' : ''; ?>">
	<div class="site-header__inner">
		<button class="burger" aria-label="Menu" aria-expanded="false" aria-controls="site-nav"><span></span><span></span></button>

		<nav id="site-nav" class="site-nav" aria-label="Menu principal">
			<?php
			wp_nav_menu( array(
				'theme_location' => 'primary',
				'container'      => false,
				'menu_class'     => 'nav-list',
				'fallback_cb'    => 'grind_menu_fallback',
				'depth'          => 1,
			) );
			?>
		</nav>

		<a class="logo" href="<?php echo esc_url( home_url( '/' ) ); ?>" aria-label="GRIND — accueil">GRIND</a>

		<div class="site-tools">
			<?php if ( function_exists( 'wc_get_page_permalink' ) ) : ?>
				<a class="tool tool--account" href="<?php echo esc_url( wc_get_page_permalink( 'myaccount' ) ); ?>">Compte</a>
				<a class="tool tool--cart" href="<?php echo esc_url( wc_get_cart_url() ); ?>">Panier <?php echo grind_cart_count(); // phpcs:ignore ?></a>
			<?php endif; ?>
		</div>
	</div>
</header>

<div id="content" class="site-content">

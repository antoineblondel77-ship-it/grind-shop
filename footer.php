</div><!-- #content -->

<footer class="site-footer">
	<div class="wrap">
		<div class="footer-news">
			<p class="eyebrow">Prochain drop</p>
			<h2 class="display display--md">Sois là avant<br>tout le monde.</h2>
			<?php grind_waitlist_form( "S'inscrire", 'footer' ); ?>
		</div>

		<div class="footer-grid">
			<div>
				<a class="logo logo--footer" href="<?php echo esc_url( home_url( '/' ) ); ?>">GRIND</a>
				<p class="muted">Toulouse — 31.<br>Merch officiel.</p>
			</div>
			<div>
				<p class="footer-title">Boutique</p>
				<ul>
					<?php if ( function_exists( 'wc_get_page_permalink' ) ) : ?>
						<li><a href="<?php echo esc_url( grind_product_url() ); ?>">Le tee</a></li>
						<li><a href="<?php echo esc_url( wc_get_cart_url() ); ?>">Panier</a></li>
						<li><a href="<?php echo esc_url( wc_get_page_permalink( 'myaccount' ) ); ?>">Mon compte</a></li>
					<?php endif; ?>
				</ul>
			</div>
			<div>
				<p class="footer-title">Infos</p>
				<ul>
					<li><a href="#">Livraison &amp; retours</a></li>
					<li><a href="#">Guide des tailles</a></li>
					<li><a href="<?php echo esc_url( get_privacy_policy_url() ); ?>">Confidentialité</a></li>
					<li><a href="#">Contact</a></li>
				</ul>
			</div>
			<div>
				<p class="footer-title">Suivre</p>
				<ul>
					<li><a href="#">Instagram</a></li>
					<li><a href="#">YouTube</a></li>
					<li><a href="#">TikTok</a></li>
					<li><a href="#">Spotify</a></li>
				</ul>
			</div>
		</div>

		<div class="footer-bottom">
			<span>© <?php echo esc_html( date( 'Y' ) ); ?> GRIND. Tous droits réservés.</span>
			<span class="pa-badge" aria-hidden="true"><b>Parental</b><strong>Advisory</strong><b>Explicit content</b></span>
		</div>
	</div>
</footer>

<?php wp_footer(); ?>
</body>
</html>

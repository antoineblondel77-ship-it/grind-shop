<?php
/**
 * Lecteur plein écran du clip, ouvert par [data-player-open].
 * Les moments où le tee apparaît déclenchent une carte d'achat (data-moments, en secondes).
 */

$product = grind_featured_product();
$link    = $product ? $product->get_permalink() : '';
?>
<div class="player" role="dialog" aria-modal="true" aria-label="Clip GRIND" hidden
	data-moments="18-21,29-32,45-49,60-64,67-71,89-92,116-120,143-148">
	<div class="player__curtain"></div>
	<div class="player__intro" aria-hidden="true">
		<span class="player__intro-title">GRIND</span>
	</div>
	<div class="player__bars" aria-hidden="true"><span></span><span></span></div>

	<div class="player__stage">
		<video class="player__video" preload="none" playsinline poster="<?php echo grind_asset( 'img/clip-poster.jpg' ); ?>">
			<source src="<?php echo grind_video( 'clip.mp4' ); ?>" type="video/mp4">
		</video>
	</div>

	<header class="player__top">
		<p class="player__title"><strong>GRIND</strong> — Clip officiel</p>
		<button type="button" class="player__close" data-player-close>Fermer <span aria-hidden="true">✕</span></button>
	</header>

	<?php if ( $product ) : ?>
		<aside class="player__shop" aria-live="polite">
			<?php echo $product->get_image( 'thumbnail', array( 'class' => 'player__shop-img', 'alt' => '' ) ); ?>
			<div>
				<p class="eyebrow">Le tee du clip</p>
				<p class="player__shop-name"><?php echo esc_html( $product->get_name() ); ?></p>
				<p class="player__shop-price"><?php echo wp_kses_post( $product->get_price_html() ); ?></p>
			</div>
			<a class="btn btn--red" href="<?php echo esc_url( $link ); ?>" data-player-shop>Voir le tee</a>
			<button type="button" class="player__shop-x" aria-label="Masquer">✕</button>
		</aside>
	<?php endif; ?>

	<div class="player__controls">
		<button type="button" class="player__btn" data-act="play" aria-label="Pause">
			<svg viewBox="0 0 24 24" aria-hidden="true"><path class="i-pause" d="M7 5h3v14H7zM14 5h3v14h-3z"/><path class="i-play" d="M8 5v14l11-7z"/></svg>
		</button>
		<div class="player__progress" role="slider" tabindex="0" aria-label="Position dans le clip" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
			<div class="player__buffer"></div>
			<div class="player__played"></div>
			<div class="player__marks"></div>
		</div>
		<span class="player__time">0:00 / 0:00</span>
		<button type="button" class="player__btn" data-act="mute" aria-label="Couper le son">
			<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path class="i-wave" d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="1.8"/><path class="i-x" d="M16 9l5 6M21 9l-5 6" stroke="currentColor" stroke-width="1.8"/></svg>
		</button>
		<button type="button" class="player__btn" data-act="fs" aria-label="Plein écran">
			<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" fill="none" stroke="currentColor" stroke-width="2"/></svg>
		</button>
	</div>
</div>

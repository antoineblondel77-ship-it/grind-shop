/**
 * GRIND — lecteur du clip.
 * Ouverture : rideau circulaire depuis le bouton, titre qui fonce vers la caméra,
 * flash, puis le clip (son en fondu). Carte d'achat quand le tee est à l'écran.
 */
const player = document.querySelector( '.player' );
if ( player ) init( player );

function init( player ) {
	const video = player.querySelector( '.player__video' );
	const curtain = player.querySelector( '.player__curtain' );
	const intro = player.querySelector( '.player__intro' );
	const title = player.querySelector( '.player__intro-title' );
	const stage = player.querySelector( '.player__stage' );
	const shop = player.querySelector( '.player__shop' );
	const progress = player.querySelector( '.player__progress' );
	const played = player.querySelector( '.player__played' );
	const buffer = player.querySelector( '.player__buffer' );
	const marks = player.querySelector( '.player__marks' );
	const time = player.querySelector( '.player__time' );
	const btnPlay = player.querySelector( '[data-act="play"]' );
	const btnMute = player.querySelector( '[data-act="mute"]' );
	const btnFs = player.querySelector( '[data-act="fs"]' );
	const heroVideo = document.querySelector( '.hero__video' );
	const reduced = window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches;
	const EASE = 'cubic-bezier(.7,0,.2,1)';

	const moments = ( player.dataset.moments || '' ).split( ',' ).filter( Boolean ).map( ( r ) => r.split( '-' ).map( Number ) );
	let opener = null, busy = false, shopDismissed = false, hideTimer = 0, ox = 0, oy = 0;
	const circle = ( r ) => `circle(${ r }px at ${ ox }px ${ oy }px)`;

	/* ---------- Ouverture / fermeture ---------- */

	document.addEventListener( 'click', ( e ) => {
		const btn = e.target.closest( '[data-player-open]' );
		if ( btn ) open( btn );
	} );
	player.querySelector( '[data-player-close]' ).addEventListener( 'click', close );

	async function open( btn ) {
		if ( busy || ! player.hidden ) return;
		busy = true;
		opener = btn;
		const r = btn.getBoundingClientRect();
		ox = r.left + r.width / 2;
		oy = r.top + r.height / 2;

		// Le son démarre dans le geste utilisateur (sinon bloqué), en fondu.
		video.currentTime = 0;
		video.muted = false;
		video.volume = 0;
		video.play().catch( () => {
			video.muted = true;
			video.play();
		} );
		fadeVolume( 1, reduced ? 0 : 1800 );
		heroVideo?.pause();

		player.hidden = false;
		player.classList.add( 'is-intro' );
		document.documentElement.classList.add( 'player-on' );
		syncButtons();

		if ( reduced ) {
			curtain.style.clipPath = 'none';
			stage.animate( [ { opacity: 0 }, { opacity: 1 } ], { duration: 300, fill: 'forwards' } );
		} else {
			const R = Math.hypot( Math.max( ox, innerWidth - ox ), Math.max( oy, innerHeight - oy ) );
			curtain.animate(
				[ { clipPath: circle( 0 ) }, { clipPath: circle( R ) } ],
				{ duration: 800, easing: EASE, fill: 'forwards' }
			);
			title.animate(
				[
					{ opacity: 0, transform: 'scale(.82)', filter: 'blur(14px)' },
					{ opacity: 1, transform: 'scale(1)', filter: 'blur(0)', offset: 0.38 },
					{ opacity: 1, transform: 'scale(1.08)', filter: 'blur(0)', offset: 0.55 },
					{ opacity: 0, transform: 'scale(14)', filter: 'blur(6px)' },
				],
				{ duration: 1700, delay: 200, easing: 'cubic-bezier(.55,0,.2,1)', fill: 'forwards' }
			);
			player.querySelector( '.player__bars' ).animate(
				[ { opacity: 0 }, { opacity: 1, offset: 0.3 }, { opacity: 1, offset: 0.75 }, { opacity: 0 } ],
				{ duration: 1900, delay: 150, fill: 'forwards' }
			);
			await stage.animate(
				[
					{ opacity: 0, transform: 'scale(1.18)', filter: 'blur(18px) brightness(2.4) saturate(0)' },
					{ opacity: 1, transform: 'scale(1)', filter: 'blur(0) brightness(1) saturate(1)' },
				],
				{ duration: 900, delay: 1150, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'forwards' }
			).finished;
		}

		player.classList.remove( 'is-intro' );
		player.classList.add( 'is-open' );
		intro.hidden = true;
		player.querySelector( '[data-player-close]' ).focus( { preventScroll: true } );
		wake();
		busy = false;
	}

	async function close() {
		if ( busy || player.hidden ) return;
		busy = true;
		if ( document.fullscreenElement ) await document.exitFullscreen().catch( () => {} );
		player.classList.remove( 'is-open', 'ui-hidden' );
		player.classList.add( 'is-closing' );
		fadeVolume( 0, reduced ? 0 : 500 ).then( () => video.pause() );

		if ( ! reduced ) {
			stage.animate(
				[ { opacity: 1, transform: 'scale(1)', filter: 'blur(0)' }, { opacity: 0, transform: 'scale(.9)', filter: 'blur(10px)' } ],
				{ duration: 450, easing: EASE, fill: 'forwards' }
			);
			const R = Math.hypot( Math.max( ox, innerWidth - ox ), Math.max( oy, innerHeight - oy ) );
			await curtain.animate(
				[ { clipPath: circle( R ) }, { clipPath: circle( 0 ) } ],
				{ duration: 700, delay: 250, easing: EASE, fill: 'forwards' }
			).finished;
		}

		document.documentElement.classList.remove( 'player-on' );
		player.classList.remove( 'is-closing' );
		player.hidden = true;
		intro.hidden = false;
		shop?.classList.remove( 'is-on' );
		player.getAnimations( { subtree: true } ).forEach( ( a ) => a.cancel() );
		heroVideo?.play().catch( () => {} );
		opener?.focus( { preventScroll: true } );
		busy = false;
	}

	function fadeVolume( to, ms ) {
		return new Promise( ( resolve ) => {
			const from = video.volume, t0 = performance.now();
			( function step( now ) {
				const k = ms ? Math.min( 1, ( now - t0 ) / ms ) : 1;
				try { video.volume = from + ( to - from ) * k; } catch ( e ) {}
				k < 1 ? requestAnimationFrame( step ) : resolve();
			} )( t0 );
		} );
	}

	/* ---------- Contrôles ---------- */

	const fmt = ( s ) => `${ Math.floor( s / 60 ) }:${ String( Math.floor( s % 60 ) ).padStart( 2, '0' ) }`;
	const toggle = () => ( video.paused ? video.play() : video.pause() );

	btnPlay.addEventListener( 'click', toggle );
	stage.addEventListener( 'click', toggle );
	btnMute.addEventListener( 'click', () => {
		video.muted = ! video.muted;
		if ( ! video.muted && video.volume === 0 ) video.volume = 1;
	} );
	btnFs.addEventListener( 'click', () => {
		if ( document.fullscreenElement ) document.exitFullscreen();
		else if ( player.requestFullscreen ) player.requestFullscreen();
		else video.webkitEnterFullscreen?.();
	} );

	function syncButtons() {
		btnPlay.classList.toggle( 'is-paused', video.paused );
		btnPlay.setAttribute( 'aria-label', video.paused ? 'Lecture' : 'Pause' );
		btnMute.classList.toggle( 'is-muted', video.muted );
		btnMute.setAttribute( 'aria-label', video.muted ? 'Activer le son' : 'Couper le son' );
		player.classList.toggle( 'is-paused', video.paused );
	}
	[ 'play', 'pause', 'volumechange' ].forEach( ( ev ) => video.addEventListener( ev, syncButtons ) );
	video.addEventListener( 'pause', wake );
	video.addEventListener( 'ended', () => shop?.classList.add( 'is-on' ) );

	video.addEventListener( 'loadedmetadata', () => {
		marks.innerHTML = moments.map( ( [ a, b ] ) =>
			`<span style="left:${ ( a / video.duration ) * 100 }%;width:${ ( ( b - a ) / video.duration ) * 100 }%"></span>`
		).join( '' );
	} );

	video.addEventListener( 'timeupdate', () => {
		const d = video.duration || 0, t = video.currentTime;
		played.style.transform = `scaleX(${ d ? t / d : 0 })`;
		time.textContent = `${ fmt( t ) } / ${ fmt( d ) }`;
		progress.setAttribute( 'aria-valuenow', d ? Math.round( ( t / d ) * 100 ) : 0 );
		if ( video.buffered.length ) buffer.style.transform = `scaleX(${ video.buffered.end( video.buffered.length - 1 ) / d })`;
		if ( shop && ! shopDismissed && ! video.ended ) {
			shop.classList.toggle( 'is-on', moments.some( ( [ a, b ] ) => t >= a && t <= b ) );
		}
	} );

	// Barre de progression : clic, glisser, flèches.
	const seekAt = ( x ) => {
		const r = progress.getBoundingClientRect();
		video.currentTime = Math.max( 0, Math.min( 1, ( x - r.left ) / r.width ) ) * ( video.duration || 0 );
	};
	progress.addEventListener( 'pointerdown', ( e ) => {
		progress.setPointerCapture( e.pointerId );
		seekAt( e.clientX );
		const move = ( ev ) => seekAt( ev.clientX );
		progress.addEventListener( 'pointermove', move );
		progress.addEventListener( 'pointerup', () => progress.removeEventListener( 'pointermove', move ), { once: true } );
	} );
	progress.addEventListener( 'keydown', ( e ) => {
		if ( e.key === 'ArrowRight' ) video.currentTime += 5;
		if ( e.key === 'ArrowLeft' ) video.currentTime -= 5;
	} );

	// Carte d'achat.
	shop?.querySelector( '.player__shop-x' ).addEventListener( 'click', () => {
		shopDismissed = true;
		shop.classList.remove( 'is-on' );
	} );
	shop?.querySelector( '[data-player-shop]' ).addEventListener( 'click', () => video.pause() );

	// Clavier : Échap, espace, M, F, piège à focus.
	player.addEventListener( 'keydown', ( e ) => {
		if ( e.key === 'Escape' && ! document.fullscreenElement ) return close();
		if ( e.target === progress ) return;
		if ( e.key === ' ' && e.target.tagName !== 'BUTTON' && e.target.tagName !== 'A' ) { e.preventDefault(); toggle(); }
		if ( e.key === 'm' || e.key === 'M' ) btnMute.click();
		if ( e.key === 'f' || e.key === 'F' ) btnFs.click();
		if ( e.key === 'Tab' ) {
			const items = [ ...player.querySelectorAll( 'button, a[href], [tabindex="0"]' ) ].filter( ( el ) => el.offsetParent );
			const first = items[ 0 ], last = items[ items.length - 1 ];
			if ( e.shiftKey && document.activeElement === first ) { e.preventDefault(); last.focus(); }
			else if ( ! e.shiftKey && document.activeElement === last ) { e.preventDefault(); first.focus(); }
		}
		wake();
	} );

	// Interface masquée après 2,5 s sans mouvement pendant la lecture.
	function wake() {
		player.classList.remove( 'ui-hidden' );
		clearTimeout( hideTimer );
		hideTimer = setTimeout( () => {
			if ( ! video.paused && player.classList.contains( 'is-open' ) ) player.classList.add( 'ui-hidden' );
		}, 2500 );
	}
	player.addEventListener( 'pointermove', wake );
}

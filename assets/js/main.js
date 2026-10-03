( function () {
	'use strict';

	// Header transparent sur le hero, opaque au scroll.
	var header = document.querySelector( '.site-header--overlay' );
	if ( header ) {
		var onScroll = function () {
			header.classList.toggle( 'is-scrolled', window.scrollY > 40 );
		};
		onScroll();
		window.addEventListener( 'scroll', onScroll, { passive: true } );
	}

	// Menu mobile.
	var burger = document.querySelector( '.burger' );
	var nav = document.getElementById( 'site-nav' );
	if ( burger && nav ) {
		burger.addEventListener( 'click', function () {
			var open = nav.classList.toggle( 'is-open' );
			burger.setAttribute( 'aria-expanded', open ? 'true' : 'false' );
		} );
	}

	// Section Spotify : la pochette s'incline vers le pointeur, le reflet le suit.
	var deck = document.querySelector( '.listen__deck' );
	if ( deck && window.matchMedia( '(hover: hover) and (prefers-reduced-motion: no-preference)' ).matches ) {
		var tilt = 0;
		deck.addEventListener( 'pointermove', function ( e ) {
			var r = deck.getBoundingClientRect();
			var x = ( e.clientX - r.left ) / r.width;
			var y = ( e.clientY - r.top ) / r.height;
			cancelAnimationFrame( tilt );
			tilt = requestAnimationFrame( function () {
				deck.style.setProperty( '--rx', ( ( 0.5 - y ) * 24 ).toFixed( 2 ) + 'deg' );
				deck.style.setProperty( '--ry', ( ( x - 0.5 ) * 30 ).toFixed( 2 ) + 'deg' );
				deck.style.setProperty( '--mx', ( x * 100 ).toFixed( 1 ) + '%' );
				deck.style.setProperty( '--my', ( y * 100 ).toFixed( 1 ) + '%' );
			} );
		} );
		deck.addEventListener( 'pointerleave', function () {
			cancelAnimationFrame( tilt );
			[ '--rx', '--ry', '--mx', '--my' ].forEach( function ( p ) {
				deck.style.removeProperty( p );
			} );
		} );
	}

	// Fiche produit : boutons de taille à la place du <select>, avec l'état du stock.
	var LOW = 5;
	document.querySelectorAll( '.variations_form select' ).forEach( function ( select ) {
		var row = document.createElement( 'div' );
		row.className = 'size-row';
		var status = document.createElement( 'p' );
		status.className = 'size-status';
		status.setAttribute( 'aria-live', 'polite' );
		var buttons = [];

		// Stock par taille, depuis les données de variations de WooCommerce.
		var stock = {};
		try {
			JSON.parse( select.form.dataset.product_variations || '[]' ).forEach( function ( v ) {
				var slug = v.attributes[ select.name ];
				if ( slug ) stock[ slug ] = { inStock: v.is_in_stock, qty: v.max_qty === '' ? null : +v.max_qty };
			} );
		} catch ( e ) {}

		function note( value ) {
			var s = stock[ value ];
			if ( ! s ) return '';
			if ( ! s.inStock ) return 'Sold out';
			return s.qty !== null && s.qty <= LOW ? 'Plus que ' + s.qty : '';
		}

		Array.prototype.forEach.call( select.options, function ( opt ) {
			if ( ! opt.value ) return;
			var b = document.createElement( 'button' );
			b.type = 'button';
			b.className = 'size-btn';
			b.textContent = opt.textContent;
			b.dataset.value = opt.value;
			var n = note( opt.value );
			if ( n ) {
				var em = document.createElement( 'em' );
				em.textContent = n;
				b.appendChild( em );
				b.classList.add( stock[ opt.value ].inStock ? 'is-low' : 'is-out' );
			}
			b.addEventListener( 'click', function () {
				select.value = select.value === opt.value ? '' : opt.value;
				select.dispatchEvent( new Event( 'change', { bubbles: true } ) );
				if ( window.jQuery ) window.jQuery( select ).trigger( 'change' );
				sync();
			} );
			buttons.push( b );
			row.appendChild( b );
		} );

		function sync() {
			buttons.forEach( function ( b ) {
				var opt = select.querySelector( 'option[value="' + b.dataset.value + '"]' );
				var s = stock[ b.dataset.value ];
				b.classList.toggle( 'is-active', select.value === b.dataset.value );
				b.disabled = ! opt || opt.disabled || ( s && ! s.inStock );
			} );
			var cur = stock[ select.value ];
			status.textContent = cur && cur.inStock && cur.qty !== null && cur.qty <= LOW
				? 'Plus que ' + cur.qty + ' pièce' + ( cur.qty > 1 ? 's' : '' ) + ' dans cette taille.'
				: '';
		}

		select.classList.add( 'has-size-btns' );
		select.parentNode.insertBefore( row, select );
		row.after( status );
		if ( window.jQuery ) {
			window.jQuery( select.form ).on( 'woocommerce_update_variation_values reset_data found_variation', sync );
		}
		sync();
	} );

	// Compte à rebours du drop : la page se recharge à l'ouverture.
	document.querySelectorAll( '.countdown[data-drop]' ).forEach( function ( el ) {
		var end = +el.dataset.drop;
		var units = {};
		el.querySelectorAll( '[data-u]' ).forEach( function ( u ) { units[ u.dataset.u ] = u; } );
		var pad = function ( n ) { return ( n < 10 ? '0' : '' ) + n; };
		( function tick() {
			var left = Math.max( 0, Math.floor( ( end - Date.now() ) / 1000 ) );
			units.d.textContent = pad( Math.floor( left / 86400 ) );
			units.h.textContent = pad( Math.floor( ( left % 86400 ) / 3600 ) );
			units.m.textContent = pad( Math.floor( ( left % 3600 ) / 60 ) );
			units.s.textContent = pad( left % 60 );
			if ( left === 0 ) {
				el.classList.add( 'is-live' );
				setTimeout( function () { window.location.reload(); }, 1200 );
				return;
			}
			setTimeout( tick, 1000 - ( Date.now() % 1000 ) );
		} )();
	} );

	// Liste d'attente (envoi à l'API REST du thème).
	document.querySelectorAll( 'form.waitlist' ).forEach( function ( form ) {
		var msg = form.querySelector( '.waitlist__msg' );
		form.addEventListener( 'submit', function ( e ) {
			e.preventDefault();
			var email = form.email.value.trim();
			if ( ! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test( email ) ) {
				form.classList.add( 'is-error' );
				msg.textContent = 'Vérifie ton adresse e-mail.';
				form.email.focus();
				return;
			}
			form.classList.remove( 'is-error' );
			form.classList.add( 'is-loading' );
			fetch( window.GRIND.waitlist, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify( { email: email, website: form.website.value, source: form.dataset.source } ),
			} )
				.then( function ( r ) { return r.ok ? r.json() : Promise.reject( r ); } )
				.then( function () {
					form.classList.add( 'is-sent' );
					msg.textContent = "C'est noté. Tu seras prévenu avant tout le monde.";
				} )
				.catch( function () {
					form.classList.add( 'is-error' );
					msg.textContent = 'Oups, réessaie dans un instant.';
				} )
				.finally( function () { form.classList.remove( 'is-loading' ); } );
		} );
	} );
} )();

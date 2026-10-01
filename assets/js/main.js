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

	// Fiche produit : boutons de taille à la place du <select>.
	document.querySelectorAll( '.variations_form select' ).forEach( function ( select ) {
		var row = document.createElement( 'div' );
		row.className = 'size-row';
		var buttons = [];

		Array.prototype.forEach.call( select.options, function ( opt ) {
			if ( ! opt.value ) return;
			var b = document.createElement( 'button' );
			b.type = 'button';
			b.className = 'size-btn';
			b.textContent = opt.textContent;
			b.dataset.value = opt.value;
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
				b.classList.toggle( 'is-active', select.value === b.dataset.value );
				b.disabled = ! opt || opt.disabled;
			} );
		}

		select.classList.add( 'has-size-btns' );
		select.parentNode.insertBefore( row, select );
		if ( window.jQuery ) {
			window.jQuery( select.form ).on( 'woocommerce_update_variation_values reset_data found_variation', sync );
		}
		sync();
	} );
} )();

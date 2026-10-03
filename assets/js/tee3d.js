/**
 * GRIND — accueil : t-shirt 3D piloté au scroll.
 */
import { THREE, SH, createStage, loadTee, buildHalo, buildDust } from 'grind-tee-core';

function init( section ) {
	const canvas = section.querySelector( '.tee3d__canvas' );
	const steps = [ ...section.querySelectorAll( '.tee3d__step' ) ];
	const bar = section.querySelector( '.tee3d__progress span' );
	const bgText = section.querySelector( '.tee3d__bgtext span' );
	const reduced = window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches;

	let stage;
	try {
		stage = createStage( canvas );
	} catch ( e ) {
		return; // pas de WebGL : l'image de secours reste affichée
	}
	const { renderer, scene, camera } = stage;

	const tee = new THREE.Group();
	scene.add( tee );

	const halo = buildHalo();
	scene.add( halo );

	const dust = buildDust();
	scene.add( dust );

	let size = { w: 2.4, h: SH };
	loadTee( section.dataset, renderer ).then( ( res ) => {
		tee.add( res.group );
		size = res.size;
		section.classList.add( 'is-ready' );
		resize();
	} );

	// --- Chorégraphie : positions clés le long du scroll -------------------
	const TAU = Math.PI * 2;
	const keys = [
		{ p: 0.00, ry: -0.9, rx: 0.28, rz: -0.12, x: 0.0, y: -0.45, s: 0.72 },
		{ p: 0.12, ry: -0.18, rx: 0.06, rz: 0.0, x: 0.5, y: 0.0, s: 1.0 },
		{ p: 0.30, ry: 0.1, rx: -0.04, rz: 0.03, x: 0.55, y: -0.95, s: 1.9 },
		{ p: 0.44, ry: Math.PI * 0.55, rx: 0.1, rz: -0.06, x: 0.0, y: -0.05, s: 1.0 },
		{ p: 0.58, ry: Math.PI, rx: 0.02, rz: 0.05, x: -0.5, y: 0.0, s: 1.05 },
		{ p: 0.75, ry: Math.PI * 1.72, rx: -0.12, rz: -0.2, x: -0.45, y: 0.05, s: 1.15 },
		{ p: 0.90, ry: TAU, rx: 0.0, rz: 0.0, x: 0.0, y: 0.12, s: 0.9 },
		{ p: 1.00, ry: TAU + 0.12, rx: 0.0, rz: 0.0, x: 0.0, y: 0.14, s: 0.88 },
	];
	const ease = ( t ) => t * t * ( 3 - 2 * t );
	function pose( p ) {
		let i = 0;
		while ( i < keys.length - 2 && p > keys[ i + 1 ].p ) i++;
		const a = keys[ i ], b = keys[ i + 1 ];
		const t = ease( THREE.MathUtils.clamp( ( p - a.p ) / ( b.p - a.p ), 0, 1 ) );
		const o = {};
		for ( const k of [ 'ry', 'rx', 'rz', 'x', 'y', 's' ] ) o[ k ] = a[ k ] + ( b[ k ] - a[ k ] ) * t;
		return o;
	}

	// --- Mesures ----------------------------------------------------------
	let visW = 1, visH = 1, portrait = false, fit = 1;
	function resize() {
		const w = canvas.clientWidth, h = canvas.clientHeight;
		renderer.setSize( w, h, false );
		camera.aspect = w / h;
		camera.updateProjectionMatrix();
		visH = 2 * camera.position.z * Math.tan( THREE.MathUtils.degToRad( camera.fov / 2 ) );
		visW = visH * camera.aspect;
		portrait = camera.aspect < 0.9;
		fit = Math.min( 1, ( visW * 0.88 ) / Math.max( size.w, 2.2 ), ( visH * ( portrait ? 0.55 : 0.72 ) ) / ( size.h + 0.06 ) );
	}
	window.addEventListener( 'resize', resize );
	resize();

	// --- Scroll, souris, rendu ------------------------------------------------
	let target = 0, smooth = 0;
	function readScroll() {
		const r = section.getBoundingClientRect();
		const total = section.offsetHeight - window.innerHeight;
		target = THREE.MathUtils.clamp( -r.top / total, 0, 1 );
	}
	window.addEventListener( 'scroll', readScroll, { passive: true } );
	readScroll();
	smooth = target;

	const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
	window.addEventListener( 'pointermove', ( e ) => {
		mouse.x = e.clientX / window.innerWidth - 0.5;
		mouse.y = e.clientY / window.innerHeight - 0.5;
	}, { passive: true } );

	let visible = false;
	new IntersectionObserver( ( [ entry ] ) => { visible = entry.isIntersecting; }, { rootMargin: '100px' } ).observe( section );

	const clock = new THREE.Clock();
	renderer.setAnimationLoop( () => {
		if ( ! visible ) return;
		const t = clock.getElapsedTime();
		smooth += ( target - smooth ) * ( reduced ? 1 : 0.075 );
		mouse.sx += ( mouse.x - mouse.sx ) * 0.05;
		mouse.sy += ( mouse.y - mouse.sy ) * 0.05;

		const k = pose( smooth );
		const idle = reduced ? 0 : 1;
		const xOff = portrait ? 0 : k.x * visW * 0.32;
		const yOff = ( portrait ? 0.42 : k.y ) * fit;
		tee.position.set( xOff, yOff + Math.sin( t * 1.1 ) * 0.03 * idle, 0 );
		tee.rotation.set(
			k.rx + mouse.sy * 0.12 + Math.sin( t * 0.7 ) * 0.02 * idle,
			k.ry + mouse.sx * 0.25 + Math.sin( t * 0.45 ) * 0.04 * idle,
			k.rz
		);
		tee.scale.setScalar( ( portrait ? Math.min( k.s, 1.25 ) : k.s ) * fit );

		halo.position.set( xOff * 0.8, yOff * 0.5, -2.5 );
		halo.scale.setScalar( fit * ( 1 + Math.sin( t * 0.8 ) * 0.03 * idle ) );
		halo.material.opacity = 0.5 + 0.35 * Math.sin( smooth * Math.PI );

		dust.rotation.y = t * 0.02 + smooth * 1.5;
		dust.position.y = smooth * 1.2;

		updateUI( smooth );
		renderer.render( scene, camera );
	} );

	function updateUI( p ) {
		if ( bar ) bar.style.transform = `scaleX(${ p })`;
		if ( bgText ) bgText.style.transform = `translate3d(${ -p * 55 }%, 0, 0)`;
		for ( const el of steps ) {
			const from = +el.dataset.from, to = +el.dataset.to, f = 0.05;
			const o = Math.min( THREE.MathUtils.clamp( ( p - from ) / f, 0, 1 ), THREE.MathUtils.clamp( ( to - p ) / f, 0, 1 ) );
			el.style.opacity = o;
			el.style.transform = `translate3d(0, ${ ( 1 - o ) * 30 }px, 0)`;
			el.style.pointerEvents = o > 0.5 ? 'auto' : 'none';
		}
	}
}

const section = document.querySelector( '.tee3d' );
if ( section ) init( section );

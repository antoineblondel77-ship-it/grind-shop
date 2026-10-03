/**
 * GRIND — fiche produit : configurateur 3D.
 * Rotation libre (souris / doigt), zoom, vues prédéfinies, taille choisie affichée.
 */
import { THREE, SH, createStage, loadTee, buildHalo } from 'grind-tee-core';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/controls/OrbitControls.js/+esm';

const root = document.querySelector( '.tee-viewer' );
if ( root ) init( root );

function init( root ) {
	const media = root.closest( '.product-media' );
	const canvas = root.querySelector( 'canvas' );
	const hint = root.querySelector( '.tee-viewer__hint' );
	const sizeLabel = root.querySelector( '.tee-viewer__size' );
	const reduced = window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches;

	let stage;
	try {
		stage = createStage( canvas, { fov: 28, distance: 6.6, lightsFollowCamera: true } );
	} catch ( e ) {
		media?.setAttribute( 'data-view', 'photos' ); // pas de WebGL : photos uniquement
		media?.classList.add( 'no-3d' );
		return;
	}
	const { renderer, scene, camera } = stage;

	const halo = buildHalo();
	halo.position.z = -2.5;
	scene.add( halo );

	const tee = new THREE.Group();
	scene.add( tee );

	// Centre du print (même réglage que le modèle), pour la vue « Zoom print ».
	const opts = JSON.parse( root.dataset.modelOptions || '{}' );
	const printY = ( 0.5 - ( opts.printY ?? 0.3 ) ) * SH;

	const controls = new OrbitControls( camera, canvas );
	controls.enableDamping = true;
	controls.dampingFactor = 0.08;
	controls.enablePan = false;
	controls.minDistance = 2.6;
	controls.maxDistance = 9;
	controls.minPolarAngle = Math.PI * 0.28;
	controls.maxPolarAngle = Math.PI * 0.7;
	controls.autoRotate = ! reduced;
	controls.autoRotateSpeed = 0.9;

	let idle = 0;
	controls.addEventListener( 'start', () => {
		controls.autoRotate = false;
		clearTimeout( idle );
		hint?.classList.add( 'is-gone' );
		tween = null;
	} );
	controls.addEventListener( 'end', () => {
		idle = setTimeout( () => { controls.autoRotate = ! reduced; }, 7000 );
	} );

	loadTee( root.dataset, renderer ).then( ( { group, size } ) => {
		tee.add( group );
		const fitDist = Math.max( 6.2, size.w * 2.3 );
		camera.position.set( 0, 0.15, fitDist );
		controls.maxDistance = fitDist * 1.35;
		views.front.dist = views.back.dist = fitDist;
		root.classList.add( 'is-ready' );
	} );

	/* ---------- Vues prédéfinies (animation de caméra) ---------- */

	const views = {
		front: { az: 0, pol: Math.PI / 2 - 0.03, dist: 6.6, ty: 0 },
		back: { az: Math.PI, pol: Math.PI / 2 - 0.03, dist: 6.6, ty: 0 },
		print: { az: 0, pol: Math.PI / 2, dist: 2.8, ty: printY },
	};
	let tween = null;
	const sph = new THREE.Spherical();

	function goTo( name ) {
		const v = views[ name ];
		if ( ! v ) return;
		controls.autoRotate = false;
		clearTimeout( idle );
		hint?.classList.add( 'is-gone' );
		sph.setFromVector3( camera.position.clone().sub( controls.target ) );
		let daz = v.az - sph.theta;
		daz = Math.atan2( Math.sin( daz ), Math.cos( daz ) ); // plus court chemin
		tween = {
			t0: performance.now(), dur: reduced ? 1 : 1100,
			from: { az: sph.theta, pol: sph.phi, dist: sph.radius, ty: controls.target.y },
			to: { az: sph.theta + daz, pol: v.pol, dist: v.dist, ty: v.ty },
		};
		root.querySelectorAll( '[data-cam]' ).forEach( ( b ) => b.classList.toggle( 'is-active', b.dataset.cam === name ) );
	}
	root.querySelectorAll( '[data-cam]' ).forEach( ( b ) => b.addEventListener( 'click', () => goTo( b.dataset.cam ) ) );

	const ease = ( t ) => ( t < 0.5 ? 4 * t * t * t : 1 - Math.pow( -2 * t + 2, 3 ) / 2 );
	function stepTween( now ) {
		if ( ! tween ) return;
		const k = Math.min( 1, ( now - tween.t0 ) / tween.dur ), e = ease( k );
		const lerp = ( a, b ) => a + ( b - a ) * e;
		controls.target.set( 0, lerp( tween.from.ty, tween.to.ty ), 0 );
		sph.set( lerp( tween.from.dist, tween.to.dist ), lerp( tween.from.pol, tween.to.pol ), lerp( tween.from.az, tween.to.az ) );
		camera.position.setFromSpherical( sph ).add( controls.target );
		if ( k === 1 ) tween = null;
	}

	/* ---------- Taille choisie ---------- */

	const select = document.querySelector( '.variations_form select' );
	const showSize = () => {
		const opt = select?.selectedOptions[ 0 ];
		sizeLabel.textContent = select?.value ? `Taille ${ opt.textContent }` : '';
	};
	select?.addEventListener( 'change', showSize );
	window.jQuery?.( select?.form ).on( 'found_variation reset_data', showSize );
	showSize();

	/* ---------- Onglets 3D / Photos ---------- */

	media?.querySelectorAll( '.media-tabs button' ).forEach( ( b ) => b.addEventListener( 'click', () => {
		media.dataset.view = b.dataset.view;
		media.querySelectorAll( '.media-tabs button' ).forEach( ( x ) => x.setAttribute( 'aria-selected', x === b ? 'true' : 'false' ) );
		if ( b.dataset.view === 'photos' ) window.dispatchEvent( new Event( 'resize' ) ); // recalcul du carrousel
	} ) );

	/* ---------- Rendu ---------- */

	const resize = () => {
		const w = canvas.clientWidth, h = canvas.clientHeight;
		if ( ! w || ! h ) return;
		renderer.setSize( w, h, false );
		camera.aspect = w / h;
		camera.updateProjectionMatrix();
	};
	new ResizeObserver( resize ).observe( canvas );

	let visible = true;
	new IntersectionObserver( ( [ e ] ) => { visible = e.isIntersecting; } ).observe( root );

	const clock = new THREE.Clock();
	renderer.setAnimationLoop( ( now ) => {
		if ( ! visible || media?.dataset.view !== '3d' ) return;
		const t = clock.getElapsedTime();
		stepTween( now );
		if ( ! tween ) controls.update();
		tee.position.y = reduced ? 0 : Math.sin( t * 1.1 ) * 0.025;
		renderer.render( scene, camera );
	} );
}

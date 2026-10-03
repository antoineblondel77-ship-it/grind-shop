/**
 * GRIND — cœur 3D partagé (accueil + fiche produit).
 * Scène, lumières, chargement du tee : modèle .glb externe avec print projeté,
 * ou à défaut tee généré depuis sa silhouette.
 */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/+esm';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/loaders/GLTFLoader.js/+esm';
import { DecalGeometry } from 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/geometries/DecalGeometry.js/+esm';
import { MeshoptDecoder } from 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/libs/meshopt_decoder.module.js/+esm';

export { THREE };

/** Rendu + scène + caméra + éclairage studio (contre-jour rouge). Lève une erreur sans WebGL. */
export function createStage( canvas, { fov = 30, distance = 7, lightsFollowCamera = false } = {} ) {
	const renderer = new THREE.WebGLRenderer( { canvas, antialias: true, alpha: true, powerPreference: 'high-performance' } );
	renderer.setPixelRatio( Math.min( window.devicePixelRatio, 2 ) );
	renderer.outputColorSpace = THREE.SRGBColorSpace;
	renderer.toneMapping = THREE.ACESFilmicToneMapping;
	renderer.toneMappingExposure = 1.05;

	const scene = new THREE.Scene();
	const camera = new THREE.PerspectiveCamera( fov, 1, 0.1, 50 );
	camera.position.set( 0, 0, distance );

	scene.environment = buildEnvironment( renderer );
	scene.environmentIntensity = 0.55;

	// Lumières : clé blanche, contre-jour rouge (DA du clip), remplissage froid.
	const key = new THREE.DirectionalLight( 0xffffff, 2.4 );
	key.position.set( -3, 4, 5 );
	const rim = new THREE.DirectionalLight( 0xff1e1e, 5 );
	rim.position.set( 4, 2, -4 );
	const rim2 = new THREE.DirectionalLight( 0xff3b2a, 2.5 );
	rim2.position.set( -4, -1, -3 );
	const fill = new THREE.HemisphereLight( 0x9fb0ff, 0x1a0505, 0.5 );
	scene.add( fill );
	if ( lightsFollowCamera ) {
		// Caméra mobile (configurateur) : l'éclairage reste fixe par rapport au regard.
		for ( const l of [ key, rim, rim2 ] ) {
			l.position.z -= distance;
			camera.add( l );
		}
		scene.add( camera );
	} else {
		scene.add( key, rim, rim2 );
	}

	return { renderer, scene, camera };
}

/**
 * Charge le tee décrit par les data-attributes (print, printAlpha, model, modelOptions).
 * Résout { group, size } — size = encombrement { w, h } en unités scène.
 */
export function loadTee( data, renderer ) {
	const procedural = () => new Promise( ( resolve, reject ) => {
		const img = new Image();
		img.crossOrigin = 'anonymous';
		img.onload = () => {
			const group = new THREE.Group();
			buildTee( group, img, renderer );
			resolve( { group, size: { w: 2.4, h: SH } } );
		};
		img.onerror = reject;
		img.src = data.print;
	} );
	if ( ! data.model ) return procedural();
	return loadModel( data.model, data.printAlpha, JSON.parse( data.modelOptions || '{}' ), renderer )
		.then( ( holder ) => ( { group: holder, size: holder.userData.size } ) )
		.catch( ( err ) => {
			console.warn( 'GRIND : modèle 3D indisponible, tee généré à la place.', err );
			return procedural();
		} );
}

/* ==========================================================================
   Géométrie du t-shirt
   ========================================================================== */

// Silhouette d'un tee oversize (épaules tombantes), relevée sur le mockup.
// u : -0.5 → 0.5 (largeur), v : 0 (haut du col) → 1 (bas).
const NECK = { rx: 0.12, ry: 0.065, back: 0.022 };
const HALF = [
	[ 0.12, 0.0 ], [ 0.24, 0.026 ], [ 0.36, 0.088 ], [ 0.44, 0.19 ], [ 0.497, 0.45 ],
	[ 0.265, 0.515 ], [ 0.268, 0.975 ], [ 0.13, 0.985 ],
];
const SW = 2.4;
export const SH = 2.4 * 1476 / 1395;
const toX = ( u ) => u * SW;
const toY = ( v ) => ( 0.5 - v ) * SH;

// Zone du print (mesurée sur le mockup) en coordonnées u/v.
const PRINT = { u0: -0.146, u1: 0.119, v0: 0.161, v1: 0.438 };

function outlineUV() {
	const right = HALF;
	const left = HALF.slice().reverse().map( ( [ u, v ] ) => [ -u, v ] );
	const pts = [ ...right, [ 0, 0.99 ], ...left ];
	const n = 24;
	for ( let i = 1; i < n; i++ ) {
		const a = Math.PI - ( Math.PI * i ) / n;
		pts.push( [ NECK.rx * Math.cos( a ), NECK.ry * Math.sin( a ) ] );
	}
	return chaikin( densify( pts, 0.015 ) );
}

// Découpe chaque segment en petits pas, pour que l'arrondi reste local.
function densify( pts, step ) {
	const out = [];
	for ( let i = 0; i < pts.length; i++ ) {
		const [ ax, ay ] = pts[ i ], [ bx, by ] = pts[ ( i + 1 ) % pts.length ];
		const n = Math.max( 1, Math.ceil( Math.hypot( bx - ax, by - ay ) / step ) );
		for ( let k = 0; k < n; k++ ) out.push( [ ax + ( ( bx - ax ) * k ) / n, ay + ( ( by - ay ) * k ) / n ] );
	}
	return out;
}

// Arrondit légèrement les angles du contour (tissu, pas de coins vifs).
function chaikin( pts ) {
	const out = [];
	for ( let i = 0; i < pts.length; i++ ) {
		const [ ax, ay ] = pts[ i ], [ bx, by ] = pts[ ( i + 1 ) % pts.length ];
		out.push( [ ax * 0.75 + bx * 0.25, ay * 0.75 + by * 0.25 ], [ ax * 0.25 + bx * 0.75, ay * 0.25 + by * 0.75 ] );
	}
	return out;
}

function segDist( px, py, ax, ay, bx, by ) {
	const dx = bx - ax, dy = by - ay;
	const t = Math.max( 0, Math.min( 1, ( ( px - ax ) * dx + ( py - ay ) * dy ) / ( dx * dx + dy * dy ) ) );
	const cx = ax + t * dx, cy = ay + t * dy;
	return [ Math.hypot( px - cx, py - cy ), cx, cy ];
}

function inside( px, py, poly ) {
	let c = false;
	for ( let i = 0, j = poly.length - 1; i < poly.length; j = i++ ) {
		const [ xi, yi ] = poly[ i ], [ xj, yj ] = poly[ j ];
		if ( ( yi > py ) !== ( yj > py ) && px < ( ( xj - xi ) * ( py - yi ) ) / ( yj - yi ) + xi ) c = !c;
	}
	return c;
}

// Plis de tissu (relief léger), en u/v.
const FOLDS = [
	[ 0.262, 0.52, 0.12, 0.7, 0.012, 0.035 ],
	[ 0.27, 0.6, 0.17, 0.84, 0.009, 0.035 ],
	[ 0.42, 0.24, 0.3, 0.33, 0.006, 0.04 ],
	[ 0.1, 0.12, 0.02, 0.3, 0.004, 0.045 ],
];
function folds( u, v, side ) {
	let z = 0;
	for ( const [ au, av, bu, bv, amp, w ] of FOLDS ) {
		for ( const m of [ 1, -1 ] ) {
			const [ d ] = segDist( u, v, au * m, av, bu * m, bv );
			z += amp * Math.exp( -( d * d ) / ( w * w ) );
		}
	}
	if ( v > 0.86 ) z += 0.006 * Math.sin( u * 38 + side ) * ( ( v - 0.86 ) / 0.14 );
	z += 0.004 * Math.sin( u * 21 + v * 13 + side * 2 );
	return z;
}

// Grille commune devant/dos : intérieur de la silhouette + distance au bord.
function buildField( poly ) {
	const N = 170, M = 180, row = N + 1, count = row * ( M + 1 );
	const minX = -1.25, maxX = 1.25, minY = toY( 1.02 ), maxY = toY( -0.02 );
	const gx = ( i ) => minX + ( ( maxX - minX ) * i ) / N;
	const gy = ( j ) => minY + ( ( maxY - minY ) * j ) / M;
	const inner = new Uint8Array( count );

	// Intérieur : remplissage ligne par ligne.
	for ( let j = 0; j <= M; j++ ) {
		const y = gy( j ), xs = [];
		for ( let a = 0, b = poly.length - 1; a < poly.length; b = a++ ) {
			const [ x1, y1 ] = poly[ b ], [ x2, y2 ] = poly[ a ];
			if ( ( y1 > y ) !== ( y2 > y ) ) xs.push( x1 + ( ( y - y1 ) * ( x2 - x1 ) ) / ( y2 - y1 ) );
		}
		xs.sort( ( p, q ) => p - q );
		for ( let s = 0; s + 1 < xs.length; s += 2 ) {
			const i0 = Math.ceil( ( ( xs[ s ] - minX ) / ( maxX - minX ) ) * N );
			const i1 = Math.floor( ( ( xs[ s + 1 ] - minX ) / ( maxX - minX ) ) * N );
			for ( let i = Math.max( 0, i0 ); i <= Math.min( N, i1 ); i++ ) inner[ j * row + i ] = 1;
		}
	}

	// Bande autour du bord : point le plus proche exact sur le contour.
	const nx = new Float32Array( count ).fill( NaN ), ny = new Float32Array( count );
	const nearest = ( x, y ) => {
		let best = Infinity, bx = 0, by = 0;
		for ( let a = 0, b = poly.length - 1; a < poly.length; b = a++ ) {
			const [ d, cx, cy ] = segDist( x, y, poly[ b ][ 0 ], poly[ b ][ 1 ], poly[ a ][ 0 ], poly[ a ][ 1 ] );
			if ( d < best ) { best = d; bx = cx; by = cy; }
		}
		return [ bx, by ];
	};
	for ( let j = 0; j <= M; j++ ) {
		for ( let i = 0; i <= N; i++ ) {
			const k = j * row + i;
			let edge = false;
			for ( let dj = -1; dj <= 1 && ! edge; dj++ ) {
				for ( let di = -1; di <= 1; di++ ) {
					const ii = i + di, jj = j + dj;
					if ( ii >= 0 && jj >= 0 && ii <= N && jj <= M && inner[ jj * row + ii ] !== inner[ k ] ) { edge = true; break; }
				}
			}
			if ( edge ) [ nx[ k ], ny[ k ] ] = nearest( gx( i ), gy( j ) );
		}
	}

	// Propagation (deux passes) du point de bord le plus proche vers l'intérieur.
	const relax = ( k, n ) => {
		if ( Number.isNaN( nx[ n ] ) ) return;
		const x = gx( k % row ), y = gy( ( k / row ) | 0 );
		const dn = ( x - nx[ n ] ) ** 2 + ( y - ny[ n ] ) ** 2;
		if ( Number.isNaN( nx[ k ] ) || dn < ( x - nx[ k ] ) ** 2 + ( y - ny[ k ] ) ** 2 ) { nx[ k ] = nx[ n ]; ny[ k ] = ny[ n ]; }
	};
	for ( let j = 0; j <= M; j++ ) for ( let i = 0; i <= N; i++ ) {
		const k = j * row + i;
		if ( ! inner[ k ] ) continue;
		if ( i > 0 ) relax( k, k - 1 );
		if ( j > 0 ) { relax( k, k - row ); if ( i > 0 ) relax( k, k - row - 1 ); if ( i < N ) relax( k, k - row + 1 ); }
	}
	for ( let j = M; j >= 0; j-- ) for ( let i = N; i >= 0; i-- ) {
		const k = j * row + i;
		if ( ! inner[ k ] ) continue;
		if ( i < N ) relax( k, k + 1 );
		if ( j < M ) { relax( k, k + row ); if ( i < N ) relax( k, k + row + 1 ); if ( i > 0 ) relax( k, k + row - 1 ); }
	}

	const X = new Float32Array( count ), Y = new Float32Array( count ), dist = new Float32Array( count );
	for ( let j = 0; j <= M; j++ ) for ( let i = 0; i <= N; i++ ) {
		const k = j * row + i, x = gx( i ), y = gy( j );
		if ( inner[ k ] ) {
			X[ k ] = x; Y[ k ] = y;
			dist[ k ] = Number.isNaN( nx[ k ] ) ? 1 : Math.hypot( x - nx[ k ], y - ny[ k ] );
		} else if ( ! Number.isNaN( nx[ k ] ) ) {
			X[ k ] = nx[ k ]; Y[ k ] = ny[ k ]; // projeté sur le bord
		} else {
			X[ k ] = x; Y[ k ] = y;
		}
	}
	return { N, M, row, count, inner, X, Y, dist, bounds: { minX, maxX, minY, maxY } };
}

function buildPanel( field, side ) {
	// side : +1 devant, -1 dos
	const { N, M, row, count, inner, X, Y, dist, bounds } = field;
	const D = 0.3, H = side > 0 ? 0.06 : 0.05;
	const Z = new Float32Array( count );
	for ( let k = 0; k < count; k++ ) {
		if ( ! inner[ k ] ) continue;
		const x = X[ k ], y = Y[ k ], u = x / SW, v = 0.5 - y / SH;
		const edge = Math.pow( Math.min( dist[ k ] / D, 1 ), 0.5 );
		const body = 0.05 * Math.max( 0, 1 - ( x / 1.25 ) ** 2 ) * Math.max( 0, 1 - ( ( y + 0.15 ) / 1.5 ) ** 2 );
		Z[ k ] = edge * ( H + body + folds( u, v, side ) );
	}

	// Lissage du relief : efface les arêtes du champ de distance.
	const tmp = new Float32Array( count );
	for ( let it = 0; it < 10; it++ ) {
		tmp.set( Z );
		for ( let j = 1; j < M; j++ ) {
			for ( let i = 1; i < N; i++ ) {
				const k = j * row + i;
				if ( ! inner[ k ] ) continue;
				Z[ k ] = tmp[ k ] * 0.4 + ( tmp[ k - 1 ] + tmp[ k + 1 ] + tmp[ k - row ] + tmp[ k + row ] ) * 0.15;
			}
		}
	}

	const { minX, maxX, minY, maxY } = bounds;
	const pos = new Float32Array( count * 3 ), uv = new Float32Array( count * 2 ), idx = [];
	for ( let k = 0; k < count; k++ ) {
		pos[ k * 3 ] = X[ k ]; pos[ k * 3 + 1 ] = Y[ k ]; pos[ k * 3 + 2 ] = side * Z[ k ];
		uv[ k * 2 ] = ( X[ k ] - minX ) / ( maxX - minX );
		uv[ k * 2 + 1 ] = ( Y[ k ] - minY ) / ( maxY - minY );
	}
	for ( let j = 0; j < M; j++ ) {
		for ( let i = 0; i < N; i++ ) {
			const a = j * row + i, b = a + 1, c = a + row, d = c + 1;
			const tri = ( p, q, r ) => {
				if ( ! inner[ p ] && ! inner[ q ] && ! inner[ r ] ) return;
				side > 0 ? idx.push( p, q, r ) : idx.push( p, r, q );
			};
			tri( a, b, c );
			tri( b, d, c );
		}
	}
	const g = new THREE.BufferGeometry();
	g.setAttribute( 'position', new THREE.BufferAttribute( pos, 3 ) );
	g.setAttribute( 'uv', new THREE.BufferAttribute( uv, 2 ) );
	g.setIndex( idx );
	g.computeVertexNormals();
	return { geometry: g, bounds };
}

function fabricCanvas( bounds, printImg, withPrint ) {
	const S = 2048;
	const c = document.createElement( 'canvas' );
	c.width = c.height = S;
	const ctx = c.getContext( '2d' );
	const px = ( u ) => ( ( toX( u ) - bounds.minX ) / ( bounds.maxX - bounds.minX ) ) * S;
	const py = ( v ) => S - ( ( toY( v ) - bounds.minY ) / ( bounds.maxY - bounds.minY ) ) * S;

	ctx.fillStyle = '#f3f2ef';
	ctx.fillRect( 0, 0, S, S );

	// Coutures et ourlets (discrets).
	ctx.strokeStyle = 'rgba(0,0,0,.07)';
	ctx.lineWidth = 3;
	const line = ( pts ) => { ctx.beginPath(); pts.forEach( ( [ u, v ], i ) => ( i ? ctx.lineTo( px( u ), py( v ) ) : ctx.moveTo( px( u ), py( v ) ) ) ); ctx.stroke(); };
	for ( const m of [ 1, -1 ] ) {
		line( [ [ 0.3 * m, 0.045 ], [ 0.285 * m, 0.25 ], [ 0.268 * m, 0.51 ] ] ); // épaule tombante
		line( [ [ 0.47 * m, 0.43 ], [ 0.275 * m, 0.49 ] ] ); // ourlet de manche
	}
	line( [ [ -0.27, 0.945 ], [ 0, 0.958 ], [ 0.27, 0.945 ] ] ); // ourlet bas
	// Col côtelé.
	ctx.lineWidth = 34;
	ctx.strokeStyle = 'rgba(0,0,0,.05)';
	ctx.beginPath();
	for ( let i = 0; i <= 40; i++ ) {
		const a = Math.PI - ( Math.PI * i ) / 40;
		const u = ( NECK.rx + 0.012 ) * Math.cos( a ), v = ( NECK.ry + 0.014 ) * Math.sin( a );
		i ? ctx.lineTo( px( u ), py( v ) ) : ctx.moveTo( px( u ), py( v ) );
	}
	ctx.stroke();

	if ( withPrint ) {
		ctx.save();
		ctx.globalCompositeOperation = 'multiply';
		ctx.drawImage( printImg, px( PRINT.u0 ), py( PRINT.v0 ), px( PRINT.u1 ) - px( PRINT.u0 ), py( PRINT.v1 ) - py( PRINT.v0 ) );
		ctx.restore();
	}

	// Grain de jersey (motif répété, rapide).
	ctx.save();
	ctx.globalCompositeOperation = 'multiply';
	ctx.fillStyle = ctx.createPattern( noiseTile(), 'repeat' );
	ctx.fillRect( 0, 0, S, S );
	ctx.restore();
	return c;
}

let tile;
function noiseTile() {
	if ( tile ) return tile;
	tile = document.createElement( 'canvas' );
	tile.width = tile.height = 128;
	const ctx = tile.getContext( '2d' ), img = ctx.createImageData( 128, 128 );
	for ( let i = 0; i < img.data.length; i += 4 ) {
		const v = 238 + Math.random() * 17 + ( ( i >> 2 ) % 2 ? 0 : -4 );
		img.data[ i ] = img.data[ i + 1 ] = img.data[ i + 2 ] = v;
		img.data[ i + 3 ] = 255;
	}
	ctx.putImageData( img, 0, 0 );
	return tile;
}

function bumpCanvas() {
	const S = 512, c = document.createElement( 'canvas' );
	c.width = c.height = S;
	const ctx = c.getContext( '2d' );
	const img = ctx.createImageData( S, S );
	for ( let y = 0; y < S; y++ ) {
		for ( let x = 0; x < S; x++ ) {
			const k = ( y * S + x ) * 4;
			const v = 128 + 40 * Math.sin( x * 1.6 ) * Math.sin( y * 0.8 ) + ( Math.random() - 0.5 ) * 50;
			img.data[ k ] = img.data[ k + 1 ] = img.data[ k + 2 ] = v;
			img.data[ k + 3 ] = 255;
		}
	}
	ctx.putImageData( img, 0, 0 );
	return c;
}

/* ==========================================================================
   Modèle externe (.glb)
   ========================================================================== */

/**
 * Options (assets/models/tee.json) :
 *  rotateY    rotation (radians) pour mettre le devant face caméra (+Z)
 *  color      couleur forcée du tissu (ex. "#f2f1ee"), remplace la texture d'origine
 *  printY     centre du print, en fraction de la hauteur depuis le haut (défaut 0.30)
 *  printX     décalage horizontal, en fraction de la hauteur (défaut -0.01)
 *  printScale facteur de taille du print (défaut 1)
 */
async function loadModel( url, printUrl, opts, renderer ) {
	const [ gltf, printTex ] = await Promise.all( [
		new GLTFLoader().setMeshoptDecoder( MeshoptDecoder ).loadAsync( url ),
		new THREE.TextureLoader().loadAsync( printUrl ),
	] );

	// Mise à l'échelle : même hauteur que le tee généré, centré sur l'origine.
	const model = gltf.scene;
	const holder = new THREE.Group();
	const pivot = new THREE.Group();
	pivot.rotation.y = opts.rotateY || 0;
	pivot.add( model );
	holder.add( pivot );
	holder.updateMatrixWorld( true );
	const box = new THREE.Box3().setFromObject( pivot );
	const dim = box.getSize( new THREE.Vector3() );
	const scale = SH / dim.y;
	pivot.scale.setScalar( scale );
	pivot.position.copy( box.getCenter( new THREE.Vector3() ).multiplyScalar( -scale ) );
	holder.updateMatrixWorld( true );

	// Tissu : sheen + double face (encolure, manches).
	const meshes = [];
	model.traverse( ( o ) => {
		if ( ! o.isMesh ) return;
		meshes.push( o );
		const mats = Array.isArray( o.material ) ? o.material : [ o.material ];
		const conv = mats.map( ( m ) => new THREE.MeshPhysicalMaterial( {
			color: opts.color ? new THREE.Color( opts.color ) : m.color,
			map: opts.color ? null : m.map,
			normalMap: m.normalMap || null,
			normalScale: m.normalScale || new THREE.Vector2( 1, 1 ),
			roughnessMap: m.roughnessMap || null,
			aoMap: m.aoMap || null,
			roughness: Math.max( m.roughness ?? 0.85, 0.7 ),
			metalness: 0,
			sheen: 1,
			sheenRoughness: 0.6,
			sheenColor: new THREE.Color( 0xffffff ),
			side: THREE.DoubleSide,
		} ) );
		o.material = Array.isArray( o.material ) ? conv : conv[ 0 ];
	} );

	// Print : décalque projeté sur la poitrine (rayon tiré depuis l'avant).
	const H = SH, k = opts.printScale || 1;
	const px = ( opts.printX ?? -0.01 ) * H;
	const py = ( 0.5 - ( opts.printY ?? 0.3 ) ) * H;
	const hit = new THREE.Raycaster( new THREE.Vector3( px, py, 20 ), new THREE.Vector3( 0, 0, -1 ) ).intersectObjects( meshes, false )[ 0 ];
	if ( hit ) {
		printTex.colorSpace = THREE.SRGBColorSpace;
		printTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
		const w = 0.25 * H * k, h = w * ( printTex.image.height / printTex.image.width );
		const decalMat = new THREE.MeshPhysicalMaterial( {
			map: printTex, transparent: true, depthWrite: false, roughness: 0.75,
			polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4,
		} );
		// Le modèle peut être découpé en plusieurs maillages : on projette sur chacun.
		for ( const m of meshes ) {
			const g = new DecalGeometry( m, hit.point, new THREE.Euler( 0, 0, 0 ), new THREE.Vector3( w, h, 0.3 ) );
			if ( g.attributes.position.count ) holder.add( new THREE.Mesh( g, decalMat ) );
		}
	}

	const final = new THREE.Box3().setFromObject( holder ).getSize( new THREE.Vector3() );
	holder.userData.size = { w: final.x, h: final.y };
	return holder;
}

function buildTee( group, printImg, renderer ) {
	const poly = outlineUV().map( ( [ u, v ] ) => [ toX( u ), toY( v ) ] );
	const aniso = renderer.capabilities.getMaxAnisotropy();

	const bump = new THREE.CanvasTexture( bumpCanvas() );
	bump.wrapS = bump.wrapT = THREE.RepeatWrapping;
	bump.repeat.set( 18, 18 );

	const field = buildField( poly );
	const make = ( side ) => {
		const { geometry, bounds } = buildPanel( field, side );
		const tex = new THREE.CanvasTexture( fabricCanvas( bounds, printImg, side > 0 ) );
		tex.colorSpace = THREE.SRGBColorSpace;
		tex.anisotropy = aniso;
		const mat = new THREE.MeshPhysicalMaterial( {
			map: tex,
			roughness: 0.82,
			sheen: 1,
			sheenRoughness: 0.55,
			sheenColor: new THREE.Color( 0xffffff ),
			bumpMap: bump,
			bumpScale: 0.35,
		} );
		return new THREE.Mesh( geometry, mat );
	};
	group.add( make( 1 ), make( -1 ) );

	// Col : bord côtelé + intérieur du dos visible dans l'encolure.
	const neckPts = [], backPts = [];
	for ( let i = 0; i <= 48; i++ ) {
		const a = Math.PI - ( Math.PI * i ) / 48;
		neckPts.push( new THREE.Vector3( toX( NECK.rx * Math.cos( a ) ), toY( NECK.ry * Math.sin( a ) ), 0 ) );
		backPts.push( new THREE.Vector2( toX( NECK.rx * Math.cos( a ) ), toY( NECK.back * Math.sin( a ) ) ) );
	}
	const ribMat = new THREE.MeshPhysicalMaterial( { color: 0xe9e7e3, roughness: 0.9, sheen: 1, sheenRoughness: 0.5, bumpMap: bump, bumpScale: 0.6 } );
	const rib = new THREE.Mesh( new THREE.TubeGeometry( new THREE.CatmullRomCurve3( neckPts ), 64, 0.032, 10, false ), ribMat );
	group.add( rib );

	const shape = new THREE.Shape();
	backPts.forEach( ( p, i ) => ( i ? shape.lineTo( p.x, p.y ) : shape.moveTo( p.x, p.y ) ) );
	neckPts.slice().reverse().forEach( ( p ) => shape.lineTo( p.x, p.y ) );
	const innerMat = new THREE.MeshStandardMaterial( { color: 0xb9b6b2, roughness: 1, side: THREE.DoubleSide } );
	const innerBack = new THREE.Mesh( new THREE.ShapeGeometry( shape ), innerMat );
	innerBack.position.z = -0.035;
	group.add( innerBack );
	const backRib = new THREE.Mesh(
		new THREE.TubeGeometry( new THREE.CatmullRomCurve3( backPts.map( ( p ) => new THREE.Vector3( p.x, p.y, -0.035 ) ) ), 64, 0.026, 10, false ),
		ribMat
	);
	group.add( backRib );
}

/* ==========================================================================
   Décor
   ========================================================================== */

function buildEnvironment( renderer ) {
	// Petit studio : boîte sombre + softbox blanche + panneau rouge.
	const env = new THREE.Scene();
	const room = new THREE.Mesh( new THREE.BoxGeometry( 20, 20, 20 ), new THREE.MeshBasicMaterial( { color: 0x0d0b0b, side: THREE.BackSide } ) );
	env.add( room );
	const panel = ( color, w, h, x, y, z ) => {
		const m = new THREE.Mesh( new THREE.PlaneGeometry( w, h ), new THREE.MeshBasicMaterial( { color } ) );
		m.position.set( x, y, z );
		m.lookAt( 0, 0, 0 );
		env.add( m );
	};
	panel( 0xffffff, 8, 6, -5, 6, 7 );
	panel( 0xff2020, 6, 8, 8, 1, -6 );
	panel( 0x6f7cff, 4, 4, -8, -3, -4 );
	const pmrem = new THREE.PMREMGenerator( renderer );
	const tex = pmrem.fromScene( env, 0.04 ).texture;
	pmrem.dispose();
	return tex;
}

export function buildHalo() {
	const c = document.createElement( 'canvas' );
	c.width = c.height = 256;
	const ctx = c.getContext( '2d' );
	const g = ctx.createRadialGradient( 128, 128, 0, 128, 128, 128 );
	g.addColorStop( 0, 'rgba(210,20,28,.9)' );
	g.addColorStop( 0.45, 'rgba(150,10,18,.35)' );
	g.addColorStop( 1, 'rgba(0,0,0,0)' );
	ctx.fillStyle = g;
	ctx.fillRect( 0, 0, 256, 256 );
	return new THREE.Mesh(
		new THREE.PlaneGeometry( 7, 7 ),
		new THREE.MeshBasicMaterial( { map: new THREE.CanvasTexture( c ), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending } )
	);
}

export function buildDust() {
	const n = 500, pos = new Float32Array( n * 3 ), col = new Float32Array( n * 3 );
	const red = new THREE.Color( 0xff2a2a ), white = new THREE.Color( 0xffffff );
	for ( let i = 0; i < n; i++ ) {
		pos[ i * 3 ] = ( Math.random() - 0.5 ) * 12;
		pos[ i * 3 + 1 ] = ( Math.random() - 0.5 ) * 9;
		pos[ i * 3 + 2 ] = ( Math.random() - 0.5 ) * 6 - 1;
		const c = Math.random() < 0.35 ? red : white;
		col.set( [ c.r, c.g, c.b ], i * 3 );
	}
	const g = new THREE.BufferGeometry();
	g.setAttribute( 'position', new THREE.BufferAttribute( pos, 3 ) );
	g.setAttribute( 'color', new THREE.BufferAttribute( col, 3 ) );
	return new THREE.Points( g, new THREE.PointsMaterial( {
		size: 0.025, vertexColors: true, transparent: true, opacity: 0.55,
		blending: THREE.AdditiveBlending, depthWrite: false,
	} ) );
}

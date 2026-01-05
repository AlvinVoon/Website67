import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setClearColor( 0xcccccc );
renderer.setAnimationLoop( animate );
document.body.appendChild( renderer.domElement );

// Add OrbitControls
const controls = new OrbitControls( camera, renderer.domElement );
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.autoRotate = false;

const loader = new GLTFLoader();

let model;
loader.load( 'public/kenyalang.glb', function ( gltf ) {

  model = gltf.scene;
  scene.add( model );

}, undefined, function ( error ) {

  console.error( error );

} );

// Add lighting
const directionalLight = new THREE.DirectionalLight( 0xffffff, 0.8 );
directionalLight.position.set( 8, 12, 8 );
directionalLight.castShadow = true;
scene.add( directionalLight );

const ambientLight = new THREE.AmbientLight( 0xffffff, 0.6 );
scene.add( ambientLight );

const keyLight = new THREE.DirectionalLight( 0x87ceeb, 0.4 );
keyLight.position.set( -5, 8, 5 );
scene.add( keyLight );

camera.position.z = 5;

function animate() {

  controls.update();
  renderer.render( scene, camera );

}
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import Stuff from './stuff.js'

let scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000)
const canvas = document.getElementById('canvas')
const render = new THREE.WebGLRenderer({ canvas })
const raycaster = new THREE.Raycaster()
const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 })

const progress = new THREE.LoadingManager();
progress.onStart = () => { console.log('start') }
progress.onProgress = () => { console.log('loading') }
progress.onLoad = () => { console.log('done') }
const loader = new GLTFLoader(progress);
const textureLoader = new THREE.TextureLoader();
const stuff = new Stuff(loader, textureLoader)

render.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(render.domElement);

const onWindowResize = () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  render.setSize(window.innerWidth, window.innerHeight)
}
window.addEventListener('resize', onWindowResize, false)

const init = async () => {
  let player = await stuff.loadModel('./models/Dayo.glb')
  scene.add(player)

  const controls = new OrbitControls(camera, render.domElement);
  controls.enableDamping = false;
  controls.dampingFactor = 0.1;
  controls.enablePan = true;
  controls.maxPolarAngle = Math.PI / 12 * 7;

  let dir = new THREE.Vector3()
  let intersects = []
  const sceneMeshes = new Array()
  controls.addEventListener('change', () => {
    dir.subVectors(camera.position, controls.target).normalize()
    raycaster.set(controls.target, dir.subVectors(camera.position, controls.target).normalize())
    intersects = raycaster.intersectObjects(sceneMeshes, false)
    if (intersects.length > 0) {
      if (intersects[0].distance < controls.target.distanceTo(camera.position)) {
        camera.position.copy(intersects[0].point)
      }
    }
  })

  let light = new THREE.DirectionalLight(0xFFFFFF, 1.0);
  light.position.set(20, 100, 10);
  light.target.position.set(0, 0, 0);
  light.castShadow = true;
  light.shadow.bias = -0.001;
  light.shadow.mapSize.width = 2048;
  light.shadow.camera.near = 0.1;
  light.shadow.camera.far = 500.0;
  light.shadow.camera.left = 100;
  light.shadow.camera.right = -100;
  light.shadow.camera.top = 100;
  light.shadow.camera.bottom = -100;
  scene.add(light);

  light = new THREE.AmbientLight(0x101010);
  scene.add(light);

  const grassTexture = await stuff.loadTexture('./textures/grass/stylized-grass1_albedo.png')
  grassTexture.wrapS = THREE.RepeatWrapping;
  grassTexture.wrapT = THREE.RepeatWrapping;
  grassTexture.repeat.set(4, 4);
  const platformGeometry = new THREE.BoxGeometry(10, 0.5, 50)
  const platformMaterial = new THREE.MeshBasicMaterial({ map: grassTexture })
  const platform = new THREE.Mesh(platformGeometry, platformMaterial)
  const edgesPlatform = new THREE.EdgesGeometry(platformGeometry)
  const platformLines = new THREE.LineSegments(edgesPlatform, lineMaterial)

  scene.add(platformLines);
  scene.add(platform);
  sceneMeshes.push(platform)
  platform.position.y = -1;

  // Jump parameters
  let isJumping = false;
  let jumpHeight = 2;
  let targetDistance = 1; // The intended horizontal movement distance in units
  let jumpSpeed = 3;
  let gravity = 0.02;
  const groundLevel = 1;

  // Function to trigger the jump
  function startJump(dir) {
    if (isJumping) return;
    isJumping = true;

    let velocityY = Math.sqrt(2 * gravity * jumpHeight); // Initial vertical velocity
    const totalFrames = Math.ceil((2 * velocityY) / (gravity * jumpSpeed)); // Approximate frame count for the jump
    const moveVelocity = targetDistance / totalFrames; // Horizontal movement per frame to achieve exact distance
    const moveDirection = dir.normalize().multiplyScalar(moveVelocity);

    // Animate the jump
    const animateJump = () => {
      if (!isJumping) return;
      velocityY -= gravity * jumpSpeed;
      player.position.y += velocityY;
      player.position.add(moveDirection);

      // Snap player back to ground level if close to it
      if (player.position.y <= groundLevel) {
        player.position.y = groundLevel;
        isJumping = false;
      } else {
        requestAnimationFrame(animateJump);
      }
    };
    animateJump();
  }

  document.addEventListener('keydown', (event) => {
    switch (event.key) {
      case 'w':
        startJump(new THREE.Vector3(0, 0, -1));
        break;
      case 'a':
        startJump(new THREE.Vector3(-1, 0, 0));
        break;
      case 's':
        startJump(new THREE.Vector3(0, 0, 1));
        break;
      case 'd':
        startJump(new THREE.Vector3(1, 0, 0));
        break;
      default:
        break;
    }
  });

  player.position.y = groundLevel;
  camera.position.set(player.position.x, player.position.y + 5, player.position.z + 8);

  controls.update();

  const animate = () => {
    camera.position.z += -0.04
    render.render(scene, camera);
    console.log(player.position)
  }

  render.setAnimationLoop(animate);
}

init();

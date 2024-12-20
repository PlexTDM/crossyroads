import Lane from './copystuff.js';
const counterDOM = document.getElementById('counter');
const endDOM = document.getElementById('end');

const scene = new THREE.Scene();

const distance = 500;
const camera = new THREE.OrthographicCamera(window.innerWidth / -2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / -2, 0.1, 10000);

camera.rotation.x = 50 * Math.PI / 180;
camera.rotation.y = 20 * Math.PI / 180;
camera.rotation.z = 10 * Math.PI / 180;

const initialCameraPositionY = -Math.tan(camera.rotation.x) * distance;
const initialCameraPositionX = Math.tan(camera.rotation.y) * Math.sqrt(distance ** 2 + initialCameraPositionY ** 2);
camera.position.y = initialCameraPositionY;
camera.position.x = initialCameraPositionX;
camera.position.z = distance;

const zoom = 2;

const chickenSize = 15;

const positionWidth = 42;
const columns = 17;
const boardWidth = positionWidth * columns;

const stepTime = 150; // Miliseconds it takes for the chicken to take a step forward, backward, left or right

let lanes;
let currentLane;
let currentColumn;

let previousTimestamp;
let startMoving;
let moves;
let stepStartTimestamp;

const generateLanes = () => [-9, -8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((index) => {
    const lane = new Lane(index);
    lane.mesh.position.y = index * positionWidth * zoom;
    scene.add(lane.mesh);
    return lane;
}).filter((lane) => lane.index >= 0);

const addLane = () => {
    const index = lanes.length;
    const lane = new Lane(index);
    lane.mesh.position.y = index * positionWidth * zoom;
    scene.add(lane.mesh);
    lanes.push(lane);
}

class Chicken {
    constructor() {
        const chicken = new THREE.Group();

        const body = new THREE.Mesh(
            new THREE.BoxBufferGeometry(chickenSize * zoom, chickenSize * zoom, 20 * zoom),
            new THREE.MeshPhongMaterial({ color: 0xffffff, flatShading: true })
        );
        body.position.z = 10 * zoom;
        body.castShadow = true;
        body.receiveShadow = true;
        chicken.add(body);

        const rowel = new THREE.Mesh(
            new THREE.BoxBufferGeometry(2 * zoom, 4 * zoom, 2 * zoom),
            new THREE.MeshLambertMaterial({ color: 0xF0619A, flatShading: true })
        );
        rowel.position.z = 21 * zoom;
        rowel.castShadow = true;
        rowel.receiveShadow = false;
        chicken.add(rowel);

        return chicken;
    }
}

const chicken = new Chicken();
scene.add(chicken);

const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.6);
scene.add(hemiLight)

const initialDirLightPositionX = -100;
const initialDirLightPositionY = -200;
const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
dirLight.position.set(initialDirLightPositionX, initialDirLightPositionY, 200);
dirLight.castShadow = true;
dirLight.target = chicken;
scene.add(dirLight);

dirLight.shadow.mapSize.width = 1024;
dirLight.shadow.mapSize.height = 1024;
var d = 100;
dirLight.shadow.camera.left = - d;
dirLight.shadow.camera.right = d * 5;
dirLight.shadow.camera.top = d;
dirLight.shadow.camera.bottom = - d;

let helper = new THREE.CameraHelper(dirLight.shadow.camera);
// let helper = new THREE.CameraHelper(camera);
scene.add(helper)

const backLight = new THREE.DirectionalLight(0x000000, 0.4);
backLight.position.set(200, 200, 50);
backLight.castShadow = true;
scene.add(backLight)

const initaliseValues = () => {
    lanes = generateLanes()

    currentLane = 0;
    currentColumn = Math.floor(columns / 2);

    previousTimestamp = null;

    startMoving = false;
    moves = [];
    stepStartTimestamp;

    chicken.position.x = 0;
    chicken.position.y = 0;

    camera.position.y = initialCameraPositionY;
    camera.position.x = initialCameraPositionX;

    dirLight.position.x = initialDirLightPositionX;
    dirLight.position.y = initialDirLightPositionY;
}

initaliseValues();

const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

document.querySelector("#retry").addEventListener("click", () => {
    lanes.forEach(lane => scene.remove(lane.mesh));
    initaliseValues();
    endDOM.style.visibility = 'hidden';
});

document.getElementById('forward').addEventListener("click", () => move('forward'));

document.getElementById('backward').addEventListener("click", () => move('backward'));

document.getElementById('left').addEventListener("click", () => move('left'));

document.getElementById('right').addEventListener("click", () => move('right'));

window.addEventListener("keydown", event => {
    if (event.key === 'ArrowUp' || event.key === 'w') {
        move('forward');
    }
    else if (event.key == 'ArrowDown' || event.key === 's') {
        move('backward');
    }
    else if (event.key == 'ArrowLeft' || event.key === 'a') {
        move('left');
    }
    else if (event.key == 'ArrowRight' || event.key === 'd') {
        move('right');
    }
});

const move = (direction) => {
    const finalPositions = moves.reduce((position, move) => {
        if (move === 'forward') return { lane: position.lane + 1, column: position.column };
        if (move === 'backward') return { lane: position.lane - 1, column: position.column };
        if (move === 'left') return { lane: position.lane, column: position.column - 1 };
        if (move === 'right') return { lane: position.lane, column: position.column + 1 };
    }, { lane: currentLane, column: currentColumn })

    if (direction === 'forward') {
        if (lanes[finalPositions.lane + 1].type === 'forest' && lanes[finalPositions.lane + 1].occupiedPositions.has(finalPositions.column)) return;
        if (!stepStartTimestamp) startMoving = true;
        addLane();
    }
    else if (direction === 'backward') {
        if (finalPositions.lane === 0) return;
        if (lanes[finalPositions.lane - 1].type === 'forest' && lanes[finalPositions.lane - 1].occupiedPositions.has(finalPositions.column)) return;
        if (!stepStartTimestamp) startMoving = true;
    }
    else if (direction === 'left') {
        if (finalPositions.column === 0) return;
        if (lanes[finalPositions.lane].type === 'forest' && lanes[finalPositions.lane].occupiedPositions.has(finalPositions.column - 1)) return;
        if (!stepStartTimestamp) startMoving = true;
    }
    else if (direction === 'right') {
        if (finalPositions.column === columns - 1) return;
        if (lanes[finalPositions.lane].type === 'forest' && lanes[finalPositions.lane].occupiedPositions.has(finalPositions.column + 1)) return;
        if (!stepStartTimestamp) startMoving = true;
    }
    moves.push(direction);
}

const animate = (timestamp) => {
    requestAnimationFrame(animate);

    if (!previousTimestamp) previousTimestamp = timestamp;
    const delta = timestamp - previousTimestamp;
    previousTimestamp = timestamp;

    // Animate cars and trucks moving on the lane
    lanes.forEach(lane => {
        if (lane.type === 'car' || lane.type === 'truck') {
            const aBitBeforeTheBeginingOfLane = -boardWidth * zoom / 2 - positionWidth * 2 * zoom;
            const aBitAfterTheEndOFLane = boardWidth * zoom / 2 + positionWidth * 2 * zoom;
            lane.vechicles.forEach(vechicle => {
                if (lane.direction) {
                    vechicle.position.x = vechicle.position.x < aBitBeforeTheBeginingOfLane ? aBitAfterTheEndOFLane : vechicle.position.x -= lane.speed / 16 * delta;
                } else {
                    vechicle.position.x = vechicle.position.x > aBitAfterTheEndOFLane ? aBitBeforeTheBeginingOfLane : vechicle.position.x += lane.speed / 16 * delta;
                }
            });
        }
    });

    if (startMoving) {
        stepStartTimestamp = timestamp;
        startMoving = false;
    }

    if (stepStartTimestamp) {
        const moveDeltaTime = timestamp - stepStartTimestamp;
        const moveDeltaDistance = Math.min(moveDeltaTime / stepTime, 1) * positionWidth * zoom;
        const jumpDeltaDistance = Math.sin(Math.min(moveDeltaTime / stepTime, 1) * Math.PI) * 8 * zoom;
        switch (moves[0]) {
            case 'forward': {
                const positionY = currentLane * positionWidth * zoom + moveDeltaDistance;
                camera.position.y = initialCameraPositionY + positionY;
                dirLight.position.y = initialDirLightPositionY + positionY;
                chicken.position.y = positionY; // initial chicken position is 0

                chicken.position.z = jumpDeltaDistance;
                break;
            }
            case 'backward': {
                const positionY = currentLane * positionWidth * zoom - moveDeltaDistance
                camera.position.y = initialCameraPositionY + positionY;
                dirLight.position.y = initialDirLightPositionY + positionY;
                chicken.position.y = positionY;

                chicken.position.z = jumpDeltaDistance;
                break;
            }
            case 'left': {
                const positionX = (currentColumn * positionWidth + positionWidth / 2) * zoom - boardWidth * zoom / 2 - moveDeltaDistance;
                camera.position.x = initialCameraPositionX + positionX;
                dirLight.position.x = initialDirLightPositionX + positionX;
                chicken.position.x = positionX; // initial chicken position is 0
                chicken.position.z = jumpDeltaDistance;
                break;
            }
            case 'right': {
                const positionX = (currentColumn * positionWidth + positionWidth / 2) * zoom - boardWidth * zoom / 2 + moveDeltaDistance;
                camera.position.x = initialCameraPositionX + positionX;
                dirLight.position.x = initialDirLightPositionX + positionX;
                chicken.position.x = positionX;

                chicken.position.z = jumpDeltaDistance;
                break;
            }
        }
        // Once a step has ended
        if (moveDeltaTime > stepTime) {
            switch (moves[0]) {
                case 'forward': {
                    currentLane++;
                    counterDOM.innerHTML = currentLane;
                    break;
                }
                case 'backward': {
                    currentLane--;
                    counterDOM.innerHTML = currentLane;
                    break;
                }
                case 'left': {
                    currentColumn--;
                    break;
                }
                case 'right': {
                    currentColumn++;
                    break;
                }
            }
            moves.shift();
            // If more steps are to be taken then restart counter otherwise stop stepping
            stepStartTimestamp = moves.length === 0 ? null : timestamp;
        }
    }

    // Hit test
    if (lanes[currentLane].type === 'car' || lanes[currentLane].type === 'truck') {
        const chickenMinX = chicken.position.x - chickenSize * zoom / 2;
        const chickenMaxX = chicken.position.x + chickenSize * zoom / 2;
        const vechicleLength = { car: 60, truck: 105 }[lanes[currentLane].type];
        lanes[currentLane].vechicles.forEach(vechicle => {
            const carMinX = vechicle.position.x - vechicleLength * zoom / 2;
            const carMaxX = vechicle.position.x + vechicleLength * zoom / 2;
            if (chickenMaxX > carMinX && chickenMinX < carMaxX) {
                endDOM.style.visibility = 'visible';
            }
        });

    }
    renderer.render(scene, camera);
}

requestAnimationFrame(animate);
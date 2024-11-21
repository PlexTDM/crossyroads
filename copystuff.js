
const positionWidth = 42;
const columns = 17;
const boardWidth = positionWidth * columns;
const zoom = 2;
const laneTypes = ['car', 'tree'];
const laneSpeeds = [2, 2.5, 3];
const vechicleColors = [0xa52523, 0xbdb638, 0x78b14b];
const threeHeights = [20, 45, 60];


class Texture {
    constructor(width, height, rects) {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, width, height);
        context.fillStyle = "rgba(0,0,0,0.6)";
        rects.forEach(rect => {
            context.fillRect(rect.x, rect.y, rect.w, rect.h);
        });
        return new THREE.CanvasTexture(canvas);
    }
}

const carFrontTexture = new Texture(40, 80, [{ x: 0, y: 10, w: 30, h: 60 }]);
const carBackTexture = new Texture(40, 80, [{ x: 10, y: 10, w: 30, h: 60 }]);
const carRightSideTexture = new Texture(110, 40, [{ x: 10, y: 0, w: 50, h: 30 }, { x: 70, y: 0, w: 30, h: 30 }]);
const carLeftSideTexture = new Texture(110, 40, [{ x: 10, y: 10, w: 50, h: 30 }, { x: 70, y: 10, w: 30, h: 30 }]);

class Road {
    constructor() {
        const road = new THREE.Group();

        const createSection = color => new THREE.Mesh(
            new THREE.PlaneBufferGeometry(boardWidth * zoom, positionWidth * zoom),
            new THREE.MeshPhongMaterial({ color })
        );

        const middle = createSection(0x454A59);
        middle.receiveShadow = true;
        road.add(middle);

        const left = createSection(0x393D49);
        left.position.x = - boardWidth * zoom;
        road.add(left);

        const right = createSection(0x393D49);
        right.position.x = boardWidth * zoom;
        road.add(right);

        return road;
    }
}

class Car {
    constructor() {
        const car = new THREE.Group();
        const color = vechicleColors[Math.floor(Math.random() * vechicleColors.length)];

        const main = new THREE.Mesh(
            new THREE.BoxBufferGeometry(60 * zoom, 30 * zoom, 15 * zoom),
            new THREE.MeshPhongMaterial({ color, flatShading: true })
        );
        main.position.z = 12 * zoom;
        main.castShadow = true;
        main.receiveShadow = true;
        car.add(main)

        const cabin = new THREE.Mesh(
            new THREE.BoxBufferGeometry(33 * zoom, 24 * zoom, 12 * zoom),
            [
                new THREE.MeshPhongMaterial({ color: 0xcccccc, flatShading: true, map: carBackTexture }),
                new THREE.MeshPhongMaterial({ color: 0xcccccc, flatShading: true, map: carFrontTexture }),
                new THREE.MeshPhongMaterial({ color: 0xcccccc, flatShading: true, map: carRightSideTexture }),
                new THREE.MeshPhongMaterial({ color: 0xcccccc, flatShading: true, map: carLeftSideTexture }),
                new THREE.MeshPhongMaterial({ color: 0xcccccc, flatShading: true }), // top
                new THREE.MeshPhongMaterial({ color: 0xcccccc, flatShading: true }) // bottom
            ]
        );
        cabin.position.x = 6 * zoom;
        cabin.position.z = 25.5 * zoom;
        cabin.castShadow = true;
        cabin.receiveShadow = true;
        car.add(cabin);

        const frontWheel = new Wheel();
        frontWheel.position.x = -18 * zoom;
        car.add(frontWheel);

        const backWheel = new Wheel();
        backWheel.position.x = 18 * zoom;
        car.add(backWheel);

        car.castShadow = true;
        car.receiveShadow = false;

        return car;
    }
}

class Wheel {
    constructor() {
        const wheel = new THREE.Mesh(
            new THREE.BoxBufferGeometry(12 * zoom, 33 * zoom, 12 * zoom),
            new THREE.MeshLambertMaterial({ color: 0x333333, flatShading: true })
        );
        wheel.position.z = 6 * zoom;
        return wheel;
    }
}

class Tree {
    constructor() {
        const three = new THREE.Group();

        const trunk = new THREE.Mesh(
            new THREE.BoxBufferGeometry(15 * zoom, 15 * zoom, 20 * zoom),
            new THREE.MeshPhongMaterial({ color: 0x4d2926, flatShading: true })
        );
        trunk.position.z = 10 * zoom;
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        three.add(trunk);

        const height = threeHeights[Math.floor(Math.random() * threeHeights.length)];

        const crown = new THREE.Mesh(
            new THREE.BoxBufferGeometry(30 * zoom, 30 * zoom, height * zoom),
            new THREE.MeshLambertMaterial({ color: 0x7aa21d, flatShading: true })
        );
        crown.position.z = (height / 2 + 20) * zoom;
        crown.castShadow = true;
        crown.receiveShadow = false;
        three.add(crown);

        return three;
    }
}

class Grass {
    constructor() {
        this.grass = new THREE.Group();
        this.init();
    }

    init = () => {
        let grass = this.grass
        const createSection = color => new THREE.Mesh(
            new THREE.BoxBufferGeometry(boardWidth * zoom, positionWidth * zoom, 3 * zoom),
            new THREE.MeshPhongMaterial({ color })
        );
        const middle = createSection(0xbaf455);
        middle.receiveShadow = true;
        grass.add(middle);

        const left = createSection(0x99C846);
        left.position.x = - boardWidth * zoom;
        grass.add(left);

        const right = createSection(0x99C846);
        right.position.x = boardWidth * zoom;
        grass.add(right);

        grass.position.z = 1.5 * zoom;
    }
}

class Lane {
    constructor(index) {
        this.index = index;
        this.type = index <= 0 ? 'field' : laneTypes[Math.floor(Math.random() * laneTypes.length)];
        this.init()
        this.mesh;
    }

    init = () => {
        switch (this.type) {
            case 'field': {
                this.mesh = new Grass();
                this.mesh = this.mesh.grass
                break;
            }
            case 'tree': {
                this.mesh = new Grass();
                this.mesh = this.mesh.grass

                this.occupiedPositions = new Set();
                this.threes = [1, 2, 3, 4].map(() => {
                    const three = new Tree();
                    let position;
                    do {
                        position = Math.floor(Math.random() * columns);
                    } while (this.occupiedPositions.has(position))
                    this.occupiedPositions.add(position);
                    three.position.x = (position * positionWidth + positionWidth / 2) * zoom - boardWidth * zoom / 2;
                    this.mesh.add(three);
                    return three;
                })
                break;
            }
            case 'car': {
                this.mesh = new Road();
                this.direction = Math.random() >= 0.5;

                const occupiedPositions = new Set();
                this.vechicles = [1, 2, 3].map(() => {
                    const vechicle = new Car();
                    let position;
                    do {
                        position = Math.floor(Math.random() * columns / 2);
                    } while (occupiedPositions.has(position))
                    occupiedPositions.add(position);
                    vechicle.position.x = (position * positionWidth * 2 + positionWidth / 2) * zoom - boardWidth * zoom / 2;
                    if (!this.direction) vechicle.rotation.z = Math.PI;
                    this.mesh.add(vechicle);
                    return vechicle;
                })

                this.speed = laneSpeeds[Math.floor(Math.random() * laneSpeeds.length)];
                break;
            }
        }
    }

    reset = () => {
        this.occupiedPositions = new Set()
    }
}

class Lights {
    constructor(scene, chicken) {
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.6);
        scene.add(hemiLight)

        this.initialDirLightPositionX = -100;
        this.initialDirLightPositionY = -100;
        this.dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
        this.dirLight.position.set(this.initialDirLightPositionX, this.initialDirLightPositionY, 200);
        this.dirLight.castShadow = true;
        this.dirLight.target = chicken;
        scene.add(this.dirLight);

        this.dirLight.shadow.mapSize.width = 1024
        this.dirLight.shadow.mapSize.height = 1024
        var d = 500
        this.dirLight.shadow.camera.left = - d
        this.dirLight.shadow.camera.right = d
        this.dirLight.shadow.camera.top = d
        this.dirLight.shadow.camera.bottom = - d

        // let helper = new THREE.CameraHelper(this.dirLight.shadow.camera)
        // let helper = new THREE.CameraHelper(camera);
        // scene.add(helper)

        const backLight = new THREE.DirectionalLight(0x000000, 0.4)
        backLight.position.set(200, 200, 50)
        backLight.castShadow = true
        scene.add(backLight)
    }
    reset = () => {
        this.dirLight.position.x = this.initialDirLightPositionX;
        this.dirLight.position.y = this.initialDirLightPositionY;
    }
    move = (dir, coords) => {
        switch (dir) {
            case 'y':
                this.dirLight.position.y = this.initialDirLightPositionY + coords
                break;
            case 'x':
                this.dirLight.position.x = this.initialDirLightPositionX + coords
            default:
                break;
        }
    }
}

export { Lane, Lights }
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export default class Stuff {
    constructor(loader, textureLoader) {
        this.loader = loader
        this.textureLoader = textureLoader
    }

    loadModel = async (url) => {
        return new Promise((resolve, reject) => {
            this.loader.load(
                url,
                (gltf) => resolve(gltf.scene),
                undefined,
                (error) => reject(error)
            );
        });
    }
    loadTexture = async (url) => {
        return new Promise((resolve, reject) => {
            this.textureLoader.load(
                url,
                (gltf) => resolve(gltf),
                undefined,
                (error) => reject(error)
            );
        })
    }
}

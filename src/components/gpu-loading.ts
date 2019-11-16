import { THREE } from 'aframe';

import { ComponentWrapper } from '../aframe-typescript-toolkit';

//https://stackoverflow.com/questions/54080795/best-way-to-force-textures-upload-to-gpu-at-scene-load-time
/**
 * @param  {Array<THREE.Material>|THREE.Material} material
 * @return {Array<THREE.Material>}
 */
function ensureMaterialArray(material) {
    if (!material) {
        return [];
    } else if (Array.isArray(material)) {
        return material;
    } else if (material.materials) {
        return material.materials;
    } else {
        return [material];
    }
}

function loadTextures(renderer, scene) {
    const material = new THREE.MeshBasicMaterial();
    const geometry = new THREE.PlaneBufferGeometry();
    const tempscene = new THREE.Scene();
    tempscene.add(new THREE.Mesh(geometry, material));
    const camera = new THREE.Camera();

    function forceTextureInitialization(texture) {
        if (texture) {
            material.map = texture;
            material.needsUpdate = true;
            renderer.render(tempscene, camera);
        }
    }

    function forceEnvTextureInitialization(texture) {
        if (texture) {
            material.envMap = texture;
            material.needsUpdate = true;
            renderer.render(tempscene, camera);
        }
    }

    scene.traverse(node => {
        if (!node.isMesh) return;

        const meshMaterials = ensureMaterialArray(node.material);

        meshMaterials.forEach(material => {
            if ('isMeshStandardMaterial' in material) {
                forceTextureInitialization(material.map);
                forceTextureInitialization(material.metalnessMap);
                forceTextureInitialization(material.roughnessMap);
                forceTextureInitialization(material.normalMap);
                forceTextureInitialization(material.lightMap);
                forceTextureInitialization(material.displacementMap);
                forceTextureInitialization(material.bumpMap);
                forceTextureInitialization(material.aoMap);
                forceTextureInitialization(material.alphaMap);
                forceEnvTextureInitialization(material.envMap);
            }
        });
    });
}

interface GpuLoadingSchema {
    readonly eventName: string;
}

export class GpuLoading extends ComponentWrapper<GpuLoadingSchema> {
    constructor() {
        super({
            eventName: {
                type: 'string',
                default: 'loaded',
            },
        });
    }

    init() {
        const onModelLoaded = () => {
            this.compile();
        };
        this.el.addEventListener(this.data.eventName, onModelLoaded);
    }

    compile() {
        const renderer = this.el.sceneEl.renderer as THREE.WebGLRenderer & { compile };
        const scene = this.el.sceneEl.object3D;
        loadTextures(renderer, scene);
        renderer.compile(scene, this.el.sceneEl.camera);
    }
}

new GpuLoading().registerComponent('gpu-loading');

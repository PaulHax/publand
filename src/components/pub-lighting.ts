import { THREE } from 'aframe';

import { ComponentWrapper } from '../aframe-typescript-toolkit';

interface PubLightingSchema {
    readonly lightmap: string;
}

export class PubLighting extends ComponentWrapper<PubLightingSchema> {
    constructor() {
        super({
            lightmap: {
                type: 'string',
                default: 'Eyes',
            },
        });
    }

    init() {
        const model = this.el.getObject3D('mesh') as THREE.Mesh;
        if (model) {
            this.load(model);
        } else {
            const onModelLoaded = (e: Event & { detail: { model: THREE.Mesh } }) => {
                this.load(e.detail.model);
            };
            this.el.addEventListener('model-loaded', onModelLoaded);
        }
    }

    load(model: THREE.Object3D) {
        // console.log(model.getObjectByName('floorwood'));
        let mesh = model.getObjectByName('floorwood') as THREE.Mesh;
        let oldMat = mesh.material as THREE.MeshStandardMaterial;
        let lightMapy = new THREE.TextureLoader().load('assets/floor_bakey.jpg');
        lightMapy.flipY = false;
        let newMat = new THREE.MeshBasicMaterial({
            map: oldMat.map,
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore
            lightMap: lightMapy,
            lightMapIntensity: 1,
        });
        mesh.material = newMat;

        mesh = model.getObjectByName('walls') as THREE.Mesh;
        oldMat = mesh.material as THREE.MeshStandardMaterial;
        lightMapy = new THREE.TextureLoader().load('assets/wallbake.jpg');
        lightMapy.flipY = false;
        newMat = new THREE.MeshBasicMaterial({
            map: oldMat.map,
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore
            lightMap: lightMapy,
            lightMapIntensity: 1,
        });
        mesh.material = newMat;

        mesh = model.getObjectByName('barbacking') as THREE.Mesh;
        oldMat = mesh.material as THREE.MeshStandardMaterial;
        lightMapy = new THREE.TextureLoader().load('assets/barbackinglight.jpg');
        lightMapy.flipY = false;
        newMat = new THREE.MeshBasicMaterial({
            map: oldMat.map,
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore
            lightMap: lightMapy,
            lightMapIntensity: 1,
        });
        mesh.material = newMat;

        // model.getObjectByName('Plane003').children.forEach(childObj => {
        //     mesh = childObj as THREE.Mesh;
        //     console.log(mesh);
        //     oldMat = mesh.material as THREE.MeshStandardMaterial;
        //     lightMapy = new THREE.TextureLoader().load('assets/barback_bake.jpg');
        //     lightMapy.flipY = false;
        //     newMat = new THREE.MeshBasicMaterial({
        //         map: oldMat.map,
        //         // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        //         // @ts-ignore
        //         lightMap: lightMapy,
        //         lightMapIntensity: 1,
        //     });
        //     mesh.material = newMat;
        // });
    }
}

new PubLighting().registerComponent('pub-lighting');

import { THREE } from 'aframe';

import { ComponentWrapper } from '../aframe-typescript-toolkit';

interface EyeFixSchema {
    readonly eyeName: string;
}

export class EyeFix extends ComponentWrapper<EyeFixSchema> {
    constructor() {
        super({
            eyeName: {
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
        const eyeG = (model.getObjectByName(this.data.eyeName) as THREE.Mesh).geometry as THREE.Geometry;
        eyeG.computeBoundingSphere();
        eyeG.boundingSphere.radius *= 2; //just double it hack
    }
}

new EyeFix().registerComponent('eyefix');

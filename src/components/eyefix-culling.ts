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
        // console.log(model);
        let eyeG = (model.getObjectByName(this.data.eyeName) as THREE.Mesh).geometry as THREE.Geometry;
        eyeG.computeBoundingSphere();
        eyeG.boundingSphere.radius *= 4; //just factor it up it hack.  Todo Move to right spot on character?
        eyeG = (model.getObjectByName('Hats') as THREE.Mesh).geometry as THREE.Geometry;
        eyeG.computeBoundingSphere();
        eyeG.boundingSphere.radius *= 4; //just factor it up it hack.  Todo Move to right spot on character?
        eyeG = (model.getObjectByName('Hair') as THREE.Mesh).geometry as THREE.Geometry;
        eyeG.computeBoundingSphere();
        eyeG.boundingSphere.radius *= 4; //just factor it up it hack.  Todo Move to right spot on character?
        eyeG = (model.getObjectByName('Shoes') as THREE.Mesh).geometry as THREE.Geometry;
        eyeG.computeBoundingSphere();
        eyeG.boundingSphere.radius *= 4; //just factor it up it hack.  Todo Move to right spot on character?
    }
}

new EyeFix().registerComponent('eyefix');

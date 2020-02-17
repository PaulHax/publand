import { THREE } from 'aframe';
import { ComponentWrapper } from '../aframe-typescript-toolkit';

import { makeBlinker } from 'three-actor/src/Blink';
import { makeBlink3D, makeBlinkTick } from 'three-actor/src/Blink3D';

interface BlinkerSchema {
    readonly meshWithMorph: string;
    readonly leftBlinkMorph: string;
    readonly rightBlinkMorph: string;
    readonly morphFactor: number;
}

export class Blinker extends ComponentWrapper<BlinkerSchema> {
    private tickBlinker: Function;

    constructor() {
        super({
            meshWithMorph: {
                type: 'string',
                default: 'Body',
            },
            leftBlinkMorph: {
                type: 'string',
                default: 'Blink_Left',
            },
            rightBlinkMorph: {
                type: 'string',
                default: 'Blink_Right',
            },
            morphFactor: {
                type: 'number',
                default: 1,
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
        const mesh = model.getObjectByName(this.data.meshWithMorph) as THREE.Mesh;
        if (mesh) {
            const bView = makeBlink3D(mesh, this.data.leftBlinkMorph, this.data.rightBlinkMorph, this.data.morphFactor);
            const bState = makeBlinker();
            this.tickBlinker = makeBlinkTick(bState, bView);
        } else {
            console.log('Error: blinker component could not find mesh child object: ' + this.data.meshWithMorph);
        }
    }

    tick(t) {
        if (this.tickBlinker) {
            this.tickBlinker(t);
        }
    }
}

new Blinker().registerComponent('blinker');

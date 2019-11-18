import { THREE } from 'aframe';
import { ComponentWrapper } from '../aframe-typescript-toolkit';

// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { ANIME } from 'aframe';

interface BlinkerSchema {
    readonly meshWithMorph: string;
    readonly leftBlinkMorph: string;
    readonly rightBlinkMorph: string;
    readonly morphFactor: number;
}

//todo https://www.bloopanimation.com/blinking-animation/
//TODO blink on head turn and start talking

export class Blinker extends ComponentWrapper<BlinkerSchema> {
    private mesh: THREE.Mesh;
    private leftBlinkMorphIndex: number;
    private rightBlinkMorphIndex: number;
    private morphInfluences: number[];
    private currentBlink = 0;
    private nextBlinkTime = 5000;

    private static SPACING = 6000; // random range between blinks
    private static DOWN_TIME = 60; //60
    private static HOLD_TIME = 30; //30
    private static UP_TIME = 90; //90
    private static BLINK_TIME = Blinker.DOWN_TIME + Blinker.HOLD_TIME + Blinker.UP_TIME;

    private blinkAnimation = ANIME.timeline({
        targets: this,
        currentBlink: 1,
        easing: 'easeInOutQuad', //easeInOutQuad  linear
    });

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
        this.blinkAnimation
            .add({
                targets: this,
                currentBlink: 1,
                duration: Blinker.DOWN_TIME,
            })
            .add(
                {
                    targets: this,
                    currentBlink: 0,
                    direction: 'normal',
                    duration: Blinker.UP_TIME,
                },
                '+=' + (Blinker.DOWN_TIME + Blinker.HOLD_TIME),
            );
    }

    load(model: THREE.Object3D) {
        this.mesh = model.getObjectByName(this.data.meshWithMorph) as THREE.Mesh;
        if (this.mesh) {
            this.morphInfluences = this.mesh.morphTargetInfluences;
            if (Object.prototype.hasOwnProperty.call(this.mesh.morphTargetDictionary, this.data.leftBlinkMorph)) {
                this.leftBlinkMorphIndex = this.mesh.morphTargetDictionary[this.data.leftBlinkMorph];
            } else {
                console.log('Error: talker component could not find jawMorph: ' + this.data.leftBlinkMorph);
            }
            if (Object.prototype.hasOwnProperty.call(this.mesh.morphTargetDictionary, this.data.rightBlinkMorph)) {
                this.rightBlinkMorphIndex = this.mesh.morphTargetDictionary[this.data.rightBlinkMorph];
            } else {
                console.log('Error: talker component could not find jawMorph: ' + this.data.rightBlinkMorph);
            }
        } else {
            console.log('Error: talker component could not find meshJawMorph: ' + this.data.meshWithMorph);
        }
    }

    tick(t, dt) {
        if (this.nextBlinkTime < t) {
            this.blinkAnimation.restart();
            this.nextBlinkTime = t + Math.random() * Blinker.SPACING + Blinker.BLINK_TIME; // + Blinker.BLINK_TIME to avoid jump
            //this.nextBlinkTime = t + 2000;
        }
        if (this.mesh && this.currentBlink) {
            this.morphInfluences[this.leftBlinkMorphIndex] = this.currentBlink * this.data.morphFactor;
            this.morphInfluences[this.rightBlinkMorphIndex] = this.currentBlink * this.data.morphFactor;
        }
    }
}

new Blinker().registerComponent('blinker');

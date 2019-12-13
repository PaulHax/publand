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

// https://www.bloopanimation.com/blinking-animation/
// Todo blink on head turn and start talking
// Todo eyes always shut on the g6 phone.  Animation timing with low framerate

export class Blinker extends ComponentWrapper<BlinkerSchema> {
    private mesh: THREE.Mesh;
    private leftBlinkMorphIndex: number;
    private rightBlinkMorphIndex: number;
    private morphInfluences: number[];
    private currentBlink = 0;
    private nextBlinkTime = 4000;

    private static SPACING = 8000; // random range between blinks
    private static INITIAL_HOLD = 100; //48
    private static DOWN_TIME = 48; //48
    private static HOLD_TIME = 24; //24
    private static UP_TIME = 72; //72
    private static BLINK_TIME = Blinker.INITIAL_HOLD + Blinker.DOWN_TIME + Blinker.HOLD_TIME + Blinker.UP_TIME;

    private blinkAnimation = ANIME.timeline({
        targets: this,
        currentBlink: 0,
        easing: 'easeInOutQuad', //easeInOutQuad  linear
        autoplay: false,
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
            //first target to keep eyes open when swithcing tabs in low framerate
            .add({
                targets: this,
                currentBlink: 0,
                duration: Blinker.INITIAL_HOLD,
            })
            .add({
                targets: this,
                currentBlink: 1,
                duration: Blinker.DOWN_TIME,
            })
            .add(
                {
                    targets: this,
                    currentBlink: 0,
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

    tick(t) {
        if (this.nextBlinkTime < t) {
            this.blinkAnimation.restart();
            this.nextBlinkTime = t + Math.random() * Blinker.SPACING + Blinker.BLINK_TIME; // + Blinker.BLINK_TIME to avoid blinking while blinking
            //this.nextBlinkTime = t + 2000;
        }
        if (this.currentBlink && this.mesh) {
            this.morphInfluences[this.leftBlinkMorphIndex] = this.currentBlink * this.data.morphFactor;
            this.morphInfluences[this.rightBlinkMorphIndex] = this.currentBlink * this.data.morphFactor;
        }
    }
}

new Blinker().registerComponent('blinker');

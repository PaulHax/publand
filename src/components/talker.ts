import { THREE, Entity, Component } from 'aframe';

import { ComponentWrapper } from '../aframe-typescript-toolkit';

interface TalkerSchema {
    readonly meshJawMorph: string;
    readonly jawMorph: string;
    readonly jawFactor: number;
}

type TalkingEntity = Entity<{
    sound: { playSound(threeAudioObjCallback): void };
    sceneEl: { audioListener: THREE.AudioListener };
}>;

interface SoundComponent extends Component {
    stopSound(): void;
    playSound(pSound: (sT: THREE.Audio) => void): void;
}

export class Talker extends ComponentWrapper<TalkerSchema> {
    private meshWithMorph: THREE.Mesh;
    private jawMorphIndex: number;
    private morphInfluences: number[];
    private analyser: AnalyserNode;
    private inputNode: AudioNode;
    private audioData: Uint8Array;
    private myEntity: TalkingEntity;
    private currentSound: SoundComponent;

    private static readonly JITTER_RADIUS = 0.8; // Higher means more filtering or weighting of old signal
    // private static readonly VOL_FILTER = 0; // Higher means more filtering or weighting of old signal
    // private static readonly VOL_F_INV = 1 - Talker.VOL_FILTER;

    constructor() {
        super({
            meshJawMorph: {
                type: 'string',
                default: 'Body',
            },
            jawMorph: {
                type: 'string',
                default: 'MouthOpen',
            },
            jawFactor: {
                type: 'number',
                default: 1,
            },
        });
    }

    //depends on sound

    init() {
        const model = this.el.getObject3D('mesh') as THREE.Object3D;
        if (model) {
            this.load(model);
        } else {
            const onModelLoaded = (e: Event & { detail: { model: THREE.Object3D } }) => {
                this.load(e.detail.model);
            };
            this.el.addEventListener('model-loaded', onModelLoaded);
        }
        this.myEntity = (this.el as unknown) as TalkingEntity;
        // this.audioAnalyser = new THREE.AudioAnalyser(this.myEntity.components.sound.pool.children[0], 32);
        // Only want one AudioListener. Cache it on the scene.
        const sceneEl = (this.myEntity.sceneEl as unknown) as THREE.Scene & { audioListener: THREE.AudioListener };
        const listener = sceneEl.audioListener || new THREE.AudioListener();
        sceneEl.audioListener = listener;

        const analyser = listener.context.createAnalyser();
        analyser.fftSize = 32;
        analyser.smoothingTimeConstant = 0;
        this.audioData = new Uint8Array(analyser.fftSize);
        this.analyser = analyser;
        this.inputNode = analyser;

        // const filter = listener.context.createBiquadFilter();
        // filter.type = 'lowpass';
        // filter.frequency.value = 5000;
        // filter.Q.value = 50;
        // this.inputNode = filter;
        // this.inputNode.connect(analyser);

        this.myEntity.addEventListener('sound-ended', this.endSound);
    }

    remove() {
        this.myEntity.removeEventListener('sound-ended', this.endSound);
    }

    load(model: THREE.Object3D) {
        this.meshWithMorph = model.getObjectByName(this.data.meshJawMorph) as THREE.Mesh;
        if (this.meshWithMorph) {
            if (Object.prototype.hasOwnProperty.call(this.meshWithMorph.morphTargetDictionary, this.data.jawMorph)) {
                this.morphInfluences = this.meshWithMorph.morphTargetInfluences;
                this.jawMorphIndex = this.meshWithMorph.morphTargetDictionary[this.data.jawMorph];
            } else {
                console.log('Error: talker component could not find jawMorph: ' + this.data.jawMorph);
            }
        } else {
            console.log('Error: talker component could not find meshJawMorph: ' + this.data.meshJawMorph);
        }
    }

    speak(soundComponent: string) {
        const el = this.myEntity;
        if (this.currentSound) {
            this.currentSound.stopSound();
        }
        this.currentSound = el.components['sound__' + soundComponent];
        this.currentSound.playSound(audioThree => {
            audioThree.getOutput().connect(this.inputNode);
        });
    }

    endSound(e) {
        if (this.currentSound && e.id === this.currentSound.id) {
            this.currentSound = null;
        }
    }

    tick() {
        if (this.currentSound && this.meshWithMorph) {
            let sum = 0;
            const data = this.audioData;
            const size = this.analyser.fftSize;
            this.analyser.getByteFrequencyData(data);
            for (let i = 0; i < size; i++) {
                sum += data[i];
            }
            const lastV = this.morphInfluences[this.jawMorphIndex];
            let currentV = Math.min((sum / size) * this.data.jawFactor, 1);
            const diff = Math.abs(lastV - currentV);
            if (diff <= Talker.JITTER_RADIUS) {
                const filterAmount = diff / Talker.JITTER_RADIUS;
                currentV = currentV * filterAmount + lastV * (1 - filterAmount);
            }
            this.morphInfluences[this.jawMorphIndex] = currentV;
            //todo  low pass filter: try double expoential moving average filter.
            //ToDo Frame of lag as sound starts before mouth movement as we can't precive asynchory if visual is under 130 ms after audio ?
            // https://pdfs.semanticscholar.org/95ba/3dfffeb7dd133b23b90f1e25eee7a2b7015a.pdf?_ga=2.166311166.1791214883.1572632425-210607018.1572632425
            // this.morphInfluences[this.jawMorphIndex] = lastV * Talker.VOL_FILTER + currentV * Talker.VOL_F_INV;
        }
    }
}

new Talker().registerComponent('talker');

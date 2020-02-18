import { THREE, Entity, Component } from 'aframe';

import { ComponentWrapper } from '../aframe-typescript-toolkit';

import { makeTalk, TalkState } from 'three-actor/lib/Talk';
import { makeTalk3D, makeTalkTick } from 'three-actor/lib/Talk3D';

interface TalkerSchema {
    readonly meshJawMorph: string;
    readonly jawMorph: string;
    readonly jawFactor: number;
    readonly sound: string;
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
    private myEntity: TalkingEntity;
    private currentSound: SoundComponent;

    private talkState: TalkState = makeTalk();
    private talkViewTick: Function;

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
            sound: {
                type: 'string',
                default: '',
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
    }

    // remove() {}

    load(model: THREE.Object3D) {
        this.meshWithMorph = model.getObjectByName(this.data.meshJawMorph) as THREE.Mesh;
        if (this.meshWithMorph) {
            if (!Object.prototype.hasOwnProperty.call(this.meshWithMorph.morphTargetDictionary, this.data.jawMorph)) {
                console.log('Error: talker component could not find jawMorph: ' + this.data.jawMorph);
            }
        } else {
            console.log('Error: talker component could not find meshJawMorph: ' + this.data.meshJawMorph);
        }
    }

    update(oldData) {
        const data = this.data;
        if (data.sound != '' && oldData.sound !== data.sound) {
            this.speak(data.sound);
        }
    }

    speak(soundComponent: string) {
        const el = this.myEntity;
        this.stopSpeaking();
        const newSound = 'sound__' + soundComponent;
        if (newSound in el.components) {
            this.currentSound = el.components['sound__' + soundComponent];
            this.currentSound.playSound(audioThree => {
                const talkView = makeTalk3D(this.meshWithMorph, this.data.jawMorph, audioThree, 0.01, this.talkState);
                this.talkViewTick = makeTalkTick(talkView, this.talkState);
            });
        } else {
            console.log('Error: Could not find sound on entitiy: ' + newSound);
        }
    }

    stopSpeaking() {
        if (this.currentSound) {
            this.currentSound.stopSound();
        }
    }

    tick() {
        if (this.talkViewTick) {
            this.talkViewTick();
        }
    }
}

new Talker().registerComponent('talker');

import { Entity, THREE } from 'aframe';
import { ComponentWrapper } from '../aframe-typescript-toolkit';
import { look3D, attachEffector, blendTo } from 'three-actor/lib/Look3D';

interface WatcherSchema {
    readonly lookAtID: string; // Todo make selector
    readonly headBone: string;
    readonly eyeBoneL: string;
    readonly eyeBoneR: string;
}

export class Watcher extends ComponentWrapper<WatcherSchema> {
    private model: THREE.Object3D;
    private headBone: THREE.Bone;
    private eyeBones: [THREE.Bone, THREE.Bone];
    private lookTick: Function;
    private blendBackTickers: Function[] = [];
    private lookAtTarget: THREE.Object3D;
    private mixerWeight = 1;
    private lastQ: THREE.Quaternion = new THREE.Quaternion();

    constructor() {
        super({
            lookAtID: {
                type: 'string',
                default: '',
            },
            headBone: {
                type: 'string',
                default: '',
            },
            eyeBoneL: {
                type: 'string',
                default: 'mixamorigLeftEye',
            },
            eyeBoneR: {
                type: 'string',
                default: 'mixamorigRightEye',
            },
        });
    }

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
    }

    load(model: THREE.Object3D) {
        this.model = model;
        this.headBone = this.model.getObjectByName(this.data.headBone) as THREE.Bone;
        this.eyeBones = [
            this.model.getObjectByName(this.data.eyeBoneL) as THREE.Bone,
            this.model.getObjectByName(this.data.eyeBoneR) as THREE.Bone,
        ];
        //Find center eye
        this.eyeBones[0].updateWorldMatrix(true, false);
        this.eyeBones[1].updateWorldMatrix(false, false); //assuming eyes have same parent
        const eyeCenter = new THREE.Vector3()
            .setFromMatrixPosition(this.eyeBones[0].matrixWorld)
            .add(new THREE.Vector3().setFromMatrixPosition(this.eyeBones[1].matrixWorld))
            .multiplyScalar(0.5);
        this.headBone.worldToLocal(eyeCenter);
        attachEffector(eyeCenter, this.headBone);
    }

    update(oldData) {
        const data = this.data;
        if (data.lookAtID !== oldData.lookAtID) {
            //lookat changed
            if (data.lookAtID !== '') {
                //start looking at target
                const targetEl: Entity = this.el.sceneEl.querySelector(data.lookAtID);
                if (this.model && targetEl) {
                    this.lookAtTarget = targetEl.object3D;
                    this.lookTick = look3D(this.headBone, this.eyeBones, this.model);
                    if (oldData.lookAtID == '') {
                        this.lastQ.copy(this.model.quaternion); //save it
                    }
                } else {
                    this.lookAtTarget = null;
                    console.log('Watcher got nothing for lookAt target with querySelector(' + data.lookAtID + ')');
                }
            } else {
                this.lookAtTarget = null;
                if (this.model) {
                    //blend back funcs
                    this.blendBackTickers = [
                        blendTo(this.eyeBones[0].quaternion, new THREE.Quaternion(), 0.1),
                        blendTo(this.eyeBones[1].quaternion, new THREE.Quaternion(), 0.1),
                        blendTo(this.headBone.quaternion, this.headBone.quaternion, 0.3), //samples start quat of IK, then blends back to current exported animation
                        blendTo(this.model.quaternion, this.lastQ, 1),
                    ];
                }
            }
        }
    }

    tick = (function() {
        const targetPos = new THREE.Vector3();
        return function(t, dt) {
            if (this.model) {
                const sec = dt / 1000;
                if (this.lookAtTarget) {
                    this.lookAtTarget.updateWorldMatrix(true);
                    targetPos.setFromMatrixPosition(this.lookAtTarget.matrixWorld);
                    this.lookTick(targetPos, sec);
                } else {
                    this.blendBackTickers.forEach(tick => tick(sec));
                }
            }
        };
    })();
}

new Watcher().registerComponent('watcher');

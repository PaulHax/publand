import { Entity, THREE, Component } from 'aframe';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { ANIME } from 'aframe';

import { ComponentWrapper } from '../aframe-typescript-toolkit';

interface WatcherSchema {
    readonly lookAtID: string; // Todo make selector?
    readonly headBone: string;
}

export class Watcher extends ComponentWrapper<WatcherSchema> {
    private model: THREE.Object3D;
    private headBone: THREE.Bone;
    private eyeMatrix = new THREE.Matrix4().makeTranslation(0, 0.11, 0);
    private lastQ = new THREE.Quaternion();
    private lookAtTarget: THREE.Object3D;
    private mixerWeight = 1;
    private animationMixer: Component;
    private static readonly ROTATE_SPEED = THREE.Math.degToRad(210); // Degrees per second
    private static readonly HEAD_YAW_MAX = 40; // Degrees

    constructor() {
        super({
            lookAtID: {
                type: 'string',
                default: 'null',
            },
            headBone: {
                type: 'string',
                default: '',
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
        this.animationMixer = this.el.components['animation-mixer-tick'];
    }

    update(oldData) {
        const data = this.data;
        if (data.lookAtID !== oldData.lookAtID) {
            if (this.data.lookAtID !== 'null') {
                const targetEl: Entity = this.el.sceneEl.querySelector(data.lookAtID);
                if (targetEl) {
                    this.lookAtTarget = targetEl.object3D;
                } else {
                    this.lookAtTarget = null;
                    console.log('Watcher got nothing for lookAt target with querySelector(' + data.lookAtID + ')');
                }
            } else {
                this.lookAtTarget = null;
                if (this.headBone) {
                    this.mixerWeight = 0;
                    this.lastQ.copy(this.headBone.quaternion);
                    ANIME({
                        targets: this,
                        mixerWeight: 1,
                        duration: 300,
                        easing: 'easeOutSine',
                    });
                }
            }
        }
        if (data.headBone !== oldData.headBone) {
            if (this.model) {
                this.headBone = this.model.getObjectByName(data.headBone) as THREE.Bone;
            }
        }
    }

    tick = (function() {
        const q1 = new THREE.Quaternion();
        const q2 = new THREE.Quaternion();
        const q3 = new THREE.Quaternion();
        const m1 = new THREE.Matrix4();
        const lookAtPos = new THREE.Vector3();
        const v1 = new THREE.Vector3();
        const MAX_MAGNITUDE = Math.sin(0.5 * THREE.Math.degToRad(Watcher.HEAD_YAW_MAX));
        const MAX_MAGNITUDE_W = Math.sqrt(1.0 - MAX_MAGNITUDE * MAX_MAGNITUDE);
        const MAX_MAG_POW_2 = MAX_MAGNITUDE * MAX_MAGNITUDE;

        return function(t, dt) {
            if (this.model) {
                if (this.headBone) {
                    q2.copy(this.headBone.quaternion); //save it before animation overwrites
                }
                if (this.animationMixer) {
                    this.animationMixer.tickManual(t, dt);
                }
                if (this.headBone) {
                    if (this.lookAtTarget) {
                        //this.model.updateMatrixWorld();
                        const modelY = this.model.matrixWorld.elements[13]; //get y
                        lookAtPos.setFromMatrixPosition(this.lookAtTarget.matrixWorld);
                        const saveForHead = lookAtPos.y;
                        lookAtPos.y = modelY; //keep feet level
                        q1.copy(this.model.quaternion); //save for speed check
                        this.model.lookAt(lookAtPos);
                        //cap speed
                        let angleDiff = q1.angleTo(this.model.quaternion);
                        const maxAngleChange = Watcher.ROTATE_SPEED * (dt / 1000);
                        if (angleDiff > maxAngleChange) {
                            q1.rotateTowards(this.model.quaternion, maxAngleChange);
                            this.model.quaternion.copy(q1);
                        }

                        //Do the head
                        lookAtPos.y = saveForHead;
                        //this.model.updateMatrixWorld(); // need this or neck overshoots (cuz its 1 frame behind?)
                        this.headBone.updateWorldMatrix(true, false);
                        m1.copy(this.headBone.matrixWorld);
                        m1.premultiply(this.eyeMatrix);
                        v1.setFromMatrixPosition(m1); //eyePos
                        m1.lookAt(lookAtPos, v1, this.headBone.up);
                        //old rotation already saved in q2
                        this.headBone.quaternion.setFromRotationMatrix(m1); //target rotation in world
                        //world to parent space
                        m1.extractRotation(this.headBone.parent.matrixWorld); //if parent not null?
                        q1.setFromRotationMatrix(m1);
                        this.headBone.quaternion.premultiply(q1.inverse());
                        //cap speed
                        angleDiff = q2.angleTo(this.headBone.quaternion); //old rotation already saved in q2
                        if (angleDiff > maxAngleChange) {
                            q2.rotateTowards(this.headBone.quaternion, maxAngleChange);
                            this.headBone.quaternion.copy(q2); //todo optomize
                        }

                        //clamp neck rotation with swing + twist parameterization
                        // https://stackoverflow.com/questions/3684269/component-of-a-quaternion-rotation-around-an-axis/4341489
                        // https://stackoverflow.com/questions/32813626/constrain-pitch-yaw-roll/32846982
                        // http://www.allenchou.net/2018/05/game-math-swing-twist-interpolation-sterp/
                        // https://stackoverflow.com/questions/42428136/quaternion-is-flipping-sign-for-very-similar-rotations
                        const qT = this.headBone.quaternion;
                        // v1.set(qT.x, qT.y, qT.z); //todo check singularity: rotation by 180 degree if (r.sqrMagnitude < MathUtil.Epsilon)
                        // v1.projectOnVector(this.headBone.up); //up is direction around twist
                        v1.set(0, qT.y, 0); //project on y axis
                        q1.set(v1.x, v1.y, v1.z, qT.w); //twist
                        q1.normalize();
                        q3.copy(q1).conjugate();
                        q2.multiplyQuaternions(qT, q3); //swing
                        q2.normalize();
                        v1.set(q1.x, q1.y, q1.z);
                        if (v1.lengthSq() > MAX_MAG_POW_2) {
                            v1.setLength(MAX_MAGNITUDE);
                            const sign = qT.w < 0 ? -1 : 1;
                            q1.set(v1.x, v1.y, v1.z, sign * MAX_MAGNITUDE_W);
                            qT.multiplyQuaternions(q2, q1); //swing * twist
                        }
                    } else if (this.mixerWeight < 1) {
                        // no lookat target
                        this.headBone.quaternion.slerp(this.lastQ, 1 - this.mixerWeight);
                    }
                }
            }
        };
    })();
}

new Watcher().registerComponent('watcher');

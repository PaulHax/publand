import { Entity, THREE, Component } from 'aframe';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { ANIME } from 'aframe';

import { ComponentWrapper } from '../aframe-typescript-toolkit';
import { PointLightHelper } from 'three';

interface WatcherSchema {
    readonly lookAtID: string; // Todo make selector
    readonly headBone: string;
    readonly speed: number;
}

export class Watcher extends ComponentWrapper<WatcherSchema> {
    private model: THREE.Object3D;
    private headBone: THREE.Bone;
    private eyeOffset = new THREE.Matrix4().makeTranslation(0, 0.11, 0);
    private lastQ = new THREE.Quaternion();
    private lookAtTarget: THREE.Object3D;
    private mixerWeight = 1;
    private animationMixer: Component;
    private static readonly ROTATE_SPEED_BASE = THREE.Math.degToRad(40); // Degrees per second
    private static readonly ROTATE_EASING = 1.01; // Higher is more easing in
    private static readonly HEAD_YAW_MAX = 40; // Degrees
    private static readonly HEAD_TILT_MAX = 40; // Degrees

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
            speed: {
                type: 'number',
                default: THREE.Math.degToRad(300), //300
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
        if ('animation-mixer-tick' in this.el.components) {
            this.animationMixer = this.el.components['animation-mixer-tick'];
        }
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

    ticksilly = (function() {
        const lookAtPos = new THREE.Vector3();

        return function(t, dt) {
            if (this.headBone && this.lookAtTarget) {
                const lookAtPos = new THREE.Vector3();
                lookAtPos.setFromMatrixPosition(this.lookAtTarget.matrixWorld);
                this.pointBone(this.headBone, lookAtPos, this.headBone, dt);
            }
        };
    })();

    tick = (function() {
        const q1 = new THREE.Quaternion();
        const q2 = new THREE.Quaternion();
        const q3 = new THREE.Quaternion();
        const m1 = new THREE.Matrix4();
        const lookAtPos = new THREE.Vector3();
        const v1 = new THREE.Vector3();
        const MAX_MAGNITUDE = Math.sin(0.5 * THREE.Math.DEG2RAD * Watcher.HEAD_YAW_MAX);
        const MAX_MAG_POW_2 = MAX_MAGNITUDE * MAX_MAGNITUDE;
        const MAX_MAGNITUDE_W = Math.sqrt(1.0 - MAX_MAG_POW_2);

        const SWING_MAX = Math.sin(0.5 * THREE.Math.DEG2RAD * Watcher.HEAD_TILT_MAX);
        const SWING_MAX_POW2 = SWING_MAX * SWING_MAX;
        const SWING_MAX_W = Math.sqrt(1.0 - SWING_MAX_POW2);

        return function(t, dt) {
            if (this.model) {
                if (this.headBone) {
                    q2.copy(this.headBone.quaternion); //save local quat before animation overwrites
                    m1.extractRotation(this.headBone.matrixWorld); //todo is safe?: q3.setFromRotationMatrix(this.headBone.matrixWorld);
                    q3.setFromRotationMatrix(m1); //old head rotation world
                }
                if (this.animationMixer) {
                    this.animationMixer.tickManual(t, dt); // Update built in animation
                }
                if (this.headBone) {
                    if (this.lookAtTarget) {
                        // Rotate body.  Assumes model is in world space
                        //this.model.updateWorldMatrix(true, false); //Want this if moving along Y axis
                        const modelY = this.model.matrixWorld.elements[13]; //get y
                        lookAtPos.setFromMatrixPosition(this.lookAtTarget.matrixWorld);
                        const saveForHead = lookAtPos.y;
                        lookAtPos.y = modelY; //keep feet level
                        q1.copy(this.model.quaternion); //save for speed check
                        this.model.lookAt(lookAtPos);

                        const angleDiff = this.model.quaternion.angleTo(q1);
                        //console.log('body', angleDiff);
                        this.rotateTowards(this.model.quaternion, q1, angleDiff, dt);

                        // Rotate head
                        this.headBone.updateWorldMatrix(true, false); // Keeps neck from overshooting cuz it's 1 frame behind just moved main model
                        m1.copy(this.headBone.matrixWorld);
                        m1.premultiply(this.eyeOffset);
                        v1.setFromMatrixPosition(m1); // v1 = eyePos in world space
                        lookAtPos.y = saveForHead;
                        m1.lookAt(lookAtPos, v1, this.headBone.up);
                        this.headBone.quaternion.setFromRotationMatrix(m1); //target rotation in world

                        //calculate ease amount in world
                        const headAngleDiff = Math.max(this.headBone.quaternion.angleTo(q3) * 1.2, angleDiff * 1.2); //todo haxk with multiplier
                        //world to parent space
                        m1.extractRotation(this.headBone.parent.matrixWorld);
                        q1.setFromRotationMatrix(m1);
                        this.headBone.quaternion.premultiply(q1.inverse());
                        //cap speed in local
                        this.rotateTowards(this.headBone.quaternion, q2, headAngleDiff, dt); //q3 is old world rotation

                        //clamp neck rotation with swing + twist parameterization
                        // https://stackoverflow.com/questions/3684269/component-of-a-quaternion-rotation-around-an-axis/4341489
                        // https://stackoverflow.com/questions/32813626/constrain-pitch-yaw-roll/32846982
                        // http://www.allenchou.net/2018/05/game-math-swing-twist-interpolation-sterp/
                        // https://stackoverflow.com/questions/42428136/quaternion-is-flipping-sign-for-very-similar-rotations
                        const qT = this.headBone.quaternion;
                        v1.set(qT.x, qT.y, qT.z); //todo check singularity: rotation by 180 degree if (r.sqrMagnitude < MathUtil.Epsilon)
                        // v1.projectOnVector(this.headBone.up); //up is direction around twist
                        //v1.set(0, qT.y, 0); //project on y axis
                        //q1.set(v1.x, v1.y, v1.z, qT.w); //twist
                        q1.set(0, qT.y, 0, qT.w); //twist: project on y then get twist
                        q1.normalize();

                        q3.copy(q1).conjugate();
                        q2.multiplyQuaternions(qT, q3); //swing

                        // Cap swing and twist angles
                        v1.set(q1.x, q1.y, q1.z);
                        if (v1.lengthSq() > MAX_MAG_POW_2) {
                            v1.setLength(MAX_MAGNITUDE);
                            const sign = qT.w < 0 ? -1 : 1;
                            q1.set(v1.x, v1.y, v1.z, sign * MAX_MAGNITUDE_W);
                        }

                        q2.normalize();
                        v1.set(q2.x, q2.y, q2.z);
                        if (v1.lengthSq() > SWING_MAX_POW2) {
                            v1.setLength(SWING_MAX);
                            q2.set(v1.x, v1.y, v1.z, SWING_MAX_W); //todo don't know why perserving sign here causes jumps. cancels out twist ceiling?
                        }

                        qT.multiplyQuaternions(q2, q1); //swing * twist
                    } else if (this.mixerWeight < 1) {
                        // no lookat target
                        this.headBone.quaternion.slerp(this.lastQ, 1 - this.mixerWeight);
                    }
                }
            }
        };
    })();

    //Side effects: manipulates parameters
    rotateTowards = (function() {
        return function(targetQuat, lastQuat, angleDiff, dt) {
            //cap speed
            //const angleDiff = targetQuat.angleTo(lastQuat); //q1.angleTo(this.model.quaternion); // targetAngle - lastAngle
            const n = angleDiff / Math.PI; //normalize angle change: 0 to 1
            // decelerating to zero velocity
            const increasedSpeed = n * (2 - n) * this.data.speed; //easing from https://gist.github.com/gre/1650294
            const speed = Watcher.ROTATE_SPEED_BASE + increasedSpeed;
            const maxAngleChange = speed * (dt / 1000);

            //console.log(n, speed);
            if (angleDiff > maxAngleChange) {
                lastQuat.rotateTowards(targetQuat, maxAngleChange);
                targetQuat.copy(lastQuat);
            }
        };
    })();

    pointBone = (function() {
        const m1 = new THREE.Matrix4();
        const v1 = new THREE.Vector3();
        const q1 = new THREE.Quaternion();

        return function(bone, targetPos, effector, dt) {
            //how far does effector have to go to target
            effector.updateWorldMatrix(true, false);
            m1.copy(effector.matrixWorld);
            v1.setFromMatrixPosition(m1); // v1 = eyePos in world space
            m1.lookAt(targetPos, v1, effector.up);
            const angleDiff = this.model.quaternion.angleTo(q1);
            //forward then backward passes?

            //move bone twoards target
            //maybe no more needed, else go to parent and move it.
        };
    })();
}

new Watcher().registerComponent('watcher');

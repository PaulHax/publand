import { Entity, THREE, Component } from 'aframe';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { ANIME } from 'aframe';

import { ComponentWrapper } from '../aframe-typescript-toolkit';
import { PointLightHelper, Vector2 } from 'three';

interface WatcherSchema {
    readonly lookAtID: string; // Todo make selector
    readonly headBone: string;
    readonly speed: number;
}

export class Watcher extends ComponentWrapper<WatcherSchema> {
    private model: THREE.Object3D;
    private headBone: THREE.Bone;
    private hips: THREE.Object3D;
    private eyeOffset = new THREE.Matrix4().makeTranslation(0, 0.11, 0);
    private lastQ = new THREE.Quaternion();
    private lastHipQ = new THREE.Quaternion();
    private lookAtTarget: THREE.Object3D;
    private mixerWeight = 1;
    private animationMixer: Component;
    private static readonly ROTATE_SPEED_MIN = THREE.Math.degToRad(100); // 40 Degrees per second
    private static readonly EASING_START_ANGLE = THREE.Math.degToRad(20); //40
    private static readonly HEAD_YAW_MAX = 50; // 40 Degrees
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
                default: THREE.Math.degToRad(200), //300
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
        this.hips = this.model; //this.model.getObjectByName('mixamorigHips') as THREE.Bone;
        if ('animation-mixer-tick' in this.el.components) {
            this.animationMixer = this.el.components['animation-mixer-tick'];
        }
        // const helper = new THREE.SkeletonHelper(model);
        // helper.material.linewidth = 3;
        // this.el.sceneEl.object3D.add(helper);
        // this.axesHelper = new THREE.AxesHelper(50);
        // this.el.sceneEl.object3D.add(this.axesHelper);
        // this.axesHelper.matrixAutoUpdate = false;

        // this.axesHelper1 = new THREE.AxesHelper(3);
        // this.el.sceneEl.object3D.add(this.axesHelper1);
        // this.axesHelper2 = new THREE.AxesHelper(6);
        // this.el.sceneEl.object3D.add(this.axesHelper2);
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
                    this.lastHipQ.copy(this.hips.quaternion);
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
        return function(t, dt) {
            if (this.model) {
                if (this.headBone && this.lookAtTarget) {
                    //save rotation before animation overwrites
                    q1.copy(this.headBone.quaternion);
                    //q2.copy(this.hips.quaternion);
                }
                if (this.animationMixer) {
                    this.animationMixer.tickManual(t, dt); // Update built in animation
                }
                if (this.headBone) {
                    if (this.lookAtTarget) {
                        this.headBone.quaternion.copy(q1);
                        //this.hips.quaternion.copy(q2);
                        this.doLookat(dt);
                    } else if (this.mixerWeight < 1) {
                        // no lookat target
                        this.headBone.quaternion.slerp(this.lastQ, 1 - this.mixerWeight);
                        this.hips.quaternion.slerp(this.lastHipQ, 1 - this.mixerWeight);
                    }
                }
            }
        };
    })();

    doLookat = (function() {
        const lookAtPos = new THREE.Vector3();
        const effectorM = new THREE.Matrix4();

        const m1 = new THREE.Matrix4();
        const m2 = new THREE.Matrix4();

        const v1 = new THREE.Vector3();
        const v2 = new THREE.Vector3();

        const q1 = new THREE.Quaternion();
        const q2 = new THREE.Quaternion();
        const q3 = new THREE.Quaternion();

        //need some degrees of slop to get head all the way there as head local yaw/tilt axis does not match body yaw axis
        const CLOSE_ENOUGH_ANGLE = THREE.Math.DEG2RAD * (Watcher.HEAD_YAW_MAX - 15);

        return function(dt) {
            if (this.headBone && this.lookAtTarget) {
                lookAtPos.setFromMatrixPosition(this.lookAtTarget.matrixWorld);

                this.headBone.updateWorldMatrix(true, false);
                effectorM.copy(this.headBone.matrixWorld);
                effectorM.premultiply(this.eyeOffset);

                let bone = this.headBone;
                v1.setFromMatrixPosition(effectorM);
                v2.setFromMatrixColumn(bone.parent.matrixWorld, 1);
                v2.normalize();
                v2.y += 1; //Head likes to stay upright. Blend to world up 50%
                v2.normalize();
                m1.lookAt(lookAtPos, v1, v2); //m1 = effector pointing to target

                q1.setFromRotationMatrix(m1); //effector target quat
                m2.extractRotation(effectorM);
                q2.setFromRotationMatrix(m2); //effector current quat

                let angleDiff = q2.angleTo(q1); //effector to target angle

                m1.extractRotation(bone.matrixWorld); //extractRotation needed
                q2.setFromRotationMatrix(m1);

                this.rotateTowards(q1, q2, angleDiff, dt);

                m1.extractRotation(bone.parent.matrixWorld);
                q3.setFromRotationMatrix(m1);
                q1.premultiply(q3.inverse());
                bone.quaternion.copy(q1);

                this.constrainSwingTwist(bone.quaternion);

                //do body now
                bone = this.hips;

                v1.setFromMatrixPosition(bone.matrixWorld); //todo lookat from bone or effector position?

                v1.y = lookAtPos.y;
                v2.set(0, 1, 0);
                m1.lookAt(lookAtPos, v1, v2); //m1 = bone pointing to target
                q1.setFromRotationMatrix(m1); //bone target quat in world

                m2.extractRotation(bone.matrixWorld);
                q2.setFromRotationMatrix(m2); //bone current quat
                angleDiff = q2.angleTo(q1); //bone to target angle

                const angleLeft = angleDiff - CLOSE_ENOUGH_ANGLE;
                if (angleLeft > 0) {
                    m1.extractRotation(bone.matrixWorld); //extractRotation needed
                    q2.setFromRotationMatrix(m1);

                    this.rotateTowards(q1, q2, angleLeft, dt);

                    //put in back in parent hierarchy
                    m1.extractRotation(bone.parent.matrixWorld);
                    q3.setFromRotationMatrix(m1);
                    q1.premultiply(q3.inverse());
                    bone.quaternion.copy(q1);

                    // limit rotation to around some axis
                    // let c = this.hips.quaternion.w;
                    // if (c > 1.0) c = 1.0;
                    // const c2 = Math.sqrt(1 - c * c);
                    // this.hips.quaternion.set(c2, 0, 0, c);
                }
            }
        };
    })();

    //Side effects: manipulates parameters
    rotateTowards = (function() {
        return function(targetQuat, lastQuat, angleDiff, dt) {
            //cap speed
            const n = Math.min(angleDiff / Watcher.EASING_START_ANGLE, 1); //normalize angle change: 0 to 1.  Over lookat process goes from 1 to 0.
            // decelerating to zero velocity
            const increasedSpeed = n * n * this.data.speed; //easing from https://gist.github.com/gre/1650294
            const speed = Watcher.ROTATE_SPEED_MIN + increasedSpeed;
            const maxAngleChange = Math.min(speed * (dt / 1000), angleDiff);
            // equals in >= comparison for when angleDiff smaller than speed, like when hips are close enough
            if (angleDiff >= maxAngleChange) {
                lastQuat.rotateTowards(targetQuat, maxAngleChange);
                targetQuat.copy(lastQuat); // copy, not first "out" rotateTowards, so under maxAngleChange path is faster
            }
        };
    })();

    constrainSwingTwist = (function() {
        const v1 = new THREE.Vector3();
        const q1 = new THREE.Quaternion();
        const q2 = new THREE.Quaternion();
        const q3 = new THREE.Quaternion();

        const MAX_MAGNITUDE = Math.sin(0.5 * THREE.Math.DEG2RAD * Watcher.HEAD_YAW_MAX);
        const MAX_MAG_POW_2 = MAX_MAGNITUDE * MAX_MAGNITUDE;
        const MAX_MAGNITUDE_W = Math.sqrt(1.0 - MAX_MAG_POW_2);

        const SWING_MAX = Math.sin(0.5 * THREE.Math.DEG2RAD * Watcher.HEAD_TILT_MAX);
        const SWING_MAX_POW2 = SWING_MAX * SWING_MAX;
        const SWING_MAX_W = Math.sqrt(1.0 - SWING_MAX_POW2);

        return function(quat) {
            //clamp neck rotation with swing + twist parameterization
            // https://stackoverflow.com/questions/3684269/component-of-a-quaternion-rotation-around-an-axis/4341489
            // https://stackoverflow.com/questions/32813626/constrain-pitch-yaw-roll/32846982
            // http://www.allenchou.net/2018/05/game-math-swing-twist-interpolation-sterp/
            // https://stackoverflow.com/questions/42428136/quaternion-is-flipping-sign-for-very-similar-rotations
            const qT = quat;
            //v1.set(qT.x, qT.y, qT.z); //todo check singularity: rotation by 180 degree if (r.sqrMagnitude < MathUtil.Epsilon)
            //v1.projectOnVector(this.headBone.up); //up is direction around twist
            //v1.set(0, qT.y, 0); //project on y axis
            //q1.set(v1.x, v1.y, v1.z, qT.w); //twist
            q1.set(0, qT.y, 0, qT.w); //project on y then get twist
            q1.normalize(); //twist

            q3.copy(q1).conjugate();
            q2.multiplyQuaternions(qT, q3); //swing
            q2.normalize();

            // Clamp twist angle
            v1.set(q1.x, q1.y, q1.z);
            if (v1.lengthSq() > MAX_MAG_POW_2) {
                v1.setLength(MAX_MAGNITUDE);
                const sign = qT.w < 0 ? -1 : 1;
                q1.set(v1.x, v1.y, v1.z, sign * MAX_MAGNITUDE_W);
            }

            // Clamp swing angle
            v1.set(q2.x, q2.y, q2.z);
            if (v1.lengthSq() > SWING_MAX_POW2) {
                v1.setLength(SWING_MAX);
                q2.set(v1.x, v1.y, v1.z, SWING_MAX_W); //todo don't know why perserving sign here causes jumps. cancels out twist clamp?
            }

            qT.multiplyQuaternions(q2, q1); //swing * twist
        };
    })();
}

new Watcher().registerComponent('watcher');

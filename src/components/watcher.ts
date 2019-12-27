import { Entity, THREE } from 'aframe';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { ANIME } from 'aframe';
import { ComponentWrapper } from '../aframe-typescript-toolkit';

interface WatcherSchema {
    readonly lookAtID: string; // Todo make selector
    readonly headBone: string;
    readonly speed: number;
}

export class Watcher extends ComponentWrapper<WatcherSchema> {
    private model: THREE.Object3D;
    private headBone: THREE.Bone;
    private eyeBones: [THREE.Bone, THREE.Bone];
    private eyeOffset = new THREE.Matrix4().makeTranslation(0, 0.11, 0);
    private lastQ = new THREE.Quaternion();
    private lookAtTarget: THREE.Object3D;
    private mixerWeight = 1;
    private static readonly ROTATE_SPEED_MIN_HEAD = THREE.Math.degToRad(100); // 100 Degrees per second
    private static readonly ROTATE_SPEED_MIN_BODY = THREE.Math.degToRad(20); // 20 Degrees per second
    private static readonly EASING_START_ANGLE = THREE.Math.degToRad(20); //20
    private static readonly HEAD_YAW_MAX = 50; // 50 Degrees
    private static readonly HEAD_TILT_MAX = 40; // 40 Degrees
    private static readonly EYE_TWIST_MAX = 180; // todo twist on eyes not needed
    private static readonly EYE_SWING_MAX = 15; // 20 Degrees
    private static readonly HEAD_CLOSE_ENOUGH_ANGLE = THREE.Math.DEG2RAD * 5; //5 todo limit thiss to just yaw to level out chin?
    //todo degrees of slop off HEAD_YAW_MAX needed for direct lookat
    private static readonly BODY_CLOSE_ENOUGH_ANGLE = THREE.Math.DEG2RAD * (Watcher.HEAD_YAW_MAX - 10);

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
                default: THREE.Math.degToRad(200), //200
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
            this.model.getObjectByName('mixamorigLeftEye') as THREE.Bone,
            this.model.getObjectByName('mixamorigRightEye') as THREE.Bone,
        ];
    }

    update(oldData) {
        const data = this.data;
        if (data.lookAtID !== oldData.lookAtID) {
            if (this.data.lookAtID !== 'null') {
                const targetEl: Entity = this.el.sceneEl.querySelector(data.lookAtID);
                if (targetEl) {
                    this.lookAtTarget = targetEl.object3D;
                    this.lastQ.copy(this.headBone.quaternion);
                } else {
                    this.lookAtTarget = null;
                    console.log('Watcher got nothing for lookAt target with querySelector(' + data.lookAtID + ')');
                }
            } else {
                this.lookAtTarget = null;
                if (this.headBone) {
                    this.mixerWeight = 0;
                    this.eyeBones[0].quaternion.set(0, 0, 0, 1);
                    this.eyeBones[1].quaternion.set(0, 0, 0, 1);
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
        return function(t, dt) {
            if (this.model) {
                if (this.headBone) {
                    if (this.lookAtTarget) {
                        this.headBone.quaternion.copy(this.lastQ);
                        this.doLookat(dt);
                        this.lastQ.copy(this.headBone.quaternion);
                    } else if (this.mixerWeight < 1) {
                        // no lookat target
                        this.headBone.quaternion.slerp(this.lastQ, 1 - this.mixerWeight);
                    }
                }
            }
        };
    })();

    doLookat = (function() {
        const lookAtPos = new THREE.Vector3();

        const m1 = new THREE.Matrix4();
        const m2 = new THREE.Matrix4();

        const v1 = new THREE.Vector3();
        const v2 = new THREE.Vector3();

        const q1 = new THREE.Quaternion();
        const q2 = new THREE.Quaternion();

        return function(dt) {
            if (this.headBone && this.lookAtTarget) {
                lookAtPos.setFromMatrixPosition(this.lookAtTarget.matrixWorld);

                // this.headBone.updateWorldMatrix(true, true);
                // m1.copy(this.headBone.matrixWorld);
                // m1.premultiply(this.eyeOffset);

                //BODY
                let bone = this.model;

                // bone.updateWorldMatrix(true, false);
                v1.setFromMatrixPosition(bone.matrixWorld); //todo lookat from bone or effector position?

                v1.y = lookAtPos.y;
                v2.set(0, 1, 0);
                m2.lookAt(lookAtPos, v1, v2); //bone pointing to target
                q1.setFromRotationMatrix(m2); //bone target quat in world

                m2.extractRotation(bone.matrixWorld);
                q2.setFromRotationMatrix(m2); //bone current quat
                let angleDiff = q2.angleTo(q1); //bone to target angle

                let angleLeft = angleDiff - Watcher.BODY_CLOSE_ENOUGH_ANGLE;
                let didParentMove = false;
                if (angleLeft > 0) {
                    didParentMove = true;
                    m2.extractRotation(bone.matrixWorld); //extractRotation needed
                    q2.setFromRotationMatrix(m2);

                    this.rotateTowards(q1, q2, angleLeft, Watcher.ROTATE_SPEED_MIN_BODY, dt);

                    //put in back in parent hierarchy
                    m2.extractRotation(bone.parent.matrixWorld);
                    q2.setFromRotationMatrix(m2);
                    q1.premultiply(q2.inverse());
                    bone.quaternion.copy(q1);
                }

                //EYES
                bone = this.eyeBones[0];

                // bone.updateWorldMatrix(true, false);
                v1.setFromMatrixPosition(bone.matrixWorld);
                v2.setFromMatrixColumn(bone.parent.matrixWorld, 1);
                v2.normalize();
                m2.lookAt(lookAtPos, v1, v2); //pointing to target

                q1.setFromRotationMatrix(m2); //target quat
                m2.extractRotation(bone.matrixWorld);
                q2.setFromRotationMatrix(m2); //current quat xxx

                angleDiff = q2.angleTo(q1); //bone to target angle

                m2.extractRotation(bone.matrixWorld); //need extractRotation
                q2.setFromRotationMatrix(m2);

                this.rotateTowards(q1, q2, angleDiff, Watcher.ROTATE_SPEED_MIN_HEAD * 5, dt);

                m2.extractRotation(bone.parent.matrixWorld);
                q2.setFromRotationMatrix(m2);
                q1.premultiply(q2.inverse());
                //constrain rotation
                this.constrainEyes(q1);
                bone.quaternion.copy(q1);
                this.eyeBones[1].quaternion.copy(q1); //good enough

                //HEAD
                bone = this.headBone;
                bone.updateWorldMatrix(true, false);
                //v1.setFromMatrixPosition(m1);
                v1.setFromMatrixPosition(this.eyeBones[0].matrixWorld);
                v2.setFromMatrixColumn(bone.parent.matrixWorld, 1);
                v2.normalize();
                //v2.y += 1; //Head likes to stay upright. Blend to world up
                v2.normalize();
                m2.lookAt(lookAtPos, v1, v2); //left eye pointing to target

                q1.setFromRotationMatrix(m2); //target quat
                //m2.extractRotation(this.eyeBones[0].matrixWorld);
                m2.extractRotation(bone.matrixWorld);
                q2.setFromRotationMatrix(m2); //current quat

                angleDiff = q2.angleTo(q1);

                angleLeft = angleDiff - Watcher.HEAD_CLOSE_ENOUGH_ANGLE;
                if (angleLeft > 0 || didParentMove) {
                    // m1.extractRotation(bone.matrixWorld); //extractRotation needed
                    // q2.setFromRotationMatrix(m1);

                    this.rotateTowards(q1, q2, angleLeft, Watcher.ROTATE_SPEED_MIN_HEAD, dt);

                    m2.extractRotation(bone.parent.matrixWorld);
                    q2.setFromRotationMatrix(m2);
                    q1.premultiply(q2.inverse());
                    bone.quaternion.copy(q1);
                    this.constrainHead(bone.quaternion);
                }
            }
        };
    })();

    //Side effects: manipulates parameters
    rotateTowards = (function() {
        return function(targetQuat, lastQuat, angleDiff, baseSpeed, dt) {
            //cap speed
            const n = Math.min(angleDiff / Watcher.EASING_START_ANGLE, 1); //normalize angle change: 0 to 1.  Over lookat process it goes from 1 to 0.
            // decelerating to zero velocity
            const increasedSpeed = n * n * this.data.speed; //easing from https://gist.github.com/gre/1650294
            const speed = baseSpeed + increasedSpeed;
            const maxAngleChange = Math.min(speed * (dt / 1000), angleDiff);
            // equals in >= comparison for when angleDiff smaller than speed, like when hips are close enough
            if (angleDiff >= maxAngleChange) {
                lastQuat.rotateTowards(targetQuat, maxAngleChange);
                targetQuat.copy(lastQuat); // copy, not first "out" rotateTowards, so under maxAngleChange path is faster
            }
        };
    })();

    constrainHead = (function() {
        const TWIST_AXIS = new THREE.Vector3().set(0, 1, 0);

        const TWIST_MAX = Math.sin(0.5 * THREE.Math.DEG2RAD * Watcher.HEAD_YAW_MAX);
        const TWIST_MAX_POW2 = TWIST_MAX * TWIST_MAX;
        const TWIST_MAX_W = Math.sqrt(1.0 - TWIST_MAX_POW2);

        const SWING_MAX = Math.sin(0.5 * THREE.Math.DEG2RAD * Watcher.HEAD_TILT_MAX);
        const SWING_MAX_POW2 = SWING_MAX * SWING_MAX;
        const SWING_MAX_W = Math.sqrt(1.0 - SWING_MAX_POW2);

        return function(qT) {
            this.constrainSwingTwist(
                qT,
                TWIST_AXIS,
                TWIST_MAX,
                TWIST_MAX_POW2,
                TWIST_MAX_W,
                SWING_MAX,
                SWING_MAX_POW2,
                SWING_MAX_W,
            );
        };
    })();

    //todo no need for twist check
    constrainEyes = (function() {
        const TWIST_AXIS = new THREE.Vector3().set(0, 0, 1);

        const TWIST_MAX = Math.sin(0.5 * THREE.Math.DEG2RAD * Watcher.EYE_TWIST_MAX);
        const TWIST_MAX_POW2 = TWIST_MAX * TWIST_MAX;
        const TWIST_MAX_W = Math.sqrt(1.0 - TWIST_MAX_POW2);

        const SWING_MAX = Math.sin(0.5 * THREE.Math.DEG2RAD * Watcher.EYE_SWING_MAX);
        const SWING_MAX_POW2 = SWING_MAX * SWING_MAX;
        const SWING_MAX_W = Math.sqrt(1.0 - SWING_MAX_POW2);

        return function(qT) {
            this.constrainSwingTwist(
                qT,
                TWIST_AXIS,
                TWIST_MAX,
                TWIST_MAX_POW2,
                TWIST_MAX_W,
                SWING_MAX,
                SWING_MAX_POW2,
                SWING_MAX_W,
            );
        };
    })();

    constrainSwingTwist = (function() {
        const v1 = new THREE.Vector3();
        const q1 = new THREE.Quaternion();
        const q2 = new THREE.Quaternion();

        return function(qT, twistAxis, twistMax, twistPow2, twistW, swingMax, swingPow2, swingW) {
            //clamp rotation with swing + twist parameterization
            // https://stackoverflow.com/questions/3684269/component-of-a-quaternion-rotation-around-an-axis/4341489
            // https://stackoverflow.com/questions/32813626/constrain-pitch-yaw-roll/32846982
            // http://www.allenchou.net/2018/05/game-math-swing-twist-interpolation-sterp/
            // https://stackoverflow.com/questions/42428136/quaternion-is-flipping-sign-for-very-similar-rotations
            //twist
            v1.set(qT.x, qT.y, qT.z); //todo check singularity: rotation by 180 degree if (r.sqrMagnitude < MathUtil.Epsilon) from Allen Chou
            v1.projectOnVector(twistAxis);
            q1.set(v1.x, v1.y, v1.z, qT.w);
            q1.normalize();
            //swing
            q2.copy(q1).conjugate();
            q2.premultiply(qT);
            q2.normalize();
            // Clamp twist angle
            v1.set(q1.x, q1.y, q1.z);
            if (v1.lengthSq() > twistPow2) {
                v1.setLength(twistMax);
                const sign = qT.w < 0 ? -1 : 1;
                q1.set(v1.x, v1.y, v1.z, sign * twistW);
            }
            // Clamp swing angle
            v1.set(q2.x, q2.y, q2.z);
            if (v1.lengthSq() > swingPow2) {
                v1.setLength(swingMax);
                q2.set(v1.x, v1.y, v1.z, swingW); //todo don't know why perserving sign here causes jumps. cancels out twist clamp?
            }
            qT.multiplyQuaternions(q2, q1); //swing * twist
        };
    })();
}

new Watcher().registerComponent('watcher');

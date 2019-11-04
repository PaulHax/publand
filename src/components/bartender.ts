import { utils, THREE, Component } from 'aframe';

import { ComponentWrapper } from '../aframe-typescript-toolkit';

enum State {
    Holding,
    Waiting,
    BarWork,
    DayDream,
}

interface BartenderSchema {
    readonly fake: number;
}

export class Bartender extends ComponentWrapper<BartenderSchema> {
    private state = State.Waiting;
    private userHead: THREE.Object3D;
    private b3D: THREE.Object3D;
    private watcher: Component;
    private talker: Component;

    constructor() {
        super({
            fake: {
                type: 'number',
                default: 1,
            },
        });
    }

    init() {
        this.userHead = document.querySelector('#user_head').object3D;
        this.b3D = this.el.object3D;
        this.watcher = this.el.components['watcher'];
        this.talker = this.el.components['talker'];
        this.tick = utils.throttleTick(this.tick, 500, this);
    }

    //Throttled fyi
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    tick(_t: number, _dt: number) {
        this.think();
    }

    think = (function() {
        const v1 = new THREE.Vector3();
        const v2 = new THREE.Vector3();

        return function() {
            if (State.Waiting === this.state) {
                this.userHead.updateWorldMatrix(true, false); // ToDo need this only for first frame check
                v1.setFromMatrixPosition(this.userHead.matrixWorld);
                this.b3D.updateWorldMatrix(true, false);
                v2.setFromMatrixPosition(this.b3D.matrixWorld);
                v2.y = v1.y;
                const d = v1.distanceTo(v2);
                if (d < 3) {
                    this.el.setAttribute('watcher', { lookAtID: '#user_head' });
                    this.talker.speak('whatdrink');
                    this.el.setAttribute('animation-mixer-tick', {
                        clip: 'talking',
                        timeScale: 1,
                        crossFadeDuration: 0.4,
                    });
                    this.state = State.Holding;
                    setTimeout(() => {
                        this.state = State.BarWork;
                    }, 8000);
                }
            } else if (State.BarWork === this.state) {
                this.el.setAttribute('watcher', { lookAtID: '#register_screen', speed: THREE.Math.degToRad(150) });
                this.el.setAttribute('animation-mixer-tick', { clip: 'idle', timeScale: 1, crossFadeDuration: 0.4 });
                this.state = State.Holding;
                setTimeout(() => {
                    this.state = State.DayDream;
                }, 4000 + 2000 * Math.random());
            } else if (State.DayDream === this.state) {
                this.el.setAttribute('watcher', { lookAtID: 'null' });
                this.state = State.Holding;
                setTimeout(() => {
                    this.state = State.BarWork;
                }, 1000 + 1000 * Math.random());
            }
        };
    })();
}

new Bartender().registerComponent('bartender');

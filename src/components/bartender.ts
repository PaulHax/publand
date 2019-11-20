import { utils, THREE, Component } from 'aframe';

import { ComponentWrapper } from '../aframe-typescript-toolkit';

enum State {
    Holding,
    BarWork,
    DayDream,
}

interface BartenderSchema {
    readonly checkForProximity: boolean;
}

export class Bartender extends ComponentWrapper<BartenderSchema> {
    private userHead: THREE.Object3D;
    private b3D: THREE.Object3D;

    constructor() {
        super({
            checkForProximity: {
                type: 'boolean',
                default: true,
            },
        });
    }

    init() {
        this.userHead = document.querySelector('#user_head').object3D;
        this.b3D = this.el.object3D;
        this.tick = utils.throttleTick(this.tick, 500, this);
    }

    //Throttled fyi
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    tick(_t: number, _dt: number) {
        if (this.data.checkForProximity) {
            this.checkForCloseness();
        }
    }

    checkForCloseness = (function() {
        const v1 = new THREE.Vector3();
        const v2 = new THREE.Vector3();

        return function() {
            this.userHead.updateWorldMatrix(true, false); // ToDo need this only for first frame check
            v1.setFromMatrixPosition(this.userHead.matrixWorld);
            this.b3D.updateWorldMatrix(true, false);
            v2.setFromMatrixPosition(this.b3D.matrixWorld);
            v2.y = v1.y;
            const d = v1.distanceTo(v2);
            if (d < 3) {
                this.el.emit('closeToBartender');
            }
        };
    })();
}

new Bartender().registerComponent('bartender');

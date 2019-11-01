import { Watcher } from '../../src/components/watcher';
Watcher;

import { Talker } from '../../src/components/talker';
Talker;
import { EyeFix } from '../../src/components/eyefix-culling';
EyeFix;

import 'aframe-extras/src/misc/cube-env-map';
import '../../src/components/animation-mixer-tick';

require('./scene.html');

function logKey(e) {
    const bman = document.querySelector('#bartender');
    if (e.code === 'Space') {
        bman.components.talker.speak('whatdrink');
    }
    // if (e.code === 'KeyV') {
    // }
}

window.addEventListener('keydown', logKey);

// setTimeout(() => {
//     const bman = document.querySelector('#bartender');
//     bman.components.talker.speak('sawher');
// }, 5000);

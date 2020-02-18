import { Watcher } from '../../src/components/watcher';
Watcher;
import { Talker } from '../../src/components/talker';
Talker;
import { EyeFix } from '../../src/components/eyefix-culling';
EyeFix;
import { Blinker } from '../../src/components/blinker';
Blinker;

import 'aframe-extras/src/misc/cube-env-map';

require('./scene.html');

function logKey(e) {
    const bman = document.querySelector('#bartender');
    if (e.code === 'Space') {
        bman.components.talker.speak('whatdrink');
    }
    if (e.code === 'KeyV') {
        bman.components.talker.stopSpeaking();
    }
    if (e.code === 'KeyB') {
        bman.components.talker.speak('sawher');
    }
}

window.addEventListener('keydown', logKey);

// setTimeout(() => {
//     const bman = document.querySelector('#bartender');
//     bman.components.talker.speak('sawher');
// }, 5000);

import { Watcher } from '../../src/components/watcher';
Watcher;
import 'aframe-extras/src/misc/cube-env-map';
import '../../src/components/animation-mixer-tick';

require('./scene.html');

function logKey(e) {
    const bman = document.querySelector('#bartender');
    if (e.code === 'Space') {
        bman.setAttribute('watcher', { lookAtID: '#sphery' });
    }
    if (e.code === 'KeyV') {
        bman.setAttribute('watcher', { lookAtID: '#user_head' });
    }
}

window.addEventListener('keydown', logKey);

let isSphere = true;
function toggle() {
    const bman = document.querySelector('#bartender');
    isSphere = !isSphere;
    if (isSphere) {
        bman.setAttribute('watcher', { lookAtID: '#user_head' });
        console.log('head');
    } else {
        bman.setAttribute('watcher', { lookAtID: '#sphery' });
        //bman.setAttribute('watcher', { lookAtID: 'null' });
    }
    setTimeout(toggle, 3000);
}

setTimeout(toggle, 1000);

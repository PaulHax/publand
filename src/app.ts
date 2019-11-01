import { Watcher } from './components/watcher';
Watcher;
import { Talker } from './components/talker';
Talker;
import { EyeFix } from './components/eyefix-culling';
EyeFix;
import { Bartender } from './components/bartender';
Bartender;
import 'aframe-extras/src/misc/cube-env-map';

//webpack up js components
function requireAll(req) {
    req.keys().forEach(req);
}
requireAll(require.context('./components/', true, /\.js$/));
require('./scene.html'); // inject into index.html with hot reloading

function logKey(e) {
    const bman = document.querySelector('#bartender');
    if (e.code === 'Space') {
        bman.components.talker.speak('whatdrink');
    }
    // if (e.code === 'KeyV') {
    // }
}

window.addEventListener('keydown', logKey);

let isSphere = true;
function toggle() {
    const bman = document.querySelector('#bartender');
    isSphere = !isSphere;
    if (isSphere) {
        bman.setAttribute('watcher', { lookAtID: '#user_head' });
    } else {
        bman.setAttribute('watcher', { lookAtID: '#room' });
    }
    setTimeout(toggle, 3000);
}

setTimeout(toggle, 1000);

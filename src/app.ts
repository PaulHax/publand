import { Watcher } from './components/watcher';
Watcher;
import { Talker } from './components/talker';
Talker;
import { EyeFix } from './components/eyefix-culling';
EyeFix;
import { Bartender } from './components/bartender';
Bartender;
import { GpuLoading } from './components/gpu-loading';
GpuLoading;
import 'aframe-extras/src/misc/cube-env-map';
import 'aframe-slice9-component';
import 'aframe-render-order-component';

import { THREE, registerComponent } from 'aframe';
import './state';

//webpack up js components
function requireAll(req) {
    req.keys().forEach(req);
}
requireAll(require.context('./components/', true, /\.js$/));

registerComponent('raycastable', {});

require('./index.css');

require('./start.html'); // inject into index.html with hot reloading
require('./scene.html'); // inject into index.html with hot reloading

function logKey(e) {
    const bman = document.querySelector('#bartender');
    if (e.code === 'Space') {
        bman.components.talker.speak('whatdrink');
    }
}

window.addEventListener('keydown', logKey);

// After user does something, can init AudioContext for background sound.
function initSound() {
    const scene = (document.querySelector('#thescene') as unknown) as THREE.Scene & {
        audioListener: THREE.AudioListener;
    };
    if (!scene.audioListener) {
        scene.audioListener = new THREE.AudioListener();
    }
    scene.audioListener.context.resume();
    window.removeEventListener('keydown', initSound);
    window.removeEventListener('mousedown', initSound);
    window.removeEventListener('touchstart', initSound);
}

window.addEventListener('keydown', initSound);
window.addEventListener('mousedown', initSound);
window.addEventListener('touchstart', initSound);

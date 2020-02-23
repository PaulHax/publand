import { Watcher } from './components/watcher';
Watcher;
import { Talker } from './components/talker';
Talker;
import { EyeFix } from './components/eyefix-culling';
EyeFix;
import { Blinker } from './components/blinker';
Blinker;
import { Bartender } from './components/bartender';
Bartender;
import { GpuLoading } from './components/gpu-loading';
GpuLoading;
import { PubLighting } from './components/pub-lighting';
PubLighting;
import 'aframe-extras/src/misc/cube-env-map';
import 'aframe-extras/src/controls/movement-controls';
import 'aframe-extras/src/controls/keyboard-controls';
import 'aframe-extras/src/controls/touch-controls';
import 'aframe-extras/src/controls/gamepad-controls';
import 'aframe-extras/src/controls/trackpad-controls';
import 'aframe-extras/src/pathfinding';
import 'aframe-extras/src/loaders/animation-mixer';

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
require('./scene.html'); // inject into index.html with hot reloading

// function logKey(e) {
//     const bman = document.querySelector('#bartender');
//     if (e.code === 'Space') {
//         bman.components.talker.speak('whatdrink');
//     }
// }
// window.addEventListener('keydown', logKey);

// After user does something, can init AudioContext for background sound.
function initSound() {
    //aframe sound componet looks for context on scene object
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

//To test on windows
//C:\Program Files (x86)\Google\Chrome\Application\chrome.exe --ignore-certificate-errors --unsafely-treat-insecure-origin-as-secure=https://localhost:3000
if (process.env.NODE_ENV === 'production') {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', function() {
            navigator.serviceWorker.register('/service-worker.js').catch(err => {
                console.log('😥 Service worker registration failed: ', err);
            });
        });
    }
}

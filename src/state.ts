import 'aframe-state-component';

// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
const SKIP_INTRO = AFRAME.utils.getUrlParameter('skip') === 'true';

// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
AFRAME.registerState({
    nonBindedStateKeys: ['bartender.hasSaidHello', 'bartender.timeoutID'],

    initialState: {
        isShowInstructions: !SKIP_INTRO,
        isRoomLoaded: false,
        bartender: {
            animationClip: 'idle',
            lookAtID: 'null',
            speakSound: '',
            lookSpeed: AFRAME.THREE.Math.degToRad(150),
            hasSaidHello: false,
            timeoutID: -1,
        },
    },

    handlers: {
        hideInstructions: function(state) {
            state.isShowInstructions = false;
        },
        roomLoaded: function(state) {
            state.isRoomLoaded = true;
        },
        loaded: state => {
            state.bartender.timeoutID = setTimeout(() => {
                AFRAME.scenes[0].emit('doBarWork');
            }, 4000);
        },
        closeToBartender: state => {
            if (!state.bartender.hasSaidHello) {
                if (state.bartender.timeoutID !== -1) {
                    clearTimeout(state.bartender.timeoutID);
                }
                state.bartender.hasSaidHello = true;
                state.bartender.animationClip = 'talking';
                state.bartender.lookAtID = '#user_head';
                state.bartender.speakSound = 'whatdrink';
                state.bartender.lookSpeed = AFRAME.THREE.Math.degToRad(300);
                state.bartender.timeoutID = setTimeout(() => {
                    AFRAME.scenes[0].emit('doBarWork');
                }, 8000);
            }
        },
        doBarWork: state => {
            state.bartender.lookSpeed = AFRAME.THREE.Math.degToRad(150);
            state.bartender.animationClip = 'idle';
            state.bartender.lookAtID = '#register_screen';
            state.bartender.timeoutID = setTimeout(() => {
                AFRAME.scenes[0].emit('lookAround');
            }, 4000 + 5000 * Math.random());
        },
        lookAround: state => {
            state.bartender.animationClip = 'look around';
            state.bartender.lookAtID = 'null';
            state.bartender.timeoutID = setTimeout(() => {
                AFRAME.scenes[0].emit('doBarWork');
            }, 1000 + 1000 * Math.random());
        },
    },
});

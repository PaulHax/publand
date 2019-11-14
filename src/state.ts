import 'aframe-state-component';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
AFRAME.registerState({
    initialState: {
        isShowInstructions: true,
        isRoomLoaded: false,
    },

    handlers: {
        hideInstructions: function(state) {
            state.isShowInstructions = false;
            const scene = document.querySelector('#thescene');
            if (scene.requestPointerLock) {
                scene.requestPointerLock();
            } else if (scene.mozRequestPointerLock) {
                scene.mozRequestPointerLock();
            }
        },

        roomLoaded: function(state) {
            state.isRoomLoaded = true;
        },
    },
});

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
        },

        roomLoaded: function(state) {
            state.isRoomLoaded = true;
        },
    },
});

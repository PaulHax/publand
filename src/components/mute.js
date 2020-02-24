AFRAME.registerComponent('mute', {
  init: function () {
    var sceneEl = this.el.sceneEl;
    let listener = this.listener = sceneEl.audioListener || new THREE.AudioListener();
    sceneEl.audioListener = listener;
    function handleVisibilityChange() {
      if (document.hidden) {
        sceneEl.audioListener.setMasterVolume(0)
      } else {
        sceneEl.audioListener.setMasterVolume(1)
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
  }
});
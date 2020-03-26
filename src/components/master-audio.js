AFRAME.registerComponent('master-audio', {
  init: function () {
    var sceneEl = this.el.sceneEl;
    let listener = this.listener = sceneEl.audioListener || new THREE.AudioListener();
    sceneEl.audioListener = listener;    
    //aframe sound componet looks for context on scene object
    if (!sceneEl.audioListener) {
      sceneEl.audioListener = new THREE.AudioListener();
    }
    // After user does something, can init AudioContext for background sound.
    function initSound() {
      sceneEl.audioListener.context.resume().then(() => {
          sceneEl.removeEventListener('keydown', initSound);
          sceneEl.removeEventListener('mousedown', initSound);
          sceneEl.removeEventListener('touchstart', initSound);
      });
    }
    sceneEl.addEventListener('keydown', initSound);
    sceneEl.addEventListener('mousedown', initSound);
    sceneEl.addEventListener('touchstart', initSound);
    sceneEl.addEventListener('hideInstructions', initSound);
    


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
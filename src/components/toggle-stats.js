AFRAME.registerComponent('toggle-stats', {
  init: function () {
    this.onKeyup = this.onKeyup.bind(this);
    this.isShowing = false;
    if (typeof __THREE_DEVTOOLS__ !== 'undefined') {
      const sceneEl = document.querySelector('#thescene');
      sceneEl.addEventListener('render-target-loaded', function() {
          // sceneEl.renderer is now set.
          // eslint-disable-next-line no-undef
          __THREE_DEVTOOLS__.dispatchEvent(new CustomEvent('observe', { detail: sceneEl }));
          // eslint-disable-next-line no-undef
          __THREE_DEVTOOLS__.dispatchEvent(new CustomEvent('observe', { detail: sceneEl.renderer }));
      });
  }
  },
  
  play: function () {
    window.addEventListener('keyup', this.onKeyup, false);
  },

  pause: function () {
    window.removeEventListener('keyup', this.onKeyup);
  },
  
  onKeyup: function (e) {
    if (e.code === 'F4') {
      this.isShowing = !this.isShowing
      if(this.isShowing) {
        this.el.setAttribute('stats', '');
      }
      else {
        this.el.removeAttribute('stats');
      }
    }
  }

});
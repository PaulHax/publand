AFRAME.registerComponent('toggle-stats', {
  init: function () {
    this.onKeyup = this.onKeyup.bind(this);
    this.isShowing = false;
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
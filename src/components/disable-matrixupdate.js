AFRAME.registerComponent('disable-matrixupdate', {
  init: function () {
    this.object3dsetHandler = () => {
      const mesh = this.el.getObject3D('mesh');
      mesh.matrixAutoUpdate = false;
    };
    this.el.addEventListener('object3dset', this.object3dsetHandler);
  },
});
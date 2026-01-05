import * as THREE from 'three';

export default class SpikeLayer {
  constructor({ id, geojson, baseDiameter = 100000 }) {
    console.log('spiking with geojson', geojson);
    this.id = id;
    this.type = 'custom';
    this.renderingMode = '3d';
    this.geojson = geojson;
    this.baseDiameter = baseDiameter;
  }

  onAdd(map, gl) {
    this.map = map;
    this.camera = new THREE.Camera();
    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer({
      canvas: map.getCanvas(),
      context: gl,
      antialias: true
    });
    this.renderer.autoClear = false;

    const features = this.geojson.features.filter(f => f.properties.temp);

    // 1. Create a standard Y-UP cone
    const geometry = new THREE.ConeGeometry(0.5, 1, 12);

    // 2. SEAT THE BASE:
    // Move it UP by 0.5 so the bottom of the cone is at 0,0,0
    geometry.translate(0, 0.5, 0);

    // Using a simple material without blending or transparency
    const material = new THREE.MeshBasicMaterial({});

    const mesh = new THREE.InstancedMesh(geometry, material, features.length);

    features.forEach((feature, i) => {
      const lngLat = feature.geometry.coordinates;
      const modelMatrixArray = this.map.transform.getMatrixForModel(lngLat, 0);
      const modelMatrix = new THREE.Matrix4().fromArray(modelMatrixArray);

      const h = feature.properties.height || 0;
      const w = this.baseDiameter;

      // Using your working scale (Y-up)
      modelMatrix.scale(new THREE.Vector3(w, h, w));

      mesh.setMatrixAt(i, modelMatrix);

      mesh.setColorAt(i, new THREE.Color(feature.properties.colour || 'red'));
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

    this.scene.add(mesh);
    this.mesh = mesh;
  }

  render(gl, args) {
    this.camera.projectionMatrix = new THREE.Matrix4().fromArray(args.defaultProjectionData.mainMatrix);
    this.renderer.resetState();
    this.renderer.render(this.scene, this.camera);
    this.map.triggerRepaint();
  }
}

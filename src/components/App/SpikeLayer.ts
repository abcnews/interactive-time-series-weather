import * as THREE from 'three';
import type { Map as MaplibreMap, CustomLayerInterface, CustomRenderMethodInput } from '../Maplibre/maplibre-gl';

interface SpikeLayerOptions {
  id: string;
  geojson: GeoJSON.FeatureCollection;
  baseDiameter?: number;
}

export default class SpikeLayer implements CustomLayerInterface {
  id: string;
  type: 'custom' = 'custom';
  renderingMode: '3d' = '3d';
  geojson: GeoJSON.FeatureCollection;
  baseDiameter: number;

  private map?: MaplibreMap;
  private camera?: THREE.Camera;
  private scene?: THREE.Scene;
  private renderer?: THREE.WebGLRenderer;
  private mesh?: THREE.InstancedMesh;

  constructor({ id, geojson, baseDiameter = 100000 }: SpikeLayerOptions) {
    this.id = id;
    this.geojson = geojson;
    this.baseDiameter = baseDiameter;
  }

  onAdd(map: MaplibreMap, gl: WebGLRenderingContext | WebGL2RenderingContext): void {
    this.map = map;
    this.camera = new THREE.Camera();
    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer({
      canvas: map.getCanvas(),
      context: gl,
      antialias: true
    });
    this.renderer.autoClear = false;

    const features = this.geojson.features.filter(f => f.properties && f.properties.temp);

    const geometry = new THREE.ConeGeometry(0.5, 1, 12);
    geometry.translate(0, 0.5, 0);
    const material = new THREE.MeshBasicMaterial({});
    const mesh = new THREE.InstancedMesh(geometry, material, features.length);

    features.forEach((feature, i) => {
      if (feature.geometry.type !== 'Point') return;

      const lngLat = feature.geometry.coordinates as [number, number];
      const modelMatrixArray = this.map!.transform.getMatrixForModel(lngLat, 0);
      const modelMatrix = new THREE.Matrix4().fromArray(modelMatrixArray);

      const h = (feature.properties?.height as number) || 0;
      const w = this.baseDiameter;

      modelMatrix.scale(new THREE.Vector3(w, h, w));
      mesh.setMatrixAt(i, modelMatrix);
      mesh.setColorAt(i, new THREE.Color((feature.properties?.colour as string) || 'red'));
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

    this.scene.add(mesh);
    this.mesh = mesh;
  }

  render(gl: WebGLRenderingContext | WebGL2RenderingContext, args: CustomRenderMethodInput): void {
    if (!this.camera || !this.renderer || !this.scene || !this.map || !this.mesh) return;

    this.camera.projectionMatrix = new THREE.Matrix4().fromArray(args.defaultProjectionData.mainMatrix);
    this.renderer.resetState();
    this.renderer.render(this.scene, this.camera);
    this.map.triggerRepaint();
  }
}

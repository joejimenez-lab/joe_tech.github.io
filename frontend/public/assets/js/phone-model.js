import * as THREE from '../vendor/three/three.module.min.js';
import { GLTFLoader } from '../vendor/three/GLTFLoader.js';
import { createInternals } from './phone-internals.js?v=16';

// The model retains the artist's actual iPhone geometry and baked material maps.
// Attribution and source are included beside the GLB and linked in the viewer.
export async function loadPhone() {
  const gltf = await new GLTFLoader().loadAsync(new URL('../models/iphone-15-pro.glb', import.meta.url).href);
  return preparePhone(gltf.scene);
}

export function preparePhone(model) {
  const root = new THREE.Group();
  model.rotation.set(0, Math.PI, 0);
  model.updateMatrixWorld(true);
  const originalBounds = new THREE.Box3().setFromObject(model);
  model.scale.multiplyScalar(5.7 / originalBounds.getSize(new THREE.Vector3()).y);
  model.updateMatrixWorld(true);
  const center = new THREE.Box3().setFromObject(model).getCenter(new THREE.Vector3());
  model.position.sub(center);
  const materials = new Set();
  model.traverse(object => {
    if (!object.isMesh) return;
    object.geometry.computeBoundingBox();
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      if (materials.has(material)) continue;
      materials.add(material);
      if (material.name === 'pIJKfZsazmcpEiU') {
        // Keep the original wallpaper UVs, without a reflected softbox across the display.
        material.emissiveIntensity = 1;
        material.toneMapped = false;
        material.roughness = 1;
        material.metalness = 0;
        material.envMapIntensity = 0;
      } else {
        material.envMapIntensity = .85;
      }
    }
  });
  root.add(model);
  // These identifiers refer to the artist's intact display geometry. The front
  // camera itself stays with the frame; only its cover glass travels with the display.
  const displayNames = new Set([
    'DjdhycfQYjKMDyn', 'usFLmqcyrnltBUr', 'xXDHkMplTIDAXLN',
    'IZbjANwSMLfgcvD', 'SysBlPspVQNIcce', 'vELORlCJixqPHsZ', 'AQkWXGdRSkSZMav'
  ]);
  const display = new THREE.Group(); display.name = 'Display assembly';
  const rear = new THREE.Group(); rear.name = 'Rear glass';
  root.add(display, rear);
  root.updateMatrixWorld(true);
  const meshes = [];
  model.traverse(object => { if (object.isMesh) meshes.push(object); });
  for (const mesh of meshes) {
    if (displayNames.has(mesh.name)) {
      display.attach(mesh);
    } else {
      const box = new THREE.Box3().setFromObject(mesh);
      // The entire rear assembly lies behind the frame, including its original
      // outward-facing lenses. Do not clone or flip any camera geometry.
      if (box.max.z < 0) rear.attach(mesh);
    }
  }
  if (display.children.length !== displayNames.size || rear.children.length !== 48) {
    throw new Error(`Unexpected iPhone model structure: display=${display.children.length}, rear=${rear.children.length}`);
  }
  // Remove only the exterior asset's opaque filler plate; the frame is intact.
  model.getObjectByName('ttmRoLdJipiIOmf').visible = false;
  const internals = createInternals(); root.add(internals.group);
  const cameras = new THREE.Group(); cameras.name = 'Rear camera assembly'; root.add(cameras);
  root.updateMatrixWorld(true);
  const lensCenters = [[.865,1.659],[.865,2.345],[.222,2.002]];
  for (const object of [...rear.children]) {
    const c = new THREE.Box3().setFromObject(object).getCenter(new THREE.Vector3());
    if (lensCenters.some(([x,y])=>Math.hypot(c.x-x,c.y-y)<.025)) cameras.attach(object);
  }
  cameras.attach(internals.cameraBacks);
  const cameraMeshCount = cameras.children.filter(o=>o.isMesh).length;
  if (cameraMeshCount !== 33) throw new Error(`Unexpected camera geometry: ${cameraMeshCount}`);
  return {
    root, model, display, rear, cameras, internals,
    setInsideView(inside) { display.visible = !inside; rear.visible = !inside; },
    setDisassembly(value) {
      const amount = THREE.MathUtils.clamp(value, 0, 1);
      display.position.set(-1.36 * amount, .12 * amount, 1.9 * amount);
      display.rotation.y = -.1 * amount;
      rear.position.set(.6 * amount, -.08 * amount, -1.1 * amount);
      // Rear optics stay aligned with the openings in the rear glass. Never
      // explode this assembly toward the front display or leave empty lens holes.
      cameras.position.copy(rear.position);
      internals.setDisassembly(amount);
      root.position.x = .04 * amount;
      root.position.z = -.2 * amount;
    }
  };
}

export function fitPhoneCamera(root, camera, bounds = new THREE.Box3()) {
  root.updateMatrixWorld(true);
  bounds.makeEmpty();
  root.traverseVisible(object => {
    if (!object.isMesh) return;
    if (!object.geometry.boundingBox) object.geometry.computeBoundingBox();
    bounds.union(object.geometry.boundingBox.clone().applyMatrix4(object.matrixWorld));
  });
  const tangent = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  let distance = 11.7;
  for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) {
    distance = Math.max(distance, bounds.max.z + Math.max(Math.abs(x) / (tangent * camera.aspect), Math.abs(y) / tangent) / .91);
  }
  camera.position.z = distance;
}

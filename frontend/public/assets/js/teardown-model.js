import * as THREE from '../vendor/three/three.module.min.js';
import { GLTFLoader } from '../vendor/three/GLTFLoader.js';
import { MeshoptDecoder } from '../vendor/meshopt/meshopt_decoder.mjs';

export async function loadPhone() {
 const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(new URL('../models/iphone-12-teardown.glb', import.meta.url).href);
 return preparePhone(gltf.scene);
}

// The original 159 meshes and their material maps supply every component.
// Our presentation separates complete assemblies without inventing phone parts.
export function preparePhone(model) {
 const root = new THREE.Group(); root.name = 'iPhone 12 teardown';
 model.rotation.y = -Math.PI / 2;
 model.updateMatrixWorld(true);
 const bounds = new THREE.Box3().setFromObject(model);
 model.scale.multiplyScalar(5.7 / bounds.getSize(new THREE.Vector3()).y);
 model.updateMatrixWorld(true);
 model.position.sub(new THREE.Box3().setFromObject(model).getCenter(new THREE.Vector3()));
 root.add(model);root.updateMatrixWorld(true);
 const parts = {};
 const assemble = (name, nodes, offset) => {
  const group = new THREE.Group(); group.name = name;root.add(group);
  for (const nodeName of nodes) {
   const node = root.getObjectByName(nodeName);
   if (!node) throw new Error(`Missing original iPhone part: ${nodeName}`);
   group.attach(node);
  }
  parts[name] = {group, offset:new THREE.Vector3(...offset)};
  return group;
 };
 const display = assemble('Display', ['front_panel','front_panel_screw01','front_panel_screw02','front_panel_screw03','front_panel_screw04','earspeaker'], [-1.65,.2,1.4]);
 const rear = assemble('Rear glass', ['back_cover','back_cam_glass','back_cam_hole1','back_cam_hole2','back_cam_flashlight_hole'], [.36,0,-.75]);
 assemble('Battery', ['battery'], [-.04,-.08,.8]);
 assemble('Logic board', ['motherboard','motherboard_cover','motherboard_cables_cover'], [.08,.08,.46]);
 assemble('Rear cameras', ['back_cam','back_cam_cover'], [.06,.32,.16]);
 assemble('Taptic Engine', ['taptick'], [-.18,-.22,.56]);
 assemble('Loudspeaker', ['speaker','speaker_cover'], [.22,-.16,.45]);
 assemble('Charging assembly', ['charging_port','charging_cable'], [0,-.28,.26]);
 assemble('Wireless charging', ['wireless_charge'], [.12,0,-.32]);
 const materials = new Set();
 root.traverse(object => {
  if (!object.isMesh) return;
  object.geometry.computeBoundingBox();
  for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
   if (materials.has(material)) continue;
   materials.add(material); material.envMapIntensity = .8;
   if (material.name === 'mat_screen') {
    material.emissiveMap = material.map;material.emissive.set('#ffffff');material.emissiveIntensity = .6;
    material.roughness = .3;
   }
  }
 });
 return {
  root, model, parts, display, rear,
  setInsideView(inside) { display.visible = !inside; rear.visible = !inside; },
  setDisassembly(value) {
   const amount = THREE.MathUtils.clamp(value,0,1);
   for (const {group,offset} of Object.values(parts)) group.position.copy(offset).multiplyScalar(amount);
   display.rotation.y = -.08 * amount;
  }
 };
}

export function fitPhoneCamera(root,camera,bounds=new THREE.Box3()) {
 root.updateMatrixWorld(true);bounds.makeEmpty();
 root.traverseVisible(object=>{
  if(!object.isMesh)return;
  bounds.union(object.geometry.boundingBox.clone().applyMatrix4(object.matrixWorld));
 });
 const center = bounds.getCenter(new THREE.Vector3());
 const tangent = Math.tan(THREE.MathUtils.degToRad(camera.fov/2));
 let distance = 9;
 for(const x of [bounds.min.x,bounds.max.x]) for(const y of [bounds.min.y,bounds.max.y])
  distance=Math.max(distance,bounds.max.z+Math.max(Math.abs(x-center.x)/(tangent*camera.aspect),Math.abs(y-center.y)/tangent)/.88);
 camera.position.set(center.x,center.y,distance);camera.lookAt(center.x,center.y,0);
}

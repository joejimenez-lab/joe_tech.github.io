import assert from 'node:assert/strict';
import {preparePhone,fitPhoneCamera} from '../frontend/public/assets/js/teardown-model.js';
import {readFileSync} from 'node:fs';
import * as THREE from '../frontend/public/assets/vendor/three/three.module.min.js';
import {GLTFLoader} from '../frontend/public/assets/vendor/three/GLTFLoader.js';
import {MeshoptDecoder} from '../frontend/public/assets/vendor/meshopt/meshopt_decoder.mjs';
const bytes=readFileSync(new URL('../frontend/public/assets/models/iphone-12-teardown.glb',import.meta.url));
const jsonLength=bytes.readUInt32LE(12);
const document=JSON.parse(bytes.subarray(20,20+jsonLength));
assert.match(document.asset.extras.author,/Peter_D/);assert.match(document.asset.extras.license,/CC-BY-4.0/);assert.equal(document.images.length,13);assert.equal(document.meshes.length,159);assert(bytes.length<9000000,'Keep the complete model below 9 MB');
const removeTextureReferences=value=>{
 if(!value||typeof value!=='object')return;
 for(const key of Object.keys(value)) {
  if(key.endsWith('Texture'))delete value[key];else removeTextureReferences(value[key]);
 }
};
removeTextureReferences(document.materials);
document.images=[];document.textures=[];
const json=Buffer.from(JSON.stringify(document));const jsonPadding=(4-json.length%4)%4;
const jsonChunk=Buffer.concat([json,Buffer.alloc(jsonPadding,32)]);
const binaryChunk=bytes.subarray(20+jsonLength);
const header=Buffer.alloc(20);header.writeUInt32LE(0x46546c67,0);header.writeUInt32LE(2,4);header.writeUInt32LE(20+jsonChunk.length+binaryChunk.length,8);header.writeUInt32LE(jsonChunk.length,12);header.writeUInt32LE(0x4e4f534a,16);
const testBytes=Buffer.concat([header,jsonChunk,binaryChunk]);
const gltf=await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(testBytes.buffer.slice(testBytes.byteOffset,testBytes.byteOffset+testBytes.byteLength),'');


const phone=preparePhone(gltf.scene);phone.root.updateMatrixWorld(true);
const box=new THREE.Box3().setFromObject(phone.root), size=box.getSize(new THREE.Vector3());
assert(Math.abs(size.y-5.7)<.001,'Real-world phone proportions normalized');
assert(size.x/size.y>.47&&size.x/size.y<.51,'iPhone width and height');
assert(size.z/size.y<.07,'Thin body');
assert.equal(Object.keys(phone.parts).length,9,'Nine assemblies of original components');
let count=0;const originals=new Map();
phone.root.traverse(o=>{if(!o.isMesh)return;count++;originals.set(o,o.matrixWorld.clone());for(const n of o.geometry.attributes.position.array)assert(Number.isFinite(n));});
assert.equal(count,159,'All original meshes, no invented internals');
assert(new THREE.Box3().setFromObject(phone.display).getCenter(new THREE.Vector3()).z>0,'Screen faces front');
assert(new THREE.Box3().setFromObject(phone.rear).getCenter(new THREE.Vector3()).z<0,'Back glass stays at rear');
const camera=new THREE.PerspectiveCamera(33,1,.1,60);
for(const aspect of [320/440,390/440,640/575,1.8])for(const amount of [0,.5,1])for(const yaw of [-1,-.65,0,Math.PI-.65]) {
 phone.setDisassembly(amount);phone.root.rotation.set(.14,yaw,-.06);camera.aspect=aspect;camera.updateProjectionMatrix();fitPhoneCamera(phone.root,camera);camera.updateMatrixWorld();
 phone.root.traverseVisible(o=>{if(!o.isMesh)return;const b=o.geometry.boundingBox;for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z]){const v=new THREE.Vector3(x,y,z).applyMatrix4(o.matrixWorld).project(camera);assert(Math.abs(v.x)<=1&&Math.abs(v.y)<=1,'Entire model remains in frame');}});
}
phone.root.rotation.set(0,0,0);phone.setDisassembly(0);phone.root.updateMatrixWorld(true);
for(const [o,m]of originals)for(let i=0;i<16;i++)assert(Math.abs(o.matrixWorld.elements[i]-m.elements[i])<1e-8,'Exact reassembly');
phone.setInsideView(true);assert(!phone.display.visible&&!phone.rear.visible);assert(phone.parts.Battery.group.visible);
phone.setInsideView(false);assert(phone.display.visible&&phone.rear.visible);
console.log('Native teardown passed: 159 original meshes, 13 material maps, nine assemblies, correct screen/rear orientation, exact reassembly, 48 responsive camera views, and Inside view.');

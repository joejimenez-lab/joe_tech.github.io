import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from '../frontend/public/assets/vendor/three/three.module.min.js';
import {GLTFLoader} from '../frontend/public/assets/vendor/three/GLTFLoader.js';
import {preparePhone,fitPhoneCamera} from '../frontend/public/assets/js/phone-model.js';

// Exercise the actual imported geometry in Node; image decoding belongs to WebGL.
const bytes=readFileSync(new URL('../frontend/public/assets/models/iphone-15-pro.glb',import.meta.url));
assert.equal(bytes.readUInt32LE(0),0x46546c67,'Valid GLB');
assert.equal(bytes.readUInt32LE(8),bytes.length,'Complete download');
const jsonLength=bytes.readUInt32LE(12);
const document=JSON.parse(bytes.subarray(20,20+jsonLength));
assert.match(document.asset.extras.author,/polyman/i,'Preserve the original artist attribution');
assert.match(document.asset.extras.license,/CC-BY-4.0/,'Preserve model license');
assert.equal(document.images.length,32,'Preserve the original material textures');
for(const view of document.bufferViews) assert((view.byteOffset||0)+view.byteLength<=document.buffers[0].byteLength,'Valid embedded data range');
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
const gltf=await new GLTFLoader().parseAsync(testBytes.buffer.slice(testBytes.byteOffset,testBytes.byteOffset+testBytes.byteLength),'');
const phone=preparePhone(gltf.scene);phone.root.updateMatrixWorld(true);
const size=new THREE.Box3().setFromObject(phone.root).getSize(new THREE.Vector3());
assert(Math.abs(size.y-5.7)<.001,'Normalized height');
assert(size.x/size.y>.45&&size.x/size.y<.51,'iPhone body proportions');
assert(size.z/size.y<.1,'Thin body, including camera bump');
let screenCount=0;
phone.root.traverse(o=>{
 if(!o.isMesh)return;
 for(const n of o.geometry.attributes.position.array)assert(Number.isFinite(n),'Finite geometry');
 if(o.material.name==='pIJKfZsazmcpEiU'){
  screenCount++;
  assert(new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3()).z>0,'Display faces front');
 }
});
assert.equal(screenCount,1,'One front display');
const originalMatrices=new Map();
phone.root.traverse(o=>{if(o.isMesh)originalMatrices.set(o.name,o.matrixWorld.clone());});
assert.equal(phone.display.children.length,7,'All display surfaces stay together');
assert.equal(phone.rear.children.length,15,'Rear glass is separate from camera optics');
assert.equal(phone.cameras.children.filter(o=>o.isMesh).length,33,'Preserve the original three outward-facing camera assemblies');
assert.equal(Object.keys(phone.internals.parts).length,8,'Eight named internal component assemblies');
phone.setDisassembly(1);phone.root.updateMatrixWorld(true);
const displayBounds=new THREE.Box3().setFromObject(phone.display);
const chassisBounds=new THREE.Box3().setFromObject(phone.model);
const rearBounds=new THREE.Box3().setFromObject(phone.rear);
assert(displayBounds.min.z>chassisBounds.max.z+.5,'Visible gap between display and frame');
assert(rearBounds.max.z<chassisBounds.min.z-.5,'Visible gap between rear assembly and frame');
phone.setDisassembly(0);phone.root.updateMatrixWorld(true);
phone.root.traverse(o=>{
 if(!o.isMesh)return;
 for(let i=0;i<16;i++)assert(Math.abs(o.matrixWorld.elements[i]-originalMatrices.get(o.name).elements[i])<1e-8,'Assembly restores the original model exactly');
});
let views=0;
for(const amount of [0,.5,1])for(const [width,height]of [[680,575],[410,510],[344,440],[304,440]])for(let yaw=-Math.PI;yaw<=Math.PI;yaw+=Math.PI/4)for(const pitch of[-.65,.12,.65]){
 phone.setDisassembly(amount);phone.root.rotation.set(pitch,yaw,-.06);
 const camera=new THREE.PerspectiveCamera(33,width/height,.1,60);fitPhoneCamera(phone.root,camera);camera.updateMatrixWorld();
 phone.root.traverseVisible(o=>{
  if(!o.isMesh)return;
  const p=o.geometry.attributes.position;
  for(let i=0;i<p.count;i+=47){
   const v=new THREE.Vector3().fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld).project(camera);
   assert(Math.abs(v.x)<.94&&Math.abs(v.y)<.94,'All parts fit the view while rotating');
   assert(v.z>-1&&v.z<1,'All parts stay inside clipping planes');
  }
 });views++;
}
phone.setInsideView(true);
assert.equal(phone.display.visible,false);assert.equal(phone.rear.visible,false);
assert.equal(phone.cameras.visible,true);assert.equal(phone.internals.group.visible,true);
phone.setDisassembly(1);phone.root.rotation.set(.1,-.35,-.06);
const insideCamera=new THREE.PerspectiveCamera(33,304/440,.1,60);fitPhoneCamera(phone.root,insideCamera);insideCamera.updateMatrixWorld();
phone.root.traverseVisible(o=>{
 if(!o.isMesh)return;const center=new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3()).project(insideCamera);
 assert(Math.abs(center.x)<.94&&Math.abs(center.y)<.94,'Inside view fits all visible parts on mobile');
});
phone.setInsideView(false);
// Rear-camera regression: optics face and travel toward the back, with their
// glass openings. Only closed sensor backs may face the display side.
phone.root.rotation.set(0,0,0);
for(const amount of [0,.5,1]) {
 phone.setDisassembly(amount);phone.root.updateMatrixWorld(true);
 assert(phone.cameras.position.distanceTo(phone.rear.position)<1e-8,'Camera optics stay aligned with rear-glass openings');
 assert(phone.cameras.position.z<=0,'Camera assembly never explodes toward the front');
 const backs=new THREE.Box3().setFromObject(phone.internals.cameraBacks);
 let rearLensCount=0;
 phone.cameras.traverse(o=>{
  if(!o.isMesh||o.material.name!=='EszxgwYUTxbhBrC')return;
  rearLensCount++;
  const lens=new THREE.Box3().setFromObject(o);
  assert(lens.max.z<backs.min.z-.1,'Lens faces lie on the rear side of the sensor housings');
  const normalMatrix=new THREE.Matrix3().getNormalMatrix(o.matrixWorld);
  const normals=o.geometry.attributes.normal;
  const n=new THREE.Vector3().fromBufferAttribute(normals,0).applyNormalMatrix(normalMatrix);
  assert(n.z<-.9,'Rear lens surface normal points away from the display');
 });
 assert.equal(rearLensCount,3,'Three rear-facing lens surfaces');
}
// Catch the original failure: an apparently empty center or obscured components.
function visibleSamples(part,camera,objects) {
 const box=new THREE.Box3().setFromObject(part),ray=new THREE.Raycaster();let count=0;
 for(let x=0;x<7;x++)for(let y=0;y<7;y++) {
  const p=new THREE.Vector3(box.min.x+(box.max.x-box.min.x)*(x+.5)/7,box.min.y+(box.max.y-box.min.y)*(y+.5)/7,box.max.z).project(camera);
  ray.setFromCamera(new THREE.Vector2(p.x,p.y),camera);const hit=ray.intersectObjects(objects,false)[0];
  if(hit){let object=hit.object;while(object&&object!==part)object=object.parent;if(object===part)count++;}
 }
 return count;
}
phone.setDisassembly(1);phone.root.rotation.set(.1,-.65,-.06);
const inspectionCamera=new THREE.PerspectiveCamera(33,680/575,.1,60);fitPhoneCamera(phone.root,inspectionCamera);inspectionCamera.updateMatrixWorld();
const visibleMeshes=[];phone.root.traverseVisible(o=>{if(o.isMesh&&o.material.opacity!==0)visibleMeshes.push(o);});
for(const name of ['Battery','Logic board','Taptic Engine','Loudspeaker']) {
 assert(visibleSamples(phone.internals.parts[name],inspectionCamera,visibleMeshes)>10,`${name} is visibly exposed in the default exploded view`);
}
phone.setInsideView(true);phone.root.rotation.set(.1,Math.PI-.65,-.06);
fitPhoneCamera(phone.root,inspectionCamera);inspectionCamera.updateMatrixWorld();
const rearVisible=[];phone.root.traverseVisible(o=>{if(o.isMesh&&o.material.opacity!==0)rearVisible.push(o);});
assert(visibleSamples(phone.internals.parts['Wireless charging coil'],inspectionCamera,rearVisible)>8,'Wireless coil is exposed from the back in Inside view');
console.log(`iPhone disassembly checked: visible internals verified by raycasts, exact reassembly, original geometry and textures preserved, ${views} assembled/disassembled desktop/mobile views.`);

import * as THREE from '../vendor/three/three.module.min.js';

// An original illustrative internal assembly. Component layout is informed by
// repair references; it is not a dimensionally exact Apple service model.
export function createInternals() {
 const group = new THREE.Group(); group.name = 'Illustrated internal components';
 let serial = 0;
 const material = (color, metalness = 0, roughness = .55) => new THREE.MeshStandardMaterial({color, metalness, roughness, envMapIntensity: .7});
 const graphite = material('#222326', .18, .65), rubber = material('#141618', .05, .73);
 const pcb = material('#17251f', .3, .6), gold = material('#b4995b', .8, .35);
 const copper = material('#9e6236', .75, .4), silver = material('#b5b7b9', .85, .4);
 const darkMetal = material('#42464a', .8, .47), ceramic = material('#69675e', .25, .7);
 const parts = {};
 function part(name) { const p = new THREE.Group(); p.name = name; parts[name] = p; group.add(p); return p; }
 function mesh(parent, geometry, mat, x=0, y=0, z=0) {
  const m = new THREE.Mesh(geometry, mat); m.name = `internal-${++serial}`; m.position.set(x,y,z); parent.add(m); return m;
 }
 function shape(parent, points, depth, mat, z=0, bevel=.016) {
  const s = new THREE.Shape(); points.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y)); s.closePath();
  const g = new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:bevel>0,bevelSegments:3,steps:1,bevelSize:bevel,bevelThickness:bevel,curveSegments:6});
  return mesh(parent,g,mat,0,0,z);
 }
 function plate(parent,x,y,w,h,d,mat,z=0,r=.04) {
  r=Math.min(r,w/3,h/3); const s=new THREE.Shape();
  s.moveTo(-w/2+r,-h/2);s.lineTo(w/2-r,-h/2);s.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);
  s.lineTo(w/2,h/2-r);s.quadraticCurveTo(w/2,h/2,w/2-r,h/2);s.lineTo(-w/2+r,h/2);s.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);s.lineTo(-w/2,-h/2+r);s.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);
  return mesh(parent,new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:true,bevelSegments:2,bevelSize:.008,bevelThickness:.006,curveSegments:5}),mat,x,y,z);
 }
 function cylinder(parent,x,y,z,r,d,mat) {
  const m=mesh(parent,new THREE.CylinderGeometry(r,r,d,16),mat,x,y,z);m.rotation.x=Math.PI/2;return m;
 }
 function screw(parent,x,y,z) {
  cylinder(parent,x,y,z,.035,.024,silver);
  mesh(parent,new THREE.BoxGeometry(.039,.008,.003),rubber,x,y,z+.013);
  mesh(parent,new THREE.BoxGeometry(.008,.039,.003),rubber,x,y,z+.014);
 }
 function label(parent,text,x,y,z,w,h,size=34) {
  let map=null;
  if(globalThis.document?.createElement) {
   const canvas=globalThis.document.createElement('canvas');canvas.width=512;canvas.height=256;
   const ctx=canvas.getContext('2d');ctx.clearRect(0,0,512,256);ctx.fillStyle='#b1b3b5';ctx.textAlign='center';ctx.textBaseline='middle';
   const lines=text.split('\n');lines.forEach((line,i)=>{ctx.font=`${i===0?size:size*.58}px Arial`;ctx.fillText(line,256,110+(i-(lines.length-1)/2)*43);});
   map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;
  }
  const mat=new THREE.MeshBasicMaterial({map,transparent:true,opacity:map?1:0,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});
  return mesh(parent,new THREE.PlaneGeometry(w,h),mat,x,y,z);
 }
 function ribbon(parent,points,width,z) {
  // Flat copper flex with visible parallel conductors, not a round wire.
  for(let i=1;i<points.length;i++) {
   const a=new THREE.Vector2(...points[i-1]), b=new THREE.Vector2(...points[i]);const delta=b.clone().sub(a), mid=a.clone().add(b).multiplyScalar(.5);
   const strip=plate(parent,mid.x,mid.y,width,delta.length()+.015,.009,copper,z,.012);strip.rotation.z=-Math.atan2(delta.x,delta.y);
   for(const offset of [-.27,0,.27]) {
    const line=mesh(strip,new THREE.BoxGeometry(width*.035,delta.length(),.002),gold,offset*width,0,.012);
   }
  }
 }
 function connector(parent,x,y,w,z) {
  plate(parent,x,y,w,.1,.024,rubber,z,.012);
  for(let i=0;i<10;i++)mesh(parent,new THREE.BoxGeometry(w/22,.05,.009),gold,x-w*.43+i*w*.095,y,z+.026);
 }
 const bed=part('Midframe');
 plate(bed,0,0,2.49,5.31,.012,darkMetal,-.012,.26);
 plate(bed,0,-.2,2.33,4.62,.012,rubber,.008,.16);
 for(const y of [-2.46,-1.55,-.52,.62,1.72,2.46])for(const x of [-1.19,1.19])screw(bed,x,y,.075);
 // Thin grounding pads around the edge, clear of the display rim.
 for(let i=0;i<8;i++)plate(bed,-1.22,-2.1+i*.58,.055,.12,.012,gold,.035,.005);

 const battery=part('Battery');
 const batteryOutline=[[-1.08,-1.93],[1.08,-1.93],[1.08,1.17],[-.39,1.17],[-.39,-.06],[-1.08,-.06]];
 shape(battery,batteryOutline,.087,graphite,.055,.026);
 // Foil lip and recessed face follow the L-shaped battery, rather than a slab.
 shape(battery,[[-1.03,-1.87],[1.02,-1.87],[1.02,1.11],[-.33,1.11],[-.33,-.13],[-1.03,-.13]],.006,rubber,.147,.008);
 label(battery,'Li-ion\nRECHARGEABLE BATTERY\nHANDLE WITH CARE',.25,-.66,.163,1.36,.8,47);
 label(battery,'+     −',.23,-1.35,.163,.75,.32,42);
 for(const x of [-.65,.62])plate(battery,x,-1.96,.19,.1,.008,silver,.08,.018);
 ribbon(battery,[[-.42,-.15],[-.57,.02],[-.57,.36]],.17,.105);
 connector(battery,-.57,.38,.23,.113);

 const board=part('Logic board');
 const outline=[[-1.1,-.03],[-.58,-.03],[-.58,.46],[-.5,.46],[-.5,1.28],[-.22,1.28],[-.22,2.38],[-.48,2.38],[-.48,2.55],[-1.1,2.55]];
 shape(board,outline,.045,pcb,.055,.018);
 // Gold edge plating, shield cans, ICs and small passive components.
 for(const [x,y,w,h] of [[-.83,2.23,.45,.46],[-.72,1.69,.66,.49],[-.81,1.09,.42,.39],[-.81,.52,.4,.37]]) {
  plate(board,x,y,w+.025,h+.025,.04,darkMetal,.104,.045);
  plate(board,x,y,w,h,.013,silver,.153,.035);
  for(const sx of [-1,1])for(const sy of [-1,1])cylinder(board,x+sx*w*.38,y+sy*h*.36,.171,.013,.004,darkMetal);
 }
 for(let row=0;row<15;row++)for(let col=0;col<3;col++) {
  const x=-1.055+col*.085,y=.05+row*.16;
  plate(board,x,y,.04,.065,.024,row%3?ceramic:rubber,.105,.004);
 }
 for(const [x,y] of [[-.52,1.45],[-.5,1.7],[-.93,.21]]) {
  plate(board,x,y,.18,.14,.023,rubber,.107,.014);
  for(let i=0;i<4;i++)mesh(board,new THREE.BoxGeometry(.014,.025,.012),silver,x-.067+i*.044,y-.08,.122);
 }
 for(const [x,y] of [[-1.07,2.48],[-.32,2.3],[-1.07,.08],[-.56,1.3]])screw(board,x,y,.15);
 connector(board,-.58,.24,.26,.14);
 label(board,'LOGIC BOARD',-.82,1.7,.172,.5,.22,30);

 const taptic=part('Taptic Engine');
 plate(taptic,-.64,-2.26,1.02,.39,.084,darkMetal,.047,.064);
 plate(taptic,-.64,-2.26,.86,.32,.012,silver,.137,.048);
 label(taptic,'TAPTIC ENGINE',-.64,-2.25,.152,.82,.28,30);
 for(const x of [-1.16,-.1])screw(taptic,x,-2.27,.13);
 ribbon(taptic,[[-.2,-2.12],[-.2,-1.98],[-.49,-1.98]],.1,.08);

 const speaker=part('Loudspeaker');
 shape(speaker,[[.04,-2.48],[1.07,-2.48],[1.15,-2.3],[1.15,-2.03],[.59,-2.03],[.59,-2.14],[.04,-2.14]],.085,rubber,.053,.028);
 plate(speaker,.76,-2.23,.54,.22,.017,darkMetal,.15,.048);
 for(let i=0;i<10;i++)mesh(speaker,new THREE.BoxGeometry(.021,.13,.006),rubber,.54+i*.047,-2.23,.176);
 for(const [x,y]of [[.16,-2.36],[1.07,-2.1]])screw(speaker,x,y,.14);

 const charging=part('Charging flex');
 ribbon(charging,[[-.82,-2.59],[-.42,-2.59],[0,-2.55],[.39,-2.58],[.8,-2.58]],.12,.017);
 ribbon(charging,[[-.96,-2.56],[-1.13,-2.27],[-1.13,-.32],[-.98,-.23]],.08,.025);
 connector(charging,-.94,-.23,.24,.065);
 // The original USB-C socket remains part of the original model.

 const coil=part('Wireless charging coil');
 cylinder(coil,0,-.44,-.028,.82,.014,rubber);
 for(let i=0;i<12;i++)mesh(coil,new THREE.TorusGeometry(.5+i*.022,.008,4,64),copper,0,-.44,-.014);
 ribbon(coil,[[0,-1.18],[0,-1.55],[.27,-1.61]],.14,-.024);
 connector(coil,.28,-1.61,.24,-.016);

 const cameraBacks=part('Camera sensor housings');
 for(const [x,y,w,h] of [[.865,1.659,.55,.52],[.865,2.345,.56,.53],[.222,2.002,.53,.57]]) {
  // Closed, shallow metal sensor backs on the inward side. The actual circular
  // lenses belong to the original model and point through the rear glass.
  plate(cameraBacks,x,y,w,h,.054,darkMetal,-.012,.055);
  plate(cameraBacks,x,y,w*.94,h*.93,.008,silver,.05,.049);
  for(const dy of [-.065,-.09])mesh(cameraBacks,new THREE.BoxGeometry(w*.3,.006,.002),darkMetal,x-w*.16,y+dy,.067);
  for(const dx of [-.14,.14])plate(cameraBacks,x+dx,y-h*.42,.055,.04,.003,gold,.062,.006);
  ribbon(cameraBacks,[[x,y-h*.45],[x,y-h*.55],[x-.24,y-h*.62]],.085,.024);
 }
 const offsets = new Map([
  [battery,new THREE.Vector3(-.52,-.18,1.05)],
  [board,new THREE.Vector3(.03,.11,.52)],
  [taptic,new THREE.Vector3(-.3,-.2,.78)],
  [speaker,new THREE.Vector3(.38,-.13,.6)],
  [charging,new THREE.Vector3(0,-.1,.32)],
  [coil,new THREE.Vector3(.18,0,-.48)]
 ]);
 return {group,parts,cameraBacks,setDisassembly(amount) {
  for(const [object,offset] of offsets)object.position.copy(offset).multiplyScalar(amount);
 }};
}

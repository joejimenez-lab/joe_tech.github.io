import * as THREE from '../vendor/three/three.module.min.js';
import { loadPhone, fitPhoneCamera } from './phone-model.js?v=16';

const stage = document.querySelector('[data-phone-stage]');
if (stage) {
  initPhone(stage).catch(error => {
    console.warn('3D preview unavailable; showing repair photo.', error);
    stage.classList.remove('scene-ready');
    stage.querySelector('canvas').hidden = true;
    stage.querySelector('.scene-controls').hidden = true;
    stage.querySelector('.scene-fallback').hidden = false;
  });
}
async function initPhone(stage) {
  const canvas=stage.querySelector('canvas');
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.75));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(33,1,.1,60);camera.position.set(0,0,14);
  const environment=new THREE.Scene();environment.background=new THREE.Color('#24262a');
  for(const [position,scale,color,intensity] of [
    [[-5,3,3],[1,8,5],0xffffff,5],[[5,1,1],[1,6,5],0xd8e3ff,3],[[0,7,-3],[8,1,5],0xffffff,6],[[0,-5,3],[6,1,3],0xffffff,1]
  ]) {
    const panel=new THREE.Mesh(new THREE.BoxGeometry(...scale),new THREE.MeshBasicMaterial({color}));
    panel.material.color.multiplyScalar(intensity);panel.position.set(...position);environment.add(panel);
  }
  const pmrem=new THREE.PMREMGenerator(renderer);const environmentMap=pmrem.fromScene(environment,.04);scene.environment=environmentMap.texture;
  environment.traverse(object=>{object.geometry?.dispose();object.material?.dispose();});pmrem.dispose();
  const key=new THREE.DirectionalLight(0xf4f6ff,2);key.position.set(3,5,8);scene.add(key);
  const rim=new THREE.DirectionalLight(0x90aaf0,1.2);rim.position.set(-4,0,-4);scene.add(rim);
  scene.add(new THREE.AmbientLight(0xffffff,.45));
  const phone=await loadPhone();scene.add(phone.root);
  const frontAngle=-.65, rearAngle=Math.PI-.65;
  phone.setDisassembly(1);
  phone.root.rotation.set(.14,frontAngle,-.06);
  const motionQuery=window.matchMedia('(prefers-reduced-motion: reduce)');
  let paused=motionQuery.matches, visible=true, dragging=false, lastX=0,lastY=0, yaw=frontAngle,pitch=.14;
  let currentYaw=yaw,currentPitch=pitch,showingBack=false,amount=1,targetAmount=1,frame=0,lastTime=0,phase=0;
  let lightX=3, lightY=5;
  const bounds=new THREE.Box3();
  const fitCamera=()=>fitPhoneCamera(phone.root,camera,bounds);
  const controls=stage.querySelector('.scene-controls');
  const toggle=stage.querySelector('[data-turn-phone]'), pause=stage.querySelector('[data-pause-phone]'), reset=stage.querySelector('[data-reset-phone]');
  const assembly=stage.querySelector('[data-assemble-phone]');
  const insideButton=stage.querySelector('[data-inside-phone]');
  let inside=false;
  const state=stage.querySelector('.scene-state');
  const setPauseText=()=>{pause.textContent=paused?'Resume motion':'Pause motion';pause.setAttribute('aria-pressed',String(paused));};
  setPauseText();
  function resize() {
    const width=stage.clientWidth,height=canvas.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width,height,false);camera.aspect=width/height;
    fitCamera();
    camera.updateProjectionMatrix();wake();
  }
  function wake(){if(!frame&&visible&&!document.hidden) frame=requestAnimationFrame(render);}
  function render(time) {
    frame=0;const dt=Math.min((time-lastTime)/1000,.05);lastTime=time;
    if(!paused&&!dragging) phase+=dt;
    const ease=1-Math.exp(-dt*9);
    currentYaw+=(yaw-currentYaw)*ease;currentPitch+=(pitch-currentPitch)*ease;
    amount+=(targetAmount-amount)*ease;
    phone.setDisassembly(amount);
    phone.root.rotation.set(currentPitch+(!paused?Math.sin(phase*.6)*.035:0),currentYaw+(!paused?Math.sin(phase*.4)*.085:0),-.06);
    phone.root.position.y=!paused?Math.sin(phase*.8)*.065:0;
    key.position.x+=(lightX-key.position.x)*ease;key.position.y+=(lightY-key.position.y)*ease;
    fitCamera();renderer.render(scene,camera);
    if(visible&&!document.hidden&&(!paused||dragging||Math.abs(amount-targetAmount)>.0005||Math.abs(currentYaw-yaw)>.0005||Math.abs(currentPitch-pitch)>.0005||Math.abs(lightX-key.position.x)>.01||Math.abs(lightY-key.position.y)>.01)) wake();
  }
  canvas.addEventListener('pointerdown',event=>{if(event.button!==0)return;dragging=true;lastX=event.clientX;lastY=event.clientY;canvas.setPointerCapture(event.pointerId);canvas.classList.add('is-dragging');wake();});
  canvas.addEventListener('pointermove',event=>{
    if(dragging){yaw+=(event.clientX-lastX)*.008;pitch=THREE.MathUtils.clamp(pitch+(event.clientY-lastY)*.005,-.65,.65);lastX=event.clientX;lastY=event.clientY;}
    else {const rect=canvas.getBoundingClientRect();lightX=3+(event.clientX-rect.left)/rect.width*5;lightY=7-(event.clientY-rect.top)/rect.height*5;}
    wake();
  });
  const endDrag=()=>{dragging=false;canvas.classList.remove('is-dragging');};
  canvas.addEventListener('pointerup',endDrag);canvas.addEventListener('pointercancel',endDrag);canvas.addEventListener('lostpointercapture',endDrag);
  canvas.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(event.key))return;
    event.preventDefault();if(event.key==='ArrowLeft')yaw-=.2;if(event.key==='ArrowRight')yaw+=.2;
    if(event.key==='ArrowUp')pitch=Math.max(-.65,pitch-.15);if(event.key==='ArrowDown')pitch=Math.min(.65,pitch+.15);
    if(event.key==='Home'){yaw=showingBack?rearAngle:frontAngle;pitch=.12;}wake();
  });
  toggle.addEventListener('click',()=>{
    showingBack=!showingBack;
    yaw=showingBack?rearAngle:frontAngle;pitch=.12;
    toggle.textContent='Flip phone';
    toggle.setAttribute('aria-label',showingBack?'Rotate iPhone to the front':'Rotate iPhone to the back');
    if(motionQuery.matches){currentYaw=yaw;currentPitch=pitch;}
    wake();
  });
  assembly.addEventListener('click',()=>{
    targetAmount=targetAmount?0:1;
    assembly.textContent=targetAmount?'Assemble':'Disassemble';
    assembly.setAttribute('aria-label',targetAmount?'Assemble the iPhone':'Disassemble the iPhone');
    state.textContent=inside?'Inside an iPhone':targetAmount?'Exploded iPhone':'Assembled iPhone';
    if(motionQuery.matches)amount=targetAmount;
    wake();
  });
  insideButton.addEventListener('click',()=>{
    inside=!inside;phone.setInsideView(inside);
    insideButton.textContent=inside?'Show whole phone':'Inside view';
    insideButton.setAttribute('aria-pressed',String(inside));
    state.textContent=inside?'Inside an iPhone':targetAmount?'Exploded iPhone':'Assembled iPhone';
    if(inside){targetAmount=1;assembly.textContent='Assemble';assembly.setAttribute('aria-label','Assemble the iPhone');yaw=-.35;pitch=.1;showingBack=false;toggle.setAttribute('aria-label','Rotate iPhone to the back');}
    if(motionQuery.matches){currentYaw=yaw;currentPitch=pitch;amount=targetAmount;}
    wake();
  });
  pause.addEventListener('click',()=>{paused=!paused;setPauseText();wake();});
  reset.addEventListener('click',()=>{yaw=showingBack?rearAngle:frontAngle;pitch=.12;wake();});
  motionQuery.addEventListener('change',event=>{paused=event.matches;setPauseText();wake();});
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible){lastTime=performance.now();wake();}else{cancelAnimationFrame(frame);frame=0;}},{threshold:.01});observer.observe(stage);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else{lastTime=performance.now();wake();}});
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();cancelAnimationFrame(frame);frame=0;visible=false;stage.classList.remove('scene-ready');controls.hidden=true;canvas.hidden=true;stage.querySelector('.scene-fallback').hidden=false;});
  new ResizeObserver(resize).observe(stage);
  // Only swap out the genuine repair photo once WebGL has rendered successfully.
  resize();renderer.render(scene,camera);
  stage.classList.add('scene-ready');stage.querySelector('.scene-fallback').hidden=true;canvas.hidden=false;controls.hidden=false;
  resize();
}

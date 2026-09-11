import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../frontend/public/assets/js/teardown-viewer.js',import.meta.url),'utf8');
class Element {
 constructor(){this.listeners={};this.hidden=true;this.value=0;this.attrs={};}
 addEventListener(name,callback){this.listeners[name]=callback;}
 setAttribute(name,value){this.attrs[name]=value;}
 fire(name){this.listeners[name]?.();}
}
const selectors=['iframe','.teardown-controls','input','output','[data-teardown-play]','[data-teardown-reset]'];
const elements=Object.fromEntries(selectors.map(s=>[s,new Element()]));
const calls=[],events={},timers=new Map(),doc=new Element(),motion=new Element();
let observer, timerId=0;
doc.querySelector=()=>({querySelector:s=>elements[s]});
const api={
 addEventListener:(name,cb)=>events[name]=cb,
 start:()=>events.viewerready(),
 setBackground:value=>calls.push(['background',value]),
 getCameraLookAt:cb=>cb(null,{position:[1,2,3],target:[0,0,0]}),
 getAnimations:cb=>cb(null,[['track','Disassembly',12]]),
 setCurrentAnimationByUID:(uid,cb)=>cb(null),
 setCycleMode:mode=>calls.push(['cycle',mode]),
 pause:()=>{calls.push(['pause']);events.animationStop?.();},
 seekTo:time=>calls.push(['seek',time]),
 play:cb=>{events.animationPlay();cb?.(null);},
 getCurrentTime:cb=>cb(null,6),
 setCameraLookAt:(...args)=>calls.push(['camera',...args])
};
function Sketchfab(version,frame){assert.equal(version,'1.12.1');assert.equal(frame,elements.iframe);this.init=(uid,options)=>{assert.equal(uid,'708eaa5d195544918e5f70b69eedcdfa');assert.equal(options.dnt,1);assert.equal(options.animation_autoplay,0);options.success(api);};}
vm.runInNewContext(source,{window:{Sketchfab},Sketchfab,document:doc,matchMedia:()=>motion,setInterval:fn=>{timers.set(++timerId,fn);return timerId;},clearInterval:id=>timers.delete(id),IntersectionObserver:class{constructor(cb){observer=cb;}observe(){}}});
assert.equal(elements['.teardown-controls'].hidden,false);
assert.equal(elements.output.value,'Exploded view');
assert.deepEqual(calls.filter(c=>c[0]==='seek').at(-1),['seek',12]);
elements.input.value=25;elements.input.fire('input');
assert.deepEqual(calls.at(-1),['seek',3]);assert.equal(elements.output.value,'25%');
const play=elements['[data-teardown-play]'];play.fire('click');
assert.equal(play.textContent,'Pause teardown');assert.equal(timers.size,1);
for(const tick of timers.values())tick();assert.equal(elements.input.value,50);
play.fire('click');assert.equal(play.textContent,'Play teardown');assert.equal(timers.size,0);
events.animationPlay();assert.equal(play.textContent,'Pause teardown');
observer([{isIntersecting:false}]);assert.equal(timers.size,0);
motion.matches=true;elements['[data-teardown-reset]'].fire('click');
assert.equal(elements.output.value,'Exploded view');assert.deepEqual(calls.at(-1),['camera',[1,2,3],[0,0,0],0]);
play.fire('click');assert(calls.some(c=>c[0]==='seek'&&c[1]===0));
doc.hidden=true;doc.fire('visibilitychange');assert.equal(timers.size,0);
vm.runInNewContext(source,{window:{},document:doc});
console.log('Teardown controls passed: timeline, playback, native-player sync, reset, reduced motion, offscreen pause, and SDK fallback.');

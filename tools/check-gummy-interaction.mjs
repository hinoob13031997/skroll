// Renderer-free behavioural check. Real Three geometry/matrices, fake GPU and DOM; NOT a browser/WebGL visual test.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import * as core from '../vendor/three/three.module.js';
import {gummyProfile,nextGummyPose,gummyBubbles} from '../src/gummy-shape.js';
const source=await readFile(new URL('../src/gummies.js',import.meta.url),'utf8');
const body=source.slice(source.indexOf(' const caption='),source.lastIndexOf('}'));
assert.ok(body.startsWith(' const caption='));
class NodeStub{
 constructor(){this.listeners=new Map();this.classes=new Set();this.attributes=new Map();this.dataset={};this.children=[];this.textContent='';
  this.classList={add:(...v)=>v.forEach(x=>this.classes.add(x)),remove:(...v)=>v.forEach(x=>this.classes.delete(x)),contains:v=>this.classes.has(v)};}
 addEventListener(k,v){if(!this.listeners.has(k))this.listeners.set(k,new Set());this.listeners.get(k).add(v);}
 removeEventListener(k,v){this.listeners.get(k)?.delete(v);}
 dispatch(k,e={}){for(const fn of this.listeners.get(k)||[])fn({type:k,...e});}
 setAttribute(k,v){this.attributes.set(k,v);}
 removeAttribute(k){this.attributes.delete(k);}
 append(node){this.children.push(node);node.parent=this;}
 remove(){if(this.parent)this.parent.children=this.parent.children.filter(n=>n!==this);}
 focus(){}setPointerCapture(){}getBoundingClientRect(){return{width:340,height:340/1.5};}
 get clientWidth(){return 340;}
}
for(const mode of ['normal','reduced','no-webgl','texture-error','shader-error']){
 let now=0,id=0,renderCount=0,lastPair;const rafs=new Map(),observers=[];
 const caption=new NodeStub(),image=new NodeStub();image.src='https://example.test/skroll/assets/gummies-3d-v3.webp';
 const host=new NodeStub();host.closest=()=>({querySelector:()=>caption});host.querySelector=()=>image;
 const doc=new NodeStub();doc.hidden=false;doc.documentElement=new NodeStub();doc.createElement=()=>new NodeStub();
 const reduced=new NodeStub();reduced.matches=mode==='reduced';
 class Observer{constructor(fn){this.fn=fn;observers.push(this);}observe(){}disconnect(){this.disconnected=true;}}
 class Renderer{
  constructor(){if(mode==='no-webgl')throw Error('Unavailable');this.debug={};this.capabilities={getMaxAnisotropy:()=>4};}
  setClearColor(){}setPixelRatio(){}setSize(){}dispose(){this.disposed=true;}
  async compileAsync(scene){const body=scene.getObjectByName('gummy-body'),material=body.material;
   assert.ok(material.isMeshPhysicalMaterial);assert.equal(material.map,null,'Do not wrap the photograph around lathe UVs');assert.equal(material.toneMapped,false,'Preserve the approved photographic colour');
   const shader={vertexShader:core.ShaderLib.physical.vertexShader,fragmentShader:core.ShaderLib.physical.fragmentShader,uniforms:{}};material.onBeforeCompile(shader);
   assert.ok(shader.uniforms.gelPhotograph.value.isTexture,'Retain fine photographic gel texture');
   assert.equal(shader.uniforms.gelPhotograph.value.colorSpace,core.SRGBColorSpace);
   assert.ok(shader.vertexShader.includes('gelView=transpose(mat3(modelMatrix))'),'Camera elevation is evaluated in gummy-local space');
   assert.ok(shader.fragmentShader.includes('gelTopWeight')&&shader.fragmentShader.includes('normalize(gelView).y'),'Top view fades the photographed shoulder softboxes');
   assert.ok(shader.fragmentShader.includes('gelFloor')&&shader.fragmentShader.includes('-gelNormal.y'),'The flat underside keeps its horizontal projection');
   assert.equal(material.bumpMap,null,'No UV bump texture pinching at the pole');
   body.geometry.computeBoundingBox();const bounds=body.geometry.boundingBox;assert.ok(bounds.max.y-bounds.min.y>1.15&&bounds.max.y-bounds.min.y<1.25,'Half-dome rather than a shallow coin');assert.ok(bounds.max.z-bounds.min.z>1.7);
   assert.ok(scene.environment.isCubeTexture);assert.equal(scene.environment.image.length,6);assert.ok(scene.environment.image.every(face=>face.isDataTexture&&face.type===core.HalfFloatType&&face.image.data.length===128*128*4));
   const air=scene.getObjectByName('gummy-air');assert.equal(air.count,28);
   const matrix=new core.Matrix4(),point=new core.Vector3();
   for(let i=0;i<air.count;i++){air.getMatrixAt(i,matrix);point.setFromMatrixPosition(matrix);assert.ok(Number.isFinite(matrix.determinant())&&matrix.determinant()>0);assert.ok(point.y>-.585&&point.y<.585,'Air bubbles remain inside the closed gel volume');}
   if(mode==='shader-error')this.debug.onShaderError();}
  render(scene){renderCount++;lastPair=scene.getObjectByName('gummy-pair');}
 }
 class TextureLoader{async loadAsync(){if(mode==='texture-error')throw Error('Image unavailable');return new core.Texture();}}
 const context={THREE:{...core,WebGLRenderer:Renderer,TextureLoader},gummyProfile,nextGummyPose,gummyBubbles,document:doc,matchMedia:()=>reduced,
  devicePixelRatio:2,performance:{now:()=>now},ResizeObserver:Observer,IntersectionObserver:Observer,MutationObserver:Observer,
  requestAnimationFrame:fn=>{rafs.set(++id,fn);return id;},cancelAnimationFrame:id=>rafs.delete(id)};
 const create=runInNewContext(`(async function(host){${body}})`,context),viewer=await create(host);
 if(['no-webgl','texture-error','shader-error'].includes(mode)){assert.equal(viewer,null);assert.ok(!host.classes.has('is-ready'));assert.ok(!image.attributes.has('aria-hidden'));continue;}
 const flush=()=>{let count=0;while(rafs.size&&count++<240){const jobs=[...rafs.values()];rafs.clear();now+=16;jobs.forEach(fn=>fn(now));}assert.equal(rafs.size,0,'Rendering sleeps when interaction settles');};
 assert.ok(host.classes.has('is-ready'));assert.equal(host.children.length,1);assert.equal(host.tabIndex,0);
 const pointer={pointerId:1,pointerType:'mouse',button:0,clientX:0,clientY:0};
 host.dispatch('pointerdown',pointer);now+=20;host.dispatch('pointermove',{...pointer,clientX:340*1.25,clientY:340*1.25});
 host.dispatch('pointerup',pointer);flush();assert.ok(lastPair.rotation.y>Math.PI*2);assert.ok(lastPair.rotation.x>Math.PI*2);
 let prevented=false;host.dispatch('keydown',{key:'Home',preventDefault:()=>{prevented=true;}});flush();assert.ok(prevented);assert.ok(Math.abs(lastPair.rotation.y+.12)<.01);assert.ok(Math.abs(lastPair.rotation.x-.06)<.01);
 const touch={...pointer,pointerType:'touch'};host.dispatch('pointerdown',touch);now+=20;host.dispatch('pointermove',{...touch,clientX:340*1.25,clientY:340});host.dispatch('pointercancel',touch);flush();
 assert.ok(lastPair.rotation.y>Math.PI*2);assert.ok(lastPair.rotation.x>Math.PI*2,'Touch rotates the volume vertically as well as horizontally');
 const cancelledPose=lastPair.rotation.clone();host.dispatch('pointerdown',{...touch,clientX:50,clientY:50});
 host.dispatch('pointerdown',{...touch,pointerId:2,isPrimary:false});host.dispatch('pointermove',{...touch,clientX:180,clientY:180});flush();
 assert.ok(!host.classes.has('is-grabbing'),'Second finger yields to native page pinch zoom');assert.ok(Math.abs(lastPair.rotation.x-cancelledPose.x)<.01);
 host.dispatch('dblclick');flush();assert.ok(Math.abs(lastPair.rotation.y+.12)<.01);assert.ok(Math.abs(lastPair.rotation.x-.06)<.01);
 const canvas=host.children[0];canvas.dispatch('webglcontextlost',{preventDefault(){}});assert.ok(!host.classes.has('is-ready'));assert.ok(!image.attributes.has('aria-hidden'));
 canvas.dispatch('webglcontextrestored');flush();assert.ok(host.classes.has('is-ready'));
 doc.hidden=true;doc.dispatch('visibilitychange');assert.equal(rafs.size,0);doc.hidden=false;doc.dispatch('visibilitychange');flush();assert.ok(renderCount>3);
 viewer.dispose();assert.equal(host.children.length,0);assert.ok(!host.classes.has('is-ready'));assert.ok(observers.every(o=>o.disconnected));assert.equal(rafs.size,0);
}
// Narrow panes must expose essentially the full composition, not a 20–30% sliver of a wide frame.
const voyage=await readFile(new URL('../src/voyage.js',import.meta.url),'utf8');
const frameBody=voyage.match(/function frameSpan\(aspect,space=false\)\{([\s\S]*?)\}/)[1];
const frameSpan=runInNewContext(`(function(aspect,space=false){${frameBody}})`,{sstep:(a,b,v)=>{const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t);}});
for(const aspect of [320/780,390/844,600/900,768/1024])assert.ok(frameSpan(aspect)[0]>.98);
for(const aspect of [1758/860,1920/900,2560/1080])assert.ok(frameSpan(aspect)[1]>=1,'Wide viewports preserve the source height rather than enlarge a cropped product');
for(const aspect of [.4,.75,1,1.3,1.55,16/9,2.4])for(const v of frameSpan(aspect))assert.ok(Number.isFinite(v)&&v>0);
for(const aspect of [.4,.46,.65]){const plain=frameSpan(aspect),space=frameSpan(aspect,true);assert.ok(space[0]>=.7&&space[0]<=.85);assert.ok(space[1]<plain[1],'Portrait flight has its own modest framing, not a tiny repeated wide plate');}
for(const aspect of [1.2,16/9,2.4])assert.deepEqual(frameSpan(aspect,true),frameSpan(aspect),'Desktop framing is unchanged');
assert.ok(!voyage.includes('mod(q,2.)')&&!voyage.includes('gMir'),'No mirrored planet copies in tall viewports');
assert.ok(!voyage.includes('sin(a*5.')&&!voyage.includes('sin(a*9.')&&!voyage.includes('SU.xy'),'No added starburst at an arbitrary light position');
assert.ok(!voyage.includes("e.preventDefault();location.reload()"),'Context loss must not reload the site in a loop');
assert.ok(!voyage.includes('q.x*300.,q.y*900.'),'No high-frequency water glitter');
assert.ok(!voyage.includes('fract(uTime*7.)'),'No animated grain');
assert.ok(!voyage.includes('q.y*900.')&&!voyage.includes('w*130.'),'No water displacement bands');
assert.ok(!voyage.includes('worlds.forEach'),'No world-wide bubble/confetti overlay');
assert.ok(voyage.includes("s.copy.style.transform=''"),'Copy baseline stays fixed during scrolling');
assert.ok(voyage.includes('dolly:t*t*.35')&&voyage.includes('dolly:u2*.25'),'No discontinuous resting depth zoom at the B-to-A handoff');
const styles=await readFile(new URL('../src/styles.css',import.meta.url),'utf8');
const homeStyles=await readFile(new URL('../src/home.css',import.meta.url),'utf8');
assert.match(homeStyles,/\.hr-gummies-stage\.is-ready\{[^}]*touch-action:pinch-zoom/,'Only the ready viewer takes two-axis drags; native pinch zoom is retained');
assert.match(homeStyles,/\.hr-gummies-stage\{[^}]*touch-action:pan-y/,'Loading or fallback still permits scrolling over the image');
assert.match(styles,/\.voyage\.is-live \.vg-rail\{right:var\(--cinema-controls\)\}/,'World rail uses the viewport edge, not the 1160px content gutter');
assert.match(styles,/\.vg-component\{[^}]*white-space:nowrap/,'Composition components do not leave a standalone vitamin letter');
assert.match(styles,/top:clamp\(160px,33svh,360px\);bottom:auto;translate:none/,'World heading baseline is independent of copy height');
console.log('PASS renderer-free checks: photographic gel, closed half-dome and internal bubbles, 360-degree mouse/touch, keyboard/double-click reset, reduced motion, GPU/texture/shader fallback, context recovery, disposal, narrow-pane framing and clean film layers. Real browser rendering has a separate visual test.');

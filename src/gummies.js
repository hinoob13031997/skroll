// A real closed 3D model. The image remains in place until the renderer is ready.
export async function createGummyViewer(host){
 const version=new URL(import.meta.url).search;
 const shapeUrl=new URL('./gummy-shape.js',import.meta.url);shapeUrl.search=version;
 const [THREE,{gummyProfile,gummyBubbles,nextGummyPose}]=await Promise.all([
  import(new URL('./assets/vendor/three.module.js',import.meta.url).href),import(shapeUrl.href)
 ]);
 const figure=host.closest('figure'),controls=figure.querySelector('[data-gummy-controls]'),help=figure.querySelector('[data-gummy-help]');
 const fallback=host.querySelector('img');
 const canvas=document.createElement('canvas');canvas.setAttribute('aria-hidden','true');
 let renderer;
 try{renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'default',stencil:false});}catch{return null;}
 renderer.setClearColor(0x080b13,0);renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
 renderer.transmissionResolutionScale=1;
 let shaderFailed=false;renderer.debug.onShaderError=()=>{shaderFailed=true;};
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(27,1,.1,50);
 camera.position.set(0,1.05,9.2);camera.lookAt(0,0,0);
 // Large luminous softboxes generate reflections on the curved gelatin, rather than painted highlights.
 const studio=new THREE.Scene();studio.background=new THREE.Color(0x101423);
 const panelGeometry=new THREE.PlaneGeometry(1,1),panelMaterials=[];
 function panel(x,y,z,w,h,r,g,b){
  const material=new THREE.MeshBasicMaterial({color:new THREE.Color().setRGB(r,g,b),side:THREE.DoubleSide});panelMaterials.push(material);
  const mesh=new THREE.Mesh(panelGeometry,material);mesh.position.set(x,y,z);mesh.scale.set(w,h,1);mesh.lookAt(0,0,0);studio.add(mesh);
 }
 panel(-3.5,4,4,3.2,4.6,6,5.6,5.4);
 panel(4.2,2.5,1.5,1.4,4,3.1,3.5,5.4);
 panel(.5,4,-3,4.5,2.1,4.6,2.8,3.2);
 panel(0,-3.5,2,5,2,.32,.24,.28);
 const pmrem=new THREE.PMREMGenerator(renderer);let environment;
 try{environment=pmrem.fromScene(studio,.025,.1,30);}catch{renderer.dispose();return null;}
 finally{panelGeometry.dispose();panelMaterials.forEach(m=>m.dispose());pmrem.dispose();}
 scene.environment=environment.texture;scene.environmentIntensity=1.1;
 const key=new THREE.DirectionalLight(0xfff1e8,3.2);key.position.set(-3,4,5);scene.add(key);
 const rim=new THREE.DirectionalLight(0xbfc5ff,2.7);rim.position.set(3,2,-2);scene.add(rim);
 scene.add(new THREE.HemisphereLight(0xf8d3dd,0x3b0a18,1.2));
 const compact=matchMedia('(max-width:700px)').matches;
 const geometry=new THREE.LatheGeometry(gummyProfile(compact?64:88).map(([r,y])=>new THREE.Vector2(r,y-.585)),compact?128:192);
 geometry.scale(1,1,.7);geometry.computeVertexNormals();
 // Subtle molded texture, small enough to stay jelly-smooth at normal viewing distance.
 const noiseSize=128,noiseData=new Uint8Array(noiseSize*noiseSize*4);
 for(let y=0;y<noiseSize;y++)for(let x=0;x<noiseSize;x++){
  const n=126+Math.round(8*Math.sin(x*.43)*Math.sin(y*.37)+4*Math.sin(x*.19+y*.51)),i=(y*noiseSize+x)*4;
  noiseData[i]=noiseData[i+1]=noiseData[i+2]=n;noiseData[i+3]=255;
 }
 const bump=new THREE.DataTexture(noiseData,noiseSize,noiseSize);bump.wrapS=bump.wrapT=THREE.RepeatWrapping;bump.needsUpdate=true;
 const material=new THREE.MeshPhysicalMaterial({color:0xe82c40,metalness:0,roughness:.16,ior:1.38,
  transmission:.57,thickness:1.15,attenuationColor:new THREE.Color(0xa41228),attenuationDistance:1.5,
  clearcoat:.72,clearcoatRoughness:.1,specularIntensity:1,bumpMap:bump,bumpScale:.006,envMapIntensity:1.15});
 const bubbleGeometry=new THREE.SphereGeometry(1,10,8),bubbleMaterial=new THREE.MeshBasicMaterial({color:0xffc9d0,transparent:true,opacity:.18,depthWrite:false});
 const pair=new THREE.Group();scene.add(pair);
 const bubbleData=gummyBubbles(compact?18:28),dummy=new THREE.Object3D();
 for(let i=0;i<2;i++){
  const gummy=new THREE.Group(),body=new THREE.Mesh(geometry,material);gummy.add(body);
  const bubbles=new THREE.InstancedMesh(bubbleGeometry,bubbleMaterial,bubbleData.length);
  bubbleData.forEach((b,j)=>{dummy.position.set(b.x,b.y,b.z);dummy.scale.setScalar(b.radius);dummy.updateMatrix();bubbles.setMatrixAt(j,dummy.matrix);});
  bubbles.instanceMatrix.needsUpdate=true;gummy.add(bubbles);
  gummy.position.set(i?1.15:-1.13,i?.17:-.12,i?-.25:.2);gummy.rotation.y=i?.6:-.16;
  pair.add(gummy);
 }
 let pose=nextGummyPose({},'reset'),shown={...pose},velocity={yaw:0,pitch:0},grab=null,visible=true,raf=0,last=0,disposed=false,ready=false;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const quiet=()=>reduced.matches||document.documentElement.classList.contains('motion-off');
 const stop=()=>{cancelAnimationFrame(raf);raf=0;last=0;};
 function size(){
  const {width,height}=host.getBoundingClientRect();if(!width||!height)return;
  const dpr=Math.min(devicePixelRatio||1,2.5,Math.sqrt(1.6e6/(width*height)));
  renderer.setPixelRatio(dpr);renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();requestDraw();
 }
 function draw(now){
  raf=0;if(disposed||!visible||document.hidden)return;
  const dt=last?Math.min(.04,(now-last)/1000):1/60;last=now;
  if(quiet()){velocity.yaw=velocity.pitch=0;shown={...pose};}
  else{
   if(!grab){pose.yaw+=velocity.yaw*dt;pose.pitch+=velocity.pitch*dt;const decay=Math.exp(-dt*7);velocity.yaw*=decay;velocity.pitch*=decay;}
   const blend=1-Math.exp(-dt*16);shown.yaw+=(pose.yaw-shown.yaw)*blend;shown.pitch+=(pose.pitch-shown.pitch)*blend;
  }
  pair.rotation.set(shown.pitch,shown.yaw,0,'YXZ');renderer.render(scene,camera);
  if(Math.abs(pose.yaw-shown.yaw)+Math.abs(pose.pitch-shown.pitch)+Math.abs(velocity.yaw)+Math.abs(velocity.pitch)>.002)requestDraw();
  else last=0;
 }
 function requestDraw(){if(ready&&!disposed&&visible&&!document.hidden&&!raf)raf=requestAnimationFrame(draw);}
 function apply(action){pose=nextGummyPose(pose,action);velocity.yaw=velocity.pitch=0;requestDraw();}
 const onDown=e=>{if(e.button)return;grab={id:e.pointerId,x:e.clientX,y:e.clientY,t:performance.now(),touch:e.pointerType==='touch'};velocity.yaw=velocity.pitch=0;host.setPointerCapture(e.pointerId);host.classList.add('is-grabbing');};
 const onMove=e=>{if(!grab||grab.id!==e.pointerId)return;const now=performance.now(),dt=Math.max(.012,(now-grab.t)/1000),scale=5/host.clientWidth;
  const yaw=(e.clientX-grab.x)*scale,pitch=(e.clientY-grab.y)*scale;
  pose.yaw+=yaw;pose.pitch+=grab.touch?0:pitch;shown={...pose};
  velocity.yaw=THREE.MathUtils.clamp(yaw/dt,-3,3);velocity.pitch=grab.touch?0:THREE.MathUtils.clamp(pitch/dt,-3,3);
  Object.assign(grab,{x:e.clientX,y:e.clientY,t:now});requestDraw();
 };
 const onUp=e=>{if(!grab||e.pointerId!==grab.id)return;if(performance.now()-grab.t>100||quiet()||e.type==='pointercancel')velocity.yaw=velocity.pitch=0;grab=null;host.classList.remove('is-grabbing');requestDraw();};
 const onKey=e=>{const action={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down',Home:'reset',r:'reset',R:'reset'}[e.key];if(action){e.preventDefault();apply(action);}};
 const onControl=e=>{const button=e.target.closest('[data-gummy-action]');if(button)apply(button.dataset.gummyAction);};
 const onVisibility=()=>{if(document.hidden)stop();else requestDraw();};
 const onBlur=()=>{velocity.yaw=velocity.pitch=0;grab=null;host.classList.remove('is-grabbing');};
 const resizeObserver=new ResizeObserver(size),intersection=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible)requestDraw();else stop();});
 function revealFallback(){ready=false;stop();host.classList.remove('is-ready');host.dataset.state='fallback';controls.hidden=help.hidden=true;fallback.removeAttribute('aria-hidden');host.removeAttribute('tabindex');}
 canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();revealFallback();});
 canvas.addEventListener('webglcontextrestored',()=>{if(disposed)return;ready=true;host.classList.add('is-ready');host.dataset.state='ready';controls.hidden=help.hidden=false;fallback.setAttribute('aria-hidden','true');host.tabIndex=0;requestDraw();});
 try{
  size();await renderer.compileAsync(scene,camera);if(shaderFailed)throw new Error('Gummy material could not compile.');
  pair.rotation.set(pose.pitch,pose.yaw,0,'YXZ');renderer.render(scene,camera);host.append(canvas);ready=true;
 }catch{renderer.dispose();environment.dispose();geometry.dispose();material.dispose();bump.dispose();bubbleGeometry.dispose();bubbleMaterial.dispose();return null;}
 if(ready){host.classList.add('is-ready');host.dataset.state='ready';host.tabIndex=0;fallback.setAttribute('aria-hidden','true');controls.hidden=help.hidden=false;}
 host.addEventListener('pointerdown',onDown);host.addEventListener('pointermove',onMove);host.addEventListener('pointerup',onUp);host.addEventListener('pointercancel',onUp);host.addEventListener('lostpointercapture',onUp);host.addEventListener('keydown',onKey);host.addEventListener('blur',onBlur);
 controls.addEventListener('click',onControl);document.addEventListener('visibilitychange',onVisibility);resizeObserver.observe(host);intersection.observe(host);
 const motionObserver=new MutationObserver(()=>{if(quiet()){velocity.yaw=velocity.pitch=0;}requestDraw();});motionObserver.observe(document.documentElement,{attributes:true,attributeFilter:['class']});
 reduced.addEventListener('change',requestDraw);
 return{rotate:apply,dispose(){disposed=true;stop();resizeObserver.disconnect();intersection.disconnect();motionObserver.disconnect();reduced.removeEventListener('change',requestDraw);document.removeEventListener('visibilitychange',onVisibility);
  host.removeEventListener('pointerdown',onDown);host.removeEventListener('pointermove',onMove);host.removeEventListener('pointerup',onUp);host.removeEventListener('pointercancel',onUp);host.removeEventListener('lostpointercapture',onUp);host.removeEventListener('keydown',onKey);host.removeEventListener('blur',onBlur);controls.removeEventListener('click',onControl);
  renderer.dispose();environment.dispose();geometry.dispose();material.dispose();bump.dispose();bubbleGeometry.dispose();bubbleMaterial.dispose();canvas.remove();revealFallback();
 }};
}

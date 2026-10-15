// Closed gummy volumes with the approved photographic appearance.
// Object-space projections preserve the approved photo; a horizontal cap prevents pinched pole highlights.
export async function createGummyViewer(host){
 const shapeUrl=new URL('./gummy-shape.js',import.meta.url);shapeUrl.search=new URL(import.meta.url).search;
 const [THREE,{gummyProfile,nextGummyPose,gummyBubbles}]=await Promise.all([
  import(new URL('./assets/vendor/three.module.js',import.meta.url).href),import(shapeUrl.href)
 ]);
 const caption=host.closest('figure').querySelector('figcaption'),fallback=host.querySelector('img');
 const canvas=document.createElement('canvas');canvas.setAttribute('aria-hidden','true');
 let renderer;
 try{renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power',stencil:false});}catch{return null;}
 renderer.setClearColor(0,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;
 let shaderFailed=false;renderer.debug.onShaderError=()=>{shaderFailed=true;};
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(22,1,.1,30);
 camera.position.set(0,.7,8.1);camera.lookAt(0,0,0);
 // Broad photographic softboxes, in linear HDR. Tiny round lights made the gel read as painted plastic.
 const sizeOfFace=128,environmentFaces=[];
 const lights=[{d:new THREE.Vector3(.9,1.3,1).normalize(),c:[1,.97,.95],power:16,w:.3,h:.5},
  {d:new THREE.Vector3(-.95,.25,.25).normalize(),c:[.76,.84,1],power:2.4,w:.12,h:.8},
  {d:new THREE.Vector3(.15,.8,-1).normalize(),c:[1,.8,.8],power:.7,w:.25,h:.25}];
 for(const light of lights){light.x=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),light.d).normalize();light.y=new THREE.Vector3().crossVectors(light.d,light.x).normalize();}
 const softEdge=(edge,value)=>THREE.MathUtils.smoothstep(value,edge,edge+.07);
 for(let face=0;face<6;face++){
  const pixels=new Uint16Array(sizeOfFace*sizeOfFace*4);
  for(let y=0;y<sizeOfFace;y++)for(let x=0;x<sizeOfFace;x++){
   const u=(x+.5)/sizeOfFace*2-1,v=(y+.5)/sizeOfFace*2-1;
   const d=new THREE.Vector3(...[[1,-v,-u],[-1,-v,u],[u,1,v],[u,-1,-v],[u,-v,1],[-u,-v,-1]][face]).normalize();
   const colour=[.10,.075,.085];
   for(const light of lights){const forward=d.dot(light.d);if(forward<=0)continue;
    const x=Math.abs(d.dot(light.x)/forward),y=Math.abs(d.dot(light.y)/forward);
    const strength=(1-softEdge(light.w,x))*(1-softEdge(light.h,y))*light.power;for(let k=0;k<3;k++)colour[k]+=light.c[k]*strength;}
   const offset=(y*sizeOfFace+x)*4;for(let k=0;k<3;k++)pixels[offset+k]=THREE.DataUtils.toHalfFloat(colour[k]);pixels[offset+3]=THREE.DataUtils.toHalfFloat(1);
  }
  const textureFace=new THREE.DataTexture(pixels,sizeOfFace,sizeOfFace,THREE.RGBAFormat,THREE.HalfFloatType);textureFace.needsUpdate=true;environmentFaces.push(textureFace);
 }
 const environment=new THREE.CubeTexture(environmentFaces);environment.type=THREE.HalfFloatType;environment.colorSpace=THREE.LinearSRGBColorSpace;environment.needsUpdate=true;scene.environment=environment;
 const key=new THREE.DirectionalLight(0xffe8df,.15);key.position.set(-3,4,6);scene.add(key);
 const fill=new THREE.DirectionalLight(0xffe6e6,2.6);fill.position.set(2,3,-4);scene.add(fill);
 scene.add(new THREE.HemisphereLight(0xffeeee,0x3a0712,.45));
 const geometry=new THREE.LatheGeometry(gummyProfile(88).map(([r,y])=>new THREE.Vector2(r,y-.585)),160);
 geometry.scale(1,1,.86);geometry.computeVertexNormals();
 let photograph;
 try{photograph=await new THREE.TextureLoader().loadAsync(fallback.currentSrc||fallback.src);}catch{renderer.dispose();environment.dispose();environmentFaces.forEach(t=>t.dispose());geometry.dispose();return null;}
 photograph.colorSpace=THREE.SRGBColorSpace;photograph.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
 const material=new THREE.MeshPhysicalMaterial({color:0xffffff,metalness:0,roughness:.17,ior:1.42,
  clearcoat:0,specularIntensity:1,envMapIntensity:1,toneMapped:false});
 material.onBeforeCompile=shader=>{
  shader.uniforms.gelPhotograph={value:photograph};
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\n varying vec3 gelPosition;varying vec3 gelNormal;varying vec3 gelView;').replace('#include <begin_vertex>','#include <begin_vertex>\n gelPosition=position;gelNormal=normal;gelView=transpose(mat3(modelMatrix))*(cameraPosition-(modelMatrix*vec4(position,1.)).xyz);');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
   varying vec3 gelPosition;varying vec3 gelNormal;varying vec3 gelView;uniform sampler2D gelPhotograph;
   vec4 gummyPhoto(float x,float depth){vec2 uv=vec2(clamp(x*.5+.5,.015,.985),clamp((gelPosition.y+.688-.12*abs(depth))/1.273,.015,.985));
    return texture2D(gelPhotograph,vec2(.045,.192)+uv*vec2(.528,.54));}`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`
   // Blend perpendicular object-space projections at the sides: no stretched seam or pole ribbon.
   vec2 gelWeights=pow(abs(gelNormal.xz),vec2(5.))+vec2(.00001);gelWeights/=gelWeights.x+gelWeights.y;
   vec4 gelPhoto=gummyPhoto(gelPosition.x,gelPosition.z)*gelWeights.y+gummyPhoto(gelPosition.z/.86,gelPosition.x*.86)*gelWeights.x;
   // The dome needs its own horizontal projection. An upright photo collapses at its pole,
   // repeating photographed softboxes around a bright central star.
   // Fade out shoulder softboxes as the camera rises, before they form a ring around the pole.
   float gelTopWeight=max(smoothstep(.30,.82,gelNormal.y),smoothstep(.38,.82,normalize(gelView).y));
   vec4 gelFloor=texture2D(gelPhotograph,vec2(.26,.24)+vec2(gelPosition.x*.5+.5,gelPosition.z/1.72+.5)*vec2(.18,.24));
   gelPhoto=mix(gelPhoto,gelFloor,gelTopWeight);
   // The flat underside cannot use an upright photo: that would stretch one scanline into bands.
   gelPhoto=mix(gelPhoto,gelFloor,smoothstep(.55,.92,-gelNormal.y));
   float gelFacing=abs(dot(normal,normalize(vViewPosition)));
   outgoingLight=mix(vec3(.38,.001,.005),gelPhoto.rgb,smoothstep(.05,.7,gelPhoto.a))*(.88+.12*gelFacing)+totalSpecular*(.03+.65*gelTopWeight);
   #include <opaque_fragment>`);
 };
 material.customProgramCacheKey=()=> 'moonvit-photographic-volume-v8-top';
 const bubbleGeometry=new THREE.SphereGeometry(1,10,8),bubbleMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,depthTest:false,
  vertexShader:`varying vec3 bNormal;varying vec3 bView;void main(){vec4 p=vec4(position,1.);
   #ifdef USE_INSTANCING
    p=instanceMatrix*p;
   #endif
   vec4 mv=modelViewMatrix*p;bNormal=normalize(normalMatrix*normal);bView=-mv.xyz;gl_Position=projectionMatrix*mv;}`,
  fragmentShader:`varying vec3 bNormal;varying vec3 bView;void main(){vec3 n=normalize(bNormal),v=normalize(bView);
   float rim=pow(1.-abs(dot(n,v)),2.4),shine=pow(max(0.,dot(reflect(-normalize(vec3(-.5,.8,1.)),n),v)),36.);
   float depth=clamp((length(bView)-7.)/2.4,0.,1.);vec3 tint=mix(vec3(1.,.75,.78),vec3(.65,.06,.11),depth);
   float shadow=pow(max(0.,dot(n,normalize(vec3(.5,-.8,-1.)))),5.);
   tint=mix(tint,vec3(.2,.002,.008),shadow*.8);
   gl_FragColor=vec4(tint,rim*mix(.32,.15,depth)+shine*.5+shadow*.1);}`});
 const bubbles=gummyBubbles(28),dummy=new THREE.Object3D();
 const pair=new THREE.Group();pair.name='gummy-pair';scene.add(pair);
 for(let i=0;i<2;i++){
  const gummy=new THREE.Group(),body=new THREE.Mesh(geometry,material);body.name='gummy-body';gummy.add(body);
  const air=new THREE.InstancedMesh(bubbleGeometry,bubbleMaterial,bubbles.length);air.name='gummy-air';
  bubbles.forEach((b,j)=>{dummy.position.set(b.x,b.y,b.z/.7*.86);dummy.scale.setScalar(b.radius);dummy.updateMatrix();air.setMatrixAt(j,dummy.matrix);});air.instanceMatrix.needsUpdate=true;gummy.add(air);
  gummy.position.set(i?1.08:-.98,i?.22:-.08,i?-.26:.16);gummy.scale.setScalar(i?.88:1.08);gummy.rotation.y=i?.12:-.06;pair.add(gummy);
 }
 let pose=nextGummyPose({},'reset'),shown={...pose},velocity={yaw:0,pitch:0},grab=null,visible=true,raf=0,last=0,disposed=false,ready=false;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),quiet=()=>reduced.matches||document.documentElement.classList.contains('motion-off');
 const stop=()=>{cancelAnimationFrame(raf);raf=0;last=0;};
 function size(){const {width,height}=host.getBoundingClientRect();if(!width||!height)return;
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,2.5,Math.sqrt(1.2e6/(width*height))));renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();requestDraw();
 }
 function draw(now){
  raf=0;if(disposed||!visible||document.hidden)return;
  const dt=last?Math.min(.04,(now-last)/1000):1/60;last=now;
  if(quiet()){velocity.yaw=velocity.pitch=0;shown={...pose};}
  else{if(!grab){pose.yaw+=velocity.yaw*dt;pose.pitch+=velocity.pitch*dt;const decay=Math.exp(-dt*7);velocity.yaw*=decay;velocity.pitch*=decay;}
   const blend=1-Math.exp(-dt*16);shown.yaw+=(pose.yaw-shown.yaw)*blend;shown.pitch+=(pose.pitch-shown.pitch)*blend;}
  pair.rotation.set(shown.pitch,shown.yaw,0,'YXZ');renderer.render(scene,camera);
  if(Math.abs(pose.yaw-shown.yaw)+Math.abs(pose.pitch-shown.pitch)+Math.abs(velocity.yaw)+Math.abs(velocity.pitch)>.002)requestDraw();else last=0;
 }
 function requestDraw(){if(ready&&!disposed&&visible&&!document.hidden&&!raf)raf=requestAnimationFrame(draw);}
 function apply(action){pose=nextGummyPose(pose,action);velocity.yaw=velocity.pitch=0;requestDraw();}
 const onDown=e=>{if(e.button)return;grab={id:e.pointerId,x:e.clientX,y:e.clientY,t:performance.now(),touch:e.pointerType==='touch'};velocity.yaw=velocity.pitch=0;try{host.setPointerCapture(e.pointerId);}catch{}host.classList.add('is-grabbing');host.focus({preventScroll:true});};
 const onMove=e=>{if(!grab||grab.id!==e.pointerId)return;const now=performance.now(),dt=Math.max(.012,(now-grab.t)/1000),scale=2*Math.PI/host.clientWidth;
  const yaw=(e.clientX-grab.x)*scale,pitch=(e.clientY-grab.y)*scale;pose.yaw+=yaw;pose.pitch+=grab.touch?0:pitch;shown={...pose};
  velocity.yaw=THREE.MathUtils.clamp(yaw/dt,-3,3);velocity.pitch=grab.touch?0:THREE.MathUtils.clamp(pitch/dt,-3,3);Object.assign(grab,{x:e.clientX,y:e.clientY,t:now});requestDraw();};
 const onUp=e=>{if(!grab||e.pointerId!==grab.id)return;if(performance.now()-grab.t>100||quiet()||e.type==='pointercancel')velocity.yaw=velocity.pitch=0;grab=null;host.classList.remove('is-grabbing');requestDraw();};
 const onKey=e=>{const action={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down',Home:'reset',r:'reset',R:'reset'}[e.key];if(action){e.preventDefault();apply(action);}};
 const onReset=()=>apply('reset');
 const onVisibility=()=>{if(document.hidden)stop();else requestDraw();},onBlur=()=>{velocity.yaw=velocity.pitch=0;grab=null;host.classList.remove('is-grabbing');};
 const resizeObserver=new ResizeObserver(size),intersection=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible)requestDraw();else stop();});
 function revealFallback(){ready=false;stop();host.classList.remove('is-ready');host.dataset.state='fallback';fallback.removeAttribute('aria-hidden');host.removeAttribute('tabindex');caption.textContent='Жевательные пастилки Moonvit';}
 function reveal(){ready=true;host.classList.add('is-ready');host.dataset.state='ready';host.tabIndex=0;fallback.setAttribute('aria-hidden','true');caption.textContent='Потяни, чтобы повернуть';}
 canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();revealFallback();});canvas.addEventListener('webglcontextrestored',()=>{if(!disposed){reveal();requestDraw();}});
 const disposeScene=()=>{renderer.dispose();environment.dispose();environmentFaces.forEach(t=>t.dispose());photograph.dispose();geometry.dispose();material.dispose();bubbleGeometry.dispose();bubbleMaterial.dispose();};
 try{size();await renderer.compileAsync(scene,camera);if(shaderFailed)throw new Error('Gummy photographic material failed to compile');pair.rotation.set(pose.pitch,pose.yaw,0,'YXZ');renderer.render(scene,camera);host.append(canvas);reveal();}
 catch{disposeScene();return null;}
 host.addEventListener('pointerdown',onDown);host.addEventListener('pointermove',onMove);host.addEventListener('pointerup',onUp);host.addEventListener('pointercancel',onUp);host.addEventListener('lostpointercapture',onUp);host.addEventListener('keydown',onKey);host.addEventListener('dblclick',onReset);host.addEventListener('blur',onBlur);
 document.addEventListener('visibilitychange',onVisibility);resizeObserver.observe(host);intersection.observe(host);
 const motionObserver=new MutationObserver(()=>{if(quiet())velocity.yaw=velocity.pitch=0;requestDraw();});motionObserver.observe(document.documentElement,{attributes:true,attributeFilter:['class']});reduced.addEventListener('change',requestDraw);
 return{rotate:apply,dispose(){disposed=true;stop();resizeObserver.disconnect();intersection.disconnect();motionObserver.disconnect();reduced.removeEventListener('change',requestDraw);document.removeEventListener('visibilitychange',onVisibility);
  host.removeEventListener('pointerdown',onDown);host.removeEventListener('pointermove',onMove);host.removeEventListener('pointerup',onUp);host.removeEventListener('pointercancel',onUp);host.removeEventListener('lostpointercapture',onUp);host.removeEventListener('keydown',onKey);host.removeEventListener('dblclick',onReset);host.removeEventListener('blur',onBlur);
  disposeScene();canvas.remove();revealFallback();}};
}

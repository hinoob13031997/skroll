// Home (content/gallery-home.mjs): the hero still greets by the time of day, the first scroll dives into the light of
// its star, and out of the flash comes a curved wall — the six world stills on the inside of a cylinder (WebGL2).
// Scroll / swipe / the rail turn the wall one world at a time (it settles on the nearest), the mouse tilts the camera,
// a click on the world in front opens it full screen; "← Все миры", Esc or Back fold it back into its panel.
// Without WebGL2, with reduced motion or motion switched off the worlds are stacked cards (CSS .gx:not(.is-live)).
(()=>{
const gx=document.querySelector('.gx');if(!gx)return;
const root=document.documentElement;
const still=()=>root.classList.contains('motion-off')||matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t)};
const list=gx.querySelector('.gx-list'),rail=gx.querySelector('.gx-rail'),stage=gx.querySelector('.gx-stage');
const layer=gx.querySelector('.sys-worlds'),layers=[...layer.querySelectorAll('.sys-world')];
document.body.append(layer); // above the header when a world is open

/* ── the time of day picks the greeting and the world the wall starts from ── */
const h=new Date().getHours();
const day=h>=22||h<5?['luna','Уже поздно.','Время замедлиться']:h<11?['saturn','Доброе утро.','Пусть энергии хватит на весь день']:h<17?['earth','Хорошего дня.','Найди минуту для себя']:['venus','Добрый вечер.','Время для себя'];
gx.querySelector('[data-greet]').textContent=day[1];
gx.querySelector('[data-greet-title]').innerHTML=`${day[2]}<em>.</em>`;
const order=[...list.children];const k=order.findIndex(li=>li.dataset.world===day[0]);
const items=[...order.slice(k),...order.slice(0,k)];items.forEach(li=>list.append(li));
const btns=[...rail.children];items.forEach(li=>rail.append(btns.find(b=>b.dataset.gxGo===li.dataset.world)));

/* ── WebGL2 ── */
const cv=document.createElement('canvas');cv.className='gx-gl';cv.setAttribute('aria-hidden','true');
const gl=cv.getContext('webgl2',{alpha:true,antialias:true,premultipliedAlpha:true});
if(!gl||still())return; // stacked cards
stage.insertBefore(cv,gx.querySelector('.gx-giant'));
gx.classList.add('is-live');

const VS=`#version 300 es
in vec2 aUV;uniform float uAng,uW,uR,uH,uCam,uYaw,uPitch;uniform vec2 uTan;out vec2 vUV;out float vA;
void main(){
 float a=uAng+(aUV.x-.5)*uW; // this vertex's angle on the cylinder; 0 = straight ahead
 vec3 p=vec3(uR*sin(a+uYaw),(.5-aUV.y)*uH+uPitch,-uR*cos(a+uYaw)-uCam);
 vUV=aUV;vA=a;
 gl_Position=vec4(p.x/uTan.x,p.y/uTan.y,-p.z*.02,-p.z); // plain perspective, depth kept inside the clip range
}`;
const FS=`#version 300 es
precision highp float;in vec2 vUV;in float vA;uniform sampler2D uT;uniform float uCrop,uVel,uTime,uFocus,uFade;uniform vec3 uTint;out vec4 o;
void main(){
 vec2 uv=vUV;
 uv.x=.5+(uv.x-.5)*uCrop;                              // cover-fit the 16:9 still into the panel
 uv=.5+(uv-.5)/(1.035+.015*sin(uTime*.21));            // slow breathing inside the frame
 uv+=vec2(sin(uTime*.13),cos(uTime*.11))*.006;
 float v=clamp(abs(uVel),0.,2.5);
 uv.x+=sin(uv.y*18.+uTime*3.)*.0035*v;                 // liquid ripple while the wall turns
 float s=.0045*v*sign(uVel);
 vec3 c=vec3(texture(uT,uv+vec2(s,0)).r,texture(uT,uv).g,texture(uT,uv-vec2(s,0)).b); // pearl split, only in motion
 c=mix(c,c*uTint*1.2+uTint*.04,.1*v);
 float side=smoothstep(1.05,.05,abs(vA));              // worlds turned away fall into shadow
 c*=mix(.22,1.,side)*mix(1.,uFocus,1.-side);
 float e=smoothstep(0.,.012,vUV.x)*smoothstep(1.,.988,vUV.x)*smoothstep(0.,.02,vUV.y)*smoothstep(1.,.98,vUV.y);
 o=vec4(c*e,e)*uFade;
}`;
const sh=(t,s)=>{const x=gl.createShader(t);gl.shaderSource(x,s);gl.compileShader(x);if(!gl.getShaderParameter(x,gl.COMPILE_STATUS))throw gl.getShaderInfoLog(x);return x};
const pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,VS));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,FS));gl.linkProgram(pr);gl.useProgram(pr);
const U={};['uAng','uW','uR','uH','uCam','uYaw','uPitch','uTan','uT','uCrop','uVel','uTime','uFocus','uFade','uTint'].forEach(n=>U[n]=gl.getUniformLocation(pr,n));
const SEG=48,verts=[];for(let i=0;i<=SEG;i++)verts.push(i/SEG,0,i/SEG,1);
gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer());gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(verts),gl.STATIC_DRAW);
const loc=gl.getAttribLocation(pr,'aUV');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
const aniso=gl.getExtension('EXT_texture_filter_anisotropic');
const hex=c=>[1,3,5].map(i=>parseInt(c.slice(i,i+2),16)/255);
const worlds=items.map((li,i)=>{
 const img=li.querySelector('.gx-card img'),t=gl.createTexture();
 gl.bindTexture(gl.TEXTURE_2D,t);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([8,9,12,255]));
 const w={li,id:li.dataset.world,t,tint:hex(li.style.getPropertyValue('--accent').trim()),i};
 const up=()=>{gl.bindTexture(gl.TEXTURE_2D,t);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  if(aniso)gl.texParameterf(gl.TEXTURE_2D,aniso.TEXTURE_MAX_ANISOTROPY_EXT,8)};
 img.loading='eager';if(img.complete&&img.naturalWidth)up();else img.addEventListener('load',up);
 return w;
});
const N=worlds.length;

/* ── layout: the front world fills ~60% of the screen, its neighbours peek in at the edges ── */
const HERO=1.1,STEP=.8,TAIL=.35; // in screen heights of scroll
let W=0,H=0,narrow=false,G={};
function resize(){
 W=stage.clientWidth;H=stage.clientHeight;narrow=W/H<.9;
 const dpr=Math.min(devicePixelRatio||1,2),cw=Math.round(W*dpr),ch=Math.round(H*dpr);
 if(cv.width!==cw||cv.height!==ch){cv.width=cw;cv.height=ch;gl.viewport(0,0,cw,ch)} // a phone toolbar sliding does not clear the canvas
 const R=3.2,cam=1.2,dist=R+cam,asp=W/H;
 const w=narrow?.52:.6,step=narrow?.64:.72,pa=narrow?.8:16/9; // angular width, spacing, panel aspect
 const hh=R*w/pa;
 const tanY=Math.max(R*w/(2*dist*asp*(narrow?.8:.6)),hh/(2*dist*(narrow?.56:.64)));
 G={R,cam,w,step,hh,tanX:tanY*asp,tanY,crop:pa/(16/9)};
 gx.style.height=`${(HERO+(N-1)*STEP+TAIL)*100+100}svh`;
}
resize();addEventListener('resize',resize);

/* ── state ── */
let rot=0,vel=0,mx=0,my=0,tx=0,ty=0,last=performance.now(),t0=last,front=-1,hit=null,open=null,visible=true;
const giant=gx.querySelector('.gx-giant'),hero=gx.querySelector('.gx-hero'),heroImg=gx.querySelector('.gx-hero-img'),flash=gx.querySelector('.gx-flash');
const screens=()=>-gx.getBoundingClientRect().top/H;
// style writes only when a value really changes: a custom property set on the wall restyles everything inside it
const seen=new WeakMap(),put=(el,k,v)=>{let m=seen.get(el);if(!m)seen.set(el,m={});if(m[k]===v)return;m[k]=v;k.startsWith('--')?el.style.setProperty(k,v):el.style[k]=v};
function project(x,y,z){return[(x/G.tanX/-z*.5+.5)*W,(.5-y/G.tanY/-z*.5)*H]}
function frame(now){
 const dt=Math.min(.05,(now-last)/1000);last=now;const t=(now-t0)/1000;
 const s=screens(),sh=s/HERO;
 // hero: dive into the star, flash, the wall appears
 const dive=smooth(0,.8,sh); // the flash peaks at .76 of the dive and is gone when the first world stands still
 const gone=sh>=.8; // after the flash the hero is not drawn at all (a 3× still is a heavy layer)
 put(hero,'visibility',gone?'hidden':'');
 if(!gone)put(heroImg,'transform',dive>0?`scale(${(1+dive*dive*2.2).toFixed(4)})`:''); // untouched at rest: the still stays on its sharp, unscaled layer
 put(hero,'opacity',(1-smooth(.7,.8,sh)).toFixed(3));
 put(hero,'--hello',(1-smooth(.04,.32,sh)).toFixed(3));
 put(flash,'opacity',(smooth(.45,.76,sh)*(1-smooth(.78,1,sh))*.94).toFixed(3));
 const fade=smooth(.74,1,sh);
 put(gx,'--wall',fade.toFixed(3));
 // the wall: scroll position → world index (float), eased
 const target=clamp((s-HERO)/STEP,0,N-1);
 const prev=rot;rot+=(target-rot)*Math.min(1,dt*7);vel+=((rot-prev)/Math.max(dt,.001)-vel)*Math.min(1,dt*10);
 tx+=(mx-tx)*Math.min(1,dt*3);ty+=(my-ty)*Math.min(1,dt*3);
 gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
 gl.uniform1f(U.uR,G.R);gl.uniform1f(U.uW,G.w);gl.uniform1f(U.uH,G.hh);gl.uniform1f(U.uCam,G.cam);
 gl.uniform2f(U.uTan,G.tanX,G.tanY);gl.uniform1f(U.uCrop,G.crop);gl.uniform1f(U.uTime,t);gl.uniform1f(U.uFade,fade);
 gl.uniform1f(U.uYaw,tx*.035+Math.sin(t*.23)*.006);gl.uniform1f(U.uPitch,-ty*.05+Math.sin(t*.31)*.01);
 gl.uniform1f(U.uVel,vel*1.4);gl.uniform1f(U.uFocus,.9);
 // far ones first
 const order=worlds.map(w=>({w,a:(w.i-rot)*G.step})).sort((a,b)=>Math.abs(b.a)-Math.abs(a.a));
 for(const {w,a} of order){
  if(Math.abs(a)>1.9)continue;
  gl.uniform1f(U.uAng,a);gl.uniform3fv(U.uTint,w.tint);
  gl.bindTexture(gl.TEXTURE_2D,w.t);gl.drawArrays(gl.TRIANGLE_STRIP,0,(SEG+1)*2);
 }
 // the world in front: its words, the giant name, the rail, the clickable area
 const f=Math.round(rot);
 if(f!==front){front=f;items.forEach((li,i)=>li.classList.toggle('is-front',i===f));btns.forEach(b=>b.classList.toggle('is-on',b.dataset.gxGo===worlds[f].id));
  giant.textContent=worlds[f].li.querySelector('.gx-name').textContent;gx.style.setProperty('--on',worlds[f].li.style.getPropertyValue('--accent'));}
 put(gx,'--turn',clamp(1-Math.abs(rot-f)*3).toFixed(3)); // words fade while the wall is between worlds
 const a0=(f-rot)*G.step-G.w/2+tx*.035,a1=a0+G.w,z0=-G.R*Math.cos(a0)-G.cam,z1=-G.R*Math.cos(a1)-G.cam;
 const p0=project(G.R*Math.sin(a0),G.hh/2,z0),p1=project(G.R*Math.sin(a1),-G.hh/2,z1);
 hit=fade>.9?{x0:p0[0],y0:p0[1],x1:p1[0],y1:p1[1],id:worlds[f].id}:null;
 if(visible)requestAnimationFrame(frame);
}
new IntersectionObserver(([e])=>{const was=visible;visible=e.isIntersecting;if(visible&&!was){last=performance.now();requestAnimationFrame(frame)}}).observe(gx);
requestAnimationFrame(frame);
gx.drawFrame=frame; // lets a test harness step the scene when the tab is not being painted

/* ── settle on the nearest world when the scroll stops ── */
const topOf=()=>gx.getBoundingClientRect().top+scrollY;
const posOf=i=>topOf()+(HERO+i*STEP)*H;
let idle;
addEventListener('scroll',()=>{
 clearTimeout(idle);
 idle=setTimeout(()=>{
  if(open)return;const s=screens(),x=(s-HERO)/STEP;
  if(x<-.3||x>N-1+.2)return; // still in the dive, or already below the wall
  const i=clamp(Math.round(x),0,N-1),y=posOf(i);
  if(Math.abs(scrollY-y)>2)scrollTo({top:y,behavior:'smooth'});
 },170);
},{passive:true});
btns.forEach(b=>b.addEventListener('click',()=>{const i=worlds.findIndex(w=>w.id===b.dataset.gxGo);scrollTo({top:posOf(i),behavior:'smooth'})}));

/* ── mouse: the camera leans a little; the world in front is a button ── */
const inHit=(x,y)=>hit&&x>=hit.x0&&x<=hit.x1&&y>=hit.y0&&y<=hit.y1;
stage.addEventListener('pointermove',e=>{
 const r=stage.getBoundingClientRect();mx=(e.clientX-r.left)/W*2-1;my=(e.clientY-r.top)/H*2-1;
 stage.classList.toggle('is-pointing',inHit(e.clientX-r.left,e.clientY-r.top));
});
stage.addEventListener('pointerleave',()=>{mx=my=0;stage.classList.remove('is-pointing')});
stage.addEventListener('click',e=>{
 if(e.target.closest('a,button'))return;
 const r=stage.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;
 if(inHit(x,y))fly(hit.id);
});
list.addEventListener('click',e=>{const a=e.target.closest('[data-world]');if(!a||!a.matches('a'))return;e.preventDefault();fly(a.dataset.world)});

/* ── a world full screen: it grows out of its panel and folds back into it ── */
const rectOf=id=>{
 const r=stage.getBoundingClientRect();
 if(hit&&hit.id===id)return{t:r.top+hit.y0,l:r.left+hit.x0,b:innerHeight-(r.top+hit.y1),r:innerWidth-(r.left+hit.x1)};
 return{t:innerHeight*.3,l:innerWidth*.3,b:innerHeight*.3,r:innerWidth*.3};
};
const inset=c=>`inset(${c.t}px ${c.r}px ${c.b}px ${c.l}px round 2px)`;
function show(id,{from,instant}={}){
 const w=layers.find(x=>x.dataset.world===id);if(!w)return;
 const prev=open&&layers.find(x=>x.dataset.world===open);
 layer.hidden=false;root.classList.add('sys-locked');
 w.hidden=false;w.classList.remove('is-open');w.style.zIndex='2';
 if(prev&&prev!==w)prev.style.zIndex='1';
 w.style.transition='none';
 w.style.clipPath=instant?'none':from?inset(from):'inset(50% 50% 50% 50%)';
 w.offsetWidth;
 w.style.transition='';
 if(!instant)w.style.clipPath='inset(0px 0px 0px 0px round 0px)';
 requestAnimationFrame(()=>w.classList.add('is-open'));
 open=id;
 if(prev&&prev!==w)setTimeout(()=>{if(open!==prev.dataset.world){prev.hidden=true;prev.classList.remove('is-open')}},1300);
 setTimeout(()=>w.querySelector('.sw-close').focus({preventScroll:true}),instant?0:700);
}
function fly(id){show(id,{from:rectOf(id)});history.pushState({gx:id},'','#'+id)}
function hide(){
 if(!open)return;
 const id=open,w=layers.find(x=>x.dataset.world===id);
 open=null;
 const i=worlds.findIndex(x=>x.id===id);
 scrollTo({top:posOf(i),behavior:'instant'});rot=i; // the wall is turned to this world underneath
 requestAnimationFrame(()=>requestAnimationFrame(()=>{
  w.classList.remove('is-open');w.style.clipPath=inset(rectOf(id));
  setTimeout(()=>{w.hidden=true;layer.hidden=true;root.classList.remove('sys-locked');w.style.clipPath=''},1000);
 }));
}
const close=()=>{if(history.state&&history.state.gx)history.back();else{hide();history.replaceState(null,'',location.pathname)}};
layer.addEventListener('click',e=>{
 if(e.target.closest('[data-sys-close]'))close();
 const go=e.target.closest('[data-sys-go]');
 if(go){const id=go.dataset.sysGo;show(id);history.replaceState({gx:id},'','#'+id)}
});
addEventListener('keydown',e=>{if(e.key==='Escape'&&open)close()});
addEventListener('popstate',()=>{const id=location.hash.slice(1);if(worlds.some(w=>w.id===id))show(id,{from:rectOf(id)});else hide()});
const start=location.hash.slice(1);
if(worlds.some(w=>w.id===start)){history.replaceState({gx:start},'');show(start,{instant:true})}
})();

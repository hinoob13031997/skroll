// Moonvit home — scroll film (markup: content/cinema-home.mjs, styles: "Voyage" block in styles.css).
// Frames: dist/assets/film/*.webp, from the 3840×2160 masters in the project root (01_hero … 08_final_reveal).
// The stage is sticky; scroll position p runs 0..N-1 over the scenes. Each scene rests for HOLD of its segment,
// then the camera flies into the world's planet/star and the next world opens from that point.
// WebGL2 makes every frame living footage: camera drift/roll/parallax, water, rings, planets, fog, haze, waterfall,
// a pulsing star, twinkling stars and light sweeping over the jar; a 2D layer adds speed streaks during flights and
// each world's particles. Without WebGL2 the frames move with CSS (mask + scale).
// Without JS / with reduced motion / with motion off the scenes stay stacked full-screen sections.
(()=>{
const vg=document.querySelector('.voyage');if(!vg)return;
let off=matchMedia('(prefers-reduced-motion: reduce)').matches;
try{if(localStorage.getItem('moonvit-motion')==='off')off=true}catch{}
document.querySelector('#motion-toggle')?.addEventListener('click',()=>setTimeout(()=>location.reload(),50));
if(off)return;

const stage=vg.querySelector('.vg-stage');
const scenes=[...vg.querySelectorAll('.vg-scene')].map(el=>({el,id:el.dataset.scene,img:el.querySelector('.vg-img'),copy:el.querySelector('.vg-copy')}));
const N=scenes.length,HOLD=.34,SEG=115; // SEG: svh of scroll per scene (worlds and the space between them)
// a frame on the way belongs to the world it leads to
const worldOf=id=>({'cruise-a':'luna','cruise-b':'final'})[id]||id.replace(/^(path|pass)-/,'');
// transitions (shader uKind): 0 into open space (dark + star streaks), 1 mist, 2 golden ring, 3 pearl glare,
// 4 red dust, 5 water surface, 6 the star's light (the opening shot), 7 space to space (the camera keeps travelling)
const ARRIVE={luna:[1,[.72,.8,.95]],saturn:[2,[1,.76,.42]],venus:[3,[1,.78,.84]],mars:[4,[.8,.3,.16]],earth:[1,[.82,.93,.84]],neptune:[5,[.35,.62,1]]};
function transition(A,B){
 if(!B)return{kind:0,tone:[0,0,0]};
 if(A.id==='hero')return{kind:6,tone:[.8,.86,1]};
 if(A.life.path&&(B.life.path||B.id==='final'))return{kind:7,tone:B.life.tint.map(v=>v/255)};
 if(B.life.path||B.id==='final')return{kind:0,tone:[0,0,0]};
 const[kind,tone]=ARRIVE[B.id]||[6,[1,1,1]];return{kind,tone};
}
const rail=vg.querySelector('.vg-rail'),railLinks=[...rail.querySelectorAll('[data-vg-go]')],bar=rail.querySelector('.vg-progress b'),hint=vg.querySelector('.vg-hint');
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const sstep=(a,b,v)=>{const t=clamp((v-a)/(b-a));return t*t*(3-2*t)};
const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;

// Living parameters of every frame (image uv, y down; radii in frame heights):
// planet [cx,cy,r,rock], sun [x,y,power], water [horizon,amp], swirl [cx,cy,radius,amp], fog [y0,y1,density,haze],
// fall [x0,x1,y0,y1] waterfall, jar [x0,x1,y0,y1] light sweep, fogc mist colour, tint light of the world,
// pan: on wide screens the frame is shifted right by this share of the width (the jar stands centred in the
// masters, the copy needs the left third) and zoomed to z so no edge shows. dive: the planet / star the camera flies
// into when it leaves the world — the next world opens from the same point, the jar itself is never flown through.
const LIFE={
 hero:   {planet:[.5,1.05,1,.03],  sun:[.83,.16,1],  water:[.76,.8], swirl:null,            fog:[.55,.78,.2,0],  fall:null,              jar:null,              fogc:[.55,.62,.75], tint:[200,215,240],pan:.05,z:1.12,dive:[.83,.17]},
 luna:   {planet:[.722,.374,.373,0], sun:[.68,.1,.3],  water:[.7,1],   swirl:null,            fog:[.45,.72,.35,0], fall:null,              jar:[.36,.64,.08,.72], fogc:[.62,.7,.82],  tint:[205,220,245],pan:.1,z:1.22,dive:[.86,.3]},
 saturn: {planet:[.753,.459,.484,0], sun:[.97,.3,.6],  water:null,     swirl:[.62,.62,1.3,1.2],fog:[.6,.95,.12,0],  fall:null,              jar:[.36,.66,.08,.76], fogc:[.9,.62,.3],   tint:[255,205,140],pan:.1,z:1.22,dive:[.8,.3]},
 venus:  {planet:[.689,.479,.505,0],sun:[.97,.08,.6], water:[.8,1.4], swirl:[.12,.45,.6,1],  fog:[.5,.8,.15,0],   fall:null,              jar:[.35,.64,.19,.9],  fogc:[.95,.75,.72], tint:[255,215,210],pan:.1,z:1.22,dive:[.78,.24]},
 mars:   {planet:[.569,.668,.706,0],  sun:[.95,.35,.4], water:null,     swirl:null,            fog:[.45,.85,.3,1.2],fall:null,              jar:[.34,.61,.17,.9],  fogc:[.8,.3,.15],   tint:[240,125,85], pan:.1,z:1.22,dive:[.8,.26]},
 earth:  {planet:null,             sun:[.95,.05,.8], water:[.82,.9], swirl:null,            fog:[.1,.6,.5,0],    fall:[.78,.92,.05,.55], jar:[.3,.61,.17,.82],  fogc:[.85,.92,.85], tint:[215,240,210],pan:.12,z:1.26,dive:[.85,.22]},
 neptune:{planet:[.697,.419,.472,0],sun:[.9,.05,.4],  water:[.62,1.3],swirl:[.15,.55,.6,1],  fog:[.5,.75,.15,0],  fall:null,              jar:[.35,.63,.18,.9],  fogc:[.4,.6,.95],   tint:[150,200,255],pan:.1,z:1.22,dive:[.63,.14]},
 ...space(),
 final:  {planet:[.5,1.9,1.4,.03], sun:[.56,.51,1],  water:null,     swirl:null,            fog:[0,0,0,0],       fall:null,              jar:null,              fogc:[.5,.6,.8],    tint:[220,228,255],pan:0,  z:1.1, dive:[.56,.51]}
};
// Rest on the complete composition, not a permanently enlarged close-up. Flights keep their own camera.
for(const [id,life] of Object.entries(LIFE))if(!life.path){life.pan*=.32;life.z=id==='hero'?1.015:id==='final'?1.03:.94;}
// Frames between the worlds (сайт2/assets/plates): cruise_* open space, pass_* the planet just left slides past while
// the next one is ahead, path_* the approach. In space the camera never dives into a point: it travels (move) —
// from centre a to centre b, zoom z[0]→z[1] (reached at 80% of the frame's time on screen, then it keeps going),
// banking roll[0]→roll[1], and side: sideways parallax, so near asteroids stream past while planets hang far away.
// ahead: the pass frame's first planet is the next one — the path frame takes it over at the same place and size on
// screen (matched cut), then settles on its own route. The camera may look a little past the plate (mirrored sky, see edge()), and the
// feeling of going round the planets comes from the depth parallax, the banking and the globes turning (ORBS orbit).
function space(){
 const S=(planet,fogc,tint,move,dive)=>({planet,sun:null,water:null,swirl:null,fog:[0,0,0,0],fall:null,jar:null,fogc,tint,pan:0,z:1.08,dive:dive||move.b,path:1,move});
 const LU=[[.6,.7,.85],[205,220,245]],SA=[[.9,.62,.3],[255,205,140]],VE=[[.95,.75,.72],[255,215,210]],MA=[[.8,.3,.15],[240,125,85]],
  EA=[[.85,.92,.85],[215,240,210]],NE=[[.4,.6,.95],[150,200,255]];
 return{
  'cruise-a':    S(null,...LU,{a:[.45,.54],b:[.56,.45],z:[1.04,1.3],roll:[-.03,.02],side:.05}),
  'path-luna':   S([.554,.479,.382,0],...LU,{a:[.52,.5],b:[.554,.479],z:[1.02,1.3],roll:[.02,0],side:.04},[.548,.47]),
  'pass-saturn': S([.581,.471,.39,0],...SA,{a:[.45,.48],b:[.6,.5],z:[1.1,1.25],roll:[0,-.05],side:.05}),
  'path-saturn': S([.55,.469,.345,0],...SA,{a:[.45,.5],b:[.55,.469],z:[1.02,1.3],roll:[-.03,0],side:.04},[.55,.455]),
  'pass-venus':  S([.725,.432,.341,0],...VE,{a:[.45,.55],b:[.62,.45],z:[1.08,1.2],roll:[.08,0],side:.05,ahead:1}),
  'path-venus':  S([.553,.465,.388,0],...VE,{a:[.553,.465],b:[.553,.465],z:[1,1.37],roll:[0,0],side:.04},[.565,.47]),
  'pass-mars':   S([.586,.476,.392,0],...MA,{a:[.42,.4],b:[.58,.47],z:[1.08,1.2],roll:[-.04,0],side:.05,ahead:1}),
  'path-mars':   S([.624,.465,.421,0],...MA,{a:[.624,.465],b:[.624,.465],z:[1.06,1.45],roll:[0,0],side:.04},[.615,.48]),
  'pass-earth':  S([.602,.47,.388,0],...EA,{a:[.42,.4],b:[.6,.47],z:[1.08,1.2],roll:[.04,0],side:.05,ahead:1}),
  'path-earth':  S([.618,.491,.44,0],...EA,{a:[.618,.491],b:[.618,.491],z:[1,1.38],roll:[0,0],side:.04},[.62,.465]),
  'pass-neptune':S([.59,.476,.389,0],...NE,{a:[.42,.42],b:[.59,.47],z:[1.08,1.2],roll:[-.03,0],side:.05,ahead:1}),
  'path-neptune':S([.625,.465,.428,0],...NE,{a:[.625,.465],b:[.625,.465],z:[1.04,1.42],roll:[0,0],side:.04},[.617,.47]),
  'cruise-b':    S(null,[.5,.6,.8],[220,228,255],{a:[.45,.56],b:[.55,.46],z:[1.04,1.3],roll:[.02,-.02],side:.05})
 };
}
// Planets that really turn (discs measured with tools/limbs.py; c uv, r in frame heights). kind 1: a real surface map
// (dist/assets/space: 0 moon, 1 mars, 2 earth + clouds) turns under the frame's own light; kind 2: the frame's own
// clouds/bands flow along their latitudes (gas giants, Venus). rate rad/s, amp rad per flow cycle, band: shear between
// latitudes, cut [x0,y0,slope]: only above this line (Saturn's rings, water, mountains in front of the disc stay put).
// Drag a planet to spin it; it keeps turning with inertia.
const ORBS={
 luna:[{c:[.722,.374],r:.373,kind:1,map:0,rate:.03,cut:[.7,.54,0]}],
 saturn:[{c:[.753,.459],r:.484,kind:2,rate:.015,amp:.07,band:1,cut:[.64,.343,.289]}],
 venus:[{c:[.689,.479],r:.505,kind:2,rate:.018,amp:.08,band:.6,cut:[.7,.6,0]},{c:[.205,.132],r:.072,kind:2,rate:.05,amp:.2,band:.2}],
 mars:[{c:[.569,.668],r:.706,kind:1,map:1,rate:.018,cut:[.6,.5,-.15]}],
 neptune:[{c:[.697,.419],r:.472,kind:2,rate:.018,amp:.08,band:1,cut:[.7,.45,0]},{c:[.938,.378],r:.107,kind:2,rate:.05,amp:.2,band:.2,cut:[.9,.47,0]}],
 'path-luna':[{c:[.554,.479],r:.382,kind:1,map:0,rate:.05}],
 'path-saturn':[{c:[.55,.469],r:.345,kind:2,rate:.02,amp:.07,band:1,cut:[.356,.498,.32]}],
 'path-venus':[{c:[.553,.465],r:.388,kind:2,rate:.022,amp:.08,band:.6}],
 'path-mars':[{c:[.624,.465],r:.421,kind:1,map:1,rate:.05}],
 'path-earth':[{c:[.618,.491],r:.44,kind:1,map:2,rate:.05,ang0:-.7}],
 'path-neptune':[{c:[.625,.465],r:.428,kind:2,rate:.022,amp:.08,band:1}],
 // passing: orbit = how far a planet turns while the camera flies by it (rad over the frame), so the planet left
 // behind shows its other side as you go round it; link: the path frame continues the same globe (same map, same turn)
 'pass-saturn':[{c:[.581,.471],r:.39,kind:1,map:0,rate:.03,orbit:1.4},{c:[.157,.325],r:.16,kind:2,rate:.03,amp:.1,band:.6,orbit:.3}],
 'pass-venus':[{c:[.725,.432],r:.341,kind:2,rate:.022,amp:.08,band:.6,orbit:.5}],
 'pass-mars':[{c:[.586,.476],r:.392,kind:1,map:1,rate:.05,orbit:.6},{c:[.194,.195],r:.142,kind:1,map:0,rate:.04,orbit:1.3,ang0:2}],
 'pass-earth':[{c:[.602,.47],r:.388,kind:1,map:2,rate:.05,orbit:.6,ang0:-1.2},{c:[.147,.251],r:.123,kind:1,map:1,rate:.05,orbit:1.3,ang0:2.5}],
 'pass-neptune':[{c:[.59,.476],r:.389,kind:2,rate:.022,amp:.08,band:1,orbit:.5},{c:[.133,.352],r:.123,kind:1,map:2,rate:.05,orbit:1.3,ang0:1}]
};
const LINK={'path-mars':'pass-mars','path-earth':'pass-earth'}; // same real globe on both frames: the cut is invisible
// The jar as a cylinder: body edges x0,x1, the seam under the lid y0 and the bottom y1 (uv). Dragging it turns the
// label around its axis — the silhouette of a turning cylinder never changes, so only the label slides, the rim light
// stays — and a spring brings it back to face the viewer.
const CAN={luna:[.359,.641,.258,.738],saturn:[.361,.640,.253,.731],venus:[.3515,.65,.271,.773],mars:[.3425,.658,.271,.782],
 earth:[.304,.5785,.284,.733],neptune:[.349,.65,.276,.787]};

vg.classList.add('is-live');
vg.style.height=`${(N-1)*SEG+170}svh`; // +70: the final frame rests before the page moves on (REST below)

// the stage is 100svh: its size, not innerHeight (which jumps with a phone's toolbar), sets the picture's geometry
let W=stage.clientWidth||innerWidth,H=stage.clientHeight||innerHeight,quality=1;
const wide=()=>W/H>1.15;
// Fit the whole composition: tall panes keep its width, wide screens keep its height.
// CPU hit testing and the shader share this framing; extra space fades into the dark stage.
function frameSpan(aspect){const a=16/9;return[Math.max(1,aspect/a),Math.max(1,a/aspect)];}
const focusOf=s=>{const cs=getComputedStyle(s.el);return[parseFloat(cs.getPropertyValue('--fx'))/100,parseFloat(cs.getPropertyValue('--fy'))/100]};
scenes.forEach(s=>{s.f=focusOf(s);s.life=LIFE[s.id]||LIFE.hero;s.g=0;
 s.orbs=(ORBS[s.id]||[]).map(o=>({...o,ang:o.ang0||0,vel:0,s}));s.can=CAN[s.id]||null;s.spin=0;s.spinV=0});
scenes.forEach(s=>{const from=scenes.find(x=>x.id===LINK[s.id]);if(from&&s.orbs[0])s.orbs[0].link=from.orbs[0]});
// how far a globe has turned: its own spin + the part of the fly-by already flown (+ the globe it continues)
const turn=o=>o.link?turn(o.link):o.ang+(o.orbit||0)*o.s.g;
const BAR=[scenes.findIndex(s=>s.id==='cruise-a'),scenes.findIndex(s=>s.id==='neptune')];
// where the jar/focus lands on screen (the next world opens from there)
const onScreen=(s,pt=s.f)=>wide()?[pt[0]+s.life.pan,pt[1]]:pt;
function reach(s){const[fx,fy]=onScreen(s);s.max=Math.hypot(Math.max(fx,1-fx)*W,Math.max(fy,1-fy)*H)+120}
// how far scene i has opened at position p (hero is always open)
const opened=(i,p)=>i===0?1:.5-.5*Math.cos(Math.PI*clamp((p-(i-1+HOLD))/(1-HOLD))); // gentle, even flight speed

/* ───────────── WebGL renderer ───────────── */
const VS=`#version 300 es
in vec2 aP;out vec2 vUv;void main(){vUv=vec2(aP.x*.5+.5,.5-aP.y*.5);gl_Position=vec4(aP,0.,1.);}`;
const FS=`#version 300 es
precision highp float;
in vec2 vUv;out vec4 o;
uniform sampler2D uA,uB,uDA,uDB; // frames + their depth maps (white = near)
uniform sampler2D uM0,uM1,uM2,uM3; // planet maps: moon, mars, earth, earth clouds
uniform vec4 uO[12];            // turning planets: 2 per scene, 3 vec4 each (ORBS)
uniform vec4 uCan[2];uniform vec2 uSpin; // jar cylinder per scene and how far it is turned
uniform vec4 uS[16];            // 8 vec4 per scene: A at 0, B at 8
uniform vec4 uJar[2];
uniform vec4 uC3[2];            // 3D camera per scene: lateral offset xy, dolly strength z, pivot depth w
uniform vec3 uFogC[2],uTint[2];
uniform float uT,uTime,uImgA,uAspect,uMaxR,uFlash,uHasB;
uniform int uKind;uniform vec3 uTone; // transition type and colour
uniform vec2 uCam,uRes,uOpen;
float ss(float a,float b,float x){float t=clamp((x-a)/(b-a),0.,1.);return t*t*(3.-2.*t);}
float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*noise(p);p=p*2.03+vec2(17.1,9.2);a*=.5;}return v;}
const vec2 K=vec2(1.7778,1.);
vec2 cover(vec2 s,vec2 f){
 vec2 v=vec2(max(1.,uAspect/uImgA),max(1.,uImgA/uAspect));
 return f*(1.-v)+s*v;
}
// camera: pan, zoom + roll around the focus, parallax (lower = nearer), idle drift
vec2 camera(int b,vec2 s){
 vec4 P=uS[b];vec2 f=P.xy,pan=uS[b+7].yw;vec2 q=cover(s-pan,f);
 vec2 d=(q-f)*K;float a=P.w;d=mat2(cos(a),sin(a),-sin(a),cos(a))*d;d/=P.z;
 q=f+d/K;
 return q+uCam*(.35+ss(.2,1.,q.y)*1.3);
}
float gJarShade=1.; // set by living(): the turned-away side of the jar falls into shadow
// 0 on the jar (body, lid and a little air around it), 1 elsewhere: effects of the world never touch the product
float offJar(int k,vec2 q){vec4 G=uCan[k];if(G.y<=G.x)return 1.;
 return 1.-ss(G.x-.03,G.x,q.x)*ss(G.y+.03,G.y,q.x)*ss(G.z-.13,G.z-.09,q.y)*ss(G.w+.04,G.w,q.y);}
vec2 living(int b,int k,vec2 q,float dep){
 float t=uTime;vec4 PL=uS[b+1],SW=uS[b+2],WA=uS[b+3],FO=uS[b+4],FA=uS[b+5],G=uCan[k];
 if(G.y>G.x){ // the jar turns on its axis: the label slides around the cylinder, edges and lid rim stay
  float cx=.5*(G.x+G.y),hw=.5*(G.y-G.x),u=(q.x-cx)/hw,au=abs(u);
  if(au<1.){float bot=G.w-.022*(1.-sqrt(1.-u*u));
   float m=ss(.97,.8,au)*ss(G.z-.012,G.z+.012,q.y)*ss(bot,bot-.03,q.y);
   // past ~63° the frame holds no more of the label: that strip is compressed and turned into the shadow side
   float th=asin(u)-(k==0?uSpin.x:uSpin.y),ov=max(0.,abs(th)-1.1);
   th=sign(th)*min(abs(th),1.1+ov*.3);
   q.x=mix(q.x,cx+sin(th)*hw,m);gJarShade=1.-ss(0.,.4,ov)*.8*m;}}
 // the jar and near rocks are solid: liquid ribbons and heat haze only move the far world
 float far=ss(.5,.3,dep)*offJar(k,q);
 if(SW.w>0.){ // rings / liquid ribbons flow along their orbits
  vec2 d=(q-SW.xy)*K;float r=length(d);vec2 tg=vec2(-d.y,d.x)/(r+1e-4);
  float ph=noise(vec2(r*9.-t*.3,atan(d.y,d.x)*2.))*6.283;
  q+=tg/K*(sin(r*55.-t*1.3+ph)*.0035+.0025*sin(t*.23+r*3.))*SW.w*ss(SW.z,SW.z*.15,r)*far;}
 if(PL.w>0.){ // planet slowly turns on its axis
  vec2 d=(q-PL.xy)*K/PL.z;float rr=dot(d,d);
  if(rr<1.){float z=sqrt(1.-rr),a=sin(t*.09)*PL.w;q=mix(q,PL.xy+vec2(cos(a)*d.x+sin(a)*z,d.y)*PL.z/K,ss(1.,.86,rr));}}
 // Water keeps the photographed surface. The old high-frequency displacement also crossed the jar's label.
 if(FO.w>0.){ // heat haze
  float band=ss(FO.x-.15,FO.x,q.y)*ss(FO.y+.25,FO.y,q.y);
  q+=vec2(noise(q*vec2(40,70)+vec2(0,-t*.9))-.5,noise(q*vec2(45,60)+vec2(5,-t*.7))-.5)*.0035*FO.w*band*far;}
 if(FA.x<FA.y){ // waterfall
  float m=ss(FA.x,FA.x+.03,q.x)*ss(FA.y,FA.y-.03,q.x)*ss(FA.z,FA.z+.03,q.y)*ss(FA.w,FA.w-.06,q.y);
  q.x+=(noise(vec2(q.x*170.,q.y*5.-t*4.5))-.5)*.003*m;q.y-=noise(vec2(q.x*80.,q.y*3.-t*3.2))*.005*m;}
 return q;
}
// outside the frame: worlds hold their edge; open space continues as its mirror image (stars and nebula have no
// direction), so the camera can travel past the plate's border without a stretched edge
float gMir=0.;
vec2 edge(vec2 q){return gMir>0.?1.-abs(1.-mod(q,2.)):clamp(q,.001,.999);}
vec3 tex(sampler2D T,vec2 q,vec2 f,float blur){
 if(blur<.002)return texture(T,edge(q)).rgb;
 vec3 c=vec3(0);for(int i=0;i<12;i++){float k=float(i)/11.;c+=texture(T,edge(f+(q-f)*(1.-blur*k))).rgb;}
 return c/12.;
}
vec3 light(int b,int k,vec2 q,vec3 col){
 float t=uTime;vec4 PL=uS[b+1],WA=uS[b+3],FO=uS[b+4],SU=uS[b+6],J=uJar[k];
 vec3 tint=uTint[k]/255.;
 float lum=dot(col,vec3(.299,.587,.114));
 if(FO.z>0.){ // drifting mist
  float band=ss(FO.x-.12,FO.x+.05,q.y)*ss(FO.y+.12,FO.y-.05,q.y);
  col+=uFogC[k]*fbm(q*vec2(4.,6.)+vec2(t*.035,t*.01))*fbm(q*vec2(9.,5.)-vec2(t*.02,0))*FO.z*band*1.4;}
 // No screen-space water glitter: subpixel white dashes alias into horizontal rippling bands.
 if(PL.z>0.){float r=length((q-PL.xy)*K)/PL.z;col+=col*ss(.9,1.,r)*ss(1.06,1.,r)*(.35+.25*sin(t*.7));} // breathing limb
 if(J.y>J.x){ // light sweeping over the jar + breathing rim light on its edges and on the ground under it
  float m=ss(J.x,J.x+.015,q.x)*ss(J.y,J.y-.015,q.x)*ss(J.z,J.z+.03,q.y)*ss(J.w,J.w-.02,q.y);
  float ph=fract(t*.085+float(k)*.37),bx=mix(J.x-.1,J.y+.1,ph);
  float band=exp(-pow((q.x-bx)/.022,2.))+.45*exp(-pow((q.x-bx+.04)/.008,2.));
  col+=mix(vec3(1.),tint,.35)*band*m*.22;
  float e=exp(-pow((q.x-J.y+.008)/.009,2.))+.7*exp(-pow((q.x-J.x-.008)/.009,2.));
  col+=tint*e*m*(.12+.1*sin(t*1.3));
  col+=tint*exp(-pow((q.y-J.w)/.025,2.))*ss(J.x-.06,J.x+.06,q.x)*ss(J.y+.06,J.y-.06,q.x)*(.14+.08*sin(t*.9+1.));}
 if(SU.z>0.){ // pulsing star with slowly turning rays
  vec2 d=(q-SU.xy)*K;float r=length(d),a=atan(d.y,d.x),pulse=1.;
  vec3 sc=mix(vec3(1.,.8,.55),tint,.35);
  col+=sc*(.0022/(r*r+.0022))*.4*SU.z*pulse;
  col+=sc*(pow(max(0.,sin(a*5.+t*.12)),30.)+.6*pow(max(0.,sin(a*9.-t*.08+1.3)),50.))*exp(-r*4.5)*.3*SU.z*pulse;}
 // Stars are already in the source image; do not sprinkle flickering points over rocks and water.
 return col;
}
// real parallax from the depth map: march the view ray from the near plane (L=1) to the far one (L=0) and take the
// first surface it meets, so near rocks and the jar slide over the background and occlude it (a "3D photo").
// A layer at depth L is magnified by 1+dolly*L around f (flying forward) and shifted by off*(L-pivot) (orbiting).
vec2 march(sampler2D D,vec2 q0,vec2 f,vec4 c,out float dep){
 if(abs(c.z)<1e-4&&dot(c.xy,c.xy)<1e-10){dep=texture(D,q0).r;return q0;}
 const int N=28;float pL=1.;vec2 pq=q0;
 for(int i=0;i<=N;i++){
  float L=1.-float(i)/float(N);
  vec2 q=f+(q0-f)/(1.+c.z*L)-c.xy*(L-c.w)/K;
  float d=texture(D,edge(q)).r;
  if(d>=L){ // refine between the last miss and this hit
   float a=L,b=pL;for(int j=0;j<7;j++){float m=.5*(a+b);vec2 qm=f+(q0-f)/(1.+c.z*m)-c.xy*(m-c.w)/K;
    if(texture(D,edge(qm)).r>=m){a=m;q=qm;}else b=m;}
   dep=a;return q;}
  pL=L;pq=q;
 }
 dep=0.;return pq;
}
float luma(vec3 c){return dot(c,vec3(.299,.587,.114));}
// Planets that turn. The light of the frame (its blurred copy: terminator, limb, colour grade) stays where it is,
// only the surface moves under it: a real map for rocky worlds, the frame's own clouds for gas giants.
// Everything is computed without per-pixel branches so the derivatives for the map mipmaps stay valid.
vec3 orbs(sampler2D T,int k,vec2 q,vec3 col,float dep,float blur){
 for(int j=0;j<2;j++){
  int o=(k*2+j)*3;vec4 A=uO[o],B=uO[o+1],C=uO[o+2];
  if(A.w<.5)continue;
  vec2 d=(q-A.xy)*K/A.z;float rr=dot(d,d);
  float m=ss(1.,.86,rr)*ss(.42,.22,dep)*offJar(k,q)*(1.-ss(.01,.06,blur)); // crisp original limb; never over the jar or rocks
  if(C.w>0.)m*=ss(.012,-.012,q.y-(C.y+(q.x-C.x)*C.z)+.015);   // Saturn: rings in front stay as painted
  float ct=cos(B.y),st=sin(B.y);vec2 e=vec2(ct*d.x-st*d.y,st*d.x+ct*d.y);
  float r2=min(dot(e,e),.995),z=sqrt(1.-r2),lat=asin(clamp(e.y,-.998,.998)),cl=cos(lat),lon=atan(e.x,z);
  vec3 low=textureLod(T,q,7.).rgb;float Ll=luma(low);
  vec3 nc;
  if(A.w<1.5){ // real surface map
   vec2 uv=vec2((lon+B.x)/6.28318+.5,.5+lat/3.14159),gx=dFdx(uv),gy=dFdy(uv);
   int mi=int(B.z+.5);
   vec3 mp=mi==0?textureGrad(uM0,uv,gx,gy).rgb:mi==1?textureGrad(uM1,uv,gx,gy).rgb:textureGrad(uM2,uv,gx,gy).rgb;
   vec3 mean=mi==0?textureLod(uM0,vec2(.5),11.).rgb:mi==1?textureLod(uM1,vec2(.5),11.).rgb:textureLod(uM2,vec2(.5),11.).rgb;
   float ml=pow(luma(mp)/max(luma(mean),.02),1.3);
   if(mi==2){ // Earth: its own colours and clouds drifting a little faster than the ground
    vec2 cu=uv+vec2(uTime*.0025,0.);float cld=textureGrad(uM3,cu,gx,gy).r;
    vec3 al=mix(mp*1.25,vec3(1.),smoothstep(.08,.6,cld)*.95);
    nc=al*Ll/max(luma(mean),.05)*.55*mix(vec3(1.),low/max(Ll,.002),.25);
   }else nc=low*ml;
  }else{ // flowing clouds / bands of the frame itself (two phases crossfaded, each latitude at its own speed)
   // each layer is held for most of its cycle and handed over quickly, at different moments in different places,
   // so the handover reads as clouds re-forming rather than as a soft double image
   float ph=B.x/max(B.w,1e-3)+fbm(e*2.3+3.1)*1.7,rt=1.+B.z*(noise(vec2(lat*9.,3.7))-.5)*1.6;vec3 acc=vec3(0);float ws=0.;
   for(int i=0;i<2;i++){
    float p=fract(ph+.5*float(i)),w=1.-ss(.55,.95,abs(2.*p-1.))+.001;ws+=w;
    float lo=clamp(lon-(p-.5)*B.w*rt,-1.48,1.48);
    vec2 e2=vec2(sin(lo)*cl,e.y),d2=vec2(ct*e2.x+st*e2.y,-st*e2.x+ct*e2.y),q2=A.xy+d2*A.z/K;
    vec3 sm=textureLod(T,q2,0.).rgb;
    acc+=sm*clamp(Ll/max(luma(textureLod(T,q2,7.).rgb),.004),.6,1.6)*w;} // relit where it is now
   nc=acc/ws;
  }
  col=mix(col,nc,m);
 }
 return col;
}
vec3 scene(sampler2D T,sampler2D D,int b,int k,vec2 s,float blur,out float dep){
 gMir=uS[b+7].z;vec2 q=march(D,camera(b,s),uS[b].xy,uC3[k],dep);
 gJarShade=1.;q=living(b,k,q,dep);
 vec3 colour=light(b,k,q,orbs(T,k,q,tex(T,q,uS[b].xy,blur),dep,blur)*gJarShade);
 float matte=ss(-.012,.018,q.x)*ss(1.012,.982,q.x)*ss(-.018,.025,q.y)*ss(1.018,.975,q.y);
 return mix(vec3(.012,.016,.02),colour,gMir>.5?1.:matte);
}
void main(){
 vec2 s=vUv;float dA,dB;
 vec3 col=scene(uA,uDA,0,0,s,uS[7].x,dA);
 if(uHasB>0.){
  vec3 cb=scene(uB,uDB,8,1,s,uS[15].x,dB);
  // every change of worlds has its own physical transition (STORYBOARD.md); uTone is its colour
  float d=length((s-uOpen)*vec2(uAspect,1.)),g=pow(sin(uT*3.14159),1.5),w;vec3 C=uTone;
  if(uKind==0){ // leaving a world into open space: it falls behind into the dark, stars streak past
   w=ss(.42,.58,uT);col=mix(col,cb,w);col*=1.-.5*g*ss(.05,.6,d+.15);
  }else if(uKind==7){ // space to space: the camera keeps travelling, the next plate takes over from the centre out
   w=ss(.38,.62,uT+(.3-d)*.25);col=mix(col,cb,w);col+=uTone*g*.05*exp(-d*3.);
  }else if(uKind==1){ // mist (Luna, Earth): fog rolls over the lens and clears on the new world
   float n=fbm(s*vec2(3.,2.2)+vec2(uTime*.06,uT*.8));
   w=ss(.42,.58,uT*1.5-.25+(n-.5)*.9);col=mix(col,cb,w);col=mix(col,C*(.55+.6*n),g*(.35+.5*n));
  }else if(uKind==2){ // Saturn: a golden ring sweeps across the lens, the new world is behind it
   float y=s.y+(s.x-.5)*.3,bc=mix(1.3,-.3,uT),e=y-bc;
   w=ss(-.03,.03,e);col=mix(col,cb,w);
   float band=exp(-e*e/.0022)+.35*exp(-e*e/.03),str=.75+.5*fbm(vec2(s.x*6.-uTime*.4,e*60.)); // ring structure
   col+=C*band*1.4*str*ss(0.,.12,uT)*ss(1.,.88,uT);
  }else if(uKind==3){ // Venus: warm pearl glare with an iridescent sheen
   w=ss(.4,.6,uT+.06-d*.12);col=mix(col,cb,w);
   vec3 ir=.5+.5*cos(6.283*(vec3(0.,.33,.67)+s.x*.7+s.y*.4+uTime*.04));
   col+=(C*.75+ir*.25)*g*(1.2*exp(-d*2.2)+.35);col=mix(col,1.-exp(-col*1.2),g);
  }else if(uKind==4){ // Mars: a front of red dust blows across
   float n=fbm(s*vec2(5.,3.)+vec2(-uTime*.35,0.)),v=uT*1.6-.3-s.x+(n-.5)*.45;
   w=ss(-.05,.05,v);col=mix(col,cb,w);
   float dust=ss(.0,.1,uT)*ss(1.,.9,uT)*(exp(-abs(v)*3.2)*(.55+.6*n)+g*.25);
   col=mix(col,C*(.3+.9*n),clamp(dust,0.,.95));
  }else if(uKind==5){ // Neptune: the camera passes through a water surface
   float v=uT*1.5-.25-s.y+.025*sin(s.x*28.+uTime*3.)+.012*sin(s.x*63.-uTime*2.1);
   w=ss(-.015,.015,v);col=mix(col,cb,w);
   float sh=ss(0.,.1,uT)*ss(1.,.9,uT);
   col=mix(col,col*vec3(.55,.75,1.1)+C*.08,exp(-abs(v)*7.)*sh*.8); // blue depth around the surface
   col+=C*(exp(-abs(v)*70.)*.45+exp(-abs(v)*14.)*.12)*sh;
  }else{ // the star of the opening shot blooms over the lens
   w=ss(.4,.6,uT+.06-d*.12);col=mix(col,cb,w);
   col+=C*g*(1.5*exp(-d*2.6)+.4*exp(-d*.8))+C*g*g*g*.6;
   col+=C*g*exp(-abs(s.y-uOpen.y)*45.)*exp(-abs(s.x-uOpen.x)*1.3)*.8; // anamorphic streak
   col=mix(col,1.-exp(-col*1.15),g);
  }
 }
 col+=mix(uTint[0],uTint[1],uT)/255.*uFlash*.1;
 vec2 v=(s-.5)*vec2(uAspect*.55,1.);col*=1.-dot(v,v)*.55;
 // No animated grain: keep the native image clean while the camera moves.
 o=vec4(col,1.);
}`;

function initGL(){
 const canvas=document.createElement('canvas');canvas.className='vg-gl';canvas.setAttribute('aria-hidden','true');
 const gl=canvas.getContext('webgl2',{antialias:false,alpha:false,powerPreference:'high-performance'});
 if(!gl)return null;
 const sh=(type,src)=>{const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){console.warn(gl.getShaderInfoLog(s));return null}return s};
 const vs=sh(gl.VERTEX_SHADER,VS),fs=sh(gl.FRAGMENT_SHADER,FS);if(!vs||!fs)return null;
 const pr=gl.createProgram();gl.attachShader(pr,vs);gl.attachShader(pr,fs);gl.linkProgram(pr);
 if(!gl.getProgramParameter(pr,gl.LINK_STATUS)){console.warn(gl.getProgramInfoLog(pr));return null}
 gl.useProgram(pr);
 const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
 const loc=gl.getAttribLocation(pr,'aP');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
 const u={};['uA','uB','uDA','uDB','uM0','uM1','uM2','uM3','uO','uCan','uSpin','uS','uJar','uC3','uFogC','uTint','uT','uTime','uImgA','uAspect','uFlash','uHasB','uCam','uRes','uOpen','uKind','uTone'].forEach(n=>u[n]=gl.getUniformLocation(pr,n));
 gl.uniform1i(u.uA,0);gl.uniform1i(u.uB,1);gl.uniform1i(u.uDA,2);gl.uniform1i(u.uDB,3);gl.uniform1f(u.uImgA,16/9);
 // planet surface maps (Solar System Scope, CC BY 4.0 — credited in the footer): wrap around the globe, mipmapped
 const maps=['p0-moon','p3-mars','p4-earth','earth-clouds'].map((n,i)=>{const t=gl.createTexture();gl.activeTexture(gl.TEXTURE4+i);gl.bindTexture(gl.TEXTURE_2D,t);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([90,90,90,255]));
  const im=new Image();im.decoding='async';im.onload=()=>{gl.activeTexture(gl.TEXTURE4+i);gl.bindTexture(gl.TEXTURE_2D,t);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,im);gl.generateMipmap(gl.TEXTURE_2D);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
   gl.activeTexture(gl.TEXTURE0)}; // units 4–7 keep the maps; every other upload happens on unit 0
  im.src=`/assets/space/${n}.webp`;gl.uniform1i(u['uM'+i],4+i);return t});
 gl.activeTexture(gl.TEXTURE0);
 const black=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,black);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([3,4,5,255]));
 const flat=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,flat);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([0,0,0,255]));
 // depth maps (tools/depth.py): the pivot depth is read at the focus, so the jar stays put while the world orbits it
 scenes.forEach(s=>{s.dtex=null;s.pivot=.5;if(s.id==='hero')return;const im=new Image();im.decoding='async';
  im.onload=()=>{const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,im);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);s.dtex=t;
   try{const c=document.createElement('canvas');c.width=64;c.height=36;const x=c.getContext('2d');x.drawImage(im,0,0,64,36);
    s.pivot=x.getImageData(Math.round(s.f[0]*63),Math.round(s.f[1]*35),1,1).data[0]/255}catch{}};
  im.src=`/assets/film/depth/${s.id}.webp`});
 // frames come from the scene <img>s; mipmaps keep the 2880px masters crisp when zoomed out
 // uploads are decoded off the main thread first and then go to the GPU one per animation frame: twenty 2880px frames
 // landing at once used to stall the start of the film
 const queue=[];let pumping=0;
 const pump=()=>{pumping=0;queue.shift()?.();if(queue.length)pumping=requestAnimationFrame(pump)};
 const later=job=>{queue.push(job);if(!pumping)pumping=requestAnimationFrame(pump)};
 scenes.forEach((s,i)=>{s.tex=null;const im=s.img;im.loading='eager';
  const ready=()=>{if(i===0)return up();(im.decode?im.decode():Promise.resolve()).catch(()=>{}).then(()=>later(up))};
  const up=()=>{gl.activeTexture(gl.TEXTURE0);const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,im);gl.generateMipmap(gl.TEXTURE_2D);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);s.tex=t};
  if(im.complete&&im.naturalWidth)ready();else im.addEventListener('load',ready,{once:true});});
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();R=null;vg.classList.remove('is-gl');canvas.remove();stage.querySelector('.vg-stars')?.remove();copyAndRail(cur);kick()});
 stage.prepend(canvas);
 const S=new Float32Array(64),J=new Float32Array(8),C3=new Float32Array(8),fogc=new Float32Array(6),tint=new Float32Array(6);
 const O=new Float32Array(48),CN=new Float32Array(8),SP=new Float32Array(2);
 function pack(slot,s,cam){const L=s.life,o=slot*32,pan=wide()?L.pan:0,c=cam.c||s.f;
  C3.set(s.dtex?[cam.off[0],cam.off[1],cam.dolly,cam.pivot??s.pivot]:[0,0,0,0],slot*4);
  for(let j=0;j<2;j++){const p=s.orbs[j],b=(slot*2+j)*12;
   if(!p){O.fill(0,b,b+12);continue}
   O.set([p.c[0],p.c[1],p.r,p.kind,turn(p),p.tilt||0,p.kind===1?p.map:p.band||0,p.amp||1],b);
   O.set(p.cut?[p.cut[0],p.cut[1],p.cut[2],1]:[0,0,0,0],b+8)}
  CN.set(s.can||[1,0,0,0],slot*4);SP[slot]=s.spin;
  S.set([c[0],c[1],cam.zoom,cam.roll],o);S.set(L.planet||[0,0,0,0],o+4);S.set(L.swirl||[0,0,0,0],o+8);
  S.set(L.water?[L.water[0],L.water[1],0,0]:[2,0,0,0],o+12);S.set(L.fog,o+16);S.set(L.fall||[1,0,0,0],o+20);
  S.set(L.sun?[...L.sun,0]:[0,0,0,0],o+24);S.set([cam.blur,cam.pan?cam.pan[0]:pan,L.path?1:0,cam.pan?cam.pan[1]:0],o+28);
  J.set(L.jar||[1,0,0,0],slot*4);fogc.set(L.fogc,slot*3);tint.set(L.tint,slot*3)}
 return{canvas,
  // the screen's own pixels (Retina / 2K / 4K, at most a 4K frame), scaled by `quality` when the GPU cannot keep up
  // (see pace()); never below the old fixed budget of ~2.2 MP
  size(){const dpr=Math.min(devicePixelRatio||1,2),full=Math.min(dpr,Math.sqrt(8.3e6/(W*H))),floor=Math.min(full,Math.sqrt(2.2e6/(W*H)));
   const k=Math.max(floor,full*quality),w=Math.round(W*k),h=Math.round(H*k);
   if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h)}
   gl.uniform1f(u.uAspect,W/H);gl.uniform2f(u.uRes,canvas.width,canvas.height)},
  draw(A,B,t,camA,camB,time,flash,sway,open,tr){
   pack(0,A,camA);pack(1,B||A,camB||camA);
   gl.uniform1i(u.uKind,tr.kind);gl.uniform3f(u.uTone,...tr.tone);
   gl.uniform4fv(u.uS,S);gl.uniform4fv(u.uJar,J);gl.uniform4fv(u.uO,O);gl.uniform4fv(u.uCan,CN);gl.uniform2fv(u.uSpin,SP);gl.uniform4fv(u.uC3,C3);gl.uniform3fv(u.uFogC,fogc);gl.uniform3fv(u.uTint,tint);
   gl.uniform1f(u.uT,t);gl.uniform1f(u.uHasB,B&&B.tex?1:0);gl.uniform1f(u.uTime,time);gl.uniform1f(u.uFlash,flash);
   gl.uniform2f(u.uOpen,open[0],open[1]);gl.uniform2f(u.uCam,sway[0],sway[1]);
   gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,A.tex||black);
   gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,(B&&B.tex)||black);
   gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,A.dtex||flat);
   gl.activeTexture(gl.TEXTURE3);gl.bindTexture(gl.TEXTURE_2D,(B&&B.dtex)||flat);
   gl.drawArrays(gl.TRIANGLE_STRIP,0,4)}};
}

/* ───────────── 2D layer: speed streaks during flights, particles of each world ───────────── */
function initFx(){
 const c=document.createElement('canvas');c.className='vg-stars';c.setAttribute('aria-hidden','true');
 const ctx=c.getContext('2d');const g=stage.querySelector('.vg-gl');g?g.after(c):stage.prepend(c);
 const rnd=(a,b)=>a+Math.random()*(b-a);
 const stars=Array.from({length:90},()=>({x:rnd(-1,1),y:rnd(-1,1),z:Math.random()}));
 const make={
  hero:()=>Array.from({length:60},()=>({x:Math.random(),y:rnd(.35,.95),s:rnd(.4,1.4),v:rnd(.003,.01),ph:rnd(0,7)})),
  luna:()=>Array.from({length:70},()=>({x:Math.random(),y:rnd(.3,1),s:rnd(.4,1.6),v:rnd(.004,.018),ph:rnd(0,7)})),
  // no drawn rocks: next to photographic frames they read as clip-art; the frames' own asteroids move by depth
  saturn:()=>Array.from({length:60},()=>({x:Math.random(),y:Math.random(),z:rnd(.2,1),ph:rnd(0,7)})),
  venus:()=>Array.from({length:24},()=>({x:Math.random(),y:Math.random(),z:rnd(.25,1),ph:rnd(0,7)})),
  mars:()=>Array.from({length:110},()=>({x:Math.random(),y:rnd(.15,1),z:rnd(.2,1)})),
  earth:()=>[...Array.from({length:70},()=>({x:rnd(.5,1),y:Math.random(),z:rnd(.2,1),drop:1})),
   ...Array.from({length:30},()=>({x:Math.random(),y:Math.random(),z:rnd(.3,1),ph:rnd(0,7)}))],
  neptune:()=>[...Array.from({length:40},()=>({x:Math.random(),y:Math.random(),z:rnd(.25,1),ph:rnd(0,7),bub:1})),
   ...Array.from({length:40},()=>({x:Math.random(),y:Math.random(),z:rnd(.2,1),ph:rnd(0,7)}))]
 };
 const sets={};
 function world(id,al,dt,time){
  const P=sets[id]||(sets[id]=make[id]?.());if(!P||al<.02)return;
  const S=Math.min(W,H);ctx.save();ctx.globalAlpha=al;
  for(const p of P){
   switch(id){
    case'hero':case'luna':p.y-=p.v*dt;if(p.y<.25){p.y=1;p.x=Math.random()}
     ctx.fillStyle=`rgba(215,228,250,${(.25+.6*Math.max(0,Math.sin(time*2+p.ph)))*.8})`;ctx.fillRect(p.x*W,p.y*H,p.s,p.s);break;
    case'saturn':
     p.x+=.02*p.z*dt;if(p.x>1)p.x=0;ctx.fillStyle=`rgba(255,205,140,${.2+.5*p.z*Math.max(0,Math.sin(time*1.5+p.ph))})`;ctx.beginPath();ctx.arc(p.x*W,p.y*H,.5+p.z*1.6,0,6.283);ctx.fill();break;
    case'venus':p.y-=.012*p.z*dt;if(p.y<-.05){p.y=1.05;p.x=Math.random()}
     {const x=(p.x+Math.sin(time*.5+p.ph)*.015)*W,y=p.y*H,r=2+p.z*S*.012,gr=ctx.createRadialGradient(x-r*.3,y-r*.3,0,x,y,r);
      gr.addColorStop(0,`rgba(255,245,240,${.55*p.z})`);gr.addColorStop(.6,`rgba(240,190,195,${.25*p.z})`);gr.addColorStop(1,'rgba(240,190,195,0)');
      ctx.fillStyle=gr;ctx.beginPath();ctx.arc(x,y,r,0,6.283);ctx.fill()}break;
    case'mars':
     p.x+=.09*p.z*dt;if(p.x>1){p.x=0;p.y=rnd(.15,1)}ctx.strokeStyle=`rgba(230,120,80,${.12+.3*p.z})`;ctx.lineWidth=.6+p.z;ctx.beginPath();ctx.moveTo(p.x*W,p.y*H);ctx.lineTo(p.x*W-10-30*p.z,p.y*H+2);ctx.stroke();break;
    case'earth':
     if(p.drop){p.y+=.25*p.z*dt;p.x-=.02*p.z*dt;if(p.y>1){p.y=0;p.x=rnd(.5,1)}ctx.strokeStyle=`rgba(225,240,235,${.15+.35*p.z})`;ctx.lineWidth=.6+p.z*.8;ctx.beginPath();ctx.moveTo(p.x*W,p.y*H);ctx.lineTo(p.x*W+2,p.y*H-6-14*p.z);ctx.stroke()}
     else{p.y-=.006*p.z*dt;p.x+=Math.sin(time*.4+p.ph)*.0004;if(p.y<0)p.y=1;ctx.fillStyle=`rgba(255,240,190,${.15+.5*p.z*Math.max(0,Math.sin(time*1.2+p.ph))})`;ctx.beginPath();ctx.arc(p.x*W,p.y*H,.7+p.z*1.6,0,6.283);ctx.fill()}break;
    case'neptune':
     if(p.bub){p.y-=.03*p.z*dt;if(p.y<-.05){p.y=1.05;p.x=Math.random()}const x=(p.x+Math.sin(time*.9+p.ph)*.01)*W,y=p.y*H,r=1.5+p.z*S*.009;
      ctx.strokeStyle=`rgba(170,215,255,${.25+.4*p.z})`;ctx.lineWidth=.8;ctx.beginPath();ctx.arc(x,y,r,0,6.283);ctx.stroke();
      ctx.fillStyle=`rgba(230,245,255,${.5*p.z})`;ctx.beginPath();ctx.arc(x-r*.35,y-r*.35,r*.22,0,6.283);ctx.fill()}
     else{p.x+=Math.sin(time*.2+p.ph)*.0003;p.y+=Math.cos(time*.25+p.ph)*.0003;ctx.fillStyle=`rgba(150,210,255,${.15+.45*p.z*Math.max(0,Math.sin(time*1.7+p.ph))})`;ctx.fillRect(p.x*W,p.y*H,1+p.z,1+p.z)}break;
   }
  }
  ctx.restore();
 }
 let k=1;
 return{size(){k=Math.min(devicePixelRatio||1,2);c.width=Math.round(W*k);c.height=Math.round(H*k);ctx.setTransform(c.width/W,0,0,c.height/H,0,0)}, // sharp particles on Retina
  draw(dt,time,speed,fx,fy,rgb,worlds){
   ctx.clearRect(0,0,W,H);
   if(speed>.12){ctx.lineCap='round';const cx=fx*W,cy=fy*H,sc=Math.max(W,H)*.55,tail=Math.min(.5,speed*.22),al=Math.min(1,(speed-.12)*2);
    for(const s of stars){
     s.z-=speed*dt*.35;if(s.z<=.03){s.z=1;s.x=rnd(-1,1);s.y=rnd(-1,1)}
     const x=cx+s.x/s.z*sc,y=cy+s.y/s.z*sc;if(x<-50||x>W+50||y<-50||y>H+50){s.z=1;continue}
     const z2=Math.min(1,s.z+tail),near=1-s.z;
     ctx.strokeStyle=`rgba(${rgb},${(near*near*.28*al).toFixed(3)})`;ctx.lineWidth=.3+near*1.2;
     ctx.beginPath();ctx.moveTo(cx+s.x/z2*sc,cy+s.y/z2*sc);ctx.lineTo(x+.01,y);ctx.stroke()}}
   // Ambient bubbles / pixel confetti are deliberately disabled. Only a real flight draws subtle streaks.
  }};
}

let R=initGL();
const fx=R?initFx():null;
if(R)vg.classList.add('is-gl');

let target=0,cur=0,last=performance.now(),time=0,inView=true,raf=0,mx=0,my=0,tmx=0,tmy=0,vel=0,jumpUntil=0;
// the film runs over span() px of scroll; after it the final frame ("Шесть миров. Один ты.") rests for REST svh
// before the page lifts it away
// Geometry is cached: reading offsetTop/offsetHeight on every scroll event and every frame forced a layout right after
// the frame's style writes (a stutter on long pages). The stage is 100svh, so a phone's toolbar sliding in and out
// changes neither the film's length nor the canvas — no jumps and no canvas reallocations while scrolling.
const REST=70;let top0=0,len0=0,span0=1,dpr0=0;
const span=()=>span0;
function geometry(){top0=vg.offsetTop;len0=vg.offsetHeight;span0=Math.max(1,len0-H*(1+REST/100))}
function read(){target=window.vgP??clamp((scrollY-top0)/span0)*(N-1)} // vgP: screenshots
function measure(){const w=stage.clientWidth||innerWidth,h=stage.clientHeight||innerHeight,same=w===W&&h===H&&dpr0===devicePixelRatio;
 W=w;H=h;dpr0=devicePixelRatio;
 // big screens start at ~4.5 MP and climb to their own pixels while frames stay smooth (stepping down mid-flight shows)
 if(!measure.done){const full=Math.min(devicePixelRatio||1,2,Math.sqrt(8.3e6/(W*H)));quality=Math.min(1,Math.sqrt(4.5e6/(W*H*full*full)))}
 if(!same||!measure.done){scenes.forEach(reach);R?.size();fx?.size();measure.done=1}geometry()}
// Resolution follows the GPU: the film works up to the screen's own pixels; if frames come slower than ~50 fps for half a
// second it steps down 15% (down to the old fixed budget), and after a while of smooth frames it tries a step up again,
// waiting twice as long after every step that turned out too heavy. The first seconds (frame uploads) are not judged.
const Q={sum:0,n:0,good:0,hold:performance.now()+3000,wait:5000};
function pace(ms,now){
 if(!R||ms>250||now<Q.hold)return;
 Q.sum+=ms;if(++Q.n<30)return;const avg=Q.sum/Q.n;Q.sum=Q.n=0;
 if(avg>20&&quality>.5){quality=Math.max(.5,quality*.85);R.size();Q.good=0;Q.hold=now+1000;Q.wait=Math.min(60000,Q.wait*2);return}
 if(avg<18.5&&quality<1){Q.good+=avg*30;if(Q.good>Q.wait){quality=Math.min(1,quality/.85);R.size();Q.good=0;Q.hold=now+1000}}
 else if(avg>=18.5)Q.good=0;
}
addEventListener('pointermove',e=>{if(e.pointerType!=='mouse')return;tmx=e.clientX/W-.5;tmy=e.clientY/H-.5},{passive:true});

function copyAndRail(p){
 let active=0;
 scenes.forEach((s,i)=>{
  const t=opened(i,p),tn=i<N-1?opened(i+1,p):0,shown=t>0&&tn<1;
  if(s.el.classList.contains('is-shown')!==shown){s.el.classList.toggle('is-shown',shown);if(!shown&&!R){s.img.style.transform='';s.el.style.webkitMaskImage=s.el.style.maskImage=''}}
  if(!shown){if(s.copy.style.visibility!=='hidden'){s.copy.style.visibility='hidden';s.copy.style.opacity='0'}return}
  if(t>=.5)active=i;
  if(!R){ // CSS fallback camera
   if(t<1){const r=(t*s.max).toFixed(1);s.el.style.webkitMaskImage=s.el.style.maskImage=`radial-gradient(circle at var(--fx) var(--fy),#000 ${Math.max(0,r-110)}px,transparent ${r}px)`}
   else s.el.style.webkitMaskImage=s.el.style.maskImage='none';
   const drift=clamp(p-i+1,0,2)/2;
   const restingZoom=s.id==='hero'||s.id==='final'?1:.94;
   s.img.style.transform=`scale(${((1+(1-t)*.22)*(restingZoom+drift*.02)*(1+tn*tn*.45)).toFixed(4)})`;
  }
  const o=(i===0?1:sstep(i-.12,i,p))*(i===N-1?1:1-sstep(i+HOLD*.5,i+HOLD*.95,p));
  s.copy.style.opacity=o.toFixed(3);s.copy.style.transform=''; // stable text baseline; only the world/camera moves
  s.copy.style.visibility=o>.01?'visible':'hidden';
 });
 const world=worldOf(scenes[active].id);
 railLinks.forEach(a=>{const on=a.dataset.vgGo===world;a.classList.toggle('is-active',on);on?a.setAttribute('aria-current','step'):a.removeAttribute('aria-current')});
 vg.classList.toggle('in-worlds',p>.55&&p<N-1.5);
 bar.style.transform=`scaleY(${clamp((p-BAR[0])/(BAR[1]-BAR[0])).toFixed(4)})`; // from open space before Luna to the Neptune world
 hint.style.opacity=(1-sstep(.02,.18,p)).toFixed(3);
}

/* ───────────── touch the world: turn the jar, spin a planet ───────────── */
// screen uv → frame uv for the scene at rest (the shader's camera() without the depth march): hit tests only
let view=null; // {s,cam,sway} of the world on screen, null during flights
function toImage(sx,sy){
 const{s,cam,sway}=view,v=frameSpan(W/H),f=cam.c,pan=cam.pan||[wide()?s.life.pan:0,0];
 let q=[f[0]*(1-v[0])+(sx-pan[0])*v[0],f[1]*(1-v[1])+(sy-pan[1])*v[1]];
 let dx=(q[0]-f[0])*16/9,dy=q[1]-f[1];const c=Math.cos(cam.roll),n=Math.sin(cam.roll);
 [dx,dy]=[(c*dx-n*dy)/cam.zoom,(n*dx+c*dy)/cam.zoom];
 q=[f[0]+dx*9/16,f[1]+dy];const k=.35+sstep(.2,1,q[1])*1.3;return[q[0]+sway[0]*k,q[1]+sway[1]*k];
}
function hit(e){
 if(!view)return null;const r=stage.getBoundingClientRect(),q=toImage((e.clientX-r.left)/W,(e.clientY-r.top)/H),s=view.s;
 const G=s.can;if(G&&q[0]>G[0]&&q[0]<G[1]&&q[1]>G[2]-.09&&q[1]<G[3])return{s,jar:1}; // lid included
 for(const o of s.orbs)if(Math.hypot((q[0]-o.c[0])*16/9,q[1]-o.c[1])<o.r)return{s,orb:o.link||o};
 return null;
}
let grab=null;
stage.style.touchAction='pan-y'; // horizontal drags turn things, vertical ones still scroll the film
stage.addEventListener('pointerdown',e=>{
 if(e.button||e.target.closest('a,button,input,label'))return;
 const h=hit(e);if(!h)return;
 grab={...h,x:e.clientX,t:performance.now(),v:0,id:e.pointerId};try{stage.setPointerCapture(e.pointerId)}catch{}stage.style.cursor='grabbing';kick();
});
stage.addEventListener('pointermove',e=>{
 if(!grab){if(e.pointerType==='mouse')stage.style.cursor=hit(e)?'grab':'';return}
 const now=performance.now(),dx=e.clientX-grab.x,dt=Math.max(.001,(now-grab.t)/1000);grab.x=e.clientX;grab.t=now;
 if(grab.jar){const s=grab.s,a=dx/W*4.5,lim=.42; // the further from facing the viewer, the heavier it turns
  s.spin+=a*(Math.sign(a)===Math.sign(s.spin)?Math.max(.15,1-Math.abs(s.spin)/lim):1);s.spinV=a/dt}
 else{const a=dx/W*3.2;grab.orb.ang+=a;grab.v=grab.v*.6+.4*a/dt}
 kick();
});
function release(){if(!grab)return;if(grab.orb)grab.orb.vel=clamp(grab.v,-1.6,1.6);else grab.s.spinV=clamp(grab.s.spinV,-4,4);
 try{stage.releasePointerCapture(grab.id)}catch{}grab=null;stage.style.cursor=''}
stage.addEventListener('pointerup',release);stage.addEventListener('pointercancel',release);
// planets keep turning; a thrown planet slows down to its own pace. The jar turns back on a heavy spring and
// rocks a little on its own (and towards the mouse), so it is clear it can be turned.
function alive(s,dt,idle){
 for(const q of s.orbs){const o=q.link||q; // a continued globe keeps turning on the frame where it is now
  if(window.vgTime!=null)o.ang=(o.ang0||0)+o.rate*time;else if(grab?.orb!==o){o.ang+=(o.rate+o.vel)*dt;o.vel*=Math.exp(-dt*.9)}}
 if(s.can&&grab?.s!==s&&!s.hold){const rest=idle?Math.sin(time*.45+1)*.06+mx*.3:0;
  s.spinV+=(-(s.spin-rest)*26-s.spinV*4.2)*dt;s.spin+=s.spinV*dt}
}

function film(p,dt){
 // the pair on screen: A is fully open, B is opening (t)
 let a=0;for(let i=1;i<N;i++)if(opened(i,p)>=1)a=i;
 const A=scenes[a],B=a<N-1&&opened(a+1,p)>0?scenes[a+1]:null,t=B?opened(a+1,p):0;
 const rest=clamp(p-a,0,1);
 const zA=A.life.z,zB=B?B.life.z:zA;
 // A keeps pushing in while it rests, then dives into its jar with a roll; B arrives from a close-up and unrolls
 // camera centre: the world's focus while resting, its planet/star while diving out; the next world arrives
 // centred on its own planet/star and settles on its jar
 const mix2=(a,b,k)=>[a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k];
 // 3D camera (depth parallax): at rest the camera slowly orbits the jar and follows the mouse, so near rocks slide
 // over the far planet; leaving, it dollies forward into the world (near things rush out past the edges); the next
 // world is entered already "inside" and the landscape gathers around the camera as the dolly unwinds
 vel+=(Math.min(1,Math.abs(target-cur)*6)-vel)*Math.min(1,dt*3);
 mx+=(tmx-mx)*Math.min(1,dt*2.5);my+=(tmy-my)*Math.min(1,dt*2.5);
 const orbit=k=>[Math.sin(time*.17+k)*.005+Math.sin(time*.061)*.003+mx*.008,Math.cos(time*.13+k)*.003+my*.005];
 const u2=(1-t)*(1-t);
 // flight: the camera heads for the world's star/planet (near things spread a little faster than the sky), its light
 // blooms over the lens and the next world comes out of that light, settling on its jar. Big parallax moves are not
 // possible from single stills (nothing is known behind the jar) — those need plates or video (сайт2/*_PROMPTS.md).
 const oa=orbit(0);
 const pA=A.life.path?1:0;
 // in open space the camera travels its route (life.move) the whole time the frame is on screen — arriving, resting
 // and leaving are one continuous move, so two space frames in a row read as one flight past the planets. Only when a
 // world is next does it finally dive into that world's planet.
 const g=i=>clamp((p-(i-1+HOLD))/(2-HOLD)); // 0 when frame i starts to appear … 1 when it is gone
 // the camera looks at c (it sits in the middle of the screen), so travelling a→b really pans across the plate.
 // match: {c,z} that puts this frame's planet where the previous frame's planet is on screen (used while crossfading)
 const travel=(s,gi,dive,match)=>{const M=s.life.move,k=Math.min(1,gi/.8),e=k*k*(3-2*k)*.6+k*.4;s.g=gi;
  let c=mix2(M.a,M.b,e),zoom=M.z[0]+(M.z[1]-M.z[0])*gi/.8;
  if(match){const m=sstep(.25,.6,gi);c=mix2(match.c,c,m);zoom=match.z+(zoom-match.z)*m}
  zoom*=1+dive*dive*1.3;
  const asp=W/H,hx=.5*Math.min(1,asp/(16/9))/zoom-.1,hy=.5*Math.min(1,16/9/asp)/zoom-.06; // at most a little of the mirrored sky
  c=[clamp(c[0],hx,1-hx),clamp(c[1],hy,1-hy)];
  return{c,pan:[.5-c[0],.5-c[1]],zoom,roll:M.roll[0]+(M.roll[1]-M.roll[0])*gi+Math.sin(time*.07)*.008,
   blur:dive*dive*.14,off:[M.side*(1-2*gi)+mx*.02,Math.sin(time*.13)*.004+my*.012],dolly:.05+.1*gi+dive*dive*.3,pivot:.03}}; // a strong depth dolly would swell the planets and smear the edges
 const intoWorld=B&&!B.life.path&&B.id!=='final';
 // leaving a world the camera flies at its planet: stronger dolly, so the jar and near rocks rush out past the edges
 const camA=A.life.move?travel(A,g(a),intoWorld?t:0):{c:mix2(A.f,A.life.dive,sstep(0,.35,t)),zoom:zA*(1+rest*.025)*(1+t*t*1.7),roll:Math.sin(time*.07)*.012+t*t*.08,blur:t*t*.16,
  off:oa.map(v=>v*(1-t)),dolly:t*t*.35};
 // the next planet seen from the pass frame → where the path frame's planet must be: on screen a point sits at
 // (P − c)·zoom from the centre, so the same place and size means z = zoomA·rP/rQ and c = Q − (P − cA)·rQ/rP
 let match=null;
 if(B&&A.life.move?.ahead&&B.life.move&&A.orbs[0]&&B.orbs[0]){const P=A.orbs[0],Q=B.orbs[0],k=Q.r/P.r;
  match={c:[Q.c[0]-(P.c[0]-camA.c[0])*k,Q.c[1]-(P.c[1]-camA.c[1])*k],z:camA.zoom/k}}
 // a world settles from a close-up; a space frame is already travelling when it appears
 const camB=B&&(B.life.move?travel(B,g(a+1),0,match):{c:mix2(B.life.dive,B.f,sstep(.3,1,t)),zoom:zB*(1+u2*1.1),roll:-u2*.1+Math.sin(time*.07)*.012,blur:u2*.12,
  off:oa.map(v=>v*t),dolly:u2*.25});
 const flight=B?Math.sin(t*Math.PI):0;
 const sway=[Math.sin(time*.19)*.005+Math.sin(time*.053)*.003+mx*.01,Math.cos(time*.16)*.0035+my*.007];
 view=!B||t<.04?{s:A,cam:camA,sway}:null;
 alive(A,dt,!B);if(B)alive(B,dt,false);
 const open=onScreen(A,A.life.dive);
 const tr=transition(A,B);
 R.draw(A,B,t,camA,camB,time,flight,sway,open,tr);
 const lead=B&&t>.5?B:A,f=B?open:onScreen(A);
 // star streaks belong to flights through space; mist, dust, ring and water carry their own motion
 fx.draw(dt,time,flight*(tr.kind===0||tr.kind===6?1.1:tr.kind===7?.3:.4),f[0],f[1],lead.life.tint.join(','),[[A.id,1-t],...(B?[[B.id,t]]:[])]);
}

function frame(now){
 raf=0;
 const dt=Math.min(.05,(now-last)/1000);pace(now-last,now);last=now;time=window.vgTime??time+dt; // vgTime: screenshots
 cur+=(target-cur)*(1-Math.exp(-dt*(R?3.2:7)));
 if(Math.abs(target-cur)<1e-4||now<jumpUntil||window.vgSnap)cur=target; // jumps cut straight to the shot; vgSnap: screenshots
 copyAndRail(cur);chrome();
 if(R)film(cur,dt);
 if(inView&&!document.hidden&&(R||cur!==target))raf=requestAnimationFrame(frame);
}
function kick(){read();if(!raf){last=performance.now();raf=requestAnimationFrame(frame)}}

function goTo(id){const i=scenes.findIndex(s=>s.id===id);if(i<0)return;
 scrollTo({top:vg.offsetTop+span()*(i+.02)/(N-1),behavior:'smooth'})}
vg.querySelectorAll('[data-vg-go]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();goTo(a.dataset.vgGo)}));
// "skip the flight" and "back to the start": cut instantly instead of fast-forwarding / rewinding the whole film
function cut(top){jumpUntil=performance.now()+400;scrollTo({top,behavior:'instant'});kick()}
function jumpWorld(id){const i=scenes.findIndex(s=>s.id===id);if(i<0)return;cut(vg.offsetTop+span()*(i+.1)/(N-1));}
function followWorldHash(){if(location.hash==='#worlds')jumpWorld('luna');else{const match=/^#world-(luna|saturn|venus|mars|earth|neptune)$/.exec(location.hash);if(match)jumpWorld(match[1]);}}
document.querySelectorAll('a[href$="#worlds"]').forEach(a=>a.addEventListener('click',e=>{const url=new URL(a.href);if(url.origin!==location.origin||url.pathname!==location.pathname)return;e.preventDefault();history.replaceState(null,'','#worlds');jumpWorld('luna');}));
addEventListener('hashchange',followWorldHash);
const skip=vg.querySelector('.vg-skip'),toTop=document.querySelector('.vg-top');
vg.querySelectorAll('[data-vg-exit]').forEach(a=>a.addEventListener('click',e=>{const h=a.getAttribute('href'),el=h.startsWith('#')&&document.querySelector(h);if(!el)return;e.preventDefault();cut(el.getBoundingClientRect().top+scrollY);history.replaceState(null,'',h);el.querySelector('h2')?.setAttribute('tabindex','-1');el.querySelector('h2')?.focus({preventScroll:true})}));
toTop?.addEventListener('click',e=>{e.preventDefault();cut(0);document.querySelector('.vg-start')?.focus({preventScroll:true})});
function chrome(){const end=top0+len0-H*.5;
 toTop?.classList.toggle('is-on',scrollY>end);skip?.classList.toggle('is-on',cur>.25&&cur<N-1.15)}

new IntersectionObserver(([e])=>{inView=e.isIntersecting;if(inView)kick()}).observe(vg);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)kick()});
addEventListener('scroll',()=>{kick();chrome()},{passive:true});
addEventListener('resize',()=>{measure();kick()},{passive:true});
addEventListener('load',()=>{geometry();kick()}); // fonts and images can still move the page under the film
measure();read();cur=target;copyAndRail(cur);kick();
if(document.readyState==='complete')followWorldHash();
else addEventListener('DOMContentLoaded',()=>requestAnimationFrame(followWorldHash),{once:true});
// screenshots: #vg=<scene>[@<0..1 into the flight>][,<time s>[,<jar turn rad>]] opens that world at a fixed moment
{const m=/^#vg=([\w-]+)(?:@([\d.]+))?(?:,([\d.]+))?(?:,(-?[\d.]+))?/.exec(location.hash);
 if(m){const i=scenes.findIndex(s=>s.id===m[1]);window.vgSnap=1;if(m[3])window.vgTime=+m[3];
  if(m[4]&&scenes[i]){const s=scenes[i];s.spin=+m[4];s.hold=1}
  if(i>=0){window.vgP=i+(m[2]?+m[2]:.1);kick()}}}
})();

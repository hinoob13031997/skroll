const menuButton=document.querySelector('.menu-button');
const menu=document.querySelector('#mobile-menu');
function closeMenu(){menu.hidden=true;menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','Открыть меню');}
menuButton?.addEventListener('click',()=>{const open=menu.hidden;menu.hidden=!open;menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'Закрыть меню':'Открыть меню');});
menu?.addEventListener('click',e=>{if(e.target.closest('a'))closeMenu();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!menu.hidden){closeMenu();menuButton.focus();}});
document.addEventListener('click',e=>{if(!menu.hidden&&!menu.contains(e.target)&&!menuButton.contains(e.target))closeMenu();});
document.querySelectorAll('[data-state]').forEach(button=>button.addEventListener('click',()=>{
 document.querySelectorAll('[data-state]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
 document.querySelectorAll('[data-panel]').forEach(p=>p.hidden=p.dataset.panel!==button.dataset.state);
}));
const preference=matchMedia('(prefers-reduced-motion: reduce)');
let override;try{override=localStorage.getItem('moonvit-motion');}catch{}
let off=preference.matches||override==='off';
const film=document.querySelector('.cinema-film');
const filmCanvas=document.querySelector('.film-canvas');
const filmCtx=filmCanvas?.getContext('2d',{alpha:true});
const filmBackgrounds=[...document.querySelectorAll('.film-bg-layer')];
const filmChapters=[...document.querySelectorAll('.film-chapter')];
const filmProducts=[...document.querySelectorAll('.film-product')];
const filmNav=[...document.querySelectorAll('[data-film-goto]')];
const filmCurrent=document.querySelector('.film-current');
const filmProgress=document.querySelector('.film-progress i');
const filmAtmosphere=document.querySelector('.film-atmosphere');
const filmNames=['INTRO','LUNA','SATURN','VENUS','MARS','EARTH','NEPTUNE','UNIVERSE'];
const filmColors=['170,190,218','165,187,217','218,176,106','219,192,190','190,102,67','112,156,125','94,142,221','188,204,228'];
const productPoses=[
 null,{x:.69,y:.60,s:.83,r:-4},{x:.28,y:.61,s:1.02,r:6},{x:.70,y:.57,s:.78,r:-1},
 {x:.27,y:.62,s:.94,r:-7},{x:.72,y:.62,s:.80,r:4},{x:.75,y:.59,s:.90,r:-2}
];
const filmParticles=Array.from({length:120},(_,i)=>({x:(i*73%101)/101,y:(i*47%97)/97,z:.25+(i*31%73)/73,r:.4+(i%5)*.22}));
let filmFrame=false;
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
function resizeFilm(){
 if(!filmCanvas)return;const dpr=Math.min(devicePixelRatio||1,1.5);const r=filmCanvas.getBoundingClientRect();
 filmCanvas.width=Math.max(1,Math.round(r.width*dpr));filmCanvas.height=Math.max(1,Math.round(r.height*dpr));filmCtx.setTransform(dpr,0,0,dpr,0,0);
}
function drawFilmFx(pos,progress){
 if(!filmCtx||off)return;const w=filmCanvas.clientWidth,h=filmCanvas.clientHeight;filmCtx.clearRect(0,0,w,h);
 const idx=Math.round(pos),rgb=filmColors[idx]||filmColors[0];filmCtx.save();filmCtx.globalCompositeOperation='screen';
 for(const p of filmParticles){const x=((p.x+progress*p.z*.17)%1)*w,y=((p.y-progress*p.z*.08+1)%1)*h;const a=.08+.18*p.z;filmCtx.fillStyle=`rgba(${rgb},${a})`;filmCtx.beginPath();filmCtx.arc(x,y,p.r*(.7+p.z),0,Math.PI*2);filmCtx.fill();}
 const saturn=clamp(1-Math.abs(pos-2)*1.6);if(saturn){filmCtx.strokeStyle=`rgba(221,183,113,${saturn*.28})`;filmCtx.lineWidth=1.2;for(let i=0;i<4;i++){filmCtx.beginPath();filmCtx.ellipse(w*.54,h*.55,w*(.34+i*.04),h*(.08+i*.012),-.24,0,Math.PI*2);filmCtx.stroke();}}
 const liquid=Math.max(clamp(1-Math.abs(pos-1)*1.5),clamp(1-Math.abs(pos-6)*1.5));if(liquid){filmCtx.strokeStyle=`rgba(177,209,241,${liquid*.16})`;filmCtx.lineWidth=1;for(let i=0;i<7;i++){filmCtx.beginPath();for(let x=0;x<=w;x+=30){const y=h*(.74+i*.028)+Math.sin(x*.012+progress*18+i)*9*liquid;x?filmCtx.lineTo(x,y):filmCtx.moveTo(x,y);}filmCtx.stroke();}}
 const dust=clamp(1-Math.abs(pos-4)*1.8);if(dust){filmCtx.fillStyle=`rgba(203,104,62,${dust*.16})`;for(let i=0;i<45;i++){const x=((i*97+progress*1300)%w),y=h*.25+((i*53)%Math.round(h*.7));filmCtx.fillRect(x,y,1.5+(i%3),1.5+(i%3));}}
 filmCtx.restore();
}
function renderFilm(){
 filmFrame=false;if(!film||off)return;
 const total=Math.max(1,film.offsetHeight-innerHeight);const progress=clamp((scrollY-film.offsetTop)/total);const pos=progress*7;const active=Math.round(pos);
 filmBackgrounds.forEach((el,i)=>{const target=Math.min(pos,6),d=Math.abs(target-i);const o=clamp(1-d);el.style.opacity=o;el.style.transform=`scale(${1.08+d*.045+progress*.025}) translate3d(${(i-target)*2.2}%,${(i-target)*1.1}%,0)`;el.style.filter=`saturate(${.66+o*.34}) brightness(${.44+o*.34}) blur(${Math.max(0,d-0.4)*5}px)`;});
 filmChapters.forEach((el,i)=>{const d=Math.abs(pos-i);const o=clamp(1-d*1.55);el.style.opacity=o;el.style.transform=i===7?`translate3d(-50%,${-43+(i-pos)*11}%,0)`:`translate3d(0,${-42+(i-pos)*12}%,0)`;el.classList.toggle('is-active',o>.65);});
 filmProducts.forEach((el,n)=>{const i=n+1,d=Math.abs(pos-i),o=clamp(1-d*1.65),pose=productPoses[i];const mobile=innerWidth<701;const x=mobile?.56:pose.x,y=mobile?.71:pose.y,s=(mobile?.74:pose.s)*(1+(pos-i)*.055);el.style.opacity=o;el.style.left=`${x*100}%`;el.style.top=`${y*100}%`;el.style.transform=`translate3d(-50%,-50%,0) scale(${s}) rotate(${pose.r+(pos-i)*4}deg)`;el.style.filter=`brightness(${.66+o*.34}) saturate(${.65+o*.35}) blur(${Math.max(0,d-.55)*5}px)`;});
 filmNav.forEach((el,i)=>el.classList.toggle('is-active',active===i+1));if(filmCurrent)filmCurrent.textContent=`${String(active).padStart(2,'0')} — ${filmNames[active]}`;if(filmProgress)filmProgress.style.width=`${progress*100}%`;
 if(filmAtmosphere){filmAtmosphere.style.transform=`translate3d(${-progress*9}%,${Math.sin(progress*Math.PI*5)*2}%,0) scale(${1+progress*.08})`;filmAtmosphere.style.opacity=.10+Math.sin(progress*Math.PI*7)**2*.18;}
 drawFilmFx(pos,progress);
}
function scheduleFilm(){if(!filmFrame&&!off){filmFrame=true;requestAnimationFrame(renderFilm);}}
filmNav.forEach(link=>link.addEventListener('click',e=>{e.preventDefault();const i=Number(link.dataset.filmGoto);scrollTo({top:film.offsetTop+(film.offsetHeight-innerHeight)*(i/7),behavior:off?'auto':'smooth'});}));
document.querySelectorAll('a[href$="-frame"]').forEach(link=>link.addEventListener('click',e=>{const target=document.querySelector(link.getAttribute('href'));if(!target||!film)return;e.preventDefault();const i=Number(target.dataset.filmIndex);scrollTo({top:film.offsetTop+(film.offsetHeight-innerHeight)*(i/7),behavior:off?'auto':'smooth'});}));
resizeFilm();
const motionButton=document.querySelector('#motion-toggle');
const scenes=[...document.querySelectorAll('.world-scene')];let visible=new Set();let pending=false;
const observer='IntersectionObserver' in window?new IntersectionObserver(entries=>entries.forEach(e=>e.isIntersecting?visible.add(e.target):visible.delete(e.target)),{rootMargin:'100px'}):null;
scenes.forEach(s=>observer?observer.observe(s):visible.add(s));
function renderMotion(){pending=false;if(off)return;for(const scene of visible){const r=scene.getBoundingClientRect();const p=Math.max(-1,Math.min(1,r.top/innerHeight));const img=scene.querySelector('.scene-image');img.style.transform=`scale(${1.06+(1-p)*.025}) translateY(${p*14}px)`;const pack=scene.querySelector('.scene-pack');pack.style.transform=`translateY(${p*26}px) rotate(${scene.id==='saturn'?5:-4}deg)`;}}
function schedule(){if(!off&&!pending){pending=true;requestAnimationFrame(renderMotion);}}
function setMotion(){document.documentElement.classList.toggle('motion-off',off);motionButton.textContent=`Движение: ${off?'выкл.':'вкл.'}`;motionButton.setAttribute('aria-pressed',String(off));schedule();scheduleFilm();}
motionButton?.addEventListener('click',()=>{off=!off;try{localStorage.setItem('moonvit-motion',off?'off':'on');}catch{}setMotion();});
preference.addEventListener('change',e=>{off=e.matches;setMotion();});
addEventListener('scroll',()=>{schedule();scheduleFilm()},{passive:true});addEventListener('resize',()=>{resizeFilm();schedule();scheduleFilm()},{passive:true});setMotion();scheduleFilm();
document.querySelectorAll('.contact-form').forEach(form=>form.addEventListener('submit',e=>{
 e.preventDefault();if(!form.reportValidity())return;
 const data=new FormData(form);const subject=data.get('topic')||'Обращение в Moonvit';
 const body=`Имя: ${data.get('name')}\nEmail: ${data.get('email')}\n${data.get('company')?'Компания: '+data.get('company')+'\n':''}\n${data.get('message')}`;
 const url=`mailto:pr@moonvit.space?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
 const status=form.querySelector('.form-status');status.replaceChildren();
 const note=document.createElement('p');note.textContent='Письмо подготовлено. Отправьте его из своей почтовой программы. Если она не открылась, скопируйте текст и отправьте на pr@moonvit.space.';
 const copy=document.createElement('button');copy.type='button';copy.className='button button-outline';copy.textContent='Скопировать письмо';copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(subject+'\n\n'+body);copy.textContent='Скопировано';}catch{const text=document.createElement('textarea');text.value=subject+'\n\n'+body;status.append(text);text.select();}});
 status.append(note,copy);window.location.href=url;
}));

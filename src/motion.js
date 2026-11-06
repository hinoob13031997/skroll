// Site-wide motion, independent of the WebGL journey. Native animations add no runtime dependency.
(()=>{
 const root=document.documentElement,preference=matchMedia('(prefers-reduced-motion: reduce)');
 const fine=matchMedia('(hover: hover) and (pointer: fine)');
 const animations=new Set(),seen=new WeakSet();let observer;
 const enabled=()=>!preference.matches&&!root.classList.contains('motion-off');
 const animate=(el,frames,options={})=>{
  if(!enabled()||!el.animate)return;
  const animation=el.animate(frames,{duration:850,easing:'cubic-bezier(.16,1,.3,1)',...options});
  animations.add(animation);animation.finished.catch(()=>{}).finally(()=>animations.delete(animation));return animation;
 };
 const reveal=el=>{
  if(seen.has(el))return;seen.add(el);
  animate(el,[{opacity:0,transform:'translate3d(0,30px,0)'},{opacity:1,transform:'translate3d(0,0,0)'}],{delay:Number(el.dataset.motionDelay||0)});
 };
 const targets=[...document.querySelectorAll([
  '.page-head>h1','.page-head>p','.product-copy>h1','.product-copy>.product-tagline',
  '.product-copy>.product-sub','.product-copy>.effect-list','.product-copy>.price','.product-copy>.buy-row',
  '.section-heading','.hr-heading','.hr-ritual-copy','.hr-gummies','.hr-steps article',
  '.product-card','.hr-card','.journal-grid>a','.trio-card','.component-grid>li','.pillars>article',
  '.three-cols>article','.partner-gets>h2','.partner-gets li','.reviews>blockquote','.review-note',
  '.hr-route-copy','.hr-quiz','.hr-faq>div','.contact-grid>div','.contact-form','.buy-grid>a',
  '.facts>dl','.prose>h2','.prose>p','.footer-top','.footer-links>nav'
 ].join(','))].filter(el=>!el.closest('.voyage,dialog,.sys-worlds'));
 // Only sibling groups stagger. Text becomes visible even if animation support is absent.
 targets.forEach(el=>{const siblings=[...el.parentElement.children];el.dataset.motionDelay=String(Math.min(siblings.indexOf(el)%4,3)*75)});
 function observe(){
  observer?.disconnect();if(root.classList.contains('motion-ready')!==enabled())root.classList.toggle('motion-ready',enabled());
  if(!enabled()){animations.forEach(a=>a.cancel());return}
  if(!('IntersectionObserver' in window)){targets.forEach(reveal);return}
  observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
   if(entry.isIntersecting){reveal(entry.target);observer.unobserve(entry.target)}
  }),{threshold:.08});targets.filter(el=>!seen.has(el)).forEach(el=>observer.observe(el));
 }
 // The orbit is a recurring Moonvit visual, not another planet slideshow.
 document.querySelectorAll('.page-head,.product-hero,.hr-ritual').forEach(host=>{
  const orbit=document.createElement('div');orbit.className='motion-orbit';orbit.setAttribute('aria-hidden','true');
  orbit.innerHTML='<i></i><i></i><i></i>';host.append(orbit);
 });
 const intro=document.querySelector('.header');
 if(intro)animate(intro,[{opacity:0,transform:'translateY(-16px)'},{opacity:1,transform:'translateY(0)'}],{duration:750});
 const cards=document.querySelectorAll('.card-image,.hr-card-art,.trio-card,.journal-grid>a>img');
 cards.forEach(card=>{
  let frame=0,x=0,y=0;card.classList.add('motion-depth');
  const reset=()=>{cancelAnimationFrame(frame);frame=0;card.style.setProperty('--tilt-x','0deg');card.style.setProperty('--tilt-y','0deg')};
  card.addEventListener('pointermove',event=>{
   if(!enabled()||!fine.matches)return;const r=card.getBoundingClientRect();
   x=(event.clientY-r.top)/r.height-.5;y=(event.clientX-r.left)/r.width-.5;
   if(!frame)frame=requestAnimationFrame(()=>{frame=0;card.style.setProperty('--tilt-x',`${(-x*5).toFixed(2)}deg`);card.style.setProperty('--tilt-y',`${(y*7).toFixed(2)}deg`)});
  },{passive:true});card.addEventListener('pointerleave',reset);
 });
 const buttons='.button,.vg-start,.vg-catalog,.chip,.hr-button,.hr-save,.hr-filters button,.state-options button';
 document.addEventListener('pointerdown',event=>{
  if(!enabled())return;const button=event.target.closest(buttons);if(!button)return;
  const r=button.getBoundingClientRect(),size=Math.max(r.width,r.height)*2;
  const ripple=document.createElement('span');ripple.className='motion-ripple';ripple.setAttribute('aria-hidden','true');
  Object.assign(ripple.style,{width:`${size}px`,height:`${size}px`,left:`${event.clientX-r.left-size/2}px`,top:`${event.clientY-r.top-size/2}px`});
  button.append(ripple);const a=animate(ripple,[{transform:'scale(0)',opacity:.25},{transform:'scale(1)',opacity:0}],{duration:700,easing:'ease-out'});
  if(a)a.finished.catch(()=>{}).finally(()=>ripple.remove());else ripple.remove();
 },{passive:true});
 document.querySelectorAll('details').forEach(details=>details.addEventListener('toggle',()=>{
  if(details.open)[...details.children].filter(el=>el.tagName!=='SUMMARY').forEach(el=>animate(el,[{opacity:0,transform:'translateY(-10px)'},{opacity:1,transform:'translateY(0)'}],{duration:450}));
 }));
 const menu=document.querySelector('.mobile-menu');
 if(menu)new MutationObserver(()=>{if(!menu.hidden)animate(menu,[{opacity:0,transform:'translateY(-14px)'},{opacity:1,transform:'translateY(0)'}],{duration:450})}).observe(menu,{attributes:true,attributeFilter:['hidden']});
 document.querySelectorAll('dialog').forEach(dialog=>new MutationObserver(()=>{
  if(dialog.open)animate(dialog,[{opacity:0,transform:'translateY(22px) scale(.97)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:420});
 }).observe(dialog,{attributes:true,attributeFilter:['open']}));
 // Off-screen ambient decoration pauses rather than running animation throughout a long page.
 if('IntersectionObserver' in window){const ambient=new IntersectionObserver(entries=>entries.forEach(entry=>entry.target.classList.toggle('motion-in-view',entry.isIntersecting)),{rootMargin:'80px'});document.querySelectorAll('.page-head,.product-hero,.hr-ritual,.jar-lineup').forEach(host=>ambient.observe(host))}
 document.addEventListener('visibilitychange',()=>root.classList.toggle('motion-paused',document.hidden));
 new MutationObserver(observe).observe(root,{attributes:true,attributeFilter:['class']});
 preference.addEventListener('change',observe);
 observe();
})();

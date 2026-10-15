export const questions=[
 {key:'goal',title:'Что хочется поддержать?',options:[['luna','Сон и расслабление'],['saturn','Энергия и иммунитет'],['venus','Женский баланс'],['mars','Мужской ресурс'],['earth','Кожа, волосы и ногти'],['neptune','Коллаген и биотин']]},
 {key:'time',title:'Когда удобнее твой ритуал?',options:[['morning','Утром'],['day','Днём'],['evening','Вечером'],['flex','В любое время']]},
 {key:'caffeine',title:'Как относишься к кофеину?',options:[['yes','Кофеин мне подходит'],['no','Предпочитаю без кофеина']]}
];
export function recommend({goal,time,caffeine}){
 if(!questions[0].options.some(([id])=>id===goal)||!questions[1].options.some(([id])=>id===time)||!questions[2].options.some(([id])=>id===caffeine))return null;
 return {id:goal,conflict:goal==='saturn'&&(time==='evening'||caffeine==='no')};
}

function initHome(){
 const root=document.querySelector('[data-home-rest]');if(!root)return;
 const $=s=>root.querySelector(s),$$=s=>[...root.querySelectorAll(s)];
 const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const products=JSON.parse($('#home-products').textContent),byId=Object.fromEntries(products.map(p=>[p.id,p]));
 const state={step:0,goal:null,time:null,caffeine:null};
 const productDialog=$('[data-product-dialog]'),bagDialog=$('[data-bag-dialog]');
 let currentProduct=null,opener=null,toastTimer,saved=new Set();
 try{const value=JSON.parse(localStorage.getItem('moonvit-set')||'[]');if(Array.isArray(value))saved=new Set(value.filter(id=>byId[id]));}catch{}
 function notify(message){$('[data-home-status]').textContent=message;for(const dialog of [productDialog,bagDialog])if(dialog.open)dialog.querySelector('[data-dialog-status]').textContent=message;clearTimeout(toastTimer);toastTimer=setTimeout(()=>{$('[data-home-status]').textContent='';},3200);}
 function renderSaved(){
  $$('[data-bag-count]').forEach(el=>el.textContent=saved.size);
  $$('[data-save]').forEach(button=>{const active=saved.has(button.dataset.save);button.setAttribute('aria-pressed',String(active));button.setAttribute('aria-label',`${active?'Убрать':'Добавить'} ${byId[button.dataset.save].name} ${active?'из набора':'в набор'}`);button.textContent=active?'✓':'+';});
  if(currentProduct)$('[data-dialog-save]').textContent=saved.has(currentProduct)?'Убрать из набора':'Добавить в набор';
  $('[data-bag-items]').innerHTML=saved.size?[...saved].map(id=>{const p=byId[id];return `<article class="hr-bag-item"><img src="${escape(p.image)}" width="64" height="78" alt=""><div><h3>${escape(p.name)}</h3><p>${escape(p.title)}</p><a href="${escape(p.official)}" target="_blank" rel="noopener noreferrer">Купить на Moonvit ↗</a></div><button type="button" data-save="${id}" aria-label="Убрать ${escape(p.name)} из набора">Убрать</button></article>`;}).join(''):'<p class="hr-bag-empty">Добавь понравившиеся комплексы из каталога, чтобы сохранить свой выбор.</p>';
 }
 function toggleSaved(id){if(!byId[id])return;const fromBag=bagDialog.open&&document.activeElement?.matches('[data-save]');const active=saved.has(id);active?saved.delete(id):saved.add(id);try{localStorage.setItem('moonvit-set',JSON.stringify([...saved]));}catch{}renderSaved();if(fromBag)(bagDialog.querySelector('[data-save]')||bagDialog.querySelector('.hr-close')).focus({preventScroll:true});notify(`${byId[id].name}: ${active?'убрано из набора':'добавлено в набор'}`);}
 function filterCatalog(filter,announce=true){
  let count=0;$$('[data-card]').forEach(card=>{card.hidden=filter!=='all'&&card.dataset.group!==filter&&card.dataset.card!==filter;if(!card.hidden)count++;});
  $$('[data-filter]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.filter===filter)));
  if(announce)$('[data-filter-status]').textContent=`Комплексов: ${count}`;
 }
 function showDialog(dialog,source){opener=source;dialog.querySelector('[data-dialog-status]').textContent='';dialog.showModal();document.documentElement.classList.add('hr-dialog-open');dialog.querySelector('.hr-close').focus({preventScroll:true});}
 function openProduct(id,source){const p=byId[id];if(!p)return;currentProduct=id;
  $('[data-dialog-image]').src=p.image;$('[data-dialog-image]').alt=`Moonvit ${p.name}`;
  for(const [key,value] of Object.entries({name:p.name,title:p.title,description:p.description,taste:p.taste,time:p.time}))$(`[data-dialog-${key}]`).textContent=value;
  $('[data-dialog-composition]').innerHTML=p.composition.map(line=>`<li>${escape(line)}</li>`).join('');
  $('[data-dialog-warning]').textContent=id==='saturn'?'Содержит кофеин: 15 мг по опубликованному составу. Учитывай другие источники кофеина и индивидуальную чувствительность.':id==='venus'?'В опубликованном составе не указано количество B12. Уточни его по актуальной этикетке.':'';
  $('[data-dialog-url]').href=p.url;renderSaved();showDialog(productDialog,source);
 }
 function renderQuiz(focus=false){
  const result=state.step===questions.length;
  $('[data-route-step]').textContent=result?'Твоя отправная точка':`Вопрос ${state.step+1} из 3`;
  $('[data-route-reset]').hidden=state.step===0;$('[data-route-back]').hidden=state.step===0;
  $('[data-route-progress]').style.width=`${Math.min(state.step+1,3)/3*100}%`;
  $('.hr-progress').setAttribute('aria-valuenow',String(Math.min(state.step+1,3)));
  if(result){
   const match=recommend(state),p=byId[match.id],time={morning:'утром',day:'днём',evening:'вечером',flex:'в любое время'}[state.time];
   $('[data-route-content]').innerHTML=`<div class="hr-result"><div class="hr-result-top"><img src="${escape(p.image)}" width="100" height="120" alt="Moonvit ${escape(p.name)}"><div><p class="hr-label">${escape(p.name)}</p><h3 tabindex="-1" data-question-title>${match.conflict?'Проверь свой выбор':escape(p.title)}</h3></div></div><p>Твой ритуал — ${time}. ${escape(p.time)}.</p>${match.conflict?'<p class="hr-conflict">Saturn содержит кофеин и рассчитан на первую половину дня. Он не соответствует выбранному времени или предпочтению без кофеина. Посмотри другие направления в каталоге.</p><a class="hr-button" href="#catalog" data-show-all>Посмотреть другие комплексы</a>':`<p>${escape(p.description)}</p><a class="hr-button" href="${escape(p.url)}" data-product="${p.id}">Открыть состав и приём</a>`}</div>`;
  }else{const q=questions[state.step];$('[data-route-content]').innerHTML=`<h3 tabindex="-1" data-question-title>${escape(q.title)}</h3><div class="hr-answers">${q.options.map(([value,label])=>`<button type="button" data-answer="${value}" aria-pressed="${state[q.key]===value}">${escape(label)}</button>`).join('')}</div>`;}
  if(focus)$('[data-question-title]').focus({preventScroll:true});
 }
 for(const dialog of [productDialog,bagDialog]){
  const status=document.createElement('p');status.className='hr-dialog-status';status.dataset.dialogStatus='';status.setAttribute('role','status');(dialog.querySelector('.hr-dialog-copy')||dialog).append(status);
  dialog.addEventListener('close',()=>{document.documentElement.classList.remove('hr-dialog-open');if(opener?.isConnected)opener.focus({preventScroll:true});});
  dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();});
 }
 root.addEventListener('click',event=>{
  const button=event.target.closest('button,a');if(!button)return;
  if(button.matches('[data-product]')){event.preventDefault();openProduct(button.dataset.product,button);}
  else if(button.matches('[data-filter]'))filterCatalog(button.dataset.filter);
  else if(button.matches('[data-answer]')){state[questions[state.step].key]=button.dataset.answer;state.step++;renderQuiz(true);}
  else if(button.matches('[data-route-reset]')){Object.assign(state,{step:0,goal:null,time:null,caffeine:null});renderQuiz(true);}
  else if(button.matches('[data-route-back]')){state.step=Math.max(0,state.step-1);renderQuiz(true);}
  else if(button.matches('[data-save]'))toggleSaved(button.dataset.save);
  else if(button.matches('[data-dialog-save]'))toggleSaved(currentProduct);
  else if(button.matches('[data-open-bag]')){renderSaved();showDialog(bagDialog,button);}
  else if(button.matches('[data-close-bag],[data-bag-catalog]'))bagDialog.close();
  else if(button.matches('[data-close-product]'))productDialog.close();
  else if(button.matches('[data-show-all]'))filterCatalog('all');
 });
 $('.hr-filters').hidden=false;$$('[data-save],[data-open-bag]').forEach(button=>button.hidden=false);renderSaved();renderQuiz();
}
if(typeof document!=='undefined')initHome();

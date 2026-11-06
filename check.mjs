import {readFile,readdir,stat} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import {recommend} from './src/home.js';

async function walk(p){let files=[];for(const e of await readdir(p,{withFileTypes:true}))files.push(...(e.isDirectory()?await walk(p+'/'+e.name):[p+'/'+e.name]));return files;}
let build;
try{build=JSON.parse(await readFile('dist/build-info.json','utf8'));}
catch{console.error('Missing build-info.json: run node build.mjs before checking or publishing.');process.exit(1);}
const {basePath='',siteUrl,routes}=build;
assert.ok(Array.isArray(routes)&&siteUrl,'Invalid build manifest');
const files=await walk('dist');let checked=0;const errors=[];
const worldIds=['luna','saturn','venus','mars','earth','neptune'];
const required=['/','/gallery/','/catalog/','/about/','/contacts/','/partners/','/journal/',...worldIds.map(id=>`/worlds/${id}/`)];
for(const route of required)if(!routes.includes(route))errors.push(`Missing route in build: ${route}`);
for(const route of routes){
 const file='dist'+(route==='/'?'/index.html':route+'index.html');
 try{
  const html=await readFile(file,'utf8');
  if(!html.includes(`rel="canonical" href="${siteUrl+route}"`))errors.push(`${file}: incorrect canonical URL`);
 }catch{errors.push(`Missing generated page: ${route}`);}
}

async function checkLocal(value,file,html=''){
 if((!value.startsWith('/')&&!value.startsWith('#'))||value.startsWith('//'))return;
 const [full,hash]=value.split('#');let path=full.split('?')[0];
 if(path&&basePath){
  if(path===basePath||path.startsWith(basePath+'/'))path=path.slice(basePath.length)||'/';
  else{errors.push(`${file}: link escapes deployment path ${value}`);return;}
 }
 let target=path?resolve('dist','.'+decodeURIComponent(path)):resolve(file);
 if(path?.endsWith('/'))target+='/index.html';
 try{
  await stat(target);
  if(hash&&target.endsWith('.html')){
   const dest=target===resolve(file)?html:await readFile(target,'utf8');
   if(!dest.includes(`id="${decodeURIComponent(hash)}"`))errors.push(`${file}: missing anchor ${value}`);
  }
 }catch{errors.push(`${file}: missing local file ${value}`);}
 checked++;
}

for(const file of files.filter(f=>f.endsWith('.html'))){
 const html=await readFile(file,'utf8');
 if((html.match(/<h1\b/g)||[]).length!==1)errors.push(file+': expected one h1');
 if(!html.includes('name="description"')||!html.includes('rel="canonical"'))errors.push(file+': missing SEO');
 if(html.includes('без кофеина')||html.includes('Сон + Стресс'))errors.push(file+': old conflicting claim');
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);if(new Set(ids).size!==ids.length)errors.push(file+': duplicate IDs');
 // data-*-src remains inert until its WebGL loading queue starts it, but must still exist in the artifact.
 for(const m of html.matchAll(/(?:href|(?:data-[\w-]+-)?src)="([^"]+)"/g))await checkLocal(m[1],file,html);
 for(const m of html.matchAll(/\bsrcset="([^"]+)"/g))for(const candidate of m[1].split(','))await checkLocal(candidate.trim().split(/\s+/)[0],file,html);
}
for(const file of files.filter(f=>f.endsWith('.css'))){
 const css=await readFile(file,'utf8');
 for(const m of css.matchAll(/url\(['"]?([^'"\)]+)['"]?\)/g))await checkLocal(m[1],file);
}

const gallery=await readFile('dist/gallery/index.html','utf8');
assert.match(gallery,/<section class="gx"/,'/gallery/ must contain the gallery, not a redirect or home page');
assert.ok(gallery.includes(`src="${basePath}/gallery.js?`),'Gallery script must use the deployment path');
assert.ok(!gallery.includes('http-equiv="refresh"'),'Gallery must not redirect to the flight');
for(const id of worldIds)assert.ok(gallery.includes(`class="gx-item" data-world="${id}"`),`Missing gallery world: ${id}`);
const sitemap=await readFile('dist/sitemap.xml','utf8');
assert.ok(sitemap.includes(`<loc>${siteUrl}/gallery/</loc>`),'Gallery must be discoverable in sitemap');

const read=id=>readFile(`dist/worlds/${id}/index.html`,'utf8');
assert.match(await read('saturn'),/Кофеин<\/td><td>15 мг/);
assert.match(await read('earth'),/Коллаген гидролизованный<\/td><td>220,8 мг/);
assert.match(await read('neptune'),/Коллаген гидролизованный<\/td><td>2000 мг/);
assert.match(await read('venus'),/Витамин B12<\/td><td>Количество не указано/);
assert.ok(!(await read('earth')).includes('Коллаген гидролизованный</td><td>2000 мг'));

// Preserve the live home/quiz/gummy checks while validating deployment-prefixed product data too.
const home=await readFile('dist/index.html','utf8');
const sectionIds=['ritual','catalog','route','home-faq-title'];
for(let i=1;i<sectionIds.length;i++)assert.ok(home.indexOf(`id="${sectionIds[i-1]}"`)<home.indexOf(`id="${sectionIds[i]}"`),'Home: order after the flight');
assert.equal((home.match(/data-card="/g)||[]).length,6,'Home: six server-rendered product cards');
assert.ok(home.includes(`type="module" src="${basePath}/home.js?v=`));
const data=JSON.parse(home.match(/id="home-products">([^<]+)<\/script>/)[1]);
assert.equal(data.length,6);assert.equal(new Set(data.map(p=>p.id)).size,6);
for(const p of data){assert.ok(p.composition.length>0);assert.ok(p.url.startsWith(basePath+'/worlds/'));}
assert.ok(!home.includes('home-final-title'),'No repeated final billboard below the FAQ');
assert.equal((home.match(/Шесть миров\. Один ты\./g)||[]).length,1,'The finale appears once, inside the flight');
assert.match(home,/data-gummies-viewer/);assert.ok(!home.includes('data-gummy-action='),'No arrow/reset button panel below the gummies');
assert.match(home,/assets\/fonts\/onest-variable\.ttf/);assert.ok(!home.includes('fonts.googleapis.com'),'Fonts are self-hosted');
assert.match(home,/hero-clean-v2\.webp/);
assert.match(home,/id="worlds"/);
assert.ok(home.includes(`class="vg-catalog" href="${basePath}/catalog/"`),'A permanent catalog link must work under the deployment path');
assert.equal((home.match(/data-vg-src=/g)||[]).length,20,'Hidden film frames must remain deferred in HTML');
assert.equal((gallery.match(/data-gx-src=/g)||[]).length,12,'Gallery panels and detail backgrounds must remain deferred');
assert.match(home,/<span class="vg-component">витамин C<\/span>/,'Vitamin name and letter wrap together');
for(const goal of worldIds)for(const time of ['morning','day','evening','flex'])for(const caffeine of ['yes','no']){
 const result=recommend({goal,time,caffeine});assert.equal(result.id,goal);assert.equal(result.conflict,goal==='saturn'&&(time==='evening'||caffeine==='no'));
}
assert.equal(recommend({goal:'unknown',time:'morning',caffeine:'yes'}),null);
if(errors.length){console.error(errors.join('\n'));process.exit(1);}
const bytes=(await Promise.all(files.map(async f=>(await stat(f)).size))).reduce((a,b)=>a+b,0);
console.log(`PASS: ${routes.length} routes, ${files.filter(f=>f.endsWith('.html')).length} HTML documents, ${checked} local references, gallery, SEO, content and 48 quiz combinations${basePath?` under ${basePath}/`:''}. Total dist: ${(bytes/1024/1024).toFixed(2)} MB.`);

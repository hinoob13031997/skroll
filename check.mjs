import {readFile,readdir,stat} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import assert from 'node:assert/strict';
import {recommend} from './src/home.js';
async function walk(p){let files=[];for(const e of await readdir(p,{withFileTypes:true}))files.push(...(e.isDirectory()?await walk(p+'/'+e.name):[p+'/'+e.name]));return files;}
const files=await walk('dist');let checked=0;const errors=[];
for(const file of files.filter(f=>f.endsWith('.html'))){
 const html=await readFile(file,'utf8');
 if((html.match(/<h1\b/g)||[]).length!==1)errors.push(file+': expected one h1');
 if(!html.includes('name="description"')||!html.includes('rel="canonical"'))errors.push(file+': missing SEO');
 if(html.includes('без кофеина')||html.includes('Сон + Стресс'))errors.push(file+': old conflicting claim');
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);if(new Set(ids).size!==ids.length)errors.push(file+': duplicate IDs');
 for(const m of html.matchAll(/(?:href|src)="([^"]+)"/g)){
  const value=m[1];if(!value.startsWith('/')&&!value.startsWith('#'))continue;
  const [full,hash]=value.split('#'),path=full.split('?')[0];let target=path?resolve('dist','.'+path):resolve(file);
  if(path?.endsWith('/'))target+='/index.html';
  try{await stat(target);if(hash&&target.endsWith('.html')){const dest=target===resolve(file)?html:await readFile(target,'utf8');if(!dest.includes(`id="${hash}"`))errors.push(`${file}: missing anchor ${value}`);}}catch{errors.push(`${file}: missing local file ${value}`);}checked++;
 }
}
const read=id=>readFile(`dist/worlds/${id}/index.html`,'utf8');
assert.match(await read('saturn'),/Кофеин<\/td><td>15 мг/);
assert.match(await read('earth'),/Коллаген гидролизованный<\/td><td>220,8 мг/);
assert.match(await read('neptune'),/Коллаген гидролизованный<\/td><td>2000 мг/);
assert.match(await read('venus'),/Витамин B12<\/td><td>Количество не указано/);
assert.ok(!(await read('earth')).includes('Коллаген гидролизованный</td><td>2000 мг'));
// The home has real content without JS, and the quiz never ignores a caffeine/time conflict.
for(const file of ['dist/index.html','dist/gallery/index.html']){
 const html=await readFile(file,'utf8');
 const sectionIds=['ritual','catalog','route','home-faq-title','home-final-title'];
 for(let i=1;i<sectionIds.length;i++)assert.ok(html.indexOf(`id="${sectionIds[i-1]}"`)<html.indexOf(`id="${sectionIds[i]}"`),`${file}: order after the flight`);
 assert.equal((html.match(/data-card="/g)||[]).length,6,`${file}: six server-rendered product cards`);
 assert.match(html,/type="module" src="\/home\.js\?v=/);
 const data=JSON.parse(html.match(/id="home-products">([^<]+)<\/script>/)[1]);
 assert.equal(data.length,6);assert.equal(new Set(data.map(p=>p.id)).size,6);
 for(const p of data){assert.ok(p.composition.length>0);assert.ok(p.url.startsWith('/worlds/'));}
}
for(const goal of ['luna','saturn','venus','mars','earth','neptune'])for(const time of ['morning','day','evening','flex'])for(const caffeine of ['yes','no']){
 const result=recommend({goal,time,caffeine});assert.equal(result.id,goal);assert.equal(result.conflict,goal==='saturn'&&(time==='evening'||caffeine==='no'));
}
assert.equal(recommend({goal:'unknown',time:'morning',caffeine:'yes'}),null);
if(errors.length){console.error(errors.join('\n'));process.exit(1);}
const bytes=(await Promise.all(files.map(async f=>(await stat(f)).size))).reduce((a,b)=>a+b,0);
console.log(`PASS: ${files.filter(f=>f.endsWith('.html')).length} HTML documents, ${checked} local references, content corrections, SEO, unique IDs, post-flight sections and 48 quiz combinations. Total dist: ${(bytes/1024/1024).toFixed(2)} MB.`);

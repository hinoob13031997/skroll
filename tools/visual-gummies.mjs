// Explicitly user-authorized isolated Chromium QA. Does not attach to the person's browser/profile.
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const imageRequire=process.env.PLAYWRIGHT_MODULE?createRequire(resolve(process.env.PLAYWRIGHT_MODULE,'package.json')):require;
const sharp=imageRequire('sharp');
const out=resolve(process.argv[2]||'../../outputs'),label=process.argv[3]||'gummy-material';
await mkdir(out,{recursive:true});
const root=resolve('dist'),errors=[];
const fixture=`<!doctype html><html lang="ru"><head><meta charset="utf-8"><link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/home.css"><style>
 body{background:#080b13;padding:36px}.comparison{display:grid;grid-template-columns:1fr 1fr;gap:36px;max-width:1120px;margin:auto}h1,h2{font:400 20px Onest,Arial,sans-serif!important;letter-spacing:0!important;margin-bottom:28px}.reference{width:100%;aspect-ratio:3/2;object-fit:contain}.hr-gummies{max-width:none}.hr-gummies-stage{width:100%}.note{font-size:13px;color:#b3becf;margin-top:30px}.hr-gummies figcaption{min-height:28px}
 </style></head><body><main class="home-rest comparison"><section><h1>Прежний вид — ориентир</h1><img class="reference" src="/assets/gummies-3d-v3.webp" alt="Прежнее изображение пастилок"></section><section><h2>Объёмная модель</h2><figure class="hr-gummies"><div class="hr-gummies-stage" data-gummies-viewer role="group" aria-label="Пастилки"><img src="/assets/gummies-3d-v3.webp" alt="Резервное изображение"></div><figcaption>Загрузка модели</figcaption></figure></section></main><p class="note">Тестовый экран материала. Это не новый макет сайта.</p><script type="module">
 import {createGummyViewer} from '/gummies.js';const host=document.querySelector('[data-gummies-viewer]');
 try{window.gummyViewer=await createGummyViewer(host);if(!window.gummyViewer)host.dataset.state='failed';}catch(error){host.dataset.state='failed';console.error(error);}
 </script></body></html>`;
const mime={'.js':'text/javascript','.css':'text/css','.webp':'image/webp','.ttf':'font/ttf','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost');if(url.pathname==='/'){res.setHeader('Content-Type','text/html; charset=utf-8');return res.end(fixture);}
 const path=resolve(root,'.'+decodeURIComponent(url.pathname));if(!path.startsWith(root+sep)){res.writeHead(403);return res.end();}
 const body=await readFile(path);res.setHeader('Content-Type',mime[extname(path)]||'application/octet-stream');res.end(body);
 }catch{res.writeHead(404);res.end();}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser;
try{
 browser=await chromium.launch({executablePath:process.env.CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const context=await browser.newContext({viewport:{width:1200,height:660},deviceScaleFactor:Number(process.env.QA_DPR||1)});
 await context.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
 const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
 await page.goto(`http://127.0.0.1:${server.address().port}/`,{waitUntil:'load'});
 await page.waitForFunction(()=>['ready','failed'].includes(document.querySelector('[data-gummies-viewer]').dataset.state),{timeout:30000});
 const state=await page.locator('[data-gummies-viewer]').getAttribute('data-state');if(state!=='ready')throw Error('Viewer did not initialize: '+state+' '+errors.join('\n'));
 await page.screenshot({path:resolve(out,label+'-front.png')});
 const viewer=page.locator('[data-gummies-viewer]'),bounds=await viewer.boundingBox();
 await page.mouse.move(bounds.x+bounds.width*.25,bounds.y+bounds.height*.5);await page.mouse.down();await page.mouse.move(bounds.x+bounds.width*.25+bounds.width*.25,bounds.y+bounds.height*.48,{steps:16});await page.mouse.up();
 await page.waitForTimeout(650);await page.locator('h2').click();await page.screenshot({path:resolve(out,label+'-turned.png')});
 await viewer.dblclick();await page.waitForTimeout(500);await viewer.screenshot({path:resolve(out,label+'-detail.png')});
 // A width-long drag equals 2π. Hold before release to suppress inertia, then compare actual pixels.
 await page.locator('h2').click();const frontPixels=await viewer.screenshot();
 await page.mouse.move(bounds.x+8,bounds.y+bounds.height*.5);await page.mouse.down();
 const dragWidth=await viewer.evaluate(el=>el.clientWidth);
 await page.mouse.move(bounds.x+8+dragWidth,bounds.y+bounds.height*.5,{steps:36});await page.waitForTimeout(150);await page.mouse.up();await page.waitForTimeout(150);await page.locator('h2').click();
 const fullTurnPixels=await viewer.screenshot({path:resolve(out,label+'-360.png')});
 const original=await sharp(frontPixels).raw().toBuffer(),rotated=await sharp(fullTurnPixels).raw().toBuffer();
 let difference=0;for(let i=0;i<original.length;i++)difference+=Math.abs(original[i]-rotated[i]);const meanDifference=difference/original.length;
 if(meanDifference>.5)throw Error('Full 360-degree drag changed the render: mean pixel difference '+meanDifference);
 await viewer.focus();for(let i=0;i<12;i++)await page.keyboard.press('ArrowRight');await page.waitForTimeout(600);await page.locator('h2').click();await viewer.screenshot({path:resolve(out,label+'-back.png')});
 await viewer.focus();for(let i=0;i<6;i++)await page.keyboard.press('ArrowDown');await page.waitForTimeout(600);await page.locator('h2').click();await viewer.screenshot({path:resolve(out,label+'-underside.png')});
 await viewer.dblclick();await page.waitForTimeout(600);await page.locator('h2').click();await viewer.screenshot({path:resolve(out,label+'-detail.png')});
 // Inspect actual pixels at the poles, projection transitions and every quarter turn.
 const views=[['Спереди',-.12,.06],['Сверху',0,Math.PI/2-Math.atan(.7/8.1)],['Снизу',0,-Math.PI/2-Math.atan(.7/8.1)],
  ['Слева',Math.PI/2,.06],['Сзади',Math.PI,.06],['Справа',-Math.PI/2,.06],
  ['45° / наклон +46°',Math.PI/4,.8],['135° / наклон +46°',3*Math.PI/4,.8],['225° / наклон +46°',5*Math.PI/4,.8],['315° / наклон +46°',7*Math.PI/4,.8],
  ['45° / наклон −46°',Math.PI/4,-.8],['225° / наклон −46°',5*Math.PI/4,-.8]];
 const tiles=[];
 for(let i=0;i<views.length;i++){
  const [title,yaw,pitch]=views[i];await page.evaluate(()=>window.gummyViewer.rotate('reset'));await page.waitForTimeout(550);
  const b=await viewer.boundingBox(),w=await viewer.evaluate(el=>el.clientWidth),x=b.x+w*.5,y=b.y+b.height*.5;
  await page.mouse.move(x,y);await page.mouse.down();
  await page.mouse.move(x+(yaw+.12)*w/(2*Math.PI),y+(pitch-.06)*w/(2*Math.PI),{steps:8});
  await page.waitForTimeout(150);await page.mouse.up();await page.locator('h2').click();await page.waitForTimeout(80);
  const shot=await viewer.screenshot();
  if(i<3)await sharp(shot).toFile(resolve(out,label+'-'+['front-view','top','bottom'][i]+'.png'));
  const tile=await sharp(shot).resize(360,240).extend({top:30,bottom:0,left:0,right:0,background:'#080b13'}).png().toBuffer();
  const heading=Buffer.from(`<svg width="360" height="30"><text x="14" y="22" font-family="Arial,sans-serif" font-size="16" fill="#e5e8ee">${title}</text></svg>`);
  tiles.push({input:await sharp(tile).composite([{input:heading,top:0,left:0}]).png().toBuffer(),left:(i%4)*360,top:Math.floor(i/4)*270});
 }
 await sharp({create:{width:1440,height:810,channels:4,background:'#080b13'}}).composite(tiles).png().toFile(resolve(out,label+'-all-angles.png'));
 if(process.env.SITE_QA_URL){
  await context.addInitScript(()=>localStorage.setItem('moonvit-motion','off'));
  const site=await context.newPage();site.on('pageerror',error=>errors.push(error.message));
  await site.goto(process.env.SITE_QA_URL,{waitUntil:'load'});const actual=site.locator('[data-gummies-viewer]');await actual.scrollIntoViewIfNeeded();
  await site.waitForFunction(()=>document.querySelector('[data-gummies-viewer]')?.dataset.state==='ready',{timeout:30000});
  await site.screenshot({path:resolve(out,label+'-site.png')});
  await actual.screenshot({path:resolve(out,label+'-site-detail.png')});
  if(await actual.locator('button').count())throw Error('Unexpected visible gummy controls');
  await site.setViewportSize({width:390,height:844});await actual.scrollIntoViewIfNeeded();await site.waitForTimeout(300);
  await site.screenshot({path:resolve(out,label+'-mobile.png')});
  if(await site.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Horizontal overflow on the mobile page');
 }
 if(errors.length)throw Error(errors.join('\n'));
 console.log(JSON.stringify({state,errors,views:views.length,fullTurn:{meanPixelDifference:meanDifference,limit:.5},front:resolve(out,label+'-front.png'),turned:resolve(out,label+'-turned.png'),detail:resolve(out,label+'-detail.png')}));
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}

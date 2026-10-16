// Opt-in real Chromium touch/WebGL QA. Fresh profile; localhost build by default, QA_BASE_URL for a deployed site.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const imageRequire=process.env.PLAYWRIGHT_MODULE?createRequire(resolve(process.env.PLAYWRIGHT_MODULE,'package.json')):require,sharp=imageRequire('sharp');
const root=resolve('dist'),out=resolve(process.argv[2]||'../../outputs/mobile-fix');await mkdir(out,{recursive:true});
const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.webp':'image/webp','.svg':'image/svg+xml','.ttf':'font/ttf'};
const server=createServer(async(req,res)=>{try{let path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(path.endsWith('/'))path+='index.html';const file=resolve(root,'.'+path);
 if(!file.startsWith(root+sep)){res.writeHead(403);return res.end();}const data=await readFile(file);res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream'});res.end(data);
}catch{res.writeHead(404);res.end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=process.env.QA_BASE_URL||`http://127.0.0.1:${server.address().port}/`,allowedHost=new URL(base).hostname,errors=[],responses=[],warnings=new Set();let browser;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
function observe(page){page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'||m.type()==='warning'&&/ERROR:|GL_INVALID|failed to compile|context lost/i.test(m.text()))errors.push(m.text());else if(m.type()==='warning')warnings.add(m.text());});page.on('response',r=>{if(r.status()>=400)responses.push([r.status(),r.url()]);});}
async function scopedRoute(route){if(new URL(route.request().url()).hostname!==allowedHost)return route.abort();if(!process.env.QA_BASE_URL)return route.continue();
 // Managed host egress is available to Node, not directly to isolated Chrome. Relay actual public bytes,
 // keeping URL/origin intact; never replace deployed resources with local files.
 try{const response=await fetch(route.request().url()),headers=Object.fromEntries(response.headers);for(const key of ['content-encoding','content-length','transfer-encoding','connection'])delete headers[key];
  await route.fulfill({status:response.status,headers,body:Buffer.from(await response.arrayBuffer())});}catch{await route.abort();}
}
async function pixelDifference(a,b){const x=await sharp(a).raw().toBuffer(),y=await sharp(b).raw().toBuffer();assert.equal(x.length,y.length);let sum=0;for(let i=0;i<x.length;i++)sum+=Math.abs(x[i]-y[i]);return sum/x.length;}
async function drag(cdp,x,y,dx,dy){const point=(x,y)=>({x,y,id:1,radiusX:4,radiusY:4,force:1});await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point(x,y)]});
 for(let i=1;i<=16;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[point(x+dx*i/16,y+dy*i/16)]});await wait(16);}
 await wait(130);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await wait(200);
}
try{
 browser=await chromium.launch({executablePath:process.env.CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const touch=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1.5,isMobile:true,hasTouch:true});
 await touch.route('**/*',scopedRoute);
 await touch.addInitScript(()=>localStorage.setItem('moonvit-motion','off'));
 const page=await touch.newPage();observe(page);await page.goto(base+'#ritual',{waitUntil:'domcontentloaded'});
 const host=page.locator('[data-gummies-viewer]');await host.scrollIntoViewIfNeeded();await page.waitForFunction(()=>document.querySelector('[data-gummies-viewer]')?.dataset.state==='ready');await page.evaluate(()=>document.fonts.ready);
 assert.equal(await host.evaluate(e=>getComputedStyle(e).touchAction),'pinch-zoom');assert.equal(await page.evaluate(()=>navigator.maxTouchPoints>0),true);
 const cdp=await touch.newCDPSession(page),canvas=host.locator('canvas'),metrics={};
 await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5});
 await page.evaluate(()=>{window.touchEvents=[];for(const type of ['pointerdown','pointermove','pointercancel','pointerup'])document.querySelector('[data-gummies-viewer]').addEventListener(type,e=>window.touchEvents.push({type,pointerType:e.pointerType}));});
 const reset=async()=>{await host.focus();await page.keyboard.press('Home');await page.evaluate(()=>document.activeElement.blur());await wait(100);};
 const pose=async()=>{await host.scrollIntoViewIfNeeded();return host.boundingBox();};
 await reset();await page.screenshot({path:resolve(out,'touch-front.png')});
 for(const [name,dx,dy]of [['horizontal',110,0],['vertical',0,110],['diagonal',90,-70]]){
  await reset();const b=await pose(),before=await canvas.screenshot(),scroll=await page.evaluate(()=>scrollY);
  await drag(cdp,b.x+b.width*.5,b.y+b.height*.45,dx,dy);const after=await canvas.screenshot({path:resolve(out,'touch-'+name+'.png')});
  const difference=await pixelDifference(before,after);assert.ok(difference>2,name+' actually changes rendered model');assert.ok(Math.abs((await page.evaluate(()=>scrollY))-scroll)<2,name+' must not scroll the page');metrics[name]=difference;
 }
 for(const axis of ['horizontal','vertical']){
  await reset();const b=await pose(),width=await host.evaluate(e=>e.clientWidth),before=await canvas.screenshot();
  await drag(cdp,b.x+4,b.y+4,axis==='horizontal'?width:0,axis==='vertical'?width:0);
  const difference=await pixelDifference(before,await canvas.screenshot());assert.ok(difference<.5,axis+' full 360-degree touch turn returns to same view');metrics[axis+'360']=difference;
 }
 const beforeScroll=await page.evaluate(()=>scrollY);await drag(cdp,10,550,0,-200);assert.ok((await page.evaluate(()=>scrollY))>beforeScroll+50,'Outside the model the page still scrolls');
 await reset();await host.scrollIntoViewIfNeeded();
 const singleEvents=await page.evaluate(()=>window.touchEvents);assert.ok(singleEvents.some(e=>e.pointerType==='touch'&&e.type==='pointermove'));assert.ok(!singleEvents.some(e=>e.type==='pointercancel'),'One-finger model drags must not be cancelled by scrolling');
 const b=await host.boundingBox(),cy=b.y+b.height*.5,cx=b.x+b.width*.5;
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:cx-30,y:cy,id:1}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:cx-30,y:cy,id:1},{x:cx+30,y:cy,id:2}]});
 for(let i=1;i<=10;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:cx-30-i*3,y:cy,id:1},{x:cx+30+i*3,y:cy,id:2}]});await wait(20);}
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await wait(200);
 metrics.rawPinchScale=await page.evaluate(()=>visualViewport.scale);
 if(metrics.rawPinchScale<=1.05)await cdp.send('Input.synthesizePinchGesture',{x:cx,y:cy,scaleFactor:1.5,relativeSpeed:400,gestureSourceType:'touch'});
 await wait(200);metrics.pinchScale=await page.evaluate(()=>visualViewport.scale);console.log(JSON.stringify({pinch:metrics.pinchScale,events:await page.evaluate(()=>window.touchEvents.slice(-6))}));
 assert.ok(!await host.evaluate(e=>e.classList.contains('is-grabbing')),'Second finger releases the model interaction');
 await cdp.send('Emulation.setPageScaleFactor',{pageScaleFactor:1});
 await cdp.send('Input.synthesizePinchGesture',{x:195,y:120,scaleFactor:1.5,relativeSpeed:400,gestureSourceType:'touch'});await wait(200);
 metrics.bodyPinchScale=await page.evaluate(()=>visualViewport.scale);
 if(metrics.bodyPinchScale>1.05)assert.ok(metrics.pinchScale>1.05,'Native page zoom must also work over the model');
 else metrics.pinchLimitation='Headless input did not zoom even on the normal page body; CSS pinch-zoom and multi-touch handoff verified, actual iOS pinch remains unverified';
 await cdp.send('Emulation.setPageScaleFactor',{pageScaleFactor:1});await host.scrollIntoViewIfNeeded();await reset();await page.screenshot({path:resolve(out,'touch-mobile-page.png')});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 console.log(JSON.stringify({touch:'pass',metrics}));await touch.close();
 const film=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 await film.route('**/*',scopedRoute);
 await film.addInitScript(()=>{window.vgSnap=1;window.vgTime=9;});const movie=await film.newPage();observe(movie);await movie.goto(base,{waitUntil:'load'});
 await movie.waitForFunction(()=>document.querySelector('.voyage')?.classList.contains('is-gl'));
 await movie.waitForFunction(()=>[...document.querySelectorAll('.vg-img')].every(i=>i.complete&&i.naturalWidth>0));await wait(1200);
 const captures=[];
 async function frame(id,label,phase=id==='hero'?0:.1){await movie.evaluate(({id,phase})=>{const scenes=[...document.querySelectorAll('.vg-scene')],i=scenes.findIndex(s=>s.dataset.scene===id),vg=document.querySelector('.voyage'),stage=vg.querySelector('.vg-stage');
  window.vgP=i+phase;window.scrollTo({top:vg.offsetTop+(vg.offsetHeight-stage.clientHeight*1.7)*(i+phase)/(scenes.length-1),behavior:'instant'});},{id,phase});await wait(250);await movie.screenshot({path:resolve(out,label+'.png')});captures.push(label);console.log('Captured '+label);
  assert.equal(await movie.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,label+' horizontal bounds');
  if(id.startsWith('path-')&&phase<.2&&await movie.evaluate(()=>innerWidth<700)){
   const copy=await movie.locator(`[data-scene="${id}"] .vg-copy`).boundingBox(),skip=await movie.locator('.vg-skip').boundingBox();
   if(copy&&skip)assert.ok(copy.y+copy.height<skip.y-8,'Course caption stays above the skip button');
  }
 }
 for(const id of ['hero','path-saturn','path-venus','path-mars','path-earth','path-neptune','luna','saturn'])await frame(id,'phone-'+id);
 await frame('path-saturn','phone-saturn-transition',.7);
 await movie.setViewportSize({width:844,height:390});await frame('path-saturn','landscape-saturn');
 await movie.setViewportSize({width:1440,height:900});for(const id of ['hero','saturn'])await frame(id,'desktop-'+id);
 assert.deepEqual(errors,[]);assert.deepEqual(responses,[]);console.log(JSON.stringify({status:'pass',metrics,captures,errors,responses,warnings:[...warnings]}));
}finally{await browser?.close();await new Promise(r=>server.close(r));}

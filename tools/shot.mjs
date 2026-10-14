// Screenshots of the running site through headless Chrome (DevTools protocol, no dependencies).
// usage: node tools/shot.mjs <out-dir> <width>x<height> <url> [step ...]
//   step: "scroll:<screens>"  scroll to N screen heights and let the scene settle
//         "click:<x>,<y>"     click at a point (CSS px)
//         "wait:<ms>"         wait
//         "shot:<name>"       save <out-dir>/<name>.png
import {spawn} from 'node:child_process';
import {mkdirSync,writeFileSync,mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';import {join} from 'node:path';
const [out,size,url,...steps]=process.argv.slice(2);
const [w,h]=size.split('x').map(Number);
mkdirSync(out,{recursive:true});
const chrome=process.env.CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe';
const port=9300+Math.floor(Math.random()*500);
const proc=spawn(chrome,['--headless=new',`--remote-debugging-port=${port}`,`--window-size=${w},${h}`,'--hide-scrollbars','--use-angle=swiftshader','--enable-unsafe-swiftshader',`--user-data-dir=${mkdtempSync(join(tmpdir(),'shot-'))}`,'about:blank'],{stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let target;for(let i=0;i<50&&!target;i++){await sleep(200);try{target=(await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find(t=>t.type==='page')}catch{}}
const ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);
let id=0;const wait=new Map();ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&wait.has(m.id)){wait.get(m.id)(m);wait.delete(m.id)}};
const cmd=(method,params={})=>new Promise(r=>{const i=++id;wait.set(i,r);ws.send(JSON.stringify({id:i,method,params}))});
await cmd('Emulation.setDeviceMetricsOverride',{width:w,height:h,deviceScaleFactor:1,mobile:w<700});
await cmd('Page.enable');await cmd('Page.navigate',{url});await sleep(3500);
for(const s of steps){
 const [k,v]=s.split(/:(.*)/);
 if(k==='scroll'){await cmd('Runtime.evaluate',{expression:`document.documentElement.style.scrollBehavior='auto';scrollTo(0,Math.round(innerHeight*${v}))`});await sleep(1800)}
 if(k==='click'){const [x,y]=v.split(',').map(Number);for(const type of ['mouseMoved','mousePressed','mouseReleased'])await cmd('Input.dispatchMouseEvent',{type,x,y,button:'left',clickCount:1});await sleep(300)}
 if(k==='wait')await sleep(+v);
 if(k==='shot'){const r=await cmd('Page.captureScreenshot',{format:'png'});writeFileSync(join(out,v+'.png'),Buffer.from(r.result.data,'base64'));console.log('saved',v)}
}
ws.close();proc.kill();

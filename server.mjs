import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
const root=resolve('dist');
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.webp':'image/webp','.svg':'image/svg+xml','.xml':'application/xml','.txt':'text/plain; charset=utf-8','.json':'application/json'};
createServer(async(req,res)=>{
 try {
  let path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if(path!==root&&!path.startsWith(root+sep)){res.writeHead(403);return res.end();}
  try{if((await stat(path)).isDirectory())path=resolve(path,'index.html');}catch{}
  let data;try{data=await readFile(path);}catch{path=resolve(root,'404.html');data=await readFile(path);res.statusCode=404;}
  res.setHeader('Content-Type',types[extname(path)]||'application/octet-stream');
  res.setHeader('X-Content-Type-Options','nosniff');res.end(req.method==='HEAD'?undefined:data);
 }catch{res.writeHead(400);res.end('Bad request');}
}).listen(Number(process.env.PORT||4173),'127.0.0.1',()=>console.log('Local: http://127.0.0.1:4173'));

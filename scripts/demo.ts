import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {build} from 'esbuild';
import {evaluate} from '../src/providers.js';
import {requestSchema,VERSION} from '../src/core.js';
await build({stdin:{contents:"import React from 'react';import{createRoot}from'react-dom/client';import{BrandCheck}from'./src/ui';import './src/style.css';createRoot(document.getElementById('root')).render(React.createElement(BrandCheck));",resolveDir:process.cwd(),loader:'tsx'},bundle:true,outfile:'/tmp/sunagaku-brand-demo/app.js'});
createServer(async(req,res)=>{
 try{
  if(req.method==='POST'&&req.url==='/api/brand-check/analyze'){
   const chunks:Buffer[]=[];let size=0;
   for await(const chunk of req){const b=Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk);size+=b.length;if(size>16384){res.writeHead(413).end();return;}chunks.push(b);}
   const input=requestSchema.parse(JSON.parse(Buffer.concat(chunks).toString()));if(input.version!==VERSION){res.writeHead(409).end();return;}
   const key=process.env[input.provider==='decisions'?'OPENAI_API_KEY':'TYPESAFE_API_KEY'];if(!key){res.writeHead(503,{'Content-Type':'application/json'}).end(JSON.stringify({error:'この評価器のAPIキーをサーバーに設定してください。'}));return;}
   const result=await evaluate(input,{apiKey:key,signal:AbortSignal.timeout(12000)});res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'}).end(JSON.stringify(result));return;
  }
  if(req.url==='/app.js'||req.url==='/app.css'){res.writeHead(200,{'Content-Type':req.url.endsWith('.js')?'text/javascript':'text/css'}).end(await readFile('/tmp/sunagaku-brand-demo'+req.url));return;}
  res.writeHead(200,{'Content-Type':'text/html;charset=utf-8'}).end('<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Brand Check demo</title><link rel="stylesheet" href="/app.css"><body style="margin:0;background:#f4f6f1"><div id="root"></div><script type="module" src="/app.js"></script></body></html>');
 }catch{res.writeHead(502,{'Content-Type':'application/json'}).end(JSON.stringify({error:'入力またはAPI応答を確認できませんでした。'}));}
}).listen(4300,'127.0.0.1',()=>console.log('Local demo: http://127.0.0.1:4300'));

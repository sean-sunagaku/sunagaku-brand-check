import {test} from 'node:test';
import assert from 'node:assert/strict';
import React,{act} from 'react';
import {JSDOM} from 'jsdom';
import {VERSION,questionsFor,summarize,type Answer,type BrandRequest} from '../src/core.js';

test('cancelled uncooperative response never becomes a success',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'http://localhost'});
 Object.assign(globalThis,{window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,IS_REACT_ACT_ENVIRONMENT:true});
 const {createRoot}=await import('react-dom/client');const {BrandCheck}=await import('../src/ui.js');
 const container=dom.window.document.getElementById('root');if(!container)throw new Error('root');const root=createRoot(container);
 const original=globalThis.fetch;let resolveResponse:((value:Response)=>void)|undefined;
 globalThis.fetch=async()=>new Promise<Response>(resolve=>{resolveResponse=resolve;});
 try{
  await act(async()=>root.render(<BrandCheck/>));
  const textarea=container.querySelector('textarea');if(!textarea)throw new Error('textarea');
  const setter=Object.getOwnPropertyDescriptor(dom.window.HTMLTextAreaElement.prototype,'value')?.set;
  await act(async()=>{setter?.call(textarea,'実際に動かして、学べるツールを作りました。');textarea.dispatchEvent(new dom.window.Event('input',{bubbles:true}));});
  const button=Array.from(container.querySelectorAll('button')).find(b=>b.textContent==='OpenAI Decisionsで評価');if(!button)throw new Error('button');
  await act(async()=>button.click());
  const cancel=Array.from(container.querySelectorAll('button')).find(b=>b.textContent==='中断する');assert.ok(cancel,'evaluation must be loading');
  await act(async()=>cancel.click());
  const input:BrandRequest={text:textarea.value,context:'',purpose:'practice',provider:'decisions',version:VERSION};
  const answers:Answer[]=questionsFor(input.text).map(q=>{const choice=q.name.endsWith('_evidence')?'p0':'aligned';return {name:q.name,choice,confidence:1,probabilities:Object.fromEntries(q.choices.map(c=>[c.value,c.value===choice?1:0]))};});
  const result=summarize(input,answers,{model:'gpt-6-luna',variant:'A',durationMs:1,inputTokens:1,outputTokens:0,evaluatedAt:new Date().toISOString()});
  await act(async()=>resolveResponse?.(Response.json(result)));
  assert.doesNotMatch(container.textContent??'',/評価完了/);
  assert.match(container.textContent??'',/通信を中断/);
 }finally{await act(async()=>root.unmount());globalThis.fetch=original;dom.window.close();}
});

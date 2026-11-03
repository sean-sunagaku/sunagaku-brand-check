import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {VERSION, requestSchema, type Provider} from '../src/core.js';
import {evaluate,requestInstructions} from '../src/providers.js';
import {reportSchema} from '../src/ui.js';
import {CASES} from '../tests/cases.js';
const varsPath=process.env.BRAND_ENV_FILE;
if(varsPath){const data=await readFile(varsPath,'utf8');for(const line of data.split('\n')){const match=line.match(/^([A-Z_]+)=(.*)$/);if(match&&!process.env[match[1]])process.env[match[1]]=match[2].trim().replace(/^['"]|['"]$/g,'');}}
const hash=(s:string)=>createHash('sha256').update(s).digest('hex');
const entries=[];
const providers:Provider[]=['decisions','jev'];
for(const testCase of CASES){
 for(const provider of providers){
  for(const variant of ['A','B']){
   if(variant!=='A'&&variant!=='B')continue;
   const input=requestSchema.parse({text:testCase.text,purpose:testCase.purpose,provider,version:VERSION});
   const request=requestInstructions(input,variant);
   const base={id:testCase.id,text:input.text,purpose:input.purpose,expected:testCase.expected,provider,variant,inputHash:hash(JSON.stringify(input)),promptHash:hash(JSON.stringify(request))};
   const apiKey=process.env[provider==='decisions'?'OPENAI_API_KEY':'TYPESAFE_API_KEY'];
   if(!apiKey){entries.push({...base,status:'unavailable',error:'APIキー未設定'});continue;}
   try{const result=await evaluate(input,{apiKey,signal:AbortSignal.timeout(12000),variant});entries.push({...base,status:'success',evaluation:result});console.log(`${testCase.id} ${provider} ${variant}: ${result.verdict} ${result.durationMs}ms`);}
   catch(error){const message=error instanceof Error&&/^Decisions HTTP \d+$/.test(error.message)?error.message:'APIの応答または契約を確認できませんでした';entries.push({...base,status:'error',error:message});console.log(`${testCase.id} ${provider} ${variant}: failed`);}
  }
 }
}
const report=reportSchema.parse({generatedAt:new Date().toISOString(),version:VERSION,commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),kind:'live-api',entries});
await writeFile('reports/latest.json',JSON.stringify(report,null,2)+'\n');
console.log(`Saved ${entries.length} measured runs. No user input or credentials included.`);

import { TypeSafeClient, type Questions } from '@typesafe-ai/sdk';
import { z } from 'zod';
import { answerSchema, questionsFor, sharedInput, summarize, PROVIDERS, type BrandRequest, type Evaluation, type Answer } from './core.js';

const p=z.number().finite().min(0).max(1);
const openaiAnswer=z.object({name:z.string(),type:z.literal('choice'),choice:z.string(),confidence:p,probabilities:z.array(z.object({value:z.string(),probability:p}))});
const usageSchema=z.object({input_tokens:z.number().int().nonnegative(),output_tokens:z.number().int().nonnegative()});
const openaiSchema=z.object({model:z.string().min(1),answers:z.array(openaiAnswer),usage:usageSchema});
const jevSchema=z.object({model:z.string().min(1),answers:z.record(z.string(),z.object({type:z.literal('choice'),choice:z.string(),confidence:p,probabilities:z.record(z.string(),p)})),usage:usageSchema});
export interface EvaluationOptions { apiKey: string; signal:AbortSignal; variant?:'A'|'B'; fetcher?:typeof fetch }
export function requestInstructions(input: BrandRequest,variant:'A'|'B'='A') {
  const questions=questionsFor(input.text,variant);
  if(input.provider==='decisions') return {model:PROVIDERS.decisions.model,input:JSON.stringify(sharedInput(input)),questions:questions.map(q=>({type:'choice',...q}))};
  const typed:Questions=Object.fromEntries(questions.map(q=>[q.name,{type:'choice',instructions:{question:q.instructions,rules:[]},criteria:Object.fromEntries(q.choices.map(c=>[c.value,c.description]))}]));
  return {model:PROVIDERS.jev.model,state:sharedInput(input),questions:typed};
}
export async function evaluate(input:BrandRequest,options:EvaluationOptions):Promise<Evaluation> {
  const started=performance.now(); const variant=options.variant??'A';
  let answers:Answer[]; let model:string; let usage:z.infer<typeof usageSchema>;
  if(input.provider==='decisions') {
    const res=await (options.fetcher??fetch)('https://api.openai.com/v1/decisions',{method:'POST',headers:{Authorization:`Bearer ${options.apiKey}`,'Content-Type':'application/json'},body:JSON.stringify(requestInstructions(input,variant)),signal:options.signal});
    if(!res.ok) throw new Error(`Decisions HTTP ${res.status}`);
    const data=openaiSchema.parse(await res.json()); model=data.model;usage=data.usage;
    answers=data.answers.map(a=>{
      if(new Set(a.probabilities.map(x=>x.value)).size!==a.probabilities.length)throw new Error('Duplicate choice probability');
      return answerSchema.parse({name:a.name,choice:a.choice,confidence:a.confidence,probabilities:Object.fromEntries(a.probabilities.map(x=>[x.value,x.probability]))});
    });
  } else {
    const client=new TypeSafeClient({apiKey:options.apiKey,defaultModel:PROVIDERS.jev.model,timeout:12000,retry:{maxRetries:0},logLevel:'off'});
    const qs:Questions=Object.fromEntries(questionsFor(input.text,variant).map(q=>[q.name,{type:'choice',instructions:{question:q.instructions,rules:[]},criteria:Object.fromEntries(q.choices.map(c=>[c.value,c.description]))}]));
    const data=jevSchema.parse(await client.systemOne({model:PROVIDERS.jev.model,state:sharedInput(input),questions:qs},{signal:options.signal,timeout:12000,retry:{maxRetries:0}}));
    model=data.model;usage=data.usage;
    answers=Object.entries(data.answers).map(([name,a])=>answerSchema.parse({name,choice:a.choice,confidence:a.confidence,probabilities:a.probabilities}));
  }
  if(options.signal.aborted) throw new Error('Aborted');
  return summarize(input,answers,{model,variant,durationMs:Math.round(performance.now()-started),inputTokens:usage.input_tokens,outputTokens:usage.output_tokens,evaluatedAt:new Date().toISOString()});
}

import React, { useEffect, useRef, useState } from 'react';
import { z } from 'zod';
import { BRAND, VERSION, questionsFor, CRITERIA, RULES, PROVIDERS, PURPOSES, LABELS, REPOSITORY, evaluationSchema, purposeSchema, type Evaluation, type Provider, type BrandRequest } from './core.js';

const reportEntrySchema=z.object({id:z.string(),text:z.string(),purpose:purposeSchema,expected:z.string(),provider:z.enum(['decisions','jev']),variant:z.enum(['A','B']),status:z.enum(['success','error','unavailable']),evaluation:evaluationSchema.optional(),error:z.string().optional(),inputHash:z.string(),promptHash:z.string()});
export const reportSchema=z.object({generatedAt:z.string().nullable(),version:z.string(),commit:z.string(),kind:z.literal('live-api'),entries:z.array(reportEntrySchema)});
export type Report=z.infer<typeof reportSchema>;
type Run={status:'idle'}|{status:'loading'}|{status:'error';error:string}|{status:'success';value:Evaluation};
const initial:Record<Provider,Run>={decisions:{status:'idle'},jev:{status:'idle'}};
const providerIds:Provider[]=['decisions','jev'];
const verdicts={aligned:'ブランド方針に沿っています',clarify:'補足すると、より伝わります',misaligned:'伝え方を見直したいところがあります',insufficient:'判断材料を足したいところがあります'};
function Result({provider,run,previous}:{provider:Provider;run:Run;previous?:Evaluation}) {
  return <section className="bc-result" aria-label={`${PROVIDERS[provider].label}の評価`}><div className="bc-provider"><h3>{PROVIDERS[provider].label}</h3><span>{run.status==='loading'?'評価中':run.status==='success'?'評価完了':run.status==='error'?'未完了':'未実行'}</span></div>
    {run.status==='idle'&&<p className="bc-muted">この評価を実行すると、4つの基準ごとの結果が表示されます。</p>}
    {run.status==='loading'&&<p role="status">同じブランド基準で確認しています…</p>}
    {run.status==='error'&&<p role="alert" className="bc-error">{run.error}</p>}
    {run.status==='success'&&<><h4>{verdicts[run.value.verdict]}</h4>{run.value.axes.map(a=><div className="bc-axis" key={a.id}><div><strong>{CRITERIA.find(c=>c.id===a.id)?.title}</strong><span data-status={a.status}>{LABELS[a.status]}</span></div><p>{a.reason}</p>{a.evidence&&<blockquote>{a.evidence}</blockquote>}{a.suggestion&&<p className="bc-suggestion">→ {a.suggestion}</p>}{previous&&<small>変更前：{LABELS[previous.axes.find(p=>p.id===a.id)?.status??'insufficient']} → 今回：{LABELS[a.status]}</small>}</div>)}<details><summary>この評価の条件</summary><p>モデル：{run.value.model}<br/>基準・指示文：v{run.value.version} / {run.value.variant}<br/>実行：{new Date(run.value.evaluatedAt).toLocaleString('ja-JP')}<br/>所要時間：{(run.value.durationMs/1000).toFixed(2)}秒 / 入力 {run.value.inputTokens} tokens</p></details></>}
  </section>;
}
export function BrandCheck({endpoint='/api/brand-check/analyze',report,initialView='check'}:{endpoint?:string;report?:Report;initialView?:'check'|'criteria'|'reports'}) {
  const [tab,setTab]=useState<string>(initialView);const [text,setText]=useState('');const [context,setContext]=useState('');const [purpose,setPurpose]=useState<BrandRequest['purpose']>('practice');
  const [runs,setRuns]=useState<Record<Provider,Run>>(initial);const [previous,setPrevious]=useState<Partial<Record<Provider,Evaluation>>>({});
  const revision=useRef(0);const controllers=useRef<Partial<Record<Provider,AbortController>>>({});
  useEffect(()=>()=>{for(const controller of Object.values(controllers.current))controller?.abort();},[]);
  function edit(update:()=>void) {revision.current++;for(const controller of Object.values(controllers.current))controller?.abort();setPrevious(old=>{const next={...old};for(const p of providerIds){const r=runs[p];if(r.status==='success')next[p]=r.value;}return next;});setRuns(initial);update();}
  async function run(provider:Provider) {
    if(!text.trim()||runs[provider].status==='loading')return;
    controllers.current[provider]?.abort();const controller=new AbortController();controllers.current[provider]=controller;
    const current=revision.current;const timeout=setTimeout(()=>controller.abort(),20000);
    setRuns(r=>({...r,[provider]:{status:'loading'}}));
    try{
      const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text,context,purpose,version:VERSION,provider}),signal:controller.signal});
      const data:unknown=await response.json();
      if(!response.ok){const error=z.object({error:z.string()}).safeParse(data);throw new Error(error.success?error.data.error:'評価できませんでした。時間を置いてお試しください。');}
      if(controller.signal.aborted)throw new Error('通信を中断しました。');
      const value=evaluationSchema.parse(data);
      if(value.provider!==provider||value.version!==VERSION)throw new Error('評価条件が更新されました。ページを再読み込みしてください。');
      if(revision.current===current&&controllers.current[provider]===controller)setRuns(r=>({...r,[provider]:{status:'success',value}}));
    }catch(error){if(revision.current===current&&controllers.current[provider]===controller)setRuns(r=>({...r,[provider]:{status:'error',error:controller.signal.aborted?'通信を中断しました。入力は保持されています。':error instanceof Error?error.message:'通信に失敗しました。'}}));}
    finally{clearTimeout(timeout);}
  }
  const busy=providerIds.some(p=>runs[p].status==='loading');
  return <div className="bc-app"><header className="bc-heading"><p className="bc-eyebrow">SUNAGAKU LABS / OPEN SOURCE</p><h1>投稿のブランドチェック</h1><p>自分が目指す発信に、つながっているか。</p></header>
    <section className="bc-brand" aria-labelledby="brand-criteria"><div><span className="bc-eyebrow">BRAND CRITERIA · v{VERSION}</span><h2 id="brand-criteria">{BRAND}</h2><p>人が定めた共通の基準です。AIの評価は、その下で別々に確認できます。</p></div><ol>{CRITERIA.map((c,i)=><li key={c.id}><span>0{i+1}</span><strong>{c.title}</strong></li>)}</ol></section>
    <nav className="bc-tabs" aria-label="ブランドチェックの表示">{[['check','投稿をチェック'],['criteria','基準・指示文'],['reports','テスト比較結果']].map(([id,label])=><button key={id} type="button" aria-current={tab===id?'page':undefined} onClick={()=>setTab(id)}>{label}</button>)}</nav>
    {tab==='check'&&<><div className="bc-workspace"><section className="bc-input"><label htmlFor="bc-text">投稿文</label><textarea id="bc-text" value={text} onChange={e=>edit(()=>setText(e.target.value))} placeholder="Xに投稿する前の文章を貼り付けてください。" rows={8}/><small>本文のみ・2,000文字まで</small><label htmlFor="bc-purpose">投稿の目的</label><select id="bc-purpose" value={purpose} onChange={e=>{const p=purposeSchema.parse(e.target.value);edit(()=>setPurpose(p));}}>{Object.entries(PURPOSES).map(([value,label])=><option value={value} key={value}>{label}</option>)}</select><details><summary>背景や添付について補足する</summary><textarea aria-label="投稿の補足" value={context} onChange={e=>edit(()=>setContext(e.target.value))} rows={3} placeholder="500文字まで。画像そのものの確認は行いません。"/></details><div className="bc-actions"><button disabled={!text.trim()||busy} onClick={()=>{void run('decisions');void run('jev');}}>両方の評価を比較</button><div>{providerIds.map(p=><button className="bc-secondary" key={p} disabled={!text.trim()||busy} onClick={()=>void run(p)}>{PROVIDERS[p].label}で評価</button>)}</div>{busy&&<button className="bc-secondary" onClick={()=>{for(const c of Object.values(controllers.current))c?.abort();}}>中断する</button>}</div></section><div className="bc-results" aria-live="polite">{providerIds.map(p=><Result key={p} provider={p} run={runs[p]} previous={previous[p]?.version===VERSION?previous[p]:undefined}/>)}</div></div><p className="bc-scope">評価対象は本文です。実際の画像や、過去の投稿全体の偏りは確認していません。女性キャラクターの登場だけで減点しません。</p></>}
    {tab==='criteria'&&<section className="bc-detail"><h2>基準と、判定の指示文</h2><p>同じ4つの基準を両方のAIへ渡します。基準は人の方針、評価は各AIの判断として区別します。</p>{CRITERIA.map(c=><article key={c.id}><h3>{c.title}</h3><p>{c.description}</p><dl><dt>沿う</dt><dd>{c.aligned}</dd><dt>補足したい</dt><dd>{c.clarify}</dd><dt>見直したい</dt><dd>{c.misaligned}</dd></dl></article>)}<h3>共通の指示</h3><ol>{RULES.map(rule=><li key={rule}>{rule}</li>)}</ol><p>全質問・選択肢・各API形式の正本：<a href={`${REPOSITORY}/blob/v0.1.0/src/core.ts`} target="_blank" rel="noopener">指示文のソース</a> ／ <a href={`${REPOSITORY}/blob/v0.1.0/src/providers.ts`} target="_blank" rel="noopener">APIへの変換</a>。基準と指示文は v{VERSION}。低確信度は材料不足、根拠のない指摘は採用しません。</p><details><summary>この入力に使う指示文と選択肢（A）</summary><pre>{JSON.stringify(questionsFor(text || "投稿本文"),null,2)}</pre></details><a href="../design.html">設計書をHTMLで読む →</a></section>}
    {tab==='reports'&&<section className="bc-detail"><h2>テスト比較結果</h2><p>公開用に作った例文で、同じ入力に対するDecisionsとJev、指示文A/Bの結果を記録します。利用者の投稿は掲載しません。</p>{report?<><p>基準 v{report.version} · {report.generatedAt?new Date(report.generatedAt).toLocaleString('ja-JP'):'実API検証は未実行'} · <a href={`${REPOSITORY}/tree/${report.commit}`} target="_blank" rel="noopener">対象ソース</a></p><p>成功 {report.entries.filter(e=>e.status==='success').length} / 全 {report.entries.length} 回。期待する方向との一致 {report.entries.filter(e=>e.evaluation?.verdict===e.expected).length} 件。失敗・未設定も個別に表示します。</p><div className="bc-table"><table><thead><tr><th>ケース</th><th>期待する方向</th><th>評価器 / 指示</th><th>実行結果</th><th>判定</th></tr></thead><tbody>{report.entries.map(e=><tr key={`${e.id}-${e.provider}-${e.variant}`}><td><details><summary>{e.id}</summary>{e.text}</details></td><td>{e.expected==='aligned'?'沿う':e.expected==='misaligned'?'見直す':e.expected}</td><td>{PROVIDERS[e.provider].label} / {e.variant}</td><td>{e.status==='success'?'成功':e.status==='error'?'失敗':'未設定'}</td><td>{e.evaluation?verdicts[e.evaluation.verdict]:e.error??'未実行'}</td></tr>)}</tbody></table></div><details><summary>各軸・所要時間・再現用データ</summary><pre>{JSON.stringify(report,null,2)}</pre></details></>:<p>実APIの検証レポートはまだありません。</p>}<p>合成例の結果は実投稿全般の精度保証ではありません。期待値は作成者の判断で、友人による独立評価はまだ実施していません。</p><a href={`${REPOSITORY}/blob/main/scripts/evaluate.ts`} target="_blank" rel="noopener">比較の再実行手順・スクリプト →</a></section>}
    <footer className="bc-footer"><a href={REPOSITORY} target="_blank" rel="noopener">ソースコード / MIT</a><a href="../design.html">設計書</a><span>Sunagaku Brand Check</span></footer>
  </div>;
}

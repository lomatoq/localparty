'use strict';
// Rebuilds capture metadata only. It never fabricates images or marks design approved.
const fs=require('node:fs'),path=require('node:path'),catalog=require('../lib/catalog');
const root=path.resolve('.localparty-build/screen-review'),captures=path.join(root,'captures');
const read=(file,fallback)=>{try{return JSON.parse(fs.readFileSync(path.join(root,file)))}catch{return fallback;}};
const result=read('captures/complete-report.json',{games:[]}),states=read('captures/states-report.json',{games:[]});
const extras=read('manifest-extra.json',[]).filter(x=>Number(x.id)<1000||Number(x.id)>=1360);
const supplemental=fs.readdirSync(captures).filter(f=>f.endsWith('-completion-report.json')).map(f=>read('captures/'+f,null)).concat(read('captures/chaos-solver-report.json',null)).filter(Boolean);
const oldResults=read('captures/results-report.json',{games:[]});
const freshResults=read('captures/result-refresh-report.json',{games:[]});
const coverage=[];
for(const [index,game]of catalog.entries()){
 const specialized=supplemental.find(r=>r.games?.some(g=>g.id===game.id&&g.resultPhase==='results'));const row=specialized?.games.find(x=>x.id===game.id)||supplemental.find(r=>r.games?.some(g=>g.id===game.id))?.games.find(x=>x.id===game.id)||result.games.find(x=>x.id===game.id),stateRow=states.games.find(x=>x.id===game.id);
 const entries=[['waiting','Ожидание'],['','Игра'],['paused','Пауза'],['results','Результаты']].flatMap(([suffix,state])=>[0,1].map(k=>{
  const freshResult=freshResults.games.find(g=>g.id===game.id);
  const file=game.id+(k?'-tv':'')+(suffix?'-'+suffix:'')+'.png',exists=fs.existsSync(path.join(captures,file));
  return{state,surface:k?'ТВ':'Телефон',file:exists?'captures/'+file:null,capturedAt:exists?fs.statSync(path.join(captures,file)).mtime.toISOString():null,missingReason:exists?null:suffix==='results'?(row?.reachedLevel?'Настоящий сценарий дошёл до уровня '+row.reachedLevel+'/15; финал не достигнут. Визуальный стенд отдельно: №1364/1365.':row?.error||row?.errors?.join('; ')||'No successful final-state capture'):stateRow?.error||'Not captured',method:!exists?'Not captured':suffix==='results'?(freshResult?.resultPhase==='results'?freshResult.method:row?.resultPhase==='results'?(specialized?.method||result.method):oldResults.games.some(g=>g.id===game.id&&!g.error)?'Existing TEST_FAST final capture from previous run; not recaptured at normal speed':'Existing final image from previous run; capture method not reconfirmed'):stateRow?.capturedPhase?'Normal-speed screenshot pass':'See capture report; image may predate latest changes'};
 }));
 for(const [suffix,label,offset]of[['reveal','Промежуточный итог',0],['countdown','Отсчёт',2],['reconnected','После переподключения',4],['spectator','Зритель',6]])for(const k of[0,1]){const freshResult=freshResults.games.find(g=>g.id===game.id);
  const file=game.id+(k?'-tv':'')+'-'+suffix+'.png';if(!fs.existsSync(path.join(captures,file)))continue;extras.push({id:String(1000+index*10+offset+k),game:game.id,title:game.title,surface:k?'ТВ':'Телефон',state:label,file:'captures/'+file,capturedAt:fs.statSync(path.join(captures,file)).mtime.toISOString(),method:suffix==='reconnected'||suffix==='spectator'?'Real client at normal speed':specialized?.method||result.method});}
 coverage.push({game:game.id,title:game.title,states:entries,resultAttempt:row||null});
}
fs.writeFileSync(path.join(root,'manifest-extra.json'),JSON.stringify(extras,null,2));
const report={generatedAt:new Date().toISOString(),coreCaptured:coverage.flatMap(x=>x.states).filter(x=>x.file).length,coreExpected:catalog.length*8,extraCaptured:extras.length,coverage};
fs.writeFileSync(path.join(root,'coverage-report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({coreCaptured:report.coreCaptured,coreExpected:report.coreExpected,extraCaptured:report.extraCaptured,missing:coverage.flatMap(g=>g.states.filter(s=>!s.file).map(s=>({game:g.game,...s})))}));

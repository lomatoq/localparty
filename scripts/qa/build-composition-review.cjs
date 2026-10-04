'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const captures=path.resolve(process.argv[2]),out=path.resolve(process.argv[3]);
const passId=process.argv[4]||'composition-2026-10-03';
const hostProofPath=process.argv[5]&&path.resolve(process.argv[5]);
const template=path.resolve('output/playwright/ui-rework-2026-10-02/review-final-1003');
const report=JSON.parse(fs.readFileSync(path.join(captures,'report.json'))),catalog=require('../../lib/catalog');
const tvOnly=report.captureSurfaces?.length===1&&report.captureSurfaces[0]==='tv';
assert.equal(report.games.length,catalog.length,'Every released game needs current actual originals');
assert.deepEqual(report.errors,[]);assert.deepEqual(report.changedFiles,[]);assert(!report.failure,'Unrecovered capture failure: '+report.failure);
for(const name of ['layout-check','composition-check','micro-attachments-check'])assert.equal(JSON.parse(fs.readFileSync(path.join(captures,name+'.json'))).status,'passed',name);
fs.mkdirSync(path.join(out,'captures'),{recursive:true});fs.mkdirSync(path.join(out,'fonts'),{recursive:true});
for(const name of ['index.html','review.css','review.js','serve.cjs','logo.png','fonts/kardia-fit.otf','fonts/kardia-fat-runner.otf'])fs.copyFileSync(path.join(template,name),path.join(out,name));
const screens=[],groups=[];
const dictionary=require('../../public/i18n-dictionary');
const add=(id,title,surface,file,date,extra={},sourceDirectory=captures)=>{
 const bytes=fs.readFileSync(path.join(sourceDirectory,file));assert.equal(bytes.toString('hex',0,8),'89504e470d0a1a0a');
 fs.copyFileSync(path.join(sourceDirectory,file),path.join(out,'captures',file));
 const shot={id,title,surface,file:'captures/'+file,pixelWidth:bytes.readUInt32BE(16),pixelHeight:bytes.readUInt32BE(20),capturedAt:date,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),...extra};screens.push(shot);return shot;
};
for(const game of catalog){
 const row=report.games.find(r=>r.id===game.id);assert(row&&!row.error);
 const title=dictionary[game.title]||game.title,date=row.captureStates.find(s=>s.state==='gameplay').capturedAt;
 const tv=add(game.id+'-tv-live',title+' — TV 1080p','tv',game.id+'-tv-live-1920.png',date,{gameId:game.id,phase:row.gameplayPhase});
 const compact=add(game.id+'-tv-compact',title+' — TV 720p','tv',game.id+'-tv-live-1280.png',date,{gameId:game.id,phase:row.gameplayPhase});
 tv.alternates=[{title:'Открыть проверку TV 720p',file:compact.file}];
 const phone=tvOnly?null:add(game.id+'-phone-live',title+' — iPhone 17','phone',game.id+'-phone-live-402.png',date,{gameId:game.id,phase:row.gameplayPhase});
 groups.push({id:'game-'+game.id,title,section:'games',screenIds:phone?[tv.id,phone.id]:[tv.id],stateLabel:'Реальная игра · '+row.gameplayPhase+' · TV 720p/1080p'});
 const waiting=row.captureStates.find(s=>s.state==='matchmaking');
 if(waiting&&!tvOnly){
  const pair=['tv','phone'].map(surface=>add(game.id+'-'+surface+'-waiting',title+' — matchmaking',surface,game.id+'-'+surface+'-matchmaking.png',waiting.capturedAt,{gameId:game.id}).id);
  groups.push({id:'waiting-'+game.id,title,section:'waiting',screenIds:pair,stateLabel:'Реальное ожидание и готовность'});
 }
}
if(tvOnly){
 const mainDate=(width,file)=>report.mainScreens?.find(s=>s.file===file||path.basename(s.file||s.path||'')===file||s.w===width||s.width===width||s.pixelWidth===width)?.capturedAt||report.mainCapturedAt||report.startedAt;
 const mainFile='main-tv-lobby-1920.png',compactFile='main-tv-lobby-1280.png';
 const main=add('main-tv-lobby','Главное меню — TV 1080p','tv',mainFile,mainDate(1920,mainFile));
 const compact=add('main-tv-lobby-compact','Главное меню — TV 720p','tv',compactFile,mainDate(1280,compactFile));
 assert.equal(main.pixelWidth,1920);assert.equal(main.pixelHeight,1080);assert.equal(compact.pixelWidth,1280);assert.equal(compact.pixelHeight,720);
 main.alternates=[{title:'Открыть проверку TV 720p',file:compact.file}];
 groups.push({id:'main-tv',title:'Главное меню',section:'main',screenIds:[main.id],stateLabel:'Свежая проверка главного меню · TV 720p/1080p'});
}
for(const surface of tvOnly?[]:['tv','phone']){
 const shot=add('main-'+surface+'-lobby','Главное меню · '+(surface==='tv'?'TV':'iPhone 17'),surface,'main-'+surface+'-lobby.png',report.mainCapturedAt||report.startedAt);
 groups.push({id:'group-'+shot.id,title:shot.title,section:'main',screenIds:[shot.id],stateLabel:'Свежая проверка общего меню; дополнительные прежние состояния сохранены в исторической галерее'});
}
if(hostProofPath&&!tvOnly){
 const proof=JSON.parse(fs.readFileSync(hostProofPath));assert.equal(proof.sourcesStable,true);assert.deepEqual(proof.errors,[]);
 for(const [file,sha]of Object.entries(proof.sourcesBefore))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),sha,'Host Panel source changed: '+file);
 for(const width of [402,320]){
  const shots=proof.screens.filter(s=>s.width===width);assert.equal(shots.length,3);
  const ids=shots.map(s=>{const file=path.basename(s.path),id=file.replace(/\.png$/,'');const shot=add(id,'Host Panel · '+width+' px · '+s.position,'phone',file,s.capturedAt,{method:proof.method},path.dirname(s.path));assert.equal(shot.sha256,s.sha256);return id;});
  groups.push({id:'native-host-'+width,title:'Host Panel · '+width+' px',section:'main',screenIds:ids,stateLabel:'Нативный HTML в WebKit · данные панели смоделированы · начало / середина / конец прокрутки'});
 }
}
const manifest={reviewId:'heypals-ui-rework-2026-10-02',passId,tvOnly,branch:'heypals/ux-polish',generatedAt:new Date().toISOString(),captureDate:tvOnly?'Композиция и материалы: 3 октября 2026. Только TV: 1280×720 и 1920×1080.':'Композиция и материалы: 3 октября 2026. TV 1280×720 и 1920×1080; пульт 402×874.',catalogCount:catalog.length,method:report.method,screens,groups};
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
let script=fs.readFileSync(path.join(out,'review.js'),'utf8');
const needle="if(s.warning)panel.append(node('p','screen-warning',s.warning));";
assert(script.includes(needle));
script=script.replace(needle,needle+"for(const alt of s.alternates||[]){const link=node('a','screen-warning',alt.title);link.href=alt.file;link.target='_blank';link.rel='noopener';panel.append(link);}");
script=script.replace('ТВ и пульт для каждой игры. Нажми на снимок для полного размера. Комментарии — под изображениями.','ТВ и пульт для каждой игры. TV 720p доступен под снимком. Комментарии — под изображениями.');
if(tvOnly){
 script=script.replace("section=['games','main','waiting'].includes", "section=['games','main'].includes");
 script=script.replace('ТВ и пульт для каждой игры. TV 720p доступен под снимком. Комментарии — под изображениями.','36 TV-кадров — по одному на каждую игру. Проверка 720p доступна под снимком. Комментарии — под изображениями.');
 script=script.replace('Основные экраны приложения, панели хоста и настройки.','Главное меню TV. Проверка 720p доступна под снимком. Комментарии — под изображением.');
 script=script.replace("+' игр · ТВ + iPhone 17 · '+m.screens.length+' снимков'", "+' игр + главное меню · только ТВ · '+m.screens.length+' снимка'");
 script=script.replace('WebKit, основной экран телефона402×874 и дополнительные компактные экраны, DPR3; это не фотографии физического iPhone или AirPlay. ','WebKit, TV 720p и 1080p; это браузерные снимки, не фотографии физического TV или AirPlay. ');
 const html=fs.readFileSync(path.join(out,'index.html'),'utf8').replace(/<button data-section="waiting"[^>]*>[^<]*<\/button>/g,'').replace('Основные экраны</button>','Главное меню</button>').replace('Слева — ТВ, справа — пульт iPhone 17. Нажми на снимок для полного размера. Комментарии — под каждым изображением.','36 игровых экранов TV и главное меню. Нажми на снимок для полного размера.');
 fs.writeFileSync(path.join(out,'index.html'),html);
}
fs.writeFileSync(path.join(out,'review.js'),script);
// Existing user notes are copied separately after the old server is stopped,
// preserving its latest successful writes and leaving all historical files intact.
console.log(JSON.stringify({out,games:catalog.length,screens:screens.length,groups:groups.length}));

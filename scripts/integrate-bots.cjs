const fs=require('fs');
let p='server.js',s=fs.readFileSync(p,'utf8');
s=s.replace('testMode=false, testProfile=null','testMode=false, botCount=0, testProfiles=[]');
s=s.replace(/function sendTestProfile\(ws\)\{[^\n]+/,`function sendTestProfile(ws){while(testProfiles.length<botCount)testProfiles.push(publicProfile(profileStore.register(null,'Бот '+(testProfiles.length+1),'right')));send(ws,{type:'test-profiles',profiles:testProfiles.slice(0,botCount)});}`);
s=s.replace('s.testMode=testMode;','s.testMode=testMode;s.botCount=botCount;').replace('initial.testMode=testMode;','initial.testMode=testMode;initial.botCount=botCount;');
s=s.replace('(testProfile&&active.ready.has(testProfile.id))','testProfiles.slice(0,botCount).every(p=>active.ready.has(p.id))');
s=s.replace("if(m.type==='test-mode'){", "if(m.type==='test-mode'||m.type==='bots-set'){");
s=s.replace('testMode=!!m.enabled;for(const c',`const requested=m.type==='bots-set'?Number(m.count):(m.enabled?1:0);if(!Number.isInteger(requested)||requested<0||requested>15)throw Error('Можно добавить от 0 до 15 ботов.');if(requested+connected().filter(p=>!p.testBot).length>16)throw Error('В комнате максимум 16 игроков.');botCount=requested;testMode=botCount>0;for(const c`);
s=s.replace('p.testBot=p.id===testProfile?.id','p.testBot=testProfiles.some(bot=>bot.id===p.id)');
s=s.replace("'/value-fit.js':'value-fit.js'","'/value-fit.js':'value-fit.js','/bots.js':'bots.js'");fs.writeFileSync(p,s);
p='public/app.js';s=fs.readFileSync(p,'utf8');const start=s.indexOf(' let testProfile='),end=s.indexOf(' window.PARTY_PROFILE={};',start);
if(start<0||end<0)throw Error('Companion section missing');
s=s.slice(0,start)+" let testProfiles=[],liveScoreInstance='';\n function updateTestCompanion(){if(host)window.PartyBots?.update(state,testProfiles);}\n"+s.slice(end);
s=s.replace("if(m.type==='test-profile'&&host){testProfile=m.profile;", "if(m.type==='test-profiles'&&host){testProfiles=m.profiles||[];");
s=s.replace("$('testMode').checked=!!state?.testMode;", "$('testMode').checked=!!state?.testMode;$('botCount').textContent=state?.botCount||0;$('botMinus').disabled=active||!(state?.botCount);$('botPlus').disabled=active||(state?.botCount||0)>=15||(state?.players.length||0)>=16;");
s=s.replace(" $('testMode').onchange=", " document.querySelector('.company-people').append($('testModeBox'));\n $('botMinus').onclick=()=>send({type:'bots-set',count:Math.max(0,(state?.botCount||0)-1)});\n $('botPlus').onclick=()=>send({type:'bots-set',count:(state?.botCount||0)+1});\n $('testMode').onchange=");fs.writeFileSync(p,s);
p='public/index.html';s=fs.readFileSync(p,'utf8');s=s.replace(/<div id="testModeBox" hidden>.*?<\/small><\/div>/, '<div id="testModeBox" class="bots-panel" hidden><input type="checkbox" id="testMode" hidden><b>Боты</b><div class="bot-stepper"><button id="botMinus" type="button" aria-label="Убрать бота">−</button><output id="botCount" aria-live="polite">0</output><button id="botPlus" type="button" aria-label="Добавить бота">+</button></div></div>');s=s.replace('<script src="/app.js"','<script src="/bots.js"></script><script src="/app.js"');fs.writeFileSync(p,s);
for(const file of fs.readdirSync('tests').filter(f=>/\.(cjs|js)$/.test(f))){const path='tests/'+file,old=fs.readFileSync(path,'utf8');const next=old.replaceAll("locator('#testMode').check()","locator('#botPlus').click()").replaceAll("locator('#testMode').uncheck()","locator('#botMinus').click()");if(next!==old)fs.writeFileSync(path,next);}

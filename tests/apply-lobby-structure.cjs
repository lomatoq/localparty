const fs=require('fs');
let app=fs.readFileSync('public/app.js','utf8');
app=app.replace("const titleGame=state?.catalog.find(g=>g.id===state.active?.id);", "const titleGame=state?.catalog.find(g=>g.id===state.active?.id);window.PARTY_GAME_INFO=titleGame;");
app=app.replace("$('liveTop').hidden=!active||!host||game?.engine!=='party';", "$('liveTop').hidden=true;");
app=app.replace("$('pauseButton').textContent=session.paused?'▶ Продолжить':'Ⅱ Пауза';", "$('pauseButton').innerHTML='<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\">'+(session.paused?'<path d=\"m8 5 11 7-11 7Z\"/>':'<path d=\"M8 5v14M16 5v14\"/>')+'</svg><span>'+(session.paused?'Продолжить':'Пауза')+'</span>';");
fs.writeFileSync('public/app.js',app);
let html=fs.readFileSync('public/index.html','utf8');
html=html.replace('<button id="sessionRules" class="quiet">Правила ▾</button>','');
html=html.replace('<button id="resumeButton"', '<button id="sessionRules" class="quiet">Правила игры</button><button id="resumeButton"');
fs.writeFileSync('public/index.html',html);
let bridge=fs.readFileSync('public/bridge.js','utf8');
bridge=bridge.replace(/const syncLobbyRail=.*?;\};/, "const syncLobbyRail=()=>{document.documentElement.style.setProperty('--shared-rail-top',Math.max(170,Math.min(260,innerHeight*.21))+'px');};");
bridge+=`\n/* Rules belong to the lobby card; every engine keeps its own controls. */
document.addEventListener('DOMContentLoaded',()=>{
 if(!document.documentElement.classList.contains('party-host'))return;
 const info=parent.PARTY_GAME_INFO;if(!info)return;
 const start=document.querySelector('#startGame,#startBtn,#start');
 const card=document.querySelector('#lobbyOverlay .left-panel,#lobbyOverlay .modes-card,.setup-card,.lobbyPanel,#lobbyStage') || start?.closest('aside,.panel,.card,section');
 if(!card)return;
 card.classList.add('lp-start-card');
 const rules=document.createElement('details');rules.className='lp-lobby-rules';
 const summary=document.createElement('summary');summary.textContent='Правила и управление';rules.append(summary);
 for(const value of [info.goal,info.controls,info.win]){if(!value)continue;const p=document.createElement('p');p.textContent=Array.isArray(value)?value.join(' · '):value;rules.append(p);}
 const heading=card.querySelector('h1,h2');if(heading)heading.after(rules);else card.prepend(rules);
});\n`;
fs.writeFileSync('public/bridge.js',bridge);

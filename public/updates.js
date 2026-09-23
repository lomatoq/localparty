(() => {
 'use strict';
 const ids=['curling','bowling','swarm_gate','peek_shoot'];
 // Alpha cards use the supplied transparent hero illustrations.
 function decorate(){for(const id of ids){const card=document.querySelector(`.game[data-id="${id}"]`);if(!card||card.dataset.alphaArt)return;card.dataset.alphaArt='1';card.classList.add('alpha-game');const img=card.querySelector('img.symbol');if(img)img.src=`/assets/games/${id}.png`;const tag=card.querySelector('.tag');if(tag)tag.textContent='ALPHA · '+tag.textContent;}}
 new MutationObserver(decorate).observe(document.getElementById('games')||document.body,{childList:true,subtree:true});decorate();
 if(!window.PARTY_HOST_KEY)return;
 const button=document.createElement('button');button.type='button';button.className='nav lp-update-button';button.id='lp-updates';button.setAttribute('aria-haspopup','dialog');button.innerHTML='<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 3v12m-5-5 5 5 5-5M4 16v4h16v-4"/></svg><span>Обновления</span><small>alpha</small>';
 const nav=document.querySelector('.app-header nav:last-child');if(!nav)return;nav.insertBefore(button,nav.firstChild);
 const dialog=document.createElement('dialog');dialog.className='lp-updates-dialog';dialog.setAttribute('aria-labelledby','lp-updates-title');
 dialog.innerHTML=`<form method="dialog"><button class="quiet lp-update-close" aria-label="Закрыть">×</button></form><div class="eyebrow">НОВОЕ ДЛЯ ВАШЕЙ КОМПАНИИ</div><h2 id="lp-updates-title">Ещё один <em>апдейт.</em></h2><p id="lp-update-current"></p><fieldset class="lp-update-channels"><legend>Откуда обновляться</legend><label><input type="radio" name="lp-channel" value="stable"><b>Релиз</b><small>Последняя стабильная версия GitHub</small></label><label><input type="radio" name="lp-channel" value="alpha" checked><b>Экспериментальная <i>alpha</i></b><small>Новые игры из alpha/sports-siege-swipe</small></label></fieldset><p id="lp-update-warning">Alpha может содержать ошибки. Перед заменой создаётся резервная копия; профили остаются на компьютере.</p><div class="lp-update-status" id="lp-update-status" role="status" aria-live="polite">Проверка запускается только по кнопке. Для игры интернет не нужен.</div><progress id="lp-update-progress" hidden></progress><label class="lp-update-confirm"><input id="lp-update-confirm" type="checkbox">Разрешаю перезапуск сервера после установки</label><div class="lp-update-actions"><button class="quiet" id="lp-update-check">Проверить</button><button class="primary" id="lp-update-install" disabled>Скачать и обновить ↓</button></div><button class="quiet" id="lp-update-rollback" hidden>↶ Вернуть предыдущую установку</button><details><summary>GitHub и резервные копии</summary><p>Публичный репозиторий lomatoq/localparty обновляется без входа и токена. Авторизация через <code>gh auth login</code> или <code>PARTY_GITHUB_TOKEN</code> используется только как запасной вариант для приватного форка или при ограничении анонимных запросов.</p><p>Резервные копии и журнал находятся в <code>~/.localparty-updates</code>. Неотслеживаемые личные файлы сохраняются; изменения файлов проекта по-прежнему нужно сохранить перед обновлением.</p></details>`;
 document.body.append(dialog);const $=id=>document.getElementById('lp-update-'+id);let candidate=null,poll=null,restarting=false,working=false;
 const request=async(endpoint='',body)=>{const r=await fetch('/api/updates'+endpoint,{method:body?'POST':'GET',headers:{'X-Party-Host':window.PARTY_HOST_KEY,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});let d;try{d=await r.json();}catch{throw Error('Сервер не ответил');}if(!r.ok)throw Error(d.error||'Ошибка обновления');return d;};
 const sync=()=>{$('install').disabled=working||!candidate||candidate.current||!$('confirm').checked;$('check').disabled=working;$('rollback').disabled=working||!$('confirm').checked;};
 function show(s){
  if(s.version)$('current').textContent=`HeyPals ${s.version} · alpha / sports & siege`;
  if(s.candidate){candidate=s.candidate;$('install').textContent=`Установить ${candidate.version} ↓`;}
  $('status').textContent=s.message||'';if(s.previous?.phase==='error'&&s.phase==='idle')$('status').textContent=s.previous.message;
  if(s.rollback!==undefined)$('rollback').hidden=!s.rollback;
  working=['downloading','restarting'].includes(s.phase);$('progress').hidden=!working;
  if(s.total){$('progress').max=s.total;$('progress').value=s.bytes;}else $('progress').removeAttribute('value');
  sync();if(s.phase==='restarting'){restarting=true;watchRestart();}
  if(['done','error'].includes(s.phase)){clearInterval(poll);poll=null;working=false;sync();}
 }
 async function refresh(){try{show(await request());}catch(e){if(restarting)return;clearInterval(poll);poll=null;working=false;$('status').textContent=e.message;sync();}}
 let restartLoop=false;
 async function watchRestart(){if(restartLoop)return;restartLoop=true;clearInterval(poll);poll=null;const before=window.PARTY_HOST_KEY;await new Promise(r=>setTimeout(r,2000));
  for(let i=0;i<100;i++){try{const r=await fetch('/host',{cache:'no-store'}),text=await r.text();const key=/PARTY_HOST_KEY="([a-f0-9]+)"/.exec(text)?.[1];if(r.ok&&key&&key!==before){location.reload();return;}}catch{}await new Promise(r=>setTimeout(r,1000));}
  $('status').textContent='Автоподключение не удалось. Запустите START_WINDOWS.bat / START_MAC.command. Журнал — ~/.localparty-updates.';restartLoop=false;
 }
 button.onclick=()=>{dialog.showModal();refresh();};dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
 $('confirm').onchange=sync;
 dialog.querySelectorAll('input[name="lp-channel"]').forEach(r=>r.onchange=()=>{candidate=null;$('warning').textContent=r.value==='alpha'?'Экспериментальная версия: четыре новые игры. Сохраняется резервная копия.':'Стабильный релиз может не содержать alpha-игры и кнопку обновления. Профили сохраняются.';sync();});
 $('check').onclick=async()=>{working=true;candidate=null;sync();$('status').textContent='Проверяем GitHub…';try{show(await request('/check',{channel:dialog.querySelector('input[name="lp-channel"]:checked').value}));}catch(e){$('status').textContent=e.message;}finally{working=false;sync();}};
 async function install(rollback=false){if(working||!$('confirm').checked)return;working=true;sync();$('status').textContent='Готовим установку…';try{await request(rollback?'/rollback':'/install',{id:candidate?.id,confirm:true});clearInterval(poll);poll=setInterval(refresh,650);await refresh();}catch(e){working=false;$('status').textContent=e.message;sync();}}
 $('install').onclick=()=>install();$('rollback').onclick=()=>install(true);
})();

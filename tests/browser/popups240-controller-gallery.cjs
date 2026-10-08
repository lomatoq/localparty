'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const out=path.resolve('output/playwright/popups240/controller'),report=JSON.parse(fs.readFileSync(path.join(out,'report.json')));
const notes={
 'main-onboarding':'Форма занимает ширину карточки; имя, выбор руки, язык и Save видны. Исправлены узкая колонка и перекрытие кнопок фото.',
 'main-lobby':'Главное меню после реального входа. Форма входа скрыта; заголовок, вкладки, art и Play видны.',
 'profile':'Редактор с заполненным именем. Общий материал 93% непрозрачности / 7% прозрачности; blur фона настоящий, Save и Back доступны.',
 'rules':'Правила Push Pit: четыре читаемых раздела; нижние действия видны. Фон размыт и затемнён.',
 'rankings-populated':'Три строки тестовой истории; имена, места и очки читаются. Back расположен внутри листа.',
 'player-stats-populated':'Профиль из рейтинга с тремя играми, победой, процентом и рекордом. Это изолированная QA-история.',
 'players-audio-settings':'Состав из трёх реальных подключений и настройки звука. Имена, слайдеры и Back видны.',
 'return-without-qr':'Раскрытое встроенное объяснение возвращения без QR. Текст читается; это disclosure, без модального blur.',
 'main-game-waiting':'Реальный запуск Tap Race: лого, цель, Rules & Controls, участники, Ready и нижние Pause/Lobby видны. Два дополнительных клиента — только lobby-сокеты.',
 'active-catalog-populated':'36 игр заполнены реальным действием Show Games. Исправлена компоновка в одну колонку; названия и Vote видны. Продолжение прокручивается.',
 'game-players-audio-settings':'Состав во время ожидания игры; статус текущего игрока In game. Настройки звука и действия доступны.',
 'game-rules':'Правила активного Tap Race. Текст и нижние действия видны; фон размыт и затемнён.',
 'pause-overlay':'Пауза открыта реальным Pause. Карточка, Resume и язык читаются; внешний фон и футер размыты и затемнены.',
 'host-join-qr':'Окно роли Host: QR, адрес и Copy/Back видны. Открыто реальной кнопкой Join; игрокам этот маршрут недоступен.',
 'host-confirm-stop':'Окно роли Host: подтверждение возврата всех. Обе подписанные кнопки одинаковой высоты; Cancel закрывает окно.',
 'host-updates':'Динамическое окно роли Host открыто через Updates. Все подписи на English, кнопки одной высоты и на одной линии. Check, Install и Rollback не нажимались; это просмотр состояния, без обновления приложения.'
};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const reviewed=report.rows.map(r=>({file:r.file,state:r.name,engine:r.engine,route:r.route,reviewed:true,observation:notes[r.name]}));
const manifest={capturedAt:report.capturedAt,reviewedAt:new Date().toISOString(),width:393,height:852,method:report.method,rows:reviewed,limits:['Browser fixtures, not physical iPhone.','Native persistent tabs reserve 56px; the browser dock is intentionally hidden by tabs.js.','Seeded ranking history is isolated QA data.','This gallery verifies settled states; interruption/motion timing requires separate evidence.'],sources:Object.fromEntries(['public/app-ux-20261005.css','public/app-ux-20261005.js','public/updates.js'].map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')]))};
fs.writeFileSync(path.join(out,'visual-review.json'),JSON.stringify(manifest,null,2));
let html='<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Popup 240 — controller</title><style>body{margin:0;background:#151020;color:#eee;font:16px/1.5 system-ui}header{padding:24px;max-width:1000px}h1{font-size:28px}nav{display:flex;gap:16px;flex-wrap:wrap}a{color:#d2ff82}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:24px;padding:24px}figure{margin:0;min-width:0;background:#241d32;padding:16px;border-radius:20px}img{display:block;width:100%;max-width:393px;height:auto;margin:auto;border-radius:10px}figcaption{max-width:393px;margin:12px auto 0}h2{font-size:18px;margin:0 0 8px}.meta{font-size:13px;color:#b9abcb}section>h2{padding:0 24px;font-size:24px}</style><header><h1>Окна и главные экраны контроллера — 240</h1><p>'+esc(report.method)+'</p><p>'+esc(manifest.limits.join(' '))+'</p><nav>';
for(const engine of ['webkit','chromium'])for(const route of ['web','native'])html+='<a href="#'+engine+'-'+route+'">'+engine+' · '+route+'</a>';
html+='</nav></header>';
for(const engine of ['webkit','chromium'])for(const route of ['web','native']){html+='<section id="'+engine+'-'+route+'"><h2>'+engine+' · '+(route==='web'?'QR web controller':'native bridge/tabs fixture')+'</h2><div class="grid">';for(const r of reviewed.filter(r=>r.engine===engine&&r.route===route))html+='<figure><a href="'+r.file+'"><img loading="lazy" src="'+r.file+'" alt="'+esc(r.state)+'"></a><figcaption><h2>'+esc(r.state)+'</h2><p>'+esc(r.observation)+'</p><p class="meta">393×852 · '+esc(r.file)+'</p></figcaption></figure>';html+='</div></section>';}
fs.writeFileSync(path.join(out,'index.html'),html+'</html>');console.log(JSON.stringify({images:reviewed.length,ok:report.ok}));

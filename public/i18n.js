/* Shared presentation-only localization. Never changes game protocol or player input. */
(() => {
 'use strict';
 const KEY='local-party-language', FORCE_KEY='local-party-language-override';
 // English is the default; explicit personal and room language choices persist.
 const valid=value=>value==='en'||value==='ru';
 const read=key=>{try{return localStorage.getItem(key);}catch{return null;}};
 const write=(key,value)=>{try{localStorage.setItem(key,value);}catch{}};
 let parentLocale;try{parentLocale=parent!==window?parent.PartyI18n?.language:null;}catch{}
 let language=valid(parentLocale)?parentLocale:valid(read(KEY))?read(KEY):'en';
 const originals=new WeakMap(), attributes=new WeakMap(), names=new Set(), cache=new Map(), missing=new Set();
 const dictionary=window.PARTY_TRANSLATIONS||{};
 const reverseUI=new Map();
 for(const [ru,en]of Object.entries(dictionary))if(!reverseUI.has(en.toLocaleLowerCase()))reverseUI.set(en.toLocaleLowerCase(),ru);
 const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const caseKeys=new Map(Object.keys(dictionary).map(key=>[key.toLocaleLowerCase(),key]));
 const phrases=Object.keys(dictionary).filter(s=>s.length>=2&&/[А-Яа-яЁё]/.test(s)).sort((a,b)=>b.length-a.length);
 const matcher=phrases.length?new RegExp(phrases.map(escape).join('|'),'giu'):null;
 function protectPlayers(players){for(const player of players||[])if(typeof player?.name==='string'&&player.name&&!names.has(player.name)){names.add(player.name);cache.clear();}}
 function translate(value,{ui=false}={}){
  const text=String(value??'');if(!ui&&names.has(text.trim()))return text;
  // English-authored interface labels use exact phrases only. Never reverse
  // fragments inside player names, private prompts, stories or entered text.
  if(language==='ru'){
   if(!ui)return text;
   const trimmed=text.trim(),ru=reverseUI.get(trimmed.toLocaleLowerCase());
   return ru?text.replace(trimmed,trimmed===trimmed.toLocaleUpperCase()?ru.toLocaleUpperCase():ru):text;
  }
  if(!/[А-Яа-яЁё]/.test(text))return text;
  const cacheKey=language+':'+(ui?'ui:':'text:')+text;if(cache.has(cacheKey))return cache.get(cacheKey);
  const trimmed=text.trim();if(!ui&&[...names].some(name=>name.toLocaleUpperCase()===trimmed.toLocaleUpperCase()||(trimmed.length<=3&&name.toLocaleUpperCase().startsWith(trimmed.toLocaleUpperCase()))))return text;
  if(Object.prototype.hasOwnProperty.call(dictionary,trimmed))return text.replace(trimmed,dictionary[trimmed]);
  if(!matcher){missing.add(trimmed);return text;}
  // Reserve names before replacing dynamic status fragments (e.g. “Turn: Anna”).
  const reserved=[];let safe=text;
  for(const name of names)if(safe.includes(name)){const token=`\uE000${reserved.length}\uE001`;reserved.push(name);safe=safe.split(name).join(token);}
  safe=safe.replace(/(\d+)\s*с(?=$|[\s·/])/gu,'$1s');
  safe=safe.replace(matcher,(match,offset,source)=>{
   const before=source[offset-1]||'',after=source[offset+match.length]||'';
   if(/[А-Яа-яЁё]/.test(before)&&/^[А-Яа-яЁё]/.test(match)||/[А-Яа-яЁё]/.test(after)&&/[А-Яа-яЁё]$/.test(match))return match;
   const key=caseKeys.get(match.toLocaleLowerCase()),translated=dictionary[key];return match===match.toLocaleUpperCase()?translated.toLocaleUpperCase():translated;
  });
  // Preserve useful content (including results) even when a phrase is missing.
  if(/[А-Яа-яЁё]/.test(safe))missing.add(trimmed);
  const result=safe.replace(/\uE000(\d+)\uE001/g,(_,index)=>reserved[Number(index)]);
  if(cache.size>=512)cache.clear();cache.set(cacheKey,result);return result;
 }
 const excluded=element=>!element||!!element.closest('script,style,textarea,input,[contenteditable], [data-no-translate], [translate="no"], .player-name, .playerName, .hp-player-name, #myName, #headerName');
 function textNode(node){
  if(excluded(node.parentElement))return;
  const option=node.parentElement.closest('option');
  // Some older games use <option>Russian text</option> without a value.
  // Translating that label must never change the protocol value (Spy locations).
  if(option&&!option.hasAttribute('value'))option.setAttribute('value',option.textContent);
  const previous=originals.get(node),current=node.nodeValue;
  const source=previous&&current===previous.rendered?previous.source:current;
  // A player may be named “Пауза”. Literal name nodes stay excluded above,
  // while semantic controls must still say “Pause” in the English interface.
  const ui=!!node.parentElement.closest('[data-i18n-ui],button,label,summary,#pauseButton,#pauseTitle,#hudValue,#phase,#waitingTitle,#exitVoteButton,#readyButton,.hp-action-primary,.hp-stat-label,.hp-selector-label');
  const rendered=translate(source,{ui});originals.set(node,{source,rendered});
  if(current!==rendered)node.nodeValue=rendered;
 }
 function elementAttributes(element){
  if(element.matches?.('[data-no-translate],[translate="no"]'))return;
  let saved=attributes.get(element);if(!saved){saved={};attributes.set(element,saved);}
  for(const name of ['placeholder','title','aria-label','alt'])if(element.hasAttribute(name)){
   const current=element.getAttribute(name),old=saved[name],source=old&&old.rendered===current?old.source:current,rendered=translate(source,{ui:name!=='alt'});
   saved[name]={source,rendered};if(current!==rendered)element.setAttribute(name,rendered);
  }
 }
 function apply(root=document.documentElement){
  if(!root)return;if(root.nodeType===3){textNode(root);return;}
  if(root.nodeType===1)elementAttributes(root);
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT);
  let node;while((node=walker.nextNode()))if(node.nodeType===3)textNode(node);else elementAttributes(node);
 }
 function propagate(){
  document.documentElement.lang=language;
  for(const frame of document.querySelectorAll('iframe'))try{frame.contentWindow.PartyI18n?.setLanguage(language,{persist:false});}catch{}
  document.querySelectorAll('[data-party-language]').forEach(select=>{select.value=language;});
  window.dispatchEvent(new CustomEvent('party-language-change',{detail:{language}}));
 }
 function setLanguage(value,{persist=true}={}){if(!valid(value))return false;language=value;if(persist)write(KEY,value);apply();propagate();return true;}
 function acceptRoomLanguage(override){
  if(!override||!valid(override.language)||typeof override.revision!=='string'||!override.revision)return false;
  if(read(FORCE_KEY)===override.revision)return false;
  write(FORCE_KEY,override.revision);setLanguage(override.language);return true;
 }
 function createPicker(){
  const label=document.createElement('label');label.className='party-language-setting';
  label.style.cssText='display:flex;align-items:center;justify-content:center;gap:12px;min-height:44px;margin:12px 0;font-size:14px;flex-wrap:wrap';
  const caption=document.createElement('span');caption.textContent='Язык';label.append(caption);
  const select=document.createElement('select');select.dataset.partyLanguage='';select.setAttribute('aria-label','Язык');
  select.style.cssText='min-height:44px;min-width:136px;max-width:100%;padding:8px 12px;font:inherit;border-radius:12px;background:#20232b;color:#fff;border:1px solid #ffffff30';
  for(const [value,text]of [['en','English'],['ru','Русский']]){const option=document.createElement('option');option.value=value;option.textContent=text;select.append(option);}
  select.value=language;select.addEventListener('change',()=>setLanguage(select.value));label.append(select);apply(label);return label;
 }
 window.PartyI18n={get language(){return language;},get missing(){return [...missing];},setLanguage,acceptRoomLanguage,protectPlayers,t:translate,apply,createPicker};
 for(const method of ['alert','confirm','prompt'])if(typeof window[method]==='function'){
  const original=window[method].bind(window);window[method]=(message,...args)=>original(translate(message),...args);
 }
 // Canvas HUDs use the same locale, but usernames are reserved verbatim.
 if(window.CanvasRenderingContext2D)for(const method of ['fillText','strokeText','measureText']){
  const original=CanvasRenderingContext2D.prototype[method];
  CanvasRenderingContext2D.prototype[method]=function(text,...args){return original.call(this,translate(text),...args);};
 }
 function start(){
  protectPlayers(window.PARTY_ROSTER);protectPlayers([window.PARTY_PROFILE]);apply();propagate();
  const observer=new MutationObserver(records=>{
   observer.disconnect();
   for(const record of records){if(record.type==='characterData')textNode(record.target);else if(record.type==='attributes')elementAttributes(record.target);else for(const node of record.addedNodes)apply(node);}
   observe();
  });
  const observe=()=>observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['placeholder','title','aria-label','alt']});observe();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
 window.addEventListener('storage',event=>{if(event.key===KEY&&valid(event.newValue))setLanguage(event.newValue,{persist:false});});
})();

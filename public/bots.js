/* Each companion is a real authenticated controller using the shared bridge. */
(()=>{const frames=new Map();window.PartyBots={update(state,profiles=[]){
 const ids=new Set(profiles.map(p=>p.id));for(const [id,entry]of frames)if(!ids.has(id)){entry.frame.remove();frames.delete(id);}
 for(const profile of profiles){let entry=frames.get(profile.id);if(!entry){const frame=document.createElement('iframe');frame.title=profile.name;frame.style.cssText='position:fixed;left:-10000px;top:0;width:390px;height:844px;pointer-events:none';frame.setAttribute('aria-hidden','true');frame.tabIndex=-1;entry={frame,instance:'',loaded:false};frames.set(profile.id,entry);document.body.append(frame);
 const data=JSON.stringify(profile).replace(/</g,'\\u003c');
 frame.srcdoc=`<!doctype html><html><body><script>window.PARTY_PROFILE=${data};window.PARTY_TEST_BOT=true;let socket;function connect(){socket=new WebSocket((parent.location.protocol==='https:'?'wss:':'ws:')+'//'+parent.location.host+'/lobby');socket.onopen=()=>socket.send(JSON.stringify({type:'join',...PARTY_PROFILE}));socket.onmessage=e=>{const m=JSON.parse(e.data);if(m.type==='replaced'||m.type==='kicked'){socket.onclose=null;document.querySelector('iframe')?.remove()}};socket.onclose=e=>{if(![4001,4003].includes(e.code))setTimeout(connect,800)}}connect();window.addEventListener('message',e=>{if(e.source!==parent||e.origin!==parent.location.origin)return;if(e.data.type==='bot-game'){window.PARTY_INSTANCE=e.data.instance;let f=document.querySelector('iframe');if(!f){f=document.createElement('iframe');f.style='width:390px;height:844px';document.body.append(f)}f.src=e.data.url}else if(e.data.type==='party-ui'){window.PARTY_UI=e.data.ui;window.PARTY_SESSION=e.data.session;if(Array.isArray(e.data.roster))window.PARTY_ROSTER=e.data.roster;document.querySelector('iframe')?.contentWindow.postMessage(e.data,parent.location.origin)}});<\/script></body></html>`;
 frame.onload=()=>{entry.loaded=true;entry.instance='';window.PartyBots.update(window.PartyBots.state,window.PartyBots.profiles);};}
 if(!entry.loaded)continue;const active=state?.active,game=state?.catalog.find(g=>g.id===active?.id);if(active&&game&&entry.instance!==active.instance){entry.instance=active.instance;entry.frame.contentWindow.postMessage({type:'bot-game',instance:active.instance,url:'/games/'+game.id+game.player},location.origin);}else if(!active&&entry.instance){entry.instance='';entry.frame.contentWindow.postMessage({type:'bot-game',instance:null,url:'about:blank'},location.origin);}if(active)entry.frame.contentWindow.postMessage({type:'party-ui',ui:active.ui,session:active.session,game:game&&{id:game.id,title:game.title},roster:(state.players||[]).map(({id,name,hand,avatar,testBot,gameReady})=>({id,name,hand,avatar:avatar||null,testBot:!!testBot,gameReady:!!gameReady}))},location.origin);
 }window.PartyBots.state=state;window.PartyBots.profiles=profiles;
}};
// WebKit throttles timers in offscreen iframes, sometimes to one tick/second.
// Drive all companions from this visible owner document instead. Removed frames
// disappear from the map, so there are no retained timers/old-match callbacks.
setInterval(()=>{for(const {frame}of frames.values()){
 try{const game=frame.contentDocument?.querySelector('iframe')?.contentWindow;game?.PARTY_BOT_TICK?.();game?.PARTY_BOT_ENGINE_TICK?.();}
 catch(error){if(error.name!=='SecurityError')console.error('Bot tick failed',error);}
}},100);
})();

export class PartyConnection extends EventTarget {
  constructor(host=false){super();this.host=host;this.id=null;this.closed=false;this.connect();}
  connect(){
    const url=new URL('ws',document.baseURI);url.protocol=location.protocol==='https:'?'wss:':'ws:';
    const ws=this.ws=new WebSocket(url);
    ws.onopen=()=>{
      if(this.ws!==ws)return;
      this.dispatchEvent(new CustomEvent('status',{detail:'Подключаемся…'}));
      if(this.host)this.send('host',{key:window.SS_CONFIG.hostKey});
      else this.send('join',{name:window.PARTY_PROFILE?.name||sessionStorage.getItem('ss-name')||'Игрок',
        hand:window.PARTY_PROFILE?.hand||'right',token:sessionStorage.getItem('ss-token'),bot:!!window.parent.PARTY_TEST_BOT});
    };
    ws.onmessage=e=>{
      if(this.ws!==ws)return;let m;try{m=JSON.parse(e.data);}catch{return;}
      if(m.type==='joined'){this.id=m.data.id;if(m.data.token)sessionStorage.setItem('ss-token',m.data.token);}
      if(m.type==='joined'||m.type==='host-ok')this.dispatchEvent(new CustomEvent('status',{detail:'В игре'}));
      if(m.type==='join_error'||m.type==='error')this.dispatchEvent(new CustomEvent('status',{detail:m.data?.message||'Ошибка входа'}));
      this.dispatchEvent(new CustomEvent(m.type,{detail:m.data}));
    };
    ws.onclose=()=>{if(this.ws!==ws)return;this.dispatchEvent(new CustomEvent('status',{detail:'Восстанавливаем связь…'}));if(!this.closed)setTimeout(()=>this.connect(),800);};
    ws.onerror=()=>{};
  }
  send(type,data={}){if(this.ws?.readyState===1)this.ws.send(JSON.stringify({type,data}));}
  stop(){this.closed=true;this.ws?.close();}
}

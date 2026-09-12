const path=require('path');
process.env.PARTY_TLS_PFX=path.join(__dirname,'../data/tls/localparty.pfx');
process.env.PARTY_TLS_PASSWORD='localparty-local-only';
process.env.PARTY_PORT='59436';
process.env.PARTY_NO_BROWSER='1';
process.env.PARTY_DATA_FILE=path.join(__dirname,'../data/https-party.json');
require('../server');
require('http').createServer((req,res)=>{if(req.url!=='/localparty.cer'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});return res.end('<h1>LocalParty · Safari</h1><p><a href="/localparty.cer">Установить сертификат LocalParty</a></p><p>Настройки → Основные → VPN и управление устройством → LocalParty LAN → Установить.</p><p>Затем: Основные → Об этом устройстве → Доверие сертификатам → LocalParty LAN.</p><p><a href="https://192.168.0.91:59436/">Открыть игру по HTTPS</a></p>');}res.writeHead(200,{'Content-Type':'application/x-x509-ca-cert'});res.end(require('fs').readFileSync(path.join(__dirname,'../data/tls/localparty.cer')));}).listen(59437,'0.0.0.0');

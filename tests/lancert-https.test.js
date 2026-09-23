const {test}=require('node:test'),assert=require('node:assert/strict');
const {execFileSync,spawnSync}=require('node:child_process');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {createLANHTTPS,privateIPv4}=require('../lib/lancert-https');

test('only private Wi-Fi ranges are eligible for local HTTPS',()=>{
 for(const ip of ['10.1.2.3','172.16.0.4','172.31.255.254','192.168.0.1'])assert.equal(privateIPv4(ip),true);
 for(const ip of ['127.0.0.1','169.254.0.1','172.32.0.1','192.0.2.1','8.8.8.8','192.168.1.999','192.168.1.5/24'])assert.equal(privateIPv4(ip),false);
});

test('one Wi-Fi tap registers an IP, publishes DNS-01, and reuses its private certificate',{skip:spawnSync('openssl',['version']).status!==0},async()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'party-acme-')),keyFile=path.join(directory,'key.pem'),certFile=path.join(directory,'cert.pem');
 try{
  execFileSync('openssl',['req','-x509','-newkey','ec','-pkeyopt','ec_paramgen_curve:prime256v1','-nodes','-keyout',keyFile,'-out',certFile,'-days','60','-subj','/CN=room.lancert.dev','-addext','subjectAltName=DNS:room.lancert.dev'],{stdio:'ignore'});
  const key=fs.readFileSync(keyFile),cert=fs.readFileSync(certFile),requests=[];
  const registration={hostname:'room.lancert.dev',username:'test-user',password:'one-time-secret',subdomain:'room'};
  const serviceRequest=async(route,options)=>{requests.push({route,...options});return route.startsWith('/register/')?registration:{txt:options.body.txt};};
  const acmeModule={crypto:{createPrivateEcdsaKey:async()=>Buffer.from('account-key'),createCsr:async()=>[key,Buffer.from('csr')]},Client:class{async auto(options){assert.equal(options.challengePriority[0],'dns-01');await options.challengeCreateFn({}, {type:'dns-01'},'x'.repeat(43));return cert;}}};
  const options={serviceRequest,acmeModule,lookup:async()=>({address:'192.168.1.23'}),wait:async()=>{}};
  const tls=createLANHTTPS(directory,options),first=await tls.forAddress('192.168.1.23');
  assert.equal(first.hostname,'room.lancert.dev');assert.equal(first.cert,cert.toString());
  assert.deepEqual(requests.map(x=>x.route),['/register/192.168.1.23','/update']);
  assert.deepEqual(requests[1].body,{subdomain:'room',txt:'x'.repeat(43)});
  assert.equal(requests[1].headers['X-Api-Key'],'one-time-secret');
  assert.equal(fs.statSync(path.join(directory,'https','lancert.json')).mode&0o777,0o600);
  const restored=createLANHTTPS(directory,{...options,serviceRequest:()=>{throw Error('A cached certificate must not register again');}});
  assert.equal((await restored.forAddress('192.168.1.23')).hostname,first.hostname);
 }finally{fs.rmSync(directory,{recursive:true,force:true});}
});

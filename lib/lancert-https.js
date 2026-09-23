'use strict';
const crypto=require('node:crypto');
const dns=require('node:dns').promises;
const fs=require('node:fs');
const https=require('node:https');
const path=require('node:path');
const acme=require('acme-client');

const SERVICE='https://lancert.dev';
const DIRECTORY=acme.directory.letsencrypt.production;
const hostnamePattern=/^[a-z0-9-]+\.lancert\.dev$/;

function privateIPv4(value){
 if(!/^(?:\d{1,3}\.){3}\d{1,3}$/.test(String(value||'')))return false;
 const parts=String(value).split('.').map(Number);
 if(parts.length!==4||parts.some(x=>!Number.isInteger(x)||x<0||x>255))return false;
 return parts[0]===10||(parts[0]===172&&parts[1]>=16&&parts[1]<=31)||(parts[0]===192&&parts[1]===168);
}
function request(pathname,{method='GET',headers={},body}={}){
 return new Promise((resolve,reject)=>{
  const request=https.request(SERVICE+pathname,{method,headers:{'User-Agent':'LocalParty-iOS/1','Accept':'application/json',...headers},timeout:12000},response=>{
   const chunks=[];let size=0;
   response.on('data',chunk=>{size+=chunk.length;if(size>32768){request.destroy(Error('Сервис HTTPS вернул слишком большой ответ.'));return;}chunks.push(chunk);});
   response.on('end',()=>{const raw=Buffer.concat(chunks).toString('utf8');let value;try{value=raw?JSON.parse(raw):{};}catch{return reject(Error('Сервис HTTPS вернул неверный ответ.'));}if(response.statusCode<200||response.statusCode>=300)return reject(Error(value.message||value.error||`Сервис HTTPS ответил ${response.statusCode}.`));resolve(value);});
  });
  request.on('timeout',()=>request.destroy(Error('Сервис HTTPS не ответил вовремя.')));request.on('error',reject);if(body)request.write(JSON.stringify(body));request.end();
 });
}
function createLANHTTPS(dataDirectory,{serviceRequest=request,acmeModule=acme,lookup=dns.lookup,wait=ms=>new Promise(resolve=>setTimeout(resolve,ms))}={}){
 const directory=path.join(dataDirectory,'https');fs.mkdirSync(directory,{recursive:true,mode:0o700});
 const stateFile=path.join(directory,'lancert.json'),accountFile=path.join(directory,'acme-account.pem');
 const read=()=>{try{return JSON.parse(fs.readFileSync(stateFile,'utf8'));}catch{return {};}};
 const save=value=>{const temporary=stateFile+'.tmp';fs.writeFileSync(temporary,JSON.stringify(value),{mode:0o600});fs.renameSync(temporary,stateFile);};
 async function accountKey(){
  if(fs.existsSync(accountFile))return fs.readFileSync(accountFile);
  const key=await acmeModule.crypto.createPrivateEcdsaKey();fs.writeFileSync(accountFile,key,{mode:0o600});return key;
 }
 function usable(record,ip){
  if(record.ip!==ip||!hostnamePattern.test(record.hostname||'')||!record.cert||!record.key)return false;
  try{const leaf=new crypto.X509Certificate(record.cert);return !!leaf.checkHost(record.hostname)&&Date.parse(leaf.validTo)>Date.now()+21*86400000&&leaf.publicKey.export({type:'spki',format:'der'}).equals(crypto.createPublicKey(record.key).export({type:'spki',format:'der'}));}catch{return false;}
 }
 async function checkDNS(hostname,ip){
  for(let attempt=0;attempt<6;attempt++){
   try{const resolved=await lookup(hostname,{family:4});if(resolved.address===ip)return;}catch{}
   await wait(1500);
  }
  throw Error('Локальное HTTPS-имя не разрешается в адрес этого iPhone. Проверьте интернет и защиту от DNS rebinding на роутере.');
 }
 return {async forAddress(ip){
  if(!privateIPv4(ip))throw Error('Для HTTPS нужна обычная частная Wi-Fi сеть (10.x, 172.16–31.x или 192.168.x).');
  let record=read();if(usable(record,ip)){await checkDNS(record.hostname,ip);return {hostname:record.hostname,key:record.key,cert:record.cert};}
  if(record.ip!==ip||!record.hostname||!record.username||!record.password){
   let registration;try{registration=await serviceRequest('/register/'+ip,{method:'POST'});}catch(e){throw Error('Не удалось получить локальное HTTPS-имя: '+e.message);}
   if(!hostnamePattern.test(registration.hostname||'')||!registration.username||!registration.password||!registration.subdomain)throw Error('Сервис HTTPS вернул неверные данные регистрации.');
   record={ip,hostname:registration.hostname,username:registration.username,password:registration.password,subdomain:registration.subdomain};
   save(record); // The password is returned once; preserve it before requesting a certificate.
  }
  let certificate;
  try{
   const client=new acmeModule.Client({directoryUrl:DIRECTORY,accountKey:await accountKey()});
   const [key,csr]=await acmeModule.crypto.createCsr({commonName:record.hostname,altNames:[record.hostname]});
   certificate=await client.auto({csr,termsOfServiceAgreed:true,challengePriority:['dns-01'],skipChallengeVerification:true,
    challengeCreateFn:async(_authorization,challenge,value)=>{
     if(challenge.type!=='dns-01')throw Error('Неожиданный тип проверки сертификата.');
     await serviceRequest('/update',{method:'POST',headers:{'Content-Type':'application/json','X-Api-User':record.username,'X-Api-Key':record.password},body:{subdomain:record.subdomain,txt:value}});
     await wait(2500);
    },challengeRemoveFn:async()=>{}});
   record={...record,key:key.toString(),cert:certificate.toString()};
   if(!usable(record,ip))throw Error('Полученный сертификат не подходит к адресу комнаты.');
   save(record);
  }catch(e){throw Error('Не удалось выпустить HTTPS-сертификат: '+e.message);}
  await checkDNS(record.hostname,ip);
  return {hostname:record.hostname,key:record.key,cert:record.cert};
 }};
}
module.exports={createLANHTTPS,privateIPv4};

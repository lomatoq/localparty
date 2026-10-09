'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../public/app.js'),'utf8');
function appIdentity(storage,fetch=async()=>({ok:true})){
 const context={localStorage:storage,profile:{token:'qa-auth-token',id:'qa-id',name:'Returning player',hand:'left'},crypto:{randomUUID:()=> 'qa-installation-id'},fetch};
 vm.createContext(context);
 for(const key of ['storageGet','storageSet','storageRemove','clientId'])vm.runInContext(source.match(new RegExp(' const '+key+'=.*\\n'))[0],context);
 vm.runInContext(source.match(/ async function persist\(.*\n/)[0],context);
 return context;
}
test('profile quota failure still persists the validated token through the device cookie',async()=>{
 const calls=[],context=appIdentity({getItem:()=> 'known-client',setItem(){throw Object.assign(Error('full'),{name:'QuotaExceededError'});}},async(url,options)=>{calls.push({url,options});});
 await vm.runInContext('persist()',context);
 assert.equal(calls.length,1);assert.equal(calls[0].url,'/api/profile');
 assert.deepEqual(JSON.parse(calls[0].options.body),{token:'qa-auth-token'});
 assert.equal(calls[0].options.credentials,'same-origin');assert.equal(calls[0].options.keepalive,true);
 assert(!calls[0].url.includes('qa-auth-token'));
});
test('blocked browser storage does not abort identity bootstrap or cookie fallback',async()=>{
 const calls=[],blocked=()=>{throw Object.assign(Error('blocked'),{name:'SecurityError'});};
 const context=appIdentity({getItem:blocked,setItem:blocked,removeItem:blocked},async url=>calls.push(url));
 assert.equal(vm.runInContext('clientId',context),'qa-installation-id');
 assert.equal(vm.runInContext('storageGet("local-party-profile")',context),null);
 assert.doesNotThrow(()=>vm.runInContext('storageRemove("local-party-profile")',context));
 await vm.runInContext('persist()',context);assert.deepEqual(calls,['/api/profile']);
});
test('temporary network failure retains the local credential cache',async()=>{
 const stored=new Map(),context=appIdentity({getItem:key=>stored.get(key)||null,setItem:(key,value)=>stored.set(key,value)},async()=>{throw Error('offline');});
 await vm.runInContext('persist()',context);
 assert.equal(JSON.parse(stored.get('local-party-profile')).token,'qa-auth-token');
 assert.equal(stored.get('local-party-client-id'),'qa-installation-id');
});
test('leaving before the cookie reply still uses the acknowledged identity snapshot',async()=>{
 const stored=new Map(),calls=[];let release;
 const context=appIdentity({getItem:()=> 'known-client',setItem:(key,value)=>stored.set(key,value)},async(url,options)=>{calls.push(options);await new Promise(resolve=>release=resolve);});
 const pending=vm.runInContext('persist()',context);vm.runInContext('profile=null',context);release();await pending;
 assert.equal(JSON.parse(calls[0].body).token,'qa-auth-token');
 assert.equal(JSON.parse(stored.get('local-party-profile')).id,'qa-id');
});
test('empty identity does not overwrite the credential cache or issue a cookie request',async()=>{
 const calls=[],writes=[],context=appIdentity({getItem:()=> 'known-client',setItem:(key,value)=>writes.push(key)},async()=>calls.push('fetch'));
 vm.runInContext('profile=null',context);await vm.runInContext('persist()',context);
 assert.deepEqual(writes,[]);assert.deepEqual(calls,[]);
});

const {test}=require('node:test');
const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const path=require('node:path');
const {setTimeout:delay}=require('node:timers/promises');
test('late foreground requests cannot override suspension, including duplicate revisions', {timeout:15000}, async()=>{
 const child=spawn(process.execPath,['server.js'],{cwd:path.join(__dirname,'..'),env:{...process.env,PARTY_ADMIN_KEY:'execution-regression',PARTY_PORT:'0',PARTY_NO_BROWSER:'1',PARTY_EPHEMERAL:'1'},stdio:['ignore','pipe','pipe']});
 let output='';child.stdout.on('data',d=>output+=d);child.stderr.on('data',d=>output+=d);
 try {
  for(let i=0;i<200&&!/localhost:(\d+)/.test(output);i++)await delay(25);
  const port=output.match(/localhost:(\d+)/)?.[1];assert.ok(port,output);
  const command=async value=>{const r=await fetch('http://127.0.0.1:'+port+'/api/manage',{method:'POST',headers:{Authorization:'Bearer execution-regression','Content-Type':'application/json'},body:JSON.stringify(value)});assert.equal(r.status,200);return r.json();};
  const execution=(allowed,revision)=>command({type:'execution',allowed,revision});
  assert.equal((await execution(false,2)).executionAllowed,false);
  assert.equal((await execution(true,1)).executionAllowed,false);
  assert.equal((await execution(true,2)).executionAllowed,false);
  assert.equal((await execution(true,3)).executionAllowed,true);
  assert.equal((await execution(false,2)).executionAllowed,true);
 } finally {const exit=new Promise(r=>child.once('exit',r));child.kill();await exit;}
});

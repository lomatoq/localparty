'use strict';
// Opt-in DEBUG Simulator WKWebView command channel; no device/deployment changes.
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const udid='813D1542-DA22-468D-921D-0A50760224EE';
const dir=path.join(execFileSync('xcrun',['simctl','get_app_container',udid,'com.localparty.launcher','data'],{encoding:'utf8'}).trim(),'Documents');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function run(script,surface='controller',tab){const id=Date.now()+'-keyboard243-'+Math.random();const cmd={id,script,surface,...(tab?{tab}:{})};fs.writeFileSync(path.join(dir,'ui-audit-command.json.tmp'),JSON.stringify(cmd));fs.renameSync(path.join(dir,'ui-audit-command.json.tmp'),path.join(dir,'ui-audit-command.json'));for(let i=0;i<200;i++){await sleep(50);try{const r=JSON.parse(fs.readFileSync(path.join(dir,'ui-audit-result.json'),'utf8'));if(r.id===id){if(r.error)throw Error(r.error);return r;}}catch(e){if(e.code!=='ENOENT'&&!(e instanceof SyntaxError))throw e;}}throw Error('Audit timeout');}
if(require.main===module)(async()=>{const script=fs.readFileSync(process.argv[2],'utf8');const r=await run(script,process.argv[3]||'controller',process.argv[4]);console.log(JSON.stringify(r));})().catch(e=>{console.error(e);process.exitCode=1});
module.exports={run,udid};

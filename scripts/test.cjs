'use strict';
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.join(__dirname,'..'),files=fs.readdirSync(path.join(root,'tests')).filter(f=>/\.test\.(?:js|cjs)$/.test(f)).map(f=>path.join('tests',f));
// A full UI capture pass can coexist with this suite. Allow its coordinator to
// bound test processes without changing coverage or per-test assertions.
const concurrency=Number(process.env.PARTY_TEST_CONCURRENCY),limits=Number.isInteger(concurrency)&&concurrency>0?['--test-concurrency='+concurrency]:[];
const result=spawnSync(process.execPath,['--test',...limits,...files],{cwd:root,stdio:'inherit',windowsHide:true});if(result.error)throw result.error;process.exitCode=result.status??1;
if(!process.exitCode)for(const file of ['games/party/action.test.cjs','games/spy/integration.test.cjs']){const check=spawnSync(process.execPath,[file],{cwd:root,stdio:'inherit',windowsHide:true});if(check.error)throw check.error;if(check.status){process.exitCode=check.status;break;}}

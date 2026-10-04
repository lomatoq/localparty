'use strict';
// Sequential real managed games: only one browser instance is alive at a time.
const {spawnSync}=require('node:child_process'),fs=require('node:fs'),path=require('node:path');
const base='output/playwright/ui-rework-2026-10-02/group10-fresh/final-exact';fs.mkdirSync(base,{recursive:true});
const cases=[
 ['swarm_gate','scripts/qa/group10-real-shots.cjs',{QA_SWARM_SCENE:'1'}],
 ['peek_shoot','scripts/qa/group10-real-shots.cjs',{}],
 ['curling','scripts/qa/group10-real-shots.cjs',{}],
 ['bowling','scripts/qa/group10-real-shots.cjs',{}],
 ['bow_club','scripts/qa/group10-bow-releases.cjs',{}],
 ['curling-drawer','scripts/qa/group10-real-shots.cjs',{QA_GAME:'curling',QA_DRAWER:'1'}]
];
const summary=[];for(const [game,script,extra]of cases){const startedAt=new Date().toISOString(),output=path.join(base,game);const result=spawnSync(process.execPath,[script],{env:{...process.env,QA_GAME:game,QA_NATIVE:'1',QA_SPORTS_2_ONLY:'1',QA_SPORTS_INTERACTIONS:'1',QA_OUTPUT:output,...extra},stdio:'inherit'});summary.push({game,script,output,startedAt,finishedAt:new Date().toISOString(),exitCode:result.status,error:result.error?.message});fs.writeFileSync(path.join(base,'sequence.json'),JSON.stringify(summary,null,2));if(result.status!==0)process.exitCode=1;}

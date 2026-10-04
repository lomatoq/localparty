'use strict';

function validRank(value){return Number.isInteger(Number(value))&&Number(value)>0&&Number(value)<=64;}

function resultRanking(result={}){
 const supplied=result.ranking||{};
 return {kind:['score','teams','outcome'].includes(supplied.kind)?supplied.kind:'outcome',direction:supplied.direction==='asc'?'asc':'desc'};
}

function resultTeam(row={}){
 const team=typeof row.team==='number'&&Number.isInteger(row.team)&&row.team>=0&&row.team<=63?row.team:
  typeof row.team==='string'&&row.team.length>0&&row.team.length<=32?row.team:null;
 return team!==null&&typeof row.teamScore==='number'&&Number.isFinite(row.teamScore)?{team,teamScore:Math.max(-1e9,Math.min(1e9,row.teamScore))}:{};
}

function rankResultRows(rows,options={}){
 const clean=(Array.isArray(rows)?rows:[]).map((row,index)=>({...row,__index:index}));
 const ranking=resultRanking(options),teamValues=new Map();
 const teams=ranking.kind==='teams'&&clean.every(row=>{
  const team=resultTeam(row);if(!Object.hasOwn(team,'team'))return false;
  const key=team.teamScore;
  if(teamValues.has(team.team)&&teamValues.get(team.team)!==key)return false;
  teamValues.set(team.team,key);return true;
 });
 // A malformed team payload falls back to personal outcomes, never an invented team score.
 const kind=ranking.kind==='teams'&&!teams?'outcome':ranking.kind;
 const value=row=>teams?resultTeam(row).teamScore:Number.isFinite(Number(row.score))?Number(row.score):0;
 const outcome=row=>kind==='outcome'?Number(row.won===true):0;
 const signature=row=>`${outcome(row)}:${value(row)}`;
 const rankGroups=new Map();
 const coherent=clean.every(row=>{
  if(!validRank(row.rank))return false;
  const rank=Number(row.rank),key=signature(row);
  if(rankGroups.has(rank)&&rankGroups.get(rank)!==key)return false;
  rankGroups.set(rank,key);return true;
 });
 // Explicit engine places may encode survival, race time or a real tiebreaker.
 // Shared places are valid only for equal comparison values and equal outcomes.
 if(clean.length&&coherent&&kind==='outcome'){
  return clean.sort((a,b)=>Number(a.rank)-Number(b.rank)||a.__index-b.__index).map(({__index,...row})=>({...row,rank:Number(row.rank)}));
 }
 const direction=ranking.direction==='asc'?1:-1;
 clean.sort((a,b)=>outcome(b)-outcome(a)||direction*(value(a)-value(b))||a.__index-b.__index);
 let rank=0,previous='';const teamsSeen=new Set();
 return clean.map((row,index)=>{
  const key=signature(row);
  if(key!==previous)rank=teams?teamsSeen.size+1:index+1;previous=key;
  if(teams)teamsSeen.add(row.team);
  const {__index,...value}=row;return {...value,rank};
 });
}

module.exports={rankResultRows,validRank,resultRanking,resultTeam};

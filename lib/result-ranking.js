'use strict';

function validRank(value){return Number.isInteger(Number(value))&&Number(value)>0&&Number(value)<=64;}

function rankResultRows(rows){
 const clean=(Array.isArray(rows)?rows:[]).map((row,index)=>({...row,__index:index}));
 if(clean.length&&clean.every(row=>validRank(row.rank))){
  return clean.sort((a,b)=>Number(a.rank)-Number(b.rank)||a.__index-b.__index).map(({__index,...row})=>({...row,rank:Number(row.rank)}));
 }
 clean.sort((a,b)=>Number(b.won===true)-Number(a.won===true)||(Number(b.score)||0)-(Number(a.score)||0)||a.__index-b.__index);
 let rank=0,previous='';
 return clean.map((row,index)=>{
  const signature=`${row.won===true}:${Number(row.score)||0}`;
  if(signature!==previous)rank=index+1;previous=signature;
  const {__index,...value}=row;return {...value,rank};
 });
}

module.exports={rankResultRows,validRank};

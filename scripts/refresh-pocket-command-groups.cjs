'use strict';
// Mechanical regeneration only: preserve ids, catalog metadata and assets.
const fs=require('node:fs'),path=require('node:path');
const {readDirectory,summarize}=require('./analyze-pocket-reference.cjs');
const file=path.resolve(__dirname,'../games/arcade_deluxe/core/pocket-reference.generated.json');
const reference=JSON.parse(fs.readFileSync(file,'utf8'));
const raw=summarize(readDirectory(process.argv[2]));
let updated=0;
for(const weapon of reference.weapons){
 const source=raw.find(w=>w.source===weapon.source&&w.name===weapon.name);
 if(!source)throw new Error(`Missing source ${weapon.id}`);
 if(process.argv.includes('--graph')){
  Object.assign(weapon,source);updated+=source.chain.filter(n=>n.commands).length;continue;
 }
 for(const node of weapon.chain){
  const original=source.chain.find(n=>n.type===node.type&&n.name===node.name);
  if(!original||JSON.stringify(original.values)!==JSON.stringify(node.values))throw new Error(`Scalar mismatch ${weapon.id}/${node.name}`);
  if(original.commands){node.commands=original.commands;updated++;}
 }
}
fs.writeFileSync(file,JSON.stringify(reference,null,2)+'\n');
console.log(`${process.argv.includes('--graph')?'Rebuilt source graphs (preserved ids, indices, families and emitters)':'Verified every imported scalar'}; restored ${updated} ordered trigger groups`);

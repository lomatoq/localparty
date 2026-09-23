'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const dictionary=Object.assign({},require('../public/i18n-dictionary'),require('../public/i18n-shell'),require('../public/i18n-content'));
function strings(value){if(typeof value==='string')return /[А-Яа-яЁё]/.test(value)?[value]:[];if(Array.isArray(value))return value.flatMap(strings);if(value&&typeof value==='object')return Object.values(value).flatMap(strings);return[];}
for(const [name,file]of [['Millionaire and Sinyak Quiz','../games/millionaire/data/questions.json'],['Warsaw Quiz','../games/quiz/data/warsaw.json'],['Charades and DrawGuess','../games/crocodile/words.json']])test(name+' content has English translations for every source string',()=>{
 const source=[...new Set(strings(require(file)))],missing=source.filter(text=>!dictionary[text]||/[А-Яа-яЁё]/.test(dictionary[text]));
 assert.deepEqual(missing,[],name+' missing translations');
});
for(const [name,file,key,count]of [['Spy locations','../games/spy/server.js','LOCATIONS',40],['Monster prompts','../games/monster/server.js','CHARACTERS',100]])test(name+' have complete English content',()=>{
 const source=fs.readFileSync(require.resolve(file),'utf8'),start=source.indexOf('const '+key+' = [');assert(start>=0);
 const value=vm.runInNewContext(source.slice(start,source.indexOf('\n];',start)+3)+'\n'+key);assert.equal(value.length,count);
 assert.deepEqual([...new Set(strings(value))].filter(text=>!dictionary[text]||/[А-Яа-яЁё]/.test(dictionary[text])),[]);
});

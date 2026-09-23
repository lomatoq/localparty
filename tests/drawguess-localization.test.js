'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {DrawGuess,WORDS}=require('../games/drawguess/engine');
const dictionary=require('../public/i18n-content');
test('all 150 drawing prompts accept English and Russian answers in mixed-language rooms',()=>{
 assert.equal(WORDS.length,150);
 for(const secret of WORDS){assert.equal(typeof dictionary[secret],'string',secret+' translation missing');assert(!/[А-Яа-яЁё]/.test(dictionary[secret]));
  for(const answer of[secret,dictionary[secret]]){const game=new DrawGuess();game.join('artist','Artist');game.join('guess','Guesser');assert(game.start());game.secret=secret;assert(game.guess('guess',game.turnId,answer));assert.equal(game.players.get('guess').correct,1,secret+' / '+answer);}
 }
});

'use strict';
// Keep the released catalog intact; extensions explicitly name their engine.
const base=require('../catalog.json'),extra=require('../games/sports_siege/catalog.json');
const result=[...base];for(const game of extra)if(!result.some(g=>g.id===game.id))result.push(game);
module.exports=result;

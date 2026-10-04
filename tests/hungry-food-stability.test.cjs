'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{Arcade}=require('../games/arcade/simulation');
test('Eating a middle item preserves69 identities, positions and appearances and creates exactly one new item',()=>{
 const game=new Arcade('hungry',()=>.5);game.join('a','A');game.join('b','B');game.start();
 game.food.forEach(f=>Object.assign(f,{x:1100,y:650}));Object.assign(game.food[34],{x:100,y:100});
 const before=structuredClone(game.view().food),eaten=before[34],mass=game.players[0].mass;game.tick(.01);
 const after=game.view().food,retained=before.filter(f=>f.id!==eaten.id),added=after.filter(f=>!before.some(old=>old.id===f.id));
 assert.equal(after.length,70);assert.equal(new Set(after.map(f=>f.id)).size,70);assert.equal(added.length,1);assert(!after.some(f=>f.id===eaten.id));assert.equal(game.players[0].mass,mass+3);
 for(const old of retained)assert.deepEqual(after.find(f=>f.id===old.id),old);
 const previousMax=Math.max(...after.map(f=>f.id));game.start();assert(game.food.every(f=>f.id>previousMax),'Replay cannot recycle an old animation identity');
});
test('Actual renderer food phase stays stable when its array index changes and reduced motion stays still',()=>{
 const source=fs.readFileSync('games/arcade/public/app.js','utf8'),declaration=source.match(/function hungryFoodY\([^\n]+/)[0],sandbox={};vm.createContext(sandbox);vm.runInContext(declaration,sandbox);
 const food=[{id:1,x:200,y:100},{id:2,x:300,y:200},{id:3,x:400,y:300}],before=food.map(f=>sandbox.hungryFoodY(f,1000,false));food.splice(1,1);
 assert.equal(sandbox.hungryFoodY(food[1],1000,false),before[2]);assert.equal(sandbox.hungryFoodY(food[1],9000,true),food[1].y);
 assert.equal(sandbox.hungryFoodY(food[1],1000,false),sandbox.hungryFoodY({...food[1]},1000,false),'Fresh network object retains its phase');
});
test('A large Hungry meal animates the eater without shaking unrelated food or players',()=>{
 const sandbox={window:{},document:{documentElement:{lang:'en'}},matchMedia:()=>({matches:false}),performance:{now:()=>110},Image:class{},console};vm.createContext(sandbox);vm.runInContext(fs.readFileSync('games/arcade/public/arcade-juice.js','utf8'),sandbox);
 const juice=sandbox.window.ArcadeJuice,base={mode:'hungry',phase:'playing',players:[{id:'a',mass:20,x:100,y:100,color:'#58dafa'}]};juice.observe(base);juice.observe({...base,players:[{...base.players[0],mass:29}]});
 const shake=juice.shake();assert.equal(shake.x,0);assert.equal(shake.y,0);
 sandbox.performance.now=()=>160;assert.notEqual(juice.squash('a').x,1,'The eater keeps local impact feedback');
});
test('Actual Hungry absorption feedback preserves events without canvas shake; other modes retain collision shake',()=>{
 const source=fs.readFileSync('games/arcade/public/app.js','utf8'),start=source.indexOf('function drawFeedback(s){'),end=source.indexOf(' g.save();for(const b of feedbackBursts)',start);
 assert(start>=0&&end>start);const events=[],sandbox={feedbackKey:'',feedbackBursts:[],feedbackState:null,state:null,LocalPartyFeel:{emit:(type,options)=>events.push({type,...options})}};
 vm.createContext(sandbox);vm.runInContext(source.slice(start,end)+'}\ndrawFeedback.serial=0;',sandbox);
 const observe=s=>{sandbox.state=s;sandbox.drawFeedback(s);};
 observe({mode:'hungry',round:1,phase:'playing',time:0,players:[{id:'a',mass:23,dead:0,x:100,y:100,color:'#58dafa'},{id:'b',mass:20,dead:0,x:120,y:100,color:'#b9ff4d'}]});
 observe({mode:'hungry',round:1,phase:'playing',time:.1,players:[{id:'a',mass:37,dead:0,x:100,y:100,color:'#58dafa'},{id:'b',mass:20,dead:1.5,x:120,y:100,color:'#b9ff4d'}]});
 assert.deepEqual(events.map(e=>[e.type,e.shake]),[['score',false],['elimination',false]]);
 observe({mode:'flappy',round:1,phase:'playing',time:0,players:[{id:'a',alive:true,x:100,y:100,color:'#58dafa'}]});
 observe({mode:'flappy',round:1,phase:'playing',time:.1,players:[{id:'a',alive:false,x:100,y:100,color:'#58dafa'}]});
 assert.equal(events.at(-1).type,'collision');assert.equal(events.at(-1).shake,true);
});

const fs=require('fs'),p=require('path').join(__dirname,'../public/app.js');
let s=fs.readFileSync(p,'utf8');
s=s.replace("western_duel:['🤠','⭐']}[titleGame.id]", "western_duel:['🤠','⭐'],taprace:['👟','🏁'],punchmeter:['🥊','💥'],flappy:['🐤','🪽'],hungry:['🍔','🍩'],snakelines:['🐍','⚡'],carryball:['🏉','🥅']}[titleGame.id]");
fs.writeFileSync(p,s);

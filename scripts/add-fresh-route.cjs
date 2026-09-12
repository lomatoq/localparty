const fs=require('fs'),p='server.js';let s=fs.readFileSync(p,'utf8');s=s.replace("'/bots.js':'bots.js'","'/bots.js':'bots.js','/fresh.css':'fresh.css'");fs.writeFileSync(p,s);

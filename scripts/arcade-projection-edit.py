from pathlib import Path
p=Path('games/arcade/server.js')
s=p.read_text(encoding="utf-8")
s=s.replace("const state=()=>game.view();", "const state=()=>game.view();\n// Controllers need scores, turn and local feedback, not a copy of the rendered world.\nfunction controllerView(v){const {food,pipes,...rest}=v;return {...rest,players:v.players.map(({trail,...p})=>p)};}\n")
s=s.replace("const v=state();for(const ws of wss.clients){if(game.mode==='snakelines')", "const v=state(),controllerPacket=JSON.stringify({type:'state',data:controllerView(v)}),hostPacket=game.mode==='snakelines'?null:JSON.stringify({type:'state',data:v});for(const ws of wss.clients){if(!ws.host){if(ws.readyState===1)ws.send(controllerPacket);continue;}if(game.mode==='snakelines')")
s=s.replace("}else send(ws,'state',v);", "}else if(ws.readyState===1)ws.send(hostPacket);")
p.write_text(s,encoding="utf-8")


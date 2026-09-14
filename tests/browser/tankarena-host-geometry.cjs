const {spawn}=require('child_process');
const fs=require('fs');
const path=require('path');
const assert=require('assert/strict');
const {chromium}=require('C:/Users/nirrt/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const OUT=path.resolve(__dirname,'..','..','test-results','tankarena-host-geometry');

const viewports=[
  {width:320,height:568},
  {width:390,height:844},
  {width:700,height:900},
  {width:900,height:1000},
  {width:1440,height:900},
  {width:1820,height:1217},
  {width:2560,height:1440},
];

(async()=>{
  fs.mkdirSync(OUT,{recursive:true});
  const child=spawn(process.execPath,['server.js'],{
    env:{...process.env,PARTY_PORT:'0',PARTY_EPHEMERAL:'1',PARTY_NO_BROWSER:'1'},
    windowsHide:true,
  });
  let browser;
  let log='';
  const errors=[];
  const results=[];
  child.stderr.on('data',data=>log+=data);
  try{
    const port=await new Promise((resolve,reject)=>{
      child.stdout.on('data',data=>{
        log+=data;
        const match=String(data).match(/localhost:(\d+)/);
        if(match)resolve(match[1]);
      });
      setTimeout(()=>reject(Error(log||'server did not start')),15000).unref();
    });
    const base=`http://localhost:${port}`;
    browser=await chromium.launch({channel:'msedge',headless:true});
    const host=await browser.newPage({viewport:{width:1440,height:900}});
    host.on('pageerror',error=>errors.push(`host: ${error.message}`));
    await host.goto(`${base}/host`);
    await host.locator('#testModeBox').waitFor({state:'visible'});
    await host.evaluate(()=>{
      window.qa=new WebSocket(`ws://${location.host}/lobby`);
      qa.onopen=()=>qa.send(JSON.stringify({type:'host',key:PARTY_HOST_KEY}));
      qa.onmessage=event=>{
        const message=JSON.parse(event.data);
        if(message.type==='state')window.qaState=message;
        if(message.type==='game-ui'&&window.qaState?.active)window.qaState.active.ui=message.ui;
      };
    });

    const phoneContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
    const phone=await phoneContext.newPage();
    phone.on('pageerror',error=>errors.push(`phone: ${error.message}`));
    await phone.goto(base);
    await phone.locator('#name').fill('Один телефон');
    await phone.locator('#joinForm button[type="submit"]').click();
    await host.locator('#botPlus').click();
    await host.waitForFunction(()=>qaState?.players?.length===2);

    for(const playerCount of [2,16]){
      if(playerCount===16){
        for(let count=2;count<16;count++)await host.locator('#botPlus').click();
        await host.waitForFunction(()=>qaState?.players?.length===16);
      }

      await host.evaluate(()=>qa.send(JSON.stringify({type:'launch',id:'tankarena'})));
      await phone.waitForFunction(()=>document.querySelector('#gameFrame').src.includes('/games/tankarena/'));
      await phone.waitForFunction(()=>!document.querySelector('#readyButton').disabled);
      await phone.locator('#readyButton').click();
      await host.waitForFunction(()=>qaState?.active?.ui?.phase==='playing',null,{timeout:30000});
      const frame=host.frames().find(candidate=>candidate.url().includes('/games/tankarena/'));
      assert(frame,'Tank Arsenal host frame was not found');
      await frame.waitForFunction(expected=>document.querySelectorAll('#board .stat').length===expected,playerCount);
      await frame.evaluate(()=>document.fonts.ready);

      for(const viewport of viewports){
        await host.setViewportSize(viewport);
        await host.waitForTimeout(120);
        const metrics=await frame.evaluate(()=>{
          const box=rect=>rect?{
            x:Math.round(rect.x*10)/10,y:Math.round(rect.y*10)/10,
            width:Math.round(rect.width*10)/10,height:Math.round(rect.height*10)/10,
            top:Math.round(rect.top*10)/10,right:Math.round(rect.right*10)/10,
            bottom:Math.round(rect.bottom*10)/10,left:Math.round(rect.left*10)/10,
          }:null;
          const rect=selector=>box(document.querySelector(selector)?.getBoundingClientRect());
          const root=document.documentElement;
          const body=document.body;
          const main=rect('main');
          const arena=rect('.arena-surface');
          const canvas=rect('#arena');
          const panel=rect('aside');
          const heading=rect('aside h2');
          const board=rect('#board');
          const visible=[...document.querySelector('aside').children].filter(element=>{
            const style=getComputedStyle(element);
            return style.display!=='none'&&style.visibility!=='hidden';
          });
          const last=visible.at(-1)?.getBoundingClientRect();
          const cards=[...document.querySelectorAll('#board .stat')].map(element=>element.getBoundingClientRect());
          return {
            viewport:{width:innerWidth,height:innerHeight},
            scroll:{width:Math.max(root.scrollWidth,body.scrollWidth),height:Math.max(root.scrollHeight,body.scrollHeight)},
            main,arena,canvas,panel,heading,board,
            playerCards:document.querySelectorAll('#board .stat').length,
            boardScrollHeight:document.querySelector('#board').scrollHeight,
            boardClientHeight:document.querySelector('#board').clientHeight,
            boardScrollWidth:document.querySelector('#board').scrollWidth,
            boardClientWidth:document.querySelector('#board').clientWidth,
            minCardHeight:Math.round(Math.min(...cards.map(rect=>rect.height))*10)/10,
            panelTail:panel&&last?Math.round((panel.bottom-last.bottom)*10)/10:null,
            sideBySide:arena&&panel?Math.abs(arena.top-panel.top)<=2:false,
          };
        });

        const label=`${playerCount} players at ${viewport.width}x${viewport.height}`;
        assert.equal(metrics.playerCards,playerCount,`${label}: complete roster`);
        assert(metrics.scroll.width<=metrics.viewport.width+1,`${label}: horizontal overflow ${metrics.scroll.width}/${metrics.viewport.width}`);
        for(const [name,rect] of Object.entries({main:metrics.main,arena:metrics.arena,canvas:metrics.canvas,panel:metrics.panel,heading:metrics.heading,board:metrics.board})){
          assert(rect&&rect.width>0&&rect.height>0,`${label}: ${name} has visible geometry`);
          assert(rect.left>=-1&&rect.right<=metrics.viewport.width+1,`${label}: ${name} stays inside viewport`);
        }
        assert(Math.abs(metrics.arena.width/metrics.arena.height-5/3)<0.015,`${label}: arena keeps 5:3 ratio`);
        assert(Math.abs(metrics.canvas.width-metrics.arena.width)<=2.1&&Math.abs(metrics.canvas.height-metrics.arena.height)<=2.1,`${label}: canvas fills bordered arena`);
        assert(metrics.boardScrollWidth<=metrics.boardClientWidth+1,`${label}: scoreboard has no clipped columns`);
        assert(metrics.minCardHeight>=54,`${label}: player cards remain readable at ${metrics.minCardHeight}px`);
        assert(metrics.heading.left>=metrics.panel.left&&metrics.heading.right<=metrics.panel.right&&metrics.heading.top>=metrics.panel.top,`${label}: panel title is not clipped`);
        assert(metrics.panelTail!==null&&metrics.panelTail>=10&&metrics.panelTail<=32,`${label}: compact panel tail ${metrics.panelTail}`);
        if(viewport.width>=801){
          assert(metrics.sideBySide,`${label}: panel top aligns with arena`);
          assert(metrics.panel.height<=metrics.arena.height+1,`${label}: panel does not outgrow arena`);
        }else{
          assert(metrics.panel.top>=metrics.arena.bottom+10,`${label}: stacked panel follows arena`);
        }
        const record={players:playerCount,requestedViewport:viewport,...metrics};
        results.push(record);
        const screenshot=path.join(OUT,`tankarena-host-${playerCount}p-${viewport.width}.png`);
        await host.screenshot({path:screenshot,fullPage:false});
        console.log(`PASS ${label}: arena ${metrics.arena.width}x${metrics.arena.height}; panel ${metrics.panel.width}x${metrics.panel.height}; board ${metrics.boardClientHeight}/${metrics.boardScrollHeight}; overflow ${metrics.scroll.width-metrics.viewport.width}`);
      }

      await host.evaluate(()=>qa.send(JSON.stringify({type:'stop'})));
      await host.waitForFunction(()=>!qaState.active);
    }

    assert.deepEqual(errors,[]);
    fs.writeFileSync(path.join(OUT,'results.json'),JSON.stringify({results,errors},null,2));
    console.log('PASS Tank Arsenal host geometry at 7 widths with 2 and 16 players');
  }finally{
    await browser?.close();
    child.kill();
  }
})().catch(error=>{console.error(error);process.exitCode=1});

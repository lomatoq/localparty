"""Real launcher + two phone browser contexts. All requests must stay local."""
import asyncio, json, os, pathlib, socket, subprocess, time, urllib.request
from playwright.async_api import async_playwright, expect
ROOT=pathlib.Path(__file__).resolve().parents[2]
OUT=ROOT/'test-results'/'alpha-browser'
async def main():
    OUT.mkdir(parents=True,exist_ok=True)
    with socket.socket() as s: s.bind(('127.0.0.1',0)); port=s.getsockname()[1]
    proc=subprocess.Popen(['node','server.js'],cwd=ROOT,env={**os.environ,'PARTY_PORT':str(port),'PARTY_EPHEMERAL':'1','PARTY_NO_BROWSER':'1'},stdout=open(OUT/'launcher.log','w'),stderr=subprocess.STDOUT)
    base=f'http://127.0.0.1:{port}'
    try:
        for _ in range(150):
            try: urllib.request.urlopen(base+'/api/health',timeout=.2);break
            except Exception: await asyncio.sleep(.1)
        async with async_playwright() as p:
            browser=await p.chromium.launch(headless=True,args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage'])
            errors=[]; external=[]
            def page_error(e):
                errors.append(str(e));print('ALPHA_JS_ERROR '+str(e),flush=True)
            async def guard(route):
                if route.request.url.startswith((base+'/', 'data:', 'blob:')): await route.continue_()
                else: external.append(route.request.url);await route.abort()
            hc=await browser.new_context(viewport={'width':1440,'height':1000});await hc.route('**/*',guard)
            host=await hc.new_page();host.on('pageerror',page_error);await host.goto(base+'/host')
            await host.locator('.game[data-id="bowling"]').wait_for();assert await host.locator('.game').count()==30
            await host.locator('#lp-updates').click();await host.locator('.lp-updates-dialog').wait_for();await host.screenshot(path=str(OUT/'updates.png'));await host.locator('.lp-update-close').click()
            phones=[]
            for i in range(2):
                c=await browser.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True);await c.route('**/*',guard)
                page=await c.new_page();page.on('pageerror',page_error);await page.goto(base+'/');await page.locator('#name').fill('Alpha '+str(i));
                if i==0:
                    await page.locator('input[name="hand"][value="left"]').check()
                    await page.locator('#avatarFile').set_input_files(str(ROOT/'public'/'assets'/'games'/'bowling.png'))
                    await expect(page.locator('#avatarPreview img')).to_be_visible()
                    await page.screenshot(path=str(OUT/'profile-photo-phone.png'))
                await page.locator('#joinForm button[type="submit"]').click();await page.locator('#home').wait_for();phones.append(page)
            await expect(host.locator('.player .avatar.has-photo img')).to_have_count(1)
            await host.screenshot(path=str(OUT/'profile-photo-host.png'))
            for mode in ['curling','bowling','swarm_gate','peek_shoot']:
                await host.locator(f'.game[data-id="{mode}"] .start-game').click()
                for phone in phones:
                    await phone.locator(f'#gameFrame[src*="/games/{mode}/"]').wait_for(state="attached")
                    await phone.frame_locator('#gameFrame').locator('#ss-name').wait_for(state='attached')
                    await phone.locator('#readyButton').wait_for();await phone.locator('#readyButton').click()
                frame=host.frame_locator('#gameFrame')
                try:
                    await frame.locator('#ss-overlay').wait_for(state='hidden',timeout=25000)
                except Exception:
                    print('ALPHA_DIAGNOSTICS '+mode,flush=True)
                    for page in [host,*phones]:
                        print(await page.evaluate("({phase:document.body.dataset.phase,ready:document.getElementById('readyProgress')?.textContent,notice:document.getElementById('notice')?.textContent})"),flush=True)
                        inner=page.frame_locator('#gameFrame')
                        print(await inner.locator('body').inner_text(timeout=5000),flush=True)
                    raise
                await asyncio.sleep(7 if mode=='swarm_gate' else 1);await host.screenshot(path=str(OUT/f'{mode}-host.png'))
                assert not await frame.locator('#ss-error').is_visible(),await frame.locator('#ss-error').inner_text()
                await frame.locator('#ss-scene canvas').wait_for()
                print('ALPHA_PLAYING '+mode,flush=True)
                pf=phones[0].frame_locator('#gameFrame');await pf.locator('#ss-name').wait_for(timeout=10000)
                await phones[0].screenshot(path=str(OUT/f'{mode}-phone.png'))
                if mode in ['swarm_gate','peek_shoot']:
                    box=await pf.locator('#ss-fire').bounding_box()
                    await phones[0].mouse.move(box['x']+box['width']/2,box['y']+box['height']/2)
                    await phones[0].mouse.down();await asyncio.sleep(.15);await phones[0].mouse.up()
                else:
                    shooter=None
                    for phone in phones:
                        if 'ТВОЙ БРОСОК' in await phone.frame_locator('#gameFrame').locator('#ss-turn').inner_text():shooter=phone;break
                    assert shooter is not None,'No active thrower after match start: '+mode
                    pf=shooter.frame_locator('#gameFrame')
                    box=await pf.locator('#ss-throw-pad').bounding_box()
                    x=box['x']+box['width']*.5;y=box['y']+box['height']*.85
                    await shooter.mouse.move(x,y);await shooter.mouse.down()
                    for k in range(10):
                        await shooter.mouse.move(x,y-box['height']*.06*(k+1));await asyncio.sleep(.025)
                    await shooter.mouse.up()
                    await expect(pf.locator('#ss-turn')).to_have_text('Смотри на общий экран',timeout=5000)
                    await asyncio.sleep(1)
                    await host.screenshot(path=str(OUT/f'{mode}-throw.png'))
                await host.evaluate("""async()=>{const ws=new WebSocket(`${location.protocol==='https:'?'wss:':'ws:'}//${location.host}/lobby`);await new Promise(r=>ws.onopen=r);ws.send(JSON.stringify({type:'host',key:window.PARTY_HOST_KEY}));await new Promise(r=>{ws.onmessage=e=>{if(JSON.parse(e.data).type==='host-ok')r()}});ws.send(JSON.stringify({type:'stop'}));setTimeout(()=>ws.close(),100)}""")
                await host.locator('#lobby').wait_for()
                for phone in phones:await phone.locator('#lobby').wait_for()
            await browser.close()
            (OUT/'report.json').write_text(json.dumps({'pageErrors':errors,'externalRequests':external},ensure_ascii=False,indent=2))
            print('ALPHA_REPORT '+json.dumps({'pageErrors':errors,'externalRequests':external},ensure_ascii=False),flush=True)
            assert not errors,errors
            assert not external,external
    finally:proc.terminate();proc.wait(timeout=10)
if __name__=='__main__':asyncio.run(main())

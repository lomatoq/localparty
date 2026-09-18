#!/usr/bin/env python3
"""DOM/transport tests. --fixture uses reduced legacy CSS and placeholder art.
Default loads real CSS from the checkout; HTTP/native/WebSocket are intercepted
fixtures in either mode, not the real server/iPhone/AirPlay. Requires Playwright.
"""
import argparse, importlib.util, json, re
from pathlib import Path
from playwright.sync_api import sync_playwright

IDS=['push','shrink','knives','bomb','western','tanks','tankarena','chaos','kart','monster','spy','millionaire','sinyakquiz','warsaw','crocodile','jenga','crane','naval','drawguess','western_duel','taprace','punchmeter','flappy','hungry','snakelines','carryball','curling','bowling','swarm_gate','peek_shoot']
FRESH=['curling','bowling','swarm_gate','peek_shoot','taprace','punchmeter','flappy','hungry','snakelines','carryball']
TITLES={'push':'Push Pit','tankarena':'Tank Arsenal','chaos':'Один курсор — полный хаос','crane':'Ночная стройка','curling':'Кёрлинг','bowling':'Pocket Strike','swarm_gate':'Ворота роя','peek_shoot':'Pop Gallery','punchmeter':'Сила удара','taprace':'Тап-забег','flappy':'Flappy вместе','hungry':'Голодная арена','snakelines':'Змейки','carryball':'Неси мяч'}
LEGACY_FRESH='''
.fresh-section{padding:28px;border:1px solid #b4ff3950;border-radius:32px;background:radial-gradient(ellipse at 48% 0,#91ff383d,transparent 75%),linear-gradient(125deg,#193729dc,#111c1bdc)}
.fresh-heading{display:flex;align-items:center;justify-content:space-between}.fresh-badge{display:inline-flex;background:#b4ff39;color:#17200e;padding:6px 12px;border-radius:999px;font-weight:900}.fresh-arrows{display:flex;gap:10px}.fresh-arrow{width:48px;height:48px;background:#b4ff39;color:#152010;border:0;border-radius:50%}
.fresh-track{display:grid;grid-auto-flow:column;grid-auto-columns:calc((100% - 48px)/3);gap:24px;overflow-x:auto;overflow-y:hidden}
.fresh-track>.game{height:390px!important;min-height:390px!important;display:flex!important;flex-direction:column!important;transform:none!important}
.fresh-track>.game .art{position:absolute!important;inset:0!important;width:100%!important;height:100%!important}
.fresh-track>.game .game-info{position:relative!important;flex:1!important;padding:190px 20px 20px!important;max-width:100%}
.fresh-track>.game .symbol{width:109.5%!important;max-width:100%!important;height:87%!important;left:62%!important;right:auto!important;top:-5%!important;translate:-50% 0!important}
.start-game{background:linear-gradient(155deg,#e2ffa8,#c8ff73 42%,#a9ec4c);color:#1b2b12;border:1px solid #e9ffc08c;border-radius:999px;box-shadow:inset 0 2px #fff6,0 4px #47651f;font-weight:800;padding:10px 14px}
@media(min-width:1101px) and (hover:hover){.fresh-track{display:flex;gap:0}.fresh-track>.game{margin-right:-12px!important;flex:0 0 33%}}
'''
MOCK='''window.__messages=[];window.__sockets=[];window.webkit={messageHandlers:{partyShell:{postMessage(m){window.__messages.push(m);}}}};
class FixtureSocket { static OPEN=1;static CLOSED=3;constructor(url){this.url=url;this.readyState=1;this.sent=[];window.__sockets.push(this);queueMicrotask(()=>this.onopen?.());}send(x){this.sent.push(JSON.parse(x));}emit(m){this.onmessage?.({data:JSON.stringify(m)});}close(){this.readyState=3;this.onclose?.();}}
window.WebSocket=FixtureSocket;window.PARTY_DISPLAY_KEY='fixture-display-key';'''

def snapshot():
    games=[]
    for i,id in enumerate(IDS):
        games.append(dict(id=id,title=TITLES.get(id,id.capitalize()),description='Играй вместе с друзьями. Короткие раунды и ещё одна попытка.',controls='Управление на телефоне.',goal='Останься последним.',win='Набери больше очков.',min=2,max=16,color='#a96aff',engine='sports_siege' if id in FRESH[:4] else 'party',host='/host',section='table' if id in ['spy','monster','crocodile','millionaire','warsaw','sinyakquiz','drawguess'] else 'arcade',hostControls=dict(settings=[],actions=[])))
    return dict(type='state',catalog=games,players=[dict(id='p1',name='Глеб',gameReady=True),dict(id='p2',name='Друг',gameReady=True)],votes=[],leaderboard=[dict(id='p1',name='Глеб',points=80,wins=2)],screens=1,selected=None,active=None,busy=False,networkEnabled=True,urls=['http://192.168.1.20:8080/'],gameSettings={},native=dict(ready=True,working=False,catalogReady=True,externalDisplays=1,bridgeRevision='ios-recovery-20260918.1',displayMode='scene-accessory',haptics=True))

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--fixture',action='store_true');p.add_argument('--in-memory',action='store_true',help='DOM-only fallback; no navigation/CSP/HTTP validation');p.add_argument('--chromium');p.add_argument('--output',type=Path,default=Path('.localparty-build/fresh-lobby'));a=p.parse_args()
    root=Path(__file__).resolve().parents[1];public=root/'public';a.output.mkdir(parents=True,exist_ok=True)
    spec=importlib.util.spec_from_file_location('prior',root/'tests/native-shell-browser.py');prior=importlib.util.module_from_spec(spec);spec.loader.exec_module(prior)
    legacy=prior.FIXTURE_CSS
    results=[];errors=[];requests=[]
    def check(name,value,detail=None):
        results.append(dict(name=name,passed=bool(value),detail=detail))
        if not value:raise AssertionError(f'{name}: {detail}')
    with sync_playwright() as pw:
        browser=pw.chromium.launch(headless=True,**({'executable_path':a.chromium} if a.chromium else {}))
        ctx=browser.new_context(viewport=dict(width=390,height=844));ctx.add_init_script(MOCK)
        def route(r):
            from urllib.parse import urlparse
            name=urlparse(r.request.url).path.lstrip('/');requests.append(name)
            if name.startswith('games/'):
                r.fulfill(content_type='text/html',body='<html><body><script>window.received=[];addEventListener("message",e=>received.push(e.data));</script>Fixture game display</body></html>');return
            if name.startswith('assets/') or name=='api/qr':
                r.fulfill(content_type='image/svg+xml',body='<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240"><rect x="40" y="28" width="240" height="184" rx="75" fill="#9b69c5"/><text x="160" y="136" font-size="20" text-anchor="middle" fill="white">TEST ASSET</text></svg>');return
            if a.fixture and name in ['style.css','refresh.css','glass.css','ux.css','catalog-previews.css','fresh.css']:
                r.fulfill(content_type='text/css',body=legacy if name=='glass.css' else LEGACY_FRESH if name=='fresh.css' else '');return
            if name=='browser-compat.js':r.fulfill(content_type='text/javascript',body='');return
            file=public/('tv.html' if name=='tv' else name)
            if file.is_file():r.fulfill(content_type={'.css':'text/css','.js':'text/javascript','.html':'text/html'}.get(file.suffix,'text/plain'),body=file.read_text())
            else:r.fulfill(status=404,body='Fixture missing: '+name)
        if not a.in_memory: ctx.route('**/*',route)
        def mount(page, name):
            if not a.in_memory:
                page.goto('https://fixture.localparty.test/'+name)
                return
            html=(public/('tv.html' if name=='tv' else name)).read_text()
            styles=[]
            for href in re.findall(r'<link[^>]+href="([^"\n]+\.css)"',html):
                file=href.lstrip('/')
                if a.fixture and file in ['style.css','refresh.css','glass.css','ux.css','catalog-previews.css','fresh.css']:
                    styles.append(legacy if file=='glass.css' else LEGACY_FRESH if file=='fresh.css' else '')
                else: styles.append((public/file).read_text())
            html=re.sub(r'<link[^>]+rel="stylesheet"[^>]*>', '', html)
            html=re.sub(r'<script[^>]*>[\s\S]*?</script>', '', html)
            html=re.sub(r'<meta http-equiv="Content-Security-Policy"[^>]*>', '', html)
            page.set_content(html.replace('</head>','<style>'+ '\n'.join(styles) +'</style></head>'))
            page.evaluate(MOCK)
            if name=='tv':
                # Test-owned spies, not changes to browser policy or production.
                # No iframe navigation, real messages, HTTP or WSS are exercised.
                page.evaluate("""window.__frameAssignments=[];window.__frameMessages=[];
                  const f=document.getElementById('gameFrame');
                  Object.defineProperty(f,'src',{get(){return f.getAttribute('data-requested-src')||'';},set(v){__frameAssignments.push(v);f.setAttribute('data-requested-src',v);}});
                  f.contentWindow.postMessage=(m,o)=>__frameMessages.push({message:m,origin:o});""")
                page.evaluate((public/'tv-layout.js').read_text())
            for file in ['tv.js']+(['native-shell/host.js'] if name!='tv' else [])+['motion.js']:
                page.evaluate((public/file).read_text())
        try:
            page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
            mount(page,'native-shell/index.html');page.wait_for_timeout(100)
            check('native helper makes no sockets',page.evaluate('__sockets.length')==0)
            s=snapshot();check('snapshot still acknowledged',page.evaluate('(s)=>LocalPartyHost.update(s)',s) is True)
            check('all 30 real IDs rendered once',page.locator('#catalog .game').count()==30)
            check('Fresh matches desktop ordering',page.locator('.fresh-track>.game').evaluate_all('(n)=>n.map(x=>x.dataset.game)')==FRESH)
            check('all four sports covers use png',page.locator('.fresh-track>.game .symbol').evaluate_all('(n)=>n.slice(0,4).every(x=>x.src.endsWith(".png"))'))
            page.locator('[data-section=fresh]').click()
            check('Fresh filter hides other sections',page.locator('[data-catalog-group=arcade]').is_hidden() and page.locator('[data-catalog-group=table]').is_hidden())
            page.locator('#search').fill('Pocket');check('search intersects Fresh',page.locator('#catalog .game:not([hidden])').count()==1)
            page.locator('#search').fill('not-a-game');check('empty filter visible',page.locator('#noGames').is_visible())
            page.locator('#search').fill('');page.locator('[data-section=all]').click()
            def geo():
                return page.evaluate('''() => {
                  const bad=[];
                  document.querySelectorAll('.lp-catalog .games').forEach(grid=>{if(grid.closest('[hidden]'))return;const all=[...grid.children].filter(c=>!c.hidden).map(c=>c.getBoundingClientRect());for(let i=0;i<all.length;i++)for(let j=i+1;j<all.length;j++){const x=Math.min(all[i].right,all[j].right)-Math.max(all[i].left,all[j].left),y=Math.min(all[i].bottom,all[j].bottom)-Math.max(all[i].top,all[j].top);if(x>1&&y>1)bad.push([i,j,x,y]);}});
                  return {bad,overflow:document.documentElement.scrollWidth-innerWidth,railScroll:document.querySelector('.fresh-track').scrollWidth>document.querySelector('.fresh-track').clientWidth};}''')
            for w in [320,360,375,390,430,600,768,1024]:
                page.set_viewport_size(dict(width=w,height=844));page.wait_for_timeout(100);g=geo();check(f'mobile {w} no overlap',not g['bad'],g['bad']);check(f'mobile {w} no page overflow',g['overflow']<=1,g['overflow']);check(f'mobile {w} Fresh remains scrollable',g['railScroll'])
            page.set_viewport_size(dict(width=390,height=844));page.wait_for_timeout(120)
            page.locator('.fresh-track').evaluate('(t)=>t.scrollLeft=200')
            page.evaluate('window.savedCard=document.querySelector("[data-game=bowling]");window.savedScroll=document.querySelector(".fresh-track").scrollLeft')
            s['votes']=[dict(playerId='p1',gameId='bowling')];page.evaluate('(s)=>LocalPartyHost.update(s)',s)
            check('vote update retains card identity',page.evaluate('savedCard===document.querySelector("[data-game=bowling]")'))
            check('vote update retains rail scroll',page.evaluate('Math.abs(savedScroll-document.querySelector(".fresh-track").scrollLeft)<2'))
            check('vote badge updates in place',page.locator('[data-game=bowling] .lp-card-votes').inner_text()=='Голосов: 1')
            page.locator('.fresh-track').evaluate('(t)=>t.scrollLeft=0');page.wait_for_timeout(100)
            page.locator('[data-game=curling]').click();check('Fresh opens game detail',page.locator('#gameDetail').is_visible());check('single existing selection command',page.evaluate('__messages.filter(m=>m.type==="manage"&&m.command.type==="select"&&m.command.id==="curling").length')==1)
            page.locator('[data-close=gameDetail]').click();page.locator('#openHost').click();check('host panel still accessible',page.locator('#hostPanel').is_visible());page.locator('[data-close=hostPanel]').click()
            check('native UI click sends real haptic request',page.evaluate('__messages.some(m=>m.type==="haptic"&&m.pattern[0]===7)'))
            page.evaluate('document.body.insertAdjacentHTML("beforeend",`<button id="pressTest">Press</button><button id="disabledTest" disabled>No</button><div data-joystick><button id="joystickTest">Gesture</button></div>`)')
            def event(id,kind,**args):page.locator('#'+id).dispatch_event(kind,dict(pointerId=41,button=0,clientX=5,clientY=5,pointerType='mouse',**args))
            event('pressTest','pointerdown');page.wait_for_timeout(100);check('physical press held',page.locator('#pressTest').get_attribute('data-lp-press-state')=='down');check('physical scale compresses',page.locator('#pressTest').evaluate('e=>parseFloat(getComputedStyle(e).scale)<1'))
            event('pressTest','pointerup');check('release spring starts',page.locator('#pressTest').get_attribute('data-lp-press-state')=='release');page.wait_for_timeout(330);check('release cleans animated state',page.locator('#pressTest').get_attribute('data-lp-press-state') is None)
            event('pressTest','pointerdown');event('pressTest','pointercancel');check('cancel never sticks',page.locator('#pressTest').get_attribute('data-lp-press-state') is None)
            event('pressTest','pointerdown');page.locator('#pressTest').dispatch_event('pointermove',dict(pointerId=41,clientX=30,clientY=50,pointerType='touch'));check('swipe releases pressure',page.locator('#pressTest').get_attribute('data-lp-press-state') is None)
            event('disabledTest','pointerdown');check('disabled button does not compress',page.locator('#disabledTest').get_attribute('data-lp-press-state') is None)
            event('joystickTest','pointerdown');check('joystick geometry excluded',page.locator('#joystickTest').get_attribute('data-lp-press-state') is None)
            event('pressTest','pointerdown');page.evaluate('dispatchEvent(new Event("party-native-hide"))');check('native hide cancels all presses',page.locator('[data-lp-press-state]').count()==0)
            page.locator('#pressTest').dispatch_event('keydown',dict(key=' '));check('keyboard press works',page.locator('#pressTest').get_attribute('data-lp-press-state')=='down');page.locator('#pressTest').dispatch_event('keyup',dict(key=' '));page.wait_for_timeout(330)
            page.emulate_media(reduced_motion='reduce');event('pressTest','pointerdown');check('reduced motion has no scale animation',page.locator('#pressTest').evaluate('e=>["none","1"].includes(getComputedStyle(e).scale) && e.getAnimations().length===0'));event('pressTest','pointerup');page.emulate_media(reduced_motion='no-preference')
            page.locator('#pressTest').evaluate('(e)=>e.remove()');page.locator('#disabledTest').evaluate('(e)=>e.remove()');page.locator('[data-joystick]').evaluate('(e)=>e.remove()');page.evaluate('scrollTo(0,0)');page.screenshot(path=str(a.output/'native-390-fixture.png'))
            tv=ctx.new_page();tv.on('pageerror',lambda e:errors.append(str(e)));tv.set_viewport_size(dict(width=1280,height=720));mount(tv,'tv');tv.wait_for_timeout(100)
            check('TV authenticates as display, not host',tv.evaluate('__sockets[0].sent[0].type==="display"'))
            s['selected']=None;tv.evaluate('(s)=>__sockets[0].emit(s)',s);tv.wait_for_timeout(100)
            check('TV has full catalog, not eight old tiles',tv.locator('#tvCatalog .game').count()==30)
            check('TV Fresh matches native Fresh',tv.locator('.fresh-track>.game').evaluate_all('(n)=>n.map(x=>x.dataset.game)')==FRESH)
            check('TV contains no fake interactive host controls',tv.locator('#tvStage button,#tvStage input,#tvStage select').count()==0)
            check('TV QR and roster render',tv.locator('#qr').is_visible() and tv.locator('#players .player').count()==2)
            check('TV lobby has no cream sidebar',tv.locator('#tvSidebar').evaluate('e=>getComputedStyle(e).color!=="rgb(25, 39, 28)"'))
            tv.screenshot(path=str(a.output/'tv-1280-fixture.png'))
            for w,h in [(1280,720),(1920,1080),(3840,2160),(1024,768)]:
                tv.set_viewport_size(dict(width=w,height=h));tv.wait_for_timeout(120)
                check(f'TV {w}x{h} keeps logical 720px stage',tv.locator('#tvStage').evaluate('e=>e.offsetHeight')==720)
                check(f'TV {w}x{h} Fresh contained vertically',tv.locator('.fresh-section').evaluate('e=>e.scrollHeight>=e.clientHeight&&e.clientHeight<600'))
                check(f'TV {w}x{h} complete first Fresh row fits',tv.locator('.fresh-track>.game').first.evaluate('e=>e.getBoundingClientRect().bottom<=document.getElementById("tvBrowse").getBoundingClientRect().bottom+1'))
            s['selected']='bowling';tv.evaluate('(s)=>__sockets[0].emit(s)',s);check('native choice updates TV preview',tv.locator('#choiceTitle').text_content()=='Pocket Strike',{'title':tv.locator('#choiceTitle').inner_text(),'sockets':tv.evaluate('__sockets.length'),'selected':s.get('selected'),'type':s.get('type')})
            s['active']=dict(id='bowling',instance='test-instance',ui=dict(phase='waiting',serverNow=0),session=dict(paused=False,readyIds=[]));tv.evaluate('(s)=>__sockets[0].emit(s)',s);tv.wait_for_timeout(100)
            check('game uses unchanged display route',tv.locator('#gameFrame').get_attribute('data-requested-src' if a.in_memory else 'src')=='/games/bowling/host')
            check('lobby hides without removing it',tv.locator('#lobby').is_hidden() and tv.locator('#tvCatalog .game').count()==30)
            check('sports HUD is not duplicated',tv.locator('.gamebar').is_hidden())
            loads=tv.evaluate('__frameAssignments.length') if a.in_memory else requests.count('games/bowling/host');tv.evaluate('(s)=>__sockets[0].emit(s)',s);tv.wait_for_timeout(80);check('same instance never reloads game iframe',(tv.evaluate('__frameAssignments.length') if a.in_memory else requests.count('games/bowling/host'))==loads)
            s['active']['session']['paused']=True;tv.evaluate('(s)=>__sockets[0].emit(s)',s);check('pause overlay preserved',tv.locator('#paused').is_visible())
            s['active']=None;tv.evaluate('(s)=>__sockets[0].emit(s)',s);check('return restores desktop lobby',tv.locator('#lobby').is_visible() and tv.locator('#gameFrame').get_attribute('data-requested-src' if a.in_memory else 'src')=='about:blank')
            check('no uncaught browser errors',not errors,errors)
        finally:
            report=dict(mode='reduced-legacy-css-fixture' if a.fixture else 'real-checkout-css',assets='no real art/fonts; fixed art boxes' if a.in_memory else 'placeholder test SVGs',transport='in-memory DOM with iframe spies' if a.in_memory else 'intercepted HTTP fixture',nativeBridge='mocked',webSocket='mocked display protocol',physicalIOS=False,results=results,passed=sum(x['passed'] for x in results),total=len(results),pageErrors=errors)
            (a.output/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print(json.dumps({k:v for k,v in report.items() if k!='results'},ensure_ascii=False));browser.close()
if __name__=='__main__':main()

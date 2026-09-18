#!/usr/bin/env python3
"""Full-checkout CSS/assets + mocked native/display transport. --in-memory is a
DOM-only fallback for constrained environments; never physical iOS certification."""
import argparse,importlib.util,json,re
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];PUBLIC=ROOT/'public'
spec=importlib.util.spec_from_file_location('fresh',ROOT/'tests/fresh-lobby-browser.py');fresh=importlib.util.module_from_spec(spec);spec.loader.exec_module(fresh)

def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--in-memory',action='store_true');p.add_argument('--chromium');p.add_argument('--output',type=Path,default=Path('.localparty-build/tv-show'));args=p.parse_args();args.output.mkdir(parents=True,exist_ok=True)
 results=[];errors=[]
 def check(name,value,detail=None):
  results.append(dict(name=name,passed=bool(value),detail=detail))
  if not value:raise AssertionError(f'{name}: {detail}')
 def tvdata(**kw):return dict(revision=1,mode='none',automatic=False,board=None,focusId=None,focusNumber=0,focusRevision=0,browse=False,total=30,canCover=True,hasMatch=True,hasCompany=True,autoPodium=False,effects=True,idleBrowse=True,**kw)
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,**({'executable_path':args.chromium} if args.chromium else {}))
  ctx=browser.new_context(viewport=dict(width=1280,height=720));ctx.add_init_script(fresh.MOCK)
  def route(r):
   from urllib.parse import urlparse
   path=urlparse(r.request.url).path.lstrip('/')
   if path.startswith('games/'):
    r.fulfill(content_type='text/html',body='<html><body>Game transport fixture</body></html>');return
   if path.startswith('api/'):
    if path=='api/qr':
     import base64
     r.fulfill(content_type='image/png',body=base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZQmcAAAAASUVORK5CYII='));return
    r.fulfill(content_type='application/json',body='{}');return
   f=PUBLIC/('tv.html' if path=='tv' else path)
   if f.is_file():
    mime={'.html':'text/html','.css':'text/css','.js':'application/javascript','.png':'image/png','.webp':'image/webp','.ttf':'font/ttf','.woff2':'font/woff2','.svg':'image/svg+xml','.ico':'image/x-icon'}.get(f.suffix,'application/octet-stream');r.fulfill(content_type=mime,body=f.read_bytes())
   else:r.fulfill(status=404,body='Not a checked-in asset')
  if not args.in_memory:ctx.route('**/*',route)
  def mount(name,width=1280,height=720):
   page=ctx.new_page();page.bring_to_front();page.on('pageerror',lambda e:errors.append(str(e)));page.set_viewport_size(dict(width=width,height=height))
   if not args.in_memory:page.goto('https://fixture.localparty.test/'+name);page.wait_for_timeout(80);return page
   html=(PUBLIC/('tv.html' if name=='tv' else name)).read_text();scripts=re.findall(r'<script[^>]+src="([^"]+)"[^>]*></script>',html)
   styles='\n'.join((PUBLIC/href.lstrip('/')).read_text() for href in re.findall(r'<link[^>]+href="([^"\n]+\.css)"',html))
   html=re.sub(r'<link[^>]+rel="stylesheet"[^>]*>','',html);html=re.sub(r'<script[^>]*>[\s\S]*?</script>','',html);html=re.sub(r'<meta http-equiv="Content-Security-Policy"[^>]*>','',html)
   page.set_content(html.replace('</head>','<style>'+styles+'</style></head>'));page.evaluate(fresh.MOCK)
   if name=='index.html':
    page.evaluate("""window.fetch=async()=>new Response('{}',{headers:{'Content-Type':'application/json'}});const store=new Map();Object.defineProperty(window,'localStorage',{value:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});const f=document.getElementById('gameFrame');Object.defineProperty(f,'src',{get(){return f.dataset.fixtureSrc||''},set(v){f.dataset.fixtureSrc=v;}});f.contentWindow.postMessage=()=>{};""")
   if name=='tv':
    page.evaluate("""window.__frames=[];const f=document.getElementById('gameFrame');Object.defineProperty(f,'src',{get(){return f.dataset.fixtureSrc||''},set(v){__frames.push(v);f.dataset.fixtureSrc=v;}});f.contentWindow.postMessage=()=>{};""")
   for src in scripts:
    if src in ['/browser-compat.js','/bots.js','/catalog-previews.js','/value-fit.js']:continue
    page.evaluate((PUBLIC/src.lstrip('/')).read_text())
   return page
  def emit(page,s):page.evaluate('(s)=>__sockets[0].emit(s)',s)
  s=fresh.snapshot();s['bootId']='show-test';s['tv']=tvdata();s['native']['address']=s['urls'][0]
  def board(n=3):return dict(key='fixture-'+str(n),kind='match',title='Итоги этого матча',subtitle='Проверка UI — не результат реальной игры',rows=[dict(id='p'+str(i+1),name=['Глеб','Даша','Арина'][i%3]+(' '+str(i+1) if i>2 else ''),rank=i+1,score=125-i*5,won=i==0) for i in range(n)])
  try:
   tv=mount('tv');emit(tv,s);tv.evaluate("__sockets[0].emit({type:'display-ok'})")
   check('first connection has a real preparation screen',tv.locator('#tvStartup').is_visible())
   tv.wait_for_timeout(250);progress=int(tv.locator('#tvLoadProgress').text_content());check('progress has not pretended to finish immediately',0<progress<100,progress)
   tv.wait_for_timeout(2700);check('startup ends around 2.4 seconds after ready',tv.locator('#tvStartup').is_hidden())
   check('startup completion is exposed by diagnostics',tv.evaluate('LocalPartyTVShow.diagnostics().ready'))
   s['tv']['mode']='qr';emit(tv,s);tv.wait_for_timeout(480)
   check('large QR opens over the lobby',tv.locator('#tvLargeInvite').is_visible())
   box=tv.locator('#tvLargeInvite').bounding_box();check('QR card is centred',abs(box['x']+box['width']/2-640)<3,box)
   check('QR asks for the high-resolution existing endpoint','size=large' in tv.locator('#tvLargeQR').get_attribute('src'))
   s['tv']['mode']='none';emit(tv,s);tv.wait_for_timeout(300);check('QR closes without touching game state',tv.locator('#tvPresentation').is_hidden())
   for w,h in [(1280,720),(1920,1080),(3840,2160),(1024,768)]:
    tv.set_viewport_size(dict(width=w,height=h));
    for n in [1,2,3,7,16]:
     s['tv'].update(mode='podium',board=board(n),effects=False);emit(tv,s);tv.wait_for_timeout(1050)
     check(f'{w}x{h}: all {n} seats are present',tv.locator('#tvPodium .podium-seat').count()==n)
     bounds=tv.evaluate("""()=>{const stage=document.getElementById('tvStage').getBoundingClientRect();return [...document.querySelectorAll('.podium-seat')].map(e=>e.getBoundingClientRect()).filter(b=>b.left<stage.left-1||b.right>stage.right+1||b.top<stage.top-1||b.bottom>stage.bottom+1).length}""")
     check(f'{w}x{h}: {n} seats fit the logical stage',bounds==0,bounds)
   tv.set_viewport_size(dict(width=1280,height=720));s['tv']['board']=board(3);emit(tv,s);tv.wait_for_timeout(1050)
   check('top-three order is 2–1–3',tv.locator('#tvPodiumMain .podium-seat').evaluate_all('(els)=>els.map(e=>e.dataset.rank)')==['2','1','3'])
   check('winner has crown',tv.locator('[data-rank="1"] .podium-crown').count()==1)
   check('top-three frames differ by medal',len(set(tv.locator('#tvPodiumMain .podium-seat').evaluate_all('(els)=>els.map(e=>e.style.getPropertyValue("--medal"))')))==3)
   tv.screenshot(path=str(args.output/'podium-3.png'));s['tv']['board']=board(16);emit(tv,s);tv.wait_for_timeout(1050);tv.screenshot(path=str(args.output/'podium-16.png'))
   s['tv']['effects']=True;emit(tv,s);tv.wait_for_timeout(1200);check('celebration runs only when enabled',tv.evaluate('LocalPartyTVShow.diagnostics().effectsRunning'));check('spark pool is bounded',tv.evaluate('LocalPartyTVShow.diagnostics().particles<=280'))
   s['tv']['mode']='none';emit(tv,s);tv.wait_for_timeout(300);check('closing podium stops effect frames',not tv.evaluate('LocalPartyTVShow.diagnostics().effectsRunning'))
   s['tv'].update(focusId='crane',focusNumber=17,focusRevision=2,browse=True);emit(tv,s);tv.wait_for_timeout(1000)
   check('host arrows focus a card without opening its game',tv.locator('#play').is_hidden() and tv.locator('[data-id=crane]').get_attribute('aria-current')=='true')
   check('focus scrolls to the matching row',tv.locator('#tvBrowse').evaluate('el=>el.scrollTop>0'))
   check('manual browsing stops idle camera movement',not tv.evaluate('LocalPartyTVShow.canIdle()'))
   s['active']=dict(id='bowling',instance='fixture-run',ui=dict(phase='waiting'),session=dict(paused=False,readyIds=[]));s['tv'].update(mode='none',browse=False);emit(tv,s);tv.wait_for_timeout(100)
   check('game switch gets a transition',tv.locator('#tvSceneTransition').is_visible());tv.wait_for_timeout(1250);check('transition cannot indefinitely hide a game',tv.locator('#tvSceneTransition').is_hidden())
   s['active']['session']['paused']=True;emit(tv,s);check('pause overlay still exists',tv.locator('#paused').is_visible());s['active']['session']['paused']=False;emit(tv,s);check('resume gets a short transition',tv.locator('#tvSceneTransition').is_visible());tv.wait_for_timeout(500)
   s['active']=None;s['tv'].update(mode='podium',board=board(3),effects=True);tv.emulate_media(reduced_motion='reduce');emit(tv,s);check('reduced motion stops the effect loop',not tv.evaluate('LocalPartyTVShow.diagnostics().effectsRunning'));tv.emulate_media(reduced_motion='no-preference')
   native=mount('native-shell/index.html',390,844);s['tv'].update(mode='none',browse=False);native.evaluate('(s)=>LocalPartyHost.update(s)',s);native.locator('#openHost').click()
   for width in [320,360,390,430,768]:
    native.set_viewport_size(dict(width=width,height=844));native.wait_for_timeout(100);check(f'admin sheet fits {width}px',native.locator('#hostPanel').evaluate('e=>e.scrollWidth<=e.clientWidth+1'))
   native.locator('#tvShowQR').click();check('admin QR uses existing privileged bridge',native.evaluate('__messages.some(m=>m.type==="manage"&&m.command.type==="tv-overlay"&&m.command.mode==="qr")'))
   native.locator('#tvNext').click();check('admin arrow issues no launch command',native.evaluate('__messages.some(m=>m.command?.type==="tv-focus")&&!__messages.some(m=>m.command?.type==="launch")'))
   native.locator('#tvAutoPodium').click();check('auto podium is an explicit setting',native.evaluate('__messages.some(m=>m.command?.options?.autoPodium===true)'))
   native.set_viewport_size(dict(width=390,height=844));native.locator('#hostPanel').evaluate('e=>e.scrollTop=0');native.screenshot(path=str(args.output/'admin-hub.png'))
   s['active']=dict(id='bowling',instance='run2',ui=dict(phase='playing'),session=dict(paused=False,readyIds=[]));s['tv']['canCover']=False;native.evaluate('(s)=>LocalPartyHost.update(s)',s)
   check('live round disables covering it with QR',native.locator('#tvShowQR').is_disabled());check('pause is accessible inside admin hub',native.locator('#tvPause').is_enabled())
   check('native haptic requests are made by trusted clicks',native.evaluate('__messages.some(m=>m.type==="haptic")&&__messages.some(m=>m.type==="haptic-prepare")'))
   # Reuse the real controller shell and CSS but not its game transport.
   controller=mount('index.html',390,844)
   controller.wait_for_function('__sockets.length===1')
   for g in s['catalog']:g['player']='/'
   emit(controller,s)
   controller.evaluate("__sockets[0].emit({type:'joined',id:'p1',name:'Глеб',token:'fixture-profile',hand:'right',avatar:null})")
   bridge=(PUBLIC/'native-shell/controller-bridge.js').read_text()
   # The production bridge guard is separately covered by Node tests. In this
   # HTTPS/in-memory fixture supply trusted origin values ONLY to the test wrapper.
   controller.evaluate('(source)=>{new Function("location",source)({protocol:"http:",hostname:"127.0.0.1"});}',bridge)
   controller.wait_for_timeout(250)
   check('native Menu is not inserted into the header nav',controller.locator('.app-header #partyNativeMenu').count()==0)
   check('Menu has its own reserved dock',controller.locator('#partyNativeDock #partyNativeMenu').count()==1)
   for w in [320,360,390,430]:
    controller.set_viewport_size(dict(width=w,height=844));controller.wait_for_timeout(180)
    controller.wait_for_function('document.getElementById("play").getBoundingClientRect().bottom<=document.getElementById("partyNativeDock").getBoundingClientRect().top+1',timeout=3000)
    check(f'controller dock never overlaps gameplay at {w}px',controller.evaluate('document.getElementById("play").getBoundingClientRect().bottom<=document.getElementById("partyNativeDock").getBoundingClientRect().top+1'))
   controller.screenshot(path=str(args.output/'controller-dock.png'))
   s['active']=None;emit(controller,s);controller.locator('#editFromCatalog').click()
   check('photo editor provides camera AND photo library',controller.locator('#avatarGallery').count()==1 and controller.locator('#avatarLibrary').get_attribute('capture') is None)
   for w in [320,360,390,430]:
    controller.set_viewport_size(dict(width=w,height=1000));controller.wait_for_timeout(150);check(f'photo editor fits {w}px',controller.locator('.profile-photo-field').evaluate('e=>e.scrollWidth<=e.clientWidth+1'))
   controller.screenshot(path=str(args.output/'photo-profile.png'))
   check('no uncaught JavaScript errors',not errors,errors)
  finally:
   report=dict(mode='in-memory DOM; full checkout CSS; no font/art loading' if args.in_memory else 'full checkout CSS/fonts/art; intercepted file routes',native='mock bridge',display='mock WebSocket',hardware=False,results=results,passed=sum(x['passed'] for x in results),total=len(results),pageErrors=errors)
   (args.output/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print(json.dumps({k:v for k,v in report.items() if k!='results'},ensure_ascii=False));browser.close()
if __name__=='__main__':main()

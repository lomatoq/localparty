#!/usr/bin/env python3
"""Invitation reuse, compact podium and same-origin return. Real checkout CSS/art
where present; intercepted file/API routes and mocked native/WebSocket. Not iOS.
Run with --chromium PATH when using a system Chromium rather than Playwright's.
"""
import argparse, importlib.util, json, mimetypes, subprocess
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];PUBLIC=ROOT/'public'
spec=importlib.util.spec_from_file_location('fresh',ROOT/'tests/fresh-lobby-browser.py');fresh=importlib.util.module_from_spec(spec);spec.loader.exec_module(fresh)

def main():
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--chromium');parser.add_argument('--output',type=Path,default=ROOT/'.localparty-build/invite-polish');args=parser.parse_args();args.output.mkdir(parents=True,exist_ok=True)
 # Use the pinned project QR encoder; no added package or opaque inline asset.
 qr_png=subprocess.check_output(['node','-e',"require('qrcode').toBuffer('http://192.168.1.20:8080/',{width:720,margin:4}).then(b=>process.stdout.write(b)).catch(e=>{console.error(e);process.exitCode=1;});"],cwd=ROOT,timeout=10)
 results=[];errors=[];console_errors=[]
 def check(name,ok,detail=None):
  results.append(dict(name=name,passed=bool(ok),detail=detail))
  if not ok:raise AssertionError(f'{name}: {detail}')
 def emit(page,s):page.evaluate('(s)=>__sockets[0].emit(s)',s)
 def new_state():
  s=fresh.snapshot();s['bootId']='invite-polish-test';s['tv']=dict(mode='none',board=None,focusRevision=0,browse=False,autoPodium=False,effects=False,idleBrowse=False);return s
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,**({'executable_path':args.chromium} if args.chromium else {}));ctx=browser.new_context(viewport=dict(width=1280,height=720),reduced_motion='reduce')
  ctx.add_init_script(fresh.MOCK+";window.PARTY_HOST_KEY=location.pathname==='/host'?'fixture-admin':null;")
  def route(r):
   name=urlparse(r.request.url).path.lstrip('/')
   if name=='api/qr':r.fulfill(content_type='image/png',body=qr_png);return
   if name.startswith('api/'):r.fulfill(content_type='application/json',body='{}');return
   if name.startswith('games/'):r.fulfill(content_type='text/html',body='<html><body>Fixture</body></html>');return
   file=PUBLIC/('index.html' if name in ['','host','play'] else 'tv.html' if name=='tv' else name)
   if file.is_file():r.fulfill(content_type={'.js':'text/javascript','.css':'text/css','.html':'text/html','.ttf':'font/ttf','.woff2':'font/woff2'}.get(file.suffix,mimetypes.guess_type(file.name)[0] or 'application/octet-stream'),body=file.read_bytes())
   else:r.fulfill(status=404,body='Asset not present in this checkout')
  ctx.route('**/*',route)
  def page_for(path):
   p=ctx.new_page();p.on('pageerror',lambda e:errors.append(str(e)));p.on('console',lambda m:console_errors.append(m.text) if m.type=='error' else None);p.goto('http://fixture.localparty.test/'+path);p.wait_for_timeout(180);return p
  try:
   pc=page_for('host');s=new_state();emit(pc,s);emit(pc,{'type':'host-ok'});pc.locator('#joinOpen').click();pc.wait_for_timeout(150)
   tv=page_for('tv');s['tv']['mode']='qr';emit(tv,s);emit(tv,{'type':'display-ok'});tv.wait_for_timeout(240)
   check('authenticated first TV presentation is a card, not a bare QR',tv.locator('#tvStartup').is_hidden() and tv.locator('#tvLargeInvite').is_visible())
   properties=['backgroundColor','borderRadius','borderTopColor','padding','boxShadow','fontFamily','fontSize','fontWeight','fontStyle','textTransform','letterSpacing']
   for a,b in [('#joinDialog','#tvLargeInvite'),('#joinDialog h2','#tvLargeInvite h2'),('#dialogQr','#tvLargeQR'),('#dialogAddress','#tvLargeAddress')]:
    props=['fontSize','fontWeight','fontStyle','lineHeight','letterSpacing','textTransform','color'] if ('h2' in a or 'Address' in a) else ['width','height','padding','borderRadius','backgroundColor','objectFit'] if 'Qr' in a else properties
    inspect='(n,props)=>Object.fromEntries(props.map(k=>[k,getComputedStyle(n)[k]]))'
    x=pc.locator(a).evaluate(inspect,props);y=tv.locator(b).evaluate(inspect,props)
    check('desktop/TV visual token parity: '+a,x==y,dict(desktop=x,tv=y))
   check('TV retains display-only authorization and has no fake clickable actions',tv.locator('#tvLargeInvite button,#tvLargeInvite input').count()==0)
   for w,h in [(1280,720),(1920,1080),(3840,2160),(1024,768)]:
    tv.set_viewport_size(dict(width=w,height=h));tv.wait_for_timeout(120)
    geometry=tv.evaluate('''()=>{const b=id=>document.getElementById(id).getBoundingClientRect(),stage=b('tvStage'),card=b('tvLargeInvite'),qr=b('tvLargeQR'),foot=b('tvInviteCount');return {center:Math.abs(card.x+card.width/2-stage.x-stage.width/2),square:Math.abs(qr.width-qr.height),height:card.height,width:card.width,inside:card.top>=stage.top&&card.bottom<=stage.bottom,content:foot.bottom<=card.bottom-10&&qr.top>card.top&&qr.bottom<foot.top}}''')
    check(f'{w}x{h}: centred portrait card',geometry['center']<2 and geometry['height']>geometry['width'],geometry)
    check(f'{w}x{h}: QR square and content not clipped',geometry['square']<1 and geometry['inside'] and geometry['content'],geometry)
   tv.set_viewport_size(dict(width=1280,height=720));tv.wait_for_timeout(120);tv.screenshot(path=str(args.output/'tv-original-invite.png'))
   pc.screenshot(path=str(args.output/'desktop-original-invite.png'))
   tv.evaluate('window.originalCard=document.getElementById("tvLargeInvite")')
   for i in range(4):
    s['tv']['mode']='none';emit(tv,s);tv.wait_for_timeout(40);s['tv']['mode']='qr';emit(tv,s);tv.wait_for_timeout(40)
   check('repeated QR opening reuses the same card',tv.evaluate('originalCard===document.getElementById("tvLargeInvite")') and tv.locator('#tvLargeInvite').count()==1)
   for n in [1,2,3,7,16]:
    rows=[dict(id=f'p{i+1}',name='Игрок '+str(i+1),rank=i+1,score=30-i,won=i==0) for i in range(n)]
    s['tv'].update(mode='podium',board=dict(key=str(n),kind='match',title='Итоги матча',subtitle='Тестовая компания',rows=rows));emit(tv,s);tv.wait_for_timeout(100)
    check(f'compact layout retains {n} players',tv.locator('#tvPodium .podium-seat').count()==n)
    if n==3:
     g=tv.evaluate('''()=>{const els=[...document.querySelectorAll('#tvPodiumMain .podium-seat')],b=els.map(e=>e.getBoundingClientRect()),win=els.find(e=>e.dataset.rank==='1').getBoundingClientRect();return {gaps:[b[1].left-b[0].right,b[2].left-b[1].right],span:b[2].right-b[0].left,center:Math.abs(win.x+win.width/2-640)}}''')
     check('three podiums have actual 14px gaps rather than empty columns',all(12<=x<=16 for x in g['gaps']),g)
     check('three podiums remain centred and no wider than 660 logical px',g['span']<=660 and g['center']<1,g)
     tv.screenshot(path=str(args.output/'podium-three-close.png'))
    elif n==16:tv.screenshot(path=str(args.output/'podium-sixteen-unchanged.png'))
   guest=page_for('?admin=not-a-real-key#secret');s=new_state();emit(guest,s)
   profile=dict(type='joined',id='p1',token='fixture-profile-token',name='Глеб',hand='left',avatar=None);emit(guest,profile);guest.wait_for_timeout(120)
   check('guest has an opt-in return hint, not an extra login step',guest.locator('.return-entry-help').is_visible() and guest.locator('#onboarding').is_hidden())
   for width in [320,390,768]:
    guest.set_viewport_size(dict(width=width,height=844));guest.locator('.return-entry-help').evaluate('e=>e.open=true');guest.wait_for_timeout(70)
    check(f'{width}px expanded return hint stays within its container',guest.locator('.return-entry-help').evaluate('e=>e.scrollWidth<=e.clientWidth+1'))
   guest.set_viewport_size(dict(width=390,height=844));guest.locator('.return-entry-help').scroll_into_view_if_needed();guest.screenshot(path=str(args.output/'guest-return-hint.png'))
   check('return explanation warns about a changed LAN address','адрес ведущего изменился' in guest.locator('.return-entry-help').text_content())
   check('desktop host does not see guest-only bookmark helper',pc.locator('.return-entry-help').is_hidden())
   guest.evaluate('document.body.classList.add("native-controller")');check('native controller does not get an extra layout block',guest.locator('.return-entry-help').is_hidden());guest.evaluate('document.body.classList.remove("native-controller")')
   # Existing real app.js persistence and autojoin path, not a fabricated remember-room registry.
   check('profile was persisted by actual app.js',guest.evaluate('JSON.parse(localStorage.getItem("local-party-profile")).token')=='fixture-profile-token')
   guest.reload();guest.wait_for_timeout(220)
   check('reopening the same tab sends saved identity without QR or code',guest.evaluate('__sockets[0].sent.some(m=>m.type==="join"&&m.token==="fixture-profile-token"&&m.name==="Глеб")'))
   emit(guest,s);emit(guest,profile);check('rejoined player reaches catalogue without onboarding',guest.locator('#onboarding').is_hidden() and guest.locator('#home').is_visible())
   check('no uncaught JavaScript errors',not errors,errors)
  finally:
   report=dict(passed=sum(c['passed'] for c in results),total=len(results),results=results,pageErrors=errors,physicalIOS=False,transport='intercepted API/files, mocked WebSockets/native; real app.js persistence',fontsPresent=(PUBLIC/'assets/fonts/Rubik.ttf').exists())
   (args.output/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print(json.dumps({k:v for k,v in report.items() if k!='results'},ensure_ascii=False));browser.close()
if __name__=='__main__':main()

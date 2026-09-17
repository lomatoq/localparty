#!/usr/bin/env python3
"""Native-shell DOM regression tests; NOT physical iOS/AirPlay certification.

Default: loads real shared CSS from this checkout into an in-memory DOM. Requires Python Playwright.
--fixture: uses the reduced shared CSS cascade recorded at commit 835027d7,
           without real fonts/artwork. This mode reproduces the 325px/300px conflict
           without claiming a full shared-styles or Rubik-font visual check.
--baseline: records the two expected failures in the original shell.
"""
import argparse
import json
import re
from pathlib import Path
from playwright.sync_api import sync_playwright

# Exact relevant rules from public/glass.css at 835027d7, plus a small visual
# scaffold. Font/art assets are not part of the reduced-cascade fixture.
FIXTURE_CSS = '''
:root{--bg:#0b0e12;--ink:#f4f6f4;--muted:#a1aaa9;--line:#ffffff17;--lime:#c8f58b;font-family:Arial,sans-serif;color:var(--ink);background:var(--bg)}
*{box-sizing:border-box}body{margin:0}button,input,select{font:inherit}button{cursor:pointer}button:disabled{opacity:.45}p{color:var(--muted)}[hidden]{display:none!important}
.app-header{display:grid;position:sticky;top:0;background:var(--bg);z-index:40;padding:0 20px;height:88px}.app-header nav{display:flex}.brand{font-size:29px;white-space:nowrap;font-weight:850}.brand span{color:var(--lime)}.brand i{display:none}#connection{font-size:11px}
body:not(.in-game) .app-header{grid-template-columns:minmax(170px,1fr) auto minmax(230px,1fr)}body:not(.in-game) .app-header>nav:last-child{grid-column:3}
body button>svg{width:20px;height:20px;flex:0 0 20px}.nav,.quiet{border:1px solid var(--line);background:#ffffff05;border-radius:99px;color:var(--ink);min-height:44px;font-size:14px;padding:10px 16px}.primary,.lime{background:var(--lime);color:#15200e;border:0;border-radius:99px;font-size:16px;min-height:48px;padding:12px 20px}
main{padding:23px 15px;max-width:1640px;margin:auto}.hero-pills{display:flex;flex-wrap:wrap;gap:8px}.hero-pills span{font-size:12px;border:1px solid var(--line);padding:9px;border-radius:30px}.catalog-filters{display:flex}.filter-tab{padding:11px;min-height:44px;border:0;background:transparent;color:var(--ink);border-radius:99px}.filter-tab.active{background:#ffffff11}
.games{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));grid-auto-rows:330px;gap:18px}.game{position:relative;display:block;min-width:0;border:1px solid #ffffff16;border-radius:28px;isolation:isolate;background:#141a20;color:var(--ink);overflow:hidden;text-align:left}.game .art{position:absolute;inset:0;height:auto;padding:0;overflow:visible}.game .art .symbol{position:absolute;width:115%;height:89%;right:-19%;top:-10%;object-fit:contain;transform:rotate(-7deg)}.game-info{position:absolute;inset:auto 0 0;padding:46px 20px 19px;background:linear-gradient(0deg,#10161afc,#11171aed 52%,transparent);display:flex;flex-direction:column}.game h3{font-size:23px;line-height:1.08;margin:0}.game p{font-size:14px;line-height:1.4;margin:9px 0 13px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.game-bottom{display:flex;justify-content:space-between}.company{position:sticky;top:112px;padding:0 0 205px}.native-sheet{background:var(--bg);color:var(--ink)}dialog{width:min(530px,calc(100vw - 30px));max-width:530px;max-height:90dvh;overflow:auto;border:1px solid var(--line);border-radius:25px;background:var(--bg);color:var(--ink)}dialog::backdrop{background:#0009}.player{display:flex;gap:10px;padding:12px;background:#ffffff03;border:1px solid var(--line);border-radius:18px}
@media(max-width:1200px){.games{grid-template-columns:repeat(2,minmax(0,1fr));grid-auto-rows:325px}.game{min-height:325px}}
@media(max-width:850px){body:not(.in-game) .app-header{height:125px;grid-template-columns:1fr auto;grid-template-rows:70px 48px;gap:0 8px;padding:0 14px 7px}body:not(.in-game) .app-header>.identity{grid-column:1;grid-row:1}body:not(.in-game) .app-header>nav:last-child{grid-column:2;grid-row:1}}
@media(max-width:700px){.games,.table-games{grid-template-columns:repeat(2,minmax(0,1fr));grid-auto-rows:auto;gap:11px}.game,.table-games .game{height:298px;min-height:298px;border-radius:22px;display:block}.game .art .symbol{width:142%;height:77%;right:-34%;top:-1%;transform:rotate(-6deg)}.game .game-info,.table-games .game-info{padding:30px 12px 13px}.game h3{font-size:20px;line-height:1.08}.game p{font-size:13px;line-height:1.35}}
@media(max-width:700px){.game p{font-size:16px}.game,.table-games .game{height:325px;min-height:325px}}
@media(max-width:380px){.games,.table-games{grid-template-columns:1fr}.game h3{font-size:25px}.game p{font-size:16px;max-width:95%}.game .game-info,.table-games .game-info{padding:42px 17px 17px}}
'''


def snapshot():
    games = [dict(id=f'g{i}', title=(['Проверка длинного названия игры', 'Push Pit', 'Тихо, Дженга!'][i % 3]),
                  description='Тестовая карточка. Длинное описание для проверки переноса строк.',
                  controls='Веди джойстик', goal='Тестовый раунд', win='Останься последним',
                  min=2, max=16, color='#a96aff', section='table' if i % 3 == 0 else 'arcade',
                  hostControls={'settings': [], 'actions': []}) for i in range(30)]
    return dict(catalog=games, players=[{'id':'p1','name':'Глеб','gameReady':True}, {'id':'p2','name':'Гость','gameReady':True}],
                votes=[], leaderboard=[], screens=1, selected='g0', busy=False, networkEnabled=False,
                native=dict(ready=True, working=False, catalogReady=True, externalDisplays=1,
                            bridgeRevision='ios-recovery-20260918.1', displayMode='scene-accessory'))


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument('--fixture', action='store_true')
    parser.add_argument('--baseline', action='store_true')
    parser.add_argument('--chromium', default=None)
    parser.add_argument('--output', type=Path, default=Path('.localparty-build/native-browser'))
    args=parser.parse_args(); args.output.mkdir(parents=True, exist_ok=True)
    public=(args.root/'public').resolve()
    # Offline in-memory document: never change browser policies or contact a server.
    # Production CSP is tested statically; this DOM harness inserts source and CSS
    # directly. This is not an end-to-end custom-scheme / CSP / WKWebView test.
    html=(public/'native-shell/index.html').read_text()
    styles=[]
    for href in re.findall(r'<link[^>]+href="([^"\n]+\.css)"',html):
        if args.fixture and href!='/native-shell/host.css':
            styles.append(FIXTURE_CSS if href=='/glass.css' else '')
        else: styles.append((public/href.lstrip('/')).read_text())
    html=re.sub(r'<link[^>]+rel="stylesheet"[^>]*>', '', html)
    html=re.sub(r'<script[^>]*src=[^>]*></script>', '', html)
    html=re.sub(r'<meta http-equiv="Content-Security-Policy"[^>]*>', '', html)
    html=html.replace('</head>','<style>'+ '\n'.join(styles) +'</style></head>')
    source=(public/'native-shell/host.js').read_text()
    results=[]
    def check(name, condition, detail=None):
        results.append({'name':name,'passed':bool(condition),'detail':detail})
        if not condition and not args.baseline: raise AssertionError(f'{name}: {detail}')
    try:
        with sync_playwright() as pw:
            opts={'headless':True}
            if args.chromium: opts['executable_path']=args.chromium
            browser=pw.chromium.launch(**opts)
            ctx=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=1)
            errors=[]
            def fresh_page(previous=None):
                if previous: previous.close()
                p=ctx.new_page();p.on('pageerror',lambda error:errors.append(str(error)))
                p.set_content(html)
                p.evaluate('window.__messages=[]; window.webkit={messageHandlers:{partyShell:{postMessage(m){window.__messages.push(m);}}}};')
                p.evaluate(source)
                return p
            page=fresh_page();page.wait_for_timeout(1150)
            count=page.evaluate("window.__messages.filter(m=>m.type==='ready').length")
            check('lost first ready is retried',count>=2,{'readyMessages':count})
            check('loading is not displayed as zero games',page.locator('#gameCount').inner_text()!='0 игр')
            check('no-results message hidden before catalog arrives',not page.locator('#noGames').is_visible())
            snap=snapshot()
            ack=page.evaluate('(s)=>window.LocalPartyHost.update(s)',snap)
            check('snapshot is explicitly acknowledged',ack is True)
            page.wait_for_timeout(100)
            check('all 30 synthetic cards appear',page.locator('#catalog > .game').count()==30)
            initial_messages=page.evaluate('window.__messages.length');page.wait_for_timeout(650)
            if not args.baseline:check('ready retry stops after acknowledgment',page.evaluate('window.__messages.length')==initial_messages)
            def geometry():
                return page.evaluate('''() => {
                  const r=[...document.querySelectorAll('#catalog > .game')].map(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};});
                  const overlaps=[];
                  for(let i=0;i<r.length;i++)for(let j=i+1;j<r.length;j++) {
                    const x=Math.min(r[i].x+r[i].w,r[j].x+r[j].w)-Math.max(r[i].x,r[j].x);
                    const y=Math.min(r[i].y+r[i].h,r[j].y+r[j].h)-Math.max(r[i].y,r[j].y);
                    if(x>1 && y>1)overlaps.push({i,j,x,y});
                  }
                  return {count:r.length,overlaps,overflow:document.documentElement.scrollWidth-innerWidth};
                }''')
            for width in [320,360,375,390,430,600,768,1024]:
                page.set_viewport_size({'width':width,'height':844});page.wait_for_timeout(60)
                geo=geometry();check(f'{width}px cards do not overlap',not geo['overlaps'],geo if geo['overlaps'] else None)
                check(f'{width}px no horizontal page overflow',geo['overflow']<=1,geo['overflow'])
            page.set_viewport_size({'width':390,'height':844});page.screenshot(path=str(args.output/'catalog-390.png'),full_page=False)
            if args.baseline:
                browser.close()
            else:
                check('invalid snapshot rejected',page.evaluate('window.LocalPartyHost.update({})') is False)
                empty={**snap,'catalog':[],'native':{**snap['native'],'ready':False,'catalogReady':False}}
                page.evaluate('(s)=>window.LocalPartyHost.update(s)',empty)
                check('temporary empty snapshot retains catalog',page.locator('#catalog > .game').count()==30)
                check('retained cards cannot launch against an empty server',page.locator('#catalog > .game:disabled').count()==30)
                page.evaluate('(s)=>window.LocalPartyHost.update(s)',snap)
                check('authoritative catalog reenables cards',page.locator('#catalog > .game:disabled').count()==0)
                page.locator('#search').fill('does-not-exist')
                check('real no-results state still works',page.locator('#noGames').is_visible())
                page.locator('#search').fill('')
                check('clearing search restores catalog',page.locator('#catalog > .game').count()==30)
                page.locator('#catalog > .game').first.click();check('game dialog opens',page.locator('#gameDetail').is_visible())
                check('detail selection sends existing command',page.evaluate("window.__messages.some(m=>m.type==='manage'&&m.command.type==='select'&&m.command.id==='g0')"))
                page.locator('[data-close="gameDetail"]').click()
                page.locator('#openHost').click();check('host panel opens',page.locator('#hostPanel').is_visible())
                page.locator('#refreshDisplay').click()
                check('screen retry sends native recovery command',page.evaluate("window.__messages.some(m=>m.type==='screen-refresh')"))
                page.locator('[data-close="hostPanel"]').click()
                page.evaluate("document.querySelector('#catalog').style.setProperty('--test', '1')")
                page.add_style_tag(content='body.native-shell #catalog .game h3{font-size:32px!important}body.native-shell #catalog .game p{font-size:24px!important}')
                geo=geometry();check('large text still has nonoverlapping flow',not geo['overlaps'],geo if geo['overlaps'] else None)
                page=fresh_page(page);page.wait_for_timeout(80)
                check('cold reload shows loading not stale zero-results',not page.locator('#noGames').is_visible())
                page.evaluate('(s)=>window.LocalPartyHost.update(s)',snap)
                check('cold reload restores catalog from new snapshot',page.locator('#catalog > .game').count()==30)
                for i in range(5):
                    page=fresh_page(page);page.evaluate('(s)=>window.LocalPartyHost.update(s)',snap)
                    check(f'repeated JS document restart {i+1}',page.locator('#catalog > .game').count()==30)
                check('no uncaught page errors',not errors,errors)
                browser.close()
    finally:
        report={'mode':'reduced-cascade-fixture' if args.fixture else 'real-checkout-css',
                'nativeBridge':'mocked','catalog':'30 synthetic records',
                'physicalIOS':False,'transport':'in-memory DOM; not WKWebView or CSP integration','baseline':args.baseline,'results':results,
                'passed':sum(r['passed'] for r in results),'total':len(results)}
        (args.output/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
        print(json.dumps({k:v for k,v in report.items() if k!='results'},ensure_ascii=False))

if __name__=='__main__':main()

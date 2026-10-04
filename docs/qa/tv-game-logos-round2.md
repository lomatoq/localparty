# TV waiting game wordmarks — round 2

All 36 shipped game wordmarks now appear in actual TV matchmaking. `tv.js` mounts a semantic game heading with localized text fallback and the original transparent asset. `tv.html` loads the smooth logo renderer through the actual TV route. TV-only CSS keeps the wordmark below the complete masthead/HUD notch, makes “Preparing the game” subordinate, and reduces the wordmark height for rosters above eight players. Existing HUD, readiness, catalogue and neighboring TV work were preserved. This TV step changed no phone/global Rules CSS, gameplay, source logo PNG, iOS, build or installation.

## Final evidence

- Fresh final browser run: **36 games × two viewports = 72 screenshots, PASS**. WebKit, actual `/tv` route and joined phone UI, 1280×720 and 1920×1080, DPR2. Capture began at **2026-09-30T18:17:49.831Z**, after the parent renderer density fix.
- **All 72 fresh layouts and all 72 native screenshot logo crops were actually viewed** in 36 pair montages. Layout overviews use Lanczos; native logo crops are pasted without resizing. Full master PNGs remain untouched. No clipped wordmark letters/motifs, masthead/HUD overlap, unreadable readiness hint or cropped readiness count found.
- Final per-screen observations, screenshot SHA256, asset SHA256, capture timestamp and seven dependency hashes: `.localparty-build/design-round2/tv/after/visual-review.json`. Coverage: **36 games, 72 layouts, 72 native crops, six extra states; zero blockers**.
- Renderer route responded 200. All canvases attach, align to the image and use cumulative CSS zoom × min(DPR,3) for backing density. Normal logo local 480×200 produces960×400 at 1280 and1440×600 at 1920/zoom1.5. Local placement stays unchanged; the displayed720×300 CSS box at 1920 receives its complete screen-DPR bitmap.
- Six fresh extra screenshots were viewed: actual 16-member waiting room at both resolutions and stable stop→lobby (`tv/after/`), actual logo HTTP404 text fallback at both resolutions and stop/relaunch recovery (`tv/fallback/`). The large-room logo 144px height leaves room for a three-line connection hint, all 16 bubbles and count. Fallback keeps the localized English 36px Kardia Fat Runner heading and removes the failed image/canvas.
- `node --check public/tv.js`, `node --check tests/game-logos-tv-waiting.browser.cjs`: PASS. `node --test tests/tv-layout.test.js`: **2 PASS**, repeated after final review.
- Final inspected dependency snapshot: `tv/accepted-source/`. Those seven current files matched the manifest hashes at review completion. This snapshot records TV dependencies; it is not permission to overwrite concurrent changes.

Paths beginning `tv/` above are relative to `.localparty-build/design-round2/`.

## Historical evidence

The initial 72 layouts were actually reviewed but their HQ acceptance was withdrawn: zoom1.5 enlarged a 960px local canvas to1440 screenshot pixels. Parent fixed backing density to include cumulative CSS zoom, keeping local placement unchanged. Previous files are preserved in `tv/density-before/`, `tv/density-before-fallback/`, `tv/density-before-extra-final/`, and `tv/density-before-source/`. Their manifest explicitly states historical layout review and rejected final HQ acceptance. The fresh final 72 were independently viewed.

Three baseline games × two viewports were captured before this integration. Only Push 1280 baseline was actually manually viewed. Dirty source snapshot before changes: `tv/before-source/`. No claim that all six baseline images were manually reviewed. An older stop screenshot caught the Join the Party transition veil; it was disqualified and replaced with stable lobby proof.

## Reproduce

Set `PARTY_PLAYWRIGHT` to the workspace Playwright runtime, then run `node tests/game-logos-tv-waiting.browser.cjs`. The script starts its own ephemeral local server and real WebKit pages, waits for scene transitions, finite animations, fonts, stage resizing and rendered logo density, then measures and captures. Local server binding requires this environment's approved unsandboxed test execution.

For targeted 404/recovery, use `QA_TV_LOGO_IDS=push QA_TV_LOGO_FALLBACK=1 QA_TV_LOGO_OUTPUT=.localparty-build/design-round2/tv/fallback`. Main screenshots and geometry: `.localparty-build/design-round2/tv/after/report.json`. Pair montages: `tv/after/visual-review/{game}-pair.png`.

## Limits

This proves browser TV waiting UI, not physical Apple TV, tvOS overscan, gameplay or results across all games. The 16-player room uses one normalized long name, fourteen shorter guests and Alex. Guests are awaiting game connection, exercising the multi-line connection hint. Sixteen maximal-length names and sixteen fully loaded controllers were not checked. Original logo sources remain unchanged; smooth raster output is not claimed as vector output.

Earlier phone heading 20 acceptance remains historical. New heading 18/body-gap/goal changes were made and reviewed separately by root and the assigned phone reviewer; this TV report does not inherit that acceptance. The strict 55ms host-scroll timing test is still not called green.

# Local acceptance: HeyPals 0.11.7 (98)

Installed and launched locally on the connected iPhone 17 Pro on 2026-09-30. CoreDevice confirms version 0.11.7/build 98 and a developer build. No TestFlight/App Store upload or remote Git push was performed.

## Final user decisions

- Matchmaking masthead backing always fades as a gradient within the existing 64px plus safe-area height. It cannot extend over emoji or introduction text.
- Game illustration remains centered, with a soft lower fade instead of a rectangular cut.
- Rules fill is 70% opaque. Summary label and SVG arrow are centered on one row.
- Controls/Win headings are centered 15px, compared with their previous 10px; summary is 16px and body 14px. English acceptance content is retained.
- Normal-height waiting introduction stays centered; long rules scroll within their card. Ready/Pause/Lobby remain accessible.
- TV welcome headline retains ink space for slanted glyphs.

## Nearby rooms

Foreground apps browse Bonjour `_localparty._tcp.` even when their own sharing is disabled. Hosts announce their existing public HTTPS room, title, phase and player count. The controller offers explicit Join, multiple rooms and Return to your own room; it never automatically moves the player. Disappeared hosts remain explicitly returnable. Sharing stops in the background, and metadata updates while the app is foregrounded.

The native bridge is bound to the exact selected room origin. Administration still belongs exclusively to the bundled host menu. When rebinding scripts, their values are copied before clearing WebKit's live bridged array; otherwise all injected controller scripts disappeared and the native tab bar covered Pause/Lobby. The final native audit confirmed all four scripts and the actual unobstructed buttons.

## Evidence

Artifacts are under `.localparty-build/lan98/`: `review.html`, `acceptance.json`, final build/verification/install logs and `screens/`.

- 154 fresh WebKit captures: TV 1280×720/1920×1080, phones 320/375/393, all 36 real game waiting states closed/open 320/393. Final rule crops were visually inspected for all 36 games; full TV, main waiting and actual native waiting screenshots were inspected separately. This is not all-game gameplay acceptance.
-Actual native WKWebView waiting checked with the embedded server, TV client and test bot; safe-area header ends at 126px on the simulator, and Pause/Lobby sit above native navigation.
-Final native tab test: 15 rapid taps, 16 animation samples; suspended-rAF recovery 500ms.
-Final targeted tests: 41 passed, including actual Bonjour find/update/removal/background cleanup and URL boundaries. The initial sandboxed Bonjour run could not discover mDNS; the permitted LAN run passed.
-Earlier full project suite: 461 tests passed plus existing integration checks. Later changes were native script preservation and the shared heading typography; those received the targeted native and browser checks above.
-Final products verified against current source resources, code signature verified, host and embedded App Clip both version 0.11.7/build 98.
-Pre-existing neighboring-chat work was inspected and preserved. Backups of touched files and the pre-task working diff are under `baseline/`, `tracked-before.patch` and `status-before.txt`.

## App Clip and limits

The existing signed App Clip is embedded. It parses a Wi-Fi invitation, requests association with NEHotspotConfiguration and opens the browser at `/play`. Debug hosts can show a separate, clearly labelled local-test QR after Wi-Fi details are supplied; it never replaces the working LAN QR while public invocation is disabled. The invitation stays ephemeral and is cleared with network/address changes or Remove.

The simulator screenshot uses a fake QA Wi-Fi network and confirms presentation/decode only. No actual guest Wi-Fi association or two-physical-iPhone discovery/join was tested. Both real phones need the new discovery code to advertise their rooms.

`HPAppClipLive` remains false. Ordinary public QR invocation cannot be enabled merely by installing this local build: it needs an approved App Clip experience. For local testing use an iOS developer Local Experience; TestFlight invocation needs its configured beta experience. See [Apple beta App Clip testing](https://developer.apple.com/help/app-store-connect/test-a-beta-version/test-an-app-clip-experience/) and [launch experience testing](https://developer.apple.com/documentation/appclip/testing-the-launch-experience-of-your-app-clip).

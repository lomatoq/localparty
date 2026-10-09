# Independent visual review246

2026-10-09. Checkout `heypals/ux-polish`. This review reads production sources and opens supplied PNGs; it changes only this report. Browser runs, performance measurements, device profiling and source changes belong to the other round246 lanes.

Status: **frozen for Git integration** after the user replaced optimization work with publication/branch cleanup. Reviewed110 images:50 current candidate images(phone10, popup17, TV23), four earlier phone candidate images, four TV baseline diagnostics and52 original curtain phase diagnostics. Final phone and WebKit TV candidate sampling is complete. Corrected curtain final-return captures and Chrome TV candidate were not run before the task replacement. Baseline/incomplete captures cannot establish candidate acceptance. This is not a whole-catalogue or physical iPhone/AirPlay approval.

## Review contract

Read `AGENTS.md`, `docs/qa/ui-regression-rules.md`, `docs/qa/design-contract-2026.md` and the current shared-shell audit. Applied `mobile-native` and the local `heypals-screenshot-ui-review` skill: inspect fresh pixels, preserve approved art and control groups, distinguish browser fixtures from real hardware, and keep measured motion/performance separate from static visual evidence. The latest user decisions override older typography/material notes: Kardia fonts, one93% popup surface, purple description copy, centered explanatory prose, a visible Back rim and retained underlying controls.

The review checks: rounded material/edges; softened and shaded background; text/icon grouping; description alignment; input gradient and search icon; Back placement; unclipped CTA light; safe-area/dock and keyboard clearance where capture evidence exists; TV selected/browse geometry at sparse/full rosters; original art and soft masks; and sequential curtain keyframes.

## Completed pixel inspections

Every row below names an image opened with `view_image`. Paths are relative to the repository. Final phone captures are browser native-shell fixtures at393×852 CSS px, DPR3; they are not physical-phone screenshots.

| ID | Capture | Observation | Status |
| --- | --- | --- | --- |
| PH-C-W | `output/playwright/performance246/phone/final/chromium-candidate-host-waiting.png` | Expanded Push Pit retains its colored circle behind the game art, lime Controller, equal paired action boxes and grouped title/status. Search icon and darker right-side input remain visible. Fresh game logos render. | No sampled visual regression |
| PH-W-W | `output/playwright/performance246/phone/final/webkit-candidate-host-waiting.png` | Same retained circle, title/status, Controller/Bots grouping and rounded input. The Fresh strip starts below its compact header; partial neighboring card is intentional horizontal overflow. | No sampled visual regression |
| PH-C-H | `output/playwright/performance246/phone/final/chromium-candidate-host-panel.png` | Host Panel title and descriptive copy are centered; two-by-two shared-screen actions remain paired; the Back action is centered with a visible lavender rim. Surface is near-fullscreen, so pixel inspection alone cannot determine its exact alpha or reveal the full underlying blur. | Geometry/copy sampled; material backed by computed assertion, not apparent transparency alone |
| PH-W-H | `output/playwright/performance246/phone/final/webkit-candidate-host-panel.png` | Same rounded panel/grouping and Back placement. Numeric Game field shows native stepper in WebKit; it fits its capsule. Background and selected/disabled controls have the same treatment as the Chromium fixture. | No sampled visual regression |
| PU-C-P | `output/playwright/performance246/popups/actual-targets/chromium-web-profile.png` | Ready to Play icon/title is one centered group. Add-photo helper is lavender. Name field is capsule-shaped with a darker right end. Save Profile and Back share a row with a visible Back rim. Near-fullscreen surface leaves little exterior area: pixel evidence cannot prove a particular alpha or keyboard clearance. | Frozen candidate sampled; trusted opener |
| PU-C-R | `output/playwright/performance246/popups/actual-targets/chromium-web-players.png` | Catalog remains visibly blurred above the sheet; the foreground roster/audio are sharp. Audio controls have purple rounded surfaces and aligned sliders. The single Back action is centered with a readable rim. | Frozen candidate sampled; programmatic opener diagnostic |
| PU-C-T | `output/playwright/performance246/popups/actual-targets/chromium-web-rankings.png` | Catalog logo/Play remain visible through a softened/dimmed background. Empty rankings sheet has intrinsic height, centered lavender paragraphs and centered Back. | Frozen candidate sampled; trusted opener |

The earlier phone report hashes `public/native-shell/host.js` candidate as `28b84e41b299758c9489d226df3c5b458c9433d3a0c231a7266099d70d9de342`; those observations apply to those bytes. Later first-catalogue prewarm and detail-launch acknowledgement guards were recaptured separately below. Metrics from the reports are not repeated as visual or device-performance findings here.

### Final phone recheck and lifecycle

Author-confirmed frozen `public/native-shell/host.js` SHA is `2da337922c816df902fa51876531ad4d3dbe99af20363e8a61944ba39cc6592f`, verified from the current file and `output/playwright/performance246/phone/accepted-manifest.json`. Accepted Rooms SHA is `44342ac1f2db9455a1e08b746f92bb4dc8a1115931581046fbbadfac98954064`; Spotlight SHA is `706605c1a89de7e69486534574fd5b58ff59f2e4ef84f35e05de381b1725c886`. No experimental entrance variant was retained. Both recheck/lifecycle engine reports say `ok:true`, errors empty. These10 images were each opened:

| ID | Capture beneath `output/playwright/performance246/phone/` | Observation |
| --- | --- | --- |
| PR-C-W | `recheck/chromium-candidate-host-waiting.png` | Retained game-art circle, aligned title/status, paired actions, lime Controller and visible search icon/gradient; Fresh art remains rendered. |
| PR-W-W | `recheck/webkit-candidate-host-waiting.png` | Same circle/action/search/Fresh grouping, no new clipping in the native-shell browser fixture. |
| PR-C-H | `recheck/chromium-candidate-host-panel.png` | Centered title/lavender copy, paired2×2 actions, centered lone Back with visible rim; existing dense material treatment retained. |
| PR-W-H | `recheck/webkit-candidate-host-panel.png` | Same grouping/material; numeric field and its stepper fit. |
| PL-C-N | `lifecycle/chromium-candidate-nearby.png` | Underlying header/Host Pick/discovery clearly softened and dimmed. Own room green rim, expander/player-row alignment, Connected inset and centered lone Back fit. |
| PL-W-N | `lifecycle/webkit-candidate-nearby.png` | Same readable Nearby/card grouping, foreground sharp and background retained under blur. |
| PL-C-K | `lifecycle/chromium-candidate-rename-keyboard.png` | Focused name input and circular Save share a row and fit above the simulated visual viewport. Save glow has paint space; lower room scrolls behind the soft footer. |
| PL-W-K | `lifecycle/webkit-candidate-rename-keyboard.png` | Same input/Save grouping and reserved viewport clearance, no clipped Save halo. |
| PL-C-D | `lifecycle/chromium-candidate-drag-held.png` | Outgoing Pocket Strike and faint incoming Bowling art/metadata coexist inside the fixed discovery frame. Play remains fixed; no lower duplicate text/layout push visible; search icon and Host Pick circle remain. |
| PL-W-D | `lifecycle/webkit-candidate-drag-held.png` | Same held-drag composition and fixed Play/catalog geometry. Static pixels cannot establish gesture velocity, easing or haptics. |

Lifecycle report explicitly uses fixture Swift messages/state/discovery and a visualViewport resize simulation. No physical keyboard is present in these PNGs; reachability with the iOS keyboard/native dock remains unverified.

### Final popup sampling

The popup lane froze `public/app-ux-20261005.js` at `48e142115740a2e9f29f075b23a496f56987f106404b50f268bd7c0a7301cba0` and `public/game-ui-system.js` at `759b7d5dcb03cd0e955537e252d6b00566dbd5ac7e0a25140ea7aa902b73283a`. Shared CSS is byte-identical before/candidate. I read report rows showing the exact0.93 gradient alpha,8px background blur and active modal state; existing-edit profile rows retain visible home/catalogue/search/spotlight with the same rectangles. Dense-looking full-height profile pixels are therefore not evidence that alpha/blur were removed.

Additional individually opened images:

| ID | Capture beneath `output/playwright/performance246/popups/` | Observation |
| --- | --- | --- |
| PU-W-P | `actual-targets/webkit-web-profile.png` | Centered Ready-to-Play illustration/title; helper lavender; name gradient capsule; paired Save/Back reachable in the browser viewport. No keyboard shown. |
| PU-W-R | `actual-targets/webkit-web-players.png` | Exterior catalog blurred/shaded, sharp roster/audio card, balanced slider groups, lone Back centered. Opener remains explicitly programmatic/diagnostic for this web route. |
| PU-W-T | `actual-targets/webkit-web-rankings.png` | Intrinsic empty-sheet height with centered lavender paragraphs; underlying game logo/Play remain blurred and visible. |
| PC-W-P | `actual-controller/webkit-controller-profile.png` | Trusted profile opener through controller scripts; same title/input/action grouping with visible blur above. Prescribed14px profile lift leaves an exterior bottom strip in the no-native-dock fixture; physical dock layering is not established. |
| PC-W-R | `actual-controller/webkit-controller-players.png` | Trusted room opener; rounded roster/audio, full sliders, centered Back, softened header above. |
| PC-W-T | `actual-controller/webkit-controller-rankings.png` | Trusted rankings opener; compact intrinsic sheet, centered lavender paragraphs, clear Back rim and visible blurred catalog. |
| PU-W-G | `webkit-web-rules.png` | Push Pit Goal/Controls/How-to-Win copy centered and lavender, lime section captions, rounded CTA and Back share a row; backdrop visibly soft. |
| PU-C-G | `chromium-web-rules.png` | Same rule hierarchy/paired actions, different natural line wraps, no clipped copy. |
| PN-W-G | `webkit-native-rules.png` | Complete game art; centered lavender goal; Controls/How-to-Win in dark-purple capsules; Play/Controller/Back fit one row with unclipped light. |
| PN-C-G | `chromium-native-rules.png` | Same art, capsules and triple-action alignment; purple Controller edge remains confined to its rounded button. |
| PN-W-B | `webkit-native-bots.png` | Push Pit title and add-bot description centered; hint lavender; counter between minus/plus; disabled Start distinct; outside catalog softened/dimmed. |
| PN-C-B | `chromium-native-bots.png` | Same centered hint, counter/action layout and preserved background. No visual state-change timing inferred. |
| PN-W-N | `webkit-native-rooms.png` | Nearby tab sharp, helper centered/lavender, own room green rim. Expander is in the players row, sharing the Connected right inset. Bold room names and single centered Back. Join halo has paint room. |
| PN-C-N | `chromium-native-rooms.png` | Same grouped room card, expander/player alignment and visible softened background; no row/button clipping. |

Coverage is17 popup candidate images total including the earlier three Chromium `actual-targets` images. Actual-targets web profile/rankings use trusted visible buttons; web Players uses a programmatic opener and stays diagnostic. The final native-controller profile/players/rankings set uses trusted visible buttons with both controller-bridge and tabs scripts. Main native state/room discovery/bridge payloads remain browser fixtures. Original main programmatic native Host/web profile/players/rankings diagnostics were not promoted; final phone recheck covers Host Panel and lifecycle captures cover room-name expansion/simulated viewport clearance independently. No By Code, physical keyboard/tab dock, destructive confirmations or gameplay-pause screenshots were freshly reviewed in this lane.

## Curtain keyframe inspection

Individually opened all52 original PNGs beneath `output/playwright/performance246/curtain/`: both engines' cold-menu-opening; Curling/Bowling/Push launch and return at closing/covered/opening/settled; and reduced-return. The curtain owner's22 report rows are separate behavioral evidence; sampled PNGs alone cannot prove continuous motion or Core Animation.

| Case ID | Individually viewed phase filenames | Per-phase observation |
| --- | --- | --- |
| CT-C-0 | `chromium-cold-menu-opening.png` | Diagonal opening has an opaque side cover and a prepared discovery scene in the gap; fading central HeyPals artwork remains part of the cover. |
| CT-W-0 | `webkit-cold-menu-opening.png` | Capture is already near/end opening with the menu's prepared entrance still offset. It is a cold browser-document load against the existing selected-room state, not proof of first-ever unselected menu. |
| CT-C-CL | `chromium-curling-launch-{closing,covered,opening,settled}.png` | Closing shows source discovery before doors move into view; covered completely hides source; opening reveals Curling art under departing game-logo cover; first post-curtain frame has centered waiting copy/art but leaks a menu lamp head at left(x0,y≈318). Sent to source owners. |
| CT-W-CL | `webkit-curling-launch-{closing,covered,opening,settled}.png` | Closing retains source; covered opaque; opening visibly reveals the destination and thin departing edges; first post-curtain waiting art/copy fits, with late Ready count still faint. No lamp leak in this selected-source branch. |
| CT-C-CR | `chromium-curling-return-{closing,covered,opening,settled}.png` | Closing retains waiting scene; covered uses centered HeyPals logo; opening gap shows prepared Host Pick/catalog; first post-curtain menu has the correct Curling Host Pick and no cover seam. |
| CT-W-CR | `webkit-curling-return-{closing,covered,opening,settled}.png` | Same opaque cover and prepared menu; opening sample exposes more menu than Chrome, with inward-positioned cards still animating; first post-curtain menu is complete and cover-free. |
| CT-C-BL | `chromium-bowling-launch-{closing,covered,opening,settled}.png` | Source menu retained, covered Pocket Strike logo centered, opening destination bowling art visible, first post-curtain waiting composition clear with no residual door. |
| CT-W-BL | `webkit-bowling-launch-{closing,covered,opening,settled}.png` | Same retained source/opaque cover/destination progression; opening door edges near screen boundaries; first post-curtain waiting logo and copy fit, late Ready count still faint. |
| CT-C-BR | `chromium-bowling-return-{closing,covered,opening,settled}.png` | Source waiting retained; fully covered HeyPals; gap reveals prepared menu; first post-curtain Pocket Strike Host Pick/circle/Play fits. |
| CT-W-BR | `webkit-bowling-return-{closing,covered,opening,settled}.png` | Same four-phase composition; prepared menu is visible through broad opening gap; no cover seam in first post-curtain menu. |
| CT-C-PL | `chromium-push-launch-{closing,covered,opening,settled}.png` | Source menu retained; Push Pit cover complete; destination art reveals in opening; first post-curtain waiting scene preserves logo and puck art. |
| CT-W-PL | `webkit-push-launch-{closing,covered,opening,settled}.png` | Same source/cover/destination; opening edges remain faint at viewport; first post-curtain waiting copy/logos visible with late Ready count faint. |
| CT-C-PR | `chromium-push-return-{closing,covered,opening,settled}.png` | Waiting source retained, opaque HeyPals cover, prepared catalog in opening, first post-curtain selected Push card has rounded purple edge and Host Pick fits. |
| CT-W-PR | `webkit-push-return-{closing,covered,opening,settled}.png` | Same four-phase progression; original catalog/card art preserved, no residual door in first post-curtain menu. |
| CT-C-RM | `chromium-reduced-return.png` | **Rejected as final-return evidence:** Curling waiting scene and a diagonal cover seam remain. The capture occurred before the requested return completed. Owner notified. |
| CT-W-RM | `webkit-reduced-return.png` | **Rejected as final-return evidence:** same Curling scene beneath a fading cover/seam. Owner notified; needs destination acknowledgement plus absent cover before screenshot. |

The original `*-settled` labels are too broad: they are first curtain-idle frames, before some finite waiting/menu entrances finish. The owner preserved an explicit `assessment.json`. Corrected destination-aware captures were deferred when the user replaced this task with Git integration. No final-scene/timing acceptance is transferred from these early images. Real server bot names are Russian in these captures; that is retained roster data, not an injected English acceptance fixture or verified localization matrix.

The lamp defect was traced read-only to `public/tv-discovery.js`: stage-level cloned lamp/light elements were gated by `intro.hidden`, escaping the parked lobby's opacity/hidden ancestry, while active-game rendering skipped Discovery.update. The final TV lane adds a lobby-hidden/source-presence gate before layout reads and a bounded lifecycle observer. The new real unselected-discovery→Curling capture below shows no stage lamp/light during the game; Chrome and physical-device confirmation remain outside that lane.

## Diagnostic baseline inspected

Opened `output/playwright/tv-layout246/baseline/webkit-1280-p1-{pick,browse}.png` and `webkit-1280-p16-{pick,browse}.png` individually. The selected/browse pair visibly shifts the Join/People column downward and changes available roster rows. At16 players, the baseline selected screenshot displays three named rows plus+13; browse displays two named rows plus+14. On Top remains legible, fully rounded and within the viewport, and the champion has a warm gold score/coin treatment. This diagnoses the anchor/capacity defect; it does not approve the pending CSS correction.

TV correction removes obsolete24px browse margin and derives browsing2px top padding versus selected26px padding from the selected parent's existing24px lift. Final WebKit captures below verify the candidate rather than promoting this baseline.

## Final TV WebKit candidate inspection

Frozen `public/tv-menu-polish.css` SHA `78cd1ead8b51f0100df0daac7b6b59b7b2879325fc0c588bcaebd9e4071c7e41` and `public/tv-discovery.js` SHA `f966c68439cc84cc11a17a5e7cb3995bdc234285d676b5c1de82b209028b147e`, both verified from current files. `output/playwright/tv-layout246/final/report-webkit.json` says `ok:true`, no errors/resources, and includes exact sidebar rectangles through selection crossing/receiver resize and hidden clone lifecycle. Browser receiver-resize fixtures do not prove physical casting. All23 following PNGs were individually opened:

| ID | Capture beneath `output/playwright/tv-layout246/final/` | Observation |
| --- | --- | --- |
| TV-W-720-1 | `webkit-1280-p1-pick.png`, `webkit-1280-p1-browse.png` | Join/Our People/On Top remain at the same anchors in the pair. Sparse Top is centered in the remaining space; champion long name wraps without pushing coin count. Host Pick full width/circle/Play inset fit. |
| TV-W-720-16 | `webkit-1280-p16-pick.png`, `webkit-1280-p16-browse.png` | Both retain three named roster rows plus+13, equal sidebar anchors, complete Top rows and bottom rim. |
| TV-W-1080-1 | `webkit-1920-p1-pick.png`, `webkit-1920-p1-browse.png` | Same stable sidebar anchors, complete long-name Top and balanced sparse-space centering. Host Pick art/circle/grouped label and equal Play inset preserved. |
| TV-W-1080-16 | `webkit-1920-p16-pick.png`, `webkit-1920-p16-browse.png` | Three named rows plus+13 in both; Top complete and coins fully visible. No selected/browse displacement. |
| TV-W-4K-1 | `webkit-3840-p1-pick.png`, `webkit-3840-p1-browse.png` | Sparse sidebar geometry and Top centering stable at4K. Rounded rims/art/control grouping intact. |
| TV-W-4K-16 | `webkit-3840-p16-pick.png`, `webkit-3840-p16-browse.png` | Full roster same three rows plus+13; all Top rows remain inside screen/rims; Host Pick full width and equal circular Play inset fit. |
| TV-W-1610-1 | `webkit-1600-p1-pick.png`, `webkit-1600-p1-browse.png` | Narrower2-column catalog adapts without moving sidebar anchors; sparse Top centered and complete. |
| TV-W-1610-16 | `webkit-1600-p16-pick.png`, `webkit-1600-p16-browse.png` | Full roster retains three rows plus+13 in both; Top reaches near screen bottom but retains its full rim/content. |
| TV-W-D720 | `webkit-1280-initial-discovery.png` | Large Pocket Strike art left; First Play/count/Play right; bullets aligned below; left-edge lamp and side lights remain. Large character art behind Play uses a soft lower mask toward cards. |
| TV-W-D1080 | `webkit-1920-initial-discovery.png` | Same discovery hierarchy/original large character art and soft lower mask; sidebar fully visible with four-player roster shown as three+1. |
| TV-W-D4K | `webkit-3840-initial-discovery.png` | Same logo/metadata/Play and lamp/light composition at4K; bulbs remain on one horizontal line. |
| TV-W-REC | `webkit-3840-p16-reconnect.png` | Reconnect fixture retains full selected Host Pick, stable side cards, three names+13 and complete champion coins/Top rows. |
| TV-W-CL | `webkit-1280-curling-launch.png` | Real server launch from initial discovery produces Curling preparing scene without the old menu lamp head/light. Curling art, centered waiting copy and four connection pills fit. |
| TV-W-COIN | `webkit-3840-coin-glint.png` | Champion gold coin/count has a restrained warm glow and a visible small glint. Long name wraps, coin count stays readable; no score/rim clipping. Static image does not prove glint cadence. |
| TV-W-RM | `webkit-3840-reduced-motion.png` | Reduced-motion menu retains selected sidebar/circle/Play and complete Top; motion disabled status comes from the report, not one PNG. This is distinct from the rejected curtain reduced-return image. |

Unclassified raster-quality diagnostic:1280/1600 full-roster captures have rougher game-art/logo edges than their sparse-roster captures;4K samples appear smoother. No geometry break or new cause attributed to the scoped sidebar/decorations fix. Baseline/controller budgeted-render behavior should be compared separately before any art-quality claim.

## Remaining acceptance

- Chrome TV candidate and receiver hardware layout remain untested in this lane; final WebKit matrix/reconnect/coin sampling above is complete.
- Broader popup matrix beyond the17 sampled images plus phone Nearby/rename above; By Code, confirmations and pause remain outside fresh visual scope. Programmatic-opener diagnostics are never actual-button evidence.
- Physical room-name/code and profile keyboard/dock state. Desktop simulated viewport reserved space is sampled above; real keyboard/dock reachability remains separate.
- Corrected curtain destination-aware ending captures and cold-unselected opening/rapid-interruption end poses remain deferred. Original reduced-return labels are diagnostic. The TV WebKit real launch closes the sampled source-lamp defect; Chrome/device confirmation remains unverified. Static images cannot validate continuous smoothness, Core Animation or receiver-presented frames.
- Fresh physical iPhone standalone and separate-display cast measurements. Nothing in this report approves a physical cast or promises zero lag.

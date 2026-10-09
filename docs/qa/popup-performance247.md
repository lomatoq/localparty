# Popup blur experiment 247

Status: isolated experiment, no production blur change accepted. Main baseline `87dd64fa783c3092061ac5a77074839e2fbfb185` is saved in `.localparty-build/popup247/source-before/public`. Accepted 246 observer guards remain in main. The native 148 build uses accepted main, not this prototype.

## Purpose and acceptance conditions

Test one cause: animating `filter: blur()` on the full catalogue/background branches can require changing blur raster work during a popup action. A constant 8 px viewport blur plane with animated opacity is a hypothesis, not an automatic GPU win. It must preserve gradual blur, the existing shade, 93% matte popup material, visible and stationary underlying header/Host Pick/search/spotlight, art travel, interruption cleanup and reduced-transparency behavior. Desktop timings do not establish physical iPhone or active casting performance.

Workflow follows the [Addy Osmani performance skill](https://github.com/addyosmani/agent-skills/blob/main/skills/performance-optimization/SKILL.md): isolate the cause, freeze baseline, measure equivalent action windows, and keep only a repeatable improvement with correctness. The [Chrome animated-blur article](https://developer.chrome.com/blog/animated-blur/) warns that live promoted blurred layers still cost GPU work; its wrapper crossfade technique is not evidence that this implementation is faster. [WebKit backdrop-filter documentation](https://webkit.org/blog/3632/introducing-backdrop-filters/) explains the underlying multi-pass operation.

## First experiment: pseudo backdrop rejected

`scripts/popup-backdrop247-fixture.cjs` exports `viewportBackdrop`. It removes the existing background-branch filter and places constant `blur(8px)` on the foreground `::backdrop` or the existing real profile backdrop. It leaves the current opacity animations in control.

Fresh Chrome and WebKit fixtures at 393 × 852 used the visible native Games/embedded controller targets:

- Rooms: `#nearbyToggle` → `#nearbyDialog`.
- Bots: native `#choiceStart` → `#startBots` popover.
- Game details: native `#choiceName` → `#gameDetail`.
- Existing profile edit: controller `#editFromCatalog` → `#onboarding`.

Transport/native callbacks were fixtures; taps used Playwright touchscreen events. These are browser tests, not physical app or keyboard tests. Frozen app source was route-intercepted while normal server `/play` role injection remained intact.

Artifacts: `output/playwright/performance247/popup-backdrop/{webkit,chromium}-report.json`, per-case PNGs and original-speed `{engine}-{variant}-{mode}.webm`.

The fixture passed geometry, material, computed 8 px filter, intermediate opacity, marker cleanup and page-error assertions. Nevertheless, actual WebKit Rooms/Bots pixels were sharp through the candidate backdrop. Current-main pixels were blurred. The independent reviewer confirmed this in eight Rooms phase images and the Bots mid/settled images. This candidate is rejected. The report's old `ok: true` means DOM fixture assertions only, never pixel acceptance.

The old edge checker had weak sharp energy (~4.1–4.3) because the header occluded the chosen patch. WebKit candidate/current ratios corroborate the visible difference, but this weak oracle alone cannot prove blur. Chrome native ratios above 1 are invalid/occluded, not evidence of blur success. A revised checker uses a visible high-contrast ordinary DOM patch and marks insufficient sharp contrast invalid.

Old frame labels were requested sleeps (50 ms, another 70 ms, then 650 ms). Screenshot calls can outlast their requested phase. In particular, `*-exit.png` is requested after a 65 ms sleep after closing and has no exact screenshot clock or explicit post-cleanup PNG. The old image showing an absent panel and soft background is not by itself proof of a delayed cleanup. New captures record the trusted event time, screenshot start/end state, panel pose, plane opacity/filter/shade and a separate post-cleanup image.

## Prepared real-element alternatives

`actualViewportVeil` is an isolated source transformer; it is not included by the app. It creates a viewport-sized real element below the foreground popup, retains a constant 8 px backdrop filter, and crossfades opacity from the current value. Dialog shade arrival remains 240 ms and exit 180 ms; Bots arrival/exit remain 180 ms. The real profile backdrop keeps its existing lifecycle. No background DOM is cloned or removed.

Two candidates are prepared: a real top-layer popover plane, and an ordinary body plane for the first popup with a bounded additional top-layer plane only for an overlapping/nested popup. The latter addresses the fact that an ordinary body element cannot filter an already open top-layer dialog. Reopening continues from the sampled opacity; close/removal deletes the plane. Nonmodal Host navigation never creates a veil.

These alternatives have only passed JavaScript syntax checks so far. Pixel, nested/interrupted/reduced-mode and paired trace gates remain pending. No production change or performance claim is made.

## Fresh real-element first-level pixels: rejected

`output/playwright/performance247/actual-firstlevel/webkit-report.json` records the frozen main, current and two real-element variants on actual controller Rooms and profile targets. Each has arrive/mid/settled/exit/post-cleanup PNGs plus an original-speed WebM. All six real popup cycles passed DOM/material/geometry/cleanup assertions with no page errors. Both real-element variants nevertheless leave the background sharp, including profile. Neither is eligible for production.

For Rooms the real elements were visible at `{x:0,y:0,width:393,height:852}`, computed opacity 1 and backdrop blur 8 px. The body version had z-index 2147483646, so merely moving the same veil above ordinary page controls did not fix pixels. The stronger checker had sharp energy 124.787 (valid contrast); main ratio was 0.00475, while both real-element variants were 0.55715. This is dimming without the requested blur. Actual UI images support the same rejection.

Effective source SHA-256:

| Variant | app-ux JavaScript | app-ux CSS |
| --- | --- | --- |
| current | `48e142115740a2e9f29f075b23a496f56987f106404b50f268bd7c0a7301cba0` | `4c81a3777d26b991a1ef8a4eddfea3e2421008e9e21d8f17c8e22e638d0ca8ae` |
| actual-veil | `3b3579bb5b871b7ae2dc67588e64b9ab488268114061289081a7e5544bea56ba` | `86dbc302ce299608d879c6817b388329a4c14e79af027138871ecdf96e9fcd09` |
| actual-bodyveil | `6809e082a2e87eeee6350f6c142a249944afefac8a04beb0062166e0bbc34e1a` | `86dbc302ce299608d879c6817b388329a4c14e79af027138871ecdf96e9fcd09` |

Current Rooms exit screenshot started 79 ms and ended 218 ms after trusted close; profile started 74 ms and ended 248 ms. The screenshot operation crosses the 190 ms closure timer, so that PNG cannot identify an exact presented exit phase. Explicit post-cleanup captures started at +442/+478 ms and confirmed no open/present/branch markers. rAF samples document the ongoing filter transition, but do not measure when the display presented those pixels.

A source-free minimal capability fixture is prepared in `scripts/popup-backdrop-capability247.cjs`: sharp checker, actual `filter:blur(8px)` control, real fixed backdrop with prefixed/unprefixed declarations, static/animated node and wrapper opacity, promotion, body/stage isolation and top-layer examples. It has not run yet. This will distinguish a WebKit screenshot-rendering limitation from application backdrop-root/cascade suppression before any further app complexity is added. Heavy paired traces are not justified until pixels pass.

Independent visual reviewer confirmed all six settled images in the fresh first-level run: current Rooms/profile soften the exact header/logo edges, both placements keep those edges sharp. They also reviewed current arrive/exit/post-cleanup originals. Current arrival is visibly soft and readable; post-cleanup images are sharp with retained controls. There is no evidence in these desktop captures of a prolonged blur after cleanup. Full-frame progressive blur and physical-phone opening stalls are separate, still pending gates.

## Minimal capability result and closure

Root granted a short independent-control slot. Only four modes ran, first headless and then the same four headed: `sharp`, `branch-filter`, `body-static`, `dialog-backdrop`. No HeyPals source/style/native fixture was loaded. All checker rectangles were 393 × 852 with adequate contrast. The exact same result occurred in both modes:

| Control | Neighbor-contrast ratio to sharp |
| --- | --- |
| Sharp | 1 |
| Actual branch `filter:blur(8px)` | 0.0000213 |
| Ordinary fixed real `backdrop-filter:blur(8px)` | 0.733333 |
| Dialog `::backdrop` blur 8 px | 0.733333 |

The `filter` control paints a smooth gray field; both backdrop paths retain sharp stripes with only the translucent black shade. Originals and JSON are in `output/playwright/performance247/capability-headless/` and `capability-headed/`. This isolates the failure from HeyPals cascade or background ancestor effects, but establishes only a limitation of the exact desktop Playwright/WebKit rendering/screenshot backend used here. It does **not** prove that iPhone WKWebView cannot paint backdrop blur. [Playwright documents that its patched WebKit differs from branded Safari](https://github.com/microsoft/playwright/blob/main/docs/src/browsers.md), and [its screenshot guidance lists rendering environment differences](https://github.com/microsoft/playwright/blob/main/docs/src/test-snapshots-js.md).

This experiment branch is closed without production changes. No additional live planes, DOM clone/snapshot architecture, blur/effect reduction or claimed performance gain was introduced. Native/physical proof is required before reopening this algorithm choice. The existing branch-filter blur stays intact.

A compact human-viewing control is saved at `output/playwright/performance247/capability-physical/index.html` for a later authorized physical check. It exposes sharp, actual filter 8 px, a real body backdrop and a dialog backdrop without application CSS. This file has not been viewed on any phone and is not bundled into the app or presented as a performance measurement. Its body plane fades opacity over 240 ms at a constant radius.

Reproducibility: the actual-path driver now reconstructs its frozen public HTML/JS/CSS source from the named Git commit if the ignored baseline snapshot is absent, then validates the exact commit marker. It does not silently compare changing current source. All three prepared scripts pass `node --check`; no automatic test depends on an ignored candidate artifact. Broader nested/reduced/trace/device gates were deliberately not run on a candidate that failed the available rendering controls.

The independent reviewer inspected all eight minimal-control PNGs and reached the same result: branch filter flattens stripes, both backdrop paths preserve stripe edges while dimming, in headed and headless captures. The browser artifact gate therefore remains rejected; removing the working branch filter is not approved by this evidence.

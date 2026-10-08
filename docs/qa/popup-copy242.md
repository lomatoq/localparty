# Popup copy and layout review 242

The shared popup explanation colour is now `--hp-popup-copy: #ceafff`. Technical explanations are centred across native-host dialogs, bot popovers, profile sheets and controller dialogs. Forms, room names, roster rows, counts, addresses and primary actions keep their existing semantic alignment and colours.

| Before | After | Why |
| --- | --- | --- |
| Root Push Pit bot popover inherited `text-align: start`; the same prompt nested in game details inherited centred text. | Both use centred explanatory text, 14 px / 1.45, in the shared lavender colour. | The description reads as part of the centred title without changing the Bots control row. |
| Popup descriptions came from several grey / desaturated tokens (`#b9b1c9`, `#d3c5e7`, `#cbbbea`, `#e5d7f2`). | Named explanations use `#ceafff` at full text opacity. | The colour is visibly violet while outer panel material stays at the requested 93% opacity. |
| Legacy game-rule selectors and later Rooms styles could win over generic paragraph colour. | The shared token also owns game-detail rule paragraphs and Rooms By Code helper/status copy. | Host and controller surfaces resolve to the same final explanation colour. |
| At 320 px the in-game catalogue's `players` caption painted into the neighbouring `?` action. | The range counter wraps within its copy column. | It preserves button and font sizes while removing the overlap. Both the number and caption bounds are asserted. |

Production UI edits are limited to the final copy block and narrow catalogue counter wrapping in `public/app-ux-20261005.css`. The root agent subsequently added a background-only CSS animation pause gate for active modals; representative captures were refreshed after that change. The performance lane owns JS changes, including the host return-mask fix. The UI audit reproduced a stale 422 px backing after returning from an active game: it covered the spotlight logo and metadata although modal blur had already cleared. The final follow-up geometry measurement now returns to 178–180 px, within 2 px of the initial 180 px, on all four WebKit/Chrome × 320/393 routes; fresh full-size screenshots confirm the logo and metadata remain visible. The initial backing intentionally overlaps the headline by its soft feather, so the regression assertion compares returned geometry to initial geometry rather than requiring an artificial zero overlap.

The initial 320×568 profile screenshot shows the top of an internally scrolling form. Hand selection and Language were not removed: fresh `profile-fields-scrolled` captures and geometry assertions confirm both are fully reachable, with Save and Back still visible. No extra form layout change was needed.

## Evidence

- Before capture: 12 native-host and 24 controller images from the actual runtime before the copy fix.
- Native host: 28 states × 2 engines × 2 phone viewports = 112 captures. Includes inline Host tab, modal Host Panel at several scroll positions, reset/language/Wi-Fi/remove-player/end-game confirmations, Push Pit/Pocket Siege/Sinyak Quiz rules and settings, and five bot-popover states including a nested dialog.
- Controllers: 15 states plus the scrolled profile view × 2 routes × 2 engines × 2 phone viewports = 128 captures. Routes are ordinary `/play` and native controller bridge with persistent tabs. QR and stop-confirmation states use real legacy-host actions.
- Rooms: 20 controller and 16 native-host captures, including Nearby, rename collapsed/opening/editing/saved, By Code, and a simulated shortened keyboard viewport.
- TV: 8 menu assurance captures at 1280×720 and 1920×1080. The separate `output/playwright/tv242/index.html` contains final TV/game screenshots from that lane.
- Representative host, profile, catalogue and Rooms screenshots were repeated after the root's final modal pause rule; the gallery uses those latest captures for the affected states.

Assertions check final computed lavender colour, centred explanation targets, outer 93% gradient alpha, actual background branch `blur(8px)`, a sharp foreground, backdrop shading, cleanup after close, Back bounds, catalogue metadata/action separation, profile field reachability, settings commands, room rename/paste/backspace and provider callbacks. Native bot popovers are opened in the real top layer and exercised both at the shell root and inside game details. `QA_RETURN_ONLY` required an explicit wait for nested blur because skipping screenshots also skipped the original harness's settle delay; the initial `blur(0px)` assertion was fixture timing, not a production defect.

Every accepted gallery image is linked in `output/playwright/popups242/visual-review.json`, with source fingerprints, image hashes and comments. Contact sheets were used to inspect all captured states, followed by full-size checks for bots, the narrow profile, catalogue overlap, Rooms code/rename and host return. Soft fades at the edge of scrolling bodies indicate more content; footer actions remain outside that scroll region.

## Limits

These are real browser UI captures with an injected native bridge, production catalog/settings schema and seeded rooms/roster/history/provider fixtures. They do not establish physical iPhone or AirPlay smoothness, haptic delivery, a real iOS keyboard session, live online connectivity, actual match history or all 36 game-specific configuration variants. Device profiling and the online-service recommendation are separate workstreams.

The requested 93% popup material, background dim/blur, brighter Back border, green primary actions and rounded configuration controls were preserved. Lists and forms were deliberately not globally centred.

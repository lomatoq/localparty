# Popup background stability — build 106

Scope: native Games/Host's Pick and the controller Rules sheet. This is not a claim of physical-device gesture acceptance or a whole-game audit.

| Before | After | Why |
| --- | --- | --- |
| Opening any modal changed the body to `position:fixed`, resetting WebKit document scroll and moving sticky rows. Native Host's Pick moved from y66 to y-29 in the baseline capture. | Only the root scrollport is locked. Body positioning and the document's scroll offset remain unchanged. Final trusted taps retain scroll180 and Host's Pick y66 at 320, 393 and 402 px. | A popup overlays the current screen; it must not replace the underlying layout or its sticky coordinate system. |
| `show()` collapsed the expanded active-game deck; closing Settings rebuilt its expanded state. | Settings overlays the already expanded deck. | Preserve the visual return destination instead of animating an unrelated layout underneath the sheet. |
| The deck's global outside-pointer and Escape handlers also received input intended for popup controls. Tapping confirmation Cancel reduced the deck from249.89 to197.89 px. | Both handlers ignore input while any owned dialog remains open, including its exit. | Modal input belongs to the modal. Outside-dismiss still works normally with no popup open. |
| The important entrance selector outranked the reduced-motion override, leaving movement enabled. | Reduced-motion selectors match the lifecycle specificity for sheets and backdrops. | Respect the platform preference on the actual native route. |
| Mobile `#rulesBody` forced visible overflow despite its constrained flex height, painting the last paragraph under Got it. | Restore bounded `overflow:auto` and16 px of end padding inside the existing sheet; its footer remains outside the scroller. | Long rules stay fully readable above the persistent action rather than being clipped or covered. |

The established shared240 ms entrance and180 ms exit remain. No additional library, broad motion redesign, catalogue rebuild, game input or network command was added. Existing touch/wheel containment is preserved. The installed `animate`, `emil-design-eng` and `mobile-native` skills informed the narrow platform and interruption checks; `improve-animations` was read as an audit reference rather than used to turn this requested fix into a roadmap.

Evidence: `.localparty-build/popup-stability106/before/` and `/after/`, with exact source hashes in `report.json`. Native pages run the shipped controller bridge and tabs at document start in their real order; Swift snapshot transport alone is explicitly replaced by a QA fixture. Controller joins use the actual local server and profile form. Captures cover Rules opening, settled display, closing and restored background. The baseline used locator clicks; the final host checks use trusted coordinate taps to avoid Playwright's own sticky-target auto-scroll.

The focused browser regression verifies stable document scroll, row coordinates and expanded-deck height across modal transitions, confirmation and Escape. Long sheet scrolling and reduced motion are checked independently. Physical-device capture and touch feel are handled by the root build/install task; isolated WebKit evidence must not be described as a USB device test.

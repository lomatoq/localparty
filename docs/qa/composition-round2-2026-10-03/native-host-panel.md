# Native Host Panel — 2026-10-03

The user's rectangular backing and unstable header complaint is closed in the fresh six-image packet at `output/playwright/composition-round2-2026-10-03/native-host-panel-fix/report.json`.

| Before | After | Why |
|---|---|---|
| Whole dialog scrolled beneath a sticky title with a gradient pseudo-element. | Header is a separate opaque, 76px row; the existing 44px close button stays within its padding. | Content cannot move beneath the title or displace the close control. |
| Late background rules restored rectangular purple planes on every section. | Existing sections have transparent backgrounds and no finishing pseudo-elements; the rounded outer sheet owns the surface. | Removes the redundant inner enclosure without changing controls or section content. |
| Edge fades were attached to the outer scrolling panel's children. | `#hostPanelBody.scroll-content` alone scrolls and receives the shared dynamic mask. | Only content fades; header and rounded outer surface stay complete. |

Personally opened all six originals: 402×874 and 320×568, each at top/middle/end. Qualitative review confirms no inset purple rectangle, a stable title/close row, coherent shared left alignment and complete final diagnostics copy. The current narrow end image reaches the full build label with space below. Existing player rows and controls retain their own individual surfaces.

Computed checks confirm identical header/close rectangles across all three scroll positions, 44px close target, no outer scroll or mask, transparent body and section backgrounds, no section or inner-body pseudo-elements, correct dynamic start/end fades, and no horizontal viewport overflow. Existing close/reopen, TV-options command bridge and readiness disable/restore pass. The persistent native Host tab retains its existing intentionally hidden close control and fits between masthead and native dock.

`tests/host-panel-browser.cjs` passed, including entrance/close/reopen, native command contracts, safe active-match actions and active-card compaction at 393px/320px. This is a static local server with actual native HTML in WebKit and simulated native snapshots/command bridge. It is not a managed game backend or physical iPhone check.

Only product files changed for this fix:

- `public/native-shell/host-ui.css`: SHA256 `0c499033e011fa67dcb17af6b040d2177f2994d539cbd859b94e3b74427ea500`
- `public/native-shell/index.html`: SHA256 `feadabff590226ad430a50429816bd0f9de9f60a501e9284a6d38f7068a8a4b8`

No `host.js`, common mask, game, input, privacy or controller changes. Existing IDs, section order and actions are preserved. Captures and functional confirmation report no source drift in the seven native/common sources monitored. The only named correction was specificity against the actual later `background-scene.css` section rule; capture-helper resize settling and an initially disabled test action were corrected without product changes.

Fresh confirmation after the shared horizontal-mask freeze is preserved separately at `output/playwright/composition-round2-2026-10-03/native-host-horizontal-final/report.json`. Six new originals at402/320 top/middle/end were individually opened. The same Host Panel closure holds, with a new soft horizontal continuation edge on the genre strip. Close/reopen, TV-options command, readiness and native-tab frame checks pass again; errors are empty and all seven watched sources are stable. Shared source hashes at capture: JS `921e3e386390ee57d33cc1687b7f8de03b098f64f56d16e323b223154976c89d`, CSS `09910de871402455e217bcf8066c03d5f4a2690ba38fdb3ab3276f2f4a9e7198`. Native product files remain unchanged. Previous originals and regression evidence are preserved.

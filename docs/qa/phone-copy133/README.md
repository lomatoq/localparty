# Phone copy and continuous QR hint backdrop · 2026-10-06

Narrow visual changes; no game or navigation logic changed.

- Native catalog introductory eyebrow moved below the dense Host Pick fade. Its own z-index also keeps overlapping hero artwork from painting over the letters; it remains below the sticky deck.
- Native game count readout is21px, label12px. The whole count-and-divider group sits8px lower. Intro top padding provides16px additional clearance from the sticky deck.
- Native “Everyone’s here / Let’s make some noise” title has a soft dark drop shadow.
- QR return hint's existing blurred radial backdrop moved to a sibling wrapper outside the animated details clipping box. The shared220ms disclosure still clips its body, but cannot clip the backdrop. A separate label and the exact existing `arrow-up-right` SVG replace the inline arrow glyph; icon is white and translation remains intact.

Root cause: `motion.js` temporarily applies `overflow:hidden` to details while animating its height. The old100px blurred `summary::before` extended outside that rectangle and was clipped until completion. No shared motion.js change was needed.

Files: `public/native-shell/host-ui.css` scoped masthead rules; `public/background-scene.css` scoped return-entry-shell rules; `public/index.html` wrapper/icon markup; `public/i18n-shell.js` arrow-free translation. Existing dirty changes and sibling rematch changes are preserved.

Verification: `tests/browser/phone-copy133.cjs` loads shipped native tabs and controller bridge, using a native transport stub for Host Hub and the actual local `/play` server route for controller joining. Chrome/WebKit ×393×852 and320×568. Captures include native catalog, disclosure closed, opening40/110/190ms, open and closing. Tests check actual eyebrow paint ordering over hero art, overflow, title shadow, icon identity/white colour, gradient continuing outside the clipped disclosure, and closing state. No physical-device claim.

Evidence: `output/playwright/phone-copy133/report.json` and28 PNGs. Current native393 and QR110ms images are suitable for the combined review.

During real controller startup, this test also found a null-state access in the parallel rematch lane (`app.js`, `state.busy` before socket state). Its owner fixed it to `state?.busy`; current captures are rerun with that fix.

Final result:4 browser/viewport combinations passed,28 fresh PNGs,0 console errors. Native393/320 and WebKit QR midframes visually reviewed; eyebrow is visible above hero art and below the dense Host Pick backing. Sources frozen after this run.

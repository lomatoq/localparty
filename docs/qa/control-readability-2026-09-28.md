# Mobile control readability

Shared `game-ui-system.js` measures actual visible label text inside buttons, button roles, summaries and native selects. It raises only text below 14 CSS px, including nested `span`/`small` labels that older styles mark `!important`. Large primary actions retain their original size. Hidden controls are checked when their class/hidden state changes; newly inserted labels and font/viewport changes are covered. Applied floors are not rewritten on each unchanged game snapshot.

The supporting presentation block also restores standalone rounded stats, gives grouped stats one 18px outer contour, maps action/state typography explicitly, and lets TV state phrases wrap without shrinking numeric timers. Mobile native selects retain their native picker semantics with a 44px target, 18px radius and readable text. `appearance:none` is needed for WebKit to honour those select dimensions. Two older global `scrollbar-width:none!important`/hidden WebKit scrollbar rules were removed; scrolling remains native with subtle rounded thumbs.

Real-browser evidence before the final descriptions-font revision:

- `.localparty-build/control-readability-final/report.json`: 11 families at 320×568 (Knives, Punch Meter, Pocket Siege, Swarm Gate, Millionaire, Jenga, Spy, Kart, Western Duel, Crane, Draw & Guess), actual server/ready/start plus room dialogs. No measured visible button labels below 14px, no button text range overflow, no page errors. This checks the roles actually shown, not every alternate role/result.
- `.localparty-build/control-readability-select-actor-final/report.json`: two actual players; the real Draw & Guess artist was selected for observation. Native brush-width select measured 44px high, radius18, font16; drawing area, palette, clear and footer remain within the 320×568 screenshot.
- Punch settled screenshot confirms both footer actions visible; hit testing lands on Pause, animation is none, opacity1, z-index12. Punch group is a complete rounded panel and its primary action remains 18px italic. Early unsettled/failing evidence was not promoted to the gallery.

A full 36-game capture at 320×568 will follow the final shared-copy and sports renderer freeze, with UI-file hashes and per-game button-floor checks. Do not treat this document as evidence that that later pass has already completed.

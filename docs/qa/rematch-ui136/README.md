# Replay UI, 2026-10-06

User-authorized frontend implementation. Root owns authoritative rematch server command and native Swift allowlist.

The shared player/browser-host results view has a bottom Play again action. Native host replaces the prior launch-based replay action with the same guarded rematch command; the action remains available on its compact active card. Both use existing refresh.svg as a flat white mask in a restrained purple pill. Existing pause/lobby controls retain their styling and handlers.

Transport: app.js sends {type:'rematch',instance} over the authenticated lobby WebSocket after checking current results phase and busy state. Native host uses existing partyShell manage bridge with the identical command. No retry can target a captured stale instance. Buttons show Starting…/aria-busy, suppress duplicate taps, clear pending on a new instance/phase, and allow retry after errors or an8-second confirmation timeout. Player errors appear in the results footer; native errors use existing toast.

Source files: public/app.js, public/match-results.js, public/game-ui-system.css, public/native-shell/host.js, public/native-shell/host-ui.css, public/i18n-shell.js. No HTML, game engine, server or Swift changes from this agent. Native host-ui.css is shared with the separately coordinated text/fade agent; this lane owns only the final is-results/activeRematch selector.

Tests: tests/browser/rematch-ui136.cjs passes Chrome+WebKit ×320/393 actual controller and native shell markup with stubbed transport. Player/browser-host/native buttons show only after results; duplicate pending taps do not resend; explicit errors release retry; starting a new playing instance removes the action. Player button bounds fit both heights. Fresh screenshots and report: output/playwright/rematch-ui136/.

Visual review: WebKit player320 and nativehost393 viewed. White replay silhouette remains crisp; readable action sits below the scores, and native host action aligns beside the existing lobby action. No physical iPhone validation or build performed.

Live desktop verification passed: tests/rematch-live136.cjs with QA_EMBEDDED=0 uses real two-player TapRace finishes, actual player and /host Replay clicks overWebSocket, new same-game instances and automatic playing with both connected players ready, without Ready taps. Final output/playwright/rematch-live136-desktop/report.json passes with no pageerrors. Embedded /host is intentionally403, so embedded player evidence lives separately. Early harness failures captured intermediate filtered readiness and clicked before host received the new final snapshot; final harness waits launch-complete, controller reattach/automatic play and button data-instance matching authoritative result. Startup null-state busy guard was corrected to state?.busy; new live report contains no startup errors. Earlier unsuffixed rematch-live136/report.json is superseded diagnostic evidence, not the final result.

Final embedded player run also passed: output/playwright/rematch-live136-embedded/report.json has ok:true and zero errors. All browser/server processes from this lane are closed. Product source frozen for root build129 preparation.

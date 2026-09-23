# TV information, build26

`public/tv-information.js` is a pure shared adapter with an explicit36-game registry. Static, concise RU/EN rule summaries remain tagged `objective.kind=static`; unavailable data is null/omitted, not fabricated. Runtime metadata provides fallback phase, actor, progress and authorized deadline. Public host snapshots add allowlisted mode metrics. Zero scores are preserved.

`public/bridge.js` publishes only normalized information from display-only host sockets, maximum4Hz with a1-second unchanged-state heartbeat. Controllers do not publish. TV validates origin, iframe source, instance and game ID. No raw snapshots, secrets, answers, private cards or geometry are forwarded. Western Duel's hidden signal deadline is explicitly excluded. Clock types remain tagged; inactive/results snapshots never create active countdowns. RuntimeUI additionally preserves stage for Pocket fallback.

Presentation preserves the original curved/tapered notch:104logicalpx total,64px wings,320px center. Main/action/secondary type32/28/20px, violet surface with lime/lilac. Family choice determines primary timer/turn, live team score or mission progress. Long names truncate in dedicated name areas without hiding the phase. Static goals use concise editorial summaries. Bow and sports retain their existing in-game HUD as sole owner; no additional overlay covers AR markers.

Verified:9 adapter unit tests; real WebKit all36runtime-fallback adapters, four snapshot families at1280×720/1920×1080, origin/source guard, pause/reconnect, geometry and English copy. Independent real-engine QA covered Pocket, Bow, curling and quiz at both resolutions; existing Pocket and quiz inner headers are suppressed, Bow/sports outer header hidden. Quiz shorter-viewport correction and tests are in `public/game-polish.css` from the separate layout pass.

Limitations: Chaos host owns mission state locally and still uses its public runtimeUI summary rather than inventing live progress metrics. This is not a physical-AirPlay image validation for every game or a claim that all36 complete gameplay matches were exercised. Original per-game scoreboards remain in the game viewport.

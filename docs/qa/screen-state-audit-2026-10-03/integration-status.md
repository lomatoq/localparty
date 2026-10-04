# Current correction pass

This pass extends the original five-lane screen audit with the user's live gameplay findings. The installed device remains build112. New source changes are not installed or packaged.

| Request | Owner | Required evidence |
| --- | --- | --- |
| No gameplay HUD during matchmaking in all36 games | arcade_layout + shared_hud |72 actual waiting captures; visibility samples; initial navigation regression |
| Circular uploaded images, including Bomb Tag and dense Naval/Poker | arcade_layout + quiz_layout | Actual uploaded raster, decode/failure handling, dense photo sizing; preserve freeform mascots |
| Podium top stripe removal | shared_hud | Actual normal-clock results originals |
| Native Host compact/middle/expanded deck | social_layout |320/402 cells, actions, expanded Rules and close/scroll |
| Browser/native popup crops and pinned actions | quiz_layout + social_layout |320/402, delayed/failed images, Rules open/close, fixed profile actions |
| Air Hockey fullheight rink | arcade_layout |720/1080 uniform aspect fit; intentional cap overlap remains |
| Curling start after Bowling | shared_hud | Direct switch, true prestart disconnect/rejoin, suspension/resume; historical device failure remains unconfirmed |
| Bowling/Curling optional motion throw; Curling shake sweep | construction_layout | Motion trace tests, permission/freshness/cancellation, actual browser UI; physical gesture still pending |
| Pocket Siege lower crew and weapon dock | pocket_layout |2/4/6 players at720/1080 |
| Pocket Siege direct-hit damage and effects | arena_layout |321-weapon audit, contact/miss/offset/delayed tests and live render evidence |
| Punch Meter sensitivity /5 before saturation | sports_controls | Weak/medium/strong gesture and score tests; retain1000 cap |
| Flappy countdown fullscreen dim, remove timer rectangle | shared_hud | Actual countdown720/1080 before/after |

art_director independently reviews final originals and updates the review page. Pending cells are not accepted on an agent's source report alone.

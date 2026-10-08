# Swarm Gate / Punch Meter graphics polish123

Bounded implementation finished; parent independent image review remains the acceptance step. Existing authored artwork, gameplay projection, input, score/damage and HUD structures are preserved.

| Game | Before cause | Narrow change | Fresh actual evidence |
|---|---|---|---|
| Punch Meter | Loaded gym also painted procedural ring ropes/posts (app.js359); Juice drew a hard triangular cone (arcade-juice.js81). | Procedural furniture becomes missing-art fallback; cone becomes diffuse warm gym light. Actual hanger/bag/reward scale unchanged. | TV720/1080 idle and real human840-point impact, normal clock.720 count-up739 progresses to840 at1080. |
| Don’t Bite the Gate | Oversized floor masonry; turret bases lacked contact; every+10 incorrectly selected huge reward tier; nearby labels could overlap. | Smaller muted masonry, one cached soft contact sprite, tiers10/25/100, restrained scale pulse and bounded screen-space separation preserving every label. | Real2/4-player pointer kills; four simultaneous+10s clearly separated at1080; pause/resume/reload stable. |

Changed renderer sources: `games/arcade/public/app.js:359`, `games/arcade/public/arcade-juice.js:81`, `games/sports_siege/public/host.js:175`, `:214`, `:268`, `:421`, `:463`.

40 engine/score tests, Arcade feel checks,3syntax checks pass. Synthetic screen-space32-label placement checks pass at both sizes; this is not a claim of32actual kills. Impeccable source scan reports no findings. Fresh Punch and Swarm capture errors/source drift are empty and current3source hashes match. Browser/server processes closed.

All12 named originals individually opened by implementer and indexed with SHA256 in proof.json. No physical-device/all16-player/boss-award acceptance, build, install or commit. Initial environment/QA failures remain archived and qualified in proof.json.

[Before / after original review](../../../output/playwright/polish123-gate-punch/index.html)

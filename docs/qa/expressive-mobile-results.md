# Expressive mobile results

Production files: `public/game-ui-system.css`, `public/match-results.js`.

Rows now have84px minimum height (82px in short viewports),20px all-corner radius,8px separation, a substantial dark-violet fill and restrained inset depth. Names remain upright Onest16px; values remain Oxanium27px. A winner receives a fine gold outline, warm score and one24×18px crown from the existing brand asset. A self row receives a lavender edge and compact lime You badge; winner+self retains both meanings. No continuous animation or outer glow was added. Footer styling was untouched.

Real evidence: `.localparty-build/results-expressive-real16/report.json` uses16 real browser players, real server outcomes and TEST_FAST round durations. Knives passed320×568 and375×667, top and bottom list captures, no horizontal overflow, all16 rows reachable, TV names unclipped. All16 happened to tie at zero; this is an actual recorded outcome, not a fabricated fixture.

Separate explicit fixture: `.localparty-build/results-expressive-fixture/` uses demo scores and names passed to the production renderer. Screens carry a visible VISUAL FIXTURE watermark. It verifies winner+self and a long-name self row in16th place. It is not promoted as a real match result.

A separate four-player actual result capture is in `.localparty-build/results-expressive-real4/`; it uses real server outcomes and TEST_FAST duration configuration. These checks verify layout and state presentation, not normal-speed physics.

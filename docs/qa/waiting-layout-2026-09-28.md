# Phone waiting layout regression

Scoped implementation: final mobile readiness block in `public/polish.css`.

Reproduced at 320×568 before correction: waiting card top82 below header64, internal horizontal overflow79px, Ready bottom509.42 behind footer top496. Expanded synthetic long instructions pushed Ready below2000px.

The waiting card now uses bounded grid rows. Instructions and large rosters have real scrolling areas; participation actions remain outside those areas. Decorative glow stays inside the card. Header/card gap is0px. Explicit `[hidden]` guard preserves waiting→playing/results lifecycle.

WebKit checks: `tests/waiting-layout.browser.cjs`, 320×568,375×667,393×852. Actual four-player game plus synthetic sixteen-long-name/long-rule stress fixture. Separate real fifteen-bot+human roster check also passes at all three widths. At320 Ready is44px high, bottom444.81, above footer496, hit-test succeeds, document and waiting-card horizontal overflow0. Waiting→playing asserts computed display:none.

Evidence: `.localparty-build/waiting-layout-before/`, `waiting-layout-after/`, `waiting-layout-16/`. Long fixture is presentation stress, not a claim of sixteen simultaneous human devices.

Full36-game waiting pass found only Swarm's3px subtitle-center shift from a one-sided scrollbar gutter. Gutter changed to `stable both-edges`; gameplay QA owns the final targeted recapture and reconciled36 report. No production gameplay/input changes.

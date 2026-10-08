# TV menu seam and italic supporting copy · 2026-10-05

The right-column wash lived in #lobby, whose box starts at y=64. Its radial gradient had nonzero alpha at the top boundary, making a hard horizontal transition beneath the sound control. Disabling that wash alone removed the discontinuity; disabling header decoration or the wall did not. Diagnostics retained in output/playwright/home126/probe2.

The wash now lives on the full-stage ambient layer, with its previous approximate visual centre retained and hidden outside the lobby. The wall asset and header blur are unchanged. Explicit display and opacity override the old grain pseudo-element defaults.

Small-card descriptions use the authored KardiaFitRunner italic face, preserving 12px/16px size and .58 opacity. Titles, logos, gameplay and controllers unchanged.

Fresh final evidence: output/playwright/home126/complete, 720p/1080p initial and scrolled TV menu. These are browser screenshots, not device validation.

Follow-up: Our People rows use pink alpha .35 → 0 with no dark base; champion medal30×34; On Top group translated3px down with pale-lemon ink; player ranges white mixed with16% card accent.

Final additions: recommendation badge42px with rounded stroke and glow; people paint starts10px inside row under avatar; sidebar outer borders1.5px. Four final originals individually opened, no page/resource errors.

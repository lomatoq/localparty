# Jenga / Crane layouts — feedback 252, 253, 263

Jenga phone uses a full-height grid: tower preview expands into spare height while layer/block/joystick controls remain together. Short portrait screens use compact controls and preserve the force/selection feedback that shared CSS previously hid. Landscape rules remain unchanged.

Jenga TV reserves the bottom status panel's area from the renderer canvas; the existing renderer updates projection to the actual available dimensions. Entire tower is visible above the panel. Host padding uses shared `--party-stage-inset-top`.

Crane current-player message, progress, block count and attempts now share one top panel. The obsolete 120px canvas height deduction is removed, bringing the foundation to the bottom of the play area. No simulation/world coordinates changed.

Crane's unchanged server messages are cached before writing DOM text. Comparing only current DOM text was insufficient: Russian source text was repeatedly rewritten over English i18n output, restarting status animations and leaving labels around 35% opacity. Source-value caching removes that loop; final real screenshot confirms fully legible text.

Real WebKit verification: Jenga and Crane, phones 320×568 / 393×852 and TV 1280×720 / 1920×1080, eight screenshots in `.localparty-build/builders-targeted`. All four phone checks show no horizontal overflow, runtime errors empty. Jenga phone 320/393 and TV720, CraneTV720/1080 visually inspected. Syntax and diff checks pass. Physical simulation and backend untouched.

# Local Tanks — tank artwork and rounded HUD recess

Latest human explicitly identified Local Tanks in the root screenshot. Bounded client change only: removed local mascot image loader/overlays for every tank, preserving hull/turret art, team/actor colors, names, health and flags. No Arsenal source changed. Shared decorative attachment removal belongs root and was already absent in this run.

Field boundary is one closed continuous path with quadratic entry and bottom corners, derived each frame from the actual inverse-projected cap. Its cache key includes cap geometry so paused/responsive height changes redraw it. Inner field outline follows actual cap plus8 logical world pixels; bottom radius22+8=30. Outer metal rim follows the same contour beneath the cap. No trapezoid/acute joins. Outside the cap the full1280×720 world and existing field border remain.

Physics/input/rules unchanged. Authoritative rectangle, static wall collisions and already verified rendered-envelope protection remain as accepted. No server, control or projection source changed. The shape represents the actual existing protected cap region rather than creating a new reservation.

Actual normal-clock TV proof: `output/playwright/composition-round3-2026-10-03/tanks-rounded-recess-final/report.json`, finished2026-10-03T14:34:06.430Z, changedFiles[], errors[],1 clean row,2 compositionScreens and104 authoritative actor-envelope samples. Both full1280/1920 PNG originals opened. Real Forward/Fire press/release; paused resizing at both sizes settled before movement; actual nonhost/invalid/stale geometry rejected; TV reload preserved authoritative layout. Human pressure meets an existing wall before the cap in this fixture; direct human/bot cap-edge contact remains separately verified by the authoritative bounds test. No phone screenshots/physical-device validation claimed.

Measured cap in world units at both TV sizes: x340,y0,width600,height113.59375. Recessleft332,right948,bottom121.59375,radius30. At1920 the same logical contour scales uniformly1.5×. Original cap exclusions remain exactly340,0,600,113.59375.

Validation:8 meaningful tests passed with `tests/tanks-boundary-shape.test.cjs` and `tests/tank-visible-playfield.test.cjs`. New tests execute actual client geometry functions to verify closed finite quadratic U, both inverse scales, dynamic height and invalid geometry; artwork test executes actual renderer with drawImage forbidden and confirms only tank-body/tank-turret draw while preserving color. Existing tests retain authoritative human/bot cap protection, auth/stale/reconnect, paused snapshot, resize/spawn and Arsenal bounds coverage. JS syntax passed.

Frozen SHA256:

```
games/tanks/public/host.js 1bffb40de96107312aed16e4561661c4c8497ccf49049a8569861b7b38eadaf4
tests/tanks-boundary-shape.test.cjs df4f559832f04dc28de54620cad5dcfb566dce4543ac43f7613804e1e1e3c564
games/tanks/server.js dcc0052dcd357d0cc8bb693d719bce9c6f55d640ddec148a6baebea78bfcf16f (unchanged)
```

Browser/server closed and slot2 released to root. No further product edits.

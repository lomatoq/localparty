# Hungry Arena contact absorption — final proof

A blob with more than a 5% mass lead now absorbs a smaller unprotected blob on contact. Previously it needed a 30% lead and had to place the target center deep inside itself. Contact uses 90% of the sum of rendered radii. No hold timer was added.

The original 70% mass reward,1.5-second return, two-second spawn protection, mass-dependent speed and match length remain. Mass and score update once in the collision tick. Equal-sized, protected or dead targets cannot be consumed. Controller instructions explain the contact rule. Hungry-only elimination feedback keeps particles and local actor feedback without shaking the canvas.

Final real browser proof used two human controller sessions and normal engine time. Alexandra ate natural food and grew 20→23→26; Morgan had 23. The 13% lead would fail the previous 30% rule. Genuine joystick contact produced 42.1 mass (26+23×0.7), rounded 42 score. Food arrays were identical across that collision. Morgan returned with 20 mass and the original shield, then escaped using the second controller and stayed alive after protection expired. No mass, position or game state was injected.

25 focused checks passed, including single reward, thresholds, protection, return, food identities/phase and actual renderer shake flags; the 6-mode smoke and feel suites also passed. Browser events recorded both score and elimination with shake:false and canvasShaking:false. Syntax checks passed.

Raw capture: /Users/hlebhlyaba/HeyPals/localparty/output/playwright/composition-round3-2026-10-03/hungry-absorption-round9-confirm/report.json; errors[] and changedFiles[]. Browser/server closed. All 20 tracked captured source files still match their hashes.

Frozen simulation: `757b19513d580cfc0c9a6f451ba38030ab6d60666145355947f9a14155bb0704`

Frozen renderer/controller: `35bc84716ff9f3ad02a0015960933bfdd4084b776005f3c8c9f80df77b4cd6f0`

| Individually opened original | SHA256 | Observation |
|---|---|---|
| hungry-2-live-1280.png | a378255828f26f7f7c1a1d10192f84f60a949347ea99c8ec64f8febbe9a56f74 | Both colored bodies and readable20/23 masses; continuous floor; existing join toast transient. |
| hungry-2-live-1920.png | 498ff391f5378e3924eab5d78045bc966c637afbea80b392eb5b6331ef5875b5 | Both complete silhouettes, field/header intact; initial two-player state. |
| hungry-2-grown-1280.png | 317af5e83846f539f5a9fb83877776d1d7fa46692aa3c8b73787b1a7751a7ce1 | Cyan26 versus lime23 after genuine food input; body growth and mass readout visible. |
| hungry-2-grown-1920.png | 035f60b9c03e8b86ff5c58a119202283b2574e40f4392f45f879682d92b18b90 | Same26/23 natural size advantage below old30% requirement; intact colored bodies. |
| hungry-2-absorbed-1920.png | a6b29e570defd0657b4695e80daef0c1aa8c72210c46e002c18c37e1fcb70441 | Victim absent while returning; cyan42 larger; existing CHOMP/actor particles retained, cap legible. |
| hungry-2-absorbed-1280.png | 9cc452d33be19b4a49663e530b00c3111cb84e5f7fda882349a8d43aea73ca0b | Victim absent;42 mass and same continuous food field; localized feedback fades. |
| hungry-2-returned-1280.png | f75dd77ba22a4e6993cac471c70ca2317b17376f56e8afccd75806097b167c07 | Both bodies present and overlapping under actual spawn protection. Existing labels reposition; no visual shield ring is claimed. |
| hungry-2-returned-1920.png | 57bfba3704d882332d2e2e9a1d4812e181e2204c5cc04c6ed1bcbf78fdb1da30 | Cyan42 distinctly larger than returned lime20; both visible, existing labels/leader lines displaced around overlap. |
| hungry-2-escape-1920.png | 15e82351126f8f37f51d7ce2c72af9701e1dfd26bb2b6bc4705d660441a8c94d | Actual victim joystick escape separates lime20 from cyan42; both alive after shield expires. |

Protected return pictures show intentional overlap; the existing renderer does not display a shield halo. These screenshots do not establish whole-game 16-player balance or physical-device validation. Snapshot intervals do not identify the exact collision tick; focused engine tests verify that boundary. The failed observer retry is retained, and all prior art/food captures retain their historical source qualification.

[Exact proof JSON](hungry-absorption-round9-proof.json)

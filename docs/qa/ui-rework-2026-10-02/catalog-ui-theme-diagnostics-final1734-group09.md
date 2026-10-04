# Final catalog material diagnostics — Group 09

Exact final authority: `output/playwright/ui-rework-2026-10-02/final-catalog-1734/report.json` SHA-256 `a78be634948108c1c2e7466eb46c005948c11a8d38234db6f816e6fdd5c53995`. Run 2026-10-02T17:33:13.064Z → 2026-10-02T17:36:19.816Z. 36 games / 72 proofs; errors[] and changedFiles[]. No source/browser writes during review.

All 72 proofs enable the complete adapter and use correct phone/host roles. 30 / 72 sampled surface groups across 22 / 36 games actually show the profile gradient (58 unique painted elements). Complete adapter coverage is not a claim that every game receives a visible material delta. Games without one: western, tanks, chaos, monster, millionaire, crocodile, crane, naval, drawguess, punchmeter, bow_club, curling, bowling, peek_shoot.

Geometry checks match 72 / 72 across 379 measured elements, but Monster TV measures 0 elements and establishes no geometry coverage. 256 sampled feedback records retain disabled/pressed/focus, ink, opacity, transform, filter and outline with 0 non-material differences; 10 background differences are intentional material paint. This does not prove every actual interaction/state or physical touch.

Actual decoration placements: 0. Candidate assets are not claimed shipped visibly here. Kart rail flag is omitted because its corner lies under measured HUD; no row inherits flag art. Accepted sports stations/drawer and owner-protected Jenga TV retain their own materials.

## All 36 actual targets

Counts are matched / visible / marked. Actual gradient columns count unique computed surfaces; a marker alone does not prove paint. Geometry column is phone / TV measured count, all match. Feedback lists phone / TV samples and background-only differences.

| Game / material | Phone targets and omissions | TV targets and omissions | Actual gradients P / TV | Geometry n P / TV | Feedback n P / TV | Qualification |
| --- | --- | --- | --- | --- | --- | --- |
| push — matte arena rubber | `#joystickBase` 1/1/1 | `.party-live-standings .party-standing` 4/4/4 | 1 / 4 | 1 / 5 | 0 / 0; backgroundΔ0 | Existing safe surfaces only; omitted controls/fields retain authored treatment |
| shrink — tidal blue enamel | `#joystickBase` 1/1/1 | `.party-live-standings .party-standing` 4/4/4 | 1 / 4 | 1 / 5 | 0 / 0; backgroundΔ0 | Existing safe surfaces only; omitted controls/fields retain authored treatment |
| knives — dark dojo timber | `.knife-count` 1/1/0 — existing unboxed composition retained<br>`.knife-stats .hp-stat` 2/2/0 — existing unboxed composition retained | `.party-live-standings .party-standing` 4/4/4 | 0 / 4 | 1 / 5 | 1 / 0; backgroundΔ0 | Existing safe surfaces only; omitted controls/fields retain authored treatment |
| bomb — warm hazard casing | `#joystickBase` 1/1/1<br>`.move-stats .hp-stat` 2/2/0 — existing unboxed composition retained | `.party-live-standings .party-standing` 3/3/3 | 1 / 3 | 1 / 4 | 0 / 0; backgroundΔ0 | Existing safe surfaces only; omitted controls/fields retain authored treatment |
| western — sunset leather | `.western-stats .hp-stat` 0/0/0 — authored target absent in current state | `.result-card` 1/0/0 — authored target hidden in current state | 0 / 0 | 1 / 1 | 1 / 0; backgroundΔ0 | No visible adapter paint delta in this sampled state |
| tanks — olive armour | `#controllerScreen .status-card` 1/1/0 — existing unboxed composition retained | `#modeHud` 1/0/0 — authored target hidden in current state | 0 / 0 | 3 / 1 | 3 / 0; backgroundΔ0 | No visible adapter paint delta in this sampled state |
| tankarena — blue gunmetal | `#combatStats` 1/1/0 — existing unboxed composition retained<br>`#joy` 1/1/1 | `.host-rules` 1/0/0 — authored target hidden in current state<br>`#board .person` 0/0/0 — authored target absent in current state | 1 / 0 | 2 / 1 | 2 / 0; backgroundΔ1 | Existing safe surfaces only; omitted controls/fields retain authored treatment |
| chaos — cobalt console | `.roleBadge` 1/0/0 — authored target hidden in current state | `.mission` 1/0/0 — authored target hidden in current state | 0 / 0 | 2 / 1 | 2 / 0; backgroundΔ0 | No visible adapter paint delta in this sampled state |
| kart — charcoal race console | `#driveScreen .slider-card` 1/1/0 — existing unboxed composition retained | `.side-panel .card` 3/1/0 — existing unboxed composition retained<br>`.leader-row` 4/4/4 | 0 / 4 | 5 / 5 | 5 / 0; backgroundΔ0 | tv decor: .side-panel measured host HUD covers candidate corner |
| monster — mint drawing desk | `#toolDock` 1/1/0 — existing unboxed composition retained<br>`#confirmView` 1/0/0 — authored target hidden in current state | `.secret-box` 1/1/0 — existing unboxed composition retained<br>`.status-top` 1/1/0 — existing unboxed composition retained | 0 / 0 | 15 / 0 | 14 / 0; backgroundΔ0 | phone decor: #confirmView no protected clear corner<br>No visible adapter paint delta in this sampled state |
| spy — midnight dossier | `#mySecretMini` 1/1/1<br>`#turnBox` 1/1/0 — existing unboxed composition retained<br>`.sheet-card` 1/0/0 — authored target hidden in current state | `.turn-card` 1/1/0 — existing unboxed composition retained<br>`.roster-card` 1/1/1 | 1 / 0 | 2 / 3 | 1 / 0; backgroundΔ0 | tv: 1 marked surface(s) retain authored/shared backing, not intended gradient |
| millionaire — champagne quiz podium | `.questionMini` 1/1/0 — existing unboxed composition retained<br>`.centerCard` 4/0/0 — authored target hidden in current state | `.questionWrap` 1/1/0 — existing unboxed composition retained<br>`.scoreboard` 1/1/1 | 0 / 0 | 4 / 1 | 4 / 0; backgroundΔ0 | tv: 1 marked surface(s) retain authored/shared backing, not intended gradient<br>No visible adapter paint delta in this sampled state |
| sinyakquiz — royal quiz desk | `.stage.panel` 1/1/0 — existing unboxed composition retained | `.screen-standings` 1/1/1 | 0 / 1 | 4 / 9 | 4 / 4; backgroundΔ0 | Existing safe surfaces only; omitted controls/fields retain authored treatment |
| warsaw — city red enamel | `.stage.panel` 1/1/1 | `.screen-standings` 1/1/1 | 1 / 1 | 5 / 9 | 4 / 4; backgroundΔ0 | Existing safe surfaces only; omitted controls/fields retain authored treatment |
| crocodile — jungle green desk | `#secretPanel` 1/1/0 — authored dark ink on light surface retained | `.screen-standings` 1/1/1 | 0 / 0 | 2 / 5 | 2 / 0; backgroundΔ0 | tv: 1 marked surface(s) retain authored/shared backing, not intended gradient<br>No visible adapter paint delta in this sampled state |
| jenga — dark timber station | `main.phone.jenga-console .jenga-selection` 1/1/1 | `.jenga-turn-panel` 1/1/0 — protected scene, state or control surface<br>`.jenga-host aside` 1/1/0 — protected scene, state or control surface | 1 / 0 | 8 / 1 | 6 / 0; backgroundΔ0 | Existing safe surfaces only; omitted controls/fields retain authored treatment |
| crane — construction steel | `.phone-meters` 1/1/0 — existing unboxed composition retained<br>`.phone-status` 1/1/0 — existing unboxed composition retained | `.panel.scores` 1/1/0 — existing unboxed composition retained<br>`.panel.rules` 1/1/0 — existing unboxed composition retained | 0 / 0 | 3 / 2 | 3 / 0; backgroundΔ0 | No visible adapter paint delta in this sampled state |
| naval — naval bridge enamel | `#own` 1/1/0 — existing unboxed composition retained<br>`#target` 1/1/0 — authored interactive feedback retained | `.naval-console .person` 4/4/0 — existing unboxed composition retained<br>`.naval-console details` 1/1/0 — existing unboxed composition retained | 0 / 0 | 37 / 6 | 37 / 0; backgroundΔ0 | No visible adapter paint delta in this sampled state |
| drawguess — teal artist desk | `#drawingTools` 1/1/0 — existing unboxed composition retained | `.screen-standings` 1/1/1<br>`.screen-sidebar>.panel` 3/2/2 | 0 / 0 | 8 / 7 | 7 / 0; backgroundΔ0 | tv: 2 marked surface(s) retain authored/shared backing, not intended gradient<br>tv decor: .screen-sidebar>.panel no protected clear corner; .screen-sidebar>.panel no protected clear corner; .screen-sidebar>.panel no protected clear corner<br>No visible adapter paint delta in this sampled state |
| western_duel — aged saddle leather | `.glass` 1/1/0 — existing unboxed composition retained | `.glass` 1/1/1 | 0 / 1 | 2 / 2 | 1 / 0; backgroundΔ0 | Existing safe surfaces only; omitted controls/fields retain authored treatment |
| taprace — race timing console | `#arcadeStats` 1/1/1<br>`.punch-sense` 0/0/0 — authored target absent in current state | `.score-panel` 1/1/1 | 1 / 0 | 2 / 2 | 2 / 0; backgroundΔ1 | tv: 1 marked surface(s) retain authored/shared backing, not intended gradient<br>tv decor: .score-panel no protected clear corner |
| punchmeter — boxing gym rubber | `#punchResult` 1/1/0 — existing unboxed composition retained<br>`.punch-sense` 1/0/0 — authored target hidden in current state | `.score-panel` 1/0/0 — authored target hidden in current state | 0 / 0 | 2 / 1 | 2 / 0; backgroundΔ0 | No visible adapter paint delta in this sampled state |
| flappy — sky-blue arcade console | `#arcadeStats` 1/1/1 | `.score-panel` 1/0/0 — authored target hidden in current state | 1 / 0 | 1 / 1 | 1 / 0; backgroundΔ1 | Existing safe surfaces only; omitted controls/fields retain authored treatment |
| hungry — garden arena console | `#joy` 1/1/1<br>`#arcadeStats` 1/1/1 | `.score-panel` 1/0/0 — authored target hidden in current state | 2 / 0 | 2 / 1 | 1 / 0; backgroundΔ1 | Existing safe surfaces only; omitted controls/fields retain authored treatment |
| snakelines — electric circuit enamel | `#joy` 1/1/1<br>`#arcadeStats` 1/1/1 | `.score-panel` 1/0/0 — authored target hidden in current state | 2 / 0 | 2 / 1 | 1 / 0; backgroundΔ1 | Existing safe surfaces only; omitted controls/fields retain authored treatment |
| carryball — court rubber | `#joy` 1/1/1<br>`.arcade-team` 1/1/1<br>`#arcadeStats` 1/1/1 | `.score-panel` 1/0/0 — authored target hidden in current state | 3 / 0 | 4 / 1 | 2 / 0; backgroundΔ1 | Existing safe surfaces only; omitted controls/fields retain authored treatment |
| marble_bloom — cool glass console | `#aimpad` 1/1/1<br>`#marbleControls .marble-ammo` 1/1/0 — existing unboxed composition retained | `.score-chip` 3/3/3 | 1 / 3 | 3 / 7 | 2 / 0; backgroundΔ0 | Existing safe surfaces only; omitted controls/fields retain authored treatment |
| pocket_siege — field equipment | `#tankModule .range-card` 2/2/2<br>`#arsenal .drawer-panel` 1/0/0 — authored target hidden in current state | `.retro-bar` 1/0/0 — authored target hidden in current state | 2 / 0 | 11 / 5 | 9 / 0; backgroundΔ0 | Existing safe surfaces only; omitted controls/fields retain authored treatment |
| bow_club — archery timber console | `.bow-readout` 1/1/0 — existing unboxed composition retained | `.tv-score` 0/0/0 — authored target absent in current state | 0 / 0 | 4 / 2 | 3 / 0; backgroundΔ0 | No visible adapter paint delta in this sampled state |
| poker — deep green felt | `#tabletop #actions button[data-action=fold]` 1/1/1<br>`#tabletop #call` 1/1/1<br>`#tabletop #raise` 1/1/1 | `.seat` 4/4/3 — authored selected, current, folded or disabled state retained | 3 / 3 | 5 / 4 | 4 / 0; backgroundΔ3 | Existing safe surfaces only; omitted controls/fields retain authored treatment |
| airhockey — cool rink equipment | `#tabletop #hockeyJoy` 1/1/1 | `.hockey-last-hitter` 2/1/1 | 1 / 1 | 1 / 2 | 1 / 0; backgroundΔ1 | Existing safe surfaces only; omitted controls/fields retain authored treatment |
| mines — slate survey console | `#tabletop .dpad` 1/1/1 | `#tabletop #players .player` 4/4/4 | 1 / 4 | 6 / 104 | 5 / 100; backgroundΔ0 | Existing safe surfaces only; omitted controls/fields retain authored treatment |
| curling — accepted curling ice | No adapter targets; accepted authored station preserved | `.ss-sheet` 1/0/0 — authored target hidden in current state | 0 / 0 | 5 / 1 | 4 / 0; backgroundΔ0 | phone protected: #ss-score-drawer, #ss-launch-station, #ss-throw-pad, #ss-sweep, .ss-controller-status<br>tv decor: .ss-sheet no protected clear corner<br>tv protected: #ss-score-drawer, #ss-launch-station, #ss-throw-pad, #ss-sweep, .ss-controller-status<br>No visible adapter paint delta in this sampled state |
| bowling — bowling lane equipment | No adapter targets; accepted authored station preserved | `.ss-sheet` 1/0/0 — authored target hidden in current state | 0 / 0 | 5 / 1 | 4 / 0; backgroundΔ0 | phone protected: #ss-score-drawer, #ss-launch-station, #ss-throw-pad, .ss-controller-status<br>tv decor: .ss-sheet no protected clear corner<br>tv protected: #ss-score-drawer, #ss-launch-station, #ss-throw-pad, .ss-controller-status<br>No visible adapter paint delta in this sampled state |
| swarm_gate — garden gate equipment | `.ss-controller-status` 1/1/0 — existing unboxed composition retained<br>`#ss-aim-pad` 1/1/0 — protected scene, state or control surface | `#ss-gate-health` 1/1/1<br>`.ss-sheet` 1/0/0 — authored target hidden in current state | 0 / 1 | 5 / 2 | 5 / 0; backgroundΔ0 | Existing safe surfaces only; omitted controls/fields retain authored treatment |
| peek_shoot — gallery timber equipment | `.ss-controller-status` 1/1/0 — existing unboxed composition retained<br>`#ss-aim-pad` 1/1/0 — protected scene, state or control surface | `.ss-sheet` 1/0/0 — authored target hidden in current state | 0 / 0 | 5 / 1 | 5 / 0; backgroundΔ0 | No visible adapter paint delta in this sampled state |

## Exact72 original references

Original hashes are independently recalculated from saved files. Individual aesthetic review is owned by root/director and assigned critics; this matrix reviews all actual diagnostic records.

- `output/playwright/ui-rework-2026-10-02/final-catalog-1734/push-phone-live-402.png` SHA-256 `fce099891cdca3fb62a1feb43e32d94d61ab72196a2983b6d22d5bc9d875758e`
- `output/playwright/ui-rework-2026-10-02/final-catalog-1734/push-tv-live-1920.png` SHA-256 `410a5a8f3a432fcce93e008477f90057023d33872cb2b2c6533f9d9f2df25609`
- `output/playwright/ui-rework-2026-10-02/final-catalog-1734/shrink-phone-live-402.png` SHA-256 `015226f5a9b0986e7ae977ee554fe77b32267d44456101a6808a9d43b36cd8b3`
- `output/playwright/ui-rework-2026-10-02/final-catalog-1734/shrink-tv-live-1920.png` SHA-256 `1266ce9585cdb9880e6c879c49d8979f19e098acc362ab1079cef8958ccc38ea`
- `output/playwright/ui-rework-2026-10-02/final-catalog-1734/knives-phone-live-402.png` SHA-256 `ea791f36afe76d2a2d239dee00f7ddfc1a633dd72766aab0e53fbc2a56760b00`
- `output/playwright/ui-rework-2026-10-02/final-catalog-1734/knives-tv-live-1920.png` SHA-256 `de26007f9e9ffbd04895d3abe51cb5e0d71ea6303cf0cfce25f80504aec680f4`
- `output/playwright/ui-rework-2026-10-02/final-catalog-1734/bomb-phone-live-402.png` SHA-256 `e499992848a479cca2ab0c391bb8094baa1bd5498626ed04de942aa5e0ace832`
- `output/playwright/ui-rework-2026-10-02/final-catalog-1734/bomb-tv-live-1920.png` SHA-256 `8c51c072e856606a699e1c17d7f3814e43663550997bc28c2a935cb9b757db85`
- `output/playwright/ui-rework-2026-10-02/final-catalog-1734/western-phone-live-402.png` SHA-256 `1076636a30f152800411fd7520c2ada02f688807b1accb94a1c8e4e5441c7066`
- `output/playwright/ui-rework-2026-10-02/final-catalog-1734/western-tv-live-1920.png` SHA-256 `faf664d80e050f1a573716df2aaadeaf99e80c3c1c02db5aca027380eef7b217`
- `output/playwright/ui-rework-2026-10-02/final-catalog-1734/tanks-phone-live-402.png` SHA-256 `030d0366faf09d185a31893998a72617570aeaf60b0f87e099de4a3925963825`
- `output/playwright/ui-rework-2026-10-02/final-catalog-1734/tanks-tv-live-1920.png` SHA-256 `6a6bdf478ff9d762cc77c3e8389b1dab063b94473b3c7e08aab709ea2d47fc0e`
- `output/playwright/ui-rework-2026-10-02/final-catalog-1734/tankarena-phone-live-402.png` SHA-256 `b931cc7395bd3b54800e6837f853b32876e2f8f4ea9c43a6d10f0105c8d174c7`
- `output/playwright/ui-rework-2026-10-02/final-catalog-1734/tankarena-tv-live-1920.png` SHA-256 `8d87a47cf55fc578b1b956064052e3c1d8fb54c3c9b031987c65984c8690f570`
- `output/playwright/ui-rework-2026-10-02/final-catalog-1734/chaos-phone-live-402.png` SHA-256 `30eecc7ef0a430fd2743e9764bd43bc13998cf31be0b8e82d40f402f3430efd9`
- `output/playwright/ui-rework-2026-10-02/final-catalog-1734/chaos-tv-live-1920.png` SHA-256 `0053204e26a8e74c041b38cce597644d18a03956b80beffe38a2d2549cfdc6a0`
- `output/playwright/ui-rework-2026-10-02/final-catalog-1734/kart-phone-live-402.png` SHA-256 `a4b9c0ee8e4ed5ab58eba4874038738a46d9758c409b07a0f64f009900a14c71`
- `output/playwright/ui-rework-2026-10-02/final-catalog-1734/kart-tv-live-1920.png` SHA-256 `f3c1b872b2cbb5659ab41b71ebddacc655d017bcfa72d909e5b148851fbd2d0e`
- `output/playwright/ui-rework-2026-10-02/final-catalog-1734/monster-phone-live-402.png` SHA-256 `faee0971d569e953fe14d60747e194d19124f0eb973172673e6aec9576d84fed`
- `output/playwright/ui-rework-2026-10-02/final-catalog-1734/monster-tv-live-1920.png` SHA-256 `6764565f80377bfdacc59ec9cee16f3b907c9ecf1758371935c73da1a3fbadcd`
- `output/playwright/ui-rework-2026-10-02/final-catalog-1734/spy-phone-live-402.png` SHA-256 `0a7436e55c1a417a9d6e57799a6a06c109095919b96f9021249d1be99d9cbac2`
- `output/playwright/ui-rework-2026-10-02/final-catalog-1734/spy-tv-live-1920.png` SHA-256 `9127fa63f1f269620ecd0f759e4e6f14112e219e0b4b704592a564fd314b4ad3`
- `output/playwright/ui-rework-2026-10-02/final-catalog-1734/millionaire-phone-live-402.png` SHA-256 `37842101de4eddc7fc268940cf53fbe42d006a6180f6c3eb5da2bd3b90036401`
- `output/playwright/ui-rework-2026-10-02/final-catalog-1734/millionaire-tv-live-1920.png` SHA-256 `cae92afc10b852f68b19c8fc90f2efea4eac304fd75746e30e5577e99bfd9fc6`
- `output/playwright/ui-rework-2026-10-02/final-catalog-1734/sinyakquiz-phone-live-402.png` SHA-256 `8457a98e78942d3da98b8ef849ce3d4645057dfc8859c6c59f7d92c7b707be87`
- `output/playwright/ui-rework-2026-10-02/final-catalog-1734/sinyakquiz-tv-live-1920.png` SHA-256 `5f9c576626a129bb29ea0d9a1eafb01553ea0ac46bf3aa41dcce0faf46304ccc`
- `output/playwright/ui-rework-2026-10-02/final-catalog-1734/warsaw-phone-live-402.png` SHA-256 `aee1b9bef42c8bb60e81c8ffc16f5b8e14ce9a2fbd6919adb994fdeac8cf728d`
- `output/playwright/ui-rework-2026-10-02/final-catalog-1734/warsaw-tv-live-1920.png` SHA-256 `4bd85b716c40f287a46b90ba693ec3e768daa3db5c2dfd759855a844c1f64355`
- `output/playwright/ui-rework-2026-10-02/final-catalog-1734/crocodile-phone-live-402.png` SHA-256 `9780a55eabe49c352d5e594543bc9beef029c9589e11d38639c9caa883d92fd8`
- `output/playwright/ui-rework-2026-10-02/final-catalog-1734/crocodile-tv-live-1920.png` SHA-256 `ad5240c85268e6f818bb048e55c70e428afaf9dfe77cdedb5a7e5afa770e9ed3`
- `output/playwright/ui-rework-2026-10-02/final-catalog-1734/jenga-phone-live-402.png` SHA-256 `25b9708b6fab8024f8d7416cf0f1202a92742d829a3c67e8b3cc78e2a0c4354f`
- `output/playwright/ui-rework-2026-10-02/final-catalog-1734/jenga-tv-live-1920.png` SHA-256 `5d1b6886385607f6d3f1fb72616d17232c4de5c5b5a0091e550728f03aac5610`
- `output/playwright/ui-rework-2026-10-02/final-catalog-1734/crane-phone-live-402.png` SHA-256 `b2614c3d9d1050838dae9f847a83ce8795bbdc011d9aeef43df74c89ce037529`
- `output/playwright/ui-rework-2026-10-02/final-catalog-1734/crane-tv-live-1920.png` SHA-256 `adc91efc91b3a477d960008f8524567e5d5dd6716b9f194f5bc117daeb16e5f2`
- `output/playwright/ui-rework-2026-10-02/final-catalog-1734/naval-phone-live-402.png` SHA-256 `90c308c9eba5e66900e5e691cadf47264d434b481e29ca294bd4081a509cde28`
- `output/playwright/ui-rework-2026-10-02/final-catalog-1734/naval-tv-live-1920.png` SHA-256 `acdab20788b31d46119b5960c1794b6688bb04e7a5a4c56c9e64ef3503ac1681`
- `output/playwright/ui-rework-2026-10-02/final-catalog-1734/drawguess-phone-live-402.png` SHA-256 `7d98e3f40400a43a10fed63f0d49a0eece61f52339432cb84330fc805591af47`
- `output/playwright/ui-rework-2026-10-02/final-catalog-1734/drawguess-tv-live-1920.png` SHA-256 `64d3a043c26c998f955c77fdec50d8fc9640ca0a81f5bd0d3c5e65a398b6a1be`
- `output/playwright/ui-rework-2026-10-02/final-catalog-1734/western_duel-phone-live-402.png` SHA-256 `301b4b2397830efa5b24b54ca5dbf7b16a0752e09ca6e281575d52b38115bf88`
- `output/playwright/ui-rework-2026-10-02/final-catalog-1734/western_duel-tv-live-1920.png` SHA-256 `8b8cdcc73e08b516733c8a97260e99ba0c6153ce541ce7c687b254eaa433eea5`
- `output/playwright/ui-rework-2026-10-02/final-catalog-1734/taprace-phone-live-402.png` SHA-256 `f6423e94239b02e070e220d650593e29aef4f472ae5bde8213b31f58cfef452e`
- `output/playwright/ui-rework-2026-10-02/final-catalog-1734/taprace-tv-live-1920.png` SHA-256 `8296f42cca426c81139b198278db25f4c254ecfa0e3eb3181fc6156fb535f22a`
- `output/playwright/ui-rework-2026-10-02/final-catalog-1734/punchmeter-phone-live-402.png` SHA-256 `e1c0936e38c2889b6a2d4e10049f3335a264bcbdb1c3b8d68ae98207f24e1a87`
- `output/playwright/ui-rework-2026-10-02/final-catalog-1734/punchmeter-tv-live-1920.png` SHA-256 `631d142ac1180d2f6be2f9e0daa85a89952ad244179a36d9001856b2566be96d`
- `output/playwright/ui-rework-2026-10-02/final-catalog-1734/flappy-phone-live-402.png` SHA-256 `5e9fe668ee7f0d92579762e2992cf7b2c73919b1745985356c0bddf5ce97ddcf`
- `output/playwright/ui-rework-2026-10-02/final-catalog-1734/flappy-tv-live-1920.png` SHA-256 `070d0c8c08e7f7e8533ad67e4dc702883f654b134d189ba2b4ba978a3453b6e7`
- `output/playwright/ui-rework-2026-10-02/final-catalog-1734/hungry-phone-live-402.png` SHA-256 `0e1562fea5d1b42602d732b1586463e2641f14b24bc6c4f116b005bcd711043c`
- `output/playwright/ui-rework-2026-10-02/final-catalog-1734/hungry-tv-live-1920.png` SHA-256 `e446179d93a816e22df8b8ecf3b1e1968fba9d4116734397a7a0417cb4f6db75`
- `output/playwright/ui-rework-2026-10-02/final-catalog-1734/snakelines-phone-live-402.png` SHA-256 `85755343cd868f6e874e49e686e327f974102573f1c318c8cf8846725f3bea71`
- `output/playwright/ui-rework-2026-10-02/final-catalog-1734/snakelines-tv-live-1920.png` SHA-256 `64ca4258e9ae2d40b867e1ac7187580be11b961311e39a9a369d53d88b00d56f`
- `output/playwright/ui-rework-2026-10-02/final-catalog-1734/carryball-phone-live-402.png` SHA-256 `69fafdcfd0c4a9120b9fc9b37890eb1689d41564ae456b178a17c36d635816b5`
- `output/playwright/ui-rework-2026-10-02/final-catalog-1734/carryball-tv-live-1920.png` SHA-256 `f254b88995cdae2a8e1bb0f0309a9170aaed57c2f1b265669744e75380602656`
- `output/playwright/ui-rework-2026-10-02/final-catalog-1734/marble_bloom-phone-live-402.png` SHA-256 `740a8b8681662fb536b4a131232ddb793dfa878069c0d01a7c864df34b5a85fb`
- `output/playwright/ui-rework-2026-10-02/final-catalog-1734/marble_bloom-tv-live-1920.png` SHA-256 `7700c4f24eaac3b7d916303f8c596b66ac060f88ba6261cb0bdf9e7808b8399b`
- `output/playwright/ui-rework-2026-10-02/final-catalog-1734/pocket_siege-phone-live-402.png` SHA-256 `fa422505d9685a508d76fa199e1ad0c416258d4d94d6bb0163c386992d8720e9`
- `output/playwright/ui-rework-2026-10-02/final-catalog-1734/pocket_siege-tv-live-1920.png` SHA-256 `9c605c5839227719971b0de96b98f5de5933c98026ed3032c0aea1155f66a20d`
- `output/playwright/ui-rework-2026-10-02/final-catalog-1734/bow_club-phone-live-402.png` SHA-256 `5beeb418b0135bcb4df08679f783a452c12f96768818f4873f7dd99c75ff396b`
- `output/playwright/ui-rework-2026-10-02/final-catalog-1734/bow_club-tv-live-1920.png` SHA-256 `7db8b47069e03d66e21ed7129cf02aef1c401b6e101b0dee568964fa7409ade9`
- `output/playwright/ui-rework-2026-10-02/final-catalog-1734/poker-phone-live-402.png` SHA-256 `119550f207a6da7927a451913061c7d7e98998b2f30b2114a0b1a0a022cde6e8`
- `output/playwright/ui-rework-2026-10-02/final-catalog-1734/poker-tv-live-1920.png` SHA-256 `280578ead82b8784961a181b073948b186a797d07d508f423aaa3eba204610d9`
- `output/playwright/ui-rework-2026-10-02/final-catalog-1734/airhockey-phone-live-402.png` SHA-256 `474b8871472049b0696d5ab137552357579cd630bc5bb4b11e71572df342f552`
- `output/playwright/ui-rework-2026-10-02/final-catalog-1734/airhockey-tv-live-1920.png` SHA-256 `8ac4826207585aa4d2a9af3e114ff363ddc05890d43ac441b962f879db010328`
- `output/playwright/ui-rework-2026-10-02/final-catalog-1734/mines-phone-live-402.png` SHA-256 `fb426a673d71e35da5eb24641d3aa6929d213caa898e15a2aa77b755125c5911`
- `output/playwright/ui-rework-2026-10-02/final-catalog-1734/mines-tv-live-1920.png` SHA-256 `158817089b5aab16d2b01fe0bdb05837bdea4d711db46194c10166ffc46e1393`
- `output/playwright/ui-rework-2026-10-02/final-catalog-1734/curling-phone-live-402.png` SHA-256 `56c41b11fd6d7c1b0eeff757d5e1a3d2e57c914ce8338318b8811583ddf673f0`
- `output/playwright/ui-rework-2026-10-02/final-catalog-1734/curling-tv-live-1920.png` SHA-256 `fe42c172b7458de256e2a2cddfbf4ea644a0384aa3141a4babb887f22cd7c9b7`
- `output/playwright/ui-rework-2026-10-02/final-catalog-1734/bowling-phone-live-402.png` SHA-256 `61c27905a4e3f7574f2985e900a90998d28c7391992e80ae1e826e5dce3dcf38`
- `output/playwright/ui-rework-2026-10-02/final-catalog-1734/bowling-tv-live-1920.png` SHA-256 `fd9ddfc7c2e8c60f2d54c9edf21d75645caa844c36673d482c0846e6a3af7a85`
- `output/playwright/ui-rework-2026-10-02/final-catalog-1734/swarm_gate-phone-live-402.png` SHA-256 `128511148001682540202d478d66ce9e4e9c012b5e10971467a0e7688aec91b0`
- `output/playwright/ui-rework-2026-10-02/final-catalog-1734/swarm_gate-tv-live-1920.png` SHA-256 `f1c930c00727d16a8e8950e6005f8aaf9bf4a1ce2f4f5ea4642fe106256a9195`
- `output/playwright/ui-rework-2026-10-02/final-catalog-1734/peek_shoot-phone-live-402.png` SHA-256 `fe5252c205a417846ae8182fc675ef0d60f8406b9f230a4a8ceea965d929277b`
- `output/playwright/ui-rework-2026-10-02/final-catalog-1734/peek_shoot-tv-live-1920.png` SHA-256 `7fd2ae534514c4a32e9c9756cde6279dea5d643f196ad88fbbe7928cef6b3a85`

## Focused corrections and source boundaries

The earlier named Naval health/Minesbot/Marbleglyph/Pocket44px changes have real affected interactions and independently reviewed originals in `new-session-group09-approved-fixes-proof.md` + JSON. Naval320 actualF6tap→miss/reload has all 36 targets 44 px and visible footer;402 cells 58.33 unchanged. Mines actual Open A1→score1/visible1S. Marble actual Swap+aim/ownshots1. Pocket actual 45→142/65→82/Fire→flight;142 degree shell exits left, final PNG is phase evidence. Earlier partial QA failures retained honestly; completed rows are not full-run error-free claims. Reviewer08 independently confirms current 10phone originals; director confirms named TV changes.

Latest Hockey label-only sourceSHA `aafd1eaeb5c561190fadc620cac91ced679dde6db3e580224a8ca58a0fbc222b` is included in final1734. Its separate unpaused 4/8-player TV 1920/1280 live/held proof `group09-fresh/hockey-name-occlusion-confirm/report.json` starts17:31:41.971→17:31:55.477, errors[]/changedFiles[]. All 8 whole originals personally viewed; all name/HUD intersections0, rink1699.984×1019.984 at1920 and1120×672 at1280, physical world 1000×600 unchanged. Actual held player(460,40) gives concrete notch avoidance; original top-right timer-edge bot position did not recur in these 8 frames. Director independent review pending; no blanket named timer-state claim.

Theme CSS SHA-256 `88a36b9642889a3dbf8f6356522f37ba5a0182fe6884868c9bae95e93e539047`; Theme JS SHA-256 `181d3d8a64e2ab474883ba0038c52949993fea31d674f95ef7d36f6b7ba6a850`. Adapter runtime files remain frozen.

## Owner original inspection on final1734

Personally opened all 12 current Naval/Poker/AirHockey/Mines/MarbleBloom/PocketSiege whole TV 1920 / phone 402 originals after generating the matrix; exact SHA references above. No new named correction. Naval health/rank/points axes remain separate and four ocean boards whole; Poker lowered table and separate YOUR CHIPS controls clear; Hockey current rink / names / phone pad whole; Mines B1/B2/B3 and whole 10×10 glyph grid clear (phone ALREADY OPEN is an opened tile state, not cooldown); Marble queue symbols and whole aim field clear; Pocket 44 px hit area, existing instruments and footer fit. These staticfinal frames do not replace the earlier real interaction evidence.

Also independently opened latest Kart TV and Jenga TV: Kart leader rows have no inherited flag and rail corner art omitted; Jenga-specific owner wing material remains intact. This adds 14 original visualinspection to the complete 72-record diagnostic matrix; other catalog aesthetic originals remain root/director/assigned critic responsibility.

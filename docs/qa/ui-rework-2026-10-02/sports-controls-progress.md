# Curling + Bowling dedicated phone rework

User explicitly rejected the former scattered composition and requested a dedicated agent. Earlier group10 approvals do not apply to this replacement.

## Source
- `games/sports_siege/public/index.html`: additional scoped controller stylesheet only.
- `games/sports_siege/public/sports-controls.css`: Curling/Bowling-only whole composition.
- `games/sports_siege/public/controls.js`: sports-only DOM grouping, phase truth, labels and control visibility. Existing gesture power/angle/spin calculation, pointer capture/cancel/release, input payload, bot rules and all physics/render effects unchanged.

## Critical pass 1: composition
Former entire phone original at402 inspected. It exposed hand switching that affects only shooters, duplicated throw instructions, separate identity/status/team/score/helper rows and a disabled sweep action during aim. Replacement establishes compact identity/sound, one match detail + score line, task and one active control station. The current native parent remains responsible for fading header/footer and Pause/Lobby. Own aim gets slider pair plus single gesture instruction. Observer gets no inactive launch controls. Team Curling rolling gets only sweep with actual energy above it. Short-phone captions remain visible rather than hidden by the old blanket span rule. Long Latin/Cyrillic identity can wrap; sound target44px.

## Critical pass 2: actions
Completed real normal-clock native402+320, own/offturn/held/cancel/release/swipe/rolling/reveal/sweep/pause/rejoin. Authoritative state + source hashes recorded by `scripts/qa/sports-controls-real.cjs`; no state/score injection. No hardware verification is claimed.

Automatic: controls and evidence harness syntax passed;56 sports, Curling and Bowling rule/physics tests passed. Fresh browser phase evidence is documented below; physical-device verification remains outstanding.

## Fresh whole-phone evidence and critical second pass

- `sports-controls/curling-final/report.json`:30 fresh originals,5 recorded checks (including3 real action/pause checks), no browser errors, all own/shared hashes stable. Actual cancel keeps current turn token and aim; actual swipe transitions to rolling; rolling removes launch sliders/pad. Real held sweep drains authoritative energy0.991→0.718, and released `.sweeping` becomes false. Normal-clock pause freezes engine; resume/reload retain identity/score.
- `sports-controls/bowling-final/report.json`:22 fresh originals,5 recorded checks (including3 real action/pause checks), no browser errors, own hashes stable. Shared TV-only `tv.js`/`tv-information.css` changed during capture, so those TV screenshots are not canonical. Native phone own aim/offturn/rolling/reveal/402/320 were visually inspected; actual reveal awards9 points and no aim controls remain.
- Director independently inspected all10 named Curling originals and5 Bowling originals. One concrete remaining ambiguity: uncaptioned0% in the gesture surface can be confused with Position/Spin. `Power` now labels the actual existing held value beside the gesture heading. Curling stone art/caption now follows actual own/current team rather than using coral for everyone. The short fresh confirmations below verify these final meaning corrections.

Rejected capture attempts are preserved in `sports-controls/curling/` and `curling-confirm/`: first missed the game's explicit static asset route; second held proof resized320→402 and correctly triggered real release. The fresh final harness registers the stylesheet and does not resize during a held input. No failed attempt is counted as acceptance.


## Final named-power confirmation and source freeze

`curling-power-confirm/report.json` and `bowling-power-confirm/report.json` each passed7 native original screenshots and3 recorded checks (TV/phone capture plus real held/cancel), errors=[], ownerChanged=[], sharedChanged=[]. The fresh `2p-spin-selected-phone-402.png` / `320.png` show named POWER0% beside the gesture heading. `2p-aim-held-phone-402.png` shows actual POWER77% while held; cancel then retains aim/current token. This final POWER change was independently requested by the art director and preserves the existing gesture calculation. Both browsers closed after capture. Personally inspected Curling320/held402 and Bowling320/held402.

Final frozen controls.js SHA256 `4d0991458c259984270d88ed12251ea7686582fa7489e07f2cc06ac2940f8f70`; sports-controls.css `94beab7b6272be7531a108f4ed1dd5476691100ac10d078e40511e755ae4b298`; index.html `f243c8a3030e615789cd17d4cad162cded6749094513cad5e23d1efda6202a76`; static route server.js `b02229c86dd4bbb662b1b64b649e9622aea09b97873e3062085d787abac6b89c`. Full report sourceStart/sourceEnd maps retain the exact shared-source context.

Additional rejected `curling-power-final` / `bowling-power-final` attempts exposed the same QA-only viewport change before held aim. The harness now restores402 before creating the held input. Those failed originals are retained as diagnostics and are not acceptance evidence. Actual input release on viewport change was preserved.

The latest rejected user crop5cf49 is addressed by a recognizable existing-brand control panel, body-role label/guidance, labeled actual values and phase-specific task; geometry alone was not used as approval. No physical iPhone test, commit, build or publish performed. Whole catalog canonical acceptance belongs to root.

Live filesystem comparison after final director review confirmed all4 frozen owned source hashes still match both latest confirmation sourceEnd maps. Exact check counts distinguish capture checks from real input assertions; these reports do not claim3 independent input guards.


## Subsequent narrow shooter second-pass corrections

Group10's final real-action review found English Pulse/MG ability countdowns still using a Cyrillic-looking seconds suffix and the top normalized aim cursor overlapping static AIM/helper text (`group10-fresh/swarm-final-proof/2p-overheated-phone-402.png`, independently viewed). Group10 explicitly returned these two narrow fixes to this controller owner before its final5 capture. Ability labels now choose English/Russian prefix and s/с explicitly. Only the shooter pad indicator Y range starts below the measured static label bottom+24px and ends24px inside its pad; actual normalized aim and network payload remain unchanged. A shooter-only ResizeObserver updates presentation bounds after responsive layout changes. Syntax passed. Final controls.js SHA256 is now `7194b23eba6e31051b831bb86beb9c8f8bd2ad9305875e29e91bc9ca653a2ffd`; the preceding POWER confirmation hash is historical after this shooter-only change. Sports composition/phase/gesture behavior is unchanged. Group10 owns fresh actual cooldown/MG/top-aim confirmation and current final5 capture; no new browser was launched by this owner.


## Explicit user correction: shooter actions above aiming pad

Root relayed a new exact user instruction superseding the previous endpoint arrangement: FIRE/PULSE must precede the aiming input; Peek FIRE/MG must follow the same shared order. Ownership claimed before edit (index.html shooter DOM, style.css controller shooter grid rows only), group10 warned to pause affected phone captures. The actual trigger-row DOM now precedes aimPad; native normal/short grid rows are auto then flexible aim, so controls are visually and structurally in the same order. All input mapping, relative normalized gesture calculation, footer and physics remain unchanged. New index.html hash `92a242b77ca6b8b52b2716d30ba48b1a12229395d17e9acc9bade1a05bc2b3df`; style.css `fa0d091e13d74887b292f9616cc0a4b026c3581cae088b453fccc6e87e9df50b`; controls.js remains `7194b23eba6e31051b831bb86beb9c8f8bd2ad9305875e29e91bc9ca653a2ffd`. Group10 is responsible for real native402/320 aim/heldFire/ready/cooldown final capture in its already granted browser. A fresh original review follows; no fourth browser was started.

Final pre-capture refinement requested by root/group10/director: shooter ability countdown number+localized unit now use a nonbreaking space, while the long ability prefix remains free to wrap at320. Current controls.js SHA256 `8cb081a390c50e7839817b6dfca361bae708cd739fa2870170de0addcec69b24`, syntax passed; current index/style hashes remain92a242…/fa0d091…. Group10 waits for prior browser closure and then loads the new source for affected-shooter proof.


`group10-fresh/shooter-order-final-retry` was independently inspected: new Swarm/Peek action rows above aim fit402/320; top cursor avoids caption; Pulse12s keeps unit together. Peek320 MACHINE GUN active caption overflowed its yellow button despite element-bound checks; ready ACTIVATE also reached past its capsule edge. These exact originals are diagnostics for the one remaining caption issue, not accepted320 evidence. Root authorized exactly one final narrow display fix. At width<=360 active English uses MG with existing nonbreaking number/unit, ready USE MG; Russian compact Пул./Пуск. The full status meter name remains, full402 caption unchanged, no font/input/cooldown modification. controls.js is frozen at `1f2c2d7887dbf16e2ea8bc3a349acce738635c063b02a83ae440da492706c629`, syntax passed. Group10 recaptures affected named native states with unique filenames and this source; current index/style92a242…/fa0d091… retained. No further mutations until final canonical capture.


## Final shooter original verification complete

`group10-fresh/shooter-unique-final/report.json` read independently: passed32 uniquely named original captures,16 recorded checks (capture/layout and real input/ability/pause checks), errors=[], ownerChanged=[], sharedChanged=[]. SourceStart/end use current controls1f2c2d…/index92a242…/stylefa0d091…. Individually opened10 whole native phone originals: Swarm402 idle/Pulse cooldown/overheated; Peek402 ready/active; Swarm320 Pulse12s/held94% overheat; Peek320 ready USE MG, active MG8s and actual top aimMG5s. Both action rows now precede aim, full footer remains; actual indicator clears AIM/helper; kept-together seconds and both320 caption contents are contained. The exact prior active/ready overflow finding is resolved in these originals. Report documents actual hits, friendly penalty,6-hit charge/manual activation, real held overheating, pause and reload. Group10 closed its browser. This owner has no browser/process open and no further source mutation pending. Physical-device input remains unverified; root final stable catalog review remains separate.


## Final end-copy and short-phone art closure

The exact user/director final-end contradiction is corrected with display copy only: actual last Curling end counting/reveal says Waiting for the final result (Ждём итог матча), while intermediate end/stone states keep next-throw wording. The directly inspected theme-pilot320×568 stone/instruction collision is corrected only by short Curling decorative art32px/lower8px inset; station/sliders/gesture geometry remain unchanged.

`output/playwright/ui-rework-2026-10-02/sports-controls/final-end-and-art-proof/report.json` passed at2026-10-02T15:05:35.436Z:7 unique originals, errors=[], ownerChanged=[], sharedChanged=[]. The report records explicit English and actual completed authoritative8/8 end checks, plus assertions/events for real short320 decorative-art clearance and final-end phone sentence. Actual geometry: artTop297, captionBottom288.078125 (8.92px gap), artBottom329, padBottom337, artWidth32. Personally opened corrected short aim original and both402/320 completed-end originals: full footer and truthful final-results sentence are visible. Earlier copy-only final-end proof passed2 originals and closed before the art correction; combined packet is final.

Frozen current controls.js SHA256 `bb379bbd284d76b9937a4ac0ae92216eef930ce201d57c52f7f21ea68f9b237e`; sports-controls.css `a72fe689dd41b11a097ab7720ee3d5a894b307e20ca2433e98ae7101ddf011a9`. Session83965 resumed after user interruption returned exit0/PASS. Harness finally awaited browser.close() and killed its owned server; no owned browser or pending work remains. No additional source edits were made after root final source freeze. Director receives final current originals for independent confirmation; hardware verification remains open.

## Frozen local assembly — 2026-10-02 17:39 UTC

Root SOURCEFREEZE authorized the isolated unsigned generic iOS Simulator LocalParty build. Build succeeded after a first execution-sandbox SwiftUI macro failure; no native source fix was made. Both original failed build.log and successful build-retry.log are retained.

Actual product: `.localparty-build/ui-rework-20261002-local/Build/Products/Debug-iphonesimulator/LocalParty.app`, universal arm64/x86_64, unchanged 0.11.7(98), SDK 27. Both read-only product verifiers passed. 1618 frozen production resources and all 5,351 generated staging/product resources match; catalog exactly 36 current games. 1,624 production files and 697 native/project files have no changed/added/removed entries. Generated ios/LocalParty/Server is the authorized build artifact; production/native user changes remain intact.

Exact manifest, baseline, warnings and verifier outputs: `output/playwright/ui-rework-2026-10-02/local-assembly-1734/report.json`. No browser, app launch/install, App Clip compile, archive, signing/upload, TestFlight or physical-device verification. Root canonical visual acceptance remains separate. Both owned local processes exited; no further source edits.

## Final current-renderer local assembly — 2026-10-03 00:38 UTC

Root SOURCEFREEZE declared one production change after the successful 1734 build: public/game-logo-renderer.js SHA256 741e52abbc7a4dec79ab139c9b5650647710a6fa9ce218e08e7a0c164ce7c2cf. The fresh pre-build baseline confirmed exactly that difference, with every native/project file unchanged.

The same approved unsigned generic iOS Simulator LocalParty command completed incrementally in the existing isolated DerivedData. Both actual-product verifiers passed. All 1,618 frozen runtime production resources and all 5,351 staging/product resources match; generated catalog exactly matches the current 36 games. Production guard (1,624 files) and native guard (697 files) contain no changed/added/removed entries. The final renderer hash is confirmed inside the actual .app. Version remains 0.11.7(98), universal arm64/x86_64, SDK 27.

Current proof: `output/playwright/ui-rework-2026-10-02/local-assembly-final-1003/report.json`, baseline, build.log and both verifier outputs. Historical 1734 proof is retained unchanged. The only incremental warning is skipped AppIntents extraction because no AppIntents.framework is linked. Build and verifier processes exited; no browser, app launch/install, App Clip compile, archive/signing/upload or physical-device test. Root final menu visual proof remains separate from assembly proof.

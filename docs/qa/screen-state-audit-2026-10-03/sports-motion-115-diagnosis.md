# Motion build115 correction evidence

Motion setup UX, native lifecycle observability and layout-only cancellation correction; physical build114 failure root cause not observed on hardware.

Confirmed product defect: every controller resize called release() and discarded selected Motion/sensor access even while visible, playing and unheld. Controlled actual WebKit viewport resize reproduced start(session3,/games/curling/) → cancel(reason=resize) → stop(received0) → Swipe. This is a deliberate geometry trace; it does not prove the original physical114 failure used this event.

Selecting Motion now starts the permission/native request in that trusted tap. Retry motion remains available after failure, Swipe remains the fallback, and copy explicitly says hold the pad → swing phone → release finger. Layout-only resize cancels held neutral and all sweep state/history while retaining mode/sensor permission. Background, hide, pause and orientation safety behavior stays as before.

Native diagnostics log route acceptance, availability/start, first sample, first acknowledged delivery, evaluation error and stop counters. No player identifiers, controller URLs or acceleration/rotation/quaternion values are logged. Read-only PartySportsMotionDiagnostics exposes status/counts/armed gates. Swift retains trusted controller origin + curling/bowling frame restriction and fresh CoreMotion samples.

68 focused tests pass; JS syntax and Swift parse pass. Exact extracted new CoreMotion/WebKit methods typecheck against iOS17 simulator SDK. This is not an app build or real sensor verification.

Accepted 24 exact individually opened originals:14 current-source Curling/browser views +10 Bowling predecessor views qualified solely by the inactive shake reset branch. Current runtime reports have errors[] and sourceDrift[] for six scoped product files. Native callback and browser sensor/permission sources are synthetic; launches, nested controllers, player phases, touch opt-in, viewport resizing, host pause and throw/input tokens use the actual game engine. No physics/camera/scoring changes.

Current Curling320/402 checks prove one request from Motion tap, ready only after fresh sample, setup resize preservation, held resize no throw, active shake resize next wire sweep=false, one subsequent throw/token, orientation/host-pause cancellation, shake activation/stale decay and manual sweep. Browser403 proves permission-dialog blur, missing/stale attitude no shot, truthful Swipe+Retry fallback and Retry button restores one real throw/token.

All raw failures remain in their original folders. The later traced mouse miss had calls[]; touch-tap final runs pass. It is not classified as native transport failure.

Physical115 must still be tried on the phone. Look for native-request accepted → native-start available=true → native-first-sample → native-first-delivery, then hold/release diagnostics and actual throw. Do not claim hardware acceptance from these fixtures.

Exact source/PNG hashes and report paths: [sports-motion-115-diagnosis.json](sports-motion-115-diagnosis.json).

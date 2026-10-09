# Physical device baseline — round247

2026-10-09. The resumed optimization pass starts from clean `main` at `87dd64fa783c3092061ac5a77074839e2fbfb185`, including the accepted round246 changes. Browser prototypes remain separate from this baseline.

## Installed baseline

HeyPals 0.11.7 (148), Release, was built with the iOS27 SDK and installed over build147 on the physical iPhone17Pro without uninstalling the app. CoreDevice inventory confirms148, and the process launch succeeds. Both product/resource verifiers and strict code-signature verification pass. Eleven bundled frontend files match the recorded source hashes; the SDK build includes the accepted native curtain resize/completion changes.

Evidence: `.localparty-build/integration148/` contains source proof, build/install/launch logs, app inventory, resource-verifier results and copied device diagnostics. This is compilation/installation evidence, not popup/casting acceptance.

## Temperature and connection

Before installation, build147's recent idle menu samples were approximately55–58fps with eight CSS animations and `thermal=serious`. Earlier nominal-temperature measurements must not be compared with this window as a version regression or speedup.

The first inspected connection was paired through `localNetwork`. After the user's cable/unlocked/no-cast confirmation, CoreDevice reports `wired`, paired and connected; Instruments lists the iPhone online. Both an all-process Time Profiler recording and a recording attached to the running LocalParty process nevertheless terminate before capture with `Timed out waiting for device to boot: iPhone (27.0)`. A read-only developer-image check reports compatible, usable services. No usable Instruments CPU/GPU trace has been recorded in this pass; this tooling failure does not establish an application CPU bottleneck.

## After-launch observations

Build148's launch window at11:50:24UTC records54.7fps, p95gap22ms and maximum153ms. The next three ten-second menu windows record59.5–60fps, p95gap17ms, with maxima25–75ms. Thermal state remains serious. These are uncontrolled idle/launch aggregates; no user popup workload or separate-TV scene is established for this window.

The standalone workload was requested at12:03:11UTC. The copied journal through12:08 shows menu samples near59.3–59.9fps, p95gap17ms and maxima44–99ms, still at serious thermal state. No completion reply or action-aligned popup interval was established for that copy, so it remains an uncontrolled menu observation rather than an opening/dismissal benchmark.

## Remaining device gates

Repeat the same real Rooms/detail/profile/rename workload first without casting, then with a separate HeyPals receiver scene. Record thermal state, actual output topology, TV viewport/layout coordinates, source/build and frame gaps together. Inspect real opening/dismissal and blur, rather than treating averaged RAF statistics or desktop WebKit films as presented-device performance. Browser candidate promotion requires a new build before its physical comparison.

## Accepted changes in build149

Release0.11.7 build149 was built from the final round247 runtime files and installed over148 without uninstalling the app. CoreDevice reports successful installation and process launch. Both product/resource verifiers pass and strict code-signature verification succeeds with host keychain access; the restricted verifier attempt returned `CSSMERR_TP_NOT_TRUSTED` before the same unchanged product passed outside that restriction. The six changed runtime files match the recorded source hashes: native shell host, Host Pick CSS, Sports server, shared Stage, scene-readiness module and Curling scene. Evidence is saved under `.localparty-build/integration149/`.

This proves the tested code reached the installed app. No matched popup workload or separate-receiver casting measurement of149 is recorded here; the device gates above remain open.

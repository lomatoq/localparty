# Native catalog serialization249

2026-10-09, source baseline `main` at `8bbad774542a14aad4796f3c262d956adf32006f`. Root ran an optimized macOS Foundation proof, reviewed the bounded diff and promoted exactly the accepted candidate in `ios/LocalParty/LocalPartyApp.swift`. This lane prepared the diagnostic and report; root owns app SDK build151, installation and physical measurements.

`PartyWebStore.publish()` encoded all `ServerState`, including its36-game catalog, then encoded and decoded the same live catalog again before constructing the final JSON payload. The change retains the existing catalog dictionary only when the **entire state encode and dictionary extraction succeeded and live catalog is nonempty**. `lastGoodCatalog` still updates in the original order. Nil/empty live state, bundled/saved catalog fallback and failed whole-state encoding still execute the original second catalog encode/decode. A preexisting `value["catalog"]` is not a success criterion: the default body already contains `catalog: []`.

Root’s macOS27.0.1 Foundation run passed all33 dynamically enumerated cases. Full delivered `.sortedKeys` JSON bytes, complete dictionaries, saved catalog, native/QR invalidation sideeffects, Rooms-call count and delivery/ACK state are equal. Successful live states remove exactly one catalog encoder call and one object decode; failed whole-state encoding retains both baseline fallback operations. The matrix covers36-game menu/active states with0/1/4/16 players, old optional metadata, different live/model/saved catalogs, empty/nil catalog fallbacks, NaN activity/TV score and infinite incident timestamps, single-scan retain/reset/network-off, native-surface fallback, readiness/failure/model/in-flight guards, rejected/error/stale replies, repeat-ACK suppression and held-reply latest-state coalescing.

| Foundation value builder | Baseline warm mean, ms | Candidate warm mean, ms | Paired saved mean, ms | Paired bootstrap95% saved interval, ms |
|---|---:|---:|---:|---:|
|36-game menu |2.80022 |1.89091 |0.90931 |0.90082–0.91833 |
|36-game active state,16 players |3.24274 |2.31893 |0.92381 |0.90887–0.93776 |
|Empty live catalog, original fallback control |1.62965 |1.62741 |0.00223 |−0.00648–0.01547 |

Each fixture ran8 balanced ABBA blocks of16 operations per batch,256 warm operations per variant. All8 live-catalog blocks saved time. The unchanged fallback control has no improvement above measured variance. Timed methods are separate uninstrumented source copies through final JSON bytes and UTF8 payload creation; setup, validation, checksums and release are outside the timer. Both timers include the same preallocated retained-output slot assignment. First timed rows follow correctness fixtures and uncontrolled A→B order; they are not cold-start measurements.

This is CPU-side Foundation builder wall elapsed on Mac. The fixture mocks WebKit reply scheduling, QR return values, model commands, Rooms invocation and surface flags to compare the copied full publication contract. It does not measure real WebKit execution, QR graphics, iPhone main-thread latency, GPU time, phone FPS or active separate-TV casting. No UI, blur, effects, art, resolution, AA, shaders, FPS or scheduling change accompanies this diff. Device150/cast evidence was unavailable for this decision; full-app and build151 physical/cast validation remain root gates.

Raw evidence stays in `.localparty-build/perf249/native-catalog/`: `native-catalog249-proof.json`, `summary.json`, `NativeCatalog249Probe.swift`, `source-proof.json`, `static-scope-proof.json`, `catalog-candidate.diff`, `compile.log` and `run.log`. Prepared source-manifest `compiled:false/executed:false` records its generation stage; successful root execution is recorded in the raw result/logs. The original result is preserved. This round required no failed-oracle repair.

Source hashes:

- Baseline complete app source: `c599a4d9b42fdf018ae5cd1a1c7ac41247c3b7946d667d1a70004d23353cfdef`.
- Accepted candidate/current promoted app source: `ec863157443935c221ac2fd9cedf4d0252262b8b085faef3743bde5d8180aeb3`.
- Executed Foundation probe: `343f448a97997a5b621802269b5dd6202459da5b09647d88f13efea1df9c4848`.
- Actual generated and current bundled36-game catalog, exact byte match: `00436232ce505e9901f1c401566ed965dc0da3059a4728aeb82c2787454adbe6`.
- Extracted current Codable declarations: `828b58d8715ba75da3958b7cb7847445c73c3b5acfbe3caa0feeac359563ebf0`; TV declarations: `43da7bca295afc1ecbb96a0261b5fd3adac351d80fff9d2583014fa75fbf5572`.

Portable diagnostic: `scripts/qa/native-catalog-serialization249.py`, `scripts/qa/fixtures/native-catalog249.template.swift`, `scripts/qa/native-catalog249-analyze.py`. Preparation reads actual current Swift types/full publication body and uses the exact `bundle-ios.py` catalog generator. It recognizes only the original/accepted narrow source patterns and fails on unknown extraction instead of guessing. It writes an ignored new output directory, never application source. The tracked preparer regenerated the exact executed probe bytes from the promoted source without compiling or rerunning timings.

```sh
python3 scripts/qa/native-catalog-serialization249.py
```

Compilation/execution are opt-in and require a serialized CPU slot, macOS Swift/CryptoKit and a current prepared native bundle:

```sh
python3 scripts/qa/native-catalog-serialization249.py --run
```

This emits fresh compile/run logs, source hashes, complete proof and balanced summary under `.localparty-build/perf249/native-catalog-repro/`. Baseline/candidate code is extracted from current application source; the template contains fixtures/mocks rather than a second implementation of the publication algorithm. New source/types/catalog versions require fresh evidence.

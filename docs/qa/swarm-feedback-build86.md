# Swarm Gate / Take a Breather — build86

Implemented 2026-09-28: smaller Swarm bullets; matching world-space turret/server ray and pixel aspect aiming; muzzle at measured barrel mouth; complete turret bases in front of wall; depth/stencil ghost silhouettes over wall/gate; rotating kill clouds and background clouds; real-score floating text; Peek target retained until projectile impact, then red scaling pop and explosion.

Verification:41 server/notice tests passed. Actual browser fire: Swarm36shots/17kills, Peek58shots/27kills, no JS errors. Peek212 pre-impact frames retain target. Swarm145 lethal pre-impact samples show projectile. Separate real wall encounter captured at720/1080. Independent art review and root image review passed.

Evidence: `.localparty-build/swarm-feedback-final/`, `.localparty-build/swarm-wall-final/`. Signed iOS0.11.6(86) built, both product verifiers pass, source files match bundled copies. Archive `.localparty-build/LocalParty-0.11.6-86.zip`. Previous85 preserved. Physical installation succeeded on retry. Automatic launch rejected because device is locked; open HeyPals after unlocking. Previous85 archive retained.

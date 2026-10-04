# Physical-device launch observation

Device: installed HeyPals 0.11.7 (112), iPhone 17 Pro. This observation is read-only; no game commands or player registrations were sent.

The application lifecycle log records accepted launches for Bowling at 17:15:06 UTC and Curling at 17:21:23 UTC on 2026-10-03. A second Curling launch was accepted at 17:22:54 UTC. The launch-tap entries show no queued or busy command. Subsequent Curling renderer samples show continuing frames; those samples do not establish that the match left its waiting state. The log does not include sufficient per-player readiness/presence detail to identify the reported failure.

A later anonymous lobby subscription, after the user changed games, observed Pocket Siege playing with two connected players, both game-ready, one display, busy=false, incident=null, and startError=null. No identity credentials were used. The subscription was closed after the initial snapshot.

The historical Curling failure remains unconfirmed. A successful isolated two-human Bowling → stop → Curling transition is separate browser evidence, not a physical-device reproduction. Direct-switch and suspension/reconnect checks are assigned to the launch investigation lane.

The current source corrections and motion-control feature have not been installed on this device.

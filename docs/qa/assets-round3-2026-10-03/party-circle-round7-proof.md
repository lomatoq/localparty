# Party circular fields — Round7 proof

The true playable arenas in **Push, Last Circle and Bomb Tag** now use the existing camera fit multiplied by0.9. World radii, player positions, collision rules and shrinking logic are unchanged. Color Knives' drum is a target/prop and is excluded; Western is unchanged.

Push's odd tilt came from the existing200ms collision squash, which scales horizontal/vertical axes differently. Live sumo sprites now skip this deformation. Flat velocity heading, uniform ghost drop, contact flashes, trails, footprints and names remain. Bomb's existing top-down storage-yard art was inspected and retained; its field now uses a quiet plum radial surface without the fine grid or drifting dots.

One bounded normal-clock actual launcher session used two real browser humans, no bots, actual Ready, joystick pointer drag/release, Pause and Resume. No state/physics/clock injection. The sumo draw path was wrapped for read-only transform measurement.

All eight exact TV originals in `output/playwright/composition-round3-2026-10-03/party-circle-round7-live/` were individually opened:

| Original | Observation |
| --- | --- |
| push-tv-moving-1280.png |Two complete wrestlers, quiet field, clear sand below stairs/above bottom masonry, readable names and rail.|
| push-tv-paused-1280.png |Actual Pause overlay; frozen two-player pose and readable pause/readout.|
| push-tv-paused-resize-1920.png |Same paused state after resize; aligned stairs and clear top/bottom gap.|
| push-tv-resumed-1920.png |Two approaching wrestlers retain natural aspect/flat rotation; names clear above/below, field separated from rail.|
| bomb-tv-live-1280.png |Fine grid/dots absent; real holder bomb/fuse/glow, obstacles, names and yard remain readable.|
| bomb-tv-live-1920.png |Quiet plum field, complete holder/actors, yard clearance and separate readable rail.|
| shrink-tv-live-1280.png |Reduced playable circle fits inside cyan chamber/door; original actors and Last Circle texture retained.|
| shrink-tv-live-1920.png |Shrinking circle still fits chamber edges; names, actors and rail remain clear.|

Push/Bomb outer circle bounds are60.3–659.7px at720p and90.45–989.55px at1080p, exactly90% of the prior requested circle diameter. Push entry/arena centres stay492px and772px,0px offset, with covered background edges. Last Circle uses the same0.9 factor while its authoritative radius changes normally. All captured player/holder boxes fit the actual receiver. Name paint boxes show unchanged14px type at720p and21px at1080p.

Actual sumo paint matrices have uniform-scale error0 and orthogonality error approximately0. The source-function preflight separately confirms live Push bypasses collision squash, ghosts retain existing fall, and other disc modes retain their transform. Joystick release returns0/0; paused engine positions/timer remain equal through resize and resume works.

Capture finished2026-10-03T15:27:48.022Z with errors[]/changedFiles[] across29 frozen dependencies. Syntax, Party action regressions and visual-clock checks pass. Browser/server closed; Slot2 released. Host.js frozen `39744592a1284e695bcaca00cc210264327bbdbf7ce0fa98c4934e96165dee36`; HTML unchanged `f898a0d247704ad78afbb8a15f62ec082e7c6bb9efab61f6cee2fb62012b93b6`.

This packet covers current two-player poses and input; it does not assert every16-player/rim pose. Existing native arms extend slightly beyond the collision disc, with no observed crop. No phone screenshots, physical-device validation or build. Exact hashes, per-image observations and metrics are in adjacent JSON. Previous packets are preserved as historical evidence.

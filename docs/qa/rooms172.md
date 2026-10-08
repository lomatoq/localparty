# Rooms inline rename — 172

Implemented in nearby-rooms.js + rooms-inline172.css. Your room discloses a downward editor with the existing dark-violet capsule input and shared gradient glyph adapter; round check saves through the trusted native bridge. Success is not shown until Swift acknowledges persisted UserDefaults. Timeout/validation failure keeps draft visible. Periodic discovery preserves active draft/focus. Bonjour metadata uses the persisted name, and own row displays the same name.

Room names use Kardia Fit Runner italic and a pale colored gradient; row surfaces carry restrained deterministic violet/pink tints. Only save/join actions are lime. Editor uses reversible 240ms grid-height transition (accordion exception) and 180ms opacity; reduced motion removes height interpolation. No perpetual animation, filter animation, library or new blur layer added.

Validation:
- Swift frontend parse passed NearbyRooms.swift + LocalPartyApp.swift. This is not a full iOS build.
- Real compiled Bonjour test passed discovery, metadata update/removal, URL rejection and background cleanup; added persistence/name normalization/invalid name checks pass. Initial sandbox run failed discovery; unrestricted local-network run passed.
- Chromium and WebKit real controller route + injected native bridge fixture passed at 320×740 and 393×852: rename open/save, pending ack, draft preservation through discovery refresh, rapid reversal, no horizontal overflow, reachable footer. Screenshots/video: output/playwright/rooms172.
- Inspected Chrome 320 editing and WebKit 393 editing. Chrome material blur renders correctly; desktop WebKit's known unsupported blur behavior is not iPhone acceptance.
- Native persistence code is real; browser bridge acknowledgements are fixtures, not proof of a two-device rename propagation or real iPhone interaction.

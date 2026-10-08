# Online rooms: agreed product behavior and future service

User request, 2026-10-07: players in different homes join one six-digit room.
Each home casts its own display to its TV; every display renders the SAME match,
with shared participants, game state and results. Each phone controls its own
player. Joining must switch both the controller and the external TV session.
Do not treat the current controller-only LAN join as completed online support.

## Implemented client preparation

- Persistent circular room entry in the native menu and embedded controller.
- Existing LAN discovery, join and own-room rename are reused.
- Nearby / By code tabs; six numeric inputs, forward typing, backward deletion,
  full-code paste, labels, incomplete-code validation.
- Own online room area, create/copy code controls and connection/error states.
- `LocalPartyRooms.configureOnline(service)` accepts a trusted injected adapter:
  `create(): Promise<{code: string}>`, `join(code): Promise<void>`.
  The latter must resolve only AFTER controller AND external display attach to
  the same authoritative session. Rejection codes ROOM_NOT_FOUND and ROOM_FULL
  have dedicated messages. Duplicate submits are suppressed. Changing the
  adapter invalidates pending UI completions.
- No adapter is configured in production. No fake code is generated and no
  UI success is claimed without a successful adapter operation.

## Required future implementation (not yet implemented/deployed)

The host phone can remain authoritative. Internet reachability still needs a
public rendezvous service and NAT traversal. Direct P2P is not reliable across
all routers/CGNAT; use STUN and TURN fallback if adopting WebRTC data channels.
Current HTTP/WebSocket and game Socket.IO transports cannot be replaced merely
by resolving a code to a LAN address. A reverse relay preserving existing
transports is another candidate; evaluate bandwidth/latency and all 36 games.

Public service owns six-digit allocation, uniqueness, expiry and room lookup;
join attempts need throttling, host admission and unguessable session tokens.
The six digits are a lookup code, never a host/admin credential. No local admin
API or token may be published. Codes expire on room close; disconnect/rejoin
must preserve identity and avoid duplicate players. A guest TV gets a read-only
session credential, not host controls. Do not expose arbitrary URL navigation.

Native integration must switch remote controller and AirPlay display together,
restore both to the local room on leave, handle host disappearance/backgrounding,
and respect the chosen transport's lifecycle. Online guests do not start their
own independent authoritative match. Every TV renders the host's shared state;
render timestamps may differ with network latency, so do not promise frame lock.

## Acceptance before enabling real internet play

Two physical phones on different networks (including CGNAT/cellular), two TV
outputs; shared state/game start/results, independent controls, joins/rejoins,
full/expired/not-found codes, interrupted creation, host departure, Wi-Fi changes,
background/foreground, latency/jitter, permissions and catalog-wide transport QA.
Browser fixture tests validate UI only. They do not validate internet/AirPlay.

Reference: https://webrtc.org/getting-started/peer-connections

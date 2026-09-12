# Wi‑Fi Kart Party

Local multiplayer kart racer: the computer is the authoritative game server + shared race screen; each phone becomes a steering wheel + gas pedal after scanning a QR code.

## Fast start — Windows

1. Put the folder anywhere on the host PC.
2. Double-click `START_WINDOWS.bat`.
3. The first launch creates `.venv` and installs two small Python packages.
4. If Windows Firewall asks, allow Python on **Private networks**.
5. The host screen opens automatically at `http://localhost:8765/`.
6. Put all phones on the same Wi‑Fi, scan the QR code, enter a driver name, choose **left-hand** or **right-hand** controls.
7. Set lap count and press **START** on the computer.

Python 3.10+ is recommended.

## macOS

Double-click / run `START_MAC.command` (you may need to allow it once in System Settings), or run:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python server.py
```

## What is included

- 2 → many local players over Wi‑Fi/LAN.
- QR join link generated from the computer's current LAN address.
- Server-authoritative 60 Hz kart physics; 20 Hz network snapshots.
- Phone controls: touch steering wheel + gas pedal.
- Left-handed / right-handed layout toggle, even during the race.
- 10 laps by default; host can set 1–99 before starting.
- Live position board, current race time, lap, speed, best lap, finish order.
- Off-road slowdown, soft recovery, kart-to-kart bumps, three boost pads.
- 3-second start countdown and 30-second finishing window after the first racer finishes.
- No internet is required **while playing**. Internet is only needed on first launch if `aiohttp` / `qrcode` are not already installed.

## Network troubleshooting

- Phones must be on the same normal Wi‑Fi/LAN as the PC. Guest Wi‑Fi often blocks device-to-device traffic.
- Allow Python through Windows Firewall on Private networks.
- If the QR opens nothing, compare the printed `Phones:` address in the terminal with the PC's actual LAN IPv4 address.
- VPNs can confuse LAN-IP detection; disable the VPN or open `http://YOUR_PC_IPV4:8765/controller` manually.
- Port can be changed with environment variable `KART_PORT`.

## Controls

- **Wheel**: drag/hold left-right anywhere inside the wheel area.
- **Gas**: hold the green pedal.
- Release gas to coast/brake naturally.
- Touching grass/off-road cuts top speed heavily; the game softly pulls totally lost cars back toward the circuit.

## Files

- `server.py` — game server, race state, physics, WebSockets, QR endpoint.
- `static/host.html` + `host.js` — shared big-screen race view.
- `static/controller.html` + `controller.js` — phone UI and touch controls.
- `static/styles.css` — all UI styling.

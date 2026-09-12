# LOCAL PARTY PACK — PUSH PIT + COLOR KNIVES

Two local Wi-Fi party games. The computer is the shared arena screen. Every phone becomes a controller after scanning one QR code. No app install and no npm install are required.

## Run

1. Put the computer and all phones on the same Wi-Fi.
2. Windows: double-click `start-windows.bat`.
   macOS: double-click `start-mac.command` (allow it in Privacy/Security if macOS asks).
   Linux: run `./start-linux.sh`.
3. The computer opens `http://localhost:3000/host`.
4. Scan the QR on the host screen with every phone.
5. Enter a name. Dasha/Dasha-like names default to the left-handed joystick layout; it can also be changed manually.
6. Pick 5–10 rounds and start a game from the computer.

## Game 1 — PUSH PIT

- Round arena is circular.
- 3…2…1…GO countdown.
- Use the phone joystick to accelerate in any direction.
- Players have inertia and physically shove each other.
- Leaving the ring eliminates you for the round.
- The arena shrinks during the round so rounds cannot stall forever.
- Last player in wins the round. After the selected number of rounds, most round wins takes the match.

## Game 2 — COLOR KNIVES

- Every player has a unique color and a fixed launcher around the rotating drum.
- Each round creates a new set of sectors with different sizes.
- Tap THROW to launch a knife toward the drum.
- Your color: +2. Another player's color: -1. Gray: 0. Black danger sector: -2.
- Hitting too close to an already stuck knife causes CLANG and -1.
- Rotation speed and direction change by round; later rounds have smaller sectors and more knives.
- Highest total score after all rounds wins.

## Notes

- The server is authoritative: phones only send input, so clients do not drift apart.
- Players can reconnect using the token stored in their phone browser.
- Players joining mid-match enter on the next round.
- Uses a tiny built-in WebSocket server and offline QR generator; only Node.js is required.
- Default port is 3000. Override with `PORT=xxxx node server.js`.

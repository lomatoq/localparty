# LOCAL PARTY PACK v1.1

Four local Wi-Fi party games. The computer is the shared screen; every phone becomes a controller after scanning one QR code. No app install and no `npm install` are required.

## Run

1. Put the computer and phones on the same Wi-Fi.
2. Windows: double-click `start-windows.bat`.
   macOS: double-click `start-mac.command`.
   Linux: run `./start-linux.sh`.
3. The computer opens `http://localhost:3000/host`.
4. Scan the QR with every phone, enter a name, then choose 5–10 rounds on the computer.
5. The same phone session works for every game. Dasha/Dasha-like names default to the left-handed joystick layout; handedness can also be changed manually.

## Games

### PUSH PIT
Use the phone joystick. Players have inertia and physically shove each other. Leaving the shrinking circular arena eliminates you. Last player in wins the round.

### COLOR KNIVES
Each player has a color. Tap THROW to launch knives at a rotating segmented drum. Your color = +2, another player = -1, black danger = -2, gray = 0. Hitting too close to an existing knife gives CLANG -1.

### BOMB TAG
Use the joystick. One surviving player has a bomb with a hidden random timer. Touch another player to pass it. A short anti-ping-pong lock prevents instant passing straight back. The bomb carrier gets a small speed advantage. When it explodes, only the carrier is eliminated; after a short pause a new bomb is armed on one of the survivors. Last surviving player wins the round.

### ONE SHOT WESTERN
Everyone watches the computer screen and has one huge FIRE button on the phone. After the countdown the game shows random fake cues such as BELL!, CROW!, WIND!, DOOR!, FLASH!, etc. Shooting before the real `DRAW!` is a false start and eliminates you from the round. After `DRAW!`, the server records reaction time in milliseconds; fastest valid shot wins the round. Match standings use round wins, then reaction time, then false starts.

## Notes

- One QR / one local server for all games.
- Server-authoritative game state and physics.
- Reconnect token stored in the phone browser.
- Players joining mid-match become fully active on the next round.
- Offline QR generator and dependency-free WebSocket server included.
- Requires Node.js 18+ only.
- Default port: 3000. Override with `PORT=xxxx node server.js`.

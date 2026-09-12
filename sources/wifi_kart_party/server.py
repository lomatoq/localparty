#!/usr/bin/env python3
import asyncio
import json
import math
import os
import socket
import time
import uuid
import webbrowser
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, Optional

from aiohttp import web, WSMsgType
import qrcode

ROOT = Path(__file__).resolve().parent
STATIC = ROOT / "static"
HOST = "0.0.0.0"
PORT = int(os.environ.get("KART_PORT", "8765"))

TRACK = {
    "width": 1600,
    "height": 900,
    "cx": 800.0,
    "cy": 450.0,
    "outer_rx": 730.0,
    "outer_ry": 380.0,
    "inner_rx": 430.0,
    "inner_ry": 170.0,
    "mid_rx": 580.0,
    "mid_ry": 275.0,
}
CHECKPOINTS = 12
COLORS = [
    "#FF5C8A", "#4CC9F0", "#FFD166", "#7AE582", "#B388FF", "#FF9F1C",
    "#00D4AA", "#F72585", "#90BE6D", "#43AA8B", "#577590", "#F94144",
]


def clamp(v, lo, hi):
    return max(lo, min(hi, v))


def wrap_angle(a):
    while a <= -math.pi:
        a += math.tau
    while a > math.pi:
        a -= math.tau
    return a


def norm_angle(a):
    a %= math.tau
    return a if a >= 0 else a + math.tau


def get_lan_ip() -> str:
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.settimeout(0.2)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        try:
            return socket.gethostbyname(socket.gethostname())
        except Exception:
            return "127.0.0.1"


@dataclass
class Player:
    id: str
    name: str
    color: str
    handedness: str = "right"
    x: float = 800.0
    y: float = 450.0
    angle: float = math.pi / 2
    speed: float = 0.0
    steer: float = 0.0
    throttle: float = 0.0
    connected: bool = True
    joined_at: float = field(default_factory=time.monotonic)
    last_input_at: float = field(default_factory=time.monotonic)
    next_cp: int = 0
    laps_completed: int = 0
    lap_started_at: float = 0.0
    best_lap: Optional[float] = None
    last_lap: Optional[float] = None
    finish_time: Optional[float] = None
    finish_order: Optional[int] = None
    boost_cooldown: float = 0.0
    offroad: bool = False
    in_race: bool = True

    def reset_for_race(self, idx: int, race_start: float):
        row = idx // 2
        lane = idx % 2
        theta = -0.07 - row * 0.055
        lane_shift = -24 if lane == 0 else 24
        self.x = TRACK["cx"] + (TRACK["mid_rx"] + lane_shift) * math.cos(theta)
        self.y = TRACK["cy"] + (TRACK["mid_ry"] + lane_shift * 0.45) * math.sin(theta)
        self.angle = math.pi / 2 + theta
        self.speed = 0.0
        self.steer = 0.0
        self.throttle = 0.0
        self.next_cp = 0
        self.laps_completed = 0
        self.lap_started_at = race_start
        self.best_lap = None
        self.last_lap = None
        self.finish_time = None
        self.finish_order = None
        self.boost_cooldown = 0.0
        self.offroad = False
        self.in_race = True


class Game:
    def __init__(self):
        self.players: Dict[str, Player] = {}
        self.websockets = set()
        self.status = "lobby"  # lobby, countdown, racing, results
        self.laps = 10
        self.countdown_started = None
        self.race_started = None
        self.first_finish_at = None
        self.finish_counter = 0
        self.tick = 0

    def public_state(self):
        now = time.monotonic()
        if self.status == "countdown" and self.countdown_started is not None:
            countdown = max(0.0, 3.0 - (now - self.countdown_started))
        else:
            countdown = 0.0
        race_time = 0.0
        if self.race_started is not None and self.status in ("racing", "results"):
            race_time = max(0.0, now - self.race_started)

        ranking = self.rank_players()
        rank_map = {p.id: i + 1 for i, p in enumerate(ranking)}
        players = []
        for p in self.players.values():
            players.append({
                "id": p.id,
                "name": p.name,
                "color": p.color,
                "x": round(p.x, 2),
                "y": round(p.y, 2),
                "angle": round(p.angle, 4),
                "speed": round(p.speed, 2),
                "connected": p.connected,
                "lap": p.laps_completed,
                "next_cp": p.next_cp,
                "best_lap": p.best_lap,
                "last_lap": p.last_lap,
                "finish_time": p.finish_time,
                "finish_order": p.finish_order,
                "position": rank_map.get(p.id),
                "offroad": p.offroad,
                "in_race": p.in_race,
            })
        return {
            "type": "state",
            "status": self.status,
            "laps": self.laps,
            "countdown": countdown,
            "race_time": race_time,
            "tick": self.tick,
            "players": players,
            "track": TRACK,
            "checkpoint_count": CHECKPOINTS,
        }

    def rank_players(self):
        plist = [p for p in self.players.values() if p.connected and p.in_race]
        def key(p: Player):
            if p.finish_order is not None:
                return (2, -p.finish_order, 0.0)
            theta = norm_angle(math.atan2((p.y - TRACK["cy"]) / TRACK["mid_ry"], (p.x - TRACK["cx"]) / TRACK["mid_rx"]))
            target_cp = (p.next_cp + 1) % CHECKPOINTS
            progress = p.laps_completed * CHECKPOINTS + p.next_cp + theta / math.tau
            return (1, progress, p.speed)
        return sorted(plist, key=key, reverse=True)

    def add_player(self, name: str, handedness: str):
        pid = uuid.uuid4().hex[:10]
        color = COLORS[len(self.players) % len(COLORS)]
        p = Player(id=pid, name=(name.strip() or f"Driver {len(self.players)+1}")[:18], color=color,
                   handedness=handedness if handedness in ("left", "right") else "right")
        self.players[pid] = p
        if self.status == "lobby":
            p.reset_for_race(len(self.players) - 1, time.monotonic())
        else:
            p.in_race = False
        return p

    def start_race(self):
        active = [p for p in self.players.values() if p.connected]
        if not active:
            return False
        self.status = "countdown"
        self.countdown_started = time.monotonic()
        self.race_started = None
        self.first_finish_at = None
        self.finish_counter = 0
        for idx, p in enumerate(active):
            p.reset_for_race(idx, self.countdown_started + 3.0)
        return True

    def reset_lobby(self):
        # Remove abandoned controllers when returning to the lobby; a refreshed phone
        # can still resume while a race is running.
        self.players = {pid: p for pid, p in self.players.items() if p.connected}
        self.status = "lobby"
        self.countdown_started = None
        self.race_started = None
        self.first_finish_at = None
        self.finish_counter = 0
        for idx, p in enumerate(self.players.values()):
            p.reset_for_race(idx, time.monotonic())

    def physics_step(self, dt: float):
        self.tick += 1
        now = time.monotonic()
        if self.status == "countdown" and self.countdown_started is not None:
            if now - self.countdown_started >= 3.0:
                self.status = "racing"
                self.race_started = now
                for p in self.players.values():
                    p.lap_started_at = now
            return
        if self.status != "racing":
            return

        for p in self.players.values():
            if not p.in_race:
                continue
            if p.finish_time is not None or not p.connected:
                p.throttle = 0.0
            self.update_player(p, dt, now)

        self.resolve_car_collisions()

        active = [p for p in self.players.values() if p.connected and p.in_race]
        if active and all(p.finish_time is not None for p in active):
            self.status = "results"
        elif self.first_finish_at is not None and now - self.first_finish_at > 30.0:
            self.status = "results"

    def update_player(self, p: Player, dt: float, now: float):
        outer = math.sqrt(((p.x - TRACK["cx"]) / TRACK["outer_rx"])**2 + ((p.y - TRACK["cy"]) / TRACK["outer_ry"])**2)
        inner = math.sqrt(((p.x - TRACK["cx"]) / TRACK["inner_rx"])**2 + ((p.y - TRACK["cy"]) / TRACK["inner_ry"])**2)
        p.offroad = outer > 1.0 or inner < 1.0

        accel = 360.0 if not p.offroad else 145.0
        max_speed = 480.0 if not p.offroad else 220.0
        drag = 0.985 if p.throttle > 0 else 0.972

        p.speed += accel * clamp(p.throttle, 0.0, 1.0) * dt
        p.speed *= drag ** (dt * 60.0)
        p.speed = clamp(p.speed, -40.0, max_speed)

        speed_factor = clamp(abs(p.speed) / 220.0, 0.12, 1.0)
        steer_rate = 2.25 * speed_factor
        p.angle += clamp(p.steer, -1.0, 1.0) * steer_rate * dt * (1 if p.speed >= 0 else -1)

        p.x += math.cos(p.angle) * p.speed * dt
        p.y += math.sin(p.angle) * p.speed * dt

        # Soft recovery if a player gets deeply outside the circuit.
        outer2 = math.sqrt(((p.x - TRACK["cx"]) / TRACK["outer_rx"])**2 + ((p.y - TRACK["cy"]) / TRACK["outer_ry"])**2)
        inner2 = math.sqrt(((p.x - TRACK["cx"]) / TRACK["inner_rx"])**2 + ((p.y - TRACK["cy"]) / TRACK["inner_ry"])**2)
        if outer2 > 1.10 or inner2 < 0.88:
            theta = math.atan2((p.y - TRACK["cy"]) / TRACK["mid_ry"], (p.x - TRACK["cx"]) / TRACK["mid_rx"])
            tx = TRACK["cx"] + TRACK["mid_rx"] * math.cos(theta)
            ty = TRACK["cy"] + TRACK["mid_ry"] * math.sin(theta)
            p.x += (tx - p.x) * min(1.0, dt * 2.2)
            p.y += (ty - p.y) * min(1.0, dt * 2.2)
            p.speed *= 0.965

        # Boost pads: three short zones centered on the racing line.
        theta = norm_angle(math.atan2((p.y - TRACK["cy"]) / TRACK["mid_ry"], (p.x - TRACK["cx"]) / TRACK["mid_rx"]))
        radial = math.sqrt(((p.x - TRACK["cx"]) / TRACK["mid_rx"])**2 + ((p.y - TRACK["cy"]) / TRACK["mid_ry"])**2)
        if p.boost_cooldown > 0:
            p.boost_cooldown -= dt
        else:
            for ba in (1.18, 3.15, 5.20):
                if abs(wrap_angle(theta - ba)) < 0.08 and abs(radial - 1.0) < 0.16:
                    p.speed = min(560.0, p.speed + 115.0)
                    p.boost_cooldown = 1.25
                    break

        self.update_checkpoints(p, theta, now)

    def update_checkpoints(self, p: Player, theta: float, now: float):
        if p.finish_time is not None:
            return
        target_angle = math.tau * ((p.next_cp + 1) / CHECKPOINTS)
        if target_angle >= math.tau - 1e-6:
            target_angle = 0.0
        if abs(wrap_angle(theta - target_angle)) < 0.11:
            radial = math.sqrt(((p.x - TRACK["cx"]) / TRACK["mid_rx"])**2 + ((p.y - TRACK["cy"]) / TRACK["mid_ry"])**2)
            if 0.68 < radial < 1.30:
                p.next_cp += 1
                if p.next_cp >= CHECKPOINTS:
                    p.next_cp = 0
                    p.laps_completed += 1
                    lap_time = max(0.0, now - p.lap_started_at)
                    p.last_lap = lap_time
                    p.best_lap = lap_time if p.best_lap is None else min(p.best_lap, lap_time)
                    p.lap_started_at = now
                    if p.laps_completed >= self.laps:
                        p.finish_time = max(0.0, now - (self.race_started or now))
                        self.finish_counter += 1
                        p.finish_order = self.finish_counter
                        p.speed *= 0.5
                        if self.first_finish_at is None:
                            self.first_finish_at = now

    def resolve_car_collisions(self):
        cars = [p for p in self.players.values() if p.connected]
        min_d = 28.0
        for i in range(len(cars)):
            for j in range(i + 1, len(cars)):
                a, b = cars[i], cars[j]
                dx, dy = b.x - a.x, b.y - a.y
                d2 = dx*dx + dy*dy
                if 0.0001 < d2 < min_d * min_d:
                    d = math.sqrt(d2)
                    nx, ny = dx/d, dy/d
                    overlap = (min_d - d) * 0.5
                    a.x -= nx * overlap
                    a.y -= ny * overlap
                    b.x += nx * overlap
                    b.y += ny * overlap
                    a.speed *= 0.94
                    b.speed *= 0.94


game = Game()


async def index(request):
    return web.FileResponse(STATIC / "host.html")


async def controller(request):
    return web.FileResponse(STATIC / "controller.html")


async def api_info(request):
    ip = get_lan_ip()
    return web.json_response({
        "lan_ip": ip,
        "port": PORT,
        "join_url": f"http://{ip}:{PORT}/controller",
        "host_url": f"http://{ip}:{PORT}/",
    })


async def qr_png(request):
    ip = get_lan_ip()
    url = f"http://{ip}:{PORT}/controller"
    qr = qrcode.QRCode(version=None, error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=8, border=2)
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    import io
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return web.Response(body=buf.getvalue(), content_type="image/png", headers={"Cache-Control": "no-store"})


async def ws_handler(request):
    ws = web.WebSocketResponse(heartbeat=20)
    await ws.prepare(request)
    game.websockets.add(ws)
    bound_player = None
    try:
        await ws.send_json(game.public_state())
        async for msg in ws:
            if msg.type != WSMsgType.TEXT:
                continue
            try:
                data = json.loads(msg.data)
            except json.JSONDecodeError:
                continue
            typ = data.get("type")
            if typ == "join":
                p = game.add_player(str(data.get("name", "Driver")), str(data.get("handedness", "right")))
                bound_player = p.id
                await ws.send_json({"type": "joined", "player_id": p.id, "name": p.name, "color": p.color})
                await broadcast_now()
            elif typ == "resume":
                pid = str(data.get("player_id", ""))
                if pid in game.players:
                    p = game.players[pid]
                    p.connected = True
                    bound_player = pid
                    await ws.send_json({"type": "joined", "player_id": p.id, "name": p.name, "color": p.color})
            elif typ == "input":
                pid = bound_player or str(data.get("player_id", ""))
                p = game.players.get(pid)
                if p:
                    p.steer = clamp(float(data.get("steer", 0.0)), -1.0, 1.0)
                    p.throttle = clamp(float(data.get("throttle", 0.0)), 0.0, 1.0)
                    p.last_input_at = time.monotonic()
            elif typ == "set_hand":
                pid = bound_player or str(data.get("player_id", ""))
                p = game.players.get(pid)
                if p:
                    hand = str(data.get("handedness", "right"))
                    p.handedness = hand if hand in ("left", "right") else "right"
            elif typ == "host_start":
                game.start_race()
                await broadcast_now()
            elif typ == "host_reset":
                game.reset_lobby()
                await broadcast_now()
            elif typ == "host_set_laps":
                if game.status == "lobby":
                    game.laps = int(clamp(int(data.get("laps", 10)), 1, 99))
                    await broadcast_now()
    finally:
        game.websockets.discard(ws)
        if bound_player and bound_player in game.players:
            game.players[bound_player].connected = False
            game.players[bound_player].throttle = 0.0
            game.players[bound_player].steer = 0.0
    return ws


async def broadcast_now():
    if not game.websockets:
        return
    payload = json.dumps(game.public_state(), separators=(",", ":"))
    dead = []
    for ws in tuple(game.websockets):
        try:
            await ws.send_str(payload)
        except Exception:
            dead.append(ws)
    for ws in dead:
        game.websockets.discard(ws)


async def game_loop(app):
    last = time.monotonic()
    accumulator = 0.0
    physics_dt = 1.0 / 60.0
    broadcast_acc = 0.0
    try:
        while True:
            now = time.monotonic()
            frame = min(0.05, now - last)
            last = now
            accumulator += frame
            broadcast_acc += frame
            while accumulator >= physics_dt:
                game.physics_step(physics_dt)
                accumulator -= physics_dt
            if broadcast_acc >= 1.0 / 20.0:
                await broadcast_now()
                broadcast_acc = 0.0
            await asyncio.sleep(0.004)
    except asyncio.CancelledError:
        pass


async def on_startup(app):
    app["game_task"] = asyncio.create_task(game_loop(app))


async def on_cleanup(app):
    app["game_task"].cancel()
    await app["game_task"]


def create_app():
    app = web.Application()
    app.router.add_get("/", index)
    app.router.add_get("/controller", controller)
    app.router.add_get("/api/info", api_info)
    app.router.add_get("/qr.png", qr_png)
    app.router.add_get("/ws", ws_handler)
    app.router.add_static("/static", STATIC)
    app.on_startup.append(on_startup)
    app.on_cleanup.append(on_cleanup)
    return app


if __name__ == "__main__":
    ip = get_lan_ip()
    print("\n=== WIFI KART PARTY ===")
    print(f"Host screen: http://localhost:{PORT}/")
    print(f"Phones:      http://{ip}:{PORT}/controller")
    print("All devices must be on the same Wi‑Fi / LAN.\n")
    try:
        webbrowser.open(f"http://localhost:{PORT}/")
    except Exception:
        pass
    web.run_app(create_app(), host=HOST, port=PORT, print=None)

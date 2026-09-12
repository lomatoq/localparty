import io
import json
import socket
import webbrowser
import threading
from pathlib import Path

from aiohttp import web
import qrcode

ROOT = Path(__file__).resolve().parent
STATIC = ROOT / "static"
BUILD_ID = "CHAOS-LAB-v4.1"

def pick_port():
    # Always start a fresh server even if an older ONE CURSOR build is still alive.
    # Binding to port 0 asks Windows/macOS for an available local port.
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("0.0.0.0", 0))
        return s.getsockname()[1]

PORT = pick_port()

clients = set()
controllers = {}          # name -> websocket
controller_order = []     # stable join order
hosts = set()
roles = {}                # name -> list[str]
PLAYER_LIMIT = 4


def local_ip():
    for target in [("10.255.255.255", 1), ("8.8.8.8", 80)]:
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.settimeout(0.2)
            s.connect(target)
            ip = s.getsockname()[0]
            s.close()
            if ip and not ip.startswith("127."):
                return ip
        except OSError:
            pass
    try:
        ip = socket.gethostbyname(socket.gethostname())
        if ip and not ip.startswith("127."):
            return ip
    except OSError:
        pass
    return "127.0.0.1"


LAN_IP = local_ip()
JOIN_URL = f"http://{LAN_IP}:{PORT}/controller?build={BUILD_ID}"


async def safe_send(ws, payload):
    try:
        await ws.send_str(json.dumps(payload, ensure_ascii=False))
        return True
    except Exception:
        return False


async def broadcast(payload, targets=None):
    pool = list(targets if targets is not None else clients)
    dead = []
    for ws in pool:
        if not await safe_send(ws, payload):
            dead.append(ws)
    for ws in dead:
        clients.discard(ws)
        hosts.discard(ws)
        for name, cws in list(controllers.items()):
            if cws is ws:
                controllers.pop(name, None)
                if name in controller_order:
                    controller_order.remove(name)


async def broadcast_players():
    payload = {
        "type": "players",
        "playerLimit": PLAYER_LIMIT,
        "players": [
            {"name": n, "connected": n in controllers, "role": roles.get(n, [])}
            for n in controller_order
            if n in controllers
        ],
    }
    await broadcast(payload, hosts)
    await broadcast(
        {
            "type": "lobby_state",
            "playerLimit": PLAYER_LIMIT,
            "joined": len(controllers),
            "names": [n for n in controller_order if n in controllers],
        },
        controllers.values(),
    )


def no_store(resp):
    resp.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    resp.headers["Pragma"] = "no-cache"
    resp.headers["Expires"] = "0"
    return resp


async def index(request):
    return no_store(web.FileResponse(STATIC / "host.html"))


async def controller_page(request):
    return no_store(web.FileResponse(STATIC / "controller.html"))


async def config(request):
    return no_store(web.json_response(
        {
            "build": BUILD_ID,
            "joinUrl": JOIN_URL,
            "lanIp": LAN_IP,
            "port": PORT,
            "playerLimit": PLAYER_LIMIT,
            "joined": len(controllers),
        },
        dumps=lambda x: json.dumps(x, ensure_ascii=False),
    ))


async def qr_png(request):
    img = qrcode.make(JOIN_URL)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return no_store(web.Response(body=buf.getvalue(), content_type="image/png"))


async def websocket_handler(request):
    global PLAYER_LIMIT

    ws = web.WebSocketResponse(heartbeat=20)
    await ws.prepare(request)
    clients.add(ws)
    kind = request.query.get("type", "unknown")

    if kind == "host":
        hosts.add(ws)
        await safe_send(
            ws,
            {
                "type": "config",
                "build": BUILD_ID,
                "joinUrl": JOIN_URL,
                "playerLimit": PLAYER_LIMIT,
            },
        )
        await broadcast_players()

    if kind == "controller":
        await safe_send(
            ws,
            {
                "type": "lobby_state",
                "playerLimit": PLAYER_LIMIT,
                "joined": len(controllers),
                "names": [n for n in controller_order if n in controllers],
            },
        )

    try:
        async for msg in ws:
            if msg.type != web.WSMsgType.TEXT:
                continue
            try:
                data = json.loads(msg.data)
            except json.JSONDecodeError:
                continue

            typ = data.get("type")

            if typ == "configure_lobby" and kind == "host":
                if controllers:
                    await safe_send(
                        ws,
                        {
                            "type": "config_error",
                            "message": "Сначала отключите уже подключённые телефоны или перезапустите игру.",
                        },
                    )
                    continue
                try:
                    requested = int(data.get("playerLimit", 4))
                except (TypeError, ValueError):
                    requested = 4
                PLAYER_LIMIT = max(2, requested)
                roles.clear()
                controller_order.clear()
                await broadcast_players()
                await broadcast(
                    {
                        "type": "lobby_state",
                        "playerLimit": PLAYER_LIMIT,
                        "joined": 0,
                        "names": [],
                    },
                    clients,
                )
                await safe_send(ws, {"type": "lobby_configured", "playerLimit": PLAYER_LIMIT})

            elif typ == "join" and kind == "controller":
                name = str(data.get("name", "")).strip()
                if not name:
                    await safe_send(ws, {"type": "join_error", "message": "Введи имя"})
                    continue
                if len(name) > 28:
                    await safe_send(ws, {"type": "join_error", "message": "Имя максимум 28 символов"})
                    continue

                # Reclaim the same name only if that socket is gone.
                old = controllers.get(name)
                if old is not None and old is not ws and not old.closed:
                    await safe_send(ws, {"type": "join_error", "message": "Это имя уже занято"})
                    continue

                current_name = next((n for n, cws in controllers.items() if cws is ws), None)
                if current_name and current_name != name:
                    controllers.pop(current_name, None)
                    if current_name in controller_order:
                        controller_order.remove(current_name)

                if name not in controllers and len(controllers) >= PLAYER_LIMIT:
                    await safe_send(ws, {"type": "join_error", "message": "Лобби уже заполнено"})
                    continue

                controllers[name] = ws
                if name not in controller_order:
                    controller_order.append(name)
                await safe_send(
                    ws,
                    {
                        "type": "joined",
                        "name": name,
                        "role": roles.get(name, []),
                        "playerLimit": PLAYER_LIMIT,
                    },
                )
                await broadcast_players()

            elif typ == "input" and kind == "controller":
                name = next((n for n, cws in controllers.items() if cws is ws), None)
                if name:
                    await broadcast(
                        {
                            "type": "input",
                            "name": name,
                            "control": data.get("control"),
                            "state": data.get("state"),
                            "value": data.get("value"),
                        },
                        hosts,
                    )

            elif typ == "assign_roles" and kind == "host":
                mapping = data.get("roles", {})
                roles.clear()
                for n in list(controllers.keys()):
                    assigned = mapping.get(n, [])
                    if isinstance(assigned, str):
                        assigned = [assigned]
                    roles[n] = [str(x) for x in assigned]

                for n, cws in list(controllers.items()):
                    if not cws.closed:
                        await safe_send(
                            cws,
                            {
                                "type": "role",
                                "role": roles.get(n, []),
                                "round": data.get("round"),
                                "modifier": data.get("modifier"),
                            },
                        )
                await broadcast_players()

            elif typ == "controller_message" and kind == "host":
                target = data.get("target")
                payload = {
                    "type": "controller_message",
                    "title": data.get("title"),
                    "text": data.get("text"),
                    "buzz": data.get("buzz", False),
                }
                if target and target in controllers:
                    await broadcast(payload, [controllers[target]])
                else:
                    await broadcast(payload, controllers.values())

            elif typ == "reset" and kind == "host":
                roles.clear()
                await broadcast({"type": "reset"}, controllers.values())
                await broadcast_players()

    finally:
        clients.discard(ws)
        hosts.discard(ws)
        removed = []
        for name, cws in list(controllers.items()):
            if cws is ws:
                controllers.pop(name, None)
                removed.append(name)
        for name in removed:
            if name in controller_order:
                controller_order.remove(name)
            roles.pop(name, None)
        if removed:
            await broadcast_players()
    return ws


app = web.Application()
app.add_routes(
    [
        web.get("/", index),
        web.get("/controller", controller_page),
        web.get("/api/config", config),
        web.get("/qr.png", qr_png),
        web.get("/ws", websocket_handler),
        web.static("/static", STATIC),
    ]
)

if __name__ == "__main__":
    host_url = f"http://127.0.0.1:{PORT}/?build={BUILD_ID}"
    print(f"\nONE CURSOR UNLIMITED // {BUILD_ID}")
    print(f"Fresh host: {host_url}")
    print(f"Phones: {JOIN_URL}")
    print("This build picks a NEW FREE PORT every launch, so an old server cannot hijack the page.")
    print("If Windows Firewall asks, allow Python on Private networks.\n")
    threading.Timer(0.9, lambda: webbrowser.open(host_url)).start()
    web.run_app(app, host="0.0.0.0", port=PORT, print=None)

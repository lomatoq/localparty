#!/usr/bin/env python3
"""Check the actual staged/iOS product resources without deleting user data.

Usage: python3 scripts/verify-ios-product.py [--app /path/LocalParty.app]
Without --app, checks ios/LocalParty/Server after ios:prepare.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import plistlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REVISION = 'ios-recovery-20260918.1'
SHELL_FILES = ('index.html', 'host.js', 'host.css', 'host-ui.css', 'controller-bridge.js', 'tabs.js')
POCKET_FILES = (
    'core/tanks.cjs', 'core/pocket-runtime.cjs', 'core/air-defense.cjs', 'server.js',
    'public/index.html', 'public/controller.js', 'public/host.js', 'public/net.js',
    'public/pocket-deck.js', 'public/pocket-deck.css',
    'public/render.js', 'public/air-defense-render.js',
    'public/explosion-timeline.js', 'public/explosion-waves.js', 'public/siege-fx.js',
    'public/pocket-projectiles.js', 'public/assets/pocket-projectiles.json',
)
MATCH_FILES = (
    'server.js', 'lib/party-runtime.js',
    'public/tv.html', 'public/tv.js', 'public/tv-information.js',
    'public/tv-information.css', 'public/bridge.js',
    'public/game-polish.css', 'public/i18n-shell.js',
    'games/bow_club/public/phone.js', 'games/bow_club/public/src/camera-policy.mjs',
    'games/bow_club/public/src/camera-preview.mjs',
)


def verify(root: Path, app: Path | None = None) -> dict:
    root = root.resolve()
    server = (app / 'Server') if app else root / 'ios/LocalParty/Server'
    required = ['bootstrap.cjs', 'server.js', 'catalog.json', 'native-catalog.json',
                'lib/catalog.js', 'games/sports_siege/catalog.json',
                'public/style.css', 'public/refresh.css', 'public/glass.css',
                'public/ux.css', 'public/catalog-previews.css', 'public/fresh.css',
                'public/tv.html', 'public/tv.js']
    required += ['public/native-shell/' + name for name in SHELL_FILES]
    required += ['games/arcade_deluxe/' + name for name in POCKET_FILES]
    required += list(MATCH_FILES)
    for name in required:
        file = server / name
        if not file.is_file() or file.stat().st_size == 0:
            raise ValueError(f'Missing or empty bundled resource: {file}')
    games = json.loads((server / 'native-catalog.json').read_text())
    if not isinstance(games, list) or not games:
        raise ValueError('native-catalog.json must contain a nonempty game array')
    ids = []
    for game in games:
        if not isinstance(game, dict) or not all(isinstance(game.get(k), str) and game[k] for k in ('id', 'title', 'controls', 'color')):
            raise ValueError('Invalid native game record: missing Swift-required fields')
        ids.append(game['id'])
        engine = game.get('engine', game['id'])
        # Catalog IDs/engines cannot escape the bundled games directory.
        if not isinstance(engine, str) or '/' in engine or '\\' in engine or '..' in engine:
            raise ValueError('Invalid engine name in bundled catalog')
        if not (server / 'games' / engine).is_dir():
            raise ValueError(f'Bundled game engine missing: {engine}')
    if len(ids) != len(set(ids)):
        raise ValueError('Duplicate native game IDs')
    expected = {g['id'] for name in ('catalog.json', 'games/sports_siege/catalog.json')
                for g in json.loads((server / name).read_text())}
    if set(ids) != expected:
        raise ValueError(f'Incomplete native catalog; expected {len(expected)} IDs, got {len(set(ids))}')
    hashes = {}
    checked_files = ['public/native-shell/' + name for name in SHELL_FILES]
    checked_files += ['games/arcade_deluxe/' + name for name in POCKET_FILES]
    checked_files += list(MATCH_FILES)
    for relative in checked_files:
        expected_bytes = (root / relative).read_bytes()
        actual_bytes = (server / relative).read_bytes()
        if actual_bytes != expected_bytes:
            raise ValueError(f'Stale product file: {relative}; run ios:prepare and rebuild')
        hashes[relative] = hashlib.sha256(actual_bytes).hexdigest()
    if REVISION not in (server / 'public/native-shell/host.js').read_text():
        raise ValueError('Old shell revision in product')
    metadata = {}
    if app:
        with (app / 'Info.plist').open('rb') as stream:
            info = plistlib.load(stream)
        manifest = info.get('UIApplicationSceneManifest', {})
        if manifest.get('UIApplicationSupportsMultipleScenes') is not True:
            raise ValueError('Product scene manifest does not enable phone + external scenes')
        configs = manifest.get('UISceneConfigurations', {}).get('UIWindowSceneSessionRoleExternalDisplayNonInteractive', [])
        if not any(c.get('UISceneDelegateClassName', '').endswith('.PartyExternalDisplaySceneDelegate') for c in configs):
            raise ValueError('Product is missing the external-display scene delegate')
        metadata = {key: info.get(key) for key in ('CFBundleIdentifier', 'CFBundleShortVersionString', 'CFBundleVersion', 'DTSDKName')}
        # The new AirPlay registration requires the iOS 27 SDK. No silent fallback
        # to a build that will still mirror on a current iPhone.
        sdk = info.get('DTSDKName', '')
        digits = ''.join(c if c.isdigit() or c == '.' else ' ' for c in sdk).strip()
        if not digits or int(digits.split('.')[0]) < 27:
            raise ValueError(f'Hotfix product must be built with iOS 27 SDK, got {sdk!r}')
    return {'ok': True, 'shellRevision': REVISION, 'catalogCount': len(ids),
            'catalogIds': sorted(ids), 'metadata': metadata, 'sha256': hashes}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--app', type=Path)
    args = parser.parse_args()
    try:
        print(json.dumps(verify(ROOT, args.app), ensure_ascii=False, indent=2))
    except (OSError, ValueError, KeyError, TypeError) as error:
        parser.exit(1, f'iOS product verification FAILED: {error}\n')


if __name__ == '__main__':
    main()

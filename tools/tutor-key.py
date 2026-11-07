#!/usr/bin/env python3
"""tutor-key.py — store, check or remove the Anthropic API key the book tutor uses.

Usage:  python3 tools/tutor-key.py                       # paste a key (hidden), check it, save it
        python3 tools/tutor-key.py --workspace wrkspc_…   # save the workspace ID (see below)
        python3 tools/tutor-key.py --check                # is a key set up, does the API accept it?
        python3 tools/tutor-key.py --remove               # delete the saved key and workspace ID

The key is saved to ~/.config/cpp101/anthropic-api-key, readable only by you (chmod 600), outside
the repository so it can never be committed. It is only ever sent to api.anthropic.com. The check
asks the API for one model's details (GET /v1/models/<model>), which costs nothing.

Workspace ID: a key that is not scoped to one workspace must say which workspace to bill, with the
header anthropic-workspace-id. If the API asks for it, this script asks you for the ID (it starts
with wrkspc_ and is listed under Workspaces in the Claude Console) and saves it next to the key, in
~/.config/cpp101/anthropic-workspace-id. A workspace ID is not a secret.

Make a key at https://platform.claude.com/settings/keys (Claude Console, API keys).
Then start (or keep using) the book server: python3 tools/serve-book.py
"""
from __future__ import annotations

import getpass
import http.client
import json
import os
import ssl
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import tutor_api  # noqa: E402

HOME = os.path.expanduser('~')


def short(path: str) -> str:
    return path.replace(HOME, '~')


def check(key: str) -> tuple[bool, str, bool]:
    """Ask the API about the tutor's model: (ok, message, the API wants a workspace ID)."""
    try:
        conn = http.client.HTTPSConnection('api.anthropic.com', 443, timeout=20,
                                           context=ssl.create_default_context())
        conn.request('GET', f'/v1/models/{tutor_api.model()}', headers=tutor_api.auth_headers(key))
        resp = conn.getresponse()
        raw = resp.read(8192)
        conn.close()
    except OSError as e:
        return False, f'could not reach api.anthropic.com ({e.strerror or e}).', False
    if resp.status == 200:
        try:
            name = json.loads(raw).get('display_name') or tutor_api.model()
        except ValueError:
            name = tutor_api.model()
        ws = tutor_api.load_workspace()
        where = f' (workspace {ws})' if ws else ''
        return True, f'the API accepts the key{where}, and {name} is available to it.', False
    try:
        detail = str((json.loads(raw).get('error') or {}).get('message') or '')
    except (ValueError, AttributeError):
        detail = ''
    return False, tutor_api._api_error_message(resp.status, raw), tutor_api.needs_workspace(detail)


def ensure_dir() -> None:
    os.makedirs(tutor_api.CONFIG_DIR, mode=0o700, exist_ok=True)
    os.chmod(tutor_api.CONFIG_DIR, 0o700)


def save_key(key: str) -> None:
    ensure_dir()
    fd = os.open(tutor_api.KEY_FILE, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, 'w', encoding='utf-8') as f:
        f.write(key + '\n')
    os.chmod(tutor_api.KEY_FILE, 0o600)


def save_workspace(ws: str) -> None:
    ensure_dir()
    fd = os.open(tutor_api.WORKSPACE_FILE, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, 'w', encoding='utf-8') as f:
        f.write(ws + '\n')


def ask_workspace() -> str | None:
    print('This key is not tied to one workspace, so the API needs to know which workspace to bill.')
    print('Find the ID in the Claude Console under Settings > Workspaces (it starts with wrkspc_).')
    try:
        ws = input('Workspace ID: ').strip()
    except (EOFError, KeyboardInterrupt):
        return None
    if not tutor_api.valid_workspace(ws):
        print('That does not look like a workspace ID (wrkspc_ followed by letters and digits).')
        return None
    save_workspace(ws)
    print(f'Saved the workspace ID to {short(tutor_api.WORKSPACE_FILE)}.')
    return ws


def main(argv: list) -> int:
    args = argv[1:]
    if args == ['--remove']:
        for path in (tutor_api.KEY_FILE, tutor_api.WORKSPACE_FILE):
            try:
                os.remove(path)
                print(f'Removed {short(path)}.')
            except FileNotFoundError:
                pass
        print('The tutor goes back to Claude Code from the next question.')
        return 0
    if len(args) == 2 and args[0] == '--workspace':
        if not tutor_api.valid_workspace(args[1]):
            print('That does not look like a workspace ID (wrkspc_ followed by letters and digits).')
            return 1
        save_workspace(args[1])
        print(f'Saved the workspace ID to {short(tutor_api.WORKSPACE_FILE)}.')
        key, _ = tutor_api.load_key()
        if key:
            ok, msg, _ = check(key)
            print(('OK: ' if ok else 'Key check: ') + msg)
            return 0 if ok else 1
        print('Now save your key: python3 tools/tutor-key.py')
        return 0
    if args == ['--check']:
        key, where = tutor_api.load_key()
        if not key:
            print(f'No usable key: {where}.')
            return 1
        ok, msg, _ = check(key)
        print(f'Key from {where}: {msg}')
        return 0 if ok else 1
    if args:
        print(__doc__.strip().split('\n\n')[1])
        return 2

    print('Paste your Anthropic API key and press Enter. Nothing will appear as you paste.')
    try:
        key = getpass.getpass('API key: ').strip()
    except (EOFError, KeyboardInterrupt):
        print('\nCancelled; nothing was saved.')
        return 1
    if not key:
        print('No key entered; nothing was saved.')
        return 1
    if not key.startswith('sk-ant-'):
        print('That does not look like an Anthropic API key (they start with "sk-ant-"). '
              'Nothing was saved.')
        return 1
    print('Checking the key with the API (free)...')
    ok, msg, wants_ws = check(key)
    if not ok and wants_ws:
        if not ask_workspace():
            print('Not saved. Run this again when you have the workspace ID.')
            return 1
        print('Checking again with the workspace ID...')
        ok, msg, _ = check(key)
    if not ok:
        print(f'Not saved: {msg}')
        return 1
    save_key(key)
    print(f'OK: {msg}')
    print(f'Saved the key to {short(tutor_api.KEY_FILE)} (only you can read it). The book server')
    print('picks it up on the next question; if it is not running, start it with:')
    print('    python3 tools/serve-book.py')
    if os.environ.get('ANTHROPIC_API_KEY'):
        print('Note: ANTHROPIC_API_KEY is also set in this shell, and the server prefers it.')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv))

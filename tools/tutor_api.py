#!/usr/bin/env python3
"""tutor_api.py — the book tutor's second provider: the Anthropic API, called directly.

tutor.py runs the Claude Code CLI, which bills your Claude subscription. This module sends the same
system prompt and the same user turn straight to the Messages API with your own API key instead, so
the answers are billed to the API (and to promotional API credits), start streaming faster (no CLI
to start), and need nothing installed.

Why raw HTTP and not the official `anthropic` SDK: the book server must run on the Python that ships
with macOS (3.9 here) with nothing installed, and the SDK's current major needs Python 3.10+ and
pip. The wire format used below is the documented one (POST /v1/messages with "stream": true).

Where the key comes from, first match wins:
  1. the ANTHROPIC_API_KEY environment variable of the server process;
  2. the file ~/.config/cpp101/anthropic-api-key (one line, readable only by you, chmod 600).
     `python3 tools/tutor-key.py` writes it for you without the key ever being shown or logged.
The key never leaves this process: it is not sent to the browser, not logged, not in any error.

Which provider answers (TUTOR_PROVIDER): "auto" (default) = the API when a key is found, else
Claude Code; "api" = the API only; "claude-code" = the CLI only.

Spending guard: every answer's cost is added to ~/.config/cpp101/tutor-usage.json (date -> dollars).
When today's total reaches TUTOR_DAILY_BUDGET_USD (default 5.00), the tutor stops answering until
tomorrow and says so. One answer is also capped by max_tokens.

Python 3 standard library only.
"""
from __future__ import annotations

import datetime
import http.client
import json
import os
import queue
import re
import ssl
import stat
import threading
import time
import urllib.parse

import tutor  # the guards, the prompts and the limits are shared with the CLI provider

CONFIG_DIR = os.path.expanduser(os.environ.get('TUTOR_CONFIG_DIR', '~/.config/cpp101'))
KEY_FILE = os.path.join(CONFIG_DIR, 'anthropic-api-key')
WORKSPACE_FILE = os.path.join(CONFIG_DIR, 'anthropic-workspace-id')
USAGE_FILE = os.path.join(CONFIG_DIR, 'tutor-usage.json')
API_BASE = os.environ.get('TUTOR_API_BASE', 'https://api.anthropic.com')   # tests point it at a fake
API_VERSION = '2026-10-21'
FALLBACK_BETA = 'server-side-fallback-2026-07-01'   # pairs with "fallbacks": "default"
MAX_TOKENS = 16000          # one answer, thinking included; a tutor answer is a few hundred tokens
PROVIDER = 'anthropic'

# Dollars per million tokens: input, output, cache write (5 min), cache read.
PRICES = {
    'claude-opus-5-5': (4.00, 20.00, 5.00, 0.20),
    'claude-opus-5': (5.00, 25.00, 6.25, 0.50),
    'claude-opus-4-8': (5.00, 25.00, 6.25, 0.50),
    'claude-sonnet-5-5': (2.00, 10.00, 2.50, 0.20),
    'claude-sonnet-5': (2.00, 10.00, 2.50, 0.20),
    'claude-haiku-5-5': (0.10, 0.50, 0.125, 0.01),
}


def model() -> str:
    return os.environ.get('TUTOR_API_MODEL', '').strip() or 'claude-opus-5-5'


def daily_budget() -> float:
    try:
        return max(0.0, float(os.environ.get('TUTOR_DAILY_BUDGET_USD', '5.00')))
    except ValueError:
        return 5.00


# --- the key -------------------------------------------------------------------------------------

_WORKSPACE_RE = re.compile(r'^wrkspc_[A-Za-z0-9]{8,64}$')


def valid_workspace(ws: str) -> bool:
    return bool(_WORKSPACE_RE.match(ws or ''))


def load_workspace() -> str | None:
    """The workspace to bill, for keys that are not scoped to one: ANTHROPIC_WORKSPACE_ID, then
    ~/.config/cpp101/anthropic-workspace-id. A workspace ID is not a secret. None if unset."""
    ws = os.environ.get('ANTHROPIC_WORKSPACE_ID', '').strip()
    if not ws:
        try:
            with open(WORKSPACE_FILE, encoding='utf-8') as f:
                ws = f.read().strip()
        except OSError:
            return None
    return ws if valid_workspace(ws) else None


def auth_headers(key: str) -> dict:
    """x-api-key and anthropic-version, plus anthropic-workspace-id when one is configured."""
    h = {'x-api-key': key, 'anthropic-version': API_VERSION}
    ws = load_workspace()
    if ws:
        h['anthropic-workspace-id'] = ws
    return h


def needs_workspace(detail: str) -> bool:
    return 'anthropic-workspace-id' in (detail or '').lower()


def load_key() -> tuple[str | None, str]:
    """(key, where it came from) or (None, why not). Never returns part of a key in the reason."""
    env = os.environ.get('ANTHROPIC_API_KEY', '').strip()
    if env:
        return env, 'the ANTHROPIC_API_KEY environment variable'
    try:
        st = os.stat(KEY_FILE)
    except FileNotFoundError:
        return None, 'no API key is set up (run: python3 tools/tutor-key.py)'
    except OSError as e:
        return None, f'the key file could not be read ({e.strerror})'
    if st.st_mode & (stat.S_IRWXG | stat.S_IRWXO):
        return None, ('the key file can be read by other users of this Mac; fix it with: '
                      f'chmod 600 {KEY_FILE}')
    try:
        with open(KEY_FILE, encoding='utf-8') as f:
            key = f.read().strip()
    except OSError as e:
        return None, f'the key file could not be read ({e.strerror})'
    if not key:
        return None, 'the key file is empty (run: python3 tools/tutor-key.py)'
    return key, KEY_FILE.replace(os.path.expanduser('~'), '~')


def wanted() -> str:
    """Which provider the server should use: 'anthropic', 'claude' or None (none available)."""
    choice = os.environ.get('TUTOR_PROVIDER', 'auto').strip().lower()
    if choice in ('claude-code', 'claude', 'cli'):
        return 'claude'
    key, _ = load_key()
    if choice == 'api':
        return 'anthropic'
    return 'anthropic' if key else 'claude'


# --- the spending guard --------------------------------------------------------------------------

_usage_lock = threading.Lock()


def _today() -> str:
    return datetime.date.today().isoformat()


def _read_usage() -> dict:
    try:
        with open(USAGE_FILE, encoding='utf-8') as f:
            data = json.load(f)
        return data if isinstance(data, dict) else {}
    except (OSError, ValueError):
        return {}


def spent_today() -> float:
    with _usage_lock:
        v = _read_usage().get(_today(), 0)
    return float(v) if isinstance(v, (int, float)) else 0.0


def add_spend(dollars: float) -> float:
    """Add one answer's cost to today's total and return the new total."""
    with _usage_lock:
        data = _read_usage()
        day = _today()
        total = float(data.get(day, 0) or 0) + max(0.0, dollars)
        data[day] = round(total, 6)
        for old in sorted(data)[:-60]:          # keep about two months
            data.pop(old, None)
        try:
            os.makedirs(CONFIG_DIR, mode=0o700, exist_ok=True)
            tmp = USAGE_FILE + '.tmp'
            with open(tmp, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=1, sort_keys=True)
            os.replace(tmp, USAGE_FILE)
        except OSError:
            pass
        return total


def cost_of(model_id: str, usage: dict) -> float | None:
    p = PRICES.get(model_id)
    if p is None:
        return None
    n = lambda k: usage.get(k) if isinstance(usage.get(k), int) else 0  # noqa: E731
    return (n('input_tokens') * p[0] + n('output_tokens') * p[1]
            + n('cache_creation_input_tokens') * p[2] + n('cache_read_input_tokens') * p[3]) / 1e6


# --- status --------------------------------------------------------------------------------------

def status() -> dict:
    key, where = load_key()
    base = {'ok': True, 'provider': PROVIDER, 'model': model(),
            'spent_today_usd': round(spent_today(), 4), 'daily_budget_usd': daily_budget()}
    if not key:
        return {**base, 'available': False, 'reason': f'Anthropic API: {where}.'}
    return {**base, 'available': True, 'key_source': where,
            'workspace': load_workspace() or ''}


# --- one answer ----------------------------------------------------------------------------------

def build_body(req: dict) -> dict:
    """The Messages API request for one validated tutor request."""
    return {
        'model': model(),
        'max_tokens': MAX_TOKENS,
        'stream': True,
        # The system prompt is the stable prefix (same chapter, same `tell` -> same bytes), so it
        # is the one place worth a cache breakpoint. Below the model's minimum it simply does not
        # cache, at no cost.
        'system': [{'type': 'text',
                    'text': tutor.build_system_prompt(req.get('chapter'), req.get('tell', '')),
                    'cache_control': {'type': 'ephemeral'}}],
        'messages': [{'role': 'user',
                      'content': tutor.build_user_turn(req['history'], req['prompt'])}],
        # Thinking cannot be switched off on this model; effort is the dial. "summarized" makes
        # the panel's Thinking line show a readable summary instead of an empty pause.
        'thinking': {'type': 'adaptive', 'display': 'summarized'},
        'output_config': {'effort': 'high' if req.get('think') else 'low'},
        # If a safety classifier declines, the API retries on the model Anthropic recommends for
        # that kind of decline, inside the same call.
        'fallbacks': 'default',
    }


def _connect(timeout: float):
    u = urllib.parse.urlsplit(API_BASE)
    port = u.port or (443 if u.scheme == 'https' else 80)
    if u.scheme == 'https':
        conn = http.client.HTTPSConnection(u.hostname, port, timeout=timeout,
                                           context=ssl.create_default_context())
    else:
        conn = http.client.HTTPConnection(u.hostname, port, timeout=timeout)
    return conn, (u.path.rstrip('/') + '/v1/messages')


def _api_error_message(code: int, raw: bytes) -> str:
    try:
        err = json.loads(raw.decode('utf-8', 'replace')).get('error') or {}
        detail = str(err.get('message') or '')[:300]
        etype = str(err.get('type') or '')
    except (ValueError, AttributeError):
        detail, etype = '', ''
    low = detail.lower()
    if needs_workspace(detail):
        return ('This API key is not tied to one workspace, so the tutor needs your workspace '
                'ID too. Run python3 tools/tutor-key.py --workspace wrkspc_... (the ID is under '
                'Workspaces in the Claude Console).')
    if code == 401 or etype == 'authentication_error':
        return ('The Anthropic API rejected the key. Make a new key in the Claude Console and run '
                'python3 tools/tutor-key.py again.')
    if code == 403 or etype == 'permission_error':
        return 'The API key is not allowed to use this model (' + (detail or 'permission error') + ').'
    if 'credit' in low and ('low' in low or 'balance' in low):
        return ('Your API credit has run out (the Console says: ' + detail + '). Nothing was '
                'charged; add credit or switch the server to Claude Code with '
                'TUTOR_PROVIDER=claude-code.')
    if code == 429 or etype == 'rate_limit_error':
        return 'The API rate limit was reached. Wait a minute and press Retry.'
    if code in (500, 502, 503, 529) or etype in ('api_error', 'overloaded_error'):
        return 'The Anthropic API is busy or having trouble right now. Press Retry in a moment.'
    return f'The Anthropic API returned an error ({code}' + (f': {detail}' if detail else '') + ').'


def stream_answer(req: dict, send, client_gone=lambda: False) -> None:
    """Same contract as tutor.stream_answer: meta, thinking*, text*, withheld*, then done or error."""
    t0 = time.monotonic()
    send('meta', {'provider': PROVIDER, 'model': model()})
    key, where = load_key()
    if not key:
        send('error', {'message': f'The tutor cannot use the Anthropic API: {where}.'})
        return
    budget, spent = daily_budget(), spent_today()
    if spent >= budget:
        send('error', {'message': f'Today\'s tutor budget of ${budget:.2f} is used up '
                                  f'(${spent:.2f} spent). It resets at midnight; raise it with '
                                  'TUTOR_DAILY_BUDGET_USD.'})
        return

    body = json.dumps(build_body(req)).encode('utf-8')
    headers = {'content-type': 'application/json', **auth_headers(key),
               'anthropic-beta': FALLBACK_BETA, 'accept': 'text/event-stream'}
    try:
        conn, path = _connect(timeout=30)
        conn.request('POST', path, body=body, headers=headers)
        resp = conn.getresponse()
    except (OSError, http.client.HTTPException) as e:
        send('error', {'message': 'Could not reach the Anthropic API '
                                  f'({getattr(e, "strerror", None) or type(e).__name__}). '
                                  'Check your internet connection.'})
        return
    if resp.status != 200:
        raw = resp.read(8192)
        conn.close()
        send('error', {'message': _api_error_message(resp.status, raw)})
        return

    lines: queue.Queue = queue.Queue()

    def read_stream():
        try:
            for raw in resp:
                lines.put(raw)
        except (OSError, http.client.HTTPException, ValueError):
            lines.put(b'__broken__')
        lines.put(None)

    threading.Thread(target=read_stream, daemon=True).start()

    guard, think_guard = tutor.FenceGuard(), tutor.ThinkingGuard()
    reported = think_reported = 0
    usage: dict = {}
    served_by = model()
    stop_reason = None
    stream_error = None
    text_blocks = 0
    broken = False
    data_lines: list[str] = []

    def emit_text(s: str):
        nonlocal reported
        if s:
            send('text', {'text': s})
        while reported < len(guard.withheld):
            send('withheld', {'reason': guard.withheld[reported]})
            reported += 1

    def emit_thinking(s: str):
        nonlocal think_reported
        if s:
            send('thinking', {'text': s})
        while think_reported < len(think_guard.withheld):
            send('withheld', {'reason': 'thinking ' + think_guard.withheld[think_reported]})
            think_reported += 1

    def on_event(ev: dict):
        nonlocal served_by, stop_reason, stream_error, text_blocks
        t = ev.get('type')
        if t == 'message_start':
            m = ev.get('message') or {}
            served_by = m.get('model') or served_by
            usage.update({k: v for k, v in (m.get('usage') or {}).items() if isinstance(v, int)})
        elif t == 'content_block_start':
            block = ev.get('content_block') or {}
            if block.get('type') == 'text':
                emit_thinking(think_guard.flush())       # thinking ends where the answer starts
                if text_blocks:
                    emit_text(guard.feed('\n\n'))
                text_blocks += 1
        elif t == 'content_block_delta':
            d = ev.get('delta') or {}
            if d.get('type') == 'text_delta' and isinstance(d.get('text'), str):
                emit_text(guard.feed(d['text']))
            elif d.get('type') == 'thinking_delta' and isinstance(d.get('thinking'), str):
                emit_thinking(think_guard.feed(d['thinking']))
        elif t == 'message_delta':
            stop_reason = (ev.get('delta') or {}).get('stop_reason') or stop_reason
            usage.update({k: v for k, v in (ev.get('usage') or {}).items() if isinstance(v, int)})
        elif t == 'error':
            stream_error = (ev.get('error') or {}).get('type') or 'error'

    try:
        deadline = t0 + tutor.TIMEOUT_S
        while True:
            if time.monotonic() > deadline:
                emit_thinking(think_guard.flush())
                emit_text(guard.flush())
                send('error', {'message': f'The tutor took longer than {tutor.TIMEOUT_S} seconds, '
                                          'so it was stopped. Try a shorter question.'})
                return
            try:
                raw = lines.get(timeout=0.25)
            except queue.Empty:
                if client_gone():
                    raise tutor.ClientGone()
                continue
            if raw is None:
                break
            if raw == b'__broken__':
                broken = True
                continue
            line = raw.decode('utf-8', 'replace').rstrip('\r\n')
            if line.startswith('data:'):
                data_lines.append(line[5:].lstrip())
            elif line == '' and data_lines:
                try:
                    ev = json.loads('\n'.join(data_lines))
                except ValueError:
                    ev = None
                data_lines = []
                if isinstance(ev, dict):
                    on_event(ev)
            if client_gone():
                raise tutor.ClientGone()
        emit_thinking(think_guard.flush())
        emit_text(guard.flush())
        cost = cost_of(served_by, usage)
        if cost is not None:
            add_spend(cost)
        ms = int((time.monotonic() - t0) * 1000)
        if stream_error:
            send('error', {'message': _api_error_message(529 if 'overloaded' in stream_error else 500,
                                                         b'')})
        elif stop_reason == 'refusal':
            send('error', {'message': 'The model declined to answer this one. Try rephrasing the '
                                      'question, or ask about a smaller piece of it.'})
        elif broken or stop_reason is None:
            send('error', {'message': 'The connection to the Anthropic API dropped mid-answer. '
                                      'Press Retry.'})
        else:
            done = {'ms': ms, 'cost_usd': round(cost, 4) if cost is not None else None,
                    'spent_today_usd': round(spent_today(), 4)}
            if served_by != model():
                done['served_by'] = served_by
            if stop_reason == 'max_tokens':
                done['truncated'] = True
            send('done', done)
    finally:
        try:
            conn.close()
        except OSError:
            pass

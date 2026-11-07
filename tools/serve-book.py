#!/usr/bin/env python3
"""serve-book.py — serve the books at http://localhost:8765 (or a port you pass).

Serves docs/book/, which holds one book per challenge week, like `python3 -m http.server`, plus:
  * one header, Cache-Control: no-cache. That makes the browser re-check every page on each visit,
    so edits to a book show up on a normal reload instead of an old cached copy;
  * http://localhost:8765/ forwards to the current week's book, by the same rule as the online
    copy (tools/build-pages.py): the newest book whose start date has come, by this Mac's
    calendar. Every book opens at once at its own address (Week 3 at
    http://localhost:8765/week3/), so a spec ritual can read next week's book.
    BOOK_TODAY=YYYY-MM-DD pretends that today is another day;
  * an address from before Week 3, when this server showed only the Week 1 book
    (http://localhost:8765/07-flat-grid.html), forwards to the same page under /week1/.

It listens on this Mac only (127.0.0.1 and ::1, the two spellings of localhost), so other machines
on your network cannot reach it. If another program already holds the port (an old
`python3 -m http.server`, say), it refuses to start rather than share the port with it.

Two extra routes run the books' tutor (the logic lives in tools/tutor.py; docs/tutor.md has the
setup):
  GET  /api/tutor/status   which provider and model answer, or why the tutor is unavailable
  POST /api/tutor/ask      one question in (JSON), the answer streamed back (server-sent events)
The tutor answers through the Anthropic API when a key is saved (tools/tutor-key.py), otherwise
through Claude Code (`claude -p` from the repository root, read-only tools).

Usage:  python3 tools/serve-book.py          # port 8765
        python3 tools/serve-book.py 9000     # another port
Stop with Ctrl-C.
"""
from __future__ import annotations

import datetime, functools, http.server, importlib.util, os, re, signal, socket, sys, threading
import urllib.parse

import tutor

HERE = os.path.dirname(os.path.abspath(__file__))
BOOKS = os.path.normpath(os.path.join(HERE, '..', 'docs', 'book'))
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8765

# tools/build-pages.py decides which book the online copy opens; the same functions decide it here.
_spec = importlib.util.spec_from_file_location('build_pages', os.path.join(HERE, 'build-pages.py'))
build_pages = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(build_pages)


def weeks() -> list[str]:
    """Every book folder, in week order: ['week1', 'week3', ...]."""
    return sorted((d for d in os.listdir(BOOKS) if re.fullmatch(r'week\d+', d)),
                  key=lambda d: int(d[4:]))


def today() -> datetime.date:
    """This Mac's date, unless BOOK_TODAY=YYYY-MM-DD says otherwise."""
    forced = os.environ.get('BOOK_TODAY')
    return datetime.date.fromisoformat(forced) if forced else datetime.date.today()


def facts() -> dict:
    """{'week3': (title, start date or None), ...} from each book's front page."""
    return {w: build_pages.book_facts(BOOKS, w) for w in weeks()}


def forward_to(path: str) -> str | None:
    """Where to send a request for an address that is not a file of its own, or None to serve it
    as it is: / goes to the current week's book, and a Week 1 address from the days when that book
    was served on its own (/07-flat-grid.html) goes to the same page under /week1/."""
    parts = urllib.parse.urlsplit(path)
    rel = urllib.parse.unquote(parts.path).lstrip('/')
    if rel in ('', 'index.html'):
        known = weeks()
        return f'/{build_pages.current_week(known, facts(), today())}/' if known else None
    segments = rel.split('/')
    if re.fullmatch(r'week\d+', segments[0]) or '..' in segments:
        return None
    if os.path.isfile(os.path.join(BOOKS, 'week1', *segments)):
        return '/week1/' + urllib.parse.quote(rel) + ('?' + parts.query if parts.query else '')
    return None


class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

    def forwarded(self) -> bool:
        target = forward_to(self.path)
        if target is None:
            return False
        self.send_response(302)
        self.send_header('Location', target)
        self.send_header('Content-Length', '0')
        self.end_headers()
        return True

    def do_GET(self):
        if tutor.is_api(self.path):
            tutor.handle(self, PORT)
        elif not self.forwarded():
            super().do_GET()

    def do_HEAD(self):
        if tutor.is_api(self.path):
            tutor.handle(self, PORT)
        elif not self.forwarded():
            super().do_HEAD()

    def do_POST(self):
        tutor.handle(self, PORT) if tutor.is_api(self.path) else self.send_error(405)

    def do_OPTIONS(self):                # CORS preflights are never approved
        tutor.handle(self, PORT) if tutor.is_api(self.path) else self.send_error(405)

# `kill` (SIGTERM) and closing the terminal window (SIGHUP) would end Python without its atexit
# hooks; exiting normally instead lets tutor.kill_all stop any claude -p still running.
for sig in (signal.SIGTERM, signal.SIGHUP):
    signal.signal(sig, lambda *_: sys.exit(0))
def port_taken(port: int) -> str | None:
    """Return the address something is already listening on, or None."""
    for family, addr in ((socket.AF_INET6, '::1'), (socket.AF_INET, '127.0.0.1')):
        try:
            with socket.socket(family, socket.SOCK_STREAM) as s:
                s.settimeout(0.5)
                if s.connect_ex((addr, port)) == 0:
                    return addr
        except OSError:
            pass
    return None


class Server6(http.server.ThreadingHTTPServer):
    address_family = socket.AF_INET6


taken = port_taken(PORT)
if taken:
    print(f'Port {PORT} is already in use on {taken} by another program, perhaps an older book '
          f'server or `python3 -m http.server`.\nStop that one first (Ctrl-C in its terminal), or '
          f'use another port: python3 tools/serve-book.py {PORT + 1}')
    sys.exit(1)
handler = functools.partial(NoCache, directory=BOOKS)
with http.server.ThreadingHTTPServer(('127.0.0.1', PORT), handler) as httpd:
    try:                                 # browsers try ::1 first for "localhost"
        httpd6 = Server6(('::1', PORT), handler)
        threading.Thread(target=httpd6.serve_forever, daemon=True).start()
    except OSError:
        httpd6 = None
    print(f'Serving the books at http://localhost:{PORT}  (Ctrl-C to stop)')
    on, known = today(), facts()
    for w in weeks():
        starts = known[w][1]
        later = f'  (starts {starts.strftime("%a %d %b %Y")})' if starts and starts > on else ''
        print(f'  {w.replace("week", "Week ")}: http://localhost:{PORT}/{w}/{later}')
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print()

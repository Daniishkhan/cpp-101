#!/usr/bin/env python3
"""serve-book.py — serve the Week 1 book at http://localhost:8765 (or a port you pass).

Same as `python3 -m http.server`, plus one header: Cache-Control: no-cache.
That makes the browser re-check every page on each visit, so edits to the
book show up on a normal reload instead of an old cached copy.

It listens on this Mac only (127.0.0.1 and ::1, the two spellings of localhost), so other machines
on your network cannot reach it. If another program already holds the port (an old
`python3 -m http.server`, say), it refuses to start rather than share the port with it.

Two extra routes run the book's tutor (the logic lives in tools/tutor.py):
  GET  /api/tutor/status   is Claude Code installed, which version, which model
  POST /api/tutor/ask      one question in (JSON), the answer streamed back (server-sent events)
The tutor runs `claude -p` from the repository root with read-only tools.
Set TUTOR_MODEL to change the model (default sonnet) and TUTOR_CLAUDE_BIN to
point at a claude binary that is not on your PATH.

Usage:  python3 tools/serve-book.py          # port 8765
        python3 tools/serve-book.py 9000     # another port
Stop with Ctrl-C.
"""
from __future__ import annotations

import functools, http.server, os, signal, socket, sys, threading

import tutor

BOOK = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'docs', 'book', 'week1')
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8765

class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

    def do_GET(self):
        tutor.handle(self, PORT) if tutor.is_api(self.path) else super().do_GET()

    def do_HEAD(self):
        tutor.handle(self, PORT) if tutor.is_api(self.path) else super().do_HEAD()

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
handler = functools.partial(NoCache, directory=os.path.normpath(BOOK))
with http.server.ThreadingHTTPServer(('127.0.0.1', PORT), handler) as httpd:
    try:                                 # browsers try ::1 first for "localhost"
        httpd6 = Server6(('::1', PORT), handler)
        threading.Thread(target=httpd6.serve_forever, daemon=True).start()
    except OSError:
        httpd6 = None
    print(f'Serving the book at http://localhost:{PORT}  (Ctrl-C to stop)')
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print()

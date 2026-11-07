#!/usr/bin/env python3
"""book-check.py — verify the Week 1 book.

For every chapter HTML file (or the ones given on the command line):
  * extracts every <pre class="code" data-lang="cpp"> block
  * data-check="run"      -> must compile (C++23, -Wall -Wextra, ASan+UBSan) AND run with exit 0 (10 s timeout)
  * data-check="compile"  -> must compile only (programs that sleep, wait for input, or loop forever)
  * data-check="error"    -> must FAIL to compile (deliberate teaching errors)
  * data-check="fragment" -> skipped (not a standalone program)
  * if a <pre class="output" data-for="FILE"> follows a "run" block, stdout must match it exactly
    (trailing whitespace on each line and at the end is ignored)
  * data-lang="cmake" / "shell" / "text" -> never compiled
  * checks that every internal link (href="*.html[#id]") points at an existing file and anchor
  * warns about code blocks that lost their '<' to HTML parsing (e.g. "#include " followed by newline)

Usage:  python3 tools/book-check.py                 # all chapters
        python3 tools/book-check.py docs/book/week1/03-control-flow.html
Exit code 0 = all good, 1 = problems (listed).
"""
import html, os, re, subprocess, sys, tempfile
from html.parser import HTMLParser

BOOK = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'docs', 'book', 'week1')
CXX = os.environ.get('CXX', 'clang++')
BASE_FLAGS = ['-std=c++23', '-Wall', '-Wextra']
SAN_FLAGS = ['-g', '-fsanitize=address,undefined', '-fno-omit-frame-pointer']

class Collector(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.blocks = []      # dicts: kind, lang, file, check, text, line
        self.links = []       # (href, line)
        self.ids = set()
        self.headings = []    # (level, text) for anchor generation
        self._cur = None
        self._in_heading = None
        self._heading_text = ''
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if 'id' in a: self.ids.add(a['id'])
        if tag == 'pre':
            cls = (a.get('class') or '').split()
            if 'code' in cls or 'output' in cls or 'shell' in cls:
                self._cur = {'kind': 'code' if 'code' in cls else ('output' if 'output' in cls else 'shell'),
                             'lang': a.get('data-lang', 'cpp' if 'code' in cls else 'shell'),
                             'file': a.get('data-file'), 'for': a.get('data-for'),
                             'check': a.get('data-check'), 'text': '', 'line': self.getpos()[0]}
        if tag == 'a' and a.get('href'): self.links.append((a['href'], self.getpos()[0]))
        if tag in ('h2', 'h3') and self._in_heading is None: self._in_heading = tag; self._heading_text = ''
    def handle_endtag(self, tag):
        if tag == 'pre' and self._cur is not None:
            self.blocks.append(self._cur); self._cur = None
        if tag in ('h2', 'h3') and self._in_heading == tag:
            slug = re.sub(r'(^-|-$)', '', re.sub(r'[^a-z0-9]+', '-', self._heading_text.strip().lower()))
            self.ids.add(slug); self._in_heading = None
    def handle_data(self, data):
        if self._cur is not None: self._cur['text'] += data
        if self._in_heading: self._heading_text += data

def norm(s):
    return '\n'.join(l.rstrip() for l in s.replace('\r', '').split('\n')).rstrip() + '\n'

def check_file(path, tmp, all_files):
    problems = []
    src = open(path, encoding='utf-8').read()
    p = Collector(); p.feed(src)
    name = os.path.basename(path)
    outputs = {b['for']: b for b in p.blocks if b['kind'] == 'output' and b['for']}
    n_code = 0
    for b in p.blocks:
        if b['kind'] != 'code': continue
        if b['lang'] != 'cpp': continue
        n_code += 1
        text = b['text']
        if text.startswith('\n'): text = text[1:]
        if re.search(r'#include\s*\n', text) or re.search(r'#include\s*$', text):
            problems.append(f"{name}:{b['line']}: code block lost its '<' — escape < as &lt; inside <code>")
        check = b['check'] or 'run'
        if check == 'fragment': continue
        fname = b['file'] or f'block_{b["line"]}.cpp'
        label = f"{name}:{b['line']} [{fname}]"
        d = tempfile.mkdtemp(dir=tmp)
        srcpath = os.path.join(d, 'prog.cpp'); open(srcpath, 'w').write(text)
        exe = os.path.join(d, 'prog')
        flags = BASE_FLAGS + (SAN_FLAGS if check == 'run' else [])
        r = subprocess.run([CXX, *flags, srcpath, '-o', exe], capture_output=True, text=True)
        if check == 'error':
            if r.returncode == 0: problems.append(f"{label}: expected a compile ERROR but it compiled")
            continue
        if r.returncode != 0:
            problems.append(f"{label}: does not compile:\n" + '\n'.join('      ' + l for l in r.stderr.strip().split('\n')[:12]))
            continue
        if r.stderr.strip():
            problems.append(f"{label}: compiles with WARNINGS:\n" + '\n'.join('      ' + l for l in r.stderr.strip().split('\n')[:8]))
        if check == 'compile': continue
        try:
            run = subprocess.run([exe], capture_output=True, text=True, timeout=10, cwd=d, stdin=subprocess.DEVNULL)
        except subprocess.TimeoutExpired:
            problems.append(f"{label}: ran for >10 s (use data-check=\"compile\" for programs that loop or sleep)"); continue
        if run.returncode != 0:
            problems.append(f"{label}: exit code {run.returncode}:\n" + '\n'.join('      ' + l for l in (run.stderr or run.stdout).strip().split('\n')[:10]))
            continue
        exp = outputs.get(b['file'])
        if exp is not None:
            got, want = norm(run.stdout), norm(exp['text'].lstrip('\n'))
            if got != want:
                problems.append(f"{label}: output differs from the <pre class=\"output\"> block\n      want: {want!r}\n      got:  {got!r}")
    # links
    for href, line in p.links:
        if re.match(r'^[a-z]+:', href) or href.startswith('mailto:'): continue
        target, _, frag = href.partition('#')
        if target:
            tpath = os.path.normpath(os.path.join(os.path.dirname(path), target))
            if not os.path.exists(tpath):
                problems.append(f"{name}:{line}: broken link {href!r} (no such file)"); continue
            if frag and tpath.endswith('.html') and tpath in all_files:
                ids = all_files[tpath]
                if frag not in ids: problems.append(f"{name}:{line}: broken anchor {href!r}")
        elif frag and frag not in p.ids:
            problems.append(f"{name}:{line}: broken anchor {href!r}")
    return problems, n_code

def main():
    files = sys.argv[1:] or sorted(os.path.join(BOOK, f) for f in os.listdir(BOOK) if f.endswith('.html'))
    files = [os.path.abspath(f) for f in files]
    all_html = sorted(os.path.abspath(os.path.join(BOOK, f)) for f in os.listdir(BOOK) if f.endswith('.html'))
    all_ids = {}
    for f in all_html:
        c = Collector(); c.feed(open(f, encoding='utf-8').read()); all_ids[f] = c.ids
    total_problems = 0; total_code = 0
    with tempfile.TemporaryDirectory() as tmp:
        for f in files:
            probs, n = check_file(f, tmp, all_ids)
            total_code += n
            print(f"{'FAIL' if probs else 'ok  '} {os.path.basename(f)}  ({n} C++ blocks)")
            for pr in probs: print('   - ' + pr)
            total_problems += len(probs)
    print(f"\n{total_code} C++ blocks checked, {total_problems} problem(s)")
    sys.exit(1 if total_problems else 0)

if __name__ == '__main__':
    main()

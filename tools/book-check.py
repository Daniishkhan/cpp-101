#!/usr/bin/env python3
"""book-check.py — verify the books: every docs/book/weekN folder (Week 1, Week 3, ...).

For every chapter HTML file of every week (or the files and week folders given on the command line):
  * extracts every <pre class="code" data-lang="cpp"> block
  * data-check="run"      -> must compile (C++23, -Wall -Wextra, ASan+UBSan) AND run with exit 0 (10 s timeout)
  * data-check="compile"  -> must compile only (programs that sleep, wait for input, or loop forever)
  * data-check="error"    -> must FAIL to compile (deliberate teaching errors)
  * data-check="fragment" -> skipped (not a standalone program)
  * if a <pre class="output" data-for="FILE"> follows a "run" block, stdout must match it exactly
    (trailing whitespace on each line and at the end is ignored)
  * data-lang="cmake" / "shell" / "text" -> never compiled
  * checks that every internal link (href="*.html[#id]") points at an existing file and anchor,
    across weeks too (a Week 3 chapter may link to docs/book/week1/07-flat-grid.html#row-major),
    and that every stylesheet and script a page loads (<link href>, <script src>) exists
  * warns about code blocks that lost their '<' to HTML parsing (e.g. "#include " followed by newline)

Usage:  python3 tools/book-check.py                 # every chapter of every week
        python3 tools/book-check.py docs/book/week3     # one week
        python3 tools/book-check.py docs/book/week1/03-control-flow.html
Exit code 0 = all good, 1 = problems (listed).
"""
import html, os, re, subprocess, sys, tempfile
from html.parser import HTMLParser

BOOKS = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'docs', 'book'))
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
        if tag == 'link' and a.get('href'): self.links.append((a['href'], self.getpos()[0]))
        if tag == 'script' and a.get('src'): self.links.append((a['src'], self.getpos()[0]))
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

def week_dirs():
    """docs/book/week1, docs/book/week3, ... in week order."""
    names = [d for d in os.listdir(BOOKS) if re.fullmatch(r'week\d+', d) and os.path.isdir(os.path.join(BOOKS, d))]
    return [os.path.join(BOOKS, d) for d in sorted(names, key=lambda d: int(d[4:]))]

def chapters(folder):
    return sorted(os.path.join(folder, f) for f in os.listdir(folder) if f.endswith('.html'))

def label_of(path):
    """week3/01-structs.html for a chapter inside docs/book, else the plain file name."""
    rel = os.path.relpath(path, BOOKS)
    return rel.replace(os.sep, '/') if not rel.startswith('..') else os.path.basename(path)

def check_file(path, tmp, all_files):
    problems = []
    src = open(path, encoding='utf-8').read()
    p = Collector(); p.feed(src)
    name = label_of(path)
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
        target = target.partition('?')[0]       # assets/book.css?v=9 is the file assets/book.css
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
    files = []
    for arg in sys.argv[1:] or week_dirs():
        files += chapters(arg) if os.path.isdir(arg) else [arg]
    files = [os.path.abspath(f) for f in files]
    all_html = [os.path.abspath(f) for d in week_dirs() for f in chapters(d)]
    all_ids = {}
    for f in all_html:
        c = Collector(); c.feed(open(f, encoding='utf-8').read()); all_ids[f] = c.ids
    total_problems = 0; total_code = 0
    with tempfile.TemporaryDirectory() as tmp:
        for f in files:
            probs, n = check_file(f, tmp, all_ids)
            total_code += n
            print(f"{'FAIL' if probs else 'ok  '} {label_of(f)}  ({n} C++ blocks)")
            for pr in probs: print('   - ' + pr)
            total_problems += len(probs)
    print(f"\n{total_code} C++ blocks checked, {total_problems} problem(s)")
    sys.exit(1 if total_problems else 0)

if __name__ == '__main__':
    main()

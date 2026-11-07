#!/usr/bin/env python3
"""build-pages.py — build the static copy of the book that GitHub Pages serves.

Copies docs/book/ into OUT (default: build-pages/ at the repo root), so docs/book/week1/ becomes
OUT/week1/, and on the way:
  * rewrites every relative link that leaves docs/book/ (goal.md, docs/setup.md, the challenge
    README, ...) into a link to that file on GitHub, because the online copy holds only the book;
  * marks every page <html data-hosted="static">, so the tutor panel says the online copy has no
    tutor instead of looking for a server that is not there. The tutor needs tools/serve-book.py and
    your own API key on your own computer (docs/tutor.md); a key never goes into a published page;
  * leaves out the author files (assets/*.md, assets/TEMPLATE.html), which are not pages;
  * writes OUT/index.html, which lists every week's book and forwards to the newest one that has
    started. A book whose front page carries <meta name="book-week-starts" content="2026-11-23">
    is published at OUT/weekN/ straight away (so a spec ritual can read it), but the site root
    keeps forwarding to the week before it until that date. A front page without the tag counts as
    started. Today's date comes from the build machine (UTC on GitHub Actions); BOOK_TODAY=YYYY-MM-DD
    overrides it, for checking what the site will do on a given day.

The book workflow (.github/workflows/book.yml) rebuilds the site every Monday at 00:30 UTC (GitHub
sometimes starts a scheduled run late), so the forward moves on the morning a week starts. Any push
that touches the book, or a manual run of the workflow, moves it too.

The source files are never modified: opening the book from a file or with tools/serve-book.py works
exactly as before. Exit code 0 = built, 1 = a link pointed at something that does not exist.

Usage:  python3 tools/build-pages.py [OUT]
        python3 -m http.server 8766 --directory build-pages      # look at the result locally

GitHub Actions sets GITHUB_SERVER_URL, GITHUB_REPOSITORY and GITHUB_REF_NAME; outside Actions the
links point at https://github.com/Daniishkhan/cpp-101 on main.
"""
import datetime
import os
import posixpath
import re
import shutil
import sys

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
BOOK = 'docs/book'                      # repo-relative, with forward slashes
MARKER = '.build-pages'                 # proves an existing OUT folder is ours to replace
LEAVE_ALONE = ('#', '/', 'http:', 'https:', 'mailto:', 'data:', 'javascript:')
ATTR = re.compile(r'\b(href|src)="([^"]*)"')
STARTS = re.compile(r'<meta\s+name="book-week-starts"\s+content="(\d{4}-\d{2}-\d{2})"\s*/?>')
TITLE = re.compile(r'<title>([^<]*)</title>')


def is_author_file(rel):
    """Files under docs/book that are notes for whoever writes the book, not pages for readers."""
    parts = rel.split('/')
    return len(parts) >= 2 and parts[-2] == 'assets' and (rel.endswith('.md') or parts[-1] == 'TEMPLATE.html')


def prepare_out(out):
    """Refuse anything that is not a fresh folder or a previous build, then empty it."""
    if out == ROOT or ROOT.startswith(out + os.sep) or out.startswith(os.path.join(ROOT, BOOK)):
        sys.exit(f'build-pages: refusing to write into {out}')
    if os.path.exists(out):
        if os.listdir(out) and not os.path.exists(os.path.join(out, MARKER)):
            sys.exit(f'build-pages: {out} exists and was not made by this script; choose another folder')
        shutil.rmtree(out)
    os.makedirs(out)
    open(os.path.join(out, MARKER), 'w').close()


def rewrite_page(rel, text, base_url, ref, problems):
    """Point links that leave docs/book at GitHub; mark the page as statically hosted."""
    count = 0

    def fix(m):
        nonlocal count
        attr, value = m.group(1), m.group(2)
        if not value or value.startswith(LEAVE_ALONE):
            return m.group(0)
        path, hash_sign, fragment = value.partition('#')
        if not path:
            return m.group(0)
        target = posixpath.normpath(posixpath.join(posixpath.dirname(rel), path))
        if target == BOOK or target.startswith(BOOK + '/'):
            return m.group(0)                       # stays inside the published copy
        on_disk = os.path.join(ROOT, *target.split('/'))
        if target.startswith('..') or not os.path.exists(on_disk):
            problems.append(f'{rel}: {attr}="{value}" points at {target}, which is not in the repository')
            return m.group(0)
        kind = 'tree' if os.path.isdir(on_disk) else 'blob'
        count += 1
        return f'{attr}="{base_url}/{kind}/{ref}/{target}{hash_sign}{fragment}"'

    text = ATTR.sub(fix, text)
    text, marked = re.subn(r'<html\b', '<html data-hosted="static"', text, count=1)
    if not marked:
        problems.append(f'{rel}: no <html> tag, so the page cannot be marked as statically hosted')
    return text, count


def book_facts(book_dir, week):
    """(title, start date or None) from a week's index.html."""
    try:
        with open(os.path.join(book_dir, week, 'index.html'), encoding='utf-8') as f:
            text = f.read()
    except OSError:
        return week.replace('week', 'Week '), None
    title = TITLE.search(text)
    starts = STARTS.search(text)
    return (title.group(1).strip() if title else week.replace('week', 'Week '),
            datetime.date.fromisoformat(starts.group(1)) if starts else None)


def today():
    forced = os.environ.get('BOOK_TODAY')
    return datetime.date.fromisoformat(forced) if forced else datetime.datetime.now(datetime.timezone.utc).date()


def current_week(weeks, facts, on):
    """The newest week whose book has started on date `on` (the first week if none has)."""
    started = [w for w in weeks if facts[w][1] is None or facts[w][1] <= on]
    return started[-1] if started else weeks[0]


def write_index(out, weeks, facts, on):
    newest = current_week(weeks, facts, on)

    def item(w):
        title, starts = facts[w]
        label = f'{w.replace("week", "Week ")}: {title}'
        if starts and starts > on:
            label += f' (starts {starts.strftime("%a %d %b %Y")})'
        return f'    <li><a href="{w}/">{label}</a></li>'

    links = '\n'.join(item(w) for w in weeks)
    page = f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{facts[newest][0]}</title>
  <meta http-equiv="refresh" content="0; url={newest}/">
  <link rel="canonical" href="{newest}/">
  <style>
    :root {{ color-scheme: light dark; }}
    body {{ font: 18px/1.5 system-ui, sans-serif; max-width: 36rem; margin: 3rem auto; padding: 0 16px; }}
  </style>
</head>
<body>
  <h1>{facts[newest][0]}</h1>
  <p>Opening <a href="{newest}/">this week's book</a>. Every book:</p>
  <ul>
{links}
  </ul>
</body>
</html>
"""
    with open(os.path.join(out, 'index.html'), 'w') as f:
        f.write(page)


def main():
    out = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'build-pages'))
    server = os.environ.get('GITHUB_SERVER_URL', 'https://github.com')
    repo = os.environ.get('GITHUB_REPOSITORY', 'Daniishkhan/cpp-101')
    ref = os.environ.get('GITHUB_REF_NAME') or 'main'
    base_url = f'{server}/{repo}'
    book_dir = os.path.join(ROOT, *BOOK.split('/'))

    weeks = sorted((d for d in os.listdir(book_dir) if re.fullmatch(r'week\d+', d)), key=lambda d: int(d[4:]))
    if not weeks:
        sys.exit(f'build-pages: no week folders in {BOOK}')
    prepare_out(out)

    problems, pages, files, links = [], 0, 0, 0
    for dirpath, dirnames, filenames in os.walk(book_dir):
        dirnames[:] = sorted(d for d in dirnames if not d.startswith('.') and d != 'node_modules')
        for name in sorted(filenames):
            if name.startswith('.'):
                continue
            src = os.path.join(dirpath, name)
            rel = posixpath.join(BOOK, os.path.relpath(src, book_dir).replace(os.sep, '/'))
            if is_author_file(rel):
                continue
            dst = os.path.join(out, os.path.relpath(src, book_dir))
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            if name.endswith('.html'):
                with open(src, encoding='utf-8') as f:
                    text, n = rewrite_page(rel, f.read(), base_url, ref, problems)
                with open(dst, 'w', encoding='utf-8') as f:
                    f.write(text)
                pages += 1
                links += n
            else:
                shutil.copy2(src, dst)
                files += 1
    facts = {w: book_facts(book_dir, w) for w in weeks}
    on = today()
    write_index(out, weeks, facts, on)

    print(f'build-pages: {pages} pages and {files} other files into {out}; '
          f'{links} links now point at {base_url} ({ref}); '
          f'the site root opens {current_week(weeks, facts, on)} ({on.isoformat()})')
    for p in problems:
        print(f'  problem: {p}', file=sys.stderr)
    return 1 if problems else 0


if __name__ == '__main__':
    sys.exit(main())

// book.js — layout and reading tools for the Week 1 book. No dependencies.
// Builds: top bar, chapter sidebar, "On this page" outline, code-block headers with copy,
// reading settings (theme, text size, panels), progress tracking and keyboard shortcuts.
// Preferences themselves live in theme.js, which runs before the page paints.
(function () {
  'use strict';

  // ---------- chapter list (single source of truth for nav + progress) ----------
  const CHAPTERS = [
    ['00-start-here.html', 'Start here'],
    ['01-what-a-program-is.html', 'What a program is'],
    ['02-values-and-types.html', 'Values and types'],
    ['03-control-flow.html', 'Decisions and loops'],
    ['04-functions.html', 'Functions'],
    ['05-references-and-const.html', 'References and const'],
    ['06-vector.html', 'std::vector'],
    ['07-flat-grid.html', 'The flat grid'],
    ['08-strings-and-args.html', 'Strings, arguments, randomness'],
    ['09-terminal.html', 'The terminal'],
    ['10-headers-and-files.html', 'Headers and multiple files'],
    ['11-cmake.html', 'CMake and Ninja'],
    ['12-testing.html', 'Testing with doctest'],
    ['13-timing-and-benchmark.html', 'Timing and your first benchmark'],
    ['14-build-life.html', 'Build the Game of Life'],
    ['15-appendix.html', 'Appendix: errors, glossary, cheat sheet'],
    ['16-drills.html', 'Practice drills'],
  ];
  const PARTS = { 0: 'Orientation', 1: 'The language', 7: 'The shapes that matter', 9: 'The machine around the program', 10: 'Professional habits', 14: 'The challenge', 16: 'Practice' };
  const KEY = 'cpp101-week1-done';
  const here = location.pathname.split('/').pop() || 'index.html';
  const idx = CHAPTERS.findIndex(([f]) => f === here);
  const T = () => window.cppTheme;
  const isDrawer = () => window.matchMedia('(max-width: 959px)').matches;

  const ICON = {
    sidebar: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2.5" y="3.5" width="15" height="13" rx="2.5"/><path d="M7.5 3.5v13"/></svg>',
    outline: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M4 5.5h12M7 10h9M7 14.5h9"/></svg>',
    prev: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4.5L6.5 10l5.5 5.5"/></svg>',
    next: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4.5l5.5 5.5L8 15.5"/></svg>',
    copy: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="5.5" y="5.5" width="8" height="8" rx="1.8"/><path d="M10.5 5.5V4a1.5 1.5 0 0 0-1.5-1.5H4A1.5 1.5 0 0 0 2.5 4v5A1.5 1.5 0 0 0 4 10.5h1.5"/></svg>',
    check: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 8.5l3 3 6-7"/></svg>',
    out: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4.5l3.5 3.5L3 11.5M8.5 11.5H13"/></svg>',
  };
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  function doneSet() {
    try { return new Set(JSON.parse(localStorage.getItem(KEY) || '[]')); } catch (e) { return new Set(); }
  }
  function saveDone(set) { localStorage.setItem(KEY, JSON.stringify([...set])); document.dispatchEvent(new CustomEvent('done-change')); }
  function doneCount() { const d = doneSet(); return CHAPTERS.filter(([f]) => d.has(f)).length; }

  // ---------- top bar ----------
  function buildTopbar() {
    const bar = document.createElement('header');
    bar.className = 'topbar';
    const prev = CHAPTERS[idx - 1], next = CHAPTERS[idx + 1];
    const crumb = idx >= 0 ? `<b>${String(idx).padStart(2, '0')}</b> · ${esc(CHAPTERS[idx][1])}` : '';
    const navBtn = (c, dir) => c
      ? `<a class="icon-btn" href="${c[0]}" title="${dir === 'prev' ? 'Previous' : 'Next'}: ${esc(c[1])} (${dir === 'prev' ? '←' : '→'})" aria-label="${dir === 'prev' ? 'Previous' : 'Next'} chapter">${ICON[dir]}</a>`
      : `<span class="icon-btn" aria-disabled="true">${ICON[dir]}</span>`;
    bar.innerHTML =
      `<button class="icon-btn sidebar-toggle" type="button" title="Show or hide chapters ([)" aria-label="Toggle chapter list">${ICON.sidebar}</button>` +
      `<a class="brand" href="index.html"><span class="week">Week 1</span><span class="full">C++ from zero to Life</span></a>` +
      `<div class="crumb">${crumb}</div>` +
      (idx >= 0 ? navBtn(prev, 'prev') + navBtn(next, 'next') + '<span class="sep"></span>' : '<span class="spacer"></span>') +
      `<button class="icon-btn toc-toggle" type="button" title="Show or hide the outline (O)" aria-label="Toggle outline">${ICON.outline}</button>` +
      `<button class="icon-btn settings-btn" type="button" title="Reading settings (,)" aria-haspopup="dialog" aria-expanded="false"><span style="font-family:var(--serif);font-size:17px;letter-spacing:-.02em">Aa</span></button>` +
      `<div class="readbar"></div>`;
    document.body.prepend(bar);
    bar.querySelector('.sidebar-toggle').addEventListener('click', toggleSidebar);
    bar.querySelector('.toc-toggle').addEventListener('click', () => T() && T().setToc(T().getToc() === 'hidden' ? 'shown' : 'hidden'));
    bar.querySelector('.settings-btn').addEventListener('click', (e) => { e.stopPropagation(); togglePopover(); });
    syncToggles();
  }
  function syncToggles() {
    const sb = document.querySelector('.sidebar-toggle'), tc = document.querySelector('.toc-toggle');
    if (!T()) return;
    if (sb) sb.classList.toggle('active', isDrawer() ? document.documentElement.dataset.drawer === 'open' : T().getSidebar() === 'open');
    if (tc) tc.classList.toggle('active', T().getToc() === 'shown');
  }
  function toggleSidebar() {
    if (isDrawer()) {
      const open = document.documentElement.dataset.drawer === 'open';
      setDrawer(!open);
    } else if (T()) {
      T().setSidebar(T().getSidebar() === 'closed' ? 'open' : 'closed');
    }
    syncToggles();
  }
  function setDrawer(open) {
    const root = document.documentElement;
    let bd = document.querySelector('.drawer-backdrop');
    if (open) {
      root.dataset.drawer = 'open';
      if (!bd) { bd = document.createElement('div'); bd.className = 'drawer-backdrop'; bd.addEventListener('click', () => setDrawer(false)); document.body.appendChild(bd); }
    } else {
      delete root.dataset.drawer;
      if (bd) bd.remove();
    }
    syncToggles();
  }

  // reading progress bar + crumb visibility
  function watchScroll() {
    const bar = document.querySelector('.readbar'), crumb = document.querySelector('.crumb'), h1 = document.querySelector('main h1');
    let ticking = false;
    const update = () => {
      ticking = false;
      const max = document.documentElement.scrollHeight - innerHeight;
      if (bar) bar.style.width = (max > 0 ? Math.min(100, 100 * scrollY / max) : 0) + '%';
      if (crumb && h1) crumb.classList.toggle('show', h1.getBoundingClientRect().bottom < 60);
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  // ---------- sidebar ----------
  function buildSidebar() {
    const nav = document.querySelector('nav.sidebar');
    if (!nav) return;
    const done = doneSet();
    const n = doneCount();
    let html = `<div class="side-head"><div class="t">C++ from zero to Life</div><div class="s">Week 1 · Inference from games</div>` +
      `<div class="side-progress">${n} of ${CHAPTERS.length} done<div class="bar"><div style="width:${(100 * n / CHAPTERS.length).toFixed(0)}%"></div></div></div></div><ol>`;
    CHAPTERS.forEach(([file, title], i) => {
      if (PARTS[i]) html += `</ol><p class="part">${PARTS[i]}</p><ol>`;
      const cls = [file === here ? 'current' : '', done.has(file) ? 'done' : ''].join(' ').trim();
      html += `<li class="${cls}"><a href="${file}"${file === here ? ' aria-current="page"' : ''}><span class="n">${String(i).padStart(2, '0')}</span><span>${esc(title)}</span><span class="tick">${ICON.check}</span></a></li>`;
    });
    html += '</ol>';
    const keep = nav.scrollTop;
    nav.innerHTML = html;
    nav.scrollTop = keep;
    nav.addEventListener('click', (e) => { if (e.target.closest('a') && isDrawer()) setDrawer(false); });
  }
  function centreCurrentInSidebar() {
    const nav = document.querySelector('nav.sidebar'), cur = nav && nav.querySelector('li.current');
    if (cur) nav.scrollTop = cur.offsetTop - nav.clientHeight / 2 + cur.offsetHeight / 2;  // scrolls the sidebar only, never the page
  }

  // ---------- "On this page" outline ----------
  function buildToc() {
    const main = document.querySelector('main');
    const heads = [...document.querySelectorAll('main > h2')];
    if (!main || heads.length < 2) { document.querySelector('.toc-toggle')?.remove(); return; }
    const words = (main.innerText || '').split(/\s+/).length;
    const aside = document.createElement('aside');
    aside.className = 'toc';
    aside.setAttribute('aria-label', 'On this page');
    aside.innerHTML = `<p class="toc-title">On this page</p><p class="meta">About ${Math.max(1, Math.round(words / 230))} min of reading</p><ol>` +
      heads.map((h) => { const c = h.cloneNode(true); c.querySelectorAll('.anchor').forEach((a) => a.remove()); return `<li><a href="#${h.id}">${esc(c.textContent.trim())}</a></li>`; }).join('') +
      '</ol><div class="toc-actions"><a href="#" class="to-top">↑ Back to top</a>' +
      (idx >= 0 ? `<label><input type="checkbox" class="done-mirror"> Chapter done</label>` : '') + '</div>';
    document.body.appendChild(aside);
    aside.querySelector('.to-top').addEventListener('click', (e) => { e.preventDefault(); scrollTo({ top: 0, behavior: 'smooth' }); history.replaceState(null, '', location.pathname); });
    const links = new Map(heads.map((h) => [h, aside.querySelector(`a[href="#${CSS.escape(h.id)}"]`)]));
    const setActive = () => {
      let cur = heads[0];
      for (const h of heads) { if (h.getBoundingClientRect().top < 140) cur = h; else break; }
      links.forEach((a, h) => a.classList.toggle('active', h === cur));
    };
    let ticking = false;
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; setActive(); }); } }, { passive: true });
    setActive();
  }

  // ---------- end of chapter: done toggle + prev/next ----------
  function buildChapterEnd() {
    const main = document.querySelector('main');
    if (idx < 0 || !main) return;
    const box = document.createElement('label');
    box.className = 'done-box';
    box.innerHTML = `<input type="checkbox"> <span>Mark this chapter as done. Your progress is saved in this browser.</span>`;
    main.appendChild(box);
    const nav = document.createElement('div');
    nav.className = 'chapter-nav';
    const prev = CHAPTERS[idx - 1], next = CHAPTERS[idx + 1];
    nav.innerHTML = (prev ? `<a class="prev" href="${prev[0]}"><small>← Previous</small>${esc(prev[1])}</a>` : '') +
                    (next ? `<a class="next" href="${next[0]}"><small>Next →</small>${esc(next[1])}</a>` : `<a class="next" href="index.html"><small>Back to</small>Contents</a>`);
    main.appendChild(nav);
    const sync = () => {
      const d = doneSet().has(here);
      document.querySelectorAll('.done-box input, .done-mirror').forEach((i) => { i.checked = d; });
      box.classList.toggle('is-done', d);
    };
    document.addEventListener('change', (e) => {
      if (!e.target.matches('.done-box input, .done-mirror')) return;
      const d = doneSet(); e.target.checked ? d.add(here) : d.delete(here); saveDone(d);
    });
    document.addEventListener('done-change', () => { sync(); buildSidebar(); });
    sync();
  }

  // ---------- index page cards ----------
  function buildIndex() {
    const holder = document.querySelector('.toc-cards[data-auto]');
    if (!holder) return;
    const render = () => {
      const done = doneSet();
      holder.innerHTML = CHAPTERS.map(([file, title], i) => {
        const blurb = holder.dataset[`blurb${i}`] || '';
        return `<a href="${file}" class="${done.has(file) ? 'done' : ''}"><span class="n">${i === 16 ? 'Practice' : 'Chapter ' + String(i).padStart(2, '0')}</span><h3>${esc(title)}</h3><p>${blurb}</p></a>`;
      }).join('');
      const prog = document.querySelector('.progress');
      if (prog) {
        const n = doneCount();
        prog.innerHTML = `${n} of ${CHAPTERS.length} marked done<div class="bar"><div style="width:${(100 * n / CHAPTERS.length).toFixed(0)}%"></div></div>`;
      }
    };
    render();
    window.addEventListener('storage', (e) => { if (e.key === KEY) render(); });
  }

  // ---------- heading anchors ----------
  function anchors() {
    document.querySelectorAll('main h2, main h3').forEach((h) => {
      if (h.closest('.toc-cards')) return;
      if (!h.id) h.id = h.textContent.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const a = document.createElement('a'); a.className = 'anchor'; a.href = '#' + h.id; a.textContent = '#';
      a.setAttribute('aria-label', 'Link to this section');
      h.appendChild(a);
    });
  }

  // ---------- highlighting ----------
  const CPP_KW = new Set(('alignas alignof and asm auto break case catch class concept const consteval constexpr constinit const_cast continue co_await co_return co_yield decltype default delete do dynamic_cast else enum explicit export extern false for friend goto if inline mutable namespace new noexcept not nullptr operator or private protected public register reinterpret_cast requires return sizeof static static_assert static_cast struct switch template this thread_local throw true try typedef typeid typename union using virtual volatile while').split(' '));
  const CPP_TY = new Set('int bool char double float void long short unsigned signed size_t uint8_t uint16_t uint32_t uint64_t int8_t int16_t int32_t int64_t string vector span array string_view optional expected'.split(' '));

  function highlightCpp(src) {
    let out = '', i = 0;
    const n = src.length;
    while (i < n) {
      const c = src[i];
      // line comment
      if (c === '/' && src[i + 1] === '/') { let j = src.indexOf('\n', i); if (j < 0) j = n; out += `<span class="hl-cm">${esc(src.slice(i, j))}</span>`; i = j; continue; }
      // block comment
      if (c === '/' && src[i + 1] === '*') { let j = src.indexOf('*/', i + 2); j = j < 0 ? n : j + 2; out += `<span class="hl-cm">${esc(src.slice(i, j))}</span>`; i = j; continue; }
      // preprocessor (at line start)
      if (c === '#' && (i === 0 || src[i - 1] === '\n')) { let j = src.indexOf('\n', i); if (j < 0) j = n; out += `<span class="hl-pp">${esc(src.slice(i, j))}</span>`; i = j; continue; }
      // string / char literal
      if (c === '"' || c === "'") { let j = i + 1; while (j < n && src[j] !== c) { if (src[j] === '\\') j++; j++; } j++; out += `<span class="hl-str">${esc(src.slice(i, j))}</span>`; i = j; continue; }
      // number
      if (/[0-9]/.test(c) && !/[A-Za-z_]/.test(src[i - 1] || '')) { let j = i; while (j < n && /[0-9A-Za-z_.']/.test(src[j])) j++; out += `<span class="hl-num">${esc(src.slice(i, j))}</span>`; i = j; continue; }
      // identifier
      if (/[A-Za-z_]/.test(c)) {
        let j = i; while (j < n && /[A-Za-z0-9_]/.test(src[j])) j++;
        const w = src.slice(i, j);
        let k = j; while (k < n && src[k] === ' ') k++;
        if (CPP_KW.has(w)) out += `<span class="hl-kw">${w}</span>`;
        else if (CPP_TY.has(w)) out += `<span class="hl-ty">${w}</span>`;
        else if (src[k] === '(' && !(src[i-1] === ':' )) out += `<span class="hl-fn">${w}</span>`;
        else out += esc(w);
        i = j; continue;
      }
      out += esc(c); i++;
    }
    return out;
  }
  function highlightShell(src) {
    return src.split('\n').map((line) => {
      if (/^\$ /.test(line)) return `<span class="hl-prompt">$ </span>${esc(line.slice(2))}`;
      if (/^# /.test(line)) return `<span class="hl-cm">${esc(line)}</span>`;
      return `<span class="hl-cm">${esc(line)}</span>`;
    }).join('\n');
  }
  function highlightCmake(src) {
    return src.split('\n').map((line) => {
      if (/^\s*#/.test(line)) return `<span class="hl-cm">${esc(line)}</span>`;
      return esc(line).replace(/^(\s*)([a-z_]+)(\()/, '$1<span class="hl-fn">$2</span>$3').replace(/\$\{[^}]+\}/g, (m) => `<span class="hl-ty">${m}</span>`).replace(/\b(ON|OFF|PUBLIC|PRIVATE|INTERFACE|CXX|STREQUAL|NOT|Debug|Release)\b/g, '<span class="hl-kw">$1</span>');
    }).join('\n');
  }
  function highlightAll() {
    document.querySelectorAll('pre.code, pre.shell').forEach((pre) => {
      const code = pre.querySelector('code') || pre;
      const lang = pre.dataset.lang || (pre.classList.contains('shell') ? 'shell' : 'cpp');
      const raw = code.textContent.replace(/\n$/, '');
      if (lang === 'cpp') code.innerHTML = highlightCpp(raw);
      else if (lang === 'shell' || lang === 'bash') code.innerHTML = highlightShell(raw);
      else if (lang === 'cmake') code.innerHTML = highlightCmake(raw);
      else code.textContent = raw;
    });
  }


  // ---------- code blocks: header with language, file name, badge, copy; attach output ----------
  function copyText(pre) {
    const code = pre.querySelector('code') || pre;
    let text = code.textContent;
    if (pre.classList.contains('shell')) text = text.split('\n').filter((l) => /^\$ /.test(l)).map((l) => l.slice(2)).join('\n') || text;
    return text.replace(/\n$/, '');
  }
  function makeHead(lang, title, badge, pre) {
    const head = document.createElement('div');
    head.className = 'cb-head';
    head.innerHTML = `<span class="cb-lang">${lang}</span>` + (title ? `<span class="cb-title">${esc(title)}</span>` : '') + (badge || '');
    if (pre) {
      const btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'cb-copy'; btn.innerHTML = ICON.copy + '<span>Copy</span>';
      btn.title = pre.classList.contains('shell') ? 'Copy the commands (without the $)' : 'Copy the code';
      btn.addEventListener('click', () => {
        navigator.clipboard.writeText(copyText(pre)).then(() => {
          btn.querySelector('span').textContent = 'Copied'; setTimeout(() => (btn.querySelector('span').textContent = 'Copy'), 1300);
        });
      });
      head.appendChild(btn);
    }
    return head;
  }
  function wrapCodeBlocks() {
    const LANG = { cpp: 'C++', cmake: 'CMake', shell: 'Shell', bash: 'Shell', text: 'Text' };
    document.querySelectorAll('main pre.code, main pre.shell, main pre.output').forEach((pre) => {
      if (pre.parentElement.classList.contains('cb')) return;   // already attached as an output
      const wrap = document.createElement('div');
      pre.before(wrap);
      if (pre.classList.contains('output')) {
        wrap.className = 'cb cb-output';
        wrap.append(makeHead('Out', here === '16-drills.html' ? 'Expected output' : 'Output', '', null), pre);
        return;
      }
      const shell = pre.classList.contains('shell');
      const lang = shell ? 'Shell' : (LANG[pre.dataset.lang || 'cpp'] || pre.dataset.lang);
      const check = pre.dataset.check;
      let badge = '';
      if (check === 'error') badge = '<span class="cb-badge error">Does not compile, on purpose</span>';
      else if (check === 'fragment') badge = '<span class="cb-badge quiet">Excerpt</span>';
      wrap.className = 'cb ' + (shell ? 'cb-shell' : 'cb-code');
      wrap.append(makeHead(lang, shell ? 'Terminal' : (pre.dataset.file || ''), badge, pre), pre);
      // A following <pre class="output"> belongs to this block: show it underneath, in the same card.
      let next = wrap.nextElementSibling;
      if (next && next.matches('pre.output')) {
        const sub = document.createElement('div');
        sub.className = 'cb-sub';
        sub.innerHTML = ICON.out + (check === 'error' ? 'What the compiler says' : (shell ? 'What you see' : 'Output'));
        wrap.append(sub, next);
      }
    });
  }
  function wrapTables() {
    document.querySelectorAll('main table').forEach((t) => {
      if (t.parentElement.classList.contains('table-wrap')) return;
      const w = document.createElement('div'); w.className = 'table-wrap'; t.before(w); w.appendChild(t);
    });
  }
  function pills() {
    document.querySelectorAll('details.hint > summary, details.answer > summary').forEach((s) => {
      if (s.querySelector('.pill')) return;
      const isHint = s.parentElement.classList.contains('hint');
      const word = isHint ? 'Hint' : 'Answer';
      // A summary that only says "Answer" or "Show the answer" would repeat the pill: give it a plain label instead.
      const m = s.textContent.match(/^\s*(?:show(?: the| me the)?\s+)?(answer|solution|hint)s?\s*[.:]?\s*$/i);
      if (m) s.textContent = isHint ? 'Show a hint' : (m[1].toLowerCase() === 'solution' ? 'Show the solution' : 'Show the answer');
      const p = document.createElement('span');
      p.className = 'pill'; p.textContent = word;
      s.prepend(p);
    });
  }

  // ---------- reading settings popover ----------
  const SWATCH = { auto: ['linear-gradient(135deg,#fbf9f4 50%,#15161a 50%)', '#b4501e'], light: ['#fbf9f4', '#b4501e'], dark: ['#15161a', '#f0875a'], gruvbox: ['#1d2021', '#fabd2f'] };
  function buildPopover() {
    const pop = document.createElement('div');
    pop.className = 'popover'; pop.hidden = true; pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', 'Reading settings');
    document.body.appendChild(pop);
    pop.addEventListener('click', (e) => e.stopPropagation());
    document.addEventListener('click', () => { if (!pop.hidden) togglePopover(false); });
    renderPopover();
    document.addEventListener('prefs-change', () => { renderPopover(); syncToggles(); });
  }
  function renderPopover() {
    const pop = document.querySelector('.popover');
    const t = T();
    if (!pop || !t) return;
    const cur = t.get(), size = t.getSize(), tutorOn = getTutor() === 'on';
    pop.innerHTML =
      `<section><h4>Theme</h4><div class="theme-grid">` +
      t.THEMES.map((k) => `<button type="button" class="theme-opt" data-theme-opt="${k}" aria-pressed="${k === cur}">` +
        `<span class="sw" style="background:${SWATCH[k][0]};--sw-accent:${SWATCH[k][1]}"></span>` +
        `<span><span class="nm">${t.LABELS[k]}</span><br><span class="ds">${t.NOTES[k]}</span></span></button>`).join('') +
      `</div></section>` +
      `<section><h4>Text size</h4><div class="stepper"><button type="button" data-size="-1" aria-label="Smaller text">A−</button>` +
      `<span class="val">${size}px${size === t.SIZE.def ? ' · default' : ''}</span>` +
      `<button type="button" data-size="1" aria-label="Larger text">A+</button></div></section>` +
      `<section><h4>Layout</h4>` +
      `<label class="switch-row"><span>Chapter list</span><span class="switch"><input type="checkbox" data-pref="sidebar" ${t.getSidebar() === 'open' ? 'checked' : ''}><span></span></span></label>` +
      `<label class="switch-row"><span>On this page outline</span><span class="switch"><input type="checkbox" data-pref="toc" ${t.getToc() === 'shown' ? 'checked' : ''}><span></span></span></label>` +
      `</section>` +
      `<section><h4>Tutor</h4>` +
      `<label class="switch-row"><span>AI tutor</span><span class="switch"><input type="checkbox" data-pref="tutor" ${tutorOn ? 'checked' : ''}><span></span></span></label>` +
      `<p class="pop-note">${tutorOn ? 'Explains, gives analogies and hint rungs. Never writes your Life.' : 'Off: just the book.'}</p>` +
      `</section>` +
      `<section><h4>Keyboard</h4><div class="keys">` +
      `<kbd>←</kbd><span>Previous chapter</span><kbd>→</kbd><span>Next chapter</span>` +
      `<kbd>[</kbd><span>Show or hide the chapter list</span><kbd>O</kbd><span>Show or hide the outline</span>` +
      `<kbd>T</kbd><span>Next theme</span><kbd>+</kbd><span>Larger text (<kbd>−</kbd> smaller)</span>` +
      (tutorOn ? `<kbd>A</kbd><span>Open or close the tutor</span><kbd>${IS_MAC ? '⌘↵' : 'Ctrl↵'}</kbd><span>Explain the selected text</span>` : '') +
      `<kbd>,</kbd><span>This menu</span><kbd>Esc</kbd><span>Close</span></div></section>`;
    pop.querySelectorAll('[data-theme-opt]').forEach((b) => b.addEventListener('click', () => t.set(b.dataset.themeOpt)));
    pop.querySelectorAll('[data-size]').forEach((b) => b.addEventListener('click', () => t.setSize(t.getSize() + Number(b.dataset.size))));
    pop.querySelector('[data-pref="sidebar"]').addEventListener('change', (e) => { t.setSidebar(e.target.checked ? 'open' : 'closed'); });
    pop.querySelector('[data-pref="toc"]').addEventListener('change', (e) => { t.setToc(e.target.checked ? 'shown' : 'hidden'); });
    pop.querySelector('[data-pref="tutor"]').addEventListener('change', (e) => { setTutor(e.target.checked ? 'on' : 'off'); });
  }
  // The AI tutor switch (tutor.js does the rest). "off" means just the book: tutor.js hides everything it added.
  const TUTOR_KEY = 'cpp101-tutor';
  const IS_MAC = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || '');
  function getTutor() { try { return localStorage.getItem(TUTOR_KEY) === 'off' ? 'off' : 'on'; } catch (e) { return 'on'; } }
  function setTutor(v) {
    try { localStorage.setItem(TUTOR_KEY, v === 'off' ? 'off' : 'on'); } catch (e) {}
    document.dispatchEvent(new CustomEvent('prefs-change'));
  }
  function togglePopover(force) {
    const pop = document.querySelector('.popover'), btn = document.querySelector('.settings-btn');
    if (!pop) return;
    const open = force === undefined ? pop.hidden : force;
    pop.hidden = !open;
    if (btn) btn.setAttribute('aria-expanded', String(open));
    if (open) pop.querySelector('[aria-pressed="true"]')?.focus({ preventScroll: true });
  }

  // ---------- keyboard ----------
  function keys() {
    document.addEventListener('keydown', (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.target.matches('input, textarea, select, [contenteditable]')) return;
      const t = T();
      const prev = CHAPTERS[idx - 1], next = CHAPTERS[idx + 1];
      switch (e.key) {
        case 'ArrowLeft': if (idx >= 0 && prev) location.href = prev[0]; break;
        case 'ArrowRight': if (idx >= 0 && next) location.href = next[0]; break;
        case '[': case '\\': toggleSidebar(); break;
        case 'o': case 'O': if (t) t.setToc(t.getToc() === 'hidden' ? 'shown' : 'hidden'); break;
        case 't': case 'T': if (t) t.cycle(); break;
        case '+': case '=': if (t) t.setSize(t.getSize() + 1); break;
        case '-': case '_': if (t) t.setSize(t.getSize() - 1); break;
        case ',': togglePopover(); break;
        case 'Escape': togglePopover(false); setDrawer(false); break;
        default: return;
      }
    });
    window.matchMedia('(max-width: 959px)').addEventListener('change', () => { setDrawer(false); syncToggles(); });
  }

  // Shared with tutor.js (loaded after this file): the highlighter, the chapter list and where we are.
  window.cppBook = { highlightCpp, CHAPTERS, idx, here, esc, togglePopover };

  document.addEventListener('DOMContentLoaded', () => {
    highlightAll();
    wrapCodeBlocks();
    wrapTables();
    pills();
    anchors();
    buildTopbar();
    buildSidebar();
    buildIndex();
    buildChapterEnd();
    buildToc();
    buildPopover();
    keys();
    watchScroll();
    centreCurrentInSidebar();
    // Deep links: the sticky top bar must not cover the target heading.
    if (location.hash) { const el = document.getElementById(decodeURIComponent(location.hash.slice(1))); if (el) el.scrollIntoView(); }
  });
})();

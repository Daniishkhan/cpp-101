// tutor.js — the AI tutor that lives beside the Week 3 book. No dependencies, no build step.
// A copy of docs/book/week1/assets/tutor.js; what differs is marked "Week 3:". Keep the two in step.
// Loaded after book.js (both `defer`), so book.js's DOMContentLoaded handler, which builds the top bar,
// is registered first and runs first; this file's handler runs after it.
// Contract: docs/book/week1/assets/TUTOR-SPEC.md, section 3. The tutor explains and hands out hint
// rungs; it never writes the Life or Snake functions (CLAUDE.md). Model text is never inserted unescaped:
// renderMarkdown() escapes first, then adds a small, fixed set of tags.
(function () {
  'use strict';

  // =====================================================================
  // 1. Pure helpers (no DOM). Exported on window.cppTutor for tests.
  // =====================================================================
  function escHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // Inline markdown: `code`, **bold**, *italic*. Code spans are cut out first so nothing inside them
  // is touched, the rest is escaped, then the two emphasis forms become tags.
  function renderInline(src) {
    const codes = [];
    let t = String(src).replace(/\u0000/g, '').replace(/`([^`\n]+)`/g, (m, c) => {
      codes.push(c);
      return '\u0000' + (codes.length - 1) + '\u0000';
    });
    t = escHtml(t);
    t = t.replace(/\*\*(?=\S)([^*\n]*?\S)\*\*/g, '<strong>$1</strong>');
    t = t.replace(/(^|[^*\w\\])\*(?=[^\s*])([^*\n]*?[^\s*])\*(?![*\w])/g, '$1<em>$2</em>');
    t = t.replace(/(^|[^*\w\\])\*([^\s*])\*(?![*\w])/g, '$1<em>$2</em>');
    t = t.replace(/\u0000(\d+)\u0000/g, (m, i) => '<code>' + escHtml(codes[Number(i)]) + '</code>');
    return t;
  }

  const CPP_LANGS = /^(c\+\+|cpp|cxx|cc|c|h|hpp|hxx)$/;
  const LANG_LABEL = { sh: 'Shell', bash: 'Shell', zsh: 'Shell', shell: 'Shell', console: 'Shell', cmake: 'CMake', text: 'Text', txt: 'Text', plaintext: 'Text', output: 'Output', python: 'Python', py: 'Python', json: 'JSON' };
  const COPY_SVG = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="5.5" y="5.5" width="8" height="8" rx="1.8"/><path d="M10.5 5.5V4a1.5 1.5 0 0 0-1.5-1.5H4A1.5 1.5 0 0 0 2.5 4v5A1.5 1.5 0 0 0 4 10.5h1.5"/></svg>';

  function codeBlockHtml(code, lang, highlight) {
    const isCpp = !lang || CPP_LANGS.test(lang);
    const label = !lang ? 'Code' : (CPP_LANGS.test(lang) ? 'C++' : (LANG_LABEL[lang] || lang.toUpperCase()));
    const body = isCpp && typeof highlight === 'function' ? highlight(code) : escHtml(code);
    return `<div class="cb cb-code tutor-cb"><div class="cb-head"><span class="cb-lang">${escHtml(label)}</span>` +
      `<button type="button" class="cb-copy" data-tutor-copy="code" title="Copy the code">${COPY_SVG}<span>Copy</span></button></div>` +
      `<pre><code>${body}</code></pre></div>`;
  }

  const FENCE_OPEN = /^ {0,3}(`{3,}|~{3,})\s*([A-Za-z0-9+#._-]*)[^`]*$/;
  const LIST_ITEM = /^( *)([-*+]|\d{1,3}[.)])\s+(.*)$/;

  // Block markdown: paragraphs, ### headings, > quotes, - and 1. lists (nested by indentation),
  // fenced code (an unclosed fence, as while streaming, is still rendered as code), and --- rules.
  function renderMarkdown(src, highlight, depth) {
    depth = depth || 0;
    if (highlight === undefined) highlight = defaultHighlight();
    const lines = String(src == null ? '' : src).replace(/\u0000/g, '').replace(/\r\n?/g, '\n').replace(/\t/g, '    ').split('\n');
    let html = '', para = [], i = 0;
    const flush = () => { if (para.length) { html += '<p>' + para.map(renderInline).join('<br>') + '</p>'; para = []; } };
    while (i < lines.length) {
      const line = lines[i];
      let m;
      if ((m = line.match(FENCE_OPEN))) {
        flush();
        const ch = m[1][0], len = m[1].length, lang = m[2].toLowerCase();
        const close = new RegExp('^ {0,3}' + (ch === '`' ? '`' : '~') + '{' + len + ',}\\s*$');
        const body = [];
        i++;
        while (i < lines.length && !close.test(lines[i])) body.push(lines[i++]);
        i++;                                   // skip the closing fence (or run off the end)
        html += codeBlockHtml(body.join('\n'), lang, highlight);
        continue;
      }
      if (!line.trim()) { flush(); i++; continue; }
      if ((m = line.match(/^ {0,3}(#{1,6})\s+(.*?)\s*#*\s*$/))) {
        flush();
        const tag = m[1].length <= 2 ? 'h3' : 'h4';
        html += `<${tag}>${renderInline(m[2])}</${tag}>`;
        i++; continue;
      }
      if (/^ {0,3}([-*_])( *\1){2,} *$/.test(line)) { flush(); html += '<hr>'; i++; continue; }
      if (/^ {0,3}>/.test(line)) {
        flush();
        const q = [];
        while (i < lines.length && /^ {0,3}>/.test(lines[i])) q.push(lines[i++].replace(/^ {0,3}> ?/, ''));
        html += '<blockquote>' + (depth < 6 ? renderMarkdown(q.join('\n'), highlight, depth + 1) : '<p>' + renderInline(q.join(' ')) + '</p>') + '</blockquote>';
        continue;
      }
      if ((m = line.match(LIST_ITEM))) {
        flush();
        const r = parseList(lines, i, highlight, depth);
        html += r.html; i = r.next; continue;
      }
      para.push(line.trim());
      i++;
    }
    flush();
    return html;
  }

  function parseList(lines, i, highlight, depth) {
    const first = lines[i].match(LIST_ITEM);
    const base = first[1].length, ordered = /\d/.test(first[2]);
    const items = [];
    let cur = null, sawBlank = false;
    while (i < lines.length) {
      const line = lines[i];
      const m = line.match(LIST_ITEM);
      if (m && m[1].length <= base + 1 && (/\d/.test(m[2]) === ordered)) {
        cur = { lines: [m[3]], indent: m[1].length + m[2].length + 1 };
        items.push(cur); sawBlank = false; i++; continue;
      }
      if (m && m[1].length <= base + 1) break;                     // a list of the other kind starts
      if (!line.trim()) {
        // a blank line continues the list only if the next non-blank line is indented or another item
        let j = i + 1; while (j < lines.length && !lines[j].trim()) j++;
        if (j >= lines.length) break;
        const nm = lines[j].match(LIST_ITEM);
        const ind = lines[j].match(/^ */)[0].length;
        if (ind > base + 1 || (nm && nm[1].length <= base + 1 && /\d/.test(nm[2]) === ordered)) { cur.lines.push(''); sawBlank = true; i++; continue; }
        break;
      }
      const ind = line.match(/^ */)[0].length;
      if (ind > base + 1) { cur.lines.push(line.slice(Math.min(ind, cur.indent))); i++; continue; }
      if (!sawBlank && !FENCE_OPEN.test(line) && !/^ {0,3}(#|>)/.test(line)) { cur.lines.push(line.trim()); i++; continue; }  // lazy continuation
      break;
    }
    const start = ordered ? parseInt(first[2], 10) : 1;
    const tag = ordered ? 'ol' : 'ul';
    let html = `<${tag}${ordered && start !== 1 ? ` start="${start}"` : ''}>`;
    for (const it of items) {
      let inner = depth < 6 ? renderMarkdown(it.lines.join('\n'), highlight, depth + 1) : '<p>' + renderInline(it.lines.join(' ')) + '</p>';
      inner = inner.replace(/^<p>([\s\S]*?)<\/p>/, '$1');            // tight items: no paragraph margin
      html += `<li>${inner}</li>`;
    }
    return { html: html + `</${tag}>`, next: i };
  }

  function defaultHighlight() {
    const b = (typeof window !== 'undefined' && window.cppBook) || null;
    return b && typeof b.highlightCpp === 'function' ? b.highlightCpp : null;
  }

  // Server-sent events from a fetch() body. EventSource cannot POST, so this parses the stream by hand.
  // push() takes decoded text in arbitrary chunks (an event may be split anywhere, even inside "\n\n");
  // onEvent(name, data) is called once per complete event, with the JSON on its data line parsed.
  function createSSEParser(onEvent) {
    let buf = '';
    function dispatch(block) {
      let name = 'message';
      const data = [];
      for (const line of block.split(/\r\n|\r|\n/)) {
        if (!line || line[0] === ':') continue;
        const c = line.indexOf(':');
        const field = c < 0 ? line : line.slice(0, c);
        let val = c < 0 ? '' : line.slice(c + 1);
        if (val[0] === ' ') val = val.slice(1);
        if (field === 'event') name = val;
        else if (field === 'data') data.push(val);
      }
      if (!data.length) return;
      const raw = data.join('\n');
      let obj;
      try { obj = JSON.parse(raw); } catch (e) { obj = { text: raw }; }
      onEvent(name, obj);
    }
    return {
      push(chunk) {
        buf += chunk;
        let m;
        while ((m = /\r\n\r\n|\n\n|\r\r/.exec(buf))) {
          // "\r\n\r" at the very end may be the first half of "\r\n\r\n": wait for more.
          const block = buf.slice(0, m.index);
          buf = buf.slice(m.index + m[0].length);
          dispatch(block);
        }
      },
      end() { if (buf.trim()) dispatch(buf); buf = ''; },
    };
  }

  // ---------- prompts (the front end composes them, so the offline card can copy the very same text) ----------
  function contextLine(where) {
    // where: {chapter: 7 or -1, title, section}
    const sec = where.section ? `, section "${where.section}".` : '.';
    // Week 3: name the book, so a prompt copied into Claude Code says which week it is about.
    if (where.chapter == null || where.chapter < 0) return `I'm reading the front page of the Week 3 book (Snake)${sec}`;
    return `I'm reading chapter ${String(where.chapter).padStart(2, '0')}, "${where.title}", of the Week 3 book (Snake)${sec}`;
  }
  function quoteBlock(q) {
    if (q.code) {
      const body = q.text.replace(/\s+$/, '');
      const fence = /```/.test(body) ? '~~~' : '```';
      return fence + (q.lang || 'cpp') + '\n' + body + '\n' + fence;
    }
    return q.text.trim().split('\n').map((l) => ('> ' + l).trimEnd()).join('\n');
  }
  const QUIZ = 'ask me three short questions, one at a time, and wait for my answer before the next. Start with the first question only.';
  function composePrompt(kind, p) {
    const head = contextLine(p.where) + '\n\n';
    switch (kind) {
      case 'explain': return head + 'Explain this passage more simply, from first principles:\n\n' + quoteBlock(p.quote);
      case 'analogy': return head + 'Give me an everyday analogy for this passage, and say where the analogy breaks down:\n\n' + quoteBlock(p.quote);
      case 'ask': return head + p.question.trim() + '\n\nAbout this passage:\n\n' + quoteBlock(p.quote);
      case 'quiz': return head + (p.quizChapter ? `Quiz me on chapter ${p.quizChapter}: ` : 'Quiz me on this chapter: ') + QUIZ;
      case 'rung': {
        const n = p.rung, t = p.target;
        let s = head + `Hint ladder, rung ${n} of 4, for the ${t.type} "${t.title}".\n\nThe task as the book states it:\n\n` +
          t.text.trim().split('\n').map((l) => ('> ' + l).trimEnd()).join('\n');
        if (p.attempt && p.attempt.trim()) {
          const a = p.attempt.replace(/\s+$/, '');
          const fence = /```/.test(a) ? '~~~' : '```';
          s += '\n\nMy attempt or error:\n\n' + fence + '\n' + a + '\n' + fence;
        }
        return s + `\n\nGive me rung ${n} only.`;
      }
      default: return head + p.message.trim();
    }
  }

  // The last six messages before this one, text only, in the shape the server validates.
  function buildHistory(prior) {
    return prior.filter((m) => m && m.text && !m.error && !m.offline).slice(-6)
      .map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', text: String(m.text).slice(0, 4000) }));
  }

  function fmtMeta(ms, cost) {
    const parts = [];
    if (typeof ms === 'number' && ms >= 0) parts.push((ms / 1000).toFixed(1) + ' s');
    if (typeof cost === 'number' && cost >= 0) parts.push(cost > 0 && cost < 0.001 ? '<$0.001' : '$' + cost.toFixed(3));
    return parts.join(' · ');
  }

  const api = { escHtml, renderInline, renderMarkdown, createSSEParser, composePrompt, contextLine, quoteBlock, buildHistory, fmtMeta };
  if (typeof window !== 'undefined') window.cppTutor = api;
  if (typeof document === 'undefined') return;      // loaded by a test harness without a DOM

  // =====================================================================
  // 2. Storage
  // =====================================================================
  // Week 3: the conversations and rung counters are this book's own (both books share one origin);
  // the on/off switch, Think harder and the standing instructions are shared with Week 1.
  const BOOK_WEEK = 'week3';
  const K = { on: 'cpp101-tutor', think: 'cpp101-tutor-think', tell: 'cpp101-tutor-tell', chat: 'cpp101-tutor-chat:' + BOOK_WEEK + '/', rungs: 'cpp101-tutor-rungs:' + BOOK_WEEK };
  const MAX_MSGS = 40, TELL_MAX = 500, PROMPT_MAX = 12000;
  function read(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function write(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
  function readJSON(k, def) { try { const v = JSON.parse(read(k)); return v == null ? def : v; } catch (e) { return def; } }
  const isOn = () => read(K.on) !== 'off';

  // =====================================================================
  // 3. Page facts and state
  // =====================================================================
  const API = '/api/tutor';
  const IS_MAC = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || '');
  const ANCHOR_SEL = 'p, li, pre, h2, h3, td, .callout, blockquote';
  const EXCLUDE = '.tutor-panel, .tutor-sel, .tutor-rung, .tutor-marks, .cb-head, .cb-sub, .topbar, .popover';
  let B = {}, CHAPTERS = [], idx = -1, here = 'index.html';
  const DRILLS_PAGE = '';                       // Week 3: no drills page
  const BUILD_PAGE = '09-build-snake.html';     // Week 3: the milestones with rung buttons
  const pad = (n) => String(n).padStart(2, '0');

  const S = {
    on: true, open: false, msgs: [],
    status: { state: 'checking', model: '', reason: '' }, ready: null,
    ctrl: null, live: null, sel: null, selAsk: false, selY: 0, pointerDown: false,
    rungTarget: null, targets: [],
  };
  const $ = {};   // DOM references

  const ICON = {
    tutor: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4.2 4h11.6c.9 0 1.7.8 1.7 1.7v7c0 .9-.8 1.7-1.7 1.7H9.6L6 17.2v-2.8H4.2c-.9 0-1.7-.8-1.7-1.7v-7C2.5 4.8 3.3 4 4.2 4z"/><path d="M10 6.6l.75 1.65 1.65.75-1.65.75L10 11.4l-.75-1.65L7.6 9l1.65-.75z" stroke-width="1.2"/></svg>',
    close: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M5.5 5.5l9 9M14.5 5.5l-9 9"/></svg>',
    send: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M10 15.5v-11M5.5 9L10 4.5 14.5 9"/></svg>',
    stop: '<svg viewBox="0 0 20 20" fill="currentColor"><rect x="5.5" y="5.5" width="9" height="9" rx="2"/></svg>',
    chev: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4l4 4-4 4"/></svg>',
    copy: COPY_SVG,
  };

  // =====================================================================
  // 4. Small DOM helpers
  // =====================================================================
  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function headText(h) {
    const c = h.cloneNode(true);
    c.querySelectorAll('.anchor').forEach((a) => a.remove());
    return c.textContent.replace(/\s+/g, ' ').trim();
  }
  const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
  const isNarrow = () => window.matchMedia('(max-width: 559px)').matches;

  function copyText(text) {
    const fallback = () => {
      const ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
      document.body.appendChild(ta); ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      ta.remove();
      return ok;
    };
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text).then(() => true, () => fallback());
    return Promise.resolve(fallback());
  }
  function flashLabel(btn, label, back) {
    const span = btn.querySelector('span') || btn;
    span.textContent = label;
    clearTimeout(btn._t);
    btn._t = setTimeout(() => { span.textContent = back; }, 1400);
  }

  // where am I: chapter, and the nearest h2 before an element or at the top of the viewport
  function mainH2s() { return [...document.querySelectorAll('main > h2')]; }
  function sectionOf(node) {
    let cur = null;
    for (const h of mainH2s()) {
      if (h === node || (h.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING)) cur = h; else break;
    }
    return cur ? headText(cur) : '';
  }
  function viewportH2() {
    const hs = mainH2s();
    let cur = null;
    for (const h of hs) { if (h.getBoundingClientRect().top < 160) cur = h; else break; }
    return cur;
  }
  function whereFor(node) {
    return { chapter: idx, title: idx >= 0 ? CHAPTERS[idx][1] : '', section: node ? sectionOf(node) : (viewportH2() ? headText(viewportH2()) : '') };
  }

  // =====================================================================
  // 5. Conversation storage
  // =====================================================================
  function loadMsgs() {
    const v = readJSON(K.chat + here, []);
    return Array.isArray(v) ? v.filter((m) => m && (m.role === 'user' || m.role === 'assistant')) : [];
  }
  function saveMsgs() {
    const keep = S.msgs.slice(-MAX_MSGS).map((m) => {
      const c = Object.assign({}, m);
      delete c.thinking;
      if (c.pending) {           // saved mid-answer (the page is being left): keep what arrived
        delete c.pending;
        if (c.text) c.stopped = true; else c.error = 'This answer was interrupted when the page was left.';
      }
      return c;
    });
    write(K.chat + here, JSON.stringify(keep));
  }

  // =====================================================================
  // 6. Server status
  // =====================================================================
  function setStatus(st) {
    S.status = Object.assign({ model: '', reason: '' }, st);
    paintContext();
    if (!S.msgs.length) renderLog();                  // the empty state mentions offline mode
  }
  function checkStatus() {
    if (location.protocol === 'file:') { setStatus({ state: 'offline', reason: 'The book was opened from a file.' }); return Promise.resolve(); }
    // tools/build-pages.py marks the GitHub Pages copy: no server there, and no key ever goes into a page.
    if (document.documentElement.dataset.hosted === 'static') { setStatus({ state: 'offline', reason: 'This online copy of the book has no tutor. The tutor runs on your own computer: clone the repository and start the book with python3 tools/serve-book.py.' }); return Promise.resolve(); }
    if (S.status.state !== 'online') setStatus({ state: 'checking' });
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);
    return fetch(API + '/status', { cache: 'no-store', signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status))))
      .then((d) => {
        if (d && d.available) setStatus({ state: 'online', model: d.model || 'sonnet', provider: d.provider || 'claude', spent: d.spent_today_usd, budget: d.daily_budget_usd });
        else setStatus({ state: 'offline', reason: (d && d.reason) || 'Claude Code was not found.' });
      })
      .catch(() => setStatus({ state: 'offline', reason: 'This server has no tutor. Start the book with python3 tools/serve-book.py.' }))
      .finally(() => clearTimeout(timer));
  }

  // =====================================================================
  // 7. The panel
  // =====================================================================
  function buildButton() {
    const settings = document.querySelector('.topbar .settings-btn');
    if (!settings) return;
    const b = el('button', 'icon-btn tutor-btn');
    b.type = 'button'; b.title = 'Tutor (A)';
    b.setAttribute('aria-label', 'Tutor'); b.setAttribute('aria-expanded', 'false'); b.setAttribute('aria-controls', 'tutor-panel');
    b.innerHTML = ICON.tutor;
    b.addEventListener('click', (e) => { e.stopPropagation(); togglePanel(); });
    settings.before(b);
    $.btn = b;
  }

  function buildPanel() {
    const p = el('aside', 'tutor-panel');
    p.id = 'tutor-panel';
    p.setAttribute('aria-label', 'Tutor');
    p.innerHTML =
      `<div class="tp-head">` +
        `<div class="tp-titles"><div class="tp-name" role="heading" aria-level="2">Tutor</div><p class="tp-ctx"></p></div>` +
        `<div class="tp-actions">` +
          `<button type="button" class="tp-tbtn" data-act="copy" title="Copy the whole conversation as Markdown">${ICON.copy}<span>Copy</span></button>` +
          `<button type="button" class="tp-tbtn" data-act="clear" title="Clear this page's conversation">Clear</button>` +
          `<button type="button" class="icon-btn tp-close" data-act="close" title="Close (Esc)" aria-label="Close the tutor">${ICON.close}</button>` +
        `</div>` +
      `</div>` +
      `<div class="tp-controls">` +
        `<label class="switch-row tp-think"><span>Think harder <small>slower, more careful</small></span><span class="switch"><input type="checkbox" data-pref="think"><span></span></span></label>` +
        `<button type="button" class="tp-tell-toggle" aria-expanded="false" aria-controls="tp-tell">${ICON.chev}<span>Tell the tutor</span><span class="tp-tell-dot" hidden></span></button>` +
        `<div class="tp-tell" id="tp-tell" hidden>` +
          `<textarea rows="3" maxlength="${TELL_MAX}" placeholder="Be strict about hand-waving. Use kitchen analogies." aria-label="Standing instructions for the tutor"></textarea>` +
          `<div class="tp-tell-meta"><span>Sent with every question. It cannot switch off the tutor's rules.</span><span class="tp-count"></span></div>` +
        `</div>` +
      `</div>` +
      `<div class="tp-log" role="log" aria-live="polite" aria-relevant="additions"></div>` +
      `<div class="tp-rung" hidden></div>` +
      `<form class="tp-foot">` +
        `<textarea rows="1" maxlength="8000" placeholder="Ask about this chapter…" aria-label="Message the tutor"></textarea>` +
        `<button type="submit" class="tp-send" title="Send (Enter)" aria-label="Send">${ICON.send}</button>` +
      `</form>`;
    document.body.appendChild(p);
    $.panel = p;
    $.ctx = p.querySelector('.tp-ctx');
    $.log = p.querySelector('.tp-log');
    $.rung = p.querySelector('.tp-rung');
    $.form = p.querySelector('.tp-foot');
    $.input = $.form.querySelector('textarea');
    $.send = $.form.querySelector('.tp-send');
    $.think = p.querySelector('[data-pref="think"]');
    $.tellBtn = p.querySelector('.tp-tell-toggle');
    $.tellBox = p.querySelector('.tp-tell');
    $.tell = $.tellBox.querySelector('textarea');
    $.count = p.querySelector('.tp-count');
    $.tellDot = p.querySelector('.tp-tell-dot');
    p.inert = true;

    p.addEventListener('click', (e) => e.stopPropagation());
    p.querySelector('[data-act="close"]').addEventListener('click', () => closePanel());
    p.querySelector('[data-act="copy"]').addEventListener('click', (e) => {
      const b = e.currentTarget;
      copyText(conversationMarkdown()).then((ok) => flashLabel(b, ok ? 'Copied' : 'Copy failed', 'Copy'));
    });
    const clear = p.querySelector('[data-act="clear"]');
    clear.addEventListener('click', () => {
      if (!S.msgs.length) return;
      if (!clear.classList.contains('confirm')) {
        clear.classList.add('confirm'); clear.textContent = 'Clear all?';
        clearTimeout(clear._t);
        clear._t = setTimeout(() => { clear.classList.remove('confirm'); clear.textContent = 'Clear'; }, 3000);
        return;
      }
      clearTimeout(clear._t); clear.classList.remove('confirm'); clear.textContent = 'Clear';
      stop();
      S.msgs = []; saveMsgs(); renderLog(); placeMarks();
    });

    // Think harder + Tell the tutor
    $.think.checked = read(K.think) === '1';
    $.think.addEventListener('change', () => write(K.think, $.think.checked ? '1' : null));
    $.tell.value = (read(K.tell) || '').slice(0, TELL_MAX);
    const syncTell = () => {
      $.count.textContent = `${$.tell.value.length} / ${TELL_MAX}`;
      $.tellDot.hidden = !$.tell.value.trim();
    };
    $.tell.addEventListener('input', () => { write(K.tell, $.tell.value.slice(0, TELL_MAX) || null); syncTell(); });
    $.tellBtn.addEventListener('click', () => {
      const open = $.tellBox.hidden;
      $.tellBox.hidden = !open;
      $.tellBtn.setAttribute('aria-expanded', String(open));
      if (open) $.tell.focus();
    });
    syncTell();

    // composer
    const grow = () => { $.input.style.height = 'auto'; $.input.style.height = Math.min($.input.scrollHeight, 200) + 'px'; syncSend(); };
    $.input.addEventListener('input', grow);
    $.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && e.keyCode !== 229) { e.preventDefault(); $.form.requestSubmit ? $.form.requestSubmit() : submitComposer(); }
    });
    $.form.addEventListener('submit', (e) => { e.preventDefault(); submitComposer(); });
    // While an answer streams the button is Stop; Enter in the box still sends (which stops the old answer).
    $.send.addEventListener('click', (e) => { if (S.ctrl) { e.preventDefault(); stop(); } });
    $.grow = grow;

    // delegated clicks inside the log: code copy, answer copy, quote chips, retry, offline copy, chips
    $.log.addEventListener('click', onLogClick);
    paintContext();
    syncSend();
  }

  function submitComposer() {
    const text = $.input.value.trim();
    if (!text) return;
    $.input.value = ''; $.grow();
    send('chat', { prompt: composePrompt('chat', { where: whereFor(null), message: text }), say: text });
  }
  function syncSend() {
    if (!$.send) return;
    const streaming = !!S.ctrl;
    $.send.innerHTML = streaming ? ICON.stop : ICON.send;
    $.send.classList.toggle('stop', streaming);
    $.send.title = streaming ? 'Stop the answer' : 'Send (Enter)';
    $.send.setAttribute('aria-label', streaming ? 'Stop' : 'Send');
    $.send.disabled = !streaming && !$.input.value.trim();
  }

  // "Anthropic API · Opus 5.5 · $0.12 of $5 today" or "Claude Code (sonnet)".
  function providerLabel(st) {
    if (st.provider !== 'anthropic') return `Claude Code (${st.model || 'sonnet'})`;
    const m = String(st.model || '').replace(/^claude-/, '').replace(/-(\d+)-(\d+)$/, ' $1.$2').replace(/-(\d+)$/, ' $1');
    const name = m ? m.charAt(0).toUpperCase() + m.slice(1) : 'Claude';
    const money = typeof st.spent === 'number' && typeof st.budget === 'number'
      ? ` · $${st.spent.toFixed(2)} of $${st.budget.toFixed(0)} today` : '';
    return `Anthropic API · ${name}${money}`;
  }
  function paintContext() {
    if (!$.ctx) return;
    const where = idx >= 0 ? `Chapter ${pad(idx)} · ${CHAPTERS[idx][1]}` : 'Front page';
    const st = S.status;
    let line;
    if (st.state === 'online') line = `${where} · ${providerLabel(st)}`;
    else if (st.state === 'checking') line = `${where} · connecting…`;
    else line = 'Offline: prompts are copied for Claude Code';
    $.ctx.textContent = line;
    $.ctx.title = st.state === 'offline' ? st.reason : '';
    $.ctx.classList.toggle('offline', st.state === 'offline');
  }

  function openPanel(focus) {
    if (!S.on || !$.panel) return;
    if (!S.open) {
      S.open = true;
      $.panel.inert = false;
      $.panel.classList.add('open');
      document.documentElement.dataset.tutorOpen = '';
      if ($.btn) { $.btn.setAttribute('aria-expanded', 'true'); $.btn.classList.add('active'); }
      if (!S.msgs.length) renderLog();                 // starter chips follow the viewport
      scrollLogToEnd(true);
      if (S.status.state === 'offline' && location.protocol !== 'file:') S.ready = checkStatus();
    }
    if (focus && !isNarrow()) $.input.focus({ preventScroll: true });
  }
  function closePanel() {
    if (!S.open) return;
    S.open = false;
    $.panel.classList.remove('open');
    $.panel.inert = true;
    delete document.documentElement.dataset.tutorOpen;
    if ($.btn) { $.btn.setAttribute('aria-expanded', 'false'); $.btn.classList.remove('active'); }
    if ($.panel.contains(document.activeElement) && $.btn) $.btn.focus({ preventScroll: true });
  }
  function togglePanel(focus) { if (S.open) closePanel(); else openPanel(focus !== false); }

  // ---------- the log ----------
  const KIND_LABEL = { explain: 'Explain simpler', analogy: 'Analogy', ask: 'Ask', quiz: 'Quiz', chat: '' };
  function kindLabel(m) {
    if (m.kind === 'rung') return m.target ? `Rung ${m.target.rung} of 4` : 'Hint rung';
    return KIND_LABEL[m.kind] || '';
  }

  function renderLog() {
    if (!$.log) return;
    $.log.textContent = '';
    if (!S.msgs.length) { $.log.appendChild(emptyState()); return; }
    S.msgs.forEach((m, i) => $.log.appendChild(renderMsg(m, i)));
  }

  function emptyState() {
    const box = el('div', 'tp-empty');
    box.appendChild(el('p', 'tp-empty-lede', idx >= 0
      ? 'Ask about anything in this chapter. Or select a sentence or a line of code and choose Explain simpler.'
      : 'Ask how to use the book, or where to begin.'));
    box.appendChild(el('p', 'tp-empty-rule', 'The tutor explains, gives analogies and hands out hint rungs. It never writes your Snake functions.'));
    const chips = el('div', 'tp-chips');
    for (const c of starters()) {
      const b = el('button', 'tp-chip', c.label);
      b.type = 'button';
      b.addEventListener('click', () => c.run());
      chips.appendChild(b);
    }
    box.appendChild(chips);
    if (S.status.state === 'offline') box.appendChild(el('p', 'tp-empty-off', 'Offline: each question becomes a prompt you can copy into Claude Code.'));
    return box;
  }

  function starters() {
    const chat = (label, message) => ({ label, run: () => send('chat', { prompt: composePrompt('chat', { where: whereFor(null), message: message || label }), say: message || label }) });
    if (idx < 0) return [chat('Where should I start?'), chat('How do I use this book?')];
    if (here === DRILLS_PAGE) {
      const ch = drillChapter();
      return [
        { label: "I'm stuck on a drill", run: () => {
          const d = nearestDrill();
          $.input.value = d ? `I'm stuck on the drill "${d}". ` : "I'm stuck on a drill: ";
          $.grow(); $.input.focus();
          $.input.setSelectionRange($.input.value.length, $.input.value.length);
        } },
        { label: ch ? `Quiz me on chapter ${ch.n}` : 'Quiz me on a chapter', run: () => {
          const c = drillChapter();
          const what = c ? `${c.n}, "${c.title}"` : '';
          send('quiz', { prompt: composePrompt('quiz', { where: whereFor(null), quizChapter: what }), say: c ? `Quiz me on chapter ${c.n}` : 'Quiz me' });
        } },
      ];
    }
    return [
      { label: 'Quiz me on this chapter', run: () => send('quiz', { prompt: composePrompt('quiz', { where: whereFor(null) }), say: 'Quiz me on this chapter' }) },
      chat('What should I be able to explain now?'),
      chat('Explain the hardest idea here with an analogy'),
    ];
  }
  function drillChapter() {
    const h = viewportH2() || mainH2s()[0];
    const m = h && headText(h).match(/chapter\s+(\d{1,2})/i);
    if (!m) return null;
    const n = parseInt(m[1], 10);
    return { n: pad(n), title: CHAPTERS[n] ? CHAPTERS[n][1] : '' };
  }
  function nearestDrill() {
    let cur = null;
    for (const h of document.querySelectorAll('main > h3')) { if (h.getBoundingClientRect().top < 200) cur = h; else break; }
    return cur ? headText(cur) : '';
  }

  function renderMsg(m, i) {
    const box = el('div', 'tm ' + (m.role === 'user' ? 'tm-user' : 'tm-tutor'));
    box.dataset.i = String(i);
    const who = el('div', 'tm-who', m.role === 'user' ? 'You' : 'Tutor');
    const kl = m.role === 'user' ? kindLabel(m) : '';
    if (kl) who.appendChild(el('span', 'tm-kind', kl));
    box.appendChild(who);
    if (m.role === 'user') {
      if (m.target) box.appendChild(el('div', 'tm-target', m.target.type === 'milestone' ? m.target.title : 'Drill · ' + m.target.title));
      const q = m.anchor ? m.anchor.q : m.quote;
      if (q) {
        const chip = el(m.anchor ? 'button' : 'span', 'tm-quote', '“' + q + (q.length >= 80 ? '…' : '') + '”');
        if (m.anchor) { chip.type = 'button'; chip.title = 'Show this passage in the chapter'; chip.dataset.jump = String(i); }
        box.appendChild(chip);
      }
      if (m.say) box.appendChild(el('div', 'tm-text', m.say));
      if (m.attempt) box.appendChild(el('pre', 'tm-attempt', m.attempt));
      return box;
    }
    // tutor
    if (m.offline) { box.appendChild(offlineCard(i)); return box; }
    const think = el('div', 'tm-think'); think.hidden = true; box.appendChild(think);
    const md = el('div', 'tutor-md'); box.appendChild(md);
    md.innerHTML = renderMarkdown(m.text);   // escaped inside renderMarkdown
    if (m.thoughtMs && !m.pending) paintThinkDone(think, m);
    if (m.withheld && m.withheld.length) {
      box.appendChild(el('p', 'tm-withheld', m.withheld.length === 1
        ? 'The guard held back one code block because it looked like one of your challenge functions.'
        : `The guard held back ${m.withheld.length} code blocks because they looked like your challenge functions.`));
    }
    if (m.stopped) box.appendChild(el('p', 'tm-withheld', 'Stopped.'));
    if (m.error) {
      const err = el('div', 'callout trap tm-error');
      err.appendChild(el('span', 'label', 'The tutor could not answer'));
      err.appendChild(el('p', null, m.error));
      if (i === S.msgs.length - 1 && i > 0 && S.msgs[i - 1].role === 'user') {
        const r = el('button', 'tp-btn', 'Retry'); r.type = 'button'; r.dataset.retry = String(i);
        err.appendChild(r);
      }
      box.appendChild(err);
    }
    if (!m.pending && (m.text || m.ms != null)) {
      const foot = el('div', 'tm-foot');
      foot.appendChild(el('span', 'tm-meta', fmtMeta(m.ms, m.cost)));
      if (m.text) {
        const c = el('button', 'tm-copy'); c.type = 'button'; c.dataset.copyMsg = String(i);
        c.innerHTML = ICON.copy + '<span>Copy</span>'; c.title = 'Copy this answer as Markdown';
        foot.appendChild(c);
      }
      box.appendChild(foot);
    }
    return box;
  }

  function offlineCard(i) {
    const card = el('div', 'tm-offline');
    const user = S.msgs[i - 1];
    const prompt = user && user.role === 'user' ? user.text : '';
    card.appendChild(el('div', 'tm-off-title', 'Prompt ready to copy'));
    card.appendChild(el('pre', 'tm-off-prompt', prompt));
    const row = el('div', 'tm-off-row');
    const b = el('button', 'tp-btn primary'); b.type = 'button'; b.dataset.copyPrompt = String(i - 1);
    b.innerHTML = ICON.copy + '<span>Copy prompt</span>';
    row.appendChild(b);
    card.appendChild(row);
    const p = el('p', 'tm-off-note');
    p.append('Paste this into Claude Code in VS Code (it follows this repo\'s tutor rules), or start the book with ');
    p.appendChild(el('code', null, 'python3 tools/serve-book.py'));
    p.append(' to ask here.');
    card.appendChild(p);
    return card;
  }

  function onLogClick(e) {
    const t = e.target.closest('button');
    if (!t || !$.log.contains(t)) return;
    if (t.dataset.tutorCopy === 'code') {
      const pre = t.closest('.cb') && t.closest('.cb').querySelector('pre');
      if (pre) copyText(pre.textContent).then((ok) => flashLabel(t, ok ? 'Copied' : 'Failed', 'Copy'));
    } else if (t.dataset.copyMsg) {
      const m = S.msgs[Number(t.dataset.copyMsg)];
      if (m) copyText(m.text).then((ok) => flashLabel(t, ok ? 'Copied' : 'Failed', 'Copy'));
    } else if (t.dataset.copyPrompt) {
      const m = S.msgs[Number(t.dataset.copyPrompt)];
      if (m) copyText(m.text).then((ok) => flashLabel(t, ok ? 'Copied' : 'Copy failed', 'Copy prompt'));
    } else if (t.dataset.retry) {
      const j = Number(t.dataset.retry);
      if (S.ctrl || j !== S.msgs.length - 1) return;
      S.msgs.splice(j, 1);
      run(j - 1);
    } else if (t.dataset.jump) {
      const m = S.msgs[Number(t.dataset.jump)];
      const block = m && m.anchor ? resolveAnchor(m.anchor) : null;
      if (block) {
        if (isNarrow()) closePanel();
        const target = block.closest('.cb') || block;
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        flash(target);
      } else {
        flashLabel(t, 'That passage is no longer on this page', t.textContent);
      }
    } else if (t.classList.contains('tm-think-toggle')) {
      const box = t.parentElement.querySelector('.tm-think-body');
      if (box) { box.hidden = !box.hidden; t.setAttribute('aria-expanded', String(!box.hidden)); }
    }
  }

  // Scroll the log only (scrollIntoView would also scroll the page, sideways too on a phone).
  function scrollLogTo(node) {
    const lr = $.log.getBoundingClientRect(), nr = node.getBoundingClientRect();
    const top = $.log.scrollTop + (nr.top - lr.top) - Math.max(0, (lr.height - nr.height) / 2);
    $.log.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  }
  function isNearEnd() { return !$.log || $.log.scrollHeight - $.log.scrollTop - $.log.clientHeight < 80; }
  function scrollLogToEnd(force) {
    if (!$.log) return;
    if (force || isNearEnd()) $.log.scrollTop = $.log.scrollHeight;
  }

  function conversationMarkdown() {
    const title = idx >= 0 ? `Chapter ${pad(idx)}, ${CHAPTERS[idx][1]}` : "The book's front page";
    let out = `# Tutor conversation: ${title}\n\n`;
    for (const m of S.msgs) {
      if (m.role === 'user') out += `**You**${kindLabel(m) ? ` (${kindLabel(m)})` : ''}:\n\n${m.text}\n\n`;
      else if (!m.offline) out += `**Tutor**:\n\n${m.text || ''}${m.error ? `\n\n_Error: ${m.error}_` : ''}\n\n`;
    }
    return out.trim() + '\n';
  }

  // =====================================================================
  // 8. Sending and streaming
  // =====================================================================
  function send(kind, opts) {
    if (!S.on) return;
    if (S.ctrl) stop();
    openPanel(false);
    let prompt = opts.prompt;
    if (prompt.length > PROMPT_MAX) prompt = prompt.slice(0, PROMPT_MAX - 20) + '\n\n(cut short)';
    const user = { role: 'user', kind, text: prompt, say: opts.say || '' };
    if (opts.anchor) user.anchor = opts.anchor;
    else if (opts.quote) user.quote = opts.quote;
    if (opts.target) user.target = opts.target;
    if (opts.attempt) user.attempt = opts.attempt;
    S.msgs.push(user);
    run(S.msgs.length - 1);
    placeMarks();
  }

  function run(userIndex) {
    const user = S.msgs[userIndex];
    const history = buildHistory(S.msgs.slice(0, userIndex));
    S.msgs.length = userIndex + 1;                     // anything after it is replaced
    const a = { role: 'assistant', kind: user.kind, text: '', pending: true };
    S.msgs.push(a);
    renderLog(); scrollLogToEnd(true);
    const ready = S.ready || Promise.resolve();
    // While the status check is in flight the answer shows "Thinking"; then go online or offline.
    const box = $.log.lastElementChild;
    startLive(a, box);
    ready.then(() => {
      if (S.msgs[S.msgs.length - 1] !== a) {            // cleared, or overtaken by a newer question
        if (S.live && S.live.msg === a) stopLive();
        if (S.msgs.includes(a)) {
          delete a.pending; a.stopped = true; saveMsgs();
          const i = S.msgs.indexOf(a), old = $.log.querySelector(`.tm[data-i="${i}"]`);
          if (old) old.replaceWith(renderMsg(a, i));
        }
        return;
      }
      if (S.status.state !== 'online') {
        stopLive();
        delete a.pending; a.offline = true;
        if (user.kind === 'rung' && user.target) bumpRung(user.target);
        saveMsgs(); renderLog(); scrollLogToEnd(true);
        return;
      }
      stream(a, user, history);
    });
  }

  function startLive(a, box) {
    stopLive();
    S.live = { msg: a, box, t0: performance.now(), thinking: '', textStarted: false, raf: 0, timer: 0, thinkOpen: false };
    const L = S.live;
    L.timer = setInterval(() => paintThink(), 500);
    paintThink();
  }
  function stopLive() {
    if (!S.live) return;
    clearInterval(S.live.timer);
    cancelAnimationFrame(S.live.raf);
    S.live = null;
  }

  // "Thinking · 3 s" with a pulsing dot; a collapsible block once thinking text arrives;
  // "Thought for 5 s" (collapsed) once the answer starts.
  function paintThink() {
    const L = S.live;
    if (!L || !L.box) return;
    const think = L.box.querySelector('.tm-think');
    if (!think) return;
    const secs = Math.max(0, Math.round((performance.now() - L.t0) / 1000));
    if (L.textStarted && !L.thinking) { think.hidden = true; return; }
    think.hidden = false;
    let toggle = think.querySelector('.tm-think-toggle');
    if (!toggle) {
      think.textContent = '';
      toggle = el('button', 'tm-think-toggle'); toggle.type = 'button'; toggle.setAttribute('aria-expanded', 'false');
      think.appendChild(toggle);
      const body = el('div', 'tm-think-body'); body.hidden = true; think.appendChild(body);
    }
    const label = L.textStarted ? `Thought for ${Math.max(1, Math.round((L.msg.thoughtMs || 0) / 1000))} s` : `Thinking · ${secs} s`;
    toggle.classList.toggle('live', !L.textStarted);
    toggle.classList.toggle('has-body', !!L.thinking);
    toggle.disabled = !L.thinking;
    toggle.innerHTML = (L.textStarted ? '' : '<span class="tm-pulse" aria-hidden="true"></span>') + (L.thinking ? ICON.chev : '') + '<span></span>';
    toggle.lastChild.textContent = label;
    const body = think.querySelector('.tm-think-body');
    if (L.thinking) body.textContent = L.thinking;
    toggle.setAttribute('aria-expanded', String(!body.hidden));
  }
  function paintThinkDone(think, m) {
    if (!m.thinking) return;   // thinking text is not kept after a reload; nothing to expand
    think.hidden = false;
    const toggle = el('button', 'tm-think-toggle has-body'); toggle.type = 'button'; toggle.setAttribute('aria-expanded', 'false');
    toggle.innerHTML = ICON.chev + '<span></span>';
    toggle.lastChild.textContent = `Thought for ${Math.max(1, Math.round(m.thoughtMs / 1000))} s`;
    const body = el('div', 'tm-think-body', m.thinking); body.hidden = true;
    think.append(toggle, body);
  }

  function scheduleText() {
    const L = S.live;
    if (!L || L.raf) return;
    L.raf = requestAnimationFrame(() => {
      L.raf = 0;
      const md = L.box && L.box.querySelector('.tutor-md');
      const follow = isNearEnd();                            // measured before the answer grows
      if (md) md.innerHTML = renderMarkdown(L.msg.text);    // escaped inside renderMarkdown
      if (follow) scrollLogToEnd(true);
    });
  }

  function httpMessage(status, msg) {
    if (status === 429) return msg || 'The tutor is already answering two questions. Wait for one to finish, then retry.';
    if (status === 403) return 'The book server refused the request (403). Open the book at http://localhost:PORT, not through another address.';
    if (status === 404) return 'This server has no tutor. Restart the book with python3 tools/serve-book.py.';
    return msg || `The book server answered with an error (${status}).`;
  }

  async function stream(a, user, history) {
    const ctrl = new AbortController();
    S.ctrl = ctrl; syncSend();
    const L = S.live;
    const body = {
      kind: user.kind, prompt: user.text, history,
      think: read(K.think) === '1', chapter: BOOK_WEEK + '/' + here,   // Week 3: say which book
      tell: (read(K.tell) || '').slice(0, TELL_MAX),
    };
    let finished = false;
    const onEvent = (name, d) => {
      d = d || {};
      if (name === 'meta') { if (d.model) { S.status.model = d.model; paintContext(); } }
      else if (name === 'thinking') { if (L) { L.thinking += d.text || ''; a.thinking = L.thinking; paintThink(); } }
      else if (name === 'text') {
        if (L && !L.textStarted) { L.textStarted = true; if (L.thinking) a.thoughtMs = performance.now() - L.t0; paintThink(); }
        a.text += d.text || '';
        scheduleText();
      }
      else if (name === 'withheld') { (a.withheld = a.withheld || []).push(String(d.reason || '')); }
      else if (name === 'done') {
        finished = true;
        a.ms = typeof d.ms === 'number' ? d.ms : Math.round(performance.now() - (L ? L.t0 : 0));
        if (typeof d.cost_usd === 'number') a.cost = d.cost_usd;
        if (typeof d.spent_today_usd === 'number') { S.status.spent = d.spent_today_usd; paintContext(); }
        if (user.kind === 'rung' && user.target) bumpRung(user.target);
      }
      else if (name === 'error') { finished = true; a.error = String(d.message || 'Something went wrong.'); }
    };
    try {
      const res = await fetch(API + '/ask', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body), signal: ctrl.signal, cache: 'no-store',
      });
      if (!res.ok) {
        let msg = '';
        try { msg = (await res.json()).error || ''; } catch (e) { msg = ''; }
        a.error = httpMessage(res.status, msg);
      } else if (!res.body || !res.body.getReader) {
        onEventsFromText(await res.text(), onEvent);
      } else {
        const parser = createSSEParser(onEvent);
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          parser.push(dec.decode(value, { stream: true }));
        }
        parser.push(dec.decode());
        parser.end();
      }
      if (!finished && !a.error) a.error = 'The answer stopped before it finished (the connection closed). Try again.';
    } catch (err) {
      if (err && err.name === 'AbortError') a.stopped = true;
      else a.error = 'Could not reach the book server. Is python3 tools/serve-book.py still running?';
    }
    if (S.ctrl === ctrl) S.ctrl = null;
    if (S.live && S.live.msg === a) stopLive();
    delete a.pending;
    if (S.msgs.includes(a)) {
      saveMsgs();
      const i = S.msgs.indexOf(a);
      const old = $.log.querySelector(`.tm[data-i="${i}"]`);
      const follow = isNearEnd();
      const fresh = renderMsg(a, i);
      if (old) old.replaceWith(fresh); else $.log.appendChild(fresh);
      if (follow) scrollLogToEnd(true);
    }
    syncSend();
  }
  function onEventsFromText(text, onEvent) { const p = createSSEParser(onEvent); p.push(text); p.end(); }

  function stop() { if (S.ctrl) S.ctrl.abort(); }

  // =====================================================================
  // 9. Selection menu
  // =====================================================================
  function buildMenu() {
    const m = el('div', 'tutor-sel');
    m.setAttribute('role', 'toolbar'); m.setAttribute('aria-label', 'Ask the tutor about the selection');
    m.hidden = true;
    m.innerHTML =
      `<div class="ts-row">` +
        `<button type="button" data-sel="explain" title="Explain simpler (${IS_MAC ? '⌘↵' : 'Ctrl+Enter'})">Explain simpler <kbd>${IS_MAC ? '⌘↵' : 'Ctrl↵'}</kbd></button>` +
        `<button type="button" data-sel="analogy">Analogy</button>` +
        `<button type="button" data-sel="ask">Ask…</button>` +
      `</div>` +
      `<form class="ts-ask" hidden><input type="text" maxlength="500" placeholder="Ask about this passage…" aria-label="Your question about the selected text">` +
        `<button type="submit" aria-label="Send">${ICON.send}</button></form>`;
    document.body.appendChild(m);
    $.menu = m;
    $.menuAsk = m.querySelector('.ts-ask');
    $.menuInput = $.menuAsk.querySelector('input');
    // keep the page selection alive when a button is pressed
    m.addEventListener('mousedown', (e) => { if (!e.target.closest('input')) e.preventDefault(); });
    m.addEventListener('click', (e) => {
      e.stopPropagation();
      const b = e.target.closest('[data-sel]');
      if (!b || !S.sel) return;
      if (b.dataset.sel === 'ask') {
        S.selAsk = true; S.selY = scrollY;
        m.querySelector('.ts-row').hidden = true;
        $.menuAsk.hidden = false;
        $.menuInput.value = '';
        placeMenu(S.sel.rect);
        $.menuInput.focus({ preventScroll: true });
      } else act(b.dataset.sel, S.sel);
    });
    $.menuAsk.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = $.menuInput.value.trim();
      if (q && S.sel) act('ask', S.sel, q);
    });
  }

  function snapshot() {
    const main = document.querySelector('main');
    const sel = window.getSelection && window.getSelection();
    if (!main || !sel || !sel.rangeCount || sel.isCollapsed) return null;
    const raw = sel.toString();
    const trimmed = raw.trim();
    if (trimmed.length < 2 || trimmed.length > 2000) return null;
    const range = sel.getRangeAt(0);
    const common = range.commonAncestorContainer;
    const ce = common.nodeType === 1 ? common : common.parentElement;
    if (!ce || !main.contains(ce) || ce.closest(EXCLUDE)) return null;
    const sc = range.startContainer;
    const startEl = (sc.nodeType === 1 ? (sc.childNodes[range.startOffset] && sc.childNodes[range.startOffset].nodeType === 1 ? sc.childNodes[range.startOffset] : sc) : sc.parentElement) || ce;
    const pre = ce.closest('pre');
    let lang = 'cpp';
    if (pre) lang = pre.dataset.lang || (pre.classList.contains('shell') ? 'sh' : pre.classList.contains('output') ? 'text' : 'cpp');
    if (lang === 'shell' || lang === 'bash') lang = 'sh';
    let block = startEl.closest(ANCHOR_SEL);
    if (block && !main.contains(block)) block = null;
    if (!block) block = ce.closest(ANCHOR_SEL);
    const text = pre ? raw.replace(/^\n+|\s+$/g, '') : trimmed.replace(/[ \t ]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{3,}/g, '\n\n');
    let anchor = null;
    if (block && main.contains(block)) {
      const i = anchorBlocks().indexOf(block);
      if (i >= 0) anchor = { i, q: norm(text).slice(0, 80) };
    }
    const rects = range.getClientRects();
    let rect = range.getBoundingClientRect();
    if ((!rect.width && !rect.height) && rects.length) rect = rects[0];
    return { text, code: !!pre, lang, anchor, rect, where: whereFor(block || ce) };
  }

  function evaluateSelection() {
    if (!S.on || S.selAsk) return;
    const snap = snapshot();
    if (!snap) { hideMenu(); return; }
    S.sel = snap;
    showMenu(snap.rect);
  }
  function showMenu(rect) {
    const m = $.menu;
    m.querySelector('.ts-row').hidden = false;
    $.menuAsk.hidden = true;
    m.hidden = false;
    placeMenu(rect);
  }
  function placeMenu(rect) {
    const m = $.menu;
    m.style.visibility = 'hidden';
    m.style.left = '0px'; m.style.top = '0px';
    const w = m.offsetWidth, h = m.offsetHeight;
    const topbar = (document.querySelector('.topbar') || { offsetHeight: 56 }).offsetHeight;
    const coarse = window.matchMedia('(pointer: coarse)').matches;   // phones put their own menu above
    let top = coarse ? rect.bottom + 10 : rect.top - h - 10;
    if (!coarse && top < topbar + 6) top = rect.bottom + 10;
    if (top + h > innerHeight - 6) top = Math.max(topbar + 6, rect.top - h - 10);
    let left = rect.left + rect.width / 2 - w / 2;
    left = Math.max(8, Math.min(left, innerWidth - w - 8));
    m.style.left = Math.round(left) + 'px';
    m.style.top = Math.round(top) + 'px';
    m.style.visibility = '';
  }
  function hideMenu() {
    if (!$.menu || $.menu.hidden) return;
    $.menu.hidden = true;
    S.selAsk = false;
    if ($.menu.contains(document.activeElement)) document.activeElement.blur();
  }
  const menuVisible = () => $.menu && !$.menu.hidden;

  function act(kind, snap, question) {
    hideMenu();
    S.sel = null;
    const p = { where: snap.where, quote: snap, question };
    const say = kind === 'ask' ? question : '';
    send(kind, { prompt: composePrompt(kind, p), say, anchor: snap.anchor, quote: norm(snap.text).slice(0, 80) });
    const s = window.getSelection && window.getSelection();
    if (s) s.removeAllRanges();
  }

  function wireSelection() {
    let t = 0;
    document.addEventListener('selectionchange', () => {
      if (!S.on || S.pointerDown || S.selAsk) return;
      clearTimeout(t);
      t = setTimeout(evaluateSelection, 180);
    });
    document.addEventListener('pointerdown', (e) => {
      if ($.menu && $.menu.contains(e.target)) return;
      S.pointerDown = true;
      hideMenu();
    }, true);
    document.addEventListener('pointerup', (e) => {
      if (!S.pointerDown) return;
      S.pointerDown = false;
      if ($.menu && $.menu.contains(e.target)) return;
      setTimeout(evaluateSelection, 10);
    }, true);
    document.addEventListener('pointercancel', () => { S.pointerDown = false; }, true);
    addEventListener('scroll', () => {
      if (!menuVisible()) return;
      if (!S.selAsk || Math.abs(scrollY - S.selY) > 60) hideMenu();
    }, { passive: true });
    addEventListener('resize', () => hideMenu());
  }

  // =====================================================================
  // 10. Margin marks
  // =====================================================================
  let _blocks = null;
  function anchorBlocks() {
    if (!_blocks) { const main = document.querySelector('main'); _blocks = main ? [...main.querySelectorAll(ANCHOR_SEL)] : []; }
    return _blocks;
  }
  function resolveAnchor(a) {
    const blocks = anchorBlocks();
    const probe = norm(a.q || '').slice(0, 40);
    const b = blocks[a.i];
    if (b && (!probe || norm(b.textContent).includes(probe))) return b;
    if (!probe) return null;
    return blocks.find((x) => norm(x.textContent).includes(probe)) || null;
  }
  function buildMarks() {
    const layer = el('div', 'tutor-marks');
    layer.setAttribute('aria-label', 'Passages you asked the tutor about');
    document.body.appendChild(layer);
    $.marks = layer;
    layer.addEventListener('click', (e) => {
      const b = e.target.closest('.tutor-mark');
      if (!b) return;
      e.stopPropagation();
      openPanel(false);
      const node = $.log.querySelector(`.tm[data-i="${b.dataset.i}"]`);
      if (node) { scrollLogTo(node); flash(node); }
    });
    const main = document.querySelector('main');
    if (main && window.ResizeObserver) new ResizeObserver(() => placeMarks()).observe(main);
    addEventListener('resize', () => placeMarks());
    document.addEventListener('toggle', () => placeMarks(), true);
  }
  let _marksRaf = 0;
  function placeMarks() {
    if (!$.marks || _marksRaf) return;
    _marksRaf = requestAnimationFrame(() => {
      _marksRaf = 0;
      const layer = $.marks, main = document.querySelector('main');
      layer.textContent = '';
      if (!S.on || !main) return;
      const latest = new Map();          // block -> index of the latest user turn anchored there
      S.msgs.forEach((m, i) => {
        if (m.role !== 'user' || !m.anchor) return;
        const b = resolveAnchor(m.anchor);
        if (b) latest.set(b, i);
      });
      if (!latest.size) return;
      const mr = main.getBoundingClientRect();
      const contentLeft = mr.left + parseFloat(getComputedStyle(main).paddingLeft || '0');
      latest.forEach((i, block) => {
        const target = block.closest('.cb') || block;
        const r = target.getBoundingClientRect();
        if (!r.height) return;                         // inside a closed <details>
        const left = Math.min(contentLeft, r.left) - 22 + scrollX;
        const top = r.top + scrollY + Math.min(r.height / 2, 16) - 10;
        const dot = el('button', 'tutor-mark');
        dot.type = 'button'; dot.dataset.i = String(i);
        dot.title = 'You asked the tutor about this passage';
        dot.setAttribute('aria-label', 'Open the tutor at your question about this passage');
        dot.style.left = Math.max(2, left) + 'px'; dot.style.top = top + 'px';
        layer.appendChild(dot);
      });
    });
  }
  function flash(node) {
    node.classList.remove('tutor-flash');
    void node.offsetWidth;
    node.classList.add('tutor-flash');
    setTimeout(() => node.classList.remove('tutor-flash'), 1700);
  }

  // =====================================================================
  // 11. Rung buttons (drills and milestones)
  // =====================================================================
  function rungKey(t) { return here + '#' + t.id; }
  function nextRung(t) {
    const r = readJSON(K.rungs, {});
    const n = parseInt(r && r[rungKey(t)], 10);
    return n >= 1 && n <= 5 ? n : 1;
  }
  function setRung(t, n) {
    const r = readJSON(K.rungs, {}) || {};
    if (n <= 1) delete r[rungKey(t)]; else r[rungKey(t)] = Math.min(5, n);
    write(K.rungs, JSON.stringify(r));
    syncRungButtons();
  }
  function bumpRung(target) {
    const t = S.targets.find((x) => x.id === target.id) || target;
    setRung(t, Math.max(nextRung(t), Math.min(5, (target.rung || 1) + 1)));
  }

  function sectionNodes(head, stopTags) {
    const out = [];
    let n = head.nextElementSibling;
    while (n && !stopTags.includes(n.tagName)) { out.push(n); n = n.nextElementSibling; }
    return out;
  }
  function findTargets() {
    const main = document.querySelector('main');
    if (!main) return [];
    let heads = [];
    if (here === DRILLS_PAGE) heads = [...main.querySelectorAll(':scope > h3')].map((h) => ({ h, type: 'drill', stop: ['H1', 'H2', 'H3'] }));
    else if (here === BUILD_PAGE) heads = [...main.querySelectorAll(':scope > h2')].filter((h) => /^Milestone\s+\d+/i.test(headText(h))).map((h) => ({ h, type: 'milestone', stop: ['H1', 'H2'] }));
    return heads.filter((x) => x.h.id).map(({ h, type, stop }) => {
      const nodes = sectionNodes(h, stop);
      let after = null;
      for (const n of nodes) if (n.matches('details.hint') || n.querySelector('details.hint')) after = n;
      if (!after) after = nodes.length ? nodes[nodes.length - 1] : h;
      if (after.matches('.done-box, .chapter-nav')) after = h;
      const wrap = el('div', 'tutor-rung');
      const btn = el('button', 'tr-btn'); btn.type = 'button';
      const reset = el('button', 'tr-reset', 'reset'); reset.type = 'button'; reset.title = 'Start this hint ladder again from rung 1';
      wrap.append(btn, reset);
      after.after(wrap);
      const t = { id: h.id, title: headText(h), type, head: h, stop, wrap, btn, reset };
      btn.addEventListener('click', () => openRungCard(t));
      reset.addEventListener('click', () => setRung(t, 1));
      return t;
    });
  }
  function syncRungButtons() {
    for (const t of S.targets) {
      const n = nextRung(t);
      if (n > 4) {
        t.btn.textContent = 'No rung 5: reread the chapter, or ask for a review';
        t.btn.disabled = true;
      } else {
        t.btn.textContent = `Ask the tutor for rung ${n} of 4`;
        t.btn.disabled = false;
      }
      t.reset.hidden = n <= 1;
      t.wrap.classList.toggle('spent', n > 4);
    }
    if (S.rungTarget && $.rung && !$.rung.hidden) paintRungCard();
  }

  // The visible statement of the drill or milestone. Every details.answer is removed first: hidden
  // solutions are never sent. Book chrome (code headers, pills, anchors, our button) goes too.
  function targetText(t) {
    const parts = [];
    for (const n of sectionNodes(t.head, t.stop)) {
      if (n.matches('details.answer, .tutor-rung')) continue;
      const c = n.cloneNode(true);
      c.querySelectorAll('details.answer, .tutor-rung, .cb-head, .cb-sub, .anchor, .pill, script, style').forEach((x) => x.remove());
      let s;
      if (c.matches('.cb') || c.matches('pre')) s = (c.querySelector('pre') || c).textContent.replace(/\s+$/, '');
      else if (c.matches('ul, ol')) s = [...c.children].map((li) => '- ' + norm(li.textContent)).join('\n');
      else if (c.matches('details.hint')) s = 'Hint: ' + norm(c.textContent);
      else s = norm(c.textContent);
      if (s) parts.push(s);
    }
    let text = parts.join('\n\n');
    if (text.length > 6000) text = text.slice(0, 6000).replace(/\s+\S*$/, '') + ' …';
    return text;
  }

  function openRungCard(t) {
    if (!S.on || nextRung(t) > 4) return;
    S.rungTarget = t;
    paintRungCard();
    $.rung.hidden = false;
    openPanel(false);
    if (!isNarrow()) $.rung.querySelector('textarea').focus({ preventScroll: true });
  }
  function paintRungCard() {
    const t = S.rungTarget, n = nextRung(t);
    const box = $.rung;
    box.textContent = '';
    const head = el('div', 'tr-head');
    head.appendChild(el('span', 'tr-pill', `Rung ${Math.min(n, 4)} of 4`));
    head.appendChild(el('span', 'tr-kind', t.type === 'milestone' ? 'Milestone' : 'Drill'));
    const x = el('button', 'icon-btn tr-x'); x.type = 'button'; x.innerHTML = ICON.close; x.setAttribute('aria-label', 'Cancel'); x.title = 'Cancel';
    x.addEventListener('click', closeRungCard);
    head.appendChild(x);
    box.appendChild(head);
    box.appendChild(el('div', 'tr-title', t.title));
    box.appendChild(el('p', 'tr-note', ['Rung 1 says where to look.', 'Rung 2 gives the idea in words.', 'Rung 3 gives the shape: loops, variables, what to test.', 'Rung 4 is a worked example on a different problem.'][Math.min(n, 4) - 1]));
    const ta = el('textarea', 'tr-attempt');
    ta.rows = 4; ta.maxLength = 5000; ta.placeholder = 'Paste your code or the error (optional)';
    ta.setAttribute('aria-label', 'Your code or the error (optional)');
    box.appendChild(ta);
    const row = el('div', 'tr-actions');
    row.appendChild(el('span', 'tr-keys', IS_MAC ? '⌘↵ sends' : 'Ctrl+Enter sends'));
    const go = el('button', 'tp-btn primary', 'Send'); go.type = 'button';
    row.appendChild(go);
    box.appendChild(row);
    const fire = () => {
      const rung = nextRung(t);
      if (rung > 4) return;
      const attempt = ta.value.replace(/\s+$/, '');
      const target = { id: t.id, title: t.title, type: t.type, rung };
      const prompt = composePrompt('rung', { where: whereFor(t.head), rung, target: { type: t.type, title: t.title, text: targetText(t) }, attempt });
      closeRungCard();
      send('rung', { prompt, target, attempt, say: '' });
    };
    go.addEventListener('click', fire);
    ta.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); fire(); }
    });
  }
  function closeRungCard() { S.rungTarget = null; if ($.rung) { $.rung.hidden = true; $.rung.textContent = ''; } }

  // =====================================================================
  // 12. Keyboard, preferences, start-up
  // =====================================================================
  function wireKeys() {
    // Capture phase, so this runs before book.js's own handler (which closes its popover on Escape).
    window.addEventListener('keydown', (e) => {
      if (!S.on) return;
      const tgt = e.target;
      const typing = !!(tgt && tgt.matches && tgt.matches('input, textarea, select, [contenteditable], [contenteditable] *'));
      const inTutor = !!(tgt && tgt.closest && tgt.closest('.tutor-panel, .tutor-sel'));
      if (e.key === 'Escape') {
        if (menuVisible()) { hideMenu(); e.preventDefault(); return; }
        if (tgt && tgt.closest && tgt.closest('.tp-rung')) { e.preventDefault(); closeRungCard(); $.input.focus({ preventScroll: true }); return; }
        const pop = document.querySelector('.popover');
        if (pop && !pop.hidden) return;                                  // book.js closes its menu first
        if (S.open && (!typing || inTutor)) { e.preventDefault(); closePanel(); }
        return;
      }
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey) {
        if (typing) return;
        const snap = (menuVisible() && !S.selAsk && S.sel) || snapshot();
        if (snap) { e.preventDefault(); act('explain', snap); }
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey || typing) return;
      if (e.key === 'a' || e.key === 'A') { e.preventDefault(); togglePanel(true); }
    }, true);
  }

  function applyOn() {
    const on = isOn();
    S.on = on;
    document.documentElement.dataset.tutor = on ? 'on' : 'off';
    if (!on) { stop(); closePanel(); hideMenu(); closeRungCard(); }
    else if (!S.ready) S.ready = checkStatus();
    placeMarks();
  }

  function init() {
    B = window.cppBook || {};
    CHAPTERS = B.CHAPTERS || [];
    idx = typeof B.idx === 'number' ? B.idx : -1;
    here = B.here || location.pathname.split('/').pop() || 'index.html';
    if (S.started || !document.querySelector('header.topbar')) return;   // book.js did not run: stay out of the way
    S.started = true;
    S.msgs = loadMsgs();
    // A message left "pending" by a reload mid-answer: keep its text, mark it unfinished.
    buildButton();
    buildPanel();
    buildMenu();
    buildMarks();
    S.targets = findTargets();
    syncRungButtons();
    wireSelection();
    wireKeys();
    document.addEventListener('click', (e) => { if (menuVisible() && !$.menu.contains(e.target)) hideMenu(); });
    document.addEventListener('prefs-change', applyOn);
    addEventListener('pagehide', () => { if (S.ctrl) saveMsgs(); });
    applyOn();
    renderLog();
    placeMarks();
  }

  // A deferred script runs while readyState is already "interactive" but before DOMContentLoaded, and
  // book.js builds the top bar in its own DOMContentLoaded handler. That handler was registered first
  // (book.js executes first), so it runs before ours. Only start at once if the bar already exists.
  if (document.querySelector('header.topbar')) init();
  else document.addEventListener('DOMContentLoaded', init);
})();

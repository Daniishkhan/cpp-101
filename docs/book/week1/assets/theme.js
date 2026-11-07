// theme.js — runs in <head> BEFORE the page paints, so nothing jumps or flashes.
// Applies the reader's saved preferences (stored in this browser, shared by every chapter):
//   theme      auto | light | dark | gruvbox   -> <html data-theme>
//   text size  15..24 px                       -> <html style="--text-size">
//   sidebar    open | closed                   -> <html data-sidebar>
//   outline    shown | hidden                  -> <html data-toc>
(function () {
  'use strict';
  var K = { theme: 'cpp101-theme', size: 'cpp101-text-size', sidebar: 'cpp101-sidebar', toc: 'cpp101-toc' };
  var THEMES = ['auto', 'light', 'dark', 'gruvbox'];
  var LABELS = { auto: 'Auto', light: 'Light', dark: 'Dark', gruvbox: 'Gruvbox' };
  var NOTES = { auto: 'Follows your Mac', light: 'Warm paper', dark: 'Soft dark', gruvbox: 'Dark, high contrast' };
  var SIZE = { min: 15, max: 24, def: 18 };
  var root = document.documentElement;
  var media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  function read(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function write(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  // ---- theme ----
  function get() { var t = read(K.theme); return THEMES.indexOf(t) >= 0 ? t : 'auto'; }
  function resolve(t) { return t !== 'auto' ? t : (media && media.matches ? 'dark' : 'light'); }
  function apply(t) { root.setAttribute('data-theme', resolve(t)); }
  function set(t) {
    if (THEMES.indexOf(t) < 0) t = 'auto';
    write(K.theme, t); apply(t);
    document.dispatchEvent(new CustomEvent('prefs-change'));
  }
  function cycle() { set(THEMES[(THEMES.indexOf(get()) + 1) % THEMES.length]); }

  // ---- text size ----
  function getSize() { var n = parseInt(read(K.size), 10); return n >= SIZE.min && n <= SIZE.max ? n : SIZE.def; }
  function applySize(n) { root.style.setProperty('--text-size', n + 'px'); }
  function setSize(n) {
    n = Math.max(SIZE.min, Math.min(SIZE.max, n));
    write(K.size, String(n)); applySize(n);
    document.dispatchEvent(new CustomEvent('prefs-change'));
  }

  // ---- sidebar and outline (desktop layout only; phones use a drawer) ----
  function getSidebar() { return read(K.sidebar) === 'closed' ? 'closed' : 'open'; }
  function setSidebar(v) { write(K.sidebar, v); root.setAttribute('data-sidebar', v); document.dispatchEvent(new CustomEvent('prefs-change')); }
  function getToc() { return read(K.toc) === 'hidden' ? 'hidden' : 'shown'; }
  function setToc(v) { write(K.toc, v); root.setAttribute('data-toc', v); document.dispatchEvent(new CustomEvent('prefs-change')); }

  apply(get());
  applySize(getSize());
  root.setAttribute('data-sidebar', getSidebar());
  root.setAttribute('data-toc', getToc());

  if (media) {
    var onChange = function () { if (get() === 'auto') apply('auto'); };
    if (media.addEventListener) media.addEventListener('change', onChange); else media.addListener(onChange);
  }
  // Another tab changed a preference: follow it.
  window.addEventListener('storage', function (e) {
    if (e.key === K.theme) apply(get());
    if (e.key === K.size) applySize(getSize());
    if (e.key === K.sidebar) root.setAttribute('data-sidebar', getSidebar());
    if (e.key === K.toc) root.setAttribute('data-toc', getToc());
    document.dispatchEvent(new CustomEvent('prefs-change'));
  });

  window.cppTheme = {
    get: get, set: set, cycle: cycle, THEMES: THEMES, LABELS: LABELS, NOTES: NOTES,
    getSize: getSize, setSize: setSize, SIZE: SIZE,
    getSidebar: getSidebar, setSidebar: setSidebar, getToc: getToc, setToc: setToc,
  };
})();

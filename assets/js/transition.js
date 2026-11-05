/* ==========================================================
   Page transitions – light version.
   Leaving: the page content fades and lifts slightly while a
   thin accent line sweeps across the top (~0.2 s).
   Arriving: the new content fades and slides up into place.
   The header stays put the whole time.
   ========================================================== */
(function () {
  'use strict';
  var doc = document.documentElement;
  var KEY = 'pt';
  var OUT_MS = 200;   // how long the leaving animation takes

  /* ---------- Arriving ---------- */
  var incoming = null;
  try { incoming = sessionStorage.getItem(KEY); sessionStorage.removeItem(KEY); } catch (e) {}

  function enter() {
    requestAnimationFrame(function () { requestAnimationFrame(function () { doc.classList.remove('pt-in'); }); });
  }
  if (incoming) {
    doc.classList.add('pt-in');
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enter); else enter();
  } else doc.classList.remove('pt-in');

  // Back/forward cache: restore the page cleanly
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) { doc.classList.remove('pt-in', 'pt-out'); var b = document.querySelector('.pt-bar'); if (b) b.remove(); }
  });

  /* ---------- Leaving ---------- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if ((a.target && a.target !== '_self') || a.hasAttribute('download')) return;
    var url = new URL(a.href, location.href);
    if (url.protocol !== location.protocol || url.host !== location.host) return;
    if (url.pathname === location.pathname && url.hash) return;   // same-page anchor
    if (!/\.html$|\/$/.test(url.pathname)) return;                // pages only
    e.preventDefault();

    var holder = a.closest('[style*="--card-accent"]');
    var color = a.getAttribute('data-accent') || (holder && getComputedStyle(holder).getPropertyValue('--card-accent').trim()) || '';
    var bar = document.createElement('div'); bar.className = 'pt-bar';
    if (color) bar.style.background = color;
    document.body.appendChild(bar);

    try { sessionStorage.setItem(KEY, '1'); } catch (err) {}
    doc.classList.add('pt-out');
    setTimeout(function () { location.href = url.href; }, OUT_MS);
  });
})();

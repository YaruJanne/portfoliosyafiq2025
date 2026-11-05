/* ==========================================================
   CERTIFICATES
   How to add one:
     1. Put the file (JPG, PNG, WEBP or PDF) in  assets/certificates/
     2. Copy one of the example lines below, remove the // at the
        start, and fill it in.
   - date:     'YYYY-MM' (newest show first). Can be left ''.
   - preview:  optional image (JPG/PNG) shown instead of the PDF icon.
   - verify / code: optional link and credential ID for checking it.
   - category: optional. Leave '' for now and sort later — once
               two or more categories exist, filter buttons appear
               automatically.
   ========================================================== */
var CERTIFICATES = [
  { title: 'Unity Certified User: Programmer', issuer: 'Unity Technologies', date: '2025-09', file: 'Unity Certified User.pdf', preview: 'unity-certified-user-preview.jpg', category: 'Game Development',
    verify: 'https://verify.certiport.com', code: 'caYB-uSJC' },
  // { title: 'Unity Certified User: Programmer', issuer: 'Unity Technologies', date: '2025-06', file: 'unity-programmer.pdf', category: 'Game Development' },
  // { title: 'Autodesk Fusion 360 Fundamentals', issuer: 'Autodesk', date: '2026-03', file: 'fusion360.jpg', category: '3D & Hardware' },
  // { title: 'Participation – SAMNOVA 2026', issuer: 'SAMNOVA', date: '2026-06', file: 'samnova.png', category: '' },
];

/* ---------- Rendering (no need to edit below) ---------- */
(function () {
  var grid = document.getElementById('cert-grid');
  if (!grid) return;
  var bar = document.getElementById('cert-filters'), count = document.getElementById('cert-count');
  var DIR = 'assets/certificates/';
  var DOC = '<svg aria-hidden="true" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg>';
  var MEDAL = '<svg aria-hidden="true" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="9" r="6"/><path d="m8.5 14-1.5 7 5-3 5 3-1.5-7"/></svg>';
  function esc(t) { var d = document.createElement('div'); d.textContent = t || ''; return d.innerHTML; }
  function fmt(d) {
    if (!d) return '';
    var m = d.split('-'), names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return m[1] ? names[+m[1] - 1] + ' ' + m[0] : m[0];
  }

  var list = CERTIFICATES.slice().sort(function (a, b) { return (b.date || '').localeCompare(a.date || ''); });

  if (!list.length) {
    grid.innerHTML = '<div class="card card-soon"><div class="soon-thumb">' + MEDAL + '<span>CERTIFICATES COMING SOON</span></div><p>New certificates are being added. Check back soon.</p></div>';
    return;
  }
  count.textContent = list.length + (list.length === 1 ? ' certificate' : ' certificates');

  if (list.length === 1) {   // a single certificate gets a featured layout
    var c1 = list[0], f1 = DIR + c1.file;
    grid.className = 'cert-feature';
    grid.innerHTML = '<a class="cert-feature-img" href="' + encodeURI(f1) + '" target="_blank" rel="noopener"><img src="' + encodeURI(DIR + (c1.preview || c1.file)) + '" alt="' + esc(c1.title) + ' certificate"></a>' +
      '<div class="cert-feature-txt"><div class="chips">' + (c1.category ? '<span class="chip">' + esc(c1.category) + '</span>' : '') + (c1.date ? '<span class="chip">' + fmt(c1.date) + '</span>' : '') + '</div>' +
      '<h3>' + esc(c1.title) + '</h3><p class="muted">' + esc(c1.issuer) + (c1.code ? ' · Credential ID <code>' + esc(c1.code) + '</code>' : '') + '</p>' +
      '<div class="btn-row"><a class="btn btn-primary" href="' + encodeURI(f1) + '" target="_blank" rel="noopener">View certificate</a>' +
      (c1.verify ? '<a class="btn" href="' + c1.verify + '" target="_blank" rel="noopener">Verify on Certiport ↗</a>' : '') + '</div></div>';
    return;
  }

  grid.innerHTML = list.map(function (c) {
    var file = DIR + c.file, isPdf = /\.pdf$/i.test(c.file), cat = c.category || 'Other';
    var thumb = c.preview
      ? '<div class="card-thumb"><img src="' + encodeURI(DIR + c.preview) + '" alt="' + esc(c.title) + ' certificate" loading="lazy"></div>'
      : isPdf
      ? '<div class="card-thumb cert-pdf">' + DOC + '<span>PDF</span></div>'
      : '<div class="card-thumb"><img src="' + encodeURI(file) + '" alt="' + esc(c.title) + ' certificate" loading="lazy"></div>';
    return '<a class="card cert" href="' + encodeURI(file) + '" target="_blank" rel="noopener" data-cert-cat="' + esc(cat) + '">' + thumb +
      '<div class="chips">' + (c.category ? '<span class="chip">' + esc(c.category) + '</span>' : '') + (c.date ? '<span class="chip">' + fmt(c.date) + '</span>' : '') + '</div>' +
      '<h3>' + esc(c.title) + '</h3><p>' + esc(c.issuer) + '</p></a>';
  }).join('');

  var cats = [];
  list.forEach(function (c) { var k = c.category || 'Other'; if (cats.indexOf(k) < 0) cats.push(k); });
  if (cats.length < 2) return;
  bar.hidden = false;
  bar.innerHTML = ['All'].concat(cats).map(function (k, i) {
    return '<button type="button" class="filter-btn" aria-pressed="' + (i ? 'false' : 'true') + '" data-k="' + esc(k) + '">' + esc(k) + '</button>';
  }).join('');
  bar.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    var k = b.getAttribute('data-k');
    Array.prototype.forEach.call(bar.children, function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
    Array.prototype.forEach.call(grid.children, function (card) { card.hidden = !(k === 'All' || card.getAttribute('data-cert-cat') === k); if (!card.hidden) card.classList.add('in'); });
  });
})();

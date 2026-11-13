/* Studio Komputerowe Grudzińscy: menu, karuzele, zgody cookies, mapa po zgodzie, formularz. Bez bibliotek. */
(function () {
  var D = document, cfg = window.GK || {};

  /* menu na telefonie */
  var b = D.querySelector('.burger'), n = D.getElementById('nav');
  if (b && n) {
    var zamknij = function () { n.classList.remove('open'); b.setAttribute('aria-expanded', 'false'); D.body.style.overflow = ''; };
    b.addEventListener('click', function () { var o = n.classList.toggle('open'); b.setAttribute('aria-expanded', o); D.body.style.overflow = o ? 'hidden' : ''; });
    n.addEventListener('click', function (e) { if (e.target.closest('a')) zamknij(); });
    D.addEventListener('keydown', function (e) { if (e.key === 'Escape') zamknij(); });
  }

  /* karuzele: palec, mysz, strzałki; pomiary tylko w ResizeObserver/scroll (bez wymuszonego przeliczania układu) */
  D.querySelectorAll('.swipe').forEach(function (sw) {
    var t = sw.querySelector('.track'), prev = sw.querySelector('[data-prev]'), next = sw.querySelector('[data-next]'), dots = sw.querySelector('.dots');
    var items = t.children, st = { krok: 1, max: 0 };
    if (dots) { for (var i = 0; i < items.length; i++) dots.appendChild(D.createElement('i')); }
    function rysuj() {
      var sl = t.scrollLeft;
      sw.classList.toggle('static', st.max <= 0);
      if (prev) prev.disabled = sl <= 2;
      if (next) next.disabled = sl >= st.max;
      if (dots) { var k = Math.round(sl / st.krok); if (sl >= st.max) k = items.length - 1; for (var j = 0; j < dots.children.length; j++) dots.children[j].classList.toggle('on', j === k); }
    }
    function mierz() { st.max = t.scrollWidth - t.clientWidth - 2; st.krok = items.length > 1 ? items[1].offsetLeft - items[0].offsetLeft : t.clientWidth; rysuj(); }
    if ('ResizeObserver' in window) new ResizeObserver(mierz).observe(t); else window.addEventListener('load', mierz);
    var raf = 0;
    t.addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(function () { raf = 0; rysuj(); }); }, { passive: true });
    if (prev) prev.addEventListener('click', function () { t.scrollBy({ left: -st.krok, behavior: 'smooth' }); });
    if (next) next.addEventListener('click', function () { t.scrollBy({ left: st.krok, behavior: 'smooth' }); });
    var down = false, sx = 0, sl0 = 0, moved = false;
    t.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') return; down = true; moved = false; sx = e.clientX; sl0 = t.scrollLeft; });
    window.addEventListener('pointermove', function (e) { if (!down) return; var dx = e.clientX - sx; if (Math.abs(dx) > 5) { moved = true; t.classList.add('drag'); } t.scrollLeft = sl0 - dx; });
    window.addEventListener('pointerup', function () { if (!down) return; down = false; if (moved) { t.classList.remove('drag'); t.scrollTo({ left: Math.round(t.scrollLeft / st.krok) * st.krok, behavior: 'smooth' }); } });
    t.addEventListener('click', function (e) { if (moved) { e.preventDefault(); moved = false; } }, true);
    t.addEventListener('dragstart', function (e) { e.preventDefault(); });
  });

  /* lata w aktualnościach */
  D.querySelectorAll('.years a').forEach(function (a) { a.addEventListener('click', function () { var d = D.querySelector(a.getAttribute('href')); if (d && d.tagName === 'DETAILS') d.open = true; }); });
  if (location.hash && /^#[\w-]+$/.test(location.hash)) { var dh = D.querySelector(location.hash); if (dh && dh.tagName === 'DETAILS') dh.open = true; }

  /* zgody cookies */
  var KL = 'gk-zgoda', ck = D.getElementById('ck');
  function zgoda() { try { return JSON.parse(localStorage.getItem(KL) || 'null'); } catch (e) { return null; } }
  function zapisz(z) { z.t = Date.now(); try { localStorage.setItem(KL, JSON.stringify(z)); } catch (e) {} if (ck) ck.hidden = true; D.documentElement.classList.remove('ck-on'); zastosuj(z); }
  var mapy = D.querySelectorAll('[data-mapa]');
  function wstawMape(el) {
    if (el.querySelector('iframe') || !cfg.mapa) return;
    var f = D.createElement('iframe');
    f.src = cfg.mapa; f.title = 'Mapa dojazdu'; f.loading = 'lazy'; f.referrerPolicy = 'no-referrer-when-downgrade';
    el.appendChild(f);
  }
  function mapaPrzyPrzewinieciu() {
    if (!('IntersectionObserver' in window)) { mapy.forEach(wstawMape); return; }
    var io = new IntersectionObserver(function (w) { w.forEach(function (x) { if (x.isIntersecting) { wstawMape(x.target); io.unobserve(x.target); } }); }, { rootMargin: '300px' });
    mapy.forEach(function (m) { io.observe(m); });
  }
  var gaJest = false;
  function statystyki() {
    if (gaJest || !cfg.ga4 || !/^G-[A-Z0-9]+$/.test(cfg.ga4)) return;
    gaJest = true;
    var s = D.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + cfg.ga4; D.head.appendChild(s);
    window.dataLayer = window.dataLayer || []; window.gtag = function () { dataLayer.push(arguments); };
    gtag('js', new Date()); gtag('config', cfg.ga4);
  }
  function zastosuj(z) { if (!z) return; if (z.mapa) mapaPrzyPrzewinieciu(); if (z.stat) statystyki(); }
  zastosuj(zgoda());
  D.querySelectorAll('[data-mapa-pokaz]').forEach(function (bt) {
    bt.addEventListener('click', function () { var z = zgoda() || { stat: false }; z.mapa = true; zapisz(z); wstawMape(bt.closest('[data-mapa]')); });
  });
  if (ck) {
    var u = ck.querySelector('.ck-u'), bz = ck.querySelector('[data-ck="zapisz"]'), bu = ck.querySelector('[data-ck="ust"]');
    ck.addEventListener('click', function (e) {
      var x = e.target.closest('[data-ck]'); if (!x) return;
      var a = x.getAttribute('data-ck');
      if (a === 'tak') zapisz({ mapa: true, stat: true });
      else if (a === 'nie') zapisz({ mapa: false, stat: false });
      else if (a === 'ust') { u.hidden = false; bz.hidden = false; bu.hidden = true; }
      else if (a === 'zapisz') { var z = { mapa: false, stat: false }; ck.querySelectorAll('[data-zg]').forEach(function (c) { z[c.getAttribute('data-zg')] = c.checked; }); zapisz(z); }
    });
    D.querySelectorAll('[data-ck-otworz]').forEach(function (bt) {
      bt.addEventListener('click', function () {
        var z = zgoda() || {}; ck.querySelectorAll('[data-zg]').forEach(function (c) { c.checked = !!z[c.getAttribute('data-zg')]; });
        u.hidden = false; bz.hidden = false; bu.hidden = true; ck.hidden = false;
      });
    });
  }

  /* formularz: wysyłka bez przeładowania (wersja testowa: tylko pokaz) */
  D.querySelectorAll('form.form[data-tryb]').forEach(function (f) {
    var info = f.querySelector('.form-info');
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var nazwa = f.elements.nazwa.value.trim(), kontakt = f.elements.kontakt.value.trim();
      info.classList.remove('ok', 'blad');
      if (!nazwa || (kontakt.indexOf('@') < 0 && kontakt.replace(/\D+/g, '').length < 9)) { info.classList.add('blad'); info.textContent = 'Podaj imię lub firmę oraz telefon albo e-mail.'; return; }
      if (f.getAttribute('data-tryb') === 'pokaz') { info.classList.add('ok'); info.textContent = 'To wersja testowa strony: wiadomość nie została wysłana. Po uruchomieniu na grudzinscy.pl formularz wyśle ją na ' + (f.getAttribute('data-do') || 'adres biura') + '.'; return; }
      var bt = f.querySelector('button[type=submit]'); bt.disabled = true;
      fetch(f.action, { method: 'POST', body: new FormData(f), headers: { 'X-Requested-With': 'fetch' }, credentials: 'same-origin' })
        .then(function (r) { return r.json(); })
        .then(function (j) { info.classList.add(j.ok ? 'ok' : 'blad'); info.textContent = j.wiadomosc; if (j.ok) f.reset(); })
        .catch(function () { f.submit(); })
        .finally(function () { bt.disabled = false; });
    });
  });
})();

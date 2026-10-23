/* Photo viewer for benjamingarcia.cl, shared by /photos/ and /es/fotos/.
   Reads window.PHOTOS and window.PLACES (photos.js) and window.PHOTO_PAGE (set in each page). */
(function () {
  'use strict';
  var cfg = window.PHOTO_PAGE, photos = window.PHOTOS || [], places = window.PLACES || [];
  var t = cfg.strings, isEs = cfg.lang === 'es';
  var N = photos.length;
  if (!N) return;

  var MAP_JS = 'https://unpkg.com/maplibre-gl@5.24.0/dist/maplibre-gl.js';
  var MAP_SRI = 'sha384-5+cfbwT0iiub6VsQAdn6yz16nr6sDiQoHx6tm4O8OVYXHYOxcffFmCJBL0dgdvGp';
  var STYLE = { light: 'https://tiles.openfreemap.org/styles/positron', dark: 'https://tiles.openfreemap.org/styles/dark' };
  var ZOOM = 9;
  var PIN_H = 38;

  var $ = function (s) { return document.querySelector(s); };
  var frame = $('#frame'), img = $('#photo'), placeEl = $('#place'), metaEl = $('#meta'),
      countEl = $('#count'), mapEl = $('#map'), toggle = $('.lang-toggle a'), home = $('.home');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
  var local = location.protocol === 'file:';
  var fmt = new Intl.DateTimeFormat(isEs ? 'es-CL' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

  if (local) home.href = home.href.replace(/\/$/, '/index.html');

  var current = -1, token = 0, spinTimer = 0;
  var map = null, marker = null, mapReady = false, lastLoc = null;

  function src(p) { return cfg.root + p.f.split('/').map(encodeURIComponent).join('/'); }
  function dateOf(p) { var d = p.d.split('-'); return fmt.format(new Date(Date.UTC(+d[0], +d[1] - 1, +d[2]))); }
  function placeOf(p) { return p.p == null ? '' : places[p.p][isEs ? 1 : 0]; }
  function hasLoc(p) { return p.lat != null; }
  function indexOfId(id) {
    for (var i = 0; i < N; i++) if (photos[i].id === id) return i;
    return -1;
  }

  /* Geometry: fit the photo into the stage, keep a strip of map free for the pin. */
  function geometry(p) {
    var W = window.innerWidth, H = window.innerHeight, small = W <= 640;
    var top = $('.bar').offsetHeight, bottom = $('.dock').offsetHeight;
    var padX = small ? 10 : 28, padY = small ? 6 : 10;
    var sx = padX, sy = top + padY, sw = W - 2 * padX, sh = H - top - bottom - 2 * padY;
    var s = Math.min(sw / p.w, sh / p.h, 1);
    if (hasLoc(p)) {
      var need = small ? 58 : 120;               // free space wanted on one side
      var fx = (sw - p.w * s) / 2 + padX, fy = (sh - p.h * s) / 2;
      if (Math.max(fx, fy) < need) {
        var sX = (sw + 2 * padX - 2 * need) / p.w, sY = (sh - 2 * need) / p.h;
        s = Math.min(s, Math.max(sX, sY));
      }
    }
    var w = Math.round(p.w * s), h = Math.round(p.h * s);
    var x = Math.round(sx + (sw - w) / 2), y = Math.round(sy + (sh - h) / 2);
    // Pin target: centre of the larger free strip (right of the photo, or below it).
    var rightW = W - (x + w), belowH = (H - bottom) - (y + h);
    var target = rightW >= belowH * 1.15
      ? { x: x + w + rightW / 2, y: y + h / 2 + PIN_H / 2 }
      : { x: W / 2, y: y + h + belowH / 2 + PIN_H / 2 - 2 };
    return { x: x, y: y, w: w, h: h, target: target, W: W, H: H };
  }

  function placeFrame(g) {
    frame.style.left = g.x + 'px';
    frame.style.top = g.y + 'px';
    frame.style.width = g.w + 'px';
    frame.style.height = g.h + 'px';
  }

  /* Map */
  function moveMap(p, g, animate) {
    if (!map) return;
    var loc = hasLoc(p);
    mapEl.classList.toggle('no-loc', !loc);
    if (!loc) { marker.getElement().classList.add('is-hidden'); return; }
    var opts = {
      center: [p.lon, p.lat], zoom: ZOOM, bearing: 0, pitch: 0,
      offset: [g.target.x - g.W / 2, g.target.y - g.H / 2]
    };
    var far = lastLoc ? km(lastLoc, p) : 1e9;
    marker.setLngLat([p.lon, p.lat]);
    marker.getElement().classList.remove('is-hidden');
    if (!animate || reduceMotion || !lastLoc) {
      opts.duration = 0; map.easeTo(opts);
    } else if (far < 40) {
      opts.duration = 700; map.easeTo(opts);
    } else {
      // Explicit duration: MapLibre's maxDuration would skip long flights entirely.
      opts.duration = Math.min(2600, 1000 + 420 * Math.log10(far / 40)); opts.curve = 1.5; map.flyTo(opts);
    }
    lastLoc = p;
  }
  function km(a, b) {
    var r = Math.PI / 180, dLat = (b.lat - a.lat) * r, dLon = (b.lon - a.lon) * r;
    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 12742 * Math.asin(Math.sqrt(h));
  }
  function pinElement() {
    var el = document.createElement('div');
    el.className = 'pin';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<svg viewBox="0 0 28 38"><path class="body" d="M14 0C6.3 0 0 6.2 0 13.9 0 24.3 14 38 14 38s14-13.7 14-24.1C28 6.2 21.7 0 14 0z"/><circle class="core" cx="14" cy="13.8" r="5.2"/></svg>';
    return el;
  }
  function initMap() {
    if (!window.maplibregl) return;
    var p = photos[current], start = hasLoc(p) ? p : (lastLoc || { lat: -33.45, lon: -70.66 });
    try {
      map = new maplibregl.Map({
        container: mapEl,
        style: darkQuery.matches ? STYLE.dark : STYLE.light,
        center: [start.lon, start.lat],
        zoom: ZOOM,
        interactive: false,
        attributionControl: false,
        fadeDuration: 200
      });
    } catch (e) { map = null; return; }         // no WebGL: plain background
    marker = new maplibregl.Marker({ element: pinElement(), anchor: 'bottom' })
      .setLngLat([start.lon, start.lat]).addTo(map);
    moveMap(p, geometry(p), false);
    if (darkQuery.addEventListener) {
      darkQuery.addEventListener('change', function (e) { map.setStyle(e.matches ? STYLE.dark : STYLE.light); });
    }
  }
  function loadMap() {
    var s = document.createElement('script');
    s.src = MAP_JS; s.integrity = MAP_SRI; s.crossOrigin = 'anonymous'; s.async = true;
    s.onload = initMap;
    document.head.appendChild(s);
  }

  /* Showing a photo */
  function show(i, animate) {
    i = (i % N + N) % N;
    if (i === current) return;
    current = i;
    var p = photos[i], my = ++token, place = placeOf(p), date = dateOf(p);
    var g = geometry(p);

    placeEl.textContent = place;
    placeEl.hidden = !place;
    metaEl.textContent = p.c ? date + ' · ' + p.c : date;
    countEl.textContent = (i + 1) + ' / ' + N;
    img.alt = place ? t.altPlace.replace('{place}', place).replace('{date}', date) : t.altDate.replace('{date}', date);

    var hash = '#' + p.id;
    if (location.hash !== hash) history.replaceState(null, '', hash);
    toggle.href = cfg.other + (local ? 'index.html' : '') + hash;

    img.classList.remove('is-shown');
    frame.classList.remove('has-error');
    if (!animate) frame.style.transition = 'none';
    placeFrame(g);
    if (!animate) { void frame.offsetWidth; frame.style.transition = ''; }
    moveMap(p, g, animate);

    clearTimeout(spinTimer);
    spinTimer = setTimeout(function () { if (my === token) frame.classList.add('is-loading'); }, 350);
    var pre = new Image();
    pre.onload = function () {
      if (my !== token) return;
      var reveal = function () {
        if (my !== token) return;
        clearTimeout(spinTimer);
        frame.classList.remove('is-loading');
        img.src = pre.src;
        img.classList.add('is-shown');
        preload(i + 1); preload(i - 1);
      };
      if (pre.decode) pre.decode().then(reveal, reveal); else reveal();
    };
    pre.onerror = function () {
      if (my !== token) return;
      clearTimeout(spinTimer);
      frame.classList.remove('is-loading');
      frame.classList.add('has-error');
    };
    pre.src = src(p);
  }
  function preload(i) { new Image().src = src(photos[(i % N + N) % N]); }

  /* Random order without repeats until every photo has been shown. */
  var deck = [];
  function randomIndex() {
    if (!deck.length) {
      for (var k = 0; k < N; k++) deck.push(k);
      for (var j = N - 1; j > 0; j--) { var r = Math.floor(Math.random() * (j + 1)), tmp = deck[j]; deck[j] = deck[r]; deck[r] = tmp; }
    }
    var n = deck.pop();
    return n === current && N > 1 ? randomIndex() : n;
  }

  /* Controls */
  $('.prev').addEventListener('click', function () { show(current - 1, true); });
  $('.next').addEventListener('click', function () { show(current + 1, true); });
  $('#random').addEventListener('click', function () { show(randomIndex(), true); });
  document.addEventListener('keydown', function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === 'ArrowRight') { show(current + 1, true); e.preventDefault(); }
    else if (e.key === 'ArrowLeft') { show(current - 1, true); e.preventDefault(); }
    else if (e.key === 'r' || e.key === 'R') show(randomIndex(), true);
  });
  var tx = null, ty = 0;
  var stage = $('.stage');
  stage.addEventListener('touchstart', function (e) {
    if (e.touches.length !== 1) { tx = null; return; }
    tx = e.touches[0].clientX; ty = e.touches[0].clientY;
  }, { passive: true });
  stage.addEventListener('touchend', function (e) {
    if (tx === null) return;
    var dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
    tx = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > 1.4 * Math.abs(dy)) show(current + (dx < 0 ? 1 : -1), true);
  }, { passive: true });
  window.addEventListener('hashchange', function () {
    var i = indexOfId(decodeURIComponent(location.hash.slice(1)));
    if (i >= 0) show(i, true);
  });
  var resizePending = false;
  window.addEventListener('resize', function () {
    if (resizePending) return;
    resizePending = true;
    requestAnimationFrame(function () {
      resizePending = false;
      var p = photos[current], g = geometry(p);
      frame.style.transition = 'none';
      placeFrame(g);
      void frame.offsetWidth;
      frame.style.transition = '';
      if (map) { map.resize(); moveMap(p, g, false); }
    });
  });

  /* Start: the photo in the URL hash, otherwise the most recent one. */
  var first = indexOfId(decodeURIComponent(location.hash.slice(1)));
  show(first >= 0 ? first : N - 1, false);
  loadMap();
})();

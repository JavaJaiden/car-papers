// Car Papers website, Apple-style version: scroll effects, the devices sequence, the sticky
// "How it works" phone, the highlights gallery and the film player. Nothing is sent anywhere. Without this script the page
// shows every section in its finished state; with Reduce Motion on, nothing moves.
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;
  var each = function (list, fn) { Array.prototype.forEach.call(list, fn); };

  // Hairline under the local nav once the page has scrolled.
  var nav = document.querySelector('.localnav');
  var sentinel = document.querySelector('.nav-sentinel');
  if (hasIO && nav && sentinel) {
    new IntersectionObserver(function (entries) {
      nav.classList.toggle('stuck', !entries[0].isIntersecting);
    }).observe(sentinel);
  }

  // Sections rise into place once, as they arrive.
  var reveals = document.querySelectorAll('[data-reveal]');
  if (reduce || !hasIO) {
    each(reveals, function (el) { el.classList.add('in'); });
  } else {
    var revealer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          revealer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -12% 0px' });
    each(reveals, function (el) { revealer.observe(el); });
  }

  // The privacy statement lights up word by word as it scrolls through.
  var lit = document.querySelector('[data-lit]');
  var words = [];
  if (lit) {
    var text = lit.textContent.trim().split(/\s+/);
    lit.textContent = '';
    text.forEach(function (word, i) {
      var span = document.createElement('span');
      span.className = 'w';
      span.textContent = word;
      lit.appendChild(span);
      if (i < text.length - 1) lit.appendChild(document.createTextNode(' '));
    });
    words = lit.querySelectorAll('.w');
  }

  // Devices: as you scroll, the iPhone turns to face you, the iPhone Duo arrives folded and opens,
  // and the Android preview turns in. Each figure gets values from 0 to 1 (--a, --d, --u, --b); the
  // CSS turns them into motion. On wide screens the three share one pinned stage; stacked on small
  // screens, each one plays as it scrolls into view.
  var deviceScroll = document.querySelector('[data-device-scroll]');
  var devIphone = deviceScroll && deviceScroll.querySelector('.dev-iphone');
  var devDuo = deviceScroll && deviceScroll.querySelector('.dev-duo');
  var devAndroid = deviceScroll && deviceScroll.querySelector('.dev-android');
  var stacked = window.matchMedia('(max-width: 834px)');
  var clamp01 = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
  var ease = function (v) { v = clamp01(v); return v * v * (3 - 2 * v); };
  var span = function (p, from, to) { return ease((p - from) / (to - from)); };
  var put = function (el, name, value) {
    el.style.setProperty(name, value.toFixed(4));
    if (value > 0.97) el.classList.add('in'); // starts the screens cycling, once
  };
  // The shown values glide towards the ones the scroll position asks for, so the steps of a
  // mouse wheel turn into smooth motion. The first frame jumps straight there.
  var goal = { a: 0, d: 0, u: 0, b: 0 };
  var shown = null;
  var gliding = false;
  var lastTime = 0;
  function showDevices() {
    put(devIphone, '--a', shown.a);
    put(devDuo, '--d', shown.d);
    put(devDuo, '--u', shown.u);
    put(devAndroid, '--b', shown.b);
  }
  function glide(now) {
    var dt = lastTime ? Math.min(64, now - lastTime) : 16.7;
    lastTime = now;
    var k = 1 - Math.pow(1 - 0.17, dt / 16.7); // the same feel at 60 Hz and 120 Hz
    var moving = false;
    for (var key in goal) {
      var gap = goal[key] - shown[key];
      if (Math.abs(gap) < 0.001) shown[key] = goal[key];
      else { shown[key] += gap * k; moving = true; }
    }
    showDevices();
    if (moving) window.requestAnimationFrame(glide);
    else { gliding = false; lastTime = 0; }
  }
  function placeDevices(vh) {
    if (!devIphone || !devDuo || !devAndroid) return;
    var a, d, u, b;
    if (stacked.matches) {
      var own = function (el, length) { return clamp01((vh * 0.95 - el.getBoundingClientRect().top) / (vh * length)); };
      var q = own(devDuo, 0.75);
      a = ease(own(devIphone, 0.5));
      d = span(q, 0, 0.3);
      u = span(q, 0.25, 1);
      b = ease(own(devAndroid, 0.5));
    } else {
      var box = deviceScroll.getBoundingClientRect();
      var stage = deviceScroll.firstElementChild.offsetHeight;
      var start = vh * 0.4; // the stage is well into view
      var end = 52 - (box.height - stage); // the pinned stage is about to leave
      var p = clamp01((start - box.top) / (start - end));
      a = span(p, 0, 0.28);
      d = span(p, 0.12, 0.3);
      u = span(p, 0.3, 0.66);
      b = span(p, 0.6, 0.88);
    }
    goal.a = a; goal.d = d; goal.u = u; goal.b = b;
    if (!shown) {
      shown = { a: a, d: d, u: u, b: b };
      showDevices();
    } else if (!gliding) {
      gliding = true;
      window.requestAnimationFrame(glide);
    }
  }

  // Scroll-linked effects: --p runs from 0 as an element enters the screen to 1 as it leaves.
  var scrubbed = document.querySelectorAll('[data-scroll]');
  function frame() {
    var vh = window.innerHeight;
    placeDevices(vh);
    each(scrubbed, function (el) {
      var r = el.getBoundingClientRect();
      var p = (vh - r.top) / (vh + r.height);
      el.style.setProperty('--p', Math.max(0, Math.min(1, p)).toFixed(3));
    });
    if (words.length) {
      var box = lit.getBoundingClientRect();
      var progress = (vh * 0.82 - box.top) / (vh * 0.5);
      var count = Math.round(Math.max(0, Math.min(1, progress)) * words.length);
      for (var i = 0; i < words.length; i++) words[i].classList.toggle('on', i < count);
    }
  }
  if (reduce) {
    each(scrubbed, function (el) { el.style.setProperty('--p', '.5'); });
    each(document.querySelectorAll('.dev'), function (el) { el.classList.add('in'); });
    each(words, function (w) { w.classList.add('on'); });
  } else {
    var ticking = false;
    var onScroll = function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () { frame(); ticking = false; });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    frame();
  }

  // Looping animations (the setup, the device screens, the Siri wave) rest while they are off screen.
  if (hasIO && !reduce) {
    var rester = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { entry.target.classList.toggle('resting', !entry.isIntersecting); });
    });
    each(document.querySelectorAll('.ob-phone, .dev-iphone, .dev-android, .tile-siri'), function (el) { rester.observe(el); });
  }

  // How it works: the phone stays put while the steps scroll past, and its screen follows the step.
  var steps = document.querySelectorAll('.step');
  var screens = document.querySelectorAll('.stage-screens img');
  if (hasIO && steps.length) {
    var stepper = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var n = entry.target.getAttribute('data-step');
        each(steps, function (s) { s.classList.toggle('is-active', s === entry.target); });
        each(screens, function (img) { img.classList.toggle('on', img.getAttribute('data-screen') === n); });
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    each(steps, function (s) { stepper.observe(s); });
  }

  // Highlights gallery: dots and arrows.
  var gallery = document.querySelector('.gallery');
  if (gallery) {
    var tiles = gallery.querySelectorAll('.tile-shot');
    var dotsBox = document.querySelector('.dots');
    var prev = document.querySelector('.arrows [data-dir="-1"]');
    var next = document.querySelector('.arrows [data-dir="1"]');
    var dots = [];
    var stepWidth = function () { return tiles.length > 1 ? tiles[1].offsetLeft - tiles[0].offsetLeft : gallery.clientWidth; };
    var index = function () { return Math.round(gallery.scrollLeft / stepWidth()); };
    var go = function (i) {
      i = Math.max(0, Math.min(tiles.length - 1, i));
      gallery.scrollTo({ left: i * stepWidth(), behavior: reduce ? 'auto' : 'smooth' });
    };
    each(tiles, function (tile, i) {
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'dot';
      dot.setAttribute('aria-label', 'Highlight ' + (i + 1) + ' of ' + tiles.length);
      dot.addEventListener('click', function () { go(i); });
      dotsBox.appendChild(dot);
      dots.push(dot);
    });
    var update = function () {
      var i = index();
      dots.forEach(function (d, k) {
        d.classList.toggle('on', k === i);
        if (k === i) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current');
      });
      if (prev) prev.disabled = gallery.scrollLeft <= 2;
      if (next) next.disabled = gallery.scrollLeft >= gallery.scrollWidth - gallery.clientWidth - 2;
    };
    if (prev) prev.addEventListener('click', function () { go(index() - 1); });
    if (next) next.addEventListener('click', function () { go(index() + 1); });
    var galleryTick = false;
    gallery.addEventListener('scroll', function () {
      if (galleryTick) return;
      galleryTick = true;
      window.requestAnimationFrame(function () { update(); galleryTick = false; });
    }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  // The film opens in a player over the page. Without <dialog>, the link opens the video file itself.
  var dialog = document.querySelector('dialog.film');
  var video = dialog && dialog.querySelector('video');
  if (dialog && typeof dialog.showModal === 'function') {
    each(document.querySelectorAll('[data-film]'), function (link) {
      link.addEventListener('click', function (event) {
        event.preventDefault();
        dialog.showModal();
        var playing = video.play();
        if (playing && playing.catch) playing.catch(function () {});
      });
    });
    dialog.querySelector('.film-close').addEventListener('click', function () { dialog.close(); });
    dialog.addEventListener('click', function (event) {
      if (event.target === dialog || event.target.classList.contains('film-inner')) dialog.close();
    });
    dialog.addEventListener('close', function () { video.pause(); });
  }
})();

// Car Papers: the film. Every moving value is a function of the time t (seconds), so build.mjs can
// render any frame exactly: window.seek(t) sets the frame and resolves once its pictures are decoded.
// The times follow the voiceover (see build.mjs): the question 0:00, Car Papers 0:05, the four
// promises 0:08, the phone 0:13 to 0:30, privacy 0:30, the end 0:33.
(function () {
  'use strict';
  var FPS = 30;
  var WORK = '';   // where build.mjs put the recordings' frames and the stills (a file:// URL)
  var COUNTS = {}; // frames in each recording
  var $ = function (id) { return document.getElementById(id); };

  function clamp(v, a, b) { return Math.min(b === undefined ? 1 : b, Math.max(a === undefined ? 0 : a, v)); }
  function lin(t, a, b) { return clamp((t - a) / (b - a)); }
  function outCubic(x) { x = clamp(x); return 1 - Math.pow(1 - x, 3); }
  function outExpo(x) { x = clamp(x); return x >= 1 ? 1 : 1 - Math.pow(2, -10 * x); }
  function inOut(x) { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
  function outBack(x) { x = clamp(x); var c1 = 1.3, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); }
  function mix(a, b, p) { return a + (b - a) * p; }
  function f4(v) { return v.toFixed(4); }

  var pending = [];
  function src(img, url) {
    if (img.getAttribute('src') !== url) {
      img.setAttribute('src', url);
      pending.push(img.decode().catch(function () {}));
    }
  }
  // Frame of a recording: frame 1 is the scene's first moment (`at` on the timeline).
  function frame(name, at, t) {
    var n = COUNTS[name] || 1;
    var k = Math.max(1, Math.min(n, Math.floor((t - at) * FPS + 1e-4) + 1));
    return WORK + '/clips/' + name + '/' + String(k).padStart(4, '0') + '.jpg';
  }
  // A scene fades in at a over fadeIn seconds and out at b over fadeOut seconds.
  function scene(el, t, a, fadeIn, b, fadeOut) {
    var p = Math.min(lin(t, a, a + fadeIn), 1 - lin(t, b, b + fadeOut));
    el.style.opacity = f4(p);
    el.style.visibility = p > 0 ? 'visible' : 'hidden';
    return p;
  }
  function rise(el, t, a, dur, dist) {
    var p = outCubic(lin(t, a, a + dur));
    el.style.opacity = f4(p);
    el.style.transform = 'translateY(' + ((1 - p) * dist).toFixed(2) + 'px)';
    return p;
  }
  // Rises in at a, then lifts away at b.
  function riseLeave(el, t, a, b) {
    var pin = outCubic(lin(t, a, a + 0.6));
    var pout = inOut(lin(t, b, b + 0.32));
    el.style.opacity = f4(pin * (1 - pout));
    el.style.transform = 'translateY(' + ((1 - pin) * 44 - pout * 34).toFixed(2) + 'px)';
  }
  function grey(el, t, a) { // black to Apple's soft grey
    var g = inOut(lin(t, a, a + 0.45));
    el.style.color = 'rgb(' + Math.round(mix(29, 134, g)) + ',' + Math.round(mix(29, 134, g)) + ',' + Math.round(mix(31, 139, g)) + ')';
  }

  // 1. Your registration. Your insurance card. Where are they when you need them?
  function s1(t) {
    if (scene($('s1'), t, -1, 0.001, 4.8, 0.35) <= 0) return;
    rise($('hk1'), t, 0.10, 0.65, 56); grey($('hk1'), t, 1.45);
    rise($('hk2'), t, 1.45, 0.65, 56); grey($('hk2'), t, 2.93);
    rise($('hk3'), t, 2.93, 0.65, 56);
    $('hook').style.transform = 'translateY(calc(-50% - ' + (lin(t, 0, 5.2) * 36).toFixed(2) + 'px))';
  }

  // 2. Car Papers keeps both on your iPhone.
  function s2(t) {
    if (scene($('s2'), t, 4.85, 0.3, 7.95, 0.3) <= 0) return;
    var icon = $('s2icon');
    icon.style.opacity = f4(outCubic(lin(t, 4.95, 5.45)));
    icon.style.transform = 'scale(' + f4(mix(0.5, 1, outBack(lin(t, 4.95, 5.65)))) + ')';
    rise($('s2title'), t, 5.12, 0.7, 46);
    rise($('s2tag'), t, 5.32, 0.7, 34);
    var c = outExpo(lin(t, 5.2, 6.5));
    $('s2c').style.opacity = f4(clamp(c * 1.6));
    $('s2c').style.transform = 'translateY(' + ((1 - c) * 560).toFixed(1) + 'px)';
    var s = outExpo(lin(t, 5.85, 7.1));
    $('s2l').style.opacity = f4(s);
    $('s2l').style.transform = 'translateX(' + ((1 - s) * 42).toFixed(2) + '%) scale(' + f4(mix(0.96, 1, s)) + ')';
    $('s2r').style.opacity = f4(s);
    $('s2r').style.transform = 'translateX(' + (-(1 - s) * 42).toFixed(2) + '%) scale(' + f4(mix(0.96, 1, s)) + ')';
    src($('s2scr'), frame('home', 4.90, t));
  }

  // 3. It's free. There's no sign-in. Setup is easy, and it works as soon as you download it.
  var points = [['pt1', 8.20], ['pt2', 9.02], ['pt3', 10.25], ['pt4', 11.55]];
  function s3(t) {
    if (scene($('s3'), t, 7.95, 0.35, 13.3, 0.35) <= 0) return;
    rise($('s3eb'), t, 7.98, 0.55, 26);
    points.forEach(function (point) {
      var el = $(point[0]), a = point[1];
      var q = outCubic(lin(t, a, a + 0.55));
      el.style.opacity = f4(q);
      el.style.transform = 'translateY(' + ((1 - q) * 56).toFixed(2) + 'px)';
      el.firstElementChild.style.transform = 'scale(' + f4(mix(0.55, 1, outBack(lin(t, a, a + 0.55)))) + ')';
    });
  }

  // 4. Take a photo (0:13), show mode (0:18), widgets (0:21), the Lock Screen (0:24), a reminder (0:26).
  var screens = [
    { at: 13.45, clip: 'check' },
    { at: 18.15, clip: 'show' },
    { at: 21.75, still: 'widgets' },
    { at: 23.95, still: 'lock' },
    { at: 26.35, clip: 'remind' }
  ];
  function screenUrl(s, t) { return s.still ? WORK + '/stills/' + s.still + '.jpg' : frame(s.clip, s.at, t); }
  function s4(t) {
    if (scene($('s4'), t, 13.3, 0.35, 30.3, 0.3) <= 0) return;
    var r = outExpo(lin(t, 13.42, 14.6));
    var phone = $('s4phone');
    phone.style.opacity = f4(clamp(r * 1.5));
    phone.style.transform = 'translateY(' + ((1 - r) * 820).toFixed(1) + 'px) scale(' + f4(mix(1, 1.035, lin(t, 14.6, 30.3))) + ')';
    var i = 0;
    for (var k = 0; k < screens.length; k++) if (t >= screens[k].at) i = k;
    var current = screens[i], previous = screens[i - 1];
    var x = previous ? lin(t, current.at, current.at + 0.45) : 1;
    var a = $('sa'), b = $('sb');
    if (previous && x < 1) {
      src(a, screenUrl(previous, t));
      src(b, screenUrl(current, t));
      b.style.opacity = f4(inOut(x));
      b.style.transform = 'scale(' + f4(mix(0.965, 1, outCubic(x))) + ')';
    } else {
      src(a, screenUrl(current, t));
      b.style.opacity = '0';
    }
    riseLeave($('st1'), t, 13.6, 17.85);
    riseLeave($('st2'), t, 18.2, 21.45);
    riseLeave($('st3'), t, 21.8, 26.05);
    rise($('st3b'), t, 24.0, 0.55, 26);
    riseLeave($('st4'), t, 26.4, 40);
  }

  // 5. No account. Nothing leaves your phone.
  function s8(t) {
    if (scene($('s8'), t, 30.15, 0.3, 33.4, 0.35) <= 0) return;
    var lock = $('s8lock');
    lock.style.opacity = f4(lin(t, 30.35, 30.7));
    lock.style.transform = 'scale(' + f4(mix(0.5, 1, outBack(lin(t, 30.35, 31.0)))) + ')';
    rise($('s8a'), t, 30.5, 0.6, 44);
    $('s8b').style.opacity = f4(lin(t, 31.05, 31.3));
    var words = document.querySelectorAll('#s8b .w');
    for (var j = 0; j < words.length; j++) {
      var q = inOut(lin(t, 31.35 + j * 0.32, 31.7 + j * 0.32));
      words[j].style.color = 'rgb(' + Math.round(mix(58, 245, q)) + ',' + Math.round(mix(58, 245, q)) + ',' + Math.round(mix(60, 247, q)) + ')';
    }
  }

  // 6. Car Papers. Free, and ready when you need them.
  function s9(t) {
    if (scene($('s9'), t, 33.4, 0.35, 99, 1) <= 0) return;
    var icon = $('s9icon');
    icon.style.opacity = f4(outCubic(lin(t, 33.55, 34.0)));
    icon.style.transform = 'scale(' + f4(mix(0.6, 1, outBack(lin(t, 33.55, 34.2)))) + ')';
    rise($('s9title'), t, 33.7, 0.7, 50);
    rise($('s9free'), t, 34.6, 0.65, 40);
    rise($('s9tag'), t, 35.4, 0.65, 32);
    $('s9iphone').style.setProperty('--a', f4(inOut(lin(t, 33.75, 35.05))));
    $('s9duo').style.setProperty('--d', f4(outCubic(lin(t, 33.95, 34.6))));
    $('s9duo').style.setProperty('--u', f4(inOut(lin(t, 34.45, 36.1))));
  }

  window.setupFilm = function (work, counts) { WORK = work; COUNTS = counts || {}; };
  window.seek = function (t) {
    pending = [];
    s1(t); s2(t); s3(t); s4(t); s8(t); s9(t);
    return Promise.all(pending).then(function () { return true; });
  };

  // Opened by hand with ?t=12.5 (and &work=file:///…), show that moment.
  var params = new URLSearchParams(location.search);
  if (params.has('t')) {
    window.setupFilm(params.get('work') || '', JSON.parse(params.get('counts') || '{}'));
    window.seek(parseFloat(params.get('t')));
  }
})();

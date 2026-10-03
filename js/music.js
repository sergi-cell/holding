// HOLDING — chip de sonido estilo Game Boy: 2 pulsos (12,5/25/50%), onda triangular y ruido.
// La música va integrada en musica.pack, CIFRADA: el repo es público y solo el código de Sergi la abre.
// Arreglo de iOS: nada se programa hasta que el AudioContext está 'running'.
var H = window.H || (window.H = {});
(function () {
  'use strict';
  var ctx = null, master = null, musGain = null, sfxGain = null, noiseBuf = null, waves = {};
  var actual = null, timer = null, genId = 0;
  var A = H.audio = { musica: true, sfx: true, mes: 0 };
  var CLAVE = 'holding_musica';

  function crear() {
    if (ctx) return;
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
    musGain = ctx.createGain(); musGain.gain.value = A.musica ? 0.16 : 0; musGain.connect(master);
    sfxGain = ctx.createGain(); sfxGain.gain.value = A.sfx ? 0.28 : 0; sfxGain.connect(master);
    [0.125, 0.25, 0.5].forEach(function (d) {
      var n = 40, re = new Float32Array(n), im = new Float32Array(n);
      for (var k = 1; k < n; k++) re[k] = Math.sin(Math.PI * k * d) / k;
      waves[d] = ctx.createPeriodicWave(re, im);
    });
    var tri = 24, re2 = new Float32Array(tri), im2 = new Float32Array(tri);
    for (var j = 1; j < tri; j += 2) im2[j] = (((j - 1) / 2) % 2 ? -1 : 1) / (j * j);
    waves.tri = ctx.createPeriodicWave(re2, im2);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    var data = noiseBuf.getChannelData(0); for (var i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  function cuandoSuene(fn) {
    if (!ctx) return;
    if (ctx.state === 'running') return fn();
    ctx.resume().then(function () { if (ctx.state === 'running') fn(); }).catch(function () {});
  }
  function desbloquearAudio() {
    crear(); if (!ctx) return;
    if (ctx.state !== 'running') ctx.resume().catch(function () {});
    if (ctx.state === 'running' && actual && !timer) arrancar(actual);
  }
  ['touchstart', 'touchend', 'mousedown', 'click', 'keydown'].forEach(function (ev) { window.addEventListener(ev, desbloquearAudio, { passive: true }); });
  document.addEventListener('visibilitychange', function () { if (ctx) { if (document.hidden) ctx.suspend(); else ctx.resume(); } });

  // ---------- Voces del chip ----------
  function tono(t, f, dur, onda, vol, dest, slide) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.setPeriodicWave(onda === 'tri' ? waves.tri : (waves[onda] || waves[0.5]));
    o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.005);
    g.gain.setValueAtTime(vol * 0.75, t + Math.min(dur * 0.4, 0.08));
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.02);
  }
  function ruido(t, dur, vol, dest, hp) {
    var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; f.type = 'highpass'; f.frequency.value = hp || 1000;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f); f.connect(g); g.connect(dest); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  }
  function emitir(e, t) {
    if (e.drum) {
      if (e.drum === 'k') tono(t, 150, 0.09, 0.5, 0.5, musGain, 45);
      else if (e.drum === 's') ruido(t, 0.09, 0.35, musGain, 1800);
      else ruido(t, 0.03, 0.12, musGain, 7000);
    } else tono(t, e.f, e.d, e.onda, e.vol, musGain);
  }

  // ---------- Fanfarrias de reserva (solo si la música no está activada) ----------
  var SEMI = { c: 0, 'c#': 1, d: 2, 'd#': 3, e: 4, f: 5, 'f#': 6, g: 7, 'g#': 8, a: 9, 'a#': 10, bb: 10, b: 11 };
  function fanfarria(lead, bpm) {
    var paso = 60 / bpm / 4, t = 0, ev = [];
    lead.split(' ').forEach(function (tok) {
      var p = tok.split(':'), l = +(p[1] || 1) * paso, m = /^([a-g](?:#|b)?)(\d)$/.exec(p[0]);
      if (m) ev.push({ t: t, d: l * 0.9, f: 440 * Math.pow(2, (12 * (+m[2] + 1) + SEMI[m[1]] - 69) / 12), onda: 0.25, vol: 0.5 });
      t += l;
    });
    return { ev: ev, len: t };
  }
  var RESERVA = {
    victoria: fanfarria('c5:2 e5:2 g5:2 c6:6 b5:2 c6:2 d6:2 e6:4 g6:8', 140),
    objeto: fanfarria('g5:2 g5:2 g5:2 c6:6 a5:2 b5:2 c6:8', 150),
    nivel: fanfarria('c5:1 e5:1 g5:1 c6:1 e5:1 g5:1 c6:1 e6:1 g6:1 c7:8', 170)
  };

  // ---------- Reproductor ----------
  function detener() { genId++; if (timer) clearInterval(timer); timer = null; }
  function tocar(song, loop, alTerminar) {
    detener();
    if (!ctx || ctx.state !== 'running' || !song || !song.ev.length || song.len <= 0) { if (alTerminar && !loop) setTimeout(alTerminar, 0); return; }
    var gen = genId, base = ctx.currentTime + 0.06, i = 0, ev = song.ev, len = song.len;
    function prog() {
      if (gen !== genId) return;
      var hasta = ctx.currentTime + 0.2, n = 0;
      while (n++ < 400) {
        if (i >= ev.length) { if (loop) { i = 0; base += len; } else break; }
        var t = base + ev[i].t;
        if (t >= hasta) break;
        if (t >= ctx.currentTime - 0.02) emitir(ev[i], t);
        i++;
      }
      if (!loop && i >= ev.length && ctx.currentTime > base + len) { detener(); if (alTerminar) alTerminar(); }
    }
    prog(); timer = setInterval(prog, 40);
  }

  // ---------- Escenas ----------
  var pack = null, cacheMidi = {}, ultimo = {};
  var RESPALDO = { albert: 'calma', dex: 'calma', informe: 'calma', vender: 'calma', intro: 'calma', titulo: 'pueblo', jefe: 'combate', reto: 'combate' };
  function cancion(escena) {
    if (!pack) return null;
    var lista = pack.escenas[escena];
    if ((!lista || !lista.length) && RESPALDO[escena]) lista = pack.escenas[RESPALDO[escena]];
    if (!lista || !lista.length) return null;
    var idx;
    if (escena === 'pueblo') idx = (A.mes || 0) % lista.length;
    else { idx = Math.floor(Math.random() * lista.length); if (lista.length > 1 && idx === ultimo[escena]) idx = (idx + 1) % lista.length; }
    ultimo[escena] = idx;
    var it = lista[idx];
    if (!cacheMidi[it.n]) {
      try { var bin = atob(it.b), u = new Uint8Array(bin.length); for (var k = 0; k < bin.length; k++) u[k] = bin.charCodeAt(k); cacheMidi[it.n] = leerMidi(u.buffer); }
      catch (e) { return null; }
    }
    return cacheMidi[it.n];
  }
  function arrancar(nombre) { actual = nombre; var s = cancion(nombre); if (s) tocar(s, true); else detener(); }

  // Jingle que interrumpe y luego vuelve a `vuelta` (o al tema que sonaba).
  var jingleId = 0;
  A.jingle = function (nombre, vuelta, maxMs) {
    var antes = vuelta || actual, id = ++jingleId;
    actual = null;
    function volver() { if (id === jingleId && antes) A.tema(antes); }
    cuandoSuene(function () {
      var s = cancion(nombre) || RESERVA[nombre];
      if (!s) return volver();
      tocar(s, false, volver);
      setTimeout(volver, maxMs || 7000);
    });
  };
  A.tema = function (nombre) {
    jingleId++;
    if (actual === nombre && timer) return;
    actual = nombre;
    cuandoSuene(function () { if (actual === nombre) arrancar(nombre); });
  };
  A.setMusica = function (on) { A.musica = on; crear(); if (musGain) musGain.gain.value = on ? 0.16 : 0; };
  A.setSfx = function (on) { A.sfx = on; crear(); if (sfxGain) sfxGain.gain.value = on ? 0.28 : 0; };

  // ---------- Efectos ----------
  var SFX = {
    blip: function (t) { tono(t, 1320, 0.025, 0.5, 0.25, sfxGain); },
    mover: function (t) { tono(t, 880, 0.04, 0.25, 0.4, sfxGain); },
    ok: function (t) { tono(t, 988, 0.05, 0.5, 0.5, sfxGain); tono(t + 0.05, 1319, 0.08, 0.5, 0.5, sfxGain); },
    atras: function (t) { tono(t, 660, 0.05, 0.5, 0.45, sfxGain); tono(t + 0.05, 440, 0.07, 0.5, 0.45, sfxGain); },
    choque: function (t) { tono(t, 110, 0.12, 0.5, 0.6, sfxGain, 70); },
    puerta: function (t) { ruido(t, 0.18, 0.4, sfxGain, 600); tono(t, 220, 0.15, 0.25, 0.3, sfxGain, 440); },
    bien: function (t) { [784, 988, 1175, 1568].forEach(function (f, i) { tono(t + i * 0.06, f, 0.08, 0.25, 0.5, sfxGain); }); },
    mal: function (t) { tono(t, 330, 0.12, 0.5, 0.55, sfxGain, 160); ruido(t, 0.15, 0.25, sfxGain, 400); },
    golpe: function (t) { ruido(t, 0.2, 0.6, sfxGain, 300); tono(t, 200, 0.15, 0.5, 0.4, sfxGain, 60); },
    moneda: function (t) { tono(t, 1976, 0.05, 0.5, 0.45, sfxGain); tono(t + 0.05, 2637, 0.18, 0.5, 0.45, sfxGain); },
    bandera: function (t) { [523, 659, 784, 1047, 784, 1047].forEach(function (f, i) { tono(t + i * 0.055, f, 0.07, 0.125, 0.5, sfxGain); }); },
    combate: function (t) { for (var i = 0; i < 10; i++) tono(t + i * 0.05, 300 + (i % 2) * 500, 0.045, 0.5, 0.45, sfxGain); },
    tic: function (t) { tono(t, 2000, 0.02, 0.5, 0.2, sfxGain); },
    carta: function (t) { [1047, 1319, 1568, 2093].forEach(function (f, i) { tono(t + i * 0.07, f, 0.12, 0.25, 0.4, sfxGain); }); }
  };
  A.sfx_ = function (n) { cuandoSuene(function () { if (SFX[n]) SFX[n](ctx.currentTime + 0.005); }); };
  A.vibrar = function (ms) { try { if (navigator.vibrate) navigator.vibrate(ms || 15); } catch (e) {} };

  // ---------- Lector de MIDI → voces del chip ----------
  function leerMidi(buf) {
    var b = new Uint8Array(buf), p = 0;
    function u32() { var v = ((b[p] << 24) | (b[p + 1] << 16) | (b[p + 2] << 8) | b[p + 3]) >>> 0; p += 4; return v; }
    function u16() { var v = (b[p] << 8) | b[p + 1]; p += 2; return v; }
    function vlq() { var v = 0, c, k = 0; do { c = b[p++]; v = (v << 7) | (c & 0x7f); } while ((c & 0x80) && ++k < 4); return v; }
    function str(n) { var s = ''; for (var i = 0; i < n; i++) s += String.fromCharCode(b[p + i]); p += n; return s; }
    if (str(4) !== 'MThd') throw new Error('No es un MIDI');
    var hl = u32(); u16(); var ntr = u16(), div = u16(); p = 8 + hl;
    if (div & 0x8000) throw new Error('MIDI SMPTE no soportado');
    var tempos = [{ tick: 0, us: 500000 }], notas = [];
    for (var tr = 0; tr < ntr && p + 8 <= b.length; tr++) {
      var id = str(4), len = u32(), fin = Math.min(b.length, p + len);
      if (id !== 'MTrk') { p = fin; continue; }
      var tick = 0, run = 0, abiertas = {};
      var cerrar = function (key, tk) { var a = abiertas[key]; if (a) { notas.push({ t0: a.tick, t1: tk, ch: a.ch, n: a.n, v: a.v, voz: a.voz }); delete abiertas[key]; } };
      while (p < fin) {
        tick += vlq();
        var st = b[p];
        if (st & 0x80) { p++; if (st < 0xf0) run = st; } else st = run;
        if (st === 0xff) { var tipo = b[p++], l = vlq(); if (tipo === 0x51 && l === 3) tempos.push({ tick: tick, us: (b[p] << 16) | (b[p + 1] << 8) | b[p + 2] }); p += l; if (tipo === 0x2f) break; }
        else if (st === 0xf0 || st === 0xf7) { p += vlq(); }
        else {
          var te = st & 0xf0, ch = st & 0x0f;
          if (te === 0xc0 || te === 0xd0) p += 1;
          else {
            var d1 = b[p++], d2 = b[p++], key = ch * 128 + d1;
            if (te === 0x90 && d2 > 0) { cerrar(key, tick); abiertas[key] = { tick: tick, ch: ch, n: d1, v: d2, voz: tr * 16 + ch }; }
            else if (te === 0x80 || te === 0x90) cerrar(key, tick);
          }
        }
      }
      Object.keys(abiertas).forEach(function (k) { cerrar(k, tick); });
      p = fin;
    }
    if (!notas.length) throw new Error('El MIDI no tiene notas');
    tempos.sort(function (a, c) { return a.tick - c.tick; });
    function seg(tk) {
      var s = 0, prev = 0, us = 500000;
      for (var i = 0; i < tempos.length && tempos[i].tick <= tk; i++) { s += (tempos[i].tick - prev) * us / div / 1e6; prev = tempos[i].tick; us = tempos[i].us; }
      return s + (tk - prev) * us / div / 1e6;
    }
    // La voz más grave va al triángulo; las demás, a los pulsos.
    var voces = {};
    notas.forEach(function (n) { if (n.ch === 9) return; var v = voces[n.voz] || (voces[n.voz] = { id: n.voz, c: 0, s: 0 }); v.c++; v.s += n.n; });
    var lista = Object.keys(voces).map(function (k) { var v = voces[k]; v.media = v.s / v.c; return v; }).sort(function (a, c) { return c.c - a.c; });
    var grave = lista.slice(0, 4).reduce(function (m, v) { return !m || v.media < m.media ? v : m; }, null);
    var PULSOS = [{ onda: 0.25, vol: 0.42 }, { onda: 0.5, vol: 0.26 }, { onda: 0.125, vol: 0.22 }], k2 = 0, cfg = {};
    lista.forEach(function (v, i) {
      if (grave && v.id === grave.id && lista.length > 1) cfg[v.id] = { onda: 'tri', vol: 0.8 };
      else cfg[v.id] = i < 5 ? PULSOS[Math.min(k2++, 2)] : { onda: 0.125, vol: 0.12 };
    });
    var ev = [], fin2 = 0;
    notas.forEach(function (n) {
      var t = seg(n.t0), d = Math.max(0.03, seg(n.t1) - t);
      fin2 = Math.max(fin2, t + d);
      if (n.ch === 9) { ev.push({ t: t, drum: n.n <= 36 ? 'k' : (n.n === 38 || n.n === 40 || n.n === 37 || n.n === 39) ? 's' : 'h' }); return; }
      var c = cfg[n.voz];
      ev.push({ t: t, d: d * 0.95, f: 440 * Math.pow(2, (n.n - 69) / 12), onda: c.onda, vol: c.vol * (0.55 + 0.45 * n.v / 127) });
    });
    ev.sort(function (a, c) { return a.t - c.t; });
    var ini = ev[0].t; ev.forEach(function (e) { e.t -= ini; });
    return { ev: ev.slice(0, 30000), len: Math.max(0.5, fin2 - ini) };
  }
  A.leerMidi = leerMidi;

  // ---------- Desbloqueo de la música integrada ----------
  function normal(c) { return String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); }
  A.desbloquear = function (codigo) {
    var c = normal(codigo);
    if (!c || !window.crypto || !crypto.subtle) return Promise.resolve(false);
    return fetch('musica.pack').then(function (r) { if (!r.ok) throw new Error('sin pack'); return r.arrayBuffer(); }).then(function (buf) {
      var u = new Uint8Array(buf);
      if (String.fromCharCode(u[0], u[1], u[2], u[3]) !== 'HLD1') throw new Error('pack raro');
      var salt = u.slice(4, 20), iv = u.slice(20, 32), ct = u.slice(32), te = new TextEncoder();
      return crypto.subtle.importKey('raw', te.encode(c), 'PBKDF2', false, ['deriveKey'])
        .then(function (base) { return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: salt, iterations: 150000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']); })
        .then(function (key) { return crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv }, key, ct); })
        .then(function (plano) {
          pack = JSON.parse(new TextDecoder().decode(plano)); cacheMidi = {};
          try { localStorage.setItem(CLAVE, c); } catch (e) {}
          if (actual) { var n = actual; actual = null; A.tema(n); }
          return true;
        });
    }).catch(function () { return false; });
  };
  A.iniciar = function () {
    var c = null; try { c = localStorage.getItem(CLAVE); } catch (e) {}
    return c ? A.desbloquear(c) : Promise.resolve(false);
  };
  A.activa = function () { return !!pack; };
  // Diagnóstico: ¿cada escena tiene una canción que se puede tocar?
  A.diagnostico = function () { if (!pack) return null; var o = {}; Object.keys(pack.escenas).forEach(function (e) { var s = cancion(e); o[e] = s ? Math.round(s.len) + 's' : 'FALLA'; }); return o; };
  A.olvidar = function () { pack = null; cacheMidi = {}; try { localStorage.removeItem(CLAVE); } catch (e) {} detener(); };
  A.canciones = function () { if (!pack) return 0; return Object.keys(pack.escenas).reduce(function (a, k) { return a + pack.escenas[k].length; }, 0); };
})();

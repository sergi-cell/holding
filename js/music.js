// HOLDING — chip de sonido estilo Game Boy: 2 pulsos (12,5/25/50%), onda triangular de bajo y ruido.
// Toca los MIDIs que carga el jugador a través del chip. Arreglo de iOS: nada se programa hasta que el AudioContext está 'running'.
var H = window.H || (window.H = {});
(function () {
  'use strict';
  var ctx = null, master = null, musGain = null, sfxGain = null, noiseBuf = null, waves = {};
  var actual = null, timer = null;
  var A = H.audio = { musica: true, sfx: true };

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
  function desbloquear() {
    crear(); if (!ctx) return;
    if (ctx.state !== 'running') ctx.resume().catch(function () {});
    if (ctx.state === 'running' && actual && !timer && !audioEl) arrancar(actual);
  }
  ['touchstart', 'touchend', 'mousedown', 'click', 'keydown'].forEach(function (ev) { window.addEventListener(ev, desbloquear, { passive: true }); });
  document.addEventListener('visibilitychange', function () {
    if (!ctx) return;
    if (document.hidden) { ctx.suspend(); if (audioEl) audioEl.pause(); }
    else { ctx.resume(); if (audioEl) audioEl.play().catch(function () {}); }
  });

  var SEMI = { c: 0, 'c#': 1, db: 1, d: 2, 'd#': 3, eb: 3, e: 4, f: 5, 'f#': 6, gb: 6, g: 7, 'g#': 8, ab: 8, a: 9, 'a#': 10, bb: 10, b: 11 };
  function freq(nota, trans) {
    var m = /^([a-g](?:#|b)?)(\d)$/.exec(nota); if (!m) return 0;
    var midi = 12 * (+m[2] + 1) + SEMI[m[1]] + (trans || 0);
    return 440 * Math.pow(2, (midi - 69) / 12);
  }
  function parse(str) {
    return str.trim().split(/\s+/).map(function (tok) { var p = tok.split(':'); return { n: p[0], l: +(p[1] || 1) }; });
  }

  function tono(t, f, dur, onda, vol, dest, slide) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    if (onda === 'tri') o.setPeriodicWave(waves.tri); else o.setPeriodicWave(waves[onda] || waves[0.5]);
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

  // Solo fanfarrias cortas (subir de nivel, carta nueva). La música de fondo la pone el jugador.
  var TEMAS = {
    victoria: { bpm: 140, loop: false, lead: 'c5:2 e5:2 g5:2 c6:6 r:1 a5:1 b5:2 c6:2 d6:2 e6:4 d6:2 c6:2 d6:2 g6:8 e6:2 f6:2 g6:2 c7:12', arp: 'e4:2 g4:2 c5:2 e5:6 r:2 f4:2 a4:2 c5:2 f5:4 r:4 g4:2 b4:2 d5:2 g5:8 c5:2 e5:2 g5:2 c6:12', bajo: 'c3:8 c3:4 f2:8 f2:4 g2:8 g2:4 c3:16', drum: '', leadDuty: 0.5, arpDuty: 0.25 },
    objeto: { bpm: 150, loop: false, lead: 'g5:2 g5:2 g5:2 c6:6 r:2 a5:2 b5:2 c6:8', arp: 'e5:2 e5:2 e5:2 e5:6 r:2 f5:2 g5:2 e5:8', bajo: 'c3:6 c3:6 r:2 f2:2 g2:2 c3:8', drum: '', leadDuty: 0.25, arpDuty: 0.125 },
    nivel: { bpm: 170, loop: false, lead: 'c5:1 e5:1 g5:1 c6:1 e5:1 g5:1 c6:1 e6:1 g5:1 c6:1 e6:1 g6:1 c7:8', arp: 'g4:4 c5:4 e5:4 g5:8', bajo: 'c3:4 g2:4 c3:4 c2:8', drum: '', leadDuty: 0.125, arpDuty: 0.25 }
  };

  // ---------- Reproductor único: temas del chip, MIDIs del jugador o audio ----------
  var genId = 0, audioEl = null;
  function eventosTema(T) {
    var paso = 60 / T.bpm / 4, out = [], len = 0;
    [{ s: T.lead, onda: T.leadDuty, vol: 0.55 }, { s: T.arp, onda: T.arpDuty, vol: 0.22 }, { s: T.bajo, onda: 'tri', vol: 0.9 }, { s: T.drum, drum: true }].forEach(function (c) {
      if (!c.s) return;
      var t = 0;
      parse(c.s).forEach(function (e) {
        var dur = e.l * paso;
        if (c.drum) out.push({ t: t, drum: e.n });
        else if (e.n !== 'r') out.push({ t: t, d: dur * 0.92, f: freq(e.n, T.trans), onda: c.onda, vol: c.vol });
        t += dur;
      });
      len = Math.max(len, t);
    });
    out.sort(function (a, b) { return a.t - b.t; });
    return { ev: out, len: len };
  }
  function emitir(e, t) {
    if (e.drum) {
      if (e.drum === 'k') tono(t, 150, 0.09, 0.5, 0.5, musGain, 45);
      else if (e.drum === 's') ruido(t, 0.09, 0.35, musGain, 1800);
      else ruido(t, 0.03, 0.12, musGain, 7000);
    } else tono(t, e.f, e.d, e.onda, e.vol, musGain);
  }
  function detener() {
    genId++;
    if (timer) clearInterval(timer); timer = null;
    if (audioEl) { audioEl.pause(); audioEl = null; }
  }
  function tocarLista(song, loop, alTerminar) {
    detener();
    if (!ctx || ctx.state !== 'running' || !song.ev.length || song.len <= 0) return;
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
  function tocarAudio(url, loop, alTerminar) {
    detener();
    var el = new Audio(url); el.loop = loop; el.muted = !A.musica;
    if (!loop) el.onended = function () { if (audioEl === el) { audioEl = null; if (alTerminar) alTerminar(); } };
    audioEl = el; el.play().catch(function () {});
  }
  var EV_CACHE = {};
  function fuente(nombre) {
    var slot = { pueblo: 'pueblo', combate: 'combate', calma: 'calma', reto: 'reto', victoria: 'victoria' }[nombre];
    if (propiasOn && slot) {
      var lista = custom[slot] && custom[slot].length ? custom[slot] : (slot === 'reto' && custom.combate && custom.combate.length ? custom.combate : null);
      if (lista) return lista[(A.mes || 0) % lista.length];
    }
    return null;
  }
  function sonar(nombre, loop, alTerminar) {
    var f = fuente(nombre);
    if (f && f.tipo === 'midi') return tocarLista(f.song, loop, alTerminar);
    if (f && f.tipo === 'audio') return tocarAudio(f.url, loop, alTerminar);
    var T = TEMAS[nombre]; if (!T || T.loop) { detener(); return; }
    var c = EV_CACHE[nombre] || (EV_CACHE[nombre] = eventosTema(T));
    tocarLista(c, loop, alTerminar);
  }
  function arrancar(nombre) { actual = nombre; sonar(nombre, true); }
  function parar() { detener(); actual = null; }

  // Jingle corto que interrumpe y luego vuelve al tema que sonaba.
  var jingleId = 0;
  A.jingle = function (nombre, vuelta) {
    var antes = vuelta || actual, id = ++jingleId;
    cuandoSuene(function () {
      sonar(nombre, false, function () { if (id === jingleId) { if (antes) A.tema(antes); } });
      // seguridad: si un MIDI largo hace de victoria, se corta a los 6 s
      setTimeout(function () { if (id === jingleId && antes && actual !== antes) A.tema(antes); }, 6000);
      actual = null;
    });
  };
  A.tema = function (nombre) {
    jingleId++;
    if (actual === nombre && (timer || audioEl)) return;
    actual = nombre;
    cuandoSuene(function () { if (actual === nombre) arrancar(nombre); });
  };
  A.setMusica = function (on) {
    A.musica = on; crear();
    if (musGain) musGain.gain.value = on ? 0.16 : 0;
    if (audioEl) audioEl.muted = !on;
  };
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

  // ---------- Tu música: MIDIs o audio del jugador, guardados SOLO en su móvil ----------
  // Los MIDIs se leen aquí y suenan a través del chip Game Boy del juego.
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
    // Reparto de voces al chip: la más grave al triángulo, las demás a los pulsos.
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

  function idb(fn) {
    try {
      var rq = indexedDB.open('holding_musica', 2);
      rq.onupgradeneeded = function () { var db = rq.result; if (db.objectStoreNames.contains('f')) db.deleteObjectStore('f'); db.createObjectStore('f'); };
      rq.onsuccess = function () { fn(rq.result); };
      rq.onerror = function () { fn(null); };
    } catch (e) { fn(null); }
  }
  var custom = {}, propiasOn = false;
  A.SLOTS = { pueblo: '🏘️ Pueblo', combate: '⚔️ Negociación', reto: '👁️ Ojo clínico', calma: '🏠 Interiores', victoria: '🏆 Victoria' };
  var REGLAS = {
    victoria: [/badge|medal|medalla|fanfare|acquired|received|1st|place|win\b/],
    reto: [/gym|gimnasio/, /champion|leader|boss|campe/],
    combate: [/trainer.*battle|battle.*trainer/, /wild.*battle/, /battle|combate|batalla|fight/],
    calma: [/lab/, /center|centro/, /theme|tema/, /park|radio|house|casa/],
    pueblo: [/town|pueblo/, /city|ciudad/, /route|ruta|road/]
  };
  function esMidi(f) { return /\.midi?$/i.test(f.name) || /midi/.test(f.type || ''); }
  function prepararArchivo(f) {
    return new Promise(function (res) {
      if (esMidi(f)) {
        f.arrayBuffer().then(function (buf) { try { res({ nombre: f.name, tipo: 'midi', song: leerMidi(buf), file: f }); } catch (e) { res(null); } }).catch(function () { res(null); });
      } else if (/^audio\//.test(f.type || '') || /\.(mp3|m4a|wav|ogg|aac)$/i.test(f.name)) res({ nombre: f.name, tipo: 'audio', url: URL.createObjectURL(f), file: f });
      else res(null);
    });
  }
  // Reparte automáticamente por nombre de archivo. Devuelve el resumen por hueco.
  A.cargarArchivos = function (files, cb) {
    Promise.all(Array.prototype.map.call(files, prepararArchivo)).then(function (items) {
      items = items.filter(Boolean).sort(function (a, b) { return a.nombre.localeCompare(b.nombre); });
      var asig = { pueblo: [], combate: [], reto: [], calma: [], victoria: [] }, usados = {};
      Object.keys(REGLAS).forEach(function (slot) {
        REGLAS[slot].some(function (re) {
          var m = items.filter(function (it) { var n = it.nombre.toLowerCase(); return !usados[it.nombre] && re.test(n) && !(slot === 'victoria' && /road/.test(n)) && !(slot === 'combate' && /gym|champion|leader/.test(n)); });
          if (!m.length) return false;
          m.forEach(function (it) { asig[slot].push(it); usados[it.nombre] = true; });
          return false;
        });
      });
      if (!asig.pueblo.length) asig.pueblo = items.filter(function (it) { return !usados[it.nombre]; }).slice(0, 4);
      idb(function (db) {
        Object.keys(asig).forEach(function (k) { if (asig[k].length) custom[k] = asig[k]; });
        propiasOn = true;
        if (!db) return cb && cb(asig, items.length);
        var tx = db.transaction('f', 'readwrite'), st = tx.objectStore('f');
        Object.keys(asig).forEach(function (k) { if (asig[k].length) st.put(asig[k].map(function (it) { return it.file; }), k); });
        tx.oncomplete = function () { cb && cb(asig, items.length); };
        tx.onerror = function () { cb && cb(asig, items.length); };
      });
    });
  };
  A.cargarPropias = function (cb) {
    idb(function (db) {
      if (!db) return cb && cb({});
      var tx = db.transaction('f', 'readonly'), st = tx.objectStore('f'), pend = [];
      Object.keys(A.SLOTS).forEach(function (k) { var r = st.get(k); r.onsuccess = function () { if (Array.isArray(r.result) && r.result.length) pend.push([k, r.result]); }; });
      tx.oncomplete = function () {
        Promise.all(pend.map(function (pr) { return Promise.all(pr[1].map(prepararArchivo)).then(function (its) { its = its.filter(Boolean); if (its.length) custom[pr[0]] = its; }); }))
          .then(function () { if (A.hayPropias() && A.quiereApagar !== true) propiasOn = true; cb && cb(custom); });
      };
    });
  };
  A.borrarPropia = function (cb) {
    idb(function (db) { custom = {}; if (!db) return cb && cb(); var tx = db.transaction('f', 'readwrite'); tx.objectStore('f').clear(); tx.oncomplete = function () { cb && cb(); }; });
  };
  A.resumenPropias = function () { var o = {}; Object.keys(A.SLOTS).forEach(function (k) { o[k] = (custom[k] || []).map(function (it) { return it.nombre.replace(/\.(midi?|mp3|m4a|wav|ogg|aac)$/i, ''); }); }); return o; };
  A.tienePropia = function (k) { return !!(custom[k] && custom[k].length); };
  A.hayPropias = function () { return Object.keys(custom).some(function (k) { return custom[k] && custom[k].length; }); };
  A.activarPropias = function (on) { propiasOn = !!on; var n = actual || 'pueblo'; actual = null; A.tema(n); };
  A.usandoPropias = function () { return propiasOn; };
  A.mes = 0;
})();

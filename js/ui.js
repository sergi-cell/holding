// HOLDING — núcleo de interfaz: mando, diálogos, menús, paneles, HUD, avisos y celebraciones.
var H = window.H || (window.H = {});
(function () {
  'use strict';
  var UI = H.ui = {};
  var pila = [];
  function $(q, r) { return (r || document).querySelector(q); }
  function $$(q, r) { return Array.prototype.slice.call((r || document).querySelectorAll(q)); }
  UI.$ = $; UI.$$ = $$;
  UI.esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  UI.ocupado = function () { return pila.length > 0; };
  UI.push = function (h) { pila.push(h); return h; };
  UI.pop = function (h) { var i = pila.indexOf(h); if (i >= 0) pila.splice(i, 1); };
  UI.dormir = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

  // ---------- Entrada: mando en pantalla + teclado ----------
  var repe = null;
  function enviar(tipo, dir) {
    var top = pila[pila.length - 1];
    if (top) { if (top[tipo]) top[tipo](dir); return; }
    if (tipo === 'a') H.world.interactuar();
    else if (tipo === 'start') H.pantallas.menuStart();
  }
  function pulsarDir(dir) {
    H.world.dir = dir;
    if (pila.length) {
      enviar('dir', dir);
      clearTimeout(repe); clearInterval(repe);
      repe = setTimeout(function () { repe = setInterval(function () { if (H.world.dir === dir) enviar('dir', dir); }, 110); }, 320);
    }
  }
  function soltarDir() { H.world.dir = null; clearTimeout(repe); clearInterval(repe); }

  UI.initMando = function () {
    var pad = $('#cruceta'), actual = null;
    function dirDe(e) {
      var r = pad.getBoundingClientRect(), x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2);
      if (Math.abs(x) < 8 && Math.abs(y) < 8) return actual;
      return Math.abs(x) > Math.abs(y) ? (x > 0 ? 'right' : 'left') : (y > 0 ? 'down' : 'up');
    }
    pad.addEventListener('pointerdown', function (e) { e.preventDefault(); pad.setPointerCapture(e.pointerId); actual = dirDe(e); pad.dataset.d = actual; H.audio.vibrar(8); pulsarDir(actual); });
    pad.addEventListener('pointermove', function (e) { if (!actual) return; var d = dirDe(e); if (d !== actual) { actual = d; pad.dataset.d = d; pulsarDir(d); } });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (ev) { pad.addEventListener(ev, function () { actual = null; pad.dataset.d = ''; soltarDir(); }); });
    function boton(sel, tipo) {
      var b = $(sel);
      b.addEventListener('pointerdown', function (e) { e.preventDefault(); b.classList.add('on'); H.audio.vibrar(10); if (tipo === 'b') H.world.correr = true; enviar(tipo); });
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) { b.addEventListener(ev, function () { b.classList.remove('on'); if (tipo === 'b') H.world.correr = false; }); });
    }
    boton('#btnA', 'a'); boton('#btnB', 'b'); boton('#btnStart', 'start'); boton('#btnSelect', 'start');
    var MAP = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right' };
    window.addEventListener('keydown', function (e) {
      if (e.target && e.target.tagName === 'INPUT') return;
      if (MAP[e.key]) { e.preventDefault(); if (!e.repeat) pulsarDir(MAP[e.key]); }
      else if (e.key === 'z' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!e.repeat) enviar('a'); }
      else if (e.key === 'x' || e.key === 'Escape' || e.key === 'Backspace') { e.preventDefault(); H.world.correr = true; if (!e.repeat) enviar('b'); }
      else if (e.key === 'm' || e.key === 'Tab') { e.preventDefault(); if (!e.repeat) enviar('start'); }
    });
    window.addEventListener('keyup', function (e) {
      if (MAP[e.key] && H.world.dir === MAP[e.key]) soltarDir();
      if (e.key === 'x' || e.key === 'Escape' || e.key === 'Backspace') H.world.correr = false;
    });
    document.addEventListener('gesturestart', function (e) { e.preventDefault(); });
  };

  // ---------- Diálogo con máquina de escribir ----------
  UI.decir = function (lineas, op) {
    op = op || {};
    if (typeof lineas === 'string') lineas = [lineas];
    return new Promise(function (res) {
      var el = $('#dialogo'), i = 0, p, txt, pos, timer, completo, h;
      el.hidden = false; el.className = 'caja dialogo' + (op.clase ? ' ' + op.clase : '');
      function mostrar() {
        txt = lineas[i]; pos = 0; completo = false;
        el.classList.remove('listo');
        el.innerHTML = (op.nombre ? '<b class="nom">' + UI.esc(op.nombre) + '</b>' : '') + '<p></p><i class="flecha">▼</i>';
        p = el.querySelector('p');
        timer = setInterval(function () {
          pos += 2; p.textContent = txt.slice(0, pos);
          if (pos % 4 === 0) H.audio.sfx_('blip');
          if (pos >= txt.length) { clearInterval(timer); completo = true; el.classList.add('listo'); }
        }, 24);
      }
      function avanzar() {
        if (!completo) { clearInterval(timer); p.textContent = txt; completo = true; el.classList.add('listo'); return; }
        i++;
        if (i >= lineas.length) { UI.pop(h); el.hidden = true; el.onclick = null; res(); }
        else { H.audio.sfx_('mover'); mostrar(); }
      }
      h = UI.push({ a: avanzar, b: avanzar });
      el.onclick = avanzar;
      mostrar();
    });
  };

  // ---------- Menú con cursor ▶ ----------
  // ops: ['texto', {t, sub, off, ico, d}] · op: {pregunta, titulo, cancelable, cols, detalle}
  // Con `detalle`, la caja de diálogo explica la opción marcada (y en táctil: 1er toque marca, 2º elige).
  UI.elegir = function (ops, op) {
    op = op || {};
    return new Promise(function (res) {
      var el = $('#menu'), dlg = $('#dialogo'), idx = 0, h, cols = op.cols || 1;
      ops = ops.map(function (o) { return typeof o === 'string' ? { t: o } : o; });
      while (ops[idx] && ops[idx].off) idx++;
      if (op.pregunta) { dlg.hidden = false; dlg.className = 'caja dialogo listo fija'; dlg.innerHTML = (op.nombre ? '<b class="nom">' + UI.esc(op.nombre) + '</b>' : '') + '<p>' + UI.esc(op.pregunta) + '</p>'; dlg.onclick = null; }
      el.hidden = false;
      el.className = 'caja menu' + (op.pregunta ? ' sobre' : '') + (cols > 1 ? ' cols' : '') + (op.clase ? ' ' + op.clase : '');
      el.style.setProperty('--cols', cols);
      function pintar() {
        el.innerHTML = (op.titulo ? '<h4>' + UI.esc(op.titulo) + '</h4>' : '') + '<ul>' + ops.map(function (o, i) {
          return '<li data-i="' + i + '" class="' + (i === idx ? 'sel ' : '') + (o.off ? 'off' : '') + '"><span class="cur">▶</span><span class="t">' + (o.ico ? '<em>' + o.ico + '</em>' : '') + UI.esc(o.t) + (o.sub ? '<small>' + UI.esc(o.sub) + '</small>' : '') + '</span></li>';
        }).join('') + '</ul>';
        $$('li', el).forEach(function (li) {
          li.onclick = function () {
            var i = +li.dataset.i; if (ops[i].off) { H.audio.sfx_('choque'); return; }
            if (op.detalle && ops[i].d && i !== idx) { idx = i; H.audio.sfx_('mover'); pintar(); return; }
            idx = i; elegir();
          };
        });
        var sel = $('li.sel', el); if (sel && sel.scrollIntoView) sel.scrollIntoView({ block: 'nearest' });
        if (op.detalle && op.pregunta) { var pd = $('p', dlg); if (pd) pd.textContent = (ops[idx] && ops[idx].d) || op.pregunta; }
      }
      function mover(d) {
        var paso = d === 'up' ? -cols : d === 'down' ? cols : d === 'left' ? -1 : 1;
        if (cols === 1 && (d === 'left' || d === 'right')) return;
        var n = idx;
        for (var k = 0; k < ops.length; k++) { n = (n + paso + ops.length) % ops.length; if (!ops[n].off) break; }
        if (n !== idx) { idx = n; H.audio.sfx_('mover'); pintar(); }
      }
      var cerrado = false;
      function cerrar(v) { if (cerrado) return; cerrado = true; UI.pop(h); el.hidden = true; $$('li', el).forEach(function (li) { li.onclick = null; }); if (op.pregunta) dlg.hidden = true; res(v); }
      function elegir() { H.audio.sfx_('ok'); cerrar(idx); }
      h = UI.push({ dir: mover, a: elegir, b: function () { if (op.cancelable !== false) { H.audio.sfx_('atras'); cerrar(-1); } } });
      pintar();
    });
  };
  UI.si = function (pregunta, op) { return UI.elegir(['SÍ', 'NO'], Object.assign({ pregunta: pregunta, cancelable: true }, op || {})).then(function (i) { return i === 0; }); };

  // ---------- Paneles a pantalla completa con navegación espacial ----------
  // Todo lo que tenga [data-f] se puede enfocar con la cruceta y pulsar con A.
  UI.panel = function (html, op) {
    op = op || {};
    var el = document.createElement('div');
    el.className = 'panel ' + (op.clase || '');
    el.innerHTML = html;
    $('#capa').appendChild(el);
    var foco = null, h;
    function focos() { return $$('[data-f]', el).filter(function (x) { return !x.disabled && x.offsetParent !== null; }); }
    function enfocar(x) { if (foco) foco.classList.remove('foco'); foco = x; if (x) { x.classList.add('foco'); if (x.scrollIntoView) x.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } }
    function navegar(d) {
      var fs = focos(); if (!fs.length) return;
      if (!foco || fs.indexOf(foco) < 0) { enfocar(fs[0]); H.audio.sfx_('mover'); return; }
      var a = foco.getBoundingClientRect(), ax = a.left + a.width / 2, ay = a.top + a.height / 2, mejor = null, md = 1e9;
      fs.forEach(function (x) {
        if (x === foco) return;
        var b = x.getBoundingClientRect(), bx = b.left + b.width / 2, by = b.top + b.height / 2, dx = bx - ax, dy = by - ay;
        var ok = d === 'up' ? dy < -4 : d === 'down' ? dy > 4 : d === 'left' ? dx < -4 : dx > 4;
        if (!ok) return;
        var dist = (d === 'up' || d === 'down') ? Math.abs(dy) + Math.abs(dx) * 2.2 : Math.abs(dx) + Math.abs(dy) * 2.2;
        if (dist < md) { md = dist; mejor = x; }
      });
      if (mejor) { enfocar(mejor); H.audio.sfx_('mover'); }
    }
    var api = {
      el: el,
      cerrar: function () { UI.pop(h); el.classList.add('fuera'); setTimeout(function () { el.remove(); }, 160); if (op.alCerrar) op.alCerrar(); },
      enfocar: enfocar, focos: focos
    };
    h = UI.push({
      dir: function (d) { if (op.dir && op.dir(d) === true) return; navegar(d); },
      a: function () { if (op.a && op.a() === true) return; if (foco && el.contains(foco)) foco.click(); else navegar('down'); },
      b: function () { if (op.b) op.b(api); else if (op.cerrable !== false) { H.audio.sfx_('atras'); api.cerrar(); } }
    });
    api.h = h;
    el.addEventListener('click', function (e) { var f = e.target.closest('[data-f]'); if (f && el.contains(f)) enfocar(f); });
    return api;
  };

  // ---------- Sprites en el DOM ----------
  UI.sprite = function (look, dir, escala, clase) {
    var src = H.persona(look, dir || 'down', 0), c = H.cv(16, 16);
    c.getContext('2d').drawImage(src, 0, 0);
    c.className = 'spr ' + (clase || ''); c.style.width = (16 * escala) + 'px'; c.style.height = (16 * escala) + 'px';
    return c;
  };
  UI.edificioCanvas = function (sec, propio, escala) {
    var c = H.cv(80, 64), x = c.getContext('2d');
    x.fillStyle = '#86cf63'; x.fillRect(0, 0, 80, 64);
    for (var i = 0; i < 5; i++) for (var j = 0; j < 4; j++) H.TILE.grass(x, i * 16, j * 16, i + 40, j + 40);
    H.edificio(x, 8, 12, 4, 3, { roof: sec.c[1], wall: propio ? '#fffbeb' : '#f1f5f9', emoji: sec.e, chimenea: ['metal', 'obrador', 'imprenta'].indexOf(sec.id) >= 0 });
    if (propio) H.bandera(x, 60, 14, 0);
    c.className = 'spr edif'; c.style.width = (80 * escala) + 'px'; c.style.height = (64 * escala) + 'px';
    return c;
  };

  // ---------- HUD y misión ----------
  UI.hud = function () {
    var s = H.estado; if (!s) return;
    var rayos = ''; for (var i = 0; i < s.energiaMax; i++) rayos += '<i class="' + (i < s.energia ? 'on' : '') + '">⚡</i>';
    $('#hud').innerHTML =
      '<div class="nv"><b>Nv.' + s.nivel + '</b><span class="xpbar"><span style="width:' + Math.round(H.progresoNivel(s) * 100) + '%"></span></span></div>' +
      '<div class="mes">' + H.MESES[(9 + s.mes) % 12].slice(0, 3).toUpperCase() + " '" + String(2026 + Math.floor((9 + s.mes) / 12)).slice(2) + '</div>' +
      '<div class="rayos">' + rayos + '</div>' +
      '<div class="parte' + (s.tuParte < 0 ? ' neg' : '') + '" title="Tu parte (25%)">⭐ ' + H.eur(s.tuParte) + deltaParte(s) + '</div>';
    var m = H.misionActual(s);
    var mi = $('#mision');
    if (m) { mi.hidden = false; mi.innerHTML = '<b>▶ ' + UI.esc(m.t) + '</b><span>' + UI.esc(m.pista) + '</span>'; H.world.objetivo = H.world.posObjetivo(m.ir); }
    else { mi.hidden = true; H.world.objetivo = null; }
  };

  // ---------- Pistas de Albert: una línea, no bloquean, se van solas ----------
  var colaPistas = [], pistaViva = false;
  UI.pista = function (txt) {
    // En combate no hay sitio arriba: la pista va como una línea de Albert en el diálogo.
    if (document.querySelector('.p-batalla')) { colaPistas = []; return UI.decir(txt, { nombre: 'ALBERT 📞' }); }
    colaPistas.push({ t: txt, ts: Date.now() }); if (!pistaViva) siguientePista();
  };
  UI.limpiarPistas = function () { colaPistas = []; var el = $('#pista'); if (el) el.hidden = true; pistaViva = false; };
  function siguientePista() {
    var it = colaPistas.shift();
    while (it && Date.now() - it.ts > 12000) it = colaPistas.shift();   // las pistas caducan: nada de consejos fuera de sitio
    if (!it) { pistaViva = false; return; }
    var t = it.t;
    pistaViva = true;
    var el = $('#pista'); el.innerHTML = '<span class="cara"></span><p>' + UI.esc(t) + '</p>';
    $('.cara', el).appendChild(UI.sprite(H.LOOK_ALBERT, 'down', 2));
    el.hidden = false; el.classList.remove('fuera');
    var cerrar = function () { if (el.hidden) return; el.classList.add('fuera'); setTimeout(function () { el.hidden = true; siguientePista(); }, 220); };
    el.onclick = cerrar; clearTimeout(el._t); el._t = setTimeout(cerrar, 6500);
  }

  function deltaParte(s) {
    var dl = s.tuParte - (s.parteMes || 0);
    if (Math.abs(dl) < 1000) return '';
    return ' <i class="' + (dl > 0 ? 'sube' : 'baja') + '">' + (dl > 0 ? '▲' : '▼') + H.eur(Math.abs(dl)).replace(' €', '') + '</i>';
  }
  // Animación de "tu parte" al cambiar (palancas, compras): número flotante en el HUD.
  UI.parteCambio = function (antes) {
    var s = H.estado; H.actualizarParte(s); var dl = s.tuParte - antes;
    UI.hud();
    if (Math.abs(dl) < 500) return dl;
    var hp = $('#hud .parte'); if (hp) UI.flotar(hp, (dl > 0 ? '+' : '') + H.eur(dl) + ' ⭐', dl > 0 ? 'verde' : 'rojo');
    return dl;
  };

  // ---------- Avisos ----------
  UI.aviso = function (html, tipo) {
    var t = document.createElement('div');
    t.className = 'aviso ' + (tipo || '');
    t.innerHTML = html;
    $('#avisos').appendChild(t);
    setTimeout(function () { t.classList.add('fuera'); }, 2600);
    setTimeout(function () { t.remove(); }, 3000);
  };
  UI.flotar = function (cont, txt, clase) {
    var f = document.createElement('div'); f.className = 'flota ' + (clase || ''); f.textContent = txt;
    cont.appendChild(f); setTimeout(function () { f.remove(); }, 1200);
  };

  // ---------- Recompensas: XP, cartas, misiones, niveles ----------
  var cola = [];
  UI.xp = function (n) {
    if (!n) return;
    var subidas = H.ganarXP(H.estado, n);
    UI.aviso('<b>+' + Math.round(n) + ' XP</b>', 'xp');
    subidas.forEach(function (nv) { cola.push({ tipo: 'nivel', nv: nv }); });
    UI.hud();
  };
  UI.aprender = function (ids) {
    (Array.isArray(ids) ? ids : [ids]).forEach(function (id) {
      if (H.aprender(H.estado, id)) {
        var c = H.CODEX[id];
        cola.push({ tipo: 'carta', id: id });
        UI.aviso('<em>' + c.e + '</em> ¡Nueva carta en el DEALDEX! <b>' + UI.esc(c.n) + '</b>', 'nueva');
      }
    });
  };
  // Se llama al terminar cada acción: guarda, revisa misiones y celebra lo pendiente.
  UI.tras = async function () {
    var s = H.estado;
    H.audio.mes = s.mes;
    H.actualizarParte(s);
    H.revisarMisiones(s).forEach(function (m) { cola.push({ tipo: 'mision', m: m }); });
    H.guardar(s); UI.hud();
    while (cola.length) {
      var c = cola.shift();
      if (c.tipo === 'mision') {
        H.audio.jingle('objeto');
        await UI.celebrar('<div class="cel-ico">✅</div><h2>¡MISIÓN CUMPLIDA!</h2><p>' + UI.esc(c.m.t) + '</p><p class="oro">+' + c.m.xp + ' XP</p>');
        var sub = H.ganarXP(s, c.m.xp); sub.forEach(function (nv) { cola.push({ tipo: 'nivel', nv: nv }); });
        H.revisarMisiones(s).forEach(function (m) { cola.push({ tipo: 'mision', m: m }); });
      } else if (c.tipo === 'nivel') {
        H.audio.jingle('nivel');
        var extra = [];
        if (c.nv === H.NIVEL_POLIGONO) { extra.push('🏭 ¡Se abre el POLÍGONO INDUSTRIAL! 4 solares nuevos.'); H.world.rebuild(); }
        if (c.nv % 2 === 0) extra.push('⚡ +1 de tiempo al mes. Ahora tienes ' + s.energiaMax + '.');
        extra.push('🏢 Empresas más grandes en venta (hasta ' + H.eur(Math.min(3000000, 1300000 + (c.nv - 1) * 350000)) + ').');
        await UI.celebrar('<div class="cel-ico sube">⬆️</div><h2>¡NIVEL ' + c.nv + '!</h2><p class="oro">' + UI.esc(H.NIVELES[Math.min(H.NIVELES.length - 1, c.nv - 1)]) + '</p>' + extra.map(function (e) { return '<p class="peq">' + UI.esc(e) + '</p>'; }).join(''));
      }
    }
    H.guardar(s); UI.hud();
  };
  UI.celebrar = function (html) {
    return new Promise(function (res) {
      var p = UI.panel('<div class="celebra">' + html + '<button class="btn grande" data-f>¡GENIAL!</button></div><canvas class="confeti"></canvas>', { clase: 'cel', cerrable: false, b: function (api) { api.cerrar(); res(); } });
      confeti($('canvas.confeti', p.el));
      var b = $('button', p.el); p.enfocar(b);
      b.onclick = function () { H.audio.sfx_('ok'); p.cerrar(); res(); };
    });
  };
  function confeti(c) {
    var r = c.parentNode.getBoundingClientRect(); c.width = r.width; c.height = r.height;
    var x = c.getContext('2d'), ps = [], cols = ['#ffd43b', '#ef4444', '#22c55e', '#3b82f6', '#a855f7', '#ffffff'];
    for (var i = 0; i < 90; i++) ps.push({ x: Math.random() * c.width, y: -Math.random() * c.height * 0.6, vx: (Math.random() - 0.5) * 2, vy: 1.5 + Math.random() * 3, s: 4 + Math.floor(Math.random() * 4), c: cols[i % cols.length], r: Math.random() * 6 });
    var t0 = performance.now();
    (function loop(t) {
      if (!c.isConnected || t - t0 > 4000) return;
      x.clearRect(0, 0, c.width, c.height);
      ps.forEach(function (p) { p.x += p.vx; p.y += p.vy; p.r += 0.1; x.fillStyle = p.c; x.fillRect(Math.round(p.x), Math.round(p.y), p.s, Math.max(2, Math.round(p.s * Math.abs(Math.cos(p.r))))); });
      requestAnimationFrame(loop);
    })(t0);
  }
  UI.confeti = confeti;

  // Transición de combate: barras negras como en Game Boy.
  UI.transicion = function (tipo) {
    return new Promise(function (res) {
      var t = $('#trans'); t.className = 'trans ' + (tipo || 'combate'); t.hidden = false;
      setTimeout(function () { res(); }, 650);
      setTimeout(function () { t.hidden = true; t.className = 'trans'; }, 1000);
    });
  };

  // Contador que sube (para dinero)
  UI.contar = function (el, desde, hasta, ms, fmt) {
    fmt = fmt || H.eur; var t0 = performance.now();
    (function paso(t) {
      var k = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - k, 3);
      el.textContent = fmt(desde + (hasta - desde) * e);
      if (k < 1) requestAnimationFrame(paso); else el.textContent = fmt(hasta);
    })(t0);
  };
})();

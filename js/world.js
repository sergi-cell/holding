// HOLDING — el pueblo: mapa, cámara, movimiento por casillas y vecinos.
var H = window.H || (window.H = {});
(function () {
  'use strict';
  var MW = 32, MH = 30, TS = 16;
  var W = H.world = { MW: MW, MH: MH, objetivo: null, dir: null, correr: false };
  var tiles = [], bloq = [], puertas = {}, objetos = [], npcs = [], capas = [null, null];
  var canvas, ctx, S = 3, dpr = 1, vw = 0, vh = 0;
  var jug = { x: 6, y: 9, px: 6 * TS, py: 9 * TS, dir: 'down', mov: null, frame: 0, paso: 0 };
  W.jug = jug;

  var EDIFICIOS = [
    { id: 'hq', x: 4, y: 4, w: 5, h: 4, o: { roof: '#e3342f', wall: '#fff3dc', rotulo: 'TU OFICINA', chimenea: true } },
    { id: 'reto', x: 10, y: 4, w: 5, h: 4, o: { roof: '#7c3aed', wall: '#ede9fe', rotulo: 'OJO CLINICO', tipo: 'cupula', emoji: '👁️', puerta: '#5b21b6' } },
    { id: 'albert', x: 19, y: 2, w: 6, h: 7, o: { roof: '#1f2937', wall: '#cbd5e1', rotulo: 'FONDO ALBERT', tipo: 'torre', puerta: '#334155', cartel: '#ffd43b' } },
    { id: 'dex', x: 26, y: 4, w: 4, h: 4, o: { roof: '#0e7490', wall: '#ecfeff', rotulo: 'DEALDEX', emoji: '📚', puerta: '#155e75' } }
  ];
  W.EDIFICIOS = EDIFICIOS;

  var VECINOS = [
    { id: 'v1', x: 8, y: 15, look: { skin: '#e8b088', hair: '#d8d8d8', bald: true, shirt: '#a16207', suit: null, pants: '#57534e' }, nombre: 'JUBILADO' },
    { id: 'v2', x: 21, y: 13, look: { skin: '#f3d2b3', hair: '#f59e0b', bald: false, shirt: '#10b981', suit: null, pants: '#1e293b' }, nombre: 'EMPRENDEDORA' },
    { id: 'v3', x: 13, y: 26, look: { skin: '#b07850', hair: '#1e1e24', bald: false, shirt: '#f43f5e', suit: null, pants: '#334155' }, nombre: 'ABOGADO M&A' },
    { id: 'v4', x: 26, y: 14, look: { skin: '#d39a6a', hair: '#5a3a22', bald: false, shirt: '#0ea5e9', suit: '#0f172a', pants: '#0f172a' }, nombre: 'BANQUERO' }
  ];

  function set(x, y, t) { if (x >= 0 && y >= 0 && x < MW && y < MH) tiles[y][x] = t; }
  function construirMapa(s) {
    tiles = []; bloq = []; puertas = {}; objetos = [];
    for (var y = 0; y < MH; y++) { tiles.push([]); bloq.push([]); for (var x = 0; x < MW; x++) { tiles[y].push('g'); bloq[y].push(false); } }
    var x2, y2;
    for (x2 = 2; x2 < 30; x2++) { set(x2, 14, 'p'); set(x2, 15, 'p'); }
    for (y2 = 2; y2 < 28; y2++) { set(15, y2, 'p'); set(16, y2, 'p'); }
    [[6, 8, 13], [12, 8, 10], [22, 9, 13], [28, 8, 13]].forEach(function (c) { for (var yy = c[1]; yy <= c[2]; yy++) set(c[0], yy, 'p'); });
    for (x2 = 3; x2 < 29; x2++) { set(x2, 21, 'p'); set(x2, 26, 'p'); }
    for (y2 = 11; y2 <= 17; y2++) for (x2 = 12; x2 <= 19; x2++) set(x2, y2, 'z');
    for (y2 = 11; y2 <= 13; y2++) for (x2 = 17; x2 <= 19; x2++) set(x2, y2, 'r');
    set(18, 12, 'w');
    for (y2 = 10; y2 <= 12; y2++) for (x2 = 24; x2 <= 27; x2++) set(x2, y2, "w");
    [[2, 9], [2, 10], [3, 10], [9, 9], [2, 16], [2, 17], [13, 19], [14, 24], [17, 19], [17, 24], [23, 10], [29, 10], [8, 12], [3, 12]].forEach(function (t) { set(t[0], t[1], 't'); });
    for (y2 = 0; y2 < MH; y2++) for (x2 = 0; x2 < MW; x2++) {
      if (x2 < 2 || x2 > 29 || y2 < 2 || y2 > 27) tiles[y2][x2] = 't';
      else if (tiles[y2][x2] === 'g' && H.hash(x2 * 3, y2 * 7) < 0.09) tiles[y2][x2] = 'f';
    }
    EDIFICIOS.forEach(function (b) {
      for (var yy = b.y; yy < b.y + b.h; yy++) for (var xx = b.x; xx < b.x + b.w; xx++) { if (tiles[yy][xx] === 'f') tiles[yy][xx] = 'g'; bloq[yy][xx] = true; }
      puertas[(b.x + Math.floor(b.w / 2)) + ',' + (b.y + b.h - 1)] = { tipo: 'edificio', id: b.id };
    });
    H.LOTES.forEach(function (l, i) {
      var cerrado = l.pol && s.nivel < H.NIVEL_POLIGONO, ocu = H.enLote(s, i);
      for (var yy = l.y; yy < l.y + 3; yy++) for (var xx = l.x; xx < l.x + 4; xx++) {
        if (cerrado) { if (yy === l.y || yy === l.y + 2 || xx === l.x || xx === l.x + 3) { tiles[yy][xx] = 'n'; } else tiles[yy][xx] = 'g'; }
        else if (ocu) { tiles[yy][xx] = 'g'; bloq[yy][xx] = true; }
        else tiles[yy][xx] = 'p';
      }
      if (cerrado) objetos.push({ tipo: 'cartel', x: l.x + 1, y: l.y + 1, txt: ['Polígono industrial en obras.', 'Se abre en el NIVEL ' + H.NIVEL_POLIGONO + '.'] });
      else if (!ocu) objetos.push({ tipo: 'cartel', x: l.x + 2, y: l.y + 1, txt: ['SOLAR ' + (i + 1) + ' — libre.', 'Cuando un dueño quiera vender, su empresa aparecerá aquí.'] });
      else {
        puertas[(l.x + 2) + ',' + (l.y + 2)] = { tipo: ocu.tipo, id: ocu.obj.id, lote: i };
        if (ocu.tipo === 'deal') objetos.push({ tipo: 'seVende', x: l.x, y: l.y + 3, deal: ocu.obj.id });
      }
    });
    objetos.push({ tipo: 'tablon', x: 12, y: 12, txt: null });
    objetos.push({ tipo: 'cartel', x: 14, y: 17, txt: ['VILLA PYME', 'Aquí cada empresa tiene un precio... y un secreto.'] });
    objetos.push({ tipo: 'cartel', x: 5, y: 9, txt: ['TU OFICINA', 'Dentro: tu cartera, el ordenador y cerrar el mes.'] });
    objetos.forEach(function (o) { bloq[o.y][o.x] = true; });
  }

  function construirNpcs(s) {
    var viejos = {}; npcs.forEach(function (n) { viejos[n.id] = n; });
    npcs = [];
    npcs.push({ id: 'broker', x: 13, y: 12, dir: 'down', look: H.LOOK_BROKER, nombre: 'LA BRÓKER', fijo: true });
    s.deals.forEach(function (d) {
      var l = H.LOTES[d.lote];
      npcs.push({ id: 'dueno_' + d.id, x: l.x + 3, y: l.y + 3, dir: 'down', look: d.dueno.look, nombre: d.dueno.nombre.toUpperCase(), deal: d.id, fijo: true, nuevo: d.nuevo });
    });
    VECINOS.forEach(function (v) {
      var o = viejos[v.id];
      npcs.push(o || { id: v.id, x: v.x, y: v.y, hx: v.x, hy: v.y, dir: 'down', look: v.look, nombre: v.nombre, vecino: true, t: Math.random() * 2, px: v.x * TS, py: v.y * TS });
    });
    npcs.forEach(function (n) { if (n.px == null) { n.px = n.x * TS; n.py = n.y * TS; } });
  }
  W.npcs = function () { return npcs; };

  function libre(x, y, quien) {
    if (x < 0 || y < 0 || x >= MW || y >= MH) return false;
    var t = tiles[y][x];
    if (t === 't' || t === 'w' || t === 'n' || t === 'r' || bloq[y][x]) return false;
    for (var i = 0; i < npcs.length; i++) { var n = npcs[i]; if (n !== quien && ((n.x === x && n.y === y) || (n.mov && n.mov.x === x && n.mov.y === y))) return false; }
    if (quien !== jug && ((jug.x === x && jug.y === y) || (jug.mov && jug.mov.x === x && jug.mov.y === y))) return false;
    return true;
  }

  function pintarCapa(f) {
    var c = H.cv(MW * TS, MH * TS), x = c.getContext('2d');
    for (var y = 0; y < MH; y++) for (var xx = 0; xx < MW; xx++) {
      var t = tiles[y][xx], px = xx * TS, py = y * TS;
      if (t === 'g') H.TILE.grass(x, px, py, xx, y);
      else if (t === 'p') H.TILE.path(x, px, py, xx, y);
      else if (t === 'z') H.TILE.plaza(x, px, py, xx, y);
      else if (t === 't') H.TILE.tree(x, px, py);
      else if (t === 'w') H.TILE.water(x, px, py, xx, y, f);
      else if (t === 'f') H.TILE.flowers(x, px, py, xx, y, f);
      else if (t === 'n') H.TILE.fence(x, px, py, xx, y);
      else if (t === 'r') H.TILE.rim(x, px, py);
    }
    // chorro de la fuente
    x.fillStyle = '#d6efff'; x.fillRect(18 * TS + 7, 12 * TS + 2 + (f ? 1 : 0), 2, 8); x.fillRect(18 * TS + 4, 12 * TS + 3 + (f ? 0 : 1), 1, 3); x.fillRect(18 * TS + 11, 12 * TS + 3 + (f ? 1 : 0), 1, 3);
    EDIFICIOS.forEach(function (b) { H.edificio(x, b.x * TS, b.y * TS, b.w, b.h, b.o); });
    var s = H.estado;
    H.LOTES.forEach(function (l, i) {
      var ocu = H.enLote(s, i); if (!ocu) return;
      var sec = H.sector(ocu.obj.sec);
      H.edificio(x, l.x * TS, l.y * TS, 4, 3, { roof: sec.c[1], wall: ocu.tipo === 'empresa' ? '#fffbeb' : '#f1f5f9', emoji: sec.e, chimenea: ['metal', 'obrador', 'imprenta'].indexOf(sec.id) >= 0 });
    });
    objetos.forEach(function (o) {
      if (o.tipo === 'cartel') H.cartel(x, o.x * TS, o.y * TS);
      else if (o.tipo === 'tablon') H.tablon(x, o.x * TS, o.y * TS);
      else if (o.tipo === 'seVende') H.seVende(x, o.x * TS, o.y * TS);
    });
    return c;
  }

  W.rebuild = function () {
    var s = H.estado;
    construirMapa(s); construirNpcs(s);
    capas = [pintarCapa(0), pintarCapa(1)];
  };

  W.init = function (cnv) {
    canvas = cnv; ctx = canvas.getContext('2d');
    jug.x = H.estado.pos.x; jug.y = H.estado.pos.y; jug.dir = H.estado.pos.dir || 'down'; jug.px = jug.x * TS; jug.py = jug.y * TS;
    W.resize(); window.addEventListener('resize', W.resize);
    W.rebuild();
  };
  W.resize = function () {
    if (!canvas) return;
    var r = canvas.parentNode.getBoundingClientRect();
    dpr = Math.min(3, window.devicePixelRatio || 1);
    canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
    canvas.style.width = r.width + 'px'; canvas.style.height = r.height + 'px';
    S = Math.max(1, Math.round(canvas.width / (TS * 11)));
    vw = canvas.width / S; vh = canvas.height / S;
  };

  // ---------- Movimiento ----------
  var DX = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  function intentarMover(dir) {
    jug.dir = dir;
    var nx = jug.x + DX[dir][0], ny = jug.y + DX[dir][1];
    var pu = puertas[nx + ',' + ny];
    if (pu && dir === 'up') { H.audio.sfx_('puerta'); guardarPos(); H.acciones.entrar(pu); return; }
    if (!libre(nx, ny, jug)) {
      var ahora = performance.now();
      if (!jug.ultChoque || ahora - jug.ultChoque > 350) { H.audio.sfx_('choque'); jug.ultChoque = ahora; }
      return;
    }
    jug.mov = { x: nx, y: ny, t: 0, dur: W.correr ? 0.1 : 0.19 };
  }
  function guardarPos() { H.estado.pos = { x: jug.x, y: jug.y, dir: jug.dir }; }

  W.update = function (dt) {
    var bloqueado = H.ui && H.ui.ocupado();
    if (jug.mov) {
      jug.mov.t += dt;
      var k = Math.min(1, jug.mov.t / jug.mov.dur);
      jug.px = (jug.x + (jug.mov.x - jug.x) * k) * TS; jug.py = (jug.y + (jug.mov.y - jug.y) * k) * TS;
      jug.frame = k < 0.5 ? (jug.paso % 2 ? 1 : 2) : 0;
      if (k >= 1) {
        jug.x = jug.mov.x; jug.y = jug.mov.y; jug.mov = null; jug.paso++; guardarPos();
        if (W.dir && !bloqueado) intentarMover(W.dir);
      }
    } else if (W.dir && !bloqueado) {
      if (jug.dir !== W.dir && !jug.girando) { jug.dir = W.dir; jug.girando = 0.07; }
      else if (jug.girando) { jug.girando -= dt; if (jug.girando <= 0) { jug.girando = 0; intentarMover(W.dir); } }
      else intentarMover(W.dir);
    } else { jug.frame = 0; jug.girando = 0; }
    // vecinos paseando
    npcs.forEach(function (n) {
      if (n.mov) {
        n.mov.t += dt; var k2 = Math.min(1, n.mov.t / 0.3);
        n.px = (n.x + (n.mov.x - n.x) * k2) * TS; n.py = (n.y + (n.mov.y - n.y) * k2) * TS; n.frame = k2 < 0.5 ? 1 : 0;
        if (k2 >= 1) { n.x = n.mov.x; n.y = n.mov.y; n.mov = null; n.frame = 0; }
        return;
      }
      if (!n.vecino || n.hablando || bloqueado) return;
      n.t -= dt;
      if (n.t <= 0) {
        n.t = 1.2 + Math.random() * 2.5;
        var dirs = ['up', 'down', 'left', 'right'], d = dirs[Math.floor(Math.random() * 4)];
        n.dir = d;
        var nx = n.x + DX[d][0], ny = n.y + DX[d][1];
        if (Math.abs(nx - n.hx) <= 3 && Math.abs(ny - n.hy) <= 2 && libre(nx, ny, n) && !puertas[nx + ',' + ny]) n.mov = { x: nx, y: ny, t: 0 };
      }
    });
  };

  W.interactuar = function () {
    if (jug.mov) return;
    var nx = jug.x + DX[jug.dir][0], ny = jug.y + DX[jug.dir][1];
    for (var i = 0; i < npcs.length; i++) {
      var n = npcs[i];
      if (n.x === nx && n.y === ny && !n.mov) {
        n.dir = { up: 'down', down: 'up', left: 'right', right: 'left' }[jug.dir];
        H.audio.sfx_('ok'); H.acciones.hablar(n); return;
      }
    }
    for (var j = 0; j < objetos.length; j++) {
      var o = objetos[j];
      if (o.x === nx && o.y === ny) { H.audio.sfx_('ok'); H.acciones.leer(o); return; }
    }
    var pu = puertas[nx + ',' + ny];
    if (pu) { H.audio.sfx_('puerta'); H.acciones.entrar(pu); }
  };
  W.colocar = function () {
    var p = H.estado.pos; jug.x = p.x; jug.y = p.y; jug.dir = p.dir || 'down'; jug.px = jug.x * TS; jug.py = jug.y * TS; jug.mov = null;
  };
  W.soltarNpcs = function () { npcs.forEach(function (n) { n.hablando = false; }); };

  // Dónde está cada objetivo de misión (para la flecha que rebota).
  W.posObjetivo = function (ir) {
    var s = H.estado, i;
    if (ir === 'deals') {
      var mejor = null, dist = 1e9;
      for (i = 0; i < npcs.length; i++) if (npcs[i].deal) { var dd = Math.abs(npcs[i].x - jug.x) + Math.abs(npcs[i].y - jug.y); if (dd < dist) { dist = dd; mejor = npcs[i]; } }
      if (mejor && (s.stats.vistos > 0 || s.misiones.m1)) return { x: mejor.x, y: mejor.y };
      return { x: 13, y: 12 };
    }
    if (ir === 'cartera') { if (s.empresas.length) { var l = H.LOTES[s.empresas[0].lote]; return { x: l.x + 2, y: l.y + 2 }; } return { x: 6, y: 7 }; }
    if (ir === 'reto') return { x: 12, y: 7 };
    if (ir === 'codex') return { x: 28, y: 7 };
    return null;
  };

  // ---------- Pintar ----------
  W.render = function (t) {
    if (!ctx || !capas[0]) return;
    var camX = Math.round(Math.max(0, Math.min(MW * TS - vw, jug.px + 8 - vw / 2)));
    var camY = Math.round(Math.max(0, Math.min(MH * TS - vh, jug.py + 8 - vh / 2)));
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#1b1b24'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    var capa = capas[Math.floor(t / 600) % 2];
    ctx.setTransform(S, 0, 0, S, -camX * S, -camY * S);
    ctx.drawImage(capa, 0, 0);
    // banderas de empresas propias
    H.estado.empresas.forEach(function (c) { var l = H.LOTES[c.lote]; H.bandera(ctx, (l.x + 3) * TS + 4, (l.y) * TS + 2, t); });
    // personajes ordenados por Y
    var todos = npcs.map(function (n) { return { y: n.py, f: function () { ctx.drawImage(H.persona(n.look, n.dir, n.frame || 0), Math.round(n.px), Math.round(n.py) - 4); } }; });
    todos.push({ y: jug.py, f: function () { ctx.drawImage(H.persona(H.LOOK_JUGADOR, jug.dir, jug.frame), Math.round(jug.px), Math.round(jug.py) - 4); } });
    todos.sort(function (a, b) { return a.y - b.y; }).forEach(function (o) { o.f(); });
    // "!" sobre dueños con empresa nueva
    npcs.forEach(function (n) {
      if (!n.deal || !n.nuevo) return;
      var b = Math.floor(t / 300) % 2;
      ctx.fillStyle = '#1b1b24'; ctx.fillRect(n.px + 5, n.py - 16 - b, 7, 10);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(n.px + 6, n.py - 15 - b, 5, 8);
      ctx.fillStyle = '#ef4444'; ctx.fillRect(n.px + 8, n.py - 14 - b, 1, 4); ctx.fillRect(n.px + 8, n.py - 9 - b, 1, 1);
    });
    // flecha de misión
    var obj = W.marca || W.objetivo;
    if (obj) {
      var ox = obj.x * TS + 4, oy = W.objetivo.y * TS - 18 + Math.round(Math.sin(t / 160) * 3);
      ctx.fillStyle = '#1b1b24'; ctx.beginPath(); ctx.moveTo(ox - 1, oy - 1); ctx.lineTo(ox + 9, oy - 1); ctx.lineTo(ox + 4, oy + 7); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffd43b'; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + 8, oy); ctx.lineTo(ox + 4, oy + 5); ctx.closePath(); ctx.fill();
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // tinte nocturno al cerrar mes
    if (W.noche > 0) { ctx.fillStyle = 'rgba(20,24,60,' + W.noche + ')'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
  };
  W.noche = 0;
})();

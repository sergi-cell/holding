// HOLDING — el mundo: el pueblo y los interiores (oficina, torre de Albert, gimnasio, biblioteca, tus empresas).
// Cada mapa = { id, w, h, tiles, bloq, puertas, objetos, npcs, capas, tema, interior }.
var H = window.H || (window.H = {});
(function () {
  'use strict';
  var TS = 16, MW = 32, MH = 30;
  var W = H.world = { objetivo: null, dir: null, correr: false, noche: 0, marca: null };
  var pueblo = null, M = null, volver = null;
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

  function vacio(id, w, h, relleno) {
    var m = { id: id, w: w, h: h, tiles: [], bloq: [], puertas: {}, objetos: [], npcs: [], capas: [null, null] };
    for (var y = 0; y < h; y++) { m.tiles.push([]); m.bloq.push([]); for (var x = 0; x < w; x++) { m.tiles[y].push(relleno); m.bloq[y].push(false); } }
    return m;
  }
  function set(m, x, y, t) { if (x >= 0 && y >= 0 && x < m.w && y < m.h) m.tiles[y][x] = t; }

  // ================= EL PUEBLO =================
  function construirPueblo(s, viejo) {
    var m = vacio('pueblo', MW, MH, 'g'), x2, y2;
    m.tema = 'pueblo';
    for (x2 = 2; x2 < 30; x2++) { set(m, x2, 14, 'p'); set(m, x2, 15, 'p'); }
    for (y2 = 2; y2 < 28; y2++) { set(m, 15, y2, 'p'); set(m, 16, y2, 'p'); }
    [[6, 8, 13], [12, 8, 10], [22, 9, 13], [28, 8, 13]].forEach(function (c) { for (var yy = c[1]; yy <= c[2]; yy++) set(m, c[0], yy, 'p'); });
    for (x2 = 3; x2 < 29; x2++) { set(m, x2, 21, 'p'); set(m, x2, 26, 'p'); }
    for (y2 = 11; y2 <= 17; y2++) for (x2 = 12; x2 <= 19; x2++) set(m, x2, y2, 'z');
    for (y2 = 11; y2 <= 13; y2++) for (x2 = 17; x2 <= 19; x2++) set(m, x2, y2, 'r');
    set(m, 18, 12, 'w');
    for (y2 = 10; y2 <= 12; y2++) for (x2 = 24; x2 <= 27; x2++) set(m, x2, y2, 'w');
    [[2, 9], [2, 10], [3, 10], [9, 9], [2, 16], [2, 17], [13, 19], [14, 24], [17, 19], [17, 24], [23, 10], [29, 10], [8, 12], [3, 12]].forEach(function (t) { set(m, t[0], t[1], 't'); });
    for (y2 = 0; y2 < MH; y2++) for (x2 = 0; x2 < MW; x2++) {
      if (x2 < 2 || x2 > 29 || y2 < 2 || y2 > 27) m.tiles[y2][x2] = 't';
      else if (m.tiles[y2][x2] === 'g' && H.hash(x2 * 3, y2 * 7) < 0.09) m.tiles[y2][x2] = 'f';
    }
    EDIFICIOS.forEach(function (b) {
      for (var yy = b.y; yy < b.y + b.h; yy++) for (var xx = b.x; xx < b.x + b.w; xx++) { if (m.tiles[yy][xx] === 'f') m.tiles[yy][xx] = 'g'; m.bloq[yy][xx] = true; }
      m.puertas[(b.x + Math.floor(b.w / 2)) + ',' + (b.y + b.h - 1)] = { tipo: 'edificio', id: b.id };
    });
    H.LOTES.forEach(function (l, i) {
      var cerrado = l.pol && s.nivel < H.NIVEL_POLIGONO, ocu = H.enLote(s, i);
      for (var yy = l.y; yy < l.y + 3; yy++) for (var xx = l.x; xx < l.x + 4; xx++) {
        if (cerrado) { m.tiles[yy][xx] = (yy === l.y || yy === l.y + 2 || xx === l.x || xx === l.x + 3) ? 'n' : 'g'; }
        else if (ocu) { m.tiles[yy][xx] = 'g'; m.bloq[yy][xx] = true; }
        else m.tiles[yy][xx] = 'p';
      }
      if (cerrado) m.objetos.push({ tipo: 'cartel', x: l.x + 1, y: l.y + 1, w: 1, h: 1, txt: ['Polígono industrial en obras.', 'Se abre en el NIVEL ' + H.NIVEL_POLIGONO + '.'] });
      else if (!ocu) m.objetos.push({ tipo: 'cartel', x: l.x + 2, y: l.y + 1, w: 1, h: 1, txt: ['SOLAR ' + (i + 1) + ' — libre.', 'Cuando un dueño quiera vender, su empresa aparecerá aquí.'] });
      else {
        m.puertas[(l.x + 2) + ',' + (l.y + 2)] = { tipo: ocu.tipo, id: ocu.obj.id, lote: i };
        if (ocu.tipo === 'deal') m.objetos.push({ tipo: 'seVende', x: l.x, y: l.y + 3, w: 1, h: 1, deal: ocu.obj.id });
      }
    });
    m.objetos.push({ tipo: 'tablon', x: 12, y: 12, w: 1, h: 1 });
    m.objetos.push({ tipo: 'cartel', x: 14, y: 17, w: 1, h: 1, txt: ['VILLA PYME', 'Aquí cada empresa tiene un precio... y un secreto.'] });
    m.objetos.push({ tipo: 'cartel', x: 5, y: 9, w: 1, h: 1, txt: ['TU OFICINA', 'Dentro: tu ordenador, tus misiones y tu cama para cerrar el mes.'] });
    m.objetos.forEach(function (o) { m.bloq[o.y][o.x] = true; });
    // personajes
    var viejos = {}; (viejo ? viejo.npcs : []).forEach(function (n) { viejos[n.id] = n; });
    m.npcs.push({ id: 'broker', x: 13, y: 12, dir: 'down', look: H.LOOK_BROKER, nombre: 'LA BRÓKER' });
    s.deals.forEach(function (d) {
      var l = H.LOTES[d.lote];
      m.npcs.push({ id: 'dueno_' + d.id, x: l.x + 3, y: l.y + 3, dir: 'down', look: d.dueno.look, nombre: d.dueno.nombre.toUpperCase(), deal: d.id, nuevo: d.nuevo });
    });
    VECINOS.forEach(function (v) {
      m.npcs.push(viejos[v.id] || { id: v.id, x: v.x, y: v.y, hx: v.x, hy: v.y, radio: 3, dir: 'down', look: v.look, nombre: v.nombre, vecino: true, pasea: true, t: Math.random() * 2 });
    });
    return m;
  }

  // ================= INTERIORES =================
  function interiorBase(id, w, h, suelo, pared) {
    var m = vacio(id, w, h, 'F');
    m.interior = true; m.suelo = suelo; m.pared = pared;
    for (var x = 0; x < w; x++) { m.tiles[0][x] = 'W'; m.tiles[1][x] = 'W'; }
    m.salida = { x: Math.floor(w / 2), y: h - 1 };
    m.tiles[h - 1][m.salida.x] = 'X';
    return m;
  }
  function mueble(m, o) {
    o.tipo = 'mueble'; o.w = o.w || 1; o.h = o.h || 1;
    m.objetos.push(o);
    for (var y = o.y; y < o.y + o.h; y++) for (var x = o.x; x < o.x + o.w; x++) if (y >= 0 && x >= 0 && y < m.h && x < m.w) m.bloq[y][x] = true;
    return o;
  }
  function alfombra(m, x0, y0, w, h) { for (var y = y0; y < y0 + h; y++) for (var x = x0; x < x0 + w; x++) m.tiles[y][x] = 'R'; }
  function npc(m, o) { o.px = o.x * TS; o.py = o.y * TS; o.hx = o.x; o.hy = o.y; o.t = Math.random() * 2; m.npcs.push(o); return o; }

  var CONSTRUIR = {
    hq: function () {
      var m = interiorBase('hq', 10, 8, 'madera', '#f3e3c3'); m.tema = 'calma'; m.alfombra = '#b91c1c';
      mueble(m, { m: 'ventana', x: 1, y: 0, w: 2, h: 2, txt: ['Desde aquí se ve toda Villa Pyme.'] });
      mueble(m, { m: 'tablon', x: 4, y: 0, w: 2, h: 2, accion: 'misiones' });
      mueble(m, { m: 'estanteria', x: 7, y: 0, w: 2, h: 2, txt: ['Libros de negocios… y un manual de Excel de 2009.'] });
      mueble(m, { m: 'pc', x: 1, y: 3, w: 2, h: 1, accion: 'pc' });
      mueble(m, { m: 'cama', x: 8, y: 2, w: 1, h: 2, accion: 'cama' });
      mueble(m, { m: 'radio', x: 6, y: 2, accion: 'opciones' });
      mueble(m, { m: 'planta', x: 0, y: 6 }); mueble(m, { m: 'planta', x: 9, y: 6 });
      mueble(m, { m: 'sofa', x: 6, y: 5, w: 2, h: 1, txt: ['Un sofá cómodo. Aquí se piensan los grandes deals.'] });
      alfombra(m, 3, 4, 3, 2);
      return m;
    },
    albert: function () {
      var m = interiorBase('albert', 11, 9, 'marmol', '#cbd5e1'); m.tema = 'albert';
      mueble(m, { m: 'ventanal', x: 1, y: 0, w: 3, h: 2, txt: ['Planta 12. Villa Pyme a tus pies.'] });
      mueble(m, { m: 'cuadro', x: 5, y: 0, w: 1, h: 2, txt: ['Un cuadro: «FONDO I». Su primera compra, enmarcada.'] });
      mueble(m, { m: 'ventanal', x: 7, y: 0, w: 3, h: 2, txt: ['Desde aquí se ve tu oficina. Pequeñita.'] });
      mueble(m, { m: 'mostrador', x: 3, y: 3, w: 5, h: 1, atiende: 'albert_npc' });
      npc(m, { id: 'albert_npc', x: 5, y: 2, dir: 'down', look: H.LOOK_ALBERT, nombre: 'ALBERT', rol: 'albert' });
      npc(m, { id: 'secre', x: 1, y: 5, dir: 'right', look: { skin: '#f3d2b3', hair: '#7a2e1d', bald: false, shirt: '#0ea5e9', suit: null, pants: '#1e293b' }, nombre: 'SECRETARIA', rol: 'consejo',
        lineas: ['Albert mira tres cosas: que compres bien, que cubras los riesgos y que no le escondas nada.', 'Cuando su confianza pasa de 80 ❤, amplía el fondo.'] });
      mueble(m, { m: 'planta', x: 0, y: 2 }); mueble(m, { m: 'planta', x: 10, y: 2 });
      mueble(m, { m: 'sofa', x: 8, y: 6, w: 2, h: 1, txt: ['Aquí esperan los que vienen a pedir dinero.'] });
      alfombra(m, 4, 4, 3, 4); m.alfombra = '#1e3a8a';
      return m;
    },
    reto: function () {
      var m = interiorBase('reto', 9, 10, 'damero', '#ddd6fe'); m.tema = 'calma'; m.alfombra = '#6d28d9';
      alfombra(m, 4, 3, 1, 6);
      npc(m, { id: 'auditora', x: 4, y: 2, dir: 'down', look: H.LOOK_AUDITORA, nombre: 'LA AUDITORA', rol: 'auditora' });
      mueble(m, { m: 'estatua', x: 3, y: 8, accion: 'estatua' }); mueble(m, { m: 'estatua', x: 5, y: 8, accion: 'estatua' });
      mueble(m, { m: 'cuadro', x: 1, y: 0, w: 1, h: 2, txt: ['«Lo que no encuentres antes de comprar, lo pagarás después.»'] });
      mueble(m, { m: 'cuadro', x: 7, y: 0, w: 1, h: 2, txt: ['«Una pista no es una prueba.»'] });
      npc(m, { id: 'apr1', x: 1, y: 5, dir: 'right', look: { skin: '#d39a6a', hair: '#1e1e24', bald: false, shirt: '#a855f7', suit: null, pants: '#334155' }, nombre: 'APRENDIZ', rol: 'consejo',
        lineas: ['Truco: si un cliente pasa del 40% de las ventas, eso es casi otra compra.', '¡Toca el trozo grande del donut!'] });
      npc(m, { id: 'apr2', x: 7, y: 4, dir: 'left', look: { skin: '#f6c9a0', hair: '#f59e0b', bald: false, shirt: '#ec4899', suit: null, pants: '#1e293b' }, nombre: 'APRENDIZA', rol: 'consejo',
        lineas: ['Un asesor externo 4 horas a la semana es normal.', 'Un «autónomo» que ficha 40 horas… eso es un trabajador. Bandera roja.'] });
      return m;
    },
    dex: function () {
      var m = interiorBase('dex', 10, 8, 'oscura', '#e0f2fe'); m.tema = 'dex'; m.alfombra = '#0e7490';
      mueble(m, { m: 'estanteria', x: 0, y: 0, w: 3, h: 2, accion: 'libros' });
      mueble(m, { m: 'estanteria', x: 7, y: 0, w: 3, h: 2, accion: 'libros' });
      mueble(m, { m: 'ventana', x: 4, y: 0, w: 2, h: 2, txt: ['Llueve. Buen día para estudiar.'] });
      mueble(m, { m: 'mesa', x: 4, y: 3, w: 2, h: 1, accion: 'libros' });
      mueble(m, { m: 'estanteria', x: 0, y: 5, w: 3, h: 1, accion: 'libros' });
      mueble(m, { m: 'estanteria', x: 7, y: 5, w: 3, h: 1, accion: 'libros' });
      mueble(m, { m: 'globo', x: 9, y: 3 });
      npc(m, { id: 'biblio', x: 2, y: 3, dir: 'right', look: { skin: '#efc39c', hair: '#bfbfbf', bald: true, shirt: '#0e7490', suit: '#164e63', pants: '#164e63' }, nombre: 'BIBLIOTECARIO', rol: 'consejo',
        lineas: ['Cada carta del DEALDEX es un concepto que ya has visto en acción.', 'Las estrellas suben cuando lo aciertas en el OJO CLÍNICO.'] });
      return m;
    },
    empresa: function (c) {
      var sec = H.sector(c.sec), fisico = ['distri', 'metal', 'transporte', 'obrador', 'imprenta', 'instal'].indexOf(sec.id) >= 0;
      var m = interiorBase('empresa', 10, 8, fisico ? 'hormigon' : 'baldosa', fisico ? '#d6d3d1' : H.oscurecer(sec.c[0], 1.35));
      m.tema = 'calma'; m.comp = c.id; m.alfombra = sec.c[1];
      mueble(m, { m: 'foto', x: 1, y: 0, w: 1, h: 2, txt: ['El fundador, ' + c.dueno.nombre + ' ' + c.dueno.apellido + '. Treinta años en una foto.'] });
      mueble(m, { m: 'rotulo', x: 4, y: 0, w: 1, h: 2, emoji: sec.e, txt: [c.nombre.toUpperCase(), 'Tuya desde ' + H.fecha(c.mesCompra) + '.'] });
      mueble(m, { m: 'ventana', x: 7, y: 0, w: 2, h: 2, txt: ['Por la ventana se ve tu bandera ondeando.'] });
      mueble(m, { m: 'escritorio', x: 1, y: 3, w: 2, h: 1, accion: 'gerente' });
      if (fisico) {
        mueble(m, { m: 'maquina', x: 5, y: 3, w: 2, h: 1, txt: [sec.id === 'transporte' ? 'El taller de las furgonetas. Huele a gasoil.' : 'La máquina principal. Hace ruido, pero funciona.'] });
        mueble(m, { m: 'cajas', x: 8, y: 3, w: 2, h: 1, txt: ['Pedidos listos para salir.'] });
        mueble(m, { m: 'cajas', x: 6, y: 6, w: 2, h: 1, txt: ['Stock. ¿Cuánto llevará aquí?'] });
      } else {
        mueble(m, { m: 'pc', x: 5, y: 3, w: 2, h: 1, txt: ['Un puesto de trabajo. Post-its por todas partes.'] });
        mueble(m, { m: 'pc', x: 8, y: 3, w: 2, h: 1, txt: ['Otro puesto. Alguien ha dejado un café a medias.'] });
        mueble(m, { m: 'sofa', x: 6, y: 6, w: 2, h: 1, txt: ['La sala de espera de los clientes.'] });
      }
      mueble(m, { m: 'planta', x: 0, y: 6 });
      var lineas = H.pantallas && H.pantallas.comentarios ? H.pantallas.comentarios(c) : [];
      var huecos = [[3, 5], [8, 5], [2, 6]];
      for (var i = 0; i < 3; i++) {
        var look = H.genLook(30 + ((c.id.charCodeAt(1) * 7 + i * 13) % 30));
        npc(m, { id: 'emp' + i, x: huecos[i][0], y: huecos[i][1], dir: 'down', look: look, nombre: ['EMPLEADA', 'EMPLEADO', 'ENCARGADO'][i], rol: 'empleado', lineas: lineas[i % Math.max(1, lineas.length)] || ['Buenos días, jefe.'], pasea: true, radio: 1 });
      }
      return m;
    }
  };

  // ================= PINTAR CAPAS =================
  function pintarCapa(m, f) {
    var c = H.cv(m.w * TS, m.h * TS), x = c.getContext('2d');
    for (var y = 0; y < m.h; y++) for (var xx = 0; xx < m.w; xx++) {
      var t = m.tiles[y][xx], px = xx * TS, py = y * TS;
      if (m.interior) {
        if (t === 'W') { if (y === 0) H.pared(x, px, py, m.pared); }
        else { H.SUELO[m.suelo](x, px, py, xx, y); if (t === 'R') H.alfombra(x, px, py, m.alfombra); if (t === 'X') H.felpudo(x, px, py); }
        continue;
      }
      if (t === 'g') H.TILE.grass(x, px, py, xx, y);
      else if (t === 'p') H.TILE.path(x, px, py, xx, y);
      else if (t === 'z') H.TILE.plaza(x, px, py, xx, y);
      else if (t === 't') H.TILE.tree(x, px, py);
      else if (t === 'w') H.TILE.water(x, px, py, xx, y, f);
      else if (t === 'f') H.TILE.flowers(x, px, py, xx, y, f);
      else if (t === 'n') H.TILE.fence(x, px, py, xx, y);
      else if (t === 'r') H.TILE.rim(x, px, py);
    }
    if (m.interior) {
      m.objetos.slice().sort(function (a, b) { return (a.y + a.h) - (b.y + b.h); }).forEach(function (o) { H.mueble(x, o, f); });
      return c;
    }
    x.fillStyle = '#d6efff'; x.fillRect(18 * TS + 7, 12 * TS + 2 + (f ? 1 : 0), 2, 8); x.fillRect(18 * TS + 4, 12 * TS + 3 + (f ? 0 : 1), 1, 3); x.fillRect(18 * TS + 11, 12 * TS + 3 + (f ? 1 : 0), 1, 3);
    EDIFICIOS.forEach(function (b) { H.edificio(x, b.x * TS, b.y * TS, b.w, b.h, b.o); });
    var s = H.estado;
    H.LOTES.forEach(function (l, i) {
      var ocu = H.enLote(s, i); if (!ocu) return;
      var sec = H.sector(ocu.obj.sec);
      H.edificio(x, l.x * TS, l.y * TS, 4, 3, { roof: sec.c[1], wall: ocu.tipo === 'empresa' ? '#fffbeb' : '#f1f5f9', emoji: sec.e, chimenea: ['metal', 'obrador', 'imprenta'].indexOf(sec.id) >= 0 });
    });
    m.objetos.forEach(function (o) {
      if (o.tipo === 'cartel') H.cartel(x, o.x * TS, o.y * TS);
      else if (o.tipo === 'tablon') H.tablon(x, o.x * TS, o.y * TS);
      else if (o.tipo === 'seVende') H.seVende(x, o.x * TS, o.y * TS);
    });
    return c;
  }
  function prepararCapas(m) { m.capas = [pintarCapa(m, 0), pintarCapa(m, 1)]; m.npcs.forEach(function (n) { if (n.px == null) { n.px = n.x * TS; n.py = n.y * TS; } }); }

  W.rebuild = function () {
    var s = H.estado;
    pueblo = construirPueblo(s, pueblo);
    prepararCapas(pueblo);
    if (!M || !M.interior) M = pueblo;
    else if (M.id === 'empresa') {
      var c = s.empresas.filter(function (e) { return e.id === M.comp; })[0];
      if (c) { M = CONSTRUIR.empresa(c); prepararCapas(M); } else { M = pueblo; W.colocar(); }
    }
  };
  W.tema = function () { return (M && M.tema) || 'pueblo'; };
  W.enInterior = function () { return !!(M && M.interior); };
  W.mapaId = function () { return M ? M.id : 'pueblo'; };
  W.compActual = function () { return M && M.comp; };
  // Para pruebas: colocar al jugador en el mapa actual.
  W.ponerEn = function (x, y, dir) { jug.x = x; jug.y = y; jug.dir = dir || 'up'; jug.px = x * TS; jug.py = y * TS; jug.mov = null; };
  W.npcs = function () { return pueblo ? pueblo.npcs : []; };

  W.init = function (cnv) {
    canvas = cnv; ctx = canvas.getContext('2d');
    W.resize(); window.addEventListener('resize', W.resize);
    W.rebuild(); W.colocar();
  };
  W.resize = function () {
    if (!canvas) return;
    var r = canvas.parentNode.getBoundingClientRect();
    dpr = Math.min(3, window.devicePixelRatio || 1);
    canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
    canvas.style.width = r.width + 'px'; canvas.style.height = r.height + 'px';
    // Móvil vertical: ~11 casillas de ancho. Pantalla ancha: ~9,5 de alto (se ve más mundo a los lados).
    S = Math.max(1, Math.round(Math.min(canvas.width / (TS * 11), canvas.height / (TS * 9.5))));
    vw = canvas.width / S; vh = canvas.height / S;
  };
  W.colocar = function () {
    var p = H.estado.pos; M = pueblo; volver = null;
    jug.x = p.x; jug.y = p.y; jug.dir = p.dir || 'down'; jug.px = jug.x * TS; jug.py = jug.y * TS; jug.mov = null;
  };

  // Entrar y salir de interiores con fundido.
  function fundido(cambio) {
    var t = document.getElementById('trans');
    t.className = 'trans fundido'; t.hidden = false;
    setTimeout(function () { cambio(); t.className = 'trans fundido sale'; setTimeout(function () { t.hidden = true; t.className = 'trans'; }, 230); }, 200);
  }
  W.entrarInterior = function (id, extra) {
    var m = CONSTRUIR[id](extra); prepararCapas(m);
    volver = { x: jug.x, y: jug.y };
    H.estado.pos = { x: jug.x, y: jug.y, dir: 'down' };
    fundido(function () {
      M = m; jug.x = m.salida.x; jug.y = m.salida.y; jug.dir = 'up'; jug.px = jug.x * TS; jug.py = jug.y * TS; jug.mov = null;
      H.audio.tema(m.tema);
      if (H.ui) H.ui.hud();
    });
  };
  W.salir = function () {
    if (!M || !M.interior) return;
    H.audio.sfx_('puerta');
    fundido(function () {
      M = pueblo; var v = volver || H.estado.pos; volver = null;
      jug.x = v.x; jug.y = v.y; jug.dir = 'down'; jug.px = jug.x * TS; jug.py = jug.y * TS; jug.mov = null;
      H.estado.pos = { x: jug.x, y: jug.y, dir: 'down' };
      H.audio.tema('pueblo');
      if (H.ui) H.ui.hud();
    });
  };

  function libre(x, y, quien) {
    if (x < 0 || y < 0 || x >= M.w || y >= M.h) return false;
    var t = M.tiles[y][x];
    if (t === 't' || t === 'w' || t === 'n' || t === 'r' || t === 'W' || M.bloq[y][x]) return false;
    for (var i = 0; i < M.npcs.length; i++) { var n = M.npcs[i]; if (n !== quien && ((n.x === x && n.y === y) || (n.mov && n.mov.x === x && n.mov.y === y))) return false; }
    if (quien !== jug && ((jug.x === x && jug.y === y) || (jug.mov && jug.mov.x === x && jug.mov.y === y))) return false;
    return true;
  }

  // ================= MOVIMIENTO =================
  var DX = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  function intentarMover(dir) {
    jug.dir = dir;
    if (M.interior && dir === 'down' && M.tiles[jug.y][jug.x] === 'X') { W.dir = null; W.salir(); return; }
    var nx = jug.x + DX[dir][0], ny = jug.y + DX[dir][1];
    var pu = M.puertas[nx + ',' + ny];
    if (pu && dir === 'up') { H.audio.sfx_('puerta'); guardarPos(); W.dir = null; H.acciones.entrar(pu); return; }
    if (!libre(nx, ny, jug)) {
      var ahora = performance.now();
      if (!jug.ultChoque || ahora - jug.ultChoque > 350) { H.audio.sfx_('choque'); jug.ultChoque = ahora; }
      return;
    }
    jug.mov = { x: nx, y: ny, t: 0, dur: W.correr ? 0.1 : 0.19 };
  }
  function guardarPos() { if (!M.interior) H.estado.pos = { x: jug.x, y: jug.y, dir: jug.dir }; }

  W.update = function (dt) {
    if (!M) return;
    var bloqueado = H.ui && H.ui.ocupado();
    if (jug.mov) {
      jug.mov.t += dt;
      var k = Math.min(1, jug.mov.t / jug.mov.dur);
      jug.px = (jug.x + (jug.mov.x - jug.x) * k) * TS; jug.py = (jug.y + (jug.mov.y - jug.y) * k) * TS;
      jug.frame = k < 0.5 ? (jug.paso % 2 ? 1 : 2) : 0;
      if (k >= 1) {
        jug.x = jug.mov.x; jug.y = jug.mov.y; jug.mov = null; jug.paso++; guardarPos();
        if (W.marca && Math.abs(W.marca.x - jug.x) + Math.abs(W.marca.y - jug.y) <= 1) W.marca = null;
        if (W.dir && !bloqueado) intentarMover(W.dir);
      }
    } else if (W.dir && !bloqueado) {
      if (jug.dir !== W.dir && !jug.girando) { jug.dir = W.dir; jug.girando = 0.07; }
      else if (jug.girando) { jug.girando -= dt; if (jug.girando <= 0) { jug.girando = 0; intentarMover(W.dir); } }
      else intentarMover(W.dir);
    } else { jug.frame = 0; jug.girando = 0; }
    M.npcs.forEach(function (n) {
      if (n.mov) {
        n.mov.t += dt; var k2 = Math.min(1, n.mov.t / 0.3);
        n.px = (n.x + (n.mov.x - n.x) * k2) * TS; n.py = (n.y + (n.mov.y - n.y) * k2) * TS; n.frame = k2 < 0.5 ? 1 : 0;
        if (k2 >= 1) { n.x = n.mov.x; n.y = n.mov.y; n.mov = null; n.frame = 0; }
        return;
      }
      if (!n.pasea || n.hablando || bloqueado) return;
      n.t -= dt;
      if (n.t <= 0) {
        n.t = 1.2 + Math.random() * 2.5;
        var dirs = ['up', 'down', 'left', 'right'], d = dirs[Math.floor(Math.random() * 4)], rad = n.radio || 3;
        n.dir = d;
        var nx = n.x + DX[d][0], ny = n.y + DX[d][1];
        if (Math.abs(nx - n.hx) <= rad && Math.abs(ny - n.hy) <= Math.min(2, rad) && libre(nx, ny, n) && !M.puertas[nx + ',' + ny] && M.tiles[ny][nx] !== 'X') n.mov = { x: nx, y: ny, t: 0 };
      }
    });
  };

  function npcEn(x, y) { for (var i = 0; i < M.npcs.length; i++) { var n = M.npcs[i]; if (n.x === x && n.y === y && !n.mov) return n; } return null; }
  W.interactuar = function () {
    if (jug.mov || !M) return;
    var nx = jug.x + DX[jug.dir][0], ny = jug.y + DX[jug.dir][1];
    var giro = { up: 'down', down: 'up', left: 'right', right: 'left' }[jug.dir];
    var n = npcEn(nx, ny);
    if (n) { n.dir = giro; n.hablando = true; H.audio.sfx_('ok'); H.acciones.hablar(n); return; }
    for (var j = 0; j < M.objetos.length; j++) {
      var o = M.objetos[j];
      if (nx >= o.x && nx < o.x + o.w && ny >= o.y && ny < o.y + o.h) {
        // Hablar por encima del mostrador, como en los Centros Pokémon.
        if (o.atiende) { var at = M.npcs.filter(function (q) { return q.id === o.atiende; })[0]; if (at) { at.dir = giro; at.hablando = true; H.audio.sfx_('ok'); H.acciones.hablar(at); return; } }
        H.audio.sfx_('ok');
        if (o.tipo === 'mueble') H.acciones.usar(o); else H.acciones.leer(o);
        return;
      }
    }
    var pu = M.puertas[nx + ',' + ny];
    if (pu) { H.audio.sfx_('puerta'); H.acciones.entrar(pu); }
  };
  W.soltarNpcs = function () { (M ? M.npcs : []).forEach(function (n) { n.hablando = false; }); };

  // Flecha de misión: dónde está el objetivo en el mapa actual.
  W.posObjetivo = function (ir) {
    var s = H.estado, i;
    if (M && M.interior) {
      if (ir === 'reto' && M.id === 'reto') return { x: 4, y: 2 };
      if (ir === 'codex' && M.id === 'dex') return { x: 4, y: 3 };
      if (ir === 'cartera' && M.id === 'empresa') return { x: 1, y: 3 };
      if (ir === 'cartera' && M.id === 'hq' && !s.empresas.length) return { x: 1, y: 3 };
      return M.salida;
    }
    var ns = pueblo ? pueblo.npcs : [];
    if (ir === 'deals') {
      var mejor = null, dist = 1e9;
      for (i = 0; i < ns.length; i++) if (ns[i].deal) { var dd = Math.abs(ns[i].x - jug.x) + Math.abs(ns[i].y - jug.y); if (dd < dist) { dist = dd; mejor = ns[i]; } }
      if (mejor && (s.stats.vistos > 0 || s.misiones.m1)) return { x: mejor.x, y: mejor.y };
      return { x: 13, y: 12 };
    }
    if (ir === 'cartera') { if (s.empresas.length) { var l = H.LOTES[s.empresas[0].lote]; return { x: l.x + 2, y: l.y + 2 }; } return { x: 6, y: 7 }; }
    if (ir === 'reto') return { x: 12, y: 7 };
    if (ir === 'codex') return { x: 28, y: 7 };
    return null;
  };

  // ================= RENDER =================
  W.render = function (t) {
    if (!ctx || !M || !M.capas[0]) return;
    var mw = M.w * TS, mh = M.h * TS;
    var camX = mw <= vw ? -Math.round((vw - mw) / 2) : Math.round(Math.max(0, Math.min(mw - vw, jug.px + 8 - vw / 2)));
    var camY = mh <= vh ? -Math.round((vh - mh) / 2) : Math.round(Math.max(0, Math.min(mh - vh, jug.py + 8 - vh / 2)));
    ctx.imageSmoothingEnabled = false;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = M.interior ? '#0b0a14' : '#1b1b24'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(S, 0, 0, S, -camX * S, -camY * S);
    ctx.drawImage(M.capas[Math.floor(t / 600) % 2], 0, 0);
    if (!M.interior) H.estado.empresas.forEach(function (c) { var l = H.LOTES[c.lote]; H.bandera(ctx, (l.x + 3) * TS + 4, (l.y) * TS + 2, t); });
    var todos = M.npcs.map(function (n) { return { y: n.py, f: function () { ctx.drawImage(H.persona(n.look, n.dir, n.frame || 0), Math.round(n.px), Math.round(n.py) - 4); } }; });
    todos.push({ y: jug.py, f: function () { ctx.drawImage(H.persona(H.LOOK_JUGADOR, jug.dir, jug.frame), Math.round(jug.px), Math.round(jug.py) - 4); } });
    todos.sort(function (a, b) { return a.y - b.y; }).forEach(function (o) { o.f(); });
    M.npcs.forEach(function (n) {
      if (!(n.deal && n.nuevo) && !n.exclama) return;
      var b = Math.floor(t / 300) % 2;
      ctx.fillStyle = '#1b1b24'; ctx.fillRect(n.px + 5, n.py - 16 - b, 7, 10);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(n.px + 6, n.py - 15 - b, 5, 8);
      ctx.fillStyle = '#ef4444'; ctx.fillRect(n.px + 8, n.py - 14 - b, 1, 4); ctx.fillRect(n.px + 8, n.py - 9 - b, 1, 1);
    });
    var obj = (!M.interior && W.marca) || W.objetivo;
    if (obj) {
      var ox = obj.x * TS + 4, oy = obj.y * TS - 18 + Math.round(Math.sin(t / 160) * 3);
      ctx.fillStyle = '#1b1b24'; ctx.beginPath(); ctx.moveTo(ox - 1, oy - 1); ctx.lineTo(ox + 9, oy - 1); ctx.lineTo(ox + 4, oy + 7); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffd43b'; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + 8, oy); ctx.lineTo(ox + 4, oy + 5); ctx.closePath(); ctx.fill();
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (W.noche > 0) { ctx.fillStyle = 'rgba(20,24,60,' + W.noche + ')'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
  };
})();

// HOLDING — motor. Funciones puras sobre el estado `s`; la UI solo pinta y llama aquí.
var H = window.H || (window.H = {});
(function () {
  'use strict';
  var SAVE_KEY = 'holding_v1';
  H.VERSION = '1.3.0';

  var U = H.u = {
    rnd: function (a, b) { return a + Math.random() * (b - a); },
    ri: function (a, b) { return Math.floor(a + Math.random() * (b - a + 1)); },
    pick: function (arr) { return arr[Math.floor(Math.random() * arr.length)]; },
    shuffle: function (a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; },
    clamp: function (v, a, b) { return Math.max(a, Math.min(b, v)); },
    wpick: function (pairs) {
      var tot = 0, i; for (i = 0; i < pairs.length; i++) tot += pairs[i][1];
      var r = Math.random() * tot; for (i = 0; i < pairs.length; i++) { r -= pairs[i][1]; if (r <= 0) return pairs[i][0]; }
      return pairs[pairs.length - 1][0];
    }
  };

  H.eur = function (v) {
    var s = v < 0 ? '−' : ''; v = Math.abs(v);
    if (v >= 1e6) return s + (v / 1e6).toFixed(2).replace('.', ',') + ' M€';
    if (v >= 1e3) return s + Math.round(v / 1e3) + 'k €';
    return s + Math.round(v) + ' €';
  };
  H.pct = function (v) { return Math.round(v * 100) + '%'; };
  H.MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  H.fecha = function (mes) { var t = 9 + mes; return H.MESES[t % 12] + ' ' + (2026 + Math.floor(t / 12)); };
  H.sector = function (id) { for (var i = 0; i < H.SECTORES.length; i++) if (H.SECTORES[i].id === id) return H.SECTORES[i]; return H.SECTORES[0]; };

  // Solares del mapa (tiles). Los 4 del polígono se abren en el nivel 3.
  H.LOTES = [
    { x: 3, y: 18 }, { x: 9, y: 18 }, { x: 3, y: 23 }, { x: 9, y: 23 },
    { x: 19, y: 18, pol: true }, { x: 25, y: 18, pol: true }, { x: 19, y: 23, pol: true }, { x: 25, y: 23, pol: true }
  ];
  H.NIVEL_POLIGONO = 3;
  H.XP_NIVEL = [0, 250, 700, 1400, 2500, 4000, 6500, 10000];

  var FISICO = ['distri', 'metal', 'transporte', 'obrador', 'imprenta', 'instal'];
  var FACTOR = { addbacks: 0.82, tendencia: 0.87, pico: 0.88, fraude: 0.6 };
  var COSTE = { laboral: 85000, hacienda: 70000, cobros: 55000, stock: 40000, capex: 150000 };
  var MULT_RIESGO = { dependencia: 0.6, concentracion: 0.5, cambio_control: 0.3, local: 0.2 };
  H.FACTOR = FACTOR;

  // ---------- Estado ----------
  H.nuevo = function (nombre) {
    var s = {
      v: 1, nombre: nombre || 'SERGI', mes: 0, energia: 4, energiaMax: 4,
      caja: 1500000, capital: 1500000, albert: 50, xp: 0, nivel: 1,
      empresas: [], deals: [], codex: {}, srs: {}, idSeq: 1,
      stats: { vistos: 0, banderas: 0, motivos: 0, compras: 0, ventas: 0, palancas: 0, retos: 0, irse: 0, gerentes: 0, exitosBuenos: 0 },
      misiones: {}, racha: 0, ultimoReto: null, mejorReto: 0, realizado: 0, tuParte: 0,
      pos: { x: 6, y: 9, dir: 'down' }, intro: false, fondos: {}, evento: null, musica: true, sfx: true
    };
    // Primer deal: guiado, con una sola bandera clara y un vendedor fácil.
    s.deals.push(H.genDeal(s, 0, { sector: 'distri', pide: 900000, banderas: ['concentracion'], motivo: 'jubilacion', car: 'cansado' }));
    s.deals.push(H.genDeal(s, 1));
    return s;
  };
  H.guardar = function (s) { try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); } catch (e) {} };
  H.cargar = function () {
    try { var t = localStorage.getItem(SAVE_KEY); if (!t) return null; var s = JSON.parse(t); return s && s.v === 1 ? s : null; } catch (e) { return null; }
  };
  H.borrar = function () { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} };

  H.lotesAbiertos = function (s) { return H.LOTES.map(function (l, i) { return i; }).filter(function (i) { return !H.LOTES[i].pol || s.nivel >= H.NIVEL_POLIGONO; }); };
  H.enLote = function (s, i) {
    for (var a = 0; a < s.empresas.length; a++) if (s.empresas[a].lote === i) return { tipo: 'empresa', obj: s.empresas[a] };
    for (var b = 0; b < s.deals.length; b++) if (s.deals[b].lote === i) return { tipo: 'deal', obj: s.deals[b] };
    return null;
  };

  // ---------- Aprendizaje ----------
  H.aprender = function (s, id) {
    if (!id || !H.CODEX[id]) return false;
    if (s.codex[id]) { s.codex[id].n++; return false; }
    s.codex[id] = { n: 1, mes: s.mes }; return true;
  };
  H.srs = function (s, tipo, ok) {
    var r = s.srs[tipo] || (s.srs[tipo] = { ok: 0, ko: 0 });
    if (ok) r.ok++; else r.ko++;
    var c = H.BANDERAS[tipo] && H.BANDERAS[tipo].concepto;
    if (c && s.codex[c] && ok) s.codex[c].dom = (s.codex[c].dom || 0) + 1;
  };
  H.estrellasDominio = function (s, id) { var c = s.codex[id]; if (!c) return 0; var d = c.dom || 0; return d >= 8 ? 3 : d >= 4 ? 2 : d >= 1 ? 1 : 0; };

  H.ganarXP = function (s, n) {
    s.xp += Math.round(n);
    var subidas = [];
    while (s.nivel < H.XP_NIVEL.length && s.xp >= H.XP_NIVEL[s.nivel]) {
      s.nivel++; subidas.push(s.nivel);
      if (s.nivel === H.NIVEL_POLIGONO) H.rellenarDeals(s);
      if (s.nivel % 2 === 0) s.energiaMax = Math.min(6, s.energiaMax + 1);
    }
    return subidas;
  };
  H.tituloNivel = function (s) { return H.NIVELES[Math.min(H.NIVELES.length - 1, s.nivel - 1)]; };
  H.progresoNivel = function (s) {
    var a = H.XP_NIVEL[s.nivel - 1] || 0, b = H.XP_NIVEL[s.nivel];
    if (b == null) return 1; return (s.xp - a) / (b - a);
  };

  // ---------- Deals ----------
  function genLook(edad) {
    var canas = edad > 58;
    return {
      skin: U.pick(['#f6c9a0', '#e8b088', '#d39a6a', '#b07850', '#f3d2b3']),
      hair: canas ? U.pick(['#d8d8d8', '#bfbfbf', '#eeeeee']) : U.pick(['#3a2a1e', '#5a3a22', '#1e1e24', '#7a5030']),
      bald: Math.random() < (canas ? 0.35 : 0.12),
      shirt: U.pick(['#3b82f6', '#16a34a', '#a855f7', '#e11d48', '#f59e0b', '#0ea5e9', '#64748b']),
      suit: Math.random() < 0.5 ? U.pick(['#2b3a67', '#3f3f46', '#57534e', '#1f2937']) : null,
      pants: U.pick(['#334155', '#3f3f46', '#1e293b', '#4b5563']),
      hat: null
    };
  }
  H.genLook = genLook;

  function genTags(d) {
    var PISTAS = {
      concentracion: '🏢 Trabaja con una gran cadena', dependencia: '📱 El dueño lleva los clientes', addbacks: '🧮 Habla de "EBITDA ajustado"',
      tendencia: '📊 "Ha sido un año flojo"', pico: '🚀 Récord el último año', laboral: '👷 Mucho personal externo',
      hacienda: '🗂️ "Algún aplazamiento"', cobros: '🧾 Clientes que pagan tarde', stock: '📦 Almacén enorme', capex: '🏭 Maquinaria de 2006',
      cambio_control: '🤝 Contrato marco con un grande', local: '🏠 Nave del propio dueño', fraude: '💵 Mucho cobro en efectivo'
    };
    var tags = [];
    d.banderas.forEach(function (b) { if (Math.random() < 0.55) tags.push(PISTAS[b.id]); });
    // Pistas falsas: una pista no es una prueba. La due diligence lo confirma.
    if (Math.random() < 0.35) tags.push(U.pick(Object.keys(PISTAS).filter(function (k) { return k !== 'fraude'; }).map(function (k) { return PISTAS[k]; })));
    tags.push('🔁 ' + Math.round(d.recur * 100) + '% recurrente');
    tags.push('👥 ' + d.empleados + ' empleados');
    tags.push('📅 Desde ' + d.fundada);
    var uniq = []; tags.forEach(function (t) { if (uniq.indexOf(t) < 0) uniq.push(t); });
    return uniq.slice(0, 5);
  }

  H.genDeal = function (s, lote, fijo) {
    var sec = fijo && fijo.sector ? H.sector(fijo.sector) : U.pick(H.SECTORES);
    var pMax = Math.min(3000000, 1300000 + (s.nivel - 1) * 350000);
    var pide = fijo && fijo.pide ? fijo.pide : Math.round(U.rnd(500000, pMax) / 10000) * 10000;
    var ebitdaDecl = pide / (sec.mult * U.rnd(1.0, 1.15));
    var ventas = ebitdaDecl / (sec.margen * U.rnd(0.85, 1.15));
    var fisico = FISICO.indexOf(sec.id) >= 0;
    var pool = H.BANDERAS_IDS.filter(function (id) { return id !== 'fraude' && (fisico || (id !== 'capex' && id !== 'stock')); });
    var banderas;
    if (fijo && fijo.banderas) banderas = fijo.banderas.slice();
    else {
      var n = U.wpick([[0, 2], [1, 5], [2, 3 + s.nivel], [3, s.nivel]]);
      banderas = U.shuffle(pool.slice()).slice(0, n);
      if (s.stats.compras > 0 && Math.random() < 0.08 + s.nivel * 0.01) banderas.push('fraude');
    }
    var f = 1; banderas.forEach(function (b) { if (FACTOR[b]) f *= FACTOR[b]; });
    var visibles = Object.keys(H.MOTIVOS).filter(function (k) { return !H.MOTIVOS[k].oculto; });
    var motivo = fijo && fijo.motivo ? fijo.motivo : U.pick(visibles), dicho = null;
    // Algunos vendedores no cuentan el motivo real. Lo dicho suena bonito; lo real suele doler.
    if (!fijo && Math.random() < Math.min(0.4, 0.15 + 0.05 * (s.nivel - 1))) {
      motivo = U.wpick([['caja', 3], ['amenaza', 2], [U.pick(visibles), 2]]);
      dicho = U.pick(['jubilacion', 'sucesor', 'liquidez', 'quemado'].filter(function (k) { return k !== motivo; }));
      if (motivo === 'caja') ['hacienda', 'cobros'].forEach(function (b) { if (banderas.indexOf(b) < 0 && Math.random() < 0.45) banderas.push(b); });
      if (motivo === 'amenaza' && banderas.indexOf('tendencia') < 0 && Math.random() < 0.5) banderas.push('tendencia');
      f = 1; banderas.forEach(function (b) { if (FACTOR[b]) f *= FACTOR[b]; });
    }
    var edad = motivo === 'jubilacion' ? U.ri(63, 71) : U.ri(46, 69);
    var apellido = U.pick(H.APELLIDOS);
    var d = {
      id: 'd' + (s.idSeq++), lote: lote, sec: sec.id, nombre: U.pick(sec.names) + ' ' + apellido,
      ciudad: U.pick(H.CIUDADES), fundada: U.ri(1978, 2010), ventas: ventas, ebitdaDecl: ebitdaDecl, factor: f, pide: pide,
      empleados: Math.max(4, Math.round(ventas / ((sec.vxe || 100) * 1000 * U.rnd(0.8, 1.2)))),
      banderas: banderas.map(function (id) { return { id: id, vista: false, jugada: false }; }),
      motivo: motivo, car: fijo && fijo.car ? fijo.car : U.pick(Object.keys(H.CARACTERES)),
      dueno: { nombre: U.pick(H.NOMBRES_DUENO), apellido: apellido, edad: edad, look: genLook(edad) },
      recur: U.clamp(sec.recur + U.rnd(-0.12, 0.12), 0.05, 0.97),
      motivoSabido: false, analizado: false, meses: 0, nuevo: true,
      motivoDicho: dicho, verdadSabida: false
    };
    if (!fijo) {
      if (Math.random() < Math.min(0.5, 0.25 + 0.05 * (s.nivel - 1))) d.rival = { n: U.pick(RIVALES), turno: U.ri(2, 4), visible: Math.random() < 0.7 };
      if (Math.random() < 0.4) { var tg = U.ri(2, 5); if (d.rival && tg === d.rival.turno) tg++; d.giro = { id: U.pick(Object.keys(H.GIROS)), turno: tg }; }
      d.poker = (d.car === 'desconfiado' || s.nivel >= 3) && Math.random() < 0.35;
    }
    d.tags = genTags(d);
    if (d.motivoDicho && Math.random() < 0.45) d.tags.splice(1, 0, d.motivo === 'caja' ? '🏦 "Los bancos están raros"' : d.motivo === 'amenaza' ? '🏗️ Obras de un gigante al lado' : '🤐 No le gusta hablar de futuro');
    if (d.rival && d.rival.visible) d.tags.unshift('🦈 Hay otro comprador');
    d.tags = d.tags.slice(0, 5);
    return d;
  };
  var RIVALES = ['Fondo Cantábrico', 'Grupo Levante', 'un competidor local', 'un family office', 'un fondo de búsqueda'];

  H.ebitdaReal = function (d) { return d.ebitdaDecl * d.factor; };
  function cubierta(id, est) { var arr = H.BANDERAS[id].arregla; return (est || []).some(function (e) { return arr.indexOf(e) >= 0; }); }
  H.cubierta = cubierta;
  H.valorJusto = function (d, est) {
    var m = H.sector(d.sec).mult, coste = 0;
    d.banderas.forEach(function (b) {
      var cub = cubierta(b.id, est);
      if (MULT_RIESGO[b.id] && !cub) m -= MULT_RIESGO[b.id];
      if (COSTE[b.id] && !cub && !b.jugada) coste += COSTE[b.id];
    });
    return Math.max(0, H.ebitdaReal(d) * m - coste);
  };

  H.rellenarDeals = function (s) {
    var abiertos = H.lotesAbiertos(s).filter(function (i) { return !H.enLote(s, i); });
    var enVenta = s.deals.length, objetivo = s.nivel >= H.NIVEL_POLIGONO ? 3 : 2, nuevos = 0;
    U.shuffle(abiertos);
    while (enVenta < objetivo && abiertos.length) { s.deals.push(H.genDeal(s, abiertos.pop())); enVenta++; nuevos++; }
    return nuevos;
  };

  // ---------- Due diligence ----------
  var HOLISTICO = { anios: 1, local: 1, cuadre: 1 };
  H.HOLISTICO = HOLISTICO;
  H.datosVis = function (tipo, flag) {
    var el = [], i, t;
    function norm(arr) { var s = arr.reduce(function (a, b) { return a + b; }, 0); return arr.map(function (v) { return v / s; }); }
    switch (H.BANDERAS[tipo].vis) {
      case 'donut': {
        var vals = [];
        if (flag) { var big = U.rnd(0.42, 0.62); var rest = norm([1, 2, 3, 4, 5].map(function () { return U.rnd(0.5, 1.5); })).map(function (v) { return v * (1 - big); }); vals = [big].concat(rest); }
        else { vals = norm([0, 1, 2, 3, 4, 5].map(function () { return U.rnd(0.9, 1.5); })); }
        var orden = vals.map(function (v, k) { return { v: v, a: flag && k === 0 }; }); U.shuffle(orden);
        orden.forEach(function (o, k) { el.push({ l: 'Cliente ' + 'ABCDEF'[k], v: o.v, anom: o.a, txt: H.pct(o.v) }); });
        break;
      }
      case 'vendedores': {
        var due = flag ? U.rnd(0.72, 0.86) : U.rnd(0.16, 0.3);
        var r = norm([U.rnd(0.8, 1.4), U.rnd(0.6, 1.2), U.rnd(0.3, 0.8)]).map(function (v) { return v * (1 - due); });
        el.push({ l: 'Dueño', v: due, anom: flag, txt: H.pct(due), ico: '👑' });
        el.push({ l: 'Comercial 1', v: r[0], txt: H.pct(r[0]), ico: '🧑‍💼' });
        el.push({ l: 'Comercial 2', v: r[1], txt: H.pct(r[1]), ico: '🧑‍💼' });
        el.push({ l: 'Web / tienda', v: r[2], txt: H.pct(r[2]), ico: '🛒' });
        break;
      }
      case 'puente': {
        var noms = U.shuffle(['Coche del dueño', 'Viajes', 'Juicio puntual', 'Consultoría', 'Sueldo del hijo', 'Reforma del local']);
        var malo = flag ? U.ri(0, 2) : -1;
        for (i = 0; i < 3; i++) {
          var v = i === malo ? U.rnd(0.18, 0.28) : U.rnd(0.02, 0.06);
          el.push({ l: noms[i], v: v, anom: i === malo, txt: '+' + H.pct(v), doc: i !== malo });
        }
        break;
      }
      case 'anios': {
        var base = flag ? [1, 0.9, 0.8, 0.71] : [0.84, 0.9, 0.95, 1];
        ['2022', '2023', '2024', '2025'].forEach(function (y, k) { el.push({ l: y, v: base[k] * U.rnd(0.97, 1.03), anom: flag, txt: '' }); });
        break;
      }
      case 'meses': {
        var pico = flag ? U.ri(3, 10) : -1;
        'EFMAMJJASOND'.split('').forEach(function (m, k) { var v = (0.75 + 0.15 * Math.sin(k / 2)) * U.rnd(0.9, 1.1); if (k === pico) v *= 3.6; el.push({ l: m, v: v, anom: k === pico }); });
        break;
      }
      case 'equipo': {
        var n = 14, malos = flag ? U.ri(4, 6) : 0, idx = U.shuffle(Array.from({ length: n }, function (_, k) { return k; }));
        var asesor = !flag && Math.random() < 0.6 ? idx[0] : -1;
        for (i = 0; i < n; i++) {
          var esMalo = idx.indexOf(i) < malos;
          el.push({ l: esMalo ? 'Autónomo · 40 h' : i === asesor ? 'Asesor · 4 h/sem' : 'Fijo', anom: esMalo, ico: esMalo || i === asesor ? '🧾' : '📄', v: 1 });
        }
        break;
      }
      case 'deuda': {
        el.push({ l: 'Préstamo banco', v: U.rnd(0.4, 0.7), txt: 'en resumen ✓' });
        el.push({ l: 'Proveedores', v: U.rnd(0.3, 0.5), txt: 'en resumen ✓' });
        if (flag) el.push({ l: 'Aplazamiento Hacienda', v: U.rnd(0.35, 0.55), anom: true, txt: 'NO en resumen' });
        else el.push({ l: 'Hacienda', v: 0.02, txt: 'al corriente ✓' });
        U.shuffle(el);
        break;
      }
      case 'antiguedad': {
        var vv = flag ? [0.36, 0.18, 0.08, U.rnd(0.32, 0.45)] : [0.62, 0.25, 0.09, U.rnd(0.02, 0.05)];
        ['0-30 d', '31-90 d', '91-180 d', '+180 d'].forEach(function (l, k) { el.push({ l: l, v: vv[k], anom: flag && k === 3, txt: H.pct(vv[k]) }); });
        break;
      }
      case 'rotacion': {
        var fams = U.shuffle(['Tornillería', 'Recambios', 'Embalaje', 'Herramienta', 'Material eléctrico', 'Químicos']).slice(0, 4);
        var malo2 = flag ? U.ri(0, 3) : -1;
        fams.forEach(function (f, k) { var d = k === malo2 ? U.ri(380, 620) : U.ri(25, 110); el.push({ l: f, v: d / 650, anom: k === malo2, txt: d + ' días' }); });
        break;
      }
      case 'maquinas': {
        var ms = ['Máquina principal', 'Línea 2', 'Carretilla', 'Furgoneta'];
        ms.forEach(function (m, k) { var v = k === 0 && flag ? U.rnd(0.92, 1) : U.rnd(0.15, 0.6); el.push({ l: m, v: v, anom: k === 0 && flag, txt: H.pct(v) + ' de su vida' }); });
        U.shuffle(el);
        break;
      }
      case 'contratos': {
        var cs = ['Cliente principal', 'Contrato marco', 'Proveedor clave'], malo3 = flag ? U.ri(0, 2) : -1;
        cs.forEach(function (c, k) { el.push({ l: c, anom: k === malo3, txt: k === malo3 ? 'Cambio de dueño → puede rescindir' : U.pick(['Cambio de dueño: sin efecto', 'Renovación anual automática', 'Duración: 3 años']), v: 1 }); });
        break;
      }
      case 'local': {
        el.push({ l: 'Propietario', txt: flag ? 'El propio vendedor' : 'Inmobiliaria del Vallès', anom: flag, v: 1 });
        el.push({ l: 'Contrato', txt: flag ? 'NINGUNO' : 'Hasta 2034', anom: flag, v: 1 });
        el.push({ l: 'Alquiler', txt: flag ? '0 €/mes' : '3.400 €/mes', anom: flag, v: 1 });
        break;
      }
      case 'cuadre': {
        ['2023', '2024', '2025'].forEach(function (y) { var r = flag ? U.rnd(0.58, 0.7) : U.rnd(0.97, 1); el.push({ l: y, v: 1, v2: r, anom: flag, txt: H.pct(r) }); });
        break;
      }
    }
    return { tipo: tipo, flag: flag, el: el, holistico: !!HOLISTICO[tipo] };
  };

  H.pantallasDD = function (s, d) {
    var reales = U.shuffle(d.banderas.map(function (b) { return b.id; })).slice(0, 4);
    var fisico = FISICO.indexOf(d.sec) >= 0;
    var limpias = U.shuffle(H.BANDERAS_IDS.filter(function (id) { return reales.indexOf(id) < 0 && (fisico || (id !== 'capex' && id !== 'stock')); }));
    var tipos = reales.concat(limpias.slice(0, Math.max(1, 4 - reales.length)));
    if (tipos.length > 4) tipos = tipos.slice(0, 4);
    return U.shuffle(tipos).map(function (t) { return H.datosVis(t, reales.indexOf(t) >= 0); });
  };

  // Reto diario: repite más lo que más fallas.
  H.pantallasReto = function (s, n) {
    var tipos = H.BANDERAS_IDS.map(function (t) { var r = s.srs[t] || { ok: 0, ko: 0 }; return [t, Math.max(0.4, 1 + r.ko * 1.5 - r.ok * 0.25)]; });
    var out = [];
    for (var i = 0; i < n; i++) out.push(H.datosVis(U.wpick(tipos), Math.random() < 0.6));
    return out;
  };
  H.hoy = function () { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };
  H.ayer = function () { var d = new Date(Date.now() - 864e5); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };
  H.retoHecho = function (s) { return s.ultimoReto === H.hoy(); };
  H.completarReto = function (s, aciertos, total) {
    s.racha = s.ultimoReto === H.ayer() ? s.racha + 1 : (s.ultimoReto === H.hoy() ? s.racha : 1);
    s.ultimoReto = H.hoy(); s.stats.retos++;
    s.mejorReto = Math.max(s.mejorReto, aciertos);
    return 40 + aciertos * 25 + (aciertos === total ? 100 : 0) + Math.min(10, s.racha) * 10;
  };

  // ---------- Negociación (el combate) ----------
  var HISTORIAS = ['Empecé con una furgoneta y un préstamo de mi suegro.', 'El primer año dormía en el almacén.', 'Aquí trabajan los hijos de mis primeros empleados.', 'En 2008 casi cerramos. No despedí a nadie.', 'Mi padre ya hacía esto en un garaje.'];
  var ACEPTA_DATO = ['Vale... tienes razón, eso hay que tenerlo en cuenta.', 'No pensaba que lo verías. Lo hablamos.', 'Es justo. Ajustemos el número.'];
  var OFENDIDO_DATO = ['¿Vienes a buscarle los tres pies al gato?', 'No me gusta que me auditen como a un delincuente.', 'Esto no lo veía nadie en 30 años y ahora vienes tú.'];
  var LE_GUSTA = ['Eso es justo lo que necesitaba oír.', 'Ahora sí nos entendemos.', 'Me quitas un peso de encima.'];
  var NO_LE_GUSTA = ['No, no, no. Eso no es lo que busco.', 'Así no vamos bien.', '¿Para eso me has hecho perder la mañana?'];
  var NEUTRO = ['Vale. Lo apunto.', 'Podría ser.', 'No me parece mal.'];
  var NO_CIERRA = ['Todavía no lo veo claro.', 'Hay algo que no me encaja. No firmo aún.', 'Necesito confiar más en ti para firmar.'];
  var PREOCUPA = {
    transicion: 'Me preocupa que mis clientes se sientan abandonados.', legado: 'Me preocupa mi gente. Algunos llevan 20 años conmigo.',
    vendor_loan: 'Me preocupa pagar un dineral en impuestos de golpe.', earnout: 'Me preocupa que no valores lo que esto puede crecer.',
    rapido: 'Me preocupa que esto se alargue meses.', escrow: 'Me preocupa que luego me vengas con reclamaciones eternas.'
  };
  H.umbralFirma = function (d, n) { return 52 + (H.CARACTERES[d.car].umbral || 0) + (d.motivoDicho && !d.verdadSabida ? 8 : 0) + (n.precio < d.pide * 0.8 ? 8 : 0) + (n.precio < d.pide * 0.7 ? 8 : 0); };
  // Lo que el jugador cree que es su motivo (puede ser mentira).
  H.motivoMostrado = function (d) { if (!d.motivoSabido) return null; return d.motivoDicho && !d.verdadSabida ? d.motivoDicho : d.motivo; };
  function sabeReal(d) { return d.motivoSabido && (!d.motivoDicho || d.verdadSabida); }

  H.nego = function (s, d) {
    var car = H.CARACTERES[d.car];
    return { conf: car.confianza + (d.analizado ? 6 : 0), pac: car.paciencia, pacMax: car.paciencia, precio: d.pide, est: [], historia: 0, preocupa: false, ancla: 0, fin: null, turno: 0, suelo: 0, sospecha: false };
  };

  // Gestos: lo que se ve del vendedor. Con cara de póker es la única pista de su confianza.
  H.gesto = function (d, n) {
    var um = H.umbralFirma(d, n);
    if (d.motivoDicho && !d.verdadSabida && d.motivoSabido && (n.sospecha || n.turno % 3 === 2)) return '👀 evita tu mirada';
    if (n.pac <= 2) return '⌚ mira el reloj';
    if (n.conf >= um) return '🙂 se inclina hacia ti';
    if (n.conf >= um - 15) return '🤔 se lo está pensando';
    if (n.conf >= 25) return '🙅 brazos cruzados';
    return '😤 resopla';
  };

  function nuevoR() { return { lineas: [], dc: 0, dp: 0, tono: 'neutro', aprende: [], fin: null, evento: null }; }
  function aplicar(d, n, r) {
    n.conf = U.clamp(n.conf + r.dc, 0, 100);
    var nuevo = n.precio + r.dp;
    if (r.dp < 0 && n.suelo) nuevo = Math.max(nuevo, Math.min(n.precio, n.suelo));
    n.precio = Math.max(Math.round(d.pide * 0.6), Math.round(nuevo));
  }

  H.jugar = function (s, d, n, tipo, arg) {
    var car = H.CARACTERES[d.car], mot = H.MOTIVOS[d.motivo], nom = d.dueno.nombre.toUpperCase();
    var r = nuevoR();
    function di(t) { r.lineas.push(nom + ': «' + t + '»'); }
    if (tipo === 'motivo') {
      if (d.motivoSabido) { di('¿Otra vez? Ya te lo he dicho.'); r.dc = -3; r.tono = 'mal'; }
      else {
        var dicho = H.MOTIVOS[d.motivoDicho || d.motivo];
        d.motivoSabido = true; if (!d.motivoDicho) d.verdadSabida = true; s.stats.motivos++;
        di(dicho.frase); r.lineas.push('Te cuenta su MOTIVO: ' + dicho.e + ' ' + dicho.n.toUpperCase() + '.');
        r.dc = 10; r.tono = 'bien'; r.aprende.push('motivo', 'preguntar');
      }
    } else if (tipo === 'repreguntar') {
      if (d.motivoDicho && !d.verdadSabida) {
        if (n.conf >= 45) {
          d.verdadSabida = true; s.stats.verdades = (s.stats.verdades || 0) + 1;
          di('…Vale. Te voy a ser sincero.'); di(mot.frase);
          r.lineas.push('¡Te había ocultado algo! MOTIVO REAL: ' + mot.e + ' ' + mot.n.toUpperCase() + '.');
          r.dc = 8; r.tono = 'bien'; r.aprende.push('leer_vendedor');
          if (mot.oculto) { r.dp = -Math.round(d.pide * (d.motivo === 'caja' ? 0.08 : 0.06)); r.lineas.push('Ahora sabes que necesita cerrar: acepta bajar el precio.'); }
        } else { di('Que sí, hombre. Ya te lo he dicho.'); r.lineas.push('Aún no se fía lo bastante para sincerarse.'); r.dc = -4; r.tono = 'mal'; }
      } else { di('Es lo que te he dicho. ¿No me crees?'); r.lineas.push('Era verdad. Desconfiar de quien es sincero también resta.'); r.dc = -5; r.tono = 'mal'; }
    } else if (tipo === 'historia') {
      var g = Math.round(car.escuchar * Math.pow(0.5, n.historia)); n.historia++;
      di(U.pick(HISTORIAS)); r.dc = g; r.tono = g >= 5 ? 'bien' : 'neutro';
      if (g < 4) r.lineas.push('Ya te ha contado bastante. Escuchar más no suma.');
    } else if (tipo === 'preocupa') {
      if (n.preocupa) { di('Ya te lo he dicho, hombre.'); r.dc = -2; r.tono = 'mal'; }
      else {
        n.preocupa = true; var q = mot.quiere[0]; di(PREOCUPA[q] || PREOCUPA.rapido);
        r.lineas.push('Pista: le encajaría ' + H.ESTRUCTURAS[q].e + ' ' + H.ESTRUCTURAS[q].n.toUpperCase() + '.');
        if (d.motivoDicho && !d.verdadSabida && d.motivoSabido && H.MOTIVOS[d.motivoDicho].quiere[0] !== q) { r.lineas.push('Hmm… eso no pega con el motivo que te contó.'); n.sospecha = true; }
        r.dc = 5; r.tono = 'bien'; r.aprende.push('legado');
      }
    } else if (tipo === 'bandera') {
      var b = d.banderas.filter(function (x) { return x.id === arg; })[0], B = H.BANDERAS[arg];
      b.jugada = true;
      if (B.fatal) { di('¿¡Me estás llamando mentiroso!?'); r.lineas.push('Esto no se negocia. Lo correcto aquí es 🚪 LEVANTARSE.'); r.dc = -25; r.tono = 'mal'; }
      else {
        var imp = B.impacto * d.pide * (B.arregla.indexOf('precio') >= 0 ? 1 : 0.5);
        if (n.conf >= 35) { r.dp = -Math.round(imp * car.datos); r.dc = car.datos > 1.2 ? 3 : -4; di(U.pick(ACEPTA_DATO)); r.tono = 'bien'; }
        else { r.dp = -Math.round(imp * 0.5); r.dc = -Math.round(12 * car.ofende); di(U.pick(OFENDIDO_DATO)); r.lineas.push('Sin confianza, los datos suenan a ataque.'); r.tono = 'mal'; }
        if (B.arregla.indexOf('precio') < 0) r.lineas.push('Baja el precio, pero el riesgo sigue. Se cubre con: ' + B.arregla.map(function (e) { return H.ESTRUCTURAS[e].e + ' ' + H.ESTRUCTURAS[e].n; }).join(' o ') + '.');
      }
      r.aprende.push(B.concepto);
    } else if (tipo === 'estructura') {
      var E = H.ESTRUCTURAS[arg]; n.est.push(arg);
      var quiere = mot.quiere.indexOf(arg) >= 0, odia = mot.odia.indexOf(arg) >= 0;
      r.dc = sabeReal(d) ? (quiere ? 14 : odia ? -14 : 2) : d.motivoSabido ? (quiere ? 10 : odia ? -16 : 1) : (quiere ? 6 : odia ? -18 : 1);
      if (arg === 'rapido') r.dp = -Math.round(d.pide * 0.05);
      // Darle lo que de verdad quiere vale dinero para él: rebaja el precio.
      if (quiere && arg !== 'rapido') r.dp -= Math.round(d.pide * (d.motivoSabido ? 0.04 : 0.02));
      di(U.pick(quiere ? LE_GUSTA : odia ? NO_LE_GUSTA : NEUTRO));
      if (quiere && arg !== 'rapido') r.lineas.push('Le importa tanto que rebaja el precio.');
      if (odia && !d.motivoSabido) r.lineas.push('Si le hubieras preguntado por qué vende, lo habrías visto venir.');
      // La pista de la mentira: lo que debería gustarle según lo que te contó… no le gusta.
      if (d.motivoDicho && !d.verdadSabida && d.motivoSabido && H.MOTIVOS[d.motivoDicho].quiere.indexOf(arg) >= 0 && !quiere) {
        r.lineas.push('Raro… por lo que te contó, debería encantarle. ¿Te ha dicho toda la verdad?'); n.sospecha = true;
      }
      d.banderas.forEach(function (b) { if (b.vista && H.BANDERAS[b.id].arregla.indexOf(arg) >= 0) r.lineas.push('Riesgo cubierto: ' + H.BANDERAS[b.id].e + ' ' + H.BANDERAS[b.id].n + ' ✓'); });
      r.tono = r.dc > 3 ? 'bien' : r.dc < 0 ? 'mal' : 'neutro';
      r.aprende.push(E.concepto);
    } else if (tipo === 'ancla') {
      n.ancla++;
      if (n.conf >= 60 && n.ancla <= 2) { r.dp = -Math.round(d.pide * 0.07); r.dc = -5; di('Hmm... Es menos de lo que esperaba. Pero te escucho.'); r.tono = 'bien'; }
      else { r.dc = -Math.round(18 * car.ofende) - (mot.odia.indexOf('anclar') >= 0 ? 8 : 0); n.pac--; di('¿Me tomas el pelo? Esta empresa es mi vida.'); r.lineas.push('Anclar bajo sin confianza ofende. Primero gánate la mesa.'); r.tono = 'mal'; }
      r.aprende.push('anclaje');
    } else if (tipo === 'cerrar') {
      var umbral = H.umbralFirma(d, n);
      if (n.conf >= umbral) { di('Trato hecho. Choca esa mano.'); r.fin = 'compra'; r.tono = 'bien'; }
      else { di(U.pick(NO_CIERRA)); r.dc = -6; r.tono = 'mal'; r.lineas.push(d.poker ? 'No firma. Su cara no dice nada: lee sus gestos.' : 'Necesita más confianza para firmar (' + Math.round(n.conf) + ' de ' + umbral + ').'); }
    } else if (tipo === 'irse') {
      r.fin = 'irse';
    }
    aplicar(d, n, r);
    if (!r.fin) {
      n.pac--; n.turno++;
      if (n.conf <= 0) { r.fin = 'ofendido'; r.lineas.push(nom + ' se ofende y da la reunión por terminada.'); }
      else if (n.pac <= 0) { r.fin = 'cansado'; r.lineas.push(nom + ' se cansa y se levanta de la mesa.'); }
      else if (d.rival && !n.rivalHecho && n.turno >= d.rival.turno) {
        n.rivalHecho = true; n.pac = Math.max(1, n.pac - 1);
        d.rival.oferta = Math.round(Math.max(n.precio, d.pide * 0.88) * U.rnd(1.03, 1.09) / 1000) * 1000;
        r.evento = { tipo: 'rival' };
      } else if (d.giro && !n.giroHecho && n.turno >= d.giro.turno) {
        n.giroHecho = true; r.evento = { tipo: 'giro', id: d.giro.id };
        if (H.GIROS[d.giro.id].alEntrar) { var ae = H.GIROS[d.giro.id].alEntrar; if (ae.pac) n.pac = Math.max(1, n.pac + ae.pac); }
      }
    }
    return r;
  };

  // Otro comprador pone una oferta encima de la mesa.
  H.responderRival = function (s, d, n, op) {
    var mot = H.MOTIVOS[d.motivo], nom = d.dueno.nombre.toUpperCase(), r = nuevoR(), of = d.rival.oferta;
    function di(t) { r.lineas.push(nom + ': «' + t + '»'); }
    function falla(txt) { r.dc = -6; r.dp = Math.max(0, Math.round(of * 0.98) - n.precio); di(txt); r.lineas.push('No era lo que le importaba: el precio sube hacia la otra oferta.'); r.tono = 'mal'; }
    if (op === 'igualar') { r.dp = Math.max(0, of - n.precio); r.dc = 4; di('Si pagas lo mismo, prefiero tratar contigo.'); r.lineas.push('Has igualado. El precio sube a ' + H.eur(Math.max(of, n.precio)) + '.'); }
    else if (op === 'certeza') {
      if (mot.quiere.indexOf('rapido') >= 0) { r.dc = 12; di('Eso me vale más que unos euros. Seguimos tú y yo.'); r.lineas.push('¡Le has ganado sin subir precio! Le importaba la rapidez.'); r.tono = 'bien'; s.stats.rivales = (s.stats.rivales || 0) + 1; }
      else falla('La prisa no es lo que más me importa…');
      r.aprende.push('cierre_rapido', 'competencia');
    } else if (op === 'gente') {
      if (mot.quiere.indexOf('legado') >= 0) { r.dc = 12; di('Ellos no me han preguntado por mi gente. Tú sí.'); r.lineas.push('¡Le has ganado sin subir precio! Le importaba su legado.'); r.tono = 'bien'; s.stats.rivales = (s.stats.rivales || 0) + 1; }
      else falla('Mi gente sabrá apañarse. Hablemos de números.');
      r.aprende.push('legado', 'competencia');
    } else { r.fin = 'rival'; di('Pues me voy con ellos. Suerte.'); r.lineas.push('Se queda la empresa ' + d.rival.n + '.'); r.aprende.push('competencia'); }
    aplicar(d, n, r);
    return r;
  };

  H.aplicarGiro = function (s, d, n, id, i) {
    var G = H.GIROS[id], o = G.ops[i], ef = o.ef || {}, r = nuevoR();
    r.dc = ef.conf || 0;
    if (ef.bonus && ef.bonus.motivos.indexOf(d.motivo) >= 0) { r.dc += ef.bonus.conf; r.lineas.push(ef.bonus.txt); }
    if (ef.pac) n.pac = Math.max(1, Math.min(n.pacMax + 2, n.pac + ef.pac));
    if (ef.suelo) n.suelo = Math.round(n.precio * 0.97);
    if (ef.datos) {
      var conDatos = d.banderas.some(function (b) { return b.vista; });
      if (conDatos) { n.suelo = 0; r.dc += 5; r.lineas.push('Tus datos convencen al gestor. El precio sigue abierto.'); }
      else { n.suelo = Math.round(n.precio * 0.97); r.dc -= 5; r.lineas.push('Sin datos de la due diligence, el gestor gana: ya no bajará de ' + H.eur(n.suelo) + '.'); }
    }
    if (ef.albert) s.albert = U.clamp(s.albert + ef.albert, 0, 100);
    if (o.aprende) r.aprende.push(o.aprende);
    r.lineas.push(o.por);
    r.tono = r.dc > 3 ? 'bien' : r.dc < 0 ? 'mal' : 'neutro';
    aplicar(d, n, r);
    return r;
  };

  // Al levantarse: ¿era buena idea?
  H.evaluarIrse = function (s, d, n) {
    var fraude = d.banderas.some(function (b) { return b.id === 'fraude'; });
    var vj = H.valorJusto(d, n ? n.est : []);
    if (fraude) return { bien: true, xp: 150, txt: 'Las cuentas no cuadraban. Levantarse era lo correcto.', concepto: 'saber_irse' };
    if (vj < (n ? n.precio : d.pide) * 0.85) return { bien: true, xp: 60, txt: 'Bien visto: valía ' + H.eur(vj) + ' y pedía ' + H.eur(n ? n.precio : d.pide) + '.', concepto: 'saber_irse' };
    return { bien: false, xp: 10, txt: 'Era un buen deal: valía ' + H.eur(vj) + '. Otra vez será.', concepto: null };
  };

  // ---------- Compra ----------
  H.financiacion = function (s, d, n) {
    var p = n.precio, vl = n.est.indexOf('vendor_loan') >= 0 ? p * 0.2 : 0, eo = n.est.indexOf('earnout') >= 0 ? p * 0.2 : 0;
    var bancoMax = Math.min(p * 0.5, H.ebitdaReal(d) * 2.5);
    var ops = [0, 0.25, 0.5].map(function (pc) {
      var banco = Math.min(p * pc, bancoMax), caja = p - vl - eo - banco;
      return { pc: pc, banco: banco, caja: caja, cuota: banco * 0.2, ok: caja <= s.caja + 1, limitado: p * pc > bancoMax + 1 };
    });
    return { precio: p, vl: vl, eo: eo, bancoMax: bancoMax, ops: ops };
  };

  H.comprar = function (s, d, n, op) {
    var est = n.est, sec = H.sector(d.sec), riesgos = [], factor = 1, albert = 0;
    d.banderas.forEach(function (b) {
      var B = H.BANDERAS[b.id];
      if (FACTOR[b.id]) { if (b.vista) factor *= FACTOR[b.id]; else riesgos.push({ id: b.id, mit: false }); if (b.id === 'fraude' && b.vista) albert -= 20; return; }
      if (cubierta(b.id, est)) return;
      if (COSTE[b.id]) { if (!b.jugada) riesgos.push({ id: b.id, mit: false }); return; }
      riesgos.push({ id: b.id, mit: b.jugada });
    });
    var tiene = function (id) { return d.banderas.some(function (b) { return b.id === id; }); };
    var ebitda = d.ebitdaDecl * factor;
    var c = {
      id: 'c' + (s.idSeq++), lote: d.lote, sec: d.sec, nombre: d.nombre, dueno: d.dueno, ventas: d.ventas,
      ebitda: ebitda, ebitda0: ebitda,
      dep: tiene('dependencia') ? (cubierta('dependencia', est) ? 0.6 : 1) : 0.6,
      conc: tiene('concentracion') ? (cubierta('concentracion', est) ? 0.3 : 0.5) : 0.15,
      recur: d.recur, sistemas: 0, auto: 0, precios: 0, recurN: 0, gerente: false,
      riesgos: riesgos, transicion: est.indexOf('transicion') >= 0 ? 12 : 0,
      deuda: op.banco, deuda0: op.banco, vl: n.est.indexOf('vendor_loan') >= 0 ? n.precio * 0.2 : 0,
      earnout: n.est.indexOf('earnout') >= 0 ? { importe: n.precio * 0.2, mes: s.mes + 24, base: ebitda } : null,
      invertido: op.caja, precio: n.precio, mesCompra: s.mes, hist: [Math.round(ebitda)], usadas: {}
    };
    c.vl0 = c.vl;
    s.caja -= op.caja;
    s.empresas.push(c);
    s.deals = s.deals.filter(function (x) { return x.id !== d.id; });
    s.stats.compras++;
    var vj = H.valorJusto(d, est);
    var cubiertos = d.banderas.filter(function (b) { return b.vista && !FACTOR[b.id]; }).every(function (b) { return cubierta(b.id, est) || (COSTE[b.id] && b.jugada); });
    var est3 = 1 + (n.precio <= vj * 1.05 ? 1 : 0) + (n.precio <= vj * 0.95 && cubiertos ? 1 : 0);
    albert += est3 === 3 ? 12 : est3 === 2 ? 5 : -8;
    s.albert = U.clamp(s.albert + albert, 0, 100);
    if (op.banco > 0) H.aprender(s, 'apalancamiento');
    H.aprender(s, 'ebitda'); H.aprender(s, 'multiplo'); H.aprender(s, 'carta_intenciones');
    return { empresa: c, estrellas: est3, valorJusto: vj, albert: albert, xp: 80 + est3 * 60 };
  };

  // ---------- Operación ----------
  H.multSalida = function (s, c) {
    var sec = H.sector(c.sec);
    var mismo = s.empresas.filter(function (x) { return x.sec === c.sec; }).length;
    return Math.max(1.5, sec.mult + 0.5 - 1.0 * c.dep - 1.4 * Math.max(0, c.conc - 0.2) + 0.1 * c.sistemas + 0.6 * (c.recur - sec.recur) + (mismo >= 2 ? 0.3 : 0));
  };
  H.valorEmpresa = function (s, c) { return c.ebitda * H.multSalida(s, c); };
  H.deudaEmpresa = function (c) { return c.deuda + c.vl + (c.earnout ? c.earnout.importe : 0); };
  H.nav = function (s) {
    var v = s.caja;
    s.empresas.forEach(function (c) { v += H.valorEmpresa(s, c) - H.deudaEmpresa(c); });
    return v;
  };
  H.actualizarParte = function (s) { s.tuParte = 0.25 * (H.nav(s) - s.capital); return s.tuParte; };
  H.parteDe = function (s, c) { return 0.25 * (H.valorEmpresa(s, c) - H.deudaEmpresa(c) - c.invertido); };

  H.puedePalanca = function (s, c, id) {
    var P = H.PALANCAS[id];
    if (s.energia <= 0) return 'Sin tiempo este mes ⚡';
    if (c.usadas[id]) return 'Ya usada este mes';
    if (P.unica && id === 'gerente' && c.gerente) return 'Ya tiene gerente';
    if (P.max && id === 'automatizar' && c.auto >= P.max) return 'Al máximo';
    if (P.max && id === 'cuadro' && c.sistemas >= P.max) return 'Al máximo';
    if (P.max && id === 'recurrente' && c.recurN >= P.max) return 'Al máximo';
    if (id === 'vender' && s.mes - c.mesCompra < 3) return 'Espera 3 meses tras comprar';
    return null;
  };

  // extra = resultado del mini-reto de ventas (true/false) para 'comercial'.
  H.palanca = function (s, c, id, extra) {
    var r = { lineas: [], aprende: [H.PALANCAS[id].concepto], xp: 20 };
    s.energia--; c.usadas[id] = true; s.stats.palancas++;
    if (id === 'precios') {
      c.precios++;
      if (c.precios <= 2) { var g = U.rnd(0.03, 0.05); c.ebitda *= 1 + g; r.lineas.push('Los clientes ni pestañean. EBITDA +' + H.pct(g) + '.'); }
      else if (c.precios === 3) { c.ebitda *= 1.02; r.lineas.push('Algún cliente se queja. EBITDA +2%. Cuidado: estás cerca del límite.'); }
      else { c.ebitda *= 0.93; r.lineas.push('Te has pasado: se van clientes. EBITDA −7%.'); r.xp = 5; }
    } else if (id === 'comercial') {
      if (extra) { c.ebitda *= 1.04; c.conc = Math.max(0.08, c.conc * 0.72); r.lineas.push('¡Cliente nuevo! EBITDA +4% y menos dependencia del grande.'); r.xp = 45; }
      else { c.ebitda *= 1.01; c.conc = Math.max(0.08, c.conc * 0.93); r.lineas.push('Poca cosa. Una visita que no cerró nada.'); r.xp = 10; }
    } else if (id === 'gerente') {
      var sueldo = U.clamp(Math.round(c.ebitda * 0.15 / 1000) * 1000, 35000, 65000);
      c.gerente = true; c.ebitda -= sueldo; c.dep = Math.min(c.dep, 0.2); s.stats.gerentes++;
      r.lineas.push('Contratas gerente por ' + H.eur(sueldo) + '/año. La empresa ya no depende del dueño: el múltiplo sube y crece sola.'); r.xp = 60;
    } else if (id === 'automatizar') {
      c.auto++; c.ebitda += c.ventas * 0.006; r.lineas.push('Facturas, pedidos y avisos en piloto automático. Margen +0,6 puntos.');
    } else if (id === 'cuadro') {
      c.sistemas++;
      var oculto = c.riesgos.filter(function (x) { return !x.mit; })[0];
      if (oculto) { oculto.mit = true; r.lineas.push('¡El cuadro de mando destapa un riesgo: ' + H.BANDERAS[oculto.id].e + ' ' + H.BANDERAS[oculto.id].n + '! Si estalla, dolerá la mitad.'); r.xp = 50; }
      else r.lineas.push('Números claros cada mes. El múltiplo sube.');
    } else if (id === 'recurrente') {
      c.recurN++; c.recur = Math.min(0.97, c.recur + 0.1); c.ebitda *= 0.99; r.lineas.push('Más clientes con cuota mensual. Recurrente ' + H.pct(c.recur) + '.');
    }
    if (c.dep > 0.2 && id !== 'gerente' && id === 'comercial') c.dep = Math.max(0.2, c.dep - 0.05);
    return r;
  };

  H.ofertasVenta = function (s, c) {
    var m = H.multSalida(s, c);
    var comp = [
      { n: 'Competidor de la zona', e: '🏪', m: m * U.rnd(0.9, 1.0), d: 'Todo al contado.' },
      { n: 'Fondo de búsqueda', e: '💼', m: m * U.rnd(1.0, 1.1), d: 'Paga bien si la empresa funciona sin dueño.' },
      { n: 'Grupo industrial', e: '🏭', m: m * (c.sistemas >= 2 ? U.rnd(1.05, 1.15) : U.rnd(0.85, 0.95)), d: c.sistemas >= 2 ? 'Le encantan tus números.' : 'Desconfía: no hay números claros.' }
    ];
    if (c.dep > 0.5) comp[1].m *= 0.88;
    return comp.map(function (o) { o.valor = c.ebitda * o.m; o.neto = o.valor - H.deudaEmpresa(c); return o; });
  };

  H.vender = function (s, c, of) {
    var ganancia = of.neto - c.invertido;
    s.caja += of.neto; s.realizado += ganancia; s.stats.ventas++;
    if (ganancia > 0) s.stats.exitosBuenos++;
    s.empresas = s.empresas.filter(function (x) { return x.id !== c.id; });
    s.albert = U.clamp(s.albert + (ganancia > 0 ? 15 : -15), 0, 100);
    s.energia = Math.max(0, s.energia - 1);
    H.aprender(s, 'arbitraje');
    return { ganancia: ganancia, tuya: Math.max(0, ganancia * 0.25), xp: 100 + Math.max(0, Math.round(ganancia / 4000)) };
  };

  // ---------- Fin de mes ----------
  H.cerrarMes = function (s) {
    H.actualizarParte(s);
    var rep = { mes: H.fecha(s.mes), lineas: [], eventos: [], avisos: [], parteAntes: s.tuParte };
    s.empresas.forEach(function (c) {
      var interes = c.deuda * 0.055 / 12, amort = c.deuda0 > 0 ? Math.min(c.deuda, c.deuda0 / 84) : 0;
      var vlPago = c.vl > 0 ? Math.min(c.vl, c.vl0 / 36) : 0;
      var flujo = c.ebitda / 12 * 0.72 - interes - amort - vlPago - c.vl * 0.04 / 12;
      c.deuda -= amort; c.vl -= vlPago; s.caja += flujo;
      c.ebitda *= 1 + U.rnd(-0.008, 0.012) + (c.gerente ? 0.005 : 0) + c.auto * 0.001;
      if (c.transicion > 0) { c.transicion--; c.dep = Math.max(0.35, c.dep - 0.025); }
      c.usadas = {};
      c.hist.push(Math.round(c.ebitda)); if (c.hist.length > 24) c.hist.shift();
      rep.lineas.push({ nombre: c.nombre, sec: c.sec, flujo: flujo, id: c.id });
      if (c.earnout && s.mes + 1 >= c.earnout.mes) {
        if (c.ebitda >= c.earnout.base * 0.9) { s.caja -= c.earnout.importe; c.invertido += c.earnout.importe; rep.avisos.push('🎯 Earn-out de ' + c.nombre + ': se cumplieron objetivos. Pagas ' + H.eur(c.earnout.importe) + '.'); }
        else rep.avisos.push('🎯 Earn-out de ' + c.nombre + ': no se cumplieron objetivos. Te ahorras ' + H.eur(c.earnout.importe) + '.');
        c.earnout = null;
      }
    });
    // Un evento al mes como mucho: primero los riesgos que no cubriste.
    var cands = [];
    s.empresas.forEach(function (c) {
      if (s.mes - c.mesCompra < 1) return;
      c.riesgos.forEach(function (rg) { if (Math.random() < 0.3) cands.push({ c: c, ev: H.EVENTOS.filter(function (e) { return e.riesgo === rg.id; })[0], mit: rg.mit }); });
    });
    if (cands.length) { var x = U.pick(cands); s.evento = { comp: x.c.id, ev: x.ev.id, mit: x.mit }; }
    else if (s.empresas.length && Math.random() < 0.5) {
      var gen = H.EVENTOS.filter(function (e) { return !e.riesgo; });
      s.evento = { comp: U.pick(s.empresas).id, ev: U.pick(gen).id, mit: false };
    } else s.evento = null;
    // Deals que llevan tiempo en venta se los lleva otro.
    s.deals.forEach(function (d) { d.meses++; d.nuevo = false; });
    var vendidos = s.deals.filter(function (d) { return d.meses > 2; });
    vendidos.forEach(function (d) { rep.avisos.push('🏷️ ' + d.nombre + ' se la ha quedado otro comprador.'); });
    s.deals = s.deals.filter(function (d) { return d.meses <= 2; });
    rep.nuevos = H.rellenarDeals(s);
    // Albert amplía el fondo si confía.
    if (s.albert >= 80 && s.empresas.length && !s.fondos[s.nivel]) {
      s.fondos[s.nivel] = true; s.caja += 1000000; s.capital += 1000000;
      rep.avisos.push('💼 Albert confía en ti: amplía el fondo en 1 M€.');
    }
    s.mes++; s.energia = s.energiaMax;
    H.actualizarParte(s);
    rep.parteDespues = s.tuParte; s.parteMes = s.tuParte;
    return rep;
  };

  H.resolverEvento = function (s, idx) {
    var e = s.evento; if (!e) return null;
    var ev = H.EVENTOS.filter(function (x) { return x.id === e.ev; })[0];
    var c = s.empresas.filter(function (x) { return x.id === e.comp; })[0];
    var op = ev.ops[idx], ef = op.ef, k = e.mit ? 0.5 : 1;
    if (c) {
      if (ef.ebitdaPct) c.ebitda *= 1 + ef.ebitdaPct * (ef.ebitdaPct < 0 ? k : 1);
      if (ef.quitaRiesgo && ev.riesgo) c.riesgos = c.riesgos.filter(function (r) { return r.id !== ev.riesgo; });
      if (ef.deuda) c.deuda += ef.deuda;
    }
    if (ef.cash) s.caja += ef.cash * (ef.cash < 0 ? k : 1);
    if (ef.albert) s.albert = U.clamp(s.albert + ef.albert, 0, 100);
    s.evento = null;
    if (ev.riesgo) H.aprender(s, H.BANDERAS[ev.riesgo].concepto);
    H.actualizarParte(s);
    return { por: op.por, xp: ef.xp || 5, mit: e.mit };
  };
  H.eventoActual = function (s) {
    if (!s.evento) return null;
    return { ev: H.EVENTOS.filter(function (x) { return x.id === s.evento.ev; })[0], c: s.empresas.filter(function (x) { return x.id === s.evento.comp; })[0], mit: s.evento.mit };
  };

  // ---------- Misiones ----------
  H.misionActual = function (s) { for (var i = 0; i < H.MISIONES.length; i++) if (!s.misiones[H.MISIONES[i].id]) return H.MISIONES[i]; return null; };
  H.revisarMisiones = function (s) {
    var hechas = [];
    H.MISIONES.forEach(function (m) { if (!s.misiones[m.id] && m.ok(s)) { s.misiones[m.id] = true; hechas.push(m); } });
    return hechas;
  };
})();

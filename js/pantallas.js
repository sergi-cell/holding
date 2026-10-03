// HOLDING — pantallas: ficha, due diligence, combate, compra, empresa, cartera, mes, gimnasio, Albert, Dealdex.
var H = window.H || (window.H = {});
(function () {
  'use strict';
  var UI = H.ui, $ = UI.$, $$ = UI.$$, esc = UI.esc;
  var P = H.pantallas = {}, A = H.acciones = {};
  function S() { return H.estado; }
  function tuto(id) { var s = S(); s.tuto = s.tuto || {}; if (s.tuto[id]) return false; s.tuto[id] = true; return true; }
  function dealPorId(id) { return S().deals.filter(function (d) { return d.id === id; })[0]; }
  function empresaPorId(id) { return S().empresas.filter(function (c) { return c.id === id; })[0]; }
  var COL = ['#3b82f6', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6', '#06b6d4'];
  function nombreDueno(d) { return d.dueno.nombre.toUpperCase(); }
  function x1(v) { return v.toFixed(1).replace('.', ',') + '×'; }

  // ================= ACCIONES DEL MUNDO =================
  A.hablar = async function (n) {
    H.world.marca = null;
    n.hablando = true;
    try {
      if (n.id === 'broker') await P.broker();
      else if (n.deal) { var d = dealPorId(n.deal); if (d) await P.deal(d); }
      else if (n.vecino) await P.vecino(n);
    } finally { H.world.soltarNpcs(); }
  };
  A.leer = async function (o) {
    if (o.tipo === 'tablon') return P.tablon();
    if (o.tipo === 'seVende') { var d = dealPorId(o.deal); if (d) await UI.decir(['SE VENDE: ' + d.nombre + '.', 'El dueño, ' + d.dueno.nombre + ', está en la puerta. Habla con él.']); return; }
    await UI.decir(o.txt);
  };
  A.entrar = async function (pu) {
    if (pu.tipo === 'edificio') {
      if (pu.id === 'hq') return P.oficina();
      if (pu.id === 'reto') return P.gimnasio();
      if (pu.id === 'albert') return P.albert();
      if (pu.id === 'dex') return P.dealdex();
    }
    if (pu.tipo === 'deal') { var d = dealPorId(pu.id); if (d) return P.deal(d); }
    if (pu.tipo === 'empresa') { var c = empresaPorId(pu.id); if (c) return P.empresa(c); }
  };

  // ================= VECINOS (enseñan conceptos) =================
  var LECCIONES = {
    v1: { saludo: 'Yo vendí mi taller hace 5 años. Te cuento lo que aprendí...', ids: ['legado', 'motivo', 'transicion', 'sueldo_dueno', 'saber_irse'] },
    v2: { saludo: '¡Eh! Yo arreglo empresas que otros compran. Apunta:', ids: ['precios', 'recurrencia', 'gerente', 'cuadro_mando', 'plan100'] },
    v3: { saludo: 'Soy abogado de compraventas. Lo que no está firmado, no existe.', ids: ['carta_intenciones', 'due_diligence', 'garantias', 'escrow', 'cambio_control', 'deuda_neta'] },
    v4: { saludo: 'Banquero. Me paso el día diciendo que no. A ti te diré esto:', ids: ['apalancamiento', 'capital_circulante', 'vendor_loan', 'buy_and_build', 'socio_capital'] }
  };
  P.vecino = async function (n) {
    var L = LECCIONES[n.id], s = S();
    var id = L.ids.filter(function (k) { return !s.codex[k]; })[0] || H.u.pick(L.ids), c = H.CODEX[id];
    await UI.decir([L.saludo, c.e + ' ' + c.n.toUpperCase() + ': ' + c.d, c.r], { nombre: n.nombre });
    UI.aprender(id);
    await UI.tras();
  };

  // ================= LA BRÓKER Y EL TABLÓN =================
  P.broker = async function () {
    var s = S(), nom = { nombre: 'LA BRÓKER' };
    if (tuto('broker')) {
      await UI.decir(['¡Hola, ' + s.nombre + '! Soy LA BRÓKER. Me entero de cada empresa que se vende en Villa Pyme.',
        'Cuando un dueño quiere vender, su empresa aparece en un solar con el cartel SE VENDE. Él espera en la puerta.',
        'Mi consejo: antes de negociar, 🔎 ANALIZA. Gasta ⚡ de tu tiempo, pero destapa las banderas rojas.',
        'Y ojo: el tiempo ⚡ de cada mes se acaba. Cuando no te quede, cierra el mes en TU OFICINA.'], nom);
    }
    if (!s.deals.length) { await UI.decir('Este mes no queda nada en venta. Cierra el mes en tu oficina y vuelve.', nom); return; }
    await UI.decir('Este mes tengo ' + s.deals.length + (s.deals.length === 1 ? ' empresa' : ' empresas') + ' en venta. Mira el tablón.', nom);
    await P.tablon();
  };

  P.tablon = function () {
    var s = S();
    return new Promise(function (res) {
      var html = '<div class="cab"><h2>📌 TABLÓN DE DEALS</h2><p>' + esc(H.fecha(s.mes)) + ' · Toca uno para marcarlo en el mapa</p></div><div class="lista">' +
        (s.deals.length ? s.deals.map(function (d) {
          var sec = H.sector(d.sec), m = d.pide / d.ebitdaDecl;
          return '<button class="tarjeta deal" data-f data-id="' + d.id + '" style="--c1:' + sec.c[0] + ';--c2:' + sec.c[1] + '">' +
            '<span class="ico">' + sec.e + '</span><span class="cuerpo"><b>' + esc(d.nombre) + '</b><small>' + esc(sec.n) + ' · SOLAR ' + (d.lote + 1) + (d.nuevo ? ' · <em class="nuevo">¡NUEVO!</em>' : '') + '</small>' +
            '<span class="mini"><span>PIDE <b>' + H.eur(d.pide) + '</b></span><span>EBITDA <b>' + H.eur(d.ebitdaDecl) + '</b></span><span><b>' + x1(m) + '</b></span></span></span></button>';
        }).join('') : '<p class="vacio">No hay empresas en venta este mes.</p>') + '</div><button class="btn" data-f data-x>CERRAR</button>';
      var p = UI.panel(html, { clase: 'tablon', alCerrar: res });
      $$('[data-id]', p.el).forEach(function (b) {
        b.onclick = function () {
          var d = dealPorId(b.dataset.id), l = H.LOTES[d.lote];
          H.world.marca = { x: l.x + 3, y: l.y + 3 }; H.audio.sfx_('ok'); p.cerrar();
          UI.aviso('📍 Marcado: SOLAR ' + (d.lote + 1) + ' — sigue la flecha');
        };
      });
      $('[data-x]', p.el).onclick = function () { H.audio.sfx_('atras'); p.cerrar(); };
      var f = p.focos(); if (f[0]) p.enfocar(f[0]);
    });
  };

  // ================= FICHA DE UN DEAL =================
  P.deal = async function (d) {
    var s = S();
    d.nuevo = false; H.world.npcs().forEach(function (n) { if (n.deal === d.id) n.nuevo = false; });
    if (!d.visto) { d.visto = true; s.stats.vistos++; }
    var saludo = d.motivoSabido ? '¿Qué, volvemos a hablar?' : U_pick(['¿Vienes por lo de la empresa? Pasa, pasa.', 'Así que tú eres el comprador. A ver qué ofreces.', 'Llevo 30 años levantando esto. No la regalo.']);
    await UI.decir(saludo, { nombre: nombreDueno(d) });
    await UI.tras();
    while (true) {
      var acc = await fichaDeal(d);
      if (acc === 'analizar') {
        if (s.energia <= 0) { await UI.decir('No te queda tiempo ⚡ este mes. Cierra el mes en tu oficina.'); continue; }
        await P.dd(d);
      } else if (acc === 'negociar') {
        if (s.energia <= 0) { await UI.decir('No te queda tiempo ⚡ este mes. Cierra el mes en tu oficina.'); continue; }
        if (!d.analizado && tuto('sinAnalizar')) {
          var ok = await UI.si('Vas a negociar SIN ANALIZAR. No sabrás qué esconde. ¿Seguro?', { nombre: 'ALBERT 📞' });
          if (!ok) continue;
        }
        await P.combate(d); return;
      } else return;
    }
  };
  function U_pick(a) { return a[Math.floor(Math.random() * a.length)]; }

  function fichaDeal(d) {
    var s = S(), sec = H.sector(d.sec), m = d.pide / d.ebitdaDecl, car = H.CARACTERES[d.car], mot = H.MOTIVOS[d.motivo];
    var vistas = d.banderas.filter(function (b) { return b.vista; });
    var bloqueado = d.bloqueado === s.mes;
    return new Promise(function (res) {
      var html = '<div class="ficha" style="--c1:' + sec.c[0] + ';--c2:' + sec.c[1] + '">' +
        '<div class="ficha-top"><div class="slot-edif"></div><div class="slot-dueno"></div><span class="solar">SOLAR ' + (d.lote + 1) + '</span></div>' +
        '<h2>' + sec.e + ' ' + esc(d.nombre) + '</h2><p class="sub">' + esc(sec.n) + ' · ' + esc(d.ciudad) + '</p>' +
        '<div class="kpis"><div><small>PIDE</small><b>' + H.eur(d.pide) + '</b></div><div><small>EBITDA</small><b>' + H.eur(d.ebitdaDecl) + '</b><i>declarado</i></div>' +
        '<div><small>VENTAS</small><b>' + H.eur(d.ventas) + '</b></div></div>' +
        '<div class="multiplo"><div class="mtit"><span>MÚLTIPLO QUE PIDE</span><b class="' + (m > sec.mult * 1.15 ? 'rojo' : m > sec.mult * 1.05 ? 'ambar' : 'verde') + '">' + x1(m) + '</b></div>' +
        '<div class="regla"><span class="zona" style="left:' + pos(sec.mult - 0.5) + '%;width:' + (pos(sec.mult + 0.5) - pos(sec.mult - 0.5)) + '%"></span><span class="aguja" style="left:' + pos(m) + '%"></span></div>' +
        '<div class="escala"><span>2×</span><span>Normal del sector: ' + x1(sec.mult) + '</span><span>8×</span></div></div>' +
        '<div class="tags">' + d.tags.map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('') + '</div>' +
        '<div class="dueno-linea"><b>' + esc(d.dueno.nombre + ' ' + d.dueno.apellido) + '</b> · ' + d.dueno.edad + ' años · ' + esc(car.n) +
        (d.motivoSabido ? '<br>Motivo: ' + mot.e + ' ' + esc(mot.n) : '<br>Motivo: ❓ (pregúntaselo)') + '</div>' +
        '<div class="banderas-f">' + (d.analizado ? (vistas.length ? vistas.map(function (b) { var B = H.BANDERAS[b.id]; return '<span class="bf">' + B.e + ' ' + esc(B.n) + '</span>'; }).join('') : '<span class="ok">✅ No encontraste banderas rojas</span>') : '<span class="nada">🔒 Sin analizar: no sabes qué esconde</span>') + '</div>' +
        '<div class="acciones">' +
        '<button class="btn azul" data-f data-a="analizar"' + (d.analizado || s.energia <= 0 ? ' disabled' : '') + '>🔎 ANALIZAR <i>⚡1</i></button>' +
        '<button class="btn rojo" data-f data-a="negociar"' + (bloqueado || s.energia <= 0 ? ' disabled' : '') + '>⚔️ NEGOCIAR <i>⚡1</i></button>' +
        '<button class="btn" data-f data-a="salir">SALIR</button></div>' +
        (bloqueado ? '<p class="nota">Se cansó de ti este mes. Vuelve el mes que viene.</p>' : s.energia <= 0 ? '<p class="nota">Sin tiempo ⚡ este mes.</p>' : '') +
        '</div>';
      var p = UI.panel(html, { clase: 'p-ficha', b: function (api) { H.audio.sfx_('atras'); api.cerrar(); res('salir'); } });
      $('.slot-edif', p.el).appendChild(UI.edificioCanvas(sec, false, 2));
      $('.slot-dueno', p.el).appendChild(UI.sprite(d.dueno.look, 'down', 4, 'respira'));
      $$('[data-a]', p.el).forEach(function (b) { b.onclick = function () { H.audio.sfx_('ok'); p.cerrar(); res(b.dataset.a); }; });
      var f = p.focos(); if (f[0]) p.enfocar(f[0]);
      if (tuto('ficha')) setTimeout(function () {
        UI.decir(['Fíjate en el MÚLTIPLO: precio ÷ EBITDA. Si pide mucho más de lo normal en su sector, sospecha.',
          'Las etiquetas son PISTAS, no pruebas. Lo que de verdad cuenta lo destapa el 🔎 ANÁLISIS.'], { nombre: 'ALBERT 📞' });
      }, 350);
    });
  }
  function pos(m) { return Math.max(0, Math.min(100, (m - 2) / 6 * 100)); }

  // ================= DUE DILIGENCE / OJO CLÍNICO =================
  var LIMPIO = {
    concentracion: 'Ningún cliente pasa del 20%. Cartera repartida: sana.', dependencia: 'Los comerciales traen casi todo. No depende del dueño.',
    addbacks: 'Ajustes pequeños y con factura. Así sí.', tendencia: 'EBITDA creciendo año a año. Buena señal.',
    pico: 'Meses parecidos con estacionalidad normal. Nada raro.', laboral: 'Todos en nómina. Un asesor externo unas horas es normal; lo malo es un "autónomo" a jornada completa.',
    hacienda: 'Hacienda al corriente y todo aparece en el resumen.', cobros: 'Casi todo se cobra en menos de 90 días.',
    stock: 'Todo el almacén rota en menos de 4 meses.', capex: 'La maquinaria tiene vida por delante.',
    cambio_control: 'Ningún contrato se rompe por cambiar de dueño.', local: 'Local de un tercero con contrato largo. Perfecto.',
    fraude: 'Lo que enseña cuadra con lo que declara a Hacienda.'
  };
  P.vis = function (dt) {
    var B = H.BANDERAS[dt.tipo], h = '';
    switch (B.vis) {
      case 'donut': {
        var a0 = -Math.PI / 2, paths = '', ley = '';
        dt.el.forEach(function (e, i) {
          var a1 = a0 + e.v * 2 * Math.PI, xa = 60 + 52 * Math.cos(a0), ya = 60 + 52 * Math.sin(a0), xb = 60 + 52 * Math.cos(a1), yb = 60 + 52 * Math.sin(a1);
          paths += '<path data-el="' + i + '" d="M60 60 L' + xa.toFixed(2) + ' ' + ya.toFixed(2) + ' A52 52 0 ' + (a1 - a0 > Math.PI ? 1 : 0) + ' 1 ' + xb.toFixed(2) + ' ' + yb.toFixed(2) + ' Z" fill="' + COL[i % 6] + '" stroke="#1b1b24" stroke-width="2.5"/>';
          ley += '<div class="ley" data-f data-el="' + i + '"><i style="background:' + COL[i % 6] + '"></i>' + esc(e.l) + '<b>' + e.txt + '</b></div>';
          a0 = a1;
        });
        h = '<div class="donut"><svg viewBox="0 0 120 120">' + paths + '<circle cx="60" cy="60" r="20" fill="#fffdf5" stroke="#1b1b24" stroke-width="2.5"/></svg><div class="leyenda">' + ley + '</div></div>';
        break;
      }
      case 'puente': {
        h = '<div class="hbarras puente"><div class="fila base"><span class="l">EBITDA contable</span><span class="barra"><span style="width:62%;background:#64748b"></span></span><span class="v">100%</span></div>';
        var tot = 1;
        dt.el.forEach(function (e, i) {
          tot += e.v;
          h += '<div class="fila" data-f data-el="' + i + '"><span class="l">+ ' + esc(e.l) + '</span><span class="barra"><span style="width:' + Math.round(e.v * 220) + '%;background:#f59e0b"></span></span><span class="v">' + e.txt + (e.doc ? ' 📎' : ' ∅') + '</span></div>';
        });
        h += '<div class="fila base"><span class="l">= Lo que te enseña</span><span class="barra"><span style="width:' + Math.min(100, Math.round(62 * tot)) + '%;background:#22c55e"></span></span><span class="v">' + H.pct(tot) + '</span></div><p class="leyenda-mini">📎 con factura · ∅ sin papeles</p></div>';
        break;
      }
      case 'vendedores': case 'antiguedad': case 'rotacion': case 'deuda': case 'maquinas': {
        var max = B.vis === 'maquinas' ? 1 : Math.max.apply(null, dt.el.map(function (e) { return e.v; }));
        h = '<div class="hbarras">' + dt.el.map(function (e, i) {
          return '<div class="fila" data-f data-el="' + i + '"><span class="l">' + (e.ico ? e.ico + ' ' : '') + esc(e.l) + '</span><span class="barra"><span style="width:' + Math.max(3, Math.round(e.v / max * 100)) + '%;background:' + COL[i % 6] + '"></span></span><span class="v">' + esc(e.txt || '') + '</span></div>';
        }).join('') + '</div>';
        break;
      }
      case 'anios': case 'meses': {
        var mx = Math.max.apply(null, dt.el.map(function (e) { return e.v; }));
        h = '<div class="vbarras ' + B.vis + '">' + dt.el.map(function (e, i) { return '<div class="col" data-f data-el="' + i + '"><span class="b" style="height:' + Math.round(e.v / mx * 100) + '%;background:' + (B.vis === 'anios' ? COL[0] : COL[2]) + '"></span><small>' + e.l + '</small></div>'; }).join('') + '</div>';
        break;
      }
      case 'cuadre': {
        h = '<div class="vbarras cuadre">' + dt.el.map(function (e, i) { return '<div class="col" data-f data-el="' + i + '"><span class="par"><span class="b" style="height:100%;background:#3b82f6"></span><span class="b" style="height:' + Math.round(e.v2 * 100) + '%;background:#f59e0b"></span></span><small>' + e.l + '</small></div>'; }).join('') +
          '</div><p class="leyenda-mini"><i style="background:#3b82f6"></i> Lo que te enseña &nbsp; <i style="background:#f59e0b"></i> IVA declarado</p>';
        break;
      }
      case 'equipo': {
        var caras = ['👨‍🔧', '👩‍🔧', '👨‍💼', '👩‍💼', '🧑‍🏭', '👷', '🧑‍💻'];
        h = '<div class="equipo">' + dt.el.map(function (e, i) { return '<div class="pers" data-f data-el="' + i + '"><span>' + caras[i % caras.length] + '</span><small>' + esc(e.l) + '</small></div>'; }).join('') + '</div>';
        break;
      }
      case 'contratos': {
        h = '<div class="docs">' + dt.el.map(function (e, i) { return '<div class="doc" data-f data-el="' + i + '"><b>📄 ' + esc(e.l) + '</b><p>' + esc(e.txt) + '</p></div>'; }).join('') + '</div>';
        break;
      }
      case 'local': {
        h = '<div class="docs local"><div class="nave">🏭 Nave de la empresa</div>' + dt.el.map(function (e, i) { return '<div class="doc fila-doc" data-f data-el="' + i + '"><b>' + esc(e.l) + '</b><p>' + esc(e.txt) + '</p></div>'; }).join('') + '</div>';
        break;
      }
    }
    return h;
  };

  // pantallas: array de datosVis. op: {titulo, tiempo, alAcierto(dt)}. Devuelve [{tipo, flag, ok}].
  P.inspeccion = function (pantallas, op) {
    var s = S();
    return new Promise(function (res) {
      var i = 0, combo = 0, maxCombo = 0, out = [], xpTot = 0, timer = null, decidido = false;
      var p = UI.panel('<div class="insp"><div class="insp-top"><span class="tit">' + op.titulo + '</span><span class="combo"></span><span class="cnt"></span></div>' +
        '<div class="tiempo"><span></span></div><h3 class="preg"></h3><div class="vis"></div><p class="ayuda">Toca lo que huela mal… o pulsa TODO LIMPIO</p>' +
        '<button class="btn verde limpio" data-f>✅ TODO LIMPIO</button></div>', { clase: 'p-insp', cerrable: false, b: function () {} });
      var vis = $('.vis', p.el), barra = $('.tiempo span', p.el);
      $('.limpio', p.el).onclick = function () { decidir('limpio'); };
      function pintar() {
        decidido = false;
        var dt = pantallas[i], B = H.BANDERAS[dt.tipo];
        $('.cnt', p.el).textContent = (i + 1) + '/' + pantallas.length;
        $('.preg', p.el).textContent = B.q;
        vis.className = 'vis'; vis.innerHTML = P.vis(dt);
        $$('[data-el]', vis).forEach(function (x) { x.addEventListener('click', function (ev) { ev.stopPropagation(); decidir('el', +x.dataset.el); }); });
        p.el.classList.remove('bien', 'mal');
        var t0 = performance.now(), T = op.tiempo * 1000;
        clearInterval(timer);
        timer = setInterval(function () {
          var k = 1 - (performance.now() - t0) / T; barra.style.width = Math.max(0, k * 100) + '%';
          barra.className = k < 0.3 ? 'poco' : '';
          if (k < 0.3 && Math.floor(k * 100) % 5 === 0) H.audio.sfx_('tic');
          if (k <= 0) decidir('tiempo');
        }, 60);
        var f = p.focos(); p.enfocar(null);
        if (f.length) p.enfocar(f[0]);
      }
      async function decidir(tipo, idx) {
        if (decidido) return; decidido = true; clearInterval(timer);
        var dt = pantallas[i], B = H.BANDERAS[dt.tipo], ok, lineas = [];
        if (dt.flag) ok = tipo === 'el' && (dt.holistico || dt.el[idx].anom);
        else ok = tipo === 'limpio';
        // revelar
        dt.el.forEach(function (e, k) { if (e.anom) $$('[data-el="' + k + '"]', vis).forEach(function (x) { x.classList.add('anom'); }); });
        if (dt.flag && dt.holistico) vis.classList.add('anom-todo');
        if (tipo === 'el' && !ok) $$('[data-el="' + idx + '"]', vis).forEach(function (x) { x.classList.add('mal-toque'); });
        H.srs(s, dt.tipo, ok);
        p.el.classList.add(ok ? 'bien' : 'mal');
        if (ok) {
          combo++; maxCombo = Math.max(maxCombo, combo);
          var g = 15 + 5 * Math.min(combo, 6); xpTot += g;
          H.audio.sfx_(dt.flag ? 'bandera' : 'bien'); H.audio.vibrar(dt.flag ? [20, 40, 20] : 15);
          $('.combo', p.el).textContent = combo > 1 ? 'COMBO ×' + combo : '';
          UI.flotar(p.el.querySelector('.insp'), '+' + g + ' XP', 'oro');
          if (dt.flag) { lineas.push('🚩 ¡BANDERA ROJA! ' + B.e + ' ' + B.n.toUpperCase()); lineas.push(B.lec); UI.aprender(B.concepto); if (op.alAcierto) op.alAcierto(dt); }
          else lineas.push('✅ Correcto. ' + LIMPIO[dt.tipo]);
        } else {
          combo = 0; $('.combo', p.el).textContent = '';
          H.audio.sfx_('mal'); H.audio.vibrar(60);
          if (tipo === 'tiempo') lineas.push('⏰ ¡Se acabó el tiempo!');
          if (dt.flag) { lineas.push('❌ Se te ha escapado: ' + B.e + ' ' + B.n.toUpperCase() + (tipo === 'el' && !dt.holistico ? ' (lo raro era lo marcado en rojo)' : '')); lineas.push(B.lec); }
          else { lineas.push('⚠️ Falsa alarma. ' + LIMPIO[dt.tipo]); }
        }
        out.push({ tipo: dt.tipo, flag: dt.flag, ok: ok });
        await UI.dormir(500);
        await UI.decir(lineas);
        i++;
        if (i < pantallas.length) pintar();
        else {
          p.cerrar();
          res({ resultados: out, xp: xpTot, combo: maxCombo, aciertos: out.filter(function (r) { return r.ok; }).length });
        }
      }
      pintar();
    });
  };

  P.dd = async function (d) {
    var s = S();
    s.energia--; d.analizado = true;
    UI.hud();
    if (tuto('dd')) await UI.decir(['DUE DILIGENCE: vas a ver 4 documentos de la empresa.', 'Si algo huele mal, TÓCALO. Si todo está bien, pulsa ✅ TODO LIMPIO.', 'Cada bandera que encuentres será un arma en la negociación.'], { nombre: 'ALBERT 📞' });
    var r = await P.inspeccion(H.pantallasDD(s, d), {
      titulo: '🔎 DUE DILIGENCE', tiempo: 15,
      alAcierto: function (dt) { var b = d.banderas.filter(function (x) { return x.id === dt.tipo; })[0]; if (b && !b.vista) { b.vista = true; s.stats.banderas++; } }
    });
    UI.aprender('due_diligence');
    UI.xp(r.xp);
    var vistas = d.banderas.filter(function (b) { return b.vista; }).length;
    await UI.decir(['Análisis terminado: ' + r.aciertos + '/' + r.resultados.length + ' aciertos' + (r.combo > 1 ? ' · combo máx ×' + r.combo : '') + '.',
      vistas ? 'Tienes ' + vistas + (vistas === 1 ? ' bandera roja' : ' banderas rojas') + ' para usar en la negociación (🚩 BANDERAS).' : 'No has encontrado banderas rojas que usar.']);
    await UI.tras();
  };

  // ================= COMBATE: LA NEGOCIACIÓN =================
  P.combate = async function (d) {
    var s = S(), car = H.CARACTERES[d.car], mot = H.MOTIVOS[d.motivo], NOM = nombreDueno(d);
    s.energia--; UI.hud();
    H.audio.sfx_('combate'); H.audio.tema('combate');
    await UI.transicion('combate');
    var n = H.nego(s, d), xpC = 0;
    var p = UI.panel('<div class="batalla"><div class="campo">' +
      '<div class="info rival"><div class="f1"><b>' + esc(NOM) + '</b><span>Nv.' + d.dueno.edad + '</span></div><div class="car"></div>' +
      '<div class="hpfila"><label>CONF</label><div class="hp"><span class="fill"></span><i class="umbral"><em>FIRMA</em></i></div></div><div class="pac"></div></div>' +
      '<div class="plat rival"><div class="humor"></div><div class="slot"></div></div>' +
      '<div class="plat yo"><div class="slot"></div></div>' +
      '<div class="info yo"><div class="f1"><b>' + esc(s.nombre) + '</b><span class="emp">' + H.sector(d.sec).e + '</span></div>' +
      '<div class="precio"><small>PRECIO EN LA MESA</small><b></b></div><div class="pide"></div><div class="cubre"></div></div>' +
      '</div></div>', { clase: 'p-batalla', cerrable: false, b: function () {} });
    var rivalSpr = UI.sprite(d.dueno.look, 'down', 6, 'rival-spr entra-der'), yoSpr = UI.sprite(H.LOOK_JUGADOR, 'up', 6, 'yo-spr entra-izq');
    $('.plat.rival .slot', p.el).appendChild(rivalSpr); $('.plat.yo .slot', p.el).appendChild(yoSpr);
    var precioAnt = n.precio;
    function pintar() {
      var umbral = H.umbralFirma(d, n);
      $('.car', p.el).textContent = car.n + ' · ' + (d.motivoSabido ? mot.e + ' ' + mot.n : '❓ motivo');
      var fill = $('.hp .fill', p.el); fill.style.width = n.conf + '%';
      fill.className = 'fill ' + (n.conf >= umbral ? 'verde' : n.conf >= 30 ? 'ambar' : 'rojo');
      $('.umbral', p.el).style.left = umbral + '%';
      var pips = ''; for (var k = 0; k < n.pacMax; k++) pips += '<i class="' + (k < n.pac ? 'on' : '') + '"></i>';
      $('.pac', p.el).innerHTML = '<label>PACIENCIA</label>' + pips;
      $('.humor', p.el).textContent = n.conf >= umbral ? '😄' : n.conf >= 45 ? '🙂' : n.conf >= 25 ? '😐' : '😠';
      var pb = $('.precio b', p.el); UI.contar(pb, precioAnt, n.precio, 500); precioAnt = n.precio;
      var desc = 1 - n.precio / d.pide;
      $('.pide', p.el).innerHTML = 'Pedía ' + H.eur(d.pide) + (desc > 0.001 ? ' · <b class="verde">−' + H.pct(desc) + '</b>' : '');
      $('.cubre', p.el).innerHTML = n.est.map(function (e) { return '<span title="' + esc(H.ESTRUCTURAS[e].n) + '">' + H.ESTRUCTURAS[e].e + '</span>'; }).join('') +
        d.banderas.filter(function (b) { return b.vista; }).map(function (b) { return '<span class="bfl' + (b.jugada ? ' usada' : '') + '">' + H.BANDERAS[b.id].e + '</span>'; }).join('');
    }
    pintar();
    await UI.dormir(500);
    await UI.decir(['¡' + NOM + ' ' + d.dueno.apellido.toUpperCase() + ' quiere VENDER ' + d.nombre.toUpperCase() + '!']);
    if (tuto('combate')) await UI.decir([
      'La barra CONF es su confianza en ti. Cuando llegue a la marca FIRMA, podrás cerrar.',
      'PACIENCIA: cada jugada gasta un turno. Si se acaba, se levanta.',
      'Primero PREGUNTA: el motivo de venta te dice qué estructura quiere. Ofrecer a ciegas sale caro.'], { nombre: 'ALBERT 📞' });
    var fin = null;
    while (!fin) {
      var m = await UI.elegir([{ t: 'PREGUNTAR', ico: '👂' }, { t: 'ESTRUCTURA', ico: '🤝' }, { t: 'BANDERAS', ico: '🚩' }, { t: 'OFERTA', ico: '💶' }],
        { cols: 2, cancelable: false, pregunta: '¿Qué hace ' + s.nombre + '?', clase: 'menu-batalla' });
      var jug = null;
      if (m === 0) {
        var q = await UI.elegir([{ t: '¿Por qué vendes?', sub: d.motivoSabido ? 'Ya lo sabes' : 'Descubre su motivo' }, { t: 'Cuéntame tu historia', sub: 'Gana confianza escuchando' }, { t: '¿Qué te preocupa de vender?', sub: n.preocupa ? 'Ya te lo dijo' : 'Pista de lo que quiere' }, '↩ Volver'], { titulo: '👂 PREGUNTAR' });
        if (q === 0) jug = ['motivo', null, 'PREGUNTAR POR QUÉ VENDE']; else if (q === 1) jug = ['historia', null, 'ESCUCHAR SU HISTORIA']; else if (q === 2) jug = ['preocupa', null, 'PREGUNTAR QUÉ LE PREOCUPA'];
      } else if (m === 1) {
        var ks = Object.keys(H.ESTRUCTURAS).filter(function (k) { return n.est.indexOf(k) < 0; });
        var e = await UI.elegir(ks.map(function (k) { var E = H.ESTRUCTURAS[k]; return { t: E.n, ico: E.e, sub: E.d }; }).concat(['↩ Volver']), { titulo: '🤝 ESTRUCTURA' });
        if (e >= 0 && e < ks.length) jug = ['estructura', ks[e], 'PROPONER ' + H.ESTRUCTURAS[ks[e]].n.toUpperCase()];
      } else if (m === 2) {
        var bs = d.banderas.filter(function (b) { return b.vista && !b.jugada; });
        var ops = bs.map(function (b) { var B = H.BANDERAS[b.id]; return { t: B.n, ico: B.e, sub: B.fatal ? 'Esto no se negocia…' : 'Baja el precio con datos' }; });
        if (!bs.length) ops.push({ t: d.analizado ? 'No te quedan banderas' : 'Sin analizar: no tienes datos', off: true });
        var bi = await UI.elegir(ops.concat(['↩ Volver']), { titulo: '🚩 BANDERAS' });
        if (bi >= 0 && bi < bs.length) jug = ['bandera', bs[bi].id, 'SACAR ' + H.BANDERAS[bs[bi].id].n.toUpperCase()];
      } else if (m === 3) {
        var um = H.umbralFirma(d, n);
        var o = await UI.elegir([{ t: 'Proponer cierre: ' + H.eur(n.precio), ico: '✍️', sub: 'Firma si su confianza llega a ' + um }, { t: 'Anclar bajo (−7%)', ico: '⚓', sub: 'Solo funciona con mucha confianza' }, { t: 'Levantarse de la mesa', ico: '🚪', sub: 'Te vas. Sin trato.' }, '↩ Volver'], { titulo: '💶 OFERTA' });
        if (o === 0) jug = ['cerrar', null, 'PROPONER EL CIERRE']; else if (o === 1) jug = ['ancla', null, 'ANCLAR BAJO']; else if (o === 2) jug = ['irse', null, 'LEVANTARSE'];
      }
      if (!jug) continue;
      if (jug[0] === 'irse') { fin = 'irse'; break; }
      H.audio.sfx_('golpe');
      yoSpr.classList.remove('ataca'); void yoSpr.offsetWidth; yoSpr.classList.add('ataca');
      var r = H.jugar(s, d, n, jug[0], jug[1]);
      await UI.decir('¡' + s.nombre + ' usa ' + jug[2] + '!');
      var info = $('.info.rival', p.el), mia = $('.info.yo', p.el);
      rivalSpr.classList.remove('golpe', 'salta'); void rivalSpr.offsetWidth;
      rivalSpr.classList.add(r.tono === 'mal' ? 'golpe' : 'salta');
      H.audio.sfx_(r.tono === 'mal' ? 'mal' : r.tono === 'bien' ? 'bien' : 'mover');
      if (r.dc) UI.flotar(info, (r.dc > 0 ? '+' : '') + r.dc + (r.dc > 0 ? ' 💚' : ' 💔'), r.dc > 0 ? 'verde' : 'rojo');
      if (r.dp) UI.flotar(mia, H.eur(r.dp), 'verde');
      if (r.tono === 'bien') xpC += 12;
      pintar();
      UI.aprender(r.aprende);
      if (r.lineas.length) await UI.decir(r.lineas);
      fin = r.fin;
    }
    if (xpC) UI.xp(xpC);
    if (fin === 'compra') {
      H.audio.jingle('victoria', 'pueblo');
      await UI.decir('¡' + NOM + ' acepta! Precio final: ' + H.eur(n.precio) + '.');
      p.cerrar();
      await P.financiar(d, n);
    } else {
      p.cerrar();
      H.audio.tema('pueblo');
      if (fin === 'irse') {
        var ev = H.evaluarIrse(s, d, n);
        s.deals = s.deals.filter(function (x) { return x.id !== d.id; });
        if (ev.bien) s.stats.irse++;
        if (ev.concepto) UI.aprender(ev.concepto);
        H.audio.sfx_(ev.bien ? 'bien' : 'mal');
        await UI.decir(['Te levantas de la mesa.', (ev.bien ? '✅ ' : '🤔 ') + ev.txt]);
        UI.xp(ev.xp);
      } else if (fin === 'cansado') {
        d.bloqueado = s.mes;
        await UI.decir('Puedes volver a intentarlo el mes que viene.');
      } else if (fin === 'ofendido') {
        s.deals = s.deals.filter(function (x) { return x.id !== d.id; });
        await UI.decir('Has perdido este deal. Sin confianza no hay trato.');
      }
      H.world.rebuild();
    }
    await UI.tras();
  };

  // ================= FIRMA Y FINANCIACIÓN =================
  P.financiar = function (d, n) {
    var s = S(), f = H.financiacion(s, d, n), ebitda = H.ebitdaReal(d);
    return new Promise(function (res) {
      var html = '<div class="cab"><h2>✍️ LA FIRMA</h2><p>¿Cómo pagáis ' + esc(d.nombre) + '?</p></div>' +
        '<div class="desglose"><div><span>Precio</span><b>' + H.eur(f.precio) + '</b></div>' +
        (f.vl ? '<div><span>🤝 Préstamo del vendedor (3 años)</span><b class="verde">−' + H.eur(f.vl) + '</b></div>' : '') +
        (f.eo ? '<div><span>🎯 Earn-out (en 24 meses, si se cumple)</span><b class="verde">−' + H.eur(f.eo) + '</b></div>' : '') +
        '<div><span>💼 Caja del fondo</span><b>' + H.eur(s.caja) + '</b></div></div>' +
        '<div class="opciones-fin">' + f.ops.map(function (o, i) {
          var ratio = ebitda > 0 ? o.cuota / ebitda : 1;
          return '<button class="tarjeta fin" data-f data-i="' + i + '"' + (o.ok ? '' : ' disabled') + '><b>' + (o.pc ? '🏦 BANCO ' + H.pct(o.pc) : '💼 SIN BANCO') + '</b>' +
            '<span>Pone el fondo: <b>' + H.eur(o.caja) + '</b></span>' +
            (o.banco ? '<span>Préstamo: ' + H.eur(o.banco) + (o.limitado ? ' (el banco no da más)' : '') + '</span><span>Cuota/año: ' + H.eur(o.cuota) + '</span><span class="medidor"><span style="width:' + Math.min(100, Math.round(ratio * 200)) + '%" class="' + (ratio < 0.35 ? 'verde' : ratio < 0.5 ? 'ambar' : 'rojo') + '"></span></span><small>' + H.pct(ratio) + ' del EBITDA en cuotas' + (ratio >= 0.5 ? ' ⚠️' : '') + '</small>' : '<span>Sin deuda. Duermes tranquilo.</span>') +
            (o.ok ? '' : '<em class="rojo">No llega la caja</em>') + '</button>';
        }).join('') + '</div>' +
        (f.ops.some(function (o) { return o.ok; }) ? '' : '<p class="nota">Albert no tiene caja suficiente. Necesitarías más estructura (préstamo del vendedor, earn-out) o más fondos.</p>') +
        '<button class="btn" data-f data-x>RENUNCIAR</button>';
      var p = UI.panel(html, { clase: 'p-fin', cerrable: false, b: function () {} });
      $$('[data-i]', p.el).forEach(function (b) {
        b.onclick = async function () {
          if (b.disabled) return;
          H.audio.sfx_('moneda'); p.cerrar();
          var r = H.comprar(s, d, n, f.ops[+b.dataset.i]);
          H.world.rebuild();
          await P.resultadoCompra(r, d, n);
          res();
        };
      });
      $('[data-x]', p.el).onclick = async function () {
        H.audio.sfx_('atras'); p.cerrar(); d.bloqueado = s.mes;
        await UI.decir('Renuncias por ahora. ' + nombreDueno(d) + ' te esperará hasta el mes que viene.');
        H.audio.tema('pueblo'); res();
      };
      var fs = p.focos(); if (fs[0]) p.enfocar(fs[0]);
      if (tuto('financiar')) setTimeout(function () { UI.decir(['El banco multiplica lo que ganas… y lo que pierdes.', 'Regla de oro: que la cuota anual no pase del 50% del EBITDA.'], { nombre: 'ALBERT 📞' }); }, 300);
    });
  };

  P.resultadoCompra = async function (r, d, n) {
    var s = S(), sec = H.sector(d.sec), est = '';
    for (var i = 0; i < 3; i++) est += '<span class="estrella' + (i < r.estrellas ? ' on' : '') + '" style="animation-delay:' + (0.3 + i * 0.35) + 's">★</span>';
    var veredicto = r.estrellas === 3 ? 'Compra de manual: buen precio y riesgos cubiertos.' : r.estrellas === 2 ? 'Buen precio, pero algún riesgo se quedó sin cubrir.' : 'Has pagado más de lo que vale. Toca arreglarla a fondo.';
    H.audio.jingle('victoria', 'pueblo');
    await new Promise(function (res) {
      var p = UI.panel('<div class="celebra compra"><div class="slot-edif"></div><h2>¡ES TUYA!</h2><p class="nombre">' + sec.e + ' ' + esc(d.nombre) + '</p><div class="estrellas">' + est + '</div>' +
        '<div class="desglose"><div><span>Has pagado</span><b>' + H.eur(n.precio) + '</b></div><div><span>Valor estimado por Albert</span><b class="' + (r.valorJusto >= n.precio ? 'verde' : 'rojo') + '">' + H.eur(r.valorJusto) + '</b></div>' +
        '<div><span>Confianza de Albert</span><b class="' + (r.albert >= 0 ? 'verde' : 'rojo') + '">' + (r.albert >= 0 ? '+' : '') + r.albert + ' ❤</b></div></div>' +
        '<p class="veredicto">' + esc(veredicto) + '</p><button class="btn grande" data-f>¡A POR ELLA!</button></div><canvas class="confeti"></canvas>', { clase: 'cel', cerrable: false, b: function () {} });
      $('.slot-edif', p.el).appendChild(UI.edificioCanvas(sec, true, 2.5));
      UI.confeti($('canvas.confeti', p.el));
      var b = $('button', p.el); p.enfocar(b);
      b.onclick = function () { H.audio.sfx_('ok'); p.cerrar(); res(); };
    });
    UI.xp(r.xp);
    if (tuto('primeraCompra')) await UI.decir(['¡Enhorabuena, socio! Tu empresa ya tiene nuestra bandera.', 'Entra en ella para usar PALANCAS: subir precios, contratar gerente, automatizar…', 'Cada mes la empresa genera caja. Y si sube su valor, sube TU PARTE ⭐ (el 25%).'], { nombre: 'ALBERT 📞' });
    await UI.tras();
  };

  // ================= TU EMPRESA =================
  P.empresa = async function (c) {
    H.audio.tema('calma');
    while (true) {
      var acc = await fichaEmpresa(c);
      if (!acc) break;
      if (acc === 'vender') { var vendida = await P.vender(c); if (vendida) break; continue; }
      var motivo = H.puedePalanca(S(), c, acc);
      if (motivo) { await UI.decir(motivo); continue; }
      var extra;
      if (acc === 'comercial') extra = await P.retoVentas();
      var antes = c.ebitda, multAntes = H.multSalida(S(), c);
      var r = H.palanca(S(), c, acc, extra);
      H.audio.sfx_(r.xp >= 20 ? 'bien' : 'mal');
      var cambio = c.ebitda - antes, dm = H.multSalida(S(), c) - multAntes;
      if (Math.abs(cambio) > 1) r.lineas.push('EBITDA: ' + H.eur(antes) + ' → ' + H.eur(c.ebitda));
      if (Math.abs(dm) > 0.01) r.lineas.push('Múltiplo de venta: ' + x1(multAntes) + ' → ' + x1(H.multSalida(S(), c)) + (dm > 0 ? ' 📈' : ' 📉'));
      await UI.decir(r.lineas);
      UI.aprender(r.aprende); UI.xp(r.xp);
      await UI.tras();
    }
    H.audio.tema('pueblo');
    await UI.tras();
  };
  function sparkline(hist) {
    if (hist.length < 2) hist = [hist[0], hist[0]];
    var mn = Math.min.apply(null, hist), mx = Math.max.apply(null, hist), rg = mx - mn || 1;
    var pts = hist.map(function (v, i) { return (i / (hist.length - 1) * 100).toFixed(1) + ',' + (28 - (v - mn) / rg * 24).toFixed(1); }).join(' ');
    var sube = hist[hist.length - 1] >= hist[0];
    return '<svg class="spark" viewBox="0 0 100 30" preserveAspectRatio="none"><polyline points="' + pts + '" fill="none" stroke="' + (sube ? '#22c55e' : '#ef4444') + '" stroke-width="2.5"/></svg>';
  }
  function medidor(lbl, ico, v, malo) {
    var cls = malo ? (v > 0.6 ? 'rojo' : v > 0.35 ? 'ambar' : 'verde') : (v > 0.6 ? 'verde' : v > 0.35 ? 'ambar' : 'rojo');
    return '<div class="med"><span class="l">' + ico + ' ' + lbl + '</span><span class="barra"><span class="' + cls + '" style="width:' + Math.round(v * 100) + '%"></span></span><span class="v">' + H.pct(v) + '</span></div>';
  }
  function fichaEmpresa(c) {
    var s = S(), sec = H.sector(c.sec), m = H.multSalida(s, c), valor = c.ebitda * m, deuda = H.deudaEmpresa(c), neto = valor - deuda;
    var detectados = c.riesgos.filter(function (r) { return r.mit; });
    return new Promise(function (res) {
      var html = '<div class="emp" style="--c1:' + sec.c[0] + ';--c2:' + sec.c[1] + '"><div class="ficha-top"><div class="slot-edif"></div></div>' +
        '<h2>' + sec.e + ' ' + esc(c.nombre) + '</h2><p class="sub">' + esc(sec.n) + ' · tuya desde ' + esc(H.fecha(c.mesCompra)) + '</p>' +
        '<div class="kpis"><div><small>EBITDA / AÑO</small><b>' + H.eur(c.ebitda) + '</b>' + sparkline(c.hist) + '</div><div><small>MÚLTIPLO</small><b>' + x1(m) + '</b><i>sector ' + x1(sec.mult) + '</i></div><div><small>VALOR</small><b class="oro">' + H.eur(valor) + '</b></div></div>' +
        '<div class="meds">' + medidor('Depende del dueño', '👑', c.dep, true) + medidor('Cliente más grande', '🎯', c.conc, true) + medidor('Recurrente', '🔁', c.recur, false) +
        '<div class="med"><span class="l">📊 Cuadro de mando</span><span class="pips">' + [0, 1, 2].map(function (k) { return '<i class="' + (k < c.sistemas ? 'on' : '') + '"></i>'; }).join('') + '</span><span class="v">' + (c.gerente ? '🧑‍💼 gerente ✓' : '') + '</span></div></div>' +
        (detectados.length ? '<div class="riesgos">' + detectados.map(function (r) { var B = H.BANDERAS[r.id]; return '<span>⚠️ ' + B.e + ' ' + esc(B.n) + '</span>'; }).join('') + '</div>' : '') +
        '<div class="desglose mini"><div><span>Invertido por el fondo</span><b>' + H.eur(c.invertido) + '</b></div><div><span>Deudas (banco, vendedor, earn-out)</span><b>' + H.eur(deuda) + '</b></div><div><span>Valor neto hoy</span><b class="' + (neto >= c.invertido ? 'verde' : 'rojo') + '">' + H.eur(neto) + '</b></div></div>' +
        '<h3 class="sec">PALANCAS · te quedan ' + s.energia + ' ⚡</h3><div class="palancas">' +
        Object.keys(H.PALANCAS).map(function (k) {
          var P2 = H.PALANCAS[k], no = H.puedePalanca(s, c, k);
          return '<button class="palanca" data-f data-p="' + k + '"' + (no ? ' disabled' : '') + '><span class="e">' + P2.e + '</span><b>' + esc(P2.n) + '</b><small>' + esc(no || P2.d) + '</small><i>⚡1</i></button>';
        }).join('') + '</div><button class="btn" data-f data-x>SALIR</button></div>';
      var p = UI.panel(html, { clase: 'p-emp', b: function (api) { H.audio.sfx_('atras'); api.cerrar(); res(null); } });
      $('.slot-edif', p.el).appendChild(UI.edificioCanvas(sec, true, 2));
      $$('[data-p]', p.el).forEach(function (b) { b.onclick = function () { if (b.disabled) return; H.audio.sfx_('ok'); p.cerrar(); res(b.dataset.p); }; });
      $('[data-x]', p.el).onclick = function () { H.audio.sfx_('atras'); p.cerrar(); res(null); };
      var fs = p.focos(); if (fs[0]) p.enfocar(fs[0]);
      if (tuto('empresa')) setTimeout(function () { UI.decir(['Esta es tu empresa. Cada palanca gasta ⚡ de tu tiempo.', 'El truco del oficio: que funcione SIN el dueño (👑 abajo), con clientes repartidos (🎯 abajo) y cuotas (🔁 arriba). Eso sube el MÚLTIPLO.'], { nombre: 'ALBERT 📞' }); }, 300);
    });
  }

  // Mini combate de ventas (el punto débil): una objeción, tres respuestas.
  P.retoVentas = function () {
    var v = H.u.pick(H.VENTAS), ops = H.u.shuffle(v.ops.slice());
    var look = H.genLook(H.u.ri(35, 60));
    return new Promise(function (res) {
      var p = UI.panel('<div class="ventas"><div class="cab"><h2>📞 VISITA COMERCIAL</h2><p>Un cliente potencial. Responde bien y entra.</p></div><div class="cliente"><div class="slot"></div><div class="bocadillo">' + esc(v.o) + '</div></div>' +
        '<div class="resp">' + ops.map(function (o, i) { return '<button class="tarjeta" data-f data-i="' + i + '">' + esc(o.t) + '</button>'; }).join('') + '</div></div>', { clase: 'p-ventas', cerrable: false, b: function () {} });
      $('.slot', p.el).appendChild(UI.sprite(look, 'down', 5, 'respira'));
      $$('[data-i]', p.el).forEach(function (b) {
        b.onclick = async function () {
          var o = ops[+b.dataset.i];
          $$('[data-i]', p.el).forEach(function (x, k) { x.disabled = true; x.classList.add(ops[k].ok ? 'correcta' : 'incorrecta'); });
          H.audio.sfx_(o.ok ? 'bien' : 'mal');
          await UI.dormir(400);
          await UI.decir([(o.ok ? '✅ ¡Bien! ' : '❌ Mal. ') + o.por].concat(o.ok ? [] : ['La buena era: «' + ops.filter(function (x) { return x.ok; })[0].t + '»']));
          UI.aprender('preguntar');
          p.cerrar(); res(o.ok);
        };
      });
      p.enfocar(p.focos()[0]);
    });
  };

  P.vender = function (c) {
    var s = S(), ofs = H.ofertasVenta(s, c);
    if (s.mes - c.mesCompra < 3) return UI.decir('Nadie compra una empresa que acabas de comprar. Espera al menos 3 meses.').then(function () { return false; });
    return new Promise(function (res) {
      var html = '<div class="cab"><h2>🏁 OFERTAS POR ' + esc(c.nombre.toUpperCase()) + '</h2><p>Invertiste ' + H.eur(c.invertido) + '. Vender gasta ⚡1.</p></div><div class="lista">' +
        ofs.map(function (o, i) {
          var g = o.neto - c.invertido;
          return '<button class="tarjeta oferta" data-f data-i="' + i + '"' + (s.energia <= 0 ? ' disabled' : '') + '><span class="ico">' + o.e + '</span><span class="cuerpo"><b>' + esc(o.n) + '</b><small>' + esc(o.d) + '</small>' +
            '<span class="mini"><span><b>' + x1(o.m) + '</b> EBITDA</span><span>Valor <b>' + H.eur(o.valor) + '</b></span></span>' +
            '<span class="mini"><span>Ganancia <b class="' + (g >= 0 ? 'verde' : 'rojo') + '">' + H.eur(g) + '</b></span><span>⭐ Tu 25% <b class="oro">' + H.eur(Math.max(0, g * 0.25)) + '</b></span></span></span></button>';
        }).join('') + '</div><button class="btn" data-f data-x>NO VENDER</button>';
      var p = UI.panel(html, { clase: 'p-vender', b: function (api) { api.cerrar(); res(false); } });
      $$('[data-i]', p.el).forEach(function (b) {
        b.onclick = async function () {
          if (b.disabled) return;
          var o = ofs[+b.dataset.i];
          if (!(await UI.si('¿Vender a ' + o.n + ' por ' + H.eur(o.valor) + '?'))) return;
          p.cerrar();
          var r = H.vender(s, c, o);
          H.world.rebuild();
          H.audio.jingle('victoria', 'pueblo'); H.audio.sfx_('moneda');
          await UI.celebrar('<div class="cel-ico">💰</div><h2>¡VENDIDA!</h2><p>' + esc(c.nombre) + '</p><p>Ganancia del fondo: <b class="' + (r.ganancia >= 0 ? 'verde' : 'rojo') + '">' + H.eur(r.ganancia) + '</b></p><p class="oro grande">⭐ Tu parte: ' + H.eur(r.tuya) + '</p>');
          UI.xp(r.xp);
          res(true);
        };
      });
      $('[data-x]', p.el).onclick = function () { H.audio.sfx_('atras'); p.cerrar(); res(false); };
      p.enfocar(p.focos()[0]);
    });
  };

  // ================= TU OFICINA, CARTERA, MES =================
  P.oficina = async function () {
    H.audio.tema('calma');
    while (true) {
      var s = S();
      var o = await UI.elegir([{ t: 'Cartera', ico: '💼' }, { t: 'Cerrar el mes', ico: '🌙', sub: 'Te quedan ' + s.energia + ' ⚡' }, { t: 'Misiones', ico: '📋' }, { t: 'Opciones', ico: '⚙️' }, { t: 'Salir', ico: '🚪' }],
        { pregunta: 'TU OFICINA. Huele a café y a Excel.', titulo: 'OFICINA' });
      if (o === 0) await P.cartera();
      else if (o === 1) { var cerrado = await P.cerrarMes(); if (cerrado) break; }
      else if (o === 2) await P.misiones();
      else if (o === 3) await P.opciones();
      else break;
    }
    H.audio.tema('pueblo');
  };

  P.cartera = function () {
    var s = S(); H.actualizarParte(s);
    var nav = H.nav(s);
    return new Promise(function (res) {
      var html = '<div class="cab"><h2>💼 CARTERA DEL HOLDING</h2><p>' + esc(H.fecha(s.mes)) + '</p></div>' +
        '<div class="gordo"><small>⭐ TU PARTE (25%)</small><b class="oro cnt-parte">0 €</b><span>Realizado: ' + H.eur(s.realizado * 0.25) + '</span></div>' +
        '<div class="desglose"><div><span>Valor del holding</span><b>' + H.eur(nav) + '</b></div><div><span>Capital de Albert</span><b>' + H.eur(s.capital) + '</b></div><div><span>Caja del fondo</span><b>' + H.eur(s.caja) + '</b></div>' +
        '<div><span>Confianza de Albert</span><b>' + s.albert + ' ❤</b></div></div><div class="lista">' +
        (s.empresas.length ? s.empresas.map(function (c) {
          var sec = H.sector(c.sec), m = H.multSalida(s, c);
          return '<button class="tarjeta deal" data-f data-id="' + c.id + '" style="--c1:' + sec.c[0] + ';--c2:' + sec.c[1] + '"><span class="ico">' + sec.e + '</span><span class="cuerpo"><b>' + esc(c.nombre) + '</b><small>EBITDA ' + H.eur(c.ebitda) + ' · ' + x1(m) + '</small><span class="mini"><span>Valor <b>' + H.eur(c.ebitda * m) + '</b></span></span></span></button>';
        }).join('') : '<p class="vacio">Aún no tienes empresas. Habla con LA BRÓKER en la plaza.</p>') +
        '</div><button class="btn" data-f data-x>CERRAR</button>';
      var p = UI.panel(html, { clase: 'p-cartera', alCerrar: res });
      UI.contar($('.cnt-parte', p.el), 0, s.tuParte, 900);
      $$('[data-id]', p.el).forEach(function (b) { b.onclick = async function () { var c = empresaPorId(b.dataset.id); p.cerrar(); await P.empresa(c); H.audio.tema('calma'); }; });
      $('[data-x]', p.el).onclick = function () { H.audio.sfx_('atras'); p.cerrar(); };
      p.enfocar(p.focos()[0]);
    });
  };

  P.cerrarMes = async function () {
    var s = S();
    if (s.energia > 0 && !(await UI.si('Aún te quedan ' + s.energia + ' ⚡. ¿Cerrar el mes igualmente?'))) return false;
    H.audio.tema('calma');
    for (var k = 0; k <= 10; k++) { H.world.noche = k * 0.07; await UI.dormir(40); }
    var parteAntes = s.tuParte, cajaAntes = s.caja;
    var rep = H.cerrarMes(s);
    await new Promise(function (res) {
      var html = '<div class="cab"><h2>🌙 CIERRE DE ' + esc(rep.mes.toUpperCase()) + '</h2></div><div class="informe">' +
        (rep.lineas.length ? rep.lineas.map(function (l) { return '<div class="linea"><span>' + H.sector(l.sec).e + ' ' + esc(l.nombre) + '</span><b class="' + (l.flujo >= 0 ? 'verde' : 'rojo') + '">' + (l.flujo >= 0 ? '+' : '') + H.eur(l.flujo) + '</b></div>'; }).join('') : '<p class="vacio">Sin empresas todavía: este mes no entra caja.</p>') +
        '</div><div class="desglose"><div><span>Caja del fondo</span><b class="cnt-caja"></b></div></div>' +
        '<div class="gordo"><small>⭐ TU PARTE (25%)</small><b class="oro cnt-parte"></b><span class="' + (rep.parteDespues >= parteAntes ? 'verde' : 'rojo') + '">' + (rep.parteDespues >= parteAntes ? '▲ +' : '▼ ') + H.eur(rep.parteDespues - parteAntes) + '</span></div>' +
        (rep.avisos.length ? '<div class="avisos-mes">' + rep.avisos.map(function (a) { return '<p>' + esc(a) + '</p>'; }).join('') + '</div>' : '') +
        '<button class="btn grande" data-f>SIGUIENTE ▶</button>';
      var p = UI.panel(html, { clase: 'p-mes', cerrable: false, b: function () {} });
      UI.contar($('.cnt-caja', p.el), cajaAntes, s.caja, 900);
      UI.contar($('.cnt-parte', p.el), parteAntes, rep.parteDespues, 1200);
      if (rep.lineas.length) H.audio.sfx_('moneda');
      var b = $('button', p.el); p.enfocar(b);
      b.onclick = function () { H.audio.sfx_('ok'); p.cerrar(); res(); };
    });
    if (s.evento) await P.evento();
    for (var j = 10; j >= 0; j--) { H.world.noche = j * 0.07; await UI.dormir(40); }
    H.world.rebuild();
    UI.aviso('☀️ <b>' + esc(H.fecha(s.mes)) + '</b> · ⚡ ' + s.energia + ' de tiempo');
    if (rep.nuevos) await UI.decir('¡Hay ' + rep.nuevos + (rep.nuevos === 1 ? ' empresa nueva' : ' empresas nuevas') + ' en venta! Busca los ❗ en el mapa.', { nombre: 'LA BRÓKER 📱' });
    if (!H.retoHecho(s)) UI.aviso('👁️ El OJO CLÍNICO de hoy te espera', 'nueva');
    UI.xp(20);
    await UI.tras();
    return true;
  };

  P.evento = function () {
    var s = S(), e = H.eventoActual(s);
    if (!e || !e.ev) { s.evento = null; return Promise.resolve(); }
    H.audio.sfx_('combate');
    return new Promise(function (res) {
      var p = UI.panel('<div class="evento"><div class="ev-ico">' + e.ev.e + '</div><h2>¡IMPREVISTO!</h2>' + (e.c ? '<p class="sub">' + H.sector(e.c.sec).e + ' ' + esc(e.c.nombre) + '</p>' : '') +
        '<p class="ev-txt">' + esc(e.ev.t) + '</p>' + (e.mit ? '<p class="nota">📊 Lo tenías detectado: el golpe será la mitad.</p>' : '') +
        '<div class="resp">' + e.ev.ops.map(function (o, i) { return '<button class="tarjeta" data-f data-i="' + i + '">' + esc(o.t) + '</button>'; }).join('') + '</div></div>', { clase: 'p-evento', cerrable: false, b: function () {} });
      $$('[data-i]', p.el).forEach(function (b) {
        b.onclick = async function () {
          H.audio.sfx_('ok'); p.cerrar();
          var r = H.resolverEvento(s, +b.dataset.i);
          await UI.decir(r.por);
          UI.xp(r.xp);
          res();
        };
      });
      p.enfocar(p.focos()[0]);
    });
  };

  // ================= GIMNASIO: OJO CLÍNICO =================
  P.gimnasio = async function () {
    var s = S(), nom = { nombre: 'LA AUDITORA' };
    H.audio.tema('calma');
    if (tuto('gimnasio')) await UI.decir(['Bienvenido al OJO CLÍNICO. Soy LA AUDITORA.', 'Cada día te enseño 6 documentos rápidos. Tú decides: ¿bandera roja o todo limpio?', 'Repito más lo que más fallas. Así se entrena el ojo. Y si vienes cada día, tu racha 🔥 crece.'], nom);
    if (H.retoHecho(s)) { await UI.decir(['Ya has entrenado hoy. Racha: 🔥 ' + s.racha + (s.racha === 1 ? ' día' : ' días') + '.', 'Vuelve mañana. El ojo se entrena con constancia, no con atracones.'], nom); H.audio.tema('pueblo'); return; }
    var ok = await UI.si('¿Empezamos el entrenamiento de hoy?', nom);
    if (!ok) { H.audio.tema('pueblo'); return; }
    H.audio.tema('reto');
    var r = await P.inspeccion(H.pantallasReto(s, 6), { titulo: '👁️ OJO CLÍNICO', tiempo: 9 });
    var bonus = H.completarReto(s, r.aciertos, r.resultados.length);
    H.audio.jingle('victoria', 'pueblo');
    await UI.celebrar('<div class="cel-ico fuego">🔥</div><h2>RACHA: ' + s.racha + (s.racha === 1 ? ' DÍA' : ' DÍAS') + '</h2><p>' + r.aciertos + ' de ' + r.resultados.length + ' aciertos' + (r.combo > 1 ? ' · combo ×' + r.combo : '') + '</p>' +
      (r.aciertos === r.resultados.length ? '<p class="oro">¡PERFECTO! +100 XP extra</p>' : '') + '<p class="oro">+' + (bonus + r.xp) + ' XP</p>');
    UI.xp(bonus + r.xp);
    await UI.tras();
  };

  // ================= ALBERT =================
  P.albert = async function () {
    var s = S(), nom = { nombre: 'ALBERT' };
    H.audio.tema('calma');
    await new Promise(function (res) {
      var p = UI.panel('<div class="albert"><div class="cab"><h2>💼 FONDO ALBERT</h2><p>Planta 12. Vistas a todo Villa Pyme.</p></div><div class="slot"></div>' +
        '<div class="corazon"><small>CONFIANZA DE ALBERT</small><div class="hp"><span class="fill ' + (s.albert >= 60 ? 'verde' : s.albert >= 35 ? 'ambar' : 'rojo') + '" style="width:' + s.albert + '%"></span></div><b>' + s.albert + ' ❤</b></div>' +
        '<div class="desglose"><div><span>Capital comprometido</span><b>' + H.eur(s.capital) + '</b></div><div><span>Caja disponible</span><b>' + H.eur(s.caja) + '</b></div><div><span>Reparto</span><b>75% Albert · 25% tú</b></div></div>' +
        '<p class="nota">Con 80 ❤ o más, Albert amplía el fondo en 1 M€ (una vez por nivel).</p><button class="btn grande" data-f>HABLAR</button></div>', { clase: 'p-albert', b: function (api) { api.cerrar(); res(); } });
      $('.slot', p.el).appendChild(UI.sprite(H.LOOK_ALBERT, 'down', 6, 'respira'));
      var b = $('button', p.el); p.enfocar(b);
      b.onclick = function () { H.audio.sfx_('ok'); p.cerrar(); res(); };
    });
    var l;
    if (s.albert < 35) l = ['Te voy a ser sincero: estoy preocupado.', 'Compra bien, cubre los riesgos y no me escondas las malas noticias. Así se recupera mi confianza.'];
    else if (s.albert >= 75) l = ['Socio, lo estás haciendo muy bien.', 'Sigue así: compras con estrellas, empresas que funcionan sin dueño… y yo pongo más gasolina.'];
    else l = ['Vamos bien, pero esto es una maratón.', H.u.pick(['Recuerda: se gana al COMPRAR. Lo que pagas de más no lo recuperas nunca.', 'Una empresa que depende de su dueño vale menos. Arregla eso y el múltiplo sube solo.', 'Sin sorpresas, por favor. Las malas noticias, rápido y por escrito.'])];
    await UI.decir(l, nom);
    UI.aprender('socio_capital');
    H.audio.tema('pueblo');
    await UI.tras();
  };

  // ================= DEALDEX =================
  P.dealdex = function () {
    var s = S(), ids = Object.keys(H.CODEX), tengo = ids.filter(function (k) { return s.codex[k]; }).length;
    H.audio.tema('calma');
    return new Promise(function (res) {
      var html = '<div class="cab"><h2>📚 DEALDEX</h2><p>' + tengo + ' / ' + ids.length + ' cartas · las estrellas miden tu dominio</p><div class="xpbar grande"><span style="width:' + Math.round(tengo / ids.length * 100) + '%"></span></div></div><div class="dex">' +
        ids.map(function (k, i) {
          var c = H.CODEX[k], t = s.codex[k], st = H.estrellasDominio(s, k);
          return '<button class="carta r' + c.rar + (t ? '' : ' bloq') + '" data-f data-k="' + k + '"><span class="num">#' + String(i + 1).padStart(2, '0') + '</span><span class="e">' + (t ? c.e : '❓') + '</span><b>' + (t ? esc(c.n) : '???') + '</b><span class="st">' + (t ? '★★★'.slice(0, st) + '☆☆☆'.slice(0, 3 - st) : '') + '</span></button>';
        }).join('') + '</div><button class="btn" data-f data-x>CERRAR</button>';
      var p = UI.panel(html, { clase: 'p-dex', alCerrar: function () { H.audio.tema('pueblo'); res(); } });
      $$('[data-k]', p.el).forEach(function (b) {
        b.onclick = async function () {
          var k = b.dataset.k, c = H.CODEX[k];
          if (!s.codex[k]) { H.audio.sfx_('choque'); UI.aviso('🔒 Aún no la has descubierto. Analiza, negocia y habla con los vecinos.'); return; }
          H.audio.sfx_('nueva');
          await new Promise(function (r2) {
            var q = UI.panel('<div class="carta-grande r' + c.rar + '"><span class="rar">' + ['', 'COMÚN', 'RARA', 'ÉPICA', 'LEGENDARIA'][c.rar] + '</span><div class="e">' + c.e + '</div><h2>' + esc(c.n) + '</h2><p>' + esc(c.d) + '</p><p class="regla">💡 ' + esc(c.r) + '</p><button class="btn" data-f>VOLVER</button></div>', { clase: 'p-carta', alCerrar: r2 });
            var bb = $('button', q.el); q.enfocar(bb); bb.onclick = function () { H.audio.sfx_('atras'); q.cerrar(); };
          });
        };
      });
      $('[data-x]', p.el).onclick = function () { H.audio.sfx_('atras'); p.cerrar(); };
      p.enfocar(p.focos()[0]);
    });
  };

  P.misiones = function () {
    var s = S();
    return new Promise(function (res) {
      var p = UI.panel('<div class="cab"><h2>📋 MISIONES</h2></div><div class="misiones">' + H.MISIONES.map(function (m) {
        var hecha = s.misiones[m.id], actual = H.misionActual(s) === m;
        return '<div class="mis' + (hecha ? ' hecha' : actual ? ' actual' : '') + '"><span>' + (hecha ? '✅' : actual ? '▶' : '⬜') + '</span><span><b>' + esc(m.t) + '</b>' + (actual ? '<small>' + esc(m.pista) + '</small>' : '') + '</span><i>' + m.xp + ' XP</i></div>';
      }).join('') + '</div><button class="btn" data-f>CERRAR</button>', { clase: 'p-mis', alCerrar: res });
      var b = $('button', p.el); p.enfocar(b); b.onclick = function () { H.audio.sfx_('atras'); p.cerrar(); };
    });
  };

  // Cargar la carpeta de canciones (MIDI o audio). Se quedan solo en este móvil.
  P.musica = function () {
    return new Promise(function (res) {
      function pintar() {
        var r = H.audio.resumenPropias(), hay = H.audio.hayPropias();
        return '<div class="cab"><h2>🎧 TU MÚSICA</h2><p>Elige tus MIDIs (o MP3). Se guardan solo en este móvil y suenan con el chip Game Boy.</p></div>' +
          '<label class="tarjeta grande-c" data-f>📂 ELEGIR CANCIONES<small>Puedes seleccionar la carpeta entera de golpe</small><input type="file" multiple hidden></label>' +
          '<div class="slots">' + Object.keys(H.audio.SLOTS).map(function (k) {
            var l = r[k];
            return '<div class="slotm"><b>' + H.audio.SLOTS[k] + '</b><small>' + (l.length ? esc(l.slice(0, 4).join(' · ')) + (l.length > 4 ? ' +' + (l.length - 4) : '') + (l.length > 1 && k === 'pueblo' ? ' — rotan cada mes' : '') : '—') + '</small></div>';
          }).join('') + '</div>' +
          (hay ? '<button class="tarjeta" data-f data-o="on">Sonar mi música: <b>' + (H.audio.usandoPropias() ? 'SÍ' : 'NO') + '</b></button><button class="tarjeta peligro" data-f data-o="borrar">🗑️ Quitar mis canciones</button>' : '<p class="nota">Sin canciones cargadas el juego va solo con efectos de sonido.</p>') +
          '<button class="btn" data-f data-x>LISTO</button>';
      }
      var p = UI.panel(pintar(), { clase: 'p-opts', alCerrar: res });
      function enlazar() {
        var inp = $('input[type=file]', p.el);
        inp.onchange = function () {
          if (!inp.files || !inp.files.length) return;
          UI.aviso('⏳ Leyendo ' + inp.files.length + ' archivos…');
          H.audio.cargarArchivos(inp.files, function (asig, n) {
            var tot = Object.keys(asig).reduce(function (a, k) { return a + asig[k].length; }, 0);
            UI.aviso(tot ? '🎧 ' + tot + ' canciones listas' : '⚠️ No he podido leer esos archivos', tot ? 'nueva' : '');
            S().musicaPropia = true; H.guardar(S());
            H.audio.activarPropias(true);
            refrescar();
          });
        };
        $$('[data-o]', p.el).forEach(function (b) {
          b.onclick = function () {
            if (b.dataset.o === 'on') { H.audio.activarPropias(!H.audio.usandoPropias()); S().musicaPropia = H.audio.usandoPropias(); }
            else if (b.dataset.o === 'borrar') { H.audio.borrarPropia(function () { H.audio.activarPropias(false); S().musicaPropia = false; H.guardar(S()); refrescar(); }); return; }
            H.guardar(S()); H.audio.sfx_('ok'); refrescar();
          };
        });
        $('[data-x]', p.el).onclick = function () { H.audio.sfx_('atras'); p.cerrar(); };
      }
      function refrescar() { p.el.innerHTML = pintar(); enlazar(); p.enfocar(p.focos()[0]); }
      enlazar(); p.enfocar(p.focos()[0]);
    });
  };

  P.opciones = function () {
    var s = S();
    return new Promise(function (res) {
      function pintar() {
        return '<div class="cab"><h2>⚙️ OPCIONES</h2></div><div class="opts">' +
          '<button class="tarjeta" data-f data-o="tumusica">🎧 Tu música <b>' + (H.audio.hayPropias() ? '✓' : '') + '</b></button>' +
          '<button class="tarjeta" data-f data-o="musica">🎵 Música: <b>' + (s.musica ? 'SÍ' : 'NO') + '</b></button>' +
          '<button class="tarjeta" data-f data-o="sfx">🔊 Efectos: <b>' + (s.sfx ? 'SÍ' : 'NO') + '</b></button>' +
          '<button class="tarjeta peligro" data-f data-o="reset">⚠️ Empezar partida nueva</button>' +
          '<p class="nota">HOLDING v' + H.VERSION + '</p></div><button class="btn" data-f data-x>CERRAR</button>';
      }
      var p = UI.panel(pintar(), { clase: 'p-opts', alCerrar: res });
      function enlazar() {
        $$('[data-o]', p.el).forEach(function (b) {
          b.onclick = async function () {
            var o = b.dataset.o;
            if (o === 'tumusica') { await P.musica(); refrescar(); return; }
            if (o === 'musica') { s.musica = !s.musica; H.audio.setMusica(s.musica); }
            else if (o === 'sfx') { s.sfx = !s.sfx; H.audio.setSfx(s.sfx); }
            else if (o === 'reset') {
              if (await UI.si('¿Borrar TODA la partida y empezar de cero?') && await UI.si('¿Seguro seguro? No se puede deshacer.')) { H.borrar(); location.reload(); return; }
            }
            H.guardar(s); H.audio.sfx_('ok'); refrescar();
          };
        });
        $('[data-x]', p.el).onclick = function () { H.audio.sfx_('atras'); p.cerrar(); };
      }
      function refrescar() { p.el.innerHTML = pintar(); enlazar(); p.enfocar(p.focos()[0]); }
      enlazar(); p.enfocar(p.focos()[0]);
    });
  };

  // ================= MENÚ START =================
  P.menuStart = async function () {
    H.audio.sfx_('ok');
    var s = S();
    var o = await UI.elegir([{ t: 'Cartera', ico: '💼' }, { t: 'Dealdex', ico: '📚' }, { t: 'Misiones', ico: '📋' }, { t: 'Cerrar el mes', ico: '🌙', sub: s.energia + ' ⚡ por gastar' }, { t: 'Opciones', ico: '⚙️' }, { t: 'Volver', ico: '✖' }], { titulo: s.nombre });
    if (o === 0) await P.cartera();
    else if (o === 1) await P.dealdex();
    else if (o === 2) await P.misiones();
    else if (o === 3) await P.cerrarMes();
    else if (o === 4) await P.opciones();
    H.audio.tema('pueblo');
    await UI.tras();
  };

  // ================= TÍTULO E INTRO =================
  P.titulo = function (hayPartida) {
    return new Promise(function (res) {
      var p = UI.panel('<div class="titulo"><div class="estrellas-cielo"></div><div class="logo"><span>HOLDING</span><small>VILLA PYME</small></div>' +
        '<p class="lema">Compra pymes · Arréglalas · Véndelas</p><div class="skyline"></div><div class="slot"></div>' +
        '<div class="botones-t">' + (hayPartida ? '<button class="btn grande" data-f data-t="seguir">▶ CONTINUAR</button><button class="btn" data-f data-t="nueva">NUEVA PARTIDA</button>' : '<button class="btn grande parpadea" data-f data-t="nueva">PULSA A PARA EMPEZAR</button>') +
        '<button class="btn musica-t" data-f data-t="musica">🎧 ' + (H.audio.hayPropias() ? 'TU MÚSICA ✓' : 'CARGAR TUS CANCIONES') + '</button></div>' +
        '<p class="cred">Teclado: flechas · Z = A · X = B · M = START · v' + H.VERSION + '</p></div>', { clase: 'p-titulo', cerrable: false, b: function () {} });
      $('.slot', p.el).appendChild(UI.sprite(H.LOOK_JUGADOR, 'down', 5, 'respira'));
      $$('[data-t]', p.el).forEach(function (b) {
        b.onclick = async function () {
          H.audio.sfx_('ok');
          if (b.dataset.t === 'musica') { await P.musica(); b.textContent = '🎧 ' + (H.audio.hayPropias() ? 'TU MÚSICA ✓' : 'CARGAR TUS CANCIONES'); H.audio.tema('calma'); return; }
          if (b.dataset.t === 'nueva' && hayPartida && !(await UI.si('Hay una partida guardada. ¿Empezar otra y borrarla?'))) return;
          p.cerrar(); res(b.dataset.t);
        };
      });
      p.enfocar(p.focos()[0]);
    });
  };

  P.intro = async function () {
    H.audio.tema('calma');
    var p = UI.panel('<div class="intro"><div class="slot"></div></div>', { clase: 'p-intro', cerrable: false, b: function () {} });
    $('.slot', p.el).appendChild(UI.sprite(H.LOOK_ALBERT, 'down', 7, 'respira'));
    var nom = { nombre: 'ALBERT' };
    await UI.decir(['¡Hola! ¡Bienvenido al mundo de las PYMES!', 'Me llamo ALBERT. La gente me llama… el SOCIO CAPITALISTA.',
      'Este mundo está lleno de empresas. Algunas son joyas. Otras, trampas con buena cara.',
      'Yo pongo el dinero: 1,5 millones para empezar. Tú pones la operación.',
      'Repartimos 75/25. Tu 25% sale de todo lo que hagamos crecer.',
      'Tu trabajo: encontrar empresas, destapar sus banderas rojas, negociar con sus dueños… y hacer que valgan más.',
      'Pero primero… ¿cómo te llamas?'], nom);
    var nombre = await pedirNombre();
    H.estado = H.nuevo(nombre);
    H.estado.tuto = {};
    H.estado.musica = H.audio.musica; H.estado.sfx = H.audio.sfx;
    H.world.colocar(); H.world.rebuild();
    await UI.decir(['¡' + nombre + '! Tu aventura en VILLA PYME empieza ahora.', 'Sal a la plaza y habla con LA BRÓKER: tiene tu primer deal.', 'Muévete con la cruceta. A para hablar y entrar. Mantén B para correr. START para el menú.'], nom);
    p.cerrar();
    H.audio.tema('pueblo');
    H.guardar(H.estado);
    await UI.tras();
  };
  function pedirNombre() {
    return new Promise(function (res) {
      var p = UI.panel('<div class="nombre-in"><h2>TU NOMBRE</h2><input maxlength="10" value="SERGI" autocomplete="off" autocapitalize="characters"><button class="btn grande" data-f>OK</button></div>', { clase: 'p-nombre', cerrable: false, b: function () {} });
      var inp = $('input', p.el), b = $('button', p.el);
      function ok() { var v = (inp.value || '').trim().toUpperCase().slice(0, 10) || 'SERGI'; inp.blur(); H.audio.sfx_('ok'); p.cerrar(); res(v); }
      b.onclick = ok; inp.onkeydown = function (e) { if (e.key === 'Enter') ok(); };
      p.enfocar(b);
    });
  }

  // ================= ARRANQUE =================
  P.arrancar = async function () {
    try { await Promise.race([Promise.all([document.fonts.load('8px "Press Start 2P"'), document.fonts.load('16px "Pixelify Sans"')]), UI.dormir(2500)]); } catch (e) {}
    UI.initMando();
    var guardado = H.cargar();
    H.estado = guardado || H.nuevo('SERGI');
    H.estado.tuto = H.estado.tuto || {};
    H.audio.setMusica(H.estado.musica !== false); H.audio.setSfx(H.estado.sfx !== false);
    H.world.init($('#mundo'));
    UI.hud();
    var t0 = performance.now();
    (function bucle(t) {
      var dt = Math.min(0.05, (t - t0) / 1000); t0 = t;
      H.world.update(dt); H.world.render(t);
      requestAnimationFrame(bucle);
    })(t0);
    await new Promise(function (r0) { H.audio.cargarPropias(function () { r0(); }); setTimeout(r0, 3000); });
    if (H.estado.musicaPropia === false) H.audio.activarPropias(false);
    H.audio.tema('calma');
    var r = await P.titulo(!!guardado);
    if (r === 'nueva') { H.borrar(); await P.intro(); }
    else { H.audio.tema('pueblo'); await UI.tras(); UI.aviso('📅 <b>' + esc(H.fecha(H.estado.mes)) + '</b> · ⚡ ' + H.estado.energia); }
  };
  window.addEventListener('load', function () { P.arrancar(); });
})();

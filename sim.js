global.window = {}; global.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
const fs = require('fs');
(0,eval)(fs.readFileSync(__dirname + '/js/data.js', 'utf8')); (0,eval)(fs.readFileSync(__dirname + '/js/engine.js', 'utf8'));
const HH = window.H;
function negociar(estilo, d, s) {
  const n = HH.nego(s, d); let r;
  for (let t = 0; t < 20; t++) {
    let tipo, arg;
    if (estilo === 'perfecto') {
      const um = HH.umbralFirma(d, n);
      const q = HH.MOTIVOS[d.motivo].quiere.find(e => !n.est.includes(e) && e !== 'rapido');
      const flag = d.banderas.find(b => b.vista && !b.jugada && !HH.BANDERAS[b.id].fatal);
      const est = d.banderas.filter(b => b.vista && !HH.cubierta(b.id, n.est) && !HH.BANDERAS[b.id].arregla.includes('precio')).map(b => HH.BANDERAS[b.id].arregla[0]).find(e => e && !n.est.includes(e) && !HH.MOTIVOS[d.motivo].odia.includes(e));
      if (d.banderas.some(b => b.vista && HH.BANDERAS[b.id].fatal)) tipo = 'irse';
      else if (!d.motivoSabido) tipo = 'motivo';
      else if (n.historia === 0) tipo = 'historia';
      else if (q && n.est.length < 2) { tipo = 'estructura'; arg = q; }
      else if (flag && n.conf >= 40) { tipo = 'bandera'; arg = flag.id; }
      else if (est && n.pac > 2) { tipo = 'estructura'; arg = est; }
      else if (n.conf >= 66 && n.ancla < 2 && n.pac > 2) tipo = 'ancla';
      else if (n.conf >= um) tipo = 'cerrar';
      else if (q) { tipo = 'estructura'; arg = q; }
      else tipo = 'historia';
    } else {
      const ops = ['motivo', 'historia', 'preocupa', 'estructura', 'ancla', 'cerrar', 'bandera'];
      tipo = ops[Math.floor(Math.random() * ops.length)];
      if (tipo === 'estructura') { const ks = Object.keys(HH.ESTRUCTURAS).filter(k => !n.est.includes(k)); arg = ks[Math.floor(Math.random() * ks.length)]; }
      if (tipo === 'bandera') { const f = d.banderas.find(b => b.vista && !b.jugada); if (!f) tipo = 'historia'; else arg = f.id; }
    }
    r = HH.jugar(s, d, n, tipo, arg);
    if (r.fin) return { fin: r.fin, n };
  }
  return { fin: 'timeout', n };
}
function prueba(estilo, N = 3000) {
  let compras = 0, desc = 0, est = [0, 0, 0, 0];
  for (let i = 0; i < N; i++) {
    const s = HH.nuevo('X'); s.nivel = 1 + (i % 4);
    const d = HH.genDeal(s, 0);
    if (estilo === 'perfecto') { d.analizado = true; d.banderas.forEach(b => { if (Math.random() < 0.8) b.vista = true; }); }
    const r = negociar(estilo, d, s);
    if (r.fin === 'compra') {
      compras++; desc += 1 - r.n.precio / d.pide;
      const op = HH.financiacion(s, d, r.n).ops.find(o => o.ok) || { caja: 0, banco: 0 };
      const c = HH.comprar(s, d, r.n, op); est[c.estrellas]++;
    }
  }
  console.log(estilo.padEnd(9), 'cierra', (compras / N * 100).toFixed(0) + '%', '· descuento medio', (desc / Math.max(1, compras) * 100).toFixed(1) + '%', '· estrellas 1/2/3:', est.slice(1).map(x => (x / Math.max(1, compras) * 100).toFixed(0) + '%').join(' / '));
}
prueba('perfecto'); prueba('azar');

// Partida de 24 meses jugando razonable
function partida() {
  const s = HH.nuevo('X');
  for (let m = 0; m < 24; m++) {
    for (const d of s.deals.slice()) {
      if (s.energia < 2 || s.empresas.length >= 4) break;
      s.energia -= 2; d.analizado = true; d.banderas.forEach(b => { if (Math.random() < 0.75) b.vista = true; });
      const r = negociar('perfecto', d, s);
      if (r.fin === 'compra') { const op = HH.financiacion(s, d, r.n).ops.filter(o => o.ok).pop(); if (op) HH.comprar(s, d, r.n, op); }
      else s.deals = s.deals.filter(x => x.id !== d.id);
    }
    for (const c of s.empresas.slice()) {
      const plan = ['automatizar', 'cuadro', 'comercial', 'recurrente'];
      if (c.precios < 2) plan.unshift('precios');
      if (c.ebitda > 180000 && !c.gerente) plan.unshift('gerente');
      for (const pal of plan) { if (s.energia <= 0) break; if (!HH.puedePalanca(s, c, pal)) { HH.palanca(s, c, pal, Math.random() < 0.6); break; } }
    }
    for (const c of s.empresas.slice()) {
      if (s.mes - c.mesCompra >= 14 && s.energia > 0) { const o = HH.ofertasVenta(s, c).sort((a, b) => b.valor - a.valor)[0]; if (o.neto > c.invertido * 1.3) HH.vender(s, c, o); }
    }
    HH.cerrarMes(s);
    if (s.evento) HH.resolverEvento(s, 0);
    HH.ganarXP(s, 120);
  }
  HH.actualizarParte(s);
  return s;
}
const res = []; for (let i = 0; i < 300; i++) { const s = partida(); res.push([s.tuParte, s.realizado * 0.25, s.empresas.length + s.stats.ventas, s.albert]); }
res.sort((a, b) => a[0] - b[0]);
const q = k => res[Math.floor(res.length * k)];
console.log('24 meses · tu parte (25%) p25/mediana/p75:', [0.25, 0.5, 0.75].map(k => HH.eur(q(k)[0])).join(' / '), '· empresas compradas mediana', q(0.5)[2], '· Albert ❤', q(0.5)[3]);
// diagnóstico de una partida
const s = partida();
console.log('diag: capital', HH.eur(s.capital), 'caja', HH.eur(s.caja), 'nav', HH.eur(HH.nav(s)), 'realizado', HH.eur(s.realizado), 'ventas', s.stats.ventas);
s.empresas.forEach(c => console.log('  ', c.sec, 'ebitda', HH.eur(c.ebitda), '(compra', HH.eur(c.ebitda0) + ')', 'mult', HH.multSalida(s, c).toFixed(2), 'valor', HH.eur(HH.valorEmpresa(s, c)), 'precio', HH.eur(c.precio), 'deuda', HH.eur(HH.deudaEmpresa(c)), 'riesgos', c.riesgos.length));

// HOLDING — pixel art procedural. Todo se dibuja en una rejilla de 16 px por tile.
var H = window.H || (window.H = {});
(function () {
  'use strict';
  var K = '#1b1b24';
  var cache = {};

  function cv(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; var x = c.getContext('2d'); x.imageSmoothingEnabled = false; return c; }
  H.cv = cv;
  function oscurecer(hex, f) {
    var n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    r = Math.round(r * f); g = Math.round(g * f); b = Math.round(b * f);
    return '#' + ((1 << 24) + (Math.min(255, r) << 16) + (Math.min(255, g) << 8) + Math.min(255, b)).toString(16).slice(1);
  }
  H.oscurecer = oscurecer;

  // ---------- Personas ----------
  // look: { skin, hair, bald, shirt, suit, pants, hat, hatColor }
  H.persona = function (look, dir, frame) {
    var key = JSON.stringify(look) + dir + frame;
    if (cache[key]) return cache[key];
    var c = cv(16, 16), x = c.getContext('2d');
    function p(px, py, w, h, col) { x.fillStyle = col; x.fillRect(px, py, w || 1, h || 1); }
    var flip = dir === 'right'; var d = flip ? 'left' : dir;
    var skin = look.skin, hair = look.hair, sh = look.suit || look.shirt, pants = look.pants;
    // sombra
    x.fillStyle = 'rgba(0,0,0,.22)'; x.fillRect(4, 14, 8, 2); x.fillRect(3, 15, 10, 1);
    // piernas
    var lA = frame === 1, lB = frame === 2;
    if (d === 'left') {
      p(6, 12, 4, 3, K);
      p(lA ? 5 : 6, 12, 2, lA ? 2 : 3, pants); p(lB ? 9 : 8, 12, 2, lB ? 2 : 3, oscurecer(pants, 0.8));
      p(lA ? 4 : 5, lA ? 14 : 15, 3, 1, K); p(lB ? 9 : 8, lB ? 14 : 15, 3, 1, K);
    } else {
      p(4, 12, 8, 2, K);
      p(5, 12, 2, lA ? 2 : 3, pants); p(9, 12, 2, lB ? 2 : 3, pants);
      p(5, lA ? 14 : 15, 2, 1, K); p(9, lB ? 14 : 15, 2, 1, K);
      p(4, 12, 1, 2, K); p(11, 12, 1, 2, K); p(7, 12, 2, 1, K);
    }
    // cuerpo
    p(4, 8, 8, 5, K); p(5, 8, 6, 4, sh);
    if (look.suit && d === 'down') { p(7, 8, 2, 3, '#f5f5f5'); p(7, 9, 2, 3, '#c0262d'); p(7, 9, 1, 1, '#f5f5f5'); }
    if (look.suit && d === 'left') { p(5, 8, 2, 2, '#f5f5f5'); }
    p(5, 11, 6, 1, oscurecer(sh, 0.75));
    // brazos
    if (d === 'left') { p(7, 9, 2, 3, oscurecer(sh, 0.8)); p(7, 11 + (lA ? -1 : lB ? 1 : 0), 2, 1, skin); }
    else {
      var bA = lA ? -1 : 0, bB = lB ? -1 : 0;
      p(3, 9 + bA, 1, 3, K); p(12, 9 + bB, 1, 3, K); p(3, 9 + bA, 1, 2, sh); p(12, 9 + bB, 1, 2, sh);
      p(3, 11 + bA, 1, 1, skin); p(12, 11 + bB, 1, 1, skin);
    }
    // cabeza
    p(4, 1, 8, 8, K); p(3, 3, 10, 4, K);
    p(4, 2, 8, 6, skin); p(5, 1, 6, 1, K);
    if (d === 'up') {
      p(4, 2, 8, 6, look.bald ? skin : hair); if (look.bald) { p(4, 5, 8, 2, hair); }
      p(3, 3, 1, 4, look.bald ? skin : hair); p(12, 3, 1, 4, look.bald ? skin : hair);
    } else if (d === 'down') {
      if (!look.bald) { p(4, 2, 8, 2, hair); p(4, 4, 1, 2, hair); p(11, 4, 1, 2, hair); p(5, 4, 1, 1, hair); }
      else { p(3, 4, 1, 2, hair); p(12, 4, 1, 2, hair); }
      p(3, 4, 1, 2, skin); p(12, 4, 1, 2, skin);
      p(6, 5, 1, 2, K); p(9, 5, 1, 2, K);
      p(5, 7, 1, 1, '#f19a8a'); p(10, 7, 1, 1, '#f19a8a');
    } else {
      if (!look.bald) { p(4, 2, 8, 2, hair); p(8, 4, 4, 3, hair); } else { p(9, 4, 3, 2, hair); }
      p(3, 4, 1, 2, skin);
      p(5, 5, 1, 2, K); p(4, 7, 1, 1, '#f19a8a');
    }
    if (look.hat) {
      var hc = look.hat;
      p(4, 0, 8, 1, K); p(3, 1, 10, 3, K); p(4, 1, 8, 2, hc); p(4, 3, 8, 1, oscurecer(hc, 0.7));
      if (d === 'down') { p(6, 1, 4, 1, '#ffffff'); p(3, 3, 10, 1, K); }
      if (d === 'left') { p(1, 3, 4, 1, K); p(2, 3, 3, 1, oscurecer(hc, 0.7)); }
      if (d === 'up') { p(4, 3, 8, 1, hc); p(6, 2, 4, 1, '#ffffff'); }
    }
    if (flip) { var c2 = cv(16, 16), x2 = c2.getContext('2d'); x2.translate(16, 0); x2.scale(-1, 1); x2.drawImage(c, 0, 0); c = c2; }
    cache[key] = c; return c;
  };

  H.LOOK_JUGADOR = { skin: '#f6c9a0', hair: '#2a1f18', bald: false, shirt: '#1f3f8f', suit: '#1f3f8f', pants: '#22263a', hat: '#e3342f' };
  H.LOOK_ALBERT = { skin: '#efc39c', hair: '#9aa0a8', bald: false, shirt: '#111827', suit: '#111827', pants: '#111827', hat: null };
  H.LOOK_BROKER = { skin: '#e8b088', hair: '#7a2e1d', bald: false, shirt: '#e11d48', suit: null, pants: '#1e293b', hat: null };
  H.LOOK_AUDITORA = { skin: '#f3d2b3', hair: '#111111', bald: false, shirt: '#6d28d9', suit: '#4c1d95', pants: '#1f1235', hat: null };

  // ---------- Tiles ----------
  function hash(x, y) { var h = (x * 374761393 + y * 668265263) ^ 0x5bd1e995; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
  H.hash = hash;
  var T = {
    grass: function (x, px, py, tx, ty) {
      x.fillStyle = '#86cf63'; x.fillRect(px, py, 16, 16);
      for (var i = 0; i < 3; i++) {
        var a = hash(tx * 7 + i, ty * 13 - i), b = hash(tx - i * 3, ty + i * 5);
        var gx = px + Math.floor(a * 13) + 1, gy = py + Math.floor(b * 12) + 2;
        x.fillStyle = '#5fae46'; x.fillRect(gx, gy, 1, 2); x.fillRect(gx + 2, gy, 1, 2); x.fillStyle = '#9fe07a'; x.fillRect(gx + 1, gy - 1, 1, 1);
      }
    },
    path: function (x, px, py, tx, ty) {
      x.fillStyle = '#ead7a2'; x.fillRect(px, py, 16, 16);
      for (var i = 0; i < 4; i++) { var a = hash(tx + i * 11, ty * 3 + i); x.fillStyle = i % 2 ? '#d6be82' : '#f5e6bd'; x.fillRect(px + Math.floor(a * 14), py + Math.floor(hash(ty + i, tx - i) * 14), 2, 1); }
    },
    plaza: function (x, px, py, tx, ty) {
      x.fillStyle = (tx + ty) % 2 ? '#e6dccb' : '#efe6d6'; x.fillRect(px, py, 16, 16);
      x.fillStyle = '#cfc2aa'; x.fillRect(px, py + 15, 16, 1); x.fillRect(px + 15, py, 1, 16);
    },
    tree: function (x, px, py) {
      T.grass(x, px, py, 0, 0);
      x.fillStyle = 'rgba(0,0,0,.2)'; x.fillRect(px + 2, py + 13, 12, 3);
      x.fillStyle = '#6b4226'; x.fillRect(px + 6, py + 11, 4, 4);
      x.fillStyle = K; x.fillRect(px + 2, py + 1, 12, 11); x.fillRect(px + 1, py + 3, 14, 7); x.fillRect(px + 4, py, 8, 13);
      x.fillStyle = '#2f8a43'; x.fillRect(px + 3, py + 1, 10, 10); x.fillRect(px + 2, py + 3, 12, 6); x.fillRect(px + 5, py + 1, 6, 11);
      x.fillStyle = '#48b25c'; x.fillRect(px + 4, py + 2, 5, 4); x.fillRect(px + 3, py + 4, 3, 3);
      x.fillStyle = '#7bd88a'; x.fillRect(px + 5, py + 3, 2, 1);
      x.fillStyle = '#1f6630'; x.fillRect(px + 9, py + 7, 4, 3); x.fillRect(px + 6, py + 9, 6, 2);
    },
    water: function (x, px, py, tx, ty, f) {
      x.fillStyle = '#4f9be0'; x.fillRect(px, py, 16, 16);
      x.fillStyle = '#7fc0f5';
      var o = f ? 4 : 0;
      x.fillRect(px + ((2 + o) % 16), py + 4, 4, 1); x.fillRect(px + ((9 + o) % 16), py + 9, 4, 1); x.fillRect(px + ((5 + o) % 16), py + 13, 3, 1);
      x.fillStyle = '#d6efff'; x.fillRect(px + ((3 + o) % 16), py + 4, 1, 1);
    },
    flowers: function (x, px, py, tx, ty, f) {
      T.grass(x, px, py, tx, ty);
      var cols = ['#ff5a6e', '#ffd43b', '#ffffff', '#c084fc'], c = cols[Math.floor(hash(tx, ty) * 4)];
      [[3, 4], [10, 3], [6, 10], [12, 11]].forEach(function (q, i) {
        var dy = f && i % 2 ? 1 : 0;
        x.fillStyle = '#3f8f2f'; x.fillRect(px + q[0] + 1, py + q[1] + 2 + dy, 1, 2);
        x.fillStyle = c; x.fillRect(px + q[0], py + q[1] + 1 + dy, 3, 1); x.fillRect(px + q[0] + 1, py + q[1] + dy, 1, 3);
        x.fillStyle = '#ffe066'; x.fillRect(px + q[0] + 1, py + q[1] + 1 + dy, 1, 1);
      });
    },
    fence: function (x, px, py, tx, ty) {
      T.grass(x, px, py, tx, ty);
      x.fillStyle = K; x.fillRect(px, py + 5, 16, 6); x.fillStyle = '#c58a52'; x.fillRect(px, py + 6, 16, 2); x.fillRect(px, py + 9, 16, 1);
      x.fillStyle = K; x.fillRect(px + 2, py + 2, 4, 12); x.fillRect(px + 10, py + 2, 4, 12);
      x.fillStyle = '#e0a868'; x.fillRect(px + 3, py + 3, 2, 10); x.fillRect(px + 11, py + 3, 2, 10);
    },
    rim: function (x, px, py) { x.fillStyle = '#9ca3af'; x.fillRect(px, py, 16, 16); x.fillStyle = '#d1d5db'; x.fillRect(px + 1, py + 1, 14, 3); x.fillStyle = '#6b7280'; x.fillRect(px, py + 15, 16, 1); }
  };
  H.TILE = T;

  // ---------- Edificios ----------
  // Dibuja un edificio de w×h tiles en (px,py). o = { roof, wall, tipo, emoji, rotulo }
  H.edificio = function (x, px, py, w, h, o) {
    var W = w * 16, Hh = h * 16, roofH = Math.round(Hh * (o.tipo === 'torre' ? 0.18 : 0.46));
    x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(px + 3, py + Hh - 2, W - 2, 4);
    // muro
    x.fillStyle = K; x.fillRect(px, py + roofH - 1, W, Hh - roofH + 1);
    x.fillStyle = o.wall; x.fillRect(px + 1, py + roofH, W - 2, Hh - roofH - 1);
    x.fillStyle = oscurecer(o.wall, 0.82); x.fillRect(px + 1, py + Hh - 4, W - 2, 3);
    if (o.tipo === 'torre') {
      // rascacielos de cristal
      for (var wy = py + roofH + 3; wy < py + Hh - 18; wy += 7) for (var wx = px + 4; wx < px + W - 6; wx += 7) {
        x.fillStyle = '#0e3a5c'; x.fillRect(wx, wy, 5, 5); x.fillStyle = '#5cc8ff'; x.fillRect(wx, wy, 5, 2); x.fillStyle = '#b8ecff'; x.fillRect(wx, wy, 2, 1);
      }
    } else {
      var filas = Math.max(1, Math.floor((Hh - roofH - 20) / 10));
      for (var f = 0; f < filas; f++) for (var k = 0; k < w; k++) {
        var cx = px + k * 16 + 4, cy = py + roofH + 3 + f * 10;
        if (k === Math.floor(w / 2) && f === filas - 1) continue;
        x.fillStyle = K; x.fillRect(cx - 1, cy - 1, 10, 8);
        x.fillStyle = '#7cc6f2'; x.fillRect(cx, cy, 8, 6); x.fillStyle = '#c9ecff'; x.fillRect(cx, cy, 3, 2);
        x.fillStyle = oscurecer(o.wall, 0.7); x.fillRect(cx - 1, cy + 6, 10, 1);
      }
    }
    // tejado
    if (o.tipo === 'torre') {
      x.fillStyle = K; x.fillRect(px - 1, py, W + 2, roofH); x.fillStyle = o.roof; x.fillRect(px, py + 1, W, roofH - 2);
      x.fillStyle = '#ffd43b'; x.fillRect(px + W / 2 - 1, py - 8, 2, 8); x.fillStyle = '#ef4444'; x.fillRect(px + W / 2 - 1, py - 9, 2, 2);
    } else if (o.tipo === 'cupula') {
      x.fillStyle = K; x.fillRect(px - 1, py + 4, W + 2, roofH - 3); x.fillRect(px + 6, py, W - 12, 6);
      x.fillStyle = o.roof; x.fillRect(px, py + 5, W, roofH - 5); x.fillRect(px + 7, py + 1, W - 14, 5);
      x.fillStyle = oscurecer(o.roof, 1.25); x.fillRect(px + 8, py + 2, W - 30, 2);
      for (var s = 0; s < W; s += 8) { x.fillStyle = oscurecer(o.roof, 0.8); x.fillRect(px + s, py + 8, 1, roofH - 9); }
    } else {
      x.fillStyle = K; x.fillRect(px - 2, py + 1, W + 4, roofH);
      x.fillStyle = o.roof; x.fillRect(px - 1, py + 2, W + 2, roofH - 2);
      for (var ry = py + 5; ry < py + roofH; ry += 4) { x.fillStyle = oscurecer(o.roof, 0.78); x.fillRect(px - 1, ry, W + 2, 1); }
      x.fillStyle = oscurecer(o.roof, 1.25); x.fillRect(px - 1, py + 2, W + 2, 2);
      x.fillStyle = oscurecer(o.roof, 0.6); x.fillRect(px - 1, py + roofH - 1, W + 2, 1);
      if (o.chimenea) { x.fillStyle = K; x.fillRect(px + W - 12, py - 4, 7, 8); x.fillStyle = '#b45309'; x.fillRect(px + W - 11, py - 3, 5, 6); }
    }
    // puerta
    var dx = px + Math.floor(w / 2) * 16 + 3, dy = py + Hh - 15;
    x.fillStyle = K; x.fillRect(dx - 1, dy - 1, 12, 15);
    x.fillStyle = o.puerta || '#8b5a2b'; x.fillRect(dx, dy, 10, 14);
    x.fillStyle = oscurecer(o.puerta || '#8b5a2b', 0.7); x.fillRect(dx + 4, dy, 2, 14);
    x.fillStyle = '#ffd43b'; x.fillRect(dx + 7, dy + 7, 1, 2);
    x.fillStyle = '#d6c7a1'; x.fillRect(dx - 2, py + Hh - 1, 14, 2);
    // rótulo
    if (o.rotulo) {
      x.font = '6px "Press Start 2P", monospace'; var tw = Math.ceil(x.measureText(o.rotulo).width) + 6;
      var sx = px + Math.round(W / 2 - tw / 2), sy = py + roofH - 5;
      x.fillStyle = K; x.fillRect(sx - 1, sy - 1, tw + 2, 10); x.fillStyle = o.cartel || '#fffbea'; x.fillRect(sx, sy, tw, 8);
      x.fillStyle = K; x.textBaseline = 'top'; x.fillText(o.rotulo, sx + 3, sy + 1);
    }
    if (o.emoji) {
      x.font = '12px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; x.textBaseline = 'top';
      x.fillText(o.emoji, px + W / 2 - 7, py + (o.tipo === 'torre' ? 1 : roofH / 2 - 9));
    }
  };

  // Cartel de madera
  H.cartel = function (x, px, py) {
    x.fillStyle = K; x.fillRect(px + 2, py + 2, 12, 9); x.fillRect(px + 7, py + 10, 2, 5);
    x.fillStyle = '#c58a52'; x.fillRect(px + 3, py + 3, 10, 7); x.fillStyle = '#e8b27a'; x.fillRect(px + 3, py + 3, 10, 2);
    x.fillStyle = '#8b5a2b'; x.fillRect(px + 5, py + 6, 6, 1); x.fillRect(px + 5, py + 8, 4, 1);
  };
  // Tablón de deals
  H.tablon = function (x, px, py) {
    x.fillStyle = K; x.fillRect(px, py + 1, 16, 12); x.fillRect(px + 2, py + 12, 2, 4); x.fillRect(px + 12, py + 12, 2, 4);
    x.fillStyle = '#a16207'; x.fillRect(px + 1, py + 2, 14, 10);
    x.fillStyle = '#fff'; x.fillRect(px + 3, py + 4, 4, 5); x.fillRect(px + 9, py + 3, 4, 4); x.fillStyle = '#fde68a'; x.fillRect(px + 9, py + 8, 4, 3);
    x.fillStyle = '#ef4444'; x.fillRect(px + 4, py + 4, 2, 1); x.fillRect(px + 10, py + 3, 2, 1);
  };
  // "SE VENDE"
  H.seVende = function (x, px, py) {
    x.fillStyle = K; x.fillRect(px + 1, py + 1, 14, 9); x.fillRect(px + 7, py + 9, 2, 6);
    x.fillStyle = '#ef4444'; x.fillRect(px + 2, py + 2, 12, 7);
    x.fillStyle = '#fff'; x.font = '4px "Press Start 2P", monospace'; x.textBaseline = 'top'; x.fillText('SE', px + 4, py + 2); x.fillText('VENDE', px + 2, py + 5);
  };
  H.bandera = function (x, px, py, t) {
    x.fillStyle = K; x.fillRect(px + 3, py - 10, 2, 24); x.fillStyle = '#e5e7eb'; x.fillRect(px + 3, py - 10, 1, 24);
    var ola = Math.sin(t / 250) > 0 ? 1 : 0;
    x.fillStyle = K; x.fillRect(px + 5, py - 10 + ola, 11, 8);
    x.fillStyle = '#ffd43b'; x.fillRect(px + 5, py - 9 + ola, 10, 6);
    x.fillStyle = '#b45309'; x.font = '5px "Press Start 2P", monospace'; x.textBaseline = 'top'; x.fillText('H', px + 8, py - 9 + ola);
  };
})();

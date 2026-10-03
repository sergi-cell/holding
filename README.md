# HOLDING · Villa Pyme

Juego pixel-art estilo Game Boy para aprender a comprar, arreglar y vender pymes (0,5-3 M€).
PWA: https://sergi-cell.github.io/holding/

- `js/data.js` — contenido: sectores, banderas rojas, motivos de venta, estructuras, Dealdex, eventos, misiones.
- `js/engine.js` — motor puro (deals, due diligence, negociación, compra, operación, cierre de mes).
- `js/music.js` — chip Game Boy (2 pulsos, triángulo, ruido) que toca MIDIs.
- `musica.pack` — música personal CIFRADA (AES-256-GCM). Se abre con un código o con el enlace `#musica=CÓDIGO`. Se regenera con `node tools/empaquetar.mjs CÓDIGO` desde la carpeta de MIDIs; los .mid nunca se suben.
- `js/sprites.js`, `js/world.js` — pixel art procedural y el pueblo.
- `js/ui.js`, `js/pantallas.js` — interfaz y pantallas.
- `node sim.js` — equilibrio: perfecto vs azar y partida de 24 meses. Referencia: perfecto ~30% de compras 3★, azar 0%.

Al publicar un cambio: subir `?v=N` en index.html y `CACHE` en sw.js a la vez.

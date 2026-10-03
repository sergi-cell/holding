// Empaqueta la música personal de Sergi CIFRADA (AES-256-GCM, clave por PBKDF2 desde su código).
// El repo es público: sin el código, musica.pack son bytes ilegibles. Nunca subir los .mid sueltos.
// Uso: node tools/empaquetar.mjs <CODIGO> [carpeta=~/Desktop/canciones]
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os';
const codigo = (process.argv[2] || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
if (!codigo) { console.error('Falta el código'); process.exit(1); }
const dir = process.argv[3] || path.join(os.homedir(), 'Desktop/canciones');
// Cada escena del juego y sus canciones (en orden: el pueblo rota uno por mes).
const ESCENAS = {
  titulo: ['intro-part-1-'], intro: ['oak-s-theme'],
  pueblo: ['new-bark-town', 'pallet-town', 'cherrygrove-city', 'route-30', 'azalea-town', 'route-27', 'goldenrod-city', 'route-36', 'ecruteak-city', 'route-38', 'celadon-city', 'route-42', 'route-10', 'route-12', 'bug-contest', 'surf-remix-', 'victory-road'],
  encuentro: ['female-trainer-encounter'], combate: ['kanto-trainer-battle', 'wild-pok-mon-battle', 'kanto-wild-pok-mon-battle'], jefe: ['champion-battle'],
  reto: ['gym-leader-battle', 'kanto-gym-leader-battle'], calma: ['elm-s-lab', 'national-park'], dex: ['oak-s-pok-mon-radio'], albert: ['indigo-plateau'],
  informe: ['ecruteak-dance-theater'], vender: ['game-corner'], evento: ['dark-cave', 'burned-tower', 'dragon-s-den', 'lavender-town'],
  victoria: ['badge-acquired'], objeto: ['egg-received'], nivel: ['contest-1st-place'], fama: ['hall-of-fame']
};
const pack = { v: 1, escenas: {} }; let n = 0;
for (const [esc, lista] of Object.entries(ESCENAS)) {
  pack.escenas[esc] = lista.filter(f => fs.existsSync(path.join(dir, f + '.mid'))).map(f => { n++; return { n: f, b: fs.readFileSync(path.join(dir, f + '.mid')).toString('base64') }; });
}
const usados = new Set(Object.values(ESCENAS).flat());
const sobran = fs.readdirSync(dir).filter(f => f.endsWith('.mid') && !usados.has(f.slice(0, -4)));
const te = new TextEncoder(), salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
const base = await crypto.subtle.importKey('raw', te.encode(codigo), 'PBKDF2', false, ['deriveKey']);
const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 150000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, te.encode(JSON.stringify(pack))));
const out = new Uint8Array(4 + 16 + 12 + ct.length); out.set(te.encode('HLD1'), 0); out.set(salt, 4); out.set(iv, 20); out.set(ct, 32);
fs.writeFileSync('musica.pack', out);
console.log(`musica.pack: ${n} canciones en ${Object.keys(ESCENAS).length} escenas, ${(out.length / 1024).toFixed(0)} KB cifrados.` + (sobran.length ? ' Sin escena: ' + sobran.join(', ') : ''));

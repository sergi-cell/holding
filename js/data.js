// HOLDING — contenido del juego. Todo lo que se aprende vive aquí.
// Sectores calibrados con datos reales (oct. 2026): múltiplo = Dealsuite Southern Europe M&A Monitor ajustado a
// EBITDA de 200-500k; margen = mediana EBITDA/ventas del Banco de España (RSE 2024); vxe = ventas por empleado (k€, RSE).
// Regla: los deals se GENERAN combinando sector × banderas × motivo × carácter. Nada de contenido fijo.
var H = window.H || (window.H = {});

H.SECTORES = [
  { id: 'distri', n: 'Distribuidora industrial', e: '📦', c: ['#f59e0b', '#b45309'], mult: 3.8, margen: 0.06, vxe: 300, recur: 0.35, names: ['Suministros', 'Distribuciones', 'Comercial'] },
  { id: 'instal', n: 'Instaladora clima', e: '❄️', c: ['#38bdf8', '#0369a1'], mult: 3.4, margen: 0.07, vxe: 120, recur: 0.45, names: ['Instalaciones', 'Clima', 'Térmica'] },
  { id: 'gestoria', n: 'Gestoría', e: '🧾', c: ['#a78bfa', '#6d28d9'], mult: 4.4, margen: 0.1, vxe: 85, recur: 0.85, names: ['Asesores', 'Gestoría', 'Consulting'] },
  { id: 'limpieza', n: 'Limpieza de oficinas', e: '🧽', c: ['#34d399', '#047857'], mult: 4.3, margen: 0.06, vxe: 34, recur: 0.80, names: ['Servicios', 'Limpiezas', 'Facility'] },
  { id: 'dental', n: 'Clínica dental', e: '🦷', c: ['#f0abfc', '#a21caf'], mult: 5.2, margen: 0.11, vxe: 140, recur: 0.40, names: ['Clínica', 'Dental', 'Sonrisa'] },
  { id: 'metal', n: 'Taller de mecanizado', e: '⚙️', c: ['#94a3b8', '#334155'], mult: 4.3, margen: 0.11, vxe: 115, recur: 0.30, names: ['Mecanizados', 'Talleres', 'Precisión'] },
  { id: 'transporte', n: 'Transporte regional', e: '🚚', c: ['#fb923c', '#c2410c'], mult: 3.7, margen: 0.09, vxe: 125, recur: 0.55, names: ['Transportes', 'Logística', 'Cargas'] },
  { id: 'ascensores', n: 'Mantenimiento ascensores', e: '🛗', c: ['#2dd4bf', '#0f766e'], mult: 5.0, margen: 0.1, vxe: 120, recur: 0.92, names: ['Elevación', 'Ascensores', 'Lift'] },
  { id: 'software', n: 'Software de gestión nicho', e: '💻', c: ['#60a5fa', '#1d4ed8'], mult: 6.2, margen: 0.14, vxe: 90, recur: 0.88, names: ['Soft', 'Sistemas', 'Data'] },
  { id: 'obrador', n: 'Obrador de pan', e: '🥖', c: ['#fbbf24', '#92400e'], mult: 4.4, margen: 0.07, vxe: 80, recur: 0.60, names: ['Obrador', 'Panificadora', 'Hornos'] },
  { id: 'imprenta', n: 'Imprenta digital', e: '🖨️', c: ['#f87171', '#991b1b'], mult: 4.2, margen: 0.08, vxe: 120, recur: 0.25, names: ['Gráficas', 'Artes Gráficas', 'Print'] },
  { id: 'formacion', n: 'Academia de formación', e: '🎓', c: ['#818cf8', '#4338ca'], mult: 4.3, margen: 0.09, vxe: 70, recur: 0.50, names: ['Academia', 'Formación', 'Centro'] },
  { id: 'veterinaria', n: 'Clínica veterinaria', e: '🐾', c: ['#4ade80', '#15803d'], mult: 5.1, margen: 0.07, vxe: 85, recur: 0.55, names: ['Veterinaria', 'Clínica Vet', 'Animalia'] },
  { id: 'seguridad', n: 'Alarmas y seguridad', e: '🛡️', c: ['#e879f9', '#86198f'], mult: 4.8, margen: 0.08, vxe: 90, recur: 0.85, names: ['Seguridad', 'Protección', 'Alarmas'] }
];

H.APELLIDOS = ['García', 'Ferrer', 'Puig', 'Martínez', 'Soler', 'Navarro', 'Vidal', 'Roca', 'Serra', 'Castells', 'Mora', 'Ibáñez', 'Prats', 'Font', 'Ortega', 'Bosch', 'Rubio', 'Gil', 'Pons', 'Romero'];
H.NOMBRES_DUENO = ['Joan', 'Manolo', 'Pilar', 'Antonio', 'Montse', 'Paco', 'Rosa', 'Jordi', 'Carmen', 'Josep', 'Luis', 'Mercedes', 'Ramón', 'Teresa', 'Enric', 'Isabel'];
H.CIUDADES = ['Sabadell', 'Terrassa', 'Valencia', 'Zaragoza', 'Girona', 'Lleida', 'Castellón', 'Murcia', 'Alicante', 'Reus', 'Burgos', 'Vitoria', 'Granollers', 'Mataró', 'Tarragona', 'Valladolid'];
H.CARAS = ['👴', '👵', '🧔‍♂️', '👨‍🦳', '👩‍🦳', '🧓', '👨‍🦲', '👩‍💼', '👨‍💼'];

// Motivo de venta: decide qué estructuras acepta. Es la mecánica central de la negociación.
H.MOTIVOS = {
  jubilacion: { n: 'Se jubila', e: '🏖️', quiere: ['transicion', 'legado', 'vendor_loan', 'earnout'], odia: ['anclar'], frase: 'Tengo 67 años. Quiero dejarlo bien atado y que mi gente siga.' },
  salud: { n: 'Problema de salud', e: '🏥', quiere: ['rapido', 'legado'], odia: ['earnout', 'transicion', 'vendor_loan'], frase: 'El médico me ha dicho que pare. Necesito cerrarlo pronto y con dinero en mano.' },
  quemado: { n: 'Está quemado', e: '🔥', quiere: ['rapido', 'vendor_loan'], odia: ['transicion', 'earnout'], frase: 'Llevo 25 años sin vacaciones. Me da igual 50.000 € arriba o abajo: quiero salir.' },
  sucesor: { n: 'No tiene sucesor', e: '👨‍👧', quiere: ['legado', 'transicion', 'earnout'], odia: ['anclar'], frase: 'Mis hijos no la quieren. Me duele que esto se cierre cuando yo falte.' },
  socios: { n: 'Pelea entre socios', e: '⚔️', quiere: ['rapido', 'escrow'], odia: ['transicion'], frase: 'Con mi socio ya no nos hablamos. Lo que sea, pero limpio y por escrito.' },
  liquidez: { n: 'Quiere liquidez', e: '💸', quiere: ['rapido'], odia: ['vendor_loan', 'earnout'], frase: 'Tengo otro proyecto y necesito el dinero. Cuanto más al contado, mejor.' },
  // Motivos que nadie cuenta a la primera: hay que repreguntar con confianza.
  caja: { n: 'Problemas de caja', e: '🕳️', quiere: ['rapido'], odia: ['earnout', 'vendor_loan', 'escrow', 'transicion'], frase: 'Los bancos me aprietan y no llego a fin de mes. Necesito salir ya.', oculto: true },
  amenaza: { n: 'Viene un gigante', e: '🦖', quiere: ['rapido', 'legado'], odia: ['earnout', 'transicion'], frase: 'Una cadena enorme abre al lado el año que viene. Prefiero vender antes de que se note.', oculto: true }
};

// Carácter del vendedor: cómo reacciona a cada jugada.
H.CARACTERES = {
  orgulloso: { n: 'Fundador orgulloso', confianza: 30, paciencia: 7, escuchar: 16, ofende: 1.6, datos: 0.8, umbral: 4 },
  calculador: { n: 'Calculador', confianza: 38, paciencia: 7, escuchar: 6, ofende: 0.7, datos: 1.4, umbral: 0 },
  desconfiado: { n: 'Desconfiado', confianza: 22, paciencia: 8, escuchar: 12, ofende: 1.2, datos: 1.0, umbral: 2 },
  cansado: { n: 'Cansado', confianza: 40, paciencia: 6, escuchar: 9, ofende: 0.9, datos: 1.0, umbral: -4 }
};

// Giros a mitad de la negociación. El que sabe leer la situación, gana.
H.GIROS = {
  hija: { e: '👧', t: 'Entra su hija en la reunión: «Papá, ¿de verdad vas a vender?»', ops: [
    { t: 'Incluirla: «¿Te gustaría seguir en la empresa?»', ef: { conf: 8, bonus: { motivos: ['sucesor', 'jubilacion', 'salud'], conf: 8, txt: 'Le has tocado la fibra: lo que más le importa es que esto siga.' } }, por: 'Incluir a la familia genera confianza.', aprende: 'legado' },
    { t: 'Esperar en silencio a que hablen', ef: { conf: -1, pac: -1 }, por: 'Prudente, pero pierdes un turno.' },
    { t: 'Volver a los números', ef: { conf: -9 }, por: 'Frío. Se nota que solo te importa el precio.' }] },
  gestor: { e: '📞', t: 'Le llama su gestor: «No bajes ni un euro más».', ops: [
    { t: 'Ofrecer enseñarle tus datos al gestor', ef: { datos: true }, por: 'Los asesores se convencen con datos, no con palabras.', aprende: 'due_diligence' },
    { t: 'Ignorarlo y seguir', ef: { suelo: true }, por: 'El gestor ha puesto un suelo al precio.' }] },
  emocion: { e: '🥲', t: 'Se emociona hablando de sus empleados.', ops: [
    { t: 'Escuchar sin interrumpir', ef: { conf: 12 }, por: 'Escuchar en el momento justo vale más que cualquier argumento.' },
    { t: 'Volver al precio', ef: { conf: -10 }, por: 'Has pisado un momento importante para él.' }] },
  reloj: { e: '⌚', t: 'Mira el reloj: tiene otra reunión en un rato.', alEntrar: { pac: -2 }, ops: [
    { t: 'Proponer seguir otro día con un café', ef: { pac: 2, conf: 3 }, por: 'Sin prisas: le das espacio y ganas tiempo.' },
    { t: 'Ir al grano', ef: {}, por: 'Te quedan pocos turnos. Úsalos bien.' }] },
  exclusividad: { e: '✍️', t: '«Si la quieres, firmamos ya. Sin auditorías ni papeles.»', ops: [
    { t: 'Carta de intenciones con exclusividad, sujeta a due diligence', ef: { conf: 6 }, por: 'Así se hace: exclusividad sí, a ciegas no.', aprende: 'carta_intenciones' },
    { t: 'Aceptar sin due diligence', ef: { conf: 10, albert: -10 }, por: 'Rápido… y peligroso. Albert se entera y no le gusta nada.' },
    { t: 'Negarse en seco', ef: { conf: -10 }, por: 'Tenías razón en el fondo, pero no en la forma.' }] }
};

// Banderas rojas. vis = tipo de gráfico de due diligence. arregla = qué estructura cubre el riesgo
// (o 'precio' si se arregla bajando precio). impacto = % del precio que se puede descontar con razón.
H.BANDERAS = {
  concentracion: { n: 'Cliente gordo', e: '🎯', vis: 'donut', concepto: 'concentracion', arregla: ['earnout', 'consentimiento'], impacto: 0.10,
    q: '¿Cómo se reparten las ventas por cliente?', lec: 'Un solo cliente hace más del 40% de las ventas. Si se va, se va media empresa.' },
  dependencia: { n: 'Todo pasa por el dueño', e: '👑', vis: 'vendedores', concepto: 'dependencia', arregla: ['transicion', 'earnout'], impacto: 0.08,
    q: '¿Quién trae las ventas?', lec: 'El dueño trae el 80% de las ventas. Sin él no hay empresa: estarías comprando su agenda.' },
  addbacks: { n: 'EBITDA maquillado', e: '💄', vis: 'puente', concepto: 'addbacks', arregla: ['precio'], impacto: 0.18,
    q: 'Del EBITDA real al EBITDA que te enseña el vendedor', lec: 'Los "ajustes" del vendedor no tienen papeles. El EBITDA de verdad es más bajo.' },
  tendencia: { n: 'EBITDA cayendo', e: '📉', vis: 'anios', concepto: 'tendencia', arregla: ['precio'], impacto: 0.15,
    q: 'EBITDA de los últimos 4 años', lec: 'Lleva 3 años cayendo y te cobra el múltiplo del mejor año.' },
  pico: { n: 'Pedido puntual', e: '🎢', vis: 'meses', concepto: 'estacionalidad', arregla: ['precio'], impacto: 0.12,
    q: 'Ventas mes a mes (últimos 12)', lec: 'Un único pedido gigante infla el último año. No se va a repetir.' },
  laboral: { n: 'Falsos autónomos', e: '🧑‍🔧', vis: 'equipo', concepto: 'contingencia_laboral', arregla: ['escrow', 'garantias'], impacto: 0.06,
    q: '¿Quién trabaja aquí y con qué contrato?', lec: 'Trabajan a jornada completa como "autónomos". Una inspección y el problema es tuyo.' },
  hacienda: { n: 'Deuda con Hacienda', e: '🏛️', vis: 'deuda', concepto: 'hacienda', arregla: ['escrow', 'precio'], impacto: 0.08,
    q: 'Pasivos de la sociedad', lec: 'Hay un aplazamiento con Hacienda que no aparece en el resumen. Va con la sociedad.' },
  cobros: { n: 'Cobros fantasma', e: '👻', vis: 'antiguedad', concepto: 'cobros', arregla: ['precio'], impacto: 0.07,
    q: 'Facturas pendientes de cobro por antigüedad', lec: 'Una montaña de facturas con más de 180 días. Eso ya no se cobra.' },
  stock: { n: 'Almacén muerto', e: '📦', vis: 'rotacion', concepto: 'existencias', arregla: ['precio'], impacto: 0.06,
    q: 'Existencias por familia: días que tarda en venderse', lec: 'Hay stock que no se mueve desde hace más de un año y está valorado a precio de coste.' },
  capex: { n: 'Maquinaria al límite', e: '🏚️', vis: 'maquinas', concepto: 'capex', arregla: ['precio'], impacto: 0.09,
    q: 'Edad de la maquinaria frente a su vida útil', lec: 'La máquina principal está al final de su vida. Esa inversión la pagarás tú el primer año.' },
  cambio_control: { n: 'Cláusula trampa', e: '📜', vis: 'contratos', concepto: 'cambio_control', arregla: ['consentimiento'], impacto: 0.05,
    q: 'Contratos principales: ¿qué pasa si cambia el dueño?', lec: 'El contrato grande se puede rescindir si cambia la propiedad. Necesitas su firma antes de comprar.' },
  local: { n: 'Local del dueño', e: '🏠', vis: 'local', concepto: 'local', arregla: ['contrato_local'], impacto: 0.04,
    q: '¿De quién es el local donde trabaja la empresa?', lec: 'La nave es del dueño y no hay contrato. Al día siguiente te puede doblar el alquiler.' },
  fraude: { n: 'Las cuentas no cuadran', e: '🕳️', vis: 'cuadre', concepto: 'cuentas_oficiales', arregla: [], impacto: 0, fatal: true,
    q: 'Ventas que dice frente a ventas que declara a Hacienda', lec: 'Lo que te enseña no cuadra con el IVA que ha declarado. Esto no se negocia: te levantas y te vas.' }
};
H.BANDERAS_IDS = Object.keys(H.BANDERAS);

// Jugadas de estructura (cartas de la negociación).
H.ESTRUCTURAS = {
  earnout: { c: 'Earn-out', n: 'Earn-out', e: '🎯', d: 'El 20% se paga si en 2 años se mantienen las ventas.', concepto: 'earnout' },
  vendor_loan: { c: 'Pago aplazado', n: 'Préstamo del vendedor', e: '🤝', d: 'El 20% se aplaza 3 años con interés. Necesitas menos caja.', concepto: 'vendor_loan' },
  escrow: { c: 'Retención', n: 'Retención (escrow)', e: '🔒', d: 'El 10% queda bloqueado 18 meses para cubrir sorpresas.', concepto: 'escrow' },
  garantias: { c: 'Garantías', n: 'Garantías firmadas', e: '✍️', d: 'Declara por escrito que todo es cierto. Si no, paga él.', concepto: 'garantias' },
  transicion: { c: 'Se queda 1 año', n: 'Se queda 12 meses', e: '🧭', d: 'El dueño se queda un año pagado para pasarte clientes.', concepto: 'transicion' },
  legado: { c: 'Su gente', n: 'Mantener plantilla y nombre', e: '🫶', d: 'Te comprometes a mantener a su gente y el nombre.', concepto: 'legado' },
  rapido: { c: 'Firmar ya', n: 'Firmamos en 60 días', e: '⚡', d: 'Cierre rápido a cambio de un 5% menos de precio.', concepto: 'cierre_rapido' },
  contrato_local: { c: 'Alquiler 10 años', n: 'Alquiler a 10 años', e: '🏠', d: 'Condición: contrato de alquiler largo y a precio de mercado.', concepto: 'local' },
  consentimiento: { c: 'Firma del cliente', n: 'Firma del cliente grande', e: '📜', d: 'Condición: el cliente principal firma que sigue con vosotros.', concepto: 'cambio_control' }
};

// CÓDEX: lo que se aprende. rar: 1 común, 2 rara, 3 épica, 4 legendaria.
H.CODEX = {
  ebitda: { n: 'EBITDA', e: '💶', rar: 1, d: 'Beneficio antes de intereses, impuestos y amortizaciones. Lo que el negocio genera trabajando, sin contar cómo se financia.', r: 'Es la base de casi todas las valoraciones de pymes.' },
  multiplo: { n: 'Múltiplo', e: '✖️', rar: 1, d: 'Precio = EBITDA × múltiplo. Una pyme española de 0,5 a 3 M€ suele cambiar de manos entre 3 y 5,5 veces el EBITDA.', r: 'Más recurrente, más diversificada y menos dependiente del dueño = más múltiplo.', dato: 'Pymes del sur de Europa: unos 4,0-4,3× con 200k de EBITDA y ~5,3× con 1 M€ (Dealsuite, 2026).' },
  addbacks: { n: 'Add-backs', e: '💄', rar: 2, d: 'Gastos que el vendedor "suma de vuelta" al EBITDA porque dice que son personales o puntuales.', r: 'Solo valen con factura y si de verdad no se repiten. Sin papeles, fuera.', dato: 'Al normalizar, el EBITDA real de una pyme se aleja del declarado entre un 15% y un 30% (Capittal, opinión de asesor).' },
  sueldo_dueno: { n: 'Sueldo de mercado', e: '🧑‍💼', rar: 2, d: 'Si el dueño cobra 20.000 € pero sustituirlo cuesta 60.000 €, el EBITDA real es 40.000 € más bajo.', r: 'Normaliza siempre el sueldo del dueño antes de valorar.', dato: 'Es el ajuste más típico al normalizar el EBITDA de una pyme: sustituir al dueño cuesta un sueldo de mercado.' },
  dependencia: { n: 'Dependencia del dueño', e: '👑', rar: 1, d: 'Cuando las ventas, los clientes y las decisiones viven en una sola cabeza.', r: 'Compras un empleo, no una empresa. Se cubre con transición pagada y earn-out.', dato: 'Opinión de asesores españoles: −1 a −2× de múltiplo si la empresa depende del fundador (López Advisory, 2026).' },
  concentracion: { n: 'Concentración de clientes', e: '🎯', rar: 1, d: 'Qué porcentaje de las ventas depende de los clientes más grandes.', r: 'Un cliente por encima del 20-25% es un riesgo; por encima del 40%, es casi otra compra.', dato: 'Opinión de asesores: −0,5 a −1,5× si los 3 mayores clientes superan el 50% de las ventas (López Advisory, 2026).' },
  tendencia: { n: 'Tendencia', e: '📉', rar: 1, d: 'Mirar 3-4 años de cuentas, no solo el último.', r: 'Se paga el EBITDA que se va a repetir, no el del mejor año.' },
  estacionalidad: { n: 'Pedido puntual', e: '🎢', rar: 2, d: 'Un pedido extraordinario infla las ventas de los últimos 12 meses.', r: 'Quítalo antes de aplicar el múltiplo. Pregunta siempre por los 5 pedidos más grandes.' },
  capital_circulante: { n: 'Capital circulante', e: '🔄', rar: 3, d: 'Clientes + existencias − proveedores. El dinero que la empresa necesita "atado" para funcionar.', r: 'Se pacta un nivel normal que la empresa debe dejar al venderse. Si no, el vendedor se lo lleva.' },
  deuda_neta: { n: 'Deuda neta', e: '⚖️', rar: 2, d: 'Valor de la empresa − deudas + caja = lo que cobra el vendedor por sus acciones.', r: 'Las deudas (también con Hacienda) se descuentan del precio.' },
  cobros: { n: 'Antigüedad de cobros', e: '👻', rar: 2, d: 'Ordenar las facturas pendientes según cuánto tiempo llevan sin cobrarse.', r: 'Lo que pasa de 180 días casi nunca se cobra. Ajústalo del precio.', dato: 'Mediana de días de cobro en pymes de 2-10 M€: 48 en mayoristas, 72 en instaladoras, 11 en clínicas (Banco de España, RSE 2024).' },
  existencias: { n: 'Stock obsoleto', e: '📦', rar: 2, d: 'Inventario que no rota y que en el balance sigue valiendo lo que costó.', r: 'Pide la rotación por familia. Lo que no se vende en un año vale casi cero.' },
  capex: { n: 'Capex de mantenimiento', e: '🏚️', rar: 2, d: 'Inversión necesaria solo para seguir igual: renovar máquinas, furgonetas, servidores.', r: 'Si la maquinaria está al final de su vida, réstalo del precio. Lo pagarás tú.' },
  contingencia_laboral: { n: 'Contingencia laboral', e: '🧑‍🔧', rar: 2, d: 'Falsos autónomos, horas extra sin pagar, despidos mal hechos.', r: 'Pasan al comprador. Se cubren con retención y garantías firmadas.', dato: 'Falsos autónomos: multa de 3.750 a 12.000 € por trabajador más cuotas (LISOS). Si compras el negocio, respondes 3 años de deudas laborales (art. 44 ET).' },
  hacienda: { n: 'Deudas fiscales', e: '🏛️', rar: 2, d: 'Aplazamientos, actas o deudas con Hacienda y Seguridad Social.', r: 'Viajan con la sociedad. Descuéntalas del precio o bloquea dinero para cubrirlas.', dato: 'Si compras el negocio, respondes solidariamente de sus deudas fiscales (art. 42.1.c LGT). Pide antes el certificado del art. 175.2 LGT.' },
  cambio_control: { n: 'Cambio de control', e: '📜', rar: 3, d: 'Cláusula que deja al cliente rescindir el contrato si cambia el dueño de la empresa.', r: 'Lee los contratos grandes. Pide su consentimiento como condición para firmar.' },
  local: { n: 'Local del dueño', e: '🏠', rar: 2, d: 'La empresa trabaja en un local que es del vendedor, a menudo sin contrato.', r: 'Firma un alquiler largo a precio de mercado como condición de la compra.' },
  cuentas_oficiales: { n: 'Cuadre con Hacienda', e: '🕳️', rar: 3, d: 'Comparar las cuentas que te enseñan con lo declarado de IVA y Sociedades.', r: 'Si no cuadra, no hay negociación posible: te levantas.', dato: 'Entre empresas, pagar en efectivo 1.000 € o más está prohibido (Ley 7/2012). Mucho efectivo = señal de caja B.' },
  earnout: { n: 'Earn-out', e: '🎯', rar: 2, d: 'Parte del precio se paga más adelante solo si se cumplen objetivos.', r: 'Ideal cuando el riesgo es que el negocio dependa del dueño o de un cliente.', dato: 'Aparece en el 39% de las operaciones europeas; suele ser el 10-20% del precio, a 6-24 meses (Dealsuite, nov. 2025).' },
  vendor_loan: { n: 'Préstamo del vendedor', e: '🤝', rar: 2, d: 'El vendedor cobra parte del precio a plazos, con interés.', r: 'Necesitas menos caja y el vendedor queda alineado con que todo vaya bien.', dato: 'Está en el 34% de las operaciones europeas. Si cobra a plazos más de un año, el vendedor tributa según cobra (art. 14.2.d LIRPF): úsalo para negociar.' },
  escrow: { n: 'Retención (escrow)', e: '🔒', rar: 2, d: 'Parte del precio se bloquea durante un tiempo para cubrir sorpresas.', r: 'Para riesgos que no puedes medir hoy: laborales, fiscales.' },
  garantias: { n: 'Manifestaciones y garantías', e: '✍️', rar: 3, d: 'El vendedor declara por escrito que lo que te ha contado es cierto.', r: 'Si resulta falso, indemniza. Sin retención, son difíciles de cobrar.', dato: 'El 70% de las operaciones incluye garantías del vendedor; sin seguro, el tope suele ser el 10-30% del precio (Cuatrecasas, 2025).' },
  transicion: { n: 'Periodo de transición', e: '🧭', rar: 1, d: 'El dueño se queda unos meses, pagado, para traspasar clientes y conocimiento.', r: '6-12 meses es lo normal en pymes. Ponlo por escrito con objetivos.' },
  legado: { n: 'Legado', e: '🫶', rar: 2, d: 'Lo que el vendedor quiere que sobreviva: su gente, su nombre, su forma de hacer.', r: 'A muchos vendedores les importa más que 50.000 € de precio. Pregunta antes de ofertar.', dato: 'Solo 1 de cada 3 empresas familiares españolas tiene plan de sucesión (Instituto de la Empresa Familiar).' },
  cierre_rapido: { n: 'Velocidad', e: '⚡', rar: 1, d: 'Para algunos vendedores, cerrar ya vale dinero.', r: 'Si tiene prisa, la rapidez es moneda de cambio. Si no la tiene, no regales nada.' },
  motivo: { n: 'Motivo de venta', e: '🔍', rar: 1, d: 'Por qué vende: jubilación, salud, cansancio, socios, liquidez.', r: 'El motivo decide qué estructura acepta. Es lo primero que hay que descubrir.', dato: 'El 54% de las ventas de pymes en el sur de Europa son por edad o falta de sucesor. Edad media del vendedor: 59 años (Dealsuite, 2026).' },
  preguntar: { n: 'Preguntar antes de ofertar', e: '👂', rar: 1, d: 'Quien descubre más información, estructura mejor el trato.', r: 'Nunca pongas una cifra antes de saber qué le importa al otro.' },
  anclaje: { n: 'Anclaje', e: '⚓', rar: 2, d: 'La primera cifra que se dice marca toda la negociación.', r: 'Funciona con confianza. Sin confianza, una oferta baja ofende y rompe la mesa.', dato: 'En el 53% de los procesos el vendedor pide de más, de media un 26%, y eso rompe el 38% de esos deals (Dealsuite, 2026).' },
  leer_vendedor: { n: 'Leer al vendedor', e: '👀', rar: 3, d: 'Lo que dice y lo que hace no siempre coinciden. Una reacción que no encaja es una pista.', r: 'Si algo que debería gustarle le sienta mal, repregunta con confianza: quizá no te ha contado el motivo real.' },
  competencia: { n: 'Otro comprador', e: '🦈', rar: 2, d: 'Cuando aparece otra oferta, la tentación es subir el precio.', r: 'Compite en lo que le importa (rapidez, su gente, certeza) antes que en euros.' },
  saber_irse: { n: 'Saber irse', e: '🚪', rar: 3, d: 'El mejor trato, a veces, es el que no haces.', r: 'Ten claro tu precio máximo antes de sentarte. Y respétalo.' },
  due_diligence: { n: 'Due diligence', e: '🔎', rar: 1, d: 'Revisión financiera, fiscal, laboral y legal antes de firmar.', r: 'Lo que no encuentres antes de comprar lo pagarás después.', dato: 'El 63% de los search funds ha abandonado algún deal por lo que encontró en la due diligence (IESE, 2024).' },
  apalancamiento: { n: 'Deuda bancaria', e: '🏦', rar: 3, d: 'Financiar parte de la compra con un préstamo que paga la propia empresa.', r: 'Multiplica el retorno y el riesgo. Regla: la cuota anual por debajo del 50% del EBITDA.', dato: 'Prudencia habitual: deuda total ≤ 3× EBITDA y cuotas ≤ 50% del EBITDA. Una SL no puede financiar su propia compra (art. 143.2 LSC): se compra con una sociedad nueva.' },
  arbitraje: { n: 'Arbitraje de múltiplo', e: '🪄', rar: 4, d: 'Compras a 3,5× una empresa que depende de su dueño y la vendes a 5× profesionalizada.', r: 'El mismo EBITDA vale más cuando la empresa funciona sin ti.' },
  plan100: { n: 'Plan de 100 días', e: '🗓️', rar: 2, d: 'Los primeros meses tras comprar: no romper nada, conocer a la gente, victorias rápidas.', r: 'Primero escuchar, luego cambiar. El equipo te está mirando.' },
  precios: { n: 'Subir precios', e: '🏷️', rar: 1, d: 'La palanca más rápida del EBITDA.', r: 'Las pymes con dueños mayores suelen cobrar por debajo de mercado. Sube poco y a menudo.' },
  gerente: { n: 'Gerente profesional', e: '🧑‍💼', rar: 2, d: 'Sustituir al dueño por alguien que gestiona.', r: 'Es lo que más sube el múltiplo: la empresa deja de depender de una persona.' },
  recurrencia: { n: 'Ingresos recurrentes', e: '🔁', rar: 2, d: 'Contratos que se renuevan solos: mantenimiento, cuotas, suscripciones.', r: 'Un euro recurrente vale más múltiplo que un euro de proyecto.', dato: 'Opinión de asesores: +0,5 a +1,5× si más del 60% de los ingresos es recurrente (López Advisory, 2026).' },
  cuadro_mando: { n: 'Cuadro de mando', e: '📊', rar: 2, d: 'Números mensuales fiables: ventas, margen, caja, cobros.', r: 'Empresa con números claros = empresa que se vende cara. Y destapa problemas escondidos.', dato: 'El Banco de España publica gratis los ratios por sector (Compara tu empresa): margen, días de cobro, ventas por empleado.' },
  socio_capital: { n: 'Socio capitalista', e: '💼', rar: 2, d: 'Albert pone el dinero; tú pones la operación. 75/25.', r: 'La confianza del socio se gana con informes puntuales y sin sorpresas.' },
  buy_and_build: { n: 'Buy & build', e: '🧱', rar: 4, d: 'Comprar varias pymes del mismo sector y juntarlas.', r: 'Ahorras costes, ganas tamaño y el conjunto se vende a más múltiplo que las piezas.' },
  carta_intenciones: { n: 'Carta de intenciones', e: '📩', rar: 1, d: 'Documento no vinculante con precio, estructura y exclusividad para hacer due diligence.', r: 'Fírmala antes de gastar dinero en abogados y auditores.', dato: 'Un buscador típico explora +3.000 empresas, habla con 159 dueños y firma unas 4 cartas de intenciones por compra (IESE, 2024).' }
};

// Palancas de operación (1 ⚡ cada una).
H.PALANCAS = {
  precios: { n: 'Subir precios', e: '🏷️', d: '+3-5% EBITDA. Si te pasas, se van clientes.', concepto: 'precios' },
  comercial: { n: 'Campaña comercial', e: '📞', d: 'Más clientes, menos dependencia del grande. Tú vendes.', concepto: 'concentracion' },
  gerente: { n: 'Contratar gerente', e: '🧑‍💼', d: 'Cuesta 35-65k €/año. La empresa deja de depender del dueño.', concepto: 'gerente', unica: true },
  automatizar: { n: 'Automatizar procesos', e: '🤖', d: '+0,6 puntos de margen. Tu especialidad.', concepto: 'ebitda', max: 3 },
  cuadro: { n: 'Cuadro de mando', e: '📊', d: 'Más múltiplo y destapa problemas escondidos.', concepto: 'cuadro_mando', max: 3 },
  recurrente: { n: 'Contratos de mantenimiento', e: '🔁', d: 'Convierte proyectos en cuotas. Más múltiplo.', concepto: 'recurrencia', max: 3 },
  vender: { n: 'Vender la empresa', e: '🏁', d: 'Pide ofertas. El múltiplo depende de lo que hayas arreglado.', concepto: 'arbitraje' }
};

// Mini-retos de venta en la campaña comercial (el punto débil de Sergi).
H.VENTAS = [
  { o: '«Ya tenemos proveedor y estamos contentos.»', ops: [
    { t: 'Perfecto. ¿Qué tendría que pasar para que os planteaseis un segundo proveedor?', ok: true, por: 'Abre la puerta sin atacar a su proveedor. Nadie quiere depender de uno solo.' },
    { t: 'Nosotros somos mejores y más baratos.', ok: false, por: 'Afirmar sin preguntar. No sabes qué le importa.' },
    { t: 'Vale, gracias, le dejo mi tarjeta.', ok: false, por: 'Te rindes a la primera. La primera objeción casi nunca es la de verdad.' }] },
  { o: '«Es muy caro.»', ops: [
    { t: 'Le hago un 10% de descuento.', ok: false, por: 'Bajas precio sin saber con qué te compara. Te acabas de comer el margen.' },
    { t: '¿Caro comparado con qué?', ok: true, por: 'Descubres su referencia antes de defender nada.' },
    { t: 'La calidad se paga.', ok: false, por: 'Frase hecha. No le ayuda a decidir.' }] },
  { o: '«Mándame información por email.»', ops: [
    { t: 'Claro, ¿a qué correo?', ok: false, por: 'El email de información es donde mueren las ventas.' },
    { t: 'Lo hago. Para mandarte lo que te sirve: ¿qué es lo que más te preocupa ahora mismo de tu proveedor?', ok: true, por: 'Aceptas, pero sacas información para que el email tenga sentido y haya siguiente paso.' },
    { t: 'Mejor te lo cuento ahora, son 5 minutos.', ok: false, por: 'Presionas sin haber creado interés.' }] },
  { o: '«Lo tengo que hablar con mi socio.»', ops: [
    { t: 'Normal. ¿Qué crees que te va a preguntar tu socio?', ok: true, por: 'Le ayudas a preparar la conversación y descubres las dudas reales.' },
    { t: '¿No puedes decidir tú?', ok: false, por: 'Le pones en evidencia. Se cierra.' },
    { t: 'Vale, te llamo la semana que viene.', ok: false, por: 'Sin fecha ni preparación, el socio dirá que no.' }] },
  { o: '«Ahora no es buen momento.»', ops: [
    { t: 'Entiendo. ¿Qué tiene que cambiar para que sea buen momento?', ok: true, por: 'Conviertes un "no" difuso en una condición concreta.' },
    { t: 'Es una oferta que acaba este mes.', ok: false, por: 'Urgencia falsa. Se nota.' },
    { t: '¿Cuándo te llamo?', ok: false, por: 'Sin entender el porqué, volverás a oír lo mismo.' }] },
  { o: '«¿Por qué cambiaría si lo de ahora funciona?»', ops: [
    { t: 'Porque lo nuestro es más moderno.', ok: false, por: 'Hablas de ti, no de él.' },
    { t: 'Quizá no debas. ¿Qué es lo que mejor y lo que peor te funciona hoy?', ok: true, por: 'Bajas la presión y le haces encontrar el problema él mismo.' },
    { t: 'Te garantizo que ahorrarás un 20%.', ok: false, por: 'Promesa sin diagnóstico. Desconfianza inmediata.' }] },
  { o: '«Mándame presupuesto y lo comparo.»', ops: [
    { t: 'Antes de mandarlo: ¿qué vas a mirar además del precio?', ok: true, por: 'Descubres sus criterios para no competir solo en precio.' },
    { t: 'Te lo mando hoy mismo.', ok: false, por: 'Te conviertes en una cifra más en una tabla.' },
    { t: 'No hacemos presupuestos sin reunión.', ok: false, por: 'Rígido. Pierdes la puerta.' }] },
  { o: '«Tuvimos una mala experiencia con alguien como vosotros.»', ops: [
    { t: 'Nosotros no somos así.', ok: false, por: 'Todos dicen lo mismo. No le das ninguna prueba.' },
    { t: 'Vaya. ¿Qué pasó exactamente?', ok: true, por: 'Escuchar la herida te dice exactamente qué tienes que garantizar.' },
    { t: 'Eso es mala suerte.', ok: false, por: 'Minimizas su problema.' }] }
];

// Eventos mensuales. cond(comp) decide si puede salir. Las opciones devuelven un efecto (ver engine).
H.EVENTOS = [
  { id: 'cliente_amenaza', riesgo: 'concentracion', e: '🎯', t: 'Tu cliente gordo pide un 15% de descuento o se va.', ops: [
    { t: 'Aceptar el descuento', ef: { ebitdaPct: -0.12 }, por: 'Sobrevives, pero pagas el riesgo que no cubriste al comprar.' },
    { t: 'Negociar: 5% a cambio de contrato a 3 años', ef: { ebitdaPct: -0.04, quitaRiesgo: true, xp: 30 }, por: 'Conviertes una amenaza en recurrencia. Bien jugado.' },
    { t: 'Que se vaya', ef: { ebitdaPct: -0.35, quitaRiesgo: true }, por: 'Se lleva un tercio del EBITDA. Esto es lo que vale la concentración.' }] },
  { id: 'clientes_dueno', riesgo: 'dependencia', e: '👑', t: 'Tres clientes llaman preguntando por el antiguo dueño y no conocen a nadie más.', ops: [
    { t: 'Pagar al antiguo dueño 3 meses de consultoría', ef: { cash: -30000, quitaRiesgo: true }, por: 'Lo que no pactaste al comprar, lo pagas ahora más caro.' },
    { t: 'Ir tú a visitarlos uno a uno', ef: { ebitdaPct: -0.06, quitaRiesgo: true, xp: 25 }, por: 'Salvas la relación, pierdes algo por el camino.' },
    { t: 'Ignorarlo', ef: { ebitdaPct: -0.22 }, por: 'Se van con la competencia.' }] },
  { id: 'inspeccion', riesgo: 'laboral', e: '🧑‍🔧', t: 'Inspección de trabajo: los "autónomos" son trabajadores. Hay sanción y cuotas atrasadas.', ops: [
    { t: 'Pagar y regularizar', ef: { cash: -85000, ebitdaPct: -0.05, quitaRiesgo: true }, por: 'Sin retención en la compra, esto sale de tu bolsillo.' },
    { t: 'Recurrir', ef: { cash: -110000, quitaRiesgo: true }, por: 'Abogados y, al final, pagas igual.' }] },
  { id: 'hacienda_req', riesgo: 'hacienda', e: '🏛️', t: 'Hacienda reclama el aplazamiento pendiente que nadie te enseñó.', ops: [
    { t: 'Pagar', ef: { cash: -70000, quitaRiesgo: true }, por: 'La deuda iba con la sociedad. Ahora es tuya.' }] },
  { id: 'impagos', riesgo: 'cobros', e: '👻', t: 'Las facturas viejas se dan por perdidas. Toca provisionar.', ops: [
    { t: 'Asumir la pérdida', ef: { cash: -55000, quitaRiesgo: true }, por: 'Pagaste por cobros que nunca iban a llegar.' }] },
  { id: 'stock_muerto', riesgo: 'stock', e: '📦', t: 'El almacén está lleno de material que ya nadie compra.', ops: [
    { t: 'Liquidarlo a saldo', ef: { cash: -40000, quitaRiesgo: true }, por: 'Lo que el balance decía que valía, no lo valía.' },
    { t: 'Guardarlo y esperar', ef: { ebitdaPct: -0.03 }, por: 'Ocupa sitio y cuesta dinero cada mes.' }] },
  { id: 'maquina', riesgo: 'capex', e: '🏚️', t: 'La máquina principal se rompe. Parada de producción.', ops: [
    { t: 'Comprar una nueva', ef: { cash: -150000, quitaRiesgo: true }, por: 'El capex que no descontaste del precio.' },
    { t: 'Repararla otra vez', ef: { cash: -35000, ebitdaPct: -0.08 }, por: 'Parche caro. Volverá a pasar.' }] },
  { id: 'rescision', riesgo: 'cambio_control', e: '📜', t: 'El cliente grande activa la cláusula de cambio de control y renegocia.', ops: [
    { t: 'Aceptar sus condiciones', ef: { ebitdaPct: -0.18, quitaRiesgo: true }, por: 'Tenía la sartén por el mango porque no pediste su firma antes.' },
    { t: 'Dejarle ir', ef: { ebitdaPct: -0.30, quitaRiesgo: true }, por: 'Te quedas sin el contrato grande.' }] },
  { id: 'alquiler', riesgo: 'local', e: '🏠', t: 'El antiguo dueño te sube el alquiler de la nave un 60%.', ops: [
    { t: 'Pagar', ef: { ebitdaPct: -0.07, quitaRiesgo: true }, por: 'Sin contrato largo, él manda.' },
    { t: 'Mudarse', ef: { cash: -90000, ebitdaPct: -0.03, quitaRiesgo: true }, por: 'Mudanza, obras y clientes despistados.' }] },
  { id: 'fraude_destapado', riesgo: 'fraude', e: '🕳️', t: 'El asesor nuevo te enseña la verdad: las ventas reales eran un 40% menores.', ops: [
    { t: 'Demandar al vendedor', ef: { ebitdaPct: -0.40, cash: -60000, quitaRiesgo: true, albert: -25 }, por: 'Años de juicio. Albert no está contento.' }] },
  { id: 'pico_cae', riesgo: 'pico', e: '🎢', t: 'El pedido gigante del año pasado no se repite.', ops: [
    { t: 'Asumirlo', ef: { ebitdaPct: -0.12, quitaRiesgo: true }, por: 'Pagaste múltiplo por algo que no se repetía.' }] },
  { id: 'caida', riesgo: 'tendencia', e: '📉', t: 'La caída de ventas sigue. La tendencia no era casualidad.', ops: [
    { t: 'Asumirlo', ef: { ebitdaPct: -0.13, quitaRiesgo: true }, por: 'Compraste al precio del mejor año.' }] },
  { id: 'maquillaje', riesgo: 'addbacks', e: '💄', t: 'Al cerrar el primer año, el EBITDA real sale bastante más bajo del que te vendieron.', ops: [
    { t: 'Asumirlo', ef: { ebitdaPct: -0.18, quitaRiesgo: true }, por: 'Los ajustes sin papeles eran humo.' }] },
  // Genéricos
  { id: 'clave_se_va', e: '🚪', t: 'Tu jefe de taller quiere irse a la competencia.', ops: [
    { t: 'Subirle un 15% y darle variable', ef: { ebitdaPct: -0.015, xp: 15 }, por: 'Las personas clave se retienen antes de que se vayan.' },
    { t: 'Dejarle ir', ef: { ebitdaPct: -0.06 }, por: 'Se lleva conocimiento y quizá algún cliente.' }] },
  { id: 'albert_reunion', e: '💼', t: 'Albert te pide el informe del trimestre para mañana.', ops: [
    { t: 'Mandar los números tal cual, también los malos', ef: { albert: 8, xp: 15 }, por: 'Sin sorpresas. Así se gana un socio capitalista.' },
    { t: 'Retrasarlo una semana', ef: { albert: -10 }, por: 'El silencio es lo que más preocupa a quien pone el dinero.' }] },
  { id: 'competidor_cierra', e: '🧱', t: 'Un competidor pequeño cierra y te ofrece su cartera de clientes por 40.000 €.', ops: [
    { t: 'Comprarla', ef: { cash: -40000, ebitdaPct: 0.08, xp: 25 }, por: 'Buy & build en pequeño: más clientes, mismos costes fijos.' },
    { t: 'Pasar', ef: {}, por: 'A veces la caja manda.' }] },
  { id: 'costes', e: '⛽', t: 'Suben los costes de energía y materiales un 8%.', ops: [
    { t: 'Repercutirlo en precios', ef: { ebitdaPct: -0.01, xp: 10 }, por: 'Si lo explicas bien, el cliente lo entiende.' },
    { t: 'Comérselo', ef: { ebitdaPct: -0.05 }, por: 'El margen lo pagas tú.' }] },
  { id: 'banco', e: '🏦', t: 'El banco te ofrece una línea de crédito barata para crecer.', ops: [
    { t: 'Aceptarla para tener colchón', ef: { cash: 80000, deuda: 80000 }, por: 'Colchón útil, pero es deuda.' },
    { t: 'No hace falta', ef: {}, por: 'Sin necesidad clara, mejor sin deuda.' }] },
  { id: 'equipo_moral', e: '🫂', t: 'El equipo está nervioso con el cambio de dueño.', ops: [
    { t: 'Reunión con todos y explicar el plan', ef: { ebitdaPct: 0.02, xp: 20 }, por: 'Plan de 100 días: primero la gente.' },
    { t: 'Seguir trabajando, ya se les pasará', ef: { ebitdaPct: -0.04 }, por: 'La incertidumbre se come la productividad.' }] }
];

H.NIVELES = ['Becario de M&A', 'Analista', 'Buscador de deals', 'Socio operativo', 'Operador serial', 'Constructor de holding', 'Family office', 'Leyenda de las pymes'];

// Objetivos: la barra de arriba siempre dice qué hacer ahora.
H.MISIONES = [
  { id: 'm1', t: 'Revisa tu primer deal', pista: 'Habla con LA BRÓKER en la plaza (sigue la flecha ▼)', ir: 'deals', ok: function (s) { return s.stats.vistos >= 1; }, xp: 40 },
  { id: 'm2', t: 'Encuentra una bandera roja', pista: 'Habla con un dueño en su puerta y pulsa 🔎 ANALIZAR', ir: 'deals', ok: function (s) { return s.stats.banderas >= 1; }, xp: 60 },
  { id: 'm3', t: 'Descubre por qué vende un dueño', pista: 'Negociando: 👂 PREGUNTAR → ¿Por qué vendes?', ir: 'deals', ok: function (s) { return s.stats.motivos >= 1; }, xp: 60 },
  { id: 'm4', t: 'Compra tu primera empresa', pista: 'Sube su CONFIANZA hasta la marca FIRMA y propón cierre', ir: 'deals', ok: function (s) { return s.empresas.length + s.stats.ventas >= 1; }, xp: 150 },
  { id: 'm5', t: 'Usa una palanca en tu empresa', pista: 'Entra en tu empresa (la de la bandera amarilla)', ir: 'cartera', ok: function (s) { return s.stats.palancas >= 1; }, xp: 60 },
  { id: 'm6', t: 'Completa el Ojo clínico de hoy', pista: 'Entra en el gimnasio OJO CLÍNICO (cúpula morada)', ir: 'reto', ok: function (s) { return s.stats.retos >= 1; }, xp: 80 },
  { id: 'm7', t: 'Levántate de un deal con trampa', pista: 'Si un deal huele mal: 💶 OFERTA → 🚪 Levantarse', ir: 'deals', ok: function (s) { return s.stats.irse >= 1; }, xp: 120 },
  { id: 'm16', t: 'Destapa a un vendedor que miente', pista: 'Si una reacción no encaja: 👂 → Repreguntar', ir: 'deals', ok: function (s) { return (s.stats.verdades || 0) >= 1; }, xp: 150 },
  { id: 'm17', t: 'Gana a otro comprador sin subir el precio', pista: 'Cuando aparezca 🦈, compite en lo que le importa', ir: 'deals', ok: function (s) { return (s.stats.rivales || 0) >= 1; }, xp: 150 },
  { id: 'm8', t: 'Ten 2 empresas a la vez', pista: 'Compra otra. Albert tiene fondos', ir: 'deals', ok: function (s) { return s.empresas.length >= 2; }, xp: 200 },
  { id: 'm9', t: 'Contrata un gerente', pista: 'Palanca 🧑‍💼 dentro de una de tus empresas', ir: 'cartera', ok: function (s) { return s.stats.gerentes >= 1; }, xp: 120 },
  { id: 'm10', t: 'Vende una empresa con beneficio', pista: 'Palanca 🏁 cuando el múltiplo haya subido', ir: 'cartera', ok: function (s) { return s.stats.exitosBuenos >= 1; }, xp: 300 },
  { id: 'm11', t: 'Colecciona 20 cartas del Códex', pista: 'Analiza, negocia y habla con los vecinos del pueblo', ir: 'codex', ok: function (s) { return Object.keys(s.codex).length >= 20; }, xp: 250 },
  { id: 'm12', t: 'Racha de 7 días', pista: 'Entrena en el OJO CLÍNICO cada día', ir: 'reto', ok: function (s) { return s.racha >= 7; }, xp: 400 },
  { id: 'm13', t: 'Tu parte supera 250.000 €', pista: 'Compra barato, arregla, vende caro', ir: 'cartera', ok: function (s) { return s.tuParte >= 250000; }, xp: 500 },
  { id: 'm14', t: 'Holding de 4 empresas', pista: 'Constructor de holding', ir: 'deals', ok: function (s) { return s.empresas.length >= 4; }, xp: 600 },
  { id: 'm15', t: 'Tu parte supera 1 millón', pista: 'Arbitraje de múltiplo a lo grande', ir: 'cartera', ok: function (s) { return s.tuParte >= 1000000; }, xp: 1500 }
];

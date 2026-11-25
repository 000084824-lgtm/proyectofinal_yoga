/* ECO WELLNESS LAB — FUNCIONES SENCILLAS PARA RESERVACIONES */
/* CAMBIAR AQUÍ EL NÚMERO DE WHATSAPP. No pongas + ni espacios. */
const telefono = '527779071887';
const tarjetas = [...document.querySelectorAll('.tarjeta')];
const ventanaDetalle = document.getElementById('detalle');
const ventanaReserva = document.getElementById('reserva');
let experienciaActual = null;
let personasActuales = 1;

function texto(id, contenido) { document.getElementById(id).textContent = contenido; }
function dinero(valor) { return '$' + Number(valor).toLocaleString('es-MX') + ' MXN'; }
function fechaLegible(fecha) { return new Date(fecha + 'T12:00:00').toLocaleDateString('es-MX', {day:'numeric',month:'long',year:'numeric'}); }
function mensajeWhatsApp(mensaje) { return 'https://wa.me/' + telefono + '?text=' + encodeURIComponent(mensaje); }
function datos(id) { const tarjeta = document.querySelector('.tarjeta[data-id="' + id + '"]'); return tarjeta ? tarjeta.dataset : null; }
function esAnterior(e) {
  const fecha = new Date(e.fecha + 'T23:59:59');
  return e.archivo === 'true' || (Number.isFinite(fecha.getTime()) && fecha < new Date());
}
function habilitada(e) {
  return !esAnterior(e) && !!e.fecha && Number.isFinite(new Date(e.fecha + 'T12:00:00').getTime()) && e.cupos !== '' && Number.isFinite(Number(e.cupos)) && Number(e.cupos) >= 0;
}
function estado(e) { return Number(e.cupos) === 0 ? 'Lista de espera' : Number(e.cupos) <= 3 ? 'Últimos lugares' : 'Disponible'; }
function avisar(evento, nombre) { if(typeof window.dataLayer !== 'undefined') window.dataLayer.push({event:evento, experiencia:nombre||''}); }

/* Abre una ventana con información de la experiencia. */
function verDetalles(id) {
  const e = datos(id); if (!e) return;
  experienciaActual = e;
  document.getElementById('detalle-imagen').src = e.imagen;
  document.getElementById('detalle-imagen').alt = 'Imagen de ' + e.nombre;
  ventanaDetalle.classList.toggle('detalle-archivo', esAnterior(e));
  texto('detalle-tipo', e.tipo + (esAnterior(e) ? ' · Edición anterior' : ''));
  texto('detalle-titulo', e.nombre);
  texto('detalle-descripcion', e.descripcion);
  texto('detalle-fecha', (e.fechaTexto || fechaLegible(e.fecha)) + ' · ' + e.inicio + (e.fin ? ' a ' + e.fin : ''));
  texto('detalle-lugar', e.lugar);
  texto('detalle-nivel', e.nivel);
  texto('detalle-incluye', e.incluye);
  texto('detalle-traer', e.traer);
  texto('detalle-precio', e.precio ? dinero(e.precio) : 'No indicado');
  document.getElementById('detalle-reservar').hidden = !habilitada(e);
  document.getElementById('detalle-comunidad').hidden = habilitada(e);
  texto('detalle-reservar', Number(e.cupos) === 0 ? 'Quiero entrar a lista de espera' : 'Reservar esta experiencia');
  avisar('view_experiencia',e.nombre);
  ventanaDetalle.showModal();
}

/* Abre el formulario de demostración; con 0 cupos abre lista de espera. */
function reservar(id) {
  const e = datos(id); if (!e || !habilitada(e)) return;
  experienciaActual = e;
  if (ventanaDetalle.open) ventanaDetalle.close();
  if (e.archivo !== 'true' && e.cupos !== '' && Number(e.cupos) === 0) {
    avisar('click_whatsapp',e.nombre);
    window.location.href = mensajeWhatsApp('Hola ECO, quiero entrar a la lista de espera de ' + e.nombre + ' del ' + fechaLegible(e.fecha) + '.');
    return;
  }
  avisar('click_reservar',e.nombre);
  texto('reserva-titulo', e.nombre);
  texto('reserva-experiencia', e.archivo === 'true' ? 'Próxima edición: fecha por confirmar' : fechaLegible(e.fecha) + ' · ' + e.inicio + (e.fin ? ' a ' + e.fin : ''));
  texto('reserva-lugar', e.lugar);
  texto('precio-persona', e.precio ? dinero(e.precio) + ' por persona' : 'Precio por confirmar con ECO.');
  document.querySelector('.guardar-fecha').open = false;
  const tieneFecha = e.archivo !== 'true' && !!e.fecha && !!e.inicio && !!e.fin;
  document.querySelector('.calendario-opciones').hidden = !tieneFecha;
  document.getElementById('calendario-pendiente').hidden = tieneFecha;
  if (tieneFecha) prepararCalendario(e);
  document.getElementById('formulario').reset();
  actualizarTotal();
  ventanaReserva.showModal();
}
function actualizarTotal() {
  if (!experienciaActual) return;
  personasActuales = Number(document.getElementById('asistentes').value);
  texto('total', experienciaActual.precio ? dinero(experienciaActual.precio * personasActuales) : 'Por confirmar');
}


/* Conecta los botones con las ventanas. */
document.querySelectorAll('[data-detalles]').forEach(b => b.addEventListener('click', () => verDetalles(b.dataset.detalles)));
document.querySelectorAll('[data-reservar]').forEach(b => b.addEventListener('click', () => reservar(b.dataset.reservar)));
document.getElementById('detalle-reservar').addEventListener('click', () => reservar(experienciaActual.id));
document.getElementById('detalle-enlace-comunidad').addEventListener('click', () => ventanaDetalle.close());
document.getElementById('asistentes').addEventListener('change', actualizarTotal);
document.querySelectorAll('[data-cerrar]').forEach(b => b.addEventListener('click', () => b.closest('dialog').close()));
document.querySelectorAll('dialog').forEach(dialogo => dialogo.addEventListener('click', event => { if (event.target === dialogo) dialogo.close(); }));

/* Solicitud directa: WhatsApp abre un mensaje, el usuario debe enviarlo. */
document.getElementById('formulario').addEventListener('submit', event => {
  event.preventDefault();
  const e = experienciaActual;
  const nombre = document.getElementById('nombre').value.trim();
  if (!e || !habilitada(e) || Number(e.cupos) === 0 || !nombre) return;
  actualizarTotal();
  const mensaje = ['Hola ECO, me gustaría consultar disponibilidad para una experiencia.',
    'Nombre: ' + nombre, 'Experiencia: ' + e.nombre,
    'Fecha: ' + (e.archivo === 'true' ? 'Próxima edición por confirmar' : fechaLegible(e.fecha)), 'Horario: ' + (e.archivo === 'true' ? 'Por confirmar' : e.inicio + (e.fin ? ' a ' + e.fin : '')),
    'Lugar: ' + e.lugar, 'Asistentes: ' + personasActuales,
    'Total: ' + (e.precio ? dinero(e.precio * personasActuales) : 'Por confirmar'),
    'Solicitud de demostración. Quedo pendiente de confirmación.'].join('\n');
  avisar('click_whatsapp', e.nombre);
  window.open(mensajeWhatsApp(mensaje), '_blank', 'noopener,noreferrer');
});

function prepararCalendario(e) {
  const inicio = e.fecha.replaceAll('-', '') + 'T' + e.inicio.replace(':', '') + '00';
  const fin = e.fecha.replaceAll('-', '') + 'T' + e.fin.replace(':', '') + '00';
  document.getElementById('enlace-google').href = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent('ECO (demo): ' + e.nombre) + '&dates=' + inicio + '/' + fin + '&ctz=America%2FMexico_City&location=' + encodeURIComponent(e.lugar) + '&details=' + encodeURIComponent('Fecha ilustrativa. No confirma una reservación.');
}

/* Crea archivo de calendario, compatible con iPhone y Android. */
function escaparCalendario(s) { return String(s).replaceAll('\\','\\\\').replaceAll(',','\\,').replaceAll(';','\\;').replaceAll('\n','\\n'); }
document.getElementById('descargar-calendario').addEventListener('click', () => {
  const e = experienciaActual;
  if (!e || e.archivo === 'true' || !e.fecha || !e.inicio || !e.fin) return;
  const inicio = e.fecha.replaceAll('-', '') + 'T' + e.inicio.replace(':', '') + '00';
  const fin = e.fecha.replaceAll('-', '') + 'T' + e.fin.replace(':', '') + '00';
  const contenido = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//ECO Wellness Lab//Prototipo ES//','BEGIN:VEVENT','UID:eco-' + e.id + '-' + e.fecha + '@demo.local','DTSTAMP:' + new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,''),'DTSTART;TZID=America/Mexico_City:' + inicio,'DTEND;TZID=America/Mexico_City:' + fin,'SUMMARY:' + escaparCalendario('ECO (demo): ' + e.nombre),'LOCATION:' + escaparCalendario(e.lugar),'DESCRIPTION:' + escaparCalendario('Evento ilustrativo. Consulta y confirma tu lugar con ECO.'),'END:VEVENT','END:VCALENDAR'].join('\r\n');
  const url = URL.createObjectURL(new Blob([contenido], {type:'text/calendar;charset=utf-8'}));
  const a = document.createElement('a'); a.href = url; a.download = 'eco-experiencia.ics'; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
});

/* Fechas pasadas y cupos: se actualizan automáticamente. */
tarjetas.forEach(tarjeta => {
  const e = tarjeta.dataset;
  const boton = tarjeta.querySelector('[data-reservar]');
  boton.hidden = !habilitada(e);
  tarjeta.querySelector('.estado').textContent = esAnterior(e) ? 'Edición anterior' : habilitada(e) ? estado(e) : 'Por confirmar';
  boton.textContent = Number(e.cupos) === 0 ? 'Lista de espera' : 'Reservar';
});
document.getElementById('sin-eventos').hidden = tarjetas.some(t => habilitada(t.dataset));

/* Menú móvil. */
const menu = document.getElementById('menu');
const botonMenu = document.getElementById('abrir-menu');
botonMenu.addEventListener('click', () => {
  const abierto = menu.classList.toggle('abierto');
  botonMenu.setAttribute('aria-expanded', String(abierto));
});
menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  menu.classList.remove('abierto'); botonMenu.setAttribute('aria-expanded', 'false');
}));

/* Botón de reserva fijo solo en móvil, fuera de experiencias y footer. */
const barraMovil = document.getElementById('barra-movil');
function mostrarBarra() {
  const experiencias = document.getElementById('experiencias').getBoundingClientRect();
  const pie = document.querySelector('.pie').getBoundingClientRect();
  const despuesDeInicio = document.getElementById('que-es').getBoundingClientRect().top < window.innerHeight;
  barraMovil.classList.toggle('visible', despuesDeInicio && experiencias.bottom < 0 && pie.top > window.innerHeight);
}
window.addEventListener('scroll', mostrarBarra, {passive:true});
window.addEventListener('resize', mostrarBarra);
mostrarBarra();

/* Marca clics de comunidad y apertura de preguntas si se instala analítica después. */
document.getElementById('enlace-comunidad').addEventListener('click', () => avisar('join_comunidad',''));
document.querySelectorAll('.faq-lista details').forEach(d => d.addEventListener('toggle', () => { if(d.open) avisar('faq_open',d.querySelector('summary').textContent); }));

/* 16. CARRUSEL DE OPINIONES: SOLO CAMBIA LOS TEXTOS DE ESTE ARREGLO. */
/* IMPORTANTE: SON EJEMPLOS FICTICIOS, NO OPINIONES REALES DE ECO. */
const opiniones = [
  { frase:'Fue un momento para desconectarme del ritmo de la semana y disfrutar algo diferente.', nombre:'Alejandra', actividad:'Micro retiro · Texto ficticio' },
  { frase:'Me gustó compartir una actividad nueva y tomarme unas horas sin tantas prisas.', nombre:'Romina', actividad:'Experiencia de movimiento · Texto ficticio' },
  { frase:'Me encantó la experiencia.', nombre:'Paola', actividad:'Encuentro ECO · Texto ficticio' }
];
let opinionActual = 0;
function mostrarOpinion(numero) {
  opinionActual = (numero + opiniones.length) % opiniones.length;
  const opinion = opiniones[opinionActual];
  document.getElementById('opinion-frase').textContent = '“' + opinion.frase + '”';
  document.getElementById('opinion-nombre').textContent = opinion.nombre;
  document.getElementById('opinion-actividad').textContent = opinion.actividad;
  document.getElementById('opinion-contador').textContent = (opinionActual + 1) + ' de ' + opiniones.length;
  document.querySelectorAll('[data-opinion]').forEach(boton => {
    const activo = Number(boton.dataset.opinion) === opinionActual;
    boton.classList.toggle('activo', activo);
    if (activo) boton.setAttribute('aria-current','true');
    else boton.removeAttribute('aria-current');
  });
}
document.getElementById('opinion-anterior').addEventListener('click', () => mostrarOpinion(opinionActual - 1));
document.getElementById('opinion-siguiente').addEventListener('click', () => mostrarOpinion(opinionActual + 1));
document.querySelectorAll('[data-opinion]').forEach(boton => boton.addEventListener('click', () => mostrarOpinion(Number(boton.dataset.opinion))));
mostrarOpinion(0);

/* Carrusel de experiencias: funciona con 3, 4 o más tarjetas, y con el dedo en móvil. */
const carruselExperiencias = document.getElementById('carrusel-experiencias');
const flechaAnteriorExperiencias = document.getElementById('experiencias-anterior');
const flechaSiguienteExperiencias = document.getElementById('experiencias-siguiente');
function actualizarFlechasExperiencias() {
  if (!carruselExperiencias) return;
  const maximo = carruselExperiencias.scrollWidth - carruselExperiencias.clientWidth;
  flechaAnteriorExperiencias.disabled = carruselExperiencias.scrollLeft <= 3;
  flechaSiguienteExperiencias.disabled = carruselExperiencias.scrollLeft >= maximo - 3;
}
function moverExperiencias(direccion) {
  const primera = carruselExperiencias.querySelector('.tarjeta:not([hidden])');
  if (!primera) return;
  const distancia = primera.getBoundingClientRect().width + 20;
  carruselExperiencias.scrollBy({left: direccion * distancia, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
}
if (carruselExperiencias) {
  flechaAnteriorExperiencias.addEventListener('click', () => moverExperiencias(-1));
  flechaSiguienteExperiencias.addEventListener('click', () => moverExperiencias(1));
  carruselExperiencias.addEventListener('scroll', actualizarFlechasExperiencias, {passive:true});
  window.addEventListener('resize', actualizarFlechasExperiencias);
  actualizarFlechasExperiencias();
}

// Indicadores interactivos de los dos carruseles.
(()=>{const track=document.getElementById('carrusel-experiencias'), dots=document.getElementById('experiencias-puntos');const cards=[...track.querySelectorAll('.tarjeta:not([hidden])')];function sync(){const max=track.scrollWidth-track.clientWidth;const offsets=cards.map(c=>Math.min(max,c.offsetLeft-cards[0].offsetLeft));let best=0;offsets.forEach((v,i)=>{if(Math.abs(v-track.scrollLeft)<Math.abs(offsets[best]-track.scrollLeft))best=i});[...dots.children].forEach((b,i)=>b.setAttribute('aria-current',String(i===best)));}function build(){dots.replaceChildren();const max=track.scrollWidth-track.clientWidth;let last=-1;cards.forEach((c,i)=>{const x=Math.min(max,c.offsetLeft-cards[0].offsetLeft);if(x<=last+1)return;last=x;const b=document.createElement('button');b.type='button';b.setAttribute('aria-label','Ver experiencia '+(i+1));b.onclick=()=>track.scrollTo({left:x,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});dots.append(b)});sync()}track.addEventListener('scroll',sync,{passive:true});window.addEventListener('resize',build);build();})();
// Arrastre de experiencias con ratón; en móvil se usa el desplazamiento nativo.
(()=>{const el=document.getElementById('carrusel-experiencias');let start,left,drag=false;el.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse'||e.button!==0||e.target.closest('button,a'))return;start=e.clientX;left=el.scrollLeft;drag=false;el.setPointerCapture(e.pointerId)});el.addEventListener('pointermove',e=>{if(start===undefined)return;if(Math.abs(e.clientX-start)>6){drag=true;el.classList.add('arrastrando');el.scrollLeft=left+start-e.clientX}});function fin(){start=undefined;el.classList.remove('arrastrando')}el.addEventListener('pointerup',fin);el.addEventListener('pointercancel',fin);el.addEventListener('dragstart',e=>e.preventDefault());el.addEventListener('click',e=>{if(drag){e.preventDefault();e.stopPropagation();drag=false}},true)})();

// Recuerdos apilados: arrastre, teclado y avance automático.
(() => {
 const stack=document.querySelector('.eco-fotos'), next=document.querySelector('.eco-avanzar');
 if(!stack || !next) return;
 const fotos=[...stack.querySelectorAll('img')]; let actual=0, inicio=null, timer;
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 function pintar(){fotos.forEach((foto,i)=>{const pos=(i-actual+fotos.length)%fotos.length;foto.dataset.pos=pos;foto.setAttribute('aria-hidden',String(pos!==0));});}
 function mover(dir=1){actual=(actual+dir+fotos.length)%fotos.length;pintar();}
 function parar(){clearInterval(timer);}
 function iniciar(){parar();if(!reduce.matches&&!document.hidden&&!stack.matches(':hover')&&!stack.parentElement.contains(document.activeElement))timer=setInterval(()=>mover(),5000);}
 stack.addEventListener('pointerdown',e=>{if(e.button!==0)return;parar();inicio=e.clientX;stack.setPointerCapture(e.pointerId);});
 stack.addEventListener('pointermove',e=>{if(inicio!==null)stack.style.setProperty('--drag',Math.max(-70,Math.min(70,e.clientX-inicio))+'px');});
 function terminar(e){if(inicio===null)return;const dx=e.clientX-inicio;inicio=null;stack.style.setProperty('--drag','0px');if(Math.abs(dx)>35)mover(dx<0?1:-1);iniciar();}
 stack.addEventListener('pointerup',terminar);stack.addEventListener('pointercancel',()=>{inicio=null;stack.style.setProperty('--drag','0px');iniciar();});
 stack.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();mover(e.key==='ArrowRight'?1:-1);}});
 next.addEventListener('click',()=>mover());stack.addEventListener('mouseenter',parar);stack.addEventListener('mouseleave',iniciar);stack.parentElement.addEventListener('focusin',parar);stack.parentElement.addEventListener('focusout',()=>setTimeout(iniciar,0));document.addEventListener('visibilitychange',iniciar);reduce.addEventListener('change',iniciar);pintar();iniciar();
})();

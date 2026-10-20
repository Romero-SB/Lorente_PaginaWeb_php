import { router } from '@inertiajs/react';

const cargadores = import.meta.glob('../Pages/Panel/*.jsx');

const PAGINA_POR_CLAVE = {
    resumen: 'Resumen',
    noticias: 'Noticias',
    docentes: 'Docentes',
    documentos: 'Documentos',
    mensajes: 'Mensajes',
    historial: 'Historial',
    cuentas: 'Cuentas',
    configuracion: 'Configuracion',
    perfil: 'Perfil',
};

const CACHE_FOR = [60_000, 5 * 60_000];
const RETARDO_ESCALON = 90;

const paginasCargadas = new Set();
const rutasPrefijadas = new Set();

function enTiempoLibre(tarea) {
    if (typeof window === 'undefined') return;

    if (typeof window.requestIdleCallback === 'function') {
        window.requestIdleCallback(tarea, { timeout: 2500 });
    } else {
        window.setTimeout(tarea, 300);
    }
}

function conexion() {
    if (typeof navigator === 'undefined') return null;

    return navigator.connection || navigator.mozConnection || navigator.webkitConnection || null;
}

/**
 * Ahorro de datos o redes lentas (2G/3G): no calentamos todo por adelantado
 * para no retrasar la primera carga; hover/click del enlace se encargan.
 */
function debeAhorrarDatos() {
    const c = conexion();
    if (!c) return false;

    return Boolean(c.saveData) || /^(slow-)?2g$|^3g$/.test(String(c.effectiveType || ''));
}

function cargarPagina(clave) {
    const nombre = PAGINA_POR_CLAVE[clave];
    if (!nombre || paginasCargadas.has(nombre)) return;

    const cargar = cargadores[`../Pages/Panel/${nombre}.jsx`];
    if (typeof cargar !== 'function') return;

    paginasCargadas.add(nombre);
    cargar().catch(() => {});
}

function prefijarDatos(ruta) {
    if (!ruta || rutasPrefijadas.has(ruta)) return;

    rutasPrefijadas.add(ruta);
    router.prefetch(ruta, {}, { cacheFor: CACHE_FOR });
}

/**
 * Precalienta el panel en segundo plano: descarga los chunks de las páginas
 * accesibles y precarga sus respuestas para que el cambio entre secciones sea
 * inmediato. Solo se usa lo que el usuario puede ver (viene filtrado por rol).
 *
 * Se ejecuta en tiempo libre y escalona las descargas para no saturar la red
 * ni bloquear el primer render, especialmente en móvil.
 */
export function precargarPanel(secciones = []) {
    const lista = secciones.filter((s) => s?.clave && s?.ruta);
    if (lista.length === 0 || debeAhorrarDatos()) return;

    enTiempoLibre(() => {
        let retardo = 0;

        lista.forEach((seccion) => {
            window.setTimeout(() => {
                cargarPagina(seccion.clave);
                prefijarDatos(seccion.ruta);
            }, retardo);

            retardo += RETARDO_ESCALON;
        });
    });
}

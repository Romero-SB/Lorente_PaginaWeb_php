const CLAVE = 'lorente_panel_borrador';

let saver = null;

export function registerDraftSaver(fn) {
    saver = fn;
}

export function guardarBorrador() {
    if (!saver) return null;
    try {
        const captura = saver();
        if (captura) localStorage.setItem(CLAVE, JSON.stringify(captura));
        return captura;
    } catch {
        return null;
    }
}

export function restaurarBorrador() {
    try {
        const crudo = localStorage.getItem(CLAVE);
        return crudo ? JSON.parse(crudo) : null;
    } catch {
        return null;
    }
}

export function limpiarBorrador() {
    try {
        localStorage.removeItem(CLAVE);
    } catch {}
}
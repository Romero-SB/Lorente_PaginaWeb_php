import { router } from '@inertiajs/react';

export const EVENTO_MINIMIZAR_PANEL = 'lorente-panel-minimizar';

function desplazar(id) {
    const el = document.getElementById(id);
    if (!el) return false;

    const y = el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: y, behavior: 'instant' });
    return true;
}

function panelAbierto() {
    return document.querySelector('.panel-capa') !== null;
}

function esperarSeccion(id, intentos = 60) {
    return new Promise((resolver) => {
        const buscar = (restantes) => {
            if (desplazar(id)) {
                resolver(true);
                return;
            }

            if (restantes <= 0) {
                resolver(false);
                return;
            }

            requestAnimationFrame(() => buscar(restantes - 1));
        };

        buscar(intentos);
    });
}

export function irASeccion(id) {
    if (desplazar(id)) return;

    if (panelAbierto()) {
        window.dispatchEvent(new CustomEvent(EVENTO_MINIMIZAR_PANEL));
        esperarSeccion(id);
        return;
    }

    router.visit('/', {
        onSuccess: () => {
            requestAnimationFrame(() => desplazar(id));
        },
    });
}

import { router } from '@inertiajs/react';

function desplazar(id) {
    const el = document.getElementById(id);
    if (!el) return false;

    const y = el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: y, behavior: 'instant' });
    return true;
}

export function irASeccion(id) {
    if (desplazar(id)) return;

    router.visit('/', {
        onSuccess: () => {
            requestAnimationFrame(() => desplazar(id));
        },
    });
}

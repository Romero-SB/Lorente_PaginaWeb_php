import { useEffect } from 'react';

let bloqueosScroll = 0;
let overflowPrevio = '';
let paddingDerechoPrevio = '';
let claseFondoPrevia = false;

const inertAplicados = new Map();

function aplicarInert(nodos) {
    nodos.forEach((nodo) => {
        const registro = inertAplicados.get(nodo);

        if (registro) {
            registro.cantidad += 1;
            return;
        }

        inertAplicados.set(nodo, {
            cantidad: 1,
            atributoPrevio: nodo.getAttribute('inert'),
        });
        nodo.setAttribute('inert', '');
        nodo.inert = true;
    });
}

function retirarInert(nodos) {
    nodos.forEach((nodo) => {
        const registro = inertAplicados.get(nodo);

        if (!registro) return;

        registro.cantidad -= 1;

        if (registro.cantidad > 0) return;

        inertAplicados.delete(nodo);

        if (registro.atributoPrevio === null) {
            nodo.removeAttribute('inert');
            nodo.inert = false;
        } else {
            nodo.setAttribute('inert', registro.atributoPrevio);
            nodo.inert = true;
        }
    });
}

function bloquearScroll() {
    if (typeof document === 'undefined') return;

    if (bloqueosScroll === 0) {
        overflowPrevio = document.body.style.overflow;
        paddingDerechoPrevio = document.body.style.paddingRight;
        claseFondoPrevia = document.body.classList.contains('fondo-bloqueado');

        const anchoScrollbar = window.innerWidth - document.documentElement.clientWidth;
        const paddingActual = parseFloat(window.getComputedStyle(document.body).paddingRight) || 0;

        document.body.style.overflow = 'hidden';
        document.body.style.paddingRight = `${paddingActual + anchoScrollbar}px`;
        document.body.classList.add('fondo-bloqueado');
    }

    bloqueosScroll += 1;
}

function liberarScroll() {
    if (typeof document === 'undefined') return;

    bloqueosScroll = Math.max(0, bloqueosScroll - 1);

    if (bloqueosScroll > 0) return;

    document.body.style.overflow = overflowPrevio;
    document.body.style.paddingRight = paddingDerechoPrevio;

    if (!claseFondoPrevia) {
        document.body.classList.remove('fondo-bloqueado');
    }
}

export function useBloqueoFondo(activo, selectores = []) {
    const claveSelectores = selectores.join('|');

    useEffect(() => {
        if (!activo || typeof document === 'undefined') return undefined;

        const nodos = claveSelectores
            .split('|')
            .filter(Boolean)
            .flatMap((selector) => Array.from(document.querySelectorAll(selector)));

        bloquearScroll();
        aplicarInert(nodos);

        return () => {
            retirarInert(nodos);
            liberarScroll();
        };
    }, [activo, claveSelectores]);
}

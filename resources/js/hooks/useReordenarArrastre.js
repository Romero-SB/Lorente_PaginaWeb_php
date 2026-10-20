import { useCallback, useEffect, useRef, useState } from 'react';

const MARGEN_SCROLL = 56;
const PASO_SCROLL = 14;

function contenedorDesplazable(elemento) {
    let padre = elemento?.parentElement;

    while (padre && padre !== document.body) {
        const estilo = window.getComputedStyle(padre);

        if (/(auto|scroll)/.test(estilo.overflowY) && padre.scrollHeight > padre.clientHeight + 1) {
            return padre;
        }

        padre = padre.parentElement;
    }

    return null;
}

/**
 * Reordenamiento por arrastre con Pointer Events (mouse, lápiz y táctil).
 *
 * El elemento arrastrado debe llevar `data-reordenar-indice` y, si el
 * reordenamiento está limitado a un grupo, `data-reordenar-grupo`.
 * El asa de arrastre debe llamar a `iniciar(evento, indice, grupo)` y tener
 * la clase `panel-agarre` (touch-action: none) para que no se mueva la página.
 *
 * @param {{ onSoltar: (desde: number, hasta: number, grupo: string|null) => void }} opciones
 */
export default function useReordenarArrastre({ onSoltar }) {
    const [origen, setOrigen] = useState(null);
    const [destino, setDestino] = useState(null);
    const arrastre = useRef(null);
    const alSoltar = useRef(onSoltar);

    useEffect(() => {
        alSoltar.current = onSoltar;
    }, [onSoltar]);

    const iniciar = useCallback((evento, indice, grupo = null) => {
        if (arrastre.current) return;
        if (evento.pointerType === 'mouse' && evento.button !== 0) return;

        if (evento.cancelable) evento.preventDefault();
        evento.stopPropagation();

        try {
            evento.currentTarget.setPointerCapture?.(evento.pointerId);
        } catch {
            /* noop */
        }

        arrastre.current = {
            pointerId: evento.pointerId,
            origen: indice,
            destino: indice,
            grupo,
            contenedor: contenedorDesplazable(evento.currentTarget),
        };

        setOrigen(indice);
        setDestino(indice);
        document.documentElement.classList.add('panel-arrastrando');
    }, []);

    useEffect(() => {
        function limpiar() {
            arrastre.current = null;
            setOrigen(null);
            setDestino(null);
            document.documentElement.classList.remove('panel-arrastrando');
        }

        function mover(evento) {
            const actual = arrastre.current;
            if (!actual || actual.pointerId !== evento.pointerId) return;

            if (evento.cancelable) evento.preventDefault();

            const bajo = document.elementFromPoint(evento.clientX, evento.clientY);
            const fila = bajo?.closest('[data-reordenar-indice]');

            if (fila) {
                const grupo = fila.getAttribute('data-reordenar-grupo') || null;

                if (grupo === actual.grupo) {
                    const indice = Number(fila.dataset.reordenarIndice);

                    if (!Number.isNaN(indice) && indice !== actual.destino) {
                        actual.destino = indice;
                        setDestino(indice);
                    }
                }
            }

            const cont = actual.contenedor;
            if (!cont) return;

            const caja = cont.getBoundingClientRect();
            if (evento.clientY < caja.top + MARGEN_SCROLL) {
                cont.scrollTop -= PASO_SCROLL;
            } else if (evento.clientY > caja.bottom - MARGEN_SCROLL) {
                cont.scrollTop += PASO_SCROLL;
            }
        }

        function terminar(evento) {
            const actual = arrastre.current;
            if (!actual || actual.pointerId !== evento.pointerId) return;

            const { origen, destino, grupo } = actual;
            limpiar();

            if (origen !== destino) {
                alSoltar.current(origen, destino, grupo);
            }
        }

        function cancelar(evento) {
            const actual = arrastre.current;
            if (!actual || actual.pointerId !== evento.pointerId) return;

            limpiar();
        }

        function abortar() {
            if (arrastre.current) limpiar();
        }

        window.addEventListener('pointermove', mover, { passive: false });
        window.addEventListener('pointerup', terminar);
        window.addEventListener('pointercancel', cancelar);
        window.addEventListener('blur', abortar);

        return () => {
            window.removeEventListener('pointermove', mover);
            window.removeEventListener('pointerup', terminar);
            window.removeEventListener('pointercancel', cancelar);
            window.removeEventListener('blur', abortar);
            arrastre.current = null;
            document.documentElement.classList.remove('panel-arrastrando');
        };
    }, []);

    return { origen, destino, iniciar };
}

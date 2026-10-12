import { useEffect, useRef } from 'react';

/**
 * Diálogo modal accesible: cierra con Escape o al pulsar el fondo, y atrapa el
 * foco (Tab) mientras el foco está dentro del panel.
 *
 * @param {object} props
 * @param {() => void} props.onCerrar Callback para cerrar el diálogo.
 * @param {string} [props.ariaLabel] Nombre accesible del diálogo.
 * @param {string} [props.ancho] Clase de ancho máximo (p. ej. `max-w-md`).
 * @param {string} [props.z] Clase de profundidad z (p. ej. `z-50`).
 * @param {import('react').ReactNode} props.children Contenido del diálogo.
 */
export default function Modal({ onCerrar, ariaLabel = 'Ventana', ancho = 'max-w-md', z = 'z-50', children }) {
    const ref = useRef(null);

    useEffect(() => {
        function onKey(e) {
            if (e.key === 'Escape') {
                e.stopPropagation();
                onCerrar();
                return;
            }
            if (e.key !== 'Tab') return;

            const panel = ref.current;
            if (!panel || !panel.contains(document.activeElement)) return;

            const focos = panel.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
            );
            if (!focos.length) return;

            const primero = focos[0];
            const ultimo = focos[focos.length - 1];
            if (e.shiftKey && document.activeElement === primero) {
                e.preventDefault();
                ultimo.focus();
            } else if (!e.shiftKey && document.activeElement === ultimo) {
                e.preventDefault();
                primero.focus();
            }
        }

        document.addEventListener('keydown', onKey, true);
        return () => document.removeEventListener('keydown', onKey, true);
    }, [onCerrar]);

    return (
        <div className={`fixed inset-0 ${z} grid place-items-center bg-slate-900/70 p-4`} onClick={onCerrar}>
            <div
                ref={ref}
                role="dialog"
                aria-modal="true"
                aria-label={ariaLabel}
                className={`w-full ${ancho} overflow-hidden rounded-2xl bg-white shadow-xl`}
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </div>
    );
}
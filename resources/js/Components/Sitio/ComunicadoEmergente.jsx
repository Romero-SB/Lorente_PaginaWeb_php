import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

const MAX_VISTAS = 5;
const CLAVE_VISTAS = (id) => `lorente-comunicado-vistas-${id}`;

// Guarda por carga completa de la página: evita contar dos veces en StrictMode
// y evita contar de nuevo cuando solo cambia la sección con Inertia.
const cargasContadas = new Set();

/**
 * Comunicado emergente de la página principal.
 * - Solo en el inicio y para visitantes sin sesión (el servidor no envía el dato a usuarios logueados).
 * - Máximo 5 veces por navegador: cada carga completa del inicio (incluido refrescar) cuenta una vez.
 */
export default function ComunicadoEmergente({ comunicado }) {
    const { url } = usePage();
    const esInicio = url === '/' || url.startsWith('/?');
    const id = comunicado?.id;
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (!id || !esInicio) {
            setVisible(false);
            return;
        }

        const clave = CLAVE_VISTAS(id);
        try {
            if (!cargasContadas.has(clave)) {
                cargasContadas.add(clave);
                const vistas = Number(localStorage.getItem(clave) || 0);
                if (vistas < MAX_VISTAS) {
                    localStorage.setItem(clave, String(vistas + 1));
                    setVisible(true);
                }
            }
        } catch {
            // Si el navegador bloquea el almacenamiento, no se muestra el comunicado.
        }
    }, [id, esInicio]);

    useEffect(() => {
        if (!visible) return;
        const onKey = (e) => {
            if (e.key === 'Escape') setVisible(false);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [visible]);

    if (!visible || !comunicado || !esInicio) return null;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label="Comunicado"
            className="fixed inset-0 z-[400] flex items-center justify-center bg-slate-900/80 p-4"
            onClick={() => setVisible(false)}
        >
            <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                    type="button"
                    onClick={() => setVisible(false)}
                    className="absolute -top-3 -right-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-white text-slate-700 shadow-lg transition hover:bg-slate-100"
                    aria-label="Cerrar comunicado"
                >
                    ✕
                </button>
                <img
                    src={comunicado.imagen_url}
                    alt="Comunicado de la I.E. N.º 31501 Sebastián Lorente"
                    className="block max-h-[85vh] w-auto max-w-full rounded-xl object-contain shadow-2xl"
                />
            </div>
        </div>
    );
}

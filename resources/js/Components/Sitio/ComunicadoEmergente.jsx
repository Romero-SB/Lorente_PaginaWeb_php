import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

const MAX_VISTAS = 5;
const CLAVE_VISTAS = (id) => `lorente-comunicado-vistas-${id}`;
const CLAVE_SESION = (id) => `lorente-comunicado-sesion-${id}`;

/**
 * Comunicado emergente de la página principal.
 * - Solo se muestra en el inicio ("/") y a visitantes sin sesión (el servidor no envía el dato a logueados).
 * - Se muestra como máximo 5 veces por navegador, contando una vez por sesión de pestaña.
 */
export default function ComunicadoEmergente({ comunicado }) {
    const { url } = usePage();
    const esInicio = url === '/' || url.startsWith('/?');
    const [visible, setVisible] = useState(false);
    const id = comunicado?.id;

    useEffect(() => {
        if (!id || !esInicio) {
            setVisible(false);
            return;
        }

        try {
            if (sessionStorage.getItem(CLAVE_SESION(id))) {
                setVisible(true);
                return;
            }

            const vistas = Number(localStorage.getItem(CLAVE_VISTAS(id)) || 0);
            if (vistas >= MAX_VISTAS) return;

            localStorage.setItem(CLAVE_VISTAS(id), String(vistas + 1));
            sessionStorage.setItem(CLAVE_SESION(id), '1');
            setVisible(true);
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

    const imagen = (
        <img
            src={comunicado.imagen_url}
            alt="Comunicado de la I.E. N.º 31501 Sebastián Lorente"
            className="block max-h-[85vh] w-auto max-w-full rounded-xl object-contain shadow-2xl"
        />
    );

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
                {comunicado.enlace ? (
                    <a href={comunicado.enlace} target="_blank" rel="noopener noreferrer" aria-label="Abrir comunicado">
                        {imagen}
                    </a>
                ) : (
                    imagen
                )}
            </div>
        </div>
    );
}

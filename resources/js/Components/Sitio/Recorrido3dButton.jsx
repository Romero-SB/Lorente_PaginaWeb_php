import { useEffect, useState } from 'react';

export default function Recorrido3dButton() {
    const [aviso, setAviso] = useState(false);

    useEffect(() => {
        if (!aviso) return undefined;
        const id = setTimeout(() => setAviso(false), 3200);
        return () => clearTimeout(id);
    }, [aviso]);

    return (
        <div className="recorrido-3d-wrap">
            <div className={`recorrido-3d-aviso ${aviso ? 'show' : ''}`} role="status" aria-live="polite">
                Recorrido 3D &mdash; pr&oacute;ximamente
            </div>
            <button
                type="button"
                className="recorrido-3d"
                onClick={() => setAviso(true)}
                aria-label="Ver recorrido 3D del colegio"
            >
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                >
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <path d="m3.3 7 8.7 5 8.7-5" />
                    <path d="M12 22V12" />
                </svg>
                Ver Recorrido 3D
            </button>
        </div>
    );
}

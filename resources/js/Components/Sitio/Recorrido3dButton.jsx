import { Link, usePage } from '@inertiajs/react';

export default function Recorrido3dButton() {
    const { url } = usePage();

    // Si ya estamos en la página del recorrido virtual, no mostrar el botón flotante
    if (url === '/recorrido' || (url && url.startsWith('/recorrido?'))) {
        return null;
    }

    return (
        <div className="recorrido-3d-wrap">
            <Link
                href="/recorrido"
                prefetch
                className="recorrido-3d"
                aria-label="Ver recorrido virtual 360° del colegio"
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
            </Link>
        </div>
    );
}
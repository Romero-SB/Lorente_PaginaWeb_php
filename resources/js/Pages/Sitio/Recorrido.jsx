import { Head, Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';

import '../../../css/recorrido.css';
import { TourViewer } from '../../virtual-tour/components/TourViewer';
import { useTour } from '../../virtual-tour/hooks/useTour';

export default function Recorrido() {
    const { tour, status, error } = useTour();
    const [activeSceneId, setActiveSceneId] = useState(null);
    const [mostrarAyuda, setMostrarAyuda] = useState(false);

    const currentScene = useMemo(() => {
        if (!tour) return null;
        return tour.scenes.find((s) => s.id === (activeSceneId ?? tour.startScene)) ?? tour.scenes[0];
    }, [tour, activeSceneId]);

    return (
        <div
            className="recorrido-page-root"
        >
            <Head title="Recorrido Virtual 360°">
                <meta
                    name="description"
                    content="Explora las instalaciones de la I.E. N° 31501 «Sebastián Lorente» en Huancayo a través de nuestro recorrido virtual 360° interactivo."
                />
                <meta property="og:type" content="website" />
                <meta property="og:title" content="Recorrido Virtual 360° · IE N° 31501 «Sebastián Lorente»" />
                <meta
                    property="og:description"
                    content="Conoce aulas, pasillos y ambientes del colegio Sebastián Lorente en una experiencia 360° inmersiva."
                />
                <meta property="og:image" content="/referencial.jpg" />
            </Head>

            {/* Barra Superior Institucional */}
            <header className="recorrido-header">
                {/* Lado izquierdo: Volver al sitio e insignia */}
                <div className="recorrido-header__brand">
                    <Link
                        href="/"
                        className="recorrido-header__back-link"
                        aria-label="Volver al portal"
                        title="Regresar a la página principal"
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="m15 18-6-6 6-6" />
                        </svg>
                        <span className="recorrido-header__back-label">Volver al portal</span>
                    </Link>

                    <div className="recorrido-header__identity">
                        <span style={{ fontWeight: 700, color: '#f6f4ef', letterSpacing: '0.3px' }}>
                            IE N° 31501
                        </span>
                        <span className="recorrido-header__school" style={{ fontSize: '0.85rem', color: '#c29a2b', fontWeight: 600 }}>
                            «Sebastián Lorente»
                        </span>
                    </div>
                </div>

                {/* Centro: Escena actual con icono de ubicación */}
                <div className="recorrido-header__scene">
                    <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#d9b45a"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                        <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span className="recorrido-header__scene-name">
                        {currentScene?.name ?? 'Recorrido Virtual'}
                    </span>
                </div>

                {/* Lado derecho: Botón de ayuda */}
                <div className="recorrido-header__actions">
                    <button
                        type="button"
                        onClick={() => setMostrarAyuda(!mostrarAyuda)}
                        className="recorrido-header__help"
                        aria-label="Cómo navegar el recorrido"
                    >
                        <svg
                            width="15"
                            height="15"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <circle cx="12" cy="12" r="10" />
                            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                            <path d="M12 17h.01" />
                        </svg>
                        <span className="recorrido-header__help-label">Cómo navegar</span>
                    </button>
                </div>
            </header>

            {/* Modal flotante de ayuda */}
            {mostrarAyuda && (
                <div
                    className="recorrido-help"
                >
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '10px',
                        }}
                    >
                        <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, color: '#d9b45a' }}>
                            Instrucciones 360°
                        </h4>
                        <button
                            type="button"
                            onClick={() => setMostrarAyuda(false)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#94a3b8',
                                fontSize: '18px',
                                cursor: 'pointer',
                                lineHeight: 1,
                            }}
                        >
                            &times;
                        </button>
                    </div>
                    <ul
                        style={{
                            margin: 0,
                            paddingLeft: '18px',
                            fontSize: '0.78rem',
                            lineHeight: '1.6',
                            color: '#cbd5e1',
                        }}
                    >
                        <li><strong>Girar:</strong> Haz clic y arrastra con el ratón o desliza el dedo.</li>
                        <li><strong>Avanzar:</strong> Haz clic en las flechas situadas en pasillos y accesos.</li>
                        <li><strong>Información:</strong> Toca los íconos dorados <strong>(i)</strong> para ver detalles.</li>
                        <li><strong>Zoom:</strong> Usa la rueda del ratón o el gesto de pellizco en pantalla táctil.</li>
                    </ul>
                </div>
            )}

            {/* Contenedor del visor principal */}
            <main
                className="recorrido-viewer"
            >
                {status === 'loading' && <LoadingScreen />}
                {status === 'error' && <ErrorScreen error={error} />}
                {status === 'success' && tour && (
                    <TourViewer tour={tour} onSceneChange={setActiveSceneId} />
                )}
            </main>
        </div>
    );
}

function LoadingScreen() {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                gap: '16px',
                color: '#d9b45a',
            }}
        >
            <div
                style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '9999px',
                    border: '3px solid rgba(194, 154, 43, 0.25)',
                    borderTopColor: '#c29a2b',
                    animation: 'spin 0.9s linear infinite',
                }}
            />
            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#f6f4ef', letterSpacing: '0.2px' }}>
                Cargando recorrido virtual 360°…
            </span>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

function ErrorScreen({ error }) {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                gap: '14px',
                padding: '24px',
                textAlign: 'center',
            }}
        >
            <div style={{ fontSize: '2.5rem' }}>⚠️</div>
            <h3 style={{ margin: 0, color: '#f87171', fontSize: '1.1rem', fontWeight: 700 }}>
                No se pudo cargar el recorrido
            </h3>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.84rem', maxWidth: '420px' }}>
                {error ?? 'Verifique la conexión o el archivo de configuración del recorrido virtual.'}
            </p>
            <Link
                href="/"
                style={{
                    marginTop: '8px',
                    padding: '8px 18px',
                    borderRadius: '8px',
                    backgroundColor: '#16265e',
                    border: '1px solid #c29a2b',
                    color: '#d9b45a',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                }}
            >
                Volver al inicio
            </Link>
        </div>
    );
}
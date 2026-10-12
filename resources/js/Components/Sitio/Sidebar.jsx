import { useEffect, useRef, useState } from 'react';

import { irASeccion } from '../../lib/sitio';

const MENU = [
    { id: 'inicio', label: 'Inicio', tipo: 'seccion' },
    { id: 'nosotros', label: 'Nosotros', tipo: 'seccion' },
    { id: 'noticias', label: 'Noticias', tipo: 'seccion' },
    { id: 'documentos', label: 'Documentos', tipo: 'seccion' },
    { id: 'contacto', label: 'Contacto', tipo: 'seccion' },
];

const SECCIONES = ['inicio', 'nosotros', 'noticias', 'documentos', 'contacto'];

const ICONOS = {
    inicio: (
        <>
            <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
            <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        </>
    ),
    nosotros: (
        <>
            <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
            <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
            <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
            <path d="M10 6h4" />
            <path d="M10 10h4" />
            <path d="M10 14h4" />
            <path d="M10 18h4" />
        </>
    ),
    noticias: (
        <>
            <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
            <path d="M18 14h-8" />
            <path d="M15 18h-5" />
            <path d="M10 6h8v4h-8Z" />
        </>
    ),
    documentos: (
        <path d="m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2" />
    ),
    contacto: (
        <>
            <rect width="20" height="16" x="2" y="4" rx="2" />
            <path d="m22 7-8.97 5.89a2 2 0 0 1-2.06 0L2 7" />
        </>
    ),
};

export default function Sidebar() {
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [activa, setActiva] = useState('inicio');
    const [mvListo, setMvListo] = useState(false);
    const modelRef = useRef(null);
    const logoRef = useRef(null);
    const velocityRef = useRef({ x: 0, y: 0 });
    const lastPosRef = useRef({ x: 0, y: 0 });
    const isInteractingRef = useRef(false);
    const resetTimeoutRef = useRef(null);
    const momentumTimeoutRef = useRef(null);

    useEffect(() => {
        if (mvListo) return;

        let cancelado = false;
        let observador = null;
        let temporizador = null;

        const cargar = () => {
            const importar = () =>
                import('@google/model-viewer')
                    .then(() => {
                        if (!cancelado) setMvListo(true);
                    })
                    .catch(() => {});

            if (typeof requestIdleCallback === 'function') {
                requestIdleCallback(importar, { timeout: 1200 });
            } else {
                importar();
            }
        };

        const alVer = () => {
            observador?.disconnect();
            if (temporizador) clearTimeout(temporizador);
            cargar();
        };

        if (typeof IntersectionObserver === 'undefined' || !logoRef.current) {
            cargar();
        } else {
            observador = new IntersectionObserver(
                (entradas) => {
                    if (entradas.some((e) => e.isIntersecting)) alVer();
                },
                { rootMargin: '240px' },
            );
            observador.observe(logoRef.current);
            temporizador = setTimeout(alVer, 2500);
        }

        return () => {
            cancelado = true;
            observador?.disconnect();
            if (temporizador) clearTimeout(temporizador);
        };
    }, [mvListo]);

    useEffect(() => {
        if (!mvListo) return;
        const model = modelRef.current;
        if (!model) return;

        const DEFAULT_ORBIT = '0deg 90deg 2.5m';
        const MOMENTUM_DECAY = 2.5;
        const MIN_VELOCITY = 0.1;

        const applyMomentum = () => {
            const { x, y } = velocityRef.current;

            if (Math.abs(x) < MIN_VELOCITY && Math.abs(y) < MIN_VELOCITY) {
                clearTimeout(resetTimeoutRef.current);
                resetTimeoutRef.current = setTimeout(() => {
                    model.cameraOrbit = DEFAULT_ORBIT;
                }, 3000);
                return;
            }

            velocityRef.current.x *= MOMENTUM_DECAY;
            velocityRef.current.y *= MOMENTUM_DECAY;

            try {
                const orbit = model.getCameraOrbit();
                const theta = orbit.theta.as('rad') + x * 0.01;
                const phi = Math.max(0.2, Math.min(Math.PI, orbit.phi.as('rad') + y * 0.01));

                model.cameraOrbit = `${theta}rad ${phi}rad ${orbit.radius.as('m')}m`;
            } catch {
                // El modelo aún no está listo
            }

            momentumTimeoutRef.current = requestAnimationFrame(applyMomentum);
        };

        const onPointerDown = (e) => {
            isInteractingRef.current = true;
            lastPosRef.current = { x: e.clientX, y: e.clientY };
            velocityRef.current = { x: 0, y: 0 };
            clearTimeout(resetTimeoutRef.current);
            clearTimeout(momentumTimeoutRef.current);
        };

        const onPointerMove = (e) => {
            if (!isInteractingRef.current) return;
            const dx = e.clientX - lastPosRef.current.x;
            const dy = e.clientY - lastPosRef.current.y;
            velocityRef.current = { x: dx, y: dy };
            lastPosRef.current = { x: e.clientX, y: e.clientY };
        };

        const onPointerUp = () => {
            isInteractingRef.current = false;
            clearTimeout(momentumTimeoutRef.current);
            applyMomentum();
        };

        const onWheel = (e) => e.preventDefault();
        const onTouchMove = (e) => {
            if (e.touches.length > 1) e.preventDefault();
        };

        model.addEventListener('wheel', onWheel, { passive: false });
        model.addEventListener('touchmove', onTouchMove, { passive: false });
        model.addEventListener('pointerdown', onPointerDown);
        model.addEventListener('pointermove', onPointerMove);
        model.addEventListener('pointerup', onPointerUp);
        model.addEventListener('pointerleave', onPointerUp);

        return () => {
            clearTimeout(resetTimeoutRef.current);
            clearTimeout(momentumTimeoutRef.current);
            model.removeEventListener('wheel', onWheel);
            model.removeEventListener('touchmove', onTouchMove);
            model.removeEventListener('pointerdown', onPointerDown);
            model.removeEventListener('pointermove', onPointerMove);
            model.removeEventListener('pointerup', onPointerUp);
            model.removeEventListener('pointerleave', onPointerUp);
        };
    }, [mvListo]);

    useEffect(() => {
        const esInicio = window.location.pathname === '/';

        if (!esInicio) {
            if (window.location.pathname.startsWith('/noticias')) setActiva('noticias');
            return;
        }

        const onScroll = () => {
            const umbral = window.innerHeight * 0.35;
            let actual = 'inicio';

            SECCIONES.forEach((id) => {
                const el = document.getElementById(id);
                if (el && el.getBoundingClientRect().top <= umbral) actual = id;
            });

            setActiva(actual);
        };

        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const navegar = (item) => {
        setShowMobileMenu(false);
        setActiva(item.id);
        irASeccion(item.id);
    };

    useEffect(() => {
        if (!showMobileMenu) return;

        const onKey = (e) => {
            if (e.key === 'Escape') setShowMobileMenu(false);
        };

        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [showMobileMenu]);

    return (
        <>
            <aside id="menu-lateral" className={`sidebar ${showMobileMenu ? 'mobile-open' : ''}`} aria-label="Menú principal">
                <button className="mobile-close" onClick={() => setShowMobileMenu(false)} aria-label="Cerrar menú">
                    ✕
                </button>
                <div className="sidebar-logo-container">
                    <div className="ne" ref={logoRef}>
                        <model-viewer
                            ref={modelRef}
                            src="/LOGASO.glb"
                            alt="Logo 3D"
                            loading="lazy"
                            camera-orbit="0deg 90deg 2.5m"
                            interaction-prompt="none"
                            camera-controls
                            auto-rotate
                            rotation-per-second="40deg"
                            style={{ width: '100%', height: '100%', touchAction: 'none' }}
                        />
                    </div>
                    <div className="nt-dorado">
                        IE N° 31501
                        <span>Sebastián Lorente</span>
                    </div>
                </div>

                <ul className="sidebar-menu">
                    {MENU.map((item) => (
                        <li key={item.id}>
                            <button
                                type="button"
                                className={`menu-item ${activa === item.id ? 'active' : ''}`}
                                onClick={() => navegar(item)}
                            >
                                <span className="menu-item-icono" aria-hidden="true">
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        {ICONOS[item.id]}
                                    </svg>
                                </span>
                                <span className="menu-item-texto">{item.label}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            </aside>

            <button
                className={`mobile-menu-btn ${showMobileMenu ? 'hidden' : ''}`}
                onClick={() => setShowMobileMenu(true)}
                aria-label="Abrir menú"
                aria-expanded={showMobileMenu}
                aria-controls="menu-lateral"
            >
                <span></span>
                <span></span>
                <span></span>
            </button>

            {showMobileMenu && <div className="mobile-overlay" onClick={() => setShowMobileMenu(false)} />}
        </>
    );
}

import { useEffect, useRef, useState } from 'react';

import { router, usePage } from '@inertiajs/react';

import { irASeccion } from '../../lib/sitio';

const MENU = [
    { id: 'inicio', icon: 'fa-solid fa-house', label: 'Inicio', tipo: 'seccion' },
    { id: 'nosotros', icon: 'fa-solid fa-building-columns', label: 'Nosotros', tipo: 'seccion' },
    { id: 'noticias', icon: 'fa-solid fa-newspaper', label: 'Noticias', tipo: 'seccion' },
    { id: 'documentos', icon: 'fa-solid fa-folder-open', label: 'Documentos', tipo: 'seccion' },
    { id: 'contacto', icon: 'fa-solid fa-envelope', label: 'Contacto', tipo: 'seccion' },
];

const SECCIONES = ['inicio', 'nosotros', 'noticias', 'documentos', 'contacto'];

export default function Sidebar() {
    const { auth } = usePage().props;
    const usuario = auth?.user;
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

    return (
        <>
            <aside className={`sidebar ${showMobileMenu ? 'mobile-open' : ''}`}>
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
                                <i className={item.icon}></i> {item.label}
                            </button>
                        </li>
                    ))}
                </ul>

                <div className="sidebar-footer">
                    {usuario && (
                        <button
                            type="button"
                            className="menu-item"
                            onClick={() => {
                                setShowMobileMenu(false);
                                router.visit('/lorente-panel');
                            }}
                        >
                            <i className="fa-solid fa-gauge-high"></i> Abrir panel
                        </button>
                    )}
                </div>
            </aside>

            <button
                className={`mobile-menu-btn ${showMobileMenu ? 'hidden' : ''}`}
                onClick={() => setShowMobileMenu(true)}
                aria-label="Abrir menú"
            >
                <span></span>
                <span></span>
                <span></span>
            </button>

            {showMobileMenu && <div className="mobile-overlay" onClick={() => setShowMobileMenu(false)} />}
        </>
    );
}

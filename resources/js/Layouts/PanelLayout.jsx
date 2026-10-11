import { Link, router, usePage } from '@inertiajs/react';
import { useEffect } from 'react';

import { Icono } from '../Components/Panel/Iconos';
import { Toasts } from '../Components/Panel/Toasts';
import SitioHome from '../Components/Sitio/SitioHome';
import { usePanelWindow } from '../hooks/usePanelWindow';
import { guardarBorrador, limpiarBorrador, restaurarBorrador } from '../lib/draft';
import { toast } from '../lib/toast';
import SitioLayout from './SitioLayout';

const DIRECCIONES_RESIZE = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];

export default function PanelLayout({ children }) {
    const { auth, panel, flash, sitio } = usePage().props;
    const ventana = usePanelWindow();

    const secciones = panel?.secciones ?? [];
    const rutaActual = window.location.pathname;
    const activa = secciones.find((s) => (s.exacta ? rutaActual === s.ruta : rutaActual.startsWith(s.ruta)));

    useEffect(() => {
        if (flash?.ok) toast(flash.ok, 'ok');
        if (flash?.error) toast(flash.error, 'error');
    }, [flash?.ok, flash?.error]);

    useEffect(() => {
        if (!flash?.expired_draft) return;
        const restaurado = restaurarBorrador();
        if (restaurado) toast('Se restauró tu progreso anterior', 'ok');
        limpiarBorrador();
    }, [flash?.expired_draft]);

    useEffect(() => {
        const guardar = () => guardarBorrador();
        const alOcultar = () => {
            if (document.visibilityState === 'hidden') guardar();
        };
        const id = setInterval(guardar, 5000);
        document.addEventListener('visibilitychange', alOcultar);
        window.addEventListener('pagehide', guardar);
        return () => {
            clearInterval(id);
            document.removeEventListener('visibilitychange', alOcultar);
            window.removeEventListener('pagehide', guardar);
        };
    }, []);

    function cerrarSesion() {
        router.post('/lorente-panel/logout');
    }

    const esActiva = (s) => (s.exacta ? rutaActual === s.ruta : rutaActual.startsWith(s.ruta));

    const iniciales = (auth.user?.name ?? '?')
        .split(/\s+/)
        .slice(0, 2)
        .map((p) => p[0])
        .join('')
        .toUpperCase();

    const dragTitle = (e) => {
        if (ventana.view !== 'normal') return;
        ventana.arrastrarInicio(e.clientX, e.clientY);
    };

    const overlay = (
        <div className="panel-capa">
            {ventana.view === 'maximizado' && (
                <div className="pv-overlay" onClick={() => ventana.setView('normal')} />
            )}

            {ventana.view === 'minimizado' && (
                <button className="pv-pill" onClick={() => ventana.setView('normal')}>
                    <Icono nombre="panel" className="h-4 w-4" />
                    <span className="truncate">Abrir panel</span>
                </button>
            )}

            <div ref={ventana.panelRef} className={ventana.claseVentana} style={ventana.estiloVentana}>
                {ventana.view === 'normal' &&
                    !ventana.isMobile &&
                    DIRECCIONES_RESIZE.map((dir) => (
                        <div
                            key={dir}
                            className={`rh rh-${dir}`}
                            title="Arrastra para redimensionar"
                            onMouseDown={(e) => {
                                e.stopPropagation();
                                ventana.redimensionarInicio(dir, e.clientX, e.clientY);
                            }}
                            onTouchStart={(e) => {
                                e.stopPropagation();
                                const t = e.touches[0];
                                ventana.redimensionarInicio(dir, t.clientX, t.clientY);
                            }}
                        />
                    ))}

                <div
                    className={`panel-titulo ${ventana.view === 'normal' && !ventana.isMobile ? 'pv-arrastrar' : ''}`}
                    onMouseDown={(e) => {
                        if (e.target.closest('.pv-cmd')) return;
                        dragTitle(e);
                    }}
                    onTouchStart={(e) => {
                        if (e.target.closest('.pv-cmd')) return;
                        const t = e.touches[0];
                        ventana.arrastrarInicio(t.clientX, t.clientY);
                    }}
                >
                    <div className="panel-titulo-marca">
                        <span className="panel-marca-icono">
                            <Icono nombre="panel" className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 leading-tight">
                            <p className="panel-titulo-sup">Panel Administrativo</p>
                            <p className="panel-titulo-sec">{activa?.etiqueta ?? 'Resumen'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            className="pv-cmd"
                            title={ventana.view === 'maximizado' ? 'Restaurar tamaño' : 'Maximizar'}
                            onClick={() => ventana.setView(ventana.view === 'maximizado' ? 'normal' : 'maximizado')}
                        >
                            <Icono nombre={ventana.view === 'maximizado' ? 'restaurar' : 'maximizar'} className="h-3.5 w-3.5" />
                        </button>
                        <button className="pv-cmd" title="Minimizar panel" onClick={() => ventana.setView('minimizado')}>
                            <Icono nombre="minimizar" className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>

                <div className="panel-vista">
                    <aside className="panel-sidebar">
                        <div className="panel-marca">
                            <img src="/logo_lorente.webp" alt="Logo I.E. N.º 31501 Sebastián Lorente" className="panel-marca-logo" />
                            <div className="min-w-0 leading-tight">
                                <p className="panel-marca-sup">I.E. N.º 31501</p>
                                <p className="panel-marca-nom">Sebastián Lorente</p>
                            </div>
                        </div>

                        <nav className="panel-nav">
                            {secciones.map((s) => {
                                const contenido = (
                                    <>
                                        <span className="panel-nav-barra" aria-hidden="true" />
                                        <Icono nombre={s.icono} className="h-[18px] w-[18px] shrink-0" />
                                        <span className="truncate">{s.etiqueta}</span>
                                    </>
                                );

                                return esActiva(s) ? (
                                    <span key={s.clave} className="panel-nav-item panel-nav-item--activa" aria-current="page">
                                        {contenido}
                                    </span>
                                ) : (
                                    <Link
                                        key={s.clave}
                                        href={s.ruta}
                                        preserveScroll
                                        prefetch
                                        except={['sitio']}
                                        className="panel-nav-item"
                                    >
                                        {contenido}
                                    </Link>
                                );
                            })}
                        </nav>

                        <div className="panel-usuario">
                            <span className="panel-avatar">{iniciales}</span>
                            <div className="min-w-0 leading-tight">
                                <p className="panel-usuario-nom">{auth.user?.name}</p>
                                <p className="panel-usuario-rol">{panel?.rol_etiqueta}</p>
                            </div>
                            <button className="panel-salir" onClick={cerrarSesion} title="Cerrar sesión">
                                <Icono nombre="salir" className="h-[18px] w-[18px]" />
                            </button>
                        </div>
                    </aside>

                    <main className="panel-cuerpo">{children}</main>
                </div>
            </div>

            <Toasts />
        </div>
    );

    return (
        <SitioLayout overlay={overlay} toastSitio={false}>
            {sitio ? <SitioHome {...sitio} /> : null}
        </SitioLayout>
    );
}

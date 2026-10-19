import { Link, router, usePage } from '@inertiajs/react';
import { useEffect } from 'react';

import '../../css/panel.css';

import { Icono } from '../Components/Panel/Iconos';
import { Toasts } from '../Components/Panel/Toasts';
import { usePanelWindow } from '../hooks/usePanelWindow';
import { guardarBorrador, limpiarBorrador, restaurarBorrador } from '../lib/draft';
import { precargarSecciones } from '../lib/precargaPanel';
import { fijarThemeColor, THEME_COLOR_PANEL, THEME_COLOR_SITIO } from '../lib/themeColor';
import { toast } from '../lib/toast';

const DIRECCIONES_RESIZE = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];

const GRUPOS_PANEL = [
    { titulo: 'General', claves: ['resumen'] },
    { titulo: 'Contenido', claves: ['noticias', 'documentos', 'docentes'] },
    { titulo: 'Comunicación', claves: ['mensajes'] },
    { titulo: 'Administración', claves: ['historial', 'cuentas', 'configuracion'] },
    { titulo: 'Cuenta', claves: ['perfil'] },
];

export default function PanelLayout({ children }) {
    const { auth, panel, flash } = usePage().props;
    const ventana = usePanelWindow();

    const secciones = panel?.secciones ?? [];
    const rutaActual = window.location.pathname;
    const activa = secciones.find((s) => (s.exacta ? rutaActual === s.ruta : rutaActual.startsWith(s.ruta)));

    const clavesAgrupadas = new Set(GRUPOS_PANEL.flatMap((g) => g.claves));
    const grupos = GRUPOS_PANEL.map((g) => ({
        ...g,
        items: g.claves.map((clave) => secciones.find((s) => s.clave === clave)).filter(Boolean),
    })).filter((g) => g.items.length > 0);

    const seccionesSueltas = secciones.filter((s) => !clavesAgrupadas.has(s.clave));
    if (seccionesSueltas.length > 0) {
        grupos.push({ titulo: 'Más', items: seccionesSueltas });
    }

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

    useEffect(() => {
        fijarThemeColor(THEME_COLOR_PANEL);
        precargarSecciones();
        return () => fijarThemeColor(THEME_COLOR_SITIO);
    }, []);

    useEffect(() => {
        ventana.panelRef.current?.focus?.({ preventScroll: true });
    }, []);

    useEffect(() => {
        const onKey = (e) => {
            if (e.key !== 'Escape') return;

            const t = e.target;
            if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) {
                return;
            }

            if (ventana.view !== 'minimizado') ventana.setView('minimizado');
        };

        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [ventana.view]);

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

            <div
                ref={ventana.panelRef}
                className={ventana.claseVentana}
                style={ventana.estiloVentana}
                role="dialog"
                aria-label="Panel administrativo"
                aria-modal={ventana.view === 'maximizado' ? true : undefined}
                tabIndex={-1}
            >
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
                        if (e.target.closest('.pv-cmd, .pv-no-drag')) return;
                        dragTitle(e);
                    }}
                    onTouchStart={(e) => {
                        if (e.target.closest('.pv-cmd, .pv-no-drag')) return;
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
                    <div className="pv-barra-acciones">
                        <span className="pv-sesion">
                            <span className="pv-sesion-punto" aria-hidden="true" />
                            Sesión activa
                        </span>
                        <div className="pv-controles">
                            <button className="pv-cmd" title="Minimizar panel" aria-label="Minimizar panel" onClick={() => ventana.setView('minimizado')}>
                                <Icono nombre="minimizar" className="h-3.5 w-3.5" />
                            </button>
                            <button
                                className="pv-cmd"
                                title={ventana.view === 'maximizado' ? 'Restaurar tamaño' : 'Maximizar'}
                                aria-label={ventana.view === 'maximizado' ? 'Restaurar tamaño' : 'Maximizar'}
                                onClick={() => ventana.setView(ventana.view === 'maximizado' ? 'normal' : 'maximizado')}
                            >
                                <Icono nombre={ventana.view === 'maximizado' ? 'restaurar' : 'maximizar'} className="h-3.5 w-3.5" />
                            </button>
                        </div>
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
                            {grupos.map((grupo) => (
                                <div key={grupo.titulo} className="panel-nav-grupo-bloque">
                                    <p className="panel-nav-grupo">{grupo.titulo}</p>
                                    {grupo.items.map((s) => {
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
                                                prefetch={['mount', 'hover']}
                                                cacheFor={[60_000, 5 * 60_000]}
                                                className="panel-nav-item"
                                            >
                                                {contenido}
                                            </Link>
                                        );
                                    })}
                                </div>
                            ))}
                        </nav>

                        <div className="panel-sidebar-pie">
                            <div className="panel-usuario">
                                <span className="panel-avatar">{iniciales}</span>
                                <div className="min-w-0 leading-tight">
                                    <p className="panel-usuario-nom">{auth.user?.name}</p>
                                    <p className="panel-usuario-rol">{panel?.rol_etiqueta}</p>
                                </div>
                                <button className="panel-salir" onClick={cerrarSesion} title="Cerrar sesión" aria-label="Cerrar sesión">
                                    <Icono nombre="salir" className="h-[18px] w-[18px]" />
                                </button>
                            </div>
                        </div>
                    </aside>

                    <main className="panel-cuerpo">{children}</main>
                </div>
            </div>

            <Toasts />
        </div>
    );

    return overlay;
}

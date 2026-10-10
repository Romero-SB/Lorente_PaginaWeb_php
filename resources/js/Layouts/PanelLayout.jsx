import { router, usePage } from '@inertiajs/react';
import { createContext, useContext, useEffect, useState } from 'react';

import { Icono } from '../Components/Panel/Iconos';
import { Toasts } from '../Components/Panel/Toasts';
import { usePanelWindow } from '../hooks/usePanelWindow';
import { guardarBorrador, limpiarBorrador, restaurarBorrador } from '../lib/draft';
import { toast } from '../lib/toast';

const PanelContext = createContext({ setBusyLabel: () => {} });

export function usePanel() {
    return useContext(PanelContext);
}

const DIRECCIONES_RESIZE = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];

export default function PanelLayout({ children }) {
    const { auth, panel, flash } = usePage().props;
    const ventana = usePanelWindow();
    const [busy, setBusy] = useState(null);

    const secciones = panel?.secciones ?? [];
    const rutaActual = window.location.pathname;

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

    function esActiva(s) {
        return s.exacta ? rutaActual === s.ruta : rutaActual.startsWith(s.ruta);
    }

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

    return (
        <PanelContext.Provider value={{ setBusyLabel: setBusy }}>
            <div className="panel-fondo">
                {ventana.view === 'maximizado' && (
                    <div className="pv-overlay" onClick={() => ventana.setView('normal')} />
                )}

                {ventana.view === 'minimizado' && (
                    <button className="pv-pill" onClick={() => ventana.setView('normal')}>
                        <Icono nombre="panel" className="h-4 w-4" />
                        <span className="truncate">{busy || 'Panel Administrativo'}</span>
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
                        <div className="flex min-w-0 items-center gap-3">
                            <img src="/logo_lorente.webp" alt="" className="h-7 w-auto rounded" />
                            <div className="min-w-0 leading-tight">
                                <div className="truncate text-[13px] font-bold">
                                    <Icono nombre="panel" className="mr-1.5 inline h-3.5 w-3.5 -translate-y-px" />
                                    Panel Administrativo
                                </div>
                                <div className="truncate text-[11px] text-blue-200/90">
                                    {auth.user?.name}
                                    {auth.user?.cargo ? ` · ${auth.user.cargo}` : ''}
                                </div>
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
                            <div className="flex items-center gap-3 border-b border-white/10 px-4 py-4">
                                <img src="/logo_lorente.webp" alt="Logo" className="h-9 w-auto" />
                                <div className="min-w-0 leading-tight">
                                    <p className="text-[10px] tracking-widest text-blue-300 uppercase">I.E. N.º 31501</p>
                                    <p className="text-[13px] font-bold text-white">Sebastián Lorente</p>
                                </div>
                            </div>

                            <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
                                {secciones.map((s) => {
                                    const activa = esActiva(s);
                                    return (
                                        <button
                                            key={s.clave}
                                            onClick={() => {
                                                if (!activa) router.visit(s.ruta, { preserveScroll: true });
                                            }}
                                            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[13px] font-medium transition ${
                                                activa
                                                    ? 'bg-sky-400/20 text-white ring-1 ring-sky-300/30'
                                                    : 'text-blue-200/80 hover:bg-white/5 hover:text-white'
                                            }`}
                                        >
                                            <Icono nombre={s.icono} className="h-[18px] w-[18px] shrink-0" />
                                            <span className="truncate">{s.etiqueta}</span>
                                        </button>
                                    );
                                })}
                            </nav>

                            <div className="space-y-2 border-t border-white/10 p-3">
                                <div className="flex items-center gap-2 px-1">
                                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/10 text-xs font-bold text-white">
                                        {iniciales}
                                    </div>
                                    <div className="min-w-0 leading-tight">
                                        <p className="truncate text-[13px] font-semibold text-white">{auth.user?.name}</p>
                                        <p className="truncate text-[11px] text-blue-300">{panel?.rol_etiqueta}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={cerrarSesion}
                                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[13px] font-medium text-red-200/90 transition hover:bg-red-500/15 hover:text-red-100"
                                >
                                    <Icono nombre="salir" className="h-[18px] w-[18px]" />
                                    Cerrar sesión
                                </button>
                            </div>
                        </aside>

                        <main className="panel-cuerpo">{children}</main>
                    </div>
                </div>

                <Toasts />
            </div>
        </PanelContext.Provider>
    );
}
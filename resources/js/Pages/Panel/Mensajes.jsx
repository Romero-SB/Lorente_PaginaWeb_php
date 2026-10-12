import { router } from '@inertiajs/react';
import { useState } from 'react';

import { Icono } from '../../Components/Panel/Iconos';
import Boton from '../../Components/Shared/Boton';
import PageHeader from '../../Components/Shared/PageHeader';
import Paginacion from '../../Components/Shared/Paginacion';
import { formatearFecha } from '../../lib/fecha';

export default function Mensajes({ mensajes = { data: [], links: [], meta: {} }, filtros = {}, stats = {} }) {
    const items = mensajes?.data ?? [];
    const meta = mensajes?.meta ?? {};
    const [filtro, setFiltro] = useState(filtros.filtro ?? 'todos');
    const [q, setQ] = useState(filtros.q ?? '');
    const [seleccion, setSeleccion] = useState(items[0]?.id ?? null);

    const actual = items.find((m) => m.id === seleccion) ?? null;

    function buscar(e) {
        e.preventDefault();
        router.get('/lorente-panel/mensajes', { filtro, q: q || undefined }, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            onSuccess: () => setSeleccion(null),
        });
    }

    function cambiarFiltro(nuevo) {
        setFiltro(nuevo);
        router.get('/lorente-panel/mensajes', { filtro: nuevo, q: q || undefined }, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            onSuccess: () => setSeleccion(null),
        });
    }

    function accion(url) {
        router.post(url, {}, { preserveScroll: true, preserveState: true });
    }

    function eliminar(id) {
        if (window.confirm('¿Eliminar este mensaje definitivamente?')) {
            setSeleccion(null);
            router.post(`/lorente-panel/mensajes/${id}/eliminar`, {}, { preserveScroll: true, preserveState: true });
        }
    }

    function visitarPagina(url) {
        router.visit(url, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => setSeleccion(null),
        });
    }

    const FILTROS = [
        { clave: 'todos', label: 'Todos', total: stats.total ?? 0 },
        { clave: 'no-leidos', label: 'No leídos', total: stats.no_leidos ?? 0 },
        { clave: 'leidos', label: 'Leídos' },
    ];

    return (
        <div>
            <PageHeader
                titulo="Mensajes de contacto"
                descripcion="Bandeja de mensajes enviados desde el sitio público."
            >
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                    {stats.no_leidos ?? 0} sin leer
                </span>
            </PageHeader>

            <div className="mt-5 flex flex-wrap items-center gap-2">
                {FILTROS.map((f) => (
                    <button
                        key={f.clave}
                        onClick={() => cambiarFiltro(f.clave)}
                        className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                            filtro === f.clave
                                ? 'panel-boton--primario text-white'
                                : 'border border-slate-300 text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        {f.label}
                        {f.total !== undefined && (
                            <span className={`ml-2 rounded-full px-1.5 text-xs ${filtro === f.clave ? 'bg-white/20' : 'bg-slate-100'}`}>
                                {f.total}
                            </span>
                        )}
                    </button>
                ))}

                <form onSubmit={buscar} className="ml-auto flex items-center gap-2">
                    <input
                        type="text"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Buscar nombre, correo o asunto"
                        className="panel-campo w-64"
                    />
                    <Boton variante="primario" type="submit" className="px-3 py-2 text-sm">
                        <Icono nombre="buscar" className="h-4 w-4" />
                    </Boton>
                </form>
            </div>

            <div className="panel-rejilla-detalle mt-5 grid gap-4">
                <div className="panel-tarjeta flex max-h-[70vh] flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto">
                        {items.length === 0 ? (
                            <p className="px-4 py-10 text-center text-sm text-slate-500">
                                No hay mensajes que coincidan.
                            </p>
                        ) : (
                            <ul className="divide-y divide-slate-100">
                                {items.map((m) => (
                                    <li key={m.id}>
                                        <button
                                            onClick={() => setSeleccion(m.id)}
                                            className={`w-full px-4 py-3 text-left transition ${
                                                seleccion === m.id ? 'bg-blue-50' : 'hover:bg-slate-50'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <span className={`truncate text-sm ${m.leido ? 'font-medium text-slate-700' : 'font-bold text-slate-900'}`}>
                                                    {m.nombre}
                                                </span>
                                                {!m.leido && <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500"></span>}
                                                {m.respondido && (
                                                    <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                                        respondido
                                                    </span>
                                                )}
                                            </div>
                                            <div className="mt-0.5 truncate text-xs font-medium text-slate-500">{m.asunto}</div>
                                            <div className="mt-0.5 max-h-8 overflow-hidden text-xs text-slate-400">{m.mensaje}</div>
                                            <div className="mt-1 text-[11px] text-slate-400">{formatearFecha(m.fecha)}</div>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {mensajes?.links?.length > 3 && (
                        <div className="border-t border-slate-100 p-2">
                            <Paginacion links={mensajes.links} onNavegar={visitarPagina} />
                        </div>
                    )}

                    {meta.total > 0 && (
                        <p className="border-t border-slate-100 px-3 py-1.5 text-center text-[11px] text-slate-400">
                            Mostrando {meta.desde}-{meta.hasta} de {meta.total}
                        </p>
                    )}
                </div>

                <div className="panel-tarjeta p-5">
                    {!actual ? (
                        <div className="flex h-64 flex-col items-center justify-center text-slate-400">
                            <Icono nombre="mensajes" className="h-10 w-10" />
                            <p className="mt-3 text-sm">Selecciona un mensaje para verlo.</p>
                        </div>
                    ) : (
                        <div>
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <h2 className="panel-titulo-seccion">{actual.asunto}</h2>
                                    <p className="mt-1 text-sm text-slate-500">
                                        De <strong className="text-slate-700">{actual.nombre}</strong> ·{' '}
                                        <a href={`mailto:${actual.email}`} className="text-blue-600 hover:underline">
                                            {actual.email}
                                        </a>
                                        {actual.telefono && <> · {actual.telefono}</>}
                                    </p>
                                    <p className="mt-0.5 text-xs text-slate-400">
                                        {formatearFecha(actual.fecha)}
                                        {actual.ip && <> · IP {actual.ip}</>}
                                        {actual.respondido && <> · Respondido el {formatearFecha(actual.respondido_at)}</>}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Boton
                                        onClick={() => accion(`/lorente-panel/mensajes/${actual.id}/leido`)}
                                        className="px-3 py-1.5 text-xs border-slate-300 hover:bg-slate-50"
                                    >
                                        <Icono nombre="check" className="h-4 w-4" />
                                        {actual.leido ? 'Marcar no leído' : 'Marcar leído'}
                                    </Boton>
                                    <Boton
                                        onClick={() => accion(`/lorente-panel/mensajes/${actual.id}/respondido`)}
                                        className="px-3 py-1.5 text-xs border-slate-300 hover:bg-slate-50"
                                    >
                                        <Icono nombre="publicar" className="h-4 w-4" />
                                        {actual.respondido ? 'Quitar respondido' : 'Marcar respondido'}
                                    </Boton>
                                    <Boton
                                        onClick={() => eliminar(actual.id)}
                                        className="bg-red-50 px-3 py-1.5 text-xs border-red-200 text-red-600 hover:bg-red-100"
                                    >
                                        <Icono nombre="basura" className="h-4 w-4" />
                                        Eliminar
                                    </Boton>
                                </div>
                            </div>

                            <div className="mt-5 border-t border-slate-100 pt-5 text-sm leading-relaxed whitespace-pre-wrap text-slate-700">
                                {actual.mensaje}
                            </div>

                            <div className="mt-5">
                                <a
                                    href={`mailto:${actual.email}?subject=${encodeURIComponent(`Re: ${actual.asunto}`)}`}
                                    className="panel-boton--primario inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-900"
                                >
                                    <Icono nombre="publicar" className="h-4 w-4" />
                                    Responder por correo
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
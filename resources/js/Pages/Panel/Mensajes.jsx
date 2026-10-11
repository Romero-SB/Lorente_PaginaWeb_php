import { router } from '@inertiajs/react';
import { useState } from 'react';

import { Icono } from '../../Components/Panel/Iconos';
import PanelLayout from '../../Layouts/PanelLayout';

function formatearFecha(valor) {
    if (!valor) return '—';
    return new Intl.DateTimeFormat('es-PE', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(valor));
}

export default function Mensajes({ mensajes = [], filtros = {}, stats = {} }) {
    const [filtro, setFiltro] = useState(filtros.filtro ?? 'todos');
    const [q, setQ] = useState(filtros.q ?? '');
    const [seleccion, setSeleccion] = useState(mensajes[0]?.id ?? null);

    const actual = mensajes.find((m) => m.id === seleccion) ?? null;

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

    const FILTROS = [
        { clave: 'todos', label: 'Todos', total: stats.total ?? 0 },
        { clave: 'no-leidos', label: 'No leídos', total: stats.no_leidos ?? 0 },
        { clave: 'leidos', label: 'Leídos' },
    ];

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Mensajes de contacto</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Bandeja de mensajes enviados desde el sitio público.
                    </p>
                </div>
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                    {stats.no_leidos ?? 0} sin leer
                </span>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
                {FILTROS.map((f) => (
                    <button
                        key={f.clave}
                        onClick={() => cambiarFiltro(f.clave)}
                        className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                            filtro === f.clave
                                ? 'bg-blue-950 text-white'
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
                        className="w-64 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                    <button
                        type="submit"
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-900"
                    >
                        <Icono nombre="buscar" className="h-4 w-4" />
                    </button>
                </form>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[340px_1fr]">
                <div className="max-h-[70vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                    {mensajes.length === 0 ? (
                        <p className="px-4 py-10 text-center text-sm text-slate-500">
                            No hay mensajes que coincidan.
                        </p>
                    ) : (
                        <ul className="divide-y divide-slate-100">
                            {mensajes.map((m) => (
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

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    {!actual ? (
                        <div className="flex h-64 flex-col items-center justify-center text-slate-400">
                            <Icono nombre="mensajes" className="h-10 w-10" />
                            <p className="mt-3 text-sm">Selecciona un mensaje para verlo.</p>
                        </div>
                    ) : (
                        <div>
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">{actual.asunto}</h2>
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
                                    <button
                                        onClick={() => accion(`/lorente-panel/mensajes/${actual.id}/leido`)}
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                                    >
                                        <Icono nombre="check" className="h-4 w-4" />
                                        {actual.leido ? 'Marcar no leído' : 'Marcar leído'}
                                    </button>
                                    <button
                                        onClick={() => accion(`/lorente-panel/mensajes/${actual.id}/respondido`)}
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                                    >
                                        <Icono nombre="publicar" className="h-4 w-4" />
                                        {actual.respondido ? 'Quitar respondido' : 'Marcar respondido'}
                                    </button>
                                    <button
                                        onClick={() => eliminar(actual.id)}
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                                    >
                                        <Icono nombre="basura" className="h-4 w-4" />
                                        Eliminar
                                    </button>
                                </div>
                            </div>

                            <div className="mt-5 border-t border-slate-100 pt-5 text-sm leading-relaxed whitespace-pre-wrap text-slate-700">
                                {actual.mensaje}
                            </div>

                            <div className="mt-5">
                                <a
                                    href={`mailto:${actual.email}?subject=${encodeURIComponent(`Re: ${actual.asunto}`)}`}
                                    className="inline-flex items-center gap-2 rounded-lg bg-blue-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-900"
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

Mensajes.layout = (page) => <PanelLayout children={page} />;

import { router } from '@inertiajs/react';
import { useState } from 'react';

import { Icono } from '../../Components/Panel/Iconos';
import PageHeader from '../../Components/Shared/PageHeader';
import Paginacion from '../../Components/Shared/Paginacion';
import { formatearFecha } from '../../lib/fecha';

const ETIQUETAS_ROL = {
    'super-usuario': 'Super Usuario',
    administrador: 'Administrador',
    docente: 'Docente',
};

const ESTILOS_ACCION = {
    crear: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    editar: 'bg-blue-50 text-blue-700 ring-blue-200',
    papelera: 'bg-amber-50 text-amber-700 ring-amber-200',
    restaurar: 'bg-teal-50 text-teal-700 ring-teal-200',
    'eliminar permanente': 'bg-red-50 text-red-700 ring-red-200',
};

function limpiar(params) {
    return Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== null && v !== undefined && v !== ''),
    );
}

export default function Historial({ registros, usuarios = [], acciones = [], modelos = [], filtros = {} }) {
    const [form, setForm] = useState({
        usuario: filtros.usuario ?? '',
        accion: filtros.accion ?? '',
        modelo: filtros.modelo ?? '',
        desde: filtros.desde ?? '',
        hasta: filtros.hasta ?? '',
        q: filtros.q ?? '',
    });

    const actualizar = (campo) => (e) => setForm((prev) => ({ ...prev, [campo]: e.target.value }));

    function aplicar(e) {
        e.preventDefault();
        router.get('/lorente-panel/historial', limpiar(form), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }

    function limpiarFiltros() {
        setForm({ usuario: '', accion: '', modelo: '', desde: '', hasta: '', q: '' });
        router.get('/lorente-panel/historial', {}, { preserveState: true, preserveScroll: true, replace: true });
    }

    const items = registros?.data ?? [];
    const meta = registros?.meta ?? {};

    return (
        <div>
            <PageHeader
                titulo="Historial de actividad"
                descripcion="Registro de acciones del panel. Visible solo para el Super Usuario."
            >
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {meta.total ?? 0} registro{(meta.total ?? 0) === 1 ? '' : 's'}
                </span>
            </PageHeader>

            <form onSubmit={aplicar} className="panel-tarjeta mt-5 p-4">
                <div className="panel-rejilla-3 grid gap-3">
                    <label className="block">
                        <span className="mb-1 block text-xs font-semibold text-slate-600">Usuario</span>
                        <select
                            value={form.usuario}
                            onChange={actualizar('usuario')}
                            className="panel-campo w-full"
                        >
                            <option value="">Todos</option>
                            {usuarios.map((u) => (
                                <option key={u.id} value={u.id}>
                                    {u.name} · {ETIQUETAS_ROL[u.rol] ?? u.rol}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="block">
                        <span className="mb-1 block text-xs font-semibold text-slate-600">Acción</span>
                        <select
                            value={form.accion}
                            onChange={actualizar('accion')}
                            className="panel-campo w-full"
                        >
                            <option value="">Todas</option>
                            {acciones.map((a) => (
                                <option key={a} value={a}>
                                    {a}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="block">
                        <span className="mb-1 block text-xs font-semibold text-slate-600">Módulo</span>
                        <select
                            value={form.modelo}
                            onChange={actualizar('modelo')}
                            className="panel-campo w-full"
                        >
                            <option value="">Todos</option>
                            {modelos.map((m) => (
                                <option key={m.valor} value={m.valor}>
                                    {m.etiqueta}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="block">
                        <span className="mb-1 block text-xs font-semibold text-slate-600">Desde</span>
                        <input
                            type="date"
                            value={form.desde}
                            onChange={actualizar('desde')}
                            className="panel-campo w-full"
                        />
                    </label>

                    <label className="block">
                        <span className="mb-1 block text-xs font-semibold text-slate-600">Hasta</span>
                        <input
                            type="date"
                            value={form.hasta}
                            onChange={actualizar('hasta')}
                            className="panel-campo w-full"
                        />
                    </label>

                    <label className="block">
                        <span className="mb-1 block text-xs font-semibold text-slate-600">Búsqueda</span>
                        <input
                            type="text"
                            value={form.q}
                            onChange={actualizar('q')}
                            placeholder="Título o descripción"
                            className="panel-campo w-full"
                        />
                    </label>
                </div>

                <div className="mt-4 flex items-center gap-2">
                    <button
                        type="submit"
                        className="panel-boton--primario inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-900"
                    >
                        <Icono nombre="buscar" className="h-4 w-4" />
                        Filtrar
                    </button>
                    <button
                        type="button"
                        onClick={limpiarFiltros}
                        className="panel-boton--secundario inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                        Limpiar
                    </button>
                </div>
            </form>

            <div className="panel-tarjeta mt-5 overflow-hidden">
                {items.length === 0 ? (
                    <p className="px-4 py-10 text-center text-sm text-slate-500">
                        No hay registros que coincidan con los filtros.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-sm">
                            <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase">
                                <tr>
                                    <th className="px-4 py-3">Fecha</th>
                                    <th className="px-4 py-3">Usuario</th>
                                    <th className="px-4 py-3">Acción</th>
                                    <th className="px-4 py-3">Módulo</th>
                                    <th className="px-4 py-3">Título</th>
                                    <th className="px-4 py-3">IP</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {items.map((r) => (
                                    <tr key={r.id} className="align-top hover:bg-slate-50/70">
                                        <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                                            {formatearFecha(r.fecha)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-slate-800">{r.usuario}</div>
                                            {r.rol && (
                                                <div className="text-xs text-slate-400">
                                                    {ETIQUETAS_ROL[r.rol] ?? r.rol}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${
                                                    ESTILOS_ACCION[r.accion] ?? 'bg-slate-50 text-slate-600 ring-slate-200'
                                                }`}
                                            >
                                                {r.accion}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">{r.modelo_etiqueta ?? '—'}</td>
                                        <td className="px-4 py-3 text-slate-700">
                                            <div className="max-w-xs truncate" title={r.titulo}>
                                                {r.titulo || '—'}
                                            </div>
                                            {r.descripcion && (
                                                <div className="mt-0.5 max-w-xs truncate text-xs text-slate-400">
                                                    {r.descripcion}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-slate-500">{r.ip || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {registros?.links?.length > 3 && (
                <Paginacion
                    tamano="normal"
                    className="mt-4"
                    links={registros.links}
                    onNavegar={(url) => router.visit(url, { preserveScroll: true, preserveState: true })}
                />
            )}

            {meta.total > 0 && (
                <p className="mt-3 text-center text-xs text-slate-400">
                    Mostrando {meta.desde}-{meta.hasta} de {meta.total} · página {meta.pagina} de {meta.ultima}
                </p>
            )}
        </div>
    );
}
import { router, useForm, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';

import GestorCategorias from '../../Components/Panel/GestorCategorias';
import { Icono } from '../../Components/Panel/Iconos';
import { toast } from '../../lib/toast';

const PESO_ARCHIVO = 20 * 1024 * 1024;
const EXTENSIONES = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];

function extensionDe(nombre) {
    return (nombre || '').split('.').pop()?.toLowerCase() || '';
}

function colorExtension(ext) {
    if (['doc', 'docx'].includes(ext)) return 'bg-blue-50 text-blue-700';
    if (['xls', 'xlsx'].includes(ext)) return 'bg-emerald-50 text-emerald-700';
    if (['ppt', 'pptx'].includes(ext)) return 'bg-orange-50 text-orange-700';
    return 'bg-red-50 text-red-700';
}

export default function Documentos({ documentos = [], categorias = [], visibilidades = {}, papelera }) {
    const { auth } = usePage().props;
    const [vista, setVista] = useState('lista');
    const [editingId, setEditingId] = useState(null);
    const [busqueda, setBusqueda] = useState('');
    const [filtroCategoria, setFiltroCategoria] = useState('');
    const [gestorAbierto, setGestorAbierto] = useState(false);
    const [archivo, setArchivo] = useState(null);

    const form = useForm({
        titulo: '',
        categoria: '',
        visibilidad: 'publico',
        descripcion: '',
        instrucciones: '',
    });

    const puedeGestionarCategorias = auth.user?.role === 'administrador' || auth.user?.role === 'super-usuario';

    function abrirLista() {
        setVista('lista');
        setEditingId(null);
        form.clearErrors();
        setArchivo(null);
    }

    function abrirNueva() {
        setEditingId(null);
        form.reset();
        form.clearErrors();
        setArchivo(null);
        setVista('form');
    }

    function abrirEditar(d) {
        setEditingId(d.id);
        form.clearErrors();
        form.setData({
            titulo: d.titulo || '',
            categoria: d.categoria || '',
            visibilidad: d.visibilidad || 'publico',
            descripcion: d.descripcion || '',
            instrucciones: d.instrucciones || '',
        });
        setArchivo(null);
        setVista('form');
    }

    function abrirPapelera() {
        setVista('papelera');
        router.reload({ only: ['papelera'] });
    }

    function alSeleccionarArchivo(e) {
        const f = e.target.files?.[0];
        e.target.value = '';
        if (!f) return;
        if (!EXTENSIONES.includes(extensionDe(f.name))) {
            toast('Formato no permitido (PDF, Word, Excel o PowerPoint)', 'error');
            return;
        }
        if (f.size > PESO_ARCHIVO) {
            toast('El archivo supera los 20 MB', 'error');
            return;
        }
        setArchivo(f);
    }

    function enviar(e) {
        e.preventDefault();
        const url = editingId ? `/lorente-panel/documentos/${editingId}` : '/lorente-panel/documentos';

        form.transform((data) => {
            const salida = { ...data };
            if (archivo) salida.archivo = archivo;
            return salida;
        });

        form.post(url, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => abrirLista(),
        });
    }

    function eliminar(d) {
        if (!confirm(`¿Mover "${d.titulo}" a la papelera?`)) return;
        router.post(`/lorente-panel/documentos/${d.id}/eliminar`, {}, { preserveScroll: true });
    }

    function restaurar(d) {
        router.post(`/lorente-panel/documentos/${d.id}/restaurar`, {}, {
            preserveScroll: true,
            onSuccess: () => router.reload({ only: ['papelera'] }),
        });
    }

    function eliminarPermanente(d) {
        if (!confirm(`¿Eliminar permanentemente "${d.titulo}"? Esta acción no se puede deshacer.`)) return;
        router.post(`/lorente-panel/documentos/${d.id}/permanente`, {}, {
            preserveScroll: true,
            onSuccess: () => router.reload({ only: ['papelera'] }),
        });
    }

    const filtrados = useMemo(() => {
        const q = busqueda.trim().toLowerCase();
        return documentos.filter((d) => {
            if (filtroCategoria && d.categoria !== filtroCategoria) return false;
            if (!q) return true;
            return d.titulo.toLowerCase().includes(q) || (d.archivo?.nombre || '').toLowerCase().includes(q);
        });
    }, [documentos, busqueda, filtroCategoria]);

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Documentos</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        {auth.user?.role === 'docente'
                            ? 'Gestiona los documentos que has registrado.'
                            : 'Administra los documentos de la institución.'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {puedeGestionarCategorias && (
                        <button
                            onClick={() => setGestorAbierto(true)}
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                        >
                            <Icono nombre="caja" className="h-4 w-4" /> Categorías
                        </button>
                    )}
                    <button
                        onClick={abrirPapelera}
                        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                            vista === 'papelera'
                                ? 'border-blue-300 bg-blue-50 text-blue-800'
                                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        <Icono nombre="basura" className="h-4 w-4" /> Papelera
                    </button>
                    <button
                        onClick={abrirNueva}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-900"
                    >
                        <Icono nombre="mas" className="h-4 w-4" /> Nuevo documento
                    </button>
                </div>
            </div>

            {vista === 'lista' && (
                <Lista
                    documentos={filtrados}
                    categorias={categorias}
                    visibilidades={visibilidades}
                    busqueda={busqueda}
                    setBusqueda={setBusqueda}
                    filtroCategoria={filtroCategoria}
                    setFiltroCategoria={setFiltroCategoria}
                    onEditar={abrirEditar}
                    onEliminar={eliminar}
                />
            )}

            {vista === 'papelera' && (
                <Papelera papelera={papelera} onRestaurar={restaurar} onEliminarPermanente={eliminarPermanente} />
            )}

            {vista === 'form' && (
                <Formulario
                    form={form}
                    editingId={editingId}
                    categorias={categorias}
                    visibilidades={visibilidades}
                    archivo={archivo}
                    alSeleccionarArchivo={alSeleccionarArchivo}
                    onQuitarArchivo={() => setArchivo(null)}
                    onSubmit={enviar}
                    onCancelar={abrirLista}
                />
            )}

            {gestorAbierto && (
                <GestorCategorias
                    titulo="Administrar categorías de documentos"
                    categorias={categorias}
                    baseUrl="/lorente-panel/documento-categorias"
                    bloqueoKey="documentos"
                    bloqueoEtiqueta="documentos"
                    onClose={() => setGestorAbierto(false)}
                />
            )}
        </div>
    );
}

function ChipVisibilidad({ visibilidad, visibilidades }) {
    const privado = visibilidad === 'privado';
    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${
                privado ? 'bg-amber-50 text-amber-700 ring-amber-200' : 'bg-emerald-50 text-emerald-700 ring-emerald-200'
            }`}
        >
            <Icono nombre={privado ? 'cerrar' : 'check'} className="h-3 w-3" />
            {visibilidades[visibilidad] || visibilidad}
        </span>
    );
}

function Lista({ documentos, categorias, visibilidades, busqueda, setBusqueda, filtroCategoria, setFiltroCategoria, onEditar, onEliminar }) {
    return (
        <div className="mt-4">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1">
                    <Icono nombre="buscar" className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
                    <input
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        placeholder="Buscar por título o archivo…"
                        className="w-full rounded-lg border border-slate-200 bg-white py-2 pr-3 pl-9 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                </div>
                <select
                    value={filtroCategoria}
                    onChange={(e) => setFiltroCategoria(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                >
                    <option value="">Todas las categorías</option>
                    {categorias.map((c) => (
                        <option key={c.id} value={c.nombre}>
                            {c.nombre}
                        </option>
                    ))}
                </select>
            </div>

            {documentos.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
                    <Icono nombre="documentos" className="mx-auto h-8 w-8 text-slate-300" />
                    <p className="mt-3 text-sm text-slate-500">No hay documentos para mostrar.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {documentos.map((d) => {
                        const ext = extensionDe(d.archivo?.nombre);
                        return (
                            <div key={d.id} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl text-[10px] font-bold uppercase ${colorExtension(ext)}`}>
                                    {ext || '—'}
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <ChipVisibilidad visibilidad={d.visibilidad} visibilidades={visibilidades} />
                                        {d.categoria && (
                                            <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                                                {d.categoria}
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="mt-1 truncate text-sm font-bold text-slate-900">{d.titulo}</h3>
                                    {d.descripcion && <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{d.descripcion}</p>}
                                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
                                        <span className="truncate">{d.archivo?.nombre}</span>
                                        <span>
                                            Por <span className="text-slate-600">{d.autor?.name}</span>
                                        </span>
                                    </div>
                                </div>

                                <div className="flex shrink-0 flex-col items-end justify-center gap-2">
                                    {d.archivo?.url && (
                                        <a
                                            href={d.archivo.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                                        >
                                            <Icono nombre="adjunto" className="h-3.5 w-3.5" /> Abrir
                                        </a>
                                    )}
                                    {d.puede_editar && (
                                        <button
                                            onClick={() => onEditar(d)}
                                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                                        >
                                            <Icono nombre="editar" className="h-3.5 w-3.5" /> Editar
                                        </button>
                                    )}
                                    {d.puede_eliminar && (
                                        <button
                                            onClick={() => onEliminar(d)}
                                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                                        >
                                            <Icono nombre="basura" className="h-3.5 w-3.5" /> Eliminar
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function Formulario({ form, editingId, categorias, visibilidades, archivo, alSeleccionarArchivo, onQuitarArchivo, onSubmit, onCancelar }) {
    const error = (campo) => form.errors[campo];

    return (
        <form onSubmit={onSubmit} className="mt-4 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                        <label className="mb-1 block text-xs font-semibold text-slate-600">Título *</label>
                        <input
                            value={form.data.titulo}
                            onChange={(e) => form.setData('titulo', e.target.value)}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                        />
                        {error('titulo') && <p className="mt-1 text-xs text-red-600">{error('titulo')}</p>}
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-600">Categoría *</label>
                        <select
                            value={form.data.categoria}
                            onChange={(e) => form.setData('categoria', e.target.value)}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                        >
                            <option value="">Seleccionar categoría</option>
                            {categorias.map((c) => (
                                <option key={c.id} value={c.nombre}>
                                    {c.nombre}
                                </option>
                            ))}
                        </select>
                        {error('categoria') && <p className="mt-1 text-xs text-red-600">{error('categoria')}</p>}
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-600">Visibilidad *</label>
                        <select
                            value={form.data.visibilidad}
                            onChange={(e) => form.setData('visibilidad', e.target.value)}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                        >
                            {Object.entries(visibilidades).map(([valor, etiqueta]) => (
                                <option key={valor} value={valor}>
                                    {etiqueta}
                                </option>
                            ))}
                        </select>
                        <p className="mt-1 text-[11px] text-slate-400">
                            Los privados solo se abren con sesión en el panel.
                        </p>
                        {error('visibilidad') && <p className="mt-1 text-xs text-red-600">{error('visibilidad')}</p>}
                    </div>

                    <div className="sm:col-span-2">
                        <label className="mb-1 block text-xs font-semibold text-slate-600">Descripción</label>
                        <textarea
                            rows={2}
                            value={form.data.descripcion}
                            onChange={(e) => form.setData('descripcion', e.target.value)}
                            className="w-full resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                        />
                        {error('descripcion') && <p className="mt-1 text-xs text-red-600">{error('descripcion')}</p>}
                    </div>

                    <div className="sm:col-span-2">
                        <label className="mb-1 block text-xs font-semibold text-slate-600">Instrucciones (opcional)</label>
                        <textarea
                            rows={2}
                            value={form.data.instrucciones}
                            onChange={(e) => form.setData('instrucciones', e.target.value)}
                            className="w-full resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                        />
                        {error('instrucciones') && <p className="mt-1 text-xs text-red-600">{error('instrucciones')}</p>}
                    </div>

                    <div className="sm:col-span-2">
                        <label className="mb-1 block text-xs font-semibold text-slate-600">
                            Archivo {!editingId && '*'}
                        </label>
                        {archivo ? (
                            <div className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2">
                                <Icono nombre="adjunto" className="h-4 w-4 shrink-0 text-slate-400" />
                                <span className="min-w-0 flex-1 truncate text-xs text-slate-700">{archivo.name}</span>
                                <button type="button" onClick={onQuitarArchivo} className="text-slate-400 transition hover:text-red-500" title="Quitar archivo">
                                    <Icono nombre="cerrar" className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        ) : (
                            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center transition hover:border-blue-300 hover:bg-blue-50/40">
                                <Icono nombre="documentos" className="h-7 w-7 text-slate-400" />
                                <span className="text-xs font-semibold text-slate-600">
                                    {editingId ? 'Reemplazar archivo' : 'Subir archivo'}
                                </span>
                                <span className="text-[11px] text-slate-400">PDF, Word, Excel o PowerPoint (máx. 20 MB).</span>
                                <input
                                    type="file"
                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                                    className="hidden"
                                    onChange={alSeleccionarArchivo}
                                />
                            </label>
                        )}
                        {error('archivo') && <p className="mt-1 text-xs text-red-600">{error('archivo')}</p>}
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-end gap-2">
                <button
                    type="button"
                    onClick={onCancelar}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={form.processing}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-900 disabled:opacity-60"
                >
                    <Icono nombre="guardar" className="h-4 w-4" />
                    {form.processing ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Registrar documento'}
                </button>
            </div>
        </form>
    );
}

function Papelera({ papelera, onRestaurar, onEliminarPermanente }) {
    const items = papelera;

    return (
        <div className="mt-4">
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                Los documentos se eliminan permanentemente 7 días después de enviarlos a la papelera.
            </div>

            {items == null ? (
                <p className="mt-6 text-center text-sm text-slate-400">Cargando papelera…</p>
            ) : items.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
                    <Icono nombre="basura" className="mx-auto h-8 w-8 text-slate-300" />
                    <p className="mt-3 text-sm text-slate-500">La papelera está vacía.</p>
                </div>
            ) : (
                <div className="mt-3 space-y-3">
                    {items.map((d) => (
                        <div key={d.id} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="min-w-0 flex-1">
                                <h3 className="truncate text-sm font-bold text-slate-900">{d.titulo}</h3>
                                <p className="mt-0.5 text-[11px] text-slate-400">
                                    {d.categoria}
                                    {d.eliminada_por ? ` · Eliminado por ${d.eliminada_por}` : ''}
                                </p>
                                <span className="mt-1 inline-flex rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700 ring-1 ring-red-200">
                                    Se elimina en {d.dias_restantes} día{d.dias_restantes === 1 ? '' : 's'}
                                </span>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                                {d.puede_restaurar && (
                                    <button
                                        onClick={() => onRestaurar(d)}
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                                    >
                                        <Icono nombre="deshacer" className="h-3.5 w-3.5" /> Restaurar
                                    </button>
                                )}
                                {d.puede_permanente && (
                                    <button
                                        onClick={() => onEliminarPermanente(d)}
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                                    >
                                        <Icono nombre="basura" className="h-3.5 w-3.5" /> Eliminar
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}


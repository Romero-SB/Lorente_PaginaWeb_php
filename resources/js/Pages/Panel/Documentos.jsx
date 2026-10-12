import { router, useForm, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';

import GestorCategorias from '../../Components/Panel/GestorCategorias';
import { Icono } from '../../Components/Panel/Iconos';
import Boton from '../../Components/Shared/Boton';
import Campo from '../../Components/Shared/Campo';
import EmptyState from '../../Components/Shared/EmptyState';
import FileDropzone from '../../Components/Shared/FileDropzone';
import PageHeader from '../../Components/Shared/PageHeader';
import Papelera from '../../Components/Shared/Papelera';
import { EXTENSIONES, colorExtension, extensionDe } from '../../lib/archivos';
import { toast } from '../../lib/toast';

const PESO_ARCHIVO = 20 * 1024 * 1024;

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
            <PageHeader
                titulo="Documentos"
                descripcion={
                    auth.user?.role === 'docente'
                        ? 'Gestiona los documentos que has registrado.'
                        : 'Administra los documentos de la institución.'
                }
            >
                {puedeGestionarCategorias && (
                    <Boton onClick={() => setGestorAbierto(true)} className="px-3 py-2 text-sm border-slate-200 hover:bg-slate-50">
                        <Icono nombre="caja" className="h-4 w-4" /> Categorías
                    </Boton>
                )}
                <button
                    type="button"
                    onClick={abrirPapelera}
                    className={`panel-boton--secundario inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                        vista === 'papelera'
                            ? 'border-blue-300 bg-blue-50 text-blue-800'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                >
                    <Icono nombre="basura" className="h-4 w-4" /> Papelera
                </button>
                <Boton variante="primario" onClick={abrirNueva} className="px-3 py-2 text-sm">
                    <Icono nombre="mas" className="h-4 w-4" /> Nuevo documento
                </Boton>
            </PageHeader>

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
                <Papelera
                    items={papelera}
                    aviso="Los documentos se eliminan permanentemente 7 días después de enviarlos a la papelera."
                    renderTitulo={(d) => (
                        <>
                            <h3 className="truncate text-sm font-bold text-slate-900">{d.titulo}</h3>
                            <p className="mt-0.5 text-[11px] text-slate-400">
                                {d.categoria}
                                {d.eliminada_por ? ` · Eliminado por ${d.eliminada_por}` : ''}
                            </p>
                        </>
                    )}
                    onRestaurar={restaurar}
                    onEliminarPermanente={eliminarPermanente}
                />
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
                        className="panel-campo w-full pl-9"
                    />
                </div>
                <select
                    value={filtroCategoria}
                    onChange={(e) => setFiltroCategoria(e.target.value)}
                    className="panel-campo w-full sm:w-auto"
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
                <EmptyState icono="documentos" mensaje="No hay documentos para mostrar." />
            ) : (
                <div className="panel-tarjeta--lista space-y-3">
                    {documentos.map((d) => {
                        const ext = extensionDe(d.archivo?.nombre);
                        return (
                            <div key={d.id} className="panel-tarjeta flex gap-4 p-4">
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
                                            className="panel-boton--secundario inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                                        >
                                            <Icono nombre="adjunto" className="h-3.5 w-3.5" /> Abrir
                                        </a>
                                    )}
                                    {d.puede_editar && (
                                        <Boton onClick={() => onEditar(d)} className="px-3 py-1.5 text-xs border-slate-200 hover:bg-slate-50">
                                            <Icono nombre="editar" className="h-3.5 w-3.5" /> Editar
                                        </Boton>
                                    )}
                                    {d.puede_eliminar && (
                                        <Boton onClick={() => onEliminar(d)} className="px-3 py-1.5 text-xs border-red-100 text-red-600 hover:bg-red-50">
                                            <Icono nombre="basura" className="h-3.5 w-3.5" /> Eliminar
                                        </Boton>
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
            <div className="panel-tarjeta p-5">
                <div className="panel-rejilla-2 grid gap-4">
                    <Campo etiqueta="Título *" error={error('titulo')} id="documento-titulo" className="panel-celda-2">
                        <input
                            id="documento-titulo"
                            value={form.data.titulo}
                            onChange={(e) => form.setData('titulo', e.target.value)}
                            className="panel-campo w-full"
                        />
                    </Campo>

                    <Campo etiqueta="Categoría *" error={error('categoria')} id="documento-categoria">
                        <select
                            id="documento-categoria"
                            value={form.data.categoria}
                            onChange={(e) => form.setData('categoria', e.target.value)}
                            className="panel-campo w-full"
                        >
                            <option value="">Seleccionar categoría</option>
                            {categorias.map((c) => (
                                <option key={c.id} value={c.nombre}>
                                    {c.nombre}
                                </option>
                            ))}
                        </select>
                    </Campo>

                    <Campo etiqueta="Visibilidad *" error={error('visibilidad')} id="documento-visibilidad">
                        <select
                            id="documento-visibilidad"
                            value={form.data.visibilidad}
                            onChange={(e) => form.setData('visibilidad', e.target.value)}
                            className="panel-campo w-full"
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
                    </Campo>

                    <Campo etiqueta="Descripción" error={error('descripcion')} id="documento-descripcion" className="panel-celda-2">
                        <textarea
                            id="documento-descripcion"
                            rows={2}
                            value={form.data.descripcion}
                            onChange={(e) => form.setData('descripcion', e.target.value)}
                            className="panel-campo w-full resize-y"
                        />
                    </Campo>

                    <Campo
                        etiqueta={<>Instrucciones <span className="font-normal text-slate-400">(opcional)</span></>}
                        error={error('instrucciones')}
                        id="documento-instrucciones"
                        className="panel-celda-2"
                    >
                        <textarea
                            id="documento-instrucciones"
                            rows={2}
                            value={form.data.instrucciones}
                            onChange={(e) => form.setData('instrucciones', e.target.value)}
                            className="panel-campo w-full resize-y"
                        />
                    </Campo>

                    <Campo etiqueta={`Archivo ${!editingId ? '*' : ''}`} error={error('archivo')} id="documento-archivo" className="panel-celda-2">
                        {archivo ? (
                            <div className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2">
                                <Icono nombre="adjunto" className="h-4 w-4 shrink-0 text-slate-400" />
                                <span className="min-w-0 flex-1 truncate text-xs text-slate-700">{archivo.name}</span>
                                <button type="button" onClick={onQuitarArchivo} className="text-slate-400 transition hover:text-red-500" title="Quitar archivo">
                                    <Icono nombre="cerrar" className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        ) : (
                            <FileDropzone
                                icono="documentos"
                                texto={editingId ? 'Reemplazar archivo' : 'Subir archivo'}
                                nota="PDF, Word, Excel o PowerPoint (máx. 20 MB)."
                                aceptacion=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                                resaltable={false}
                                onSeleccionar={alSeleccionarArchivo}
                            />
                        )}
                    </Campo>
                </div>
            </div>

            <div className="flex items-center justify-end gap-2">
                <Boton type="button" onClick={onCancelar} className="px-4 py-2 text-sm hover:bg-slate-50">
                    Cancelar
                </Boton>
                <Boton
                    variante="primario"
                    type="submit"
                    disabled={form.processing}
                    className="px-4 py-2 text-sm disabled:opacity-60"
                >
                    <Icono nombre="guardar" className="h-4 w-4" />
                    {form.processing ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Registrar documento'}
                </Boton>
            </div>
        </form>
    );
}
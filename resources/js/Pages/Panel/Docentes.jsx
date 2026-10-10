import { router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

import { Icono } from '../../Components/Panel/Iconos';
import GestorCategorias from '../../Components/Panel/GestorCategorias';
import Recortador from '../../Components/Panel/Recortador';
import PanelLayout from '../../Layouts/PanelLayout';
import { toast } from '../../lib/toast';

const PESO_FOTO = 3 * 1024 * 1024;

function reordenarLista(lista, desde, hasta) {
    if (desde === hasta || desde == null || hasta == null) return lista;
    const copia = [...lista];
    const [movida] = copia.splice(desde, 1);
    copia.splice(hasta, 0, movida);
    return copia;
}

export default function Docentes({ docentes = [], categorias = [], papelera }) {
    const { auth } = usePage().props;
    const [vista, setVista] = useState('lista');
    const [editingId, setEditingId] = useState(null);
    const [busqueda, setBusqueda] = useState('');
    const [gestorAbierto, setGestorAbierto] = useState(false);

    const [locales, setLocales] = useState(docentes);
    const [cats, setCats] = useState(categorias);

    const [fotoFile, setFotoFile] = useState(null);
    const [fotoPreview, setFotoPreview] = useState(null);
    const [fotoBorrar, setFotoBorrar] = useState(false);
    const [cropSrc, setCropSrc] = useState(null);

    const form = useForm({ nombre: '', cargo: '', categoria: '' });

    useEffect(() => {
        setLocales(docentes);
    }, [docentes]);

    useEffect(() => {
        setCats(categorias);
    }, [categorias]);

    useEffect(() => () => {
        if (cropSrc) URL.revokeObjectURL(cropSrc);
    }, [cropSrc]);

    const esAdmin = auth.user?.role === 'administrador';

    function limpiarFoto() {
        setFotoFile(null);
        setFotoPreview(null);
        setFotoBorrar(false);
        if (cropSrc) URL.revokeObjectURL(cropSrc);
        setCropSrc(null);
    }

    function abrirLista() {
        setVista('lista');
        setEditingId(null);
        form.clearErrors();
        limpiarFoto();
    }

    function abrirNueva() {
        setEditingId(null);
        form.reset();
        form.clearErrors();
        limpiarFoto();
        setVista('form');
    }

    function abrirEditar(doc) {
        setEditingId(doc.id);
        form.clearErrors();
        form.setData({
            nombre: doc.nombre || '',
            cargo: doc.cargo || '',
            categoria: doc.categoria || '',
        });
        setFotoFile(null);
        setFotoPreview(doc.foto || null);
        setFotoBorrar(false);
        setVista('form');
    }

    function abrirPapelera() {
        setVista('papelera');
        router.reload({ only: ['papelera'] });
    }

    function alSeleccionarFoto(e) {
        const archivo = e.target.files?.[0];
        e.target.value = '';
        if (!archivo) return;
        if (!archivo.type.startsWith('image/')) {
            toast('El archivo no es una imagen', 'error');
            return;
        }
        if (archivo.size > PESO_FOTO) {
            toast('La imagen supera los 3 MB', 'error');
            return;
        }
        if (cropSrc) URL.revokeObjectURL(cropSrc);
        setCropSrc(URL.createObjectURL(archivo));
    }

    function alConfirmarRecorte(archivo) {
        if (cropSrc) URL.revokeObjectURL(cropSrc);
        setCropSrc(null);
        setFotoFile(archivo);
        setFotoPreview(URL.createObjectURL(archivo));
        setFotoBorrar(false);
    }

    function quitarFoto() {
        setFotoFile(null);
        setFotoPreview(null);
        setFotoBorrar(true);
    }

    function enviar(e) {
        e.preventDefault();
        const url = editingId ? `/lorente-panel/docentes/${editingId}` : '/lorente-panel/docentes';

        form.transform((data) => {
            const salida = {
                nombre: data.nombre,
                cargo: data.cargo,
                categoria: data.categoria,
                foto_borrar: fotoBorrar ? 1 : 0,
            };
            if (fotoFile) salida.foto = fotoFile;
            return salida;
        });

        form.post(url, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => abrirLista(),
        });
    }

    function eliminar(doc) {
        if (!confirm(`¿Mover a la papelera a "${doc.nombre}"?`)) return;
        router.post(`/lorente-panel/docentes/${doc.id}/eliminar`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                setLocales((prev) => prev.filter((d) => d.id !== doc.id));
            },
        });
    }

    function restaurar(doc) {
        router.post(`/lorente-panel/docentes/${doc.id}/restaurar`, {}, {
            preserveScroll: true,
            onSuccess: () => router.reload({ only: ['papelera'] }),
        });
    }

    function eliminarPermanente(doc) {
        if (!confirm(`¿Eliminar permanentemente a "${doc.nombre}"? Esta acción no se puede deshacer.`)) return;
        router.post(`/lorente-panel/docentes/${doc.id}/permanente`, {}, {
            preserveScroll: true,
            onSuccess: () => router.reload({ only: ['papelera'] }),
        });
    }

    function soltarDocente(categoria, desde, hasta) {
        if (desde === hasta) return;
        const delCat = locales
            .filter((d) => d.categoria === categoria)
            .sort((a, b) => a.orden - b.orden || a.id - b.id);
        const otros = locales.filter((d) => d.categoria !== categoria);
        const copia = reordenarLista(delCat, desde, hasta).map((d, i) => ({ ...d, orden: (i + 1) * 10 }));

        setLocales([...otros, ...copia]);
        router.post('/lorente-panel/docentes/reordenar', {
            items: copia.map((d) => ({ id: d.id, orden: d.orden })),
        }, { preserveScroll: true });
    }

    const filtrados = useMemo(() => {
        const q = busqueda.trim().toLowerCase();
        if (!q) return locales;
        return locales.filter((d) => d.nombre.toLowerCase().includes(q) || d.cargo.toLowerCase().includes(q));
    }, [locales, busqueda]);

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Docentes</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Registra al personal y organízalo por categorías.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setGestorAbierto(true)}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                        <Icono nombre="caja" className="h-4 w-4" /> Categorías
                    </button>
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
                        <Icono nombre="mas" className="h-4 w-4" /> Nuevo docente
                    </button>
                </div>
            </div>

            {vista === 'lista' && (
                <Lista
                    categorias={cats}
                    docentes={filtrados}
                    busqueda={busqueda}
                    setBusqueda={setBusqueda}
                    onEditar={abrirEditar}
                    onEliminar={eliminar}
                    onSoltarDocente={soltarDocente}
                />
            )}

            {vista === 'papelera' && (
                <Papelera papelera={papelera} esAdmin={esAdmin} onRestaurar={restaurar} onEliminarPermanente={eliminarPermanente} />
            )}

            {vista === 'form' && (
                <Formulario
                    form={form}
                    editingId={editingId}
                    categorias={cats}
                    fotoPreview={fotoPreview}
                    alSeleccionarFoto={alSeleccionarFoto}
                    quitarFoto={quitarFoto}
                    onSubmit={enviar}
                    onCancelar={abrirLista}
                />
            )}

            {gestorAbierto && (
                <GestorCategorias
                    categorias={cats}
                    baseUrl="/lorente-panel/docente-categorias"
                    bloqueoKey="docentes"
                    bloqueoEtiqueta="docentes"
                    onClose={() => setGestorAbierto(false)}
                />
            )}

            {cropSrc && (
                <Recortador
                    imagen={cropSrc}
                    aspect={4 / 5}
                    onCancelar={() => {
                        URL.revokeObjectURL(cropSrc);
                        setCropSrc(null);
                    }}
                    onConfirmar={alConfirmarRecorte}
                />
            )}
        </div>
    );
}

function Lista({ categorias, docentes, busqueda, setBusqueda, onEditar, onEliminar, onSoltarDocente }) {
    const [origen, setOrigen] = useState(null);
    const [destino, setDestino] = useState(null);

    const grupos = categorias
        .map((c) => ({
            categoria: c,
            items: docentes
                .filter((d) => d.categoria === c.nombre)
                .sort((a, b) => a.orden - b.orden || a.id - b.id),
        }))
        .filter((g) => g.items.length > 0);

    const huerfanos = docentes.filter((d) => !categorias.some((c) => c.nombre === d.categoria));
    if (huerfanos.length) grupos.push({ categoria: { nombre: 'Sin categoría' }, items: huerfanos });

    return (
        <div className="mt-4">
            <div className="relative mb-3">
                <Icono nombre="buscar" className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
                <input
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar por nombre o cargo…"
                    className="w-full rounded-lg border border-slate-200 bg-white py-2 pr-3 pl-9 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
            </div>

            {grupos.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
                    <Icono nombre="docentes" className="mx-auto h-8 w-8 text-slate-300" />
                    <p className="mt-3 text-sm text-slate-500">Aún no hay docentes registrados.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {grupos.map(({ categoria, items }) => (
                        <div key={categoria.nombre} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
                                <Icono nombre="caja" className="h-4 w-4 text-slate-400" /> {categoria.nombre}
                                <span className="text-xs font-normal text-slate-400">({items.length})</span>
                            </h3>
                            <div className="space-y-2">
                                {items.map((doc, idx) => (
                                    <div
                                        key={doc.id}
                                        draggable
                                        onDragStart={() => setOrigen(idx)}
                                        onDragOver={(e) => {
                                            e.preventDefault();
                                            setDestino(idx);
                                        }}
                                        onDrop={() => {
                                            onSoltarDocente(categoria.nombre, origen, idx);
                                            setOrigen(null);
                                            setDestino(null);
                                        }}
                                        onDragEnd={() => {
                                            setOrigen(null);
                                            setDestino(null);
                                        }}
                                        className={`flex items-center gap-3 rounded-xl border bg-white p-3 transition ${
                                            destino === idx && origen !== null && origen !== idx
                                                ? 'border-blue-300 ring-2 ring-blue-100'
                                                : 'border-slate-200'
                                        }`}
                                    >
                                        <button type="button" className="cursor-grab text-slate-300 active:cursor-grabbing" title="Arrastrar para reordenar">
                                            <Icono nombre="grip" className="h-4 w-4" />
                                        </button>
                                        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                                            {doc.foto ? (
                                                <img src={doc.foto} alt="" className="h-full w-full object-cover" />
                                            ) : (
                                                <div className="grid h-full w-full place-items-center text-slate-300">
                                                    <Icono nombre="docentes" className="h-5 w-5" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-bold text-slate-900">{doc.nombre}</p>
                                            <p className="truncate text-xs text-slate-500">{doc.cargo}</p>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-2">
                                            <button
                                                onClick={() => onEditar(doc)}
                                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                                            >
                                                <Icono nombre="editar" className="h-3.5 w-3.5" /> Editar
                                            </button>
                                            <button
                                                onClick={() => onEliminar(doc)}
                                                className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                                            >
                                                <Icono nombre="basura" className="h-3.5 w-3.5" /> Eliminar
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function Formulario({ form, editingId, categorias, fotoPreview, alSeleccionarFoto, quitarFoto, onSubmit, onCancelar }) {
    const error = (campo) => form.errors[campo];

    return (
        <form onSubmit={onSubmit} className="mt-4 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                        <label className="mb-1 block text-xs font-semibold text-slate-600">Nombre y apellidos *</label>
                        <input
                            value={form.data.nombre}
                            onChange={(e) => form.setData('nombre', e.target.value)}
                            placeholder="Ej. Ghena Tacuri Victorio"
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                        />
                        {error('nombre') && <p className="mt-1 text-xs text-red-600">{error('nombre')}</p>}
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-600">Cargo / Curso asignado *</label>
                        <input
                            value={form.data.cargo}
                            onChange={(e) => form.setData('cargo', e.target.value)}
                            placeholder="Ej. Docente de Primaria"
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                        />
                        {error('cargo') && <p className="mt-1 text-xs text-red-600">{error('cargo')}</p>}
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

                    <div className="sm:col-span-2">
                        <label className="mb-1 block text-xs font-semibold text-slate-600">
                            Fotografía de perfil {!editingId && '*'}
                        </label>
                        {fotoPreview ? (
                            <div className="flex items-center gap-4">
                                <div className="h-28 w-24 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                                    <img src={fotoPreview} alt="" className="h-full w-full object-cover" />
                                </div>
                                <button
                                    type="button"
                                    onClick={quitarFoto}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                                >
                                    <Icono nombre="cerrar" className="h-3.5 w-3.5" /> Quitar foto
                                </button>
                            </div>
                        ) : (
                            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center transition hover:border-blue-300 hover:bg-blue-50/40">
                                <Icono nombre="imagen" className="h-7 w-7 text-slate-400" />
                                <span className="text-xs font-semibold text-slate-600">Subir foto del docente</span>
                                <span className="text-[11px] text-slate-400">JPG, PNG o WebP (máx. 3 MB). Se recorta a 4:5.</span>
                                <input type="file" accept="image/*" className="hidden" onChange={alSeleccionarFoto} />
                            </label>
                        )}
                        {error('foto') && <p className="mt-1 text-xs text-red-600">{error('foto')}</p>}
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
                    {form.processing ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Registrar docente'}
                </button>
            </div>
        </form>
    );
}

function Papelera({ papelera, esAdmin, onRestaurar, onEliminarPermanente }) {
    const items = papelera;

    return (
        <div className="mt-4">
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                Los docentes se eliminan permanentemente 7 días después de enviarlos a la papelera.
                {esAdmin && ' Solo ves los que tú enviaste.'}
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
                            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                                {d.foto ? (
                                    <img src={d.foto} alt="" className="h-full w-full object-cover" />
                                ) : (
                                    <div className="grid h-full w-full place-items-center text-slate-300">
                                        <Icono nombre="docentes" className="h-5 w-5" />
                                    </div>
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="truncate text-sm font-bold text-slate-900">{d.nombre}</h3>
                                <p className="mt-0.5 text-[11px] text-slate-400">
                                    {d.cargo}
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

Docentes.layout = (page) => <PanelLayout children={page} />;

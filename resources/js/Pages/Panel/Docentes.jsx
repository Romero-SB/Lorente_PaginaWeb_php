import { router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

import { Icono } from '../../Components/Panel/Iconos';
import GestorCategorias from '../../Components/Panel/GestorCategorias';
import Recortador from '../../Components/Panel/Recortador';
import Boton from '../../Components/Shared/Boton';
import Campo from '../../Components/Shared/Campo';
import EmptyState from '../../Components/Shared/EmptyState';
import FileDropzone from '../../Components/Shared/FileDropzone';
import PageHeader from '../../Components/Shared/PageHeader';
import Papelera from '../../Components/Shared/Papelera';
import useReordenarArrastre from '../../hooks/useReordenarArrastre';
import { reordenarLista } from '../../lib/reordenar';
import { toast } from '../../lib/toast';

const PESO_FOTO = 3 * 1024 * 1024;

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

    const docentesMuestra = useMemo(() => {
        const mapa = {};
        for (const d of locales) {
            if (d.categoria && !mapa[d.categoria]) {
                mapa[d.categoria] = { nombre: d.nombre, cargo: d.cargo, foto: d.foto };
            }
        }
        return mapa;
    }, [locales]);

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

    function procesarArchivoFoto(archivo) {
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

    function alSeleccionarFoto(e) {
        const archivo = e.target.files?.[0];
        e.target.value = '';
        procesarArchivoFoto(archivo);
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
            <PageHeader
                titulo="Docentes"
                descripcion="Registra al personal y organízalo por categorías."
            >
                <Boton onClick={() => setGestorAbierto(true)} className="px-3 py-2 text-sm border-slate-200 hover:bg-slate-50">
                    <Icono nombre="caja" className="h-4 w-4" /> Categorías
                </Boton>
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
                    <Icono nombre="mas" className="h-4 w-4" /> Nuevo docente
                </Boton>
            </PageHeader>

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
                <Papelera
                    items={papelera}
                    aviso={`Los docentes se eliminan permanentemente 7 días después de enviarlos a la papelera.${
                        esAdmin ? ' Solo ves los que tú enviaste.' : ''
                    }`}
                    thumb={(d) => (
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                            {d.foto ? (
                                <img src={d.foto} alt="" className="h-full w-full object-cover" />
                            ) : (
                                <div className="grid h-full w-full place-items-center text-slate-300">
                                    <Icono nombre="docentes" className="h-5 w-5" />
                                </div>
                            )}
                        </div>
                    )}
                    renderTitulo={(d) => (
                        <>
                            <h3 className="truncate text-sm font-bold text-slate-900">{d.nombre}</h3>
                            <p className="mt-0.5 text-[11px] text-slate-400">
                                {d.cargo}
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
                    categorias={cats}
                    fotoPreview={fotoPreview}
                    alSeleccionarFoto={alSeleccionarFoto}
                    alSoltarFoto={procesarArchivoFoto}
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
                    permitirEstilo
                    docentesMuestra={docentesMuestra}
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
    const { origen, destino, iniciar } = useReordenarArrastre({
        onSoltar: (desde, hasta, grupo) => onSoltarDocente(grupo, desde, hasta),
    });

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
                    className="panel-campo w-full pl-9"
                />
            </div>

            {grupos.length === 0 ? (
                <EmptyState icono="docentes" mensaje="Aún no hay docentes registrados." />
            ) : (
                <div className="space-y-6">
                    {grupos.map(({ categoria, items }) => (
                        <div key={categoria.nombre} className="panel-tarjeta p-4">
                            <h3 className="panel-titulo-bloque mb-3 flex items-center gap-2">
                                <Icono nombre="caja" className="h-4 w-4 text-slate-400" /> {categoria.nombre}
                                <span className="text-xs font-normal text-slate-400">({items.length})</span>
                            </h3>
                            <div className="space-y-2">
                                {items.map((doc, idx) => (
                                    <div
                                        key={doc.id}
                                        data-reordenar-indice={idx}
                                        data-reordenar-grupo={categoria.nombre}
                                        className={`flex flex-wrap items-center gap-3 rounded-xl border bg-white p-3 transition ${
                                            destino === idx && origen !== null && origen !== idx
                                                ? 'border-blue-300 ring-2 ring-blue-100'
                                                : 'border-slate-200'
                                        } ${origen === idx ? 'opacity-60' : ''}`}
                                    >
                                        <button
                                            type="button"
                                            className={`panel-agarre -m-1 shrink-0 rounded p-1 text-slate-300 transition active:cursor-grabbing ${
                                                categoria.nombre === 'Sin categoría'
                                                    ? 'cursor-not-allowed opacity-40'
                                                    : 'cursor-grab hover:text-slate-500'
                                            }`}
                                            title={categoria.nombre === 'Sin categoría' ? 'Asigna una categoría para reordenar' : 'Arrastrar para reordenar'}
                                            aria-label={`Reordenar a ${doc.nombre}`}
                                            disabled={categoria.nombre === 'Sin categoría'}
                                            onPointerDown={
                                                categoria.nombre === 'Sin categoría'
                                                    ? undefined
                                                    : (e) => iniciar(e, idx, categoria.nombre)
                                            }
                                        >
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
                                        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                                            <Boton onClick={() => onEditar(doc)} className="px-3 py-1.5 text-xs border-slate-200 hover:bg-slate-50">
                                                <Icono nombre="editar" className="h-3.5 w-3.5" /> Editar
                                            </Boton>
                                            <Boton onClick={() => onEliminar(doc)} className="px-3 py-1.5 text-xs border-red-100 text-red-600 hover:bg-red-50">
                                                <Icono nombre="basura" className="h-3.5 w-3.5" /> Eliminar
                                            </Boton>
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

function Formulario({ form, editingId, categorias, fotoPreview, alSeleccionarFoto, alSoltarFoto, quitarFoto, onSubmit, onCancelar }) {
    const error = (campo) => form.errors[campo];

    return (
        <form onSubmit={onSubmit} className="mt-4 space-y-4">
            <div className="panel-tarjeta p-5">
                <div className="panel-rejilla-2 grid gap-4">
                    <Campo etiqueta="Nombre y apellidos *" error={error('nombre')} id="docente-nombre" className="panel-celda-2">
                        <input
                            id="docente-nombre"
                            value={form.data.nombre}
                            onChange={(e) => form.setData('nombre', e.target.value)}
                            placeholder="Ej. Ghena Tacuri Victorio"
                            className="panel-campo w-full"
                        />
                    </Campo>

                    <Campo etiqueta="Cargo / Curso asignado *" error={error('cargo')} id="docente-cargo">
                        <input
                            id="docente-cargo"
                            value={form.data.cargo}
                            onChange={(e) => form.setData('cargo', e.target.value)}
                            placeholder="Ej. Docente de Primaria"
                            className="panel-campo w-full"
                        />
                    </Campo>

                    <Campo etiqueta="Categoría *" error={error('categoria')} id="docente-categoria">
                        <select
                            id="docente-categoria"
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

                    <Campo
                        etiqueta={`Fotografía de perfil ${!editingId ? '*' : ''}`}
                        error={error('foto')}
                        id="docente-foto"
                        className="panel-celda-2"
                    >
                        {fotoPreview ? (
                            <div className="flex items-center gap-4">
                                <div className="h-28 w-24 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                                    <img src={fotoPreview} alt="" className="h-full w-full object-cover" />
                                </div>
                                <Boton onClick={quitarFoto} className="px-3 py-1.5 text-xs border-red-100 text-red-600 hover:bg-red-50">
                                    <Icono nombre="cerrar" className="h-3.5 w-3.5" /> Quitar foto
                                </Boton>
                            </div>
                        ) : (
                            <FileDropzone
                                icono="imagen"
                                texto="Subir foto del docente"
                                textoArrastrando="Suelta la imagen aquí"
                                nota="JPG, PNG o WebP (máx. 3 MB). Se recorta a 4:5."
                                aceptacion="image/*"
                                onSoltarArchivo={alSoltarFoto}
                                onSeleccionar={alSeleccionarFoto}
                            />
                        )}
                    </Campo>
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
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
                    {form.processing ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Registrar docente'}
                </Boton>
            </div>
        </form>
    );
}
import { router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

import { Icono } from '../../Components/Panel/Iconos';
import Boton from '../../Components/Shared/Boton';
import Campo from '../../Components/Shared/Campo';
import EmptyState from '../../Components/Shared/EmptyState';
import PageHeader from '../../Components/Shared/PageHeader';
import Papelera from '../../Components/Shared/Papelera';
import { EXTENSIONES, extensionDe } from '../../lib/archivos';
import { registerDraftSaver, restaurarBorrador, limpiarBorrador } from '../../lib/draft';
import { formatoFecha } from '../../lib/fecha';
import { comprimirAWebp, formatoPeso } from '../../lib/image';
import { reordenar } from '../../lib/reordenar';
import { toast } from '../../lib/toast';

const LIMITE_IMAGENES = 10;
const PESO_IMAGEN = 3 * 1024 * 1024;
const PESO_ADJUNTO = 15 * 1024 * 1024;

export default function Noticias({ noticias = [], categorias = {}, papelera }) {
    const { auth } = usePage().props;
    const [vista, setVista] = useState('lista');
    const [editingId, setEditingId] = useState(null);
    const [busqueda, setBusqueda] = useState('');
    const [imagenes, setImagenes] = useState([]);
    const [adjuntos, setAdjuntos] = useState([]);

    const form = useForm({
        titulo: '',
        fec: '',
        cat: '',
        res: '',
        con: '',
        est: 'borrador',
    });

    const estadoBorrador = useRef({});
    estadoBorrador.current = { vista, editingId, ...form.data };

    useEffect(() => {
        registerDraftSaver(() => {
            const actual = estadoBorrador.current;
            if (actual.vista !== 'form' || actual.editingId) return null;
            if (!actual.titulo && !actual.res && !actual.con) return null;
            const { titulo, fec, cat, res, con, est } = actual;
            return { titulo, fec, cat, res, con, est };
        });
    }, []);

    const esDocente = auth.user?.role === 'docente';

    function abrirLista() {
        setVista('lista');
        setEditingId(null);
        form.clearErrors();
    }

    function abrirNueva() {
        setEditingId(null);
        form.reset();
        form.clearErrors();
        setImagenes([]);
        setAdjuntos([]);

        const borrador = restaurarBorrador();
        if (borrador) {
            form.setData((d) => ({ ...d, ...borrador }));
            limpiarBorrador();
            toast('Se restauró tu progreso anterior', 'ok');
        }
        setVista('form');
    }

    function abrirEditar(n) {
        setEditingId(n.id);
        form.clearErrors();
        form.setData({
            titulo: n.titulo || '',
            fec: n.fec ? n.fec.slice(0, 10) : '',
            cat: n.cat || '',
            res: n.res || '',
            con: n.con || '',
            est: n.est || 'borrador',
        });
        setImagenes((n.imagenes || []).map((i) => ({ tipo: 'existente', key: `e-${i.id}`, id: i.id, url: i.url })));
        setAdjuntos(
            (n.adjuntos || []).map((a) => ({ tipo: 'existente', key: `e-${a.id}`, id: a.id, nombre: a.nombre, peso: a.peso, mime: a.mime })),
        );
        setVista('form');
    }

    function abrirPapelera() {
        setVista('papelera');
        router.reload({ only: ['papelera'] });
    }

    function enviar(e) {
        e.preventDefault();
        const url = editingId ? `/lorente-panel/noticias/${editingId}` : '/lorente-panel/noticias';

        form.transform((data) => ({
            ...data,
            imagenes_plan: JSON.stringify(
                imagenes.map((i) => (i.tipo === 'existente' ? { tipo: 'existente', id: i.id } : { tipo: 'nueva' })),
            ),
            imagenes_nuevas: imagenes.filter((i) => i.tipo === 'nueva').map((i) => i.file),
            adjuntos_plan: JSON.stringify(
                adjuntos.map((a) => (a.tipo === 'existente' ? { tipo: 'existente', id: a.id } : { tipo: 'nueva' })),
            ),
            adjuntos_nuevas: adjuntos.filter((a) => a.tipo === 'nueva').map((a) => a.file),
        }));

        form.post(url, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                limpiarBorrador();
                abrirLista();
            },
        });
    }

    function eliminar(n) {
        if (!confirm(`¿Mover a la papelera la noticia "${n.titulo}"?`)) return;
        router.post(`/lorente-panel/noticias/${n.id}/eliminar`, {}, { preserveScroll: true });
    }

    function restaurar(n) {
        router.post(`/lorente-panel/noticias/${n.id}/restaurar`, {}, { preserveScroll: true, onSuccess: () => router.reload({ only: ['papelera'] }) });
    }

    function eliminarPermanente(n) {
        if (!confirm(`¿Eliminar permanentemente "${n.titulo}"? Esta acción no se puede deshacer.`)) return;
        router.post(`/lorente-panel/noticias/${n.id}/permanente`, {}, { preserveScroll: true, onSuccess: () => router.reload({ only: ['papelera'] }) });
    }

    async function alSeleccionarImagenes(e) {
        const archivos = Array.from(e.target.files || []);
        e.target.value = '';
        if (!archivos.length) return;

        const espacio = LIMITE_IMAGENES - imagenes.length;
        if (espacio <= 0) {
            toast('Máximo 10 imágenes por noticia', 'error');
            return;
        }
        if (archivos.length > espacio) {
            toast(`Solo se agregarán ${espacio} imágenes (límite de 10)`, 'error');
        }

        const nuevas = [];
        for (const archivo of archivos.slice(0, espacio)) {
            if (!archivo.type.startsWith('image/')) {
                toast(`${archivo.name} no es una imagen`, 'error');
                continue;
            }
            if (archivo.size > PESO_IMAGEN) {
                toast(`${archivo.name} supera los 3 MB`, 'error');
                continue;
            }
            const comprimida = await comprimirAWebp(archivo);
            nuevas.push({
                tipo: 'nueva',
                key: `n-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                file: comprimida,
                url: URL.createObjectURL(comprimida),
            });
        }
        if (nuevas.length) setImagenes((prev) => [...prev, ...nuevas]);
    }

    function alSeleccionarAdjuntos(e) {
        const archivos = Array.from(e.target.files || []);
        e.target.value = '';
        if (!archivos.length) return;

        const nuevos = [];
        for (const archivo of archivos) {
            if (!EXTENSIONES.includes(extensionDe(archivo.name))) {
                toast(`${archivo.name} no es un tipo permitido`, 'error');
                continue;
            }
            if (archivo.size > PESO_ADJUNTO) {
                toast(`${archivo.name} supera los 15 MB`, 'error');
                continue;
            }
            nuevos.push({
                tipo: 'nueva',
                key: `n-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                file: archivo,
                nombre: archivo.name,
                peso: archivo.size,
            });
        }
        if (nuevos.length) setAdjuntos((prev) => [...prev, ...nuevos]);
    }

    function hacerPortada(key) {
        setImagenes((prev) => {
            const idx = prev.findIndex((i) => i.key === key);
            if (idx <= 0) return prev;
            const copia = [...prev];
            const [item] = copia.splice(idx, 1);
            copia.unshift(item);
            return copia;
        });
    }

    const filtradas = noticias.filter((n) =>
        n.titulo?.toLowerCase().includes(busqueda.trim().toLowerCase()),
    );

    const chipEst = (est) =>
        est === 'publicado'
            ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
            : 'bg-amber-50 text-amber-700 ring-amber-200';

    return (
        <div>
            <PageHeader
                titulo="Noticias"
                descripcion={esDocente ? 'Gestiona las noticias que has publicado.' : 'Administra todas las noticias de la institución.'}
            >
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
                    <Icono nombre="mas" className="h-4 w-4" /> Nueva noticia
                </Boton>
            </PageHeader>

            {vista === 'lista' && (
                <Lista
                    noticias={filtradas}
                    categorias={categorias}
                    busqueda={busqueda}
                    setBusqueda={setBusqueda}
                    chipEst={chipEst}
                    onEditar={abrirEditar}
                    onEliminar={eliminar}
                />
            )}

            {vista === 'papelera' && (
                <Papelera
                    items={papelera}
                    aviso="Las noticias se eliminan permanentemente 7 días después de enviarlas a la papelera."
                    renderTitulo={(n) => (
                        <>
                            <h3 className="truncate text-sm font-bold text-slate-900">{n.titulo}</h3>
                            <p className="mt-0.5 text-[11px] text-slate-400">
                                Autor: {n.autor?.name} · {formatoFecha(n.fec)}
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
                    imagenes={imagenes}
                    setImagenes={setImagenes}
                    adjuntos={adjuntos}
                    setAdjuntos={setAdjuntos}
                    alSeleccionarImagenes={alSeleccionarImagenes}
                    alSeleccionarAdjuntos={alSeleccionarAdjuntos}
                    hacerPortada={hacerPortada}
                    onSubmit={enviar}
                    onCancelar={abrirLista}
                />
            )}
        </div>
    );
}

function Lista({ noticias, categorias, busqueda, setBusqueda, chipEst, onEditar, onEliminar }) {
    if (!noticias.length) {
        return <EmptyState icono="noticias" mensaje="No hay noticias para mostrar." />;
    }

    return (
        <div className="mt-4">
            <div className="relative mb-3">
                <Icono nombre="buscar" className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
                <input
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar por título…"
                    className="panel-campo w-full pl-9"
                />
            </div>

            <div className="panel-tarjeta--lista space-y-3">
                {noticias.map((n) => {
                    const portada = (n.imagenes || []).find((i) => i.es_portada) || (n.imagenes || [])[0];
                    return (
                        <div key={n.id} className="panel-tarjeta flex gap-4 p-4">
                            <div className="h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                                {portada ? (
                                    <img src={portada.url} alt="" className="h-full w-full object-cover" />
                                ) : (
                                    <div className="grid h-full w-full place-items-center text-slate-300">
                                        <Icono nombre="imagen" className="h-6 w-6" />
                                    </div>
                                )}
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${chipEst(n.est)}`}>
                                        {n.est === 'publicado' ? 'Publicado' : 'Borrador'}
                                    </span>
                                    {n.cat && (
                                        <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                                            {categorias[n.cat] || n.cat}
                                        </span>
                                    )}
                                    <span className="text-[11px] text-slate-400">{formatoFecha(n.fec)}</span>
                                </div>
                                <h3 className="mt-1 truncate text-sm font-bold text-slate-900">{n.titulo}</h3>
                                <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{n.res}</p>
                                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
                                    <span>
                                        Autor: <span className="text-slate-600">{n.autor?.name}</span>
                                        {n.autor?.cargo ? ` · ${n.autor.cargo}` : ''}
                                    </span>
                                    {n.modificado_por && <span>Editado por {n.modificado_por.name}</span>}
                                    {(n.imagenes || []).length > 0 && (
                                        <span className="inline-flex items-center gap-1">
                                            <Icono nombre="imagen" className="h-3.5 w-3.5" /> {n.imagenes.length}
                                        </span>
                                    )}
                                    {(n.adjuntos || []).length > 0 && (
                                        <span className="inline-flex items-center gap-1">
                                            <Icono nombre="adjunto" className="h-3.5 w-3.5" /> {n.adjuntos.length}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex shrink-0 flex-col items-end justify-center gap-2">
                                <Boton onClick={() => onEditar(n)} className="px-3 py-1.5 text-xs border-slate-200 hover:bg-slate-50">
                                    <Icono nombre="editar" className="h-3.5 w-3.5" /> Editar
                                </Boton>
                                <Boton onClick={() => onEliminar(n)} className="px-3 py-1.5 text-xs border-red-100 text-red-600 hover:bg-red-50">
                                    <Icono nombre="basura" className="h-3.5 w-3.5" /> Eliminar
                                </Boton>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function Formulario({
    form,
    editingId,
    categorias,
    imagenes,
    setImagenes,
    adjuntos,
    setAdjuntos,
    alSeleccionarImagenes,
    alSeleccionarAdjuntos,
    hacerPortada,
    onSubmit,
    onCancelar,
}) {
    const [origenImagen, setOrigenImagen] = useState(null);

    const error = (campo) => form.errors[campo];

    return (
        <form onSubmit={onSubmit} className="mt-4 space-y-4">
            <div className="panel-tarjeta p-5">
                <div className="panel-rejilla-2 grid gap-4">
                    <Campo etiqueta="Título *" error={error('titulo')} id="noticia-titulo" className="panel-celda-2">
                        <input
                            id="noticia-titulo"
                            value={form.data.titulo}
                            onChange={(e) => form.setData('titulo', e.target.value)}
                            className="panel-campo w-full"
                        />
                    </Campo>

                    <Campo etiqueta="Fecha *" error={error('fec')} id="noticia-fec">
                        <input
                            id="noticia-fec"
                            type="date"
                            value={form.data.fec}
                            onChange={(e) => form.setData('fec', e.target.value)}
                            className="panel-campo w-full"
                        />
                    </Campo>

                    <Campo etiqueta="Categoría" error={error('cat')} id="noticia-cat">
                        <select
                            id="noticia-cat"
                            value={form.data.cat}
                            onChange={(e) => form.setData('cat', e.target.value)}
                            className="panel-campo w-full"
                        >
                            <option value="">Sin categoría</option>
                            {Object.entries(categorias).map(([valor, etiqueta]) => (
                                <option key={valor} value={valor}>
                                    {etiqueta}
                                </option>
                            ))}
                        </select>
                    </Campo>

                    <Campo
                        etiqueta={<>Resumen <span className="font-normal text-slate-400">(mín. 10 caracteres)</span></>}
                        error={error('res')}
                        id="noticia-res"
                        className="panel-celda-2"
                    >
                        <textarea
                            id="noticia-res"
                            rows={2}
                            value={form.data.res}
                            onChange={(e) => form.setData('res', e.target.value)}
                            className="panel-campo w-full resize-y"
                        />
                    </Campo>

                    <Campo
                        etiqueta={<>Contenido <span className="font-normal text-slate-400">(mín. 20 caracteres)</span></>}
                        error={error('con')}
                        id="noticia-con"
                        className="panel-celda-2"
                    >
                        <textarea
                            id="noticia-con"
                            rows={7}
                            value={form.data.con}
                            onChange={(e) => form.setData('con', e.target.value)}
                            className="panel-campo w-full resize-y"
                        />
                    </Campo>

                    <Campo etiqueta="Estado" error={error('est')} id="noticia-est">
                        <select
                            id="noticia-est"
                            value={form.data.est}
                            onChange={(e) => form.setData('est', e.target.value)}
                            className="panel-campo w-full"
                        >
                            <option value="borrador">Borrador</option>
                            <option value="publicado">Publicado</option>
                        </select>
                    </Campo>
                </div>
            </div>

            <div className="panel-tarjeta p-5">
                <div className="flex items-center justify-between">
                    <h3 className="panel-titulo-bloque">
                        Imágenes <span className="font-normal text-slate-400">({imagenes.length}/{LIMITE_IMAGENES})</span>
                    </h3>
                    <label className="panel-boton--secundario inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">
                        <Icono nombre="subir" className="h-3.5 w-3.5" /> Agregar
                        <input type="file" accept="image/*" multiple className="hidden" onChange={alSeleccionarImagenes} />
                    </label>
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                    La primera imagen es la portada. Arrástralas para reordenar (máx. 10, 3 MB c/u).
                </p>

                {imagenes.length > 0 && (
                    <div className="panel-rejilla-mini mt-3 grid gap-3">
                        {imagenes.map((img, idx) => (
                            <div
                                key={img.key}
                                draggable
                                onDragStart={() => setOrigenImagen(idx)}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={() => {
                                    reordenar(imagenes, setImagenes, origenImagen, idx);
                                    setOrigenImagen(null);
                                }}
                                className="group relative aspect-square cursor-grab overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
                            >
                                <img src={img.url} alt="" className="h-full w-full object-cover" />
                                {idx === 0 && (
                                    <span className="absolute top-1 left-1 rounded bg-blue-950/85 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                                        Portada
                                    </span>
                                )}
                                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-black/45 px-1.5 py-1 opacity-0 transition group-hover:opacity-100">
                                    {idx !== 0 && (
                                        <button
                                            type="button"
                                            onClick={() => hacerPortada(img.key)}
                                            className="text-[10px] font-semibold text-white hover:underline"
                                        >
                                            Portada
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => setImagenes((prev) => prev.filter((i) => i.key !== img.key))}
                                        className="ml-auto text-white hover:text-red-300"
                                        title="Quitar imagen"
                                    >
                                        <Icono nombre="cerrar" className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {error('imagenes_plan') && <p className="mt-1 text-xs text-red-600">{error('imagenes_plan')}</p>}
                {error('imagenes_nuevas') && <p className="mt-1 text-xs text-red-600">{error('imagenes_nuevas')}</p>}
            </div>

            <div className="panel-tarjeta p-5">
                <div className="flex items-center justify-between">
                    <h3 className="panel-titulo-bloque">Adjuntos</h3>
                    <label className="panel-boton--secundario inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">
                        <Icono nombre="subir" className="h-3.5 w-3.5" /> Agregar
                        <input
                            type="file"
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                            multiple
                            className="hidden"
                            onChange={alSeleccionarAdjuntos}
                        />
                    </label>
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                    PDF, Word, Excel o PowerPoint (máx. 15 MB c/u).
                </p>

                {adjuntos.length > 0 && (
                    <ul className="mt-3 space-y-2">
                        {adjuntos.map((adj) => (
                            <li
                                key={adj.key}
                                className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2"
                            >
                                <Icono nombre="adjunto" className="h-4 w-4 shrink-0 text-slate-400" />
                                <span className="min-w-0 flex-1 truncate text-xs text-slate-700">{adj.nombre}</span>
                                {adj.peso != null && <span className="text-[11px] text-slate-400">{formatoPeso(adj.peso)}</span>}
                                <button
                                    type="button"
                                    onClick={() => setAdjuntos((prev) => prev.filter((a) => a.key !== adj.key))}
                                    className="text-slate-400 transition hover:text-red-500"
                                    title="Quitar adjunto"
                                >
                                    <Icono nombre="cerrar" className="h-3.5 w-3.5" />
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
                {error('adjuntos_plan') && <p className="mt-1 text-xs text-red-600">{error('adjuntos_plan')}</p>}
                {error('adjuntos_nuevas') && <p className="mt-1 text-xs text-red-600">{error('adjuntos_nuevas')}</p>}
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
                    {form.processing ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Crear noticia'}
                </Boton>
            </div>
        </form>
    );
}
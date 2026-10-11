import { router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

import { Icono } from '../../Components/Panel/Iconos';
import { registerDraftSaver, restaurarBorrador, limpiarBorrador } from '../../lib/draft';
import { comprimirAWebp, formatoPeso } from '../../lib/image';
import { toast } from '../../lib/toast';

const LIMITE_IMAGENES = 10;
const PESO_IMAGEN = 3 * 1024 * 1024;
const PESO_ADJUNTO = 15 * 1024 * 1024;
const EXTENSIONES_ADJUNTO = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];

function formatoFecha(valor) {
    if (!valor) return '—';
    const [a, m, d] = valor.slice(0, 10).split('-');
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return `${d} ${meses[Number(m) - 1]} ${a}`;
}

function extensionDe(nombre) {
    return (nombre || '').split('.').pop()?.toLowerCase() || '';
}

function reordenar(lista, setLista, desde, hasta) {
    if (desde === hasta || desde == null || hasta == null) return;
    const copia = [...lista];
    const [movida] = copia.splice(desde, 1);
    copia.splice(hasta, 0, movida);
    setLista(copia);
}

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
            if (!EXTENSIONES_ADJUNTO.includes(extensionDe(archivo.name))) {
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
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Noticias</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        {esDocente
                            ? 'Gestiona las noticias que has publicado.'
                            : 'Administra todas las noticias de la institución.'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
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
                        <Icono nombre="mas" className="h-4 w-4" /> Nueva noticia
                    </button>
                </div>
            </div>

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
                <Papelera papelera={papelera} onRestaurar={restaurar} onEliminarPermanente={eliminarPermanente} />
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
        return (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
                <Icono nombre="noticias" className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-3 text-sm text-slate-500">No hay noticias para mostrar.</p>
            </div>
        );
    }

    return (
        <div className="mt-4">
            <div className="relative mb-3">
                <Icono nombre="buscar" className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
                <input
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar por título…"
                    className="w-full rounded-lg border border-slate-200 bg-white py-2 pr-3 pl-9 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
            </div>

            <div className="space-y-3">
                {noticias.map((n) => {
                    const portada = (n.imagenes || []).find((i) => i.es_portada) || (n.imagenes || [])[0];
                    return (
                        <div
                            key={n.id}
                            className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                        >
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
                                <button
                                    onClick={() => onEditar(n)}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                                >
                                    <Icono nombre="editar" className="h-3.5 w-3.5" /> Editar
                                </button>
                                <button
                                    onClick={() => onEliminar(n)}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                                >
                                    <Icono nombre="basura" className="h-3.5 w-3.5" /> Eliminar
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function Papelera({ papelera, onRestaurar, onEliminarPermanente }) {
    const items = papelera;

    return (
        <div className="mt-4">
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                Las noticias se eliminan permanentemente 7 días después de enviarlas a la papelera.
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
                    {items.map((n) => (
                        <div key={n.id} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="min-w-0 flex-1">
                                <h3 className="truncate text-sm font-bold text-slate-900">{n.titulo}</h3>
                                <p className="mt-0.5 text-[11px] text-slate-400">
                                    Autor: {n.autor?.name} · {formatoFecha(n.fec)}
                                </p>
                                <span className="mt-1 inline-flex rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700 ring-1 ring-red-200">
                                    Se elimina en {n.dias_restantes} día{n.dias_restantes === 1 ? '' : 's'}
                                </span>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                                <button
                                    onClick={() => onRestaurar(n)}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                                >
                                    <Icono nombre="deshacer" className="h-3.5 w-3.5" /> Restaurar
                                </button>
                                <button
                                    onClick={() => onEliminarPermanente(n)}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                                >
                                    <Icono nombre="basura" className="h-3.5 w-3.5" /> Eliminar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
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
                        <label className="mb-1 block text-xs font-semibold text-slate-600">Fecha *</label>
                        <input
                            type="date"
                            value={form.data.fec}
                            onChange={(e) => form.setData('fec', e.target.value)}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                        />
                        {error('fec') && <p className="mt-1 text-xs text-red-600">{error('fec')}</p>}
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-600">Categoría</label>
                        <select
                            value={form.data.cat}
                            onChange={(e) => form.setData('cat', e.target.value)}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                        >
                            <option value="">Sin categoría</option>
                            {Object.entries(categorias).map(([valor, etiqueta]) => (
                                <option key={valor} value={valor}>
                                    {etiqueta}
                                </option>
                            ))}
                        </select>
                        {error('cat') && <p className="mt-1 text-xs text-red-600">{error('cat')}</p>}
                    </div>

                    <div className="sm:col-span-2">
                        <label className="mb-1 block text-xs font-semibold text-slate-600">
                            Resumen <span className="font-normal text-slate-400">(mín. 10 caracteres)</span>
                        </label>
                        <textarea
                            rows={2}
                            value={form.data.res}
                            onChange={(e) => form.setData('res', e.target.value)}
                            className="w-full resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                        />
                        {error('res') && <p className="mt-1 text-xs text-red-600">{error('res')}</p>}
                    </div>

                    <div className="sm:col-span-2">
                        <label className="mb-1 block text-xs font-semibold text-slate-600">
                            Contenido <span className="font-normal text-slate-400">(mín. 20 caracteres)</span>
                        </label>
                        <textarea
                            rows={7}
                            value={form.data.con}
                            onChange={(e) => form.setData('con', e.target.value)}
                            className="w-full resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                        />
                        {error('con') && <p className="mt-1 text-xs text-red-600">{error('con')}</p>}
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-600">Estado</label>
                        <select
                            value={form.data.est}
                            onChange={(e) => form.setData('est', e.target.value)}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                        >
                            <option value="borrador">Borrador</option>
                            <option value="publicado">Publicado</option>
                        </select>
                        {error('est') && <p className="mt-1 text-xs text-red-600">{error('est')}</p>}
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-800">
                        Imágenes <span className="font-normal text-slate-400">({imagenes.length}/{LIMITE_IMAGENES})</span>
                    </h3>
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">
                        <Icono nombre="subir" className="h-3.5 w-3.5" /> Agregar
                        <input type="file" accept="image/*" multiple className="hidden" onChange={alSeleccionarImagenes} />
                    </label>
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                    La primera imagen es la portada. Arrástralas para reordenar (máx. 10, 3 MB c/u).
                </p>

                {imagenes.length > 0 && (
                    <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
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

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-800">Adjuntos</h3>
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">
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
                    {form.processing ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Crear noticia'}
                </button>
            </div>
        </form>
    );
}

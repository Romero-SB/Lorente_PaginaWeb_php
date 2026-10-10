import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

import { toast } from '../../lib/toast';
import { Icono } from './Iconos';

function reordenarLista(lista, desde, hasta) {
    if (desde === hasta || desde == null || hasta == null) return lista;
    const copia = [...lista];
    const [movida] = copia.splice(desde, 1);
    copia.splice(hasta, 0, movida);
    return copia;
}

export default function GestorCategorias({
    titulo = 'Administrar categorías',
    categorias,
    baseUrl,
    reorderKey = 'categorias',
    bloqueoKey = 'docentes',
    bloqueoEtiqueta = 'docentes',
    onClose,
}) {
    const [lista, setLista] = useState(categorias);
    const [nuevo, setNuevo] = useState('');
    const [creando, setCreando] = useState(false);
    const [renombrando, setRenombrando] = useState(null);
    const [valorRenombre, setValorRenombre] = useState('');
    const [bloqueada, setBloqueada] = useState(null);
    const [origen, setOrigen] = useState(null);

    useEffect(() => {
        setLista(categorias);
    }, [categorias]);

    function crear() {
        const nombre = nuevo.trim();
        if (!nombre) return;
        setCreando(true);
        router.post(baseUrl, { nombre }, {
            preserveScroll: true,
            onSuccess: () => {
                setNuevo('');
                toast('Categoría creada', 'ok');
            },
            onError: (errors) => toast(errors.nombre || 'No se pudo crear la categoría', 'error'),
            onFinish: () => setCreando(false),
        });
    }

    function confirmarRenombre(cat) {
        const nombre = valorRenombre.trim();
        if (!nombre || nombre === cat.nombre) {
            setRenombrando(null);
            return;
        }
        router.post(`${baseUrl}/${cat.id}`, { nombre }, {
            preserveScroll: true,
            onSuccess: () => {
                setRenombrando(null);
                toast('Categoría renombrada', 'ok');
            },
            onError: (errors) => toast(errors.nombre || 'No se pudo renombrar', 'error'),
        });
    }

    function eliminar(cat) {
        setBloqueada(null);
        router.post(`${baseUrl}/${cat.id}/eliminar`, {}, {
            preserveScroll: true,
            onSuccess: () => toast('Categoría eliminada', 'ok'),
            onError: (errors) => {
                if (errors.categoria) {
                    setBloqueada({ nombre: cat.nombre, asociados: errors[bloqueoKey] || [] });
                }
                toast(errors.categoria || 'No se pudo eliminar la categoría', 'error');
            },
        });
    }

    function soltar(desde, hasta) {
        if (desde === hasta) return;
        const copia = reordenarLista(lista, desde, hasta);
        setLista(copia);
        router.post(`${baseUrl}/reordenar`, { [reorderKey]: copia.map((c) => c.nombre) }, { preserveScroll: true });
    }

    return (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/70 p-4" onClick={onClose}>
            <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                    <h3 className="text-sm font-bold text-slate-800">{titulo}</h3>
                    <button type="button" onClick={onClose} className="text-slate-400 transition hover:text-slate-700">
                        <Icono nombre="cerrar" className="h-4 w-4" />
                    </button>
                </div>

                <div className="px-4 py-4">
                    <div className="flex items-center gap-2">
                        <input
                            value={nuevo}
                            onChange={(e) => setNuevo(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && crear()}
                            placeholder="Nueva categoría"
                            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                        />
                        <button
                            type="button"
                            onClick={crear}
                            disabled={creando || !nuevo.trim()}
                            className="rounded-lg bg-blue-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-900 disabled:opacity-60"
                        >
                            Crear
                        </button>
                    </div>

                    {bloqueada && (
                        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                            <p className="font-semibold">
                                No se puede eliminar “{bloqueada.nombre}” porque tiene {bloqueoEtiqueta} asociados.
                            </p>
                            {bloqueada.asociados.length > 0 && (
                                <ul className="mt-1 list-disc pl-4">
                                    {bloqueada.asociados.map((n) => (
                                        <li key={n}>{n}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}

                    <div className="mt-3 space-y-2">
                        {lista.length === 0 && <p className="py-6 text-center text-xs text-slate-400">No hay categorías guardadas.</p>}
                        {lista.map((cat, idx) => (
                            <div
                                key={cat.id}
                                draggable={renombrando !== cat.id}
                                onDragStart={() => setOrigen(idx)}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={() => {
                                    soltar(origen, idx);
                                    setOrigen(null);
                                }}
                                className="flex items-center gap-2 rounded-lg border border-slate-200 px-2 py-1.5"
                            >
                                <button type="button" className="cursor-grab text-slate-300 active:cursor-grabbing" title="Arrastrar para reordenar">
                                    <Icono nombre="grip" className="h-4 w-4" />
                                </button>
                                {renombrando === cat.id ? (
                                    <>
                                        <input
                                            autoFocus
                                            value={valorRenombre}
                                            onChange={(e) => setValorRenombre(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') confirmarRenombre(cat);
                                                if (e.key === 'Escape') setRenombrando(null);
                                            }}
                                            className="min-w-0 flex-1 rounded-md border border-slate-200 px-2 py-1 text-sm outline-none focus:border-blue-400"
                                        />
                                        <button type="button" onClick={() => confirmarRenombre(cat)} className="text-emerald-600 transition hover:text-emerald-700" title="Confirmar">
                                            <Icono nombre="check" className="h-4 w-4" />
                                        </button>
                                        <button type="button" onClick={() => setRenombrando(null)} className="text-slate-400 transition hover:text-slate-600" title="Cancelar">
                                            <Icono nombre="cerrar" className="h-4 w-4" />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <span className="min-w-0 flex-1 truncate text-sm text-slate-700">{cat.nombre}</span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setRenombrando(cat.id);
                                                setValorRenombre(cat.nombre);
                                            }}
                                            className="text-slate-400 transition hover:text-blue-700"
                                            title="Renombrar"
                                        >
                                            <Icono nombre="editar" className="h-4 w-4" />
                                        </button>
                                        <button type="button" onClick={() => eliminar(cat)} className="text-slate-400 transition hover:text-red-600" title="Eliminar">
                                            <Icono nombre="basura" className="h-4 w-4" />
                                        </button>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

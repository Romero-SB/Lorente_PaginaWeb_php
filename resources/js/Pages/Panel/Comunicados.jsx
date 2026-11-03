import { router, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';

import Recortador from '../../Components/Panel/Recortador';
import { Icono } from '../../Components/Panel/Iconos';
import Boton from '../../Components/Shared/Boton';
import EmptyState from '../../Components/Shared/EmptyState';
import PageHeader from '../../Components/Shared/PageHeader';
import { formatoPeso } from '../../lib/image';

const PESO_MAXIMO = 4 * 1024 * 1024;

export default function Comunicados({ comunicados = [], vigente_id = null }) {
    const form = useForm({
        imagen: null,
        enlace: '',
        inicio_at: '',
        fin_at: '',
    });
    const [previa, setPrevia] = useState(null);
    const [recortando, setRecortando] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => () => previa && URL.revokeObjectURL(previa), [previa]);

    function alSeleccionar(e) {
        const archivo = e.target.files?.[0];
        e.target.value = '';
        setError('');
        if (!archivo) return;
        if (!archivo.type.startsWith('image/')) {
            setError('El archivo debe ser una imagen (JPG, PNG o WebP).');
            return;
        }
        if (archivo.size > PESO_MAXIMO) {
            setError('La imagen no debe superar los 4 MB.');
            return;
        }
        const url = URL.createObjectURL(archivo);
        setRecortando(url);
        form.setData('imagen', archivo);
    }

    function alConfirmarRecorte(archivo) {
        if (recortando) URL.revokeObjectURL(recortando);
        setRecortando(null);
        form.setData('imagen', archivo);
        setPrevia(URL.createObjectURL(archivo));
    }

    function publicar(e) {
        e.preventDefault();
        form.post('/lorente-panel/comunicados', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                if (previa) URL.revokeObjectURL(previa);
                setPrevia(null);
            },
        });
    }

    function alternar(c) {
        router.post(`/lorente-panel/comunicados/${c.id}/activo`, {}, { preserveScroll: true });
    }

    function eliminar(c) {
        if (!window.confirm('¿Eliminar este comunicado? Esta acción no se puede deshacer.')) return;
        router.post(`/lorente-panel/comunicados/${c.id}/eliminar`, {}, { preserveScroll: true });
    }

    return (
        <div>
            <PageHeader
                titulo="Comunicados emergentes"
                descripcion="Imagen que se muestra al entrar a la página principal. Solo la ven visitantes sin sesión, hasta 5 veces por navegador."
            />

            <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
                <form onSubmit={publicar} className="panel-tarjeta space-y-4 p-5">
                    <h2 className="panel-titulo-seccion">Nuevo comunicado</h2>

                    <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-600">Imagen</label>
                        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={alSeleccionar} className="panel-campo w-full" />
                        <p className="mt-1 text-[11px] text-slate-400">
                            Recomendado: vertical 3:4 (1200 × 1600 px). Máximo 4 MB. Puedes recortarla antes de publicar.
                        </p>
                        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
                        {form.errors.imagen && <p className="mt-1 text-xs text-red-600">{form.errors.imagen}</p>}
                    </div>

                    {previa && (
                        <div className="flex items-center gap-3">
                            <img src={previa} alt="Vista previa" className="h-40 w-auto rounded-lg border border-slate-200 object-contain" />
                            <span className="text-xs text-slate-500">
                                Imagen lista · {formatoPeso(form.data.imagen?.size)}
                            </span>
                        </div>
                    )}

                    <div>
                        <label htmlFor="com-enlace" className="mb-1 block text-xs font-semibold text-slate-600">
                            Enlace al tocar la imagen (opcional)
                        </label>
                        <input
                            id="com-enlace"
                            type="url"
                            placeholder="https://..."
                            value={form.data.enlace}
                            onChange={(e) => form.setData('enlace', e.target.value)}
                            className="panel-campo w-full"
                        />
                        {form.errors.enlace && <p className="mt-1 text-xs text-red-600">{form.errors.enlace}</p>}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                            <label htmlFor="com-inicio" className="mb-1 block text-xs font-semibold text-slate-600">Mostrar desde (opcional)</label>
                            <input
                                id="com-inicio"
                                type="datetime-local"
                                value={form.data.inicio_at}
                                onChange={(e) => form.setData('inicio_at', e.target.value)}
                                className="panel-campo w-full"
                            />
                        </div>
                        <div>
                            <label htmlFor="com-fin" className="mb-1 block text-xs font-semibold text-slate-600">Mostrar hasta (opcional)</label>
                            <input
                                id="com-fin"
                                type="datetime-local"
                                value={form.data.fin_at}
                                onChange={(e) => form.setData('fin_at', e.target.value)}
                                className="panel-campo w-full"
                            />
                        </div>
                    </div>
                    {form.errors.fin_at && <p className="text-xs text-red-600">{form.errors.fin_at}</p>}

                    <Boton variante="primario" type="submit" disabled={form.processing || !form.data.imagen} className="px-4 py-2 text-sm disabled:opacity-60">
                        <Icono nombre="publicar" className="h-4 w-4" />
                        {form.processing ? 'Publicando…' : 'Publicar comunicado'}
                    </Boton>
                </form>

                <section className="panel-tarjeta p-5">
                    <h2 className="panel-titulo-seccion">Comunicados publicados</h2>

                    {comunicados.length === 0 ? (
                        <EmptyState icono="publicar" mensaje="Aún no hay comunicados." />
                    ) : (
                        <ul className="mt-3 space-y-3">
                            {comunicados.map((c) => (
                                <li key={c.id} className="flex gap-3 rounded-xl border border-slate-200 p-3">
                                    <img src={c.imagen_url} alt="" className="h-24 w-18 shrink-0 rounded-lg object-cover" />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span
                                                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${
                                                    c.id === vigente_id
                                                        ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                                                        : 'bg-slate-50 text-slate-600 ring-slate-200'
                                                }`}
                                            >
                                                {c.id === vigente_id ? 'Mostrándose ahora' : c.activo ? 'Activo (fuera de fecha)' : 'Desactivado'}
                                            </span>
                                        </div>
                                        <p className="mt-1 text-[11px] text-slate-400">Publicado {c.creado}</p>
                                        {(c.inicio_at || c.fin_at) && (
                                            <p className="text-[11px] text-slate-400">
                                                {c.inicio_at ? `Desde ${c.inicio_at.replace('T', ' ')}` : ''}
                                                {c.inicio_at && c.fin_at ? ' · ' : ''}
                                                {c.fin_at ? `Hasta ${c.fin_at.replace('T', ' ')}` : ''}
                                            </p>
                                        )}
                                        {c.enlace && <p className="truncate text-[11px] text-blue-600">{c.enlace}</p>}
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            <Boton onClick={() => alternar(c)} className="px-3 py-1.5 text-xs border-slate-200 hover:bg-slate-50">
                                                {c.activo ? 'Desactivar' : 'Activar'}
                                            </Boton>
                                            <Boton onClick={() => eliminar(c)} className="px-3 py-1.5 text-xs border-red-100 text-red-600 hover:bg-red-50">
                                                <Icono nombre="basura" className="h-3.5 w-3.5" /> Eliminar
                                            </Boton>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>

            {recortando && (
                <Recortador
                    imagen={recortando}
                    aspect={3 / 4}
                    anchoSalida={1200}
                    nombreSalida="comunicado.webp"
                    calidad={0.9}
                    titulo="Recortar comunicado (3:4)"
                    textoConfirmar="Usar imagen"
                    onCancelar={() => {
                        URL.revokeObjectURL(recortando);
                        setRecortando(null);
                        form.setData('imagen', null);
                    }}
                    onConfirmar={alConfirmarRecorte}
                />
            )}
        </div>
    );
}

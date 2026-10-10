import { useForm, usePage } from '@inertiajs/react';

import { Icono } from '../../Components/Panel/Iconos';
import PanelLayout from '../../Layouts/PanelLayout';

function Campo({ etiqueta, children, error, ayuda }) {
    return (
        <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">{etiqueta}</label>
            {children}
            {ayuda && <p className="mt-1 text-[11px] text-slate-400">{ayuda}</p>}
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
}

export default function Configuracion({ config = {} }) {
    const { auth } = usePage().props;

    const form = useForm({
        phone: config.phone || '',
        email: config.email || '',
        direccion: config.direccion || '',
        estudiantes: config.estudiantes ?? '',
        docentes_count: config.docentes_count ?? '',
        anio_fundacion: config.anio_fundacion ?? '',
        niveles: config.niveles || '',
        mision: config.mision || '',
        vision: config.vision || '',
    });

    function enviar(e) {
        e.preventDefault();
        form.post('/lorente-panel/configuracion', { preserveScroll: true });
    }

    const error = (campo) => form.errors[campo];
    const claseInput =
        'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100';

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Configuración</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Datos institucionales y de contacto publicados en el sitio.
                    </p>
                </div>
                {config.actualizado_por && (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-500">
                        Última edición por {config.actualizado_por}
                    </span>
                )}
            </div>

            <form onSubmit={enviar} className="mt-4 space-y-4">
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="mb-4 text-sm font-bold text-slate-900">Contacto</h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Campo etiqueta="Teléfono" error={error('phone')}>
                            <input
                                value={form.data.phone}
                                onChange={(e) => form.setData('phone', e.target.value)}
                                className={claseInput}
                                placeholder="(01) 234 5678"
                            />
                        </Campo>
                        <Campo etiqueta="Correo institucional" error={error('email')}>
                            <input
                                type="email"
                                value={form.data.email}
                                onChange={(e) => form.setData('email', e.target.value)}
                                className={claseInput}
                                placeholder="informes@lorente.edu.pe"
                            />
                        </Campo>
                        <div className="sm:col-span-2">
                            <Campo etiqueta="Dirección" error={error('direccion')}>
                                <input
                                    value={form.data.direccion}
                                    onChange={(e) => form.setData('direccion', e.target.value)}
                                    className={claseInput}
                                />
                            </Campo>
                        </div>
                    </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="mb-4 text-sm font-bold text-slate-900">Datos institucionales</h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <Campo etiqueta="Estudiantes" error={error('estudiantes')}>
                            <input
                                type="number"
                                min="0"
                                value={form.data.estudiantes}
                                onChange={(e) => form.setData('estudiantes', e.target.value)}
                                className={claseInput}
                            />
                        </Campo>
                        <Campo etiqueta="Docentes" error={error('docentes_count')}>
                            <input
                                type="number"
                                min="0"
                                value={form.data.docentes_count}
                                onChange={(e) => form.setData('docentes_count', e.target.value)}
                                className={claseInput}
                            />
                        </Campo>
                        <Campo etiqueta="Año de fundación" error={error('anio_fundacion')}>
                            <input
                                type="number"
                                value={form.data.anio_fundacion}
                                onChange={(e) => form.setData('anio_fundacion', e.target.value)}
                                className={claseInput}
                            />
                        </Campo>
                        <div className="sm:col-span-3">
                            <Campo
                                etiqueta="Niveles"
                                error={error('niveles')}
                                ayuda="Separa los niveles con comas. Ej.: Inicial, Primaria, Secundaria."
                            >
                                <input
                                    value={form.data.niveles}
                                    onChange={(e) => form.setData('niveles', e.target.value)}
                                    className={claseInput}
                                />
                            </Campo>
                        </div>
                        <div className="sm:col-span-3">
                            <Campo etiqueta="Misión" error={error('mision')}>
                                <textarea
                                    rows={4}
                                    value={form.data.mision}
                                    onChange={(e) => form.setData('mision', e.target.value)}
                                    className={`${claseInput} resize-y`}
                                />
                            </Campo>
                        </div>
                        <div className="sm:col-span-3">
                            <Campo etiqueta="Visión" error={error('vision')}>
                                <textarea
                                    rows={4}
                                    value={form.data.vision}
                                    onChange={(e) => form.setData('vision', e.target.value)}
                                    className={`${claseInput} resize-y`}
                                />
                            </Campo>
                        </div>
                    </div>
                </section>

                <div className="flex items-center justify-end gap-2">
                    <span className="mr-auto text-[11px] text-slate-400">
                        Editando como {auth.user?.name}.
                    </span>
                    <button
                        type="submit"
                        disabled={form.processing}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-900 disabled:opacity-60"
                    >
                        <Icono nombre="guardar" className="h-4 w-4" /> Guardar cambios
                    </button>
                </div>
            </form>
        </div>
    );
}

Configuracion.layout = (page) => <PanelLayout children={page} />;

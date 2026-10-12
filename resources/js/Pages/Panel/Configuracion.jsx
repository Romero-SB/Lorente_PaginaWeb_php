import { useForm, usePage } from '@inertiajs/react';

import { Icono } from '../../Components/Panel/Iconos';
import Boton from '../../Components/Shared/Boton';
import Campo from '../../Components/Shared/Campo';
import PageHeader from '../../Components/Shared/PageHeader';

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

    return (
        <div>
            <PageHeader
                titulo="Configuración"
                descripcion="Datos institucionales y de contacto publicados en el sitio."
            >
                {config.actualizado_por && (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-500">
                        Última edición por {config.actualizado_por}
                    </span>
                )}
            </PageHeader>

            <form onSubmit={enviar} className="mt-4 space-y-4">
                <section className="panel-tarjeta p-5">
                    <h2 className="panel-titulo-seccion mb-4">Contacto</h2>
                    <div className="panel-rejilla-2 grid gap-4">
                        <Campo etiqueta="Teléfono" error={error('phone')} id="config-phone">
                            <input
                                id="config-phone"
                                value={form.data.phone}
                                onChange={(e) => form.setData('phone', e.target.value)}
                                className="panel-campo w-full"
                                placeholder="(01) 234 5678"
                            />
                        </Campo>
                        <Campo etiqueta="Correo institucional" error={error('email')} id="config-email">
                            <input
                                id="config-email"
                                type="email"
                                value={form.data.email}
                                onChange={(e) => form.setData('email', e.target.value)}
                                className="panel-campo w-full"
                                placeholder="informes@lorente.edu.pe"
                            />
                        </Campo>
                        <Campo etiqueta="Dirección" error={error('direccion')} id="config-direccion" className="panel-celda-2">
                            <input
                                id="config-direccion"
                                value={form.data.direccion}
                                onChange={(e) => form.setData('direccion', e.target.value)}
                                className="panel-campo w-full"
                            />
                        </Campo>
                    </div>
                </section>

                <section className="panel-tarjeta p-5">
                    <h2 className="panel-titulo-seccion mb-4">Datos institucionales</h2>
                    <div className="panel-rejilla-3 grid gap-4">
                        <Campo etiqueta="Estudiantes" error={error('estudiantes')} id="config-estudiantes">
                            <input
                                id="config-estudiantes"
                                type="number"
                                min="0"
                                value={form.data.estudiantes}
                                onChange={(e) => form.setData('estudiantes', e.target.value)}
                                className="panel-campo w-full"
                            />
                        </Campo>
                        <Campo etiqueta="Docentes" error={error('docentes_count')} id="config-docentes">
                            <input
                                id="config-docentes"
                                type="number"
                                min="0"
                                value={form.data.docentes_count}
                                onChange={(e) => form.setData('docentes_count', e.target.value)}
                                className="panel-campo w-full"
                            />
                        </Campo>
                        <Campo etiqueta="Año de fundación" error={error('anio_fundacion')} id="config-anio">
                            <input
                                id="config-anio"
                                type="number"
                                value={form.data.anio_fundacion}
                                onChange={(e) => form.setData('anio_fundacion', e.target.value)}
                                className="panel-campo w-full"
                            />
                        </Campo>
                        <Campo
                            etiqueta="Niveles"
                            error={error('niveles')}
                            ayuda="Separa los niveles con comas. Ej.: Inicial, Primaria, Secundaria."
                            id="config-niveles"
                            className="panel-celda-3"
                        >
                            <input
                                id="config-niveles"
                                value={form.data.niveles}
                                onChange={(e) => form.setData('niveles', e.target.value)}
                                className="panel-campo w-full"
                            />
                        </Campo>
                        <Campo etiqueta="Misión" error={error('mision')} id="config-mision" className="panel-celda-3">
                            <textarea
                                id="config-mision"
                                rows={4}
                                value={form.data.mision}
                                onChange={(e) => form.setData('mision', e.target.value)}
                                className="panel-campo w-full resize-y"
                            />
                        </Campo>
                        <Campo etiqueta="Visión" error={error('vision')} id="config-vision" className="panel-celda-3">
                            <textarea
                                id="config-vision"
                                rows={4}
                                value={form.data.vision}
                                onChange={(e) => form.setData('vision', e.target.value)}
                                className="panel-campo w-full resize-y"
                            />
                        </Campo>
                    </div>
                </section>

                <div className="flex items-center justify-end gap-2">
                    <span className="mr-auto text-[11px] text-slate-400">
                        Editando como {auth.user?.name}.
                    </span>
                    <Boton
                        variante="primario"
                        type="submit"
                        disabled={form.processing}
                        className="px-4 py-2 text-sm disabled:opacity-60"
                    >
                        <Icono nombre="guardar" className="h-4 w-4" /> Guardar cambios
                    </Boton>
                </div>
            </form>
        </div>
    );
}
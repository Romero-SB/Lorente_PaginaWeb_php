import { router, usePage } from '@inertiajs/react';

import { Icono } from '../../Components/Panel/Iconos';
import PageHeader from '../../Components/Shared/PageHeader';

function visit(ruta) {
    router.visit(ruta, { preserveScroll: true });
}

export default function Resumen({ stats }) {
    const { auth, panel } = usePage().props;

    const seccion = (clave) => panel?.secciones?.find((s) => s.clave === clave);

    const tarjetas = [
        { clave: 'noticias', dato: stats.noticias, desc: 'publicaciones en el sitio' },
        ...(stats.docentes != null
            ? [{ clave: 'docentes', dato: stats.docentes, desc: 'docentes registrados' }]
            : []),
        { clave: 'documentos', dato: stats.documentos, desc: 'documentos publicados' },
        ...(stats.mensajes != null
            ? [{ clave: 'mensajes', dato: stats.mensajes, desc: 'mensajes de contacto' }]
            : []),
    ];

    return (
        <div>
            <PageHeader
                titulo="Resumen"
                descripcion={`Hola, ${auth.user?.name}. Desde aquí puedes gestionar el contenido de la institución.`}
            />

            <div className="panel-rejilla-3 mt-5 grid gap-4">
                {tarjetas.map((t) => {
                    const secc = seccion(t.clave);
                    return (
                        <button
                            key={t.clave}
                            disabled={!secc}
                            onClick={() => secc && visit(secc.ruta)}
                            className={`panel-tarjeta group relative overflow-hidden p-5 text-left transition ${
                                secc ? 'hover:-translate-y-0.5 hover:shadow-md' : 'opacity-60'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-950 text-blue-100">
                                    <Icono nombre={secc?.icono || t.clave} className="h-5 w-5" />
                                </div>
                                <span className="text-3xl font-extrabold text-slate-800">{t.dato}</span>
                            </div>
                            <p className="mt-3 text-sm font-semibold text-slate-800 capitalize">
                                {t.clave}
                            </p>
                            <p className="text-xs text-slate-500">{t.desc}</p>
                            {secc && (
                                <p className="mt-2 text-xs font-medium text-blue-700 opacity-0 transition group-hover:opacity-100">
                                    Ir a {secc.etiqueta}
                                </p>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
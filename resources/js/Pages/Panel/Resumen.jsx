import { router, usePage } from '@inertiajs/react';

import { Icono } from '../../Components/Panel/Iconos';

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
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Resumen</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Hola, {auth.user?.name}. Desde aquí puedes gestionar el contenido de la institución.
                    </p>
                </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {tarjetas.map((t) => {
                    const secc = seccion(t.clave);
                    return (
                        <button
                            key={t.clave}
                            disabled={!secc}
                            onClick={() => secc && visit(secc.ruta)}
                            className={`group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition ${
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

import { router, usePage } from '@inertiajs/react';

import { Icono } from '../../Components/Panel/Iconos';

const TARJETAS = [
    { clave: 'noticias', etiqueta: 'Noticias', desc: 'Publicaciones visibles en el sitio', icono: 'noticias' },
    { clave: 'docentes', etiqueta: 'Docentes', desc: 'Integrantes de la plana docente', icono: 'docentes' },
    { clave: 'documentos', etiqueta: 'Documentos', desc: 'Material y comunicados oficiales', icono: 'documentos' },
    { clave: 'mensajes', etiqueta: 'Mensajes', desc: 'Consultas recibidas desde el sitio', icono: 'mensajes' },
];

const ACCIONES = {
    noticias: { titulo: 'Redactar una noticia', desc: 'Comparte logros, eventos y comunicados.' },
    documentos: { titulo: 'Subir un documento', desc: 'Publica material y comunicados oficiales.' },
    mensajes: { titulo: 'Revisar mensajes', desc: 'Atiende las consultas enviadas desde el sitio.' },
    docentes: { titulo: 'Gestionar docentes', desc: 'Actualiza la información de la plana docente.' },
    configuracion: { titulo: 'Actualizar datos', desc: 'Contacto, historia, misión y visión.' },
    cuentas: { titulo: 'Administrar cuentas', desc: 'Gestiona accesos y roles del panel.' },
};

const FILAS_ESTADO = {
    noticias: 'Noticias publicadas',
    docentes: 'Docentes registrados',
    documentos: 'Documentos disponibles',
    mensajes: 'Mensajes recibidos',
};

function visit(ruta) {
    router.visit(ruta, { preserveScroll: true });
}

export default function Resumen({ stats }) {
    const { auth, panel } = usePage().props;

    const seccion = (clave) => panel?.secciones?.find((s) => s.clave === clave);

    const tarjetas = TARJETAS.filter((t) => stats[t.clave] != null);

    const acciones = Object.entries(ACCIONES)
        .map(([clave, datos]) => ({ ...datos, seccion: seccion(clave) }))
        .filter((a) => a.seccion)
        .slice(0, 5);

    const filasEstado = Object.entries(FILAS_ESTADO).filter(([clave]) => stats[clave] != null);

    const primerNombre = (auth.user?.name ?? '').split(/\s+/)[0] || 'bienvenido';
    const hoy = new Intl.DateTimeFormat('es-PE', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
    const fecha = hoy.charAt(0).toUpperCase() + hoy.slice(1);

    return (
        <div>
            <section className="resumen-hero">
                <div className="resumen-hero-texto">
                    <p className="resumen-kicker">Gestión institucional · {fecha}</p>
                    <h1 className="resumen-titulo">Hola, {primerNombre}</h1>
                    <p className="resumen-bajada">
                        Este es tu espacio para mantener al día la información de la institución y acompañar su día a día.
                    </p>
                    <div className="resumen-hero-acciones">
                        {seccion('noticias') && (
                            <button
                                type="button"
                                className="resumen-boton resumen-boton--fantasma"
                                onClick={() => visit(seccion('noticias').ruta)}
                            >
                                <Icono nombre="editar" className="h-4 w-4" />
                                Ir a noticias
                            </button>
                        )}
                    </div>
                </div>
                <div className="resumen-medallon" aria-hidden="true">
                    <span className="resumen-medallon-anillo" />
                    <img src="/logo_lorente.webp" alt="" />
                </div>
            </section>

            <div className="resumen-stats">
                {tarjetas.map((t) => {
                    const secc = seccion(t.clave);
                    return (
                        <button
                            key={t.clave}
                            type="button"
                            disabled={!secc}
                            onClick={() => secc && visit(secc.ruta)}
                            className={`resumen-stat resumen-stat--${t.clave}${secc ? '' : ' resumen-stat--inactiva'}`}
                        >
                            <span className="resumen-stat-top">
                                <span className="resumen-stat-icono">
                                    <Icono nombre={secc?.icono || t.icono} className="h-5 w-5" />
                                </span>
                                <Icono nombre="externo" className="resumen-stat-flecha h-4 w-4" />
                            </span>
                            <span className="resumen-stat-num">{t.dato ?? 0}</span>
                            <span className="resumen-stat-label">{t.etiqueta}</span>
                            <span className="resumen-stat-desc">{t.desc}</span>
                        </button>
                    );
                })}
            </div>

            <div className="resumen-columnas">
                <section className="resumen-panel">
                    <header className="resumen-panel-cabecera">
                        <div>
                            <p className="resumen-panel-kicker">Atajos</p>
                            <h2 className="resumen-panel-titulo">Accesos rápidos</h2>
                        </div>
                        <span className="resumen-panel-badge">{acciones.length} disponibles</span>
                    </header>

                    {acciones.length > 0 ? (
                        <div className="resumen-acciones">
                            {acciones.map((a) => (
                                <button
                                    key={a.seccion.clave}
                                    type="button"
                                    className="resumen-accion"
                                    onClick={() => visit(a.seccion.ruta)}
                                >
                                    <span className="resumen-accion-icono">
                                        <Icono nombre={a.seccion.icono} className="h-[18px] w-[18px]" />
                                    </span>
                                    <span className="resumen-accion-texto">
                                        <strong>{a.titulo}</strong>
                                        <small>{a.desc}</small>
                                    </span>
                                    <Icono nombre="flecha" className="resumen-accion-flecha h-4 w-4" />
                                </button>
                            ))}
                        </div>
                    ) : (
                        <p className="resumen-vacio">No hay accesos disponibles para tu rol.</p>
                    )}
                </section>

                <section className="resumen-panel resumen-estado">
                    <header className="resumen-panel-cabecera">
                        <div>
                            <p className="resumen-panel-kicker">Publicación</p>
                            <h2 className="resumen-panel-titulo">Estado del sitio</h2>
                        </div>
                        <span className="resumen-live">
                            <span className="resumen-live-punto" aria-hidden="true" />
                            Activo
                        </span>
                    </header>

                    <div className="resumen-estado-lista">
                        {filasEstado.map(([clave, etiqueta]) => (
                            <div key={clave} className="resumen-estado-fila">
                                <span>{etiqueta}</span>
                                <strong>{stats[clave] ?? 0}</strong>
                            </div>
                        ))}
                    </div>

                    <p className="resumen-nota">Los cambios que guardes se reflejan de inmediato en el sitio.</p>
                </section>
            </div>
        </div>
    );
}

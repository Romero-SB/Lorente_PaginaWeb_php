/**
 * Encabezado de página del panel con título, descripción y acciones a la derecha.
 *
 * @param {object} props
 * @param {string} props.titulo Título de la página.
 * @param {string} [props.descripcion] Subtítulo opcional.
 * @param {import('react').ReactNode} [props.children] Acciones (botones, filtros).
 */
export default function PageHeader({ titulo, descripcion, children }) {
    return (
        <div className="panel-cabecera flex flex-wrap items-center justify-between gap-3">
            <div>
                <h1 className="panel-titulo-pagina">{titulo}</h1>
                {descripcion && <p className="mt-1 text-sm text-slate-500">{descripcion}</p>}
            </div>
            {children && (
                <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
                    {children}
                </div>
            )}
        </div>
    );
}
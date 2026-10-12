/**
 * Navegación de paginación generada por Laravel (`links` de un paginador).
 *
 * @param {object} props
 * @param {Array<{url: string|null, label: string, active: boolean}>} props.links
 *          Páginas generadas por el paginador de Laravel.
 * @param {(url: string) => void} props.onNavegar Callback al elegir una página.
 * @param {string} [props.className] Clases extra del contenedor.
 * @param {'mini'|'normal'} [props.tamano] Tamaño de los botones.
 */
export default function Paginacion({ links, onNavegar, className = '', tamano = 'mini' }) {
    if (!links || links.length <= 3) return null;

    const claseBoton = tamano === 'normal' ? 'min-w-9 px-3 py-1.5 text-sm' : 'min-w-8 px-2.5 py-1 text-xs';

    return (
        <div className={`flex flex-wrap items-center justify-center gap-1 ${className}`}>
            {links.map((link, i) => (
                <button
                    key={i}
                    disabled={!link.url}
                    onClick={() => link.url && onNavegar(link.url)}
                    className={`${claseBoton} rounded-lg font-medium transition ${
                        link.active
                            ? 'panel-boton--primario rounded-lg text-white'
                            : link.url
                              ? 'border border-slate-300 text-slate-600 hover:bg-slate-50'
                              : 'cursor-not-allowed border border-slate-200 text-slate-300'
                    }`}
                >
                    {link.label}
                </button>
            ))}
        </div>
    );
}
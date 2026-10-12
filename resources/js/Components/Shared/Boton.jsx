const VARIANTES = {
    primario: 'panel-boton--primario text-white hover:bg-blue-900',
    secundario: 'panel-boton--secundario border rounded-lg text-slate-600',
};

/**
 * Botón con las variantes visuales del panel. El resto de props (`type`,
 * `disabled`, `onClick`, etc.) se pasan directamente al `<button>`.
 *
 * @param {object} props
 * @param {'primario'|'secundario'} [props.variante] Variante visual.
 * @param {string} [props.className] Clases suplementarias (tamaño, hover, etc.).
 */
export default function Boton({ variante = 'secundario', className = '', ...rest }) {
    return (
        <button {...rest} className={`inline-flex items-center gap-1.5 font-semibold transition ${VARIANTES[variante]} ${className}`} />
    );
}
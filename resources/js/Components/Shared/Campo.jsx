/**
 * Envuelve un campo de formulario con etiqueta, ayuda y error accesible.
 *
 * @param {object} props
 * @param {import('react').ReactNode} [props.etiqueta] Etiqueta del control; admite JSX.
 * @param {import('react').ReactNode} props.children Control del formulario.
 * @param {string} [props.error] Mensaje de error mostrado con `role="alert"`.
 * @param {string} [props.ayuda] Texto de ayuda bajo el control.
 * @param {string} [props.id] `id` del control para asociar la etiqueta (`htmlFor`).
 * @param {string} [props.className] Clases extra del contenedor.
 */
export default function Campo({ etiqueta, children, error, ayuda, id, className = '' }) {
    return (
        <div className={className}>
            {etiqueta !== undefined && (
                <label htmlFor={id} className="mb-1 block text-xs font-semibold text-slate-600">
                    {etiqueta}
                </label>
            )}
            {children}
            {ayuda && <p className="mt-1 text-[11px] text-slate-400">{ayuda}</p>}
            {error && (
                <p className="mt-1 text-xs text-red-600" role="alert">
                    {error}
                </p>
            )}
        </div>
    );
}
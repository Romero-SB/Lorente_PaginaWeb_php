import { Icono } from '../Panel/Iconos';

/**
 * Estado vacío (tarjeta punteada) para listados sin resultados.
 *
 * @param {object} props
 * @param {string} [props.icono] Nombre del icono (de `Panel/Iconos`).
 * @param {string} props.mensaje Texto explicativo.
 * @param {string} [props.className] Clases extra (por defecto `p-10`).
 */
export default function EmptyState({ icono, mensaje, className = 'p-10' }) {
    return (
        <div className={`panel-tarjeta--punteada mt-6 text-center ${className}`}>
            {icono && <Icono nombre={icono} className="mx-auto h-8 w-8 text-slate-300" />}
            <p className={`${icono ? 'mt-3' : ''} text-sm text-slate-500`}>{mensaje}</p>
        </div>
    );
}
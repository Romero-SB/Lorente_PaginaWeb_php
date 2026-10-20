import { Icono } from '../Panel/Iconos';
import Boton from './Boton';
import EmptyState from './EmptyState';

/**
 * Papelera de borrado suave. Por cada item muestra el título, los días
 * restantes y los botones de restaurar / eliminar permanentemente.
 *
 * @param {object} props
 * @param {Array<{id: string|number, dias_restantes: number, puede_restaurar?: boolean, puede_permanente?: boolean}>} [props.items]
 *          Registros eliminados; `null`/`undefined` muestra "Cargando…".
 * @param {import('react').ReactNode} props.aviso Explicación de la papelera.
 * @param {(item: object) => import('react').ReactNode} props.renderTitulo Render del título del item.
 * @param {(item: object) => import('react').ReactNode} [props.thumb] Render de la miniatura del item.
 * @param {(item: object) => void} props.onRestaurar Callback de restauración.
 * @param {(item: object) => void} props.onEliminarPermanente Callback de borrado definitivo.
 */
export default function Papelera({ items, aviso, renderTitulo, thumb, onRestaurar, onEliminarPermanente }) {
    const cargando = !Array.isArray(items);

    return (
        <div className="mt-4">
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                {aviso}
            </div>

            {cargando ? (
                <p className="mt-6 text-center text-sm text-slate-400">Cargando papelera…</p>
            ) : items.length === 0 ? (
                <EmptyState icono="basura" mensaje="La papelera está vacía." />
            ) : (
                <div className="mt-3 space-y-3">
                    {items.map((item) => (
                        <div
                            key={item.id}
                            className="panel-tarjeta panel-tarjeta--lista flex flex-wrap items-center gap-4 p-4"
                        >
                            {thumb?.(item)}
                            <div className="min-w-0 flex-1">
                                {renderTitulo(item)}
                                <span className="mt-1 inline-flex rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700 ring-1 ring-red-200">
                                    Se elimina en {item.dias_restantes} día{item.dias_restantes === 1 ? '' : 's'}
                                </span>
                            </div>
                            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:ml-auto">
                                {item.puede_restaurar !== false && (
                                    <Boton
                                        onClick={() => onRestaurar(item)}
                                        className="px-3 py-1.5 text-xs border-slate-200 hover:bg-slate-50"
                                    >
                                        <Icono nombre="deshacer" className="h-3.5 w-3.5" /> Restaurar
                                    </Boton>
                                )}
                                {item.puede_permanente !== false && (
                                    <Boton
                                        onClick={() => onEliminarPermanente(item)}
                                        className="px-3 py-1.5 text-xs border-red-100 text-red-600 hover:bg-red-50"
                                    >
                                        <Icono nombre="basura" className="h-3.5 w-3.5" /> Eliminar
                                    </Boton>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
import Boton from '../Shared/Boton';
import Modal from '../Shared/Modal';
import { Icono } from './Iconos';

/**
 * Muestra las imágenes seleccionadas con su orientación y deja elegir:
 * - "Aplicar a todas": recorte automático centrado según orientación.
 * - "Ajustar una por una": abre el recortador para cada imagen.
 *
 * @param {object} props
 * @param {Array<{key:string,url:string,orientacion:string,aspect:number,anchoSalida:number}>} props.items
 * @param {() => void} props.onAplicarTodas
 * @param {() => void} props.onAjustarUna
 * @param {() => void} props.onCancelar
 * @param {boolean} [props.procesando]
 */
export default function ColaRecorte({ items, onAplicarTodas, onAjustarUna, onCancelar, procesando = false }) {
    return (
        <Modal onCerrar={onCancelar} ariaLabel="Recortar imágenes" ancho="max-w-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <h3 className="text-sm font-bold text-slate-800">
                    Recortar {items.length} {items.length === 1 ? 'imagen' : 'imágenes'}
                </h3>
                <button type="button" onClick={onCancelar} className="text-slate-400 transition hover:text-slate-700">
                    <Icono nombre="cerrar" className="h-4 w-4" />
                </button>
            </div>

            <div className="px-4 py-4">
                <p className="mb-3 text-xs text-slate-500">
                    Las horizontales se recortan a 16:9 y las verticales a 4:5, para que las noticias se vean ordenadas.
                </p>

                <ul className="grid max-h-72 grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3">
                    {items.map((it) => (
                        <li key={it.key} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                            <div className="flex h-24 items-center justify-center bg-slate-100">
                                <img src={it.url} alt="" className="max-h-full max-w-full object-contain" />
                            </div>
                            <div className="px-2 py-1.5 text-[11px] font-semibold text-slate-600">
                                {it.orientacion === 'horizontal' ? 'Horizontal · 16:9' : 'Vertical · 4:5'}
                            </div>
                        </li>
                    ))}
                </ul>

                <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <Boton type="button" onClick={onCancelar} disabled={procesando} className="px-4 py-2 text-sm hover:bg-slate-50">
                        Cancelar
                    </Boton>
                    <Boton type="button" onClick={onAjustarUna} disabled={procesando} className="px-4 py-2 text-sm hover:bg-slate-50">
                        Ajustar una por una
                    </Boton>
                    <Boton variante="primario" type="button" onClick={onAplicarTodas} disabled={procesando} className="px-4 py-2 text-sm disabled:opacity-60">
                        <Icono nombre="guardar" className="h-4 w-4" />
                        {procesando ? 'Procesando…' : 'Aplicar a todas'}
                    </Boton>
                </div>
            </div>
        </Modal>
    );
}

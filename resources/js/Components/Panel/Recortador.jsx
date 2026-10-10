import { useCallback, useState } from 'react';
import Cropper from 'react-easy-crop';

import { recortarImagenWebp } from '../../lib/image';
import { toast } from '../../lib/toast';
import { Icono } from './Iconos';

export default function Recortador({ imagen, aspect = 4 / 5, onCancelar, onConfirmar }) {
    const [recorte, setRecorte] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [areaPixeles, setAreaPixeles] = useState(null);
    const [procesando, setProcesando] = useState(false);

    const alCompletar = useCallback((_area, areaPixeles) => {
        setAreaPixeles(areaPixeles);
    }, []);

    async function confirmar() {
        if (!areaPixeles) return;
        setProcesando(true);
        try {
            const archivo = await recortarImagenWebp(imagen, areaPixeles, 400, 0.85);
            onConfirmar(archivo);
        } catch {
            toast('No se pudo procesar la imagen', 'error');
        } finally {
            setProcesando(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/70 p-4">
            <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                    <h3 className="text-sm font-bold text-slate-800">Recortar fotografía</h3>
                    <button type="button" onClick={onCancelar} className="text-slate-400 transition hover:text-slate-700">
                        <Icono nombre="cerrar" className="h-4 w-4" />
                    </button>
                </div>

                <div className="relative h-72 w-full bg-slate-900">
                    <Cropper
                        image={imagen}
                        crop={recorte}
                        zoom={zoom}
                        aspect={aspect}
                        onCropChange={setRecorte}
                        onZoomChange={setZoom}
                        onCropComplete={alCompletar}
                        showGrid
                    />
                </div>

                <div className="px-4 py-4">
                    <label className="mb-1 block text-xs font-semibold text-slate-600">Zoom</label>
                    <input
                        type="range"
                        min={1}
                        max={3}
                        step={0.01}
                        value={zoom}
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="w-full accent-blue-800"
                    />

                    <div className="mt-4 flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={onCancelar}
                            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={confirmar}
                            disabled={procesando || !areaPixeles}
                            className="inline-flex items-center gap-2 rounded-lg bg-blue-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-900 disabled:opacity-60"
                        >
                            <Icono nombre="guardar" className="h-4 w-4" />
                            {procesando ? 'Procesando…' : 'Usar foto'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

import { router } from '@inertiajs/react';
import { useState } from 'react';

import Modal from '../Shared/Modal';
import Boton from '../Shared/Boton';
import { toast } from '../../lib/toast';
import { FUENTES, estiloHito } from '../../lib/fuentes';
import { Icono } from './Iconos';

export default function EditorEstiloHito({ hito, onClose }) {
    const inicial = hito.estilo || {};

    const [anioFont, setAnioFont] = useState(inicial.anio_font || '');
    const [anioColor, setAnioColor] = useState(inicial.anio_color || '');
    const [tituloFont, setTituloFont] = useState(inicial.titulo_font || '');
    const [tituloColor, setTituloColor] = useState(inicial.titulo_color || '');
    const [textoFont, setTextoFont] = useState(inicial.texto_font || '');
    const [textoColor, setTextoColor] = useState(inicial.texto_color || '');
    const [guardando, setGuardando] = useState(false);

    const estilo = {
        anio_font: anioFont || null,
        anio_color: anioColor || null,
        titulo_font: tituloFont || null,
        titulo_color: tituloColor || null,
        texto_font: textoFont || null,
        texto_color: textoColor || null,
    };

    function guardar() {
        setGuardando(true);
        router.post(`/lorente-panel/configuracion/historia/${hito.id}/estilo`, estilo, {
            preserveScroll: true,
            onSuccess: () => {
                toast('Estilo del hito actualizado', 'ok');
                onClose();
            },
            onError: () => toast('No se pudo guardar el estilo', 'error'),
            onFinish: () => setGuardando(false),
        });
    }

    return (
        <Modal onCerrar={onClose} ariaLabel={`Estilo del hito ${hito.titulo}`} ancho="max-w-3xl" z="z-[60]">
            <div className="flex max-h-[calc(100dvh-2rem)] flex-col">
                <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3">
                    <div>
                        <h3 className="text-sm font-bold text-slate-800">Estilo del hito</h3>
                        <p className="text-[11px] text-slate-400">{hito.anio} · {hito.titulo}</p>
                    </div>
                    <button type="button" onClick={onClose} className="text-slate-400 transition hover:text-slate-700" title="Cerrar">
                        <Icono nombre="cerrar" className="h-4 w-4" />
                    </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                    <div className="grid gap-5 p-4 md:grid-cols-[1fr_260px]">
                        <div className="space-y-4">
                            <Grupo titulo="Año">
                                <CampoFuente
                                    valor={anioFont}
                                    onChange={setAnioFont}
                                    tooltip="Fuente que se usará para el año del hito."
                                />
                                <CampoColor
                                    valor={anioColor}
                                    onChange={setAnioColor}
                                    porDefecto="#b8912f"
                                    tooltip="Color del año. Si lo dejas vacío se usa el dorado del sitio."
                                />
                            </Grupo>

                            <Grupo titulo="Título">
                                <CampoFuente
                                    valor={tituloFont}
                                    onChange={setTituloFont}
                                    tooltip="Fuente que se usará para el título del hito."
                                />
                                <CampoColor
                                    valor={tituloColor}
                                    onChange={setTituloColor}
                                    porDefecto="#16265e"
                                    tooltip="Color del título. Si lo dejas vacío se usa el azul del sitio."
                                />
                            </Grupo>

                            <Grupo titulo="Descripción">
                                <CampoFuente
                                    valor={textoFont}
                                    onChange={setTextoFont}
                                    tooltip="Fuente que se usará para la descripción del hito."
                                />
                                <CampoColor
                                    valor={textoColor}
                                    onChange={setTextoColor}
                                    porDefecto="#5b6474"
                                    tooltip="Color del texto descriptivo. Si lo dejas vacío se usa el gris del sitio."
                                />
                            </Grupo>
                        </div>

                        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Vista previa</span>
                            <div className="sitio-root sitio-preview w-full">
                                <div className="htc" style={estiloHito(estilo)}>
                                    <div className="htc-anio">{hito.anio || '1952'}</div>
                                    <h3>{hito.titulo || 'Título del hito'}</h3>
                                    <p>{hito.texto || 'Descripción del hito.'}</p>
                                </div>
                            </div>
                            <span className="text-center text-[11px] text-slate-400">Así se verá en la página principal.</span>
                        </div>
                    </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-slate-200 px-4 py-3">
                    <Boton type="button" onClick={onClose} className="px-4 py-2 text-sm hover:bg-slate-50">
                        Cancelar
                    </Boton>
                    <Boton
                        variante="primario"
                        type="button"
                        onClick={guardar}
                        disabled={guardando}
                        className="px-4 py-2 text-sm disabled:opacity-60"
                    >
                        <Icono nombre="guardar" className="h-4 w-4" />
                        {guardando ? 'Guardando...' : 'Guardar estilo'}
                    </Boton>
                </div>
            </div>
        </Modal>
    );
}

function Grupo({ titulo, children }) {
    return (
        <div className="rounded-xl border border-slate-200 p-3">
            <p className="mb-2 text-xs font-bold text-slate-700">{titulo}</p>
            <div className="space-y-2">{children}</div>
        </div>
    );
}

function CampoFuente({ valor, onChange, tooltip }) {
    return (
        <label className="flex items-center gap-2 text-xs text-slate-500" title={tooltip}>
            <span className="w-14 shrink-0">Fuente</span>
            <select
                value={valor}
                onChange={(e) => onChange(e.target.value)}
                className="panel-campo flex-1 px-2 py-1.5"
                title={tooltip}
            >
                <option value="">Predeterminada</option>
                {FUENTES.map((f) => (
                    <option key={f.key} value={f.key}>
                        {f.label}
                    </option>
                ))}
            </select>
        </label>
    );
}

function CampoColor({ valor, onChange, porDefecto, tooltip }) {
    return (
        <div className="flex items-center gap-2 text-xs text-slate-500" title={tooltip}>
            <span className="w-14 shrink-0">Color</span>
            <input
                type="color"
                value={valor || porDefecto}
                onChange={(e) => onChange(e.target.value)}
                className="h-8 w-10 cursor-pointer rounded-lg border border-slate-200"
                title={tooltip}
            />
            <span className="flex-1">{valor || 'Predeterminado'}</span>
            {valor && (
                <button
                    type="button"
                    onClick={() => onChange('')}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 transition hover:text-red-600"
                    title="Volver al color predeterminado"
                >
                    <Icono nombre="deshacer" className="h-3.5 w-3.5" /> Quitar
                </button>
            )}
        </div>
    );
}

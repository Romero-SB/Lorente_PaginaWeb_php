import { router } from '@inertiajs/react';
import { useState } from 'react';

import { toast } from '../../lib/toast';
import { FUENTES, OPCIONES_ALINEACION, contraste, estiloCategoria, oscurecer } from '../../lib/fuentes';
import { Icono } from './Iconos';

const AZUL_DEFECTO = '#16265e';

export default function EditorEstiloCategoria({ categoria, baseUrl = '/lorente-panel/docente-categorias', docenteMuestra, onClose }) {
    const inicial = categoria.estilo || {};

    const [tituloFont, setTituloFont] = useState(inicial.titulo_font || '');
    const [tituloColor, setTituloColor] = useState(inicial.titulo_color || '');
    const [tituloAlign, setTituloAlign] = useState(inicial.titulo_align || 'left');
    const [cargoFont, setCargoFont] = useState(inicial.cargo_font || '');
    const [cargoColor, setCargoColor] = useState(inicial.cargo_color || '');
    const [cargoAlign, setCargoAlign] = useState(inicial.cargo_align || 'left');
    const [fondo, setFondo] = useState(inicial.fondo || '');
    const [guardando, setGuardando] = useState(false);

    const estilo = {
        titulo_font: tituloFont || null,
        titulo_color: tituloColor || null,
        titulo_align: tituloAlign === 'left' ? null : tituloAlign,
        cargo_font: cargoFont || null,
        cargo_color: cargoColor || null,
        cargo_align: cargoAlign === 'left' ? null : cargoAlign,
        fondo: fondo || null,
    };

    const fondoTexto = fondo ? oscurecer(fondo, 0.35) : '#0f1b42';

    function guardar() {
        setGuardando(true);
        router.post(`${baseUrl}/${categoria.id}/estilo`, estilo, {
            preserveScroll: true,
            onSuccess: () => {
                toast('Estilo actualizado', 'ok');
                onClose();
            },
            onError: () => toast('No se pudo guardar el estilo', 'error'),
            onFinish: () => setGuardando(false),
        });
    }

    return (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-900/70 p-4" onClick={onClose}>
            <div
                className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                    <div>
                        <h3 className="text-sm font-bold text-slate-800">Estilo de “{categoria.nombre}”</h3>
                        <p className="text-[11px] text-slate-400">Se aplica a todos los docentes de esta categoría.</p>
                    </div>
                    <button type="button" onClick={onClose} className="text-slate-400 transition hover:text-slate-700">
                        <Icono nombre="cerrar" className="h-4 w-4" />
                    </button>
                </div>

                <div className="grid gap-5 p-4 md:grid-cols-[1fr_240px]">
                    <div className="space-y-4">
                        <Grupo titulo="Nombre del docente">
                            <CampoFuente valor={tituloFont} onChange={setTituloFont} />
                            <CampoColor valor={tituloColor} onChange={setTituloColor} porDefecto="#ffffff" aviso={contraste(tituloColor, fondoTexto)} />
                            <CampoAlineacion valor={tituloAlign} onChange={setTituloAlign} />
                        </Grupo>

                        <Grupo titulo="Cargo / curso">
                            <CampoFuente valor={cargoFont} onChange={setCargoFont} />
                            <CampoColor valor={cargoColor} onChange={setCargoColor} porDefecto="#8a6a1f" aviso={contraste(cargoColor, fondoTexto)} />
                            <CampoAlineacion valor={cargoAlign} onChange={setCargoAlign} />
                        </Grupo>

                        <Grupo titulo="Color del contenedor">
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    value={fondo || AZUL_DEFECTO}
                                    onChange={(e) => setFondo(e.target.value)}
                                    className="h-8 w-10 cursor-pointer rounded border border-slate-200"
                                />
                                <span className="text-xs text-slate-500">{fondo || 'Azul (predeterminado)'}</span>
                                {fondo && (
                                    <button type="button" onClick={() => setFondo('')} className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-slate-500 transition hover:text-red-600">
                                        <Icono nombre="deshacer" className="h-3.5 w-3.5" /> Azul
                                    </button>
                                )}
                            </div>
                        </Grupo>
                    </div>

                    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Vista previa</span>
                        <div className="sitio-root sitio-preview">
                            <div className="pdg" style={estiloCategoria(estilo)}>
                                <div className="pdc">
                                    <div className="pdc-img">
                                        {docenteMuestra?.foto ? (
                                            <img src={docenteMuestra.foto} alt="" />
                                        ) : (
                                            <i className="fas fa-user" style={{ fontSize: '2.5rem', color: 'rgba(255,255,255,0.4)' }}></i>
                                        )}
                                    </div>
                                    <div className="pdc-txt">
                                        <h3>{docenteMuestra?.nombre || 'Nombre del docente'}</h3>
                                        <p>{docenteMuestra?.cargo || 'Cargo / curso'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <span className="text-center text-[11px] text-slate-400">Así se verá en la página principal.</span>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-4 py-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={guardar}
                        disabled={guardando}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-900 disabled:opacity-60"
                    >
                        <Icono nombre="guardar" className="h-4 w-4" />
                        {guardando ? 'Guardando…' : 'Guardar estilo'}
                    </button>
                </div>
            </div>
        </div>
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

function CampoFuente({ valor, onChange }) {
    return (
        <label className="flex items-center gap-2 text-xs text-slate-500">
            <span className="w-14 shrink-0">Fuente</span>
            <select
                value={valor}
                onChange={(e) => onChange(e.target.value)}
                className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
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

function CampoColor({ valor, onChange, porDefecto, aviso }) {
    return (
        <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="w-14 shrink-0">Color</span>
            <input
                type="color"
                value={valor || porDefecto}
                onChange={(e) => onChange(e.target.value)}
                className="h-8 w-10 cursor-pointer rounded border border-slate-200"
            />
            <span className="flex-1">{valor || 'Predeterminado'}</span>
            {valor && (
                <button type="button" onClick={() => onChange('')} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 transition hover:text-red-600">
                    <Icono nombre="deshacer" className="h-3.5 w-3.5" /> Quitar
                </button>
            )}
            {aviso !== null && aviso < 4.5 && <span className="text-[11px] font-semibold text-amber-600" title="Contraste bajo">Bajo contraste</span>}
        </div>
    );
}

const ICONO_ALINEACION = {
    left: 'alinear-izquierda',
    center: 'alinear-centro',
    right: 'alinear-derecha',
};

const ETIQUETA_ALINEACION = {
    left: 'Alinear a la izquierda',
    center: 'Centrar',
    right: 'Alinear a la derecha',
};

function CampoAlineacion({ valor, onChange }) {
    return (
        <div className="flex items-center gap-2">
            <span className="w-14 shrink-0 text-xs text-slate-500">Alinear</span>
            <div className="inline-flex overflow-hidden rounded-lg border border-slate-200">
                {OPCIONES_ALINEACION.map((opcion) => (
                    <button
                        key={opcion}
                        type="button"
                        title={ETIQUETA_ALINEACION[opcion]}
                        aria-label={ETIQUETA_ALINEACION[opcion]}
                        aria-pressed={valor === opcion}
                        onClick={() => onChange(opcion)}
                        className={`border-r border-slate-200 px-3 py-1.5 transition last:border-r-0 ${
                            valor === opcion ? 'bg-blue-950 text-white' : 'text-slate-500 hover:bg-slate-50'
                        }`}
                    >
                        <Icono nombre={ICONO_ALINEACION[opcion]} className="h-4 w-4" />
                    </button>
                ))}
            </div>
        </div>
    );
}

import { useState } from 'react';

import { Icono } from '../Panel/Iconos';

/**
 * Área de subida de archivos accesible: arrastrar y soltar, o pulsar y elegir.
 *
 * @param {object} props
 * @param {string} [props.icono] Nombre del icono (de `Panel/Iconos`).
 * @param {string} [props.texto] Texto principal del área.
 * @param {string} [props.nota] Nota secundaria (formatos admitidos, etc.).
 * @param {string} [props.textoArrastrando] Texto al arrastrar por encima.
 * @param {string} [props.aceptacion] Valor `accept` del input (por defecto `*`).
 * @param {boolean} [props.resaltable] Resalta el borde al arrastrar encima.
 * @param {string} [props.className] Clases extra del área.
 * @param {(e: import('react').ChangeEvent<HTMLInputElement>) => void} [props.onSeleccionar]
 *          Notifica la selección desde el selector de archivos.
 * @param {(archivo: File) => void} [props.onSoltarArchivo] Notifica el archivo soltado.
 */
export default function FileDropzone({
    icono,
    texto,
    nota,
    textoArrastrando,
    aceptacion = '*',
    resaltable = true,
    className = '',
    onSeleccionar,
    onSoltarArchivo,
}) {
    const [arrastrando, setArrastrando] = useState(false);

    const resaltado = resaltable && arrastrando
        ? 'border-blue-400 bg-blue-50'
        : 'border-slate-300 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/40 focus-within:border-blue-400 focus-within:bg-blue-50';

    return (
        <label
            onDragOver={(e) => {
                e.preventDefault();
                if (resaltable && !arrastrando) setArrastrando(true);
            }}
            onDragLeave={(e) => {
                if (e.currentTarget.contains(e.relatedTarget)) return;
                if (resaltable) setArrastrando(false);
            }}
            onDrop={(e) => {
                e.preventDefault();
                setArrastrando(false);
                const archivo = e.dataTransfer.files?.[0];
                if (archivo) onSoltarArchivo?.(archivo);
            }}
            className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition ${resaltado} ${className}`}
        >
            <Icono nombre={icono} className="h-7 w-7 text-slate-400" />
            <span className="text-xs font-semibold text-slate-600">
                {resaltable && arrastrando && textoArrastrando ? textoArrastrando : texto}
            </span>
            <span className="text-[11px] text-slate-400">{nota}</span>
            <input type="file" accept={aceptacion} className="sr-only" onChange={onSeleccionar} />
        </label>
    );
}
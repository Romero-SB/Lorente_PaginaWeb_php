/**
 * Extensiones de archivos de oficina aceptadas como adjuntos.
 * @type {string[]}
 */
export const EXTENSIONES = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];

/**
 * Devuelve la extensión en minúsculas de un nombre de archivo.
 *
 * @param {string} nombre Nombre o ruta del archivo.
 * @returns {string} Extensión (p. ej. "pdf") o "" si no tiene.
 */
export function extensionDe(nombre) {
    return (nombre || '').split('.').pop()?.toLowerCase() || '';
}

/**
 * Clases Tailwind para el color de la insignia de un archivo según extensión.
 *
 * @param {string} ext Extensión sin el punto (minúscula).
 * @returns {string} Clases de color de fondo y texto.
 */
export function colorExtension(ext) {
    if (['doc', 'docx'].includes(ext)) return 'bg-blue-50 text-blue-700';
    if (['xls', 'xlsx'].includes(ext)) return 'bg-emerald-50 text-emerald-700';
    if (['ppt', 'pptx'].includes(ext)) return 'bg-orange-50 text-orange-700';
    return 'bg-red-50 text-red-700';
}
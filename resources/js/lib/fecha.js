const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/**
 * Formatea una fecha ISO (YYYY-MM-DD o completa) como "12 may 2026".
 *
 * @param {string|Date|null|undefined} valor Fecha en ISO o sin valor.
 * @returns {string} Texto en formato corto tradicional, o "—" si está vacío.
 */
export function formatoFecha(valor) {
    if (!valor) return '—';
    const [a, m, d] = String(valor).slice(0, 10).split('-');
    return `${d} ${MESES_CORTOS[Number(m) - 1]} ${a}`;
}

/**
 * Formatea una fecha con hora en la locale es-PE (p. ej. "12 may 2026, 14:30").
 *
 * @param {string|Date|null|undefined} valor Fecha ISO o Date.
 * @returns {string} Texto en formato medium + short, o "—" si está vacío.
 */
export function formatearFecha(valor) {
    if (!valor) return '—';
    return new Intl.DateTimeFormat('es-PE', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(valor));
}
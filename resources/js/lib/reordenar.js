/**
 * Devuelve una copia de la lista con el elemento de `desde` movido a `hasta`.
 *
 * @template T
 * @param {T[]} lista Lista original (no se muta).
 * @param {number|null} desde Índice de origen.
 * @param {number|null} hasta Índice de destino.
 * @returns {T[]} Nueva lista reordenada, o la misma referencia si no aplica.
 */
export function reordenarLista(lista, desde, hasta) {
    if (desde === hasta || desde == null || hasta == null) return lista;
    const copia = [...lista];
    const [movida] = copia.splice(desde, 1);
    copia.splice(hasta, 0, movida);
    return copia;
}

/**
 * Reordena invocando el setter del estado (patrón para drag & drop con useRef).
 *
 * @template T
 * @param {T[]} lista Lista actual del estado.
 * @param {(siguiente: T[]) => void} setLista Setter del estado.
 * @param {number|null} desde Índice de origen.
 * @param {number|null} hasta Índice de destino.
 */
export function reordenar(lista, setLista, desde, hasta) {
    setLista(reordenarLista(lista, desde, hasta));
}
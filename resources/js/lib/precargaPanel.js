const paginas = import.meta.glob('../Pages/Panel/*.jsx');

let precargado = false;

/**
 * Descarga por adelantado los chunks de todas las secciones del panel para
 * que el cambio entre secciones sea inmediato. Se ejecuta una sola vez.
 */
export function precargarSecciones() {
    if (precargado) return;
    precargado = true;

    Object.values(paginas).forEach((cargar) => {
        cargar().catch(() => {});
    });
}

export const THEME_COLOR_SITIO = '#1e3a8a';
export const THEME_COLOR_PANEL = '#0f1b42';

/**
 * Cambia el color de la barra del navegador (`<meta name="theme-color">`).
 *
 * @param {string} color Color hex válido para el atributo `content`.
 */
export function fijarThemeColor(color) {
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color);
}
export const FUENTES = [
    { key: 'playfair', label: 'Playfair Display (elegante)', css: "'Playfair Display', serif" },
    { key: 'inter', label: 'Inter (moderna)', css: "'Inter', sans-serif" },
    { key: 'poppins', label: 'Poppins', css: "'Poppins', sans-serif" },
    { label: 'Montserrat', key: 'montserrat', css: "'Montserrat', sans-serif" },
    { key: 'lora', label: 'Lora', css: "'Lora', serif" },
    { key: 'oswald', label: 'Oswald (condensada)', css: "'Oswald', sans-serif" },
];

export const OPCIONES_ALINEACION = ['left', 'center', 'right'];

export function fuenteCss(key) {
    const fuente = FUENTES.find((f) => f.key === key);
    return fuente ? fuente.css : null;
}

function aHex(n) {
    return n.toString(16).padStart(2, '0');
}

export function oscurecer(hex, factor) {
    const limpio = String(hex).replace('#', '');
    if (!/^[0-9a-fA-F]{6}$/.test(limpio)) return hex;

    const mezcla = (par) => Math.round(parseInt(limpio.slice(par, par + 2), 16) * (1 - factor));

    return `#${[0, 2, 4].map(mezcla).map(aHex).join('')}`;
}

function luminancia(hex) {
    const limpio = hex.replace('#', '');
    const canales = [0, 2, 4].map((i) => {
        const c = parseInt(limpio.slice(i, i + 2), 16) / 255;
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });

    return 0.2126 * canales[0] + 0.7152 * canales[1] + 0.0722 * canales[2];
}

export function contraste(hexA, hexB) {
    if (!/^#[0-9a-fA-F]{6}$/.test(hexA) || !/^#[0-9a-fA-F]{6}$/.test(hexB)) return null;

    const a = luminancia(hexA);
    const b = luminancia(hexB);

    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

export function estiloCategoria(estilo) {
    if (!estilo) return undefined;

    const css = {};

    if (estilo.titulo_font) {
        const fuente = fuenteCss(estilo.titulo_font);
        if (fuente) css['--pdc-titulo-font'] = fuente;
    }
    if (estilo.titulo_color) css['--pdc-titulo-color'] = estilo.titulo_color;
    if (estilo.titulo_align) css['--pdc-titulo-align'] = estilo.titulo_align;
    if (estilo.cargo_font) {
        const fuente = fuenteCss(estilo.cargo_font);
        if (fuente) css['--pdc-cargo-font'] = fuente;
    }
    if (estilo.cargo_color) css['--pdc-cargo-color'] = estilo.cargo_color;
    if (estilo.cargo_align) css['--pdc-cargo-align'] = estilo.cargo_align;
    if (estilo.fondo) {
        css['--pdc-fondo'] = `linear-gradient(135deg, ${oscurecer(estilo.fondo, 0.5)}, ${estilo.fondo})`;
        css['--pdc-txt-fondo'] = oscurecer(estilo.fondo, 0.35);
    }

    return Object.keys(css).length > 0 ? css : undefined;
}

export async function comprimirAWebp(archivo, maxAncho = 800, calidad = 0.8) {
    if (!archivo || !archivo.type?.startsWith('image/')) return archivo;

    const url = URL.createObjectURL(archivo);
    try {
        const imagen = await cargarImagen(url);
        const escala = Math.min(1, maxAncho / imagen.width);
        const ancho = Math.round(imagen.width * escala);
        const alto = Math.round(imagen.height * escala);

        const lienzo = document.createElement('canvas');
        lienzo.width = ancho;
        lienzo.height = alto;
        const ctx = lienzo.getContext('2d');
        ctx.drawImage(imagen, 0, 0, ancho, alto);

        const blob = await new Promise((res) => lienzo.toBlob(res, 'image/webp', calidad));
        if (!blob) return archivo;

        const nombre = (archivo.name || 'imagen').replace(/\.[^.]+$/, '') + '.webp';
        return new File([blob], nombre, { type: 'image/webp' });
    } catch {
        return archivo;
    } finally {
        URL.revokeObjectURL(url);
    }
}

function cargarImagen(url) {
    return new Promise((res, rej) => {
        const img = new Image();
        img.onload = () => res(img);
        img.onerror = rej;
        img.src = url;
    });
}

export function formatoPeso(bytes) {
    if (!bytes) return '0 KB';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
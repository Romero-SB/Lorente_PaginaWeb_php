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

export async function recortarImagenWebp(imageSrc, areaPixels, anchoSalida = 400, calidad = 0.85) {
    const imagen = await cargarImagen(imageSrc);
    const altoSalida = Math.max(1, Math.round(anchoSalida * (areaPixels.height / areaPixels.width)));

    const lienzo = document.createElement('canvas');
    lienzo.width = anchoSalida;
    lienzo.height = altoSalida;
    const ctx = lienzo.getContext('2d');
    ctx.drawImage(
        imagen,
        areaPixels.x,
        areaPixels.y,
        areaPixels.width,
        areaPixels.height,
        0,
        0,
        anchoSalida,
        altoSalida,
    );

    const blob = await new Promise((res) => lienzo.toBlob(res, 'image/webp', calidad));
    if (!blob) throw new Error('No se pudo procesar la imagen');

    return new File([blob], 'docente.webp', { type: 'image/webp' });
}

export function formatoPeso(bytes) {
    if (!bytes) return '0 KB';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
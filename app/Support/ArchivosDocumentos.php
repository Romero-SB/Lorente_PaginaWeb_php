<?php

namespace App\Support;

use App\Models\Documento;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class ArchivosDocumentos
{
    /** @return array<int, string> */
    public static function extensiones(): array
    {
        return array_values(Almacenamiento::adjuntosPermitidos());
    }

    /**
     * Disco donde se almacena el archivo según la visibilidad del documento.
     */
    public static function disco(string $visibilidad): string
    {
        return $visibilidad === Documento::VISIBILIDAD_PRIVADO ? 'local' : 'public';
    }

    /**
     * Guarda el archivo del documento en el disco correspondiente.
     *
     * @return array{ruta: string, mime: string, peso: int}|null
     */
    public static function guardar(UploadedFile $archivo, string $visibilidad): ?array
    {
        return Almacenamiento::guardarAdjuntoEn($archivo, self::disco($visibilidad));
    }

    public static function eliminar(?string $ruta, string $visibilidad): void
    {
        Almacenamiento::eliminarDe(self::disco($visibilidad), $ruta);
    }

    /**
     * Mueve un archivo entre discos al cambiar la visibilidad del documento.
     */
    public static function mover(?string $ruta, string $desde, string $hasta): ?string
    {
        if ($ruta === null || $ruta === '') {
            return $ruta;
        }

        $origen = self::disco($desde);
        $destino = self::disco($hasta);

        if ($origen === $destino) {
            return $ruta;
        }

        $contenido = Storage::disk($origen)->get($ruta);

        if ($contenido === null) {
            return $ruta;
        }

        Storage::disk($destino)->put($ruta, $contenido);
        Storage::disk($origen)->delete($ruta);

        return $ruta;
    }

    /**
     * URL de acceso al documento. Los privados se sirven por una ruta autenticada.
     */
    public static function url(Documento $documento): ?string
    {
        if ($documento->archivo_url === null || $documento->archivo_url === '') {
            return null;
        }

        return $documento->esPrivado()
            ? route('panel.documentos.descargar', $documento)
            : Almacenamiento::url($documento->archivo_url);
    }
}

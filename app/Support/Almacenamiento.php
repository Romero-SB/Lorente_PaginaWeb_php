<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class Almacenamiento
{
    public static function disco(): string
    {
        return 'public';
    }

    public static function url(string $ruta): string
    {
        return Storage::disk(self::disco())->url($ruta);
    }

    /**
     * MIME real (finfo) aceptados para adjuntos.
     *
     * @return array<string, string>
     */
    public static function adjuntosPermitidos(): array
    {
        return [
            'application/pdf' => 'pdf',
            'application/msword' => 'doc',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document' => 'docx',
            'application/vnd.ms-excel' => 'xls',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' => 'xlsx',
            'application/vnd.ms-powerpoint' => 'ppt',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation' => 'pptx',
        ];
    }

    /**
     * Guarda una imagen de noticia. Devuelve la ruta en disco, o null si el
     * MIME real no es una imagen permitida.
     */
    public static function guardarImagen(UploadedFile $archivo, string $carpeta = 'noticias/img'): ?string
    {
        $extension = match ($archivo->getMimeType()) {
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
            'image/gif' => 'gif',
            default => null,
        };

        if ($extension === null) {
            return null;
        }

        $nombre = $carpeta.'/'.date('Ymd_His').'_'.uniqid().'.'.$extension;

        return $archivo->storeAs(dirname($nombre), basename($nombre), self::disco());
    }

    /**
     * Guarda un adjunto validando su MIME real.
     *
     * @return array{ruta: string, mime: string, peso: int}|null
     */
    public static function guardarAdjunto(UploadedFile $archivo, string $carpeta = 'noticias/adjuntos'): ?array
    {
        return self::guardarAdjuntoEn($archivo, self::disco(), $carpeta);
    }

    /**
     * Guarda un adjunto en un disco concreto validando su MIME real.
     *
     * @return array{ruta: string, mime: string, peso: int}|null
     */
    public static function guardarAdjuntoEn(UploadedFile $archivo, string $disco, string $carpeta = 'documentos'): ?array
    {
        $mime = $archivo->getMimeType();
        $extension = self::adjuntosPermitidos()[$mime] ?? null;

        if ($extension === null) {
            return null;
        }

        $nombre = $carpeta.'/'.date('Ymd_His').'_'.uniqid().'.'.$extension;
        $ruta = $archivo->storeAs(dirname($nombre), basename($nombre), $disco);

        return [
            'ruta' => $ruta,
            'mime' => $mime,
            'peso' => $archivo->getSize(),
        ];
    }

    public static function eliminar(?string $ruta): void
    {
        self::eliminarDe(self::disco(), $ruta);
    }

    public static function eliminarDe(string $disco, ?string $ruta): void
    {
        if ($ruta !== null && Storage::disk($disco)->exists($ruta)) {
            Storage::disk($disco)->delete($ruta);
        }
    }
}

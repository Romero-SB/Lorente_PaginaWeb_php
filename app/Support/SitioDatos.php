<?php

namespace App\Support;

use App\Models\Adjunto;
use App\Models\Config;
use App\Models\Docente;
use App\Models\Documento;
use App\Models\Noticia;
use App\Models\NoticiaImagen;

class SitioDatos
{
    /** @return array<string, mixed> */
    public static function config(): array
    {
        $config = Config::actual();

        return [
            'phone' => $config->phone,
            'email' => $config->email,
            'direccion' => $config->direccion,
            'estudiantes' => $config->estudiantes,
            'docentes_count' => $config->docentes_count,
            'anio_fundacion' => $config->anio_fundacion,
            'niveles' => $config->niveles,
            'mision' => $config->mision,
            'vision' => $config->vision,
        ];
    }

    /** @return array<int, array<string, mixed>> */
    public static function docentes(): array
    {
        return Docente::query()
            ->select(['id', 'nombre', 'cargo', 'foto', 'categoria'])
            ->where('activo', true)
            ->orderBy('orden')
            ->orderBy('id')
            ->get()
            ->map(fn (Docente $d) => [
                'id' => $d->id,
                'nombre' => $d->nombre,
                'cargo' => $d->cargo,
                'foto' => $d->foto ? Almacenamiento::url($d->foto) : null,
                'categoria' => $d->categoria,
            ])
            ->values()
            ->all();
    }

    /** @return array<string, mixed> */
    public static function noticia(Noticia $noticia): array
    {
        $imagenes = $noticia->imagenes
            ->map(fn (NoticiaImagen $i) => Almacenamiento::url($i->ruta))
            ->values()
            ->all();

        $portada = $noticia->portada;
        if ($portada !== null) {
            $url = Almacenamiento::url($portada->ruta);
            $imagenes = array_values(array_unique(array_merge([$url], $imagenes)));
        }

        return [
            'id' => $noticia->id,
            'titulo' => $noticia->titulo,
            'slug' => $noticia->slug,
            'cat' => $noticia->cat,
            'fec' => $noticia->fec?->toDateString(),
            'res' => $noticia->res,
            'con' => $noticia->con,
            'aut' => $noticia->aut ?: $noticia->author?->name,
            'imagenes' => $imagenes,
            'files' => $noticia->adjuntos->map(fn (Adjunto $a) => [
                'nombre' => $a->nombre,
                'url' => Almacenamiento::url($a->ruta),
            ])->values()->all(),
        ];
    }

    /** @return array<string, mixed> */
    public static function documento(Documento $documento): array
    {
        $privado = $documento->esPrivado();
        $ruta = $documento->archivo_url;
        $nombre = $documento->archivo_nombre ?: ($ruta ? basename($ruta) : 'documento');

        return [
            'id' => $documento->id,
            'titulo' => $documento->titulo,
            'categoria' => $documento->categoria,
            'descripcion' => $documento->descripcion,
            'instrucciones' => $documento->instrucciones,
            'privado' => $privado,
            'archivo' => [
                'nombre' => $nombre,
                'url' => $ruta
                    ? ($privado
                        ? route('sitio.documentos.descargar', $documento)
                        : Almacenamiento::url($ruta))
                    : null,
            ],
        ];
    }
}

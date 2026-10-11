<?php

namespace App\Support;

use App\Models\Docente;
use App\Models\DocenteCategoria;
use App\Models\Documento;
use App\Models\Noticia;
use App\Models\User;

class ContenidoSitio
{
    /**
     * Datos que alimentan la página pública. Se reutilizan tanto en la casa
     * como detrás del panel administrativo (superpuesto) y del login.
     *
     * @return array<string, mixed>
     */
    public static function para(?User $usuario = null): array
    {
        return [
            'config' => SitioDatos::config(),
            'docentes' => SitioDatos::docentes(),
            'categorias_docentes' => self::categoriasDocentes(),
            'noticias' => self::ultimasNoticias(),
            'documentos' => self::documentos($usuario !== null),
        ];
    }

    /** @return array<int, array<string, mixed>> */
    private static function categoriasDocentes(): array
    {
        $conDocentes = Docente::query()
            ->where('activo', true)
            ->pluck('categoria')
            ->filter()
            ->unique();

        return DocenteCategoria::query()
            ->orderBy('orden')
            ->orderBy('id')
            ->get()
            ->filter(fn (DocenteCategoria $c) => $conDocentes->contains($c->nombre))
            ->map(fn (DocenteCategoria $c) => [
                'id' => $c->id,
                'nombre' => $c->nombre,
                'orden' => $c->orden,
            ])
            ->values()
            ->all();
    }

    /** @return array<int, array<string, mixed>> */
    private static function ultimasNoticias(): array
    {
        return Noticia::query()
            ->where('est', Noticia::EST_PUBLICADO)
            ->with(['imagenes', 'adjuntos', 'portada', 'author'])
            ->orderByDesc('fiso')
            ->orderByDesc('id')
            ->limit(6)
            ->get()
            ->map(fn (Noticia $n) => SitioDatos::noticia($n))
            ->values()
            ->all();
    }

    /** @return array<int, array<string, mixed>> */
    private static function documentos(bool $autenticado): array
    {
        return Documento::query()
            ->when(! $autenticado, fn ($q) => $q->where('visibilidad', Documento::VISIBILIDAD_PUBLICO))
            ->orderByDesc('id')
            ->get()
            ->map(fn (Documento $d) => SitioDatos::documento($d))
            ->values()
            ->all();
    }
}

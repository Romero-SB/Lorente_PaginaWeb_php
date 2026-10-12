<?php

namespace App\Http\Resources;

use App\Models\Adjunto;
use App\Models\NoticiaImagen;
use App\Support\Almacenamiento;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NoticiaResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $usuario = $request->user();
        $puede = $usuario ? $usuario->can('gestionar', $this->resource) : false;

        return [
            'id' => $this->id,
            'titulo' => $this->titulo,
            'slug' => $this->slug,
            'cat' => $this->cat,
            'fec' => $this->fec?->toDateString(),
            'res' => $this->res,
            'est' => $this->est,
            'aut' => $this->aut,
            'imagenes' => $this->imagenes->map(fn (NoticiaImagen $i) => [
                'id' => $i->id,
                'url' => Almacenamiento::url($i->ruta),
                'es_portada' => $i->es_portada,
            ])->values()->all(),
            'adjuntos' => $this->adjuntos->map(fn (Adjunto $a) => [
                'id' => $a->id,
                'nombre' => $a->nombre,
                'peso' => $a->peso,
                'mime' => $a->mime,
            ])->values()->all(),
            'autor' => $this->author
                ? ['name' => $this->author->name, 'cargo' => $this->author->cargo]
                : ['name' => $this->aut ?? '—', 'cargo' => null],
            'modificado_por' => $this->updatedBy ? ['name' => $this->updatedBy->name] : null,
            'puede_editar' => $puede,
            'puede_eliminar' => $puede,
        ];
    }
}

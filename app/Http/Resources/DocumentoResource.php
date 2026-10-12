<?php

namespace App\Http\Resources;

use App\Support\ArchivosDocumentos;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DocumentoResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $usuario = $request->user();
        $puede = $usuario ? $usuario->can('gestionar', $this->resource) : false;

        return [
            'id' => $this->id,
            'titulo' => $this->titulo,
            'categoria' => $this->categoria,
            'visibilidad' => $this->visibilidad,
            'descripcion' => $this->descripcion,
            'instrucciones' => $this->instrucciones,
            'archivo' => [
                'nombre' => $this->archivo_nombre,
                'url' => ArchivosDocumentos::url($this->resource),
            ],
            'autor' => $this->author
                ? ['name' => $this->author->name, 'cargo' => $this->author->cargo]
                : ['name' => '—', 'cargo' => null],
            'puede_editar' => $puede,
            'puede_eliminar' => $puede,
        ];
    }
}

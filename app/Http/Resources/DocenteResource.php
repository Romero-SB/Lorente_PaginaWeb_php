<?php

namespace App\Http\Resources;

use App\Support\Almacenamiento;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DocenteResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nombre' => $this->nombre,
            'cargo' => $this->cargo,
            'categoria' => $this->categoria,
            'orden' => $this->orden,
            'activo' => $this->activo,
            'foto' => $this->foto ? Almacenamiento::url($this->foto) : null,
        ];
    }
}

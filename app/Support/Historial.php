<?php

namespace App\Support;

use App\Models\Actividad;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class Historial
{
    public function __construct(protected Request $request) {}

    public function registrar(
        ?User $usuario,
        string $accion,
        Model $modelo,
        string $titulo,
        ?array $cambios = null,
        ?string $descripcion = null,
    ): Actividad {
        return Actividad::create([
            'user_id' => $usuario?->id,
            'accion' => $accion,
            'modelo' => $modelo->getMorphClass(),
            'modelo_id' => $modelo->getKey(),
            'titulo' => $titulo,
            'descripcion' => $descripcion,
            'cambios' => $cambios,
            'ip' => $this->request->ip(),
            'user_agent' => substr((string) $this->request->userAgent(), 0, 500),
        ]);
    }
}

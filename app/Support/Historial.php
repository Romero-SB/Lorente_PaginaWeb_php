<?php

namespace App\Support;

use App\Models\Actividad;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class Historial
{
    /**
     * Registra una acción en el historial de actividad.
     *
     * @param  array<string, mixed>|null  $cambios
     */
    public static function registrar(
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
            'ip' => request()->ip(),
            'user_agent' => substr((string) request()->userAgent(), 0, 500),
        ]);
    }
}

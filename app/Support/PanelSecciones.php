<?php

namespace App\Support;

use App\Models\User;

class PanelSecciones
{
    public static function etiquetaRol(string $rol): string
    {
        return config("panel.labels.$rol", $rol);
    }

    /**
     * Secciones visibles para un rol, listas para consumir en el frontend.
     *
     * @return array<int, array{clave: string, etiqueta: string, icono: string, ruta: string, exacta: bool}>
     */
    public static function paraRol(string $rol): array
    {
        return collect(config('panel.secciones'))
            ->filter(fn (array $seccion) => in_array($rol, $seccion['roles'], true))
            ->map(fn (array $seccion, string $clave) => [
                'clave' => $clave,
                'etiqueta' => $seccion['etiqueta'],
                'icono' => $seccion['icono'],
                'ruta' => $seccion['ruta'],
                'exacta' => $seccion['exacta'] ?? false,
            ])
            ->values()
            ->all();
    }

    public static function accesoPermitido(User $usuario, string $clave): bool
    {
        $seccion = config("panel.secciones.$clave");

        return $seccion !== null && in_array($usuario->role, $seccion['roles'], true);
    }
}

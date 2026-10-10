<?php

namespace App\Support;

class Correo
{
    /**
     * Normaliza un correo para compararlo sin distinguir mayúsculas/minúsculas.
     *
     * Los correos se guardan siempre en minúsculas y sin espacios, de modo que
     * una cuenta creada como Juan@Correo.Com se ingrese como juan@correo.com.
     */
    public static function normalizar(mixed $valor): ?string
    {
        if ($valor === null) {
            return null;
        }

        $correo = mb_strtolower(trim((string) $valor));

        return $correo === '' ? null : $correo;
    }
}

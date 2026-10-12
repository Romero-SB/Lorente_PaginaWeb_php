<?php

namespace App\Support;

use App\Models\Noticia;
use Illuminate\Database\Eloquent\Model;

class PapeleraNoticias extends Papelera
{
    protected static function modelo(): string
    {
        return Noticia::class;
    }

    protected static function clavePurga(): string
    {
        return 'papelera.noticias.purga';
    }

    /** @return array<int, string> */
    protected static function conRelacionesTrashed(): array
    {
        return ['author:id,name,cargo,role', 'updatedBy:id,name', 'deletedBy:id,name', 'imagenes', 'adjuntos'];
    }

    /** @return array<int, string> */
    protected static function conRelacionesPurga(): array
    {
        return ['imagenes', 'adjuntos'];
    }

    public static function eliminarArchivos(Model $registro): void
    {
        foreach ($registro->imagenes as $imagen) {
            Almacenamiento::eliminar($imagen->ruta);
        }

        foreach ($registro->adjuntos as $adjunto) {
            Almacenamiento::eliminar($adjunto->ruta);
        }
    }
}

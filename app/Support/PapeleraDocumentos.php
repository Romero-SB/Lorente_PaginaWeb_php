<?php

namespace App\Support;

use App\Models\Documento;
use Illuminate\Database\Eloquent\Model;

class PapeleraDocumentos extends Papelera
{
    protected static function modelo(): string
    {
        return Documento::class;
    }

    protected static function clavePurga(): string
    {
        return 'papelera.documentos.purga';
    }

    /** @return array<int, string> */
    protected static function conRelacionesTrashed(): array
    {
        return ['author:id,name,cargo,role', 'deletedBy:id,name'];
    }

    public static function eliminarArchivos(Model $registro): void
    {
        ArchivosDocumentos::eliminar($registro->archivo_url, $registro->visibilidad);
    }
}

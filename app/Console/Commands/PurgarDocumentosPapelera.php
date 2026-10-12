<?php

namespace App\Console\Commands;

use App\Support\PapeleraDocumentos;

class PurgarDocumentosPapelera extends PurgarPapelera
{
    protected $signature = 'documentos:purgar-papelera';

    protected $description = 'Elimina definitivamente los documentos que superaron el límite de días en la papelera.';

    protected function papelera(): string
    {
        return PapeleraDocumentos::class;
    }

    protected function mensaje(int $eliminados): string
    {
        return "Documentos purgados de la papelera: {$eliminados}";
    }
}

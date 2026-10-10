<?php

namespace App\Console\Commands;

use App\Support\PapeleraDocumentos;
use Illuminate\Console\Command;

class PurgarDocumentosPapelera extends Command
{
    protected $signature = 'documentos:purgar-papelera';

    protected $description = 'Elimina definitivamente los documentos que superaron el límite de días en la papelera.';

    public function handle(): int
    {
        $eliminados = PapeleraDocumentos::purgarVencidas();

        $this->info("Documentos purgados de la papelera: {$eliminados}");

        return self::SUCCESS;
    }
}

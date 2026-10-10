<?php

namespace App\Console\Commands;

use App\Support\PapeleraDocentes;
use Illuminate\Console\Command;

class PurgarDocentesPapelera extends Command
{
    protected $signature = 'docentes:purgar-papelera';

    protected $description = 'Elimina definitivamente los docentes que superaron el límite de días en la papelera.';

    public function handle(): int
    {
        $eliminados = PapeleraDocentes::purgarVencidas();

        $this->info("Docentes purgados de la papelera: {$eliminados}");

        return self::SUCCESS;
    }
}

<?php

namespace App\Console\Commands;

use App\Support\PapeleraNoticias;
use Illuminate\Console\Command;

class PurgarNoticiasPapelera extends Command
{
    protected $signature = 'noticias:purgar-papelera';

    protected $description = 'Elimina definitivamente las noticias que superaron el límite de días en la papelera.';

    public function handle(): int
    {
        $eliminadas = PapeleraNoticias::purgarVencidas();

        $this->info("Noticias purgadas de la papelera: {$eliminadas}");

        return self::SUCCESS;
    }
}

<?php

namespace App\Console\Commands;

use App\Support\PapeleraNoticias;

class PurgarNoticiasPapelera extends PurgarPapelera
{
    protected $signature = 'noticias:purgar-papelera';

    protected $description = 'Elimina definitivamente las noticias que superaron el límite de días en la papelera.';

    protected function papelera(): string
    {
        return PapeleraNoticias::class;
    }

    protected function mensaje(int $eliminados): string
    {
        return "Noticias purgadas de la papelera: {$eliminados}";
    }
}

<?php

namespace App\Console\Commands;

use App\Support\PapeleraDocentes;

class PurgarDocentesPapelera extends PurgarPapelera
{
    protected $signature = 'docentes:purgar-papelera';

    protected $description = 'Elimina definitivamente los docentes que superaron el límite de días en la papelera.';

    protected function papelera(): string
    {
        return PapeleraDocentes::class;
    }

    protected function mensaje(int $eliminados): string
    {
        return "Docentes purgados de la papelera: {$eliminados}";
    }
}

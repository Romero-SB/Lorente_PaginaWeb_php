<?php

namespace App\Console\Commands;

use App\Support\Papelera;
use Illuminate\Console\Command;

abstract class PurgarPapelera extends Command
{
    /** @return class-string<Papelera> */
    abstract protected function papelera(): string;

    abstract protected function mensaje(int $eliminados): string;

    public function handle(): int
    {
        $papelera = $this->papelera();
        $eliminados = $papelera::purgarVencidas();

        $this->info($this->mensaje($eliminados));

        return self::SUCCESS;
    }
}

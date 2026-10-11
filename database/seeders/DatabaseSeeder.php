<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Siembra las cuentas base (Super Usuario, Administrador y Docente)
     * y la configuración institucional.
     */
    public function run(): void
    {
        $this->call([
            SuperUsuarioSeeder::class,
            ConfigInstitucionalSeeder::class,
        ]);
    }
}

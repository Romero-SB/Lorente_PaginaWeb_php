<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Siembra la cuenta Super Usuario y la configuración institucional.
     * Las demás cuentas se crean desde el panel.
     */
    public function run(): void
    {
        $this->call([
            SuperUsuarioSeeder::class,
            ConfigInstitucionalSeeder::class,
        ]);
    }
}

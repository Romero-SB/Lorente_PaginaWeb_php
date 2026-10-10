<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Siembra la cuenta Super Usuario y la configuración institucional.
     *
     * Para cuentas demo de prueba: `php artisan db:seed --class=DemoUsuariosSeeder`.
     */
    public function run(): void
    {
        $this->call([
            SuperUsuarioSeeder::class,
            ConfigInstitucionalSeeder::class,
        ]);
    }
}

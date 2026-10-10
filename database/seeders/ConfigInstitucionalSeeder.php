<?php

namespace Database\Seeders;

use App\Models\Config;
use App\Models\User;
use Illuminate\Database\Seeder;

class ConfigInstitucionalSeeder extends Seeder
{
    /**
     * Crea la fila única de configuración institucional (id = 1).
     * Los valores se editan después desde el panel (Admin/Super).
     */
    public function run(): void
    {
        $super = User::where('role', User::ROLE_SUPER)->first();

        Config::updateOrCreate(
            ['id' => 1],
            [
                'phone' => '',
                'email' => '',
                'direccion' => '',
                'estudiantes' => null,
                'docentes_count' => null,
                'anio_fundacion' => null,
                'niveles' => '',
                'mision' => '',
                'vision' => '',
                'updated_by' => $super?->id,
            ]
        );

        $this->command?->info('Configuración institucional creada (id = 1).');
    }
}

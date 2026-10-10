<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoUsuariosSeeder extends Seeder
{
    /**
     * Cuentas de prueba (OPCIONAL). No se ejecuta con DatabaseSeeder.
     * Uso: `php artisan db:seed --class=DemoUsuariosSeeder`.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'administrador@lorente.edu.pe'],
            [
                'name' => 'Administrador Demo',
                'password' => Hash::make('lorente2026'),
                'role' => User::ROLE_ADMIN,
                'cargo' => 'Administrador',
                'must_change_password' => true,
                'email_verified_at' => now(),
            ]
        );

        User::updateOrCreate(
            ['email' => 'docente@lorente.edu.pe'],
            [
                'name' => 'Docente Demo',
                'password' => Hash::make('lorente2026'),
                'role' => User::ROLE_DOCENTE,
                'cargo' => 'Docente',
                'must_change_password' => true,
                'email_verified_at' => now(),
            ]
        );

        $this->command?->info('Cuentas demo: administrador@lorente.edu.pe y docente@lorente.edu.pe (clave lorente2026)');
    }
}

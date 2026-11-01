<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SuperUsuarioSeeder extends Seeder
{
    /**
     * Crea la cuenta base de la plataforma.
     *
     * Clave por defecto: lorente2026
     * El Super Usuario exige cambio de contraseña en el primer inicio de sesión.
     * Las demás cuentas se crean desde el panel.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'super@lorente.edu.pe'],
            [
                'name' => 'Super Administrador',
                'password' => Hash::make('lorente2026'),
                'role' => User::ROLE_SUPER,
                'cargo' => 'Administrador de plataforma',
                'must_change_password' => true,
                'email_verified_at' => now(),
            ]
        );

        $this->command?->info('Cuenta base creada (clave lorente2026):');
        $this->command?->info('  Super Usuario : super@lorente.edu.pe');
    }
}

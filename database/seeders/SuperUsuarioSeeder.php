<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SuperUsuarioSeeder extends Seeder
{
    /**
     * Crea el Super Usuario inicial.
     *
     * Credenciales por defecto: admin@lorente.edu.pe / lorente2026
     * Se exige cambio de contraseña en el primer inicio de sesión.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@lorente.edu.pe'],
            [
                'name' => 'Super Administrador',
                'password' => Hash::make('lorente2026'),
                'role' => User::ROLE_SUPER,
                'cargo' => 'Administrador de plataforma',
                'must_change_password' => true,
                'email_verified_at' => now(),
            ]
        );

        $this->command?->info('Super Usuario: admin@lorente.edu.pe / lorente2026');
    }
}

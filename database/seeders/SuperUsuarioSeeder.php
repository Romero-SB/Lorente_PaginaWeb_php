<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SuperUsuarioSeeder extends Seeder
{
    /**
     * Crea las cuentas base de la plataforma.
     *
     * Clave por defecto para todas: lorente2026
     * El Super Usuario exige cambio de contraseña en el primer inicio de sesión.
     */
    public function run(): void
    {
        $cuentas = [
            [
                'email' => 'super@lorente.edu.pe',
                'name' => 'Super Administrador',
                'role' => User::ROLE_SUPER,
                'cargo' => 'Administrador de plataforma',
                'must_change_password' => true,
            ],
            [
                'email' => 'admin@lorente.edu.pe',
                'name' => 'Administrador',
                'role' => User::ROLE_ADMIN,
                'cargo' => 'Administrador',
                'must_change_password' => false,
            ],
            [
                'email' => 'docente@lorente.edu.pe',
                'name' => 'Docente',
                'role' => User::ROLE_DOCENTE,
                'cargo' => 'Docente',
                'must_change_password' => false,
            ],
        ];

        foreach ($cuentas as $cuenta) {
            User::updateOrCreate(
                ['email' => $cuenta['email']],
                [
                    'name' => $cuenta['name'],
                    'password' => Hash::make('lorente2026'),
                    'role' => $cuenta['role'],
                    'cargo' => $cuenta['cargo'],
                    'must_change_password' => $cuenta['must_change_password'],
                    'email_verified_at' => now(),
                ]
            );
        }

        $this->command?->info('Cuentas creadas (clave lorente2026):');
        $this->command?->info('  Super Usuario : super@lorente.edu.pe');
        $this->command?->info('  Administrador : admin@lorente.edu.pe');
        $this->command?->info('  Docente       : docente@lorente.edu.pe');
    }
}

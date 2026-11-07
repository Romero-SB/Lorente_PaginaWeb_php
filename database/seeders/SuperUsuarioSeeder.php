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
     * Claves iniciales: lorente2026 para la cuenta base y 12345678 para las
     * cuentas institucionales. Todas exigen cambio de contraseña en el primer
     * inicio de sesión. Las demás cuentas se crean desde el panel.
     */
    public function run(): void
    {
        $cuentas = [
            [
                'email' => 'super@lorente.edu.pe',
                'name' => 'Super Administrador',
                'password' => 'lorente2026',
                'cargo' => 'Administrador de plataforma',
            ],
            [
                'email' => 'lcampos@gloriososebastianlorente.edu.pe',
                'name' => 'L. Campos',
                'password' => '12345678',
                'cargo' => 'Super Usuario',
            ],
            [
                'email' => 'gdavila@gloriososebastianlorente.edu.pe',
                'name' => 'G. Davila',
                'password' => '12345678',
                'cargo' => 'Super Usuario',
            ],
        ];

        foreach ($cuentas as $cuenta) {
            User::updateOrCreate(
                ['email' => $cuenta['email']],
                [
                    'name' => $cuenta['name'],
                    'password' => Hash::make($cuenta['password']),
                    'role' => User::ROLE_SUPER,
                    'cargo' => $cuenta['cargo'],
                    'must_change_password' => true,
                    'email_verified_at' => now(),
                ]
            );
        }

        $this->command?->info('Cuentas Super Usuario creadas:');
        $this->command?->info('  super@lorente.edu.pe                       (clave lorente2026)');
        $this->command?->info('  lcampos@gloriososebastianlorente.edu.pe    (clave 12345678)');
        $this->command?->info('  gdavila@gloriososebastianlorente.edu.pe    (clave 12345678)');
    }
}

<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LoginTest extends TestCase
{
    use RefreshDatabase;

    public function test_un_visitante_puede_ver_el_login(): void
    {
        $response = $this->get(route('panel.login.show'));

        $response->assertOk();
    }

    public function test_usuario_puede_iniciar_sesion_por_email(): void
    {
        $user = User::factory()->create([
            'email' => 'docente@lorente.edu.pe',
            'role' => User::ROLE_DOCENTE,
            'must_change_password' => false,
        ]);

        $response = $this->post(route('panel.login.store'), [
            'email' => 'Docente@Lorente.edu.pe',
            'password' => 'password',
        ]);

        $response->assertRedirect(route('panel.index'));
        $this->assertAuthenticatedAs($user);
    }

    public function test_usuario_entra_en_casillero_se_va_al_cambio_obligatorio(): void
    {
        $user = User::factory()->create([
            'email' => 'nuevo@lorente.edu.pe',
            'must_change_password' => true,
        ]);

        $response = $this->post(route('panel.login.store'), [
            'email' => 'nuevo@lorente.edu.pe',
            'password' => 'password',
        ]);

        $response->assertRedirect(route('panel.password.first.show'));
        $this->assertAuthenticatedAs($user);
    }

    public function test_credenciales_invalidas_muestran_error(): void
    {
        $user = User::factory()->create([
            'email' => 'docente@lorente.edu.pe',
        ]);

        $response = $this->post(route('panel.login.store'), [
            'email' => $user->email,
            'password' => 'incorrecta',
        ]);

        $response->assertSessionHasErrors('email');
        $this->assertGuest();
    }

    public function test_despues_de_cinco_fallos_se_bloquea_el_login_una_hora(): void
    {
        $user = User::factory()->create([
            'email' => 'docente@lorente.edu.pe',
        ]);

        foreach (range(1, 5) as $i) {
            $this->post(route('panel.login.store'), [
                'email' => $user->email,
                'password' => 'incorrecta',
            ]);
        }

        $response = $this->post(route('panel.login.store'), [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $response->assertSessionHasErrors('email');
        $this->assertGuest();
    }

    public function test_turnstile_es_obligatorio_cuando_esta_habilitado(): void
    {
        config([
            'services.turnstile.enabled' => true,
            'services.turnstile.site_key' => '0x4AAAAAAtestkey',
            'services.turnstile.secret_key' => '0x4AAAAAAtestsecret',
        ]);

        $response = $this->post(route('panel.login.store'), [
            'email' => 'admin@lorente.edu.pe',
            'password' => 'password',
        ]);

        $response->assertSessionHasErrors('cf-turnstile-response');
        $this->assertGuest();
    }
}

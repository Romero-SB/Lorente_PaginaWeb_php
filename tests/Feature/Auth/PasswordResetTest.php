<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use App\Notifications\ResetPasswordNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Tests\TestCase;

class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    public function test_la_pagina_de_recuperacion_se_muestra(): void
    {
        $response = $this->get(route('panel.password.request'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Auth/Login')
            ->where('vista', 'recuperar')
            ->has('sitio'));
    }

    public function test_se_envia_el_enlace_de_recuperacion(): void
    {
        Notification::fake();

        $user = User::factory()->create(['email' => 'docente@lorente.edu.pe']);

        $response = $this->post(route('panel.password.email'), [
            'email' => 'Docente@Lorente.edu.pe',
        ]);

        $response->assertSessionHas('status');
        Notification::assertSentTo($user, ResetPasswordNotification::class);
    }

    public function test_no_revela_si_el_correo_no_existe(): void
    {
        $response = $this->post(route('panel.password.email'), [
            'email' => 'no-existe@lorente.edu.pe',
        ]);

        $response->assertSessionHas('status');
        $response->assertSessionMissing('errors');
    }

    public function test_se_limita_el_envio_de_enlaces_de_recuperacion(): void
    {
        Notification::fake();

        $user = User::factory()->create(['email' => 'docente@lorente.edu.pe']);

        foreach (range(1, 5) as $i) {
            $this->post(route('panel.password.email'), [
                'email' => $user->email,
            ])->assertRedirect();
        }

        $this->post(route('panel.password.email'), [
            'email' => $user->email,
        ])->assertStatus(429);
    }

    public function test_se_limita_el_restablecimiento_con_token(): void
    {
        $user = User::factory()->create(['email' => 'docente@lorente.edu.pe']);

        foreach (range(1, 5) as $i) {
            $this->post(route('panel.password.update'), [
                'token' => 'token-invalido',
                'email' => $user->email,
                'password' => 'NuevaContrasena1234',
                'password_confirmation' => 'NuevaContrasena1234',
            ])->assertRedirect();
        }

        $this->post(route('panel.password.update'), [
            'token' => 'token-invalido',
            'email' => $user->email,
            'password' => 'NuevaContrasena1234',
            'password_confirmation' => 'NuevaContrasena1234',
        ])->assertStatus(429);
    }

    public function test_usuario_puede_cambiar_su_contrasena_con_el_token(): void
    {
        $user = User::factory()->create([
            'email' => 'docente@lorente.edu.pe',
            'password' => Hash::make('Anterior1234'),
        ]);

        $token = Password::broker()->createToken($user);

        $response = $this->post(route('panel.password.update'), [
            'token' => $token,
            'email' => $user->email,
            'password' => 'NuevaContrasena1234',
            'password_confirmation' => 'NuevaContrasena1234',
        ]);

        $response->assertRedirect(route('panel.login.show'));
        $response->assertSessionHas('status');

        $user->refresh();
        $this->assertTrue(Hash::check('NuevaContrasena1234', $user->password));
        $this->assertFalse($user->must_change_password);
    }

    public function test_token_invalido_es_rechazado(): void
    {
        $user = User::factory()->create(['email' => 'docente@lorente.edu.pe']);

        $response = $this->post(route('panel.password.update'), [
            'token' => 'token-invalido',
            'email' => $user->email,
            'password' => 'NuevaContrasena1234',
            'password_confirmation' => 'NuevaContrasena1234',
        ]);

        $response->assertSessionHasErrors('email');
        $this->assertFalse(Hash::check('NuevaContrasena1234', $user->fresh()->password));
    }

    public function test_turnstile_es_obligatorio_en_recuperacion_cuando_esta_habilitado(): void
    {
        config([
            'services.turnstile.enabled' => true,
            'services.turnstile.site_key' => '0x4AAAAAAtestkey',
            'services.turnstile.secret_key' => '0x4AAAAAAtestsecret',
        ]);

        $response = $this->post(route('panel.password.email'), [
            'email' => 'docente@lorente.edu.pe',
        ]);

        $response->assertSessionHasErrors('cf-turnstile-response');
    }

    public function test_turnstile_es_obligatorio_en_reset_cuando_esta_habilitado(): void
    {
        config([
            'services.turnstile.enabled' => true,
            'services.turnstile.site_key' => '0x4AAAAAAtestkey',
            'services.turnstile.secret_key' => '0x4AAAAAAtestsecret',
        ]);

        $user = User::factory()->create(['email' => 'docente@lorente.edu.pe']);
        $token = Password::broker()->createToken($user);

        $response = $this->post(route('panel.password.update'), [
            'token' => $token,
            'email' => $user->email,
            'password' => 'NuevaContrasena1234',
            'password_confirmation' => 'NuevaContrasena1234',
        ]);

        $response->assertSessionHasErrors('cf-turnstile-response');
    }
}

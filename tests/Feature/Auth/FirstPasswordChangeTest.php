<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class FirstPasswordChangeTest extends TestCase
{
    use RefreshDatabase;

    public function test_redirige_al_login_si_no_esta_autenticado(): void
    {
        $response = $this->get(route('panel.password.first.show'));

        $response->assertRedirect(route('panel.login.show'));
    }

    public function test_muestra_el_cambio_obligatorio_en_primer_ingreso(): void
    {
        $user = User::factory()->create(['must_change_password' => true]);

        $response = $this->actingAs($user)->get(route('panel.password.first.show'));

        $response->assertOk();
    }

    public function test_redirige_al_panel_si_no_debe_cambiar_contrasena(): void
    {
        $user = User::factory()->create(['must_change_password' => false]);

        $response = $this->actingAs($user)->get(route('panel.password.first.show'));

        $response->assertRedirect(route('panel.index'));
    }

    public function test_actualiza_la_contrasena_y_desbloquea_el_panel(): void
    {
        $user = User::factory()->create(['must_change_password' => true]);

        $response = $this->actingAs($user)->post(route('panel.password.first.update'), [
            'password' => 'MiNuevaContrasena1234',
            'password_confirmation' => 'MiNuevaContrasena1234',
        ]);

        $response->assertRedirect(route('panel.index'));

        $user->refresh();
        $this->assertFalse($user->must_change_password);
        $this->assertTrue(Hash::check('MiNuevaContrasena1234', $user->password));
    }

    public function test_exige_una_contrasena_de_al_menos_8_caracteres(): void
    {
        $user = User::factory()->create(['must_change_password' => true]);

        $response = $this->actingAs($user)->post(route('panel.password.first.update'), [
            'password' => 'corta',
            'password_confirmation' => 'corta',
        ]);

        $response->assertSessionHasErrors('password');
    }
}

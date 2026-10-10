<?php

namespace Tests\Feature\Panel;

use App\Models\Actividad;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class PerfilPanelTest extends TestCase
{
    use RefreshDatabase;

    private function usuario(string $rol = User::ROLE_DOCENTE): User
    {
        return User::factory()->create(['role' => $rol]);
    }

    public function test_muestra_el_perfil_del_usuario_autenticado(): void
    {
        $usuario = $this->usuario(User::ROLE_ADMIN);

        $this->actingAs($usuario)
            ->get('/lorente-panel/perfil')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Panel/Perfil')
                ->where('perfil.email', $usuario->email)
                ->where('perfil.rol', User::ROLE_ADMIN)
                ->where('perfil.rol_etiqueta', 'Administrador'));
    }

    public function test_actualiza_los_datos_personales(): void
    {
        $usuario = $this->usuario(User::ROLE_DOCENTE);

        $this->actingAs($usuario)->post('/lorente-panel/perfil', [
            'name' => '  Juana Pérez  ',
            'email' => 'Juana.Perez@Lorente.edu.pe',
            'cargo' => '  Coordinadora  ',
        ])->assertRedirect();

        $usuario->refresh();
        $this->assertSame('Juana Pérez', $usuario->name);
        $this->assertSame('juana.perez@lorente.edu.pe', $usuario->email);
        $this->assertSame('Coordinadora', $usuario->cargo);

        $this->assertTrue(
            Actividad::query()->where('accion', 'editar')->where('user_id', $usuario->id)->exists(),
        );
    }

    public function test_no_permite_usar_un_correo_de_otra_cuenta(): void
    {
        $otro = $this->usuario();
        $usuario = $this->usuario();

        $this->actingAs($usuario)
            ->post('/lorente-panel/perfil', [
                'name' => $usuario->name,
                'email' => $otro->email,
            ])
            ->assertSessionHasErrors('email');
    }

    public function test_permite_conservar_su_propio_correo(): void
    {
        $usuario = $this->usuario();

        $this->actingAs($usuario)->post('/lorente-panel/perfil', [
            'name' => $usuario->name,
            'email' => $usuario->email,
        ])->assertRedirect()->assertSessionHasNoErrors();
    }

    public function test_cambia_la_contrasena_con_la_actual_correcta(): void
    {
        $usuario = $this->usuario();

        $this->actingAs($usuario)->post('/lorente-panel/perfil/password', [
            'actual' => 'password',
            'password' => 'NuevaClave1234',
            'password_confirmation' => 'NuevaClave1234',
        ])->assertRedirect()->assertSessionHasNoErrors();

        $usuario->refresh();
        $this->assertTrue(Hash::check('NuevaClave1234', $usuario->password));
        $this->assertFalse($usuario->must_change_password);

        $this->assertTrue(
            Actividad::query()->where('accion', 'cambiar contraseña')->where('user_id', $usuario->id)->exists(),
        );
    }

    public function test_rechaza_la_contrasena_actual_incorrecta(): void
    {
        $usuario = $this->usuario();

        $this->actingAs($usuario)->post('/lorente-panel/perfil/password', [
            'actual' => 'incorrecta',
            'password' => 'NuevaClave1234',
            'password_confirmation' => 'NuevaClave1234',
        ])->assertSessionHasErrors('actual');

        $usuario->refresh();
        $this->assertTrue(Hash::check('password', $usuario->password));
    }

    public function test_exige_confirmacion_y_longitud_minima(): void
    {
        $usuario = $this->usuario();

        $this->actingAs($usuario)->post('/lorente-panel/perfil/password', [
            'actual' => 'password',
            'password' => 'corta',
            'password_confirmation' => 'no-coincide',
        ])->assertSessionHasErrors(['password']);
    }

    public function test_guest_es_redirigido_al_login(): void
    {
        $this->get('/lorente-panel/perfil')->assertRedirect('/lorente-panel/login');
    }
}

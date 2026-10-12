<?php

namespace Tests\Feature\Panel;

use App\Models\Actividad;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class CuentasPanelTest extends TestCase
{
    use RefreshDatabase;

    private function usuario(string $rol, array $atributos = []): User
    {
        return User::factory()->create(['role' => $rol, ...$atributos]);
    }

    public function test_super_usuario_ve_todas_las_cuentas(): void
    {
        $super = $this->usuario(User::ROLE_SUPER);
        $this->usuario(User::ROLE_ADMIN);
        $this->usuario(User::ROLE_DOCENTE);

        $this->actingAs($super)
            ->get('/lorente-panel/cuentas')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Panel/Cuentas')
                ->has('cuentas.data', 3)
                ->has('cuentas.links')
                ->has('cuentas.meta')
                ->has('roles_asignables', 2)
                ->where('es_super', true));
    }

    public function test_el_listado_de_cuentas_esta_paginado(): void
    {
        $super = $this->usuario(User::ROLE_SUPER);

        foreach (range(1, 24) as $i) {
            $this->usuario(User::ROLE_DOCENTE, ['email' => "docente{$i}@lorente.edu.pe"]);
        }

        $this->actingAs($super)
            ->get('/lorente-panel/cuentas')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('cuentas.data', 20)
                ->where('cuentas.meta.total', 25)
                ->where('cuentas.meta.ultima', 2));
    }

    public function test_administrador_solo_ve_docentes(): void
    {
        $admin = $this->usuario(User::ROLE_ADMIN);
        $this->usuario(User::ROLE_SUPER);
        $this->usuario(User::ROLE_ADMIN);
        $this->usuario(User::ROLE_DOCENTE);
        $this->usuario(User::ROLE_DOCENTE);

        $this->actingAs($admin)
            ->get('/lorente-panel/cuentas')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Panel/Cuentas')
                ->has('cuentas.data', 2)
                ->has('roles_asignables', 1)
                ->where('roles_asignables.0.valor', User::ROLE_DOCENTE)
                ->where('es_super', false));
    }

    public function test_docente_no_accede_a_cuentas(): void
    {
        $docente = $this->usuario(User::ROLE_DOCENTE);

        $this->actingAs($docente)->get('/lorente-panel/cuentas')->assertForbidden();
        $this->actingAs($docente)->post('/lorente-panel/cuentas', [])->assertForbidden();
    }

    public function test_super_usuario_crea_una_cuenta_de_administrador(): void
    {
        $super = $this->usuario(User::ROLE_SUPER);

        $this->actingAs($super)->post('/lorente-panel/cuentas', [
            'name' => '  Nuevo Admin  ',
            'email' => 'nuevo.admin@lorente.edu.pe',
            'cargo' => 'Subdirector',
            'role' => User::ROLE_ADMIN,
            'password' => 'Temporal1234',
            'password_confirmation' => 'Temporal1234',
        ])->assertRedirect()->assertSessionHasNoErrors();

        $cuenta = User::query()->where('email', 'nuevo.admin@lorente.edu.pe')->firstOrFail();
        $this->assertSame('Nuevo Admin', $cuenta->name);
        $this->assertSame(User::ROLE_ADMIN, $cuenta->role);
        $this->assertTrue($cuenta->must_change_password);
        $this->assertNotNull($cuenta->email_verified_at);
        $this->assertTrue(Hash::check('Temporal1234', $cuenta->password));

        $this->assertTrue(
            Actividad::query()->where('accion', 'crear cuenta')->where('modelo_id', $cuenta->id)->exists(),
        );
    }

    public function test_administrador_crea_solo_docentes(): void
    {
        $admin = $this->usuario(User::ROLE_ADMIN);

        $this->actingAs($admin)->post('/lorente-panel/cuentas', [
            'name' => 'Docente Nuevo',
            'email' => 'docente.nuevo@lorente.edu.pe',
            'role' => User::ROLE_DOCENTE,
            'password' => 'Temporal1234',
            'password_confirmation' => 'Temporal1234',
        ])->assertRedirect()->assertSessionHasNoErrors();

        $this->assertDatabaseHas('users', [
            'email' => 'docente.nuevo@lorente.edu.pe',
            'role' => User::ROLE_DOCENTE,
        ]);
    }

    public function test_administrador_no_puede_crear_administradores(): void
    {
        $admin = $this->usuario(User::ROLE_ADMIN);

        $this->actingAs($admin)->post('/lorente-panel/cuentas', [
            'name' => 'Admin Indebido',
            'email' => 'admin.indebido@lorente.edu.pe',
            'role' => User::ROLE_ADMIN,
            'password' => 'Temporal1234',
            'password_confirmation' => 'Temporal1234',
        ])->assertSessionHasErrors('role');

        $this->assertDatabaseMissing('users', ['email' => 'admin.indebido@lorente.edu.pe']);
    }

    public function test_no_permite_correos_duplicados(): void
    {
        $super = $this->usuario(User::ROLE_SUPER);
        $this->usuario(User::ROLE_DOCENTE, ['email' => 'ocupado@lorente.edu.pe']);

        $this->actingAs($super)->post('/lorente-panel/cuentas', [
            'name' => 'Otro',
            'email' => 'ocupado@lorente.edu.pe',
            'role' => User::ROLE_DOCENTE,
            'password' => 'Temporal1234',
            'password_confirmation' => 'Temporal1234',
        ])->assertSessionHasErrors('email');
    }

    public function test_administrador_restablece_la_contrasena_de_un_docente(): void
    {
        $admin = $this->usuario(User::ROLE_ADMIN);
        $docente = $this->usuario(User::ROLE_DOCENTE, ['must_change_password' => false]);

        $this->actingAs($admin)->post("/lorente-panel/cuentas/{$docente->id}/password", [
            'password' => 'Restablecida1234',
            'password_confirmation' => 'Restablecida1234',
        ])->assertRedirect()->assertSessionHasNoErrors();

        $docente->refresh();
        $this->assertTrue(Hash::check('Restablecida1234', $docente->password));
        $this->assertTrue($docente->must_change_password);
    }

    public function test_administrador_no_puede_restablecer_a_otro_administrador(): void
    {
        $admin = $this->usuario(User::ROLE_ADMIN);
        $otro = $this->usuario(User::ROLE_ADMIN);

        $this->actingAs($admin)->post("/lorente-panel/cuentas/{$otro->id}/password", [
            'password' => 'Restablecida1234',
            'password_confirmation' => 'Restablecida1234',
        ])->assertForbidden();
    }

    public function test_super_usuario_restablece_a_un_administrador(): void
    {
        $super = $this->usuario(User::ROLE_SUPER);
        $admin = $this->usuario(User::ROLE_ADMIN);

        $this->actingAs($super)->post("/lorente-panel/cuentas/{$admin->id}/password", [
            'password' => 'Restablecida1234',
            'password_confirmation' => 'Restablecida1234',
        ])->assertRedirect()->assertSessionHasNoErrors();

        $admin->refresh();
        $this->assertTrue(Hash::check('Restablecida1234', $admin->password));
    }

    public function test_super_usuario_elimina_una_cuenta(): void
    {
        $super = $this->usuario(User::ROLE_SUPER);
        $docente = $this->usuario(User::ROLE_DOCENTE);

        $this->actingAs($super)
            ->post("/lorente-panel/cuentas/{$docente->id}/eliminar")
            ->assertRedirect();

        $this->assertDatabaseMissing('users', ['id' => $docente->id]);
    }

    public function test_super_usuario_no_puede_eliminarse_a_si_mismo(): void
    {
        $super = $this->usuario(User::ROLE_SUPER);

        $this->actingAs($super)
            ->post("/lorente-panel/cuentas/{$super->id}/eliminar")
            ->assertForbidden();

        $this->assertDatabaseHas('users', ['id' => $super->id]);
    }

    public function test_super_usuario_no_puede_eliminar_a_otro_super_usuario(): void
    {
        $super = $this->usuario(User::ROLE_SUPER);
        $otroSuper = $this->usuario(User::ROLE_SUPER);

        $this->actingAs($super)
            ->post("/lorente-panel/cuentas/{$otroSuper->id}/eliminar")
            ->assertForbidden();

        $this->assertDatabaseHas('users', ['id' => $otroSuper->id]);
    }

    public function test_administrador_no_puede_eliminar_cuentas(): void
    {
        $admin = $this->usuario(User::ROLE_ADMIN);
        $docente = $this->usuario(User::ROLE_DOCENTE);

        $this->actingAs($admin)
            ->post("/lorente-panel/cuentas/{$docente->id}/eliminar")
            ->assertForbidden();

        $this->assertDatabaseHas('users', ['id' => $docente->id]);
    }

    public function test_guest_es_redirigido_al_login(): void
    {
        $this->get('/lorente-panel/cuentas')->assertRedirect('/lorente-panel/login');
    }
}

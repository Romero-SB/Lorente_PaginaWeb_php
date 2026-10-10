<?php

namespace Tests\Feature\Panel;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PanelSeccionesTest extends TestCase
{
    use RefreshDatabase;

    private function usuario(string $rol): User
    {
        return User::factory()->create(['role' => $rol]);
    }

    public function test_guest_es_redirigido_al_login_al_entrar_al_panel(): void
    {
        $this->get('/lorente-panel/noticias')->assertRedirect('/lorente-panel/login');
    }

    public function test_docente_accede_a_secciones_permitidas(): void
    {
        $docente = $this->usuario(User::ROLE_DOCENTE);

        $this->actingAs($docente)
            ->get('/lorente-panel')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Panel/Resumen')
                ->has('stats.noticias')
                ->has('stats.documentos')
                ->where('stats.docentes', null));

        $this->actingAs($docente)->get('/lorente-panel/noticias')->assertOk();
        $this->actingAs($docente)->get('/lorente-panel/documentos')->assertOk();
        $this->actingAs($docente)->get('/lorente-panel/perfil')->assertOk();
    }

    public function test_docente_no_accede_a_secciones_de_administracion(): void
    {
        $docente = $this->usuario(User::ROLE_DOCENTE);

        $prohibidas = ['/lorente-panel/docentes', '/lorente-panel/mensajes', '/lorente-panel/cuentas', '/lorente-panel/configuracion'];

        foreach ($prohibidas as $ruta) {
            $this->actingAs($docente)->get($ruta)->assertForbidden();
        }
    }

    public function test_administrador_accede_a_sus_secciones_pero_no_a_cuentas(): void
    {
        $admin = $this->usuario(User::ROLE_ADMIN);

        $this->actingAs($admin)->get('/lorente-panel')->assertOk();
        $this->actingAs($admin)->get('/lorente-panel/noticias')->assertOk();
        $this->actingAs($admin)->get('/lorente-panel/docentes')->assertOk();
        $this->actingAs($admin)->get('/lorente-panel/documentos')->assertOk();
        $this->actingAs($admin)->get('/lorente-panel/mensajes')->assertOk();
        $this->actingAs($admin)->get('/lorente-panel/configuracion')->assertOk();
        $this->actingAs($admin)->get('/lorente-panel/cuentas')->assertForbidden();
    }

    public function test_super_usuario_accede_a_todas_las_secciones(): void
    {
        $super = $this->usuario(User::ROLE_SUPER);

        $permisos = [
            '/lorente-panel',
            '/lorente-panel/noticias',
            '/lorente-panel/docentes',
            '/lorente-panel/documentos',
            '/lorente-panel/mensajes',
            '/lorente-panel/cuentas',
            '/lorente-panel/configuracion',
            '/lorente-panel/perfil',
        ];

        foreach ($permisos as $ruta) {
            $this->actingAs($super)->get($ruta)->assertOk();
        }
    }

    public function test_comparte_las_secciones_del_panel_por_rol(): void
    {
        $docente = $this->usuario(User::ROLE_DOCENTE);

        $response = $this->actingAs($docente)->get('/lorente-panel/noticias');

        $response->assertInertia(fn ($page) => $page
            ->component('Panel/Noticias')
            ->has('panel.rol')
            ->has('panel.rol_etiqueta')
            ->has('panel.secciones', 4)
            ->where('panel.rol', User::ROLE_DOCENTE));
    }

    public function test_usuario_con_password_pendiente_es_forzado_a_cambiarla(): void
    {
        $docente = User::factory()->create([
            'role' => User::ROLE_DOCENTE,
            'must_change_password' => true,
        ]);

        $this->actingAs($docente)
            ->get('/lorente-panel/noticias')
            ->assertRedirect(route('panel.password.first.show'));
    }
}

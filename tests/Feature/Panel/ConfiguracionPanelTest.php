<?php

namespace Tests\Feature\Panel;

use App\Models\Actividad;
use App\Models\Config;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ConfiguracionPanelTest extends TestCase
{
    use RefreshDatabase;

    private function usuario(string $rol): User
    {
        return User::factory()->create(['role' => $rol]);
    }

    public function test_super_usuario_y_administrador_ven_la_configuracion(): void
    {
        foreach ([User::ROLE_SUPER, User::ROLE_ADMIN] as $rol) {
            $this->actingAs($this->usuario($rol))
                ->get('/lorente-panel/configuracion')
                ->assertOk()
                ->assertInertia(fn ($page) => $page
                    ->component('Panel/Configuracion')
                    ->has('config'));
        }
    }

    public function test_docente_no_accede_a_configuracion(): void
    {
        $docente = $this->usuario(User::ROLE_DOCENTE);

        $this->actingAs($docente)->get('/lorente-panel/configuracion')->assertForbidden();
        $this->actingAs($docente)->post('/lorente-panel/configuracion', [])->assertForbidden();
    }

    public function test_actualiza_los_datos_institucionales(): void
    {
        $admin = $this->usuario(User::ROLE_ADMIN);

        $response = $this->actingAs($admin)->post('/lorente-panel/configuracion', [
            'phone' => '(01) 234 5678',
            'email' => 'informes@lorente.edu.pe',
            'direccion' => 'Av. Los Próceres 123',
            'estudiantes' => 850,
            'docentes_count' => 42,
            'anio_fundacion' => 1965,
            'niveles' => 'Inicial, Primaria, Secundaria',
            'mision' => 'Formar estudiantes íntegros.',
            'vision' => 'Ser referentes en la región.',
        ]);

        $response->assertRedirect();

        $config = Config::actual();
        $this->assertSame('(01) 234 5678', $config->phone);
        $this->assertSame('informes@lorente.edu.pe', $config->email);
        $this->assertSame(850, $config->estudiantes);
        $this->assertSame(42, $config->docentes_count);
        $this->assertSame(1965, $config->anio_fundacion);
        $this->assertSame('Inicial, Primaria, Secundaria', $config->niveles);
        $this->assertSame($admin->id, $config->updated_by);

        $this->assertTrue(
            Actividad::query()
                ->where('accion', 'editar')
                ->where('modelo', Config::class)
                ->where('user_id', $admin->id)
                ->exists(),
        );
    }

    public function test_campos_vacios_se_guardan_como_nulos(): void
    {
        $super = $this->usuario(User::ROLE_SUPER);

        $this->actingAs($super)->post('/lorente-panel/configuracion', [
            'phone' => '',
            'email' => '',
            'estudiantes' => '',
            'mision' => '',
        ])->assertRedirect();

        $config = Config::actual();
        $this->assertNull($config->phone);
        $this->assertNull($config->email);
        $this->assertNull($config->estudiantes);
        $this->assertNull($config->mision);
    }

    public function test_valida_el_correo_electronico(): void
    {
        $super = $this->usuario(User::ROLE_SUPER);

        $this->actingAs($super)
            ->post('/lorente-panel/configuracion', ['email' => 'no-es-un-correo'])
            ->assertSessionHasErrors('email');
    }

    public function test_guest_es_redirigido_al_login(): void
    {
        $this->get('/lorente-panel/configuracion')->assertRedirect('/lorente-panel/login');
    }
}

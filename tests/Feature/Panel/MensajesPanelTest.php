<?php

namespace Tests\Feature\Panel;

use App\Models\ContactoMensaje;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MensajesPanelTest extends TestCase
{
    use RefreshDatabase;

    private function usuario(string $rol): User
    {
        return User::factory()->create(['role' => $rol]);
    }

    private function mensaje(array $atributos = []): ContactoMensaje
    {
        return ContactoMensaje::create(array_merge([
            'nombre' => 'Ana Torres',
            'email' => 'ana@example.com',
            'telefono' => '+51 900 000 000',
            'asunto' => 'Consulta general',
            'mensaje' => str_repeat('Mensaje de consulta para la institución.', 2),
            'leido' => false,
            'ip' => '127.0.0.1',
        ], $atributos));
    }

    public function test_docente_no_accede_a_la_bandeja(): void
    {
        $this->actingAs($this->usuario(User::ROLE_DOCENTE))
            ->get('/lorente-panel/mensajes')
            ->assertForbidden();
    }

    public function test_admin_y_super_acceden_a_la_bandeja(): void
    {
        $this->mensaje();

        foreach ([User::ROLE_SUPER, User::ROLE_ADMIN] as $rol) {
            $this->actingAs($this->usuario($rol))
                ->get('/lorente-panel/mensajes')
                ->assertOk()
                ->assertInertia(fn ($page) => $page
                    ->component('Panel/Mensajes')
                    ->has('mensajes', 1)
                    ->has('filtros')
                    ->where('stats.total', 1)
                    ->where('stats.no_leidos', 1));
        }
    }

    public function test_filtra_mensajes_por_estado_y_busqueda(): void
    {
        $noLeido = $this->mensaje(['nombre' => 'Beto Solís']);
        $leido = $this->mensaje(['nombre' => 'Carla Ruiz', 'leido' => true]);

        $admin = $this->usuario(User::ROLE_ADMIN);

        $this->actingAs($admin)
            ->get('/lorente-panel/mensajes?filtro=no-leidos')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('mensajes', 1)
                ->where('mensajes.0.id', $noLeido->id));

        $this->actingAs($admin)
            ->get('/lorente-panel/mensajes?filtro=leidos')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('mensajes', 1)
                ->where('mensajes.0.id', $leido->id));

        $this->actingAs($admin)
            ->get('/lorente-panel/mensajes?q=Carla')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('mensajes', 1)
                ->where('mensajes.0.id', $leido->id));
    }

    public function test_marca_un_mensaje_como_leido_y_no_leido(): void
    {
        $mensaje = $this->mensaje();
        $admin = $this->usuario(User::ROLE_ADMIN);

        $this->actingAs($admin)
            ->post("/lorente-panel/mensajes/{$mensaje->id}/leido")
            ->assertRedirect();
        $this->assertTrue($mensaje->fresh()->leido);

        $this->actingAs($admin)
            ->post("/lorente-panel/mensajes/{$mensaje->id}/leido")
            ->assertRedirect();
        $this->assertFalse($mensaje->fresh()->leido);
    }

    public function test_marca_un_mensaje_como_respondido(): void
    {
        $mensaje = $this->mensaje();
        $admin = $this->usuario(User::ROLE_ADMIN);

        $this->actingAs($admin)
            ->post("/lorente-panel/mensajes/{$mensaje->id}/respondido")
            ->assertRedirect();

        $mensaje->refresh();
        $this->assertNotNull($mensaje->respondido_at);
        $this->assertTrue($mensaje->leido);

        $this->actingAs($admin)
            ->post("/lorente-panel/mensajes/{$mensaje->id}/respondido")
            ->assertRedirect();
        $this->assertNull($mensaje->fresh()->respondido_at);
    }

    public function test_elimina_un_mensaje(): void
    {
        $mensaje = $this->mensaje();
        $admin = $this->usuario(User::ROLE_ADMIN);

        $this->actingAs($admin)
            ->post("/lorente-panel/mensajes/{$mensaje->id}/eliminar")
            ->assertRedirect();

        $this->assertDatabaseMissing('contacto_mensajes', ['id' => $mensaje->id]);
    }

    public function test_docente_no_puede_modificar_mensajes(): void
    {
        $mensaje = $this->mensaje();
        $docente = $this->usuario(User::ROLE_DOCENTE);

        $this->actingAs($docente)
            ->post("/lorente-panel/mensajes/{$mensaje->id}/leido")
            ->assertForbidden();
        $this->actingAs($docente)
            ->post("/lorente-panel/mensajes/{$mensaje->id}/eliminar")
            ->assertForbidden();

        $this->assertFalse($mensaje->fresh()->leido);
    }
}

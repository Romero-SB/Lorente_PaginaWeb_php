<?php

namespace Tests\Feature\Panel;

use App\Models\Actividad;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HistorialEliminarRangoTest extends TestCase
{
    use RefreshDatabase;

    public function test_super_usuario_elimina_solo_el_rango_indicado(): void
    {
        $super = User::factory()->create(['role' => User::ROLE_SUPER]);

        $dentro = Actividad::create(['accion' => 'crear', 'modelo' => 'App\Models\Noticia', 'modelo_id' => 1, 'titulo' => 'Dentro', 'ip' => '127.0.0.1', 'user_agent' => 'x']);
        $fuera = Actividad::create(['accion' => 'crear', 'modelo' => 'App\Models\Noticia', 'modelo_id' => 2, 'titulo' => 'Fuera', 'ip' => '127.0.0.1', 'user_agent' => 'x']);
        $dentro->forceFill(['created_at' => '2026-10-10 12:00:00'])->saveQuietly();
        $fuera->forceFill(['created_at' => '2026-09-01 12:00:00'])->saveQuietly();

        $this->actingAs($super)
            ->post('/lorente-panel/historial/eliminar-rango', ['desde' => '2026-10-01', 'hasta' => '2026-10-31'])
            ->assertSessionHas('ok');

        $this->assertDatabaseMissing('actividad', ['id' => $dentro->id]);
        $this->assertDatabaseHas('actividad', ['id' => $fuera->id]);
    }

    public function test_administrador_no_puede_eliminar_del_historial(): void
    {
        $admin = User::factory()->create(['role' => User::ROLE_ADMIN]);

        $this->actingAs($admin)
            ->post('/lorente-panel/historial/eliminar-rango', ['desde' => '2026-10-01', 'hasta' => '2026-10-31'])
            ->assertForbidden();
    }
}

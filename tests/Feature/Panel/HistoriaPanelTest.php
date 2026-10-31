<?php

namespace Tests\Feature\Panel;

use App\Models\Actividad;
use App\Models\HistoriaHito;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HistoriaPanelTest extends TestCase
{
    use RefreshDatabase;

    private function usuario(string $rol): User
    {
        return User::factory()->create(['role' => $rol]);
    }

    public function test_docente_no_puede_gestionar_la_historia(): void
    {
        $docente = $this->usuario(User::ROLE_DOCENTE);
        $hito = HistoriaHito::query()->firstOrFail();

        $this->actingAs($docente)
            ->post('/lorente-panel/configuracion/historia', [
                'anio' => '2000',
                'titulo' => 'Nuevo',
                'texto' => 'Texto',
            ])
            ->assertForbidden();

        $this->actingAs($docente)
            ->post("/lorente-panel/configuracion/historia/{$hito->id}", [
                'anio' => '2000',
                'titulo' => 'Nuevo',
                'texto' => 'Texto',
            ])
            ->assertForbidden();

        $this->actingAs($docente)
            ->post("/lorente-panel/configuracion/historia/{$hito->id}/eliminar")
            ->assertForbidden();

        $this->actingAs($docente)
            ->post('/lorente-panel/configuracion/historia/reordenar', ['items' => []])
            ->assertForbidden();
    }

    public function test_la_configuracion_incluye_la_historia(): void
    {
        $admin = $this->usuario(User::ROLE_ADMIN);

        $this->actingAs($admin)
            ->get('/lorente-panel/configuracion')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Panel/Configuracion')
                ->has('historia', 6)
                ->has('config.historia_cierre'));
    }

    public function test_administrador_crea_un_hito(): void
    {
        $admin = $this->usuario(User::ROLE_ADMIN);

        $this->actingAs($admin)
            ->post('/lorente-panel/configuracion/historia', [
                'anio' => '2026',
                'titulo' => 'Nueva etapa',
                'texto' => 'La institución inicia una nueva etapa.',
            ])
            ->assertRedirect()
            ->assertSessionHas('ok');

        $this->assertDatabaseHas('historia_hitos', [
            'anio' => '2026',
            'titulo' => 'Nueva etapa',
        ]);

        $this->assertTrue(
            Actividad::query()
                ->where('accion', 'crear')
                ->where('modelo', HistoriaHito::class)
                ->where('user_id', $admin->id)
                ->exists(),
        );
    }

    public function test_valida_los_campos_del_hito(): void
    {
        $admin = $this->usuario(User::ROLE_ADMIN);

        $this->actingAs($admin)
            ->post('/lorente-panel/configuracion/historia', [
                'anio' => '',
                'titulo' => '',
                'texto' => '',
            ])
            ->assertSessionHasErrors(['anio', 'titulo', 'texto']);
    }

    public function test_administrador_edita_un_hito(): void
    {
        $admin = $this->usuario(User::ROLE_ADMIN);
        $hito = HistoriaHito::query()->firstOrFail();

        $this->actingAs($admin)
            ->post("/lorente-panel/configuracion/historia/{$hito->id}", [
                'anio' => '1847',
                'titulo' => 'Título actualizado',
                'texto' => 'Descripción actualizada.',
            ])
            ->assertRedirect();

        $hito->refresh();
        $this->assertSame('1847', $hito->anio);
        $this->assertSame('Título actualizado', $hito->titulo);
    }

    public function test_administrador_elimina_un_hito(): void
    {
        $admin = $this->usuario(User::ROLE_ADMIN);
        $hito = HistoriaHito::query()->firstOrFail();

        $this->actingAs($admin)
            ->post("/lorente-panel/configuracion/historia/{$hito->id}/eliminar")
            ->assertRedirect()
            ->assertSessionHas('ok');

        $this->assertDatabaseMissing('historia_hitos', ['id' => $hito->id]);
    }

    public function test_administrador_reordena_los_hitos(): void
    {
        $admin = $this->usuario(User::ROLE_ADMIN);
        $hitos = HistoriaHito::query()->orderBy('orden')->orderBy('id')->get();

        $invertidos = $hitos->reverse()->values();

        $items = $invertidos->map(fn (HistoriaHito $h, int $i) => [
            'id' => $h->id,
            'orden' => ($i + 1) * 10,
        ])->all();

        $this->actingAs($admin)
            ->post('/lorente-panel/configuracion/historia/reordenar', ['items' => $items])
            ->assertRedirect();

        $this->assertSame(
            $invertidos->pluck('id')->all(),
            HistoriaHito::query()->orderBy('orden')->orderBy('id')->pluck('id')->all(),
        );
    }
}

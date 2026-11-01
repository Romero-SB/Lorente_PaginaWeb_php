<?php

namespace Tests\Feature\Panel;

use App\Models\Actividad;
use App\Models\HistoriaHito;
use App\Models\User;
use App\Support\SitioDatos;
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
            ->post("/lorente-panel/configuracion/historia/{$hito->id}/estilo", ['anio_color' => '#ff0000'])
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
                ->has('config.nosotros_intro')
                ->has('config.nosotros_valores')
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

    public function test_los_hitos_se_ordenan_cronologicamente(): void
    {
        $antiguo = HistoriaHito::create([
            'anio' => '1800',
            'titulo' => 'Antes del origen',
            'texto' => 'Hito creado fuera de orden.',
            'orden' => 999,
        ]);

        $historia = SitioDatos::historia();

        $this->assertSame($antiguo->id, $historia[0]['id']);
        $this->assertSame('1846', $historia[1]['anio']);
    }

    public function test_administrador_personaliza_el_estilo_de_un_hito(): void
    {
        $admin = $this->usuario(User::ROLE_ADMIN);
        $hito = HistoriaHito::query()->firstOrFail();

        $this->actingAs($admin)
            ->post("/lorente-panel/configuracion/historia/{$hito->id}/estilo", [
                'anio_font' => 'lora',
                'anio_color' => '#AA1122',
                'titulo_font' => 'oswald',
                'titulo_color' => '#123456',
                'texto_font' => 'inter',
                'texto_color' => '#654321',
            ])
            ->assertRedirect()
            ->assertSessionHas('ok');

        $hito->refresh();

        $this->assertSame('lora', $hito->estilo['anio_font']);
        $this->assertSame('#aa1122', $hito->estilo['anio_color']);
        $this->assertSame('oswald', $hito->estilo['titulo_font']);
        $this->assertSame('#123456', $hito->estilo['titulo_color']);
        $this->assertSame('inter', $hito->estilo['texto_font']);
        $this->assertSame('#654321', $hito->estilo['texto_color']);
    }
}

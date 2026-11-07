<?php

namespace Tests\Feature\Panel;

use App\Models\Noticia;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ResumenPanelTest extends TestCase
{
    use RefreshDatabase;

    private function noticia(): Noticia
    {
        return Noticia::create([
            'titulo' => 'Noticia para estadísticas',
            'fiso' => now()->toDateString(),
            'fec' => now()->toDateString(),
            'est' => Noticia::EST_PUBLICADO,
        ]);
    }

    public function test_el_panel_expone_el_sitio_y_refleja_los_cambios(): void
    {
        $super = User::factory()->create(['role' => User::ROLE_SUPER]);

        $this->actingAs($super)
            ->get('/lorente-panel')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Panel/Resumen')
                ->has('sitio.config')
                ->has('sitio.noticias'));

        $noticia = $this->noticia();

        $this->actingAs($super)
            ->get('/lorente-panel')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where(
                    'sitio.noticias',
                    fn ($noticias) => collect($noticias)->pluck('id')->contains($noticia->id),
                ));
    }

    public function test_las_estadisticas_se_invalidan_al_crear_contenido(): void
    {
        $super = User::factory()->create(['role' => User::ROLE_SUPER]);

        $this->actingAs($super)
            ->get('/lorente-panel')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Panel/Resumen')
                ->where('stats.noticias', 0));

        $this->noticia();

        $this->actingAs($super)
            ->get('/lorente-panel')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('stats.noticias', 1));
    }
}

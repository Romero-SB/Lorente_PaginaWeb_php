<?php

namespace Tests\Feature\Panel;

use App\Models\Comunicado;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ComunicadosPanelTest extends TestCase
{
    use RefreshDatabase;

    private function usuario(string $rol): User
    {
        return User::factory()->create(['role' => $rol]);
    }

    public function test_solo_se_comparte_con_visitantes_sin_sesion_en_el_inicio(): void
    {
        Comunicado::create(['imagen' => 'comunicados/a.webp', 'activo' => true]);

        $this->get('/')->assertInertia(fn ($page) => $page->where('comunicado.id', Comunicado::first()->id));

        $this->actingAs($this->usuario(User::ROLE_DOCENTE))
            ->get('/')
            ->assertInertia(fn ($page) => $page->where('comunicado', null));
    }

    public function test_no_muestra_comunicados_inactivos_ni_fuera_de_fecha(): void
    {
        Comunicado::create(['imagen' => 'x.webp', 'activo' => false]);
        Comunicado::create(['imagen' => 'y.webp', 'activo' => true, 'inicio_at' => now()->addDay()]);
        Comunicado::create(['imagen' => 'z.webp', 'activo' => true, 'fin_at' => now()->subDay()]);

        $this->assertNull(Comunicado::vigente());
        $this->get('/')->assertInertia(fn ($page) => $page->where('comunicado', null));
    }

    public function test_el_vigente_es_el_mas_reciente(): void
    {
        Comunicado::create(['imagen' => 'viejo.webp', 'activo' => true]);
        $nuevo = Comunicado::create(['imagen' => 'nuevo.webp', 'activo' => true]);

        $this->assertSame($nuevo->id, Comunicado::vigente()->id);
    }

    public function test_admin_publica_un_comunicado_con_imagen(): void
    {
        Storage::fake('public');
        $admin = $this->usuario(User::ROLE_ADMIN);

        $this->actingAs($admin)
            ->post('/lorente-panel/comunicados', [
                'imagen' => UploadedFile::fake()->image('aviso.jpg', 1200, 1600),
                'enlace' => 'https://lorente.edu.pe',
            ])
            ->assertSessionHas('ok');

        $this->assertDatabaseHas('comunicados', ['enlace' => 'https://lorente.edu.pe', 'activo' => true]);
    }

    public function test_rechaza_publicar_sin_imagen_o_con_fechas_invertidas(): void
    {
        Storage::fake('public');
        $admin = $this->usuario(User::ROLE_ADMIN);

        $this->actingAs($admin)->post('/lorente-panel/comunicados', [])
            ->assertSessionHasErrors('imagen');

        $this->actingAs($admin)->post('/lorente-panel/comunicados', [
            'imagen' => UploadedFile::fake()->image('aviso.jpg'),
            'inicio_at' => '2026-12-10 10:00',
            'fin_at' => '2026-12-01 10:00',
        ])->assertSessionHasErrors('fin_at');
    }

    public function test_docente_no_gestiona_comunicados(): void
    {
        $docente = $this->usuario(User::ROLE_DOCENTE);

        $this->actingAs($docente)->get('/lorente-panel/comunicados')->assertForbidden();
        $this->actingAs($docente)->post('/lorente-panel/comunicados', [])->assertForbidden();
    }
}

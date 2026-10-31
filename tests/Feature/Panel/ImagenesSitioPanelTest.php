<?php

namespace Tests\Feature\Panel;

use App\Models\Config;
use App\Models\NosotrosImagen;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ImagenesSitioPanelTest extends TestCase
{
    use RefreshDatabase;

    private function usuario(string $rol): User
    {
        return User::factory()->create(['role' => $rol]);
    }

    public function test_docente_no_puede_gestionar_las_imagenes_del_sitio(): void
    {
        Storage::fake('public');
        $docente = $this->usuario(User::ROLE_DOCENTE);

        $this->actingAs($docente)
            ->post('/lorente-panel/configuracion/hero', [
                'imagen' => UploadedFile::fake()->image('hero.jpg', 1600, 900),
            ])
            ->assertForbidden();

        $this->actingAs($docente)
            ->post('/lorente-panel/configuracion/nosotros-imagenes', [
                'imagen' => UploadedFile::fake()->image('nosotros.jpg', 1200, 800),
            ])
            ->assertForbidden();
    }

    public function test_administrador_sube_la_imagen_principal_del_inicio(): void
    {
        Storage::fake('public');
        $admin = $this->usuario(User::ROLE_ADMIN);

        $this->actingAs($admin)
            ->post('/lorente-panel/configuracion/hero', [
                'imagen' => UploadedFile::fake()->image('hero.jpg', 1600, 900),
            ])
            ->assertRedirect()
            ->assertSessionHas('ok');

        $ruta = Config::actual()->hero_imagen;

        $this->assertNotNull($ruta);
        Storage::disk('public')->assertExists($ruta);

        $this->get('/')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('config.hero_imagen', Storage::disk('public')->url($ruta)));
    }

    public function test_reemplazar_la_imagen_principal_borra_la_anterior(): void
    {
        Storage::fake('public');
        $admin = $this->usuario(User::ROLE_ADMIN);

        $this->actingAs($admin)->post('/lorente-panel/configuracion/hero', [
            'imagen' => UploadedFile::fake()->image('hero-1.jpg', 1600, 900),
        ]);

        $anterior = Config::actual()->hero_imagen;

        $this->actingAs($admin)->post('/lorente-panel/configuracion/hero', [
            'imagen' => UploadedFile::fake()->image('hero-2.jpg', 1600, 900),
        ]);

        $nueva = Config::actual()->hero_imagen;

        $this->assertNotSame($anterior, $nueva);
        Storage::disk('public')->assertMissing($anterior);
        Storage::disk('public')->assertExists($nueva);
    }

    public function test_se_puede_restablecer_la_imagen_principal(): void
    {
        Storage::fake('public');
        $admin = $this->usuario(User::ROLE_ADMIN);

        $this->actingAs($admin)->post('/lorente-panel/configuracion/hero', [
            'imagen' => UploadedFile::fake()->image('hero.jpg', 1600, 900),
        ]);

        $ruta = Config::actual()->hero_imagen;

        $this->actingAs($admin)
            ->post('/lorente-panel/configuracion/hero', ['quitar' => 1])
            ->assertRedirect();

        $this->assertNull(Config::actual()->hero_imagen);
        Storage::disk('public')->assertMissing($ruta);
    }

    public function test_rechaza_archivos_que_no_son_imagenes(): void
    {
        Storage::fake('public');
        $admin = $this->usuario(User::ROLE_ADMIN);

        $this->actingAs($admin)
            ->post('/lorente-panel/configuracion/hero', [
                'imagen' => UploadedFile::fake()->create('virus.exe', 100, 'application/x-msdownload'),
            ])
            ->assertSessionHasErrors('imagen');

        $this->actingAs($admin)
            ->post('/lorente-panel/configuracion/nosotros-imagenes', [
                'imagen' => UploadedFile::fake()->create('virus.exe', 100, 'application/x-msdownload'),
            ])
            ->assertSessionHasErrors('imagen');
    }

    public function test_administrador_agrega_y_elimina_imagenes_de_nosotros(): void
    {
        Storage::fake('public');
        $admin = $this->usuario(User::ROLE_ADMIN);

        $this->actingAs($admin)
            ->post('/lorente-panel/configuracion/nosotros-imagenes', [
                'imagen' => UploadedFile::fake()->image('nosotros.jpg', 1200, 800),
                'alt' => 'Patio principal',
            ])
            ->assertRedirect()
            ->assertSessionHas('ok');

        $imagen = NosotrosImagen::query()->firstOrFail();

        $this->assertSame('Patio principal', $imagen->alt);
        Storage::disk('public')->assertExists($imagen->ruta);

        $this->actingAs($admin)
            ->post("/lorente-panel/configuracion/nosotros-imagenes/{$imagen->id}/eliminar")
            ->assertRedirect()
            ->assertSessionHas('ok');

        $this->assertDatabaseMissing('nosotros_imagenes', ['id' => $imagen->id]);
        Storage::disk('public')->assertMissing($imagen->ruta);
    }

    public function test_no_permite_mas_de_seis_imagenes_en_nosotros(): void
    {
        Storage::fake('public');
        $admin = $this->usuario(User::ROLE_ADMIN);

        foreach (range(1, 6) as $i) {
            NosotrosImagen::create([
                'ruta' => "config/nosotros/{$i}.webp",
                'alt' => "Imagen {$i}",
                'orden' => $i * 10,
            ]);
        }

        $this->actingAs($admin)
            ->post('/lorente-panel/configuracion/nosotros-imagenes', [
                'imagen' => UploadedFile::fake()->image('extra.jpg', 1200, 800),
            ])
            ->assertSessionHasErrors('imagen');

        $this->assertSame(6, NosotrosImagen::query()->count());
    }

    public function test_administrador_reordena_las_imagenes_de_nosotros(): void
    {
        $admin = $this->usuario(User::ROLE_ADMIN);

        $imagenes = collect(range(1, 3))->map(fn (int $i) => NosotrosImagen::create([
            'ruta' => "config/nosotros/{$i}.webp",
            'alt' => "Imagen {$i}",
            'orden' => $i * 10,
        ]));

        $invertidas = $imagenes->reverse()->values();

        $items = $invertidas->map(fn (NosotrosImagen $imagen, int $i) => [
            'id' => $imagen->id,
            'orden' => ($i + 1) * 10,
        ])->all();

        $this->actingAs($admin)
            ->post('/lorente-panel/configuracion/nosotros-imagenes/reordenar', ['items' => $items])
            ->assertRedirect();

        $this->assertSame(
            $invertidas->pluck('id')->all(),
            NosotrosImagen::query()->orderBy('orden')->pluck('id')->all(),
        );
    }

    public function test_la_configuracion_incluye_las_imagenes_del_sitio(): void
    {
        $admin = $this->usuario(User::ROLE_ADMIN);

        NosotrosImagen::create([
            'ruta' => 'config/nosotros/1.webp',
            'alt' => 'Fachada',
            'orden' => 10,
        ]);

        $this->actingAs($admin)
            ->get('/lorente-panel/configuracion')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Panel/Configuracion')
                ->has('nosotros_imagenes', 1)
                ->has('config.hero_imagen'));
    }
}

<?php

namespace Tests\Unit\Actions;

use App\Actions\Noticias\SincronizarImagenes;
use App\Models\Noticia;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class SincronizarImagenesTest extends TestCase
{
    use RefreshDatabase;

    private function noticia(): Noticia
    {
        return Noticia::create([
            'titulo' => 'Noticia con imágenes',
            'fiso' => now()->toDateString(),
            'fec' => now()->toDateString(),
            'cat' => 'Logros',
            'res' => str_repeat('Resumen con extensión suficiente.', 2),
            'con' => str_repeat('Contenido con extensión suficiente para el registro.', 3),
            'est' => Noticia::EST_BORRADOR,
        ]);
    }

    private function fotografia(string $nombre = 'foto.png'): UploadedFile
    {
        return UploadedFile::fake()->image($nombre, 320, 240);
    }

    public function test_guarda_las_imagenes_nuevas_con_orden_y_la_primera_como_portada(): void
    {
        Storage::fake('public');
        $noticia = $this->noticia();

        $plan = array_fill(0, 2, ['tipo' => 'nueva']);

        (new SincronizarImagenes)->ejecutar($noticia, json_encode($plan), [
            $this->fotografia('primera.png'),
            $this->fotografia('segunda.png'),
        ]);

        $imagenes = $noticia->imagenes()->orderBy('orden')->get();

        $this->assertCount(2, $imagenes);
        $this->assertSame([0, 1], $imagenes->pluck('orden')->all());
        $this->assertSame([true, false], $imagenes->pluck('es_portada')->all());

        foreach ($imagenes as $imagen) {
            Storage::disk('public')->assertExists($imagen->ruta);
        }
    }

    public function test_reordena_las_existentes_y_reasigna_la_portada_segun_el_nuevo_orden(): void
    {
        Storage::fake('public');
        $noticia = $this->noticia();

        foreach (['a', 'b', 'c'] as $i => $nombre) {
            $noticia->imagenes()->create(['ruta' => "noticias/img/$nombre.webp", 'es_portada' => $i === 0, 'orden' => $i]);
        }

        $plan = [
            ['id' => 3, 'tipo' => 'existente'],
            ['id' => 1],
            ['id' => 2],
        ];

        (new SincronizarImagenes)->ejecutar($noticia, json_encode($plan), []);

        $imagenes = $noticia->imagenes()->orderBy('orden')->get();

        $this->assertSame([3, 1, 2], $imagenes->pluck('id')->all());
        $this->assertSame([0, 1, 2], $imagenes->pluck('orden')->all());
        $this->assertSame([true, false, false], $imagenes->pluck('es_portada')->all());
    }

    public function test_elimina_las_imagenes_removidas_y_sus_archivos(): void
    {
        Storage::fake('public');
        $noticia = $this->noticia();

        (new SincronizarImagenes)->ejecutar($noticia, json_encode(array_fill(0, 2, ['tipo' => 'nueva'])), [
            $this->fotografia('mantener.png'),
            $this->fotografia('quitar.png'),
        ]);

        $todas = $noticia->imagenes()->orderBy('id')->get();
        $mantener = $todas[0];
        $quitar = $todas[1];

        (new SincronizarImagenes)->ejecutar($noticia, json_encode([['id' => $mantener->id]]), []);

        $this->assertDatabaseMissing('noticia_imagenes', ['id' => $quitar->id]);
        Storage::disk('public')->assertMissing($quitar->ruta);
        Storage::disk('public')->assertExists($mantener->ruta);
    }

    public function test_rechaza_un_plan_con_mas_de_diez_imagenes(): void
    {
        Storage::fake('public');
        $noticia = $this->noticia();

        $archivos = collect(range(1, 11))->map(fn ($n) => $this->fotografia("foto-$n.png"))->all();

        $this->expectException(ValidationException::class);
        (new SincronizarImagenes)->ejecutar($noticia, json_encode(array_fill(0, 11, ['tipo' => 'nueva'])), $archivos);
    }

    public function test_rechaza_que_la_cantidad_de_archivos_no_coincida_con_el_plan(): void
    {
        $noticia = $this->noticia();

        try {
            (new SincronizarImagenes)->ejecutar($noticia, json_encode([['tipo' => 'nueva'], ['tipo' => 'nueva']]), [
                $this->fotografia(),
            ]);
            $this->fail('Debió lanzar una excepción de validación.');
        } catch (ValidationException $e) {
            $this->assertArrayHasKey('imagenes_plan', $e->errors());
        }
    }

    public function test_rechaza_una_imagen_del_plan_que_ya_no_existe(): void
    {
        Storage::fake('public');
        $noticia = $this->noticia();
        $noticia->imagenes()->create(['ruta' => 'noticias/img/a.webp', 'es_portada' => true, 'orden' => 0]);

        try {
            (new SincronizarImagenes)->ejecutar($noticia, json_encode([['id' => 999]]), []);
            $this->fail('Debió lanzar una excepción de validación.');
        } catch (ValidationException $e) {
            $this->assertArrayHasKey('imagenes_plan', $e->errors());
        }
    }

    public function test_rechaza_una_imagen_cuya_extension_no_es_valida(): void
    {
        Storage::fake('public');
        $noticia = $this->noticia();

        try {
            (new SincronizarImagenes)->ejecutar($noticia, json_encode([['tipo' => 'nueva']]), [
                UploadedFile::fake()->create('malo.bin', 100, 'application/octet-stream'),
            ]);
            $this->fail('Debió lanzar una excepción de validación.');
        } catch (ValidationException $e) {
            $this->assertArrayHasKey('imagenes_nuevas', $e->errors());
        }
    }

    public function test_plan_nulo_o_invalido_trata_como_sin_imagenes(): void
    {
        Storage::fake('public');
        $noticia = $this->noticia();
        $imagen = $noticia->imagenes()->create(['ruta' => 'noticias/img/unica.webp', 'es_portada' => true, 'orden' => 0]);
        Storage::disk('public')->put($imagen->ruta, 'contenido');

        (new SincronizarImagenes)->ejecutar($noticia, null, []);
        (new SincronizarImagenes)->ejecutar($noticia, 'no-json', []);

        $this->assertDatabaseCount('noticia_imagenes', 0);
        Storage::disk('public')->assertMissing($imagen->ruta);
    }
}

<?php

namespace Tests\Unit\Actions;

use App\Actions\Noticias\SincronizarAdjuntos;
use App\Models\Noticia;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class SincronizarAdjuntosTest extends TestCase
{
    use RefreshDatabase;

    private function noticia(): Noticia
    {
        return Noticia::create([
            'titulo' => 'Noticia con adjuntos',
            'fiso' => now()->toDateString(),
            'fec' => now()->toDateString(),
            'cat' => 'Logros',
            'res' => str_repeat('Resumen con extensión suficiente.', 2),
            'con' => str_repeat('Contenido con extensión suficiente para el registro.', 3),
            'est' => Noticia::EST_BORRADOR,
        ]);
    }

    private function adjunto(string $nombre, string $mime, int $peso = 200): UploadedFile
    {
        return UploadedFile::fake()->create($nombre, $peso, $mime);
    }

    public function test_guarda_los_adjuntos_nuevos_con_nombre_mime_y_peso(): void
    {
        Storage::fake('public');
        $noticia = $this->noticia();

        (new SincronizarAdjuntos)->ejecutar($noticia, json_encode([['tipo' => 'nueva'], ['tipo' => 'nueva']]), [
            $this->adjunto('plan.pdf', 'application/pdf', 300),
            $this->adjunto('carta.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 400),
        ]);

        $adjuntos = $noticia->adjuntos()->orderBy('orden')->get();

        $this->assertCount(2, $adjuntos);
        $this->assertSame(['plan.pdf', 'carta.docx'], $adjuntos->pluck('nombre')->all());
        $this->assertSame([0, 1], $adjuntos->pluck('orden')->all());
        $this->assertSame(['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'], $adjuntos->pluck('mime')->all());

        foreach ($adjuntos as $adjunto) {
            Storage::disk('public')->assertExists($adjunto->ruta);
        }
    }

    public function test_reordena_los_existentes_y_elimina_los_removidos_con_sus_archivos(): void
    {
        Storage::fake('public');
        $noticia = $this->noticia();

        foreach (['a.pdf', 'b.pdf', 'c.pdf'] as $i => $nombre) {
            Storage::disk('public')->put("noticias/adjuntos/$nombre", 'contenido');
            $noticia->adjuntos()->create([
                'nombre' => $nombre,
                'ruta' => "noticias/adjuntos/$nombre",
                'mime' => 'application/pdf',
                'peso' => 100,
                'orden' => $i,
            ]);
        }

        $plan = [
            ['id' => 3, 'tipo' => 'existente'],
            ['id' => 1],
        ];

        (new SincronizarAdjuntos)->ejecutar($noticia, json_encode($plan), []);

        $adjuntos = $noticia->adjuntos()->orderBy('orden')->get();

        $this->assertSame([3, 1], $adjuntos->pluck('id')->all());
        $this->assertSame([0, 1], $adjuntos->pluck('orden')->all());
        $this->assertDatabaseMissing('adjuntos', ['id' => 2]);
        Storage::disk('public')->assertMissing('noticias/adjuntos/b.pdf');
        Storage::disk('public')->assertExists('noticias/adjuntos/c.pdf');
    }

    public function test_rechaza_que_la_cantidad_de_archivos_no_coincida_con_el_plan(): void
    {
        Storage::fake('public');
        $noticia = $this->noticia();

        try {
            (new SincronizarAdjuntos)->ejecutar($noticia, json_encode([['tipo' => 'nueva']]), []);
            $this->fail('Debió lanzar una excepción de validación.');
        } catch (ValidationException $e) {
            $this->assertArrayHasKey('adjuntos_plan', $e->errors());
        }
    }

    public function test_rechaza_un_adjunto_del_plan_que_ya_no_existe(): void
    {
        Storage::fake('public');
        $noticia = $this->noticia();
        $noticia->adjuntos()->create([
            'nombre' => 'a.pdf',
            'ruta' => 'noticias/adjuntos/a.pdf',
            'mime' => 'application/pdf',
            'peso' => 100,
            'orden' => 0,
        ]);

        try {
            (new SincronizarAdjuntos)->ejecutar($noticia, json_encode([['id' => 999]]), []);
            $this->fail('Debió lanzar una excepción de validación.');
        } catch (ValidationException $e) {
            $this->assertArrayHasKey('adjuntos_plan', $e->errors());
        }
    }

    public function test_rechaza_un_adjunto_con_mime_no_permitido(): void
    {
        Storage::fake('public');
        $noticia = $this->noticia();

        try {
            (new SincronizarAdjuntos)->ejecutar($noticia, json_encode([['tipo' => 'nueva']]), [
                $this->adjunto('virus.exe', 'application/x-msdownload'),
            ]);
            $this->fail('Debió lanzar una excepción de validación.');
        } catch (ValidationException $e) {
            $this->assertArrayHasKey('adjuntos_nuevas', $e->errors());
        }
    }
}

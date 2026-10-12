<?php

namespace Tests\Unit\Support;

use App\Support\Almacenamiento;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AlmacenamientoTest extends TestCase
{
    public function test_guardar_imagen_acepta_los_mimes_permitidos(): void
    {
        Storage::fake('public');

        foreach (['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'image/gif' => 'gif'] as $mime => $extension) {
            $archivo = UploadedFile::fake()->create("imagen.$extension", 100, $mime);

            $ruta = Almacenamiento::guardarImagen($archivo);

            $this->assertNotNull($ruta, "Debe aceptar {$mime}");
            $this->assertStringEndsWith(".{$extension}", $ruta);
            Storage::disk('public')->assertExists($ruta);
        }
    }

    public function test_guardar_imagen_rechaza_un_mime_no_permitido(): void
    {
        Storage::fake('public');

        $ruta = Almacenamiento::guardarImagen(
            UploadedFile::fake()->create('malo.txt', 100, 'text/plain')
        );

        $this->assertNull($ruta);
    }

    public function test_guardar_adjunto_guarda_ruta_mime_y_peso(): void
    {
        Storage::fake('public');

        $archivo = UploadedFile::fake()->create('plan.pdf', 2, 'application/pdf');

        $guardado = Almacenamiento::guardarAdjunto($archivo);

        $this->assertIsArray($guardado);
        $this->assertSame('application/pdf', $guardado['mime']);
        $this->assertSame(2048, $guardado['peso']);
        Storage::disk('public')->assertExists($guardado['ruta']);
    }

    public function test_guardar_adjunto_rechaza_un_mime_no_permitido(): void
    {
        Storage::fake('public');

        $guardado = Almacenamiento::guardarAdjunto(
            UploadedFile::fake()->create('virus.exe', 100, 'application/x-msdownload')
        );

        $this->assertNull($guardado);
    }

    public function test_eliminar_de_borra_si_existe_y_omite_si_no(): void
    {
        Storage::fake('public');

        Storage::disk('public')->put('archivos/existe.txt', 'contenido');

        Almacenamiento::eliminarDe('public', 'archivos/existe.txt');
        Almacenamiento::eliminarDe('public', 'archivos/inexistente.txt');

        Storage::disk('public')->assertMissing('archivos/existe.txt');
    }

    public function test_url_usa_la_url_configurada_del_disco(): void
    {
        config(['filesystems.disks.public.url' => 'https://cdn.ejemplo.com/storage']);

        $this->assertSame(
            'https://cdn.ejemplo.com/storage/noticias/img/foto.webp',
            Almacenamiento::url('noticias/img/foto.webp'),
        );
    }
}

<?php

namespace Tests\Unit;

use App\Support\Almacenamiento;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AlmacenamientoWebpTest extends TestCase
{
    public function test_convierte_jpg_y_png_a_webp_en_el_servidor(): void
    {
        Storage::fake('public');

        $jpg = UploadedFile::fake()->image('foto.jpg', 800, 600);
        $ruta = Almacenamiento::guardarImagen($jpg, 'noticias/img');

        $this->assertStringEndsWith('.webp', $ruta);
        Storage::disk('public')->assertExists($ruta);
        $this->assertStringStartsWith('RIFF', Storage::disk('public')->get($ruta, null) ?? '', 'no es WebP');
    }

    public function test_reduce_imagenes_muy_anchas(): void
    {
        Storage::fake('public');

        $ruta = Almacenamiento::guardarImagen(UploadedFile::fake()->image('ancha.png', 3000, 1000), 'noticias/img');
        $bytes = Storage::disk('public')->get($ruta);
        $imagen = imagecreatefromstring($bytes);

        $this->assertLessThanOrEqual(1600, imagesx($imagen));
    }

    public function test_rechaza_archivos_que_no_son_imagenes(): void
    {
        Storage::fake('public');

        $archivo = UploadedFile::fake()->create('nota.txt', 10, 'text/plain');

        $this->assertNull(Almacenamiento::guardarImagen($archivo, 'noticias/img'));
    }
}
<?php

namespace Tests\Unit\Support;

use App\Models\Documento;
use App\Support\ArchivosDocumentos;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ArchivosDocumentosTest extends TestCase
{
    public function test_extensiones_lista_las_extensiones_permitidas(): void
    {
        $this->assertSame(
            ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'],
            ArchivosDocumentos::extensiones()
        );
    }

    public function test_disco_segun_la_visibilidad(): void
    {
        $this->assertSame('public', ArchivosDocumentos::disco(Documento::VISIBILIDAD_PUBLICO));
        $this->assertSame('local', ArchivosDocumentos::disco(Documento::VISIBILIDAD_PRIVADO));
    }

    public function test_guardar_archivo_en_el_disco_correspondiente(): void
    {
        Storage::fake('public');
        Storage::fake('local');

        $archivo = UploadedFile::fake()->create('nota.pdf', 100, 'application/pdf');

        $privado = ArchivosDocumentos::guardar($archivo, Documento::VISIBILIDAD_PRIVADO);
        $publico = ArchivosDocumentos::guardar($archivo, Documento::VISIBILIDAD_PUBLICO);

        $this->assertIsArray($privado);
        Storage::disk('local')->assertExists($privado['ruta']);
        Storage::disk('public')->assertExists($publico['ruta']);
    }

    public function test_guardar_rechaza_un_mime_no_permitido(): void
    {
        Storage::fake('public');
        Storage::fake('local');

        $guardado = ArchivosDocumentos::guardar(
            UploadedFile::fake()->create('virus.exe', 100, 'application/x-msdownload'),
            Documento::VISIBILIDAD_PUBLICO
        );

        $this->assertNull($guardado);
    }

    public function test_mover_transfiere_el_archivo_entre_discos(): void
    {
        Storage::fake('public');
        Storage::fake('local');
        Storage::disk('public')->put('docs/documento.pdf', 'contenido');

        $ruta = ArchivosDocumentos::mover('docs/documento.pdf', Documento::VISIBILIDAD_PUBLICO, Documento::VISIBILIDAD_PRIVADO);

        $this->assertSame('docs/documento.pdf', $ruta);
        Storage::disk('local')->assertExists($ruta);
        Storage::disk('public')->assertMissing($ruta);
    }

    public function test_mover_es_noop_entre_discos_iguales_o_con_ruta_vacia(): void
    {
        Storage::fake('public');
        Storage::fake('local');
        Storage::disk('public')->put('docs/documento.pdf', 'contenido');

        $misma = ArchivosDocumentos::mover('docs/documento.pdf', Documento::VISIBILIDAD_PUBLICO, Documento::VISIBILIDAD_PUBLICO);
        $vacia = ArchivosDocumentos::mover(null, Documento::VISIBILIDAD_PUBLICO, Documento::VISIBILIDAD_PRIVADO);

        $this->assertSame('docs/documento.pdf', $misma);
        $this->assertNull($vacia);
        Storage::disk('public')->assertExists('docs/documento.pdf');
    }
}

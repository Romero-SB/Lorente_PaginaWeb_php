<?php

namespace Tests\Feature\Sitio;

use App\Models\Config;
use App\Models\Docente;
use App\Models\DocenteCategoria;
use App\Models\Documento;
use App\Models\DocumentoCategoria;
use App\Models\Noticia;
use App\Support\ContenidoSitio;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ContenidoCacheTest extends TestCase
{
    use RefreshDatabase;

    private function noticia(string $titulo = 'Noticia cache'): Noticia
    {
        return Noticia::create([
            'titulo' => $titulo,
            'fiso' => now()->toDateString(),
            'fec' => now()->toDateString(),
            'est' => Noticia::EST_PUBLICADO,
        ]);
    }

    public function test_el_contenido_del_sitio_se_cachea_y_se_invalida_al_guardar(): void
    {
        ContenidoSitio::para();

        DB::table('config')->update(['estudiantes' => 999]);

        $this->assertNotSame(999, ContenidoSitio::para()['config']['estudiantes']);

        Config::actual()->update(['estudiantes' => 999]);

        $this->assertSame(999, ContenidoSitio::para()['config']['estudiantes']);
    }

    public function test_crear_una_noticia_invalida_el_contenido_cacheado(): void
    {
        ContenidoSitio::para();

        $noticia = $this->noticia();

        $ids = collect(ContenidoSitio::para()['noticias'])->pluck('id');

        $this->assertTrue($ids->contains($noticia->id));
    }

    public function test_crear_un_documento_publico_invalida_el_contenido_cacheado(): void
    {
        DocumentoCategoria::create(['nombre' => 'Resoluciones', 'orden' => 10]);

        ContenidoSitio::para();

        $documento = Documento::create([
            'titulo' => 'Documento cache',
            'categoria' => 'Resoluciones',
            'visibilidad' => Documento::VISIBILIDAD_PUBLICO,
            'archivo_url' => 'documentos/cache.pdf',
            'archivo_nombre' => 'cache.pdf',
        ]);

        $ids = collect(ContenidoSitio::para()['documentos'])->pluck('id');

        $this->assertTrue($ids->contains($documento->id));
    }

    public function test_crear_un_docente_invalida_las_categorias_cacheadas(): void
    {
        $categoria = DocenteCategoria::create(['nombre' => 'Primaria', 'orden' => 10]);

        ContenidoSitio::para();

        Docente::create([
            'nombre' => 'Docente cache',
            'cargo' => 'Aula',
            'categoria' => 'Primaria',
            'orden' => 10,
            'activo' => true,
        ]);

        $categorias = ContenidoSitio::para()['categorias_docentes'];

        $this->assertSame($categoria->nombre, $categorias[0]['nombre']);
    }
}

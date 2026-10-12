<?php

namespace Tests\Feature\Sitio;

use App\Mail\ContactoRecibido;
use App\Models\Config;
use App\Models\Documento;
use App\Models\Noticia;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class SitioPublicoTest extends TestCase
{
    use RefreshDatabase;

    private function noticia(string $titulo, string $est = Noticia::EST_PUBLICADO): Noticia
    {
        return Noticia::create([
            'titulo' => $titulo,
            'fiso' => now()->toDateString(),
            'fec' => now()->toDateString(),
            'cat' => 'Logros',
            'res' => str_repeat('Resumen suficientemente largo de la noticia.', 2),
            'con' => str_repeat('Contenido amplio de la noticia para superar la longitud mínima.', 3),
            'est' => $est,
            'aut' => 'IE 31501',
        ]);
    }

    private function documento(string $titulo, string $visibilidad = 'publico', ?string $ruta = null): Documento
    {
        return Documento::create([
            'titulo' => $titulo,
            'categoria' => 'Resoluciones',
            'visibilidad' => $visibilidad,
            'descripcion' => null,
            'archivo_url' => $ruta ?? 'documentos/prueba.pdf',
            'archivo_nombre' => basename($ruta ?? 'prueba.pdf'),
        ]);
    }

    public function test_la_pagina_de_inicio_se_renderiza(): void
    {
        $this->get('/')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Sitio/Inicio')
                ->has('config')
                ->has('docentes')
                ->has('categorias_docentes')
                ->has('noticias')
                ->has('documentos'));
    }

    public function test_la_pagina_de_inicio_muestra_solo_noticias_publicadas(): void
    {
        $publicada = $this->noticia('Noticia visible');
        $this->noticia('Noticia en borrador', Noticia::EST_BORRADOR);

        $this->get('/')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('noticias', 1)
                ->where('noticias.0.id', $publicada->id));
    }

    public function test_el_invitado_no_ve_documentos_privados(): void
    {
        $this->documento('Público', 'publico');
        $this->documento('Privado', 'privado');

        $this->get('/')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('documentos', 1)
                ->where('documentos.0.titulo', 'Público'));
    }

    public function test_el_usuario_autenticado_ve_documentos_privados(): void
    {
        $this->documento('Público', 'publico');
        $this->documento('Privado', 'privado');

        $this->actingAs(User::factory()->create())
            ->get('/')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('documentos', 2));
    }

    public function test_el_listado_de_noticias_solo_incluye_publicadas(): void
    {
        $this->noticia('Primera');
        $this->noticia('Segunda');
        $this->noticia('Borrador', Noticia::EST_BORRADOR);

        $this->get('/noticias')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Sitio/Noticias')
                ->has('noticias.data', 2));
    }

    public function test_el_detalle_de_noticia_publicada_se_muestra_por_slug(): void
    {
        $noticia = $this->noticia('Detalle visible');

        $this->get("/noticias/{$noticia->slug}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Sitio/Noticia')
                ->where('noticia.id', $noticia->id));
    }

    public function test_el_detalle_de_un_borrador_devuelve_404(): void
    {
        $borrador = $this->noticia('Borrador oculto', Noticia::EST_BORRADOR);

        $this->get("/noticias/{$borrador->slug}")->assertNotFound();
    }

    public function test_las_noticias_relacionadas_no_incluyen_la_actual(): void
    {
        $actual = $this->noticia('Principal');
        $this->noticia('Otra noticia');

        $this->get("/noticias/{$actual->slug}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('relacionadas', fn ($list) => collect($list)->pluck('id')->doesntContain($actual->id)));
    }

    public function test_el_formulario_de_contacto_guarda_el_mensaje_y_notifica(): void
    {
        Mail::fake();
        Config::actual()->update(['email' => 'secretaria@lorente.edu.pe']);

        $this->post('/contacto', [
            'nombre' => 'Juan Pérez',
            'email' => 'juan@example.com',
            'telefono' => '+51 999 888 777',
            'asunto' => 'Matrícula',
            'mensaje' => 'Deseo información sobre el proceso de matrícula 2026.',
        ])
            ->assertRedirect()
            ->assertSessionHas('ok');

        $this->assertDatabaseHas('contacto_mensajes', [
            'nombre' => 'Juan Pérez',
            'email' => 'juan@example.com',
            'asunto' => 'Matrícula',
        ]);

        Mail::assertQueued(ContactoRecibido::class, fn ($mail) => $mail->hasTo('secretaria@lorente.edu.pe'));
    }

    public function test_el_formulario_de_contacto_valida_los_datos(): void
    {
        $this->post('/contacto', [
            'nombre' => '',
            'email' => 'no-es-correo',
            'mensaje' => 'corto',
        ])->assertSessionHasErrors(['nombre', 'email', 'mensaje']);

        $this->assertDatabaseCount('contacto_mensajes', 0);
    }

    public function test_la_descarga_de_un_documento_privado_requiere_sesion(): void
    {
        $privado = $this->documento('Privado', 'privado');

        $this->get("/documentos/{$privado->id}/descargar")
            ->assertRedirect('/lorente-panel/login');
    }

    public function test_el_usuario_autenticado_descarga_el_documento_privado(): void
    {
        Storage::fake('local');
        Storage::disk('local')->put('documentos/privado.pdf', 'contenido');

        $privado = $this->documento('Privado', 'privado', 'documentos/privado.pdf');

        $this->actingAs(User::factory()->create())
            ->get("/documentos/{$privado->id}/descargar")
            ->assertOk()
            ->assertDownload('privado.pdf');
    }

    public function test_descargar_un_documento_sin_archivo_devuelve_404(): void
    {
        Storage::fake('local');
        $privado = $this->documento('Privado', 'privado', 'documentos/inexistente.pdf');

        $this->actingAs(User::factory()->create())
            ->get("/documentos/{$privado->id}/descargar")
            ->assertNotFound();
    }
}

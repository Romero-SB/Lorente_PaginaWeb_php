<?php

namespace Tests\Feature\Panel;

use App\Models\Adjunto;
use App\Models\Noticia;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class NoticiasPanelTest extends TestCase
{
    use RefreshDatabase;

    private function usuario(string $rol): User
    {
        return User::factory()->create(['role' => $rol]);
    }

    private function noticia(string $titulo = 'Noticia de prueba', ?User $autor = null): Noticia
    {
        return Noticia::create([
            'titulo' => $titulo,
            'fiso' => now()->toDateString(),
            'fec' => now()->toDateString(),
            'cat' => 'Logros',
            'res' => str_repeat('Resumen suficientemente largo de la noticia.', 2),
            'con' => str_repeat('Contenido amplio de la noticia para superar la longitud mínima requerida.', 3),
            'est' => Noticia::EST_PUBLICADO,
            'author_id' => $autor?->id,
            'aut' => $autor?->name ?? 'Autor de prueba',
        ]);
    }

    private function papeleraDe(User $usuario)
    {
        return $this->actingAs($usuario)->get('/lorente-panel/noticias', [
            'X-Inertia-Partial-Component' => 'Panel/Noticias',
            'X-Inertia-Partial-Data' => 'papelera',
        ]);
    }

    public function test_docente_solo_ve_sus_propias_noticias(): void
    {
        $docente = $this->usuario(User::ROLE_DOCENTE);
        $propia = $this->noticia('Mi noticia', $docente);
        $otra = $this->noticia('Noticia ajena');

        $this->actingAs($docente)
            ->get('/lorente-panel/noticias')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Panel/Noticias')
                ->where('noticias', fn ($list) => collect($list)->pluck('id')->doesntContain($otra->id))
                ->has('noticias', 1)
                ->where('noticias.0.id', $propia->id));
    }

    public function test_administrador_ve_todas_las_noticias(): void
    {
        $admin = $this->usuario(User::ROLE_ADMIN);
        $this->noticia('Primera');
        $this->noticia('Segunda');

        $this->actingAs($admin)
            ->get('/lorente-panel/noticias')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('noticias', 2));
    }

    public function test_docente_crea_noticia_con_imagen_y_adjunto(): void
    {
        Storage::fake('public');
        $docente = $this->usuario(User::ROLE_DOCENTE);

        $imagen = UploadedFile::fake()->image('portada.png', 640, 480);
        $adjunto = UploadedFile::fake()->create('plan.pdf', 200, 'application/pdf');

        $this->actingAs($docente)
            ->post('/lorente-panel/noticias', [
                'titulo' => 'Nueva noticia del colegio',
                'fec' => now()->toDateString(),
                'cat' => 'Evento',
                'res' => str_repeat('Resumen con la extensión mínima requerida.', 2),
                'con' => str_repeat('Contenido con la extensión mínima para poder publicarlo.', 3),
                'est' => Noticia::EST_PUBLICADO,
                'imagenes_plan' => json_encode([['tipo' => 'nueva']]),
                'imagenes_nuevas' => [$imagen],
                'adjuntos_plan' => json_encode([['tipo' => 'nueva']]),
                'adjuntos_nuevas' => [$adjunto],
            ])
            ->assertSessionHasNoErrors()
            ->assertRedirect();

        $noticia = Noticia::firstOrFail();
        $this->assertSame('Nueva noticia del colegio', $noticia->titulo);
        $this->assertSame($docente->id, $noticia->author_id);
        $this->assertSame($docente->name, $noticia->aut);

        $imagenRegistrada = $noticia->imagenes()->firstOrFail();
        $this->assertTrue($imagenRegistrada->es_portada);
        $this->assertSame(0, $imagenRegistrada->orden);
        Storage::disk('public')->assertExists($imagenRegistrada->ruta);

        $adjuntoRegistrado = $noticia->adjuntos()->firstOrFail();
        $this->assertSame('plan.pdf', $adjuntoRegistrado->nombre);
        $this->assertSame('application/pdf', $adjuntoRegistrado->mime);
        Storage::disk('public')->assertExists($adjuntoRegistrado->ruta);
    }

    public function test_rechaza_adjunto_con_mime_no_permitido(): void
    {
        Storage::fake('public');
        $docente = $this->usuario(User::ROLE_DOCENTE);

        $ejecutable = UploadedFile::fake()->create('virus.exe', 100, 'application/x-msdownload');

        $this->actingAs($docente)
            ->post('/lorente-panel/noticias', [
                'titulo' => 'Noticia con adjunto inválido',
                'fec' => now()->toDateString(),
                'est' => Noticia::EST_BORRADOR,
                'adjuntos_plan' => json_encode([['tipo' => 'nueva']]),
                'adjuntos_nuevas' => [$ejecutable],
            ])
            ->assertSessionHasErrors('adjuntos_nuevas.0');

        $this->assertDatabaseMissing('noticias', ['titulo' => 'Noticia con adjunto inválido']);
    }

    public function test_rechaza_mas_de_diez_imagenes(): void
    {
        Storage::fake('public');
        $docente = $this->usuario(User::ROLE_DOCENTE);

        $imagenes = [];
        $plan = [];
        for ($i = 0; $i < 11; $i++) {
            $imagenes[] = UploadedFile::fake()->image("foto-$i.png", 320, 240);
            $plan[] = ['tipo' => 'nueva'];
        }

        $this->actingAs($docente)
            ->post('/lorente-panel/noticias', [
                'titulo' => 'Noticia con demasiadas imágenes',
                'fec' => now()->toDateString(),
                'est' => Noticia::EST_BORRADOR,
                'imagenes_plan' => json_encode($plan),
                'imagenes_nuevas' => $imagenes,
            ])
            ->assertSessionHasErrors('imagenes_nuevas');
    }

    public function test_rechaza_resumen_y_contenido_demasiado_cortos(): void
    {
        $docente = $this->usuario(User::ROLE_DOCENTE);

        $this->actingAs($docente)
            ->post('/lorente-panel/noticias', [
                'titulo' => 'Noticia breve',
                'fec' => now()->toDateString(),
                'est' => Noticia::EST_BORRADOR,
                'res' => 'corto',
                'con' => 'muy corto',
                'imagenes_plan' => json_encode([]),
                'adjuntos_plan' => json_encode([]),
            ])
            ->assertSessionHasErrors(['res', 'con']);
    }

    public function test_docente_no_gestiona_noticia_ajena(): void
    {
        $docente = $this->usuario(User::ROLE_DOCENTE);
        $ajena = $this->noticia('Noticia de otro');

        $this->actingAs($docente)
            ->post("/lorente-panel/noticias/{$ajena->id}", [
                'titulo' => 'Intento de edición',
                'fec' => now()->toDateString(),
                'est' => Noticia::EST_BORRADOR,
            ])
            ->assertForbidden();

        $this->actingAs($docente)
            ->post("/lorente-panel/noticias/{$ajena->id}/eliminar")
            ->assertForbidden();
    }

    public function test_docente_edita_y_marca_version_actualizada(): void
    {
        $docente = $this->usuario(User::ROLE_DOCENTE);
        $noticia = $this->noticia('Título original', $docente);

        $this->actingAs($docente)
            ->post("/lorente-panel/noticias/{$noticia->id}", [
                'titulo' => 'Título actualizado',
                'fec' => now()->toDateString(),
                'cat' => 'Concurso',
                'res' => str_repeat('Resumen editado con la extensión mínima requerida.', 2),
                'con' => str_repeat('Contenido editado con la extensión mínima para publicar.', 3),
                'est' => Noticia::EST_PUBLICADO,
                'imagenes_plan' => json_encode([]),
                'adjuntos_plan' => json_encode([]),
            ])
            ->assertSessionHasNoErrors()
            ->assertRedirect();

        $noticia->refresh();
        $this->assertSame('Título actualizado', $noticia->titulo);
        $this->assertSame($docente->id, $noticia->updated_by);
    }

    public function test_docente_mueve_a_papelera_restaura_y_elimina_permanentemente(): void
    {
        Storage::fake('public');
        $docente = $this->usuario(User::ROLE_DOCENTE);
        $noticia = $this->noticia('Papelera', $docente);
        $imagen = UploadedFile::fake()->image('foto.png', 320, 240);
        $this->actingAs($docente)->post('/lorente-panel/noticias', [
            'titulo' => 'Para borrar',
            'fec' => now()->toDateString(),
            'est' => Noticia::EST_BORRADOR,
            'imagenes_plan' => json_encode([['tipo' => 'nueva']]),
            'imagenes_nuevas' => [$imagen],
        ])->assertSessionHasNoErrors();

        $paraBorrar = Noticia::where('titulo', 'Para borrar')->firstOrFail();
        $rutaImagen = $paraBorrar->imagenes()->firstOrFail()->ruta;

        $this->actingAs($docente)->post("/lorente-panel/noticias/{$paraBorrar->id}/eliminar")->assertRedirect();
        $this->assertNotNull($paraBorrar->fresh()->deleted_at);
        $this->assertSame($docente->id, $paraBorrar->fresh()->deleted_by);

        $this->actingAs($docente)->get('/lorente-panel/noticias')->assertOk();

        $this->actingAs($docente)->post("/lorente-panel/noticias/{$paraBorrar->id}/restaurar")->assertRedirect();
        $paraBorrar->refresh();
        $this->assertNull($paraBorrar->deleted_at);
        $this->assertNull($paraBorrar->deleted_by);

        $this->actingAs($docente)->post("/lorente-panel/noticias/{$paraBorrar->id}/eliminar")->assertRedirect();
        $this->actingAs($docente)->post("/lorente-panel/noticias/{$paraBorrar->id}/permanente")->assertRedirect();

        $this->assertDatabaseMissing('noticias', ['id' => $paraBorrar->id]);
        Storage::disk('public')->assertMissing($rutaImagen);
        $this->assertNotNull($noticia->fresh()->id);
    }

    public function test_la_papelera_es_perezosa_y_muestra_dias_restantes(): void
    {
        $super = $this->usuario(User::ROLE_SUPER);
        $noticia = $this->noticia('En papelera', $super);
        $noticia->delete();

        $this->actingAs($super)->get('/lorente-panel/noticias')
            ->assertInertia(fn ($page) => $page->missing('papelera'));

        $this->actingAs($super)->get('/lorente-panel/noticias', [
            'X-Inertia-Partial-Component' => 'Panel/Noticias',
            'X-Inertia-Partial-Data' => 'papelera',
        ])
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('papelera', 1)
                ->where('papelera.0.titulo', 'En papelera')
                ->where('papelera.0.dias_restantes', 7));
    }

    public function test_papelera_jerarquica_por_autor(): void
    {
        $super = $this->usuario(User::ROLE_SUPER);
        $admin = $this->usuario(User::ROLE_ADMIN);
        $docente = $this->usuario(User::ROLE_DOCENTE);

        $nDocente = $this->noticia('De docente', $docente);
        $nDocente->delete();
        $nAdmin = $this->noticia('De admin', $admin);
        $nAdmin->delete();
        $nSuper = $this->noticia('De super', $super);
        $nSuper->delete();

        $idsDocente = collect($this->papeleraDe($docente)->inertiaProps('papelera'))->pluck('id');
        $this->assertEqualsCanonicalizing([$nDocente->id], $idsDocente->all());

        $idsAdmin = collect($this->papeleraDe($admin)->inertiaProps('papelera'))->pluck('id');
        $this->assertEqualsCanonicalizing([$nDocente->id, $nAdmin->id], $idsAdmin->all());

        $idsSuper = collect($this->papeleraDe($super)->inertiaProps('papelera'))->pluck('id');
        $this->assertEqualsCanonicalizing([$nDocente->id, $nAdmin->id, $nSuper->id], $idsSuper->all());
    }

    public function test_administrador_gestiona_papelera_de_docente_pero_no_de_otros_roles(): void
    {
        $super = $this->usuario(User::ROLE_SUPER);
        $admin = $this->usuario(User::ROLE_ADMIN);
        $docente = $this->usuario(User::ROLE_DOCENTE);

        $deDocente = $this->noticia('De docente', $docente);
        $deDocente->delete();
        $deSuper = $this->noticia('De super', $super);
        $deSuper->delete();

        $this->actingAs($admin)
            ->post("/lorente-panel/noticias/{$deDocente->id}/restaurar")
            ->assertRedirect();
        $this->assertNull($deDocente->fresh()->deleted_at);

        $this->actingAs($admin)
            ->post("/lorente-panel/noticias/{$deSuper->id}/restaurar")
            ->assertForbidden();
        $this->actingAs($admin)
            ->post("/lorente-panel/noticias/{$deSuper->id}/permanente")
            ->assertForbidden();
        $this->assertSoftDeleted('noticias', ['id' => $deSuper->id]);
    }

    public function test_docente_no_gestiona_papelera_ajena(): void
    {
        $admin = $this->usuario(User::ROLE_ADMIN);
        $docente = $this->usuario(User::ROLE_DOCENTE);

        $deAdmin = $this->noticia('De admin', $admin);
        $deAdmin->delete();

        $this->actingAs($docente)
            ->post("/lorente-panel/noticias/{$deAdmin->id}/restaurar")
            ->assertForbidden();
        $this->actingAs($docente)
            ->post("/lorente-panel/noticias/{$deAdmin->id}/permanente")
            ->assertForbidden();
    }

    public function test_la_purga_elimina_noticias_eliminadas_hace_mas_de_7_dias(): void
    {
        Storage::fake('public');
        $docente = $this->usuario(User::ROLE_DOCENTE);
        $vencida = $this->noticia('Vencida', $docente);
        $vencida->delete();
        Noticia::withTrashed()->where('id', $vencida->id)->update(['deleted_at' => now()->subDays(8)]);

        $reciente = $this->noticia('Reciente', $docente);
        $reciente->delete();

        $this->actingAs($docente)->get('/lorente-panel/noticias')->assertOk();

        $this->assertDatabaseMissing('noticias', ['id' => $vencida->id]);
        $this->assertSoftDeleted('noticias', ['id' => $reciente->id]);
    }

    public function test_comando_purgar_papelera_elimina_vencidas_y_archivos(): void
    {
        Storage::fake('public');
        $docente = $this->usuario(User::ROLE_DOCENTE);

        Storage::disk('public')->put('noticias/img/portada.webp', 'contenido');

        $vencida = $this->noticia('Vencida', $docente);
        $vencida->imagenes()->create(['ruta' => 'noticias/img/portada.webp', 'es_portada' => true, 'orden' => 0]);
        $vencida->delete();
        Noticia::withTrashed()->where('id', $vencida->id)->update(['deleted_at' => now()->subDays(8)]);

        $reciente = $this->noticia('Reciente', $docente);
        $reciente->delete();

        $this->artisan('noticias:purgar-papelera')->assertExitCode(0);

        $this->assertDatabaseMissing('noticias', ['id' => $vencida->id]);
        Storage::disk('public')->assertMissing('noticias/img/portada.webp');
        $this->assertSoftDeleted('noticias', ['id' => $reciente->id]);
    }

    public function test_la_actividad_queda_registrada(): void
    {
        $docente = $this->usuario(User::ROLE_DOCENTE);

        $this->actingAs($docente)->post('/lorente-panel/noticias', [
            'titulo' => 'Noticia historiada',
            'fec' => now()->toDateString(),
            'cat' => 'Cultura',
            'res' => str_repeat('Resumen que se registra en el historial.', 2),
            'con' => str_repeat('Contenido que queda registrado en la bitácora.', 3),
            'est' => Noticia::EST_BORRADOR,
            'imagenes_plan' => json_encode([]),
            'adjuntos_plan' => json_encode([]),
        ])->assertRedirect();

        $noticia = Noticia::where('titulo', 'Noticia historiada')->firstOrFail();

        $this->assertDatabaseHas('actividad', [
            'user_id' => $docente->id,
            'accion' => 'crear',
            'modelo' => Noticia::class,
            'modelo_id' => $noticia->id,
        ]);
    }

    public function test_eliminar_de_papelera_elimina_archivos_almacenados(): void
    {
        Storage::fake('public');
        $docente = $this->usuario(User::ROLE_DOCENTE);
        $noticia = $this->noticia('Con adjuntos', $docente);
        $adjunto = UploadedFile::fake()->create('documento.docx', 500, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

        $this->actingAs($docente)->post("/lorente-panel/noticias/{$noticia->id}", [
            'titulo' => 'Con adjuntos',
            'fec' => now()->toDateString(),
            'est' => Noticia::EST_BORRADOR,
            'imagenes_plan' => json_encode([]),
            'adjuntos_plan' => json_encode([['tipo' => 'nueva']]),
            'adjuntos_nuevas' => [$adjunto],
        ])->assertSessionHasNoErrors();

        $ruta = Adjunto::firstOrFail()->ruta;
        Storage::disk('public')->assertExists($ruta);

        $this->actingAs($docente)->post("/lorente-panel/noticias/{$noticia->id}/eliminar")->assertRedirect();
        $this->actingAs($docente)->post("/lorente-panel/noticias/{$noticia->id}/permanente")->assertRedirect();

        Storage::disk('public')->assertMissing($ruta);
        $this->assertDatabaseMissing('adjuntos', ['ruta' => $ruta]);
    }
}

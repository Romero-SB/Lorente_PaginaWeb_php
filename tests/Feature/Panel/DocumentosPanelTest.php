<?php

namespace Tests\Feature\Panel;

use App\Models\Documento;
use App\Models\DocumentoCategoria;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class DocumentosPanelTest extends TestCase
{
    use RefreshDatabase;

    private function usuario(string $rol): User
    {
        return User::factory()->create(['role' => $rol]);
    }

    private function categoria(string $nombre = 'Resoluciones', int $orden = 10): DocumentoCategoria
    {
        return DocumentoCategoria::create(['nombre' => $nombre, 'orden' => $orden]);
    }

    private function documento(
        string $titulo = 'Documento de prueba',
        ?User $autor = null,
        ?string $categoria = null,
        string $visibilidad = Documento::VISIBILIDAD_PUBLICO,
        ?string $ruta = null,
    ): Documento {
        $categoria ??= DocumentoCategoria::firstOrCreate(['nombre' => 'Resoluciones'], ['orden' => 10])->nombre;
        $ruta ??= 'documentos/prueba.pdf';

        return Documento::create([
            'titulo' => $titulo,
            'categoria' => $categoria,
            'visibilidad' => $visibilidad,
            'archivo_url' => $ruta,
            'archivo_nombre' => basename($ruta),
            'author_id' => $autor?->id,
            'created_by' => $autor?->id,
        ]);
    }

    private function aPapelera(Documento $documento, User $usuario): void
    {
        $documento->deleted_by = $usuario->id;
        $documento->save();
        $documento->delete();
    }

    private function papeleraDe(User $usuario)
    {
        return $this->actingAs($usuario)->get('/lorente-panel/documentos', [
            'X-Inertia-Partial-Component' => 'Panel/Documentos',
            'X-Inertia-Partial-Data' => 'papelera',
        ]);
    }

    public function test_cualquier_rol_accede_al_modulo_documentos(): void
    {
        $this->categoria('Resoluciones');

        foreach ([User::ROLE_SUPER, User::ROLE_ADMIN, User::ROLE_DOCENTE] as $rol) {
            $this->actingAs($this->usuario($rol))
                ->get('/lorente-panel/documentos')
                ->assertOk()
                ->assertInertia(fn ($page) => $page
                    ->component('Panel/Documentos')
                    ->has('documentos')
                    ->has('categorias', 1)
                    ->has('visibilidades', 2)
                    ->missing('papelera'));
        }
    }

    public function test_docente_solo_ve_sus_propios_documentos_y_admin_ve_todos(): void
    {
        $docente = $this->usuario(User::ROLE_DOCENTE);
        $propio = $this->documento('Propio', $docente);
        $ajeno = $this->documento('Ajeno', $this->usuario(User::ROLE_ADMIN));

        $this->actingAs($docente)
            ->get('/lorente-panel/documentos')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('documentos', 1)
                ->where('documentos.0.id', $propio->id)
                ->where('documentos.0.puede_editar', true));

        $this->actingAs($this->usuario(User::ROLE_ADMIN))
            ->get('/lorente-panel/documentos')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('documentos', 2));
    }

    public function test_crea_documento_publico_en_el_disco_publico(): void
    {
        Storage::fake('public');
        Storage::fake('local');
        $docente = $this->usuario(User::ROLE_DOCENTE);
        $this->categoria('Resoluciones');

        $archivo = UploadedFile::fake()->create('acta.pdf', 200, 'application/pdf');

        $this->actingAs($docente)
            ->post('/lorente-panel/documentos', [
                'titulo' => 'Acta de reunión',
                'categoria' => 'Resoluciones',
                'visibilidad' => Documento::VISIBILIDAD_PUBLICO,
                'descripcion' => 'Acta del mes.',
                'archivo' => $archivo,
            ])
            ->assertSessionHasNoErrors()
            ->assertRedirect();

        $documento = Documento::where('titulo', 'Acta de reunión')->firstOrFail();
        $this->assertSame($docente->id, $documento->author_id);
        $this->assertSame($docente->id, $documento->created_by);
        $this->assertSame('acta.pdf', $documento->archivo_nombre);
        $this->assertFalse($documento->esPrivado());
        Storage::disk('public')->assertExists($documento->archivo_url);
        Storage::disk('local')->assertMissing($documento->archivo_url);

        $this->assertDatabaseHas('actividad', [
            'user_id' => $docente->id,
            'accion' => 'crear',
            'modelo' => Documento::class,
            'modelo_id' => $documento->id,
        ]);
    }

    public function test_crea_documento_privado_en_el_disco_privado(): void
    {
        Storage::fake('public');
        Storage::fake('local');
        $docente = $this->usuario(User::ROLE_DOCENTE);
        $this->categoria('Resoluciones');

        $archivo = UploadedFile::fake()->create('privado.docx', 300, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

        $this->actingAs($docente)
            ->post('/lorente-panel/documentos', [
                'titulo' => 'Expediente reservado',
                'categoria' => 'Resoluciones',
                'visibilidad' => Documento::VISIBILIDAD_PRIVADO,
                'archivo' => $archivo,
            ])
            ->assertSessionHasNoErrors();

        $documento = Documento::where('titulo', 'Expediente reservado')->firstOrFail();
        $this->assertTrue($documento->esPrivado());
        Storage::disk('local')->assertExists($documento->archivo_url);
        Storage::disk('public')->assertMissing($documento->archivo_url);
    }

    public function test_rechaza_archivo_con_mime_no_permitido(): void
    {
        Storage::fake('public');
        $docente = $this->usuario(User::ROLE_DOCENTE);
        $this->categoria('Resoluciones');

        $ejecutable = UploadedFile::fake()->create('virus.exe', 100, 'application/x-msdownload');

        $this->actingAs($docente)
            ->post('/lorente-panel/documentos', [
                'titulo' => 'Documento inválido',
                'categoria' => 'Resoluciones',
                'visibilidad' => Documento::VISIBILIDAD_PUBLICO,
                'archivo' => $ejecutable,
            ])
            ->assertSessionHasErrors('archivo');

        $this->assertDatabaseMissing('documentos', ['titulo' => 'Documento inválido']);
    }

    public function test_rechaza_creacion_sin_archivo_o_con_categoria_inexistente(): void
    {
        Storage::fake('public');
        $docente = $this->usuario(User::ROLE_DOCENTE);

        $this->actingAs($docente)
            ->post('/lorente-panel/documentos', [
                'titulo' => 'Sin archivo',
                'categoria' => 'NoExiste',
                'visibilidad' => Documento::VISIBILIDAD_PUBLICO,
            ])
            ->assertSessionHasErrors(['archivo', 'categoria']);

        $this->assertDatabaseMissing('documentos', ['titulo' => 'Sin archivo']);
    }

    public function test_edita_documento_y_reemplaza_el_archivo(): void
    {
        Storage::fake('public');
        Storage::fake('local');
        $admin = $this->usuario(User::ROLE_ADMIN);
        $this->categoria('Resoluciones');
        $this->categoria('Comunicados', 20);

        Storage::disk('public')->put('documentos/antiguo.pdf', 'viejo');
        $documento = $this->documento('Original', $admin, 'Resoluciones', Documento::VISIBILIDAD_PUBLICO, 'documentos/antiguo.pdf');

        $nuevo = UploadedFile::fake()->create('nuevo.xlsx', 400, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        $this->actingAs($admin)
            ->post("/lorente-panel/documentos/{$documento->id}", [
                'titulo' => 'Actualizado',
                'categoria' => 'Comunicados',
                'visibilidad' => Documento::VISIBILIDAD_PUBLICO,
                'archivo' => $nuevo,
            ])
            ->assertSessionHasNoErrors();

        $documento->refresh();
        $this->assertSame('Actualizado', $documento->titulo);
        $this->assertSame('Comunicados', $documento->categoria);
        $this->assertSame('nuevo.xlsx', $documento->archivo_nombre);
        Storage::disk('public')->assertMissing('documentos/antiguo.pdf');
        Storage::disk('public')->assertExists($documento->archivo_url);
    }

    public function test_cambiar_visibilidad_mueve_el_archivo_entre_discos(): void
    {
        Storage::fake('public');
        Storage::fake('local');
        $admin = $this->usuario(User::ROLE_ADMIN);
        $this->categoria('Resoluciones');

        Storage::disk('public')->put('documentos/mover.pdf', 'contenido');
        $documento = $this->documento('A mover', $admin, 'Resoluciones', Documento::VISIBILIDAD_PUBLICO, 'documentos/mover.pdf');

        $this->actingAs($admin)
            ->post("/lorente-panel/documentos/{$documento->id}", [
                'titulo' => 'A mover',
                'categoria' => 'Resoluciones',
                'visibilidad' => Documento::VISIBILIDAD_PRIVADO,
            ])
            ->assertSessionHasNoErrors();

        $documento->refresh();
        $this->assertTrue($documento->esPrivado());
        Storage::disk('local')->assertExists('documentos/mover.pdf');
        Storage::disk('public')->assertMissing('documentos/mover.pdf');
    }

    public function test_docente_no_gestiona_documento_ajeno(): void
    {
        Storage::fake('public');
        $docente = $this->usuario(User::ROLE_DOCENTE);
        $otro = $this->usuario(User::ROLE_ADMIN);
        $this->categoria('Resoluciones');
        $documento = $this->documento('Ajeno', $otro, 'Resoluciones', Documento::VISIBILIDAD_PUBLICO, 'documentos/ajeno.pdf');

        $this->actingAs($docente)
            ->post("/lorente-panel/documentos/{$documento->id}", [
                'titulo' => 'Hackeado',
                'categoria' => 'Resoluciones',
                'visibilidad' => Documento::VISIBILIDAD_PUBLICO,
            ])
            ->assertForbidden();

        $this->actingAs($docente)
            ->post("/lorente-panel/documentos/{$documento->id}/eliminar")
            ->assertForbidden();

        $this->assertSame('Ajeno', $documento->fresh()->titulo);
        $this->assertNull($documento->fresh()->deleted_at);
    }

    public function test_mueve_a_papelera_restaura_y_elimina_permanentemente(): void
    {
        Storage::fake('public');
        $super = $this->usuario(User::ROLE_SUPER);
        $this->categoria('Resoluciones');

        Storage::disk('public')->put('documentos/permanente.pdf', 'x');
        $documento = $this->documento('Para borrar', $super, 'Resoluciones', Documento::VISIBILIDAD_PUBLICO, 'documentos/permanente.pdf');

        $this->actingAs($super)->post("/lorente-panel/documentos/{$documento->id}/eliminar")->assertRedirect();
        $this->assertNotNull($documento->fresh()->deleted_at);
        $this->assertSame($super->id, $documento->fresh()->deleted_by);

        $this->actingAs($super)->post("/lorente-panel/documentos/{$documento->id}/restaurar")->assertRedirect();
        $documento->refresh();
        $this->assertNull($documento->deleted_at);
        $this->assertNull($documento->deleted_by);

        $this->actingAs($super)->post("/lorente-panel/documentos/{$documento->id}/eliminar")->assertRedirect();
        $this->actingAs($super)->post("/lorente-panel/documentos/{$documento->id}/permanente")->assertRedirect();

        $this->assertDatabaseMissing('documentos', ['id' => $documento->id]);
        Storage::disk('public')->assertMissing('documentos/permanente.pdf');
    }

    public function test_solo_el_super_elimina_permanentemente(): void
    {
        $admin = $this->usuario(User::ROLE_ADMIN);
        $documento = $this->documento('No borrable', $admin);
        $this->aPapelera($documento, $admin);

        $this->actingAs($admin)
            ->post("/lorente-panel/documentos/{$documento->id}/permanente")
            ->assertForbidden();

        $this->assertSoftDeleted('documentos', ['id' => $documento->id]);
    }

    public function test_papelera_es_propia_para_docente_y_de_docentes_para_admin_y_total_para_super(): void
    {
        $super = $this->usuario(User::ROLE_SUPER);
        $admin = $this->usuario(User::ROLE_ADMIN);
        $docente = $this->usuario(User::ROLE_DOCENTE);

        $deDocente = $this->documento('De docente', $docente);
        $this->aPapelera($deDocente, $docente);
        $deAdmin = $this->documento('De admin', $admin);
        $this->aPapelera($deAdmin, $admin);
        $deSuper = $this->documento('De super', $super);
        $this->aPapelera($deSuper, $super);

        $idsDocente = collect($this->papeleraDe($docente)->inertiaProps('papelera'))->pluck('id');
        $this->assertEqualsCanonicalizing([$deDocente->id], $idsDocente->all());

        $idsAdmin = collect($this->papeleraDe($admin)->inertiaProps('papelera'))->pluck('id');
        $this->assertEqualsCanonicalizing([$deDocente->id, $deAdmin->id], $idsAdmin->all());

        $idsSuper = collect($this->papeleraDe($super)->inertiaProps('papelera'))->pluck('id');
        $this->assertEqualsCanonicalizing([$deDocente->id, $deAdmin->id, $deSuper->id], $idsSuper->all());
    }

    public function test_administrador_gestiona_papelera_de_docente_pero_no_de_otros_roles(): void
    {
        $super = $this->usuario(User::ROLE_SUPER);
        $admin = $this->usuario(User::ROLE_ADMIN);
        $docente = $this->usuario(User::ROLE_DOCENTE);

        $deDocente = $this->documento('De docente', $docente);
        $this->aPapelera($deDocente, $docente);
        $deSuper = $this->documento('De super', $super);
        $this->aPapelera($deSuper, $super);

        $this->actingAs($admin)
            ->post("/lorente-panel/documentos/{$deDocente->id}/restaurar")
            ->assertRedirect();
        $this->assertNull($deDocente->fresh()->deleted_at);

        $this->actingAs($admin)
            ->post("/lorente-panel/documentos/{$deSuper->id}/restaurar")
            ->assertForbidden();
        $this->actingAs($admin)
            ->post("/lorente-panel/documentos/{$deSuper->id}/permanente")
            ->assertForbidden();
        $this->assertSoftDeleted('documentos', ['id' => $deSuper->id]);
    }

    public function test_docente_restaura_su_documento_pero_no_el_de_otro(): void
    {
        $docente = $this->usuario(User::ROLE_DOCENTE);
        $otro = $this->usuario(User::ROLE_ADMIN);

        $propio = $this->documento('Propio', $docente);
        $this->aPapelera($propio, $docente);
        $ajeno = $this->documento('Ajeno', $otro);
        $this->aPapelera($ajeno, $otro);

        $this->actingAs($docente)
            ->post("/lorente-panel/documentos/{$propio->id}/restaurar")
            ->assertRedirect();
        $this->assertNull($propio->fresh()->deleted_at);

        $this->actingAs($docente)
            ->post("/lorente-panel/documentos/{$ajeno->id}/restaurar")
            ->assertForbidden();
        $this->assertSoftDeleted('documentos', ['id' => $ajeno->id]);
    }

    public function test_papelera_es_perezosa_y_muestra_dias_restantes(): void
    {
        $super = $this->usuario(User::ROLE_SUPER);
        $documento = $this->documento('En papelera', $super);
        $documento->delete();

        $this->actingAs($super)->get('/lorente-panel/documentos')
            ->assertInertia(fn ($page) => $page->missing('papelera'));

        $this->actingAs($super)->get('/lorente-panel/documentos', [
            'X-Inertia-Partial-Component' => 'Panel/Documentos',
            'X-Inertia-Partial-Data' => 'papelera',
        ])
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('papelera', 1)
                ->where('papelera.0.titulo', 'En papelera')
                ->where('papelera.0.dias_restantes', 7)
                ->where('papelera.0.puede_restaurar', true));
    }

    public function test_purga_elimina_documentos_vencidos_y_sus_archivos(): void
    {
        Storage::fake('public');
        $super = $this->usuario(User::ROLE_SUPER);

        Storage::disk('public')->put('documentos/vencida.pdf', 'x');
        $vencida = $this->documento('Vencida', $super, null, Documento::VISIBILIDAD_PUBLICO, 'documentos/vencida.pdf');
        $vencida->delete();
        Documento::withTrashed()->where('id', $vencida->id)->update(['deleted_at' => now()->subDays(8)]);

        $reciente = $this->documento('Reciente', $super);
        $reciente->delete();

        $this->artisan('documentos:purgar-papelera')->assertExitCode(0);

        $this->assertDatabaseMissing('documentos', ['id' => $vencida->id]);
        Storage::disk('public')->assertMissing('documentos/vencida.pdf');
        $this->assertSoftDeleted('documentos', ['id' => $reciente->id]);
    }

    public function test_descarga_documento_privado_requiere_sesion(): void
    {
        Storage::fake('local');
        $docente = $this->usuario(User::ROLE_DOCENTE);
        Storage::disk('local')->put('documentos/privado.pdf', 'contenido privado');
        $documento = $this->documento('Privado', $docente, null, Documento::VISIBILIDAD_PRIVADO, 'documentos/privado.pdf');

        $this->get("/lorente-panel/documentos/{$documento->id}/descargar")
            ->assertRedirect('/lorente-panel/login');

        $this->actingAs($docente)
            ->get("/lorente-panel/documentos/{$documento->id}/descargar")
            ->assertOk()
            ->assertDownload('privado.pdf');
    }

    public function test_url_del_documento_depende_de_la_visibilidad(): void
    {
        Storage::fake('public');
        $admin = $this->usuario(User::ROLE_ADMIN);

        $publico = $this->documento('Público', $admin, null, Documento::VISIBILIDAD_PUBLICO, 'documentos/publico.pdf');
        $privado = $this->documento('Privado', $admin, null, Documento::VISIBILIDAD_PRIVADO, 'documentos/privado.pdf');

        $this->actingAs($admin)
            ->get('/lorente-panel/documentos')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('documentos', function ($list) use ($privado, $publico) {
                    $urls = collect($list)->keyBy('id')->map(fn ($d) => $d['archivo']['url']);

                    return ! str_contains($urls[$publico->id], 'descargar')
                        && str_contains($urls[$privado->id], 'descargar');
                }));
    }

    public function test_categorias_crear_renombrar_reordenar_y_bloqueo(): void
    {
        $admin = $this->usuario(User::ROLE_ADMIN);
        $this->categoria('Resoluciones', 10);

        $this->actingAs($admin)
            ->post('/lorente-panel/documento-categorias', ['nombre' => 'Comunicados'])
            ->assertSessionHasNoErrors();

        $nueva = DocumentoCategoria::where('nombre', 'Comunicados')->firstOrFail();
        $this->assertSame(20, $nueva->orden);

        $documento = $this->documento('Doc X', $admin, 'Comunicados');

        $this->actingAs($admin)
            ->post("/lorente-panel/documento-categorias/{$nueva->id}", ['nombre' => 'Avisos'])
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas('documento_categorias', ['nombre' => 'Avisos']);
        $this->assertDatabaseMissing('documento_categorias', ['nombre' => 'Comunicados']);
        $this->assertSame('Avisos', $documento->fresh()->categoria);

        $this->actingAs($admin)
            ->post('/lorente-panel/documento-categorias/reordenar', ['categorias' => ['Avisos', 'Resoluciones']])
            ->assertRedirect();

        $this->assertSame(10, DocumentoCategoria::where('nombre', 'Avisos')->firstOrFail()->orden);
        $this->assertSame(20, DocumentoCategoria::where('nombre', 'Resoluciones')->firstOrFail()->orden);

        $this->actingAs($admin)
            ->post("/lorente-panel/documento-categorias/{$nueva->id}/eliminar")
            ->assertSessionHasErrors('categoria');

        $this->assertDatabaseHas('documento_categorias', ['id' => $nueva->id]);
    }

    public function test_docente_no_gestiona_categorias_de_documentos(): void
    {
        $docente = $this->usuario(User::ROLE_DOCENTE);

        $this->actingAs($docente)
            ->post('/lorente-panel/documento-categorias', ['nombre' => 'Prohibida'])
            ->assertForbidden();

        $this->assertDatabaseMissing('documento_categorias', ['nombre' => 'Prohibida']);
    }

    public function test_elimina_categoria_vacia(): void
    {
        $admin = $this->usuario(User::ROLE_ADMIN);
        $vacia = $this->categoria('Vacía', 10);

        $this->actingAs($admin)
            ->post("/lorente-panel/documento-categorias/{$vacia->id}/eliminar")
            ->assertSessionHasNoErrors();

        $this->assertDatabaseMissing('documento_categorias', ['id' => $vacia->id]);
    }
}

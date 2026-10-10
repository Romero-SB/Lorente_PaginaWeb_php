<?php

namespace Tests\Feature\Panel;

use App\Models\Docente;
use App\Models\DocenteCategoria;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class DocentesPanelTest extends TestCase
{
    use RefreshDatabase;

    private function usuario(string $rol): User
    {
        return User::factory()->create(['role' => $rol]);
    }

    private function categoria(string $nombre = 'Primaria', int $orden = 10): DocenteCategoria
    {
        return DocenteCategoria::create(['nombre' => $nombre, 'orden' => $orden]);
    }

    private function docente(string $nombre = 'Docente de prueba', ?User $creador = null, ?string $categoria = null): Docente
    {
        $categoria ??= DocenteCategoria::firstOrCreate(['nombre' => 'Primaria'], ['orden' => 10])->nombre;

        return Docente::create([
            'nombre' => $nombre,
            'cargo' => 'Docente de aula',
            'foto' => null,
            'categoria' => $categoria,
            'orden' => 10,
            'activo' => true,
            'created_by' => $creador?->id,
        ]);
    }

    private function aPapelera(Docente $docente, User $usuario): void
    {
        $docente->deleted_by = $usuario->id;
        $docente->save();
        $docente->delete();
    }

    private function papeleraDe(User $usuario)
    {
        return $this->actingAs($usuario)->get('/lorente-panel/docentes', [
            'X-Inertia-Partial-Component' => 'Panel/Docentes',
            'X-Inertia-Partial-Data' => 'papelera',
        ]);
    }

    public function test_docente_no_puede_acceder_al_modulo_docentes(): void
    {
        $docente = $this->usuario(User::ROLE_DOCENTE);

        $this->actingAs($docente)->get('/lorente-panel/docentes')->assertForbidden();
        $this->actingAs($docente)
            ->post('/lorente-panel/docentes', ['nombre' => 'X', 'cargo' => 'Y'])
            ->assertForbidden();
    }

    public function test_administrador_y_super_ven_los_docentes_y_categorias(): void
    {
        $this->categoria('Secundaria');
        $this->docente('Uno');
        $this->docente('Dos', null, 'Secundaria');

        foreach ([User::ROLE_ADMIN, User::ROLE_SUPER] as $rol) {
            $this->actingAs($this->usuario($rol))
                ->get('/lorente-panel/docentes')
                ->assertOk()
                ->assertInertia(fn ($page) => $page
                    ->component('Panel/Docentes')
                    ->has('docentes', 2)
                    ->has('categorias', 2));
        }
    }

    public function test_crea_docente_con_foto_y_lo_ordena_al_final_de_la_categoria(): void
    {
        Storage::fake('public');
        $admin = $this->usuario(User::ROLE_ADMIN);
        $this->categoria('Primaria');
        $this->docente('Existente', $admin, 'Primaria');

        $foto = UploadedFile::fake()->image('foto.jpg', 400, 500);

        $this->actingAs($admin)
            ->post('/lorente-panel/docentes', [
                'nombre' => 'Nuevo Docente',
                'cargo' => 'Matemática',
                'categoria' => 'Primaria',
                'foto' => $foto,
            ])
            ->assertSessionHasNoErrors()
            ->assertRedirect();

        $docente = Docente::where('nombre', 'Nuevo Docente')->firstOrFail();
        $this->assertSame($admin->id, $docente->created_by);
        $this->assertSame(20, $docente->orden);
        $this->assertTrue($docente->activo);
        Storage::disk('public')->assertExists($docente->foto);

        $this->assertDatabaseHas('actividad', [
            'user_id' => $admin->id,
            'accion' => 'crear',
            'modelo' => Docente::class,
            'modelo_id' => $docente->id,
        ]);
    }

    public function test_rechaza_creacion_sin_foto_o_con_categoria_inexistente(): void
    {
        Storage::fake('public');
        $admin = $this->usuario(User::ROLE_ADMIN);

        $this->actingAs($admin)
            ->post('/lorente-panel/docentes', [
                'nombre' => 'Sin foto',
                'cargo' => 'Aula',
                'categoria' => 'NoExiste',
            ])
            ->assertSessionHasErrors(['foto', 'categoria']);

        $this->assertDatabaseMissing('docentes', ['nombre' => 'Sin foto']);
    }

    public function test_edita_docente_y_reemplaza_la_foto(): void
    {
        Storage::fake('public');
        $admin = $this->usuario(User::ROLE_ADMIN);
        $this->categoria('Primaria');
        $this->categoria('Secundaria', 20);

        Storage::disk('public')->put('docentes/antigua.webp', 'viejo');
        $docente = $this->docente('Original', $admin, 'Primaria');
        $docente->update(['foto' => 'docentes/antigua.webp']);

        $nueva = UploadedFile::fake()->image('nueva.png', 400, 500);

        $this->actingAs($admin)
            ->post("/lorente-panel/docentes/{$docente->id}", [
                'nombre' => 'Actualizado',
                'cargo' => 'Comunicación',
                'categoria' => 'Secundaria',
                'foto' => $nueva,
            ])
            ->assertSessionHasNoErrors()
            ->assertRedirect();

        $docente->refresh();
        $this->assertSame('Actualizado', $docente->nombre);
        $this->assertSame('Secundaria', $docente->categoria);
        Storage::disk('public')->assertMissing('docentes/antigua.webp');
        Storage::disk('public')->assertExists($docente->foto);
    }

    public function test_puede_quitar_la_foto_al_editar(): void
    {
        Storage::fake('public');
        $admin = $this->usuario(User::ROLE_ADMIN);
        $this->categoria('Primaria');

        Storage::disk('public')->put('docentes/foto.webp', 'x');
        $docente = $this->docente('Con foto', $admin, 'Primaria');
        $docente->update(['foto' => 'docentes/foto.webp']);

        $this->actingAs($admin)
            ->post("/lorente-panel/docentes/{$docente->id}", [
                'nombre' => 'Con foto',
                'cargo' => 'Aula',
                'categoria' => 'Primaria',
                'foto_borrar' => 1,
            ])
            ->assertSessionHasNoErrors();

        $docente->refresh();
        $this->assertNull($docente->foto);
        Storage::disk('public')->assertMissing('docentes/foto.webp');
    }

    public function test_mueve_a_papelera_restaura_y_elimina_permanentemente(): void
    {
        Storage::fake('public');
        $super = $this->usuario(User::ROLE_SUPER);
        $this->categoria('Primaria');

        Storage::disk('public')->put('docentes/permanente.webp', 'x');
        $docente = $this->docente('Para borrar', $super, 'Primaria');
        $docente->update(['foto' => 'docentes/permanente.webp']);

        $this->actingAs($super)->post("/lorente-panel/docentes/{$docente->id}/eliminar")->assertRedirect();
        $this->assertNotNull($docente->fresh()->deleted_at);
        $this->assertSame($super->id, $docente->fresh()->deleted_by);

        $this->actingAs($super)->post("/lorente-panel/docentes/{$docente->id}/restaurar")->assertRedirect();
        $docente->refresh();
        $this->assertNull($docente->deleted_at);
        $this->assertNull($docente->deleted_by);

        $this->actingAs($super)->post("/lorente-panel/docentes/{$docente->id}/eliminar")->assertRedirect();
        $this->actingAs($super)->post("/lorente-panel/docentes/{$docente->id}/permanente")->assertRedirect();

        $this->assertDatabaseMissing('docentes', ['id' => $docente->id]);
        Storage::disk('public')->assertMissing('docentes/permanente.webp');
    }

    public function test_solo_el_super_elimina_permanentemente(): void
    {
        $admin = $this->usuario(User::ROLE_ADMIN);
        $docente = $this->docente('No borrable', $admin);
        $this->aPapelera($docente, $admin);

        $this->actingAs($admin)
            ->post("/lorente-panel/docentes/{$docente->id}/permanente")
            ->assertForbidden();

        $this->assertSoftDeleted('docentes', ['id' => $docente->id]);
    }

    public function test_papelera_es_jerarquica(): void
    {
        $super = $this->usuario(User::ROLE_SUPER);
        $admin = $this->usuario(User::ROLE_ADMIN);
        $otroAdmin = $this->usuario(User::ROLE_ADMIN);

        $deAdmin = $this->docente('De admin', $admin);
        $this->aPapelera($deAdmin, $admin);

        $deSuper = $this->docente('De super', $super, 'Secundaria');
        $this->aPapelera($deSuper, $super);

        $idsAdmin = collect($this->papeleraDe($admin)->inertiaProps('papelera'))->pluck('id');
        $this->assertEqualsCanonicalizing([$deAdmin->id], $idsAdmin->all());

        $idsOtroAdmin = collect($this->papeleraDe($otroAdmin)->inertiaProps('papelera'))->pluck('id');
        $this->assertCount(0, $idsOtroAdmin);

        $idsSuper = collect($this->papeleraDe($super)->inertiaProps('papelera'))->pluck('id');
        $this->assertEqualsCanonicalizing([$deAdmin->id, $deSuper->id], $idsSuper->all());
    }

    public function test_administrador_no_restaura_papelera_de_otro(): void
    {
        $admin = $this->usuario(User::ROLE_ADMIN);
        $otroAdmin = $this->usuario(User::ROLE_ADMIN);

        $docente = $this->docente('Ajeno', $otroAdmin);
        $this->aPapelera($docente, $otroAdmin);

        $this->actingAs($admin)
            ->post("/lorente-panel/docentes/{$docente->id}/restaurar")
            ->assertForbidden();

        $this->assertSoftDeleted('docentes', ['id' => $docente->id]);
    }

    public function test_papelera_es_perezosa_y_muestra_dias_restantes(): void
    {
        $super = $this->usuario(User::ROLE_SUPER);
        $docente = $this->docente('En papelera', $super);
        $docente->delete();

        $this->actingAs($super)->get('/lorente-panel/docentes')
            ->assertInertia(fn ($page) => $page->missing('papelera'));

        $this->actingAs($super)->get('/lorente-panel/docentes', [
            'X-Inertia-Partial-Component' => 'Panel/Docentes',
            'X-Inertia-Partial-Data' => 'papelera',
        ])
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('papelera', 1)
                ->where('papelera.0.nombre', 'En papelera')
                ->where('papelera.0.dias_restantes', 7));
    }

    public function test_purga_elimina_docentes_con_mas_de_7_dias(): void
    {
        Storage::fake('public');
        $super = $this->usuario(User::ROLE_SUPER);

        Storage::disk('public')->put('docentes/vencida.webp', 'x');
        $vencida = $this->docente('Vencida', $super);
        $vencida->update(['foto' => 'docentes/vencida.webp']);
        $vencida->delete();
        Docente::withTrashed()->where('id', $vencida->id)->update(['deleted_at' => now()->subDays(8)]);

        $reciente = $this->docente('Reciente', $super, 'Secundaria');
        $reciente->delete();

        $this->artisan('docentes:purgar-papelera')->assertExitCode(0);

        $this->assertDatabaseMissing('docentes', ['id' => $vencida->id]);
        Storage::disk('public')->assertMissing('docentes/vencida.webp');
        $this->assertSoftDeleted('docentes', ['id' => $reciente->id]);
    }

    public function test_reordena_docentes(): void
    {
        $admin = $this->usuario(User::ROLE_ADMIN);
        $a = $this->docente('A', $admin);
        $b = $this->docente('B', $admin);

        $this->actingAs($admin)
            ->post('/lorente-panel/docentes/reordenar', [
                'items' => [
                    ['id' => $b->id, 'orden' => 10],
                    ['id' => $a->id, 'orden' => 20],
                ],
            ])
            ->assertRedirect();

        $this->assertSame(10, $b->fresh()->orden);
        $this->assertSame(20, $a->fresh()->orden);
    }

    public function test_categorias_crear_renombrar_y_reordenar(): void
    {
        $admin = $this->usuario(User::ROLE_ADMIN);
        $this->categoria('Primaria', 10);

        $this->actingAs($admin)
            ->post('/lorente-panel/docente-categorias', ['nombre' => 'Secundaria'])
            ->assertSessionHasNoErrors();

        $nueva = DocenteCategoria::where('nombre', 'Secundaria')->firstOrFail();
        $this->assertSame(20, $nueva->orden);

        $docente = $this->docente('Docente X', $admin, 'Primaria');

        $this->actingAs($admin)
            ->post("/lorente-panel/docente-categorias/{$nueva->id}", ['nombre' => 'Inicial'])
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas('docente_categorias', ['nombre' => 'Inicial']);
        $this->assertDatabaseMissing('docente_categorias', ['nombre' => 'Secundaria']);

        $primaria = DocenteCategoria::where('nombre', 'Primaria')->firstOrFail();
        $this->actingAs($admin)
            ->post("/lorente-panel/docente-categorias/{$primaria->id}", ['nombre' => 'Primaria'])
            ->assertSessionHasNoErrors();
        $this->assertSame('Primaria', $docente->fresh()->categoria);

        $this->actingAs($admin)
            ->post('/lorente-panel/docente-categorias/reordenar', [
                'categorias' => ['Inicial', 'Primaria'],
            ])
            ->assertRedirect();

        $this->assertSame(10, DocenteCategoria::where('nombre', 'Inicial')->firstOrFail()->orden);
        $this->assertSame(20, DocenteCategoria::where('nombre', 'Primaria')->firstOrFail()->orden);
    }

    public function test_renombrar_categoria_actualiza_docentes(): void
    {
        $admin = $this->usuario(User::ROLE_ADMIN);
        $cat = $this->categoria('Antigua', 10);
        $docente = $this->docente('Docente Y', $admin, 'Antigua');

        $this->actingAs($admin)
            ->post("/lorente-panel/docente-categorias/{$cat->id}", ['nombre' => 'Nueva'])
            ->assertSessionHasNoErrors();

        $this->assertSame('Nueva', $docente->fresh()->categoria);
    }

    public function test_no_elimina_categoria_con_docentes_y_si_cuando_esta_vacia(): void
    {
        $admin = $this->usuario(User::ROLE_ADMIN);
        $conDocentes = $this->categoria('Con docentes', 10);
        $vacia = $this->categoria('Vacía', 20);
        $this->docente('Asociado', $admin, 'Con docentes');

        $this->actingAs($admin)
            ->post("/lorente-panel/docente-categorias/{$conDocentes->id}/eliminar")
            ->assertSessionHasErrors('categoria');

        $this->assertDatabaseHas('docente_categorias', ['id' => $conDocentes->id]);

        $this->actingAs($admin)
            ->post("/lorente-panel/docente-categorias/{$vacia->id}/eliminar")
            ->assertSessionHasNoErrors();

        $this->assertDatabaseMissing('docente_categorias', ['id' => $vacia->id]);
    }
}

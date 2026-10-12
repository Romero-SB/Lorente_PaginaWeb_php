<?php

namespace Tests\Feature\Panel;

use App\Models\Docente;
use App\Models\DocenteCategoria;
use App\Models\Documento;
use App\Models\DocumentoCategoria;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CategoriaRelacionTest extends TestCase
{
    use RefreshDatabase;

    private function usuario(string $rol): User
    {
        return User::factory()->create(['role' => $rol]);
    }

    public function test_crear_docente_asigna_categoria_id(): void
    {
        Storage::fake('public');
        $admin = $this->usuario(User::ROLE_ADMIN);
        $categoria = DocenteCategoria::create(['nombre' => 'Primaria', 'orden' => 10]);

        $this->actingAs($admin)
            ->post('/lorente-panel/docentes', [
                'nombre' => 'Nuevo Docente',
                'cargo' => 'Matemática',
                'categoria' => 'Primaria',
                'foto' => UploadedFile::fake()->image('foto.jpg', 400, 500),
            ])
            ->assertSessionHasNoErrors();

        $docente = Docente::where('nombre', 'Nuevo Docente')->firstOrFail();
        $this->assertSame($categoria->id, $docente->categoria_id);
        $this->assertSame('Primaria', $docente->categoriaRef->nombre);
    }

    public function test_editar_docente_actualiza_categoria_id(): void
    {
        Storage::fake('public');
        $admin = $this->usuario(User::ROLE_ADMIN);
        DocenteCategoria::create(['nombre' => 'Primaria', 'orden' => 10]);
        $secundaria = DocenteCategoria::create(['nombre' => 'Secundaria', 'orden' => 20]);

        $docente = Docente::create([
            'nombre' => 'Docente X',
            'cargo' => 'Aula',
            'categoria' => 'Primaria',
            'orden' => 10,
            'activo' => true,
        ]);

        $this->actingAs($admin)
            ->post("/lorente-panel/docentes/{$docente->id}", [
                'nombre' => 'Docente X',
                'cargo' => 'Aula',
                'categoria' => 'Secundaria',
            ])
            ->assertSessionHasNoErrors();

        $this->assertSame($secundaria->id, $docente->fresh()->categoria_id);
    }

    public function test_renombrar_categoria_conserva_categoria_id(): void
    {
        $admin = $this->usuario(User::ROLE_ADMIN);
        $categoria = DocenteCategoria::create(['nombre' => 'Primaria', 'orden' => 10]);

        $docente = Docente::create([
            'nombre' => 'Docente X',
            'cargo' => 'Aula',
            'categoria' => 'Primaria',
            'categoria_id' => $categoria->id,
            'orden' => 10,
            'activo' => true,
        ]);

        $this->actingAs($admin)
            ->post("/lorente-panel/docente-categorias/{$categoria->id}", ['nombre' => 'Inicial'])
            ->assertSessionHasNoErrors();

        $docente->refresh();
        $this->assertSame('Inicial', $docente->categoria);
        $this->assertSame($categoria->id, $docente->categoria_id);
    }

    public function test_crear_documento_asigna_categoria_id(): void
    {
        Storage::fake('public');
        Storage::fake('local');
        $admin = $this->usuario(User::ROLE_ADMIN);
        $categoria = DocumentoCategoria::create(['nombre' => 'Resoluciones', 'orden' => 10]);

        $archivo = UploadedFile::fake()->create('acta.pdf', 200, 'application/pdf');

        $this->actingAs($admin)
            ->post('/lorente-panel/documentos', [
                'titulo' => 'Acta',
                'categoria' => 'Resoluciones',
                'visibilidad' => 'publico',
                'archivo' => $archivo,
            ])
            ->assertSessionHasNoErrors();

        $documento = Documento::where('titulo', 'Acta')->firstOrFail();
        $this->assertSame($categoria->id, $documento->categoria_id);
        $this->assertSame('Resoluciones', $documento->categoriaRef->nombre);
    }
}

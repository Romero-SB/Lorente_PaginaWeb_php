<?php

namespace Tests\Feature\Panel;

use App\Models\Docente;
use App\Models\DocenteCategoria;
use App\Models\User;
use App\Support\ContenidoSitio;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DocenteCategoriaEstiloTest extends TestCase
{
    use RefreshDatabase;

    private function usuario(string $rol): User
    {
        return User::factory()->create(['role' => $rol]);
    }

    private function categoria(string $nombre = 'Primaria'): DocenteCategoria
    {
        return DocenteCategoria::create(['nombre' => $nombre, 'orden' => 10]);
    }

    private function docente(string $categoria = 'Primaria'): Docente
    {
        return Docente::create([
            'nombre' => 'Docente Estilo',
            'cargo' => 'Docente de aula',
            'foto' => null,
            'categoria' => $categoria,
            'orden' => 10,
            'activo' => true,
        ]);
    }

    public function test_admin_puede_guardar_estilo_de_categoria(): void
    {
        $admin = $this->usuario(User::ROLE_ADMIN);
        $categoria = $this->categoria();
        $this->docente();

        $this->actingAs($admin)
            ->post("/lorente-panel/docente-categorias/{$categoria->id}/estilo", [
                'titulo_font' => 'poppins',
                'titulo_color' => '#FFFFFF',
                'titulo_align' => 'center',
                'cargo_font' => 'montserrat',
                'cargo_color' => '#123ABc',
                'cargo_align' => 'right',
                'fondo' => '#1E3A8A',
            ])
            ->assertSessionHasNoErrors();

        $this->assertSame([
            'titulo_font' => 'poppins',
            'titulo_color' => '#ffffff',
            'titulo_align' => 'center',
            'cargo_font' => 'montserrat',
            'cargo_color' => '#123abc',
            'cargo_align' => 'right',
            'fondo' => '#1e3a8a',
        ], $categoria->fresh()->estilo);

        $sitio = ContenidoSitio::para()['categorias_docentes'];

        $this->assertSame('poppins', $sitio[0]['estilo']['titulo_font']);
        $this->assertSame('center', $sitio[0]['estilo']['titulo_align']);
        $this->assertSame('#1e3a8a', $sitio[0]['estilo']['fondo']);
    }

    public function test_estilo_vacio_se_guarda_como_nulo(): void
    {
        $admin = $this->usuario(User::ROLE_ADMIN);
        $categoria = $this->categoria();

        $this->actingAs($admin)
            ->post("/lorente-panel/docente-categorias/{$categoria->id}/estilo", [
                'titulo_font' => '',
                'titulo_color' => null,
            ])
            ->assertSessionHasNoErrors();

        $this->assertNull($categoria->fresh()->estilo);
    }

    public function test_rechaza_fuente_y_color_invalidos(): void
    {
        $admin = $this->usuario(User::ROLE_ADMIN);
        $categoria = $this->categoria();

        $this->actingAs($admin)
            ->post("/lorente-panel/docente-categorias/{$categoria->id}/estilo", [
                'titulo_font' => 'comic-sans',
                'titulo_color' => 'azul',
                'fondo' => 'rgb(0,0,0)',
            ])
            ->assertSessionHasErrors(['titulo_font', 'titulo_color', 'fondo']);

        $this->assertNull($categoria->fresh()->estilo);
    }

    public function test_rechaza_alineacion_invalida(): void
    {
        $admin = $this->usuario(User::ROLE_ADMIN);
        $categoria = $this->categoria();

        $this->actingAs($admin)
            ->post("/lorente-panel/docente-categorias/{$categoria->id}/estilo", [
                'titulo_align' => 'justify',
                'cargo_align' => 'diagonal',
            ])
            ->assertSessionHasErrors(['titulo_align', 'cargo_align']);

        $this->assertNull($categoria->fresh()->estilo);
    }

    public function test_docente_no_puede_guardar_estilo(): void
    {
        $docente = $this->usuario(User::ROLE_DOCENTE);
        $categoria = $this->categoria();

        $this->actingAs($docente)
            ->post("/lorente-panel/docente-categorias/{$categoria->id}/estilo", ['fondo' => '#000000'])
            ->assertForbidden();
    }
}

<?php

namespace Tests\Feature\Panel;

use App\Models\Actividad;
use App\Models\Docente;
use App\Models\Documento;
use App\Models\Noticia;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HistorialPanelTest extends TestCase
{
    use RefreshDatabase;

    private function usuario(string $rol): User
    {
        return User::factory()->create(['role' => $rol]);
    }

    private function registro(
        ?User $usuario,
        string $accion,
        ?string $modelo = Noticia::class,
        string $titulo = 'Registro de prueba',
        ?string $descripcion = null,
        ?string $fecha = null,
    ): Actividad {
        $actividad = Actividad::create([
            'user_id' => $usuario?->id,
            'accion' => $accion,
            'modelo' => $modelo,
            'modelo_id' => 1,
            'titulo' => $titulo,
            'descripcion' => $descripcion,
            'ip' => '127.0.0.1',
        ]);

        if ($fecha !== null) {
            $actividad->forceFill(['created_at' => $fecha, 'updated_at' => $fecha])->save();
        }

        return $actividad;
    }

    public function test_solo_el_super_usuario_accede_al_historial(): void
    {
        $this->registro($this->usuario(User::ROLE_SUPER), 'crear');

        $this->actingAs($this->usuario(User::ROLE_SUPER))
            ->get('/lorente-panel/historial')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Panel/Historial')
                ->has('registros.data')
                ->has('usuarios')
                ->has('acciones')
                ->has('modelos')
                ->has('filtros'));

        foreach ([User::ROLE_ADMIN, User::ROLE_DOCENTE] as $rol) {
            $this->actingAs($this->usuario($rol))
                ->get('/lorente-panel/historial')
                ->assertForbidden();
        }
    }

    public function test_guest_es_redirigido_al_login(): void
    {
        $this->get('/lorente-panel/historial')->assertRedirect('/lorente-panel/login');
    }

    public function test_lista_los_registros_mas_recientes_primero(): void
    {
        $super = $this->usuario(User::ROLE_SUPER);
        $this->registro($super, 'crear', Noticia::class, 'Antigua', null, now()->subDays(2)->toDateTimeString());
        $this->registro($super, 'editar', Noticia::class, 'Reciente');

        $this->actingAs($super)
            ->get('/lorente-panel/historial')
            ->assertInertia(fn ($page) => $page
                ->has('registros.data', 2)
                ->where('registros.data.0.titulo', 'Reciente')
                ->where('registros.data.1.titulo', 'Antigua')
                ->where('registros.meta.total', 2));
    }

    public function test_filtra_por_accion(): void
    {
        $super = $this->usuario(User::ROLE_SUPER);
        $this->registro($super, 'crear', Noticia::class, 'Creada');
        $this->registro($super, 'papelera', Noticia::class, 'Eliminada');

        $this->actingAs($super)
            ->get('/lorente-panel/historial?accion=papelera')
            ->assertInertia(fn ($page) => $page
                ->has('registros.data', 1)
                ->where('registros.data.0.titulo', 'Eliminada')
                ->where('filtros.accion', 'papelera'));
    }

    public function test_filtra_por_modulo(): void
    {
        $super = $this->usuario(User::ROLE_SUPER);
        $this->registro($super, 'crear', Noticia::class, 'Noticia X');
        $this->registro($super, 'crear', Docente::class, 'Docente X');
        $this->registro($super, 'crear', Documento::class, 'Documento X');

        $this->actingAs($super)
            ->get('/lorente-panel/historial?modelo='.urlencode(Docente::class))
            ->assertInertia(fn ($page) => $page
                ->has('registros.data', 1)
                ->where('registros.data.0.modelo_etiqueta', 'Docente')
                ->where('registros.data.0.titulo', 'Docente X'));
    }

    public function test_filtra_por_usuario(): void
    {
        $super = $this->usuario(User::ROLE_SUPER);
        $docente = $this->usuario(User::ROLE_DOCENTE);
        $this->registro($super, 'crear', Noticia::class, 'Del super');
        $this->registro($docente, 'crear', Noticia::class, 'Del docente');

        $this->actingAs($super)
            ->get('/lorente-panel/historial?usuario='.$docente->id)
            ->assertInertia(fn ($page) => $page
                ->has('registros.data', 1)
                ->where('registros.data.0.titulo', 'Del docente'));
    }

    public function test_filtra_por_busqueda(): void
    {
        $super = $this->usuario(User::ROLE_SUPER);
        $this->registro($super, 'crear', Noticia::class, 'Aniversario del colegio');
        $this->registro($super, 'crear', Noticia::class, 'Olimpiada de matemática');

        $this->actingAs($super)
            ->get('/lorente-panel/historial?q='.urlencode('olimpiada'))
            ->assertInertia(fn ($page) => $page
                ->has('registros.data', 1)
                ->where('registros.data.0.titulo', 'Olimpiada de matemática'));
    }

    public function test_filtra_por_rango_de_fechas(): void
    {
        $super = $this->usuario(User::ROLE_SUPER);
        $this->registro($super, 'crear', Noticia::class, 'Vieja', null, now()->subDays(10)->toDateTimeString());
        $this->registro($super, 'crear', Noticia::class, 'Reciente', null, now()->toDateTimeString());

        $this->actingAs($super)
            ->get('/lorente-panel/historial?desde='.now()->subDays(3)->toDateString())
            ->assertInertia(fn ($page) => $page
                ->has('registros.data', 1)
                ->where('registros.data.0.titulo', 'Reciente'));

        $this->actingAs($super)
            ->get('/lorente-panel/historial?hasta='.now()->subDays(3)->toDateString())
            ->assertInertia(fn ($page) => $page
                ->has('registros.data', 1)
                ->where('registros.data.0.titulo', 'Vieja'));
    }

    public function test_pagina_los_resultados(): void
    {
        $super = $this->usuario(User::ROLE_SUPER);

        for ($i = 0; $i < 30; $i++) {
            $this->registro($super, 'crear', Noticia::class, "Registro {$i}");
        }

        $this->actingAs($super)
            ->get('/lorente-panel/historial')
            ->assertInertia(fn ($page) => $page
                ->has('registros.data', 25)
                ->where('registros.meta.total', 30)
                ->where('registros.meta.pagina', 1)
                ->where('registros.meta.ultima', 2));

        $this->actingAs($super)
            ->get('/lorente-panel/historial?page=2')
            ->assertInertia(fn ($page) => $page
                ->has('registros.data', 5)
                ->where('registros.meta.pagina', 2));
    }

    public function test_muestra_registros_del_sistema_sin_usuario(): void
    {
        $super = $this->usuario(User::ROLE_SUPER);
        $this->registro(null, 'crear', Noticia::class, 'Sin autor');

        $this->actingAs($super)
            ->get('/lorente-panel/historial')
            ->assertInertia(fn ($page) => $page
                ->where('registros.data.0.usuario', 'Sistema'));
    }
}

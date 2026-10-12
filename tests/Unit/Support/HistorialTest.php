<?php

namespace Tests\Unit\Support;

use App\Models\Actividad;
use App\Models\Noticia;
use App\Models\User;
use App\Support\Historial;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Tests\TestCase;

class HistorialTest extends TestCase
{
    use RefreshDatabase;

    private function noticia(): Noticia
    {
        return Noticia::create([
            'titulo' => 'Noticia para la bitácora',
            'fiso' => now()->toDateString(),
            'fec' => now()->toDateString(),
            'cat' => 'Logros',
            'res' => str_repeat('Resumen con extensión suficiente.', 2),
            'con' => str_repeat('Contenido con extensión suficiente para el registro.', 3),
            'est' => Noticia::EST_BORRADOR,
        ]);
    }

    public function test_registra_la_actividad_con_su_morfologia_datos_de_peticion_y_cambios(): void
    {
        $usuario = User::factory()->create();
        $noticia = $this->noticia();

        $request = Request::create('/ruta', 'GET', [], [], [], [
            'REMOTE_ADDR' => '10.1.2.3',
            'HTTP_USER_AGENT' => str_repeat('u', 600),
        ]);

        (new Historial($request))->registrar($usuario, 'editar', $noticia, 'Actualización de la noticia', [
            'titulo' => ['Antes', 'Después'],
        ], 'Descripción opcional');

        $this->assertDatabaseHas('actividad', [
            'user_id' => $usuario->id,
            'accion' => 'editar',
            'modelo' => Noticia::class,
            'modelo_id' => $noticia->id,
            'titulo' => 'Actualización de la noticia',
            'descripcion' => 'Descripción opcional',
            'ip' => '10.1.2.3',
        ]);

        $actividad = Actividad::latest('id')->firstOrFail();
        $this->assertSame(500, strlen($actividad->user_agent));
        $this->assertSame(['titulo' => ['Antes', 'Después']], $actividad->cambios);
    }

    public function test_registra_actividad_sin_usuario_autenticado(): void
    {
        $noticia = $this->noticia();

        (new Historial(Request::create('/ruta')))->registrar(null, 'crear', $noticia, 'Creada sin sesión');

        $this->assertDatabaseHas('actividad', [
            'user_id' => null,
            'accion' => 'crear',
            'modelo_id' => $noticia->id,
        ]);
    }

    public function test_recorta_el_user_agent_a_500_caracteres_y_guarda_otros_campos(): void
    {
        $noticia = $this->noticia();

        $request = Request::create('/ruta', 'GET', [], [], [], [
            'REMOTE_ADDR' => '192.168.0.5',
            'HTTP_USER_AGENT' => 'Agente corto',
        ]);

        (new Historial($request))->registrar(null, 'eliminar', $noticia, 'Eliminada');

        $this->assertDatabaseHas('actividad', [
            'modelo_id' => $noticia->id,
            'ip' => '192.168.0.5',
            'user_agent' => 'Agente corto',
        ]);
    }
}

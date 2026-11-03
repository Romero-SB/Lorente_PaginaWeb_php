<?php

namespace App\Http\Controllers\Panel;

use App\Http\Controllers\Controller;
use App\Http\Requests\Panel\HistorialFiltrosRequest;
use App\Models\Actividad;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HistorialController extends Controller
{
    private const POR_PAGINA = 25;

    /** Sección del panel donde ocurrió la acción. */
    private const MODULOS = [
        'App\Models\Noticia' => 'Noticias',
        'App\Models\Docente' => 'Docentes',
        'App\Models\Documento' => 'Documentos',
        'App\Models\Config' => 'Configuración del sitio',
        'App\Models\HistoriaHito' => 'Historia del colegio',
        'App\Models\NosotrosImagen' => 'Nosotros (galería)',
        'App\Models\User' => 'Cuentas',
    ];

    /** Verbo en pasado para cada acción registrada. */
    private const VERBOS = [
        'crear' => 'Creó',
        'editar' => 'Editó',
        'eliminar' => 'Eliminó',
        'papelera' => 'Movió a la papelera',
        'restaurar' => 'Restauró',
        'eliminar permanente' => 'Eliminó definitivamente',
        'crear cuenta' => 'Creó la cuenta de',
        'resetear contraseña' => 'Restableció la contraseña de',
        'eliminar cuenta' => 'Eliminó la cuenta de',
        'cambiar contraseña' => 'Cambió su contraseña',
    ];

    /** Objeto gramatical para cada módulo. */
    private const OBJETOS = [
        'App\Models\Noticia' => 'la noticia',
        'App\Models\Docente' => 'al docente',
        'App\Models\Documento' => 'el documento',
        'App\Models\HistoriaHito' => 'el hito',
        'App\Models\NosotrosImagen' => 'una imagen de Nosotros',
    ];

    public function index(HistorialFiltrosRequest $request): Response
    {
        $filtros = $request->validated();

        $registros = Actividad::query()
            ->with('user:id,name,role')
            ->when($filtros['usuario'] ?? null, fn (Builder $q, $v) => $q->where('user_id', $v))
            ->when($filtros['accion'] ?? null, fn (Builder $q, $v) => $q->where('accion', $v))
            ->when($filtros['modelo'] ?? null, fn (Builder $q, $v) => $q->where('modelo', $v))
            ->when($filtros['desde'] ?? null, fn (Builder $q, $v) => $q->whereDate('created_at', '>=', $v))
            ->when($filtros['hasta'] ?? null, fn (Builder $q, $v) => $q->whereDate('created_at', '<=', $v))
            ->when($filtros['q'] ?? null, fn (Builder $q, $v) => $q->where(function (Builder $sub) use ($v) {
                $sub->where('titulo', 'like', "%{$v}%")
                    ->orWhere('descripcion', 'like', "%{$v}%");
            }))
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate(self::POR_PAGINA)
            ->onEachSide(1)
            ->withQueryString();

        return Inertia::render('Panel/Historial', [
            'registros' => [
                'data' => collect($registros->items())->map(fn (Actividad $a) => [
                    'id' => $a->id,
                    'usuario' => $a->user?->name ?? 'Sistema',
                    'rol' => $a->user?->role,
                    'accion' => $a->accion,
                    'modulo' => $this->modulo($a),
                    'modelo_etiqueta' => $this->modulo($a),
                    'titulo' => $a->titulo,
                    'detalle' => $this->detalle($a),
                    'fecha' => $a->created_at?->toIso8601String(),
                ])->all(),
                'links' => collect($registros->linkCollection())
                    ->map(fn (array $link) => [
                        'url' => $link['url'],
                        'label' => str_replace(
                            ['&laquo;', '&raquo;', '&hellip;'],
                            ['«', '»', '…'],
                            $link['label'],
                        ),
                        'active' => $link['active'],
                    ])
                    ->values()
                    ->all(),
                'meta' => [
                    'total' => $registros->total(),
                    'desde' => $registros->firstItem(),
                    'hasta' => $registros->lastItem(),
                    'pagina' => $registros->currentPage(),
                    'ultima' => $registros->lastPage(),
                ],
            ],
            'usuarios' => User::query()
                ->orderBy('name')
                ->get(['id', 'name', 'role'])
                ->map(fn (User $u) => ['id' => $u->id, 'name' => $u->name, 'rol' => $u->role])
                ->all(),
            'acciones' => Actividad::query()->whereNotNull('accion')->distinct()->orderBy('accion')->pluck('accion')->all(),
            'modelos' => Actividad::query()
                ->whereNotNull('modelo')
                ->distinct()
                ->orderBy('modelo')
                ->pluck('modelo')
                ->map(fn (string $m) => ['valor' => $m, 'etiqueta' => self::MODULOS[$m] ?? $m])
                ->values()
                ->all(),
            'filtros' => [
                'usuario' => $filtros['usuario'] ?? null,
                'accion' => $filtros['accion'] ?? null,
                'modelo' => $filtros['modelo'] ?? null,
                'desde' => $filtros['desde'] ?? null,
                'hasta' => $filtros['hasta'] ?? null,
                'q' => $filtros['q'] ?? null,
            ],
        ]);
    }

    /**
     * Elimina del historial los registros comprendidos entre dos fechas (inclusive).
     * Solo accesible para super-usuario (ver rutas).
     */
    public function eliminarRango(Request $request): RedirectResponse
    {
        $datos = $request->validate([
            'desde' => ['required', 'date'],
            'hasta' => ['required', 'date', 'after_or_equal:desde'],
        ]);

        $cantidad = Actividad::query()
            ->whereDate('created_at', '>=', $datos['desde'])
            ->whereDate('created_at', '<=', $datos['hasta'])
            ->delete();

        return back()->with('ok', $cantidad === 1 ? 'Se eliminó 1 registro del historial.' : "Se eliminaron {$cantidad} registros del historial.");
    }
    /** Sección del panel donde se hizo el cambio. */
    private function modulo(Actividad $a): string
    {
        if ($a->modelo === 'App\Models\User' && str_starts_with((string) $a->titulo, 'Perfil:')) {
            return 'Mi perfil';
        }

        return self::MODULOS[$a->modelo] ?? 'Otro';
    }

    /** Frase legible de lo que se hizo, sin rutas ni IP. */
    private function detalle(Actividad $a): string
    {
        $titulo = (string) $a->titulo;

        if ($a->modelo === 'App\Models\Config') {
            return "Editó la configuración: {$titulo}.";
        }

        if ($a->modelo === 'App\Models\User' && $a->accion === 'editar') {
            return 'Editó sus datos personales.';
        }

        $verbo = self::VERBOS[$a->accion] ?? ucfirst((string) $a->accion);
        $objeto = self::OBJETOS[$a->modelo] ?? '';

        if ($a->modelo === 'App\Models\User') {
            return "{$verbo} {$titulo}.";
        }

        if ($a->accion === 'cambiar contraseña') {
            return "{$verbo}.";
        }

        $partes = array_filter([$verbo, $objeto, $titulo !== '' ? "«{$titulo}»" : null]);

        return implode(' ', $partes).'.';
    }
}

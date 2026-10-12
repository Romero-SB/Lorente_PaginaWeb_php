<?php

namespace App\Http\Controllers\Panel;

use App\Http\Controllers\Controller;
use App\Http\Requests\Panel\HistorialFiltrosRequest;
use App\Models\Actividad;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Inertia\Inertia;
use Inertia\Response;

class HistorialController extends Controller
{
    private const POR_PAGINA = 25;

    /** @var array<string, string> */
    private const ETIQUETAS_MODELO = [
        'App\Models\Noticia' => 'Noticia',
        'App\Models\Docente' => 'Docente',
        'App\Models\Documento' => 'Documento',
        'App\Models\Config' => 'Configuración',
        'App\Models\User' => 'Cuenta',
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
                    'modelo' => $a->modelo,
                    'modelo_etiqueta' => self::ETIQUETAS_MODELO[$a->modelo] ?? $a->modelo,
                    'titulo' => $a->titulo,
                    'descripcion' => $a->descripcion,
                    'ip' => $a->ip,
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
                ->map(fn (string $m) => ['valor' => $m, 'etiqueta' => self::ETIQUETAS_MODELO[$m] ?? $m])
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
}

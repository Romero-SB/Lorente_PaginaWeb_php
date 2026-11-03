<?php

namespace App\Http\Controllers\Panel;

use App\Actions\Noticias\SincronizarAdjuntos;
use App\Actions\Noticias\SincronizarImagenes;
use App\Http\Controllers\Controller;
use App\Http\Requests\Panel\StoreNoticiaRequest;
use App\Http\Requests\Panel\UpdateNoticiaRequest;
use App\Http\Resources\NoticiaResource;
use App\Models\Noticia;
use App\Models\User;
use App\Support\Historial;
use App\Support\PapeleraNoticias;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NoticiasController extends Controller
{
    private const POR_PAGINA = 15;

    /** @return array<int, array<string, mixed>> */
    private function enlaces(\Illuminate\Pagination\LengthAwarePaginator $paginado): array
    {
        return collect($paginado->linkCollection())
            ->map(fn (array $link) => [
                'url' => $link['url'],
                'label' => str_replace(['&laquo;', '&raquo;', '&hellip;'], ['«', '»', '…'], $link['label']),
                'active' => $link['active'],
            ])
            ->values()
            ->all();
    }

    public function index(Request $request): Response
    {
        $usuario = $request->user();
        PapeleraNoticias::purgarVencidasSiCorresponde();
        $busqueda = trim((string) $request->query('q', ''));

        $paginado = Noticia::query()
            ->with(['author:id,name,cargo', 'updatedBy:id,name', 'imagenes', 'adjuntos'])
            ->when($usuario->isDocente(), fn ($q) => $q->where('author_id', $usuario->id))
            ->when($busqueda !== '', fn ($q) => $q->where('titulo', 'like', "%{$busqueda}%"))
            ->orderByDesc('fiso')
            ->orderByDesc('id')
            ->paginate(self::POR_PAGINA)
            ->onEachSide(1)
            ->withQueryString();

        return Inertia::render('Panel/Noticias', [
            'noticias' => [
                'data' => collect($paginado->items())
                    ->map(fn (Noticia $n) => (new NoticiaResource($n))->resolve($request))
                    ->values()
                    ->all(),
                'links' => $this->enlaces($paginado),
                'meta' => [
                    'total' => $paginado->total(),
                    'pagina' => $paginado->currentPage(),
                    'ultima' => $paginado->lastPage(),
                ],
            ],
            'filtros' => ['q' => $busqueda],
            'categorias' => config('panel.categorias_noticias'),
            'papelera' => Inertia::defer(fn () => $this->papelera($usuario)),
        ]);
    }

    public function store(StoreNoticiaRequest $request, SincronizarImagenes $imagenes, SincronizarAdjuntos $adjuntos, Historial $historial)
    {
        $usuario = $request->user();
        $datos = $request->validated();

        $noticia = Noticia::create([
            'titulo' => trim($datos['titulo']),
            'fiso' => $datos['fec'],
            'fec' => $datos['fec'],
            'cat' => $datos['cat'] ?? null,
            'res' => trim((string) ($datos['res'] ?? '')),
            'con' => trim((string) ($datos['con'] ?? '')),
            'est' => $datos['est'],
            'author_id' => $usuario->id,
            'aut' => $usuario->name,
        ]);

        $imagenes->ejecutar($noticia, $request->input('imagenes_plan'), $request->file('imagenes_nuevas', []));
        $adjuntos->ejecutar($noticia, $request->input('adjuntos_plan'), $request->file('adjuntos_nuevas', []));

        $historial->registrar($usuario, 'crear', $noticia, $noticia->titulo);

        return back()->with('ok', 'Noticia creada correctamente.');
    }

    public function update(UpdateNoticiaRequest $request, Noticia $noticia, SincronizarImagenes $imagenes, SincronizarAdjuntos $adjuntos, Historial $historial)
    {
        $this->authorize('gestionar', $noticia);

        $usuario = $request->user();
        $datos = $request->validated();

        $noticia->update([
            'titulo' => trim($datos['titulo']),
            'fiso' => $datos['fec'],
            'fec' => $datos['fec'],
            'cat' => $datos['cat'] ?? null,
            'res' => trim((string) ($datos['res'] ?? '')),
            'con' => trim((string) ($datos['con'] ?? '')),
            'est' => $datos['est'],
            'updated_by' => $usuario->id,
        ]);

        $imagenes->ejecutar($noticia, $request->input('imagenes_plan'), $request->file('imagenes_nuevas', []));
        $adjuntos->ejecutar($noticia, $request->input('adjuntos_plan'), $request->file('adjuntos_nuevas', []));

        $historial->registrar($usuario, 'editar', $noticia, $noticia->titulo);

        return back()->with('ok', 'Noticia actualizada correctamente.');
    }

    public function destroy(Request $request, Noticia $noticia, Historial $historial)
    {
        $this->authorize('gestionar', $noticia);

        $usuario = $request->user();

        $noticia->deleted_by = $usuario->id;
        $noticia->save();
        $noticia->delete();

        $historial->registrar($usuario, 'papelera', $noticia, $noticia->titulo);

        return back()->with('ok', 'Noticia movida a la papelera.');
    }

    public function restaurar(Request $request, Noticia $noticia, Historial $historial)
    {
        $this->authorize('gestionarEliminada', $noticia);

        $usuario = $request->user();

        $noticia->restore();
        $noticia->deleted_by = null;
        $noticia->save();

        $historial->registrar($usuario, 'restaurar', $noticia, $noticia->titulo);

        return back()->with('ok', 'Noticia restaurada.');
    }

    public function permanente(Request $request, Noticia $noticia, Historial $historial)
    {
        $this->authorize('gestionarEliminada', $noticia);

        $usuario = $request->user();

        PapeleraNoticias::eliminarArchivos($noticia);
        $noticia->forceDelete();

        $historial->registrar($usuario, 'eliminar permanente', $noticia, (string) $noticia->titulo);

        return back()->with('ok', 'Noticia eliminada permanentemente.');
    }

    /** @return array<int, array<string, mixed>> */
    private function descifrarPlan(?string $json): array
    {
        if (blank($json)) {
            return [];
        }

        $plan = json_decode($json, true);

        if (! is_array($plan)) {
            return [];
        }

        return array_map(fn ($e) => (array) $e, $plan);
    }

    /** @return array<int, array<string, mixed>> */
    private function papelera(User $usuario): array
    {
        PapeleraNoticias::purgarVencidasSiCorresponde();

        return PapeleraNoticias::consultaVisible($usuario)
            ->orderByDesc('deleted_at')
            ->get()
            ->map(function (Noticia $n) {
                return [
                    ...(new NoticiaResource($n))->resolve(),
                    'eliminada_por' => $n->deletedBy?->name,
                    'dias_restantes' => PapeleraNoticias::diasRestantes($n),
                ];
            })
            ->values()
            ->all();
    }
}

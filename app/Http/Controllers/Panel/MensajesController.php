<?php

namespace App\Http\Controllers\Panel;

use App\Http\Controllers\Controller;
use App\Models\ContactoMensaje;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MensajesController extends Controller
{
    private const POR_PAGINA = 20;

    public function index(Request $request): Response
    {
        $filtro = $request->query('filtro', 'todos');
        $busqueda = trim((string) $request->query('q', ''));

        $mensajes = ContactoMensaje::query()
            ->when($filtro === 'no-leidos', fn ($q) => $q->where('leido', false))
            ->when($filtro === 'leidos', fn ($q) => $q->where('leido', true))
            ->when($busqueda !== '', function ($q) use ($busqueda) {
                $q->where(function ($sub) use ($busqueda) {
                    $sub->where('nombre', 'like', "%{$busqueda}%")
                        ->orWhere('email', 'like', "%{$busqueda}%")
                        ->orWhere('asunto', 'like', "%{$busqueda}%")
                        ->orWhere('mensaje', 'like', "%{$busqueda}%");
                });
            })
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate(self::POR_PAGINA)
            ->onEachSide(1)
            ->withQueryString();

        return Inertia::render('Panel/Mensajes', [
            'mensajes' => [
                'data' => collect($mensajes->items())->map(fn (ContactoMensaje $m) => $this->paraVista($m))->values()->all(),
                'links' => collect($mensajes->linkCollection())
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
                    'total' => $mensajes->total(),
                    'desde' => $mensajes->firstItem(),
                    'hasta' => $mensajes->lastItem(),
                    'pagina' => $mensajes->currentPage(),
                    'ultima' => $mensajes->lastPage(),
                ],
            ],
            'filtros' => [
                'filtro' => $filtro,
                'q' => $busqueda,
            ],
            'stats' => [
                'total' => ContactoMensaje::count(),
                'no_leidos' => ContactoMensaje::where('leido', false)->count(),
            ],
        ]);
    }

    public function marcarLeido(Request $request, ContactoMensaje $mensaje): RedirectResponse
    {
        $mensaje->leido = ! $mensaje->leido;
        $mensaje->save();

        return back()->with('ok', $mensaje->leido ? 'Mensaje marcado como leído.' : 'Mensaje marcado como no leído.');
    }

    public function marcarRespondido(Request $request, ContactoMensaje $mensaje): RedirectResponse
    {
        $mensaje->respondido_at = $mensaje->respondido_at === null ? now() : null;
        $mensaje->leido = true;
        $mensaje->save();

        return back()->with('ok', $mensaje->respondido_at ? 'Mensaje marcado como respondido.' : 'Marca de respuesta eliminada.');
    }

    public function destroy(Request $request, ContactoMensaje $mensaje): RedirectResponse
    {
        $mensaje->delete();

        return back()->with('ok', 'Mensaje eliminado.');
    }

    /** @return array<string, mixed> */
    private function paraVista(ContactoMensaje $m): array
    {
        return [
            'id' => $m->id,
            'nombre' => $m->nombre,
            'email' => $m->email,
            'telefono' => $m->telefono,
            'asunto' => $m->asunto,
            'mensaje' => $m->mensaje,
            'leido' => (bool) $m->leido,
            'respondido' => $m->respondido_at !== null,
            'respondido_at' => $m->respondido_at?->toIso8601String(),
            'fecha' => $m->created_at?->toIso8601String(),
            'fecha_texto' => $m->created_at?->translatedFormat('d M Y · H:i'),
            'ip' => $m->ip,
        ];
    }
}

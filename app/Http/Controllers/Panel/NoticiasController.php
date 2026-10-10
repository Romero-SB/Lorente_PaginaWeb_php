<?php

namespace App\Http\Controllers\Panel;

use App\Http\Controllers\Controller;
use App\Models\Adjunto;
use App\Models\Noticia;
use App\Models\NoticiaImagen;
use App\Models\User;
use App\Support\Almacenamiento;
use App\Support\Historial;
use App\Support\PapeleraNoticias;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class NoticiasController extends Controller
{
    public function index(Request $request): Response
    {
        $usuario = $request->user();
        PapeleraNoticias::purgarVencidas();

        $noticias = Noticia::query()
            ->with(['author:id,name,cargo', 'updatedBy:id,name', 'imagenes', 'adjuntos'])
            ->when($usuario->isDocente(), fn ($q) => $q->where('author_id', $usuario->id))
            ->orderByDesc('fiso')
            ->orderByDesc('id')
            ->get()
            ->map(fn (Noticia $n) => $this->paraVista($n, $usuario));

        return Inertia::render('Panel/Noticias', [
            'noticias' => $noticias,
            'categorias' => config('panel.categorias_noticias'),
            'papelera' => Inertia::defer(fn () => $this->papelera($usuario)),
        ]);
    }

    public function store(Request $request)
    {
        $usuario = $request->user();
        $reglas = $this->reglas();
        $datos = $request->validate($reglas);

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

        $this->sincronizarImagenes($noticia, $request);
        $this->sincronizarAdjuntos($noticia, $request);

        Historial::registrar($usuario, 'crear', $noticia, $noticia->titulo);

        return back()->with('ok', 'Noticia creada correctamente.');
    }

    public function update(Request $request, Noticia $noticia)
    {
        $usuario = $request->user();
        $this->autorizarGestion($usuario, $noticia);

        $datos = $request->validate($this->reglas());

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

        $this->sincronizarImagenes($noticia, $request);
        $this->sincronizarAdjuntos($noticia, $request);

        Historial::registrar($usuario, 'editar', $noticia, $noticia->titulo);

        return back()->with('ok', 'Noticia actualizada correctamente.');
    }

    public function destroy(Request $request, Noticia $noticia)
    {
        $usuario = $request->user();
        $this->autorizarGestion($usuario, $noticia);

        $noticia->deleted_by = $usuario->id;
        $noticia->save();
        $noticia->delete();

        Historial::registrar($usuario, 'papelera', $noticia, $noticia->titulo);

        return back()->with('ok', 'Noticia movida a la papelera.');
    }

    public function restaurar(Request $request, Noticia $noticia)
    {
        $usuario = $request->user();
        $this->autorizarEliminada($usuario, $noticia);

        $noticia->restore();
        $noticia->deleted_by = null;
        $noticia->save();

        Historial::registrar($usuario, 'restaurar', $noticia, $noticia->titulo);

        return back()->with('ok', 'Noticia restaurada.');
    }

    public function permanente(Request $request, Noticia $noticia)
    {
        $usuario = $request->user();
        $this->autorizarEliminada($usuario, $noticia);

        PapeleraNoticias::eliminarArchivos($noticia);
        $noticia->forceDelete();

        Historial::registrar($usuario, 'eliminar permanente', $noticia, (string) $noticia->titulo);

        return back()->with('ok', 'Noticia eliminada permanentemente.');
    }

    /** @return array<string, mixed> */
    private function reglas(): array
    {
        return [
            'titulo' => ['required', 'string', 'max:200'],
            'fec' => ['required', 'date'],
            'cat' => ['nullable', 'string', Rule::in(array_keys(config('panel.categorias_noticias')))],
            'res' => ['nullable', 'string', 'min:10'],
            'con' => ['nullable', 'string', 'min:20'],
            'est' => ['required', Rule::in([Noticia::EST_PUBLICADO, Noticia::EST_BORRADOR])],
            'imagenes_plan' => ['nullable', 'string'],
            'imagenes_nuevas' => ['array', 'max:10'],
            'imagenes_nuevas.*' => ['file', 'image', 'max:3072'],
            'adjuntos_plan' => ['nullable', 'string'],
            'adjuntos_nuevas' => ['array'],
            'adjuntos_nuevas.*' => ['file', 'mimetypes:'.implode(',', array_keys(Almacenamiento::adjuntosPermitidos())), 'max:15360'],
        ];
    }

    private function sincronizarImagenes(Noticia $noticia, Request $request): void
    {
        $plan = $this->descifrarPlan($request->input('imagenes_plan'));
        $nuevas = array_values($request->file('imagenes_nuevas', []));

        $cuentaNuevas = count(array_filter($plan, fn ($e) => ($e['tipo'] ?? '') === 'nueva'));

        if ($cuentaNuevas !== count($nuevas)) {
            throw ValidationException::withMessages([
                'imagenes_plan' => 'Los archivos de imagen no coinciden con el orden enviado.',
            ]);
        }

        if (count($plan) > 10) {
            throw ValidationException::withMessages([
                'imagenes_plan' => 'Máximo 10 imágenes por noticia.',
            ]);
        }

        $existentes = collect($plan)
            ->filter(fn ($e) => ($e['tipo'] ?? '') !== 'nueva')
            ->pluck('id');

        $removidas = $noticia->imagenes()->whereNotIn('id', $existentes)->get();
        foreach ($removidas as $imagen) {
            Almacenamiento::eliminar($imagen->ruta);
            $imagen->delete();
        }

        $ref = 0;
        foreach ($plan as $orden => $item) {
            if (($item['tipo'] ?? '') === 'nueva') {
                $archivo = $nuevas[$ref];
                $ruta = Almacenamiento::guardarImagen($archivo);
                if ($ruta === null) {
                    throw ValidationException::withMessages([
                        'imagenes_nuevas' => "El archivo {$archivo->getClientOriginalName()} no es una imagen válida.",
                    ]);
                }
                NoticiaImagen::create([
                    'noticia_id' => $noticia->id,
                    'ruta' => $ruta,
                    'es_portada' => $orden === 0,
                    'orden' => $orden,
                ]);
                $ref++;
            } else {
                $imagen = $noticia->imagenes()->find($item['id']);
                if ($imagen === null) {
                    throw ValidationException::withMessages([
                        'imagenes_plan' => 'La imagen existe en el orden enviado no existe.',
                    ]);
                }
                $imagen->update(['es_portada' => $orden === 0, 'orden' => $orden]);
            }
        }
    }

    private function sincronizarAdjuntos(Noticia $noticia, Request $request): void
    {
        $plan = $this->descifrarPlan($request->input('adjuntos_plan'));
        $nuevas = array_values($request->file('adjuntos_nuevas', []));

        $cuentaNuevas = count(array_filter($plan, fn ($e) => ($e['tipo'] ?? '') === 'nueva'));

        if ($cuentaNuevas !== count($nuevas)) {
            throw ValidationException::withMessages([
                'adjuntos_plan' => 'Los archivos adjuntos no coinciden con el orden enviado.',
            ]);
        }

        $existentes = collect($plan)
            ->filter(fn ($e) => ($e['tipo'] ?? '') !== 'nueva')
            ->pluck('id');

        $removidos = $noticia->adjuntos()->whereNotIn('id', $existentes)->get();
        foreach ($removidos as $adjunto) {
            Almacenamiento::eliminar($adjunto->ruta);
            $adjunto->delete();
        }

        $ref = 0;
        foreach ($plan as $orden => $item) {
            if (($item['tipo'] ?? '') === 'nueva') {
                $archivo = $nuevas[$ref];
                $guardado = Almacenamiento::guardarAdjunto($archivo);
                if ($guardado === null) {
                    throw ValidationException::withMessages([
                        'adjuntos_nuevas' => "El archivo {$archivo->getClientOriginalName()} no es un tipo permitido.",
                    ]);
                }
                Adjunto::create([
                    'noticia_id' => $noticia->id,
                    'nombre' => $archivo->getClientOriginalName(),
                    'ruta' => $guardado['ruta'],
                    'mime' => $guardado['mime'],
                    'peso' => $guardado['peso'],
                    'orden' => $orden,
                ]);
                $ref++;
            } else {
                $adjunto = $noticia->adjuntos()->find($item['id']);
                if ($adjunto === null) {
                    throw ValidationException::withMessages([
                        'adjuntos_plan' => 'Un archivo adjunto del orden enviado ya no existe.',
                    ]);
                }
                $adjunto->update(['orden' => $orden]);
            }
        }
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
        PapeleraNoticias::purgarVencidas();

        return PapeleraNoticias::consultaVisible($usuario)
            ->orderByDesc('deleted_at')
            ->get()
            ->map(function (Noticia $n) use ($usuario) {
                return [
                    ...$this->paraVista($n, $usuario),
                    'eliminada_por' => $n->deletedBy?->name,
                    'dias_restantes' => PapeleraNoticias::diasRestantes($n),
                ];
            })
            ->values()
            ->all();
    }

    /** @return array<string, mixed> */
    private function paraVista(Noticia $n, User $usuario): array
    {
        $puede = $this->puedeGestionar($usuario, $n);

        return [
            'id' => $n->id,
            'titulo' => $n->titulo,
            'slug' => $n->slug,
            'cat' => $n->cat,
            'fec' => $n->fec?->toDateString(),
            'res' => $n->res,
            'est' => $n->est,
            'aut' => $n->aut,
            'imagenes' => $n->imagenes->map(fn (NoticiaImagen $i) => [
                'id' => $i->id,
                'url' => Almacenamiento::url($i->ruta),
                'es_portada' => $i->es_portada,
            ]),
            'adjuntos' => $n->adjuntos->map(fn (Adjunto $a) => [
                'id' => $a->id,
                'nombre' => $a->nombre,
                'peso' => $a->peso,
                'mime' => $a->mime,
            ]),
            'autor' => $n->author
                ? ['name' => $n->author->name, 'cargo' => $n->author->cargo]
                : ['name' => $n->aut ?? '—', 'cargo' => null],
            'modificado_por' => $n->updatedBy ? ['name' => $n->updatedBy->name] : null,
            'puede_editar' => $puede,
            'puede_eliminar' => $puede,
        ];
    }

    private function puedeGestionar(User $usuario, Noticia $noticia): bool
    {
        return ! $usuario->isDocente() || $noticia->author_id === $usuario->id;
    }

    private function autorizarGestion(User $usuario, Noticia $noticia): void
    {
        if (! $this->puedeGestionar($usuario, $noticia)) {
            abort(403, 'Solo puedes gestionar tus propias noticias.');
        }
    }

    private function autorizarEliminada(User $usuario, Noticia $noticia): void
    {
        if (! PapeleraNoticias::puedeGestionarEliminada($usuario, $noticia)) {
            abort(403, 'No puedes gestionar esta noticia de la papelera.');
        }
    }
}

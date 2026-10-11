<?php

namespace App\Http\Controllers\Panel;

use App\Http\Controllers\Controller;
use App\Models\Documento;
use App\Models\DocumentoCategoria;
use App\Models\User;
use App\Support\ArchivosDocumentos;
use App\Support\Historial;
use App\Support\PapeleraDocumentos;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class DocumentosController extends Controller
{
    private const MAX_KB = 20480;

    public function index(Request $request): Response
    {
        $usuario = $request->user();
        PapeleraDocumentos::purgarVencidasSiCorresponde();

        $documentos = Documento::query()
            ->with(['author:id,name,cargo'])
            ->when($usuario->isDocente(), fn ($q) => $q->where('author_id', $usuario->id))
            ->orderByDesc('id')
            ->get()
            ->map(fn (Documento $d) => $this->paraVista($d, $usuario));

        $conteos = Documento::query()
            ->selectRaw('categoria, count(*) as total')
            ->groupBy('categoria')
            ->pluck('total', 'categoria');

        $categorias = DocumentoCategoria::query()
            ->orderBy('orden')
            ->orderBy('id')
            ->get()
            ->map(fn (DocumentoCategoria $c) => [
                'id' => $c->id,
                'nombre' => $c->nombre,
                'orden' => $c->orden,
                'total' => (int) ($conteos[$c->nombre] ?? 0),
            ]);

        return Inertia::render('Panel/Documentos', [
            'documentos' => $documentos,
            'categorias' => $categorias,
            'visibilidades' => config('panel.visibilidades_documentos'),
            'papelera' => Inertia::defer(fn () => $this->papelera($usuario)),
        ]);
    }

    public function store(Request $request)
    {
        $usuario = $request->user();
        $datos = $request->validate($this->reglas());

        $archivo = $request->file('archivo');

        if (! $archivo->isValid()) {
            throw ValidationException::withMessages([
                'archivo' => 'El archivo no se pudo subir correctamente. Inténtalo de nuevo.',
            ]);
        }

        $guardado = ArchivosDocumentos::guardar($archivo, $datos['visibilidad']);

        if ($guardado === null) {
            throw ValidationException::withMessages([
                'archivo' => 'El archivo no es un tipo permitido (PDF, Word, Excel o PowerPoint).',
            ]);
        }

        $documento = Documento::create([
            'titulo' => trim($datos['titulo']),
            'categoria' => $datos['categoria'],
            'visibilidad' => $datos['visibilidad'],
            'descripcion' => trim((string) ($datos['descripcion'] ?? '')) ?: null,
            'instrucciones' => trim((string) ($datos['instrucciones'] ?? '')) ?: null,
            'archivo_url' => $guardado['ruta'],
            'archivo_nombre' => $archivo->getClientOriginalName(),
            'author_id' => $usuario->id,
            'created_by' => $usuario->id,
        ]);

        Historial::registrar($usuario, 'crear', $documento, $documento->titulo);

        return back()->with('ok', 'Documento registrado correctamente.');
    }

    public function update(Request $request, Documento $documento)
    {
        $usuario = $request->user();
        $this->autorizarGestion($usuario, $documento);

        $datos = $request->validate($this->reglas(true));

        $cambios = [
            'titulo' => trim($datos['titulo']),
            'categoria' => $datos['categoria'],
            'visibilidad' => $datos['visibilidad'],
            'descripcion' => trim((string) ($datos['descripcion'] ?? '')) ?: null,
            'instrucciones' => trim((string) ($datos['instrucciones'] ?? '')) ?: null,
        ];

        if ($request->hasFile('archivo')) {
            $archivo = $request->file('archivo');

            if (! $archivo->isValid()) {
                throw ValidationException::withMessages([
                    'archivo' => 'El archivo no se pudo subir correctamente. Inténtalo de nuevo.',
                ]);
            }

            $guardado = ArchivosDocumentos::guardar($archivo, $datos['visibilidad']);

            if ($guardado === null) {
                throw ValidationException::withMessages([
                    'archivo' => 'El archivo no es un tipo permitido (PDF, Word, Excel o PowerPoint).',
                ]);
            }

            ArchivosDocumentos::eliminar($documento->archivo_url, $documento->visibilidad);
            $cambios['archivo_url'] = $guardado['ruta'];
            $cambios['archivo_nombre'] = $archivo->getClientOriginalName();
        } elseif ($datos['visibilidad'] !== $documento->visibilidad) {
            $cambios['archivo_url'] = ArchivosDocumentos::mover(
                $documento->archivo_url,
                $documento->visibilidad,
                $datos['visibilidad'],
            );
        }

        $documento->update($cambios);

        Historial::registrar($usuario, 'editar', $documento, $documento->titulo);

        return back()->with('ok', 'Documento actualizado correctamente.');
    }

    public function destroy(Request $request, Documento $documento)
    {
        $usuario = $request->user();
        $this->autorizarGestion($usuario, $documento);

        $documento->deleted_by = $usuario->id;
        $documento->save();
        $documento->delete();

        Historial::registrar($usuario, 'papelera', $documento, $documento->titulo);

        return back()->with('ok', 'Documento movido a la papelera.');
    }

    public function restaurar(Request $request, Documento $documento)
    {
        $usuario = $request->user();
        $this->autorizarEliminada($usuario, $documento);

        $documento->restore();
        $documento->deleted_by = null;
        $documento->save();

        Historial::registrar($usuario, 'restaurar', $documento, $documento->titulo);

        return back()->with('ok', 'Documento restaurado.');
    }

    public function permanente(Request $request, Documento $documento)
    {
        $usuario = $request->user();

        if (! $usuario->isSuperUsuario()) {
            abort(403, 'Solo el Super Usuario puede eliminar documentos permanentemente.');
        }

        ArchivosDocumentos::eliminar($documento->archivo_url, $documento->visibilidad);
        $documento->forceDelete();

        Historial::registrar($usuario, 'eliminar permanente', $documento, (string) $documento->titulo);

        return back()->with('ok', 'Documento eliminado permanentemente.');
    }

    public function descargar(Request $request, Documento $documento)
    {
        $ruta = $documento->archivo_url;
        $disco = ArchivosDocumentos::disco($documento->visibilidad);

        abort_if($ruta === null || $ruta === '' || ! Storage::disk($disco)->exists($ruta), 404);

        return Storage::disk($disco)->download($ruta, $documento->archivo_nombre ?: basename($ruta));
    }

    /** @return array<string, mixed> */
    private function reglas(bool $actualizar = false): array
    {
        return [
            'titulo' => ['required', 'string', 'max:200'],
            'categoria' => ['required', 'string', Rule::exists('documento_categorias', 'nombre')],
            'visibilidad' => ['required', Rule::in([
                Documento::VISIBILIDAD_PUBLICO,
                Documento::VISIBILIDAD_PRIVADO,
            ])],
            'descripcion' => ['nullable', 'string', 'max:1000'],
            'instrucciones' => ['nullable', 'string', 'max:2000'],
            'archivo' => [
                $actualizar ? 'nullable' : 'required',
                'file',
                'mimes:'.implode(',', ArchivosDocumentos::extensiones()),
                'max:'.self::MAX_KB,
            ],
        ];
    }

    /** @return array<int, array<string, mixed>> */
    private function papelera(User $usuario): array
    {
        PapeleraDocumentos::purgarVencidasSiCorresponde();

        return PapeleraDocumentos::consultaVisible($usuario)
            ->orderByDesc('deleted_at')
            ->get()
            ->map(function (Documento $d) use ($usuario) {
                return [
                    ...$this->paraVista($d, $usuario),
                    'eliminada_por' => $d->deletedBy?->name,
                    'dias_restantes' => PapeleraDocumentos::diasRestantes($d),
                    'puede_restaurar' => PapeleraDocumentos::puedeGestionarEliminada($usuario, $d),
                    'puede_permanente' => $usuario->isSuperUsuario(),
                ];
            })
            ->values()
            ->all();
    }

    /** @return array<string, mixed> */
    private function paraVista(Documento $d, User $usuario): array
    {
        $puede = $this->puedeGestionar($usuario, $d);

        return [
            'id' => $d->id,
            'titulo' => $d->titulo,
            'categoria' => $d->categoria,
            'visibilidad' => $d->visibilidad,
            'descripcion' => $d->descripcion,
            'instrucciones' => $d->instrucciones,
            'archivo' => [
                'nombre' => $d->archivo_nombre,
                'url' => ArchivosDocumentos::url($d),
            ],
            'autor' => $d->author
                ? ['name' => $d->author->name, 'cargo' => $d->author->cargo]
                : ['name' => '—', 'cargo' => null],
            'puede_editar' => $puede,
            'puede_eliminar' => $puede,
        ];
    }

    private function puedeGestionar(User $usuario, Documento $documento): bool
    {
        return ! $usuario->isDocente() || $documento->author_id === $usuario->id;
    }

    private function autorizarGestion(User $usuario, Documento $documento): void
    {
        if (! $this->puedeGestionar($usuario, $documento)) {
            abort(403, 'Solo puedes gestionar tus propios documentos.');
        }
    }

    private function autorizarEliminada(User $usuario, Documento $documento): void
    {
        if (! PapeleraDocumentos::puedeGestionarEliminada($usuario, $documento)) {
            abort(403, 'No puedes gestionar este documento de la papelera.');
        }
    }
}

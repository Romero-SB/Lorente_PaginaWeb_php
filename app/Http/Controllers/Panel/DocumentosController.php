<?php

namespace App\Http\Controllers\Panel;

use App\Http\Controllers\Controller;
use App\Http\Requests\Panel\StoreDocumentoRequest;
use App\Http\Requests\Panel\UpdateDocumentoRequest;
use App\Http\Resources\DocumentoResource;
use App\Models\Documento;
use App\Models\DocumentoCategoria;
use App\Models\User;
use App\Support\ArchivosDocumentos;
use App\Support\Historial;
use App\Support\PapeleraDocumentos;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class DocumentosController extends Controller
{
    public function index(Request $request): Response
    {
        $usuario = $request->user();
        PapeleraDocumentos::purgarVencidasSiCorresponde();

        $documentos = Documento::query()
            ->select(['id', 'titulo', 'categoria', 'visibilidad', 'descripcion', 'instrucciones', 'archivo_url', 'archivo_nombre', 'author_id'])
            ->with(['author:id,name,cargo'])
            ->when($usuario->isDocente(), fn ($q) => $q->where('author_id', $usuario->id))
            ->orderByDesc('id')
            ->get()
            ->map(fn (Documento $d) => (new DocumentoResource($d))->resolve($request))
            ->values()
            ->all();

        $conteos = Documento::query()
            ->selectRaw('categoria, count(*) as total')
            ->groupBy('categoria')
            ->pluck('total', 'categoria');

        $categorias = DocumentoCategoria::query()
            ->select(['id', 'nombre', 'orden'])
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

    public function store(StoreDocumentoRequest $request, Historial $historial)
    {
        $usuario = $request->user();
        $datos = $request->validated();

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
            'categoria_id' => DocumentoCategoria::where('nombre', $datos['categoria'])->value('id'),
            'visibilidad' => $datos['visibilidad'],
            'descripcion' => trim((string) ($datos['descripcion'] ?? '')) ?: null,
            'instrucciones' => trim((string) ($datos['instrucciones'] ?? '')) ?: null,
            'archivo_url' => $guardado['ruta'],
            'archivo_nombre' => $archivo->getClientOriginalName(),
            'author_id' => $usuario->id,
            'created_by' => $usuario->id,
        ]);

        $historial->registrar($usuario, 'crear', $documento, $documento->titulo);

        return back()->with('ok', 'Documento registrado correctamente.');
    }

    public function update(UpdateDocumentoRequest $request, Documento $documento, Historial $historial)
    {
        $this->authorize('gestionar', $documento);

        $usuario = $request->user();

        $datos = $request->validated();

        $cambios = [
            'titulo' => trim($datos['titulo']),
            'categoria' => $datos['categoria'],
            'categoria_id' => DocumentoCategoria::where('nombre', $datos['categoria'])->value('id'),
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

        $historial->registrar($usuario, 'editar', $documento, $documento->titulo);

        return back()->with('ok', 'Documento actualizado correctamente.');
    }

    public function destroy(Request $request, Documento $documento, Historial $historial)
    {
        $this->authorize('gestionar', $documento);

        $usuario = $request->user();

        $documento->deleted_by = $usuario->id;
        $documento->save();
        $documento->delete();

        $historial->registrar($usuario, 'papelera', $documento, $documento->titulo);

        return back()->with('ok', 'Documento movido a la papelera.');
    }

    public function restaurar(Request $request, Documento $documento, Historial $historial)
    {
        $this->authorize('gestionarEliminada', $documento);

        $usuario = $request->user();

        $documento->restore();
        $documento->deleted_by = null;
        $documento->save();

        $historial->registrar($usuario, 'restaurar', $documento, $documento->titulo);

        return back()->with('ok', 'Documento restaurado.');
    }

    public function permanente(Request $request, Documento $documento, Historial $historial)
    {
        $this->authorize('eliminarPermanente', Documento::class);

        $usuario = $request->user();

        ArchivosDocumentos::eliminar($documento->archivo_url, $documento->visibilidad);
        $documento->forceDelete();

        $historial->registrar($usuario, 'eliminar permanente', $documento, (string) $documento->titulo);

        return back()->with('ok', 'Documento eliminado permanentemente.');
    }

    public function descargar(Request $request, Documento $documento)
    {
        $ruta = $documento->archivo_url;
        $disco = ArchivosDocumentos::disco($documento->visibilidad);

        abort_if($ruta === null || $ruta === '' || ! Storage::disk($disco)->exists($ruta), 404);

        return Storage::disk($disco)->download($ruta, $documento->archivo_nombre ?: basename($ruta));
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
                    ...(new DocumentoResource($d))->resolve(),
                    'eliminada_por' => $d->deletedBy?->name,
                    'dias_restantes' => PapeleraDocumentos::diasRestantes($d),
                    'puede_restaurar' => PapeleraDocumentos::puedeGestionarEliminada($usuario, $d),
                    'puede_permanente' => $usuario->isSuperUsuario(),
                ];
            })
            ->values()
            ->all();
    }
}

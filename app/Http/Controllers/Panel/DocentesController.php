<?php

namespace App\Http\Controllers\Panel;

use App\Http\Controllers\Controller;
use App\Http\Requests\Panel\ReordenarDocentesRequest;
use App\Http\Requests\Panel\StoreDocenteRequest;
use App\Http\Requests\Panel\UpdateDocenteRequest;
use App\Http\Resources\DocenteResource;
use App\Models\Docente;
use App\Models\DocenteCategoria;
use App\Models\User;
use App\Support\Almacenamiento;
use App\Support\Historial;
use App\Support\PapeleraDocentes;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DocentesController extends Controller
{
    public function index(Request $request): Response
    {
        $usuario = $request->user();
        PapeleraDocentes::purgarVencidasSiCorresponde();

        $docentes = Docente::query()
            ->select(['id', 'nombre', 'cargo', 'categoria', 'orden', 'activo', 'foto'])
            ->orderBy('orden')
            ->orderBy('id')
            ->get()
            ->map(fn (Docente $d) => (new DocenteResource($d))->resolve($request))
            ->values()
            ->all();

        $conteos = Docente::query()
            ->selectRaw('categoria, count(*) as total')
            ->groupBy('categoria')
            ->pluck('total', 'categoria');

        $categorias = DocenteCategoria::query()
            ->select(['id', 'nombre', 'orden', 'estilo'])
            ->orderBy('orden')
            ->orderBy('id')
            ->get()
            ->map(fn (DocenteCategoria $c) => [
                'id' => $c->id,
                'nombre' => $c->nombre,
                'orden' => $c->orden,
                'total' => (int) ($conteos[$c->nombre] ?? 0),
                'estilo' => $c->estilo,
            ]);

        return Inertia::render('Panel/Docentes', [
            'docentes' => $docentes,
            'categorias' => $categorias,
            'papelera' => Inertia::defer(fn () => $this->papelera($usuario)),
        ]);
    }

    public function store(StoreDocenteRequest $request, Historial $historial)
    {
        $usuario = $request->user();

        $datos = $request->validated();

        $ruta = Almacenamiento::guardarImagen($request->file('foto'), 'docentes');

        if ($ruta === null) {
            return back()->withErrors(['foto' => 'La imagen no es un formato válido (jpg, png, webp o gif).']);
        }

        $maxOrden = (int) Docente::where('categoria', $datos['categoria'])->max('orden');
        $categoriaId = DocenteCategoria::where('nombre', $datos['categoria'])->value('id');

        $docente = Docente::create([
            'nombre' => trim($datos['nombre']),
            'cargo' => trim($datos['cargo']),
            'categoria' => $datos['categoria'],
            'categoria_id' => $categoriaId,
            'foto' => $ruta,
            'orden' => $maxOrden + 10,
            'activo' => true,
            'created_by' => $usuario->id,
        ]);

        $historial->registrar($usuario, 'crear', $docente, $docente->nombre);

        return back()->with('ok', 'Docente registrado correctamente.');
    }

    public function update(UpdateDocenteRequest $request, Docente $docente, Historial $historial)
    {
        $this->authorize('gestionar', Docente::class);

        $usuario = $request->user();

        $datos = $request->validated();

        $cambios = [
            'nombre' => trim($datos['nombre']),
            'cargo' => trim($datos['cargo']),
            'categoria' => $datos['categoria'],
            'categoria_id' => DocenteCategoria::where('nombre', $datos['categoria'])->value('id'),
        ];

        if ($request->boolean('foto_borrar')) {
            Almacenamiento::eliminar($docente->foto);
            $cambios['foto'] = null;
        } elseif ($request->hasFile('foto')) {
            $ruta = Almacenamiento::guardarImagen($request->file('foto'), 'docentes');
            if ($ruta === null) {
                return back()->withErrors(['foto' => 'La imagen no es un formato válido (jpg, png, webp o gif).']);
            }
            Almacenamiento::eliminar($docente->foto);
            $cambios['foto'] = $ruta;
        }

        $docente->update($cambios);

        $historial->registrar($usuario, 'editar', $docente, $docente->nombre);

        return back()->with('ok', 'Docente actualizado correctamente.');
    }

    public function destroy(Request $request, Docente $docente, Historial $historial)
    {
        $this->authorize('gestionar', Docente::class);

        $usuario = $request->user();

        $docente->deleted_by = $usuario->id;
        $docente->save();
        $docente->delete();

        $historial->registrar($usuario, 'papelera', $docente, $docente->nombre);

        return back()->with('ok', 'Docente movido a la papelera.');
    }

    public function restaurar(Request $request, Docente $docente, Historial $historial)
    {
        $this->authorize('gestionarEliminada', $docente);

        $usuario = $request->user();

        $docente->restore();
        $docente->deleted_by = null;
        $docente->save();

        $historial->registrar($usuario, 'restaurar', $docente, $docente->nombre);

        return back()->with('ok', 'Docente restaurado.');
    }

    public function permanente(Request $request, Docente $docente, Historial $historial)
    {
        $this->authorize('eliminarPermanente', Docente::class);

        $usuario = $request->user();

        Almacenamiento::eliminar($docente->foto);
        $docente->forceDelete();

        $historial->registrar($usuario, 'eliminar permanente', $docente, (string) $docente->nombre);

        return back()->with('ok', 'Docente eliminado permanentemente.');
    }

    public function reordenar(ReordenarDocentesRequest $request)
    {
        $datos = $request->validated();

        foreach ($datos['items'] as $item) {
            Docente::where('id', $item['id'])->update(['orden' => $item['orden']]);
        }

        return back();
    }

    /** @return array<int, array<string, mixed>> */
    private function papelera(User $usuario): array
    {
        PapeleraDocentes::purgarVencidasSiCorresponde();

        return PapeleraDocentes::consultaVisible($usuario)
            ->orderByDesc('deleted_at')
            ->get()
            ->map(function (Docente $d) use ($usuario) {
                return [
                    ...(new DocenteResource($d))->resolve(),
                    'eliminada_por' => $d->deletedBy?->name,
                    'dias_restantes' => PapeleraDocentes::diasRestantes($d),
                    'puede_restaurar' => PapeleraDocentes::puedeGestionarEliminada($usuario, $d),
                    'puede_permanente' => $usuario->isSuperUsuario(),
                ];
            })
            ->values()
            ->all();
    }
}

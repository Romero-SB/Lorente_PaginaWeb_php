<?php

namespace App\Http\Controllers\Panel;

use App\Http\Controllers\Controller;
use App\Models\Docente;
use App\Models\DocenteCategoria;
use App\Models\User;
use App\Support\Almacenamiento;
use App\Support\Historial;
use App\Support\PapeleraDocentes;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class DocentesController extends Controller
{
    public function index(Request $request): Response
    {
        $usuario = $request->user();
        PapeleraDocentes::purgarVencidas();

        $docentes = Docente::query()
            ->orderBy('orden')
            ->orderBy('id')
            ->get()
            ->map(fn (Docente $d) => $this->paraVista($d));

        $conteos = Docente::query()
            ->selectRaw('categoria, count(*) as total')
            ->groupBy('categoria')
            ->pluck('total', 'categoria');

        $categorias = DocenteCategoria::query()
            ->orderBy('orden')
            ->orderBy('id')
            ->get()
            ->map(fn (DocenteCategoria $c) => [
                'id' => $c->id,
                'nombre' => $c->nombre,
                'orden' => $c->orden,
                'total' => (int) ($conteos[$c->nombre] ?? 0),
            ]);

        return Inertia::render('Panel/Docentes', [
            'docentes' => $docentes,
            'categorias' => $categorias,
            'papelera' => Inertia::defer(fn () => $this->papelera($usuario)),
        ]);
    }

    public function store(Request $request)
    {
        $usuario = $request->user();

        $datos = $request->validate([
            'nombre' => ['required', 'string', 'max:200'],
            'cargo' => ['required', 'string', 'max:200'],
            'categoria' => ['required', 'string', Rule::exists('docente_categorias', 'nombre')],
            'foto' => ['required', 'file', 'image', 'max:3072'],
        ]);

        $ruta = Almacenamiento::guardarImagen($request->file('foto'), 'docentes');

        if ($ruta === null) {
            return back()->withErrors(['foto' => 'La imagen no es un formato válido (jpg, png, webp o gif).']);
        }

        $maxOrden = (int) Docente::where('categoria', $datos['categoria'])->max('orden');

        $docente = Docente::create([
            'nombre' => trim($datos['nombre']),
            'cargo' => trim($datos['cargo']),
            'categoria' => $datos['categoria'],
            'foto' => $ruta,
            'orden' => $maxOrden + 10,
            'activo' => true,
            'created_by' => $usuario->id,
        ]);

        Historial::registrar($usuario, 'crear', $docente, $docente->nombre);

        return back()->with('ok', 'Docente registrado correctamente.');
    }

    public function update(Request $request, Docente $docente)
    {
        $usuario = $request->user();

        $datos = $request->validate([
            'nombre' => ['required', 'string', 'max:200'],
            'cargo' => ['required', 'string', 'max:200'],
            'categoria' => ['required', 'string', Rule::exists('docente_categorias', 'nombre')],
            'foto' => ['nullable', 'file', 'image', 'max:3072'],
            'foto_borrar' => ['nullable', 'boolean'],
        ]);

        $cambios = [
            'nombre' => trim($datos['nombre']),
            'cargo' => trim($datos['cargo']),
            'categoria' => $datos['categoria'],
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

        Historial::registrar($usuario, 'editar', $docente, $docente->nombre);

        return back()->with('ok', 'Docente actualizado correctamente.');
    }

    public function destroy(Request $request, Docente $docente)
    {
        $usuario = $request->user();

        $docente->deleted_by = $usuario->id;
        $docente->save();
        $docente->delete();

        Historial::registrar($usuario, 'papelera', $docente, $docente->nombre);

        return back()->with('ok', 'Docente movido a la papelera.');
    }

    public function restaurar(Request $request, Docente $docente)
    {
        $usuario = $request->user();
        $this->autorizarEliminada($usuario, $docente);

        $docente->restore();
        $docente->deleted_by = null;
        $docente->save();

        Historial::registrar($usuario, 'restaurar', $docente, $docente->nombre);

        return back()->with('ok', 'Docente restaurado.');
    }

    public function permanente(Request $request, Docente $docente)
    {
        $usuario = $request->user();

        if (! $usuario->isSuperUsuario()) {
            abort(403, 'Solo el Super Usuario puede eliminar docentes permanentemente.');
        }

        Almacenamiento::eliminar($docente->foto);
        $docente->forceDelete();

        Historial::registrar($usuario, 'eliminar permanente', $docente, (string) $docente->nombre);

        return back()->with('ok', 'Docente eliminado permanentemente.');
    }

    public function reordenar(Request $request)
    {
        $datos = $request->validate([
            'items' => ['required', 'array'],
            'items.*.id' => ['required', 'integer'],
            'items.*.orden' => ['required', 'integer'],
        ]);

        foreach ($datos['items'] as $item) {
            Docente::where('id', $item['id'])->update(['orden' => $item['orden']]);
        }

        return back();
    }

    /** @return array<int, array<string, mixed>> */
    private function papelera(User $usuario): array
    {
        PapeleraDocentes::purgarVencidas();

        return PapeleraDocentes::consultaVisible($usuario)
            ->orderByDesc('deleted_at')
            ->get()
            ->map(function (Docente $d) use ($usuario) {
                return [
                    ...$this->paraVista($d),
                    'eliminada_por' => $d->deletedBy?->name,
                    'dias_restantes' => PapeleraDocentes::diasRestantes($d),
                    'puede_restaurar' => PapeleraDocentes::puedeGestionarEliminada($usuario, $d),
                    'puede_permanente' => $usuario->isSuperUsuario(),
                ];
            })
            ->values()
            ->all();
    }

    /** @return array<string, mixed> */
    private function paraVista(Docente $d): array
    {
        return [
            'id' => $d->id,
            'nombre' => $d->nombre,
            'cargo' => $d->cargo,
            'categoria' => $d->categoria,
            'orden' => $d->orden,
            'activo' => $d->activo,
            'foto' => $d->foto ? Almacenamiento::url($d->foto) : null,
        ];
    }

    private function autorizarEliminada(User $usuario, Docente $docente): void
    {
        if (! PapeleraDocentes::puedeGestionarEliminada($usuario, $docente)) {
            abort(403, 'No puedes gestionar este docente de la papelera.');
        }
    }
}

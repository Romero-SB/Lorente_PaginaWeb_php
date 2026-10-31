<?php

namespace App\Http\Controllers\Panel;

use App\Http\Controllers\Controller;
use App\Http\Requests\Panel\HistoriaHitoRequest;
use App\Http\Requests\Panel\ReordenarHistoriaRequest;
use App\Models\HistoriaHito;
use App\Support\Historial;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class HistoriaController extends Controller
{
    public function store(HistoriaHitoRequest $request, Historial $historial): RedirectResponse
    {
        $usuario = $request->user();
        $datos = $request->validated();

        $maxOrden = (int) HistoriaHito::query()->max('orden');

        $hito = HistoriaHito::create([
            'anio' => trim($datos['anio']),
            'titulo' => trim($datos['titulo']),
            'texto' => trim($datos['texto']),
            'orden' => $datos['orden'] ?? $maxOrden + 10,
        ]);

        $historial->registrar($usuario, 'crear', $hito, $hito->titulo);

        return back()->with('ok', 'Hito agregado a Nuestra Historia.');
    }

    public function update(HistoriaHitoRequest $request, HistoriaHito $hito, Historial $historial): RedirectResponse
    {
        $usuario = $request->user();
        $datos = $request->validated();

        $hito->fill([
            'anio' => trim($datos['anio']),
            'titulo' => trim($datos['titulo']),
            'texto' => trim($datos['texto']),
        ]);

        if (array_key_exists('orden', $datos) && $datos['orden'] !== null) {
            $hito->orden = $datos['orden'];
        }

        $hito->save();

        $historial->registrar($usuario, 'editar', $hito, $hito->titulo);

        return back()->with('ok', 'Hito actualizado correctamente.');
    }

    public function destroy(Request $request, HistoriaHito $hito, Historial $historial): RedirectResponse
    {
        $historial->registrar($request->user(), 'eliminar', $hito, $hito->titulo);

        $hito->delete();

        return back()->with('ok', 'Hito eliminado de Nuestra Historia.');
    }

    public function reordenar(ReordenarHistoriaRequest $request): RedirectResponse
    {
        /** @var array<int, array{id: int, orden: int}> $items */
        $items = $request->validated('items');

        DB::transaction(function () use ($items): void {
            foreach ($items as $item) {
                HistoriaHito::query()
                    ->find($item['id'])
                    ?->update(['orden' => $item['orden']]);
            }
        });

        return back()->with('ok', 'Orden actualizado.');
    }
}

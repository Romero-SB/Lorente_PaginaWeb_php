<?php

namespace App\Http\Controllers\Panel;

use App\Http\Controllers\Controller;
use App\Http\Requests\Panel\EstiloHistoriaHitoRequest;
use App\Http\Requests\Panel\HistoriaHitoRequest;
use App\Models\HistoriaHito;
use App\Support\Historial;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class HistoriaController extends Controller
{
    public function store(HistoriaHitoRequest $request, Historial $historial): RedirectResponse
    {
        $usuario = $request->user();
        $datos = $request->validated();

        $hito = HistoriaHito::create([
            'anio' => trim($datos['anio']),
            'titulo' => trim($datos['titulo']),
            'texto' => trim($datos['texto']),
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

    public function estilo(EstiloHistoriaHitoRequest $request, HistoriaHito $hito, Historial $historial): RedirectResponse
    {
        $datos = $request->validated();

        $estilo = collect($datos)
            ->map(fn ($valor) => is_string($valor) ? trim($valor) : $valor)
            ->filter(fn ($valor) => $valor !== null && $valor !== '')
            ->map(fn ($valor) => str_starts_with($valor, '#') ? strtolower($valor) : $valor)
            ->all();

        $hito->update(['estilo' => $estilo === [] ? null : $estilo]);

        $historial->registrar($request->user(), 'editar', $hito, 'Estilo: '.$hito->titulo);

        return back()->with('ok', 'Estilo del hito actualizado.');
    }
}

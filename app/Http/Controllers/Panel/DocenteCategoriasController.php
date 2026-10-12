<?php

namespace App\Http\Controllers\Panel;

use App\Http\Controllers\Controller;
use App\Http\Requests\Panel\DocenteCategoriaRequest;
use App\Http\Requests\Panel\EstiloDocenteCategoriaRequest;
use App\Http\Requests\Panel\ReordenarCategoriasRequest;
use App\Models\Docente;
use App\Models\DocenteCategoria;

class DocenteCategoriasController extends Controller
{
    public function store(DocenteCategoriaRequest $request)
    {
        $datos = $request->validated();

        $maxOrden = (int) DocenteCategoria::max('orden');

        $categoria = DocenteCategoria::create([
            'nombre' => trim($datos['nombre']),
            'orden' => $maxOrden + 10,
        ]);

        return back()->with('ok', "Categoría \"{$categoria->nombre}\" creada.");
    }

    public function update(DocenteCategoriaRequest $request, DocenteCategoria $categoria)
    {
        $datos = $request->validated();

        $anterior = $categoria->nombre;
        $nuevo = trim($datos['nombre']);

        $categoria->update(['nombre' => $nuevo]);

        Docente::where('categoria', $anterior)->update(['categoria' => $nuevo]);

        return back()->with('ok', "Categoría renombrada a \"{$nuevo}\".");
    }

    public function destroy(DocenteCategoria $categoria)
    {
        $docentes = Docente::where('categoria', $categoria->nombre)->pluck('nombre');

        if ($docentes->isNotEmpty()) {
            return back()->withErrors([
                'categoria' => "No se puede eliminar \"{$categoria->nombre}\" porque tiene docentes asociados. Elimínalos primero.",
                'docentes' => $docentes->all(),
            ]);
        }

        $categoria->delete();

        return back()->with('ok', "Categoría \"{$categoria->nombre}\" eliminada.");
    }

    public function reordenar(ReordenarCategoriasRequest $request)
    {
        $datos = $request->validated();

        foreach ($datos['categorias'] as $i => $nombre) {
            DocenteCategoria::where('nombre', $nombre)->update(['orden' => ($i + 1) * 10]);
        }

        return back();
    }

    public function estilo(EstiloDocenteCategoriaRequest $request, DocenteCategoria $categoria)
    {
        $datos = $request->validated();

        $estilo = collect($datos)
            ->map(fn ($valor) => is_string($valor) ? trim($valor) : $valor)
            ->filter(fn ($valor) => $valor !== null && $valor !== '')
            ->map(fn ($valor) => str_starts_with($valor, '#') ? strtolower($valor) : $valor)
            ->all();

        $categoria->update(['estilo' => $estilo === [] ? null : $estilo]);

        return back()->with('ok', "Estilo de \"{$categoria->nombre}\" actualizado.");
    }
}

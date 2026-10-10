<?php

namespace App\Http\Controllers\Panel;

use App\Http\Controllers\Controller;
use App\Models\Docente;
use App\Models\DocenteCategoria;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class DocenteCategoriasController extends Controller
{
    public function store(Request $request)
    {
        $datos = $request->validate([
            'nombre' => ['required', 'string', 'max:100', Rule::unique('docente_categorias', 'nombre')],
        ]);

        $maxOrden = (int) DocenteCategoria::max('orden');

        $categoria = DocenteCategoria::create([
            'nombre' => trim($datos['nombre']),
            'orden' => $maxOrden + 10,
        ]);

        return back()->with('ok', "Categoría \"{$categoria->nombre}\" creada.");
    }

    public function update(Request $request, DocenteCategoria $categoria)
    {
        $datos = $request->validate([
            'nombre' => ['required', 'string', 'max:100', Rule::unique('docente_categorias', 'nombre')->ignore($categoria->id)],
        ]);

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

    public function reordenar(Request $request)
    {
        $datos = $request->validate([
            'categorias' => ['required', 'array'],
            'categorias.*' => ['required', 'string'],
        ]);

        foreach ($datos['categorias'] as $i => $nombre) {
            DocenteCategoria::where('nombre', $nombre)->update(['orden' => ($i + 1) * 10]);
        }

        return back();
    }
}

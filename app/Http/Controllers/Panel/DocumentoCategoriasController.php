<?php

namespace App\Http\Controllers\Panel;

use App\Http\Controllers\Controller;
use App\Http\Requests\Panel\DocumentoCategoriaRequest;
use App\Http\Requests\Panel\ReordenarCategoriasRequest;
use App\Models\Documento;
use App\Models\DocumentoCategoria;

class DocumentoCategoriasController extends Controller
{
    public function store(DocumentoCategoriaRequest $request)
    {
        $datos = $request->validated();

        $maxOrden = (int) DocumentoCategoria::max('orden');

        $categoria = DocumentoCategoria::create([
            'nombre' => trim($datos['nombre']),
            'orden' => $maxOrden + 10,
        ]);

        return back()->with('ok', "Categoría \"{$categoria->nombre}\" creada.");
    }

    public function update(DocumentoCategoriaRequest $request, DocumentoCategoria $categoria)
    {
        $datos = $request->validated();

        $anterior = $categoria->nombre;
        $nuevo = trim($datos['nombre']);

        $categoria->update(['nombre' => $nuevo]);

        Documento::where('categoria', $anterior)->update(['categoria' => $nuevo]);

        return back()->with('ok', "Categoría renombrada a \"{$nuevo}\".");
    }

    public function destroy(DocumentoCategoria $categoria)
    {
        $documentos = Documento::where('categoria', $categoria->nombre)->pluck('titulo');

        if ($documentos->isNotEmpty()) {
            return back()->withErrors([
                'categoria' => "No se puede eliminar \"{$categoria->nombre}\" porque tiene documentos asociados. Elimínalos primero.",
                'documentos' => $documentos->all(),
            ]);
        }

        $categoria->delete();

        return back()->with('ok', "Categoría \"{$categoria->nombre}\" eliminada.");
    }

    public function reordenar(ReordenarCategoriasRequest $request)
    {
        $datos = $request->validated();

        foreach ($datos['categorias'] as $i => $nombre) {
            DocumentoCategoria::where('nombre', $nombre)->update(['orden' => ($i + 1) * 10]);
        }

        return back();
    }
}

<?php

namespace App\Http\Controllers\Sitio;

use App\Http\Controllers\Controller;
use App\Models\Documento;
use App\Support\ArchivosDocumentos;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DocumentoController extends Controller
{
    public function descargar(Request $request, Documento $documento)
    {
        $ruta = $documento->archivo_url;
        $disco = ArchivosDocumentos::disco($documento->visibilidad);

        abort_if($ruta === null || $ruta === '' || ! Storage::disk($disco)->exists($ruta), 404);

        return Storage::disk($disco)->download($ruta, $documento->archivo_nombre ?: basename($ruta));
    }
}

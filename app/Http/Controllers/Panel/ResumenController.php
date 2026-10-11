<?php

namespace App\Http\Controllers\Panel;

use App\Http\Controllers\Controller;
use App\Models\ContactoMensaje;
use App\Models\Docente;
use App\Models\Documento;
use App\Models\Noticia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class ResumenController extends Controller
{
    public function index(Request $request): Response
    {
        $usuario = $request->user();

        $conteos = Cache::remember('panel.stats', now()->addMinutes(5), fn () => [
            'noticias' => Noticia::count(),
            'documentos' => Documento::count(),
            'docentes' => Docente::count(),
            'mensajes' => ContactoMensaje::count(),
        ]);

        $stats = [
            'noticias' => $conteos['noticias'],
            'documentos' => $conteos['documentos'],
            'docentes' => $usuario->isDocente() ? null : $conteos['docentes'],
            'mensajes' => $usuario->isDocente() ? null : $conteos['mensajes'],
        ];

        return Inertia::render('Panel/Resumen', [
            'stats' => $stats,
        ]);
    }
}

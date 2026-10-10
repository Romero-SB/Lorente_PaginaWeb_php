<?php

namespace App\Http\Controllers\Panel;

use App\Http\Controllers\Controller;
use App\Models\ContactoMensaje;
use App\Models\Docente;
use App\Models\Documento;
use App\Models\Noticia;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ResumenController extends Controller
{
    public function index(Request $request): Response
    {
        $usuario = $request->user();

        $stats = [
            'noticias' => Noticia::count(),
            'documentos' => Documento::count(),
            'docentes' => $usuario->isDocente() ? null : Docente::count(),
            'mensajes' => $usuario->isDocente() ? null : ContactoMensaje::count(),
        ];

        return Inertia::render('Panel/Resumen', [
            'stats' => $stats,
        ]);
    }
}

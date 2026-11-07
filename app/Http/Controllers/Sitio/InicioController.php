<?php

namespace App\Http\Controllers\Sitio;

use App\Http\Controllers\Controller;
use App\Support\ContenidoSitio;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InicioController extends Controller
{
    public function index(Request $request, bool $abrirPanel = false): Response
    {
        $contenido = ContenidoSitio::para($request->user());

        return Inertia::render('Sitio/Inicio', [
            ...$contenido,
            'abrir_panel' => $abrirPanel,
            'hero_preload' => $contenido['config']['hero_imagen'] ?? '/lorentefrontis.webp',
        ]);
    }
}

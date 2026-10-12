<?php

namespace App\Http\Controllers\Sitio;

use App\Http\Controllers\Controller;
use App\Support\ContenidoSitio;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RecorridoController extends Controller
{
    /**
     * Muestra la vista inmersiva del Recorrido Virtual 360°.
     */
    public function index(Request $request): Response
    {
        return Inertia::render('Sitio/Recorrido', ContenidoSitio::para($request->user()));
    }
}
<?php

namespace App\Http\Controllers\Sitio;

use App\Http\Controllers\Controller;
use App\Support\ContenidoSitio;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InicioController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('Sitio/Inicio', ContenidoSitio::para($request->user()));
    }
}

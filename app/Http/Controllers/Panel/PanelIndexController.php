<?php

namespace App\Http\Controllers\Panel;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Sitio\InicioController;
use Illuminate\Http\Request;

class PanelIndexController extends Controller
{
    public function __invoke(Request $request)
    {
        if ($request->user()) {
            return app(ResumenController::class)->index($request);
        }

        return app(InicioController::class)->index($request, abrirPanel: true);
    }
}

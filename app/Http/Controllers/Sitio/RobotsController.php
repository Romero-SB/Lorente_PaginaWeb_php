<?php

namespace App\Http\Controllers\Sitio;

use App\Http\Controllers\Controller;
use Illuminate\Http\Response;

class RobotsController extends Controller
{
    public function __invoke(): Response
    {
        $contenido = "User-agent: *\n"
            ."Disallow: /lorente-panel/\n"
            ."\n"
            .'Sitemap: '.url('/sitemap.xml')."\n";

        return response($contenido, 200, ['Content-Type' => 'text/plain; charset=UTF-8']);
    }
}

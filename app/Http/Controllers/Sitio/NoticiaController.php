<?php

namespace App\Http\Controllers\Sitio;

use App\Http\Controllers\Controller;
use App\Models\Noticia;
use App\Support\SitioDatos;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NoticiaController extends Controller
{
    public function index(Request $request): Response
    {
        $noticias = Noticia::query()
            ->where('est', Noticia::EST_PUBLICADO)
            ->with(['imagenes', 'adjuntos', 'portada', 'author'])
            ->orderByDesc('fiso')
            ->orderByDesc('id')
            ->paginate(9)
            ->withQueryString()
            ->through(fn (Noticia $n) => SitioDatos::noticia($n));

        return Inertia::render('Sitio/Noticias', [
            'config' => SitioDatos::config(),
            'noticias' => $noticias,
        ]);
    }

    public function show(Noticia $noticia): Response
    {
        abort_unless($noticia->estaPublicada(), 404);

        $noticia->load(['imagenes', 'adjuntos', 'portada', 'author']);

        $relacionadas = Noticia::query()
            ->where('est', Noticia::EST_PUBLICADO)
            ->whereKeyNot($noticia->id)
            ->with(['imagenes', 'adjuntos', 'portada', 'author'])
            ->orderByDesc('fiso')
            ->orderByDesc('id')
            ->limit(3)
            ->get()
            ->map(fn (Noticia $n) => SitioDatos::noticia($n))
            ->values()
            ->all();

        return Inertia::render('Sitio/Noticia', [
            'config' => SitioDatos::config(),
            'noticia' => SitioDatos::noticia($noticia),
            'relacionadas' => $relacionadas,
        ]);
    }
}

<?php

namespace App\Http\Controllers\Sitio;

use App\Http\Controllers\Controller;
use App\Models\Noticia;
use Illuminate\Http\Response;

class SitemapController extends Controller
{
    public function __invoke(): Response
    {
        $urls = [
            ['loc' => url('/'), 'changefreq' => 'weekly', 'priority' => '1.0'],
            ['loc' => url('/noticias'), 'changefreq' => 'daily', 'priority' => '0.8'],
            ['loc' => url('/recorrido'), 'changefreq' => 'monthly', 'priority' => '0.7'],
        ];

        foreach (Noticia::query()->where('est', Noticia::EST_PUBLICADO)->select(['id', 'slug', 'updated_at'])->orderByDesc('fiso')->get() as $noticia) {
            $urls[] = [
                'loc' => route('sitio.noticias.show', $noticia),
                'lastmod' => $noticia->updated_at?->toAtomString(),
                'changefreq' => 'monthly',
                'priority' => '0.6',
            ];
        }

        return response()
            ->view('sitemap', ['urls' => $urls])
            ->header('Content-Type', 'application/xml; charset=UTF-8');
    }
}

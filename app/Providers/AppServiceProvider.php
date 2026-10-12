<?php

namespace App\Providers;

use App\Http\Controllers\Panel\ResumenController;
use App\Models\Adjunto;
use App\Models\Config;
use App\Models\ContactoMensaje;
use App\Models\Docente;
use App\Models\DocenteCategoria;
use App\Models\Documento;
use App\Models\Noticia;
use App\Models\NoticiaImagen;
use App\Support\ContenidoSitio;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Entidades cuyo cambio invalida el caché del contenido público.
     *
     * @var array<int, class-string<Model>>
     */
    private array $modelosDelSitio = [
        Config::class,
        Docente::class,
        DocenteCategoria::class,
        Documento::class,
        Noticia::class,
        NoticiaImagen::class,
        Adjunto::class,
    ];

    /**
     * Entidades cuyo cambio invalida las estadísticas cacheadas del panel.
     *
     * @var array<int, class-string<Model>>
     */
    private array $modelosDeEstadisticas = [
        Noticia::class,
        Documento::class,
        Docente::class,
        ContactoMensaje::class,
    ];

    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        foreach ($this->modelosDelSitio as $modelo) {
            $invalidar = static fn () => ContenidoSitio::olvidar();
            $modelo::saved($invalidar);
            $modelo::deleted($invalidar);
        }

        foreach ($this->modelosDeEstadisticas as $modelo) {
            $invalidar = static fn () => Cache::forget(ResumenController::CLAVE_ESTADISTICAS);
            $modelo::saved($invalidar);
            $modelo::deleted($invalidar);
        }
    }
}

<?php

namespace App\Console\Commands;

use App\Models\Docente;
use App\Models\Documento;
use App\Models\Noticia;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Throwable;

class EstadoApp extends Command
{
    protected $signature = 'app:estado';

    protected $description = 'Muestra el estado operativo de la aplicación (BD, cache, colas y papelera)';

    public function handle(): int
    {
        $filas = [
            ['Entorno', (string) app()->environment()],
            ['Base de datos', $this->estado(fn () => DB::select('select 1') !== [])],
            ['Cache', $this->estado(function () {
                Cache::put('app:estado', 'ok', 5);

                return Cache::pull('app:estado') === 'ok';
            })],
            ['Cola pendiente', (string) $this->contar('jobs')],
            ['Trabajos fallidos', (string) $this->contar('failed_jobs')],
            ['Papelera · noticias', (string) Noticia::onlyTrashed()->count()],
            ['Papelera · documentos', (string) Documento::onlyTrashed()->count()],
            ['Papelera · docentes', (string) Docente::onlyTrashed()->count()],
        ];

        $this->table(['Indicador', 'Valor'], $filas);

        return self::SUCCESS;
    }

    private function estado(callable $prueba): string
    {
        try {
            return $prueba() ? 'OK' : 'ERROR';
        } catch (Throwable) {
            return 'ERROR';
        }
    }

    private function contar(string $tabla): int
    {
        return Schema::hasTable($tabla) ? DB::table($tabla)->count() : 0;
    }
}

<?php

namespace App\Http\Controllers\Panel;

use App\Http\Controllers\Controller;
use App\Http\Requests\Panel\ConfiguracionRequest;
use App\Models\Config;
use App\Support\Historial;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ConfiguracionController extends Controller
{
    public function index(): Response
    {
        $config = Config::actual();
        $config->load('updatedBy:id,name');

        return Inertia::render('Panel/Configuracion', [
            'config' => [
                'phone' => $config->phone ?? '',
                'email' => $config->email ?? '',
                'direccion' => $config->direccion ?? '',
                'estudiantes' => $config->estudiantes,
                'docentes_count' => $config->docentes_count,
                'anio_fundacion' => $config->anio_fundacion,
                'niveles' => $config->niveles ?? '',
                'mision' => $config->mision ?? '',
                'vision' => $config->vision ?? '',
                'actualizado_por' => $config->updatedBy?->name,
                'actualizado_en' => $config->updated_at?->toIso8601String(),
            ],
        ]);
    }

    public function update(ConfiguracionRequest $request, Historial $historial): RedirectResponse
    {
        $usuario = $request->user();

        $datos = $request->validated();

        $texto = fn (mixed $valor): ?string => (trim((string) ($valor ?? '')) ?: null);

        $config = Config::actual();
        $config->fill([
            'phone' => $texto($datos['phone'] ?? null),
            'email' => $texto($datos['email'] ?? null),
            'direccion' => $texto($datos['direccion'] ?? null),
            'estudiantes' => $datos['estudiantes'] ?? null,
            'docentes_count' => $datos['docentes_count'] ?? null,
            'anio_fundacion' => $datos['anio_fundacion'] ?? null,
            'niveles' => $texto($datos['niveles'] ?? null),
            'mision' => $texto($datos['mision'] ?? null),
            'vision' => $texto($datos['vision'] ?? null),
            'updated_by' => $usuario->id,
        ]);
        $config->save();

        $historial->registrar($usuario, 'editar', $config, 'Configuración institucional');

        return back()->with('ok', 'Configuración guardada correctamente.');
    }
}

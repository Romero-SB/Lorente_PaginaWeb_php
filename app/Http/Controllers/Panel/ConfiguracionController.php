<?php

namespace App\Http\Controllers\Panel;

use App\Http\Controllers\Controller;
use App\Models\Config;
use App\Support\Historial;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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

    public function update(Request $request): RedirectResponse
    {
        $usuario = $request->user();

        $datos = $request->validate([
            'phone' => ['nullable', 'string', 'max:40'],
            'email' => ['nullable', 'email', 'max:150'],
            'direccion' => ['nullable', 'string', 'max:255'],
            'estudiantes' => ['nullable', 'integer', 'min:0', 'max:100000'],
            'docentes_count' => ['nullable', 'integer', 'min:0', 'max:10000'],
            'anio_fundacion' => ['nullable', 'integer', 'min:1900', 'max:2100'],
            'niveles' => ['nullable', 'string', 'max:255'],
            'mision' => ['nullable', 'string', 'max:2000'],
            'vision' => ['nullable', 'string', 'max:2000'],
        ], [
            'email.email' => 'Ingresa un correo electrónico válido.',
            'estudiantes.integer' => 'La cantidad de estudiantes debe ser un número.',
            'docentes_count.integer' => 'La cantidad de docentes debe ser un número.',
            'anio_fundacion.integer' => 'El año de fundación debe ser un número.',
            'anio_fundacion.min' => 'El año de fundación no parece válido.',
            'anio_fundacion.max' => 'El año de fundación no parece válido.',
        ]);

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

        Historial::registrar($usuario, 'editar', $config, 'Configuración institucional');

        return back()->with('ok', 'Configuración guardada correctamente.');
    }
}

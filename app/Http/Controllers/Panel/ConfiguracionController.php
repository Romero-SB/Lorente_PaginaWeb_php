<?php

namespace App\Http\Controllers\Panel;

use App\Http\Controllers\Controller;
use App\Http\Requests\Panel\ConfiguracionRequest;
use App\Http\Requests\Panel\HeroImagenRequest;
use App\Models\Config;
use App\Support\Almacenamiento;
use App\Support\Historial;
use App\Support\SitioDatos;
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
                'historia_cierre' => $config->historia_cierre ?? '',
                'hero_imagen' => $config->hero_imagen ? Almacenamiento::url($config->hero_imagen) : null,
                'actualizado_por' => $config->updatedBy?->name,
                'actualizado_en' => $config->updated_at?->toIso8601String(),
            ],
            'historia' => SitioDatos::historia(),
            'nosotros_imagenes' => SitioDatos::nosotrosImagenes(),
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
            'historia_cierre' => $texto($datos['historia_cierre'] ?? null),
            'updated_by' => $usuario->id,
        ]);
        $config->save();

        $historial->registrar($usuario, 'editar', $config, 'Configuración institucional');

        return back()->with('ok', 'Configuración guardada correctamente.');
    }

    public function actualizarHero(HeroImagenRequest $request, Historial $historial): RedirectResponse
    {
        $usuario = $request->user();
        $config = Config::actual();

        if ($request->boolean('quitar')) {
            Almacenamiento::eliminar($config->hero_imagen);
            $config->forceFill(['hero_imagen' => null, 'updated_by' => $usuario->id])->save();

            $historial->registrar($usuario, 'editar', $config, 'Imagen principal del inicio');

            return back()->with('ok', 'Imagen principal restablecida a la predeterminada.');
        }

        if (! $request->hasFile('imagen')) {
            return back()->withErrors(['imagen' => 'Selecciona una imagen para el inicio.']);
        }

        $ruta = Almacenamiento::guardarImagen($request->file('imagen'), 'config/hero');

        if ($ruta === null) {
            return back()->withErrors(['imagen' => 'La imagen no es un formato válido (jpg, png o webp).']);
        }

        Almacenamiento::eliminar($config->hero_imagen);
        $config->forceFill(['hero_imagen' => $ruta, 'updated_by' => $usuario->id])->save();

        $historial->registrar($usuario, 'editar', $config, 'Imagen principal del inicio');

        return back()->with('ok', 'Imagen principal actualizada.');
    }
}

<?php

use App\Http\Controllers\Auth\FirstPasswordChangeController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\PasswordResetController;
use App\Http\Controllers\Panel\ConfiguracionController;
use App\Http\Controllers\Panel\CuentasController;
use App\Http\Controllers\Panel\DocenteCategoriasController;
use App\Http\Controllers\Panel\DocentesController;
use App\Http\Controllers\Panel\DocumentosController;
use App\Http\Controllers\Panel\MensajesController;
use App\Http\Controllers\Panel\NoticiasController;
use App\Http\Controllers\Panel\PerfilController;
use App\Http\Controllers\Panel\ResumenController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Home');
})->name('home');

Route::middleware('guest')->prefix('lorente-panel')->group(function () {
    Route::get('/login', [LoginController::class, 'show'])->name('panel.login.show');
    Route::post('/login', [LoginController::class, 'login'])->name('panel.login.store');

    Route::get('/recuperar', [PasswordResetController::class, 'showForgot'])->name('panel.password.request');
    Route::post('/recuperar', [PasswordResetController::class, 'send'])->name('panel.password.email');

    Route::get('/restablecer/{token}', [PasswordResetController::class, 'showReset'])->name('panel.password.reset');
    Route::post('/restablecer', [PasswordResetController::class, 'update'])->name('panel.password.update');
});

Route::middleware('auth')->prefix('lorente-panel')->group(function () {
    Route::post('/logout', [LoginController::class, 'logout'])->name('panel.logout');

    Route::get('/primer-ingreso/cambiar-contrasena', [FirstPasswordChangeController::class, 'show'])
        ->name('panel.password.first.show');
    Route::post('/primer-ingreso/cambiar-contrasena', [FirstPasswordChangeController::class, 'update'])
        ->name('panel.password.first.update');

    Route::get('/', [ResumenController::class, 'index'])->name('panel.index');

    Route::middleware('debe.cambiar.password')->group(function () {
        Route::get('/noticias', [NoticiasController::class, 'index'])->name('panel.noticias.index');
        Route::post('/noticias', [NoticiasController::class, 'store'])->name('panel.noticias.store');
        Route::post('/noticias/{noticia}', [NoticiasController::class, 'update'])->name('panel.noticias.update');
        Route::post('/noticias/{noticia}/eliminar', [NoticiasController::class, 'destroy'])->name('panel.noticias.destroy');
        Route::post('/noticias/{noticia}/restaurar', [NoticiasController::class, 'restaurar'])
            ->withTrashed()
            ->name('panel.noticias.restaurar');
        Route::post('/noticias/{noticia}/permanente', [NoticiasController::class, 'permanente'])
            ->withTrashed()
            ->name('panel.noticias.permanente');
        Route::middleware('rol:super-usuario,administrador')->group(function () {
            Route::get('/docentes', [DocentesController::class, 'index'])->name('panel.docentes.index');
            Route::post('/docentes', [DocentesController::class, 'store'])->name('panel.docentes.store');
            Route::post('/docentes/reordenar', [DocentesController::class, 'reordenar'])->name('panel.docentes.reordenar');
            Route::post('/docentes/{docente}', [DocentesController::class, 'update'])->name('panel.docentes.update');
            Route::post('/docentes/{docente}/eliminar', [DocentesController::class, 'destroy'])->name('panel.docentes.destroy');
            Route::post('/docentes/{docente}/restaurar', [DocentesController::class, 'restaurar'])
                ->withTrashed()
                ->name('panel.docentes.restaurar');
            Route::post('/docentes/{docente}/permanente', [DocentesController::class, 'permanente'])
                ->withTrashed()
                ->name('panel.docentes.permanente');

            Route::post('/docente-categorias', [DocenteCategoriasController::class, 'store'])->name('panel.docente-categorias.store');
            Route::post('/docente-categorias/reordenar', [DocenteCategoriasController::class, 'reordenar'])->name('panel.docente-categorias.reordenar');
            Route::post('/docente-categorias/{categoria}', [DocenteCategoriasController::class, 'update'])->name('panel.docente-categorias.update');
            Route::post('/docente-categorias/{categoria}/eliminar', [DocenteCategoriasController::class, 'destroy'])->name('panel.docente-categorias.destroy');
        });

        Route::get('/documentos', [DocumentosController::class, 'index'])->name('panel.documentos.index');
        Route::get('/mensajes', [MensajesController::class, 'index'])
            ->middleware('rol:super-usuario,administrador')
            ->name('panel.mensajes.index');
        Route::get('/cuentas', [CuentasController::class, 'index'])
            ->middleware('rol:super-usuario')
            ->name('panel.cuentas.index');
        Route::get('/configuracion', [ConfiguracionController::class, 'index'])
            ->middleware('rol:super-usuario,administrador')
            ->name('panel.configuracion.index');
        Route::get('/perfil', [PerfilController::class, 'index'])->name('panel.perfil.index');
    });
});

<?php

use App\Http\Controllers\Auth\FirstPasswordChangeController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\PasswordResetController;
use App\Http\Controllers\Panel\ConfiguracionController;
use App\Http\Controllers\Panel\CuentasController;
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
        Route::get('/docentes', [DocentesController::class, 'index'])
            ->middleware('rol:super-usuario,administrador')
            ->name('panel.docentes.index');
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

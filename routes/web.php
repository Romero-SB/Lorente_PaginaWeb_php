<?php

use App\Http\Controllers\Auth\FirstPasswordChangeController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\PasswordResetController;
use App\Http\Controllers\Panel\IndexController;
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

    Route::get('/', [IndexController::class, 'index'])->name('panel.index');
});

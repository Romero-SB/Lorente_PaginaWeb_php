<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('comunicados', function (Blueprint $table) {
            $table->id();
            $table->string('imagen');
            $table->string('enlace', 500)->nullable();
            $table->boolean('activo')->default(true);
            $table->timestamp('inicio_at')->nullable();
            $table->timestamp('fin_at')->nullable();
            $table->timestamps();

            $table->index(['activo', 'inicio_at', 'fin_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('comunicados');
    }
};
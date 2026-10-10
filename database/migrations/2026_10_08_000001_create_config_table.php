<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('config', function (Blueprint $table) {
            $table->id();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->string('direccion')->nullable();
            $table->unsignedBigInteger('estudiantes')->nullable();
            $table->unsignedBigInteger('docentes_count')->nullable();
            $table->unsignedInteger('anio_fundacion')->nullable();
            $table->string('niveles')->nullable();
            $table->text('mision')->nullable();
            $table->text('vision')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();

            $table->foreign('updated_by')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('config');
    }
};

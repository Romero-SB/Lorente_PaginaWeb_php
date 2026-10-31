<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('nosotros_imagenes', function (Blueprint $table) {
            $table->id();
            $table->string('ruta');
            $table->string('alt', 150)->nullable();
            $table->unsignedInteger('orden')->default(0);
            $table->timestamps();

            $table->index('orden');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('nosotros_imagenes');
    }
};

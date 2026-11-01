<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('config', function (Blueprint $table) {
            $table->text('nosotros_intro')->nullable();
            $table->text('nosotros_valores')->nullable();
        });

        Schema::table('historia_hitos', function (Blueprint $table) {
            $table->json('estilo')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('historia_hitos', function (Blueprint $table) {
            $table->dropColumn('estilo');
        });

        Schema::table('config', function (Blueprint $table) {
            $table->dropColumn(['nosotros_intro', 'nosotros_valores']);
        });
    }
};

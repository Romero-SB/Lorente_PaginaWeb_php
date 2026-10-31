<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('config', function (Blueprint $table) {
            $table->string('hero_imagen')->nullable()->after('vision');
            $table->text('historia_cierre')->nullable()->after('hero_imagen');
        });
    }

    public function down(): void
    {
        Schema::table('config', function (Blueprint $table) {
            $table->dropColumn(['hero_imagen', 'historia_cierre']);
        });
    }
};

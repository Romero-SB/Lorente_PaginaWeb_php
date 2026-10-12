<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('docentes', function (Blueprint $table) {
            $table->unsignedBigInteger('categoria_id')->nullable()->after('categoria');
            $table->index('categoria_id');
        });

        Schema::table('documentos', function (Blueprint $table) {
            $table->unsignedBigInteger('categoria_id')->nullable()->after('categoria');
            $table->index('categoria_id');
        });

        DB::table('docentes')
            ->whereNull('categoria_id')
            ->update([
                'categoria_id' => DB::raw('(select id from docente_categorias where docente_categorias.nombre = docentes.categoria)'),
            ]);

        DB::table('documentos')
            ->whereNull('categoria_id')
            ->update([
                'categoria_id' => DB::raw('(select id from documento_categorias where documento_categorias.nombre = documentos.categoria)'),
            ]);

        if (Schema::getConnection()->getDriverName() !== 'sqlite') {
            Schema::table('docentes', function (Blueprint $table) {
                $table->foreign('categoria_id')->references('id')->on('docente_categorias')->nullOnDelete();
            });

            Schema::table('documentos', function (Blueprint $table) {
                $table->foreign('categoria_id')->references('id')->on('documento_categorias')->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        if (Schema::getConnection()->getDriverName() !== 'sqlite') {
            Schema::table('docentes', function (Blueprint $table) {
                $table->dropForeign(['categoria_id']);
            });

            Schema::table('documentos', function (Blueprint $table) {
                $table->dropForeign(['categoria_id']);
            });
        }

        Schema::table('docentes', function (Blueprint $table) {
            $table->dropIndex(['categoria_id']);
            $table->dropColumn('categoria_id');
        });

        Schema::table('documentos', function (Blueprint $table) {
            $table->dropIndex(['categoria_id']);
            $table->dropColumn('categoria_id');
        });
    }
};

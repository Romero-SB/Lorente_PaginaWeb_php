<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('noticias', function (Blueprint $table) {
            $table->index(['est', 'fiso'], 'noticias_est_fiso_idx');
            $table->index('cat', 'noticias_cat_idx');
        });

        Schema::table('docentes', function (Blueprint $table) {
            $table->index(['categoria', 'orden'], 'docentes_categoria_orden_idx');
        });

        Schema::table('documentos', function (Blueprint $table) {
            $table->index(['visibilidad', 'deleted_at'], 'documentos_visibilidad_deleted_at_idx');
            $table->index('categoria', 'documentos_categoria_idx');
        });

        Schema::table('actividad', function (Blueprint $table) {
            $table->index('created_at', 'actividad_created_at_idx');
            $table->index(['modelo', 'modelo_id'], 'actividad_modelo_modelo_id_idx');
        });

        Schema::table('contacto_mensajes', function (Blueprint $table) {
            $table->index('created_at', 'contacto_mensajes_created_at_idx');
        });
    }

    public function down(): void
    {
        Schema::table('noticias', function (Blueprint $table) {
            $table->dropIndex('noticias_est_fiso_idx');
            $table->dropIndex('noticias_cat_idx');
        });

        Schema::table('docentes', function (Blueprint $table) {
            $table->dropIndex('docentes_categoria_orden_idx');
        });

        Schema::table('documentos', function (Blueprint $table) {
            $table->dropIndex('documentos_visibilidad_deleted_at_idx');
            $table->dropIndex('documentos_categoria_idx');
        });

        Schema::table('actividad', function (Blueprint $table) {
            $table->dropIndex('actividad_created_at_idx');
            $table->dropIndex('actividad_modelo_modelo_id_idx');
        });

        Schema::table('contacto_mensajes', function (Blueprint $table) {
            $table->dropIndex('contacto_mensajes_created_at_idx');
        });
    }
};

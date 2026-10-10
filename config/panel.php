<?php

return [

    'labels' => [
        'super-usuario' => 'Super Usuario',
        'administrador' => 'Administrador',
        'docente' => 'Docente',
    ],

    'categorias_noticias' => [
        'Logros' => '🏆 Logros',
        'Concurso' => '🥇 Concurso',
        'Resultados' => '📋 Resultados',
        'Cultura' => '🎭 Cultura',
        'Educacion' => '📚 Educación',
        'Evento' => '🥳 Evento',
        'Comunicado' => '📢 Comunicado',
    ],

    'dias_purga_papelera' => 7,

    'visibilidades_documentos' => [
        'publico' => 'Público',
        'privado' => 'Privado',
    ],

    'secciones' => [
        'resumen' => [
            'etiqueta' => 'Resumen',
            'icono' => 'inicio',
            'ruta' => '/lorente-panel',
            'roles' => ['super-usuario', 'administrador', 'docente'],
            'exacta' => true,
        ],
        'noticias' => [
            'etiqueta' => 'Noticias',
            'icono' => 'noticias',
            'ruta' => '/lorente-panel/noticias',
            'roles' => ['super-usuario', 'administrador', 'docente'],
        ],
        'docentes' => [
            'etiqueta' => 'Docentes',
            'icono' => 'docentes',
            'ruta' => '/lorente-panel/docentes',
            'roles' => ['super-usuario', 'administrador'],
        ],
        'documentos' => [
            'etiqueta' => 'Documentos',
            'icono' => 'documentos',
            'ruta' => '/lorente-panel/documentos',
            'roles' => ['super-usuario', 'administrador', 'docente'],
        ],
        'mensajes' => [
            'etiqueta' => 'Mensajes',
            'icono' => 'mensajes',
            'ruta' => '/lorente-panel/mensajes',
            'roles' => ['super-usuario', 'administrador'],
        ],
        'historial' => [
            'etiqueta' => 'Historial',
            'icono' => 'historial',
            'ruta' => '/lorente-panel/historial',
            'roles' => ['super-usuario'],
        ],
        'cuentas' => [
            'etiqueta' => 'Cuentas',
            'icono' => 'cuentas',
            'ruta' => '/lorente-panel/cuentas',
            'roles' => ['super-usuario', 'administrador'],
        ],
        'configuracion' => [
            'etiqueta' => 'Configuración',
            'icono' => 'configuracion',
            'ruta' => '/lorente-panel/configuracion',
            'roles' => ['super-usuario', 'administrador'],
        ],
        'perfil' => [
            'etiqueta' => 'Mi perfil',
            'icono' => 'perfil',
            'ruta' => '/lorente-panel/perfil',
            'roles' => ['super-usuario', 'administrador', 'docente'],
        ],
    ],
];

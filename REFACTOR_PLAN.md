# PLAN DE REFACTORIZACIÓN

## Web I.E. N° 31501 «Sebastián Lorente» — Escalabilidad y rendimiento

Leyenda: `[ ]` pendiente · `[~]` en progreso · `[x]` terminado.

## Objetivo

Reducir deuda técnica y hacer crecer el proyecto (más módulos, más datos, más
tráfico) **sin romper el comportamiento actual**. Cada fase cierra con
`php artisan test` (146+) y `npm run build` en verde, y Pint aplicado.

## Decisiones acordadas

- Alcance: **incremental y seguro** (comportamiento intacto; sin "big bang").
- Prioridad: **rendimiento / escalabilidad**.
- Frontend: **JS + PropTypes/JSDoc** (sin migración a TypeScript por ahora).
- Datos: **categorías a clave foránea** con backfill, en fase aislada.
- Entregable: este documento `REFACTOR_PLAN.md`.

---

## Fase 0 — Red de seguridad (antes de tocar nada)

**Objetivo:** congelar comportamiento actual.

- [x] Confirmar baseline: `php artisan test`, `npm run build`, Pint.
- [x] Añadir tests de caracterización donde faltan y hay riesgo: descarga de
      documentos públicos/privados, invalidez de cache del sitio tras
      `saved`/`deleted`, purga por antigüedad, reorden de categorías.
- [x] Documentar contratos de props Inertia (shape de `paraVista`): ver
      «Contratos de props Inertia».

**Aceptación:** suite verde; sin cambios de comportamiento.

## Fase 1 — Rendimiento de datos (quick wins, sin romper contratos)

Prioridad del proyecto. Sin migraciones destructivas.

- [x] **Índices** (nueva migración): `noticias(est, fiso)`, `noticias(cat)`,
      `docentes(categoria, orden)`, `documentos(visibilidad, deleted_at)`,
      `documentos(categoria)`, `actividad(created_at)`,
      `actividad(modelo, modelo_id)`, `contacto_mensajes(created_at)`. Hoy solo
      hay unique en `slug` + FKs.
- [x] **`ResumenController`** cachea `panel.stats` sin invalidación → añadir
      invalidación (observer/evento).
- [x] **`DocumentosController::index`** y **`ContenidoSitio::documentos`**
      cargan todos los documentos → `select` de columnas necesarias.
- [x] **`ContenidoSitio::construir()`**: `select` acotado en categorías y
      documentos.
- [x] **`SitioDatos`/`sitemap`**: `select` y límites; evitar `get()` completos.
- [x] Validar conteos por categoría con el índice correspondiente.

**Criterios:** build+tests verdes; índices usados (`EXPLAIN`); menos payload por
request. Sin cambios de contrato en props.

## Fase 2 — Integridad referencial de categorías (aislada)

- [x] Migración: `docentes.categoria_id` y `documentos.categoria_id`
      (`nullable`, índice; FK con `nullOnDelete` en MySQL, omitida en SQLite).
- [x] Backfill por nombre existente; conservar `categoria` (nombre) durante la
      transición.
- [x] Modelos: relaciones `categoriaRef()`; los controladores resuelven y
      persisten `categoria_id` al crear/editar (validación por nombre se
      mantiene para no romper el frontend).
- [x] Renombrar categoría conserva el `categoria_id` (id estable); el borrado
      sigue bloqueado por nombre y la columna de nombre se sincroniza.
- [ ] Fase posterior: deprecar la columna `nombre` duplicada y validar por id
      (`exists:...,id`), migrando `GestorCategorias.jsx` a enviar ids.

**Criterios:** tests nuevos de renombrar/eliminar categoría; datos migrados sin
pérdida. ✔ `tests/Feature/Panel/CategoriaRelacionTest.php` (4 tests).

## Fase 3 — Backend mantenible (reduce duplicación, habilita escala)

- [x] **FormRequests por acción** (todas las validaciones inline extraídas a
      `app/Http/Requests/{Panel,Auth,Sitio}`).
- [x] **Resources/presenters** para unificar `paraVista`.
- [x] **Policies** (`NoticiaPolicy`, `DocumentoPolicy`, `DocentePolicy`).
- [x] **Unificar `PapeleraNoticias/Documentos/Docentes`** en un servicio genérico
      con hooks por modelo + un comando parametrizado.
- [x] **Extraer Actions**: sincronización de imágenes/adjuntos de noticias.
- [x] **Inyección de dependencias** en `Historial` (usa `request()` global).

**Criterios:** menos líneas, tests verdes + tests unitarios de Support/Actions.

## Fase 4 — Rendimiento de assets y CSS

- [x] **Dividir CSS por layout** (import diferido por layout, no en `app.jsx`).
- [x] **Eliminar CSS muerto** verificado en `sitio.css`.
- [x] **Consolidar fuentes** (Bunny vs Google) y self-host/subset + preload.
- [x] **`panel.css`**: reemplazar overrides por clase Tailwind por
      `@layer components`/clases semánticas.
- [x] **OG absolutas** (`new URL(..., window.location.origin)`) en
      Inicio/Noticias/Noticia.
  - [x] `theme-color` coherente: por defecto `#1e3a8a` en `app.blade.php`
        (sitio) y conmutado a `#0f1b42` mientras el panel está activo
        (`resources/js/lib/themeColor.js` + `PanelLayout`).

## Fase 5 — Frontend mantenible

- [x] Componentes compartidos: `Campo`, `Boton`, `Modal` (role/focus),
      `PageHeader`, `EmptyState`, `Paginacion`, `FileDropzone`.
- [x] Utilidades: `lib/fecha.js` (`formatearFecha`/`formatoFecha`),
      `lib/reordenar.js`, `lib/archivos.js`.
  - [x] `useFormErrors` en `resources/js/lib/useFormErrors.js` (JSDoc y test
        Vitest) para errores compartidos de `usePage().props.errors`.
- [x] Generalizar `<Papelera>` (3 copias).
- [x] A11y: `htmlFor`/`id` en labels, focus-trap en modales, `aria-live` en
      toasts, dropzones accesibles por teclado (`sr-only` + `focus-within`).

## Fase 6 — Calidad y DX

- [x] Tests unitarios de `app/Support/*` y `app/Actions/Noticias/*`
      (PanelSecciones, Papelera, Almacenamiento, ArchivosDocumentos,
      Historial, SincronizarAdjuntos, SincronizarImagenes) y comando
      `app:estado`. PHPUnit al día: 198 tests / 1171 assertions.
- [x] JSDoc en componentes compartidos (`Shared/*`) y `lib/*`.
- [x] Optimización build: `model-viewer` ya cargado con `import()` diferido;
      `chunkSizeWarningLimit: 1100` en `vite.config.js`. (`manualChunks`
      descartado: el code-splitting por entradas/imports dinámicos ya separa
      runtime, layout, páginas y la librería 3D.)
- [x] Vitest + RTL (`vitest.config.js`, `vitest.setup.js`; 15 pruebas en
      `resources/js/tests/`) y CI en `.github/workflows/ci.yml` (Pint, PHPUnit,
      `npm run build`, Vitest).

## Fase 7 — Escalabilidad futura (opcional)

- [x] Colas para email de contacto: `ContactoRecibido` implementa `ShouldQueue`
      (`$tries = 3`); `ContactoController` usa `Mail::queue()`; worker de
      respaldo programado (`queue:work --stop-when-empty` cada minuto,
      `withoutOverlapping`) para hosting cPanel con solo el cron de
      `schedule:run`.
- [x] Cache y paginación: tags no aplicables (drivers `file`/`database` no
      soportan tags) → invalidación explícita ya cubierta por
      `AppServiceProvider`. Paginación real en todos los listados con scroll
      (Sitio/Noticias, Panel Mensajes, Historial y **Cuentas**); las listas
      reordenables (Noticias/Docentes/Documentos) se mantienen sin paginar para
      no romper el arrastre.
- [x] CDN/optimización de imágenes: `CDN_URL` opcional en el disco `public`
      (`APP_URL/storage` por defecto). Observabilidad: health `/up` +
      `php artisan app:estado` (BD, cache, cola, trabajos fallidos y papelera).

---

## Contratos de props Inertia

Shapes de los props que consumen las páginas (paginador = `{data, links, meta}`):

- **Sitio/Inicio**: `config`, `docentes`, `categorias_docentes`, `noticias`,
  `documentos` (vía `ContenidoSitio`).
- **Sitio/Noticias**: `noticias` (paginador). **Sitio/Noticia**: `noticia`
  (`NoticiaResource`), `relacionadas`.
- **Panel/Mensajes**: `mensajes` (paginador), `filtros`, `stats`.
- **Panel/Historial**: `registros` (paginador), `usuarios`, `acciones`,
  `modelos`, `filtros`.
- **Panel/Cuentas**: `cuentas` (paginador), `roles_asignables`, `es_super`.
- **Panel/Noticias · Docentes · Documentos**: listas completas (reordenables) y
  `categorias`.
- **Compartidos**: `auth.user`, `panel.secciones`, `flash`, `errors` (globales de
  validación).

---

## Métricas de éxito

- Consultas por request acotadas (sin `get()` completos) e índices usados.
- Payload inicial reducido (CSS por layout y fuentes).
- Menos duplicación: −200 líneas en componentes, Papelera unificada,
  validaciones en FormRequests.
- Suite de tests creciente y verde; CI activo.

## Riesgos y mitigación

- Migración de categorías: hacer backfill + mantener columna antigua; probar en
  copia de BD.
- Cambios de CSS/perf pueden alterar visuales → verificación visual la hace el
  usuario con su dev server.
- No hay commit automático: cada fase se cierra y el usuario decide cuándo
  commitear.

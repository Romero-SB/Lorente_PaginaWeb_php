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
- [ ] Documentar contratos de props Inertia (shape de `paraVista`).

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

- [ ] Migración: `docentes.categoria_id` y `documentos.categoria_id`
      (`nullable`, FK a `docente_categorias`/`documento_categorias`).
- [ ] Backfill por nombre existente; conservar `categoria` (nombre) durante la
      transición.
- [ ] Modelos: relaciones `categoria()`; validaciones a `exists:...,id`;
      ajustar `ContenidoSitio`, purgas, reorden y `GestorCategorias.jsx`.
- [ ] Renombrar/eliminar categoría deja de depender de strings.
- [ ] Fase posterior: deprecar la columna `nombre` duplicada.

**Criterios:** tests nuevos de renombrar/eliminar categoría; datos migrados sin
pérdida.

## Fase 3 — Backend mantenible (reduce duplicación, habilita escala)

- [ ] **FormRequests por acción** (23 validaciones inline; solo `LoginRequest`).
- [ ] **Resources/presenters** para unificar `paraVista`.
- [ ] **Policies** (`NoticiaPolicy`, `DocumentoPolicy`, `DocentePolicy`).
- [ ] **Unificar `PapeleraNoticias/Documentos/Docentes`** en un servicio genérico
      con hooks por modelo + un comando parametrizado.
- [ ] **Extraer Actions**: sincronización de imágenes/adjuntos de noticias.
- [ ] **Inyección de dependencias** en `Historial` (usa `request()` global).

**Criterios:** menos líneas, tests verdes + tests unitarios de Support/Actions.

## Fase 4 — Rendimiento de assets y CSS

- [ ] **Dividir CSS por layout** (import diferido por layout, no en `app.jsx`).
- [ ] **Eliminar CSS muerto** verificado en `sitio.css`.
- [ ] **Consolidar fuentes** (Bunny vs Google) y self-host/subset.
- [ ] **`panel.css`**: reemplazar overrides por clase Tailwind por
      `@layer components`/clases semánticas.
- [ ] **OG absolutas** y `theme-color` coherente.

## Fase 5 — Frontend mantenible

- [ ] Componentes compartidos: `Campo`, `Boton`, `Modal` (role/focus),
      `PageHeader`, `EmptyState`, `Paginacion`, `FileDropzone`.
- [ ] Utilidades: `formatearFecha`, `reordenar`, `useFormErrors`,
      `lib/archivos.js`.
- [ ] Generalizar `<Papelera>` (3 copias).
- [ ] A11y: `htmlFor`/`id` en labels, focus-trap en modales, `aria-live` en
      toasts, dropzones accesibles por teclado.

## Fase 6 — Calidad y DX

- [ ] Tests unitarios de `Support/*` y Actions; Vitest + RTL.
- [ ] CI (GitHub Actions): Pint + PHPUnit + `npm run build`.
- [ ] PropTypes/JSDoc en componentes compartidos.
- [ ] Optimización build: `manualChunks`/code-splitting.

## Fase 7 — Escalabilidad futura (opcional)

- [ ] Colas para email de contacto (según hosting cPanel).
- [ ] Cache tags, paginación real en todos los listados.
- [ ] CDN/optimización de imágenes, observabilidad (health/logs).

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

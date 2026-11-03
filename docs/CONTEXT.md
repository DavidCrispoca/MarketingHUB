# MarcaHub — Contexto del proyecto (v2)

> Nombre provisional. Documento pensado para dos lectores: **tú** (para entender qué se construye y por qué) y **Opencode** (puedes copiarlo como `docs/CONTEXT.md` y referenciarlo desde `AGENTS.md`).
> Idioma de la interfaz: **español**. Idioma del código, commits y nombres de tablas: **inglés** (convención del proyecto original).

---

## 0. Cómo usar este documento

1. Lee las secciones 1 a 5 para entender el panorama.
2. Las secciones 6 y 7 son el "plano": conceptos y base de datos.
3. La sección 8 explica cada módulo desde cero, con su criterio de "hecho".
4. La sección 13 es el plan por fases. **Trabaja una fase a la vez**: pídele a Opencode solo la fase actual, revisa lo que genera y haz commit antes de seguir.
5. Los fragmentos de SQL y código son **bocetos orientativos**: el agente debe adaptarlos, no copiarlos a ciegas. Todo lo que toque seguridad (RLS, tokens) debe ser revisado por ti.

---

## 1. Qué es el proyecto

Una aplicación web para que un **equipo pequeño** gestione el contenido de una o varias **marcas** en **Instagram y TikTok**:

- Guardar la identidad de cada marca (colores, tipografías, logos, voz y tono).
- Tener un **almacén de medios** (imágenes y videos pendientes por publicar).
- Hacer anotaciones y comentarios directamente sobre los medios.
- Planear publicaciones en un **kanban y calendario** que referencian esos medios.
- Reutilizar **captions, hashtags y CTA aprobados**, y **plantillas por red**.
- Agrupar el trabajo en **campañas**.
- Ver un **dashboard** con métricas de las redes, recomendaciones de **mejor hora para publicar** y generar **reportes en PDF**.

**Contexto de uso:** personal y académico, equipo pequeño. No se busca escala empresarial: se busca algo bien hecho, entendible y explicable. Esto permite decisiones más simples (por ejemplo, planes gratuitos, modo demostración con datos de ejemplo).

**Dispositivos objetivo (prioridad alta):** pantallas de **PC** y de **iPad**. El móvil pequeño no es prioridad.

---

## 2. Punto de partida: el proyecto original

Existe un proyecto terminado, el **Panel de Gestión de Lanzamientos de Producto** (React 19 + Vite + Express + SQLite). **No se modifica.** Lo que ya resuelve y vamos a reutilizar:

| Del original | Qué se reutiliza en MarcaHub |
|---|---|
| Flujo de aprobación lineal con transiciones validadas en el servidor | Se convierte en el flujo de estados de las **piezas de contenido** |
| Roles Creator / Approver | Se amplían a roles **por marca** |
| Historial de cambios de estado (auditoría) | Se conserva como `content_status_history` |
| Comentarios en el flujo de aprobación | Base del sistema de comentarios y anotaciones |
| Vista kanban con `@dnd-kit` | Se reutiliza el componente de tablero |
| Vista calendario mensual con colores por estado | Se reutiliza y se amplía |
| Tokens de diseño en CSS plano (Inter, acento `#4F46E5`) | Se mantiene el sistema de diseño |
| Validación con Zod, ESLint + Prettier, commits convencionales | Se mantienen |

Lo que **se elimina**: el servidor Express, SQLite/`better-sqlite3` y el selector de rol sin autenticación real.

---

## 3. Cómo clonar sin tocar el original

El clon es una copia independiente. Mientras no hagas `push` al repositorio original, no lo afectas.

```bash
# 1) Clonar en una carpeta con el nombre nuevo
git clone <URL_DEL_REPO_ORIGINAL> marcahub
cd marcahub

# 2) Desconectar del original (así es imposible hacerle push por error)
git remote remove origin

# 3) Crear un repositorio NUEVO y vacío en GitHub (sin README), luego:
git remote add origin <URL_DEL_REPO_NUEVO>
git branch -M main
git push -u origin main
```

Si prefieres **empezar con historial limpio** (sin los commits del reto), en el paso 2 haz en su lugar:

```bash
rm -rf .git && git init && git add . && git commit -m "chore: initial commit from base project"
```

**Después del clon:**
- Cambia el nombre en `package.json` (raíz y workspaces) y en el `README`.
- Borra `server/` y el workspace `server` del `package.json` raíz (en la fase 1, no antes).
- Verifica que `.gitignore` excluye `.env*`, `node_modules`, `dist`, `.vercel` y `supabase/.temp`.
- **Nunca** subas claves ni tokens al repositorio.

---

## 4. Arquitectura propuesta

```
┌──────────────────────────┐        ┌─────────────────────────────────────┐
│  Navegador (PC / iPad)   │        │            Supabase                 │
│  React + Vite (SPA)      │◄──────►│  Auth · Postgres (RLS) · Storage    │
│  supabase-js             │  HTTPS │  Edge Functions · pg_cron · Vault   │
└────────────▲─────────────┘        └───────────────┬─────────────────────┘
             │ archivos estáticos                   │ OAuth / APIs
┌────────────┴─────────────┐        ┌───────────────▼─────────────────────┐
│   Vercel (hosting)       │        │  Instagram (Meta Graph API) · TikTok │
└──────────────────────────┘        └─────────────────────────────────────┘
```

**Decisiones y razones**

- **Vite + React se mantiene** (no Next.js): reutilizas tu código y la curva es menor. Vercel solo sirve archivos estáticos.
- **Supabase reemplaza al backend**: autenticación, base de datos Postgres, almacenamiento de archivos y funciones del lado servidor.
- **La seguridad la da Postgres (RLS)**, no el frontend: cada fila pertenece a una marca y solo la ven los miembros de esa marca.
- **Lógica sensible va en el servidor** (Edge Functions o funciones SQL): validar transiciones de estado, guardar tokens de redes, sincronizar métricas.
- **Los archivos pesados se suben directo a Supabase Storage** desde el navegador (URL firmada), nunca pasando por Vercel.
- **Estado del servidor con TanStack Query** (caché, recarga, estados de carga). `Context` se reserva para sesión y marca activa. Reemplaza el uso de `useReducer` para datos remotos.
- **Zona horaria:** todo se guarda en UTC (`timestamptz`) y se muestra en `America/Bogota` con `date-fns-tz`.
- **JavaScript se mantiene** (con JSDoc donde ayude) para no sumar fricción. Los esquemas Zod son la fuente de validación del frontend.

**Librerías nuevas previstas:** `@supabase/supabase-js`, `@tanstack/react-query`, `date-fns-tz`, `recharts` (gráficos del dashboard), `@react-pdf/renderer` (reportes), `konva` + `react-konva` (editor de imágenes; ver §8.10).

---

## 5. Requisitos de diseño: PC y iPad

El iPad es un dispositivo táctil con Safari (motor WebKit). Hay que diseñar pensando en toque **y** en ratón.

**Reglas obligatorias**

1. **Breakpoints de referencia:** iPad vertical ≈ 768–834 px, iPad horizontal ≈ 1024–1194 px, PC ≥ 1280 px. Probar en esos tres.
2. **Zonas táctiles de al menos 44×44 px** en botones, filas clicables, íconos de acción.
3. **Nada esencial puede depender de `:hover`.** Lo que aparezca al pasar el mouse debe tener alternativa por toque.
4. **Drag & drop táctil:** configurar `@dnd-kit` con `TouchSensor` (con pequeño retardo de activación, ~200 ms) y `PointerSensor`, para no confundir arrastrar con hacer scroll.
5. **Altura de pantalla:** usar `100dvh`, no `100vh` (la barra de Safari cambia de tamaño).
6. **Campos de texto con `font-size` ≥ 16 px**, o Safari hace zoom automático al enfocarlos.
7. **Layout adaptable:** en iPad vertical la barra lateral se colapsa a íconos o a un menú superior; en horizontal y PC se muestra completa.
8. **Áreas seguras:** respetar `env(safe-area-inset-*)` y `viewport-fit=cover`.
9. **Rendimiento con imágenes:** miniaturas en las cuadrículas; el original solo se carga en la vista de detalle o en el editor.
10. **Canvas en Safari:** tiene límite de tamaño máximo. El editor debe detectar imágenes muy grandes y avisar o trabajar por mosaicos (ver §8.10).
11. **Instalable (opcional):** agregar `manifest.webmanifest` para "Añadir a pantalla de inicio" en iPad.
12. **Pruebas:** comprobar con emulación de iPad en las herramientas del navegador y, si es posible, en un iPad real.

**Idioma:** todos los textos van en `src/i18n/es.json` y se consumen con una función `t('clave')`. Así, agregar inglés después es solo añadir `en.json`. Nada de textos fijos dentro de los componentes.

**Diseño:** se conserva el sistema original (Inter, paleta neutra, acento `#4F46E5`, sin degradados ni *glassmorphism*). **Tú defines el UI/UX**: pide al agente implementación, no decisiones estéticas.

---

## 6. Conceptos del dominio (explicados desde cero)

Piensa en la jerarquía así:

```
Usuario ──pertenece a──► Marcas (con un rol en cada una)
                          │
                          ├── Manual de marca (colores, fuentes, logos, guías)
                          ├── Redes sociales conectadas (Instagram, TikTok)
                          ├── Almacén de medios (imágenes y videos)
                          ├── Bancos (captions, hashtags, CTA)
                          ├── Campañas
                          ├── Piezas de contenido (publicaciones planificadas)
                          ├── Recordatorios
                          └── Métricas (snapshots) y reportes
```

| Concepto | Qué es |
|---|---|
| **Usuario** | Persona con cuenta. Puede trabajar en varias marcas. |
| **Marca** | Un cliente o proyecto (por ejemplo, "Café del Valle"). Es el contenedor de casi todo. |
| **Membresía y rol** | Qué puede hacer cada usuario **dentro de una marca**: *admin*, *creator*, *approver*, *viewer*. |
| **Cuenta social** | Un perfil de Instagram o TikTok vinculado a una marca. Una marca puede tener una de cada una. |
| **Manual de marca** | Identidad visual y verbal: paleta, tipografías, logos, voz y tono, qué hacer y qué no. |
| **Asset (medio)** | Una imagen o un video guardado en el almacén. |
| **Anotación** | Comentario atado a un punto de una imagen o a un instante de un video. |
| **Campaña** | Conjunto de publicaciones con un objetivo y fechas (por ejemplo, "Lanzamiento de verano"). |
| **Pieza de contenido** | Una publicación planificada: medios + caption + fecha + redes destino + estado. |
| **Plantilla por red** | Reglas de formato de cada red (tamaño, proporción, zonas seguras, límites de texto). |
| **Banco** | Biblioteca de captions, hashtags y CTA (llamados a la acción) ya **aprobados**, reutilizables. |
| **Recordatorio** | Aviso con fecha (fecha clave de la marca, tarea, vencimiento de licencia). |
| **Snapshot** | Una "foto" de las métricas tomada en un momento. Guardar fotos diarias permite ver la evolución. |
| **Reporte** | Un PDF con el resumen de un periodo. |

**Roles y permisos (por marca)**

| Acción | viewer | creator | approver | admin |
|---|:-:|:-:|:-:|:-:|
| Ver todo de la marca | ✔ | ✔ | ✔ | ✔ |
| Comentar y anotar | ✔ | ✔ | ✔ | ✔ |
| Subir/editar medios, crear piezas, enviar a revisión | | ✔ | | ✔ |
| Aprobar / devolver piezas, aprobar bancos | | | ✔ | ✔ |
| Programar y marcar como publicada | | | ✔ | ✔ |
| Editar manual de marca, conectar redes, invitar miembros | | | | ✔ |

**Flujo de estados de una pieza de contenido**

```
idea → borrador → en_revision → aprobado → programado → publicado
                      │
                      └──(devolver)──► borrador
```

| Transición | Quién |
|---|---|
| idea → borrador | creator, admin |
| borrador → en_revision | creator, admin |
| en_revision → aprobado | approver, admin |
| en_revision → borrador (devolver) | approver, admin |
| aprobado → programado (requiere fecha) | approver, admin |
| programado → publicado | approver, admin |
| publicado | estado final |

Toda transición se valida **en el servidor** (función SQL) y queda en el historial.

---

## 7. Base de datos (Postgres en Supabase)

Se crea con **migraciones SQL** en `supabase/migrations/` (una por tema, con fecha en el nombre). Todas las tablas llevan `id uuid primary key default gen_random_uuid()` y `created_at timestamptz default now()` salvo indicación.

### 7.1 Tablas

**Identidad y acceso**
- `profiles` (`id` = `auth.users.id`, `display_name`, `avatar_url`)
- `brands` (`name`, `slug`, `description`, `logo_asset_id`, `created_by`)
- `brand_members` (`brand_id`, `user_id`, `role` enum `admin|creator|approver|viewer`; PK compuesta)

**Manual de marca**
- `brand_colors` (`brand_id`, `name`, `hex`, `rgb`, `cmyk`, `pantone`, `role` enum `primary|secondary|accent|neutral|support`, `usage_notes`, `position`)
- `brand_fonts` (`brand_id`, `family`, `role` enum `title|body|accent`, `weights int[]`, `file_path`, `license_notes`)
- `brand_logos` (`brand_id`, `variant` (principal, horizontal, ícono, monocromo…), `asset_id`, `min_size_px`, `clear_space_notes`)
- `brand_guidelines` (`brand_id`, `section` enum `voz|tono|hacer|no_hacer|otro`, `title`, `body_md`, `position`)

**Medios y anotaciones**
- `asset_folders` (`brand_id`, `name`, `parent_id`)
- `assets` (`brand_id`, `folder_id`, `type` `image|video`, `name`, `storage_path`, `thumb_path`, `mime`, `size_bytes`, `width`, `height`, `duration_s`, `status` `pendiente|en_uso|usado|archivado`, `tags text[]`, `uploaded_by`, `parent_asset_id` (si es una versión editada), `edit_doc jsonb` (documento de edición no destructiva))
- `asset_comments` (`asset_id`, `author_id`, `parent_id` (para hilos), `body`, `kind` `general|pin`, `pos_x`, `pos_y` (0–1, relativos a la imagen), `video_time_s`, `resolved`)

**Bancos, plantillas y campañas**
- `network_templates` (`brand_id` nullable = plantilla global, `platform`, `key`, `name`, `width`, `height`, `safe_zone jsonb`, `max_caption`, `max_hashtags`, `notes`)
- `caption_bank` (`brand_id`, `platform` nullable, `title`, `body`, `status` `borrador|aprobado|retirado`, `approved_by`, `approved_at`, `uses int default 0`, `tags text[]`)
- `hashtag_sets` (`brand_id`, `name`, `tags text[]`, `platform` nullable, `status`, `approved_by`, `approved_at`)
- `cta_bank` (`brand_id`, `text`, `platform` nullable, `status`, `approved_by`, `approved_at`)
- `campaigns` (`brand_id`, `name`, `objective`, `start_date`, `end_date`, `status` `planeada|activa|finalizada`, `color`, `utm_campaign`, `notes`)

**Planner**
- `content_items` (`brand_id`, `campaign_id`, `title`, `status`, `caption`, `scheduled_at`, `assignee_id`, `created_by`, `notes`, `published_url`)
- `content_item_targets` (`content_item_id`, `social_account_id`, `template_id`, `caption_override`, `external_post_id`) — una fila por red destino
- `content_item_assets` (`content_item_id`, `asset_id`, `position`) — los medios referenciados
- `content_status_history` (`content_item_id`, `from_status`, `to_status`, `changed_by`, `comment`)
- `content_comments` (`content_item_id`, `author_id`, `body`)
- `reminders` (`brand_id`, `title`, `notes`, `remind_at`, `repeat_rule` (`none|weekly|monthly|yearly`), `kind` `fecha_clave|tarea|licencia`, `content_item_id`, `campaign_id`, `asset_id`, `done`, `notified_at`)

**Redes y métricas**
- `social_accounts` (`brand_id`, `platform` `instagram|tiktok`, `external_id`, `handle`, `display_name`, `avatar_url`, `status` `connected|expired|error|demo`; único por `brand_id + platform`)
- `social_tokens` (`account_id`, tokens **cifrados**, `expires_at`, `scopes`) — **sin acceso desde el cliente**, solo funciones de servidor
- `account_metrics_daily` (PK `account_id + date`; `followers`, `following`, `posts_count`, `reach`, `profile_views`, `views`, `raw jsonb`)
- `post_metrics_snapshots` (`social_account_id`, `external_post_id`, `content_item_id` nullable, `published_at`, `captured_at`, `views`, `likes`, `comments`, `shares`, `saves`, `reach`, `raw jsonb`)
- `social_comments` (opcional; `social_account_id`, `external_id`, `post_external_id`, `author_handle`, `text`, `commented_at`, `seen`) — guardar lo mínimo necesario
- `reports` (`brand_id`, `title`, `period_start`, `period_end`, `generated_by`, `storage_path`, `config jsonb`)

### 7.2 Seguridad (RLS) — lo más importante

Activa RLS en **todas** las tablas. Patrón base:

```sql
-- ¿El usuario actual pertenece a la marca?
create function public.is_brand_member(b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from brand_members where brand_id = b and user_id = auth.uid());
$$;

-- ¿Qué rol tiene?
create function public.brand_role(b uuid) returns text
language sql stable security definer set search_path = public as $$
  select role::text from brand_members where brand_id = b and user_id = auth.uid();
$$;

-- Ejemplo: lectura para miembros, escritura según rol
alter table assets enable row level security;
create policy "assets_select" on assets for select using (is_brand_member(brand_id));
create policy "assets_write"  on assets for all
  using (brand_role(brand_id) in ('admin','creator'))
  with check (brand_role(brand_id) in ('admin','creator'));
```

Reglas:
- **Toda tabla con `brand_id` usa el mismo patrón.** Las tablas hijas (por ejemplo `asset_comments`) validan a través de su padre.
- `social_tokens` **sin políticas** para `anon`/`authenticated`: solo accesible con la clave de servicio dentro de Edge Functions.
- **Transiciones de estado** solo mediante una función `transition_content_item(item_id, to_status, comment)` (`security definer`) que valida rol + transición, actualiza la pieza y escribe el historial. La tabla `content_items` **no** permite cambiar `status` con un `update` directo desde el cliente.
- **Storage:** bucket privado `brand-media`. Ruta: `{brand_id}/{asset_id}/original.ext`. La política de Storage extrae el primer segmento de la ruta (`(storage.foldername(name))[1]::uuid`) y llama a `is_brand_member`.
- Escribe **pruebas SQL** que comprueben que un usuario de la marca A no puede leer ni escribir nada de la marca B.

---

## 8. Módulos explicados desde cero

Cada módulo tiene: **qué es**, **qué debe hacer**, **criterio de hecho**.

### 8.1 Acceso y selector de marcas

**Qué es:** la puerta de entrada. Un usuario inicia sesión y ve las marcas a las que pertenece. Al elegir una, toda la app trabaja "dentro" de esa marca.

**Debe hacer**
- Registro e inicio de sesión con Supabase Auth (correo + contraseña o enlace mágico; Google opcional).
- Pantalla "Mis marcas" con tarjetas (logo, nombre, redes conectadas, próximos recordatorios).
- Crear marca (quien la crea queda como `admin`) e invitar miembros por correo con un rol.
- **Selector de marca activa** persistente en la barra superior; la marca activa vive en un `Context` y en la URL (`/m/:brandSlug/...`).
- Cambio de marca sin recargar la página.

**Hecho cuando:** dos usuarios de prueba ven marcas distintas y es imposible acceder a la ruta de una marca ajena (la base de datos devuelve vacío).

### 8.2 Manual de marca

**Qué es:** la "ficha de identidad" de la marca en un solo lugar, consultable por todo el equipo.

**Debe hacer**
- **Colores:** agregar con selector de color; guardar HEX y calcular RGB; campos opcionales CMYK y Pantone; rol (primario, secundario…) y notas de uso. Clic en un color copia el HEX.
- **Tipografías:** subir archivo `woff2` al bucket, registrarlo y cargarlo con `@font-face` para previsualizar un texto de ejemplo. Guardar pesos y notas de licencia.
- **Logos:** variantes (principal, horizontal, ícono, monocromo), tamaño mínimo y espacio de seguridad; se enlazan a assets del almacén.
- **Guías de voz y tono:** secciones con texto en Markdown (hacer / no hacer, ejemplos de frases).
- Vista de solo lectura "Manual" tipo documento para compartir internamente.
- **Integración:** la paleta y las fuentes de la marca activa se ofrecen automáticamente en el editor de imágenes (§8.10).

**Hecho cuando:** un `creator` ve el manual pero no puede editarlo; un `admin` sí; las fuentes subidas se ven aplicadas en la vista previa.

### 8.3 Almacén de medios

**Qué es:** la "biblioteca" de imágenes y videos de la marca, incluyendo los que están pendientes de publicar.

**Debe hacer**
- Subida por arrastrar y soltar o botón (en iPad: selector de archivos y fototeca). Subida **reanudable** para videos grandes.
- Al subir: leer dimensiones y duración, generar **miniatura** (en el cliente, con `canvas`; para video, un fotograma) y guardarla en `thumb_path`.
- Estados: `pendiente` (por publicar), `en_uso` (asociado a una pieza), `usado`, `archivado`.
- Carpetas, etiquetas, búsqueda por nombre/etiqueta, filtros por tipo y estado, orden por fecha.
- Vista de cuadrícula con miniaturas y vista de detalle (original, metadatos, dónde se usa).
- Descarga del **original sin recompresión** y acceso mediante URLs firmadas temporales.
- Respetar el límite de tamaño por archivo del plan de Supabase: validar antes de subir y mostrar un mensaje claro.

**Hecho cuando:** se suben 20 imágenes y 2 videos, se filtran por estado y etiqueta, y un usuario de otra marca no puede abrir ninguna URL.

### 8.4 Comentarios y anotaciones sobre el asset

**Qué es:** poder decir "este logo está muy pequeño" **señalando el lugar exacto** de la imagen, o "en este segundo hay un corte brusco" en un video, como si fuera un papel con notas adhesivas.

**Debe hacer**
- **Comentario general** del asset y **hilos de respuesta**.
- **Anotación con pin (imágenes):** al hacer clic o tocar un punto, se crea un pin numerado. Se guarda la posición como **fracción de la imagen** (`pos_x`, `pos_y` entre 0 y 1) para que sea correcta en cualquier tamaño de pantalla.
- **Anotación por tiempo (videos):** botón "comentar en este instante" que guarda `video_time_s`; al hacer clic en el comentario, el video salta a ese momento.
- Marcar un hilo como **resuelto**; filtro "pendientes / resueltos".
- Panel lateral con la lista de comentarios; al seleccionar uno, se resalta su pin. En iPad vertical el panel se abre como hoja inferior.
- Actualización en vivo con **Supabase Realtime** (opcional en la primera versión).
- Menciones `@usuario` (opcional, fase posterior).

**Hecho cuando:** dos usuarios ven los pines del otro, un pin sigue en el mismo lugar al cambiar el tamaño de la ventana, y se puede tocar un pin en el iPad.

### 8.5 Plantillas por red

**Qué es:** las "reglas del juego" de cada red social: tamaños y proporciones recomendados, límites de texto y zonas que la interfaz de la app tapa (por ejemplo, botones sobre el borde inferior de un video vertical).

**Debe hacer**
- Tabla `network_templates` con plantillas **globales** precargadas por `seed.sql` y la posibilidad de crear plantillas propias de la marca.
- Formatos iniciales (**verifica las medidas vigentes** en la documentación de cada red antes de fijarlas):
  - Instagram: publicación vertical 4:5, cuadrada 1:1, Reel/Story 9:16, carrusel.
  - TikTok: video vertical 9:16.
- Cada plantilla define `width`, `height`, `safe_zone` (márgenes en %), `max_caption`, `max_hashtags`.
- Al planear una pieza, se elige plantilla por red destino y la app **avisa** si el medio no cumple la proporción o el caption excede el límite.
- Vista previa con **superposición de zonas seguras** sobre el medio.
- El editor (§8.10) puede crear un lienzo con las medidas de una plantilla.

**Hecho cuando:** al elegir una imagen cuadrada para una plantilla 9:16, la app lo advierte y muestra las zonas seguras.

### 8.6 Banco de captions, hashtags y CTA aprobados

**Qué es:** una biblioteca de textos ya revisados que el equipo puede reutilizar, para no escribir y aprobar lo mismo cada vez.

**Debe hacer**
- Tres secciones: **captions**, **conjuntos de hashtags** y **CTA** (por ejemplo, "Escríbenos por DM").
- Cada elemento tiene estado: `borrador → aprobado → retirado`. **Solo un `approver` o `admin` puede aprobar.**
- Al redactar una pieza, un selector permite insertar elementos **solo aprobados**; el contador `uses` aumenta.
- Filtro por red y etiquetas; contador de caracteres con los límites de la plantilla.
- Si se edita un elemento aprobado, vuelve a `borrador` (requiere nueva aprobación).

**Hecho cuando:** un `creator` no puede aprobar, un `approver` sí, y el selector del planner no muestra borradores.

### 8.7 Campañas

**Qué es:** una "carpeta" de planificación: un objetivo, un rango de fechas y todas las piezas que lo cumplen.

**Debe hacer**
- CRUD de campañas con nombre, objetivo, fechas, color y parámetro UTM.
- Asignar piezas a una campaña (campo opcional en la pieza).
- Vista de campaña: línea de tiempo, piezas por estado, avance (% publicadas) y métricas agregadas de sus publicaciones (cuando existan).
- El calendario permite **filtrar y colorear por campaña**.

**Hecho cuando:** al abrir una campaña se ve su progreso y se pueden filtrar sus piezas en el kanban.

### 8.8 Planner: kanban y calendario con medios

**Qué es:** el centro de operación. Cada **pieza de contenido** es una tarjeta que sabe qué medios usa, para qué red es, cuándo sale y en qué estado está.

**Debe hacer**
- **Kanban** por estado (`idea`, `borrador`, `en revisión`, `aprobado`, `programado`, `publicado`). Arrastrar una tarjeta llama a `transition_content_item`; si no tienes permiso o la transición es inválida, la tarjeta vuelve a su lugar y se explica el motivo.
- **Calendario** (mes y semana) con las piezas en su `scheduled_at`, coloreadas por estado o campaña, y con los recordatorios y fechas clave de la marca.
- **Editor de pieza:** título, campaña, redes destino (con plantilla y caption por red), selector de medios del almacén (se muestran miniaturas), banco de captions/hashtags/CTA, fecha y hora, responsable.
- Al asociar un medio, su estado cambia a `en_uso`; al publicar la pieza, a `usado`.
- Vista de detalle con historial de estados y comentarios de la pieza.
- Alertas visuales: piezas sin medio, sin fecha, o con medio que no cumple la plantilla.
- **Publicación:** en la primera versión es **manual** (la app recuerda, el usuario publica y pega el enlace). La publicación automática por API queda como mejora futura.

**Hecho cuando:** se arrastra una pieza de borrador a revisión en el iPad con el dedo, se ve en el calendario y los medios asociados aparecen en la tarjeta.

### 8.9 Recordatorios

**Qué es:** avisos para no olvidar cosas importantes de la marca.

**Debe hacer**
- Crear recordatorios con fecha/hora, tipo (fecha clave, tarea, licencia) y repetición (ninguna, semanal, mensual, anual). Pueden vincularse a una pieza, campaña o asset.
- Aparecen en el calendario y en una lista "Próximos" del dashboard.
- **Aviso por correo** (Resend, plan gratuito) y en la app. Una función programada con `pg_cron` + Edge Function revisa cada ciertos minutos los recordatorios vencidos sin `notified_at`.
- Recordatorios automáticos sugeridos: "Pieza programada para mañana", "Pieza aprobada sin fecha".

**Hecho cuando:** un recordatorio creado para dentro de 5 minutos genera un correo una sola vez.

### 8.10 Editor de imágenes sencillo

**Qué es:** un editor dentro de la app para retocar una imagen del almacén sin salir de ella: recortar, añadir texto, aplicar filtros y ajustes básicos.

**Principio clave: edición no destructiva.**
1. El **original nunca se modifica**.
2. Las ediciones se guardan como un **documento JSON** (`edit_doc`): capas, recorte, filtros y valores.
3. Al exportar, se **renderiza a la resolución del original** (o a la de la plantilla elegida) en un archivo nuevo.
4. El resultado se guarda como un **nuevo asset** con `parent_asset_id` apuntando al original.

**Funciones del alcance inicial**
- Recortar y rotar (con proporciones predefinidas de las plantillas).
- Ajustes: brillo, contraste, saturación, exposición, temperatura, nitidez.
- Filtros predefinidos (con intensidad ajustable) y vista antes/después.
- Texto: fuente de la marca, tamaño, color de la paleta, alineación, sombra.
- Capas de logo/imagen con posición, escala y opacidad.
- Deshacer/rehacer y guardado automático del documento de edición.
- Exportación: **PNG** (sin pérdida), **WebP sin pérdida** o **JPEG con calidad alta** (≥ 0.92; avisar que JPEG siempre recomprime).
- Compatible con toque en iPad (gestos de pellizco para zoom).

**Limitaciones que debes conocer y comunicar**
- El `canvas` del navegador trabaja en **sRGB** y **no conserva perfiles ICC ni EXIF** al exportar.
- Safari/iPad limita el tamaño máximo del canvas; para imágenes muy grandes se debe avisar o exportar por mosaicos.
- "Sin perder calidad" significa: original intacto + exportación a resolución completa + formato sin pérdida disponible.
- **Video fuera del alcance** (recorte u otros cambios requerirían `ffmpeg.wasm` y más tiempo).

**Sugerencia de implementación:** `react-konva` para capas y texto, y filtros de Konva o `canvas` para los ajustes. Si el tiempo apremia, evalúa una librería de editor ya hecha (por ejemplo, Filerobot Image Editor) y personalízala; construirlo desde cero es el módulo más costoso.

**Hecho cuando:** una foto de 4000 px se edita, se exporta a 4000 px en PNG y se guarda como asset nuevo, y el original sigue idéntico.

### 8.11 Conexión de redes (Instagram y TikTok)

**Qué es:** el vínculo entre una marca y sus perfiles reales para leer métricas.

**Cómo funciona (OAuth, explicado simple):** el administrador pulsa "Conectar Instagram", la app lo lleva a Meta, él autoriza y Meta devuelve un **código** a nuestra *Edge Function*, que lo cambia por un **token** (una llave temporal). Ese token se guarda **cifrado en el servidor** y nunca llega al navegador.

**Debe hacer**
- Botón "Conectar" por red en la configuración de la marca (solo `admin`).
- Edge Function `oauth-callback` que intercambia el código por token y guarda la cuenta.
- Edge Function `refresh-tokens` programada: Instagram usa tokens de larga duración renovables y TikTok usa tokens de acceso de vida corta con *refresh token*. Consulta la documentación vigente de cada red.
- Estado visible: `connected`, `expired` (pedir reconectar), `error`, `demo`.
- **Modo demostración (obligatorio):** una cuenta con `status = demo` que genera métricas ficticias coherentes. Sirve para desarrollar, probar y mostrar el proyecto **sin depender de aprobaciones de las redes**.
- **Alternativa manual:** importar métricas desde un archivo CSV exportado de las herramientas propias de cada red.

**Requisitos de las redes (verifica siempre la documentación oficial):**
- **Instagram:** solo cuentas **Business o Creator** (las personales no funcionan con la API oficial). Para cuentas que no son tuyas hace falta **App Review** de Meta, que puede tardar semanas y pide política de privacidad. Con tus propias cuentas y usuarios de prueba puedes trabajar en modo desarrollo.
- **TikTok:** cuenta de desarrollador, aplicación con *Login Kit* y los permisos (*scopes*) aprobados. La demografía de audiencia y el texto de los comentarios tienen acceso muy limitado en la API pública.

### 8.12 Sincronización de métricas (snapshots)

**Qué es:** un trabajo automático que, cada día, "fotografía" las métricas de cada cuenta y publicación y las guarda. Las APIs dan poco historial, así que **el histórico lo construimos nosotros**.

**Qué se intenta obtener (según permisos disponibles):**

| | Instagram | TikTok |
|---|---|---|
| Cuenta | seguidores, alcance, vistas, visitas al perfil, publicaciones | seguidores, seguidos, likes totales, número de videos |
| Publicación | alcance, vistas, likes, comentarios, compartidos, guardados | vistas, likes, comentarios, compartidos |
| Comentarios nuevos | lectura de comentarios (webhooks o consulta periódica) | solo contadores (texto con acceso restringido) |
| Audiencia (país, edad, género) | disponible con requisitos mínimos de seguidores | normalmente **no** disponible por API |

> Los nombres de las métricas cambian con el tiempo (por ejemplo, "impresiones" pasó a "vistas" en Instagram). El agente debe consultar la **referencia vigente** antes de implementar y no inventar campos.

**Debe hacer**
- Edge Function `sync-metrics` invocada **una vez al día** por `pg_cron` (o Vercel Cron diario). Por cada cuenta conectada: pide métricas de la cuenta → `account_metrics_daily`; pide las publicaciones recientes → `post_metrics_snapshots`.
- Para comparar publicaciones con justicia, guardar un snapshot a las **24 h y 48 h** de publicada, además del diario.
- Si una pieza del planner coincide con una publicación (por enlace o ID), enlazarlas con `content_item_id`.
- Manejo de errores y **límites de uso (rate limits)**: reintentos con espera, registro del error en la cuenta.
- Minimización de datos: guardar solo lo necesario de los comentarios de terceros (privacidad).

### 8.13 Dashboard

**Qué es:** la pantalla de inicio de cada marca, con lo más importante de un vistazo.

**Debe mostrar (por marca, con selector de red y de periodo: 7 / 28 / 90 días)**
- **Tarjetas KPI:** seguidores (con variación), alcance/vistas, interacciones, tasa de interacción.
- **Gráfico de evolución** de seguidores y de alcance desde `account_metrics_daily`.
- **Top publicaciones** del periodo y las de peor rendimiento.
- **Rendimiento por tipo de contenido** (imagen, video/Reel, carrusel) y **por campaña**.
- **Comentarios nuevos** (Instagram) y contador de comentarios de TikTok.
- **Operación interna:** piezas por estado, "Necesita tu atención" según el rol, próximas publicaciones (7 días), recordatorios próximos, medios pendientes por publicar.
- **Mejor hora para publicar** (ver §8.14).
- Botón **Generar reporte PDF** (ver §8.15).
- Estados vacíos claros ("Aún no hay datos: conecta una red o activa el modo demostración").

**Rendimiento:** consultas con índices por `(account_id, date)` y agregaciones mediante vistas o funciones SQL; el frontend no debe traer miles de filas para sumar.

### 8.14 Mejor hora para publicar

**Qué es:** una recomendación basada en **tus propias publicaciones pasadas**: en qué día y franja horaria les va mejor. No es magia: es estadística sencilla sobre tus snapshots.

**Algoritmo propuesto (por red, por separado)**
1. Tomar las publicaciones con snapshot a 48 h (para comparar en igualdad de condiciones).
2. Calcular un **puntaje de rendimiento** por publicación: tasa de interacción = (likes + comentarios + compartidos + guardados) ÷ alcance (Instagram) o ÷ vistas (TikTok). Si falta el alcance, usar vistas ÷ seguidores.
3. **Normalizar:** dividir cada puntaje entre la mediana de la cuenta, para que 1,0 signifique "normal" y 1,3 "30 % mejor que lo normal".
4. Convertir la hora de publicación a `America/Bogota` y agrupar por **día de la semana × franja de 2 horas**.
5. Para cada grupo, calcular el promedio ajustado con **contracción hacia 1,0** para no fiarse de pocos datos: `ajustado = (n·promedio + k·1) / (n + k)` con `k = 3`.
6. Mostrar un **mapa de calor 7×12** y las **3 mejores franjas**, con su nivel de confianza (por ejemplo, "poca data" si `n < 3`).
7. Si hay menos de ~10 publicaciones en total, mostrar un mensaje "Aún hay pocos datos" y, como orientación inicial, sugerencias generales etiquetadas claramente como **genéricas**, no calculadas.

**Hecho cuando:** con datos de demostración, el mapa de calor se pinta, las franjas con pocos datos se marcan y la recomendación cambia al cambiar la red o el periodo. Incluye **pruebas unitarias** de la función de cálculo con datos de ejemplo.

### 8.15 Reportes en PDF

**Qué es:** un documento descargable con el resumen de un periodo, para presentar o archivar.

**Contenido del reporte**
- Portada con logo, marca, periodo y fecha de generación (colores y fuentes de la marca).
- Resumen: KPI del periodo con variación frente al periodo anterior.
- Evolución de seguidores y alcance (gráficas).
- Top publicaciones (con miniatura, red, fecha y métricas).
- Resultados por campaña.
- Mejor hora para publicar (mapa de calor y top 3).
- Notas y conclusiones editables por el usuario antes de generar.

**Cómo hacerlo (opción recomendada para este proyecto):** generar el PDF **en el navegador** con `@react-pdf/renderer`, dibujando las gráficas con primitivas SVG del propio componente (los gráficos de `recharts` del dashboard no se incrustan directamente). Esto evita servidores con navegador sin pantalla, que no encajan con los planes gratuitos. Guarda el PDF en Storage y registra la fila en `reports` para consultarlo después.

**Hecho cuando:** se genera un PDF de 3–4 páginas con datos de demostración, legible al imprimir y con el logo de la marca.

---

## 9. Estructura de carpetas propuesta

```
marcahub/
├── client/
│   ├── public/                  # manifest.webmanifest, íconos
│   └── src/
│       ├── app/                 # rutas, layout, providers
│       ├── components/          # botones, modales, tablas, inputs (reutilizables)
│       ├── features/
│       │   ├── auth/            ├── brands/        ├── brand-manual/
│       │   ├── media/           ├── annotations/   ├── templates/
│       │   ├── bank/            ├── campaigns/     ├── planner/   # kanban + calendario
│       │   ├── reminders/       ├── editor/        ├── networks/
│       │   ├── dashboard/       └── reports/
│       ├── hooks/
│       ├── i18n/                # es.json
│       ├── lib/                 # supabaseClient, utilidades, fechas
│       └── styles/              # tokens CSS
├── supabase/
│   ├── migrations/              # SQL versionado
│   ├── functions/               # oauth-callback, sync-metrics, refresh-tokens, send-reminders
│   ├── tests/                   # pruebas de RLS
│   └── seed.sql                 # plantillas globales y datos de demostración
├── docs/
│   └── CONTEXT.md               # este documento
├── vercel.json                  # rewrite de SPA
└── package.json
```

Cada carpeta de `features/` contiene sus componentes, hooks de consulta (TanStack Query) y esquemas Zod. Un módulo **no** importa de otro módulo; lo compartido va a `components/`, `hooks/` o `lib/`.

---

## 10. Variables de entorno

**Cliente (Vercel y `.env.local`)** — seguras de exponer porque RLS protege los datos:
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

**Servidor (secretos de Supabase para Edge Functions)** — **nunca** en el cliente ni en el repositorio:
```
META_APP_ID=
META_APP_SECRET=
TIKTOK_CLIENT_KEY=
TIKTOK_CLIENT_SECRET=
TOKEN_ENCRYPTION_KEY=
RESEND_API_KEY=
```

Incluye un `.env.example` con los nombres y sin valores.

---

## 11. Despliegue

- **Supabase:** crear proyecto (elige una región cercana a tus usuarios), aplicar migraciones con la CLI (`supabase db push`), crear el bucket `brand-media` privado, configurar la URL del sitio y las URL de redirección de Auth, y cargar los secretos de las funciones.
- **Vercel:** importar el repositorio, **directorio raíz `client`**, comando de build `npm run build`, salida `dist`. Añadir las dos variables `VITE_*`. Archivo `vercel.json` con *rewrite* de todas las rutas a `index.html` para que React Router funcione al recargar.
- **Entornos:** idealmente un proyecto Supabase de **desarrollo** y otro de **producción**. Para uso académico, uno solo está bien, pero no pruebes experimentos destructivos sobre datos reales.
- **Límites de los planes gratuitos** (almacenamiento, tamaño de archivo, pausa por inactividad, tareas programadas): verifícalos en la documentación vigente antes de decidir; condicionan el diseño del almacén de video.

---

## 12. Seguridad y legalidad (resumen)

- RLS activado en todo, con pruebas. Nunca confiar en que "el frontend oculta el botón".
- Tokens de redes cifrados y solo en servidor.
- Archivos en buckets privados con URLs firmadas de corta duración.
- No guardar contraseñas de redes sociales **jamás**; solo OAuth oficial. No usar APIs no oficiales ni *scraping* (violan los términos y arriesgan bloqueos).
- Datos personales de terceros (autores de comentarios): guardar lo mínimo, indicarlo en una política de privacidad sencilla. Si hay usuarios en Colombia, considerar la Ley 1581 de 2012 (Habeas Data).
- Respetar licencias de música, fotos y tipografías que se suban al almacén.

---

## 13. Plan por fases (checklist)

> Regla: al terminar cada fase, la app debe **funcionar completa** y estar en un commit etiquetado. Commits en inglés con formato convencional (`feat:`, `fix:`, `chore:`).

- [ ] **Fase 0 — Clonar y limpiar.** Clon independiente, remoto nuevo, renombrar, `.env.example`, i18n básico en español.
- [ ] **Fase 1 — Base en Supabase.** Proyecto, migraciones (`profiles`, `brands`, `brand_members`), Auth, RLS, `is_brand_member`/`brand_role`, pantallas "Mis marcas" y selector de marca. Eliminar `server/`. Primer despliegue a Vercel. *Hecho:* dos usuarios, dos marcas, aislamiento comprobado.
- [ ] **Fase 2 — Manual de marca.** Colores, fuentes, logos, guías de voz y tono, vista "Manual".
- [ ] **Fase 3 — Almacén de medios.** Bucket, subida (con reanudación), miniaturas, estados, carpetas, etiquetas, búsqueda.
- [ ] **Fase 4 — Comentarios y anotaciones.** Comentarios generales, hilos, pines en imagen, tiempo en video, resolver.
- [ ] **Fase 5 — Bancos, plantillas y campañas.** Captions/hashtags/CTA con aprobación, plantillas con `seed.sql`, CRUD de campañas.
- [ ] **Fase 6 — Planner y recordatorios.** `content_items`, función `transition_content_item`, kanban táctil, calendario, editor de pieza con medios y bancos, recordatorios con correo.
- [ ] **Fase 7 — Redes y métricas.** Modo demostración primero; luego Instagram (con cuenta propia de prueba); luego TikTok. Snapshots diarios.
- [ ] **Fase 8 — Dashboard y mejor hora.** KPI, gráficas, top publicaciones, mapa de calor, pruebas del algoritmo.
- [ ] **Fase 9 — Reportes PDF.**
- [ ] **Fase 10 — Editor de imágenes.**
- [ ] **Fase 11 — Pulido.** Revisión en iPad real, accesibilidad básica (foco visible, contraste, `aria-label`), estados vacíos y de error, README final en español.

---

## 14. Fuera de alcance (por ahora)

- Publicación automática en Instagram/TikTok.
- Edición de video.
- Bandeja unificada para responder comentarios.
- Otras redes (YouTube, X, LinkedIn…).
- Aplicación móvil nativa y optimización para teléfonos pequeños.
- Facturación, planes o multi-organización a gran escala.

---

## 15. Instrucciones para el agente (Opencode)

1. Lee este documento y `AGENTS.md` antes de empezar. Trabaja **solo en la fase indicada**.
2. Antes de usar una librería o API (Supabase, Meta Graph API, TikTok, dnd-kit, Konva), **consulta su documentación vigente**; no asumas nombres de métricas ni parámetros.
3. Ninguna lógica de permisos puede vivir solo en el frontend. Toda tabla nueva con `brand_id` debe llevar RLS y una prueba de aislamiento.
4. No inventes diseño: sigue `UI.md` y los tokens CSS existentes. Si falta una decisión visual, **pregunta**.
5. Todos los textos de interfaz en `i18n/es.json`.
6. Cada pantalla debe revisarse en ancho de iPad (vertical y horizontal) y PC, con interacción táctil.
7. No guardes secretos en el repositorio ni en archivos de configuración versionados.
8. Explica cada decisión técnica de forma que el autor pueda defenderla: prefiere soluciones simples y legibles sobre soluciones ingeniosas.
9. Escribe pruebas para: función de transiciones, políticas RLS, cálculo de mejor hora y utilidades de fechas.

---

## 16. Glosario

- **RLS (Row Level Security):** regla en la base de datos que decide qué filas puede ver o modificar cada usuario.
- **Edge Function:** pequeño programa que corre en los servidores de Supabase; sirve para lo que no debe hacerse en el navegador.
- **OAuth:** mecanismo estándar para que una app acceda a tu cuenta de otra plataforma sin conocer tu contraseña.
- **Token:** llave temporal que da acceso limitado a una cuenta.
- **Snapshot:** foto de métricas en un momento dado.
- **Edición no destructiva:** editar guardando las instrucciones de cambio en lugar de sobrescribir el archivo original.
- **Safe zone (zona segura):** área de un video o imagen donde el contenido importante no queda tapado por la interfaz de la red.
- **CTA (Call To Action):** frase que invita a actuar ("Compra ahora", "Escríbenos").
- **Tasa de interacción:** proporción de personas que reaccionan respecto a las que vieron o fueron alcanzadas.
- **App Review:** revisión que hace Meta antes de permitir que una app lea datos de cuentas ajenas.

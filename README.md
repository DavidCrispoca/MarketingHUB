# MarketingHUB

Aplicación web para que un equipo pequeño gestione el contenido de una o varias
marcas en **Instagram** y **TikTok**: identidad de marca, almacén de medios,
anotaciones, bancos de textos aprobados, campañas, planner (kanban + calendario),
recordatorios, métricas, dashboard, reportes PDF y un editor de imágenes sencillo.

Pensada para **PC e iPad**.

---

## Estado

Proyecto en construcción. Fases **3–10 avanzan parcialmente**: los módulos principales
ya están en el código y faltan integraciones externas y pasos de puesta en marcha.

Consulta el plan de trabajo por fases en `gitignore/plan.md` (material de trabajo, no
versionado).

### Qué puedes hacer hoy

- Entrar con **nombre + código** (sin roles, sin contraseña).
- Crear varias **marcas** bajo el mismo código y cambiar entre ellas.
- En cada marca, **editar su manual**: paleta de colores (con RGB generado, CMYK,
  Pantone y copiar el HEX), tipografías con archivo propio y vista previa, logos con
  tamaño mínimo y espacio de seguridad, y guías de **voz y tono** en Markdown.
- Abrir el manual como **documento de solo lectura**, listo para imprimir o guardar en
  PDF y compartirlo con el equipo.
- Subir imágenes y videos al **almacén privado** de cada marca, organizarlos por
  carpetas y etiquetas, filtrar por estado/tipo y descargar el archivo original.
- Anotar medios con comentarios, hilos, pines sobre imágenes y marcas de tiempo en
  videos.
- Guardar captions, grupos de hashtags, llamadas a la acción, plantillas por red y
  campañas.
- Crear piezas en el planner, asociarles medios y campañas, moverlas entre **Idea,
  Borrador y Programado**, ver el calendario y crear recordatorios.
- Abrir cada sección de la app como un menú desplegable, con una línea que explica para
  qué sirve antes de entrar.
- Registrar métricas manualmente en modo demo, consultar un dashboard y guardar una
  copia editada de una imagen sin modificar el original.
- Descargar el **reporte mensual en PDF**: 9 diapositivas 16:9 con Instagram y TikTok,
  comparación contra el mes anterior, demografía, tráfico, mejores piezas y propuesta del
  mes siguiente.

El almacén admite archivos de hasta 100 MB; las cargas mayores a 6 MB usan partes
reanudables. Las métricas se ingresan manualmente;
la conexión automática requiere credenciales y configuración de Meta/TikTok. El reporte
mensual se genera en el navegador y queda registrado en la tabla `reports`; el manual
sigue usando la impresión del navegador para su versión documento.

---

## Requisitos

- Node.js 20 o superior (probado con Node 24).
- npm 10 o superior.

---

## Revisar en local

```bash
npm install
```

La app arranca directamente en **modo local** con una marca de demostración y datos
precargados para revisar manual, medios, bancos, planner, métricas y editor. Los cambios
y archivos que agregues se guardan en este navegador (LocalStorage + IndexedDB); no se
envían a ningún servidor. No hace falta `.env.local` ni una cuenta de Supabase.

```bash
npm install
npm run dev
```

Abre <http://localhost:5173/>. La primera carga puede tardar unos segundos mientras se
crea la base local. Puedes borrar los datos del sitio desde la configuración del
navegador para volver al conjunto de demostración inicial.

Cuando termine la revisión, copia `.env.example` a `.env.local`, añade los datos
públicos del proyecto Supabase y establece `VITE_DATA_MODE=supabase`:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_DATA_MODE=supabase
```

Los datos locales y los datos remotos son entornos separados: el contenido creado en
modo local no se sincroniza automáticamente con Supabase.

---

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo en `http://localhost:5173` |
| `npm run build` | Compila la app a `dist/` |
| `npm run preview` | Sirve la compilación de producción |
| `npm run lint` | Ejecuta ESLint |
| `npm run format` | Formatea con Prettier |

---

## Tecnologías

- **React 19** + **Vite**
- **React Router** para las vistas
- **TanStack Query** para el estado del servidor
- **Supabase** (Auth, Postgres con RLS, Storage, Edge Functions)
- **react-markdown** para las guías de voz y tono
- **Zod** para validación
- **CSS plano** con custom properties (sistema de diseño propio)

Las migraciones nuevas de medios, comentarios, bancos, planner y métricas están en
`supabase/migrations/`; aplícalas al proyecto Supabase antes de usar esos módulos.

---

## Acceso

Sin roles. Cada persona entra con su **nombre** y un **código** entregado por el
equipo. Si el código existe y está activo, entra; bajo ese código vive una o varias
marcas. El nombre se usa para registrar quién cambió qué.

El código no se escribe nunca en la app: se crea y se revoca desde el SQL Editor de
Supabase (`create_access_code` / `revoke_access_code`).

---

## Estructura

```
.
├── public/                # manifest y assets estáticos
├── src/
│   ├── app/               # rutas, layout y providers
│   ├── components/        # UI reutilizable
│   ├── features/          # un módulo por dominio (auth, brands, manual, media, planner…)
│   ├── i18n/              # textos (es.json)
│   ├── lib/               # cliente de Supabase, fechas, utilidades
│   └── styles/            # tokens y estilos globales
├── docs/CONTEXT.md        # contexto funcional del proyecto
├── docs/2026-11-02-cambios.md  # registro de la jornada de rediseño y reporte
├── supabase/              # migraciones, función redeem-code, pruebas SQL y seed
└── vercel.json            # rewrite para SPA
```

---

## Limitaciones conocidas

- Las migraciones nuevas deben aplicarse al proyecto Supabase para activar los módulos
  de medios, bancos, planner, métricas y editor.
- La conexión automática a Instagram/TikTok requiere credenciales de aplicaciones
  aprobadas y secretos de servidor. El dashboard funciona con datos ingresados a mano y
  el reporte mensual usa datos de demostración hasta que exista esa conexión.
- Facebook no está soportado: `social_accounts` solo acepta Instagram y TikTok.
- El dashboard suma únicamente los snapshots diarios de Instagram; TikTok se lee del
  resumen mensual dentro del reporte.
- El historial de reportes guarda el periodo, el autor y las notas, pero no el PDF: el
  archivo se regenera desde los datos cuando se descarga.
- El editor crea copias con herramientas básicas de Canvas; no incluye aún edición por
  capas, stickers ni exportación avanzada.
- Los recordatorios notifican mientras la app está abierta en el dispositivo que otorgó
  permiso; todavía no envían correo ni avisos cuando el navegador está cerrado.
- El manual de marca ya funciona, pero las tipografías usan un solo archivo por familia
  (los pesos declarados comparten archivo).
- El proyecto se apoya en el scaffold de Vite (atribuido en este repositorio).

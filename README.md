# CODED Stars Hub · Prueba 1

Una primera versión para revisar con Isa y Ela: encontrar una JDP, solicitar participar y coordinar la selección de un Coded Star.

**Versión de revisión con cuentas y datos ficticios.** Las funciones del Hub siguen abiertas a comentarios del equipo.

![Inicio de CODED Stars Hub](docs/revision/inicio.png)

## Para Isa y Ela

No hace falta instalar nada para revisar estas imágenes y documentos:

- **[Ver la presentación en PDF](docs/revision/Revision-CODED-Stars-Hub.pdf)**: recorrido por las pantallas principales.
- **[Guía del equipo](GUIA-EQUIPO.md)**: registrar reuniones, revisar solicitudes y publicar contenido.
- **[Proceso de las JDP](PROCESO-JDP.md)**: los cinco datos del calendario y las funciones propuestas para organizarlos.
- **[Recorrido de 7 minutos](PARA-MOSTRAR.md)**: una guía para presentar la versión.

**Este enlace de GitHub muestra el proyecto y su presentación. La plataforma interactiva funciona por ahora en la computadora del proyecto.** El enlace `localhost` o `127.0.0.1` no permite entrar desde otro dispositivo.

## Qué se puede probar en la plataforma

| Coded Star | Anfitrión | Coordinación |
| --- | --- | --- |
| Buscar reuniones y verlas en su zona horaria | Consultar sus reuniones y al Star confirmado | Registrar y editar las JDP |
| Solicitar participar y seguir su estado | Responder preguntas y agregar indicaciones | Revisar candidatos y elegir manualmente |
| Preparar su historia y preguntar al equipo | Cerrar una reunión y registrar su resultado | Publicar novedades y consultar seguimiento |
| Contar cómo fue su participación | Ver sus propios avisos | Administrar con perfiles separados de Isa y Ela |

Varias personas pueden solicitar la misma JDP. **Solo administración elige al participante y solo uno queda confirmado.** Si cancela, el equipo elige manualmente un reemplazo.

### Registrar una JDP

El formulario principal pide colegio, programa opcional, fecha, hora de Orlando y enlace de acceso. La zona original es **America/New_York**, con el cambio de horario de verano automático. El estudiante ve la hora convertida a la zona que eligió.

Idioma, anfitrión, duración e indicaciones están en opciones de coordinación. No se inventan datos cuando falta información.

![Coordinación y próximas acciones](docs/revision/coordinacion.png)

![Revisión de solicitudes](docs/revision/solicitudes.png)

## Ejecutar en una computadora

Requisitos: **Node.js 24** y **pnpm**.

```sh
pnpm install
```

Copia `.env.example` a `.env.local` y completa `SESSION_SECRET` con un valor aleatorio largo. Puedes generarlo con:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Luego:

```sh
pnpm dev
```

Abre **http://localhost:3000**. La pantalla permite elegir Administración → Isa o Ela, Anfitrión o Coded Star. La contraseña de demostración es `Demo2026!`. Las cuentas son de prueba; no deben reutilizarse para información real.

Los datos locales se guardan en `.data/hub.sqlite`, fuera del código que se sube a GitHub. `CODED_DEMO_DB` permite usar otra ruta.

## Comprobaciones

```sh
pnpm test
pnpm typecheck
pnpm build
pnpm start
```

La revisión de esta versión incluye **146 comprobaciones unitarias** y **244 comprobaciones de servidor**, además de un recorrido en navegador por creación, solicitud, selección, acceso del anfitrión, cierre y resultado del Star. Los detalles y las condiciones de las pruebas están en **[VERIFICATION.md](VERIFICATION.md)**.

Las pruebas de servidor modifican datos: deben ejecutarse exclusivamente con una base de prueba independiente. Instrucciones completas en **[DETALLES-TECNICOS.md](DETALLES-TECNICOS.md)**.

## Código y recursos

- `app/`: pantallas, componentes y rutas del servidor.
- `lib/`: permisos, reuniones, solicitudes, horarios y almacenamiento.
- `public/`: marca, fotografías y créditos.
- `tests/`: comprobaciones de lógica y de servidor.
- **[Detalles técnicos](DETALLES-TECNICOS.md)** y **[diseño](DISENO.md)**.
- **[Fuentes de marca](BRAND_SOURCES.md)** y **[créditos de fotografías](public/photo-credits.html)**.

Next.js, TypeScript y Tailwind. El asistente es una ayuda local basada en reglas y en los datos permitidos de cada cuenta; funciona sin API de pago y no es GPT.

## Antes de una publicación con usuarios reales

Esta versión utiliza cuentas de demostración y SQLite local. El servidor comprueba los permisos, pero las credenciales de prueba son públicas. Las notificaciones funcionan dentro del Hub.

Para alojarla en Vercel hay que conectar una base compartida y configurar autenticación de producción. El disco local de las funciones no proporciona persistencia compartida. El uso de datos reales de menores requiere autorización.

Esta revisión no implica la aprobación de CODED. Las fotografías ilustran lugares; no garantizan actividades de una edición concreta. Los créditos y derechos de marca se conservan en sus documentos de origen.

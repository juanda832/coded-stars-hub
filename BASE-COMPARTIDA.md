# Almacenamiento de la beta

La versión alojada utiliza PostgreSQL de Neon. Reuniones, solicitudes, avisos, publicaciones, respuestas y conversaciones del asistente se guardan en tablas compartidas. No se guardan archivos SQLite en las funciones de Vercel.

La demo local conserva su archivo SQLite y los mismos recorridos. Si `DATABASE_URL` está configurada, se utiliza PostgreSQL. En Vercel, la ausencia de esa variable bloquea las operaciones: nunca se cambia silenciosamente a un archivo temporal.

## Entornos y migraciones

El entorno de producción usa `coded_hub_beta`; las vistas previas, `coded_hub_preview`. Las pruebas de escritura exigen un esquema `coded_hub_qa_*`. Las credenciales se configuran en variables privadas, fuera del repositorio y de los archivos públicos.

`scripts/migrate-database.mjs` aplica `migrations/001-shared-store.sql` con una conexión directa, sin borrar ni reemplazar registros. Debe ejecutarse antes del despliegue, con `DATABASE_URL_UNPOOLED` y `CODED_DATABASE_SCHEMA` explícitos. El comando es `pnpm db:migrate`; no imprime las credenciales. La primera sesión autorizada carga los ejemplos ficticios una sola vez.

## Selección y cambios simultáneos

Una transacción de PostgreSQL abarca cada operación completa del Hub. Un bloqueo por entorno serializa los recorridos de esta beta pequeña y permite que los cambios, las comprobaciones y los avisos se confirmen juntos. Si algo falla, se revierte todo. Un índice único parcial impide además dos solicitudes confirmadas para una misma reunión, incluso ante escrituras ajenas a los controles de la aplicación.

Una cancelación deja el lugar libre y devuelve las solicitudes disponibles a revisión. Ningún proceso elige automáticamente al reemplazo. Las publicaciones conservan su control de versión para avisar cuando otra persona las editó.

La serialización prioriza la consistencia para una beta de poco tráfico. Antes de ampliar significativamente el número de usuarios, conviene sustituir ese bloqueo general por bloqueos por reunión y por publicación y revisar los tiempos de respuesta.

## Comprobación

`pnpm test:storage` exige credenciales reales de PostgreSQL y un esquema aislado `coded_hub_qa_*` ya migrado. Comprueba persistencia desde otro proceso, múltiples solicitudes, confirmaciones simultáneas, reasignación manual, privacidad, ediciones en conflicto, informes y reversión ante un fallo. Las comprobaciones de acceso personal se ejecutan por separado; no utilizan las identidades de Isa ni Ela.

El asistente sigue funcionando con reglas locales, sin llamadas a una API de IA de pago.

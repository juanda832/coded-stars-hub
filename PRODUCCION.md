# Espacio de trabajo para Isa y Ela

**Preparado técnicamente, pendiente de activación.** El enlace actual sigue siendo la beta con acceso de desarrollo y ejemplos. Todavía no debe utilizarse como sistema definitivo con datos reales.

## Preparado

- Permisos personales de administración para Juan, Isa y Ela; no se comparten contraseñas. Cada persona verifica su correo.
- Un espacio del equipo vacío, separado de la base de ejemplos. No se precargan colegios, reuniones, solicitantes, perfiles ni asignaciones ficticias.
- Crear una JDP con los cinco datos del host: colegio, programa opcional, fecha, hora de Orlando y enlace. Los datos opcionales permanecen vacíos si no fueron informados.
- Publicaciones del equipo y avisos internos, guardados para las administradoras autorizadas.
- Recorridos de prueba separados por administradora y por base, para que los ejemplos no afecten el trabajo compartido.
- Protección que rechaza activar este espacio en Vercel con claves de desarrollo, un dominio vercel.app, una base de ejemplos o accesos administrativos sin configurar.

## Falta para activar los datos del equipo

1. **Un dominio autorizado.** Puede ser un subdominio que CODED autorice dentro de su dominio, por ejemplo `hub.codingeducation.us`; no se ha solicitado ni configurado ese nombre. Hace falta que quien controle el dominio autorice sus registros.
2. **Clerk de producción.** Crear/configurar la instancia para el dominio, sus registros y certificados; habilitar los mismos tres accesos administrativos con sus permisos privados y sus correos inicialmente pendientes de verificación personal. Las identidades de desarrollo no se convierten en identidades verificadas de producción.
3. **Google, si se quiere mantener ese botón.** Configurar las credenciales OAuth propias del equipo para el dominio autorizado; las credenciales compartidas de desarrollo no sustituyen ese paso. El acceso por correo debe probarse en producción con destinatarios controlados.
4. **Activar el espacio preparado y probarlo.** Comprobar el dominio, una entrada real de cada administradora realizada por ella misma y el guardado compartido de una JDP autorizada. El enlace anterior debe dirigir al dominio definitivo.

No se compró un dominio, no se aceptaron condiciones nuevas y no se enviaron invitaciones. Los correos externos de avisos siguen pendientes por la decisión anterior del titular; se mantienen los avisos internos.

## Configuración técnica preparada

Mantener el proyecto y repositorio existentes. Usar la misma base PostgreSQL y su esquema separado `coded_hub_team`; la beta conserva `coded_hub_beta` y los recorridos sus esquemas privados.

- `NEXT_PUBLIC_CODED_WORKSPACE_MODE=team`
- `NEXT_PUBLIC_CODED_AUTH_MODE=clerk`
- `CODED_DATABASE_SCHEMA=coded_hub_team`
- `CODED_PUBLIC_SITE_URL`: origen HTTPS del dominio autorizado.
- Claves de Clerk de producción y correos de las tres administradoras en las variables privadas correspondientes.

Las variables de activación todavía no se aplicaron al despliegue. Las comprobaciones del servidor impiden sustituirlas por claves de desarrollo o reutilizar una base que tenga la marca de ejemplos. Conservar los datos existentes: no borrar tablas ni reiniciar la beta para activar el espacio nuevo.

## Estudiantes y otros accesos

La autorización para que coordinación cargue sus reuniones y publicaciones no habilita automáticamente el registro de menores. Las altas de personas reales y el tratamiento de sus datos requieren la autorización correspondiente antes de cambiar `CODED_ALLOW_REAL_ACCOUNTS`. Los recorridos ficticios se deshabilitan cuando esa opción está activa. No se modificó esta restricción durante la preparación.

## Fuentes del requisito de acceso

Clerk indica que producción necesita un dominio propio y que vercel.app no permite configurar los registros necesarios: [despliegue en Vercel](https://clerk.com/docs/guides/development/deployment/vercel). Su [guía de producción](https://clerk.com/docs/guides/development/deployment/production) también requiere credenciales OAuth propias para los proveedores sociales. Las instancias de desarrollo tienen [diferencias de seguridad y de sesiones](https://clerk.com/docs/guides/development/managing-environments) y no se presentan aquí como acceso definitivo.

# CODED Stars Hub · Recorrido de demostración

**Versión de revisión, noviembre de 2026.** La beta funciona con acceso personal y datos de prueba. No es un sistema oficial autorizado para almacenar datos reales de estudiantes.

## Abrir el Hub

- **Beta privada:** https://coded-stars-beta.vercel.app/
- Cada administradora entra con su propio correo habilitado y, si corresponde, verifica personalmente su acceso.
- En la barra lateral o menú móvil, abre **Revisión beta → Cómo empezar → Probar los tres perfiles**.
- Elige **Administración** para recorrer un entorno ficticio separado. Los cambios en ese recorrido no afectan las JDP de la beta compartida.
- En teléfono, usa el menú para cambiar la zona horaria si la barra superior no muestra el selector.

**No hace falta instalar nada.** Para una presentación local, se puede ejecutar la demo con SQLite y cuentas ficticias conforme al README; localhost solo funciona en el equipo donde se ejecuta el servidor.

## Demostración guiada de 7 minutos

| Minuto | Recorrido | Resultado observable |
|---|---|---|
| 0–1 | Ingresar y abrir **Revisión beta**. | Explicar que las cuentas personales y los recorridos ficticios están separados. |
| 1–2 | Perfil **Administración → Reuniones → Nueva reunión**. | Introducir colegio ficticio, fecha, hora de Orlando y un enlace de example.com. Los campos opcionales pueden quedar vacíos. |
| 2–3 | **Solicitudes** en el perfil de administración. | Varias solicitudes pueden estar pendientes; solo administración confirma y solo una persona puede quedar seleccionada. |
| 3–4 | Cambiar en la franja superior al perfil **Coded Star**. | Buscar una reunión, solicitar participar y revisar que la confirmación no ocurre automáticamente. |
| 4–5 | Regresar a **Administración** y elegir manualmente un Star ficticio. | Ver que la asignación se guarda y que no permite una segunda confirmación. |
| 5–6 | Cambiar a **Anfitrión**. | Comprobar que solo ve el Star confirmado, su reunión, las indicaciones y los mensajes que le corresponden. |
| 6–7 | Volver a la cuenta real y abrir **Revisión beta → Errores e ideas**. | Mostrar cómo dejar comentarios sin incluir información personal de alumnos. |

El recorrido puede empezar con las reuniones ficticias existentes. Para demostrar una JDP recién creada en los tres perfiles, asigna también un anfitrión ficticio en las opciones de coordinación.

## Casos para probar en teléfono

1. Abrir y cerrar el menú; acceder a las principales secciones sin desplazamiento horizontal.
2. Cambiar la zona horaria desde el menú en pantallas muy estrechas.
3. Abrir los detalles de una reunión y regresar sin perder el contexto.
4. Comprobar que un Star sin confirmar no ve enlaces privados de reunión.
5. Ver el resultado de los formularios: mensajes claros de guardado, conflicto o conexión interrumpida.

## Información que hay que transmitir correctamente

- Los cambios se guardan en el Hub y los avisos se muestran **dentro de la aplicación**.
- **No se envían correos** desde la beta al crear solicitudes, reuniones o comentarios.
- El acceso personal de Clerk es de desarrollo y el espacio definitivo del equipo no está activado.
- La versión puede probarse con datos ficticios; el uso de estudiantes reales requiere autorización y configuración de producción.
- La aprobación institucional de CODED y la validación del equipo son decisiones humanas, no resultados automáticos de las pruebas.

**Cierre recomendado:** «La beta ya permite recorrer las JDP, las solicitudes y la selección. Me interesa ver qué habría que ajustar antes de utilizarla como herramienta del equipo».

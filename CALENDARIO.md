# Tu agenda de JDP en Google Calendar

Cada persona puede preparar un enlace de calendario desde su propia cuenta del Hub. No se necesita compartir una contraseña ni dar acceso a los demás calendarios de Google.

## Agregar la agenda

1. En el Hub, abre **Mi cuenta → Tu agenda en Google Calendar → Preparar mi agenda**. También puedes llegar desde el botón **Google Calendar** de Reuniones.
2. Pulsa **Copiar enlace**.
3. En una computadora, abre Google Calendar y entra en **Configuración → Agregar calendario → Desde URL**.
4. Pega el enlace privado y pulsa **Agregar calendario**. Esta confirmación la realiza cada persona en su propia cuenta de Google.

El estado **Enlace activo** indica que el Hub preparó la agenda. No confirma que la hayas agregado en Google: ese último paso se hace allí.

## Qué aparece

| Cuenta | Agenda exportada |
| --- | --- |
| Coded Star | Solo las reuniones para las que coordinación lo confirmó |
| Anfitrión | Solo las reuniones que tiene asignadas |
| Administración | La agenda de coordinación |

Se comparten el nombre de la reunión, el colegio y el programa/idioma cuando estén informados, la fecha y la hora. Los horarios se exportan en UTC, respetando la conversión original de Orlando y sus cambios de horario de verano. Google los muestra en la zona horaria configurada allí. Si no se informó duración, el Hub no inventa una hora de finalización.

Los enlaces de Zoom, los datos de solicitantes, las notas internas y el seguimiento permanecen dentro del Hub. El evento lleva un enlace a la agenda del Hub para consultar las indicaciones y el acceso autorizado. No incluye asistentes ni envía invitaciones.

## Actualizaciones

El enlace es una suscripción a la agenda, no una descarga estática. Al consultarlo, se reflejan las confirmaciones vigentes, los cambios de horario y las cancelaciones. Si un Star retira su participación, la reunión deja de incluirse en su agenda. Los eventos conservan su identificador para evitar duplicados por cada actualización.

Google decide cuándo vuelve a consultar el enlace; los cambios pueden tardar en aparecer. Revisa siempre el Hub antes de entrar a una JDP. Esta suscripción lleva la agenda **del Hub a Google** y no permite editar el Hub desde Google. Para traer reuniones de un host, administración dispone de la importación descrita abajo.

La descarga **Añadir al calendario** de una reunión sigue disponible. Ese archivo `.ics` es una copia del momento de la descarga; no es la suscripción personal.

## Enlace privado y desconexión

Quien tenga el enlace puede consultar esa agenda. Compártelo únicamente con tu calendario; no lo publiques ni lo pegues en los aportes del equipo.

- **Renovar enlace:** invalida el anterior. Quita la agenda anterior en Google y agrégala de nuevo con el enlace nuevo.
- **Desconectar agenda:** el Hub deja de compartirla. Elimina también el calendario desde Google para quitar las copias que Google ya guardó.
- **Cuenta pausada o permiso retirado:** el enlace deja de entregar información. Se comprueba el acceso actual cada vez que se consulta.

Los recorridos ficticios separados de administración no permiten activar conexiones. Para hacerlo, vuelve a tu cuenta habitual. La beta sigue usando datos ficticios; el uso con personas reales y menores continúa pendiente de autorización.

Las cuentas de Juan, Isa y Ela ya están registradas con los correos proporcionados y permisos administrativos. Isa y Ela deben verificar personalmente su correo en el primer acceso. No se crearon duplicados ni se enviaron invitaciones durante esta actualización.

Referencia: [cómo añadir un calendario por URL, Google Calendar](https://support.google.com/calendar/answer/37100?hl=es).

## Traer reuniones de Google al Hub

Desde **Reuniones → Importar calendario**, administración puede cargar un archivo `.ics` o leer una dirección iCal de Google Calendar. Usa un calendario dedicado a JDP que tengas autorización para consultar. Durante esta beta, usa datos ficticios. No necesitas compartir una contraseña ni pegar enlaces privados en este chat.

1. En Google Calendar, exporta el calendario de JDP desde **Configuración → Importar y exportar → Exportar**. Descomprime el ZIP y elige el archivo `.ics`. También se admite una dirección iCal de Google autorizada.
2. Abre **Importar calendario** en el Hub y pulsa **Revisar reuniones**. Todavía no se guarda ninguna reunión.
3. Marca las JDP que quieres traer. Revisa colegio, programa opcional, fecha, hora de Orlando y enlace. El nombre inicial procede del título del evento: coordinación debe confirmar que sea el colegio. El programa y el idioma no se suponen.
4. Si corresponde, asigna un anfitrión al grupo. Pulsa **Importar**. Puedes elegir hasta 20 reuniones por operación.

Solo se ofrecen reuniones futuras con fecha, hora y zona verificables. Se conservan los instantes UTC y las duraciones válidas informadas; no se inventa el final. Los eventos pasados, cancelados, de todo el día, sin zona verificable y las series recurrentes se cuentan en **Eventos no incluidos**. Las recurrentes deben registrarse individualmente en esta beta.

Una segunda importación del mismo identificador no crea otra JDP. Si Google cambia un evento ya importado, el Hub ofrece abrir la reunión existente para que coordinación revise y edite el cambio; no sobreescribe una reunión con solicitudes ni cancela participaciones automáticamente. La selección del Star sigue siendo manual.

El enlace de Google se usa únicamente para esa lectura y no se guarda. No se siguen redirecciones y solo se admiten direcciones iCal directas de Google. No se copian asistentes, correos ni notas personales. El archivo original tampoco se guarda. Los recorridos de revisión aceptan archivos ficticios, con sus propios datos separados, y no conectan calendarios externos.

**Alcance:** importación bajo demanda, con revisión humana. No hay sincronización automática ni escritura en Google. Para traer nuevas reuniones, vuelve a revisar el calendario. No se conectó un calendario real de ningún host durante las pruebas.

Referencia: [consultar Google Calendar mediante un enlace iCal, Google](https://support.google.com/calendar/answer/37648?hl=es).

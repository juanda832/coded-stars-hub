# CODED Stars Hub · prototipo con datos ficticios

Referencia para revisar con Isa y Ela. Las JDP son reuniones con familias interesadas en los programas de CODED. Un único Coded Star confirmado comparte su experiencia. Los textos, perfiles y reuniones incluidos son ilustrativos; el logo de CODED se incorporó por solicitud del usuario desde su sitio web, conservando el archivo original. Las fuentes se registran en `BRAND_SOURCES.md`.

## Inicio y agenda simplificados

- El inicio del Star se adapta a su situación: próxima participación confirmada, solicitud en revisión o nuevas oportunidades. La solicitud pendiente muestra sus tres pasos y un acceso a preguntas con la reunión correcta ya elegida.
- Coordinación encuentra una acción principal basada en las solicitudes y preguntas reales. «Revisar candidatos» abre la próxima JDP con solicitudes pendientes; no selecciona a ninguna persona.
- Las herramientas secundarias de los inicios se despliegan cuando se necesitan.
- La agenda ofrece búsqueda por programa, tema, idioma y host. Acepta tildes opcionales y varias palabras en cualquier orden. Los tres programas tienen selectores con fotos y contadores; el idioma y la disponibilidad están siempre a la vista. «Europa», «Londres» y «London» encuentran el mismo programa.
- Las tarjetas y el detalle muestran la hora de inicio en la zona elegida. El fin y la duración solo aparecen si se informó una duración. Si termina otro día, aparece la fecha final; los cambios de horario de verano muestran los dos desfases UTC. «Preguntar» abre el formulario con esa reunión y sus destinatarios elegidos, sin enviar nada.
- Los filtros se recuerdan por cuenta en el dispositivo y no se vuelven a cargar con cada actualización del Hub. El filtro del equipo encuentra JDP activas sin Star; el de estudiantes comprueba si pueden enviar una solicitud.
- Las preguntas sugeridas completan un borrador editable. El formulario identifica reunión, fecha, zona horaria y destinatarios. Ninguna sugerencia se envía por sí sola.
- Preguntas y respuestas se pueden buscar y filtrar por su estado. El calendario móvil muestra los siete días juntos.

## Solicitudes y selección manual

Varias personas pueden solicitar la misma reunión. La solicitud queda **en revisión** y no reserva el lugar. Solo administración puede confirmar al participante, después de revisar idioma, programas, disponibilidad declarada, experiencia, historial y notas internas. Los filtros y los criterios escritos por el administrador organizan la revisión. No se generan puntuaciones ni selecciones automáticas.

La revisión muestra una fotografía del programa, host y horario completo. Nombre, idioma y programa se filtran a la vista; los contadores se ajustan a esos filtros. La búsqueda de nombres acepta tildes opcionales. La confirmación incluye la disponibilidad declarada y vuelve a comprobar el estado actual de la candidatura. Las JDP cerradas muestran su historial sin ofrecer asignaciones.

Al confirmar a alguien:

- La persona seleccionada ve «Confirmado» y recibe un aviso en el Hub.
- Las demás solicitudes pasan a «Otro Star fue seleccionado» y reciben su actualización.
- El host ve únicamente al participante confirmado, sin acceder a los demás perfiles ni a los criterios internos.
- El enlace y la opción de añadir la participación al calendario se ofrecen al Star confirmado.

Si el confirmado cancela, su registro queda como retirado, las demás solicitudes vuelven a revisión y coordinación recibe un aviso para elegir manualmente un reemplazo. El sistema no promueve automáticamente a otra persona.

## Integridad y persistencia de la demo local

La demo usa SQLite local mediante `node:sqlite`. Las solicitudes y las notificaciones sobreviven al reinicio. La confirmación y sus avisos se guardan en una misma transacción. Un índice único parcial en `applications(meeting_id)` para `status='confirmed'` impide más de un Star confirmado por reunión, incluso ante confirmaciones simultáneas. Cada estudiante tiene una única solicitud por reunión; retirarla y volver a solicitar actualiza ese registro.

El archivo se guarda en `.data/hub.sqlite`, salvo que se indique otra ruta con `CODED_DEMO_DB`. Contiene exclusivamente datos ficticios. Las pruebas usan una base independiente.

## Ejecutar

Usa Node.js 22.13+ (preferiblemente 24) y pnpm:

1. Ejecuta `pnpm install`.
2. Crea `.env.local` con un `SESSION_SECRET` aleatorio largo.
3. Ejecuta `pnpm dev` y abre `http://localhost:3000`.

Para comprobar y ejecutar la compilación: `pnpm build` y `pnpm start`.

La pantalla de acceso permite elegir Coded Star, Host o Administración. Cada rol tiene un selector de perfiles. Administración incluye Isa, Ela y Marina; Host incluye Sofía y Diego; Star incluye Alex, Valentina, Nicolás y Camila. Contraseña demo para todos: `Demo2026!`.

Cuentas: `star@example.com`, `valentina@example.com`, `nicolas@example.com`, `camila@example.com`, `host@example.com`, `diego@example.com`, `isa@example.com`, `ela@example.com`, `admin@example.com`.

Para probar selección y reasignación: entra como Admin → Solicitudes → revisa una reunión con varios candidatos → selecciona y confirma uno. Después entra como ese Star y cancela su participación. Al volver a Admin, verás el lugar disponible y las demás solicitudes pendientes para elegir el reemplazo.

## Comprobaciones

`tests/applications.integration.py` comprueba el flujo con solicitudes múltiples, permisos, privacidad de candidatos, notificaciones, selección concurrente y reasignación. Ejecuta el servidor de pruebas en el puerto 3001 con un `CODED_DEMO_DB` distinto al de la demo y corre:

`python3 tests/applications.integration.py http://127.0.0.1:3001`

## Alcance de producción

Next.js, TypeScript y Tailwind. La autenticación actual usa cuentas públicas de demostración y cookies firmadas; las acciones comprueban permisos en el servidor. Antes de invitar usuarios o incorporar información real de menores, hacen falta autenticación de producción y autorización de CODED.

Para desplegar en Vercel, sustituir el adaptador de SQLite local por una base administrada compartida como PostgreSQL, conservando la transacción de selección y la restricción única de un confirmado por reunión. El disco local de una función no sirve como persistencia compartida.

Los avisos implementados son internos del Hub. El archivo de calendario de una participación confirmada incluye una alarma 15 minutos antes, que cada usuario debe importar y confirmar en su calendario. La interfaz está en español; las traducciones completas al inglés y portugués siguen pendientes.


## Navegación y diseño

Identidad basada en el logo y los colores publicados por CODED, con superficies claras y mejor contraste. La agenda alterna entre lista y semana: tocar un día filtra sus reuniones. Los selectores visibles de programa e idioma ayudan a acotar la búsqueda. Sus contadores reflejan el periodo, búsqueda y disponibilidad actuales. «Mis solicitudes» permite separar pendientes, confirmadas e historial.

Administración elige la reunión en un carrusel, revisa fichas compactas y abre un perfil para consultar experiencia, disponibilidad, historial y notas. Los filtros y los estados son interactivos. La asignación continúa siendo manual y requiere confirmar la decisión. Los tres roles tienen accesos directos en el celular.

## Cierre y seguimiento de las JDP

Stars confirmados y hosts pueden registrar sus resultados cuando finaliza el horario previsto o cuando coordinación marca la reunión como finalizada. Cada persona responde una vez desde su propia cuenta. El formulario distingue conexión, oportunidad de hablar, testimonio y presencia de familias. Si la reunión no ocurrió, el registro del host no clasifica al Star como ausente.

Los resultados de cada persona son visibles para ella y para administración. Coordinación puede contrastar ambas versiones, consultar situaciones reportadas y registrar una nota de seguimiento. Las respuestas originales permanecen intactas. Si llega una respuesta después de una revisión, la nota se conserva y el caso requiere una nueva lectura.

Los indicadores identifican su fuente: respuestas de Stars y de hosts. La finalización del horario, la inscripción y la confirmación no cuentan por sí mismas como asistencia. El historial que ve administración incluye los resultados reportados y señala cuando existen versiones diferentes.

`tests/reports.integration.py` comprueba permisos, privacidad, validación, envíos simultáneos, separación entre asistencia y testimonio, preservación de respuestas y seguimiento. Se ejecuta contra un servidor con una base de pruebas independiente.


## Mejoras de experiencia y comunicación

El inicio de cada rol prioriza sus próximas acciones. El Star tiene accesos directos a solicitudes, preparación y mensajes. Host y administración ven preguntas, cierres y asignaciones pendientes, y pueden abrir la reunión concreta desde su agenda. El menú del celular usa un diálogo accesible con teclado, foco y cierre con Escape.

La guía de preparación incluye ideas para el testimonio, preguntas frecuentes y una lista opcional que se guarda únicamente en el dispositivo. No crea puntuaciones ni mide el valor del estudiante.

Mensajes separa novedades, preguntas e indicaciones. El Star puede preguntar directamente desde esta pantalla. El host y coordinación reciben avisos; la respuesta notifica únicamente a quien preguntó. Los cambios de horario, idioma, estado e indicaciones también generan avisos internos. Las notificaciones nunca incluyen el enlace privado. Marcar todos como leídos afecta solamente la cuenta actual.

### Conversaciones y borradores

Las preguntas se filtran por reunión y estado, con contadores que acompañan la búsqueda. Las pendientes aparecen primero, empezando por las más antiguas; las resueltas se ordenan por la respuesta más reciente. Host y coordinación entran con el filtro de pendientes. Los avisos de preguntas y respuestas abren las conversaciones de su reunión, incluso cuando esta ya terminó. Las fechas de envío y respuesta usan la zona horaria elegida.

El Star conserva un borrador por reunión; cada integrante del equipo conserva uno por pregunta. Se guardan en el navegador, separados por cuenta, sin enviarse automáticamente ni sincronizarse entre dispositivos. Una idea sugerida pide revisar el reemplazo si ya existe texto escrito. Después de un envío exitoso, se borra ese borrador. Si falla el almacenamiento, la interfaz explica que se debe copiar el texto antes de salir.

Las ideas del formulario usan textos de ayuda y datos actuales de la JDP; no utilizan IA ni inventan un turno para hablar. El envío siempre requiere pulsar el botón. El servidor conserva la primera respuesta de cada pregunta: una respuesta distinta posterior recibe HTTP 409 y no cambia el texto, la autoría ni los avisos. Reintentar el mismo texto es idempotente. Un borrador conservado se puede recuperar desde la tarjeta de la conversación respondida.

Pruebas: `tests/question-inbox.test.mjs`, `tests/communication.integration.py` y `tests/replies.integration.py`. Ejecutar las dos suites de servidor solo en una base de prueba independiente.

Administración registra colegio, programa opcional, fecha, hora de Orlando y enlace. Idioma, anfitrión, duración, descripción e indicaciones son opcionales. La fecha y hora originales se interpretan en America/New_York y se guardan como un instante UTC; cambiar la zona de visualización no cambia el instante. Las horas inexistentes o ambiguas por cambios de horario se rechazan con una explicación. Editar una reunión no reasigna automáticamente a su Star.

Comprobaciones adicionales:

- `python3 tests/communication.integration.py http://127.0.0.1:3001`
- `node --experimental-strip-types --test tests/time-zones.test.mjs`

Los tres conjuntos de integración pueden ejecutarse en orden (solicitudes, resultados y comunicación) sobre una base de pruebas nueva. No uses la base de la demo para estas pruebas.

## Recorrido de participación refinado

El inicio distingue la próxima participación confirmada de las oportunidades abiertas para solicitar. Una solicitud en revisión aparece como una actualización breve y no ocupa el espacio principal. Solo se anuncian como abiertas las reuniones futuras que realmente aceptan otra solicitud de la persona actual.

La agenda muestra los idiomas sin desplegar filtros, agrupa por fecha y permite quitar cada filtro por separado. Conserva programa, idioma, vista y disponibilidad en el dispositivo, de forma separada por cuenta. El buscador no se guarda.

Cada pantalla tiene un enlace con fragmento (`#/reuniones`, `#/mensajes?vista=preguntas`, etc.). Recargar conserva la sección y el navegador puede volver a la anterior. Las vistas se validan según el rol; los permisos de datos y acciones siguen comprobándose en el servidor.

Las solicitudes anteriores se organizan en la pestaña Historial. «En curso» cuenta únicamente las solicitudes pendientes y confirmadas de JDP activas. Una solicitud pendiente de una reunión ya finalizada se presenta como «Sin confirmación», sin inventar una asistencia. Cada tarjeta ofrece el siguiente paso: preparar la historia, revisar el acceso e indicaciones, consultar al host o registrar el resultado cuando corresponde.

Pruebas del recorrido: `node --experimental-strip-types --test tests/journey.test.mjs` (26 comprobaciones).

### Preparación por reunión

Desde Mis solicitudes, «Preparar mi historia» abre la JDP correcta, con programa, idioma, host y horario local. El selector permite cambiar entre las solicitudes activas o practicar sin una reunión. Las pestañas «Mi historia» y «Antes de entrar» separan el editor de la lista de preparación y las preguntas frecuentes.

Cada JDP tiene su lista personal en el navegador, separada por cuenta y reunión. La lista general anterior se conserva por separado. Las marcas sobreviven a la recarga y no se trasladan a otra JDP. Si el almacenamiento falla, la interfaz permite seguir marcando y explica que esas marcas no se conservarán al salir. Completar una lista no cambia la solicitud ni registra asistencia.

Las historias conservan los borradores existentes por cuenta y programa. Al preparar una reunión concreta, el editor utiliza su programa; para escribir sobre otro se cambia de reunión o se elige practicar sin una reunión. Los borradores no se envían al host. Pruebas de grupos, cuentas y listas: `tests/application-journey.test.mjs` (15 comprobaciones).


## Paleta e interacciones

La identidad visual usa violeta e índigo con acentos rosa. Los gradientes destacan la invitación principal y los botones de acción; las superficies claras ayudan a leer la agenda. Los programas y los estados de solicitud mantienen etiquetas de texto además de sus colores.

Las tarjetas y botones responden al pasar el cursor, enfocar con teclado y pulsar. El guardado muestra un indicador ligado al estado real de la operación. Las animaciones decorativas son breves o limitadas y se desactivan cuando el dispositivo solicita reducir el movimiento. La hoja `app/brand-theme.css` reúne estos ajustes.


## Objetivos, aportes y cuentas del equipo

El inicio incluye un selector de objetivos con acciones directas según el rol: participar, preparar el testimonio o resolver dudas para Stars; organizar, asignar, publicar y cerrar encuentros para administración; preparar, responder y registrar resultados para hosts.

Isa y Ela tienen perfiles independientes de administración en esta demo, según la indicación del usuario. Pueden crear y editar JDP, elegir al host, revisar y confirmar manualmente solicitudes y agregar publicaciones. Las alertas de coordinación llegan a todas las cuentas administrativas, no a una sola cuenta fija. Los avisos previos a la incorporación de estos perfiles no se duplican retrospectivamente.

Publicaciones permite guardar borradores, previsualizar, publicar, editar y archivar contenido recuperable. El público puede ser todo el Hub, Stars o hosts; administración ve todos los estados. El servidor controla el público y los permisos, registra la autoría desde la sesión y evita sobrescribir una edición más reciente. Los avisos no contienen el contenido de publicaciones restringidas. Tras guardar, el editor abre la lista del estado correspondiente.

Cada Star puede actualizar sus idiomas, programas, disponibilidad y experiencia desde Mi cuenta. La sesión determina qué perfil cambia. No se aceptan cambios de rol, notas internas o historial desde ese formulario. Administración ve el perfil actualizado; el host ve los idiomas y programas del Star confirmado.

Los hosts acceden únicamente a sus reuniones. Una reasignación de host actualiza los accesos y los avisos sin cambiar al Star confirmado.

Pruebas adicionales: `python3 tests/contribution.integration.py http://127.0.0.1:3001`. Ejecutar después de las tres suites de integración anteriores en una base aislada. Guía de uso del equipo: `GUIA-EQUIPO.md`.


## Asistente CODED local, sin API de terceros

El asistente se construyó desde cero como ayuda especializada para el Hub. No utiliza OpenAI, un modelo remoto, una API de IA, claves adicionales ni servicios de pago. Tampoco descarga ni ejecuta un modelo de lenguaje local. Sus respuestas se construyen con detección de intenciones, tolerancia a errores simples de escritura, filtros, contexto conversacional, búsqueda de publicaciones y plantillas.

Puede consultar reuniones, conservar programa/idioma/periodo entre preguntas, resolver referencias como «la primera», explicar solicitudes y selección, preparar una historia con huecos para recuerdos reales, orientar sobre resultados y preparar borradores. Indica cuando la información falta o la pregunta queda fuera de su alcance. No equivale a GPT ni pretende ser un modelo general.

La función `hubDataFor` comparte la misma frontera de permisos entre la pantalla y el asistente. El contexto se calcula en el servidor desde la sesión, no desde identidades o historiales enviados por el cliente. Las conversaciones y sus versiones se guardan en SQLite por usuario. Otra cuenta, incluida administración, no puede leerlas por identificador.

El asistente solo entrega acciones de navegación y borradores. «Revisar y enviar esta pregunta» abre el formulario con el texto y la JDP elegida. «Abrir este borrador en el editor» permite revisar título, público y contenido. El envío o la publicación requieren pulsar el botón del formulario. El asistente nunca selecciona a un estudiante, confirma una participación ni marca asistencia.

Cada conversación admite hasta 80 mensajes y cada cuenta hasta 30 conversaciones; se pueden continuar las anteriores. Hay un límite de 30 consultas por cinco minutos por cuenta y de 1200 caracteres por consulta. Las versiones evitan perder cambios entre ventanas y un identificador de envío evita duplicados al reintentar.

La interfaz incluye historial, nueva conversación, sugerencias, copiar respuesta, fuentes internas y explicación breve de las comprobaciones de datos. El menú inferior da acceso directo al asistente. La respuesta completa se calcula y guarda en el servidor. Por solicitud del usuario, las respuestas nuevas aparecen con una animación de escritura gradual y una pausa inicial breve. La interfaz identifica esta fase como «Mostrando respuesta»; no simula que el asistente siga pensando. Hay ritmos Natural, Rápido e Instantáneo y un botón para mostrar todo. El historial aparece completo al abrirlo; la preferencia de movimiento reducido evita la animación.

Prueba: `python3 tests/assistant.integration.py http://127.0.0.1:3001` contra una base aislada. No uses la base de la demo para ejecutar pruebas.


### Contexto y borradores guiados

- Las consultas de solicitudes conservan programa, idioma y estado al aclararlas; una referencia como «la segunda» mantiene la tarea solicitada.
- Cuando hay varias reuniones posibles para una pregunta, pide que el usuario elija. Conserva el tema de la pregunta durante esa aclaración.
- «Quiero personalizar mi historia de Tokyo» abre dos pasos: un recuerdo real y lo que el usuario aprendió. El borrador usa esas frases y deja las partes que falten entre corchetes.
- «Hazlo más corto» revisa el último borrador de historia, pregunta o publicación. Las invitaciones admiten volver a una versión más detallada.
- Cambiar de programa descarta las vivencias del programa anterior para no atribuirlas a otro. «Nuevo tema» reinicia el contexto utilizado al responder; no borra el historial guardado.
- Las referencias fuera de una lista piden aclaración. Una duración como «de 1 minuto» y «la primera vez» no se confunden con la primera reunión.

La escritura gradual es una presentación del texto, independiente de estas mejoras de interpretación. No se añadieron modelos ni APIs externas.


## Versión visual para revisar con el equipo

El acceso, los inicios, las tarjetas, el detalle y el asistente comparten una paleta de violeta, neutros, menta y durazno. Las fotografías reales de los destinos acompañan la navegación y los programas. No se presentan como fotos de estudiantes de CODED. Las acciones, permisos y datos conservan el comportamiento documentado.

- `DISENO.md`: paleta, archivos, procedencia y prompts de las ilustraciones.
- `PARA-MOSTRAR.md`: recorrido breve para revisar la demo con Isa y Ela.

El proyecto permanece en esta carpeta. La apertura en Visual Studio Code y cualquier envío externo se realizarán cuando el usuario los solicite.

### Orlando: parques y exploración espacial

El inicio Star incluye una sección de Orlando con fotografías reales de referencia, galería ampliable y tres temas para preparar una historia: parques, NASA y grupo. Abre la próxima JDP activa de Orlando o la guía de preparación. El detalle de sus reuniones ofrece preguntas orientadoras; el asistente local pide un recuerdo propio de esos temas, sin inventarlo.

Las portadas de Orlando muestran fotografías de parques y exploración espacial en lugar de la antigua ilustración de campus. Las descripciones iniciales se actualizaron en los datos ficticios y en la semilla. Los créditos y licencias están en `/photo-credits.html` y en `DISENO.md`. Las fotografías no representan participantes de CODED ni un itinerario confirmado.

La galería reúne seis fotografías de referencia: Universal Studios Florida, Disney Hollywood Studios, Epic Universe y tres exposiciones de Kennedy Space Center. Los lugares se ajustaron al contexto compartido por el usuario; Magic Kingdom y EPCOT se retiraron de las superficies activas. No se promete el acceso a cada exposición. Los créditos y licencias actuales están en `/photo-credits.html`.

## Participar y preparar una historia

El inicio prioriza el estado de la participación con una fotografía del destino, tres accesos directos (reuniones, preparación y preguntas) y las oportunidades disponibles. Las fotografías y las ideas por programa aparecen después. El mosaico de cuatro fotografías está visible para cada programa; el visor permite recorrer la colección completa.

El bloque «Vuelve a ese momento» ofrece ideas para Orlando, Europa y Tokyo. Usa las tres presentaciones compartidas únicamente como contexto editorial; no funciona como catálogo comercial ni importa los documentos originales al sitio. La clave interna `London` se conserva y se presenta como Europa en este bloque. Las escenas conceptuales se sustituyeron por fotografías reales de los destinos, con sus créditos y licencias.

«Preparación» incluye un editor de tres pasos: un momento, un aprendizaje y algo que compartir. La vista previa contiene únicamente lo escrito por la persona. Cada cuenta y programa tiene su propio borrador en el almacenamiento del navegador. El guardado informa si falla; no envía el texto al servidor, al host ni al asistente. Cambiar de programa conserva los textos anteriores.

Con las tres ideas escritas se habilitan copiar y ensayar. El ensayo tiene contador, pausa, continuación y reinicio; no graba audio ni usa el micrófono. El tiempo de lectura es aproximado, calculado a 130 palabras por minuto. No crea puntuaciones, premios ni clasificaciones. Se mantiene el checklist opcional de preparación.

Archivos principales: `lib/program-experiences.ts`, `app/components/StoryStudio.tsx`, `app/components/OrlandoSpotlight.tsx` y `app/participation-studio.css`.


## Fotografías reales en todo el Hub

Hay veinticuatro fotografías activas: diez de Orlando, siete de Europa y siete de Tokio. La última ampliación incorporó ocho fotos reales con sus fuentes y licencias. El inicio, el acceso, las tarjetas de los tres programas y el detalle de las reuniones usan fotografías reales. Las ilustraciones generadas anteriores ya no se importan en las pantallas.

El bloque de programas combina una fotografía principal con cuatro imágenes secundarias. El botón «Ver las 10 fotos» de Orlando abre la colección completa, incluido el Jardín de Cohetes, el Centro Apolo / Saturno V, Islands of Adventure y la Universidad de Florida Central. Europa y Tokio tienen siete fotos cada uno. Administración y anfitriones pueden abrirlas desde las tarjetas de destinos en Inicio. El visor permite avanzar, retroceder, usar miniaturas y consultar la autoría y licencia. Las imágenes son referencias de los lugares, no fotografías de participantes ni un itinerario garantizado.

La colección está en `lib/program-photos.ts` y `lib/destination-photos.json`. `app/photography.css` reemplaza los fondos decorativos por superficies neutras y da más espacio a las fotografías. Las licencias de Wikimedia Commons se enlazan en `/photo-credits.html`.

## Preparación del equipo por reunión

«Antes del encuentro» reúne cuatro detalles reales: participante confirmado, enlace guardado, indicaciones compartidas y preguntas pendientes. No calcula puntuaciones ni garantiza asistencia. Agregar o editar lleva al campo correspondiente; responder abre las conversaciones de esa JDP con el filtro elegido. Estado y detalles quedan en una sección desplegable.

El espacio «Participante» del host incluye las fotos de los programas, inicio y fin en su zona elegida, información del Star confirmado y acceso directo para preparar la reunión. Las candidaturas ajenas y los criterios internos se siguen excluyendo desde el servidor.

Archivos: `lib/candidate-review.ts`, `ApplicationManager.tsx`, `AssignedStars.tsx`, `MeetingWorkspace.tsx` y `app/staff-refinement.css`.

## Edición para revisar con Isa y Ela

Se simplificaron acceso, inicios, solicitudes, mensajes, preparación, publicaciones y cuenta. El menú móvil prioriza las funciones de cada rol; la ayuda local queda en Ayuda. Se retiraron los lemas repetidos y los dos recursos gráficos generados que ya no se usaban. Se mantienen las fotografías reales y sus créditos.

`PARA-MOSTRAR.md` contiene el recorrido breve y los puntos a revisar. La web sigue siendo una demo local con datos de ejemplo. El PDF preparado fuera del proyecto sirve para compartir las pantallas; no sustituye al acceso interactivo desde otros dispositivos.


## Consultas desde una reunión

El botón «Preguntar al equipo» de la ficha abre Mensajes con esa reunión elegida, el formulario desplegado y sus conversaciones filtradas. Los borradores se conservan por cuenta y reunión en el navegador. Después de enviar se muestra la conversación de la reunión elegida, incluso si se cambió desde el selector del formulario.

Las portadas de las reuniones usan una foto estable de su propio programa. Una misma reunión conserva la imagen en sus tarjetas, ficha y preparación.


## Crear reuniones con vista previa y borrador

Administración puede preparar una reunión y revisar su foto, programa, idioma, anfitrión e inicio y fin antes de crearla. El horario utiliza la zona elegida y muestra si termina al día siguiente. Cambiar de zona convierte la misma fecha y hora a la nueva zona.

Las reuniones nuevas tienen un borrador privado por cuenta, guardado en el navegador. Cerrar y volver a abrir recupera los datos; crear la reunión elimina ese borrador. La recuperación valida los campos, los anfitriones disponibles y las zonas permitidas. Las ediciones de reuniones existentes siguen guardándose de forma explícita y no cargan el borrador de una reunión nueva.

En celular, «Ver cómo quedará» despliega la vista previa. En Solicitudes, el selector agrupa reuniones con solicitudes pendientes, otras reuniones próximas e historial. La elección del participante sigue siendo manual.


## Proceso real de coordinación informado por Isa

Ver **PROCESO-JDP.md** para distinguir la información de origen y las funciones propuestas del Hub. El formulario principal tiene cinco campos. `schoolName` conserva el colegio y también se usa como título de las JDP nuevas; los registros anteriores no se reinterpretan como colegios. `program` y `language` vacíos significan sin información; `duration: null` no genera una hora de finalización. `hostId` vacío no da acceso a ninguna cuenta de anfitrión.

El servidor convierte `date` y `time` desde `America/New_York`, valida las horas inexistentes o repetidas de los cambios de horario y guarda `sourceTimeZone` junto con `startsAt` UTC. El idioma y el anfitrión se pueden configurar después. Las reuniones sin programa no se indexan como Orlando ni usan sus fotografías; sin idioma no se indexan como español. La agenda permite buscar por colegio y conserva las vistas y filtros anteriores.

Los clientes anteriores que enviaban `title` y `startsAt` mantienen compatibilidad, sin convertir ese título en un colegio. No se cambian ni eliminan las reuniones existentes. Las notificaciones y la ayuda conservan los nombres de colegio tal como se proporcionaron.

Pruebas del proceso: `tests/jdp-calendar.test.mjs`, `tests/meeting-editor-draft.test.mjs` y `tests/jdp-calendar.integration.py` (esta última solo en una copia de prueba servida en 127.0.0.1:3001). Las pruebas existentes que necesitan un anfitrión ahora lo asignan explícitamente; no dependen de una asignación por defecto.

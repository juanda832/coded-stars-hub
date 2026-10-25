# Verificación de la versión mejorada

Revisión local del 19 de octubre de 2026. Solo cuentas y datos ficticios.

## Comprobaciones automatizadas

| Área | Resultado |
| --- | --- |
| Solicitudes múltiples, selección manual y reasignación | 36 comprobaciones aprobadas |
| Resultados independientes, privacidad y seguimiento | 46 comprobaciones aprobadas |
| Comunicación, edición de reuniones y permisos | 42 comprobaciones aprobadas |
| Conversión de zonas, cambios de día y horario de verano | 12 comprobaciones aprobadas |
| Compilación de producción y TypeScript | Correctos |

Total: **136 comprobaciones aprobadas**. Los conjuntos de integración se ejecutaron contra una base independiente de la demo.

## Recorridos comprobados en el navegador

- Entrada con los perfiles Star, host y administración.
- Menú completo del celular y accesos directos entre secciones.
- Lista de preparación: marcar un paso actualiza el progreso.
- Star pregunta desde Mensajes → la pregunta se guarda → el host recibe un aviso y responde → el Star recibe el aviso y lee la respuesta.
- Administración abre una reunión desde el inicio, cambia la zona de La Paz a Madrid y comprueba que 15:00 y 21:00 representan el mismo instante.
- Administración guarda la duración de 45 minutos → la agenda muestra 45 minutos → el Star recibe el aviso del cambio.
- Inicio con tareas del host y coordinación; estadísticas con fuentes y denominadores explícitos.
- Acceso «El equipo te respondió» abre directamente Preguntas.

La revisión visual de esta entrega se realizó con la vista de celular disponible en el navegador de la app.

## Alcance

Esta verificación cubre el prototipo local. Los avisos se entregan dentro del Hub. No se enviaron correos ni mensajes a personas reales. El uso en producción sigue requiriendo autenticación de producción, una base administrada para Vercel y autorización para los datos reales. La mejora de participación deberá medirse en un piloto autorizado.

## Revisión del recorrido de participación

Nueva revisión local del 19 de octubre de 2026:

- 26 comprobaciones nuevas aprobadas en `tests/journey.test.mjs`: estados temporales, inscripción cerrada, solicitudes repetidas, navegación por rol y restauración de subpantallas.
- Compilación de producción y TypeScript correctos.
- Comprobado en el navegador: inicio renovado, idioma y disponibilidad combinados, filtros conservados al recargar y navegación Atrás hasta Inicio.
- Los estados anteriores no convierten una solicitud sin confirmar en asistencia.

Las 136 comprobaciones descritas arriba corresponden a la revisión anterior de las operaciones del servidor, la comunicación y las zonas horarias.

Comprobación final en navegador: el Historial conserva la pestaña al recargar; la agenda compacta mantiene los nombres accesibles de sus vistas; el detalle abierto muestra indicaciones desplegables, cierre visible y botón de solicitud completo en celular.


## Revisión de paleta e interacciones

- Nueva compilación de producción y TypeScript correctos tras integrar `brand-theme.css`.
- Revisados en el navegador de celular: acceso de demostración, inicio, agenda y detalle de London; el acceso principal abre la agenda, las indicaciones se despliegan y el diálogo se cierra correctamente.
- Captura del inicio renovado: `../coded-stars-hub-aurora.png`.
- Contraste calculado para texto secundario y etiquetas de estados/programas sobre sus fondos: entre 5.03:1 y 5.93:1. Es una comprobación de esos pares concretos, no una auditoría completa de accesibilidad.
- Revisadas las reglas para reducir movimiento: desactivan animaciones y transiciones; el indicador de guardado queda estático.
- Esta revisión modifica presentación y un indicador ligado al estado de guardado. Las pruebas anteriores de servidor no se volvieron a ejecutar en esta revisión visual.


## Cuentas, aportes y objetivos — revisión del 20 de octubre de 2026

**Recorrido:** una administradora crea un borrador → otra administradora lo publica → el Star lo ve; un Star actualiza su perfil → el servidor guarda únicamente sus campos permitidos → coordinación recibe el perfil actualizado.

| Comprobación | Resultado |
| --- | --- |
| Solicitudes, selección manual y reasignación | 36 aprobadas |
| Resultados, privacidad y seguimiento | 46 aprobadas |
| Comunicación, edición y permisos | 42 aprobadas |
| Cuentas, perfiles, publicaciones y hosts | 87 aprobadas |
| Estados temporales y navegación | 26 aprobadas |
| Compilación de producción y TypeScript finales | Correctos |

Total de esta entrega: **237 comprobaciones aprobadas**. Las suites se ejecutaron el 19 de octubre contra `work/hub-contribution-qa-01.sqlite`, independiente de la demo. La compilación final y el cierre del recorrido en navegador se comprobaron el 20 de octubre. Las pruebas de zonas horarias corresponden a la revisión anterior; no están sumadas a este total.

Las 87 comprobaciones nuevas incluyen acceso de los nueve perfiles de prueba, roles de Isa y Ela, privacidad de perfiles, rechazo de identidad/rol/notas internas manipulados, validación de campos, selección de host, pérdida de acceso del host anterior, avisos a todos los administradores, borradores privados, público de publicaciones, autoría autenticada, edición concurrente y archivo recuperable.

### Evidencia del flujo

- **Interfaz → servidor → almacenamiento:** Isa guardó un borrador desde el navegador; el borrador se conservó al reiniciar la demo.
- **Cuenta colaboradora:** Ela abrió el mismo borrador y lo publicó para Coded Stars. La interfaz cambió automáticamente a Publicadas y mostró autoría de Isa y edición de Ela.
- **Respuesta → pantalla Star:** Alex recibió la novedad y pudo leer el contenido desde su cuenta, sin controles de edición.
- **Perfil propio:** Alex cambió disponibilidad desde Mi cuenta, guardó y recargó. El texto guardado y el estado «Tu perfil está al día» permanecieron visibles.
- **Coordinación:** una consulta autenticada como Isa confirmó la nueva disponibilidad entre los candidatos y la autoría de la publicación.
- **Objetivos:** comprobados en navegador los selectores de coordinación y Star y sus accesos a Publicaciones y Mi cuenta.
- **Consola:** sin errores capturados durante la comprobación final de Mi cuenta.
- **Servidor:** inició correctamente en `127.0.0.1:3000`. La demo conserva exclusivamente información ficticia.

Capturas de esta revisión: `../coded-stars-hub-goals.png`, `../coded-stars-hub-isa.png`, `../coded-stars-hub-publications.png`. Guía para el equipo: `GUIA-EQUIPO.md`.

Los perfiles de Isa y Ela son cuentas públicas de demostración local. No se crearon invitaciones reales ni acceso desde otros dispositivos. La autenticación de producción, el alojamiento y la autorización de datos reales siguen pendientes.


## Asistente local — 20 de octubre de 2026

**Recorrido:** consulta escrita → sesión autenticada → datos visibles del Hub → detección de intención, filtros y contexto → respuesta con accesos y borradores → revisión manual en los formularios.

| Área | Comprobaciones aprobadas |
| --- | ---: |
| Solicitudes y selección manual | 36 |
| Resultados y seguimiento | 46 |
| Comunicación y edición | 42 |
| Cuentas, perfiles y publicaciones | 87 |
| Asistente local | 54 |
| Estados y navegación | 26 |
| Total de esta entrega | **291** |

Las cuatro suites anteriores de servidor se repitieron sobre `work/hub-assistant-qa-01.sqlite` tras compartir la frontera de permisos con el asistente. La suite final del asistente se ejecutó sobre `work/hub-assistant-qa-02.sqlite`. Las bases son independientes de la demo. La compilación final de producción y TypeScript finalizaron correctamente.

### Comprobaciones del asistente

- Autenticación, aislamiento de conversaciones incluso frente a otras cuentas administrativas y rechazo de identidad/rol/historial manipulados.
- Contexto por programa e idioma, selección ordinal de un encuentro, referencia de reunión al preparar una pregunta, horarios explícitos y filtros que se pueden retirar.
- Solicitudes y confirmaciones no se confunden; no se altera la asignación ni se inventan encuentros.
- Borradores de preguntas y publicaciones no producen envíos automáticos.
- Publicaciones restringidas no aparecen en respuestas de cuentas que no pueden leerlas.
- Persistencia, reintentos sin duplicar mensajes, protección de versiones entre ventanas, solicitudes inválidas y límites de tamaño.
- Respuesta acotada para preguntas generales fuera del Hub y explicación expresa de que no es GPT.
- Los accesos del asistente están disponibles para los tres roles. Los permisos de datos se comprueban en el servidor mediante `hubDataFor`.

### Navegador

1. Alex consultó «¿Qué reuniones de Tokyo hay?»; la respuesta usó la JDP y su solicitud actuales.
2. «¿Y en inglés?» conservó Tokyo e indicó que no había coincidencias. «¿Y London?» conservó Inglés y encontró Discover London.
3. «Quiero preguntar al host» preparó un texto relacionado con London. El botón abrió Mensajes → Preguntas con la reunión y el texto correctos. No se envió.
4. Tras reiniciar, la conversación seguía disponible en el historial de Alex.
5. Isa abrió una conversación independiente, pidió una invitación y abrió el borrador en el editor con título y contenido completos. Al cerrar sin publicar, permaneció una única publicación en la demo.
6. Se comprobó el cuadro de escritura y el menú inferior a 390 × 844; se restableció el tamaño original al terminar.
7. Se corrigió el margen duplicado que dejaba un hueco entre la barra lateral y el contenido. El menú lateral ahora desplaza sus opciones y conserva visible la cuenta.
8. Captura final de escritorio y consola: sin errores capturados en la vista final.

Capturas: `../coded-stars-hub-assistant.png` y `../coded-stars-hub-assistant-mobile.png`.

### Alcance

No se instaló un SDK de IA, no se conectó un modelo y no se hicieron llamadas a una API externa de IA. El asistente usa código local, reglas, datos y plantillas. No es un modelo de lenguaje entrenado ni tiene la capacidad general de GPT. Los mensajes se guardan por perfil en la base local de demostración. El uso real de la plataforma continúa sujeto al alcance de producción descrito arriba.


## Revisión de inicio, agenda y comunicación — 20 de octubre de 2026

### Comprobaciones automáticas de esta revisión

| Área | Aprobadas |
| --- | ---: |
| Búsqueda, disponibilidad por rol y periodos de agenda | 26 |
| Estados de participación y navegación | 26 |
| Solicitudes y selección manual | 36 |
| Comunicación, edición y permisos | 42 |
| Total ejecutado en esta revisión | **130** |

Las suites de servidor se ejecutaron secuencialmente sobre `work/hub-usability-qa-01.sqlite`, independiente de la demo. Verifican solicitudes múltiples, máximo un confirmado, reasignación manual, entrega de preguntas y respuestas, aislamiento de cuentas y protección del enlace de acceso. No se han modificado operaciones de servidor ni permisos en esta revisión.

Las pruebas nuevas incluyen idiomas y hosts sin tildes, varias palabras, solicitudes ya enviadas/retiradas, cupo confirmado, reuniones en vivo sin participante para staff, cancelaciones, días locales y cambio de horario de verano. Compilación de producción y TypeScript aprobados.

### Navegador de escritorio y celular

- Alex ve la solicitud de Tokyo en revisión y la diferencia entre solicitud y confirmación. «Tengo una duda» abre el formulario con Tokyo, su fecha, zona horaria y host correctos.
- «Mi turno para hablar» completa un borrador editable y habilita el envío; no se envió una pregunta nueva en la demo principal.
- La búsqueda «ingles sofia» encuentra Discover London. El filtro London se conserva al salir y volver a entrar en la cuenta; la etiqueta permanece visible aunque el panel esté cerrado.
- Isa ve sus solicitudes pendientes y el próximo encuentro. «Revisar candidatos» abre Tokyo con Alex y Nicolás en revisión, sin seleccionar a ninguno.
- Se revisó el inicio de coordinación a 390 × 844, el tamaño de los controles, la agenda y la vista semanal. Se corrigió el calendario móvil para mostrar los siete días juntos.
- Las herramientas secundarias del inicio están dentro de un desplegable accesible.

Capturas: `../coded-stars-hub-next-step.png`, `../coded-stars-hub-coordination.png`, `../coded-stars-hub-coordination-mobile.png`, `../coded-stars-hub-agenda-mobile.png`.

El asistente sigue siendo local, basado en reglas, búsquedas y plantillas, sin API de IA. La demo continúa usando datos ficticios y una base local; las cuentas reales y la publicación en producción permanecen pendientes de configuración.


## Escritura gradual y contexto del asistente — 20 de octubre de 2026

### Comprobaciones ejecutadas

| Área | Aprobadas |
| --- | ---: |
| Asistente: permisos, aislamiento, persistencia y acciones manuales | 54 |
| Contexto: correcciones, aclaraciones, recuerdos y revisión de borradores | 56 |
| Total de esta revisión | **110** |

Las dos suites se ejecutaron secuencialmente sobre `work/hub-assistant-context-qa-03.sqlite`, independiente de la demo. No se requieren modelos ni servicios externos. Compilación de producción y TypeScript aprobados.

Las nuevas comprobaciones cubren:

- «Mis solicitudes de Tokyo» conserva la tarea de solicitudes; los estados confirmada/en revisión y los filtros se mantienen o se retiran de forma explícita.
- Las referencias a la segunda reunión conservan la tarea y el tema de la pregunta. Si hay varias opciones, solicita una elección; si la referencia queda fuera de la lista, pide aclaración.
- Un problema como «No pude dar mi testimonio» abre el seguimiento de resultados.
- La historia guiada conserva exactamente el recuerdo y el aprendizaje proporcionados. «No sé qué aprendí» no se registra como un aprendizaje inventado.
- Acortar un borrador conserva sus datos. Cambiar de programa no traslada recuerdos a una experiencia distinta.
- Las versiones breves de preguntas e invitaciones conservan su asunto y su programa. Publicaciones, preguntas y selección siguen requiriendo una acción humana en su formulario.
- «De 1 minuto» y «la primera vez» no se interpretan como referencias a la primera reunión.

### Revisión de interfaz

Se comprobaron en el navegador la animación Natural, la aparición del texto, «Mostrar completa», el modo Instantáneo y la conservación de la preferencia tras recargar. El historial se abre completo. Se probó una historia con recuerdos explícitamente ficticios y después «Hazlo más corto». Se revisaron el cuadro de escritura, el selector de ritmo y la navegación a 390 × 844; se restableció el tamaño de escritorio.

La presentación gradual ocurre después de recibir y guardar la respuesta completa. No añade esperas al servidor ni simula razonamiento. Las preferencias de movimiento reducido desactivan la animación. Las actualizaciones de texto quedan fuera de anuncios continuos para lectores de pantalla.

Se añadió después una posición fija al contenedor del chat para evitar que el enfoque desplace toda la página; esta última regla se comprobó mediante compilación. No se pudo repetir su revisión visual: el control del navegador rechazó la adquisición de la pestaña por un protocolo de URL no permitido. No se intentaron mecanismos alternativos para eludir el bloqueo.

Capturas anteriores a ese último ajuste: `../coded-stars-hub-typing.png` y `../coded-stars-hub-chat-mobile.png`.

El alcance sigue siendo un asistente local especializado con reglas, búsqueda, contexto y plantillas; no es GPT ni un modelo de lenguaje general.

## Presentación visual para el equipo — 20 de octubre de 2026

### Cambios y comprobaciones

Se incorporaron dos ilustraciones originales generadas con la herramienta integrada de imágenes, guardadas dentro del proyecto y mostradas mediante `next/image`. La paleta, las superficies, los estados, los controles y las tarjetas comparten la dirección visual documentada en `DISENO.md`. Las ilustraciones de programas son conceptuales y no fotografías oficiales.

- Compilación final de producción y comprobación de TypeScript aprobadas.
- 52 comprobaciones de agenda, periodos, estados y navegación aprobadas: 26 de agenda y 26 de recorrido. No se modificaron las operaciones ni los permisos de servidor en esta revisión visual.
- Acceso comprobado con Alex (Star), Sofía (host), Isa y Ela (administración). Isa y Ela ven las herramientas administrativas; Sofía ve su espacio de acompañamiento.
- Isa pudo abrir Tokyo y ver las solicitudes de Alex y Nicolás. No se confirmó, retiró ni reasignó a ningún candidato durante esta revisión.
- Inicio, agenda y detalle de reunión revisados a 390 × 844. Imágenes cargadas y sin desbordamiento horizontal en las vistas revisadas. Se restableció después el tamaño de escritorio.
- Asistente probado con «Mis solicitudes de Tokyo», ritmo Natural y respuesta en revisión. Se comprobó el historial, el cuadro de escritura y la navegación móvil.
- La revisión visual pendiente del encuadre del chat se completó. Se detectó que el enfoque podía desplazar un contenedor con `overflow:hidden`; se cambió a `overflow:clip` en los contenedores exteriores. Tras recargar, enfocar, escribir y recibir la respuesta, la cabecera permanece en y=0, el contenedor exterior conserva scrollTop=0 y el cuadro de escritura sigue visible.
- No se registraron errores de consola en la revisión final de la pestaña.

Capturas: `../coded-stars-hub-showcase.png`, `../coded-stars-hub-showcase-access.png`, `../coded-stars-hub-showcase-admin.png`, `../coded-stars-hub-showcase-mobile.png` y `../coded-stars-hub-showcase-chat-mobile.png`.

`PARA-MOSTRAR.md` contiene un recorrido breve para revisar la demo con el equipo. El enlace es local al equipo que ejecuta el servidor. La demo sigue usando datos ficticios, sesiones de demostración y SQLite local; requiere configuración adicional y autorización antes de utilizar datos reales o publicarse para uso de producción.

## Orlando: parques, NASA y fotografías — 20 de octubre de 2026

- TypeScript, compilación de producción y las 52 comprobaciones existentes de agenda/recorrido aprobadas.
- Se verificó en escritorio y a 390 × 844 que las dos fotografías cargan, el inicio no tiene desbordamiento horizontal y los textos permanecen legibles.
- Se abrió la galería desde la foto del parque, se pasó al Rocket Garden y se revisaron el título, la imagen, el contador y los créditos. La galería también se revisó en celular.
- Los botones La NASA y Mi grupo cambian la pregunta orientadora. Preparar mi historia abre la guía. Ver próxima JDP de Orlando abre Orlando em português, el próximo encuentro activo de ese programa en la demo actual.
- En el detalle se comprobó el desplegable de parques/NASA/grupo. Se conservan el estado de solicitud, el horario en La Paz y la selección administrativa. No se enviaron nuevas solicitudes ni se seleccionaron participantes.
- El asistente respondió a Quiero personalizar mi historia de Orlando solicitando un recuerdo de parques, NASA o grupo, sin atribuirle una experiencia inventada al usuario.
- Página de créditos y fotografía optimizada verificadas con HTTP 200. Las fuentes y licencias constan en DISENO.md y en la página pública de créditos.
- Se actualizaron únicamente las dos descripciones ficticias que coincidían exactamente con sus textos iniciales; se guardó antes una copia de la base en work. Se preservaron los otros datos y las ediciones existentes.

Capturas: `../coded-stars-hub-orlando.png`, `../coded-stars-hub-orlando-mobile.png` y `../coded-stars-hub-orlando-gallery-mobile.png`.

## Galería ampliada a seis fotos — 20 de octubre de 2026

- Investigadas y descargadas cuatro fotos adicionales de Magic Kingdom, EPCOT, Atlantis y Apollo/Saturn V Center. Páginas de origen, autores, fechas y licencia CC0 verificados mediante la fuente y la API de Wikimedia Commons; las referencias están en DISENO.md.
- TypeScript y compilación de producción aprobados. Este cambio afecta a imágenes, metadatos y presentación; no modifica datos de cuentas ni operaciones de servidor.
- Revisados los filtros Todas (6), Parques (3) y NASA (3). Los filtros muestran las fotografías de su categoría y actualizan el contador.
- Atlantis abre como 2 de 3 bajo NASA; Siguiente abre Saturn V como 3 de 3. La miniatura Rocket Garden permite saltar a esa foto.
- En la galería completa, la miniatura de EPCOT abre 5 de 6 con su fotografía, autor, fecha y licencia correctos. Escape cierra el diálogo.
- Revisadas las pantallas a 390 × 844 y 1280 × 800; después se restableció el tamaño original del navegador. Las seis fotos cargan y no hay desbordamiento horizontal en las vistas comprobadas.
- Confirmado que el navegador carga el tamaño optimizado para la pantalla: una foto de la galería móvil se sirvió con ancho de 256 píxeles. No se detectaron errores de consola en la revisión final.
- La galería y las portadas usan metadatos separados para conservar dos imágenes en cada portada aunque la colección tenga seis.

Capturas: `../coded-stars-hub-gallery-six.png` y `../coded-stars-hub-gallery-six-mobile.png`.


## Participación, tres programas y editor de historias — 20 de octubre de 2026

### Alcance

Las tres presentaciones se usaron como contexto editorial según la aclaración del usuario. Se priorizaron los accesos a reuniones, preparación y preguntas, y se colocaron las oportunidades antes de las fotos. No se importaron documentos originales, datos de estudiantes ni precios. Las operaciones de servidor y la selección manual conservan su comportamiento.

### Comprobaciones realizadas en esta revisión

- TypeScript aprobado y compilación final de producción completada.
- Las 52 comprobaciones existentes de agenda y recorrido pasaron de nuevo.
- En el inicio se probaron Orlando, Europa y Tokyo, sus preguntas por tema y la apertura de Preparación con Tokyo ya elegido desde «Empezar mi historia».
- Se escribió un ejemplo expresamente ficticio en los tres pasos. La vista previa contiene los textos introducidos, el contador de palabras se actualiza y copiar se habilita al completar las tres ideas. Se comprobó el mensaje de copia correcta.
- Ensayar inicia el contador; Pausar lo detiene y muestra Continuar. Cambiar de programa reinicia el contador y deshabilita el ensayo si sus tres ideas no están completas. El ensayo no solicita micrófono ni graba audio.
- Cambiar a Europa muestra un borrador separado. Después de recargar y volver a Tokyo, se recuperaron las tres ideas guardadas.
- Se inició sesión como Valentina: su borrador de Tokyo está vacío y no muestra el ejemplo de Alex. Se volvió a Alex y su borrador seguía disponible. Esto verifica separación de la interfaz por cuenta; el almacenamiento del navegador no sustituye un almacén de producción protegido.
- Se comprobó que avanzar de paso devuelve el foco al campo de escritura. Tras cerrar con Escape, el menú móvil devuelve el foco a Abrir menú y el editor de reuniones de Isa devuelve el foco a Nueva reunión.
- Isa pudo abrir Nueva reunión y cerrarla sin guardar. No se crearon JDP, enviaron solicitudes ni asignaron participantes durante estas comprobaciones.
- La galería revisada mantiene filtros de seis fotos en total, tres de parques y tres de NASA. Disney Hollywood Studios abre como 2 de 3 en Parques; Siguiente abre Epic Universe como 3 de 3. Se verificaron imágenes, créditos, miniaturas y cierre con Escape.
- Inicio y preparación se revisaron a 390 × 844 y en escritorio. No se observó desbordamiento horizontal en las vistas medidas. El editor móvil usa una columna y texto editable de 16 píxeles.
- No se registraron errores de consola en la revisión final de la pestaña.

Capturas: `../coded-stars-hub-story-studio.png` y `../coded-stars-hub-story-mobile.png`. El ejemplo de Tokyo está guardado solo en el navegador de la demo y está identificado como ficticio. El paquete fuente no incluye borradores del navegador, bases locales, secretos, los PDF originales ni dependencias instaladas.

Las suites de operaciones de servidor no se volvieron a ejecutar en esta revisión de interfaz. Sus resultados anteriores se conservan en las secciones correspondientes. La demo sigue siendo local y utiliza perfiles ficticios.


## Fotografías reales y mosaicos — 21 de octubre de 2026

Se añadieron diez fotografías reales, para una colección activa de dieciséis: ocho de Orlando, cuatro de Europa y cuatro de Tokyo. Los metadatos de origen y licencias se verificaron mediante Wikimedia Commons y las imágenes se inspeccionaron visualmente. Las ilustraciones generadas de globo y destinos dejaron de importarse en las pantallas. La paleta de fondo se simplificó y las imágenes tienen mayor espacio en acceso, inicio, tarjetas y detalle.

Comprobaciones de esta revisión:

- Compilación final de producción y TypeScript aprobados el 21 de octubre, tras el ajuste de nitidez de las fotos anchas.
- Las dieciséis imágenes de la página de créditos responden con HTTP 200 y contenido de imagen.
- Los tres programas muestran mosaicos visibles de cuatro fotografías; Orlando permite recorrer ocho en el visor. Se revisaron sus nuevas miniaturas UCF e Islands of Adventure, el contador, las autorías y las licencias.
- La galería de Tokyo carga sus cuatro imágenes en celular a 390 × 844. El ancho de contenido medido es 375 para una ventana de 390, sin desbordamiento horizontal. La ampliación de DisneySea muestra la foto y sus créditos; Escape devuelve el foco a la foto que la abrió.
- Las cuatro imágenes de Europa cargan en escritorio. Se verificó que la foto ancha utiliza una variante de mayor resolución y no la imagen pequeña de las casillas individuales. La fuente para la foto ancha de Shibuya también se ajustó a su ancho real.
- Se revisó el inicio con Asakusa como fotografía del destino de la solicitud pendiente. La selección manual y los estados de participación conservan su comportamiento; no se modificaron operaciones de servidor.
- Se restableció el tamaño de navegador después de probar celular. La demo queda abierta en la galería de Tokyo. La revisión final de consola no muestra errores.

Capturas: `../coded-stars-hub-real-photos.png` y `../coded-stars-hub-real-photos-mobile.png`. Los documentos originales y las fotos de estudiantes no se incorporaron al sitio. Las imágenes se describen como referencias de lugares, sin prometer un itinerario ni presentarlas como participantes de CODED.

No se volvieron a ejecutar las suites de operaciones de servidor en esta revisión de fotografías y presentación. Los resultados de las 52 comprobaciones de agenda/recorrido de la revisión anterior permanecen documentados arriba.

## Agenda visible, horarios completos y contacto — 21 de octubre de 2026

### Comprobaciones automáticas

| Área | Aprobadas |
| --- | ---: |
| Búsqueda, disponibilidad y periodos de agenda | 28 |
| Estados de participación y navegación | 26 |
| Inicio/fin, medianoche y cambios de horario de verano | 5 |
| Total ejecutado en esta revisión | **59** |

Comando: `node --experimental-strip-types --test tests/agenda.test.mjs tests/journey.test.mjs tests/meeting-schedule.test.mjs`. La compilación final de producción, incluida TypeScript, terminó correctamente después de corregir el diseño de escritorio.

Las nuevas pruebas cubren los alias Europa/Londres/London, el cálculo del final como tiempo transcurrido, el cambio de fecha local y los dos desfases UTC cuando una reunión atraviesa un cambio de horario de verano.

### Navegador

- Los selectores con fotos muestran Orlando, Europa · Londres y Tokyo con sus contadores. Elegir Europa deja Discover London; buscar «Europa» encuentra esa misma reunión.
- El idioma está siempre visible. Elegir Inglés muestra Discover London y actualiza los contadores de programas.
- «Preguntar» desde Discover London abre Mensajes → Preguntas con la reunión, Sofía y coordinación ya identificados. «Mi turno para hablar» completa un texto editable; no se envió ninguna pregunta.
- La vista semanal muestra los siete días. Elegir el viernes 23 muestra una reunión y actualiza los contadores. Se corrigió una etiqueta que seguía diciendo «en el día seleccionado» al volver a la lista.
- «Puedo enviar solicitud» excluye la solicitud de Tokyo ya pendiente y conserva las dos oportunidades disponibles para Alex.
- Cambiar La Paz a Madrid actualiza inicio y fin: Tokyo pasa de 15:00–15:45 a 21:00–21:45. Se restableció La Paz.
- El detalle móvil de Discover London conserva foto, estado y explicación de la selección, y muestra 14:00–14:45. Se cerró sin enviar una solicitud.
- A 390 × 844, los programas, campos, controles y tarjetas son legibles. Los campos de búsqueda e idioma tienen 16 píxeles. El contenido mide 375 píxeles para una ventana de 390; no se observó desbordamiento horizontal. Las imágenes presentes cargan correctamente. Se restableció el tamaño original del navegador.
- En escritorio se detectó y corrigió la interferencia de la cuadrícula anterior con los elementos nuevos. La revisión posterior confirma foto a la izquierda y título, horario, host, acciones y estado en orden a la derecha.
- La consola final de la pestaña no muestra errores. El servidor de la demo responde HTTP 200 y permanece abierto en la agenda.

Capturas: `../coded-stars-hub-agenda-refined.png` y `../coded-stars-hub-agenda-refined-mobile.png`.

Esta revisión no modifica operaciones, permisos ni selección administrativa en el servidor. No se enviaron solicitudes, crearon reuniones ni confirmaron participantes. Las suites de integración del servidor no se repitieron; sus verificaciones anteriores permanecen documentadas. La demo continúa utilizando datos y cuentas ficticios.

## Solicitudes y preparación por JDP — 21 de octubre de 2026

### Comprobaciones automáticas

| Área | Aprobadas |
| --- | ---: |
| Agenda, disponibilidad y periodos | 28 |
| Estados y navegación | 26 |
| Horarios de inicio y fin | 5 |
| Solicitudes activas/historial y listas de preparación | 15 |
| Total de esta revisión | **74** |

Se ejecutaron `agenda.test.mjs`, `journey.test.mjs`, `meeting-schedule.test.mjs` y `application-journey.test.mjs` con Node y `--experimental-strip-types`. La compilación final de producción y TypeScript terminaron correctamente. Las comprobaciones nuevas cubren registros de otra cuenta, estados cerrados, vencimiento exacto, reuniones en vivo, orden de las listas, claves separadas por cuenta/reunión y recuperación de marcas inválidas o duplicadas.

### Recorrido en navegador

- Alex muestra cero solicitudes en curso y tres en Historial al finalizar la JDP de Tokyo. Las pendientes vencidas dicen «Sin confirmación · finalizada» y explican que no se registra asistencia. Su resultado previo de Orlando aparece como enviado.
- Valentina muestra una solicitud en curso y una histórica. Su tarjeta de Discover London tiene foto, idioma, host, horario completo, progreso y accesos a preparación, detalle y preguntas.
- «Preparar mi historia» abre London con Sofía y 14:00–14:45 en La Paz. El editor utiliza Europa y conserva los borradores anteriores por programa.
- Se marcaron dos pasos de la lista de London, se cambió a práctica general y se observaron cero marcas. Al volver a London reaparecieron las dos marcas. Tras recargar y volver a «Antes de entrar», seguían guardadas.
- Completar los cuatro pasos muestra la lista completada y mantiene la solicitud en revisión. Se restablecieron después las cuatro marcas a cero.
- «Tengo una duda» abre Mensajes → Preguntas con Discover London y sus destinatarios correctos. No se envió una pregunta.
- Se revisaron la tarjeta, sus acciones y la preparación a 390 × 844. El selector usa texto de 16 píxeles, las fotos cargan y el contenido medido es de 375 píxeles para una ventana de 390, sin desbordamiento horizontal. Se restableció el tamaño original.
- Desde el mosaico de Tokyo del inicio se abrió la práctica general con Tokyo elegido, sin trasladar a ese programa la solicitud de London. Volver a elegir London recupera el editor de Europa.
- Un texto expresamente ficticio se conservó al pasar de «Mi historia» a «Antes de entrar» y volver. El texto de prueba se dejó vacío al finalizar; se preservaron los otros borradores.
- La consola final no muestra errores. La demo responde HTTP 200 y queda abierta como Valentina en Mis solicitudes.

Capturas: `../coded-stars-hub-applications-refined.png` y `../coded-stars-hub-preparation-mobile.png`.

Se revisaron los componentes de React, sus claves de reinicio, efectos, semántica, manejo de almacenamiento y separación por usuario. La lista se guarda desde acciones del usuario y el fallo de almacenamiento tiene un mensaje específico. No se añadieron dependencias, servicios de IA ni operaciones de servidor. Las confirmaciones futuras y sus accesos conservan la lógica existente; no había una participación futura confirmada en la demo para repetir ese caso en navegador. Las suites anteriores de integración de servidor no se repitieron en esta revisión.

## Mensajes, borradores y respuestas concurrentes — 21 de octubre de 2026

**Recorrido verificado:** Star pregunta → API y SQLite → host o coordinación responde → aviso privado → Star abre las conversaciones de esa reunión.

### Comprobaciones automáticas

| Área | Aprobadas |
| --- | ---: |
| Agenda, estados, navegación, horarios y preparación | 74 |
| Orden, filtros, búsqueda y borradores de preguntas | 15 |
| Comunicación, permisos, edición y avisos | 42 |
| Respuestas simultáneas, autoría y reintentos | 15 |
| Total ejecutado en esta revisión | **146** |

Las cinco suites de Node pasaron con `--experimental-strip-types`. `communication.integration.py` y `replies.integration.py` se ejecutaron secuencialmente contra una base nueva: `work/hub-messages-qa-01.sqlite`, servida temporalmente en `http://localhost:3001`. No se usó la base principal para crear preguntas, responder, seleccionar candidatos ni enviar avisos de prueba.

Las respuestas simultáneas devuelven `[200, 409]`: se conserva un único texto y su autoría. Intentar sobrescribirlo no cambia el registro. Reintentar exactamente la misma respuesta devuelve 200 sin duplicar el aviso. Otro Star no puede leer la pregunta ni responder, y un host ajeno recibe 403. Responder no confirma a un participante.

### Evidencia del recorrido completo

| Paso | Evidencia |
| --- | --- |
| Formulario de preguntas | Valentina escribe dos ejemplos ficticios, uno para London y otro para Orlando. Cambiar de reunión recupera su propio texto. |
| Protección del borrador | Una sugerencia con texto existente abre una vista de revisión y recibe el foco. «Conservar mi texto» mantiene el original. Salir a Mis solicitudes y volver recupera el borrador de London. |
| Formulario del host | Sofía recupera su respuesta después de cambiar entre Pendientes y Resueltas. En celular, el campo tiene 16 píxeles y el botón de enviar queda visible. |
| Navegador → API | Sofía envía una respuesta ficticia desde el navegador de prueba; las pendientes pasan de 1 a 0 y se muestra el aviso de envío correcto. |
| API → datos → Star | Una lectura autenticada de `/api/data` como Alex confirma el texto exacto, Sofía como autora, la fecha guardada y un único aviso nuevo. |
| Aviso → conversación | Alex abre «Ver respuestas» desde Novedades. La reunión queda elegida en el filtro, se muestra la respuesta enviada por Sofía y baja en uno su contador de avisos sin leer. |

### Interfaz y cierre

- Las preguntas pendientes se ordenan desde la más antigua; las respuestas, por la fecha de respuesta más reciente. Los contadores respetan la búsqueda y la reunión elegida.
- «sofia tokyo» encuentra la conversación de Tokyo en la demo principal. La respuesta existente continúa visible aunque la JDP ya terminó. Las fechas de pregunta, respuesta y aviso usan la zona seleccionada.
- La revisión final de TypeScript y la compilación de producción pasaron tras los ajustes de texto.
- Se probaron escritorio a 1280 × 800 y celular a 390 × 844. En celular, el contenido mide 375 píxeles para una ventana de 390 y no se observó desbordamiento horizontal. Búsqueda, selector y respuesta usan 16 píxeles. Se restableció el tamaño original.
- La consola final del navegador no muestra errores. La demo principal responde HTTP 200 y queda abierta como Alex en Mensajes → Preguntas, con la conversación ficticia de Tokyo.
- Se borraron los dos textos de prueba de Valentina desde los formularios. La respuesta enviada por navegador y sus avisos pertenecen únicamente a la base de prueba. Su pestaña se cerró y el servidor del puerto 3001 se detuvo.
- Se revisaron estructura de componentes, claves por contexto/cuenta, efectos, foco, semántica y errores de almacenamiento. Las ideas son plantillas editables con datos de la JDP; no se añadió un modelo de IA ni un SDK externo.

Capturas de la demo principal: `../coded-stars-hub-messages-refined.png` y `../coded-stars-hub-messages-mobile.png`. El paquete fuente excluye borradores del navegador, bases de datos, secretos, registros de prueba y dependencias.

## Coordinación y preparación del host — 21 de octubre de 2026

**Historia verificada:** Isa revisa varias solicitudes → confirma manualmente a un Star → API y SQLite guardan una única confirmación y sus avisos → Sofía ve al participante, prepara indicaciones y enlace → abre las preguntas de esa JDP.

### Comprobaciones ejecutadas

| Área | Aprobadas |
| --- | ---: |
| Agenda, estados, navegación, horarios, preparación y preguntas | 89 |
| Revisión de candidatos: búsqueda, filtros, contadores y elegibilidad | 16 |
| Integridad de solicitudes, permisos y reasignación manual | 36 |
| Comunicación, edición, privacidad y avisos | 42 |
| Total de esta revisión | **183** |

Las seis suites de Node pasaron con `--experimental-strip-types`. Las dos suites de integración se ejecutaron en una base independiente `work/hub-staff-qa-01.sqlite`, temporalmente servida en `http://localhost:3001`. Se conservó la base principal. Las compilaciones de producción y TypeScript pasaron tras los ajustes de interfaz.

### Evidencia del recorrido

| Frontera | Evidencia |
| --- | --- |
| Revisión del administrador | Isa abre Londres, filtra por Inglés y los contadores pasan de dos candidatos a uno: Camila. El formulario de confirmación muestra inicio, fin, zona, host, idioma y disponibilidad. Volver no guarda la decisión. |
| Navegador → API → datos | En la base aislada, Isa confirma a Alex desde el formulario de «Londres — preparación en equipo». La pantalla muestra un confirmado y un solicitante no seleccionado. Una lectura autenticada de `/api/data` devuelve exactamente esos estados. |
| Avisos y límites por cuenta | Alex recibe «¡Tu participación está confirmada!», Valentina recibe «Tu solicitud tiene una actualización» y Sofía recibe «Star asignado a tu reunión». El host recibe un único registro confirmado, cero perfiles de candidatos y ningún criterio interno. |
| Preparación del host | Sofía abre «Participante → Preparar esta reunión». La lista muestra a Alex, enlace e indicaciones pendientes y una pregunta sin responder. «Agregar» en Enlace pone el foco en el campo correcto. |
| Formulario → guardado → interfaz | Sofía guarda indicaciones ficticias y `https://example.com/qa-staff-room`. La lista cambia a «Guardado para el Star confirmado» y «Compartidas con los Stars». Una lectura como Alex recupera el texto y enlace; Valentina recupera el texto sin el enlace privado. |
| Reunión → conversaciones | «Responder» abre Mensajes → Preguntas con «Londres — preparación en equipo» elegido y su pregunta ficticia visible. No se envió una respuesta automática. |

### Interfaz y límites

- Las reuniones activas se presentan por fecha. Los estados distinguen candidatos por revisar, espera de solicitudes, asignación confirmada y reunión cerrada. En una JDP pasada, los perfiles se consultan como historial y no se ofrecen botones para elegir.
- El filtro de estado conserva los contadores de nombre, idioma y programa. La búsqueda de nombres acepta tildes opcionales y palabras en distinto orden. El orden es alfabético, sin puntuaciones ni recomendaciones de participantes.
- La confirmación usa la candidatura actual después de cada actualización de datos; una solicitud retirada o una reunión no elegible bloquea el envío. El servidor mantiene sus validaciones transaccionales y el índice de confirmación única.
- Se revisó el escritorio y el celular a 390 × 844. El detalle del host mide 351 píxeles de ancho tanto en contenido como en caja. Su foto carga y los campos usan 16 píxeles. El diálogo de confirmación mide 366 píxeles de contenido para una ventana de 390, sin desbordamiento horizontal.
- Se corrigió una superposición de foto y horario en el inicio móvil y se transformaron las tareas estrechas en filas legibles. Cada tarea mide 335 píxeles de caja y contenido; la agenda del próximo encuentro mide 293 en ambos. Se restableció el tamaño de ventana después de la revisión.
- Se revisaron estructura de React, claves por reunión, estados derivados, foco, etiquetas y separación por permisos. Los botones de la preparación tienen nombres accesibles por detalle. No se añadieron paquetes ni servicios externos.
- La base principal conserva las dos solicitudes de Londres en estado pendiente. La selección, sus avisos y las indicaciones enviadas por navegador pertenecen exclusivamente a la base aislada. Su pestaña y servidor se cerraron.

Capturas: `../coded-stars-hub-staff-refined.png`, `../coded-stars-hub-staff-mobile.png` y `../coded-stars-hub-selection-mobile.png`. El paquete fuente se actualiza sin bases de datos, secretos, dependencias ni archivos de prueba de `work/`.

## Presentación para revisión con Isa y Ela — 21 de octubre de 2026

**Recorrido:** entrar con un perfil de ejemplo → revisar pendientes y próxima JDP → filtrar candidatos y abrir la confirmación → preparar una participación como Star → abrir indicaciones y preguntas como host.

- Compilación de producción y TypeScript correctos. Se ejecutaron 42 comprobaciones existentes de navegación, estados y revisión de candidatos; no se añadieron pruebas para los cambios de texto.
- Isa abre Solicitudes desde la próxima reunión. Filtrar por Inglés deja a Camila y ajusta los contadores de dos a uno. Limpiar vuelve a mostrar a las dos candidatas.
- Elegir abre la confirmación con horario, idioma y disponibilidad. Volver no confirma a nadie. Las solicitudes de Londres se conservan pendientes.
- Valentina entra con el selector simplificado, ve su estado y abre Preparación. Se conservan el contexto de London y el borrador privado.
- Sofía abre la ficha de su reunión. La lista distingue asignación, acceso, indicaciones y preguntas. Abrir preguntas conserva Discover London en el filtro.
- La presentación del Star se revisó a 390 × 844. Página y contenido miden 375 píxeles para un viewport de 390, sin desbordamiento horizontal, y su foto carga.
- Se retiraron de las pantallas lemas, objetivos duplicados, etiquetas innecesarias y el protagonismo del asistente. Se mantiene una identificación visible de versión de revisión con datos de ejemplo.
- La publicación antigua «Tu historia puede inspirar a una familia» se archivó con la acción autenticada del administrador y su versión actual. Sigue recuperable desde Archivadas. No se modificaron preguntas, respuestas, solicitudes ni estados de reuniones.
- Los dos recursos gráficos generados sin referencias activas se trasladaron fuera del proyecto. Se conservan las 16 fotos reales y sus créditos.

Las pruebas de servidor de las revisiones anteriores no se repitieron: no cambiaron rutas de API, permisos ni transacciones. Se revisaron componentes de React, etiquetas, claves, foco y navegación después de los cambios.

### Cierre de la edición de revisión

- Ela entra desde el selector de administración, ve sus propios avisos y accede a reuniones, solicitudes y publicaciones. El nombre se presenta sin el sufijo repetido de demo; el aviso global de datos de ejemplo se conserva.
- A 390 × 844, sus tres tarjetas de pendientes miden 335 píxeles tanto de caja como de contenido. Cada botón del menú móvil mide 70 píxeles en ambos. No hay desbordamiento horizontal y la consola no muestra errores.
- Se guardaron capturas del acceso, administración, solicitudes, Star, host y vista móvil. El PDF para revisión tiene seis páginas con capturas de la versión actual, preguntas breves y el alcance del acceso local.
- Se comprobaron texto e imágenes del PDF, se renderizaron las seis páginas con Poppler y se inspeccionó su composición. No se observaron recortes ni superposiciones en el documento.
- La demo queda abierta en el inicio de Ela. La compilación final se sirve en el puerto 3000. Se restablecieron las dimensiones de prueba del navegador.


## Fotografías y textos en español · 22 de octubre de 2026

- Ocho fotos nuevas verificadas: Westminster, exterior del estadio Emirates, galería de aviación, Sensō-ji, canales de DisneySea, Shibuya, Toon Lagoon y entrada a Atlantis. Hay 24 fotos activas: Orlando 10, Europa 7 y Tokio 7.
- Galería con seis fotos visibles por programa y visor compartido con botones, miniaturas, descripción, autoría y licencia. Administración y anfitriones tienen tarjetas de acceso desde Inicio.
- Nombres de programas, anfitriones, idiomas, títulos de ejemplo, formularios y ayuda en español. Las claves de programas, idiomas, roles e identificadores conservan sus valores originales. Los títulos nuevos escritos por el equipo y los recuerdos entre comillas no se reescriben en el almacenamiento.
- Compilación de producción y TypeScript correctos. Cinco suites de Node: 90 comprobaciones, todas correctas. La normalización de texto se comprobó sin mutar registros ni modificar permisos, idiomas, referencias históricas o enlaces restringidos.
- Ayuda local: 56 comprobaciones de contexto correctas en una base temporal independiente, eliminada al terminar. Incluye correcciones, recuerdos personales, borradores y decisiones manuales. El servidor de esa prueba se cerró.
- Lectura autenticada: 38 comprobaciones correctas en ocho cuentas. Candidaturas y criterios internos excluidos para estudiantes y anfitriones; los anfitriones reciben solo sus reuniones; los enlaces de estudiantes requieren confirmación. Los 24 archivos de imagen son válidos y responden correctamente.
- Revisión visual en Safari: inicio de Coded Star e Isa, galerías de Orlando, Europa y Tokio, avance del visor y formulario de nueva reunión. Programa «Tokio» e idioma «Portugués» seleccionables sin crear una reunión. Ventana estrecha: tarjetas en una columna, navegación móvil y visor legibles. Ventana de escritorio restaurada al terminar.
- Las pruebas no cambiaron solicitudes, confirmaciones, preguntas ni publicaciones de la base principal. La selección sigue siendo administrativa y manual.


## Acceso unificado a preguntas y portadas · 22 de octubre de 2026

- La ficha del Coded Star utiliza el centro de Mensajes para preguntar. Se eliminó el formulario paralelo de la ficha. El acceso conserva la reunión en el formulario y en el filtro de conversaciones; recupera su borrador privado.
- Al enviar, el contexto conserva la reunión que se eligió en el formulario. Se revisó el caso de entrar desde Orlando, cambiar a Londres y enviar: el resultado apareció en la conversación de Londres, con estado de espera y confirmación de envío.
- La prueba de envío se ejecutó desde el navegador en una copia SQLite temporal de la demo, servida solo en 127.0.0.1:3001. Se cerraron su pestaña y servidor y se eliminó esa copia. No se añadió esa pregunta a la demo principal.
- En la demo principal se comprobó el borrador: escribir, volver a Inicio, abrir la misma reunión y recuperar el texto. Se retiró el texto de prueba sin enviarlo.
- Las portadas varían según la reunión y pertenecen a su programa; la imagen es consistente entre tarjeta, ficha y preparación. Las etiquetas residuales de Tokio en el inicio usan el nombre en español.
- Compilación de producción y TypeScript correctos. Se ejecutaron las suites existentes de navegación y preguntas: 41 comprobaciones correctas. No cambian rutas de servidor, permisos, selección ni notificaciones.
- Vista de 390 × 844: el diálogo mide 351 píxeles de caja y contenido; la tarjeta de contacto, 305 en ambos casos. Sin desbordamiento horizontal. Se reforzó el color y el tamaño de los títulos desplegables de la ficha.


## Formulario de administración y selector de solicitudes · 22 de octubre de 2026

- El formulario de reunión tiene vista previa con fotografía, programa, idioma, anfitrión y horario completo. En escritorio se muestra al lado; en celular se abre con «Ver cómo quedará».
- Las reuniones nuevas guardan un borrador por cuenta en este navegador. Se comprobó cerrar y reabrir, recargar la página y volver a entrar: Isa recuperó sus datos. Ela abrió un formulario independiente vacío. Las reuniones ya existentes no utilizan ese borrador.
- Se ejecutaron 29 comprobaciones: ocho nuevas de recuperación y separación de borradores, 16 existentes de revisión manual y cinco de horarios. Todas correctas. La compilación de producción y TypeScript pasaron.
- Prueba en una copia temporal SQLite: Isa creó una reunión de Tokio con Diego, de 23:30 a 00:15 en Madrid. La vista previa indicó el día de finalización; la agenda en La Paz mostró el mismo encuentro de 18:30 a 19:15. Crear borró el borrador: al abrir la siguiente reunión, el nombre estaba vacío.
- Diego recibió la reunión asignada y su aviso. Desde su ficha guardó indicaciones y un enlace de ejemplo; la preparación cambió a «Guardado» y «Compartidas». No hubo selección automática ni participante confirmado.
- El selector de solicitudes mostró tres grupos: pendientes, otras próximas e historial. Londres con dos solicitudes quedó en el grupo pendiente. Se preservan los filtros y la decisión manual.
- Revisión a 390 × 844: diálogo y contenido midieron 353 píxeles, sin desbordamiento horizontal. La vista previa comienza plegada y su botón permite abrirla. Se corrigieron los márgenes heredados de la fotografía y el contraste de las etiquetas.
- Se cerraron la pestaña y el servidor de pruebas y se eliminó la copia temporal. La demo principal conserva sus datos. El navegador vuelve a su tamaño normal y al inicio de Ela.


## Cierre para presentación · 22 de octubre de 2026

- Se actualizaron PARA-MOSTRAR.md y GUIA-EQUIPO.md con los nombres y accesos actuales: Entrar, Isa/Ela, Anfitrión, Preparación, nueva reunión con borrador y vista previa, Mensajes y Publicaciones. El recorrido dura aproximadamente siete minutos.
- Se recorrieron los perfiles de Ela, Isa, Valentina y Sofía en el navegador. Se abrió Elegir a Camila y se volvió a los candidatos sin confirmar; las dos solicitudes de Londres siguen pendientes. Los formularios de contenido y reunión conservan su revisión manual.
- Se renovaron las capturas de acceso, administración, solicitudes, Coded Star, anfitrión, visor de fotos y móvil. La captura reciente del editor muestra su vista previa de Tokio y el horario que termina al día siguiente.
- Se comprobó Preparación de Valentina, la ficha de Sofía y el editor vacío de Publicaciones de Isa. No se enviaron preguntas ni se crearon reuniones, publicaciones o confirmaciones en la base principal.
- En 390 × 844, el contenido y la página midieron 375 píxeles, sin desbordamiento horizontal. Se restableció la vista normal; la consola del recorrido no mostró errores.
- Se repitieron 38 comprobaciones de lectura autenticada en ocho cuentas, permisos y 24 fotografías. Todas correctas. No hubo cambios de código de aplicación en este cierre, por lo que se conserva la compilación de producción ya verificada.
- El PDF de revisión tiene ocho páginas con capturas actuales. Se verificaron texto, imágenes y numeración; se renderizaron e inspeccionaron las ocho páginas, con revisión ampliada de administración y cierre. El documento explica el acceso local y el uso de datos de ejemplo.
- La demo queda abierta en Inicio de Ela, en el puerto 3000. El PDF se puede compartir por separado; la web aún no tiene una URL pública.


## Invitación y presentación de fotografías · 22 de octubre de 2026

- Nueva portada para Stars sin solicitudes activas: selector visual de Orlando, Europa y Tokio, fotografía grande y próxima JDP disponible para esa cuenta. Día, hora e idioma proceden de la reunión real; si no hay fechas del programa, ofrece preparar la historia sin prometer una inscripción.
- Se conservan las 24 fotografías originales y sus créditos. La galería muestra cinco encuadres: una imagen principal y cuatro secundarias. Las tarjetas del equipo tienen portadas compartidas, temas y acceso al visor completo. Los panoramas extremos y fotos verticales no se usan como portadas automáticas recortadas.
- Compilación de producción y TypeScript correctos. Las suites existentes de agenda y recorrido de participación pasaron las 54 comprobaciones. No se modificaron el servidor, los permisos ni la selección manual.
- En el navegador, Alex cambió entre programas; Orlando abrió la ficha de su JDP con Enviar solicitud, sin enviarla. Tokio mostró que no hay nuevas reuniones y abrió la preparación del programa correcto. El visor abrió las fotos de Tokio, avanzó y conservó autoría y licencia.
- La portada mostró Londres a las 20:00 en Madrid y volvió a las 14:00 en La Paz para el mismo encuentro. Se dejó La Paz seleccionada.
- A 390 × 844 no hay desbordamiento horizontal: página y contenido miden 375 píxeles. La galería mide 337 tanto de caja como de contenido. El botón principal mide 46 píxeles de alto y aparece completo entre las coordenadas 686 y 732, sobre la navegación inferior.
- Se comprobó el selector con Enter, la apertura de las fotografías con Enter y el cierre con Escape. Se revisaron claves, estado por componente, textos alternativos, botones con estado accesible y ausencia de animaciones automáticas. Las transiciones respetan la preferencia de movimiento reducido.
- Capturas: ../coded-stars-hub-invitacion-programas.png y ../coded-stars-hub-invitacion-movil.png. La captura de escritorio incluye el comienzo de la página y la portada completa, sin cambiar el tamaño normal del navegador.
- Se restableció el tamaño del navegador y se dejó abierta la vista de Alex con Orlando. No se crearon solicitudes, confirmaciones, reuniones ni publicaciones durante esta revisión.


## Proceso de calendario informado por Isa · 22 de octubre de 2026

**Recorrido comprobado:** administración registra los cinco campos del calendario → el servidor convierte desde Orlando y guarda en SQLite → el Star encuentra el colegio y solicita participar → coordinación confirma manualmente → el anfitrión ve al seleccionado y cierra la JDP → el Star informa lo ocurrido.

| Punto del recorrido | Evidencia |
| --- | --- |
| Formulario | Cinco entradas principales: colegio, programa opcional, fecha, hora de Orlando y enlace. Opciones adicionales plegadas. Se recuperó el borrador con el programa vacío al cerrar y reabrir. |
| Validación y guardado | `sourceTimeZone: America/New_York`, conversión en el servidor y `schoolName` separado de los títulos anteriores. Invierno y verano se prueban con distintos desfases UTC; las horas inexistentes y repetidas se rechazan para confirmar el dato con el anfitrión. |
| Agenda y solicitud | En navegador se registró Colegio de demostración a las 18:00 de Orlando el 15/01/2027. Apareció a las 19:00 de La Paz, sin programa, idioma, duración ni anfitrión supuestos. Alex lo buscó por colegio y envió su solicitud; quedó En revisión. |
| Asignación y anfitrión | En navegador Isa configuró a Sofía e Inglés y confirmó manualmente a Alex. Sofía abrió su JDP y vio al participante confirmado. Las pruebas de servidor cubren varias solicitudes, selección concurrente, cancelación y reasignación manual. |
| Cierre y seguimiento | Sin duración no se genera un final. Sofía marcó Finalizada y Alex pudo registrar que entró, no tuvo la palabra, había familias y ocurrió un problema de conexión. La interfaz mostró el resultado guardado. Cerrar no genera asistencia ni testimonios automáticamente. |

- Compilación de producción y TypeScript correctos. Última ejecución: **146 comprobaciones unitarias correctas**. Incluyen recuperación de borradores, compatibilidad, datos opcionales, nombres, calendario, zonas, horario de verano y exportación sin final inventado.
- Pruebas de servidor: **64 comprobaciones del proceso nuevo** y **180 de regresión** (36 de solicitudes, 42 de comunicaciones, 87 de edición/permisos y 15 de respuestas), todas correctas. Los casos que necesitan un anfitrión ahora lo asignan explícitamente y no dependen de un valor por defecto.
- `program` y `language` vacíos, `duration: null` y anfitrión sin asignar se conservan. La búsqueda no clasifica el idioma ausente como español. Las portadas de reuniones sin programa o de otro programa son neutras. El enlace permanece restringido al Star confirmado y al equipo autorizado. Los nombres de colegios no se traducen en los avisos.
- Compatibilidad: los registros anteriores conservan sus títulos y sus datos. No se convierten títulos históricos en nombres de colegio. Los clientes anteriores con `title`/`startsAt` siguen admitidos. Los borradores anteriores se recuperan sin reinterpretar el título como colegio y su instante se convierte a Orlando cuando corresponde.
- En la revisión a 390 × 844, la página midió 390 píxeles y el diálogo 368 tanto de caja como de contenido, sin desbordamiento horizontal. Las pruebas de teclado y las etiquetas del formulario se conservaron; las fechas y horas usan controles nativos. La consola final no mostró errores. Se restauró el tamaño normal del navegador.
- Las pruebas con escrituras se hicieron exclusivamente en una copia SQLite temporal en 127.0.0.1:3001. Se cerraron la pestaña y el servidor y se eliminó la copia. La demo principal conserva sus cinco reuniones y no contiene Colegio de demostración.
- La pestaña visible tenía una versión anterior en memoria: se recargó y se comprobó que muestra Registrar JDP con los cinco campos vacíos. Queda abierta con Isa. Capturas: `../coded-stars-hub-registro-jdp.png` y `../coded-stars-hub-registro-jdp-movil.png`.
- Se actualizaron la guía de equipo, el recorrido de presentación, README y PROCESO-JDP.md. El PDF de ocho páginas incluye el formulario actual y distingue la estructura informada por Isa de las propuestas del Hub. Se comprobaron texto e imágenes, se renderizaron las ocho páginas y se inspeccionaron, incluidas las páginas modificadas a tamaño completo.

El alcance sigue siendo una demo local con datos ficticios. No se crearon cuentas reales ni se incorporó información real de menores.


## Acceso personal de administración · 25 de octubre de 2026

- Servicio Clerk provisionado en Vercel con el plan Hobby gratuito, conectado al proyecto en producción y vista previa. Instancia de desarrollo para la beta.
- Dos identidades creadas por petición del usuario, con correo reservado y no verificado automáticamente, sin una contraseña generada. Identificadores del Hub y permisos administrativos almacenados en metadatos privados.
- Correos configurados como secretos de Vercel, separados del código y del directorio público de demostración.
- La resolución de acceso exige sesión del proveedor, namespace del Hub, coincidencia entre identificador y rol privados, dirección verificada y directorio del servidor. Las cuentas bloqueadas, sin permiso o con información incompatible no obtienen acceso.
- Vercel siempre deshabilita la creación de sesiones de demostración; la pantalla personal usa los componentes oficiales de Clerk en español y el cierre de sesión del proveedor.
- Revisión de tipos y 156 comprobaciones unitarias superadas, incluidas 10 pruebas nuevas con casos de verificación de correo, permisos, namespace y desactivación de accesos públicos alojados.

La validación de las bandejas de correo y el primer inicio de sesión de Isa y Ela corresponden a sus titulares. El almacenamiento compartido de las reuniones sigue pendiente y no se declara publicada la beta por haber registrado estas cuentas.

Verificación final del acceso personal: compilaciones independientes con acceso de demostración y con las credenciales reales del proveedor completadas. Las cinco suites de regresión de servidor conservaron sus 244 comprobaciones; otras 9 comprobaron rechazo de credenciales de demostración, suplantación de identidad por cuerpo o cookie y privacidad de las API sin sesión. La pantalla individual se comprobó en navegador, en español, sin utilizar las cuentas de Isa o Ela ni enviarles códigos de prueba.

## Beta con almacenamiento compartido · 25 de octubre de 2026

Esta sección actualiza el estado anterior: Neon está provisionado y conectado al proyecto de Vercel. La migración 001 se comprobó primero en un esquema aislado y después se aplicó a los esquemas de vista previa y beta. No reemplazó datos existentes.

- 156 pruebas unitarias y revisión de tipos correctas. Compilaciones independientes de demo local y acceso personal completadas.
- Las ocho suites de servidor pasaron sus 400 comprobaciones en bases locales temporales nuevas: calendario 64, solicitudes 36, comunicación 42, contribuciones 87, respuestas 15, informes 46, asistente 54 y contexto del asistente 56.
- 24 comprobaciones contra PostgreSQL real, en `coded_hub_qa_20261025`: persistencia desde otro proceso, solicitudes múltiples, confirmaciones simultáneas, un único confirmado, cancelación sin selección automática, reasignación manual, privacidad, conflicto de ediciones, informes y reversión de cambios tras un fallo. El índice único también rechazó una segunda confirmación escrita directamente.
- 18 comprobaciones positivas del recorrido HTTP completo: sesión del proveedor → permisos del servidor → PostgreSQL → respuesta filtrada. Se utilizaron cuatro identidades ficticias temporales, eliminadas junto con sus sesiones al terminar. No se accedió como Isa ni como Ela y no se enviaron mensajes a sus correos.
- Otras 9 comprobaciones verificaron que la instancia personal rechaza credenciales demo, roles enviados por el cliente y cookies falsas, sin exponer contactos por las API sin sesión.
- Las direcciones ficticias usan el dominio reservado para ejemplos `example.com`; no pertenecen a estudiantes reales.
- Revisión de código y archivos públicos sin claves privadas ni correos reales de administración. Los secretos de Vercel y los datos de prueba permanecen fuera de Git y de la carga del despliegue.

El acceso personal de Isa y Ela exige que cada titular verifique su propio correo. Clerk sigue en instancia de desarrollo para esta beta; el paso a producción y el uso de datos reales de menores requieren la preparación y autorización correspondientes. El bloqueo general por entorno está documentado como límite para una beta de poco tráfico en BASE-COMPARTIDA.md.

Verificación alojada: despliegue `dpl_kSimumQ3Ry5GzifyYi52991eke86`, commit `39783c9`, Next.js, región iad1, compilación de 44 segundos y estado READY. Las mismas 18 comprobaciones de acceso completo pasaron en el propio despliegue. Se eliminaron solo los registros de esa ejecución de prueba y se revocaron y eliminaron sus identidades y sesiones ficticias. La comprobación de registros de ejecución de los últimos cinco minutos devolvió cero errores.

Se promocionó ese despliegue y se conectó el dominio de producción https://coded-stars-beta.vercel.app/. Una petición anónima obtiene 200 en la pantalla de acceso y 401 de la aplicación en `/api/data`; las vistas previas mantienen la protección de Vercel. La pantalla de acceso se comprobó en el navegador, en español y con aviso de datos de prueba. Clerk conserva su atribución y la indicación de modo de desarrollo.

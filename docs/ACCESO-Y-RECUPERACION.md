# CODED Stars Hub - Primer acceso y recuperación

## Diagnóstico del primer ingreso (Isa y Ela)

**No modificar cuentas ni contactar personas automáticamente.** Esta guía sirve para clasificar errores sin compartir datos privados.

1. Comprobar que la persona abrió la beta publicada, no la Preview de Vercel protegida por inicio de sesión de Vercel.
2. Si Clerk no reconoce el correo, coordinación debe comprobar que la dirección sea la registrada. No copiar direcciones en logs públicos.
3. Si aparece una verificación, la persona debe completarla desde su propio correo. Revisar spam cuando proceda; nunca compartir códigos, enlaces ni contraseñas.
4. Si ya tiene sesión de Clerk y el Hub indica que no puede vincular su perfil, revisar de forma no destructiva el identificador externo, la concesión privada, el correo verificado y el directorio.
5. Si no es claro, pedir una captura sin correo completo, códigos ni tokens; registrar en qué paso falla. No desactivar validaciones ni crear cuentas duplicadas.

Una cuenta ya creada no implica que el primer ingreso esté completado.

## Ensayo de copias de seguridad

El Hub usa SQLite en desarrollo y PostgreSQL/Neon cuando está alojado. **Esta tarea no hace una copia ni una restauración de datos reales de CODED.**

Comando de ensayo local ficticio:

    python3 scripts/verify-demo-backup.py

La prueba crea registros falsos, genera una copia transaccional de SQLite, restaura en una base nueva y valida integridad, checksum y restricción de un único Star confirmado.

Antes de utilizar información real, requiere aprobación y plan operativo:
- Definir responsable, retención y protección de datos, especialmente si hay menores.
- Habilitar backups/snapshots de Neon, con objetivos de punto y tiempo de recuperación (RPO y RTO).
- Ensayar restauración únicamente en una rama o proyecto independiente, nunca sobrescribiendo la beta.
- Cifrar respaldos y limitar su acceso. Nunca subir copias a GitHub ni enviarlas por correo.
- Comprobar datos y permisos por rol después de restaurar antes de cualquier publicación.
- Documentar frecuencia, alertas, costos, revisiones y eliminación segura.

## Versión 1.0

Quedan pendientes Clerk de producción, dominio autorizado, aprobación institucional, prueba de primer acceso por cada administradora, política de datos y recuperación verificada con una base de prueba de PostgreSQL. Las pruebas unitarias no equivalen a permiso para usar datos reales.


## Comprobación final antes de publicar

**Bloqueantes para una versión con usuarios reales:**
- [ ] Dirección de acceso oficial autorizada y dominio HTTPS validado por CODED.
- [ ] Instancia de Clerk de producción; cuentas y roles verificados individualmente.
- [ ] Acceso de Isa y Ela comprobado por ellas mismas, sin compartir códigos.
- [ ] Base de producción separada de la beta y respaldos restaurables en un entorno aislado.
- [ ] Política de tratamiento de datos, consentimiento, retención y responsable institucional, especialmente por tratarse de menores.
- [ ] Casos de autorización fallida, revocación, permisos y enlaces privados probados de extremo a extremo.
- [ ] Revisiones de accesibilidad, móvil y teclado validadas en la Preview exacta del commit.
- [ ] Pruebas de regresión, compilación y aprobación de aceptación por la coordinación.
- [ ] Plan de reversión, registro de errores y propietario de guardia para incidencias.

**Condición para publicar:** si falta cualquiera de estos bloqueantes, conservar la versión de prueba con datos ficticios. Un despliegue Preview exitoso no certifica que el flujo con personas reales esté listo.

### Matriz de error del primer ingreso

| Síntoma que reporta la persona | Diagnóstico permitido sin modificar su cuenta | Acción segura |
|---|---|---|
| «Correo no reconocido» | Comprobar correspondencia entre dirección autorizada y cuenta Clerk | Coordinar la corrección de identidad; no crear duplicados |
| No recibe código o enlace | Comprobar si aparece el paso de verificación y en qué bandeja se busca | La propia persona revisa correo y spam; no solicitar el código |
| Clerk permite entrar pero el Hub no abre | Revisar rol, identidad externa y correo **verificado** contra el directorio | Corregir permisos solo después de comprobar identidad |
| Pantalla o formulario se sale del teléfono | Registrar dispositivo, orientación y captura sin datos sensibles | Corregir el layout y reproducirlo en la suite responsive |
| Preview pide iniciar sesión en Vercel | Separar la protección del despliegue de la autenticación de la aplicación | Probar en la beta oficial; no desactivar la protección |

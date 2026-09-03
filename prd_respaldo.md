
| Título del PRD:            | Verificación de identidad real en el flujo de activación                  |
| -------------------------- | ------------------------------------------------------------------------- |
| **Iniciativa de roadmap:** | Now — Implementar verificación de identidad real                          |
| **Autor(es):**             | Milagros, Luz, Jose, Jharol, Abigail, Mauricio                            |
| **Colaborador(es):**       | Milagros, Luz, Jose, Jharol, Abigail, Mauricio                            |
| **Evaluador(es):**         |                                                                           |
| **Fecha:**                 | 24 agosto 2026                                                            |
| **Versión:**               | v2 — incorpora decisiones de producto tomadas tras auditoría del borrador |
| **Status:**                | Borrador                                                                  |
| **Roadmap de referencia:** | `vision_roadmap/respaldo_roadmap_strategy_es.md`                          |
| **Alcance geográfico:**    | Perú                                                                      |




# **1- Resumen Ejecutivo**

Respaldo ofrece un flujo de activación listo para usar (web + IDV (identificacion de identidad) + consentimiento) para aseguradoras de vida colectiva. Hoy el MVP permite completar la activación con un formulario **sin verificación de identidad real**: cualquier persona con el enlace puede activar la póliza y designar beneficiarios en nombre del titular.

Esta iniciativa incorpora verificación de identidad con **comparación biométrica facial contra el documento presentado**, antes de permitir activar la póliza, dejando evidencia recuperable vinculada a la activación.

El criterio que justifica el nivel biométrico es la **defendibilidad ante impugnación de pago**: cuando un tercero impugne la designación de beneficiarios años después del siniestro, la aseguradora debe poder demostrar quién estuvo presente al momento de la designación. Una verificación que solo contrasta datos del documento demuestra posesión del documento, no presencia del titular.

# **2- Estado Actual**

**Producto:** AaaS de activación para aseguradoras de vida colectiva — flujo web hosted, invitaciones por email (único canal hoy) e integración backend para sincronizar con los sistemas de la aseguradora.

**Estado del MVP (según roadmap):** flujo solo con formulario, sin IDV real, sin certificado de completitud, sin portal de póliza.

**Flujo actual:**

1. La aseguradora (o Respaldo en nombre del partner) registra al miembro elegible y dispara una invitación por email con enlace único de activación.
2. El miembro abre el enlace al flujo web hosted por Respaldo.
3. **No existe validación que confirme que quien accede es el titular registrado.**
4. El miembro completa el formulario y activa la póliza.
5. La activación queda registrada en el sistema de Respaldo; la sincronización con sistemas de la aseguradora depende de la integración backend configurada.

**Propiedades del estado actual con impacto en esta iniciativa:**

- El enlace de activación **no expira**.
- No se solicita consentimiento de tratamiento de datos personales antes de recolectar información del miembro.
- El acceso al flujo ocurre mayoritariamente desde dispositivo móvil.

**Fricción conocida:** miembros que no pueden completar el flujo llaman al call center de la aseguradora — driver directo de la NSM (*llamadas de activación por 1,000 invitados*).

# **3- Problema e Impacto**

El flujo actual permite activar una póliza mediante un enlace enviado al miembro elegible, pero **no verifica que quien accede sea el titular**. Cualquier persona con el enlace puede registrar datos personales o designar beneficiarios en nombre de otro.

El actor de riesgo no es un atacante externo: es alguien del entorno del titular (familiar, conviviente, personal de RR. HH., quien reenvió el enlace). Ese actor posee tanto el enlace como acceso físico al documento del titular y conocimiento de sus datos. Toda verificación basada en posesión del documento o conocimiento de datos es superable por él.


| Dimensión               | Impacto                                                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **Compliance y fraude** | Designación de beneficiarios por un tercero suplantando al titular; exposición de información sensible                          |
| **Legal**               | Sin evidencia de presencia del titular, la aseguradora no puede sostener la designación ante impugnación en el momento del pago |
| **Negocio (B2B)**       | Aseguradoras rechazan el producto antes de piloto; bloquea la NSM y el objetivo de desviar llamadas                             |
| **Operación**           | Reclamos, sanciones potenciales, pérdida de confianza del miembro y del partner                                                 |
| **Métricas**            | Sin IDV real no existe línea base de completitud ni de aprobación de verificación                                               |




# **4- Propuesta, Objetivos y Definición de Éxito**

**Propuesta:** Incorporar al flujo web de activación un paso de verificación de identidad que:

1. Capture el documento de identidad del titular y extraiga número de documento y fecha de nacimiento.
2. Capture el rostro del titular con detección de presencia física en el momento de la captura.
3. Compare el rostro capturado contra la fotografía del documento presentado.
4. Contraste el número de documento y la fecha de nacimiento extraídos contra el registro del miembro elegible provisto por la aseguradora.
5. Bloquee la activación si cualquiera de los pasos 2 a 4 no resuelve en coincidencia.

La verificación ocurre **antes** de la designación de beneficiarios y de la activación de la póliza, y deja evidencia recuperable vinculada a la activación.

**Nivel de verificación de V1:** comparación facial contra el documento presentado, mediante proveedor privado. El contraste biométrico contra la base de RENIEC queda fuera de V1 (ver sección 5).

**Objetivo de negocio:** Habilitar la revisión legal e IT de una aseguradora sobre el flujo de activación — requisito del tramo *Now* del roadmap.

**Métricas de éxito:**


| Métrica                                                                                                                                                 | Tipo                    | Valor actual                     | Objetivo                           | Plazo                                                  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | -------------------------------- | ---------------------------------- | ------------------------------------------------------ |
| **Rechazo en set de pruebas adversariales** — intentos de suplantación construidos a propósito que el sistema rechaza / total de intentos adversariales | Guardrail de compliance | Sin medición (el paso no existe) | 100%                               | Antes de habilitar el flujo en piloto                  |
| **Tasa de completitud IDV** — miembros que completan IDV / miembros que lo inician                                                                      | Entrada (palanca NSM)   | 0% (el paso no existe)           | ≥ 95%                              | Pruebas + primer piloto                                |
| **Tasa de aprobación IDV** — verificaciones con resultado de coincidencia / miembros únicos que intentan                                                | Experiencia             | 0% (el paso no existe)           | ≥ 99%                              | Pruebas + primer piloto                                |
| **Captura de consentimiento de tratamiento de datos biométricos**                                                                                       | Control                 | 0% (no se solicita hoy)          | 100% de los flujos que inician IDV | Pruebas                                                |
| **Captura de consentimiento de póliza**                                                                                                                 | Control                 | Sin dato (no instrumentado)      | 100% de activaciones completadas   | Pruebas *(depende de iniciativa hermana: audit trail)* |
| **Activaciones con evidencia IDV recuperable**                                                                                                          | Outcome                 | 0%                               | 100% de activaciones completadas   | Pruebas                                                |
| **Duración del paso IDV, percentil 95**                                                                                                                 | Experiencia             | No aplica                        | ≤ 120 segundos                     | Pruebas                                                |


Nota sobre la tasa de aprobación: se mide **por miembro único**, no por intento, para que los reintentos no la inflen. Deja de operar como guardrail de compliance — un sistema que aprueba a todos la cumple — y pasa a medir experiencia de usuarios legítimos. El guardrail de compliance es el set adversarial.

**Fuera del éxito de esta iniciativa:** reducción de llamadas al call center (NSM) — se mide en piloto (*Next*), una vez IDV y el resto del *Now* estén operativos.

# **5- Alcance y no-objetivos**

**Alcance (V1 — esta iniciativa):**

- Consentimiento de tratamiento de datos biométricos, solicitado antes de la captura.
- Captura del documento de identidad y extracción de número de documento y fecha de nacimiento.
- Captura facial con detección de presencia física y comparación contra la fotografía del documento.
- Contraste de número de documento y fecha de nacimiento contra el registro del elegible.
- Bloqueo de la activación cuando la verificación no resuelve en coincidencia.
- Registro de evidencia de cada intento (resultado, timestamp, identificador de transacción del proveedor, etapa alcanzada).
- Comportamiento definido ante fallo, abandono, expiración y caída del proveedor.
- Expiración del enlace de activación y reenvío a pedido.

**Criterio de exclusión de V1.** Queda fuera todo lo que cumpla al menos una de estas condiciones:

- **(a)** No es necesario para que una aseguradora acepte el flujo en revisión legal e IT.
- **(b)** Solo puede medirse o dimensionarse con datos de piloto.
- **(c)** Depende de una decisión del partner que aún no está tomada.
- **(d)** Cae fuera del límite del sistema: Respaldo no es sistema de registro de ese dato.


| Fuera de alcance                                                             | Criterio                                                             | Destino                           |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------- |
| Invitaciones multicanal (SMS, WhatsApp, QR)                                  | (a) — el canal email ya lleva al flujo; no altera la verificación    | *Next / Later*                    |
| Portal de detalle de póliza                                                  | (a) — posterior a la activación, no participa de la verificación     | *Later*                           |
| Modificar datos de elegibles en sistemas de RR. HH. o core de la aseguradora | (d) — el padrón es entrada del sistema, no salida                    | Permanente                        |
| Cambiar condiciones o coberturas de la póliza                                | (d)                                                                  | Permanente                        |
| IDV en modificaciones posteriores a la activación inicial                    | (a) — el evento de riesgo es la designación inicial de beneficiarios | *Next*                            |
| Instrumentación completa de NSM y dashboard                                  | (b)                                                                  | *Next*                            |
| Contraste biométrico contra la base de RENIEC                                | (c) — el partner no ha declarado si lo exige                         | Se reabre si el partner lo exige  |
| Documentos de identidad de países distintos de Perú                          | (c) — el primer piloto es Perú                                       | *Later*                           |
| Interfaz de consulta de evidencia para la aseguradora                        | (b) — el volumen de consultas se dimensiona en piloto                | Se reevalúa tras el primer piloto |
| Revisión manual de casos bloqueados dentro de Respaldo                       | (c) — la resolución la ejecuta la aseguradora en su proceso          | Se reevalúa tras el primer piloto |
| Reseteo de intentos desde soporte de Respaldo                                | (c)                                                                  | Se reevalúa tras el primer piloto |




# **6- Flujos y comportamientos**

**Flujo principal:**

1. La aseguradora registra al miembro elegible; Respaldo envía invitación por email con enlace único.
2. El miembro abre el enlace al flujo web hosted.
3. La plataforma solicita **consentimiento de tratamiento de datos biométricos**. Sin consentimiento otorgado, el flujo no avanza y no se captura ningún dato biométrico.
4. El miembro captura su documento de identidad.
5. El sistema extrae número de documento y fecha de nacimiento del documento capturado.
6. El miembro completa la captura facial con detección de presencia física.
7. El sistema compara el rostro capturado contra la fotografía del documento.
8. El sistema contrasta número de documento y fecha de nacimiento contra el registro del elegible.
9. Con coincidencia en los pasos 7 y 8, el miembro continúa con **consentimiento de póliza**, designación de beneficiarios y activación.
10. La póliza se marca como activada server-side; se registra evidencia de la verificación y de ambos consentimientos.
11. El evento de activación se notifica a los sistemas de la aseguradora.

**Regla de contraste con el padrón:**

- Campos obligatorios para declarar coincidencia: **número de documento** y **fecha de nacimiento**, ambos exactos.
- El nombre no bloquea la activación. Una diferencia de escritura entre el documento y el padrón (tildes, segundo apellido, nombre de casada) no impide la coincidencia cuando número de documento y fecha de nacimiento son exactos.

**Reintentos:** 3 intentos de verificación por miembro. Agotados los 3, el miembro queda bloqueado en el flujo digital.

**Variaciones y estados de error:**


| Caso                                                                    | Comportamiento esperado                                                                                                                           |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Consentimiento biométrico rechazado o no otorgado                       | No iniciar captura; no activar; registrar la negativa con timestamp                                                                               |
| Comparación facial sin coincidencia                                     | Bloquear activación; consumir 1 intento; mostrar el motivo del bloqueo y la vía de contacto con la aseguradora                                    |
| Coincidencia por debajo del umbral de confianza                         | Tratar como intento sin coincidencia: bloquear, consumir 1 intento, registrar el resultado con su nivel de confianza                              |
| Datos extraídos del documento no coinciden con el padrón                | Bloquear activación; consumir 1 intento; registrar qué campo difiere                                                                              |
| Documento ilegible o campos obligatorios no extraíbles                  | Bloquear avance; permitir nueva captura dentro del mismo intento                                                                                  |
| IDV abandonada a mitad                                                  | No activar; registrar el intento incompleto y la etapa alcanzada; permitir retomar desde el enlace mientras no haya expirado                      |
| 3 intentos agotados                                                     | Bloquear el flujo digital para ese miembro; notificar a la aseguradora; la activación pasa al proceso manual de la aseguradora, fuera de Respaldo |
| Miembro sin cámara utilizable                                           | No puede completar el flujo digital; misma salida que 3 intentos agotados                                                                         |
| Enlace expirado o inválido                                              | Rechazar acceso; no iniciar captura; permitir solicitud de reenvío                                                                                |
| Enlace que expira con una verificación en curso                         | La sesión en curso se completa; la expiración impide iniciar una nueva                                                                            |
| Proveedor no disponible                                                 | No activar; registrar incidente; emitir alerta operativa. El efecto sobre el contador de intentos está en preguntas abiertas                      |
| Proveedor responde con éxito pero sin los campos obligatorios           | Tratar como fallo del proveedor, no como fallo del miembro; no consumir intento; registrar incidente                                              |
| Registro del elegible sin número de documento o sin fecha de nacimiento | No iniciar la verificación; reportar el registro a la aseguradora; la activación pasa al proceso manual de la aseguradora                         |




# **7- Requisitos no funcionales**

**Latencia y disponibilidad**

- Duración del paso IDV completo, desde el inicio de la captura hasta el resultado: ≤ 120 segundos en el percentil 95.
- Mientras la verificación esté en curso, la interfaz muestra el estado de progreso de forma continua.
- Disponibilidad de la API de activación: ≥ 99.9% (guardrail del roadmap).
- El flujo debe completarse desde navegador móvil, sin instalación de aplicación.

**Privacidad**

- Respaldo **no almacena** la imagen del documento ni la imagen facial en su propia infraestructura.
- Respaldo conserva por cada intento: identificador del elegible, timestamp, etapa alcanzada, resultado, nivel de confianza y el identificador de transacción del proveedor.
- El consentimiento de tratamiento de datos biométricos se obtiene de forma expresa y previa a cualquier captura, conforme a la Ley 29733 de Protección de Datos Personales. Es un consentimiento distinto e independiente del consentimiento de póliza.
- La retención de imágenes en el proveedor debe cubrir como mínimo el plazo de reclamos de la póliza. El valor exacto de ese plazo está en preguntas abiertas.
- El contrato con el proveedor debe garantizar: acceso auditable a la evidencia durante el plazo de retención, y entrega de la evidencia conservada en caso de terminación del contrato o cambio de proveedor.

**Seguridad**

- El enlace de activación expira a los 30 días de emitido y puede reenviarse a pedido.
- Máximo 3 intentos de verificación por miembro elegible.
- La activación se marca server-side. No existe camino de activación que no haya atravesado una verificación con resultado de coincidencia.
- No existe bypass de la verificación, ni por configuración ni por soporte, en V1.
- El acceso a la evidencia queda restringido al equipo de Respaldo. En V1 no se expone interfaz de consulta al partner.

**Comportamiento ante error o baja confianza**

- Baja confianza en la comparación biométrica se trata como ausencia de coincidencia. El sistema no activa la póliza ante un resultado ambiguo.
- Un fallo atribuible al proveedor no se contabiliza como fallo del miembro.
- Todo intento, con cualquier desenlace, deja registro. Un intento sin registro es una falla del sistema, no un intento fallido.
- Ante indisponibilidad del proveedor, el sistema bloquea la activación. No se habilita ninguna vía alternativa que active la póliza sin verificación.



# **8- Supuestos y dependencias**

**Supuestos**


| Supuesto                                                                                                         | Dueño                | Estado                                                                       | Comportamiento del sistema si no se cumple                                                                                                                                       |
| ---------------------------------------------------------------------------------------------------------------- | -------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Las aseguradoras exigen verificación biométrica como condición para aceptar el flujo                             | Producto             | **Inferencia del equipo, sin validar**                                       | No hay respuesta de sistema. Si exigen menos, se construyó por encima del requisito; si exigen contraste contra RENIEC, se reabre el nivel de verificación y cambia el proveedor |
| El padrón de elegibles trae número de documento y fecha de nacimiento completos y válidos en todos los registros | Producto + partner   | **Asumido, no validado.** Decisión del equipo: no se mide antes de construir | El registro incompleto no inicia verificación; se reporta a la aseguradora y la activación pasa a su proceso manual                                                              |
| El miembro accede desde dispositivo móvil con cámara utilizable                                                  | Producto             | Confirmado con dato de uso                                                   | Sin cámara utilizable, el miembro sale al proceso manual de la aseguradora                                                                                                       |
| El proveedor conserva la evidencia durante el plazo de reclamos de la póliza                                     | Producto + Legal     | Pendiente — condición contractual a negociar                                 | Sin esa garantía contractual, el proveedor no es elegible                                                                                                                        |
| La aseguradora acepta absorber el costo por verificación, incluidos los reintentos                               | Comercial            | Decidido: el costo se traslada a la aseguradora. Monto sin costear           | Si no lo acepta, se revisa el límite de 3 intentos, que es el techo de costo por miembro                                                                                         |
| La aseguradora expone un destino para recibir la notificación de activación                                      | Ingeniería + partner | Pendiente                                                                    | Sin destino, la activación queda registrada en Respaldo y la sincronización se difiere                                                                                           |


**Dependencias**


| Dependencia                                                                          | Dueño                 | Estado      | Qué bloquea                                                        |
| ------------------------------------------------------------------------------------ | --------------------- | ----------- | ------------------------------------------------------------------ |
| Audit trail base y logs server-side (iniciativa hermana *Now*)                       | Ingeniería            | En curso    | Registro de evidencia y consentimientos. Bloquea piloto, no diseño |
| Revisión legal del tratamiento de datos biométricos bajo Ley 29733                   | Legal                 | Pendiente   | Orden del flujo y texto del consentimiento. Bloquea desarrollo     |
| Selección y contratación del proveedor de verificación                               | Producto + Legal      | Pendiente   | Contrato de integración y costo por verificación                   |
| Certificado o confirmación de completitud post-activación (iniciativa hermana *Now*) | Producto              | Pendiente   | Piloto, no esta iniciativa                                         |
| Invitaciones por email — tasa de entrega y reenvío (iniciativa hermana *Now*)        | Ingeniería            | Pendiente   | Que el miembro llegue al flujo. Bloquea piloto                     |
| Set de pruebas adversariales para el guardrail                                       | Producto + Ingeniería | No iniciado | Habilitación del flujo en piloto                                   |




# **9- Restricciones y Riesgos**

**Restricciones:**

- El consentimiento de tratamiento de datos biométricos precede a cualquier captura.
- La verificación se completa antes de registrar beneficiarios y antes de la activación.
- La integración ocurre sobre el flujo web existente, sin rediseñar la experiencia completa de activación.
- La evidencia de la verificación debe poder recuperarse para compliance y reclamos durante el plazo de retención.
- No se reduce el nivel de verificación para elevar completitud o desviar llamadas.
- El alcance geográfico de V1 es Perú.

**Riesgos:**


| Riesgo                                                                                         | Impacto                                                                            | Mitigación                                                                                         |
| ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| El nivel de verificación exigido por el partner difiere del construido                         | Alto — retrabajo de proveedor, integración y flujo                                 | Obtener el requisito documentado del partner antes de contratar proveedor                          |
| Las preguntas abiertas se resuelven durante el desarrollo                                      | Alto — las decisiones de producto pendientes las termina fijando la implementación | Sin mitigación acordada. El equipo decidió resolverlas sobre la marcha                             |
| El padrón no cumple el supuesto de completitud                                                 | Alto — bloqueos masivos antes de iniciar verificación                              | Sin mitigación previa. Se detecta en la primera carga real                                         |
| La verificación facial contra documento no detecta un documento adulterado con otra fotografía | Medio — el vector queda abierto en V1                                              | Set adversarial que incluya este caso; contraste contra RENIEC como respuesta si se materializa    |
| Fricción de la captura biométrica reduce completitud por debajo de 95%                         | Medio — más llamadas al call center                                                | Medir abandono por etapa; salida a proceso manual de la aseguradora                                |
| Costo por verificación con 3 intentos triplica el costo por activación                         | Medio — margen del partner                                                         | Medir distribución real de intentos en piloto                                                      |
| Indisponibilidad del proveedor bloquea activaciones                                            | Alto — activaciones detenidas, llamadas                                            | SLA contractual; alerta operativa; sin vía alternativa de activación por restricción de compliance |
| Evidencia no recuperable ante impugnación de pago                                              | Alto — legal                                                                       | Retención contractual en el proveedor; registro propio de resultado y referencia desde V1          |




# **10- Preguntas abiertas**

Estado acordado por el equipo: se resuelven durante el desarrollo. No hay fecha límite previa al refinamiento.


| Pregunta                                                                                              | Responsable            |
| ----------------------------------------------------------------------------------------------------- | ---------------------- |
| ¿Cómo se convierte en evidencia la inferencia de que las aseguradoras exigen verificación biométrica? | Producto               |
| ¿El partner exige comparación contra documento o contraste contra la base de RENIEC?                  | Producto + Legal       |
| ¿Qué tipos de documento peruano se aceptan además del DNI (carné de extranjería, pasaporte)?          | Producto + Legal       |
| ¿Cuál es el plazo de reclamos de la póliza que define la retención mínima de evidencia?               | Legal                  |
| ¿Un fallo del proveedor consume uno de los 3 intentos del miembro?                                    | Producto               |
| ¿El enlace se invalida tras una activación exitosa, además de expirar a 30 días?                      | Producto               |
| ¿Cuál es el costo por verificación y cómo se factura al partner?                                      | Comercial + Producto   |
| ¿Qué reglas de escalamiento aplica el partner ante un registro de elegible incompleto o discrepante?  | Producto + Ops partner |
| ¿Qué ruta tiene un miembro que no puede completar captura biométrica por discapacidad?                | Producto + Legal       |
| ¿Restricciones legales específicas por tipo de póliza colectiva en Perú?                              | Legal                  |




# **11- Para definir en el RFC**

Decisiones de implementación derivadas de este documento. Ninguna se resuelve en el PRD.

- Proveedor de verificación y contrato de integración.
- Modalidad de detección de presencia física: activa (gestos solicitados) o pasiva.
- Umbral numérico de confianza de la comparación biométrica que separa coincidencia de no coincidencia.
- Mecanismo de extracción de datos del documento y manejo de extracciones parciales.
- Mecanismo de notificación de activación a la aseguradora. Modo preferido por el equipo: notificación en tiempo real hacia un destino expuesto por la aseguradora.
- Esquema de datos de la evidencia y su vinculación con la póliza.
- Mecanismo de recuperación de evidencia a pedido. Modo previsto para V1: consulta directa a la base por el equipo de Respaldo, sin interfaz.
- Modelo de estados del intento de verificación: en curso, incompleto reanudable, fallido, agotado.
- Distinción entre reintento de captura dentro de un intento y consumo de uno de los 3 intentos.
- Contrato de datos del padrón de elegibles: origen, esquema y frescura.
- Manejo de degradación parcial del proveedor: timeouts, reintentos técnicos y respuestas incompletas.
- Roles y control de acceso sobre la evidencia.


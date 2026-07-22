## MVP Brief V1 — Wizard of Oz

**Cambio vs. V0:** sin integración con la API de WhatsApp. Una persona opera el canal manualmente con guion fijo, mientras el usuario percibe un “bot de beneficios”. El resto del flujo (link, OCR, activación) sí se construye.

---

### 1. Problema

El seguro de vida grupal se entrega en un PDF por correo que casi nadie abre. El colaborador no sabe que está asegurado, no activa su cuenta y el beneficio — que la empresa ya paga — queda invisible: sin protección percibida y sin impacto en retención.

### 2. Usuario target

**Colaborador recién contratado** (0–7 días en la empresa) de una **empresa cliente de Respaldo** con póliza grupal activa.

**Contexto:** acaba de entrar, recibe muchos correos de onboarding y el PDF del seguro se pierde entre ellos. No conoce el monto de cobertura ni ha registrado beneficiarios.

### 3. Enfoque de validación

**Wizard of Oz** — validar deseabilidad y activación sin costo ni complejidad de integración con WhatsApp Business API.


| Capa           | V1 (piloto)                                                      | Después (si valida)    |
| -------------- | ---------------------------------------------------------------- | ---------------------- |
| Canal WhatsApp | Operador humano responde desde número de Respaldo con plantillas | Bot + API oficial      |
| Conversación   | Guion fijo + respuestas copiadas desde panel interno             | NLU / bot automatizado |
| Activación web | Link único + OCR DNI/INE + confirmación beneficiarios            | Igual                  |
| Métricas       | Tracking manual + dashboard mínimo                               | Automatizado           |


**Qué validamos:** canal WhatsApp + flujo de activación simple superan al PDF en tasa de activación a 7 días.

**Qué no validamos:** escalabilidad del bot ni tiempo de respuesta en producción automatizada.

### 4. Hipótesis central

> Creemos que **un bot de beneficios en WhatsApp con activación por escaneo de documento de identidad (DNI/INE)** ayudará a **colaboradores recién contratados** a **activar su seguro en menos de 1 minuto** porque **elimina la fricción del PDF olvidado y del formulario manual**, reemplazándolos por un canal que ya usan a diario y un registro que toma segundos.



### 5. Core loop (experiencia del usuario)

1. Colaborador recibe mensaje de activación por WhatsApp
2. Pregunta sobre su cobertura (*“¿cuánto cubre?”*)
3. Recibe respuesta con datos de la póliza + link de activación
4. Abre link → escanea DNI/INE → sistema precarga datos
5. Confirma beneficiario(s) → cuenta activada
6. Recibe confirmación por WhatsApp (*“Tu familia está protegida por $X”*)

*El usuario no sabe que un operador responde; usa plantillas con tono de bot.*

### 6. Must Have (MVP)

**Se construye**

1. Link único de activación por colaborador (trazabilidad del funnel)
2. Flujo web: escaneo DNI/INE + OCR precarga datos
3. Confirmación de beneficiario(s)
4. Pantalla de confirmación (*“Protegido por $X”*)
5. Tracking de activación (% en 7 días) — dashboard o sheet mínimo
6. Panel interno con datos de póliza por colaborador (monto, cobertura, link)

**Se opera manualmente (Wizard of Oz)**

1. Envío del mensaje inicial de activación por WhatsApp (lista de altas del cliente piloto)
2. Respuestas a preguntas frecuentes con **plantillas fijas** (monto, qué cubre, cómo activar)
3. Envío de confirmación final post-activación

**Operación del piloto**

1. **Guion del operador** — máx. 8 plantillas; sin improvisar respuestas
2. **SLA de respuesta** — <5 min en horario laboral del piloto
3. **Tamaño del piloto** — acotado a lo que 1 operador puede atender (~20–30 altas en la ventana de prueba)

### 8. Métricas de éxito

**Primaria:** tasa de activación en 7 días **>28%** (baseline actual).

**Secundarias:**

- Tasa de clic en link de activación — ≥60%
- Tiempo promedio de activación (desde primer mensaje hasta confirmación) — <2 min en el flujo web; <5 min incluyendo respuesta del operador
- Funnel: recibió mensaje → respondió → clic en link → escaneó → activó

**Diseño de validación:** piloto before/after con el primer cliente (histórico PDF vs. cohorte WhatsApp). A/B solo si hay volumen suficiente (≥~20 altas).

### 9. Riesgos y mitigación


| Riesgo                     | Mitigación                                                  |
| -------------------------- | ----------------------------------------------------------- |
| Operador inconsistente     | Solo plantillas; sin respuestas libres                      |
| Volumen > capacidad        | Tope de altas en el piloto; horario definido                |
| Datos sensibles (DNI)      | OCR en web; operador no almacena documentos                 |
| Usuario nota que no es bot | Tono uniforme; respuestas rápidas; sin “humano” en el guion |




### 10. Deadline

**22 de julio de 2026** — flujo web de activación + guion de operador + primer envío al cliente piloto.
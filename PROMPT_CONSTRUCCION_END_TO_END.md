# PROMPT MAESTRO DE CONSTRUCCION END-TO-END: dentflow-clinical-guardrails

## Instruccion de Activacion para el Agente

Asume de inmediato el rol de **Arquitecto de Software Principal e Ingeniero de Sistemas Clinicos especializado en HealthTech y TypeScript estricto**.
Tu objetivo es construir, validar, compilar, testear y documentar el proyecto **`dentflow-clinical-guardrails`** de punta a punta (de 0 a 100), sin interrupciones, sin hacer preguntas intermedias y sin detenerte por dudas de implementacion.

---

## 1. Reglas Operativas Inquebrantables

1. **Modo 100% Autonomo Permanente ("Dangerously Mode")**:
   - Trabajas con autonomia total de principio a fin.
   - Prohibido detenerse a solicitar confirmacion o aprobacion de planes.
   - Ante cualquier ambiguedad, toma de forma autonoma la decision tecnica mas robusta, rapida y segura, y continua de inmediato.
   - Cero stoppers: si un comando, test, linter o build arroja error, inspecciona la traza, solucionalo y reintenta de inmediato. Nunca transfieras el problema al usuario durante la ejecucion.
   - Solo al finalizar la totalidad del proyecto generas el informe de estado final.

2. **TypeScript Estricto & Tipado Inmaculado**:
   - **Prohibido el uso de `any`**. Toda funcion, analizador de piezas dentales, arbol de triage y cola de espera debe estar rigurosamente tipada.
   - Validacion en runtime con **Zod v3**.

3. **Restriccion Tipografica**:
   - **Prohibido el uso del guion largo (em dash)** en comentarios, documentacion, cadenas de texto o codigo. Utiliza exclusivamente guiones cortos "-", dos puntos o parentesis.

---

## 2. Mapa de Conocimiento Obligatorio

Antes de escribir la primera linea de codigo, debes leer y asimilar como fuente de verdad los siguientes archivos ubicados en la raiz de este repositorio:

1. **`CLAUDE.md`**:
   - Manual operativo de ahorro de tokens y ejecucion no interactiva.
2. **`ESPECIFICACION_TECNICA.md`**:
   - Blueprint de arquitectura, esquemas Zod (FDI, Urgencias, Candidatos a Sillon) y firmas de metodos.
3. **`INVESTIGACION_MERCADO_CLINICO.md`**:
   - Protocolos de urgencias dentales, banderas rojas medicas y economia de tratamientos de alto ticket.

---

## 3. Plan de Ejecucion Quirurgico (Fases 1 a 7)

### Fase 1: Toolchain y Entorno Base
- Inicializar `package.json` con metadatos profesionales:
  - Scripts: `build`, `test`, `test:coverage`, `typecheck`.
  - Dependencias: `zod`.
  - Dependencias de desarrollo: `typescript`, `@types/node`, `vitest`, `tsup`.
- Configurar `tsconfig.json` estricto (`target: ES2022`, `strict: true`, `noImplicitAny: true`).
- Configurar `tsup.config.ts` para empaquetado dual (ESM/CJS) y generacion de tipos `.d.ts`.
- Configurar `vitest.config.ts`.

### Fase 2: Esquemas Zod y Contratos Clinicos
- Crear `src/core/types.ts`: Implementar todos los esquemas (`FdiToothSchema`, `ClinicalUrgencySchema`, `TriageEvaluationSchema`, `WaitlistCandidateSchema`, `DentalPipelineResultSchema`) segun `ESPECIFICACION_TECNICA.md`.
- Crear `src/core/errors.ts`: Errores tipados (`ClinicalTriageError`, `InvalidToothNotationError`, `RedFlagEmergencyError`).

### Fase 3: Modulo ToothNotationParser
- Crear `src/modules/tooth-parser/tooth-map.ts`: Diccionario exhaustivo de sinonimos populares en espanol e ingles para cuadrantes y piezas (molares, premolares, caninos, incisivos, muelas del juicio).
- Crear `src/modules/tooth-parser/parser.ts`: Funcion `parseToothMentions(text: string): FdiTooth[]` con matching deterministico.

### Fase 4: Modulo ClinicalTriageEngine
- Crear `src/modules/clinical-triage/red-flags.ts`: Patrones de celulitis facial, traumatismo dental severo, hemorragia activa y trismus.
- Crear `src/modules/clinical-triage/triage.ts`: Funcion `evaluateTriage(message: string): TriageEvaluation` con clasificacion de urgencia en <2ms.

### Fase 5: TreatmentTracker y WaitlistQueue
- Crear `src/modules/treatment-tracker/objections.ts`: Logica de categorizacion y respuesta educativa a objeciones (miedo, costo, tiempo).
- Crear `src/modules/waitlist-queue/queue.ts`: Selector prioritario de rescate de cancelaciones de sillon odontologico.
- Crear `src/core/triage-pipeline.ts`: Orquestador `DentalTriagePipeline` con override automatico ante emergencias medicas.
- Crear `src/index.ts`: Entrypoint publico del paquete.

### Fase 6: Pruebas Automatizadas (Vitest)
- Tests en `tests/`:
  - `tooth-parser.test.ts`: Parsing de lenguaje natural coloquial a FDI.
  - `clinical-triage.test.ts`: Casos de emergencia real vs consultas esteticas electivas.
  - `waitlist-queue.test.ts`: Asignacion optima de turnos liberados segun especialidad y valor.
  - `triage-pipeline.test.ts`: Flujo completo end-to-end con medicion de latencia (<3ms).
- Validar con `npx tsc --noEmit` y `npm test`.

### Fase 7: Documentacion Comercial y Diagramas
- Crear `README.md` de nivel comercial para GitHub:
  - Badges (TypeScript, License MIT, Tests 100%, Sub-3ms Latency).
  - Explicacion de la proteccion medico-legal y el rescate de sillon vacio.
  - Diagrama Mermaid del flujo de triage.
  - Ejemplo de codigo de integracion con Meta Cloud API en 10 lineas.

---

## 4. Definicion de Terminado (DoD)

La tarea se considera finalizada unicamente cuando:
1. Todos los modulos esten implementados sin errores de compilacion ni de tipos.
2. `npx tsc --noEmit` pase con 0 errores y cero `any`.
3. El 100% de los tests en Vitest pasen en verde.
4. El empaquetado en `dist/` se genere exitosamente.
5. El `README.md` comercial este completo con diagramas Mermaid.
6. Se elabore un reporte final conciso documentando el estado del engine y comandos de verificacion.

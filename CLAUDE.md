# CLAUDE.md: dentflow-clinical-guardrails

Este archivo es el manual operativo central que Claude lee al iniciar cualquier sesion en este repositorio. Define las reglas de ejecucion, estandares de ingenieria y directivas de ahorro maximo de tokens para este motor de triage y blindaje clinico odontologico.

---

## 1. Directivas Globales de Ejecucion ("Dangerously Mode")

1. **Modo 100% Autonomo Permanente**:
   - Trabajar de forma continua y sin interrupciones de 0 a 100 hasta completar el motor, sus esquemas, modulos y tests.
   - Prohibido detenerse a pedir confirmaciones, aclaraciones, aprobaciones o permisos intermedios.
   - Resolver cualquier ambiguedad tecnica tomando de forma autonoma la decision estandar mas robusta y continuar de inmediato.
   - No narrar planes antes de ejecutar: ejecutar directamente las tool calls.

2. **Cero Stoppers e Interrupciones**:
   - Ante errores de compilacion, linter o tests: inspeccionar la traza de error, corregir el codigo y reintentar de forma autonoma.
   - El agente nunca interrumpe el flujo. Solo al finalizar la ejecucion completa se documenta el estado final, los resultados y comandos de verificacion.

3. **Reglas Tipograficas y de Codigo Inquebrantables**:
   - **Prohibido el uso del guion largo (em dash)**: En todo comentario, texto, documentacion o codigo, utilizar unicamente guiones cortos "-", dos puntos o parentesis.
   - **TypeScript Estricto**: Cero uso de `any`. Toda funcion, interfaz, schema Zod y llamada de triage debe estar tipada rigurosamente.
   - Usar `unknown`, tipos genericos o uniones discriminadas en lugar de `any`.

---

## 2. Reglas de Ahorro Maximo de Tokens & Eficiencia

1. **Contexto y Lectura**:
   - Antes de escribir codigo: inspeccionar `package.json`, `tsconfig.json` y la estructura de directorios.
   - Leer solo lo estrictamente necesario con rangos de linea en archivos extensos.
   - No releer archivos que ya se leyeron en la sesion salvo que hayan cambiado.
   - Paralelizar tool calls independientes.

2. **Edicion Quirurgica**:
   - Reemplazos precisos de bloques de codigo sobre reescritura masiva de archivos.
   - Minimalismo: tres lineas repetidas es preferible a una abstraccion prematura.
   - Cero dependencias infladas. Algoritmos deterministicos de parsing y arboles de decision clinicos puros.

3. **Comunicacion Directa (Cero Fluff)**:
   - Cero charla aduladora ("Excelente pregunta", "Entendido", "A continuacion presento").
   - Respuestas concisas, tecnicas y orientadas a resultados.
   - No imprimir fragmentos extensos de codigo en la conversacion si ya fueron aplicados al disco.

4. **Validacion Autonoma en Consola**:
   - Tras modificar codigo: ejecutar chequeos de tipos (`npx tsc --noEmit`), tests (`npm test` o `npx vitest run`) y build (`npm run build`) antes de dar por finalizada la tarea.
   - Correr comandos siempre en modo no interactivo (`-y`, `--yes`).

---

## 3. Arquitectura y Stack Tecnologico

- **Lenguaje**: TypeScript 5.x (`strict: true`).
- **Validacion de Esquemas**: Zod v3.
- **Testing**: Vitest con cobertura exhaustiva de casos clinicos y de triage.
- **Empaquetado**: tsup (soporte dual ESM y CJS, declaracion de tipos `.d.ts`).
- **Target Runtime**: Node.js 18+, Bun, Cloudflare Workers y Edge Runtimes (Vercel Edge, Next.js Route Handlers).
- **Rendimiento**: Evaluacion de triage clinico y parsing de piezas dentales en <3ms.

---

## 4. Estructura de Directorios Estandar

```text
dentflow-clinical-guardrails/
├── src/
│   ├── core/
│   │   ├── types.ts                  # Esquemas Zod (Triage, FDI, Presupuestos, Waitlist)
│   │   ├── triage-pipeline.ts        # Orquestador del flujo clinico pre-LLM
│   │   └── errors.ts                 # Jerarquia de errores tipados
│   ├── modules/
│   │   ├── tooth-parser/             # Normalizador de piezas dentales (FDI / Universal / Texto)
│   │   │   ├── parser.ts
│   │   │   └── tooth-map.ts
│   │   ├── clinical-triage/          # Arbol de decision de urgencia y banderas rojas
│   │   │   ├── triage.ts
│   │   │   └── red-flags.ts
│   │   ├── treatment-tracker/        # Seguimiento y resolucion de objeciones de alto ticket
│   │   │   ├── tracker.ts
│   │   │   └── objections.ts
│   │   └── waitlist-queue/           # Cola prioritaria de rescate de cancelaciones de sillon
│   │       ├── queue.ts
│   │       └── matcher.ts
│   └── index.ts                      # Entrypoint publico del paquete
├── tests/
│   ├── tooth-parser.test.ts
│   ├── clinical-triage.test.ts
│   ├── treatment-tracker.test.ts
│   ├── waitlist-queue.test.ts
│   └── triage-pipeline.test.ts
├── CLAUDE.md                         # Manual operativo
├── PROMPT_CONSTRUCCION_END_TO_END.md # Prompt para construccion integral
├── ESPECIFICACION_TECNICA.md         # Blueprint tecnico detallado
├── INVESTIGACION_MERCADO_CLINICO.md  # Investigacion odontologica y ROI clinico
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md                         # Documentacion con badges y diagramas
```

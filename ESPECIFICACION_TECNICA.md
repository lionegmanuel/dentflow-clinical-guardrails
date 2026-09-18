# Especificacion Tecnica: dentflow-clinical-guardrails

Este documento define la arquitectura de software, los esquemas de datos con Zod, las reglas de parsing de nomenclatura dental y los algoritmos de triage para **`dentflow-clinical-guardrails`**.

---

## 1. Principios de Arquitectura y Diseno

1. **Blindaje Medico-Legal Pre-LLM**: Ningun paciente en WhatsApp interactua con el modelo de lenguaje sin antes pasar por una evaluacion deterministica de banderas rojas medicas (infecciones graves, traumatismos alveolares, dolor insoportable).
2. **Normalizacion Odontologica Estandar**: Normalizacion automatica de lenguaje natural coloquial de pacientes a nomenclatura internacional FDI (ISO 3950).
3. **TypeScript Estricto**: Cero uso de `any`. Tipado inmutable con esquemas Zod en todas las entradas y salidas del pipeline.
4. **Sub-3ms de Latencia**: Ejecucion en memoria en el borde (Edge/Serverless) para respuesta instantanea en webhooks de Meta Cloud API.

---

## 2. Esquemas de Datos y Contratos Zod (`src/core/types.ts`)

```typescript
import { z } from "zod";

// Nomenclatura Dental FDI (Adultos: Cuadrantes 1 al 4, piezas 1 a 8)
export const FdiToothSchema = z.number().int().refine((val) => {
  const quadrant = Math.floor(val / 10);
  const tooth = val % 10;
  return quadrant >= 1 && quadrant <= 4 && tooth >= 1 && tooth <= 8;
}, { message: "Numero de pieza dental FDI invalido (debe ser 11-18, 21-28, 31-38 o 41-48)" });
export type FdiTooth = z.infer<typeof FdiToothSchema>;

// Nivel de Urgencia Clinica
export const ClinicalUrgencySchema = z.enum([
  "emergency",       // Requiere atencion inmediata en guardia (trauma, flemon, fiebre)
  "high_priority",   // Dolor agudo / pulpitis, atencion en menos de 24 hs
  "moderate",        // Molestia menor, rotura de corona sin dolor
  "routine_elective" // Consultas de estetica, implantes, alineadores, profilaxis
]);
export type ClinicalUrgency = z.infer<typeof ClinicalUrgencySchema>;

// Categorias de Tratamiento
export const DentalTreatmentCategorySchema = z.enum([
  "implants_rehabilitation",
  "invisible_orthodontics",
  "aesthetic_veneers",
  "endodontics",
  "periodontics",
  "general_surgery",
  "preventive_cleaning"
]);
export type DentalTreatmentCategory = z.infer<typeof DentalTreatmentCategorySchema>;

// Diagnostico de Triage
export const TriageEvaluationSchema = z.object({
  urgency: ClinicalUrgencySchema,
  isRedFlagPresent: z.boolean(),
  detectedSymptoms: z.array(z.string()),
  identifiedTeeth: z.array(FdiToothSchema),
  likelyCategory: DentalTreatmentCategorySchema,
  recommendedAction: z.enum([
    "immediate_emergency_call",
    "schedule_same_day_slot",
    "schedule_3d_scan_consult",
    "send_educational_care_instructions"
  ]),
  suggestedPatientNotice: z.string()
});
export type TriageEvaluation = z.infer<typeof TriageEvaluationSchema>;

// Candidato para Lista de Espera de Sillon Vacio
export const WaitlistCandidateSchema = z.object({
  patientId: z.string().uuid(),
  patientName: z.string(),
  phone: z.string().regex(/^\+[1-9]\d{6,14}$/),
  requiredSpecialty: DentalTreatmentCategorySchema,
  preferredTimeWindow: z.enum(["morning", "afternoon", "anytime"]),
  treatmentEstimatedValue: z.number().positive(),
  confirmedPriorityScore: z.number().min(0).max(100)
});
export type WaitlistCandidate = z.infer<typeof WaitlistCandidateSchema>;

// Resultado Final del Pipeline de Triage
export const DentalPipelineResultSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("pass_to_conversational_agent"),
    enrichedContext: z.string(),
    triage: TriageEvaluationSchema,
    processingTimeMs: z.number()
  }),
  z.object({
    action: z.literal("emergency_override"),
    emergencyMessage: z.string(),
    contactPhone: z.string(),
    triage: TriageEvaluationSchema,
    processingTimeMs: z.number()
  })
]);
export type DentalPipelineResult = z.infer<typeof DentalPipelineResultSchema>;
```

---

## 3. Especificacion de Modulos Core

### Modulo 1: `ToothNotationParser` (`src/modules/tooth-parser/`)
- **Objetivo**: Mapear descripciones cotidianas de pacientes a numeros FDI exactos:
  - *"muela de juicio superior derecha"* -> `18`
  - *"paleta superior izquierda"* -> `21`
  - *"colmillo inferior derecho"* -> `43`
  - *"primer molar inferior izquierdo"* -> `36`
- **Firma**:
  ```typescript
  export function parseToothMentions(text: string): FdiTooth[];
  ```

### Modulo 2: `ClinicalTriageEngine` (`src/modules/clinical-triage/`)
- **Objetivo**: Detectar sintomas y evaluar el nivel de urgencia medica mediante arboles de decision deterministicos.
- **Banderas Rojas**:
  - Dificultad para tragar o respirar asociada a flemones.
  - Hinchazon facial visible con fiebre alta.
  - Traumatismo con avulsion dental (diente salido completo por golpe - ventana critica de 60 minutos para reimplante).
- **Firma**:
  ```typescript
  export function evaluateTriage(message: string): TriageEvaluation;
  ```

### Modulo 3: `TreatmentTracker` (`src/modules/treatment-tracker/`)
- **Objetivo**: Gestionar objeciones frecuentes en presupuestos de alto ticket (miedo al dolor, costo, tiempos de recuperacion) y estructurar mensajes de seguimiento educativo por WhatsApp.

### Modulo 4: `WaitlistQueue` (`src/modules/waitlist-queue/`)
- **Objetivo**: Seleccionar el mejor paciente de la lista de espera para cubrir un sillon cancelado segun especialidad, ventana horaria y valor del tratamiento.
- **Firma**:
  ```typescript
  export function findBestCandidate(candidates: WaitlistCandidate[], specialty: DentalTreatmentCategory, slotTime: string): WaitlistCandidate | null;
  ```

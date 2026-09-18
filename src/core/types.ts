import { z } from "zod";

// Dental Nomenclature FDI (Adult: Quadrants 1-4, Teeth 1-8)
export const FdiToothSchema = z
  .number()
  .int()
  .refine(
    (val) => {
      const quadrant = Math.floor(val / 10);
      const tooth = val % 10;
      return quadrant >= 1 && quadrant <= 4 && tooth >= 1 && tooth <= 8;
    },
    {
      message:
        "Numero de pieza dental FDI invalido (debe ser 11-18, 21-28, 31-38 o 41-48)",
    },
  );
export type FdiTooth = z.infer<typeof FdiToothSchema>;

// Quadrant identification (1: Upper Right, 2: Upper Left, 3: Lower Left, 4: Lower Right)
export const DentalQuadrantSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
]);
export type DentalQuadrant = z.infer<typeof DentalQuadrantSchema>;

// Tooth Position in Quadrant (1 to 8)
export const ToothPositionSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
  z.literal(7),
  z.literal(8),
]);
export type ToothPosition = z.infer<typeof ToothPositionSchema>;

// Clinical Urgency Level
export const ClinicalUrgencySchema = z.enum([
  "emergency", // Atencion inmediata en guardia (trauma con avulsion, celulitis/flemon, compromiso de via aerea)
  "high_priority", // Dolor agudo / pulpitis irreversible, atencion en menos de 24 hs
  "moderate", // Molestia menor, rotura de corona sin dolor severo
  "routine_elective", // Consultas de estetica, implantes, alineadores, profilaxis
]);
export type ClinicalUrgency = z.infer<typeof ClinicalUrgencySchema>;

// Dental Treatment Categories
export const DentalTreatmentCategorySchema = z.enum([
  "implants_rehabilitation",
  "invisible_orthodontics",
  "aesthetic_veneers",
  "endodontics",
  "periodontics",
  "general_surgery",
  "preventive_cleaning",
]);
export type DentalTreatmentCategory = z.infer<
  typeof DentalTreatmentCategorySchema
>;

// Recommended Actions
export const TriageRecommendedActionSchema = z.enum([
  "immediate_emergency_call",
  "schedule_same_day_slot",
  "schedule_3d_scan_consult",
  "send_educational_care_instructions",
]);
export type TriageRecommendedAction = z.infer<
  typeof TriageRecommendedActionSchema
>;

// Red Flag Definition and Result
export const RedFlagTypeSchema = z.enum([
  "airway_compromise", // Dificultad para tragar, respirar o hablar (angina de Ludwig)
  "facial_cellulitis_fever", // Hinchazon facial visible y asimetrica con fiebre alta
  "traumatic_tooth_avulsion", // Diente expulsado por golpe (ventana critica <60 min)
  "uncontrolled_hemorrhage", // Sangrado activo incoercible post-extraccion o trauma
  "severe_trismus", // Incapacidad de apertura bucal (<15mm) asociada a foco infeccioso
]);
export type RedFlagType = z.infer<typeof RedFlagTypeSchema>;

export const DetectedRedFlagSchema = z.object({
  type: RedFlagTypeSchema,
  name: z.string(),
  description: z.string(),
  criticalWindowMinutes: z.number().nullable(),
  immediatePatientAdvice: z.string(),
});
export type DetectedRedFlag = z.infer<typeof DetectedRedFlagSchema>;

// Triage Evaluation Result
export const TriageEvaluationSchema = z.object({
  urgency: ClinicalUrgencySchema,
  isRedFlagPresent: z.boolean(),
  detectedSymptoms: z.array(z.string()),
  identifiedTeeth: z.array(FdiToothSchema),
  likelyCategory: DentalTreatmentCategorySchema,
  recommendedAction: TriageRecommendedActionSchema,
  suggestedPatientNotice: z.string(),
  redFlags: z.array(DetectedRedFlagSchema).optional(),
});
export type TriageEvaluation = z.infer<typeof TriageEvaluationSchema>;

// Waitlist Candidate Schema for Chair Rescue
export const PreferredTimeWindowSchema = z.enum([
  "morning",
  "afternoon",
  "anytime",
]);
export type PreferredTimeWindow = z.infer<typeof PreferredTimeWindowSchema>;

export const WaitlistCandidateSchema = z.object({
  patientId: z.string().uuid(),
  patientName: z.string(),
  phone: z.string().regex(/^\+[1-9]\d{6,14}$/),
  requiredSpecialty: DentalTreatmentCategorySchema,
  preferredTimeWindow: PreferredTimeWindowSchema,
  treatmentEstimatedValue: z.number().positive(),
  confirmedPriorityScore: z.number().min(0).max(100),
});
export type WaitlistCandidate = z.infer<typeof WaitlistCandidateSchema>;

// Match result for Chair Rescue
export const ChairRescueMatchResultSchema = z.object({
  candidate: WaitlistCandidateSchema,
  matchScore: z.number().min(0).max(100),
  slotTime: z.string(),
  specialty: DentalTreatmentCategorySchema,
  financialRecoveryValue: z.number(),
  rationale: z.string(),
});
export type ChairRescueMatchResult = z.infer<
  typeof ChairRescueMatchResultSchema
>;

// Objections Classification
export const HighTicketObjectionCategorySchema = z.enum([
  "fear_pain", // Miedo al dolor, agujas, cirugia o fobia al dentista
  "financial_cost", // Presupuesto elevado, necesidad de cuotas o financiacion
  "recovery_time", // Miedo al postoperatorio o ausencia laboral
  "procedure_doubt", // Dudas sobre durabilidad de implantes/carillas o efectividad
  "distrust_delay", // "Lo tengo que pensar", consulta con conyuge
]);
export type HighTicketObjectionCategory = z.infer<
  typeof HighTicketObjectionCategorySchema
>;

export const ObjectionResolutionSchema = z.object({
  category: HighTicketObjectionCategorySchema,
  detectedKeywords: z.array(z.string()),
  clinicalRationale: z.string(),
  suggestedFollowUpNotice: z.string(),
  confidence: z.number().min(0).max(1),
});
export type ObjectionResolution = z.infer<typeof ObjectionResolutionSchema>;

// Pipeline Final Result (Discriminated Union on action)
export const DentalPipelineResultSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("pass_to_conversational_agent"),
    enrichedContext: z.string(),
    triage: TriageEvaluationSchema,
    processingTimeMs: z.number(),
  }),
  z.object({
    action: z.literal("emergency_override"),
    emergencyMessage: z.string(),
    contactPhone: z.string(),
    triage: TriageEvaluationSchema,
    processingTimeMs: z.number(),
  }),
]);
export type DentalPipelineResult = z.infer<typeof DentalPipelineResultSchema>;

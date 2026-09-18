import { z } from "zod";

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

export const DentalQuadrantSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
]);
export type DentalQuadrant = z.infer<typeof DentalQuadrantSchema>;

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

export const ClinicalUrgencySchema = z.enum([
  "emergency",
  "high_priority",
  "moderate",
  "routine_elective",
]);
export type ClinicalUrgency = z.infer<typeof ClinicalUrgencySchema>;

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

export const TriageRecommendedActionSchema = z.enum([
  "immediate_emergency_call",
  "schedule_same_day_slot",
  "schedule_3d_scan_consult",
  "send_educational_care_instructions",
]);
export type TriageRecommendedAction = z.infer<
  typeof TriageRecommendedActionSchema
>;

export const RedFlagTypeSchema = z.enum([
  "airway_compromise",
  "facial_cellulitis_fever",
  "traumatic_tooth_avulsion",
  "uncontrolled_hemorrhage",
  "severe_trismus",
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

export const HighTicketObjectionCategorySchema = z.enum([
  "fear_pain",
  "financial_cost",
  "recovery_time",
  "procedure_doubt",
  "distrust_delay",
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

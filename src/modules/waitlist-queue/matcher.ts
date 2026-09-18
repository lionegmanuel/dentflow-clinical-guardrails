import {
  DentalTreatmentCategory,
  PreferredTimeWindow,
  WaitlistCandidate,
} from "../../core/types";

/**
 * Parses time string (e.g. "09:30", "14:00", "2026-09-18T10:15:00") and determines whether it falls into morning or afternoon.
 * Morning: 06:00 to 12:59
 * Afternoon: 13:00 to 21:00
 */
export function determineSlotWindow(slotTime: string): "morning" | "afternoon" {
  let hour = 10; // default safe fallback

  if (slotTime.includes("T")) {
    const isoMatch = /T(\d{2}):(\d{2})/.exec(slotTime);
    if (isoMatch && isoMatch[1]) {
      hour = parseInt(isoMatch[1], 10);
    }
  } else {
    const timeMatch = /(\d{1,2}):(\d{2})/.exec(slotTime);
    if (timeMatch && timeMatch[1]) {
      hour = parseInt(timeMatch[1], 10);
    }
  }

  return hour < 13 ? "morning" : "afternoon";
}

/**
 * Checks whether candidate's preferred time window matches the slot time window.
 */
export function isWindowCompatible(
  preference: PreferredTimeWindow,
  slotTime: string,
): boolean {
  if (preference === "anytime") {
    return true;
  }
  const slotWindow = determineSlotWindow(slotTime);
  return preference === slotWindow;
}

export interface MatchScoreBreakdown {
  specialtyScore: number; // 0 or 40
  timeWindowScore: number; // 0 or 30
  financialScore: number; // 0 to 20
  priorityScore: number; // 0 to 10
  totalScore: number; // 0 to 100
  isEligible: boolean;
  rationale: string;
}

/**
 * Calculates a deterministic match score (0 to 100) for a waitlist candidate.
 */
export function calculateMatchBreakdown(
  candidate: WaitlistCandidate,
  specialty: DentalTreatmentCategory,
  slotTime: string,
): MatchScoreBreakdown {
  // Specialty check
  const specialtyMatches = candidate.requiredSpecialty === specialty;
  if (!specialtyMatches) {
    return {
      specialtyScore: 0,
      timeWindowScore: 0,
      financialScore: 0,
      priorityScore: 0,
      totalScore: 0,
      isEligible: false,
      rationale: `Especialidad requerida (${candidate.requiredSpecialty}) no coincide con el sillon disponible (${specialty}).`,
    };
  }

  const specialtyScore = 40;

  // Time window check
  const windowMatches = isWindowCompatible(
    candidate.preferredTimeWindow,
    slotTime,
  );
  if (!windowMatches) {
    return {
      specialtyScore,
      timeWindowScore: 0,
      financialScore: 0,
      priorityScore: 0,
      totalScore: 0,
      isEligible: false,
      rationale: `Ventana horaria preferida (${candidate.preferredTimeWindow}) incompatible con el turno (${slotTime}).`,
    };
  }

  const timeWindowScore = 30;

  // Financial impact: up to 20 points (normalized against $5,000 reference high-ticket)
  const normalizedValue = Math.min(candidate.treatmentEstimatedValue / 5000, 1);
  const financialScore = Math.round(normalizedValue * 20 * 100) / 100;

  // Historical confirmation / priority score: up to 10 points
  const priorityScore =
    Math.round((candidate.confirmedPriorityScore / 100) * 10 * 100) / 100;

  const totalScore =
    Math.round(
      (specialtyScore + timeWindowScore + financialScore + priorityScore) * 100,
    ) / 100;

  return {
    specialtyScore,
    timeWindowScore,
    financialScore,
    priorityScore,
    totalScore,
    isEligible: true,
    rationale: `Candidato compatible: especialidad ${specialty}, disponibilidad horaria confirmada, valor estimado $${candidate.treatmentEstimatedValue} USD.`,
  };
}

/**
 * Returns overall match score (0-100) for ranking candidates.
 */
export function calculateMatchScore(
  candidate: WaitlistCandidate,
  specialty: DentalTreatmentCategory,
  slotTime: string,
): number {
  return calculateMatchBreakdown(candidate, specialty, slotTime).totalScore;
}

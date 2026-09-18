/**
 * Base domain error class for DentFlow Clinical Guardrails.
 */
export abstract class DentFlowError extends Error {
  public abstract readonly code: string;

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Thrown when dental notation parsing receives invalid tooth data or cannot parse.
 */
export class InvalidToothNotationError extends DentFlowError {
  public readonly code = "INVALID_TOOTH_NOTATION";

  constructor(
    public readonly invalidInput: string,
    message?: string,
  ) {
    super(
      message ??
        `Nomenclatura dental invalida o no identificada: "${invalidInput}"`,
    );
  }
}

/**
 * Thrown when clinical triage validation encounters unexpected or corrupt evaluation parameters.
 */
export class ClinicalTriageError extends DentFlowError {
  public readonly code = "CLINICAL_TRIAGE_ERROR";

  constructor(
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
  }
}

/**
 * Thrown or surfaced when a medical red flag emergency requires immediate intervention.
 */
export class RedFlagEmergencyError extends DentFlowError {
  public readonly code = "RED_FLAG_EMERGENCY";

  constructor(
    public readonly redFlagType: string,
    public readonly emergencyInstructions: string,
    message?: string,
  ) {
    super(
      message ??
        `Bandera roja medica detectada (${redFlagType}): ${emergencyInstructions}`,
    );
  }
}

/**
 * Thrown when candidate processing or chair rescue queue fails validation.
 */
export class WaitlistError extends DentFlowError {
  public readonly code = "WAITLIST_ERROR";

  constructor(
    message: string,
    public readonly candidateId?: string,
  ) {
    super(message);
  }
}

/**
 * Thrown when treatment tracking or objection resolution fails.
 */
export class TreatmentTrackerError extends DentFlowError {
  public readonly code = "TREATMENT_TRACKER_ERROR";

  constructor(message: string) {
    super(message);
  }
}

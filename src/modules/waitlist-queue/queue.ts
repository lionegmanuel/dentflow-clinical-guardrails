import { WaitlistError } from "../../core/errors";
import {
  ChairRescueMatchResult,
  ChairRescueMatchResultSchema,
  DentalTreatmentCategory,
  WaitlistCandidate,
} from "../../core/types";
import { calculateMatchBreakdown } from "./matcher";

/**
 * Evaluates candidates and returns them ranked by match score from best to worst.
 * Only eligible candidates (matching specialty and time window) are returned.
 */
export function rankCandidates(
  candidates: WaitlistCandidate[],
  specialty: DentalTreatmentCategory,
  slotTime: string,
): ChairRescueMatchResult[] {
  const results: ChairRescueMatchResult[] = [];

  for (const candidate of candidates) {
    const breakdown = calculateMatchBreakdown(candidate, specialty, slotTime);
    if (breakdown.isEligible) {
      const matchResult: ChairRescueMatchResult = {
        candidate,
        matchScore: breakdown.totalScore,
        slotTime,
        specialty,
        financialRecoveryValue: candidate.treatmentEstimatedValue,
        rationale: breakdown.rationale,
      };
      // Validate schema compliance
      results.push(ChairRescueMatchResultSchema.parse(matchResult));
    }
  }

  // Sort descending by match score, tie-breaker: highest treatmentEstimatedValue
  return results.sort((a, b) => {
    if (b.matchScore !== a.matchScore) {
      return b.matchScore - a.matchScore;
    }
    return b.financialRecoveryValue - a.financialRecoveryValue;
  });
}

/**
 * Finds the single best waitlist candidate to rescue an empty dental chair.
 * Returns null if no eligible candidate is found.
 */
export function findBestCandidate(
  candidates: WaitlistCandidate[],
  specialty: DentalTreatmentCategory,
  slotTime: string,
): WaitlistCandidate | null {
  const ranked = rankCandidates(candidates, specialty, slotTime);
  return ranked.length > 0 && ranked[0] ? ranked[0].candidate : null;
}

/**
 * In-memory priority queue manager for dental chair rescue.
 */
export class ChairRescueQueue {
  private candidates: Map<string, WaitlistCandidate> = new Map();

  /**
   * Adds or updates a candidate in the rescue queue.
   */
  public addCandidate(candidate: WaitlistCandidate): void {
    if (!candidate.patientId) {
      throw new WaitlistError(
        "Candidato sin identificador de paciente valido.",
      );
    }
    this.candidates.set(candidate.patientId, { ...candidate });
  }

  /**
   * Removes a candidate from the queue (e.g. after booking or manual removal).
   */
  public removeCandidate(patientId: string): boolean {
    return this.candidates.delete(patientId);
  }

  /**
   * Returns all active candidates in the queue.
   */
  public getCandidates(): WaitlistCandidate[] {
    return Array.from(this.candidates.values());
  }

  /**
   * Finds the best candidate for a newly released slot.
   */
  public findBest(
    specialty: DentalTreatmentCategory,
    slotTime: string,
  ): WaitlistCandidate | null {
    return findBestCandidate(this.getCandidates(), specialty, slotTime);
  }

  /**
   * Ranks all eligible candidates for a newly released slot.
   */
  public rank(
    specialty: DentalTreatmentCategory,
    slotTime: string,
  ): ChairRescueMatchResult[] {
    return rankCandidates(this.getCandidates(), specialty, slotTime);
  }
}

import {
  DentalTreatmentCategory,
  HighTicketObjectionCategory,
  ObjectionResolution,
} from "../../core/types";
import { resolveObjection } from "./objections";

export type ProposalStatus =
  | "presented"
  | "objection_raised"
  | "scheduled"
  | "accepted"
  | "lost";

export interface TreatmentProposal {
  proposalId: string;
  patientId: string;
  patientName: string;
  specialty: DentalTreatmentCategory;
  estimatedValue: number;
  status: ProposalStatus;
  createdAt: Date;
  lastFollowUpAt?: Date;
  detectedObjections: HighTicketObjectionCategory[];
}

export interface FollowUpRecommendation {
  shouldFollowUp: boolean;
  objection: ObjectionResolution | null;
  recommendedMessage: string;
  urgencyLevel: "immediate" | "within_24h" | "within_48h";
  clinicalFocus: string;
}

export class TreatmentTracker {
  private proposals: Map<string, TreatmentProposal> = new Map();

  /**
   * Registers a new treatment proposal presented to a patient.
   */
  public registerProposal(proposal: TreatmentProposal): void {
    this.proposals.set(proposal.proposalId, { ...proposal });
  }

  /**
   * Retrieves a proposal by its ID.
   */
  public getProposal(proposalId: string): TreatmentProposal | undefined {
    return this.proposals.get(proposalId);
  }

  /**
   * Evaluates patient message regarding a proposal and generates recommended clinical follow-up.
   */
  public handlePatientResponse(
    proposalId: string,
    message: string,
  ): FollowUpRecommendation {
    const proposal = this.proposals.get(proposalId);
    const objection = resolveObjection(message);

    if (objection) {
      if (proposal) {
        proposal.status = "objection_raised";
        if (!proposal.detectedObjections.includes(objection.category)) {
          proposal.detectedObjections.push(objection.category);
        }
        proposal.lastFollowUpAt = new Date();
      }

      return {
        shouldFollowUp: true,
        objection,
        recommendedMessage: objection.suggestedFollowUpNotice,
        urgencyLevel:
          objection.category === "fear_pain" ? "immediate" : "within_24h",
        clinicalFocus: objection.clinicalRationale,
      };
    }

    // Default polite follow up if message contains positive confirmation
    if (
      /acepto|quiero empezar|agendar|turno|cuando empezamos|reservar/.test(
        message.toLowerCase(),
      )
    ) {
      if (proposal) {
        proposal.status = "accepted";
      }
      return {
        shouldFollowUp: true,
        objection: null,
        recommendedMessage:
          "Excelente decision. Vamos a coordinar tu primer turno para dar inicio a tu plan de tratamiento.",
        urgencyLevel: "immediate",
        clinicalFocus:
          "Coordinacion de turno clinico para inicio de tratamiento",
      };
    }

    return {
      shouldFollowUp: false,
      objection: null,
      recommendedMessage:
        "Quedamos a disposicion para cualquier consulta o aclaracion que necesites sobre tu plan.",
      urgencyLevel: "within_48h",
      clinicalFocus: "Seguimiento estandar de cortesia",
    };
  }
}

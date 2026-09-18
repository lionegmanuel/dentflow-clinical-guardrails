import { beforeEach, describe, expect, it } from "vitest";
import {
  resolveObjection,
  TreatmentProposal,
  TreatmentTracker,
} from "../src/modules/treatment-tracker";

describe("TreatmentTracker and High-Ticket Objections", () => {
  describe("Objection Resolution Detection", () => {
    it("should detect fear_pain objection and provide clinical de-escalation notice", () => {
      const message =
        "Me da mucho miedo el dolor de la cirugia y le tengo panico a las agujas";
      const resolution = resolveObjection(message);

      expect(resolution).not.toBeNull();
      expect(resolution?.category).toBe("fear_pain");
      expect(resolution?.detectedKeywords).toContain("miedo");
      expect(resolution?.clinicalRationale).toContain("sedacion consciente");
      expect(resolution?.suggestedFollowUpNotice).toContain(
        "anestesia computarizada",
      );
    });

    it("should detect financial_cost objection and suggest flexible installment financing", () => {
      const message =
        "El presupuesto de los implantes me parecio muy caro, queria saber si tienen cuotas fijas o financiacion";
      const resolution = resolveObjection(message);

      expect(resolution).not.toBeNull();
      expect(resolution?.category).toBe("financial_cost");
      expect(resolution?.suggestedFollowUpNotice).toContain("financiacion");
    });

    it("should detect recovery_time objection and explain minimally invasive protocol", () => {
      const message =
        "Cuantos dias de reposo son necesarios? Me da miedo hincharme y no poder ir a trabajar";
      const resolution = resolveObjection(message);

      expect(resolution).not.toBeNull();
      expect(resolution?.category).toBe("recovery_time");
      expect(resolution?.suggestedFollowUpNotice).toContain("microcirugia");
    });

    it("should detect procedure_doubt regarding implant biocompatibility or durability", () => {
      const message =
        "Es verdad que existe riesgo de rechazo biologico con los implantes?";
      const resolution = resolveObjection(message);

      expect(resolution).not.toBeNull();
      expect(resolution?.category).toBe("procedure_doubt");
      expect(resolution?.suggestedFollowUpNotice).toContain("98%");
    });

    it("should detect distrust_delay when patient defers decision to spouse or family", () => {
      const message = "Lo tengo que pensar con calma y consultar con mi esposo";
      const resolution = resolveObjection(message);

      expect(resolution).not.toBeNull();
      expect(resolution?.category).toBe("distrust_delay");
      expect(resolution?.suggestedFollowUpNotice).toContain("escaneo 3D");
    });

    it("should return null when message contains no objection", () => {
      expect(resolveObjection("Muchas gracias por la atencion")).toBeNull();
      expect(resolveObjection("A que hora abren manana?")).toBeNull();
    });
  });

  describe("TreatmentTracker proposal lifecycle", () => {
    let tracker: TreatmentTracker;
    const sampleProposal: TreatmentProposal = {
      proposalId: "prop-101",
      patientId: "pat-202",
      patientName: "Carlos Mendez",
      specialty: "implants_rehabilitation",
      estimatedValue: 3200,
      status: "presented",
      createdAt: new Date(),
      detectedObjections: [],
    };

    beforeEach(() => {
      tracker = new TreatmentTracker();
      tracker.registerProposal(sampleProposal);
    });

    it("should register and retrieve a treatment proposal", () => {
      const retrieved = tracker.getProposal("prop-101");
      expect(retrieved).toBeDefined();
      expect(retrieved?.patientName).toBe("Carlos Mendez");
      expect(retrieved?.status).toBe("presented");
    });

    it("should process patient fear objection and update proposal state", () => {
      const response = tracker.handlePatientResponse(
        "prop-101",
        "Me gustaria hacermelo pero le tengo fobia a que me duela la intervencion",
      );

      expect(response.shouldFollowUp).toBe(true);
      expect(response.objection?.category).toBe("fear_pain");
      expect(response.urgencyLevel).toBe("immediate");

      const updated = tracker.getProposal("prop-101");
      expect(updated?.status).toBe("objection_raised");
      expect(updated?.detectedObjections).toContain("fear_pain");
      expect(updated?.lastFollowUpAt).toBeDefined();
    });

    it("should process patient acceptance and mark proposal as accepted", () => {
      const response = tracker.handlePatientResponse(
        "prop-101",
        "Hola! Decidi que quiero empezar y coordinar el turno",
      );

      expect(response.shouldFollowUp).toBe(true);
      expect(response.objection).toBeNull();
      expect(response.recommendedMessage).toContain(
        "coordinar tu primer turno",
      );

      const updated = tracker.getProposal("prop-101");
      expect(updated?.status).toBe("accepted");
    });
  });
});

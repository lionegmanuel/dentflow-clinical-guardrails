import { describe, expect, it } from "vitest";
import { TriageEvaluationSchema } from "../src/core/types";
import { detectRedFlags, evaluateTriage } from "../src/modules/clinical-triage";

describe("ClinicalTriageEngine", () => {
  describe("Medical Red Flag Emergency Detections", () => {
    it("should flag airway compromise as critical emergency", () => {
      const message =
        "Tengo dificultad para respirar y no puedo tragar la saliva, se me cerro la garganta por la muela";
      const result = evaluateTriage(message);

      expect(result.urgency).toBe("emergency");
      expect(result.isRedFlagPresent).toBe(true);
      expect(result.recommendedAction).toBe("immediate_emergency_call");
      expect(result.redFlags?.some((f) => f.type === "airway_compromise")).toBe(
        true,
      );
      expect(result.suggestedPatientNotice).toContain("guardia hospitalaria");
    });

    it("should flag traumatic tooth avulsion with 60-minute window advice", () => {
      const message =
        "Mi nene se cayo en la plaza de la bici y se le salio el diente entero de raiz";
      const result = evaluateTriage(message);

      expect(result.urgency).toBe("emergency");
      expect(result.isRedFlagPresent).toBe(true);
      const avulsionFlag = result.redFlags?.find(
        (f) => f.type === "traumatic_tooth_avulsion",
      );
      expect(avulsionFlag).toBeDefined();
      expect(avulsionFlag?.criticalWindowMinutes).toBe(60);
      expect(result.suggestedPatientNotice).toContain("leche fria");
      expect(result.suggestedPatientNotice).toContain("corona");
    });

    it("should flag facial cellulitis combined with high fever", () => {
      const message =
        "Tengo la cara hinchada y deformada con 39 de fiebre por un flemon";
      const result = evaluateTriage(message);

      expect(result.urgency).toBe("emergency");
      expect(result.isRedFlagPresent).toBe(true);
      expect(
        result.redFlags?.some((f) => f.type === "facial_cellulitis_fever"),
      ).toBe(true);
    });

    it("should flag uncontrolled post-extraction hemorrhage", () => {
      const message =
        "Me hicieron una cirugia de muela de juicio y no para de sangrar hace 4 horas, tengo la boca llena de sangre";
      const result = evaluateTriage(message);

      expect(result.urgency).toBe("emergency");
      expect(result.isRedFlagPresent).toBe(true);
      expect(
        result.redFlags?.some((f) => f.type === "uncontrolled_hemorrhage"),
      ).toBe(true);
      expect(result.suggestedPatientNotice).toContain("gasa");
    });

    it("should flag severe trismus with lockjaw", () => {
      const message =
        "Tengo la mandibula trabada, no puedo abrir la boca por el dolor en la muela de juicio";
      const result = evaluateTriage(message);

      expect(result.urgency).toBe("emergency");
      expect(result.isRedFlagPresent).toBe(true);
      expect(result.redFlags?.some((f) => f.type === "severe_trismus")).toBe(
        true,
      );
    });

    it("should directly detect red flags using detectRedFlags helper", () => {
      const flags = detectRedFlags(
        "tengo dificultad para respirar y se me cerro la garganta",
      );
      expect(flags.length).toBeGreaterThan(0);
      expect(flags[0]?.type).toBe("airway_compromise");
    });
  });

  describe("High Priority Acute Dental Symptoms", () => {
    it("should classify acute irreversible pulpitis as high priority same day", () => {
      const message =
        "Tengo un dolor agudo e insoportable en una muela, late fuerte y no me deja dormir, el ibuprofeno no me calma";
      const result = evaluateTriage(message);

      expect(result.urgency).toBe("high_priority");
      expect(result.isRedFlagPresent).toBe(false);
      expect(result.recommendedAction).toBe("schedule_same_day_slot");
      expect(result.likelyCategory).toBe("endodontics");
      expect(result.suggestedPatientNotice).toContain("turno prioritario");
    });

    it("should classify localized dental abscess as high priority", () => {
      const message =
        "Me salio una bolita con pus en la encia cerca de la muela";
      const result = evaluateTriage(message);

      expect(result.urgency).toBe("high_priority");
      expect(result.recommendedAction).toBe("schedule_same_day_slot");
    });
  });

  describe("Moderate Urgency Dental Symptoms", () => {
    it("should classify broken tooth restoration without acute pain as moderate", () => {
      const message =
        "Comiendo pan se me rompio una muela pero no me duele mucho";
      const result = evaluateTriage(message);

      expect(result.urgency).toBe("moderate");
      expect(result.isRedFlagPresent).toBe(false);
      expect(result.recommendedAction).toBe("schedule_same_day_slot");
    });

    it("should classify loose bracket as moderate", () => {
      const message =
        "Se me despego el bracket del colmillo y me raspa el labio";
      const result = evaluateTriage(message);

      expect(result.urgency).toBe("moderate");
      expect(result.likelyCategory).toBe("invisible_orthodontics");
    });
  });

  describe("Routine Elective Inquiries", () => {
    it("should classify invisible orthodontics as routine elective with 3D scan recommendation", () => {
      const message =
        "Buenas tardes, queria consultar cuanto cuesta el tratamiento de ortodoncia invisible con alineadores";
      const result = evaluateTriage(message);

      expect(result.urgency).toBe("routine_elective");
      expect(result.isRedFlagPresent).toBe(false);
      expect(result.likelyCategory).toBe("invisible_orthodontics");
      expect(result.recommendedAction).toBe("schedule_3d_scan_consult");
      expect(result.suggestedPatientNotice).toContain("escaneo digital 3D");
    });

    it("should classify aesthetic veneers and whitening as routine elective", () => {
      const message =
        "Hola! Quiero ponerme carillas de porcelana para mejorar mi sonrisa y hacerme un blanqueamiento";
      const result = evaluateTriage(message);

      expect(result.urgency).toBe("routine_elective");
      expect(result.likelyCategory).toBe("aesthetic_veneers");
      expect(result.recommendedAction).toBe("schedule_3d_scan_consult");
    });

    it("should classify implant inquiry as routine elective with implants category", () => {
      const message =
        "Hola, me falta un diente y queria averiguar por implantes dentales";
      const result = evaluateTriage(message);

      expect(result.urgency).toBe("routine_elective");
      expect(result.likelyCategory).toBe("implants_rehabilitation");
    });

    it("should classify routine cleaning as preventive_cleaning", () => {
      const message =
        "Hola, queria sacar turno para hacerme una limpieza dental y control de rutina";
      const result = evaluateTriage(message);

      expect(result.urgency).toBe("routine_elective");
      expect(result.likelyCategory).toBe("preventive_cleaning");
    });
  });

  describe("Schema Validation and Latency", () => {
    it("should satisfy the strict TriageEvaluationSchema specification", () => {
      const result = evaluateTriage(
        "Me duele la muela de juicio superior derecha 18",
      );
      const parsed = TriageEvaluationSchema.parse(result);

      expect(parsed.urgency).toBeDefined();
      expect(parsed.isRedFlagPresent).toBe(false);
      expect(parsed.identifiedTeeth).toEqual([18]);
      expect(parsed.likelyCategory).toBe("general_surgery");
    });

    it("should execute triage evaluation in less than 2ms", () => {
      const testCases = [
        "Tengo dificultad para respirar por un flemon en el cuello",
        "Me cai y se me salio la paleta de raiz",
        "Quiero alinear mis dientes con ortodoncia invisible",
        "Siento dolor punzante en la muela 36 que no me deja dormir",
        "Se me rompio una corona ayer a la tarde",
      ];

      const start = performance.now();
      for (const tc of testCases) {
        evaluateTriage(tc);
      }
      const avgDuration = (performance.now() - start) / testCases.length;
      expect(avgDuration).toBeLessThan(2.0);
    });
  });
});

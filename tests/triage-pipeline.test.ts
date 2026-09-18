import { describe, expect, it } from "vitest";
import {
  DentalTriagePipeline,
  runTriagePipeline,
} from "../src/core/triage-pipeline";
import { DentalPipelineResultSchema } from "../src/core/types";

describe("DentalTriagePipeline End-to-End", () => {
  const testClinicPhone = "+5491122223333";

  describe("Emergency Override Flow (Bypass LLM)", () => {
    it("should trigger emergency_override when avulsion red flag is detected", () => {
      const message =
        "Mi hijo se cayo y se le salio el diente entero con la raiz completa";
      const result = runTriagePipeline(message, {
        clinicEmergencyPhone: testClinicPhone,
      });

      expect(result.action).toBe("emergency_override");
      if (result.action === "emergency_override") {
        expect(result.emergencyMessage).toContain(
          "VENTANA CRITICA DE 60 MINUTOS",
        );
        expect(result.contactPhone).toBe(testClinicPhone);
        expect(result.triage.isRedFlagPresent).toBe(true);
        expect(result.triage.urgency).toBe("emergency");
      }
      expect(result.processingTimeMs).toBeLessThan(10);
    });

    it("should trigger emergency_override on acute airway compromise", () => {
      const message =
        "Tengo el piso de la boca hinchado y no puedo respirar ni tragar saliva";
      const result = runTriagePipeline(message);

      expect(result.action).toBe("emergency_override");
      if (result.action === "emergency_override") {
        expect(result.emergencyMessage).toContain("guardia hospitalaria");
      }
    });

    it("should conform strictly to DentalPipelineResultSchema in emergency mode", () => {
      const message =
        "Se me salio la muela de raiz por un golpe y sangra sin parar";
      const result = runTriagePipeline(message);
      const parsed = DentalPipelineResultSchema.parse(result);

      expect(parsed.action).toBe("emergency_override");
    });
  });

  describe("Conversational Agent Pass-through Flow (Safe Routing)", () => {
    it("should route routine aesthetic inquiries to conversational agent with enriched context", () => {
      const message =
        "Hola, buenas tardes! Me gustaria saber sobre carillas de porcelana para la paleta superior izquierda 21";
      const result = runTriagePipeline(message, {
        clinicName: "Dental Art Studios",
      });

      expect(result.action).toBe("pass_to_conversational_agent");
      if (result.action === "pass_to_conversational_agent") {
        expect(result.enrichedContext).toContain("Dental Art Studios");
        expect(result.enrichedContext).toContain("Pieza FDI 21");
        expect(result.enrichedContext).toContain("ROUTINE_ELECTIVE");
        expect(result.enrichedContext).toContain(
          "BLINDAJE MEDICO-LEGAL OBLIGATORIO",
        );
        expect(result.triage.identifiedTeeth).toEqual([21]);
        expect(result.triage.likelyCategory).toBe("aesthetic_veneers");
      }
    });

    it("should route acute high-priority pain cases to conversational agent with same-day priority context", () => {
      const message =
        "Tengo dolor agudo insoportable en la muela de juicio superior derecha 18, no me deja dormir";
      const result = runTriagePipeline(message);

      expect(result.action).toBe("pass_to_conversational_agent");
      if (result.action === "pass_to_conversational_agent") {
        expect(result.enrichedContext).toContain("HIGH_PRIORITY");
        expect(result.triage.recommendedAction).toBe("schedule_same_day_slot");
        expect(result.triage.identifiedTeeth).toEqual([18]);
      }
    });

    it("should conform strictly to DentalPipelineResultSchema in conversational mode", () => {
      const message =
        "Quiero consultar por un turno de limpieza dental preventiva";
      const result = runTriagePipeline(message);
      const parsed = DentalPipelineResultSchema.parse(result);

      expect(parsed.action).toBe("pass_to_conversational_agent");
    });
  });

  describe("DentalTriagePipeline Service Class", () => {
    it("should allow creating an instance with custom configuration", () => {
      const pipeline = new DentalTriagePipeline({
        clinicName: "Centro Odontologico San Martin",
        clinicEmergencyPhone: "+5491188887777",
      });

      expect(pipeline.getConfig().clinicName).toBe(
        "Centro Odontologico San Martin",
      );
      expect(pipeline.getConfig().clinicEmergencyPhone).toBe("+5491188887777");

      const result = pipeline.process("Hola, quisiera consultar por implantes");
      expect(result.action).toBe("pass_to_conversational_agent");
    });

    it("should allow runtime config updates", () => {
      const pipeline = new DentalTriagePipeline();
      pipeline.updateConfig({ clinicName: "Nueva Sede Palermo" });
      expect(pipeline.getConfig().clinicName).toBe("Nueva Sede Palermo");
    });
  });

  describe("Latency and Throughput Benchmark (<3ms requirement)", () => {
    it("should maintain average pipeline latency below 3ms across 100 consecutive executions", () => {
      const testPhrases = [
        "Me cai y se me salio la paleta de raiz",
        "Me duele la muela de juicio superior derecha 18",
        "Hola, queria consultar por carillas esteticas",
        "Tengo la cara hinchada con 39 de fiebre",
        "Se me despego un bracket del canino inferior derecho",
        "Tengo dolor pulsatil insoportable en el primer molar inferior izquierdo 36",
        "Quiero saber cuanto cuesta el tratamiento de invisalign",
        "No puedo respirar ni tragar saliva por el flemon gigante",
        "Se me rompio una corona ayer comiendo",
        "Quiero un turno de control para profilaxis y sarro",
      ];

      const iterations = 100;
      const start = performance.now();
      for (let i = 0; i < iterations; i++) {
        const phrase = testPhrases[i % testPhrases.length]!;
        runTriagePipeline(phrase);
      }
      const totalTime = performance.now() - start;
      const averageMs = totalTime / iterations;

      expect(averageMs).toBeLessThan(3.0);
    });
  });
});

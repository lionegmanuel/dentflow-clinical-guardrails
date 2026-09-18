import { evaluateTriage } from "../modules/clinical-triage/triage";
import { getToothInfo } from "../modules/tooth-parser/parser";
import {
  DentalPipelineResult,
  DentalPipelineResultSchema,
  TriageEvaluation,
} from "./types";

export interface DentalPipelineConfig {
  clinicName?: string;
  clinicEmergencyPhone?: string;
  enableTimingLogs?: boolean;
}

const DEFAULT_CONFIG: Required<DentalPipelineConfig> = {
  clinicName: "DentFlow Dental Care",
  clinicEmergencyPhone: "+5491199990000",
  enableTimingLogs: false,
};

function buildEnrichedContext(
  triage: TriageEvaluation,
  clinicName: string,
): string {
  const teethDetails = triage.identifiedTeeth.map((tooth) => {
    try {
      const info = getToothInfo(tooth);
      return `Pieza FDI ${tooth} (${info.technicalNameEs})`;
    } catch {
      return `Pieza FDI ${tooth}`;
    }
  });

  const teethStr =
    teethDetails.length > 0
      ? teethDetails.join(", ")
      : "No se especificaron piezas dentales puntuales";
  const symptomsStr =
    triage.detectedSymptoms.length > 0
      ? triage.detectedSymptoms.join("; ")
      : "Consulta general sin sintomas agudos";

  return [
    `[DENTFLOW CLINICAL GUARDRAILS: CONTEXTO EVALUADO PRE-LLM]`,
    `- Clinica: ${clinicName}`,
    `- Nivel de Urgencia Clinica: ${triage.urgency.toUpperCase()}`,
    `- Piezas Dentales FDI Identificadas: ${teethStr}`,
    `- Sintomas Detectados: ${symptomsStr}`,
    `- Especialidad Sugerida: ${triage.likelyCategory}`,
    `- Accion Recomendada: ${triage.recommendedAction}`,
    `- Pauta de Respuesta Sugerida: "${triage.suggestedPatientNotice}"`,
    `---`,
    `[BLINDAJE MEDICO-LEGAL OBLIGATORIO PARA EL AGENTE CONVERSACIONAL]:`,
    `1. Prohibido emitir diagnosticos odontologicos definitivos o prometer resultados biologicos.`,
    `2. Prohibido prescribir o sugerir dosis de farmacos (antibioticos, analgesicos, antiinflamatorios).`,
    `3. Validar con empatia la necesidad del paciente y orientar la conversacion hacia la coordinacion de turno o escaneo digital 3D.`,
  ].join("\n");
}

export function runTriagePipeline(
  message: string,
  config?: DentalPipelineConfig,
): DentalPipelineResult {
  const startTime = performance.now();
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  const triage = evaluateTriage(message);
  const processingTimeMs =
    Math.round((performance.now() - startTime) * 100) / 100;

  if (triage.urgency === "emergency" || triage.isRedFlagPresent) {
    const overrideResult: DentalPipelineResult = {
      action: "emergency_override",
      emergencyMessage: triage.suggestedPatientNotice,
      contactPhone: mergedConfig.clinicEmergencyPhone,
      triage,
      processingTimeMs,
    };
    return DentalPipelineResultSchema.parse(overrideResult);
  }

  const enrichedContext = buildEnrichedContext(triage, mergedConfig.clinicName);
  const passResult: DentalPipelineResult = {
    action: "pass_to_conversational_agent",
    enrichedContext,
    triage,
    processingTimeMs,
  };

  return DentalPipelineResultSchema.parse(passResult);
}

export class DentalTriagePipeline {
  private config: Required<DentalPipelineConfig>;

  constructor(config?: DentalPipelineConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  public process(message: string): DentalPipelineResult {
    return runTriagePipeline(message, this.config);
  }

  public getConfig(): Readonly<Required<DentalPipelineConfig>> {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<DentalPipelineConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

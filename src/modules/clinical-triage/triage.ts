import {
  ClinicalUrgency,
  DentalTreatmentCategory,
  TriageEvaluation,
  TriageEvaluationSchema,
  TriageRecommendedAction,
} from "../../core/types";
import { parseToothMentions } from "../tooth-parser/parser";
import { detectRedFlags } from "./red-flags";

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Deterministic symptom patterns with associated urgency weights.
 */
interface SymptomPattern {
  id: string;
  name: string;
  regex: RegExp;
  urgency: ClinicalUrgency;
  categoryHint?: DentalTreatmentCategory;
}

const SYMPTOM_PATTERNS: SymptomPattern[] = [
  // High urgency symptoms
  {
    id: "acute_throbbing_pain",
    name: "Dolor agudo pulsatil",
    regex:
      /dolor (?:agudo|insoportable|fuerte|intenso|muy fuerte)|no (?:me )?deja dormir|dolor pulsatil|late la muela|latido|me vuelve loco el dolor|dolor (?:8|9|10)\/10/,
    urgency: "high_priority",
    categoryHint: "endodontics",
  },
  {
    id: "localized_abscess_pus",
    name: "Flemon o absceso con pus",
    regex:
      /flemon|absceso|pus|bolita con pus|granito de pus|hinchazon en la encia/,
    urgency: "high_priority",
    categoryHint: "endodontics",
  },
  {
    id: "thermal_hypersensitivity",
    name: "Hipersensibilidad termica aguda",
    regex:
      /sensibilidad insoportable|frio y calor me mata|duele mucho con lo caliente|dolor con calor/,
    urgency: "high_priority",
    categoryHint: "endodontics",
  },
  {
    id: "wisdom_tooth_pain",
    name: "Pericoronaritis o dolor de muela de juicio",
    regex:
      /duele la muela (?:de|del) juicio|dolor de cordal|dolor al tragar por la muela|muela de juicio inflamada/,
    urgency: "high_priority",
    categoryHint: "general_surgery",
  },

  // Moderate urgency symptoms
  {
    id: "broken_tooth_restoration",
    name: "Fractura de diente o corona",
    regex:
      /se (?:me )?rompio|se partio|diente roto|muela rota|se cayo la corona|se me salio la tapita|se salio el empaste|se descascaro/,
    urgency: "moderate",
    categoryHint: "implants_rehabilitation",
  },
  {
    id: "orthodontic_detachment",
    name: "Desprendimiento de bracket o alineador",
    regex:
      /despego el bracket|bracket suelto|se rompio el alineador|alambre pinchando/,
    urgency: "moderate",
    categoryHint: "invisible_orthodontics",
  },
  {
    id: "mild_masticatory_discomfort",
    name: "Molestia leve al masticar",
    regex: /molestia al masticar|incomodidad al comer|molesta al morder/,
    urgency: "moderate",
    categoryHint: "endodontics",
  },
  {
    id: "gingival_bleeding",
    name: "Sangrado gingival habitual",
    regex: /sangran las encias|sangrado al cepillar|encias rojas e hinchadas/,
    urgency: "moderate",
    categoryHint: "periodontics",
  },

  // Routine elective symptoms / inquiries
  {
    id: "invisible_orthodontics_inquiry",
    name: "Consulta por ortodoncia invisible",
    regex:
      /alineador|alineadores|invisalign|ortodoncia|enderezar|dientes torcidos|dientes chuecos/,
    urgency: "routine_elective",
    categoryHint: "invisible_orthodontics",
  },
  {
    id: "aesthetic_veneers_inquiry",
    name: "Consulta por carillas o estetica dental",
    regex:
      /carillas?|blanqueamiento|estetica dental|diseno de sonrisa|mejorar la sonrisa/,
    urgency: "routine_elective",
    categoryHint: "aesthetic_veneers",
  },
  {
    id: "dental_implant_inquiry",
    name: "Consulta por implantes dentales",
    regex:
      /implante|implantes|falta un diente|reemplazar diente|tornillo dental|sin dientes/,
    urgency: "routine_elective",
    categoryHint: "implants_rehabilitation",
  },
  {
    id: "preventive_cleaning_inquiry",
    name: "Limpieza dental preventiva y chequeo",
    regex: /limpieza|profilaxis|sarro|control|revision|chequeo|mantenimiento/,
    urgency: "routine_elective",
    categoryHint: "preventive_cleaning",
  },
];

/**
 * Infers the most likely treatment category based on symptoms, keywords, and detected teeth.
 */
function inferTreatmentCategory(
  normalized: string,
  categoryHints: DentalTreatmentCategory[],
): DentalTreatmentCategory {
  if (/alinead|ortodoncia|invisalign|mordida|chueco/.test(normalized)) {
    return "invisible_orthodontics";
  }
  if (/carilla|blanqueamiento|estetica|diseno de sonrisa/.test(normalized)) {
    return "aesthetic_veneers";
  }
  if (/implante|tornillo|falta el diente|hueso para diente/.test(normalized)) {
    return "implants_rehabilitation";
  }
  if (
    /muela (?:de|del) juicio|cordal|extraccion|sacar diente/.test(normalized)
  ) {
    return "general_surgery";
  }
  if (/conducto|nervio|pulpitis|absceso|flemon|latido/.test(normalized)) {
    return "endodontics";
  }
  if (/encia|sarro subgingival|periodon|piorrea/.test(normalized)) {
    return "periodontics";
  }
  if (/limpieza|profilaxis|sarro|control anual/.test(normalized)) {
    return "preventive_cleaning";
  }

  // Fallback to hints if present
  if (categoryHints.length > 0 && categoryHints[0] !== undefined) {
    return categoryHints[0];
  }

  return "preventive_cleaning";
}

/**
 * Builds standard patient notice in empathetic, non-diagnostic Spanish for WhatsApp.
 */
function buildPatientNotice(
  urgency: ClinicalUrgency,
  isRedFlag: boolean,
  redFlagAdvice?: string,
): string {
  if (isRedFlag && redFlagAdvice) {
    return `${redFlagAdvice} Por favor, comuniquese de forma prioritaria con nuestra linea de guardia o asista a la central hospitalaria mas cercana.`;
  }

  switch (urgency) {
    case "emergency":
      return "URGENCIA CLINICA: Hemos identificado signos que requieren atencion inmediata. Por favor llame de inmediato a nuestro telefono prioritario o concurra a guardia.";
    case "high_priority":
      return "PRIORIDAD ALTA: Hemos registrado sintomas de dolor agudo o inflamacion. Hemos reservado un turno prioritario en el dia para que el odontologo especialista lo evalue y alivie el malestar.";
    case "moderate":
      return "CONSULTA PRIORITARIA: Registramos una molestia o rotura que debe ser reparada a la brevedad. Contamos con turnos proximos para resolverlo de forma definitiva.";
    case "routine_elective":
    default:
      return "CONSULTA PERSONALIZADA: Para brindarte la mejor solucion y presupuesto exacto, te recomendamos una valoracion clinica completa con escaneo digital 3D sin cargo adicional.";
  }
}

/**
 * Evaluates patient message and returns comprehensive triage evaluation.
 * Deterministic execution guaranteed in <2ms.
 */
export function evaluateTriage(message: string): TriageEvaluation {
  const normalized = normalize(message);
  const identifiedTeeth = parseToothMentions(message);
  const redFlags = detectRedFlags(normalized);

  const detectedSymptoms: string[] = [];
  const categoryHints: DentalTreatmentCategory[] = [];
  let highestUrgency: ClinicalUrgency = "routine_elective";

  for (const pat of SYMPTOM_PATTERNS) {
    if (pat.regex.test(normalized)) {
      detectedSymptoms.push(pat.name);
      if (pat.categoryHint) {
        categoryHints.push(pat.categoryHint);
      }
      if (pat.urgency === "high_priority") {
        highestUrgency = "high_priority";
      } else if (
        pat.urgency === "moderate" &&
        highestUrgency === "routine_elective"
      ) {
        highestUrgency = "moderate";
      }
    }
  }

  // Red Flags override everything
  const isRedFlagPresent = redFlags.length > 0;
  let finalUrgency: ClinicalUrgency;
  let recommendedAction: TriageRecommendedAction;

  if (isRedFlagPresent) {
    finalUrgency = "emergency";
    recommendedAction = "immediate_emergency_call";
  } else if (highestUrgency === "high_priority") {
    finalUrgency = "high_priority";
    recommendedAction = "schedule_same_day_slot";
  } else if (highestUrgency === "moderate") {
    finalUrgency = "moderate";
    recommendedAction = "schedule_same_day_slot";
  } else {
    finalUrgency = "routine_elective";
    recommendedAction = "schedule_3d_scan_consult";
  }

  const likelyCategory = inferTreatmentCategory(normalized, categoryHints);
  const primaryRedFlagAdvice = redFlags[0]?.immediatePatientAdvice;
  const suggestedPatientNotice = buildPatientNotice(
    finalUrgency,
    isRedFlagPresent,
    primaryRedFlagAdvice,
  );

  const evaluation: TriageEvaluation = {
    urgency: finalUrgency,
    isRedFlagPresent,
    detectedSymptoms,
    identifiedTeeth,
    likelyCategory,
    recommendedAction,
    suggestedPatientNotice,
    redFlags,
  };

  return TriageEvaluationSchema.parse(evaluation);
}

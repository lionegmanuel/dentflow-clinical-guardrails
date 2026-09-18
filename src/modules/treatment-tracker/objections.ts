import {
  HighTicketObjectionCategory,
  ObjectionResolution,
  ObjectionResolutionSchema,
} from "../../core/types";

interface ObjectionRule {
  category: HighTicketObjectionCategory;
  pattern: RegExp;
  clinicalRationale: string;
  suggestedFollowUpNotice: string;
  matchedKeywords: (text: string) => string[];
}

const OBJECTION_RULES: ObjectionRule[] = [
  {
    category: "fear_pain",
    pattern:
      /miedo|panico|fobia|dolor|agujas?|anestesia|impresion|lastimar|trauma/,
    clinicalRationale:
      "Miedo quirurgico o fobia al dolor dental. Se debe desescalar la ansiedad mediante protocolos de sedacion consciente y anestesia computarizada indolora.",
    suggestedFollowUpNotice:
      "Entendemos perfectamente tu inquietud. En nuestra clinica aplicamos tecnologia de anestesia computarizada y protocolos de minima invasion que eliminan por completo el dolor durante el procedimiento. Ademas, contamos con sedacion consciente para que transites la sesion con absoluta tranquilidad.",
    matchedKeywords: (text: string) => {
      const words = [
        "miedo al dolor",
        "fobia",
        "panico",
        "aguja",
        "agujas",
        "anestesia",
        "impresion",
        "dolor",
        "miedo",
      ];
      return words.filter((w) => text.includes(w));
    },
  },
  {
    category: "financial_cost",
    pattern:
      /caro|costoso|dinero|plata|presupuesto|precio elevado|cuotas|financiacion|formas? de pago|descuento|tarjeta/,
    clinicalRationale:
      "Freno financiero o percepcion de alto costo. Se debe priorizar la solucion de salud desglosando planes de financiacion fija y cuotas accesibles.",
    suggestedFollowUpNotice:
      "Comprendemos que es una decision importante de inversion en tu salud y calidad de vida. Disponemos de planes de financiacion en cuotas fijas y convenios personalizados para que puedas iniciar el tratamiento con comodidad sin postergar tu salud dental.",
    matchedKeywords: (text: string) => {
      const words = [
        "caro",
        "costoso",
        "plata",
        "dinero",
        "presupuesto",
        "cuotas",
        "financiacion",
        "pago",
        "precio",
      ];
      return words.filter((w) => text.includes(w));
    },
  },
  {
    category: "recovery_time",
    pattern:
      /recuperacion|reposo|dias de baja|trabajar|hinchazon|postoperatorio|hinchar|cuanto tarda/,
    clinicalRationale:
      "Preocupacion por dias de reposo, afectacion laboral o dolor postquirurgico. Se debe clarificar la reincorporacion inmediata o en 24-48 hs.",
    suggestedFollowUpNotice:
      "Gracias a las tecnicas de microcirugia guiada digitalmente, el tiempo de recuperacion es minimo: la gran mayoria de nuestros pacientes retoma sus actividades cotidianas al dia siguiente sin hinchazon significativa.",
    matchedKeywords: (text: string) => {
      const words = [
        "dias de reposo",
        "recuperacion",
        "reposo",
        "baja",
        "trabajar",
        "trabajo",
        "hinchar",
        "hinchazon",
        "postoperatorio",
      ];
      return words.filter((w) => text.includes(w));
    },
  },
  {
    category: "procedure_doubt",
    pattern:
      /rechazo|cuanto dura|se nota|natural|postizo|fracaso|infeccion implante|garantia/,
    clinicalRationale:
      "Duda tecnica sobre tasa de exito, rechazo biologico o estetica artificial. Explicar biocompatibilidad de titanio (>98% de integracion) y diseno digital natural.",
    suggestedFollowUpNotice:
      "Los implantes de titanio grado medico cuentan con una tasa de oseointegracion superior al 98% a nivel mundial. Ademas, disenamos cada corona digitalmente segun el tono y anatomia de tus piezas naturales para que resulte imperceptible.",
    matchedKeywords: (text: string) => {
      const words = [
        "rechazo",
        "cuanto dura",
        "se nota",
        "postizo",
        "garantia",
        "natural",
        "fracaso",
      ];
      return words.filter((w) => text.includes(w));
    },
  },
  {
    category: "distrust_delay",
    pattern:
      /pensar|consultar con mi (?:pareja|esposo|esposa|familia)|mas adelante|despues te aviso|veremos/,
    clinicalRationale:
      "Procrastinacion o necesidad de consulta familiar. Ofrecer visualizacion previa 3D sin compromiso para facilitar la toma de decision.",
    suggestedFollowUpNotice:
      "Por supuesto, es fundamental que tomes la decision con total seguridad y en familia. Te invitamos a una sesion de escaneo 3D sin compromiso para que puedas ver una simulacion exacta de como quedara tu sonrisa antes de decidir.",
    matchedKeywords: (text: string) => {
      const words = [
        "pensar",
        "consultar",
        "pareja",
        "esposo",
        "esposa",
        "despues",
        "adelante",
      ];
      return words.filter((w) => text.includes(w));
    },
  },
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Detects and classifies objections in patient messages regarding high-ticket dental procedures.
 */
export function resolveObjection(
  patientMessage: string,
): ObjectionResolution | null {
  const normalized = normalize(patientMessage);

  let bestRule: ObjectionRule | null = null;
  let maxMatchedCount = 0;
  let bestKeywords: string[] = [];

  for (const rule of OBJECTION_RULES) {
    if (rule.pattern.test(normalized)) {
      const keywords = rule.matchedKeywords(normalized);
      const count = keywords.length > 0 ? keywords.length : 1;
      if (count > maxMatchedCount) {
        maxMatchedCount = count;
        bestRule = rule;
        bestKeywords = keywords;
      }
    }
  }

  if (bestRule) {
    const resolution: ObjectionResolution = {
      category: bestRule.category,
      detectedKeywords:
        bestKeywords.length > 0 ? bestKeywords : ["objecion_detectada"],
      clinicalRationale: bestRule.clinicalRationale,
      suggestedFollowUpNotice: bestRule.suggestedFollowUpNotice,
      confidence: 0.92,
    };
    return ObjectionResolutionSchema.parse(resolution);
  }

  return null;
}

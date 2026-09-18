import { DetectedRedFlag, RedFlagType } from "../../core/types";

interface RedFlagRule {
  type: RedFlagType;
  name: string;
  description: string;
  criticalWindowMinutes: number | null;
  immediatePatientAdvice: string;
  matcher: (normalizedText: string) => boolean;
}

const RED_FLAG_RULES: RedFlagRule[] = [
  {
    type: "airway_compromise",
    name: "Compromiso de via aerea superior",
    description:
      "Sospecha de Angina de Ludwig o extension de flemon al espacio submandibular con riesgo asfictico",
    criticalWindowMinutes: null,
    immediatePatientAdvice:
      "EMERGENCIA MEDICA MAXIMA: Acuda de inmediato a la guardia hospitalaria de urgencias mas cercana. No se recueste, mantenga la posicion sentada erguida.",
    matcher: (text: string) => {
      const breathingIssue =
        /dificultad para respirar|no puedo respirar|cuesta respirar|falta el aire|ahog\w+|asfixi\w+/;
      const swallowingIssue =
        /dificultad para tragar|no puedo tragar|cuesta tragar|no pasa la saliva|no puedo pasar saliva/;
      const swellingAirway =
        /garganta cerrada|cuello hinchado|piso de boca hinchado|angina de ludwig/;
      return (
        breathingIssue.test(text) ||
        (swallowingIssue.test(text) &&
          /hinchad\w*|dolor|flemon|infeccion/.test(text)) ||
        swellingAirway.test(text)
      );
    },
  },
  {
    type: "traumatic_tooth_avulsion",
    name: "Avulsion dental traumatica",
    description:
      "Diente completamente desprendido de su alveolo por traumatismo (ventana critica <60 min)",
    criticalWindowMinutes: 60,
    immediatePatientAdvice:
      "VENTANA CRITICA DE 60 MINUTOS: Tome el diente unicamente por la corona blanca, nunca toque la raiz. No lo cepille ni desinfecte con alcohol. Sumerjalo de inmediato en un vaso de leche fria o en su propia saliva y concurra urgente al consultorio.",
    matcher: (text: string) => {
      const toothOut =
        /salio (?:el|un) diente|salio entero|salio completo|cayo el diente|cayo la paleta|arranco el diente|avulsion|diente afuera|perdi el diente por un golpe/;
      const impactContext =
        /golpe|trauma|caida|accidente|pelotazo|choque|impacto|se me salio|se le salio/;
      return (
        toothOut.test(text) ||
        (/diente|paleta|colmillo|muela/.test(text) &&
          /se desprendio|se salio de raiz/.test(text)) ||
        (impactContext.test(text) &&
          /diente (?:se salio|salio|en la mano)/.test(text))
      );
    },
  },
  {
    type: "facial_cellulitis_fever",
    name: "Celulitis facial con manifestacion sistemica",
    description:
      "Infeccion odontogenica difusa con compromiso facial evidente y respuesta sistemica (fiebre)",
    criticalWindowMinutes: 180,
    immediatePatientAdvice:
      "URGENCIA INFECCIOSA: Presenta signos de celulitis odontogenica con respuesta febril. Requiere atencion odontologica y medica urgente para evitar diseminacion bacteriana.",
    matcher: (text: string) => {
      const facialSwelling =
        /cara hinchad\w*|cachete hinchad\w*|ojo hinchad\w*|ojo cerrado|mejilla hinchad\w*|deformad\w*|edema facial|flemon/;
      const feverSystemic =
        /fiebre|temperatura alta|38|39|40|chuchos|escalofrios|temblores/;
      return (
        (facialSwelling.test(text) && feverSystemic.test(text)) ||
        /flemon con fiebre|infeccion con fiebre/.test(text)
      );
    },
  },
  {
    type: "uncontrolled_hemorrhage",
    name: "Hemorragia activa no controlada",
    description:
      "Sangrado continuo profuso posterior a procedimiento quirurgico o traumatismo",
    criticalWindowMinutes: 120,
    immediatePatientAdvice:
      "URGENCIA HEMORRAGICA: Muerda con fuerza constante una gasa esteril o un saquito de te negro humedo durante 30 minutos sin aflojar ni salivar. Si el sangrado persiste profuso, dirijase a guardia.",
    matcher: (text: string) => {
      const activeBleeding =
        /no para de sangrar|sangra sin parar|sangre a chorros|hemorragia|sangrado abundante|no coagula|boca llena de sangre/;
      const postOpOrInjury =
        /extraccion|cirugia|sacaron|muela de juicio|operaron|golpe|corte/;
      return (
        activeBleeding.test(text) ||
        (/mordiendo gasa/.test(text) &&
          /sigue sangrando|no frena/.test(text)) ||
        (/sangrado/.test(text) &&
          postOpOrInjury.test(text) &&
          /mucho|fuerte|horas/.test(text))
      );
    },
  },
  {
    type: "severe_trismus",
    name: "Trismus severo con limitacion de apertura bucal",
    description:
      "Espasmo severo de musculos masticadores por proceso infeccioso en espacios profundos",
    criticalWindowMinutes: 180,
    immediatePatientAdvice:
      "URGENCIA FUNCIONAL: La limitacion para abrir la boca asociada a dolor o infeccion requiere examen clinico prioritario en menos de 3 horas.",
    matcher: (text: string) => {
      const trismusTerms =
        /no puedo abrir la boca|apenas puedo abrir la boca|no me entra ni una cuchara|mandibula trabada|mandibula bloqueada|trismus|trismo/;
      return (
        trismusTerms.test(text) &&
        (/dolor|muela|hinchad\w*|juicio|flemon|infeccion/.test(text) ||
          /no puedo abrir/.test(text))
      );
    },
  },
];

/**
 * Evaluates patient message against medical red flag patterns.
 * Returns all detected red flags. Latency is <1ms.
 */
export function detectRedFlags(normalizedText: string): DetectedRedFlag[] {
  const detected: DetectedRedFlag[] = [];

  for (const rule of RED_FLAG_RULES) {
    if (rule.matcher(normalizedText)) {
      detected.push({
        type: rule.type,
        name: rule.name,
        description: rule.description,
        criticalWindowMinutes: rule.criticalWindowMinutes,
        immediatePatientAdvice: rule.immediatePatientAdvice,
      });
    }
  }

  return detected;
}

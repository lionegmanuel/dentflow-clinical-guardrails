import { InvalidToothNotationError } from "../../core/errors";
import {
  DentalQuadrant,
  FdiTooth,
  FdiToothSchema,
  ToothPosition,
} from "../../core/types";
import {
  ALL_FDI_NUMBERS,
  TOOTH_REGISTRY,
  ToothInfo,
  UNIVERSAL_TO_FDI_MAP,
} from "./tooth-map";

/**
 * Validates whether a given number is a valid adult FDI tooth number (11-18, 21-28, 31-38, 41-48).
 */
export function isValidFdi(val: number): val is FdiTooth {
  return FdiToothSchema.safeParse(val).success;
}

/**
 * Retrieves clinical metadata for an FDI tooth.
 */
export function getToothInfo(tooth: FdiTooth): ToothInfo {
  const info = TOOTH_REGISTRY[tooth];
  if (!info) {
    throw new InvalidToothNotationError(
      String(tooth),
      `Pieza FDI ${tooth} desconocida en registro.`,
    );
  }
  return info;
}

/**
 * Normalizes text for deterministic token analysis:
 * - Converts to lower-case.
 * - Strips diacritics / accents (e.g. acentos, dieresis).
 * - Preserves alphanumerics and key punctuation (e.g. dots in 3.6 or hashes in #18).
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[,;:]/g, " ");
}

/**
 * Resolves a quadrant number (1 to 4) given arch ("upper"|"lower") and side ("right"|"left").
 */
export function resolveQuadrant(
  arch: "upper" | "lower",
  side: "right" | "left",
): DentalQuadrant {
  if (arch === "upper") {
    return side === "right" ? 1 : 2;
  }
  return side === "left" ? 3 : 4;
}

/**
 * Constructs an FDI tooth code from quadrant and position.
 */
function makeFdi(quadrant: DentalQuadrant, position: ToothPosition): FdiTooth {
  const num = quadrant * 10 + position;
  if (isValidFdi(num)) {
    return num;
  }
  throw new InvalidToothNotationError(
    `${quadrant}${position}`,
    `Combinacion invalida de cuadrante y posicion: Q${quadrant} P${position}`,
  );
}

interface QuadrantMention {
  arch: "upper" | "lower";
  side: "right" | "left";
  quadrant: DentalQuadrant;
}

function detectQuadrantFromContext(segment: string): QuadrantMention | null {
  const isUpper = /superior|arriba|maxilar|upper/.test(segment);
  const isLower = /inferior|abajo|mandibul\w*|lower/.test(segment);
  const isRight = /derech\w*|right/.test(segment);
  const isLeft = /izquierd\w*|left/.test(segment);

  if (isUpper && !isLower && isRight && !isLeft) {
    return { arch: "upper", side: "right", quadrant: 1 };
  }
  if (isUpper && !isLower && isLeft && !isRight) {
    return { arch: "upper", side: "left", quadrant: 2 };
  }
  if (isLower && !isUpper && isLeft && !isRight) {
    return { arch: "lower", side: "left", quadrant: 3 };
  }
  if (isLower && !isUpper && isRight && !isLeft) {
    return { arch: "lower", side: "right", quadrant: 4 };
  }

  return null;
}

/**
 * Parses colloquial, natural language or technical mentions of teeth into normalized FDI numbers.
 * Latency is typically <1ms per message.
 */
export function parseToothMentions(text: string): FdiTooth[] {
  if (!text || text.trim().length === 0) {
    return [];
  }

  const normalized = normalizeText(text);
  const foundTeeth = new Set<FdiTooth>();

  // 1. Direct patterns: "diente 18", "pieza 21", "muela 36", "fdi 46", "3.6", "2.1", "#18"
  const directFdiRegex =
    /(?:diente|pieza|muela|fdi|posicion|nro|no|numero|#)\s*([1-4][1-8])\b/gi;
  let match: RegExpExecArray | null;
  while ((match = directFdiRegex.exec(normalized)) !== null) {
    const rawNum = match[1];
    if (rawNum) {
      const num = parseInt(rawNum, 10);
      if (isValidFdi(num)) {
        foundTeeth.add(num);
      }
    }
  }

  // Dotted notation: "3.6", "1.8", "2.1", "4.3"
  const dottedRegex = /\b([1-4])\.([1-8])\b/g;
  while ((match = dottedRegex.exec(normalized)) !== null) {
    const q = match[1];
    const p = match[2];
    if (q && p) {
      const num = parseInt(q + p, 10);
      if (isValidFdi(num)) {
        foundTeeth.add(num);
      }
    }
  }

  // Universal system mentions: "universal 16", "sistema universal 32", "#30 universal"
  const universalRegex =
    /(?:universal\s*(?:sistema)?\s*#?\s*|#\s*)(\b[1-9]\b|\b[12][0-9]\b|\b3[0-2]\b)(?:\s*universal)?/gi;
  while ((match = universalRegex.exec(normalized)) !== null) {
    const rawVal = match[1];
    if (rawVal && /universal/.test(match[0])) {
      const uNum = parseInt(rawVal, 10);
      const mappedFdi = UNIVERSAL_TO_FDI_MAP[uNum];
      if (mappedFdi) {
        foundTeeth.add(mappedFdi);
      }
    }
  }

  // 2. Multi-tooth collective phrases
  // "las dos paletas", "paletas de arriba", "ambas paletas"
  if (
    /paletas?\s*(?:de arriba|superiores?)|las (?:dos|ambas) paletas/.test(
      normalized,
    )
  ) {
    foundTeeth.add(11);
    foundTeeth.add(21);
  }

  // "muelas del juicio", "las cuatro muelas del juicio", "los cordales"
  if (
    /todas las muelas (?:de|del) juicio|las cuatro muelas (?:de|del) juicio|los cordales/.test(
      normalized,
    )
  ) {
    foundTeeth.add(18);
    foundTeeth.add(28);
    foundTeeth.add(38);
    foundTeeth.add(48);
  }

  // "muelas del juicio de abajo", "cordales inferiores"
  if (
    /muelas (?:de|del) juicio (?:de abajo|inferiores?)|cordales inferiores?/.test(
      normalized,
    )
  ) {
    foundTeeth.add(38);
    foundTeeth.add(48);
  }

  // "muelas del juicio de arriba", "cordales superiores"
  if (
    /muelas (?:de|del) juicio (?:de arriba|superiores?)|cordales superiores?/.test(
      normalized,
    )
  ) {
    foundTeeth.add(18);
    foundTeeth.add(28);
  }

  // 3. Segment-based natural language parsing
  // Split into clauses to prevent cross-contamination between sentences or conjunctions
  const clauses = normalized.split(
    /\by\b|\be\b|\bcon\b|\bademas\b|\btambien\b|\.|\n/,
  );

  for (const clause of clauses) {
    const trimmed = clause.trim();
    if (trimmed.length === 0) {
      continue;
    }

    const quadrantInfo = detectQuadrantFromContext(trimmed);

    // Identify position in clause
    let detectedPosition: ToothPosition | null = null;

    // Wisdom tooth (Tercer molar / muela del juicio / cordal)
    if (
      /muela (?:de|del) juicio|cordal|tercer molar|wisdom tooth/.test(trimmed)
    ) {
      detectedPosition = 8;
    }
    // Central incisor (Paleta / incisivo central)
    else if (
      /paleta|incisivo central|diente central|central incisor/.test(trimmed)
    ) {
      detectedPosition = 1;
    }
    // Lateral incisor (Incisivo lateral / lateral)
    else if (
      /incisivo lateral|lateral(?!\s+derecho|\s+izquierdo)|lateral incisor/.test(
        trimmed,
      )
    ) {
      detectedPosition = 2;
    }
    // Canine (Colmillo / canino)
    else if (/colmillo|canino|canine|eyetooth/.test(trimmed)) {
      detectedPosition = 3;
    }
    // First molar (Primer molar / primera muela)
    else if (
      /primer molar|primera muela|1er molar|first molar|6-year molar/.test(
        trimmed,
      )
    ) {
      detectedPosition = 6;
    }
    // Second molar (Segundo molar / segunda muela)
    else if (
      /segundo molar|segunda muela|2do molar|second molar|12-year molar/.test(
        trimmed,
      )
    ) {
      detectedPosition = 7;
    }
    // First premolar
    else if (
      /primer premolar|1er premolar|first premolar|primer bicuspide/.test(
        trimmed,
      )
    ) {
      detectedPosition = 4;
    }
    // Second premolar
    else if (
      /segundo premolar|2do premolar|second premolar|segundo bicuspide/.test(
        trimmed,
      )
    ) {
      detectedPosition = 5;
    }
    // General molar (default to first molar if quadrant provided)
    else if (/molar|muela/.test(trimmed)) {
      // If position is not specified, check if 6, 7 or 8 was implied
      if (/tercera|ultima/.test(trimmed)) {
        detectedPosition = 8;
      } else if (/segunda/.test(trimmed)) {
        detectedPosition = 7;
      } else if (/primera/.test(trimmed)) {
        detectedPosition = 6;
      }
    }

    if (detectedPosition !== null && quadrantInfo !== null) {
      foundTeeth.add(makeFdi(quadrantInfo.quadrant, detectedPosition));
    }
  }

  // 4. Exact dictionary matching of whole popular names in TOOTH_REGISTRY
  for (const fdi of ALL_FDI_NUMBERS) {
    const info = TOOTH_REGISTRY[fdi];
    if (info) {
      for (const popularName of info.popularNamesEs) {
        const cleanPopular = normalizeText(popularName);
        if (normalized.includes(cleanPopular)) {
          foundTeeth.add(fdi);
        }
      }
    }
  }

  // Return sorted array of FDI teeth
  return Array.from(foundTeeth).sort((a, b) => a - b);
}

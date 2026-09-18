import { describe, expect, it } from "vitest";
import { InvalidToothNotationError } from "../src/core/errors";
import {
  getToothInfo,
  isValidFdi,
  parseToothMentions,
  resolveQuadrant,
} from "../src/modules/tooth-parser";

describe("ToothNotationParser (FDI ISO 3950)", () => {
  describe("Colloquial phrases mapping to exact FDI", () => {
    it("should map 'muela de juicio superior derecha' to 18", () => {
      const teeth = parseToothMentions(
        "Me duele la muela de juicio superior derecha",
      );
      expect(teeth).toContain(18);
      expect(teeth).toEqual([18]);
    });

    it("should map 'paleta superior izquierda' to 21", () => {
      const teeth = parseToothMentions(
        "Se me partio la paleta superior izquierda",
      );
      expect(teeth).toEqual([21]);
    });

    it("should map 'colmillo inferior derecho' to 43", () => {
      const teeth = parseToothMentions(
        "Tengo flojo el colmillo inferior derecho",
      );
      expect(teeth).toEqual([43]);
    });

    it("should map 'primer molar inferior izquierdo' to 36", () => {
      const teeth = parseToothMentions(
        "Siento latidos en el primer molar inferior izquierdo",
      );
      expect(teeth).toEqual([36]);
    });

    it("should map 'segundo molar superior derecho' to 17", () => {
      const teeth = parseToothMentions(
        "Se me cayo un empaste del segundo molar superior derecho",
      );
      expect(teeth).toEqual([17]);
    });

    it("should map collective phrase 'paletas de arriba' to [11, 21]", () => {
      const teeth = parseToothMentions(
        "Quiero ponerme carillas en las paletas de arriba",
      );
      expect(teeth).toEqual([11, 21]);
    });

    it("should map 'las cuatro muelas del juicio' to [18, 28, 38, 48]", () => {
      const teeth = parseToothMentions(
        "El cirujano me dijo que me tengo que sacar las cuatro muelas de juicio",
      );
      expect(teeth).toEqual([18, 28, 38, 48]);
    });

    it("should map 'muelas del juicio de abajo' to [38, 48]", () => {
      const teeth = parseToothMentions(
        "Tengo hinchadas las muelas del juicio de abajo",
      );
      expect(teeth).toEqual([38, 48]);
    });
  });

  describe("Direct numerical and technical notation", () => {
    it("should recognize direct FDI formats like 'pieza 18', 'diente 21', 'muela 36'", () => {
      expect(parseToothMentions("Tengo rota la pieza 18")).toEqual([18]);
      expect(parseToothMentions("Duele el diente 21")).toEqual([21]);
      expect(parseToothMentions("Me empastaron la muela 36")).toEqual([36]);
      expect(parseToothMentions("FDI 46")).toEqual([46]);
    });

    it("should recognize dotted notation like '3.6', '2.1', '1.8'", () => {
      expect(parseToothMentions("Control conducto pieza 3.6")).toEqual([36]);
      expect(parseToothMentions("Corona en 2.1 y 1.8")).toEqual([18, 21]);
    });

    it("should convert Universal Numbering System (1-32) when explicitly referenced", () => {
      expect(parseToothMentions("Diente universal 16")).toEqual([28]);
      expect(parseToothMentions("Sistema universal 1")).toEqual([18]);
      expect(parseToothMentions("Pieza #30 universal")).toEqual([46]);
    });

    it("should handle multiple teeth mentioned in a single complex sentence", () => {
      const message =
        "Tengo rota la paleta superior izquierda y ademas me molesta la muela de juicio superior derecha";
      const teeth = parseToothMentions(message);
      expect(teeth).toEqual([18, 21]);
    });

    it("should return empty array when no tooth is mentioned", () => {
      expect(
        parseToothMentions("Hola, buenos dias, queria consultar los horarios"),
      ).toEqual([]);
      expect(parseToothMentions("")).toEqual([]);
    });
  });

  describe("Metadata lookup and validations", () => {
    it("should return complete anatomical metadata for valid FDI tooth", () => {
      const info = getToothInfo(21);
      expect(info.fdi).toBe(21);
      expect(info.arch).toBe("upper");
      expect(info.side).toBe("left");
      expect(info.position).toBe(1);
      expect(info.quadrant).toBe(2);
      expect(info.technicalNameEs).toContain("Incisivo central");
    });

    it("should throw InvalidToothNotationError for non-existent FDI numbers", () => {
      expect(() =>
        getToothInfo(99 as unknown as Parameters<typeof getToothInfo>[0]),
      ).toThrow(InvalidToothNotationError);
    });

    it("should validate FDI range accurately with isValidFdi", () => {
      expect(isValidFdi(11)).toBe(true);
      expect(isValidFdi(18)).toBe(true);
      expect(isValidFdi(28)).toBe(true);
      expect(isValidFdi(38)).toBe(true);
      expect(isValidFdi(48)).toBe(true);

      expect(isValidFdi(10)).toBe(false);
      expect(isValidFdi(19)).toBe(false);
      expect(isValidFdi(29)).toBe(false);
      expect(isValidFdi(51)).toBe(false);
      expect(isValidFdi(0)).toBe(false);
    });

    it("should resolve quadrants correctly", () => {
      expect(resolveQuadrant("upper", "right")).toBe(1);
      expect(resolveQuadrant("upper", "left")).toBe(2);
      expect(resolveQuadrant("lower", "left")).toBe(3);
      expect(resolveQuadrant("lower", "right")).toBe(4);
    });
  });

  describe("Execution performance benchmark", () => {
    it("should execute parsing in less than 1ms per typical message", () => {
      const sample =
        "Hola, se me rompio la muela de juicio superior derecha y me late la encia";
      const start = performance.now();
      for (let i = 0; i < 50; i++) {
        parseToothMentions(sample);
      }
      const duration = (performance.now() - start) / 50;
      expect(duration).toBeLessThan(1.0);
    });
  });
});

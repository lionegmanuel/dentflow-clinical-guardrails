import { beforeEach, describe, expect, it } from "vitest";
import { WaitlistCandidate, WaitlistCandidateSchema } from "../src/core/types";
import {
  calculateMatchScore,
  ChairRescueQueue,
  determineSlotWindow,
  findBestCandidate,
  isWindowCompatible,
  rankCandidates,
} from "../src/modules/waitlist-queue";

describe("ChairRescueQueue and Priority Matcher", () => {
  const candidateHighTicketMorning: WaitlistCandidate = {
    patientId: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
    patientName: "Dr. Roberto Rossi",
    phone: "+5491155551111",
    requiredSpecialty: "implants_rehabilitation",
    preferredTimeWindow: "morning",
    treatmentEstimatedValue: 4500,
    confirmedPriorityScore: 90,
  };

  const candidateMidTicketMorning: WaitlistCandidate = {
    patientId: "b2c3d4e5-f6a7-4b6c-9d0e-1f2a3b4c5d6e",
    patientName: "Lucia Gomez",
    phone: "+5491155552222",
    requiredSpecialty: "implants_rehabilitation",
    preferredTimeWindow: "morning",
    treatmentEstimatedValue: 1200,
    confirmedPriorityScore: 95,
  };

  const candidateHighTicketAfternoon: WaitlistCandidate = {
    patientId: "c3d4e5f6-a7b8-4c7d-0e1f-2a3b4c5d6e7f",
    patientName: "Esteban Morales",
    phone: "+5491155553333",
    requiredSpecialty: "implants_rehabilitation",
    preferredTimeWindow: "afternoon",
    treatmentEstimatedValue: 5000,
    confirmedPriorityScore: 85,
  };

  const candidateOrthodonticsAnytime: WaitlistCandidate = {
    patientId: "d4e5f6a7-b8c9-4d8e-1f2a-3b4c5d6e7f8a",
    patientName: "Valeria Paz",
    phone: "+5491155554444",
    requiredSpecialty: "invisible_orthodontics",
    preferredTimeWindow: "anytime",
    treatmentEstimatedValue: 2800,
    confirmedPriorityScore: 80,
  };

  const candidatesList: WaitlistCandidate[] = [
    candidateHighTicketMorning,
    candidateMidTicketMorning,
    candidateHighTicketAfternoon,
    candidateOrthodonticsAnytime,
  ];

  describe("Schema and Validation", () => {
    it("should validate candidate structure with Zod schema", () => {
      expect(
        WaitlistCandidateSchema.safeParse(candidateHighTicketMorning).success,
      ).toBe(true);
      expect(
        WaitlistCandidateSchema.safeParse({ patientId: "not-a-uuid" }).success,
      ).toBe(false);
    });
  });

  describe("Time window and slot compatibility", () => {
    it("should correctly identify morning and afternoon slots", () => {
      expect(determineSlotWindow("09:30")).toBe("morning");
      expect(determineSlotWindow("11:00")).toBe("morning");
      expect(determineSlotWindow("12:45")).toBe("morning");
      expect(determineSlotWindow("13:00")).toBe("afternoon");
      expect(determineSlotWindow("16:30")).toBe("afternoon");
      expect(determineSlotWindow("2026-09-18T10:00:00Z")).toBe("morning");
      expect(determineSlotWindow("2026-09-18T15:30:00Z")).toBe("afternoon");
    });

    it("should check window compatibility", () => {
      expect(isWindowCompatible("morning", "10:00")).toBe(true);
      expect(isWindowCompatible("morning", "15:00")).toBe(false);
      expect(isWindowCompatible("afternoon", "16:00")).toBe(true);
      expect(isWindowCompatible("afternoon", "09:00")).toBe(false);
      expect(isWindowCompatible("anytime", "09:00")).toBe(true);
      expect(isWindowCompatible("anytime", "16:00")).toBe(true);
    });
  });

  describe("Candidate Ranking and Rescue Selection", () => {
    it("should select the highest ticket candidate for morning implants chair slot", () => {
      const best = findBestCandidate(
        candidatesList,
        "implants_rehabilitation",
        "10:30",
      );
      expect(best).not.toBeNull();
      expect(best?.patientId).toBe(candidateHighTicketMorning.patientId);
      expect(best?.patientName).toBe("Dr. Roberto Rossi");
    });

    it("should select the afternoon candidate for afternoon implants slot", () => {
      const best = findBestCandidate(
        candidatesList,
        "implants_rehabilitation",
        "15:00",
      );
      expect(best).not.toBeNull();
      expect(best?.patientId).toBe(candidateHighTicketAfternoon.patientId);
    });

    it("should select anytime candidate for invisible orthodontics slot in any schedule", () => {
      const bestMorning = findBestCandidate(
        candidatesList,
        "invisible_orthodontics",
        "11:00",
      );
      expect(bestMorning?.patientId).toBe(
        candidateOrthodonticsAnytime.patientId,
      );

      const bestAfternoon = findBestCandidate(
        candidatesList,
        "invisible_orthodontics",
        "17:00",
      );
      expect(bestAfternoon?.patientId).toBe(
        candidateOrthodonticsAnytime.patientId,
      );
    });

    it("should return null if no candidate matches the released specialty", () => {
      const best = findBestCandidate(
        candidatesList,
        "general_surgery",
        "10:00",
      );
      expect(best).toBeNull();
    });

    it("should return empty array from rankCandidates if no candidates qualify", () => {
      const ranked = rankCandidates(candidatesList, "general_surgery", "10:00");
      expect(ranked).toHaveLength(0);
    });

    it("should rank eligible candidates descending by composite score", () => {
      const ranked = rankCandidates(
        candidatesList,
        "implants_rehabilitation",
        "10:00",
      );
      expect(ranked.length).toBe(2);
      expect(ranked[0]?.candidate.patientId).toBe(
        candidateHighTicketMorning.patientId,
      );
      expect(ranked[1]?.candidate.patientId).toBe(
        candidateMidTicketMorning.patientId,
      );
      expect(ranked[0]?.matchScore).toBeGreaterThan(ranked[1]?.matchScore ?? 0);
    });
  });

  describe("ChairRescueQueue class state management", () => {
    let queue: ChairRescueQueue;

    beforeEach(() => {
      queue = new ChairRescueQueue();
      queue.addCandidate(candidateHighTicketMorning);
      queue.addCandidate(candidateMidTicketMorning);
      queue.addCandidate(candidateOrthodonticsAnytime);
    });

    it("should store and retrieve candidates", () => {
      expect(queue.getCandidates().length).toBe(3);
    });

    it("should remove candidate when appointment is booked", () => {
      const removed = queue.removeCandidate(
        candidateHighTicketMorning.patientId,
      );
      expect(removed).toBe(true);
      expect(queue.getCandidates().length).toBe(2);

      // Now candidateMidTicketMorning becomes best for morning slot
      const nextBest = queue.findBest("implants_rehabilitation", "10:00");
      expect(nextBest?.patientId).toBe(candidateMidTicketMorning.patientId);
    });

    it("should rank candidates through queue.rank method", () => {
      const ranked = queue.rank("implants_rehabilitation", "10:00");
      expect(ranked.length).toBe(2);
      expect(ranked[0]?.candidate.patientId).toBe(
        candidateHighTicketMorning.patientId,
      );
    });

    it("should calculate score using calculateMatchScore utility", () => {
      const score = calculateMatchScore(
        candidateHighTicketMorning,
        "implants_rehabilitation",
        "10:00",
      );
      expect(score).toBeGreaterThan(70);
    });

    it("should throw WaitlistError when adding candidate without patientId", () => {
      // @ts-expect-error Testing runtime invalid candidate
      expect(() => queue.addCandidate({ patientName: "Invalid" })).toThrow();
    });
  });
});

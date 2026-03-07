import { describe, it, expect } from "vitest";

// Extraction of the logic from CommercialisationStrategy.tsx for testing
const calculateSeuilPsychologique = (price: number) => {
    if (price < 100000) return Math.floor(price / 5000) * 5000;
    if (price < 500000) {
        const base = Math.floor(price / 10000) * 10000;
        const remainder = price % 10000;
        if (remainder > 7000) return base + 9000;
        if (remainder > 3000) return base + 5000;
        return base - 1000; // e.g., 402,000 -> 399,000
    }
    if (price < 1000000) return Math.floor(price / 10000) * 10000;
    return Math.floor(price / 50000) * 50000;
};

describe("Psychological Pricing Algorithm", () => {
    it("should round to 5000 for prices < 100k", () => {
        expect(calculateSeuilPsychologique(87600)).toBe(85000);
        expect(calculateSeuilPsychologique(94000)).toBe(90000);
    });

    it("should apply specific thresholds for 100k-500k range", () => {
        // e.g., 402,000 -> 399,000 (remainder < 3000)
        expect(calculateSeuilPsychologique(402000)).toBe(399000);
        // e.g., 405,000 -> 405,000 (3000 < remainder <= 7000)
        expect(calculateSeuilPsychologique(405000)).toBe(405000);
        // e.g., 408,000 -> 409,000 (remainder > 7000)
        expect(calculateSeuilPsychologique(408000)).toBe(409000);
    });

    it("should round to 10000 for 500k-1M range", () => {
        expect(calculateSeuilPsychologique(754000)).toBe(750000);
        expect(calculateSeuilPsychologique(999000)).toBe(990000);
    });

    it("should round to 50000 for > 1M range", () => {
        expect(calculateSeuilPsychologique(1240000)).toBe(1200000);
        expect(calculateSeuilPsychologique(1280000)).toBe(1250000);
    });
});

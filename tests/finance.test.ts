import { describe, it, expect } from "vitest";
import {
    calculateMonthlyPayment,
    calculateAnnualDebtCost,
    calculateDebtYield,
    getUsuryStatus,
} from "../src/lib/finance";

describe("Finance module", () => {
    it("should compute a monthly payment with positive rate", () => {
        const mensualite = calculateMonthlyPayment(250000, 4, 25);
        expect(mensualite).toBeCloseTo(1319.59, 2);
    });

    it("should compute a monthly payment with zero rate", () => {
        const mensualite = calculateMonthlyPayment(120000, 0, 20);
        expect(mensualite).toBe(500);
    });

    it("should compute debt-linked yield", () => {
        const annualDebt = calculateAnnualDebtCost(1000);
        const debtYield = calculateDebtYield(24000, annualDebt);

        expect(annualDebt).toBe(12000);
        expect(debtYield).toBe(50);
    });

    it("should classify usury spread status", () => {
        expect(getUsuryStatus(3.95, 4.4)).toBe("ok");
        expect(getUsuryStatus(4.1, 4.4)).toBe("warning");
        expect(getUsuryStatus(4.5, 4.4)).toBe("blocked");
    });
});

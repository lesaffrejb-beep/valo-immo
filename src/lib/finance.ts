export function calculateMonthlyPayment(capital: number, annualRatePct: number, durationYears: number): number {
    if (capital <= 0 || durationYears <= 0) return 0;

    const monthlyRate = (annualRatePct / 100) / 12;
    const months = durationYears * 12;

    if (monthlyRate === 0) return capital / months;

    return (capital * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));
}

export function calculateAnnualDebtCost(monthlyPayment: number): number {
    return Math.max(0, monthlyPayment) * 12;
}

export function calculateDebtYield(annualRent: number, annualDebtCost: number): number {
    if (annualRent <= 0) return 0;
    return ((annualRent - annualDebtCost) / annualRent) * 100;
}

export function getUsuryStatus(borrowRatePct: number, usuryRatePct: number): "ok" | "warning" | "blocked" {
    const spread = usuryRatePct - borrowRatePct;
    if (spread < 0) return "blocked";
    if (spread < 0.35) return "warning";
    return "ok";
}

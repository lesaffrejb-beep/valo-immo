import React from 'react';
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export function DeltaBadge({ pct }: { pct: number }) {
    if (Math.abs(pct) < 0.5)
        return (
            <span className="inline-flex items-center gap-1.5 text-muted-foreground text-[13px] font-medium">
                <Minus className="h-3.5 w-3.5" /> Stable
            </span>
        );
    const positive = pct > 0;
    return (
        <span
            className={`inline-flex items-center gap-1.5 text-[13px] font-bold ${positive ? "text-success" : "text-destructive"
                }`}
        >
            {positive ? (
                <TrendingUp className="h-3.5 w-3.5" />
            ) : (
                <TrendingDown className="h-3.5 w-3.5" />
            )}
            {positive ? "+" : ""}
            {pct.toFixed(1)}%
        </span>
    );
}

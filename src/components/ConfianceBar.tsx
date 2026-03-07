import React from 'react';

export function ConfianceBar({ value }: { value: number }) {
    const pct = Math.round(value * 100);
    const color =
        pct >= 70
            ? "bg-success"
            : pct >= 40
                ? "bg-warning"
                : "bg-destructive";
    return (
        <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${color}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
            <span className={`text-[13px] font-data font-semibold text-foreground`}>
                {pct}%
            </span>
        </div>
    );
}

import React from 'react';

export function SegmentedControl({
    options,
    value,
    onChange
}: {
    options: { label: string; value: number; icon: React.ReactNode }[];
    value: number;
    onChange: (val: number) => void;
}) {
    return (
        <div className="flex flex-wrap gap-2 w-full">
            {options.map((opt) => {
                const isActive = value === opt.value;
                return (
                    <button
                        key={opt.label}
                        onClick={() => onChange(opt.value)}
                        className={`flex items-center gap-1.5 py-1.5 px-3.5 rounded-full text-[11px] sm:text-xs font-bold transition-all border ${isActive
                            ? "bg-primary text-white border-primary shadow-md"
                            : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground shadow-sm"
                            }`}
                    >
                        <span className={`shrink-0 ${isActive ? "text-white/80" : ""}`}>{opt.icon}</span>
                        <span>{opt.label}</span>
                    </button>
                );
            })}
        </div>
    );
}

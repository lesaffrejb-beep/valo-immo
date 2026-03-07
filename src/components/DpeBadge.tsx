import React from 'react';

const DPE_COLORS: Record<string, { bg: string; text: string }> = {
    A: { bg: "bg-emerald-500", text: "text-white" },
    B: { bg: "bg-green-500", text: "text-white" },
    C: { bg: "bg-lime-500", text: "text-white" },
    D: { bg: "bg-yellow-400", text: "text-neutral-900" },
    E: { bg: "bg-orange-500", text: "text-white" },
    F: { bg: "bg-red-500", text: "text-white" },
    G: { bg: "bg-red-700", text: "text-white" },
};

export function DpeBadge({ label }: { label: string }) {
    const c = DPE_COLORS[label] || { bg: "bg-muted", text: "text-muted-foreground" };
    return (
        <span
            className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm shadow-sm ${c.bg} ${c.text}`}
            title={`DPE : ${label}`}
        >
            {label}
        </span>
    );
}

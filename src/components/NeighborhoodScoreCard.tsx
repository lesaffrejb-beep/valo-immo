"use client";

import type { NeighborhoodScore } from "@/lib/types";
import { Bus, GraduationCap, ShoppingBasket, Sparkles, MapPin } from "lucide-react";

const categoryMeta = {
  transport: {
    label: "Transports",
    icon: Bus,
  },
  schools: {
    label: "Écoles",
    icon: GraduationCap,
  },
  food: {
    label: "Commerces alimentaires",
    icon: ShoppingBasket,
  },
} as const;

function scoreTone(score: number): string {
  if (score >= 8) return "text-emerald-600";
  if (score >= 5) return "text-amber-600";
  return "text-rose-600";
}

export default function NeighborhoodScoreCard({ neighborhood }: { neighborhood: NeighborhoodScore }) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm overflow-hidden">
      <header className="px-6 py-5 border-b border-[var(--border)] bg-[var(--muted)]/25 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-[var(--foreground)] tracking-tight inline-flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Score de Quartier (Isochrone)
          </h3>
          <p className="text-sm font-medium text-[var(--muted-foreground)] mt-1">
            Lecture terrain immédiate pour préparer la visite et orienter le discours client.
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Score global</p>
          <p className={`text-2xl font-black ${scoreTone(neighborhood.global_score)}`}>{neighborhood.global_score}/10</p>
        </div>
      </header>

      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {(Object.keys(categoryMeta) as Array<keyof typeof categoryMeta>).map((key) => {
          const meta = categoryMeta[key];
          const stat = neighborhood.categories[key];
          const Icon = meta.icon;

          return (
            <article key={key} className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 space-y-3">
              <p className="text-sm font-semibold text-[var(--foreground)] inline-flex items-center gap-2">
                <Icon className="h-4 w-4 text-primary" /> {meta.label}
              </p>
              <p className={`text-2xl font-black ${scoreTone(stat.score)}`}>{stat.score}/10</p>
              <div className="space-y-1 text-xs font-medium text-[var(--muted-foreground)]">
                <p>≤ 5 min à pied: <span className="text-[var(--foreground)] font-bold">{stat.within_5_min}</span></p>
                <p>≤ 10 min à pied: <span className="text-[var(--foreground)] font-bold">{stat.within_10_min}</span></p>
                <p>Plus proche: <span className="text-[var(--foreground)] font-bold">{stat.nearest_m ? `${stat.nearest_m} m` : "N/A"}</span></p>
              </div>
            </article>
          );
        })}
      </div>

      {neighborhood.top_amenities.length > 0 && (
        <div className="px-6 pb-6">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)] mb-3">Points d&apos;appui visite (les plus proches)</p>
            <ul className="space-y-2">
              {neighborhood.top_amenities.map((amenity, index) => (
                <li key={`${amenity.label}-${index}`} className="text-sm text-[var(--foreground)] flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 min-w-0">
                    <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="truncate">{amenity.label}</span>
                  </span>
                  <span className="text-xs font-semibold text-[var(--muted-foreground)] shrink-0">{amenity.distance_m} m</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}

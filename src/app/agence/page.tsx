"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { BarChart3, Building2, Gauge, Target } from "lucide-react";
import type { PortfolioStatus } from "@/lib/portfolio";

type PortfolioItem = {
  id: string;
  adresse: string;
  prixEstime: number;
  confiance: number;
  status: PortfolioStatus;
  updatedAt: string;
};

const STATUS_OPTIONS: { value: PortfolioStatus; label: string }[] = [
  { value: "estimation", label: "Estimation" },
  { value: "rdv", label: "RDV pris" },
  { value: "mandat_simple", label: "Mandat simple" },
  { value: "mandat_exclusif", label: "Mandat exclusif" },
  { value: "offre", label: "Offre reçue" },
  { value: "vendu", label: "Vendu" },
  { value: "perdu", label: "Perdu" },
];

const AGENCE_ID = "default";

export default function AgencePage() {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    const res = await fetch(`/api/portfolio?agenceId=${AGENCE_ID}`);
    const json = await res.json();
    setItems(json.success ? json.data : []);
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        const res = await fetch(`/api/portfolio?agenceId=${AGENCE_ID}`);
        const json = await res.json();

        if (!cancelled) {
          setItems(json.success ? json.data : []);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setItems([]);
          setLoading(false);
        }
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  const kpis = useMemo(() => {
    const total = items.length;
    const exclusifs = items.filter((item) => item.status === "mandat_exclusif").length;
    const actifs = items.filter((item) => !["vendu", "perdu"].includes(item.status));
    const pipeline = actifs.reduce((sum, item) => sum + item.prixEstime, 0);
    const confianceMoyenne = total > 0 ? items.reduce((sum, item) => sum + item.confiance, 0) / total : 0;

    return {
      total,
      exclusifs,
      conversionExclu: total > 0 ? (exclusifs / total) * 100 : 0,
      pipeline,
      confianceMoyenne,
    };
  }, [items]);

  const updateStatus = async (id: string, status: PortfolioStatus) => {
    await fetch(`/api/portfolio/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agenceId: AGENCE_ID, status }),
    });
    await refresh();
  };

  return (
    <main className="min-h-screen bg-background py-10 px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="rounded-2xl border border-border bg-card p-6 sm:p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-bold">TrueSquare • Directeur d&apos;Agence</p>
          <h1 className="text-3xl sm:text-4xl font-serif mt-2">Pilotage portefeuille & performance commerciale</h1>
          <p className="text-muted-foreground mt-2">Un cockpit simple pour suivre la conversion des estimations en mandats exclusifs.</p>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard icon={<Building2 className="h-4 w-4" />} label="Estimations suivies" value={kpis.total.toString()} />
          <KpiCard icon={<Target className="h-4 w-4" />} label="Mandats exclusifs" value={kpis.exclusifs.toString()} />
          <KpiCard icon={<BarChart3 className="h-4 w-4" />} label="Conversion exclusif" value={`${kpis.conversionExclu.toFixed(1)}%`} />
          <KpiCard icon={<Gauge className="h-4 w-4" />} label="Pipeline actif" value={`${Math.round(kpis.pipeline).toLocaleString("fr-FR")} €`} />
        </section>

        <section className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="font-bold">Portefeuille dossiers</h2>
            <p className="text-sm text-muted-foreground">Mettez à jour le statut de chaque dossier pour suivre la pression commerciale en temps réel.</p>
          </div>

          {loading ? (
            <p className="p-8 text-sm text-muted-foreground">Chargement...</p>
          ) : items.length === 0 ? (
            <p className="p-8 text-sm text-muted-foreground">Aucun dossier pour le moment. Sauvegardez une estimation depuis la page principale.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/30 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left">Adresse</th>
                    <th className="px-4 py-3 text-right">Valeur estimée</th>
                    <th className="px-4 py-3 text-right">Confiance</th>
                    <th className="px-4 py-3 text-left">Statut</th>
                    <th className="px-4 py-3 text-left">MAJ</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-t border-border">
                      <td className="px-4 py-3 font-medium">{item.adresse}</td>
                      <td className="px-4 py-3 text-right">{Math.round(item.prixEstime).toLocaleString("fr-FR")} €</td>
                      <td className="px-4 py-3 text-right">{Math.round(item.confiance * 100)}%</td>
                      <td className="px-4 py-3">
                        <select
                          className="rounded-md border border-border bg-background px-2 py-1"
                          value={item.status}
                          onChange={(e) => updateStatus(item.id, e.target.value as PortfolioStatus)}
                        >
                          {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{new Date(item.updatedAt).toLocaleDateString("fr-FR")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function KpiCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wide font-semibold">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-3 text-2xl font-data font-bold">{value}</p>
    </div>
  );
}

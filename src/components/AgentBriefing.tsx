import { ShieldAlert, Lightbulb, TrendingDown, Target, Zap } from "lucide-react";

interface AgentBriefingProps {
    totalModifiers: number;
    isPassoire: boolean;
    dpeLabel: string | null;
    liquidityLabel: string;
    adjustedPrice: number;
    basePrice: number;
    fraisNotaireEcart: number;
}

export default function AgentBriefing({
    totalModifiers,
    isPassoire,
    dpeLabel,
    liquidityLabel,
    adjustedPrice,
    basePrice,
    fraisNotaireEcart,
}: AgentBriefingProps) {

    // Logic for generating pitch points
    const generatePitch = () => {
        const points = [];

        // 1. Positionnement Prix (Accroche)
        if (totalModifiers > 0) {
            points.push({
                icon: <Target className="h-5 w-5 text-primary" />,
                title: "Postulat de Surcote",
                text: `Valorisez l'état exceptionnel du bien. Le prix ajusté de ${Math.round(adjustedPrice).toLocaleString("fr-FR")} €/m² est mathématiquement justifiable par rapport à la base DVF (${Math.round(basePrice).toLocaleString("fr-FR")} €/m²). Ne cédez pas sur la première offre.`,
                color: "text-primary",
                bg: "bg-primary/10",
                border: "border-primary/20"
            });
        } else if (totalModifiers < 0) {
            points.push({
                icon: <TrendingDown className="h-5 w-5 text-destructive" />,
                title: "Anticipation de Négociation",
                text: `Le bien présente des défauts clairs (état/vue). Annoncez d'emblée la décote de ${Math.abs(totalModifiers * 100).toFixed(0)}% par rapport à la médiane du quartier pour asseoir votre crédibilité et griller les arguments de l'acheteur.`,
                color: "text-destructive",
                bg: "bg-destructive/10",
                border: "border-destructive/20"
            });
        } else {
            points.push({
                icon: <Target className="h-5 w-5 text-foreground" />,
                title: "Positionnement Médian Strict",
                text: `Le bien est dans les standards exacts du quartier. L'argumentaire doit se porter sur le "Prêt à vivre" et le "Zéro défaut" pour justifier l'accroche stricte à la médiane cadastrale.`,
                color: "text-foreground",
                bg: "bg-secondary",
                border: "border-border"
            });
        }

        // 2. Levier DPE
        if (isPassoire) {
            points.push({
                icon: <ShieldAlert className="h-5 w-5 text-orange-500" />,
                title: "Bouclier Anti-DPE",
                text: `Le statut passoire (DPE ${dpeLabel}) sera l'axe d'attaque #1 des acheteurs. Utilisez la "Décote Rénovation" déjà intégrée au rapport pour prouver que le prix net vendeur est DÉJÀ purgé de ce risque.`,
                color: "text-orange-500",
                bg: "bg-orange-500/10",
                border: "border-orange-500/20"
            });
        }

        // 3. Levier Notaire (si pertinent)
        if (fraisNotaireEcart > 0 && totalModifiers >= 0) {
            points.push({
                icon: <Lightbulb className="h-5 w-5 text-success" />,
                title: "Générateur de Pouvoir d'Achat",
                text: `Pour un acheteur hésitant, orientez-le vers l'économie relative s'il achetait dans le neuf, ou proposez d'inclure les frais d'agence dans le prêt (FAI charge acquéreur) pour réduire les frais de notaire.`,
                color: "text-success",
                bg: "bg-success/10",
                border: "border-success/20"
            });
        }

        // 4. Liquidité
        if (liquidityLabel.includes("Tendu")) {
            points.push({
                icon: <Zap className="h-5 w-5 text-blue-500" />,
                title: "Urgence Marché : Tendu",
                text: `Le taux de rotation est extrêmement rapide (<12 mois). Créez le FOMO (Fear Of Missing Out) chez l'acquéreur en rappelant la rareté de l'offre sur ce micro-secteur.`,
                color: "text-blue-500",
                bg: "bg-blue-500/10",
                border: "border-blue-500/20"
            });
        } else if (liquidityLabel.includes("Froid")) {
            points.push({
                icon: <Zap className="h-5 w-5 text-muted-foreground" />,
                title: "Urgence Marché : Lent",
                text: `Rotation lente. Prévenez le vendeur : le premier acheteur au prix est souvent le bon. Évitez l'effet "mandat usé" en affichant directement le Prix Ajusté.`,
                color: "text-foreground",
                bg: "bg-secondary/50",
                border: "border-border"
            });
        }

        return points.slice(0, 3); // Garder les 3 plus percutants
    };

    const pitches = generatePitch();

    return (
        <div className="mt-10 p-8 rounded-3xl bg-card border-2 border-primary/20 shadow-xl shadow-primary/5 print:hidden">
            <div className="flex items-center gap-3 mb-6 border-b border-border/50 pb-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center -ml-1">
                    <Lightbulb className="h-4 w-4 text-primary" />
                </div>
                <div>
                    <h3 className="text-sm font-black text-foreground uppercase tracking-widest">Briefing Négociateur</h3>
                    <p className="text-xs font-medium text-muted-foreground mt-0.5">Confidentiel • Généré dynamiquement par le moteur de valorisation</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {pitches.map((pitch, idx) => (
                    <div key={idx} className={`p-5 rounded-2xl border ${pitch.border} ${pitch.bg} flex flex-col gap-3 relative overflow-hidden group`}>
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-150 transition-transform duration-500 pointer-events-none">
                            {pitch.icon}
                        </div>
                        <div className="flex items-center gap-2">
                            {pitch.icon}
                            <h4 className={`text-sm font-bold ${pitch.color}`}>{pitch.title}</h4>
                        </div>
                        <p className="text-[13px] font-medium text-foreground/80 leading-relaxed z-10">
                            {pitch.text}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}

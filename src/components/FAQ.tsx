import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

const faqs = [
    {
        question: "D'où proviennent vos données de prix (DVF) ?",
        answer: "Nos données s'appuient sur la base DVF (Demandes de Valeurs Foncières) publiée par la DGFiP. Elles recensent chronologiquement les ventes immobilières réelles enregistrées par les notaires. Nous y appliquons des filtres de nettoyage stricts pour écarter les valeurs aberrantes ou les ventes de lots isolés (comme une cave seule sans logement)."
    },
    {
        question: "Comment certifiez-vous les surfaces utilisées ?",
        answer: "Contrairement à la base DVF brute qui ne renseigne que la 'surface réelle bâtie' souvent imprécise, nous croisons ces données avec la base nationale des DPE (ADEME). Cela permet de s'appuyer sur la Surface Habitable DPE, offrant un ratio Prix/m² bien plus fidèle à la réalité du marché."
    },
    {
        question: "Prenez-vous en compte l'état physique du bien ?",
        answer: "L'algorithme calcule une moyenne statistique locale (valeur vénale) et prend en considération le Diagnostic de Performance Énergétique (DPE) du bien. Toutefois, il ne remplace pas votre expertise terrain s'il s'agit d'estimer des rénovations lourdes, une vue exceptionnelle, ou un défaut structurel majeur."
    },
    {
        question: "L'outil gère-t-il les biens atypiques ou ruraux ?",
        answer: "Une estimation statistique nécessite un volume de données suffisant (loi des grands nombres). Pour les biens très atypiques (hôtels particuliers, châteaux) ou dans les communes avec peu de transactions récentes, les résultats peuvent comporter une marge d'erreur plus grande. Nous l'indiquons alors explicitement."
    },
    {
        question: "S'agit-il d'un avis de valeur officiel juridiquement opposable ?",
        answer: "Non. TrueSquare fournit une estimation statistique indicative pour appuyer vos rendez-vous commerciaux. Elle ne constitue en aucun cas une expertise officielle ou un avis de valeur contractuel pouvant être utilisé dans des litiges judiciaires ou déclarations fiscales."
    },
    {
        question: "Pourquoi êtes-vous plus précis que les mastodontes (MeilleursAgents, SeLoger) ?",
        answer: "Ces plateformes utilisent une approche macro-économique généraliste diluée sur toute la France. Notre philosophie est 100% hyper-locale et concentrée sur le Maine-et-Loire (49). Nous croisons les ventes DVF avec des « signaux faibles » que ces mastodontes ignorent : Plan Local d'Urbanisme intercommunal (PLUi) d'Angers, temps de trajet piéton vers le Tramway B/C, ou encore cartes de nuisances sonores (Lden). Cela vous offre une précision chirurgicale et un storytelling imparable en rendez-vous."
    }
];

export default function FAQ() {
    return (
        <div className="w-full max-w-3xl mx-auto space-y-8 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
            <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-12 h-12 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center mb-2">
                    <HelpCircle className="h-6 w-6 text-[var(--primary)]" />
                </div>
                <h2 className="text-3xl font-extrabold text-[var(--foreground)] tracking-tight">
                    Questions Fréquentes
                </h2>
                <p className="text-[var(--muted-foreground)] text-lg max-w-xl font-medium">
                    La transparence sur notre méthodologie DVF × DPE.
                </p>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-2 sm:p-6 shadow-sm">
                <Accordion type="single" collapsible className="w-full">
                    {faqs.map((faq, index) => (
                        <AccordionItem key={index} value={`item-${index}`} className="border-b border-[var(--border)]/50 last:border-0">
                            <AccordionTrigger className="text-left font-semibold text-[var(--foreground)] hover:text-[var(--primary)] transition-colors px-2">
                                {faq.question}
                            </AccordionTrigger>
                            <AccordionContent className="text-[var(--muted-foreground)] leading-relaxed px-2 pb-4">
                                {faq.answer}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </div>
    );
}

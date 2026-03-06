import type { Metadata } from "next";
import { Geist, JetBrains_Mono, EB_Garamond } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const ebGaramond = EB_Garamond({
  variable: "--font-eb-garamond",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "TrueSquare — Estimateur Foncier Haute Fidélité",
  description:
    "Rétablir la vérité du prix au m². Croisement DVF × DPE pour une estimation purifiée des biais cadastraux.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark">
      <body
        className={`${geistSans.variable} ${jetbrainsMono.variable} ${ebGaramond.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

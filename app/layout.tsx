import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getSiteUrl } from "@/lib/site-url";
import { getServerLocale } from "@/lib/i18n/server";
import { LanguageProvider } from "@/lib/i18n/context";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  
  return {
    metadataBase: new URL(getSiteUrl()),
    title: locale === "es" 
      ? "Predicciones del Mundial 2026 por IA — Pronostica con Inteligencia Artificial" 
      : "WC2026 AI Predictor — Predict the World Cup with AI",
    description: locale === "es"
      ? "Predice los resultados de la Copa Mundial de la FIFA 2026 con estadísticas reales e inteligencia artificial. Arma tu llave de eliminatorias y compártela."
      : "Predict FIFA World Cup 2026 match results powered by Groq AI with real team stats. Build your bracket, share predictions, and compete with friends.",
    openGraph: {
      title: locale === "es" ? "Predicciones del Mundial 2026 por IA" : "WC2026 AI Predictor",
      description: locale === "es"
        ? "Predice los resultados del Mundial 2026 con análisis de IA de nivel experto"
        : "Predict the World Cup 2026 with AI-powered insights",
      type: "website",
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getServerLocale();

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-text-primary antialiased">
        <LanguageProvider initialLocale={locale}>
          <Navbar />
          <main className="flex-1 pt-16">{children}</main>
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}


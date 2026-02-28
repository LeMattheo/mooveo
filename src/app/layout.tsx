import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";

export const metadata: Metadata = {
  title: "Sportify Rural — Sorties sportives en milieu rural",
  description: "Créez et rejoignez des sorties vélo, course et marche près de chez vous.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900">
        <Header />
        <div className="mx-auto min-h-[calc(100vh-3.5rem)] max-w-5xl px-4 py-6">
          {children}
        </div>
      </body>
    </html>
  );
}

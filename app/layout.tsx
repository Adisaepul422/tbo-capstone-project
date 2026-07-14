import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "TBO Capstone — Teori Bahasa dan Otomata",
  description: "Aplikasi web capstone: FSA, Regular Expression, PDA/CFG, dan Hierarki Chomsky/CNF.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        <Nav />
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <footer className="mx-auto max-w-6xl px-4 pb-8 pt-4 text-xs text-slate-600">
          Capstone Project Individu — Teori Bahasa dan Otomata, Semester Genap 2025/2026
        </footer>
      </body>
    </html>
  );
}

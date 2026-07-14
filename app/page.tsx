import Link from "next/link";

const modules = [
  {
    href: "/fsa",
    number: "01",
    title: "Finite State Automata",
    desc: "Simulator DFA & NFA dengan trace transisi, plus konversi NFA→DFA (subset construction) dan bonus Moore/Mealy Machine.",
  },
  {
    href: "/regex",
    number: "02",
    title: "Regular Expression",
    desc: "Parser RE → AST, konversi ke NFA via Thompson's Construction, dan pengujian pattern matching.",
  },
  {
    href: "/pda",
    number: "03",
    title: "Pushdown Automata & CFG",
    desc: "Derivasi leftmost/rightmost, validasi string dengan algoritma CYK, visualisasi parse tree, dan simulasi PDA dengan stack trace.",
  },
  {
    href: "/chomsky",
    number: "04",
    title: "Hierarki Chomsky & CNF",
    desc: "Klasifikasi grammar ke Tipe 0–3, dan konversi CFG sembarang ke Chomsky Normal Form langkah demi langkah.",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-12">
      <section className="space-y-4">
        <p className="font-mono text-sm text-sky-400">Capstone Project Individu · Teori Bahasa dan Otomata</p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Empat topik inti otomata, satu aplikasi terintegrasi
        </h1>
        <p className="max-w-2xl text-slate-400">
          Aplikasi ini mengimplementasikan Finite State Automata, Regular Expression,
          Pushdown Automata &amp; Context-Free Grammar, serta Hierarki Chomsky &amp; Chomsky
          Normal Form — lengkap dengan visualisasi, trace langkah demi langkah, dan
          validasi otomatis terhadap definisi formal masing-masing model.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {modules.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className="group rounded-xl border border-slate-800 bg-slate-900/40 p-5 transition-colors hover:border-sky-500/50 hover:bg-slate-900"
          >
            <span className="font-mono text-xs text-slate-600">{m.number}</span>
            <h2 className="mt-1 text-lg font-semibold text-slate-100 group-hover:text-sky-300">
              {m.title}
            </h2>
            <p className="mt-2 text-sm text-slate-400">{m.desc}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}

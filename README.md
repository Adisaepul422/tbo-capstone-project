# TBO Capstone — Teori Bahasa dan Otomata

Aplikasi web capstone individu yang mengintegrasikan empat topik inti mata
kuliah Teori Bahasa dan Otomata: **Finite State Automata**, **Regular
Expression**, **Pushdown Automata & Context-Free Grammar**, dan **Hierarki
Chomsky & Chomsky Normal Form**.

> **Status:** kerangka lengkap — seluruh algoritma inti telah diimplementasikan
> dan diuji (lihat [`npm run test:algorithms`](#menjalankan-test-algoritma)).
> UI menyediakan input berbasis JSON untuk definisi mesin/grammar; sesuaikan
> lebih lanjut (form builder, styling) sesuai kebutuhan sebelum deploy final.

## Daftar Fitur per Modul

### 1. Finite State Automata (`/fsa`)
- Simulator DFA dengan validasi definisi formal (Q, Σ, δ, q0, F) dan trace transisi lengkap.
- Simulator NFA dengan dukungan transisi epsilon dan enumerasi seluruh kemungkinan jalur.
- Konversi NFA → DFA (Subset Construction) dengan langkah-langkah konversi yang dapat ditelusuri.
- Bonus: simulator Moore Machine dan Mealy Machine.
- Visualisasi graf state menggunakan Cytoscape.js.

### 2. Regular Expression (`/regex`)
- Parser RE (recursive descent) mendukung union (`|`), concatenation, Kleene star (`*`), plus (`+`), optional (`?`), grouping (`()`), dan character class (`[a-z]`).
- Konversi RE → NFA menggunakan Thompson's Construction.
- Pattern matching (full match) via simulasi NFA.
- Bonus: tampilan grammar reguler (Tipe 3) yang setara dengan RE.

### 3. Pushdown Automata & CFG (`/pda`)
- Leftmost & rightmost derivation dengan pencarian otomatis produksi yang sesuai.
- Algoritma CYK (Cocke–Younger–Kasami) untuk validasi keanggotaan string (grammar dikonversi ke CNF secara otomatis di balik layar).
- Visualisasi parse tree dari tabel CYK (custom SVG renderer).
- Konversi CFG → PDA (top-down construction) dan simulasi dengan stack trace lengkap.

### 4. Hierarki Chomsky & CNF (`/chomsky`)
- Visualisasi Tipe 0–3 beserta contoh grammar dan mesin ekuivalennya.
- Klasifikasi otomatis grammar input ke tipe Chomsky yang sesuai.
- Konversi CFG sembarang → Chomsky Normal Form, mencakup: isolasi start symbol, eliminasi nullable production, eliminasi unit production, eliminasi useless symbols, terminal handling, dan binarization — seluruhnya ditampilkan step-by-step.

## Tech Stack

- **Framework:** Next.js 14 (App Router) + TypeScript (strict mode)
- **Styling:** Tailwind CSS
- **Visualisasi graf:** Cytoscape.js
- **Visualisasi parse tree:** custom SVG renderer (React)

## Struktur Folder

```
tbo-capstone/
├── app/                 # Halaman Next.js (App Router)
│   ├── page.tsx          # Beranda
│   ├── fsa/               # Modul 1
│   ├── regex/             # Modul 2
│   ├── pda/                # Modul 3
│   └── chomsky/            # Modul 4
├── components/           # Komponen React (Nav, AutomataGraph, ParseTree)
├── lib/                  # Seluruh algoritma inti (murni TypeScript, tidak bergantung React)
│   ├── dfa.ts / nfa.ts / subsetConstruction.ts / mooreMealy.ts
│   ├── regex/  (parser.ts, thompson.ts, match.ts)
│   ├── cfg/    (derivation.ts, cyk.ts, pda.ts)
│   └── cnf/    (convert.ts, hierarchy.ts)
├── types/                 # Definisi TypeScript (automata.ts, regex.ts, cfg.ts, cnf.ts)
├── scripts/runAllTests.ts # Runner untuk seluruh test case algoritma
└── docs/                  # Proposal & draft laporan
```

## Cara Instalasi Lokal

```bash
npm install
npm run dev
# buka http://localhost:3000
```

## Menjalankan Test Algoritma

Seluruh algoritma inti memiliki minimal 5 test case dan dapat dijalankan
tanpa browser:

```bash
npm run test:algorithms
```

## Build Produksi

```bash
npm run build
npm run start
```

## Deploy ke Domain `.my.id`

1. Deploy proyek ke penyedia hosting pilihan (Vercel/Netlify/Railway/VPS).
2. Daftarkan domain gratis di [is.my.id](https://is.my.id) atau registrar `.my.id` lain.
3. Arahkan domain ke hosting (CNAME/A record sesuai instruksi penyedia).
4. Pastikan HTTPS aktif dan `http://` di-redirect ke `https://`.

## Link Live

- Domain: `https://[nim-atau-nama].my.id` _(isi setelah deploy)_
- Video Demo YouTube: _(isi link di sini)_

## Penggunaan AI Generatif

Bagian kerangka aplikasi ini (struktur proyek, implementasi algoritma inti,
dan komponen UI dasar) dikembangkan dengan bantuan AI generatif (Claude).
Mahasiswa wajib mereview, memahami, menguji ulang, dan memodifikasi kode ini
sesuai pemahaman sendiri sebelum pengumpulan, serta mencantumkan penjelasan
penggunaan AI secara rinci di lampiran laporan sesuai ketentuan mata kuliah.

## Lisensi

Proyek akademik — untuk keperluan Capstone Project mata kuliah Teori Bahasa dan Otomata.

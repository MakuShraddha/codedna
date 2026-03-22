# 🧬 CodeDNA — Code Fingerprint Analyzer

> Every piece of code has a unique identity. CodeDNA makes it visible.

---

## What It Does

CodeDNA converts any code snippet into a **visual DNA fingerprint** using Abstract Syntax Tree-style analysis. Paste two snippets and get a **cosine similarity score** with animated DNA strand visualization.

**Interview pitch:**
> "I built CodeDNA — a tool that converts code into unique visual fingerprints using AST feature extraction and vector embeddings. It detects structural similarity with cosine similarity scoring and renders it as an animated DNA visualization. Scalable to university-level plagiarism detection."

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14 + React + Tailwind CSS |
| Visualization | Canvas API (custom animated DNA renderer) |
| Backend | Next.js API Routes |
| Database | Supabase (PostgreSQL + Row Level Security) |
| Auth | Supabase Auth |
| Analysis | Custom AST-style feature extraction + cosine similarity |

---

## 🚀 Setup in 5 Steps

### Step 1 — Clone & Install

```bash
git clone <your-repo>
cd codedna
npm install
```

### Step 2 — Create Supabase Project

1. Go to [supabase.com](https://supabase.com) → **New project**
2. Choose a name (e.g. `codedna`) and a strong database password
3. Wait ~2 minutes for it to spin up

### Step 3 — Run the Database Schema

1. In your Supabase dashboard → **SQL Editor** → **New Query**
2. Paste the contents of `supabase-schema.sql`
3. Click **Run**

This creates:
- `scans` table — for authenticated users
- `anon_scans` table — for anonymous users (session-based)
- Row Level Security policies

### Step 4 — Set Environment Variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

Find these in: **Supabase Dashboard → Settings → API**

### Step 5 — Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

---

## ⚡ Enable Email Auth in Supabase

1. Supabase Dashboard → **Authentication → Providers**
2. Make sure **Email** is enabled
3. For local dev, disable "Confirm email" under **Authentication → Settings** (so you can test without email)

---

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── analyze/route.ts     # Single code analysis
│   │   ├── compare/route.ts     # Two-snippet comparison
│   │   └── scans/route.ts       # History CRUD
│   ├── page.tsx                 # Main UI
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── DNACanvas.tsx            # Animated DNA strand renderer
│   ├── SimilarityRing.tsx       # Animated score circle
│   ├── FeatureBars.tsx          # Feature vector chart
│   ├── ScanHistory.tsx          # History sidebar
│   └── AuthModal.tsx            # Sign in / Sign up
└── lib/
    ├── dna.ts                   # Core analysis engine
    └── supabase/
        ├── client.ts            # Browser Supabase client
        └── server.ts            # Server Supabase client
```

---

## 🧬 How the DNA Algorithm Works

```
Code Input
    ↓
Feature Extraction (10 dimensions):
  1. Function Density     — functions per line
  2. Loop Complexity      — loop count normalized
  3. Nesting Depth        — max indentation level
  4. Comment Ratio        — comment lines / total
  5. Operator Frequency   — operators per character
  6. Naming Style         — camelCase vs snake_case ratio
  7. String Usage         — string literals per line
  8. Cyclomatic Complexity — keyword density
  9. Line Length Profile   — average line length
  10. Numeric Density      — numbers per character
    ↓
Numerical Vector [0.8, 0.3, 0.6, ...]
    ↓
Map vector → DNA visual (Canvas API)
    ↓
Compare two vectors → Cosine Similarity score
    ↓
Animate + display result
```

---

## 🌐 Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Add your environment variables in the Vercel dashboard under **Settings → Environment Variables**.

---

## 🔮 V2 Roadmap

- [ ] GitHub URL input (fetch raw files automatically)
- [ ] Download DNA image as PNG
- [ ] Bulk file upload
- [ ] Real Python AST backend (FastAPI)
- [ ] ML model trained on known code patterns
- [ ] VS Code extension

---

## 📸 Demo Script (for interviews)

1. Load **Python Sort** into Strand A, **Python Sort** (same) into Strand B → hit Compare → **~95% match**
2. Load **Python Sort** into A, **JS Async** into B → hit Compare → **~30-45% match** (different language, style)
3. Load same code but with extra comments → **~75-85% match** (structurally same)

The visual delta between DNA strands tells the whole story. 🎯

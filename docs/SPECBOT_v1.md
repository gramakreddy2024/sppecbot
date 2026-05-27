# SpecBot — Project Documentation v1

> **Built for RF & Telecom Test Engineers**
> A Next.js web app that turns 3GPP spec PDFs into an interactive AI assistant for test case generation.

---

## 📌 What Is SpecBot?

SpecBot lets you upload any 3GPP specification PDF and then:

1. **Ask questions** about the spec in plain English
2. **Generate structured test cases** from a scenario description
3. **Batch-generate + export** multiple test cases as CSV / JSON / TXT

It is powered by **Claude Sonnet (`claude-sonnet-4-6`)** from Anthropic on the backend, with a lightweight keyword-based RAG (Retrieval-Augmented Generation) engine for fast, accurate spec lookups — no vector database required.

---

## 🏗️ Architecture Overview

```
Browser (React)
    │
    ├── Sidebar        → PDF upload + spec status
    ├── ChatTab        → Ask the spec (Q&A)
    ├── GenerateTab    → Generate one test case
    └── BatchTab       → Batch generate + export
         │
         ▼
Next.js API Routes (Node.js runtime)
    │
    ├── POST /api/upload    → Parse PDF → return text chunks
    ├── POST /api/chat      → RAG search → Claude → answer
    └── POST /api/generate  → RAG search → Claude → test case
         │
         ▼
    Anthropic Claude API  (claude-sonnet-4-6)
```

---

## 🔄 Data Flow — Step by Step

### Step 1 — Upload a PDF

```
User drops or selects a PDF
    → Sidebar sends multipart/form-data to POST /api/upload
    → pdf2json parses the PDF in Node.js (no DOM / worker required)
    → chunkText() splits extracted text into ~1000-char overlapping chunks
    → Response: { chunks[], totalPages, totalChunks, fileName }
    → Chunks stored in React state (app/page.tsx)
```

### Step 2 — Ask a Question (Chat Tab)

```
User types a question
    → ChatTab POSTs { query, chunks[], history[] } to /api/chat
    → findRelevantChunks() runs BM25-style keyword search over all chunks
      (scores by term frequency + substring match + coverage)
    → Top 5 relevant chunks passed as context to Claude
    → Claude answers grounded in those chunks, with spec references
    → Answer rendered as Markdown in the chat UI
    → Last 3 exchanges (6 messages) kept as conversation history
```

### Step 3 — Generate a Test Case (Generate Tab)

```
User types a test scenario
    e.g. "Verify max output power for 5G NR FR1 PC3 UE in band n77"
    → GenerateTab POSTs { scenario, chunks[], specName, tcNumber }
    → RAG search retrieves top 6 relevant chunks
    → Claude generates a fully structured test case:

       TEST CASE ID     : TC_38101_001
       TITLE            : ...
       SPEC REFERENCE   : ...
       OBJECTIVE        : ...
       CATEGORY         : ...
       PRE-CONDITIONS   : ...
       TEST STEPS       : ...
       MEASUREMENT      : ...
       PASS CRITERIA    : ...
       FAIL CRITERIA    : ...
       NOTES            : ...

    → Output displayed as monospace text
    → Downloadable as .txt
```

### Step 4 — Batch Generate + Export (Batch Tab)

```
User pastes N scenarios (one per line)
    → Calls /api/generate sequentially for each scenario
    → Real-time progress bar shown
    → All generated test cases accumulated in shared React state
    → Export options:
       📊 CSV   — each test case parsed field-by-field into columns
       📋 JSON  — array of objects with all fields
       📄 TXT   — all test cases joined with ══════ separators
```

---

## 🧠 RAG Engine (`lib/rag.ts`)

No vector database. Pure keyword matching — fast and accurate for 3GPP specs.

### `chunkText(text, chunkSize=1000, overlap=200)`

| Step | Action |
|------|--------|
| 1 | Clean PDF extraction artifacts (`\r\n`, excess whitespace) |
| 2 | Walk the text in ~1000-char windows |
| 3 | Snap each chunk boundary to the nearest sentence `.` |
| 4 | Overlap consecutive chunks by 200 chars to preserve context at boundaries |
| 5 | Drop chunks shorter than 50 chars (headers, page numbers, etc.) |

### `findRelevantChunks(query, chunks, topK=5)`

| Score component | How it works |
|-----------------|-------------|
| **Term frequency** | `log(1 + count) × 2` for each query token found in the chunk |
| **Substring match** | `+0.4` per occurrence when a chunk token contains a query token (e.g. `"fr1"` matches `"fr1-ue"`) |
| **Coverage bonus** | Score multiplied by `1 + (covered_terms / total_query_terms) × 0.5` |

Works extremely well for 3GPP specs because technical tokens (`n77`, `EVM`, `ACLR`, `FR1`, `PC3`, `38.101`) are unique and match precisely.

---

## 📁 File Map

```
sppecbot/
│
├── app/
│   ├── page.tsx                ← Root component — holds all state, renders layout
│   ├── layout.tsx              ← HTML shell, global Tailwind CSS
│   └── api/
│       ├── upload/route.ts     ← PDF → text chunks (pdf2json)
│       ├── chat/route.ts       ← Q&A via RAG + Claude
│       └── generate/route.ts   ← Test case generation via RAG + Claude
│
├── components/
│   ├── Sidebar.tsx             ← Drag-and-drop upload UI, spec status card
│   ├── ChatTab.tsx             ← Chat interface, quick-question buttons
│   ├── GenerateTab.tsx         ← Scenario input, test case output, download
│   └── BatchTab.tsx            ← Batch runner, progress bar, export buttons
│
├── lib/
│   ├── rag.ts                  ← chunkText() + findRelevantChunks()
│   └── prompts.ts              ← SYSTEM_PROMPT, buildQueryPrompt(), buildTestCasePrompt()
│
├── docs/
│   └── SPECBOT_v1.md           ← This file
│
├── next.config.mjs             ← serverExternalPackages for pdf2json, pdfjs-dist
├── tailwind.config.ts          ← Tailwind CSS config
├── tsconfig.json               ← TypeScript config
├── package.json                ← Dependencies
└── .env.local                  ← ANTHROPIC_API_KEY (not committed)
```

---

## 🔑 Environment Variables

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key — get one at [console.anthropic.com](https://console.anthropic.com) |

Set in `.env.local` (never commit this file):

```
ANTHROPIC_API_KEY=sk-ant-api03-...
```

---

## 📦 Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | ^16.2.6 | React framework + API routes |
| `react` | ^18.3.1 | UI |
| `@anthropic-ai/sdk` | ^0.39.0 | Claude API client |
| `pdf2json` | ^4.0.3 | Node.js-native PDF text extraction |
| `react-markdown` | ^9.0.1 | Render Claude's Markdown responses |
| `tailwindcss` | ^3.4.17 | Utility CSS styling |

> **Why `pdf2json` instead of `pdf-parse`?**
> `pdf-parse` bundles pdf.js v2.0.550 (2019) which cannot parse modern 3GPP PDFs and throws `RangeError: Invalid array length`. `pdf2json` is Node.js-native with no worker or DOM dependencies and handles current PDF structures correctly.

---

## ✅ Feature Status (v1)

| Feature | Status |
|---------|--------|
| PDF upload — drag & drop or click | ✅ |
| Modern 3GPP PDF parsing (pdf2json) | ✅ |
| Text chunking with overlap | ✅ |
| BM25-style RAG keyword search | ✅ |
| Chat / Q&A with conversation history | ✅ |
| Quick-question templates | ✅ |
| Single test case generation | ✅ |
| Auto-incrementing TC IDs (`TC_SPEC_001`) | ✅ |
| Test case download as `.txt` | ✅ |
| Batch generation (N scenarios at once) | ✅ |
| Batch progress bar | ✅ |
| Export — CSV | ✅ |
| Export — JSON | ✅ |
| Export — TXT (all cases) | ✅ |
| Claude API integration (Sonnet 4.6) | ✅ |
| Dark UI (Tailwind, gray-950 base) | ✅ |

---

## 🚀 Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Set your API key
echo "ANTHROPIC_API_KEY=sk-ant-api03-..." > .env.local

# 3. Start the dev server
npm run dev

# 4. Open in browser
open http://localhost:3000
```

---

## 🔮 Potential v2 Improvements

- **Streaming responses** — stream Claude output token-by-token instead of waiting for the full response
- **Semantic RAG** — replace keyword search with embedding-based similarity for better retrieval on paraphrased queries
- **Spec version tracking** — detect and display the 3GPP spec number and release version from the PDF
- **Anthropic Files API** — upload PDFs directly to Anthropic (when SDK support is available) to let Claude read the full document natively
- **Multi-spec support** — load and query across multiple specs simultaneously
- **Test case editor** — inline editing of generated test cases before export
- **DOCX export** — export test cases in Word format for lab documentation workflows

---

*SpecBot v1 — Built with Next.js 16 + Anthropic Claude Sonnet 4.6*
